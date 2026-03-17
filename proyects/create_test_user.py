# create_test_user.py
from db import SessionLocal
from models import Usuario
from auth import hash_password

def create_test_user():
    db = SessionLocal()
    try:
        # Verificar si el usuario ya existe
        existing = db.query(Usuario).filter(Usuario.email == "admin@test.com").first()
        if existing:
            print("Usuario admin@test.com ya existe")
            return
            
        # Crear usuario de prueba
        test_user = Usuario(
            email="admin@test.com",
            password_hash=hash_password("123456"),
            nombre="Admin Test",
            plan_id=1  # Plan free
        )
        
        db.add(test_user)
        db.commit()
        
        print("Usuario creado exitosamente:")
        print("Email: admin@test.com")
        print("Password: 123456")
        print("Nombre: Admin Test")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()

