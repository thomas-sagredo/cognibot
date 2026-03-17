# init_db.py
from db import SessionLocal, Base, engine
from models import Plan

def crear_planes_iniciales():
    db = SessionLocal()
    
    try:
        # Crear tablas si no existen
        Base.metadata.create_all(bind=engine)
        
        planes = [
            Plan(
                id=1,
                nombre="free",
                max_chatbots=3,
                max_nodos_por_chatbot=15,
                precio_mensual=0,
                caracteristicas={
                    "exportar_pdf": False, 
                    "api_access": False, 
                    "custom_domain": False,
                    "soporte_prioritario": False
                }
            ),
            Plan(
                id=2,
                nombre="premium",
                max_chatbots=10,
                max_nodos_por_chatbot=50,
                precio_mensual=9900,  # $99.00
                caracteristicas={
                    "exportar_pdf": True, 
                    "api_access": True, 
                    "custom_domain": False,
                    "soporte_prioritario": True
                }
            ),
            Plan(
                id=3,
                nombre="enterprise",
                max_chatbots=100,
                max_nodos_por_chatbot=200,
                precio_mensual=29900,  # $299.00
                caracteristicas={
                    "exportar_pdf": True, 
                    "api_access": True, 
                    "custom_domain": True,
                    "soporte_prioritario": True
                }
            )
        ]
        
        for plan in planes:
            # Verificar si el plan ya existe
            plan_existente = db.query(Plan).filter(Plan.id == plan.id).first()
            if not plan_existente:
                db.add(plan)
                print(f"Plan {plan.nombre} creado")
            else:
                print(f"Plan {plan.nombre} ya existe")
        
        db.commit()
        print("✅ Base de datos inicializada correctamente")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    crear_planes_iniciales()