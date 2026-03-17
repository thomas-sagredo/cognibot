import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Timer } from 'lucide-react';

export const DelayNodeComponent: React.FC = () => {
  return (
    <div className="bg-node-action border-2 border-node-action-border rounded-xl p-4 min-w-[220px] shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-node-action-border !border-white !w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
      />

      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-node-action-border rounded-lg">
          <Timer className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-semibold text-sm text-node-action-border">Delay</span>
          <div className="text-xs text-muted-foreground">Espera antes de continuar</div>
        </div>
      </div>

      <div className="text-xs bg-node-action-accent/10 text-node-action-accent px-2 py-1 rounded-md">
        Configura milisegundos
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-node-action-border !border-white !w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
      />
    </div>
  );
};


