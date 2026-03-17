# test_login.py
import requests
import json
from db import SessionLocal
from sqlalchemy import text

def list_users():
    """Lista los usuarios existentes"""
    db = SessionLocal()
    try:
        result = db.execute(text("SELECT id, email, nombre, plan_id FROM usuarios LIMIT 5"))
        print("Usuarios registrados:")
        for row in result:
            print(f"  ID: {row[0]}, Email: {row[1]}, Nombre: {row[2]}, Plan: {row[3]}")
    finally:
        db.close()

def test_login_endpoint():
    """Prueba el endpoint de login"""
    # Usar el primer usuario para probar
    db = SessionLocal()
    try:
        result = db.execute(text("SELECT email FROM usuarios LIMIT 1"))
        email = result.fetchone()[0]
        
        print(f"Probando login con usuario: {email}")
        
        # Probar con contraseña común
        test_passwords = ["123456", "password", "123", "admin", "test"]
        
        for password in test_passwords:
            print(f"Probando password: {password}")
            
            url = "http://154.2.8.21:8000/login"
            params = {"email": email, "password": password}
            
            try:
                response = requests.post(url, params=params, timeout=5)
                print(f"  Status: {response.status_code}")
                print(f"  Response: {response.text}")
                
                if response.status_code == 200:
                    print("LOGIN EXITOSO!")
                    return
                    
            except Exception as e:
                print(f"  Error: {e}")
        
        print("No se pudo hacer login con ninguna contraseña de prueba")
        
    finally:
        db.close()

def test_register():
    """Prueba crear un nuevo usuario"""
    print("Probando registro de nuevo usuario...")
    
    url = "http://154.2.8.21:8000/register"
    params = {
        "email": "test@test.com",
        "password": "123456",
        "nombre": "Usuario Test"
    }
    
    try:
        response = requests.post(url, params=params, timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("REGISTRO EXITOSO! Ahora prueba login con:")
            print("Email: test@test.com")
            print("Password: 123456")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("=== DIAGNOSTICO DE LOGIN ===")
    print()
    
    list_users()
    print()
    
    test_login_endpoint()
    print()
    
    test_register()

