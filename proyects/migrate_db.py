# migrate_db.py
from db import Base, engine, SessionLocal
from models import Usuario, Plan, Chatbot
from sqlalchemy import text
import sys

def check_table_exists(db, table_name):
    """Verificar si una tabla existe en la base de datos"""
    try:
        result = db.execute(text(f"SHOW TABLES LIKE '{table_name}'"))
        return result.fetchone() is not None
    except:
        return False

def check_column_exists(db, table_name, column_name):
    """Verificar si una columna existe en una tabla"""
    try:
        result = db.execute(text(f"""
            SELECT COUNT(*) FROM information_schema.columns 
            WHERE table_name = '{table_name}' AND column_name = '{column_name}'
        """))
        return result.fetchone()[0] > 0
    except:
        return False

def migrate_database():
    db = SessionLocal()
    
    try:
        print("🔍 Verificando estructura de la base de datos...")
        
        # Verificar si la tabla 'planes' existe
        if not check_table_exists(db, 'planes'):
            print("📋 Creando tabla 'planes'...")
            Plan.__table__.create(engine)
            print("✅ Tabla 'planes' creada")
        else:
            print("✅ Tabla 'planes' ya existe")
        
        # Verificar si la tabla 'chatbots' existe
        if not check_table_exists(db, 'chatbots'):
            print("📋 Creando tabla 'chatbots'...")
            Chatbot.__table__.create(engine)
            print("✅ Tabla 'chatbots' creada")
        else:
            print("✅ Tabla 'chatbots' ya existe")
        
        # Verificar y agregar columnas faltantes a la tabla 'usuarios'
        columns_to_check = [
            ('plan_id', 'INTEGER'),
            ('activo', 'BOOLEAN'),
            ('creado_en', 'DATETIME')
        ]
        
        for column_name, column_type in columns_to_check:
            if not check_column_exists(db, 'usuarios', column_name):
                print(f"📋 Agregando columna '{column_name}' a tabla 'usuarios'...")
                
                if column_name == 'plan_id':
                    # Primero agregar la columna
                    db.execute(text(f"ALTER TABLE usuarios ADD COLUMN {column_name} {column_type} DEFAULT 1"))
                    # Luego agregar la foreign key
                    db.execute(text("ALTER TABLE usuarios ADD FOREIGN KEY (plan_id) REFERENCES planes(id)"))
                else:
                    if column_type == 'BOOLEAN':
                        db.execute(text(f"ALTER TABLE usuarios ADD COLUMN {column_name} {column_type} DEFAULT TRUE"))
                    else:
                        db.execute(text(f"ALTER TABLE usuarios ADD COLUMN {column_name} {column_type}"))
                
                print(f"✅ Columna '{column_name}' agregada")
            else:
                print(f"✅ Columna '{column_name}' ya existe")
        
        # Insertar planes por defecto si no existen
        planes = [
            {
                'id': 1,
                'nombre': 'free',
                'max_chatbots': 3,
                'max_nodos_por_chatbot': 15,
                'precio_mensual': 0,
                'caracteristicas': {
                    "exportar_pdf": False, 
                    "api_access": False, 
                    "custom_domain": False,
                    "soporte_prioritario": False
                }
            },
            {
                'id': 2,
                'nombre': 'premium',
                'max_chatbots': 10,
                'max_nodos_por_chatbot': 50,
                'precio_mensual': 9900,
                'caracteristicas': {
                    "exportar_pdf": True, 
                    "api_access": True, 
                    "custom_domain": False,
                    "soporte_prioritario": True
                }
            },
            {
                'id': 3,
                'nombre': 'enterprise',
                'max_chatbots': 100,
                'max_nodos_por_chatbot': 200,
                'precio_mensual': 29900,
                'caracteristicas': {
                    "exportar_pdf": True, 
                    "api_access": True, 
                    "custom_domain": True,
                    "soporte_prioritario": True
                }
            }
        ]
        
        for plan_data in planes:
            existing_plan = db.query(Plan).filter(Plan.id == plan_data['id']).first()
            if not existing_plan:
                plan = Plan(**plan_data)
                db.add(plan)
                print(f"✅ Plan '{plan_data['nombre']}' insertado")
            else:
                print(f"✅ Plan '{plan_data['nombre']}' ya existe")
        
        # Actualizar usuarios existentes para que tengan plan_id = 1 (free)
        db.execute(text("UPDATE usuarios SET plan_id = 1 WHERE plan_id IS NULL"))
        
        db.commit()
        print("🎉 Migración completada exitosamente!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error durante la migración: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        db.close()

if __name__ == "__main__":
    migrate_database()