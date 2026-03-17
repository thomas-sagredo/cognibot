import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Keyboard } from 'lucide-react';

export const InputNodeComponent: React.FC = () => {
  return (
    <div className="bg-node-message border-2 border-node-message-border rounded-xl p-4 min-w-[220px] shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-node-message-border !border-white !w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
      />

      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-node-message-border rounded-lg">
          <Keyboard className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-semibold text-sm text-node-message-border">Input</span>
          <div className="text-xs text-muted-foreground">Solicita un valor</div>
        </div>
      </div>

      <div className="text-xs bg-node-message-accent/10 text-node-message-accent px-2 py-1 rounded-md">
        Guarda en variable y continúa
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-node-message-border !border-white !w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
      />
    </div>
  );
};


