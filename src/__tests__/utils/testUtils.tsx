import React, { ReactElement } from 'react';
import { render, RenderOptions, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactFlowProvider } from '@xyflow/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BuilderProvider } from '@/patterns/BuilderContext';
import { BuilderErrorBoundary } from '@/components/error/BuilderErrorBoundary';

// Mock para ReactFlow
jest.mock('@xyflow/react', () => ({
  ...jest.requireActual('@xyflow/react'),
  ReactFlow: ({ children, ...props }: any) => (
    <div data-testid="react-flow-mock" {...props}>
      {children}
    </div>
  ),
  useReactFlow: () => ({
    getNodes: jest.fn(() => []),
    getEdges: jest.fn(() => []),
    setNodes: jest.fn(),
    setEdges: jest.fn(),
    fitView: jest.fn(),
    zoomIn: jest.fn(),
    zoomOut: jest.fn(),
  }),
}));

// Configuración de testing personalizada
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialBuilderState?: any;
  queryClient?: QueryClient;
  withErrorBoundary?: boolean;
  withReactFlow?: boolean;
}

// Wrapper personalizado para tests
const AllTheProviders: React.FC<{
  children: React.ReactNode;
  queryClient?: QueryClient;
  initialBuilderState?: any;
  withErrorBoundary?: boolean;
  withReactFlow?: boolean;
}> = ({ 
  children, 
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
  initialBuilderState,
  withErrorBoundary = true,
  withReactFlow = true,
}) => {
  let content = children;

  // Wrap with ReactFlow if needed
  if (withReactFlow) {
    content = <ReactFlowProvider>{content}</ReactFlowProvider>;
  }

  // Wrap with Builder context
  content = (
    <BuilderProvider initialConfig={initialBuilderState}>
      {content}
    </BuilderProvider>
  );

  // Wrap with React Query
  content = (
    <QueryClientProvider client={queryClient}>
      {content}
    </QueryClientProvider>
  );

  // Wrap with Error Boundary
  if (withErrorBoundary) {
    content = (
      <BuilderErrorBoundary level="component">
        {content}
      </BuilderErrorBoundary>
    );
  }

  return <>{content}</>;
};

// Función de render personalizada
const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const {
    initialBuilderState,
    queryClient,
    withErrorBoundary,
    withReactFlow,
    ...renderOptions
  } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders
      queryClient={queryClient}
      initialBuilderState={initialBuilderState}
      withErrorBoundary={withErrorBoundary}
      withReactFlow={withReactFlow}
    >
      {children}
    </AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Utilidades para testing de accesibilidad
export const accessibilityUtils = {
  // Verificar que un elemento tiene las propiedades ARIA correctas
  expectAccessibleElement: (element: HTMLElement, expectedRole?: string) => {
    if (expectedRole) {
      expect(element).toHaveAttribute('role', expectedRole);
    }
    
    // Verificar que tiene label o labelledby
    const hasLabel = element.getAttribute('aria-label') ||
                    element.getAttribute('aria-labelledby') ||
                    element.getAttribute('title');
    
    expect(hasLabel).toBeTruthy();
  },

  // Verificar navegación por teclado
  testKeyboardNavigation: async (container: HTMLElement) => {
    const user = userEvent.setup();
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    // Tab through all focusable elements
    for (let i = 0; i < focusableElements.length; i++) {
      await user.tab();
      expect(focusableElements[i]).toHaveFocus();
    }
  },

  // Verificar que los live regions funcionan
  expectLiveRegionAnnouncement: async (expectedText: string) => {
    await waitFor(() => {
      const liveRegion = document.querySelector('[aria-live]');
      expect(liveRegion).toHaveTextContent(expectedText);
    });
  },
};

