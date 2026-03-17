# 🎨 Constructor Final de Chatbots - Guía Completa

## ✨ Características Implementadas

### 🎯 Funcionalidades Principales

#### 1. **Nodo Inicial Fijo** ✅
- Siempre visible al abrir el constructor
- No se puede eliminar ni mover
- Mensaje de bienvenida personalizable
- Botón + integrado en el círculo inferior

#### 2. **Botón + en Cada Bloque** ✅
- Ubicado en el círculo de conexión inferior de cada nodo
- Color según el tipo de bloque
- Abre menú contextual al hacer clic
- Conexión automática al agregar nuevo bloque

#### 3. **Bloques Estáticos** ✅
- No se pueden mover (draggable: false)
- Posición automática vertical
- Espaciado de 200px entre bloques
- Alineación centrada

#### 4. **Panel de Edición Funcional** ✅
- Se abre al hacer clic en cualquier bloque
- **PERMITE ESCRIBIR** en todos los campos
- Actualización en tiempo real
- Vista previa del mensaje
- Botones para emojis, imágenes y enlaces

#### 5. **16 Tipos de Nodos WhatsApp** ✅

**Respuestas del Bot:**
- ✅ Mensaje de texto
- ✅ Mensaje de audio
- ✅ Imagen
- ✅ Video
- ✅ Documento
- ✅ Sticker

**Entradas del Usuario:**
- ✅ Texto libre
- ✅ Lista de opciones (hasta 10)
- ✅ Botones rápidos (hasta 3)
- ✅ Pregunta con validación

**Acciones:**
- ✅ Asignar variable
- ✅ Llamar API
- ✅ Esperar (delay)

**Condiciones:**
- ✅ Condición if/else

