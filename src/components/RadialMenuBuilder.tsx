import { useState, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  ReactFlowProvider,
  BackgroundVariant,
  ConnectionLineType,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
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
  Keyboard
} from 'lucide-react';
import { RadialChatbotNode } from './RadialChatbotNode';

const nodeTypes = {
  chatbot: RadialChatbotNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'chatbot',
    position: { x: 400, y: 200 },
    data: { 
      label: 'Inicio', 
      type: 'start',
      message: '¡Hola! Soy tu asistente virtual 🤖',
    },
  },
];

const initialEdges: Edge[] = [];

function FlowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (type: string, position?: { x: number; y: number }, sourceNodeId?: string) => {
    const newNode: Node = {
      id: `${Date.now()}`,
      type: 'chatbot',
      position: position || { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { 
        label: type === 'start' ? 'Inicio' :
               type === 'message' ? 'Mensaje' : 
               type === 'input' ? 'Entrada' :
               type === 'option' ? 'Opciones' : 
               type === 'action' ? 'Acción' :
               type === 'condition' ? 'Condición' :
               type === 'delay' ? 'Delay' :
               type === 'end' ? 'Final' : 'Nuevo Nodo',
        type: type,
        message: type === 'start' ? '¡Hola! Soy tu asistente virtual 🤖' : 'Configura este nodo...',
        onAddNode: addNode,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    
    // Crear conexión automática si hay un nodo fuente
    if (sourceNodeId) {
      const newEdge: Edge = {
        id: `${sourceNodeId}-${newNode.id}`,
        source: sourceNodeId,
        target: newNode.id,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(262 83% 58%)',
        },
        style: {
          stroke: 'hsl(262 83% 58%)',
          strokeWidth: 2,
        },
      };
      setEdges((eds) => [...eds, newEdge]);
    }
  };

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="flex gap-6 h-[calc(100vh-12rem)]">
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
              onClick={() => addNode('start')}
            >
              <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">Inicio</span>
            </button>
            <button
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              onClick={() => addNode('message')}
            >
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">Mensaje</span>
            </button>
            <button
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              onClick={() => addNode('input')}
            >
              <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                <Keyboard className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">Entrada</span>
            </button>
            <button
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              onClick={() => addNode('option')}
            >
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg">
                <MousePointer className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">Opciones</span>
            </button>
            <button
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              onClick={() => addNode('action')}
            >
              <div className="p-2 bg-gradient-to-r from-violet-500 to-violet-600 rounded-lg">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">Acción</span>
            </button>
            <button
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              onClick={() => addNode('condition')}
            >
              <div className="p-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
                <GitBranch className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">Condición</span>
            </button>
            <button
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              onClick={() => addNode('delay')}
            >
              <div className="p-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg">
                <Timer className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">Delay</span>
            </button>
            <button
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              onClick={() => addNode('end')}
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
            <button className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all">
              <Play className="w-4 h-4" />
              <span className="font-medium">Probar Bot</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <Save className="w-4 h-4" />
              <span className="font-medium">Guardar</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              <span className="font-medium">Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-white rounded-xl shadow-lg border overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: 'hsl(262 83% 58%)',
            },
            style: {
              stroke: 'hsl(262 83% 58%)',
              strokeWidth: 2,
            },
          }}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineStyle={{
            stroke: 'hsl(262 83% 58%)',
            strokeWidth: 2,
          }}
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={16} 
            size={1}
            className="opacity-30"
          />
          <Controls 
            className="!bg-white !border !border-gray-200 !shadow-lg !rounded-lg"
            showInteractive={false}
          />
          <MiniMap 
            className="!bg-white !border-gray-200 !shadow-lg !rounded-lg"
            nodeColor={(node) => {
              switch (node.data.type) {
                case 'start': return 'hsl(262 83% 58%)';
                case 'message': return 'hsl(217 91% 60%)';
                case 'input': return 'hsl(142 76% 45%)';
                case 'option': return 'hsl(190 95% 60%)';
                case 'action': return 'hsl(280 80% 60%)';
                case 'condition': return 'hsl(40 90% 60%)';
                case 'delay': return 'hsl(330 81% 60%)';
                case 'end': return 'hsl(0 80% 60%)';
                default: return 'hsl(220 13% 65%)';
              }
            }}
          />
        </ReactFlow>
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
                  value={String(selectedNode.data.label || '')}
                  className="w-full mt-1 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  onChange={(e) => {
                    setNodes((nds) =>
                      nds.map((node) =>
                        node.id === selectedNode.id
                          ? { ...node, data: { ...node.data, label: e.target.value } }
                          : node
                      )
                    );
                  }}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Mensaje</label>
                <textarea
                  value={String(selectedNode.data.message || '')}
                  className="w-full mt-1 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[100px]"
                  onChange={(e) => {
                    setNodes((nds) =>
                      nds.map((node) =>
                        node.id === selectedNode.id
                          ? { ...node, data: { ...node.data, message: e.target.value } }
                          : node
                      )
                    );
                  }}
                />
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Tipo: <span className="font-semibold text-gray-900">{String(selectedNode.data.type || '')}</span></p>
                <p className="text-sm text-gray-600">ID: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{selectedNode.id}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function RadialMenuBuilder() {
  return (
    <ReactFlowProvider>
      <FlowBuilder />
    </ReactFlowProvider>
  );
}
