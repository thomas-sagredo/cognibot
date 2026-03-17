import { useState, useCallback, useRef, useEffect } from 'react';
import { Node, Edge, useNodesState, useEdgesState, addEdge, Connection } from '@xyflow/react';
import { NodeType, Variable } from '@/types/chatbot';
import { NodeData } from '@/types/builder';
import { toast } from 'sonner';

interface UseBuilderStateReturn {
  // Estado de nodos y edges
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: Connection) => void;
  
  // Nodo seleccionado
  selectedNode: Node | null;
  setSelectedNode: (node: Node | null) => void;
  
  // UI State
  showAddMenu: boolean;
  setShowAddMenu: (show: boolean) => void;
  addMenuPosition: { x: number; y: number };
  setAddMenuPosition: (pos: { x: number; y: number }) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  activeNodeForAdd: string | null;
  setActiveNodeForAdd: (nodeId: string | null) => void;
  
  // Sidebar state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  activeSidebarItem: string | null;
  setActiveSidebarItem: (item: string | null) => void;
  
  // Theme
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  
  // Simulator
  showSimulator: boolean;
  setShowSimulator: (show: boolean) => void;
  
  // Variables
  variables: Variable[];
  setVariables: (variables: Variable[]) => void;
  
  // Welcome message
  welcomeMessage: string;
  setWelcomeMessage: (message: string) => void;
  
  // Auto-save
  lastSaved: Date;
  setLastSaved: (date: Date) => void;
  
  // Operations
  addNode: (type: NodeType, subtype?: string, label?: string) => void;
  updateNode: (nodeId: string, newData: Partial<NodeData>) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  
  // Initialization
  initializeWithWelcomeMessage: (message: string) => void;
}

export const useBuilderState = (): UseBuilderStateReturn => {
  // Función para crear nodo inicial
  const createInitialNode = useCallback((message: string): Node => ({
    id: 'start-initial',
    type: 'start',
    position: { x: 400, y: 100 },
    data: {
      label: 'Inicio de conversación',
      text: message,
    },
    draggable: false,
    deletable: false,
  }), []);

  // Estados de ReactFlow
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Estados de UI
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuPosition, setAddMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeNodeForAdd, setActiveNodeForAdd] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [welcomeMessage, setWelcomeMessage] = useState('¡Bienvenido! ¿En qué puedo ayudarte?');
  const [lastSaved, setLastSaved] = useState<Date>(new Date());

  // Inicializar con mensaje de bienvenida
  const initializeWithWelcomeMessage = useCallback((message: string) => {
    setWelcomeMessage(message);
    setNodes([createInitialNode(message)]);
  }, [createInitialNode, setNodes]);

  // Inicialización por defecto
  useEffect(() => {
    if (nodes.length === 0) {
      initializeWithWelcomeMessage(welcomeMessage);
    }
  }, [nodes.length, welcomeMessage, initializeWithWelcomeMessage]);

  // Manejar conexiones
  const onConnect = useCallback((params: Connection) => {
    const newEdge = {
      ...params,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      markerEnd: {
        type: 'arrowclosed' as const,
        color: '#3b82f6',
      },
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);

  // Operaciones de nodos
  const addNode = useCallback((type: NodeType, subtype?: string, label?: string) => {
    const sourceNode = nodes.find(n => n.id === activeNodeForAdd);
    
    let position;
    if (sourceNode) {
      position = {
        x: sourceNode.position.x,
        y: sourceNode.position.y + 200,
      };
    } else {
      position = { x: 400, y: 300 };
    }

    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: {
        label: label || subtype || type.charAt(0).toUpperCase() + type.slice(1),
        text: '',
        options: [],
        subtype: subtype || 'text',
      },
      draggable: false,
    };

    setNodes((nds) => [...nds, newNode]);

    // Conectar automáticamente si hay un nodo fuente
    if (sourceNode) {
      const newEdge = {
        id: `${sourceNode.id}-${newNode.id}`,
        source: sourceNode.id,
        target: newNode.id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        markerEnd: {
          type: 'arrowclosed' as const,
          color: '#3b82f6',
        },
      };
      setEdges((eds) => [...eds, newEdge]);
    }

    setShowAddMenu(false);
    setActiveNodeForAdd(null);
    setSelectedCategory(null);
    
    toast.success(`Nodo ${label || type} agregado`);
  }, [nodes, activeNodeForAdd, setNodes, setEdges]);

  const updateNode = useCallback((nodeId: string, newData: Partial<NodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
  }, [setNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    if (nodeId === 'start-initial') {
      toast.error('No puedes eliminar el nodo de inicio');
      return;
    }

    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => 
      edge.source !== nodeId && edge.target !== nodeId
    ));
    
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
    
    toast.success('Nodo eliminado');
  }, [setNodes, setEdges, selectedNode]);

  const duplicateNode = useCallback((nodeId: string) => {
    const nodeToDuplicate = nodes.find(n => n.id === nodeId);
    if (!nodeToDuplicate) return;

    const newNode: Node = {
      ...nodeToDuplicate,
      id: `${nodeToDuplicate.type}-${Date.now()}`,
      position: {
        x: nodeToDuplicate.position.x + 50,
        y: nodeToDuplicate.position.y + 50,
      },
      data: {
        ...nodeToDuplicate.data,
        label: `${nodeToDuplicate.data.label} (copia)`,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    toast.success('Nodo duplicado');
  }, [nodes, setNodes]);

  return {
    // Estado de nodos y edges
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    
    // Nodo seleccionado
    selectedNode,
    setSelectedNode,
    
    // UI State
    showAddMenu,
    setShowAddMenu,
    addMenuPosition,
    setAddMenuPosition,
    selectedCategory,
    setSelectedCategory,
    activeNodeForAdd,
    setActiveNodeForAdd,
    
    // Sidebar state
    sidebarCollapsed,
    setSidebarCollapsed,
    activeSidebarItem,
    setActiveSidebarItem,
    
    // Theme
    darkMode,
    setDarkMode,
    
    // Simulator
    showSimulator,
    setShowSimulator,
    
    // Variables
    variables,
    setVariables,
    
    // Welcome message
    welcomeMessage,
    setWelcomeMessage,
    
    // Auto-save
    lastSaved,
    setLastSaved,
    
    // Operations
    addNode,
    updateNode,
    deleteNode,
    duplicateNode,
    
    // Initialization
    initializeWithWelcomeMessage,
  };
};
