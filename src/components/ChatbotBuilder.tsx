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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
// Reemplazamos las dependencias problemáticas
const toast = {
  success: (message: string) => console.log('✅', message),
  error: (message: string) => console.error('❌', message),
  info: (message: string) => console.log('ℹ️', message),
};

// Mocks para react-query
const useQueryClient = () => ({
  invalidateQueries: () => {},
  setQueryData: () => {},
});

const useQuery = (options: any) => ({
  data: {
    usuario: {
      id: 'user_enterprise_123',
      plan: 'enterprise', // Cambiado a enterprise
      nombre: 'Usuario Enterprise',
      email: 'admin@cognibot.com'
    },
    limites: {
      max_nodos: 1000,
      maxNodes: 1000,
      maxIntegraciones: 10,
      maxUsuarios: 100,
      chatbots_creados: 5,
      max_chatbots: 50
    }
  },
  error: null,
  isLoading: false,
  refetch: () => {},
});

const useMutation = (options: any) => ({
  mutate: () => {},
  isLoading: false,
  isPending: false,
  error: null,
});

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  MessageSquare, 
  MousePointer, 
  Cpu, 
  GitBranch, 
  StopCircle,
  Play,
  Save,
  Download,
  Zap,
  Loader2,
  LogOut,
  Timer,
  Keyboard,
  Maximize2
} from 'lucide-react';

import { NodeToolbar } from './NodeToolbar';
import { PropertiesPanel } from './PropertiesPanel';
import { ChatSimulator } from './ChatSimulator';
import { VariablesPanel } from './VariablesPanel';
import { WhatsAppIntegration } from './WhatsAppIntegration';
import { ChatbotNode, NodeType, UserProfile, Variable } from '@/types/chatbot';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/services/api';

// Nodo avanzado de Lovable con menú radial
import { AdvancedChatbotNode } from './nodes/AdvancedChatbotNode';

const nodeTypes = {
  advanced: AdvancedChatbotNode,
};

const nodeTypeConfig: Array<{
  type: NodeType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    type: 'start',
    label: 'Inicio',
    icon: Bot,
    description: 'Nodo de bienvenida del chatbot',
  },
  {
    type: 'message',
    label: 'Mensaje',
    icon: MessageSquare,
    description: 'Envía un mensaje al usuario',
  },
  {
    type: 'option',
    label: 'Opciones',
    icon: MousePointer,
    description: 'Presenta opciones al usuario',
  },
  {
    type: 'action',
    label: 'Acción',
    icon: Cpu,
    description: 'Ejecuta acciones y variables',
  },
  {
    type: 'condition',
    label: 'Condición',
    icon: GitBranch,
    description: 'Evalúa condiciones y ramifica',
  },
  {
    type: 'end',
    label: 'Final',
    icon: StopCircle,
    description: 'Finaliza la conversación',
  },
  {
    type: 'input',
    label: 'Input',
    icon: Keyboard,
    description: 'Solicita un dato al usuario y guarda en variable',
  },
  {
    type: 'delay',
    label: 'Delay',
    icon: Timer,
    description: 'Espera N segundos antes de avanzar',
  },
];

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'start',
    position: { x: 250, y: 50 },
    data: {
      label: 'Inicio',
      welcomeMessage: '¡Hola! Soy tu asistente virtual 🤖 ¿En qué puedo ayudarte?',
    },
  },
];

const initialEdges: Edge[] = [];

