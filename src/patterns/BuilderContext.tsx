import React, { createContext, useContext, ReactNode } from 'react';
import { Node, Edge } from '@xyflow/react';

// Patrón Context + Provider para desacoplar estado
interface BuilderContextValue {
  // Estado core
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  
  // Acciones
  actions: {
    addNode: (type: string, subtype?: string) => void;
    updateNode: (id: string, data: Record<string, unknown>) => void;
    deleteNode: (id: string) => void;
    selectNode: (node: Node | null) => void;
    connectNodes: (source: string, target: string) => void;
  };
  
  // Estado UI
  ui: {
    darkMode: boolean;
    sidebarCollapsed: boolean;
    showSimulator: boolean;
    activePanel: string | null;
  };
  
  // Configuración
  config: {
    maxNodes: number;
    autoSave: boolean;
    validationEnabled: boolean;
  };
}

const BuilderContext = createContext<BuilderContextValue | null>(null);

// Hook personalizado con validación
export const useBuilderContext = () => {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error('useBuilderContext must be used within BuilderProvider');
  }
  return context;
};

// Provider con composición
interface BuilderProviderProps {
  children: ReactNode;
  initialConfig?: Partial<BuilderContextValue['config']>;
}

export const BuilderProvider: React.FC<BuilderProviderProps> = ({ 
  children, 
  initialConfig 
}) => {
  const [nodes, setNodes] = React.useState<Node[]>([]);
  const [edges, setEdges] = React.useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = React.useState<Node | null>(null);

  const value: BuilderContextValue = {
    nodes,
    edges,
    selectedNode,
    actions: {
      addNode: (type: string, subtype?: string) => {
        // Implementación básica
        console.log('Adding node:', type, subtype);
      },
      updateNode: (id: string, data: Record<string, unknown>) => {
        console.log('Updating node:', id, data);
      },
      deleteNode: (id: string) => {
        console.log('Deleting node:', id);
      },
      selectNode: (node: Node | null) => {
        setSelectedNode(node);
      },
      connectNodes: (source: string, target: string) => {
        console.log('Connecting nodes:', source, target);
      },
    },
    ui: {
      darkMode: false,
      sidebarCollapsed: false,
      showSimulator: false,
      activePanel: null,
    },
    config: {
      maxNodes: 1000,
      autoSave: true,
      validationEnabled: true,
      ...initialConfig,
    },
  };

  return (
    <BuilderContext.Provider value={value}>
      {children}
    </BuilderContext.Provider>
  );
};

// Patrón Compound Components para mejor composición
export const Builder = {
  Root: BuilderProvider,
  // Canvas: React.lazy(() => import('../components/builder/BuilderCanvas')),
  // Sidebar: React.lazy(() => import('../components/builder/BuilderSidebar')),
  // Toolbar: React.lazy(() => import('../components/builder/BuilderToolbar')),
  // Properties: React.lazy(() => import('../components/builder/PropertiesPanel')),
};

// Uso:
// <Builder.Root>
//   <Builder.Toolbar />
//   <Builder.Canvas />
//   <Builder.Sidebar />
// </Builder.Root>
