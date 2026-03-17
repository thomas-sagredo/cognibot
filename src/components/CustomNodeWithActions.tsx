import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Plus, MessageSquare, MousePointer, Cpu, GitBranch, StopCircle, Timer, Keyboard } from 'lucide-react';

interface CustomNodeData {
  label: string;
  type: string;
  onAddNode?: (type: string, position: { x: number; y: number }) => void;
}

const CustomNodeWithActions: React.FC<NodeProps<CustomNodeData>> = ({ data, id, xPos, yPos }) => {
  const [showActions, setShowActions] = useState(false);

  const nodeTypes = [
    { type: 'message', icon: MessageSquare, label: 'Mensaje', color: 'bg-blue-500' },
    { type: 'input', icon: Keyboard, label: 'Entrada', color: 'bg-green-500' },
    { type: 'option', icon: MousePointer, label: 'Opciones', color: 'bg-purple-500' },
    { type: 'action', icon: Cpu, label: 'Acción', color: 'bg-orange-500' },
    { type: 'condition', icon: GitBranch, label: 'Condición', color: 'bg-yellow-500' },
    { type: 'delay', icon: Timer, label: 'Delay', color: 'bg-pink-500' },
    { type: 'end', icon: StopCircle, label: 'Final', color: 'bg-red-500' },
  ];

  const handleAddNode = (type: string) => {
    if (data.onAddNode) {
      // Posicionar el nuevo nodo debajo del actual
      data.onAddNode(type, { x: xPos, y: yPos + 120 });
    }
    setShowActions(false);
  };

  return (
    <div className="relative">
      {/* Nodo principal */}
      <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-lg min-w-[200px]">
        <Handle type="target" position={Position.Top} />
        
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            data.type === 'start' ? 'bg-green-500' :
            data.type === 'message' ? 'bg-blue-500' :
            data.type === 'input' ? 'bg-green-500' :
            data.type === 'option' ? 'bg-purple-500' :
            data.type === 'action' ? 'bg-orange-500' :
            data.type === 'condition' ? 'bg-yellow-500' :
            data.type === 'delay' ? 'bg-pink-500' :
            data.type === 'end' ? 'bg-red-500' : 'bg-gray-500'
          }`}></div>
          <span className="font-medium text-gray-800">{data.label}</span>
        </div>

        <Handle type="source" position={Position.Bottom} />
      </div>

      {/* Botón + debajo del nodo */}
      {data.type !== 'end' && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2">
          <button
            onClick={() => setShowActions(!showActions)}
            className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Menú de opciones */}
          {showActions && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-50 min-w-[200px]">
              <div className="text-xs font-semibold text-gray-500 mb-2 px-2">Agregar nodo:</div>
              <div className="space-y-1">
                {nodeTypes.map((nodeType) => {
                  const Icon = nodeType.icon;
                  return (
                    <button
                      key={nodeType.type}
                      onClick={() => handleAddNode(nodeType.type)}
                      className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                      <div className={`w-6 h-6 ${nodeType.color} rounded flex items-center justify-center`}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{nodeType.label}</span>
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

export default CustomNodeWithActions;
