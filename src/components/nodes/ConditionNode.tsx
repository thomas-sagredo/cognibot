import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

export const ConditionNodeComponent: React.FC = () => {
  return (
    <div className="bg-node-condition border-2 border-node-condition-border rounded-xl p-4 min-w-[220px] shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-node-condition-border !border-white !w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
      />
      
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-node-condition-border rounded-lg">
          <GitBranch className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-semibold text-sm text-node-condition-border">Condición</span>
          <div className="text-xs text-muted-foreground">Lógica if/else</div>
        </div>
      </div>
      
      <div className="text-xs bg-node-condition-accent/10 text-node-condition-accent px-2 py-1 rounded-md mb-3">
        Evalúa condiciones y ramifica
      </div>

      <div className="flex justify-between items-center text-xs">
        <span className="text-green-600 font-medium">Verdadero</span>
        <span className="text-red-600 font-medium">Falso</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="!bg-green-500 !border-white !w-3 !h-3 !left-1/4 hover:!w-4 hover:!h-4 transition-all"
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!bg-red-500 !border-white !w-3 !h-3 !left-3/4 hover:!w-4 hover:!h-4 transition-all"
      />
    </div>
  );
};