import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { MousePointer } from 'lucide-react';

export const OptionNodeComponent: React.FC = () => {
  return (
    <div className="bg-node-option border-2 border-node-option-border rounded-xl p-4 min-w-[220px] shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-node-option-border !border-white !w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
      />
      
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-node-option-border rounded-lg">
          <MousePointer className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-semibold text-sm text-node-option-border">Opciones</span>
          <div className="text-xs text-muted-foreground">Botones de elección</div>
        </div>
      </div>
      
      <div className="text-xs bg-node-option-accent/10 text-node-option-accent px-2 py-1 rounded-md">
        Presenta opciones al usuario
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-node-option-border !border-white !w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
      />
    </div>
  );
};