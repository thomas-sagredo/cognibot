import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Trash2 } from 'lucide-react';

interface NodeToolbarProps {
  onDuplicate: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export const NodeToolbar: React.FC<NodeToolbarProps> = ({ onDuplicate, onDelete, disabled }) => {
  return (
    <div className="absolute top-4 left-4 z-10 flex gap-2">
      <Button size="sm" variant="outline" onClick={onDuplicate} disabled={disabled}>
        <Copy className="w-4 h-4 mr-1" /> Duplicar
      </Button>
      <Button size="sm" variant="outline" onClick={onDelete} disabled={disabled} className="hover:text-red-600 hover:border-red-300">
        <Trash2 className="w-4 h-4 mr-1" /> Eliminar
      </Button>
    </div>
  );
};