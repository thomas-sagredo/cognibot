import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Plus, 
  Play, 
  Save, 
  Download,
  MessageSquare,
  MousePointer,
  Cpu,
  GitBranch,
  StopCircle,
  Bot,
  Sparkles,
  Settings,
  Timer,
  Keyboard,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

interface NodeData {
  id: string;
  type: string;
  label: string;
  message: string;
  position: { x: number; y: number };
}

const iconMap = {
  start: Bot,
  message: MessageSquare,
  input: Keyboard,
  option: MousePointer,
  action: Cpu,
  condition: GitBranch,
  delay: Timer,
  end: StopCircle,
};

const colorMap = {
  start: 'from-purple-500 to-purple-600',
  message: 'from-blue-500 to-blue-600',
  input: 'from-green-500 to-green-600',
  option: 'from-cyan-500 to-cyan-600',
  action: 'from-violet-500 to-violet-600',
  condition: 'from-yellow-500 to-yellow-600',
  delay: 'from-pink-500 to-pink-600',
  end: 'from-red-500 to-red-600',
};

const nodeTypeOptions = [
  { type: 'message', icon: MessageSquare, label: 'Mensaje', color: 'from-blue-500 to-blue-600' },
  { type: 'input', icon: Keyboard, label: 'Entrada', color: 'from-green-500 to-green-600' },
  { type: 'option', icon: MousePointer, label: 'Opciones', color: 'from-cyan-500 to-cyan-600' },
  { type: 'action', icon: Cpu, label: 'Acción', color: 'from-violet-500 to-violet-600' },
  { type: 'condition', icon: GitBranch, label: 'Condición', color: 'from-yellow-500 to-yellow-600' },
  { type: 'delay', icon: Timer, label: 'Delay', color: 'from-pink-500 to-pink-600' },
  { type: 'end', icon: StopCircle, label: 'Final', color: 'from-red-500 to-red-600' },
];

