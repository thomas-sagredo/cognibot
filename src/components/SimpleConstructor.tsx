import React, { useState, useCallback } from 'react';
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
import { Bot, MessageSquare, Settings, Play, Plus } from 'lucide-react';

// Tipos de nodos iniciales
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Inicio' },
    position: { x: 250, y: 25 },
    style: {
      background: '#e1f5fe',
      border: '2px solid #0288d1',
      borderRadius: '8px',
      padding: '10px',
    },
  },
  {
    id: '2',
    data: { label: 'Mensaje de Bienvenida' },
    position: { x: 100, y: 125 },
    style: {
      background: '#f3e5f5',
      border: '2px solid #7b1fa2',
      borderRadius: '8px',
      padding: '10px',
    },
  },
  {
    id: '3',
    data: { label: 'Opciones del Menú' },
    position: { x: 400, y: 125 },
    style: {
      background: '#e8f5e8',
      border: '2px solid #388e3c',
      borderRadius: '8px',
      padding: '10px',
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
];

const SimpleConstructor: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeId, setNodeId] = useState(4);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback((type: string) => {
    const newNode: Node = {
      id: nodeId.toString(),
      data: { 
        label: type === 'message' ? 'Nuevo Mensaje' : 
               type === 'input' ? 'Nueva Entrada' : 
               type === 'option' ? 'Nueva Opción' : 'Nuevo Nodo'
      },
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 300 + 100 
      },
      style: {
        background: type === 'message' ? '#f3e5f5' : 
                   type === 'input' ? '#e1f5fe' : 
                   type === 'option' ? '#e8f5e8' : '#fff3e0',
        border: `2px solid ${type === 'message' ? '#7b1fa2' : 
                            type === 'input' ? '#0288d1' : 
                            type === 'option' ? '#388e3c' : '#f57c00'}`,
        borderRadius: '8px',
        padding: '10px',
      },
    };
    
    setNodes((nds) => nds.concat(newNode));
    setNodeId((id) => id + 1);
  }, [nodeId, setNodes]);

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Bot className="w-5 h-5 mr-2" />
          Tipos de Nodos
        </h3>
        
        <div className="space-y-3">
          <button
            onClick={() => addNode('message')}
            className="w-full flex items-center p-3 bg-purple-100 hover:bg-purple-200 rounded-lg border-2 border-purple-300 transition-colors"
          >
            <MessageSquare className="w-4 h-4 mr-2 text-purple-600" />
            <span className="text-purple-700 font-medium">Mensaje</span>
          </button>
          
          <button
            onClick={() => addNode('input')}
            className="w-full flex items-center p-3 bg-blue-100 hover:bg-blue-200 rounded-lg border-2 border-blue-300 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2 text-blue-600" />
            <span className="text-blue-700 font-medium">Entrada</span>
          </button>
          
          <button
            onClick={() => addNode('option')}
            className="w-full flex items-center p-3 bg-green-100 hover:bg-green-200 rounded-lg border-2 border-green-300 transition-colors"
          >
            <Play className="w-4 h-4 mr-2 text-green-600" />
            <span className="text-green-700 font-medium">Opción</span>
          </button>
        </div>

        <div className="mt-8">
          <h4 className="text-md font-semibold mb-3 text-gray-700 dark:text-gray-300">
            Estadísticas
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Nodos:</span>
              <span className="font-medium">{nodes.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Conexiones:</span>
              <span className="font-medium">{edges.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              if (node.style?.background) {
                return node.style.background as string;
              }
              return '#fff';
            }}
          />
          <Background gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
};

const SimpleConstructorWithProvider: React.FC = () => {
  return (
    <ReactFlowProvider>
      <SimpleConstructor />
    </ReactFlowProvider>
  );
};

export default SimpleConstructorWithProvider;
