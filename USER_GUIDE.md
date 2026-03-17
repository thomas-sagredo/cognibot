# Guía de Usuario - CogniBot

## Ingreso
1. Ve a `/login.html`
2. Regístrate o inicia sesión

## Constructor
- Agrega nodos desde la barra izquierda
- Conecta nodos arrastrando entre puertos
- Propiedades a la derecha
- Guarda con el botón "Guardar"
- Exporta JSON con el botón de descarga

## Tipos de Nodos
- Inicio: primer mensaje
- Mensaje: mensaje simple
- Opciones: botones de opciones
- Acción: set/get de variables, llamadas API (simulado)
- Condición: ramifica por variables/valores
- Input (nuevo): pide un dato y lo guarda
- Delay (nuevo): espera N ms y continúa
- Final: termina la conversación

## Simulador
- Botón "Probar Chatbot"
- Escribe como usuario
- Verás cómo avanza por el flujo

## WhatsApp
- Pestaña "WhatsApp" en el sidebar
- Configura `phone_number_id`, `access_token`, `verify_token`
- Copia la `webhook_url` en Meta

## Consejos
- Mantén el flujo sin ciclos infinitos
- Usa variables para personalizar respuestas
- Guarda frecuentemente