const RadialNode = ({ node, onAddNode, onSelectNode, isSelected }: { 
  node: NodeData; 
  onAddNode: (type: string, sourceId: string) => void;
  onSelectNode: (node: NodeData) => void;
  isSelected: boolean;
}) => {
  const [showRadialMenu, setShowRadialMenu] = useState(false);
  const Icon = iconMap[node.type as keyof typeof iconMap] || Bot;
  const gradientColor = colorMap[node.type as keyof typeof colorMap] || 'from-gray-500 to-gray-600';

  const handleAddNode = (type: string) => {
    onAddNode(type, node.id);
    setShowRadialMenu(false);
  };

  return (
    <div 
      className="absolute group"
      style={{ 
        left: node.position.x, 
        top: node.position.y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Node Content */}
      <div 
        className={`
          relative min-w-[240px] rounded-xl shadow-lg transition-all duration-300 cursor-pointer
          bg-white border-2 ${isSelected ? 'border-purple-500' : 'border-gray-200'}
          group-hover:shadow-xl group-hover:scale-[1.02]
        `}
        onClick={() => onSelectNode(node)}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${gradientColor} p-3 rounded-t-xl flex items-center gap-2`}>
          <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-sm">{node.label}</span>
        </div>

        {/* Body */}
        <div className="p-4 space-y-2">
          <p className="text-sm text-gray-700 leading-relaxed">
            {node.message}
          </p>
        </div>
      </div>

      {/* Radial Menu Button */}
      {node.type !== 'end' && (
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-50">
          <button
            className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center group-hover:animate-pulse"
            onClick={(e) => {
              e.stopPropagation();
              setShowRadialMenu(!showRadialMenu);
            }}
          >
            <Plus className={`w-5 h-5 text-white transition-transform duration-300 ${showRadialMenu ? 'rotate-45' : ''}`} />
          </button>

          {/* Radial Menu */}
          {showRadialMenu && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-in fade-in zoom-in duration-200">
              <div className="relative w-[280px] h-[280px]">
                {nodeTypeOptions.map((option, index) => {
                  const angle = (index * 360) / nodeTypeOptions.length - 90;
                  const radius = 90;
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;
                  const OptionIcon = option.icon;

                  return (
                    <button
                      key={option.type}
                      className={`absolute top-1/2 left-1/2 w-12 h-12 bg-gradient-to-br ${option.color} rounded-full shadow-lg hover:shadow-xl hover:scale-125 transition-all duration-300 flex items-center justify-center group/item`}
                      style={{
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddNode(option.type);
                      }}
                    >
                      <OptionIcon className="w-5 h-5 text-white" />
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap opacity-0 group-hover/item:opacity-100 transition-opacity bg-white px-2 py-1 rounded shadow-lg border">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export function SimpleRadialBuilder() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<NodeData[]>([
    {
      id: '1',
      type: 'start',
      label: 'Inicio',
      message: '¡Hola! Soy tu asistente virtual 🤖',
      position: { x: 400, y: 200 }
    }
  ]);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [chatbotId, setChatbotId] = useState<number | null>(null);
  const [chatbotName, setChatbotName] = useState('Mi Chatbot');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const addNode = (type: string, sourceId: string) => {
    const sourceNode = nodes.find(n => n.id === sourceId);
    if (!sourceNode) return;

    const newNode: NodeData = {
      id: `${Date.now()}`,
      type: type,
      label: type === 'start' ? 'Inicio' :
             type === 'message' ? 'Mensaje' : 
             type === 'input' ? 'Entrada' :
             type === 'option' ? 'Opciones' : 
             type === 'action' ? 'Acción' :
             type === 'condition' ? 'Condición' :
             type === 'delay' ? 'Delay' :
             type === 'end' ? 'Final' : 'Nuevo Nodo',
      message: 'Configura este nodo...',
      position: { 
        x: sourceNode.position.x + (Math.random() - 0.5) * 200, 
        y: sourceNode.position.y + 150 
      }
    };
    
    setNodes(prev => [...prev, newNode]);
  };

  const addNodeFromToolbar = (type: string) => {
    const newNode: NodeData = {
      id: `${Date.now()}`,
      type: type,
      label: type === 'start' ? 'Inicio' :
             type === 'message' ? 'Mensaje' : 
             type === 'input' ? 'Entrada' :
             type === 'option' ? 'Opciones' : 
             type === 'action' ? 'Acción' :
             type === 'condition' ? 'Condición' :
             type === 'delay' ? 'Delay' :
             type === 'end' ? 'Final' : 'Nuevo Nodo',
      message: type === 'start' ? '¡Hola! Soy tu asistente virtual 🤖' : 'Configura este nodo...',
      position: { 
        x: Math.random() * 600 + 200, 
        y: Math.random() * 400 + 100 
      }
    };
    
    setNodes(prev => [...prev, newNode]);
  };

  const updateSelectedNode = (field: string, value: string) => {
    if (!selectedNode) return;
    
    setNodes(prev => prev.map(node => 
      node.id === selectedNode.id 
        ? { ...node, [field]: value }
        : node
    ));
    
    setSelectedNode(prev => prev ? { ...prev, [field]: value } : null);
  };

  // ─── CONVERTING LOCAL FORMAT TO API FORMAT ──────────────────────────────────
  const buildApiPayload = useCallback(() => ({
    nombre: chatbotName,
    descripcion: `Chatbot creado por ${user?.nombre || 'usuario'}`,
    configuracion: {
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: { label: n.label, text: n.message }
      })),
      edges: [] as unknown[],
      settings: { nombre: chatbotName }
    }
  }), [nodes, chatbotName, user]);

  // ─── SAVE MUTATION ────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = buildApiPayload();
      if (chatbotId) {
        return apiService.updateChatbot(chatbotId, payload);
      } else {
        return apiService.saveChatbot(payload);
      }
    },
    onSuccess: (data) => {
      if (!chatbotId && 'id' in data) {
        setChatbotId((data as { id: number }).id);
      }
      setLastSaved(new Date());
      toast.success('¡Chatbot guardado exitosamente!', {
        icon: <CheckCircle className="w-4 h-4 text-green-500" />
      });
    },
    onError: (err: Error) => {
      toast.error(`Error al guardar: ${err.message}`);
    }
  });

  // ─── EXPORT TO JSON ──────────────────────────────────────────────────────────
  const handleExport = () => {
    const payload = buildApiPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chatbotName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Chatbot exportado como JSON');
  };

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-10rem)]">
      {/* Chatbot name + save status bar */}
      <div className="flex items-center gap-4 px-2">
        <div className="flex-1 flex items-center gap-3">
          <Bot className="w-5 h-5 text-purple-600 flex-shrink-0" />
          <input
            type="text"
            value={chatbotName}
            onChange={(e) => setChatbotName(e.target.value)}
            className="text-lg font-semibold bg-transparent border-b-2 border-transparent hover:border-purple-300 focus:border-purple-500 focus:outline-none transition-colors text-gray-800 w-64"
            placeholder="Nombre del chatbot"
          />
          {chatbotId && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">ID: {chatbotId}</span>
          )}
        </div>
        {lastSaved && (
          <span className="text-xs text-gray-400">
            Guardado {lastSaved.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
      {/* Toolbar */}
      <div className="w-64 p-4 space-y-4 bg-white rounded-xl shadow-lg border">
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            Tipos de Nodos
          </h3>
          <div className="space-y-2">
            <button
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              onClick={() => addNodeFromToolbar('start')}
            >
              <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">Inicio</span>
            </button>
            <button
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              onClick={() => addNodeFromToolbar('message')}
            >
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">Mensaje</span>
            </button>
            <button
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              onClick={() => addNodeFromToolbar('input')}
            >
              <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                <Keyboard className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">Entrada</span>
            </button>
            <button
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              onClick={() => addNodeFromToolbar('option')}
            >
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg">
                <MousePointer className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">Opciones</span>
            </button>
            <button
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              onClick={() => addNodeFromToolbar('action')}
            >
              <div className="p-2 bg-gradient-to-r from-violet-500 to-violet-600 rounded-lg">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">Acción</span>
            </button>
            <button
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              onClick={() => addNodeFromToolbar('condition')}
            >
              <div className="p-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
                <GitBranch className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">Condición</span>
            </button>
            <button
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              onClick={() => addNodeFromToolbar('delay')}
            >
              <div className="p-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg">
                <Timer className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">Delay</span>
            </button>
            <button
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              onClick={() => addNodeFromToolbar('end')}
            >
              <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg">
                <StopCircle className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">Final</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-3">Acciones</h3>
          <div className="space-y-2">
            <button
              disabled
              title="Próximamente: simulador de chat"
              className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg opacity-50 cursor-not-allowed transition-all"
            >
              <Play className="w-4 h-4" />
              <span className="font-medium">Probar Bot</span>
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saveMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Save className="w-4 h-4" />}
              <span className="font-medium">
                {saveMutation.isPending ? 'Guardando...' : chatbotId ? 'Actualizar' : 'Guardar'}
              </span>
            </button>
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="font-medium">Exportar JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-white rounded-xl shadow-lg border overflow-hidden relative">
        <div 
          className="w-full h-full bg-gray-50 relative"
          style={{
            backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
          onClick={() => setSelectedNode(null)}
        >
          {nodes.map(node => (
            <RadialNode
              key={node.id}
              node={node}
              onAddNode={addNode}
              onSelectNode={setSelectedNode}
              isSelected={selectedNode?.id === node.id}
            />
          ))}
        </div>
      </div>

      {/* Properties Panel */}
      {selectedNode && (
        <div className="w-80 p-4 space-y-4 bg-white rounded-xl shadow-lg border">
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-purple-600" />
              Propiedades
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Etiqueta</label>
                <input
                  type="text"
                  value={selectedNode.label}
                  className="w-full mt-1 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  onChange={(e) => updateSelectedNode('label', e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Mensaje</label>
                <textarea
                  value={selectedNode.message}
                  className="w-full mt-1 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[100px]"
                  onChange={(e) => updateSelectedNode('message', e.target.value)}
                />
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Tipo: <span className="font-semibold text-gray-900">{selectedNode.type}</span></p>
                <p className="text-sm text-gray-600">ID: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{selectedNode.id}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
