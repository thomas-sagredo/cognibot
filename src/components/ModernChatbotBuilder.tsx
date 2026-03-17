import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './ModernBuilder.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Bot,
  MessageSquare,
  MousePointer,
  Cpu,
  GitBranch,
  StopCircle,
  Play,
  Save,
  Zap,
  Loader2,
  Timer,
  Keyboard,
  Plus,
  Moon,
  Sun,
  ChevronRight,
  ChevronLeft,
  Settings,
  Database,
  Code,
  List,
  Workflow,
  Image as ImageIcon,
  Mic,
  File,
  Sticker,
  MessageCircle,
  ListOrdered,
  SquareStack,
  FormInput,
  Blocks,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { NodeToolbar } from './NodeToolbar';
import { PropertiesPanel } from './PropertiesPanel';
import { ChatSimulator } from './ChatSimulator';
import { VariablesPanel } from './VariablesPanel';
import { WhatsAppIntegration } from './WhatsAppIntegration';
import { ChatbotNode, NodeType, UserProfile, Variable } from '@/types/chatbot';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api';

// Custom node components
import { StartNodeComponent } from './nodes/StartNode';
import { MessageNodeComponent } from './nodes/MessageNode';
import { OptionNodeComponent } from './nodes/OptionNode';
import { ActionNodeComponent } from './nodes/ActionNode';
import { ConditionNodeComponent } from './nodes/ConditionNode';
import { EndNodeComponent } from './nodes/EndNode';
import { InputNodeComponent } from './nodes/InputNode';
import { DelayNodeComponent } from './nodes/DelayNode';

const nodeTypes = {
  start: StartNodeComponent,
  message: MessageNodeComponent,
  option: OptionNodeComponent,
  action: ActionNodeComponent,
  condition: ConditionNodeComponent,
  end: EndNodeComponent,
  input: InputNodeComponent,
  delay: DelayNodeComponent,
};

// Configuración de tipos de nodos con categorías
const nodeCategories = [
  {
    id: 'bot-response',
    label: 'Agregar respuesta del bot',
    icon: Bot,
    color: 'blue',
    options: [
      { type: 'message', label: 'Mensaje de texto', icon: MessageSquare, description: 'Envía un mensaje de texto' },
      { type: 'message', label: 'Mensaje de audio', icon: Mic, description: 'Envía un mensaje de audio' },
      { type: 'message', label: 'Imagen', icon: ImageIcon, description: 'Envía una imagen' },
      { type: 'message', label: 'Video', icon: Play, description: 'Envía un video' },
      { type: 'message', label: 'Archivo', icon: File, description: 'Envía un archivo' },
      { type: 'message', label: 'Sticker', icon: Sticker, description: 'Envía un sticker' },
    ],
  },
  {
    id: 'user-input',
    label: 'Agregar entrada del usuario',
    icon: Keyboard,
    color: 'green',
    options: [
      { type: 'input', label: 'Lenguaje natural', icon: MessageCircle, description: 'Ejecuta flujo cuando el usuario dice la frase configurada' },
      { type: 'option', label: 'Lista de Opciones', icon: ListOrdered, description: 'Muestra hasta 10 opciones. No permite llamadas y URLs' },
      { type: 'option', label: 'Botones', icon: SquareStack, description: 'Muestra hasta 3 botones. Permite llamadas y URLs' },
      { type: 'input', label: 'Formulario', icon: FormInput, description: 'Hace una pregunta y guarda la respuesta' },
      { type: 'option', label: 'Carrousel', icon: Blocks, description: 'Muestra hasta 10 tarjetas con opciones', disabled: true },
      { type: 'option', label: 'WhatsApp flow', icon: Workflow, description: 'Presenta un flujo de WhatsApp y guarda la respuesta' },
    ],
  },
  {
    id: 'action',
    label: 'Agregar acción',
    icon: Zap,
    color: 'orange',
    options: [
      { type: 'action', label: 'Ejecutar acción', icon: Cpu, description: 'Ejecuta acciones y variables' },
      { type: 'delay', label: 'Esperar', icon: Timer, description: 'Pausa el flujo por un tiempo' },
    ],
  },
  {
    id: 'condition',
    label: 'Agregar condición',
    icon: GitBranch,
    color: 'yellow',
    options: [
      { type: 'condition', label: 'Condición', icon: GitBranch, description: 'Bifurca el flujo según condiciones' },
    ],
  },
];

