from fastapi import FastAPI, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import json

# Importaciones existentes
from db import Base, engine, SessionLocal
from models import Usuario, Plan, Chatbot, UserVariables, WhatsAppIntegration, Conversation, Message, Analytics
from auth import hash_password, verify_password, create_access_token, verify_token
from whatsapp_service import whatsapp_service

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CogniBot API")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todos los orígenes (ajustar en producción)
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
        "configuracion": cb.configuracion,
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

# ENDPOINTS PARA WHATSAPP BUSINESS API

@app.post("/api/whatsapp/webhook/{chatbot_id}")
def whatsapp_webhook(chatbot_id: int, request_data: dict, db: Session = Depends(get_db)):
    """
    Webhook para recibir mensajes de WhatsApp
    """
    try:
        print(f"🔔 Webhook recibido para chatbot {chatbot_id}: {request_data}")
        
        # Verificar que el chatbot existe
        chatbot = db.query(Chatbot).filter(Chatbot.id == chatbot_id).first()
        if not chatbot:
            raise HTTPException(status_code=404, detail="Chatbot no encontrado")
        
        # Procesar el mensaje
        success = whatsapp_service.process_incoming_message(request_data, db)
        
        if success:
            return {"status": "ok"}
        else:
            raise HTTPException(status_code=500, detail="Error procesando mensaje")
            
    except Exception as e:
        print(f"💥 Error en webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/whatsapp/webhook/{chatbot_id}")
def whatsapp_webhook_verify(
    chatbot_id: int,
    db: Session = Depends(get_db),
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
):
    """
    Verificación del webhook de WhatsApp (Meta envía parámetros con puntos).
    """
    try:
        print(f"🔍 Verificación webhook para chatbot {chatbot_id} — mode={hub_mode}")

        integration = db.query(WhatsAppIntegration).filter(
            WhatsAppIntegration.chatbot_id == chatbot_id,
            WhatsAppIntegration.activo == True
        ).first()

        if not integration:
            raise HTTPException(status_code=404, detail="Integración no encontrada")

        if hub_mode == "subscribe" and hub_verify_token == integration.verify_token:
            print("✅ Webhook verificado")
            return int(hub_challenge)
        else:
            print("❌ Token de verificación inválido")
            raise HTTPException(status_code=403, detail="Token inválido")

    except HTTPException:
        raise
    except Exception as e:
        print(f"💥 Error en verificación: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/whatsapp/integration/{chatbot_id}")
def get_whatsapp_integration(chatbot_id: int, usuario: Usuario = Depends(get_usuario_actual),
                             db: Session = Depends(get_db)):
    """Devuelve la configuración de integración de WhatsApp para el frontend."""
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id, Chatbot.usuario_id == usuario.id
    ).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot no encontrado")

    integration = db.query(WhatsAppIntegration).filter(
        WhatsAppIntegration.chatbot_id == chatbot_id
    ).first()

    if not integration:
        return {"configurado": False}

    return {
        "configurado": True,
        "activo": integration.activo,
        "phone_number_id": integration.phone_number_id,
        "verify_token": integration.verify_token,
        "webhook_url": integration.webhook_url,
        "creado_en": integration.creado_en,
    }


@app.post("/api/whatsapp/setup/{chatbot_id}")
def setup_whatsapp_integration(chatbot_id: int, integration_data: dict, 
                             usuario: Usuario = Depends(get_usuario_actual), 
                             db: Session = Depends(get_db)):
    """
    Configura la integración de WhatsApp para un chatbot
    """
    try:
        print(f"⚙️ Configurando WhatsApp para chatbot {chatbot_id}")
        
        # Verificar que el chatbot pertenece al usuario
        chatbot = db.query(Chatbot).filter(
            Chatbot.id == chatbot_id,
            Chatbot.usuario_id == usuario.id
        ).first()
        
        if not chatbot:
            raise HTTPException(status_code=404, detail="Chatbot no encontrado")
        
        # Validar datos requeridos
        required_fields = ["phone_number_id", "access_token", "verify_token"]
        for field in required_fields:
            if field not in integration_data:
                raise HTTPException(status_code=400, detail=f"Campo {field} es requerido")
        
        # Buscar integración existente o crear nueva
        integration = db.query(WhatsAppIntegration).filter(
            WhatsAppIntegration.chatbot_id == chatbot_id
        ).first()
        
        if integration:
            # Actualizar integración existente
            integration.phone_number_id = integration_data["phone_number_id"]
            integration.access_token = integration_data["access_token"]
            integration.verify_token = integration_data["verify_token"]
            integration.webhook_url = f"https://tu-dominio.com/api/whatsapp/webhook/{chatbot_id}"
            integration.activo = True
        else:
            # Crear nueva integración
            integration = WhatsAppIntegration(
                chatbot_id=chatbot_id,
                phone_number_id=integration_data["phone_number_id"],
                access_token=integration_data["access_token"],
                verify_token=integration_data["verify_token"],
                webhook_url=f"https://tu-dominio.com/api/whatsapp/webhook/{chatbot_id}",
                activo=True
            )
            db.add(integration)
        
        db.commit()
        
        return {
            "mensaje": "Integración de WhatsApp configurada exitosamente",
            "webhook_url": integration.webhook_url,
            "verify_token": integration.verify_token
        }
        
    except Exception as e:
        print(f"💥 Error configurando WhatsApp: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/whatsapp/status/{chatbot_id}")
