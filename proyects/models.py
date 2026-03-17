# models.py
from sqlalchemy import Column, Integer, String, Text, JSON, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from db import Base

class Plan(Base):
    __tablename__ = "planes"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False)
    max_chatbots = Column(Integer, default=1)
    max_nodos_por_chatbot = Column(Integer, default=20)
    precio_mensual = Column(Integer, default=0)
    caracteristicas = Column(JSON)

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    nombre = Column(String(50))
    plan_id = Column(Integer, ForeignKey("planes.id"), default=1)
    activo = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    chatbots = relationship("Chatbot", back_populates="usuario")
    plan = relationship("Plan")

class Chatbot(Base):
    __tablename__ = "chatbots"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    configuracion = Column(JSON)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    activo = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=datetime.utcnow)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    usuario = relationship("Usuario", back_populates="chatbots")


class UserVariables(Base):
    __tablename__ = "user_variables"
    __table_args__ = (
        UniqueConstraint('usuario_id', name='uq_user_variables_usuario'),
    )

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    variables = Column(JSON, default=list)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# NUEVAS TABLAS PARA WHATSAPP Y CONVERSACIONES

class WhatsAppIntegration(Base):
    __tablename__ = "whatsapp_integrations"
    
    id = Column(Integer, primary_key=True, index=True)
    chatbot_id = Column(Integer, ForeignKey("chatbots.id"), nullable=False)
    phone_number_id = Column(String(100), nullable=False)  # WhatsApp Business Phone Number ID
    access_token = Column(String(500), nullable=False)     # WhatsApp Access Token
    verify_token = Column(String(100), nullable=False)     # Para webhook verification
    webhook_url = Column(String(500))                      # URL del webhook
    activo = Column(Boolean, default=True)
    creado_en = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    chatbot = relationship("Chatbot")


class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    chatbot_id = Column(Integer, ForeignKey("chatbots.id"), nullable=False)
    user_phone = Column(String(20), nullable=False)        # Teléfono del usuario
    user_name = Column(String(100))                        # Nombre del usuario
    platform = Column(String(20), default="whatsapp")     # whatsapp, messenger, etc.
    current_node_id = Column(String(50))                   # Nodo actual en el flujo
    session_variables = Column(JSON, default=dict)        # Variables de la sesión
    estado = Column(String(20), default="active")         # active, completed, paused
    iniciado_en = Column(DateTime, default=datetime.utcnow)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    chatbot = relationship("Chatbot")
    mensajes = relationship("Message", back_populates="conversation")


class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    message_id = Column(String(100))                       # ID del mensaje de WhatsApp
    sender_type = Column(String(10), nullable=False)       # 'user' o 'bot'
    content_type = Column(String(20), default="text")     # text, image, audio, etc.
    content = Column(Text, nullable=False)                 # Contenido del mensaje
    node_id = Column(String(50))                          # Nodo que generó el mensaje (si es bot)
    extra_data = Column(JSON, default=dict)               # Info adicional
    enviado_en = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    conversation = relationship("Conversation", back_populates="mensajes")


class Analytics(Base):
    __tablename__ = "analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    chatbot_id = Column(Integer, ForeignKey("chatbots.id"), nullable=False)
    fecha = Column(DateTime, default=datetime.utcnow)
    metric_type = Column(String(50), nullable=False)      # 'conversation_started', 'message_sent', etc.
    metric_value = Column(Integer, default=1)
    extra_data = Column(JSON, default=dict)
    
    # Relaciones  
    chatbot = relationship("Chatbot")