const sidebarItems = [
  { id: 'identity', label: 'Identidad y preferencias', icon: Settings },
  { id: 'integrations', label: 'Asignación de bots a canales', icon: Zap },
  { id: 'content', label: 'Base de contenidos', icon: Database },
  { id: 'code', label: 'Acciones de código', icon: Code },
  { id: 'variables', label: 'Variables', icon: List },
  { id: 'whatsapp', label: 'WhatsApp Flows', icon: Workflow },
  { id: 'segments', label: 'Segmentos', icon: List },
];

const ModernBuilderContent = () => {
  // Nodo inicial fijo
  const initialNode: Node = {
    id: 'start-initial',
    type: 'start',
    position: { x: 250, y: 50 },
    data: {
      label: 'Inicio de conversación',
      text: '¡Bienvenido! ¿En qué puedo ayudarte?',
    },
    draggable: false, // No se puede mover
    deletable: false, // No se puede eliminar
  };

  const [nodes, setNodes, onNodesChange] = useNodesState([initialNode]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuPosition, setAddMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [variables, setVariables] = useState<Variable[]>([]);
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const reactFlowInstance = useReactFlow();

  // Aplicar tema oscuro
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // No permitir seleccionar el nodo inicial para edición
    if (node.id === 'start-initial') {
      return;
    }
    setSelectedNode(node);
  }, []);

  // Proteger el nodo inicial de eliminación
  const onNodesDelete = useCallback((deleted: Node[]) => {
    const hasInitialNode = deleted.some(node => node.id === 'start-initial');
    if (hasInitialNode) {
      toast.error('No puedes eliminar el nodo de inicio de conversación');
      return;
    }
  }, []);

  const addNode = useCallback((type: NodeType, subtype?: string) => {
    // Calcular posición debajo del último nodo o del nodo inicial
    let position;
    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      position = {
        x: lastNode.position.x,
        y: lastNode.position.y + 150,
      };
    } else {
      position = reactFlowInstance.screenToFlowPosition({
        x: addMenuPosition.x,
        y: addMenuPosition.y,
      });
    }

    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        text: '',
        options: [],
        subtype: subtype || 'text',
      },
    };

    setNodes((nds) => [...nds, newNode]);
    
    // Si hay un nodo inicial, conectar automáticamente el nuevo nodo
    if (nodes.length === 1 && nodes[0].id === 'start-initial') {
      const newEdge = {
        id: `edge-${nodes[0].id}-${newNode.id}`,
        source: nodes[0].id,
        target: newNode.id,
      };
      setEdges((eds) => [...eds, newEdge]);
    }
    
    setShowAddMenu(false);
    setSelectedCategory(null);
  }, [addMenuPosition, reactFlowInstance, setNodes, nodes, setEdges]);

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('react-flow__pane')) {
      setSelectedNode(null);
      setShowAddMenu(false);
      setSelectedCategory(null);
    }
  }, []);

  const handleAddButtonClick = useCallback((event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setAddMenuPosition({ x: rect.left, y: rect.top });
    setShowAddMenu(!showAddMenu);
    setSelectedCategory(null);
  }, [showAddMenu]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const chatbotData = {
        nombre: 'Mi Chatbot',
        descripcion: 'Chatbot creado con el constructor',
        configuracion: {
          nodes,
          edges,
          variables,
          settings: {
            nombre: 'Mi Chatbot',
            descripcion: 'Chatbot creado con el constructor',
          },
        },
      };
      return apiService.saveChatbot(chatbotData);
    },
    onSuccess: () => {
      toast.success('Chatbot guardado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
    },
    onError: (error: Error) => {
      toast.error(`Error al guardar: ${error.message}`);
    },
  });

  return (
    <div className={`h-screen flex ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar colapsable */}
      <div
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col`}
      >
        {/* Header del sidebar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          {!sidebarCollapsed && (
            <h2 className="font-semibold text-gray-900 dark:text-white">Constructor</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Items del sidebar */}
        <div className="flex-1 overflow-y-auto py-4">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSidebarItem(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                activeSidebarItem === item.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </div>

        {/* Footer del sidebar con modo nocturno */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDarkMode(!darkMode)}
            className="w-full justify-start gap-3"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {!sidebarCollapsed && <span>{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>}
          </Button>
        </div>
      </div>

      {/* Área principal del canvas */}
      <div className="flex-1 relative bg-gray-50 dark:bg-gray-950">
        {/* Barra superior */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Mi Chatbot</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSimulator(!showSimulator)}
            >
              <Play className="w-4 h-4 mr-2" />
              Probar
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar
            </Button>
          </div>
        </div>

        {/* ReactFlow Canvas */}
        <div className="h-full pt-16" onClick={handleCanvasClick}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodesDelete={onNodesDelete}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50 dark:bg-gray-950"
          >
            <Background className="dark:opacity-20" />
            <Controls className="dark:bg-gray-800 dark:border-gray-700" />
            <MiniMap className="dark:bg-gray-800 dark:border-gray-700" />
          </ReactFlow>
        </div>

        {/* Botón flotante + para agregar nodos */}
        <button
          onClick={handleAddButtonClick}
          className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-20"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Menú contextual de categorías */}
        {showAddMenu && !selectedCategory && (
          <div
            className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-30"
            style={{
              left: `${addMenuPosition.x - 250}px`,
              top: `${addMenuPosition.y - 200}px`,
              width: '280px',
            }}
          >
            {nodeCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <div className={`w-8 h-8 rounded-full bg-${category.color}-100 dark:bg-${category.color}-900/30 flex items-center justify-center`}>
                  <category.icon className={`w-4 h-4 text-${category.color}-600 dark:text-${category.color}-400`} />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{category.label}</span>
                <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />
              </button>
            ))}
          </div>
        )}

        {/* Submenú de opciones */}
        {showAddMenu && selectedCategory && (
          <div
            className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-30"
            style={{
              left: `${addMenuPosition.x - 250}px`,
              top: `${addMenuPosition.y - 200}px`,
              width: '320px',
            }}
          >
            <button
              onClick={() => setSelectedCategory(null)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="w-4 h-4" />
              Volver
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
            {nodeCategories
              .find((cat) => cat.id === selectedCategory)
              ?.options.map((option) => (
                <button
                  key={option.label}
                  onClick={() => !option.disabled && addNode(option.type as NodeType, option.label)}
                  disabled={option.disabled}
                  className={`w-full flex items-start gap-3 px-4 py-3 transition-colors text-left ${
                    option.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <option.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{option.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{option.description}</div>
                  </div>
                </button>
              ))}
          </div>
        )}

        {/* Panel de propiedades */}
        {selectedNode && (
          <div className="absolute top-16 right-0 w-96 h-[calc(100%-4rem)] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-y-auto">
            <PropertiesPanel
              selectedNode={selectedNode}
              onUpdateNode={(nodeId, data) => {
                setNodes((nds) =>
                  nds.map((node) => (node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node))
                );
              }}
              variables={variables}
            />
          </div>
        )}

        {/* Simulador de chat */}
        {showSimulator && (
          <div className="absolute top-16 right-0 w-96 h-[calc(100%-4rem)] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
            <ChatSimulator 
              isOpen={showSimulator}
              nodes={nodes} 
              edges={edges} 
              onClose={() => setShowSimulator(false)} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export const ModernChatbotBuilder = () => {
  return (
    <ReactFlowProvider>
      <ModernBuilderContent />
    </ReactFlowProvider>
  );
};
