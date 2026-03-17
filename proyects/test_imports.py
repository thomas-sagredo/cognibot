# test_imports.py
try:
    print("Importando db...")
    from db import Base, engine, SessionLocal
    print("OK")
    
    print("Importando models...")
    from models import Usuario, Plan, Chatbot, UserVariables, WhatsAppIntegration, Conversation, Message, Analytics
    print("OK")
    
    print("Importando auth...")
    from auth import hash_password, verify_password, create_access_token, verify_token
    print("OK")
    
    print("Importando whatsapp_service...")
    from whatsapp_service import whatsapp_service
    print("OK")
    
    print("Importando FastAPI...")
    from fastapi import FastAPI, Depends, HTTPException, status
    print("OK")
    
    print("Todas las importaciones exitosas!")
    
except Exception as e:
    print(f"Error en importacion: {e}")
    import traceback
    traceback.print_exc()

