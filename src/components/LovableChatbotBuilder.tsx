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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { AdvancedChatbotNode } from './nodes/AdvancedChatbotNode';

const nodeTypes = {
  advanced: AdvancedChatbotNode,
};

function FlowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback((type: string, position?: { x: number; y: number }, sourceNodeId?: string) => {
    const newNode: Node = {
      id: `${Date.now()}`,
      type: 'advanced',
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
        message: 'Configura este nodo...',
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
  }, [setNodes, setEdges]);

  // Crear nodo inicial si no hay nodos
  useState(() => {
    if (nodes.length === 0) {
      addNode('start', { x: 250, y: 100 });
    }
  });

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="flex gap-6 h-[calc(100vh-12rem)]">
      {/* Toolbar */}
      <Card className="w-64 p-4 space-y-4 shadow-elegant">
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Tipos de Nodos
          </h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start hover-scale"
              onClick={() => addNode('start')}
            >
              <Bot className="w-4 h-4 mr-2" />
              Inicio
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start hover-scale"
              onClick={() => addNode('message')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Mensaje
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start hover-scale"
              onClick={() => addNode('input')}
            >
              <Keyboard className="w-4 h-4 mr-2" />
              Entrada
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start hover-scale"
              onClick={() => addNode('option')}
            >
              <MousePointer className="w-4 h-4 mr-2" />
              Opciones
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start hover-scale"
              onClick={() => addNode('action')}
            >
              <Cpu className="w-4 h-4 mr-2" />
              Acción
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start hover-scale"
              onClick={() => addNode('condition')}
            >
              <GitBranch className="w-4 h-4 mr-2" />
              Condición
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start hover-scale"
              onClick={() => addNode('delay')}
            >
              <Timer className="w-4 h-4 mr-2" />
              Delay
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start hover-scale"
              onClick={() => addNode('end')}
            >
              <StopCircle className="w-4 h-4 mr-2" />
              Final
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-3">Acciones</h3>
          <div className="space-y-2">
            <Button className="w-full gradient-primary hover-glow">
              <Play className="w-4 h-4 mr-2" />
              Probar Bot
            </Button>
            <Button variant="outline" className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </Card>

      {/* Canvas */}
      <Card className="flex-1 overflow-hidden shadow-elegant">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-muted/20"
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
            className="!bg-card !border !border-border !shadow-elegant"
            showInteractive={false}
          />
          <MiniMap 
            className="!bg-card !border-border !shadow-elegant"
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
      </Card>

      {/* Properties Panel */}
      {selectedNode && (
        <Card className="w-80 p-4 space-y-4 shadow-elegant">
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              Propiedades
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Etiqueta</label>
                <input
                  type="text"
                  value={String(selectedNode.data.label || '')}
                  className="w-full mt-1 px-3 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary"
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
                <label className="text-sm font-medium">Mensaje</label>
                <textarea
                  value={String(selectedNode.data.message || '')}
                  className="w-full mt-1 px-3 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary min-h-[100px]"
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
                <p className="text-sm text-muted-foreground mb-2">Tipo: <span className="font-semibold">{String(selectedNode.data.type || '')}</span></p>
                <p className="text-sm text-muted-foreground">ID: <span className="font-mono text-xs">{selectedNode.id}</span></p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export function LovableChatbotBuilder() {
  return (
    <ReactFlowProvider>
      <FlowBuilder />
    </ReactFlowProvider>
  );
}

export default LovableChatbotBuilder;
