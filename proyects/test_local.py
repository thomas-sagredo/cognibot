# test_local.py
import requests

def test_localhost():
    """Prueba conexión con localhost"""
    try:
        print("Probando conexion con localhost:8000...")
        response = requests.get("http://localhost:8000/", timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        return True
    except Exception as e:
        print(f"Error localhost: {e}")
        return False

def test_ip():
    """Prueba conexión con IP específica"""
    try:
        print("Probando conexion con 154.2.8.21:8000...")
        response = requests.get("http://154.2.8.21:8000/", timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        return True
    except Exception as e:
        print(f"Error IP: {e}")
        return False

def test_register_local():
    """Prueba registro en localhost"""
    try:
        print("Probando registro en localhost...")
        url = "http://localhost:8000/register"
        params = {
            "email": "test@test.com",
            "password": "123456",
            "nombre": "Test User"
        }
        response = requests.post(url, params=params, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("REGISTRO EXITOSO en localhost!")
            
            # Ahora probar login
            print("Probando login en localhost...")
            login_url = "http://localhost:8000/login"
            login_params = {
                "email": "test@test.com", 
                "password": "123456"
            }
            login_response = requests.post(login_url, params=login_params, timeout=10)
            print(f"Login Status: {login_response.status_code}")
            print(f"Login Response: {login_response.text}")
            
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("=== PRUEBA DE CONEXION ===")
    
    test_localhost()
    print()
    test_ip()
    print()
    test_register_local()

