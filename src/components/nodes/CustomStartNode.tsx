import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Bot, Plus } from 'lucide-react';
import { NodeData } from '@/types/builder';

export const CustomStartNode: React.FC<NodeProps> = ({ data, id }) => {
  const nodeData = data as NodeData;
  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Disparar evento personalizado para abrir el menú
    const event = new CustomEvent('addNodeFromHandle', { 
      detail: { sourceNodeId: id } 
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="relative">
      {/* Nodo principal */}
      <div className="bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-xl shadow-lg p-4 min-w-[280px] hover:shadow-xl transition-shadow">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">Inicio</div>
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300">
          {nodeData.text || 'Nodo de bienvenida del chatbot'}
        </div>
      </div>

      {/* Handle de salida con botón + integrado */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-4 !h-4 !bg-blue-500 !border-2 !border-white"
        />
        <button
          onClick={handleAddClick}
          className="mt-1 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-10"
          title="Agregar siguiente bloque"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
