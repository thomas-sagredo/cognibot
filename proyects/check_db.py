# check_db.py
from db import SessionLocal
from sqlalchemy import text

def check_database():
    db = SessionLocal()
    
    try:
        print("🔍 Verificando estructura de la base de datos...")
        
        # Verificar tablas
        result = db.execute(text("SHOW TABLES"))
        tables = [row[0] for row in result]
        print("📋 Tablas existentes:", tables)
        
        # Verificar estructura de usuarios
        result = db.execute(text("DESCRIBE usuarios"))
        print("👤 Columnas de usuarios:")
        for row in result:
            print(f"  - {row[0]} ({row[1]})")
        
        # Verificar planes
        result = db.execute(text("SELECT * FROM planes"))
        planes = result.fetchall()
        print("💳 Planes existentes:")
        for plan in planes:
            print(f"  - {plan}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_database()