# 🎨 Guía del Constructor Moderno de Chatbots

## ✨ Características Principales

### 1. **Interfaz Moderna y Minimalista**
- Sidebar colapsable con iconos intuitivos
- Modo oscuro/claro con transición suave
- Diseño limpio y profesional

### 2. **Botón Flotante "+" para Agregar Bloques**
- Ubicado en la esquina inferior derecha
- Al hacer clic, muestra un menú contextual con categorías:
  - 🤖 **Agregar respuesta del bot** (azul)
  - ⌨️ **Agregar entrada del usuario** (verde)
  - ⚡ **Agregar acción** (naranja)
  - 🔀 **Agregar condición** (amarillo)

### 3. **Menús Contextuales Inteligentes**

#### Respuestas del Bot:
- Mensaje de texto
- Mensaje de audio
- Imagen
- Video
- Archivo
- Sticker

#### Entradas del Usuario:
- Lenguaje natural
- Lista de opciones (hasta 10)
- Botones (hasta 3, con URLs)
- Formulario
- Carrousel (próximamente)
- WhatsApp Flow

#### Acciones:
- Ejecutar acción
- Esperar (delay)

#### Condiciones:
- Condición (bifurcación de flujo)

### 4. **Sidebar Colapsable**
Secciones disponibles:
- ⚙️ Identidad y preferencias
- ⚡ Asignación de bots a canales
- 📚 Base de contenidos
- 💻 Acciones de código
- 📋 Variables
- 🔄 WhatsApp Flows
- 📊 Segmentos

### 5. **Modo Oscuro/Claro**
- Toggle en el footer del sidebar
- Transiciones suaves
- Todos los componentes adaptados
- Persistencia de preferencia

## 🚀 Cómo Usar

### Nodo Inicial Fijo:
- **Siempre presente**: El flujo comienza con un nodo "Inicio de conversación" que no se puede eliminar ni mover
- **Punto de partida**: Todos los flujos deben partir desde este nodo
- **Conexión automática**: El primer bloque que agregues se conectará automáticamente al nodo inicial

### Agregar un Nuevo Bloque:
1. Haz clic en el botón **"+"** flotante (esquina inferior derecha)
2. Selecciona una categoría del menú
3. Elige el tipo específico de bloque
4. El bloque aparecerá debajo del último nodo y se conectará automáticamente si es el primero

### Conectar Bloques:
1. Arrastra desde el punto de conexión de un bloque
2. Suelta en el punto de destino de otro bloque
3. La conexión se creará automáticamente

### Editar un Bloque:
1. Haz clic en el bloque que deseas editar
2. El panel de propiedades aparecerá a la derecha
3. Modifica los campos necesarios
4. Los cambios se guardan automáticamente

### Cambiar Tema:
1. Ve al footer del sidebar
2. Haz clic en el botón de luna/sol
3. El tema cambiará instantáneamente

### Colapsar/Expandir Sidebar:
1. Haz clic en el botón de flecha en el header del sidebar
2. El sidebar se colapsará mostrando solo iconos
3. Pasa el mouse sobre los iconos para ver tooltips

## 🎨 Paleta de Colores

### Modo Claro:
- Fondo principal: `#F9FAFB` (gray-50)
- Sidebar: `#FFFFFF` (white)
- Bordes: `#E5E7EB` (gray-200)
- Texto: `#111827` (gray-900)

### Modo Oscuro:
- Fondo principal: `#030712` (gray-950)
- Sidebar: `#111827` (gray-900)
- Bordes: `#1F2937` (gray-800)
- Texto: `#F3F4F6` (gray-100)

### Colores de Categorías:
- Azul: Respuestas del bot
- Verde: Entradas del usuario
- Naranja: Acciones
- Amarillo: Condiciones

## 🔧 Atajos de Teclado (Próximamente)

- `Ctrl/Cmd + S`: Guardar chatbot
- `Ctrl/Cmd + D`: Duplicar nodo seleccionado
- `Delete`: Eliminar nodo seleccionado
- `Ctrl/Cmd + Z`: Deshacer
- `Ctrl/Cmd + Shift + Z`: Rehacer
- `Space`: Activar modo pan (arrastrar canvas)

## 📱 Responsive Design

El constructor está optimizado para:
- Pantallas grandes (1920px+)
- Laptops (1366px - 1920px)
- Tablets (768px - 1366px)
- Móviles (< 768px) - Vista simplificada

## 🐛 Solución de Problemas

### El menú contextual no aparece:
- Verifica que hayas hecho clic en el botón "+"
- Asegúrate de que no hay otros menús abiertos

### Los bloques no se conectan:
- Verifica que estés arrastrando desde un punto de salida
- Asegúrate de soltar en un punto de entrada válido

### El modo oscuro no funciona:
- Verifica que Tailwind esté configurado correctamente
- Revisa que el archivo CSS esté importado

## 🔄 Actualizaciones Futuras

- [ ] Drag & drop desde el sidebar
- [ ] Atajos de teclado
- [ ] Zoom y pan mejorados
- [ ] Exportar/Importar flujos
- [ ] Plantillas predefinidas
- [ ] Colaboración en tiempo real
- [ ] Historial de versiones
- [ ] Comentarios en nodos

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias:
1. Revisa esta guía
2. Consulta la documentación técnica
3. Contacta al equipo de desarrollo

---

**Versión:** 2.0.0  
**Última actualización:** Octubre 2025