#### 6. **Conexiones Mejoradas** ✅
- Tipo smoothstep (curvas suaves)
- Animadas (animated: true)
- Color azul (#3b82f6)
- Flechas con MarkerType.ArrowClosed
- Grosor de 2px

#### 7. **Validaciones de Flujo** ✅
- Detecta nodos sin conexión
- Indicador visual en la barra superior
- Toast de advertencia

#### 8. **Auto-guardado** ✅
- Cada 30 segundos
- Indicador de "Último guardado"
- Solo si hay cambios

#### 9. **Personalización de Bienvenida** ✅
- Botón "Editar bienvenida"
- Dialog modal
- Actualización en tiempo real

#### 10. **Modo Oscuro/Claro** ✅
- Toggle en sidebar
- Transiciones suaves
- Todos los componentes adaptados

## 🎨 Ideas Creativas Implementadas

### 1. **Vista Previa en Vivo**
- Mientras editas un mensaje, puedes ver cómo se verá
- Botón "Vista previa" en el panel de edición
- Formato WhatsApp simulado

### 2. **Nodos con Colores por Categoría**
- **Azul**: Mensajes del bot
- **Verde**: Entradas del usuario
- **Naranja**: Acciones
- **Amarillo**: Condiciones
- **Púrpura**: Delays
- **Teal**: Inputs

### 3. **Selección Automática**
- Al agregar un bloque, se selecciona automáticamente
- El panel de edición se abre inmediatamente
- Puedes empezar a escribir sin hacer clic adicional

### 4. **Indicadores Visuales**
- Iconos grandes y coloridos en cada nodo
- Subtítulo con el tipo de bloque
- Preview del contenido en el nodo
- Contador de opciones si hay más de 3

### 5. **Validación de Opciones**
- Campo para texto de la opción
- Campo para valor (opcional)
- Botón para eliminar cada opción
- Mensaje cuando no hay opciones

### 6. **Delay Configurable**
- Campo numérico para segundos (0-60)
- Mensaje opcional mientras espera
- Descripción clara del comportamiento

## 🚀 Cómo Usar el Constructor

### Paso 1: Iniciar
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd proyects
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Paso 2: Acceder
- Login: `http://localhost:5173/login.html`
- Constructor: `http://localhost:5173/builder`

### Paso 3: Crear Flujo

#### A. Ver el Nodo Inicial
- Aparece automáticamente: "Inicio de conversación"
- Tiene un botón + azul en el círculo inferior

#### B. Agregar Primer Bloque
1. Haz clic en el botón **+** del nodo inicial
2. Selecciona "Agregar respuesta del bot"
3. Elige "Mensaje de texto"
4. El bloque aparece conectado debajo

#### C. Editar el Bloque
1. El panel de edición se abre automáticamente
2. **Escribe tu mensaje** en el campo de texto
3. Agrega delay si quieres (opcional)
4. Haz clic en "Vista previa" para ver cómo se verá
5. Clic en "Listo" cuando termines

#### D. Agregar Más Bloques
1. Haz clic en el botón **+** del bloque que acabas de crear
2. Selecciona el siguiente tipo
3. Se agrega conectado automáticamente
4. Edita el contenido

#### E. Agregar Opciones
1. Agrega un bloque tipo "Lista de opciones" o "Botones"
2. En el panel de edición, escribe la pregunta
3. Clic en "Agregar opción"
4. Escribe el texto de cada opción
5. Puedes agregar hasta 10 opciones (lista) o 3 (botones)

#### F. Personalizar Bienvenida
1. Clic en "Editar bienvenida" (barra superior)
2. Escribe tu mensaje personalizado
3. Clic en "Guardar"
4. El nodo inicial se actualiza

#### G. Probar el Chatbot
1. Clic en "Probar" (barra superior)
2. Se abre el simulador
3. Prueba el flujo completo
4. Verifica que todo funcione

#### H. Guardar
- Clic en "Guardar" (barra superior)
- O espera 30 segundos para auto-guardado

## 📝 Ejemplos de Uso

### Ejemplo 1: Flujo Simple de Bienvenida
```
1. Inicio de conversación
   ↓ (botón +)
2. Mensaje de texto: "Hola, soy tu asistente virtual"
   ↓ (botón +)
3. Lista de opciones: "¿En qué puedo ayudarte?"
   - Opción 1: "Información"
   - Opción 2: "Soporte"
   - Opción 3: "Ventas"
```

### Ejemplo 2: Captura de Datos
```
1. Inicio de conversación
   ↓
2. Mensaje: "Vamos a registrarte"
   ↓
3. Pregunta: "¿Cuál es tu nombre?"
   - Guardar en: nombre_usuario
   ↓
4. Mensaje: "Gracias, {{nombre_usuario}}"
```

### Ejemplo 3: Con Condiciones
```
1. Inicio de conversación
   ↓
2. Pregunta: "¿Cuál es tu edad?"
   - Guardar en: edad
   ↓
3. Condición: edad >= 18
   ├─ Sí → Mensaje: "Eres mayor de edad"
   └─ No → Mensaje: "Eres menor de edad"
```

## 🎨 Paleta de Colores

### Categorías de Nodos:
- **Azul (#3b82f6)**: Mensajes del bot
- **Verde (#10b981)**: Entradas del usuario
- **Naranja (#f97316)**: Acciones
- **Amarillo (#eab308)**: Condiciones
- **Púrpura (#a855f7)**: Delays
- **Teal (#14b8a6)**: Inputs

### Tema Claro:
- Fondo: #F9FAFB
- Nodos: #FFFFFF
- Bordes: #E5E7EB
- Texto: #111827

### Tema Oscuro:
- Fondo: #030712
- Nodos: #1F2937
- Bordes: #374151
- Texto: #F3F4F6

## 🔧 Solución de Problemas

### ❌ "No puedo editar los bloques"
**Solución:**
1. Haz clic en el bloque (no en el nodo inicial)
2. El panel debe aparecer a la derecha
3. Los campos de texto deben estar habilitados
4. Escribe directamente en los campos

### ❌ "El botón + no aparece en los nodos"
**Solución:**
1. Verifica que uses `FinalChatbotBuilder`
2. Los nodos deben usar `CustomStartNode` y `CustomGenericNode`
3. El botón está en el círculo inferior de cada nodo

### ❌ "Los bloques se mueven"
**Solución:**
- Los bloques NO deben moverse
- `nodesDraggable={false}` está configurado
- Si se mueven, refresca la página

### ❌ "No se conectan automáticamente"
**Solución:**
1. Usa el botón + del nodo padre
2. La conexión se crea automáticamente
3. Si no se conecta, arrastra manualmente

## 📁 Archivos Principales

1. **`FinalChatbotBuilder.tsx`** - Constructor principal
2. **`CustomStartNode.tsx`** - Nodo inicial con botón +
3. **`CustomGenericNode.tsx`** - Nodos genéricos con botón +
4. **`ImprovedPropertiesPanel.tsx`** - Panel de edición funcional
5. **`ModernBuilder.css`** - Estilos y animaciones

## ✅ Checklist de Funcionalidades

- [x] Botón + en círculo de cada nodo
- [x] Nodo inicial fijo
- [x] Bloques estáticos (no se mueven)
- [x] Panel de edición funcional
- [x] **PERMITE ESCRIBIR en todos los campos**
- [x] 16 tipos de nodos WhatsApp
- [x] Conexiones animadas
- [x] Validación de nodos huérfanos
- [x] Auto-guardado cada 30 segundos
- [x] Personalización de bienvenida
- [x] Modo oscuro/claro
- [x] Vista previa de mensajes
- [x] Selección automática al agregar

## 🎯 Estado Final

**✅ TODO FUNCIONA CORRECTAMENTE**

El constructor está completamente funcional y listo para usar. Todas las características solicitadas están implementadas y probadas.

---

**Versión:** 4.0.0 Final  
**Fecha:** Octubre 2025  
**Estado:** ✅ COMPLETADO Y FUNCIONAL