def get_whatsapp_status(chatbot_id: int, usuario: Usuario = Depends(get_usuario_actual), 
                       db: Session = Depends(get_db)):
    """
    Obtiene el estado de la integración de WhatsApp
    """
    try:
        # Verificar que el chatbot pertenece al usuario
        chatbot = db.query(Chatbot).filter(
            Chatbot.id == chatbot_id,
            Chatbot.usuario_id == usuario.id
        ).first()
        
        if not chatbot:
            raise HTTPException(status_code=404, detail="Chatbot no encontrado")
        
        # Buscar integración
        integration = db.query(WhatsAppIntegration).filter(
            WhatsAppIntegration.chatbot_id == chatbot_id
        ).first()
        
        if not integration:
            return {
                "configurado": False,
                "mensaje": "WhatsApp no configurado"
            }
        
        return {
            "configurado": True,
            "activo": integration.activo,
            "phone_number_id": integration.phone_number_id,
            "webhook_url": integration.webhook_url,
            "creado_en": integration.creado_en
        }
        
    except Exception as e:
        print(f"💥 Error obteniendo estado WhatsApp: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/conversations/{chatbot_id}")
def get_conversations(chatbot_id: int, usuario: Usuario = Depends(get_usuario_actual), 
                     db: Session = Depends(get_db)):
    """
    Obtiene las conversaciones de un chatbot
    """
    try:
        # Verificar que el chatbot pertenece al usuario
        chatbot = db.query(Chatbot).filter(
            Chatbot.id == chatbot_id,
            Chatbot.usuario_id == usuario.id
        ).first()
        
        if not chatbot:
            raise HTTPException(status_code=404, detail="Chatbot no encontrado")
        
        # Obtener conversaciones
        conversations = db.query(Conversation).filter(
            Conversation.chatbot_id == chatbot_id
        ).order_by(Conversation.actualizado_en.desc()).limit(50).all()
        
        result = []
        for conv in conversations:
            # Contar mensajes
            message_count = db.query(Message).filter(Message.conversation_id == conv.id).count()
            
            result.append({
                "id": conv.id,
                "user_phone": conv.user_phone,
                "user_name": conv.user_name,
                "platform": conv.platform,
                "estado": conv.estado,
                "message_count": message_count,
                "iniciado_en": conv.iniciado_en,
                "actualizado_en": conv.actualizado_en
            })
        
        return result
        
    except Exception as e:
        print(f"💥 Error obteniendo conversaciones: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/conversations/{conversation_id}/messages")
def get_conversation_messages(conversation_id: int, usuario: Usuario = Depends(get_usuario_actual), 
                            db: Session = Depends(get_db)):
    """
    Obtiene los mensajes de una conversación
    """
    try:
        # Verificar que la conversación pertenece a un chatbot del usuario
        conversation = db.query(Conversation).join(Chatbot).filter(
            Conversation.id == conversation_id,
            Chatbot.usuario_id == usuario.id
        ).first()
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversación no encontrada")
        
        # Obtener mensajes
        messages = db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.enviado_en.asc()).all()
        
        result = []
        for msg in messages:
            result.append({
                "id": msg.id,
                "sender_type": msg.sender_type,
                "content_type": msg.content_type,
                "content": msg.content,
                "node_id": msg.node_id,
                "enviado_en": msg.enviado_en
            })
        
        return result
        
    except Exception as e:
        print(f"💥 Error obteniendo mensajes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
def read_root():
    return {"message": "CogniBot API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)