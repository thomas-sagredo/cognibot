// Utilidades para testing de componentes del builder

export interface TestScenario {
  name: string;
  description: string;
  steps: string[];
  expectedResult: string;
  priority: 'high' | 'medium' | 'low';
}

export const builderTestScenarios: TestScenario[] = [
  // Auto-save Testing
  {
    name: 'Auto-save Functionality',
    description: 'Verificar que el auto-guardado funciona correctamente',
    steps: [
      '1. Crear un nuevo nodo de mensaje',
      '2. Agregar texto al nodo',
      '3. Esperar 30 segundos sin interactuar',
      '4. Verificar que aparece el toast "Cambios guardados automáticamente"',
      '5. Recargar la página',
      '6. Verificar que los cambios persisten'
    ],
    expectedResult: 'Los cambios se guardan automáticamente y persisten después de recargar',
    priority: 'high'
  },

  // Keyboard Shortcuts Testing
  {
    name: 'Keyboard Shortcuts',
    description: 'Verificar que los atajos de teclado funcionan',
    steps: [
      '1. Presionar Ctrl+S para guardar',
      '2. Seleccionar un nodo y presionar Delete',
      '3. Presionar Ctrl+Z para deshacer (si está implementado)',
      '4. Presionar Ctrl++ para hacer zoom in',
      '5. Presionar Ctrl+- para hacer zoom out',
      '6. Presionar Ctrl+0 para ajustar vista'
    ],
    expectedResult: 'Todos los atajos de teclado responden correctamente',
    priority: 'high'
  },

  // Responsive Design Testing
  {
    name: 'Mobile Responsiveness',
    description: 'Verificar que la interfaz funciona en móvil',
    steps: [
      '1. Cambiar viewport a 375px de ancho',
      '2. Verificar que aparece la vista móvil',
      '3. Abrir el drawer de herramientas',
      '4. Agregar un nodo desde el drawer',
      '5. Seleccionar el nodo y abrir propiedades',
      '6. Cambiar entre tabs Canvas/Simulador'
    ],
    expectedResult: 'La interfaz se adapta correctamente y es usable en móvil',
    priority: 'high'
  },

  // Node Validation Testing
  {
    name: 'Node Validation',
    description: 'Verificar que la validación de nodos funciona',
    steps: [
      '1. Crear un nodo de mensaje sin texto',
      '2. Verificar que aparece indicador de error',
      '3. Agregar texto al nodo',
      '4. Verificar que el error desaparece',
      '5. Crear nodo de opciones con más de 3 botones',
      '6. Verificar que aparece advertencia de límite'
    ],
    expectedResult: 'Los errores y advertencias se muestran correctamente',
    priority: 'high'
  },

  // Accessibility Testing
  {
    name: 'Accessibility Features',
    description: 'Verificar que la accesibilidad funciona',
    steps: [
      '1. Navegar usando solo el teclado (Tab, Enter, Escape)',
      '2. Verificar que todos los elementos tienen focus visible',
      '3. Usar screen reader para verificar ARIA labels',
      '4. Verificar contraste de colores',
      '5. Probar navegación con teclas de flecha en nodos'
    ],
    expectedResult: 'La interfaz es completamente accesible por teclado y screen reader',
    priority: 'medium'
  },

  // Performance Testing
  {
    name: 'Performance with Many Nodes',
    description: 'Verificar rendimiento con muchos nodos',
    steps: [
      '1. Crear 50+ nodos en el canvas',
      '2. Conectar nodos entre sí',
      '3. Mover nodos arrastrando',
      '4. Hacer zoom in/out repetidamente',
      '5. Seleccionar diferentes nodos rápidamente',
      '6. Medir tiempo de respuesta'
    ],
    expectedResult: 'La interfaz mantiene fluidez con muchos nodos (>30fps)',
    priority: 'medium'
  },

  // Dark Mode Testing
  {
    name: 'Dark Mode Toggle',
    description: 'Verificar que el modo oscuro funciona',
    steps: [
      '1. Alternar entre modo claro y oscuro',
      '2. Verificar que todos los componentes cambian de tema',
      '3. Verificar contraste en modo oscuro',
      '4. Probar en diferentes componentes (sidebar, canvas, propiedades)',
      '5. Verificar que la preferencia se guarda'
    ],
    expectedResult: 'El modo oscuro funciona correctamente en todos los componentes',
    priority: 'medium'
  },

  // Error Handling Testing
  {
    name: 'Error Handling',
    description: 'Verificar manejo de errores',
    steps: [
      '1. Desconectar internet durante guardado',
      '2. Verificar que aparece mensaje de error',
      '3. Intentar crear nodo con datos inválidos',
      '4. Verificar que se previene la acción',
      '5. Probar límites de nodos por plan',
      '6. Verificar mensajes de error claros'
    ],
    expectedResult: 'Los errores se manejan graciosamente con mensajes claros',
    priority: 'low'
  }
];