const BuilderContent: React.FC = () => {
  const { user, logout, login } = useAuth();
  const queryClient = useQueryClient();
  
  // Estados principales
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [selectedChatbotId, setSelectedChatbotId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'flow' | 'variables' | 'whatsapp'>('flow');
  const [variables, setVariables] = useState<Variable[]>([]);

  // Queries
  const { data: profile, error: profileError } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiService.getProfile(),
    // Enable when there is a token, even if user is not yet in the store
    enabled: !!localStorage.getItem('token'),
    retry: 1
  });

  // Mutations
  type SavePayload = {
    nombre?: string;
    descripcion?: string;
    configuracion?: {
      nodes: Node[];
      edges: Edge[];
      variables?: Variable[];
      settings: { nombre: string; descripcion?: string };
    };
  };

  const saveMutation = useMutation<{ id?: number; mensaje: string }, Error, SavePayload>({
    mutationFn: (data: SavePayload) => 
      selectedChatbotId 
        ? apiService.updateChatbot(selectedChatbotId, data)
        : apiService.saveChatbot({
            nombre: data.nombre || `Chatbot ${new Date().toLocaleDateString()}`,
            descripcion: data.descripcion,
            configuracion: (data.configuracion || { nodes: [], edges: [], variables: [], settings: { nombre: '', descripcion: '' } }) as unknown as { nodes: unknown[]; edges: unknown[]; variables?: Variable[]; settings: { nombre: string; descripcion?: string } }
          }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (!selectedChatbotId && data.id) {
        setSelectedChatbotId(data.id);
      }
      console.log('✅ Chatbot guardado:', data);
      toast.success('✅ Guardado correctamente');
    },
    onError: (error: Error) => {
      console.error('❌ Error guardando chatbot:', error);
      toast.error(`Error al guardar: ${error.message}`);
    }
  });

  // Funciones de React Flow
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
    },
    []
  );

  const duplicateSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((nds) => {
      const original = nds.find(n => n.id === selectedNodeId);
      if (!original) return nds;
      const newId = `${Date.now()}`;
      const clone: Node = {
        ...original,
        id: newId,
        position: { x: original.position.x + 30, y: original.position.y + 30 },
        data: { ...original.data, label: `${original.data?.label || 'Nodo'} (copia)` },
      };
      return nds.concat(clone);
    });
  }, [selectedNodeId, setNodes]);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    if (confirm('¿Eliminar el nodo seleccionado?')) {
      setNodes((nds) => nds.filter(n => n.id !== selectedNodeId));
      setEdges((eds) => eds.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
      setSelectedNodeId(null);
    }
  }, [selectedNodeId, setNodes, setEdges]);

  // Función mejorada para agregar nodos con límites por plan
  const addNode = useCallback(
    (type: NodeType) => {
      if (!profile) {
        alert('Debes iniciar sesión para agregar nodos');
        return;
      }

      // Límites específicos por tipo de plan
      const planLimits = {
        free: { 
          maxNodes: 15, 
          allowedNodeTypes: ['start', 'message', 'end']
        },
        premium: { 
          maxNodes: 50, 
          allowedNodeTypes: ['start', 'message', 'option', 'action', 'input', 'delay', 'end']
        },
        enterprise: { 
          maxNodes: 200, 
          allowedNodeTypes: ['start', 'message', 'option', 'action', 'condition', 'input', 'delay', 'end']
        }
      };

      const currentPlan = profile.usuario.plan as keyof typeof planLimits;
      const limits = planLimits[currentPlan] || planLimits.free;

      // Verificar límite de nodos
      if (nodes.length >= limits.maxNodes) {
        alert(`🔒 Límite de ${limits.maxNodes} nodos alcanzado para plan ${currentPlan}`);
        return;
      }

      // Verificar tipo de nodo permitido
      if (!limits.allowedNodeTypes.includes(type)) {
        alert(`🔒 El nodo "${type}" no está disponible en tu plan ${currentPlan}. Actualiza a premium o enterprise.`);
        return;
      }

      const newNodeId = `${Date.now()}`;
      const newNode: Node = {
        id: newNodeId,
        type,
        position: { x: Math.random() * 400, y: Math.random() * 400 },
        data: {
          label: nodeTypeConfig.find(config => config.type === type)?.label || 'Nuevo Nodo',
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, profile, nodes.length]
  );

  const updateNode = useCallback(
    (nodeId: string, newData: Partial<ChatbotNode['data']>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
        )
      );
    },
    [setNodes]
  );

  // Función de guardado mejorada
  const handleSave = useCallback(() => {
    if (!profile) {
      alert('Debes iniciar sesión para guardar');
      return;
    }

    if (nodes.length > profile.limites.max_nodos) {
      alert(`Límite de ${profile.limites.max_nodos} nodos alcanzado para tu plan ${profile.usuario.plan}`);
      return;
    }

    const chatbotData = {
      nombre: `Chatbot ${new Date().toLocaleDateString()}`,
      descripcion: "Chatbot creado con CogniBot",
      configuracion: { 
        nodes: nodes,
        edges: edges,
        variables: variables,
        settings: {
          nombre: `Chatbot ${new Date().toLocaleDateString()}`,
          descripcion: "Chatbot creado con CogniBot"
        }
      }
    };

    saveMutation.mutate(chatbotData, {
      onSuccess: async (data) => {
        if (!selectedChatbotId && data.id) {
          setSelectedChatbotId(data.id);
        }
        try {
          const idToLoad = selectedChatbotId || data.id!;
          const full = await apiService.getChatbot(idToLoad);
          if (full.configuracion?.nodes && full.configuracion?.edges) {
            setNodes(full.configuracion.nodes as unknown as Node[]);
            setEdges(full.configuracion.edges as unknown as Edge[]);
          }
        } catch (e) {
          console.warn('No se pudo recargar el chatbot después de guardar', e);
        }
      }
    });
  }, [nodes, edges, variables, profile, saveMutation, selectedChatbotId, setNodes, setEdges]);

  // Autosave cada 30s si hay cambios y hay sesión
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && profile) {
        handleSave();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [user, profile, handleSave]);

  // Atajos de teclado
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S -> Guardar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
      // Supr/Backspace -> Eliminar nodo
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        e.preventDefault();
        deleteSelectedNode();
      }
      // Ctrl/Cmd + D -> Duplicar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelectedNode();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSave, deleteSelectedNode, duplicateSelectedNode, selectedNodeId]);

  // Manejo de variables
  const handleVariablesChange = (newVariables: Variable[]) => {
    setVariables(newVariables);
    // Guardar automáticamente cuando cambian las variables
    if (selectedChatbotId) {
      saveMutation.mutate({
        configuracion: {
          nodes,
          edges,
          variables: newVariables,
          settings: {
            nombre: `Chatbot ${new Date().toLocaleDateString()}`,
            descripcion: "Chatbot con variables"
          }
        }
      });
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login.html';
  };

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  // Efecto para manejar errores de autenticación
  useEffect(() => {
    if (profileError) {
      logout();
    }
  }, [profileError, logout]);

  // Bootstrap de sesión: si hay token pero no hay user en el store, cargarlo desde el perfil
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && profile && !user) {
      login(token, profile.usuario);
    }
  }, [profile, user, login]);

  // Cargar último chatbot del usuario al iniciar sesión
  useEffect(() => {
    const loadLastChatbot = async () => {
      if (!profile || !user) return;
      try {
        const chatbots = await apiService.getChatbots();
        if (chatbots && chatbots.length > 0) {
          const last = chatbots[chatbots.length - 1];
          setSelectedChatbotId(last.id);
          const full = await apiService.getChatbot(last.id);
          if (full.configuracion?.nodes && full.configuracion?.edges) {
            setNodes(full.configuracion.nodes as unknown as Node[]);
            setEdges(full.configuracion.edges as unknown as Edge[]);
            if (full.configuracion.variables) {
              setVariables(full.configuracion.variables as Variable[]);
            }
          }
        }
      } catch (e) {
        console.warn('No se pudo cargar el último chatbot', e);
      }
    };
    loadLastChatbot();
  }, [profile, user, setNodes, setEdges]);

  // Renderizado si no hay usuario
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-cognibot-primary to-purple-600">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">
            {localStorage.getItem('token') ? 'Cargando tu sesión...' : 'No has iniciado sesión'}
          </h2>
          {!localStorage.getItem('token') && (
            <Button onClick={() => window.location.href = '/login.html'}>
              Ir al Login
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-slate-50/50">
      {/* Header con información del usuario - Movido más arriba */}
      <div className="absolute top-2 right-2 z-50">
        <div className="bg-card/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border flex items-center gap-2 text-xs">
          <div>
            <div className="font-semibold text-xs">{user.nombre}</div>
            <div className="text-xs text-muted-foreground capitalize">
              {user.plan} • {profile ? `${nodes.length}/${profile.limites.max_nodos}` : '0/0'}
            </div>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline" 
            size="sm"
            className="hover:bg-red-500/10 hover:text-red-600 h-6 w-6 p-0"
          >
            <LogOut className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Left Sidebar con pestañas */}
      <div className="w-80 bg-card/95 backdrop-blur-sm border-r border-border/50 shadow-xl overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-border/50 bg-gradient-to-r from-cognibot-primary/5 to-transparent">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-cognibot-primary to-cognibot-primary/80 rounded-xl shadow-lg">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cognibot-primary to-purple-600 bg-clip-text text-transparent">
                CogniBot
              </h1>
              <p className="text-xs text-muted-foreground">Generador de Chatbots</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending || !profile}
              size="sm" 
              variant="outline" 
              className="flex-1 hover:bg-cognibot-primary/10 hover:border-cognibot-primary/30"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="hover:bg-cognibot-primary/10 hover:border-cognibot-primary/30"
              onClick={() => {
                const data = {
                  nodes,
                  edges,
                  variables,
                  settings: {
                    nombre: `Chatbot ${new Date().toLocaleDateString()}`,
                    descripcion: 'Exportado desde CogniBot'
                  }
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `chatbot-${Date.now()}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Pestañas */}
        <div className="border-b border-border/50">
          <div className="flex">
            <button
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === 'flow' 
                  ? 'border-b-2 border-cognibot-primary text-cognibot-primary' 
                  : 'text-muted-foreground'
              }`}
              onClick={() => setActiveTab('flow')}
            >
              Flujo
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === 'variables' 
                  ? 'border-b-2 border-cognibot-primary text-cognibot-primary' 
                  : 'text-muted-foreground'
              }`}
              onClick={() => setActiveTab('variables')}
            >
              Variables
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === 'whatsapp' 
                  ? 'border-b-2 border-cognibot-primary text-cognibot-primary' 
                  : 'text-muted-foreground'
              }`}
              onClick={() => setActiveTab('whatsapp')}
            >
              WhatsApp
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {activeTab === 'flow' && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Componentes de Flujo
                  {profile && (
                    <span className="text-xs bg-cognibot-primary/10 text-cognibot-primary px-2 py-1 rounded-full">
                      {nodes.length}/{profile.limites.max_nodos}
                    </span>
                  )}
                </h2>
                
                {nodeTypeConfig.map((nodeType) => {
                  const IconComponent = nodeType.icon;
                const planLimits = {
                  free: ['start', 'message', 'end'],
                  premium: ['start', 'message', 'option', 'action', 'input', 'delay', 'end'],
                  enterprise: ['start', 'message', 'option', 'action', 'condition', 'input', 'delay', 'end']
                };
                  
                  const currentPlan = profile?.usuario.plan as keyof typeof planLimits || 'free';
                  const isAllowed = planLimits[currentPlan]?.includes(nodeType.type) || false;
                  const isDisabled = !profile || nodes.length >= (profile?.limites.max_nodos || 0) || !isAllowed;

                  return (
                    <Button
                      key={nodeType.type}
                      variant="ghost"
                      className="w-full justify-start h-auto p-4 flex-col items-start hover:bg-gradient-to-r hover:from-cognibot-primary/10 hover:to-transparent hover:border-cognibot-primary/20 border border-transparent transition-all duration-200 rounded-xl group"
                      onClick={() => addNode(nodeType.type)}
                      disabled={isDisabled}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className={`p-2 rounded-lg group-hover:scale-110 transition-transform duration-200 ${
                          !isAllowed ? 'bg-gray-400' :
                          nodeType.type === 'start' ? 'bg-node-start-border' :
                          nodeType.type === 'message' ? 'bg-node-message-border' :
                          nodeType.type === 'option' ? 'bg-node-option-border' :
                          nodeType.type === 'action' ? 'bg-node-action-border' :
                          nodeType.type === 'condition' ? 'bg-node-condition-border' :
                          'bg-node-end-border'
                        }`}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <span className="font-semibold text-sm">{nodeType.label}</span>
                          <div className="text-xs text-muted-foreground mt-1">
                            {nodeType.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
{{ ... }}
            {activeTab === 'variables' && (
              <VariablesPanel 
                variables={variables} 
                onVariablesChange={handleVariablesChange} 
              />
            )}
            {activeTab === 'whatsapp' && selectedChatbotId && (
              <div className="space-y-4">
                <WhatsAppIntegration 
                  chatbotId={selectedChatbotId}
                  chatbotName={`Chatbot ${new Date().toLocaleDateString()}`}
                />
              </div>
            )}
          </div>
        </div>

        <Separator className="my-6" />

        <Button
          onClick={() => setIsSimulatorOpen(true)}
          className="w-full bg-gradient-to-r from-cognibot-primary to-purple-600 hover:from-cognibot-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          <Play className="w-5 h-5 mr-2" />
          Probar Chatbot
        </Button>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative bg-gradient-to-br from-slate-50/30 to-background">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-transparent"
          defaultEdgeOptions={{
            style: { 
              stroke: 'hsl(var(--cognibot-primary))', 
              strokeWidth: 2,
            },
            type: 'smoothstep',
          }}
        >
          <Controls 
            className="bg-card/90 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg"
            showInteractive={false}
          />
          <MiniMap 
            className="bg-card/90 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg" 
            nodeColor={(node) => {
              const colorMap = {
                start: 'hsl(var(--node-start-border))',
                message: 'hsl(var(--node-message-border))',
                option: 'hsl(var(--node-option-border))',
                action: 'hsl(var(--node-action-border))',
                condition: 'hsl(var(--node-condition-border))',
                end: 'hsl(var(--node-end-border))',
              };
              return colorMap[node.type as keyof typeof colorMap] || '#94a3b8';
            }}
          />
          <Background 
            gap={20} 
            size={1} 
            color="hsl(var(--border))" 
            style={{ opacity: 0.5 }}
          />
        </ReactFlow>
        
        <NodeToolbar 
          onDuplicate={duplicateSelectedNode}
          onDelete={deleteSelectedNode}
          disabled={!selectedNodeId}
        />
      </div>

      {/* Right Sidebar - Properties Panel */}
      <div className="w-80 bg-card/95 backdrop-blur-sm border-l border-border/50 shadow-xl overflow-y-auto">
        <PropertiesPanel
          selectedNode={selectedNode}
          onUpdateNode={updateNode}
        />
      </div>

      {/* Chat Simulator Modal */}
      {isSimulatorOpen && (
        <ChatSimulator
          nodes={nodes}
          edges={edges}
          isOpen={isSimulatorOpen}
          onClose={() => setIsSimulatorOpen(false)}
        />
      )}
    </div>
    </ReactFlowProvider>
  );
};

export const ChatbotBuilder: React.FC = () => {
  return (
    <ReactFlowProvider>
      <BuilderContent />
    </ReactFlowProvider>
  );
};

export default ChatbotBuilder;