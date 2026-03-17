# 📋 Progreso Opción A - Arreglar lo Crítico

## ✅ COMPLETADO (60%)

### 1. ✅ Tipos e Interfaces Creadas
**Archivo:** `src/types/builder.ts`

**Contenido:**
- ✅ Interface `NodeData` con todos los campos tipados
- ✅ Interface `NodeOption` para opciones
- ✅ Interface `FlowValidationError` para errores
- ✅ Interface `FlowStats` para estadísticas
- ✅ Constantes:
  - `MAX_OPTIONS_BUTTONS = 3`
  - `MAX_OPTIONS_LIST = 10`
  - `MAX_DELAY_SECONDS = 300`
  - `AUTO_SAVE_INTERVAL = 30000`

### 2. ✅ Panel de Propiedades Mejorado
**Archivo:** `src/components/ImprovedPropertiesPanel.tsx`

**Mejoras implementadas:**
- ✅ Eliminado todos los `any` → Ahora usa `NodeData` y `NodeOption`
- ✅ Límites de opciones funcionando:
  - Botones: máximo 3
  - Listas: máximo 10
- ✅ Toast de advertencia al exceder límite
- ✅ Contador visual: "X / Y opciones"
- ✅ Botón "Agregar opción" se deshabilita al llegar al máximo
- ✅ Limpieza de estado al cerrar panel (useEffect)
- ✅ Validación de arrays antes de usar

**Código clave:**
```typescript
const handleAddOption = () => {
  const options = Array.isArray(localData.options) ? localData.options : [];
  const maxOptions = localData.subtype === 'buttons' ? MAX_OPTIONS_BUTTONS : MAX_OPTIONS_LIST;
  
  if (options.length >= maxOptions) {
    toast.warning(`Máximo ${maxOptions} opciones permitidas...`);
    return;
  }
  // ...
};
```

### 3. ✅ Hook de Validación del Flujo
**Archivo:** `src/hooks/useFlowValidation.ts`

**Funcionalidades:**
- ✅ Detecta nodos vacíos (sin texto/opciones)
- ✅ Detecta nodos huérfanos (sin conexiones)
- ✅ Validaciones específicas por tipo de nodo:
  - Mensajes: requiere texto
  - Opciones: requiere pregunta y opciones
  - Input: requiere pregunta y variable
  - Acción: requiere nombre de variable
  - Delay: requiere tiempo > 0
- ✅ Estadísticas del flujo:
  - Total de nodos por tipo
  - Total de conexiones
  - Nodos huérfanos
  - Nodos vacíos
- ✅ Separación de errores y warnings
- ✅ Flag `isValid` para saber si se puede guardar

**Uso:**
```typescript
const { errors, stats, hasErrors, hasWarnings, isValid } = useFlowValidation(nodes, edges);
```

---

## ⏳ PENDIENTE (40%)

### 4. ⏳ Fix useEffect en FinalChatbotBuilder
**Archivo:** `src/components/FinalChatbotBuilder.tsx`

**Problemas a corregir:**
```typescript
// ❌ ANTES (línea ~202)
useEffect(() => {
  const autoSaveInterval = setInterval(() => {
    if (nodes.length > 1) {
      handleSave(); // ⚠️ Falta en dependencias
    }
  }, 30000);
  return () => clearInterval(autoSaveInterval);
}, [nodes, edges, variables]); // ❌ Falta handleSave

// ✅ SOLUCIÓN
const autoSaveRef = useRef<NodeJS.Timeout>();

useEffect(() => {
  if (autoSaveRef.current) {
    clearInterval(autoSaveRef.current);
  }
  
  autoSaveRef.current = setInterval(() => {
    if (nodes.length > 1) {
      handleSave();
    }
  }, AUTO_SAVE_INTERVAL);
  
  return () => {
    if (autoSaveRef.current) {
      clearInterval(autoSaveRef.current);
    }
  };
}, []); // Sin dependencias, usa ref
```

### 5. ⏳ Integrar Validación en UI
**Archivo:** `src/components/FinalChatbotBuilder.tsx`

**Pasos:**
1. Importar hook:
```typescript
import { useFlowValidation } from '@/hooks/useFlowValidation';
```

2. Usar en componente:
```typescript
const { errors, stats, hasErrors, hasWarnings, isValid } = useFlowValidation(nodes, edges);
```

3. Mostrar errores en barra superior:
```typescript
{hasErrors && (
  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
    <AlertCircle className="w-4 h-4" />
    <span className="text-sm">{errors.filter(e => e.severity === 'error').length} errores</span>
  </div>
)}
```

4. Deshabilitar guardar si hay errores:
```typescript
<Button
  size="sm"
  onClick={handleSave}
  disabled={!isValid || saveMutation.isPending}
>
  <Save className="w-4 h-4 mr-2" />
  Guardar
</Button>
```

5. Mostrar panel de errores (opcional):
```typescript
{errors.length > 0 && (
  <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 max-w-md">
    <h3 className="font-semibold mb-2">Problemas detectados:</h3>
    <div className="space-y-2">
      {errors.map((error, idx) => (
        <div key={idx} className={`flex items-start gap-2 text-sm ${
          error.severity === 'error' ? 'text-red-600' : 'text-orange-600'
        }`}>
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <div>
            <div className="font-medium">{error.nodeLabel}</div>
            <div className="text-xs">{error.message}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

### 6. ⏳ Actualizar Nodos Personalizados
**Archivos:**
- `src/components/nodes/CustomStartNode.tsx`
- `src/components/nodes/CustomGenericNode.tsx`

**Cambios necesarios:**

**CustomStartNode.tsx:**
```typescript
import { NodeProps } from '@xyflow/react';
import { NodeData } from '@/types/builder';