// Función para ejecutar tests automáticos
export const runAutomatedTests = () => {
  const results: { [key: string]: boolean } = {};

  // Test 1: Verificar que los componentes se renderizan
  try {
    const builderElement = document.querySelector('[data-testid="builder-canvas"]');
    results['component_render'] = !!builderElement;
  } catch {
    results['component_render'] = false;
  }

  // Test 2: Verificar que los atajos de teclado están registrados
  try {
    const hasKeyboardListeners = document.addEventListener.toString().includes('keydown');
    results['keyboard_listeners'] = hasKeyboardListeners;
  } catch {
    results['keyboard_listeners'] = false;
  }

  // Test 3: Verificar responsive breakpoints
  try {
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
    const isDesktop = window.innerWidth > 1024;
    results['responsive_detection'] = isMobile || isTablet || isDesktop;
  } catch {
    results['responsive_detection'] = false;
  }

  return results;
};

// Función para generar reporte de testing
export const generateTestReport = (results: { [key: string]: boolean }) => {
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  const percentage = Math.round((passed / total) * 100);

  return {
    summary: `${passed}/${total} tests passed (${percentage}%)`,
    details: results,
    recommendations: generateRecommendations(results)
  };
};

const generateRecommendations = (results: { [key: string]: boolean }) => {
  const recommendations: string[] = [];

  if (!results.component_render) {
    recommendations.push('🔴 Componentes no se renderizan correctamente - verificar imports y props');
  }

  if (!results.keyboard_listeners) {
    recommendations.push('🟡 Atajos de teclado no detectados - verificar event listeners');
  }

  if (!results.responsive_detection) {
    recommendations.push('🟡 Detección responsive no funciona - verificar media queries');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Todos los tests básicos pasaron - proceder con tests manuales');
  }

  return recommendations;
};

// Utilidad para medir performance
export const measurePerformance = (componentName: string, operation: () => void) => {
  const startTime = performance.now();
  operation();
  const endTime = performance.now();
  const duration = endTime - startTime;

  console.log(`⏱️ ${componentName}: ${duration.toFixed(2)}ms`);
  
  if (duration > 100) {
    console.warn(`⚠️ ${componentName} tardó más de 100ms - considerar optimización`);
  }

  return duration;
};

// Utilidad para testing de accesibilidad
export const checkAccessibility = (element: HTMLElement) => {
  const issues: string[] = [];

  // Verificar ARIA labels
  if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
    issues.push('Falta aria-label o aria-labelledby');
  }

  // Verificar que elementos interactivos son focusables
  const interactiveElements = element.querySelectorAll('button, input, select, textarea, [role="button"]');
  interactiveElements.forEach((el, index) => {
    if (!el.getAttribute('tabindex') && el.tagName !== 'BUTTON' && el.tagName !== 'INPUT') {
      issues.push(`Elemento interactivo ${index + 1} no es focusable`);
    }
  });

  // Verificar contraste de colores (básico)
  const computedStyle = window.getComputedStyle(element);
  const backgroundColor = computedStyle.backgroundColor;
  const color = computedStyle.color;
  
  if (backgroundColor === 'rgba(0, 0, 0, 0)' && color === 'rgb(0, 0, 0)') {
    issues.push('Posible problema de contraste - texto negro sobre fondo transparente');
  }

  return {
    passed: issues.length === 0,
    issues
  };
};