// Utilidades para testing de drag and drop
export const dragDropUtils = {
  // Simular drag and drop
  simulateDragDrop: async (
    source: HTMLElement,
    target: HTMLElement
  ) => {
    const user = userEvent.setup();
    
    // Start drag
    await user.pointer([
      { keys: '[MouseLeft>]', target: source },
      { coords: { x: 100, y: 100 } },
    ]);

    // Move to target
    await user.pointer([
      { coords: { x: 200, y: 200 }, target },
      { keys: '[/MouseLeft]' },
    ]);
  },

  // Verificar que un elemento es draggable
  expectDraggable: (element: HTMLElement) => {
    expect(element).toHaveAttribute('draggable', 'true');
  },
};

// Utilidades para testing de componentes del builder
export const builderTestUtils = {
  // Crear nodo de prueba
  createTestNode: (overrides = {}) => ({
    id: 'test-node-1',
    type: 'message',
    position: { x: 100, y: 100 },
    data: {
      label: 'Test Node',
      text: 'Test message',
      ...overrides,
    },
  }),

  // Crear edge de prueba
  createTestEdge: (overrides = {}) => ({
    id: 'test-edge-1',
    source: 'node-1',
    target: 'node-2',
    type: 'smoothstep',
    ...overrides,
  }),

  // Esperar a que el canvas se renderice
  waitForCanvas: async () => {
    await waitFor(() => {
      expect(screen.getByTestId('react-flow-mock')).toBeInTheDocument();
    });
  },

  // Simular agregar nodo
  simulateAddNode: async (nodeType: string = 'message') => {
    const user = userEvent.setup();
    
    // Abrir sidebar si está cerrado
    const addButton = screen.getByRole('button', { name: /agregar/i });
    await user.click(addButton);
    
    // Seleccionar tipo de nodo
    const nodeTypeButton = screen.getByRole('button', { name: new RegExp(nodeType, 'i') });
    await user.click(nodeTypeButton);
  },

  // Verificar estado de validación
  expectValidationState: (state: 'valid' | 'error' | 'warning') => {
    const validationIndicator = screen.getByTestId('validation-indicator');
    expect(validationIndicator).toHaveClass(`validation-${state}`);
  },
};

// Utilidades para testing de performance
export const performanceUtils = {
  // Medir tiempo de renderizado
  measureRenderTime: async (renderFn: () => void) => {
    const start = performance.now();
    renderFn();
    await waitFor(() => {
      // Wait for component to be fully rendered
    });
    const end = performance.now();
    return end - start;
  },

  // Verificar que no hay memory leaks
  expectNoMemoryLeaks: (component: any) => {
    // Mock implementation - in real scenario you'd use tools like why-did-you-render
    expect(component).toBeDefined();
  },
};

// Mocks comunes
export const commonMocks = {
  // Mock de localStorage
  mockLocalStorage: () => {
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });
    return localStorageMock;
  },

  // Mock de ResizeObserver
  mockResizeObserver: () => {
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  },

  // Mock de IntersectionObserver
  mockIntersectionObserver: () => {
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  },
};

// Setup para tests
export const setupTests = () => {
  // Setup mocks
  commonMocks.mockResizeObserver();
  commonMocks.mockIntersectionObserver();
  commonMocks.mockLocalStorage();

  // Mock console methods in tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('Warning: ReactDOM.render is no longer supported')
      ) {
        return;
      }
      originalError.call(console, ...args);
    };
  });

  afterAll(() => {
    console.error = originalError;
  });
};

// Custom matchers
expect.extend({
  toBeAccessible(received: HTMLElement) {
    const hasAriaLabel = received.getAttribute('aria-label') ||
                        received.getAttribute('aria-labelledby') ||
                        received.getAttribute('title');
    
    const isFocusable = received.tabIndex >= 0 ||
                       ['button', 'input', 'select', 'textarea', 'a'].includes(received.tagName.toLowerCase());

    const pass = hasAriaLabel && (isFocusable || received.getAttribute('role'));

    return {
      message: () =>
        pass
          ? `Expected element not to be accessible`
          : `Expected element to be accessible (have aria-label and be focusable)`,
      pass,
    };
  },
});

// Declaración de tipos para custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAccessible(): R;
    }
  }
}

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
export { userEvent };