interface CustomStartNodeProps extends NodeProps {
  data: NodeData;
}

export const CustomStartNode: React.FC<CustomStartNodeProps> = ({ data, id }) => {
  // ...
  {data.text || 'Nodo de bienvenida del chatbot'} // ✅ Ya no es 'unknown'
}
```

**CustomGenericNode.tsx:**
```typescript
import { NodeProps } from '@xyflow/react';
import { NodeData } from '@/types/builder';

interface CustomGenericNodeProps extends NodeProps {
  data: NodeData;
}

export const CustomGenericNode: React.FC<CustomGenericNodeProps> = ({ data, id, type }) => {
  // ...
  {data.text} // ✅ Ya no es 'unknown'
  {data.options?.map(...)} // ✅ Tipado correcto
}
```

---

## 📊 Resumen de Progreso

### Completado:
- [x] Crear tipos e interfaces (builder.ts)
- [x] Eliminar `any` del panel de propiedades
- [x] Implementar límites de opciones
- [x] Crear hook de validación
- [x] Limpiar estado al cerrar panel

### Pendiente:
- [ ] Fix useEffect con useRef
- [ ] Integrar validación en UI
- [ ] Mostrar errores en barra superior
- [ ] Deshabilitar guardar si hay errores
- [ ] Actualizar tipos en nodos personalizados
- [ ] Panel de errores (opcional)

---

## 🎯 Próxima Sesión - Plan de Acción

### Paso 1: Fix useEffect (15 min)
1. Importar `useRef` en FinalChatbotBuilder
2. Crear `autoSaveRef`
3. Actualizar useEffect del auto-guardado
4. Probar que no haya warnings

### Paso 2: Integrar Validación (30 min)
1. Importar `useFlowValidation`
2. Agregar al componente
3. Mostrar contador de errores en barra superior
4. Deshabilitar botón guardar si hay errores
5. Agregar tooltip con detalles

### Paso 3: Actualizar Nodos (20 min)
1. Actualizar CustomStartNode con tipos
2. Actualizar CustomGenericNode con tipos
3. Verificar que no haya errores TypeScript

### Paso 4: Testing (15 min)
1. Probar agregar opciones hasta el límite
2. Verificar toast de advertencia
3. Probar validación de nodos vacíos
4. Verificar que el guardado se bloquea con errores

**Tiempo Total Estimado: 1.5 horas**

---

## 🐛 Bugs Conocidos a Corregir

1. **Warning de React Hook** en auto-guardado
   - Solución: useRef

2. **Type 'unknown'** en nodos
   - Solución: Interfaces tipadas

3. **Conversión de tipo** en ImprovedPropertiesPanel línea 41
   - Solución: Hacer label opcional en NodeData

---

## 📝 Notas Importantes

### Constantes Definidas:
```typescript
MAX_OPTIONS_BUTTONS = 3      // WhatsApp límite
MAX_OPTIONS_LIST = 10        // WhatsApp límite
MAX_DELAY_SECONDS = 300      // 5 minutos
AUTO_SAVE_INTERVAL = 30000   // 30 segundos
```

### Validaciones Implementadas:
- ✅ Nodos de mensaje requieren texto
- ✅ Nodos de opciones requieren pregunta y opciones
- ✅ Nodos de input requieren pregunta y variable
- ✅ Nodos de acción requieren nombre de variable
- ✅ Nodos de delay requieren tiempo > 0
- ✅ Detección de nodos huérfanos
- ✅ Límites de opciones por tipo

### Archivos Modificados:
1. ✅ `src/types/builder.ts` (NUEVO)
2. ✅ `src/hooks/useFlowValidation.ts` (NUEVO)
3. ✅ `src/components/ImprovedPropertiesPanel.tsx` (MODIFICADO)
4. ⏳ `src/components/FinalChatbotBuilder.tsx` (PENDIENTE)
5. ⏳ `src/components/nodes/CustomStartNode.tsx` (PENDIENTE)
6. ⏳ `src/components/nodes/CustomGenericNode.tsx` (PENDIENTE)

---

## ✅ Checklist para Próxima Sesión

Antes de empezar:
- [ ] Revisar este documento
- [ ] Verificar que los archivos nuevos existen
- [ ] Comprobar que no hay errores de compilación

Durante la sesión:
- [ ] Implementar useRef para auto-guardado
- [ ] Integrar useFlowValidation
- [ ] Actualizar tipos en nodos
- [ ] Testing completo

Al finalizar:
- [ ] Verificar que no hay warnings de TypeScript
- [ ] Verificar que no hay warnings de React
- [ ] Probar todas las validaciones
- [ ] Actualizar este documento con "COMPLETADO"

---

**Fecha:** Octubre 2025  
**Progreso:** 60% Completado  
**Próxima Sesión:** Completar el 40% restante  
**Tiempo Estimado:** 1.5 horas
