import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  MessageSquare, 
  MousePointer, 
  Cpu, 
  GitBranch, 
  Timer, 
  Keyboard,
  Plus,
  Mic,
  Image as ImageIcon,
  Play,
  File,
  Sticker,
} from 'lucide-react';
import { NodeData } from '@/types/builder';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  message: MessageSquare,
  option: MousePointer,
  action: Cpu,
  condition: GitBranch,
  delay: Timer,
  input: Keyboard,
  audio: Mic,
  image: ImageIcon,
  video: Play,
  document: File,
  sticker: Sticker,
};

const colorMap: Record<string, { bg: string; border: string; icon: string }> = {
  message: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-500', icon: 'bg-blue-500' },
  option: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-500', icon: 'bg-green-500' },
  action: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-500', icon: 'bg-orange-500' },
  condition: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-500', icon: 'bg-yellow-500' },
  delay: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-500', icon: 'bg-purple-500' },
  input: { bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-500', icon: 'bg-teal-500' },
};

export const CustomGenericNode: React.FC<NodeProps> = ({ data, id, type }) => {
  const nodeData = data as NodeData;
  const Icon = iconMap[type || 'message'] || MessageSquare;
  const colors = colorMap[type || 'message'] || colorMap.message;

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const event = new CustomEvent('addNodeFromHandle', { 
      detail: { sourceNodeId: id } 
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="relative">
      {/* Handle de entrada */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-4 !h-4 !bg-gray-400 !border-2 !border-white"
      />

      {/* Nodo principal */}
      <div className={`bg-white dark:bg-gray-800 border-2 ${colors.border} rounded-xl shadow-lg p-4 min-w-[280px] hover:shadow-xl transition-all hover:-translate-y-1`}>
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 ${colors.icon} rounded-lg flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 dark:text-white">
              {nodeData.label || type?.charAt(0).toUpperCase() + type?.slice(1)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {nodeData.subtype || 'Bloque personalizado'}
            </div>
          </div>
        </div>
        
        {/* Contenido del nodo */}
        <div className={`${colors.bg} rounded-lg p-3`}>
          {nodeData.text ? (
            <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
              {nodeData.text}
            </div>
          ) : (
            <div className="text-sm text-gray-400 dark:text-gray-500 italic">
              Haz clic para editar...
            </div>
          )}
          
          {/* Mostrar opciones si existen */}
          {Array.isArray(nodeData.options) && nodeData.options.length > 0 && (
            <div className="mt-2 space-y-1">
              {nodeData.options.slice(0, 3).map((option: string | { label?: string; value?: string }, idx: number) => (
                <div key={idx} className="text-xs bg-white dark:bg-gray-700 rounded px-2 py-1 text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <span className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-semibold">
                    {idx + 1}
                  </span>
                  {typeof option === 'string' ? option : (option.label || 'Opción sin nombre')}
                </div>
              ))}
              {nodeData.options.length > 3 && (
                <div className="text-xs text-gray-400 pl-6">
                  +{nodeData.options.length - 3} más...
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Handle de salida con botón + integrado */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        <Handle
          type="source"
          position={Position.Bottom}
          className={`!w-4 !h-4 !border-2 !border-white ${colors.icon.replace('bg-', '!bg-')}`}
        />
        <button
          onClick={handleAddClick}
          className={`mt-1 w-8 h-8 ${colors.icon.replace('bg-', 'bg-')} hover:opacity-90 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-10`}
          title="Agregar siguiente bloque"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
