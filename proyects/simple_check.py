# simple_check.py
from db import SessionLocal
from sqlalchemy import text

def check_database():
    db = SessionLocal()
    
    try:
        print("Verificando estructura de la base de datos...")
        
        # Verificar tablas
        result = db.execute(text("SHOW TABLES"))
        tables = [row[0] for row in result]
        print("Tablas existentes:", tables)
        
        # Verificar usuarios
        try:
            result = db.execute(text("SELECT COUNT(*) FROM usuarios"))
            count = result.fetchone()[0]
            print(f"Usuarios registrados: {count}")
        except Exception as e:
            print(f"Error con tabla usuarios: {e}")
        
        # Verificar planes
        try:
            result = db.execute(text("SELECT COUNT(*) FROM planes"))
            count = result.fetchone()[0]
            print(f"Planes disponibles: {count}")
        except Exception as e:
            print(f"Error con tabla planes: {e}")
            
    except Exception as e:
        print(f"Error de conexion: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_database()

