# main_backup.py - Versión funcional del servidor
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import json

# Importaciones existentes
from db import Base, engine, SessionLocal
from models import Usuario, Plan, Chatbot, UserVariables
from auth import hash_password, verify_password, create_access_token, verify_token

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CogniBot API")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://154.2.8.21:8080"],  # URL de tu frontend Vite
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

# Endpoints existentes (mantenerlos)
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

# En main.py - modifica el endpoint /login
@app.post("/login")
def login(email: str, password: str, db: Session = Depends(get_db)):
    try:
        print(f"🔐 Intentando login para: {email}")
        
        user = db.query(Usuario).filter(Usuario.email == email).first()
        
        if not user:
            print("❌ Usuario no encontrado")
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
        if not verify_password(password, user.password_hash):
            print("❌ Contraseña incorrecta")
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
        # Verificar que el usuario tenga un plan asociado
        if not user.plan_id:
            user.plan_id = 1  # Asignar plan free por defecto
            db.commit()
            print("⚠️ Usuario sin plan, asignado plan free por defecto")
        
        # Cargar la relación del plan
        db.refresh(user)
        
        print(f"✅ Login exitoso para: {email}, plan: {user.plan.nombre}")
        
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
        print(f"💥 Error en login: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# NUEVOS ENDPOINTS PARA MULTI-USUARIO

@app.get("/api/user/profile")
def obtener_perfil(usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    cantidad_chatbots = db.query(Chatbot).filter(
        Chatbot.usuario_id == usuario.id, 
        Chatbot.activo == True
    ).count()
    
    return {
        "usuario": {
            "id": usuario.id,
            "email": usuario.email,
            "nombre": usuario.nombre,
            "plan": usuario.plan.nombre
        },
        "limites": {
            "max_chatbots": usuario.plan.max_chatbots,
            "max_nodos": usuario.plan.max_nodos_por_chatbot,
            "chatbots_creados": cantidad_chatbots
        },
        "caracteristicas": usuario.plan.caracteristicas
    }

@app.get("/api/chatbots")
def obtener_chatbots(usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    chatbots = db.query(Chatbot).filter(
        Chatbot.usuario_id == usuario.id, 
        Chatbot.activo == True
    ).all()
    
    return [{
        "id": cb.id,
        "nombre": cb.nombre,
        "descripcion": cb.descripcion,
        "creado_en": cb.creado_en,
        "actualizado_en": cb.actualizado_en
    } for cb in chatbots]

@app.get("/api/chatbots/{chatbot_id}")
def obtener_chatbot(chatbot_id: int, usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id, 
        Chatbot.usuario_id == usuario.id
    ).first()
    
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot no encontrado")
    
    return {
        "id": chatbot.id,
        "nombre": chatbot.nombre,
        "descripcion": chatbot.descripcion,
        "configuracion": chatbot.configuracion
    }

@app.post("/api/chatbots")
def crear_chatbot(chatbot_data: dict, usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    print("🔍 RECIBIENDO DATOS DE CHATBOT:")
    print(f"Usuario: {usuario.email}")
    print(f"Datos recibidos: {chatbot_data}")
    
    # Verificar límite del plan
    cantidad_chatbots = db.query(Chatbot).filter(
        Chatbot.usuario_id == usuario.id,
        Chatbot.activo == True
    ).count()
    
    if cantidad_chatbots >= usuario.plan.max_chatbots:
        raise HTTPException(
            status_code=400, 
            detail=f"Límite de {usuario.plan.max_chatbots} chatbots alcanzado"
        )
    
    chatbot = Chatbot(
        nombre=chatbot_data["nombre"],
        descripcion=chatbot_data.get("descripcion", ""),
        configuracion=chatbot_data.get("configuracion", {}),
        usuario_id=usuario.id
    )
    
    db.add(chatbot)
    db.commit()
    db.refresh(chatbot)
    
    print(f"✅ Chatbot guardado con ID: {chatbot.id}")
    return {"id": chatbot.id, "mensaje": "Chatbot creado exitosamente"}

@app.put("/api/chatbots/{chatbot_id}")
def actualizar_chatbot(chatbot_id: int, chatbot_data: dict, usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id, 
        Chatbot.usuario_id == usuario.id
    ).first()
    
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot no encontrado")
    
    # Verificar límite de nodos si se está actualizando la configuración
    if "configuracion" in chatbot_data:
        nodos = chatbot_data["configuracion"].get("nodes", [])
        if len(nodos) > usuario.plan.max_nodos_por_chatbot:
            raise HTTPException(
                status_code=400,
                detail=f"Límite de {usuario.plan.max_nodos_por_chatbot} nodos alcanzado"
            )
    
    chatbot.nombre = chatbot_data.get("nombre", chatbot.nombre)
    chatbot.descripcion = chatbot_data.get("descripcion", chatbot.descripcion)
    chatbot.configuracion = chatbot_data.get("configuracion", chatbot.configuracion)
    chatbot.actualizado_en = datetime.utcnow()
    
    db.commit()
    return {"mensaje": "Chatbot actualizado exitosamente"}

# Variables por usuario
@app.get("/api/variables")
def obtener_variables(usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    registro = db.query(UserVariables).filter(UserVariables.usuario_id == usuario.id).first()
    return {
        "variables": (registro.variables if registro else []),
        "actualizado_en": (registro.actualizado_en if registro else None)
    }

@app.put("/api/variables")
def guardar_variables(payload: dict, usuario: Usuario = Depends(get_usuario_actual), db: Session = Depends(get_db)):
    if "variables" not in payload or not isinstance(payload["variables"], list):
        raise HTTPException(status_code=400, detail="Formato inválido de variables")

    registro = db.query(UserVariables).filter(UserVariables.usuario_id == usuario.id).first()
    if not registro:
        registro = UserVariables(usuario_id=usuario.id, variables=payload["variables"])
        db.add(registro)
    else:
        registro.variables = payload["variables"]
        registro.actualizado_en = datetime.utcnow()
    db.commit()
    return {"mensaje": "Variables guardadas correctamente"}

@app.get("/")
def read_root():
    return {"message": "CogniBot API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

