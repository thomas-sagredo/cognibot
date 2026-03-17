# 🚀 WhatsApp Business API - Guía de Configuración

## 📋 **PASO 1: Migrar Base de Datos**

```bash
cd proyects
python migrate_whatsapp.py
```

Esto creará las nuevas tablas necesarias para WhatsApp.

## 📋 **PASO 2: Instalar Dependencias Backend**

```bash
cd proyects
pip install -r requirements.txt
```

## 📋 **PASO 3: Iniciar Backend**

```bash
cd proyects
python main.py
```

El backend estará disponible en `http://154.2.8.21:8000`

## 📋 **PASO 4: Iniciar Frontend**

```bash
npm run dev
```

El frontend estará disponible en `http://154.2.8.21:8080`

## 🔧 **PASO 5: Configurar WhatsApp Business API**

### **5.1 Crear Aplicación en Meta for Developers**

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Crea una nueva aplicación
3. Agrega el producto "WhatsApp Business API"
4. Obtén tu **Access Token** permanente
5. Anota el **Phone Number ID** de tu número de WhatsApp Business

### **5.2 Configurar en CogniBot**

1. **Inicia sesión** en tu aplicación
2. **Crea un chatbot** o selecciona uno existente
3. Ve a la pestaña **"WhatsApp"**
4. Completa los campos:
   - **Phone Number ID**: El ID de tu número de WhatsApp Business
   - **Access Token**: Tu token de acceso permanente
   - **Verify Token**: Genera uno o usa uno personalizado

### **5.3 Configurar Webhook en Meta**

1. En Meta for Developers, ve a **WhatsApp → Configuration**
2. En la sección **Webhooks**, configura:
   - **Callback URL**: `https://tu-dominio.com/api/whatsapp/webhook/{CHATBOT_ID}`
   - **Verify Token**: El mismo que configuraste en CogniBot
3. **Suscríbete** al evento `messages`

## 🧪 **PASO 6: Probar la Integración**

### **6.1 Verificar Estado**
En la pestaña WhatsApp de tu chatbot, deberías ver:
- ✅ Estado: "Configurado" 
- ✅ Badge: "Activo"

### **6.2 Enviar Mensaje de Prueba**
1. Desde tu teléfono, envía un mensaje al número de WhatsApp Business
2. Ve a la pestaña **"Conversaciones"** en CogniBot
3. Deberías ver la nueva conversación y el mensaje

### **6.3 Verificar Respuesta del Bot**
El chatbot debería responder automáticamente según tu flujo configurado.

## 🆘 **Solución de Problemas**

### **Error: "No se encontró integración"**
- Verifica que el Phone Number ID sea correcto
- Asegúrate de que el webhook esté configurado en Meta

### **Error: "Token de verificación inválido"**
- Verifica que el Verify Token sea el mismo en ambos lados
- Prueba regenerar el token

### **No recibe mensajes**
- Verifica que la URL del webhook sea accesible públicamente
- Revisa los logs del backend para errores
- Asegúrate de estar suscrito al evento "messages"

### **El bot no responde**
- Verifica que tu flujo tenga un nodo de "Inicio"
- Revisa que los nodos estén conectados correctamente
- Checa los logs para errores en el procesamiento

## 📚 **Endpoints de API Disponibles**

```http
# Configurar WhatsApp
POST /api/whatsapp/setup/{chatbot_id}

# Estado de integración
GET /api/whatsapp/status/{chatbot_id}

# Webhook (usado por Meta)
GET /api/whatsapp/webhook/{chatbot_id}   # Verificación
POST /api/whatsapp/webhook/{chatbot_id}  # Mensajes

# Conversaciones
GET /api/conversations/{chatbot_id}
GET /api/conversations/{conversation_id}/messages
```

## 🔐 **Consideraciones de Seguridad**

1. **Nunca expongas** tu Access Token en el frontend
2. **Usa HTTPS** en producción para los webhooks
3. **Valida** todos los mensajes entrantes
4. **Implementa rate limiting** para evitar spam

## 🚀 **Próximos Pasos**

Una vez que WhatsApp funcione, puedes agregar:

1. **Análisis y métricas** de conversaciones
2. **Respuestas con multimedia** (imágenes, videos)
3. **Integraciones con Messenger** e Instagram
4. **IA y procesamiento de lenguaje natural**
5. **Sistema de escalamiento** a agentes humanos

---

¡Tu botmaker ya está listo para competir con las mejores plataformas! 🎉

