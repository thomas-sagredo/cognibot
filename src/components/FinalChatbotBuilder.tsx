import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './ModernBuilder.css';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Bot,
  MessageSquare,
  MousePointer,
  Cpu,
  GitBranch,
  Play,
  Save,
  Loader2,
  Timer,
  Keyboard,
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
  Edit3,
  Zap,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CustomStartNode } from './nodes/CustomStartNode';
import { CustomGenericNode } from './nodes/CustomGenericNode';
import { ImprovedPropertiesPanel } from './ImprovedPropertiesPanel';
import { ChatSimulator } from './ChatSimulator';
import { NodeType, Variable } from '@/types/chatbot';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api';
import { useFlowValidation } from '@/hooks/useFlowValidation';
import { AUTO_SAVE_INTERVAL } from '@/types/builder';

const nodeTypes = {
  start: CustomStartNode,
  message: CustomGenericNode,
  option: CustomGenericNode,
  action: CustomGenericNode,
  condition: CustomGenericNode,
  input: CustomGenericNode,
  delay: CustomGenericNode,
};

// Configuración de tipos de nodos
const nodeCategories = [
  {
    id: 'bot-response',
    label: 'Agregar respuesta del bot',
    icon: Bot,
    color: 'blue',
    options: [
      { type: 'message', label: 'Mensaje de texto', icon: MessageSquare, description: 'Envía un mensaje de texto', subtype: 'text' },
      { type: 'message', label: 'Mensaje de audio', icon: Mic, description: 'Envía un mensaje de audio', subtype: 'audio' },
      { type: 'message', label: 'Imagen', icon: ImageIcon, description: 'Envía una imagen', subtype: 'image' },
      { type: 'message', label: 'Video', icon: Play, description: 'Envía un video', subtype: 'video' },
      { type: 'message', label: 'Documento', icon: File, description: 'Envía un documento', subtype: 'document' },
      { type: 'message', label: 'Sticker', icon: Sticker, description: 'Envía un sticker', subtype: 'sticker' },
    ],
  },
  {
    id: 'user-input',
    label: 'Agregar entrada del usuario',
    icon: Keyboard,
    color: 'green',
    options: [
      { type: 'input', label: 'Texto libre', icon: MessageCircle, description: 'Captura texto del usuario', subtype: 'text' },
      { type: 'option', label: 'Lista de opciones', icon: ListOrdered, description: 'Hasta 10 opciones', subtype: 'list' },
      { type: 'option', label: 'Botones rápidos', icon: SquareStack, description: 'Hasta 3 botones', subtype: 'buttons' },
      { type: 'input', label: 'Pregunta', icon: FormInput, description: 'Pregunta y guarda respuesta', subtype: 'question' },
    ],
  },
  {
    id: 'action',
    label: 'Agregar acción',
    icon: Zap,
    color: 'orange',
    options: [
      { type: 'action', label: 'Asignar variable', icon: Cpu, description: 'Asigna valor a variable', subtype: 'set_variable' },
      { type: 'action', label: 'Llamar API', icon: Zap, description: 'Llama a una API externa', subtype: 'api_call' },
      { type: 'delay', label: 'Esperar', icon: Timer, description: 'Pausa el flujo', subtype: 'delay' },
    ],
  },
  {
    id: 'condition',
    label: 'Agregar condición',
    icon: GitBranch,
    color: 'yellow',
    options: [
      { type: 'condition', label: 'Condición', icon: GitBranch, description: 'Bifurca según condición', subtype: 'if' },
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
];

const FinalBuilderContent = () => {
  const [welcomeMessage, setWelcomeMessage] = useState('¡Bienvenido! ¿En qué puedo ayudarte?');
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [tempWelcomeMessage, setTempWelcomeMessage] = useState(welcomeMessage);

  const createInitialNode = (message: string): Node => ({
    id: 'start-initial',
    type: 'start',
    position: { x: 400, y: 100 },
    data: {
      label: 'Inicio de conversación',
      text: message,
    },
    draggable: false,
    deletable: false,
  });

  const [nodes, setNodes, onNodesChange] = useNodesState([createInitialNode(welcomeMessage)]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
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
  const [lastSaved, setLastSaved] = useState<Date>(new Date());

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const reactFlowInstance = useReactFlow();
  const autoSaveRef = useRef<NodeJS.Timeout>();

  // Validación del flujo
  const { errors, stats, hasErrors, hasWarnings, isValid } = useFlowValidation(nodes, edges);

  // Escuchar evento personalizado del botón + en los nodos
  useEffect(() => {
    const handleAddFromNode = (e: Event) => {
      const customEvent = e as CustomEvent<{ sourceNodeId: string }>;
      const { sourceNodeId } = customEvent.detail;
      setActiveNodeForAdd(sourceNodeId);

      // Posicionar el menú cerca del nodo
      const nodeElement = document.querySelector(`[data-id="${sourceNodeId}"]`);
      if (nodeElement) {
        const rect = nodeElement.getBoundingClientRect();
        setAddMenuPosition({
          x: rect.left + rect.width / 2,
          y: rect.bottom + 20
        });
        setShowAddMenu(true);
      }
    };

    window.addEventListener('addNodeFromHandle', handleAddFromNode);
    return () => window.removeEventListener('addNodeFromHandle', handleAddFromNode);
  }, []);

  // Auto-guardado cada 30 segundos
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
  }, []); // Sin dependencias - usa ref para evitar recrear el interval

  // Aplicar tema oscuro
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const updateWelcomeMessage = useCallback(() => {
    setWelcomeMessage(tempWelcomeMessage);
    setNodes((nds) =>
      nds.map((node) =>
        node.id === 'start-initial'
          ? { ...node, data: { ...node.data, text: tempWelcomeMessage } }
          : node
      )
    );
    setShowWelcomeDialog(false);
    toast.success('Mensaje de bienvenida actualizado');
  }, [tempWelcomeMessage, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#3b82f6',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.id === 'start-initial') {
      return;
    }
    setSelectedNode(node);
  }, []);

  const onNodesDelete = useCallback((deleted: Node[]) => {
    const hasInitialNode = deleted.some(node => node.id === 'start-initial');
    if (hasInitialNode) {
      toast.error('No puedes eliminar el nodo de inicio de conversación');
      return;
    }
  }, []);

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

    // Conectar automáticamente al nodo fuente
    if (activeNodeForAdd) {
      const newEdge = {
        id: `edge-${activeNodeForAdd}-${newNode.id}`,
        source: activeNodeForAdd,
        target: newNode.id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#3b82f6',
        },
      };
      setEdges((eds) => [...eds, newEdge]);
    }

    setShowAddMenu(false);
    setSelectedCategory(null);
    setActiveNodeForAdd(null);

    // Seleccionar automáticamente el nuevo nodo para editarlo
    setTimeout(() => {
      setSelectedNode(newNode);
    }, 100);
  }, [activeNodeForAdd, nodes, setNodes, setEdges]);

  const handleSave = useCallback(() => {
    const chatbotData = {
      nombre: 'Mi Chatbot',
      descripcion: 'Chatbot creado con el constructor',
      configuracion: {
        nodes,
        edges,
        variables,
        welcomeMessage,
        settings: {
          nombre: 'Mi Chatbot',
          descripcion: 'Chatbot creado con el constructor',
        },
      },
    };

    apiService.saveChatbot(chatbotData).then(() => {
      setLastSaved(new Date());
      toast.success('Chatbot guardado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
    }).catch((error: Error) => {
      toast.error(`Error al guardar: ${error.message}`);
    });
  }, [nodes, edges, variables, welcomeMessage, queryClient]);

  return (
    <div className={`h-full flex ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar colapsable */}
      <div
        className={`${sidebarCollapsed ? 'w-16' : 'w-64'
          } bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col`}
      >
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

        <div className="flex-1 overflow-y-auto py-4">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSidebarItem(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${activeSidebarItem === item.id
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

      {/* Área principal */}
      <div className="flex-1 relative bg-gray-50 dark:bg-gray-950">
        {/* Barra superior */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Mi Chatbot</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTempWelcomeMessage(welcomeMessage);
                setShowWelcomeDialog(true);
              }}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Editar bienvenida
            </Button>
          </div>
          <div className="flex items-center gap-3">
            {/* Indicadores de validación */}
            {hasErrors && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {errors.filter(e => e.severity === 'error').length} error{errors.filter(e => e.severity === 'error').length !== 1 ? 'es' : ''}
                </span>
              </div>
            )}
            {hasWarnings && !hasErrors && (
              <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
                <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  {errors.filter(e => e.severity === 'warning').length} advertencia{errors.filter(e => e.severity === 'warning').length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {isValid && nodes.length > 1 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <AlertCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  Flujo válido
                </span>
              </div>
            )}

            <span className="text-xs text-gray-500">
              Último guardado: {lastSaved.toLocaleTimeString()}
            </span>
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
              onClick={handleSave}
              disabled={hasErrors}
              title={hasErrors ? 'Corrige los errores antes de guardar' : 'Guardar chatbot'}
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="h-full pt-16">
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
            nodesDraggable={false}
            nodesConnectable={true}
            elementsSelectable={true}
          >
            <Background className="dark:opacity-20" />
            <Controls className="dark:bg-gray-800 dark:border-gray-700" />
            <MiniMap className="dark:bg-gray-800 dark:border-gray-700" />
          </ReactFlow>
        </div>

        {/* Menú contextual */}
        {showAddMenu && !selectedCategory && (
          <div
            className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-30"
            style={{
              left: `${addMenuPosition.x - 140}px`,
              top: `${addMenuPosition.y}px`,
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

        {/* Submenú */}
        {showAddMenu && selectedCategory && (
          <div
            className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-30"
            style={{
              left: `${addMenuPosition.x - 160}px`,
              top: `${addMenuPosition.y}px`,
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
                  onClick={() => addNode(option.type as NodeType, option.subtype, option.label)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
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

        {/* Panel de propiedades mejorado */}
        {selectedNode && (
          <div className="absolute top-16 right-0 w-96 h-[calc(100%-4rem)] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-hidden slide-in-right shadow-xl">
            <ImprovedPropertiesPanel
              selectedNode={selectedNode}
              onUpdateNode={(nodeId, data) => {
                setNodes((nds) =>
                  nds.map((node) => (node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node))
                );
              }}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        )}

        {/* Simulador */}
        {showSimulator && (
          <div className="absolute top-16 right-0 w-96 h-[calc(100%-4rem)] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 slide-in-right shadow-xl">
            <ChatSimulator
              isOpen={showSimulator}
              nodes={nodes}
              edges={edges}
              onClose={() => setShowSimulator(false)}
            />
          </div>
        )}
      </div>

      {/* Dialog para editar mensaje de bienvenida */}
      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent className="dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>Personalizar mensaje de bienvenida</DialogTitle>
            <DialogDescription>
              Este mensaje se mostrará al inicio de cada conversación
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="welcome-message">Mensaje de bienvenida</Label>
              <Textarea
                id="welcome-message"
                value={tempWelcomeMessage}
                onChange={(e) => setTempWelcomeMessage(e.target.value)}
                placeholder="Escribe tu mensaje de bienvenida..."
                rows={4}
                className="dark:bg-gray-800"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowWelcomeDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={updateWelcomeMessage}>
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const FinalChatbotBuilder = () => {
  return (
    <ReactFlowProvider>
      <FinalBuilderContent />
    </ReactFlowProvider>
  );
};
