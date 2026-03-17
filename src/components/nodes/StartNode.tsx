import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bot } from 'lucide-react';

export const StartNodeComponent: React.FC = () => {
  return (
    <div className="bg-node-start border-2 border-node-start-border rounded-xl p-4 min-w-[220px] shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-node-start-border rounded-lg">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-semibold text-sm text-node-start-border">Inicio</span>
          <div className="text-xs text-muted-foreground">Punto de entrada</div>
        </div>
      </div>
      
      <div className="text-xs bg-node-start-accent/10 text-node-start-accent px-2 py-1 rounded-md">
        Nodo de bienvenida del chatbot
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-node-start-border !border-white !w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
      />
    </div>
  );
};