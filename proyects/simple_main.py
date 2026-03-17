# simple_main.py - Versión simplificada para probar
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import json

# Importaciones básicas
from db import Base, engine, SessionLocal
from models import Usuario, Plan, Chatbot, UserVariables
from auth import hash_password, verify_password, create_access_token, verify_token

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CogniBot API - Simple")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://154.2.8.21:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear tablas si no existen
Base.metadata.create_all(bind=engine)

# Dependencia para obtener sesión DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependencia para obtener usuario actual
def get_usuario_actual(db: Session = Depends(get_db), token: dict = Depends(verify_token)):
    usuario = db.query(Usuario).filter(Usuario.email == token["sub"]).first()
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return usuario

@app.post("/register")
def register(email: str, password: str, nombre: str, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email == email).first()
    if user:
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    
    nuevo_usuario = Usuario(
        email=email,
        password_hash=hash_password(password),
        nombre=nombre,
        plan_id=1  # Plan free por defecto
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return {"msg": "Usuario registrado con éxito"}

@app.post("/login")
def login(email: str, password: str, db: Session = Depends(get_db)):
    try:
        print(f"Login attempt for: {email}")
        
        user = db.query(Usuario).filter(Usuario.email == email).first()
        
        if not user:
            print("User not found")
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
        if not verify_password(password, user.password_hash):
            print("Invalid password")
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
        # Verificar que el usuario tenga un plan asociado
        if not user.plan_id:
            user.plan_id = 1  # Asignar plan free por defecto
            db.commit()
        
        # Cargar la relación del plan
        db.refresh(user)
        
        print(f"Login successful for: {email}")
        
        token = create_access_token({"sub": user.email})
        return {
            "access_token": token, 
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "nombre": user.nombre,
                "plan": user.plan.nombre
            }
        }
        
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/")
def read_root():
    return {"message": "CogniBot API Simple is running"}

if __name__ == "__main__":
    import uvicorn
    print("Starting simple server on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

