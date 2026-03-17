# simple_migrate.py
from db import Base, engine, SessionLocal
from models import Plan, Usuario, Chatbot, UserVariables, WhatsAppIntegration, Conversation, Message, Analytics

def migrate_database():
    try:
        print("Iniciando migracion de base de datos...")
        
        # Crear todas las tablas
        Base.metadata.create_all(bind=engine)
        
        print("Tablas creadas exitosamente:")
        print("   - whatsapp_integrations")
        print("   - conversations") 
        print("   - messages")
        print("   - analytics")
        
        # Verificar si existen planes básicos
        db = SessionLocal()
        try:
            plans_count = db.query(Plan).count()
            if plans_count == 0:
                print("Creando planes basicos...")
                
                # Plan Free
                plan_free = Plan(
                    nombre="free",
                    max_chatbots=1,
                    max_nodos_por_chatbot=15,
                    precio_mensual=0,
                    caracteristicas={
                        "whatsapp": True,
                        "analytics_basico": True,
                        "soporte": "email"
                    }
                )
                
                # Plan Premium  
                plan_premium = Plan(
                    nombre="premium",
                    max_chatbots=5,
                    max_nodos_por_chatbot=50,
                    precio_mensual=299,
                    caracteristicas={
                        "whatsapp": True,
                        "messenger": True,
                        "analytics_avanzado": True,
                        "soporte": "prioritario"
                    }
                )
                
                # Plan Enterprise
                plan_enterprise = Plan(
                    nombre="enterprise",
                    max_chatbots=20,
                    max_nodos_por_chatbot=200,
                    precio_mensual=899,
                    caracteristicas={
                        "whatsapp": True,
                        "messenger": True,
                        "instagram": True,
                        "analytics_avanzado": True,
                        "integraciones_crm": True,
                        "soporte": "24_7"
                    }
                )
                
                db.add_all([plan_free, plan_premium, plan_enterprise])
                db.commit()
                print("Planes creados exitosamente")
            else:
                print(f"Ya existen {plans_count} planes")
            
        finally:
            db.close()
            
        print("Migracion completada exitosamente!")
        print()
        print("Proximos pasos:")
        print("1. Reiniciar tu servidor FastAPI")
        print("2. Configurar WhatsApp Business API en el frontend")
        print("3. Probar la integracion con un chatbot")
        
    except Exception as e:
        print(f"Error durante la migracion: {e}")
        raise

if __name__ == "__main__":
    migrate_database()

