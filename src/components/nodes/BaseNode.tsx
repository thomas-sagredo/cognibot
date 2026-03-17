import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MoreVertical,
  Edit3,
  Copy,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { NodeData } from '@/types/builder';
import { getNodeOptionByType } from '@/config/nodeCategories';

interface BaseNodeProps extends NodeProps {
  data: NodeData;
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onAddNode?: () => void;
  validation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  className?: string;
}

export const BaseNode: React.FC<BaseNodeProps> = ({
  id,
  data,
  selected,
  children,
  onEdit,
  onDelete,
  onDuplicate,
  onAddNode,
  validation,
  className,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  
  // Obtener información del tipo de nodo
  const nodeInfo = getNodeOptionByType(data.subtype || 'text', data.subtype);
  const NodeIcon = nodeInfo?.icon;

  // Manejar teclado para accesibilidad
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        onEdit?.();
        break;
      case 'Delete':
      case 'Backspace':
        if (id !== 'start-initial') {
          e.preventDefault();
          onDelete?.();
        }
        break;
      case 'Escape':
        setIsMenuOpen(false);
        break;
    }
  };

  // Focus management
  useEffect(() => {
    if (selected && nodeRef.current) {
      nodeRef.current.focus();
    }
  }, [selected]);

  const getValidationStatus = () => {
    if (!validation) return null;
    
    if (!validation.isValid && validation.errors.length > 0) {
      return {
        icon: AlertCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50 border-red-200',
        message: validation.errors[0],
      };
    }
    
    if (validation.warnings.length > 0) {
      return {
        icon: AlertCircle,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50 border-orange-200',
        message: validation.warnings[0],
      };
    }
    
    return {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50 border-green-200',
      message: 'Nodo válido',
    };
  };

  const validationStatus = getValidationStatus();
  const ValidationIcon = validationStatus?.icon;

  const isStartNode = id === 'start-initial';
  const isDeletable = !isStartNode && onDelete;

  return (
    <>
      {/* Handle de entrada (excepto nodo inicial) */}
      {!isStartNode && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
          aria-label="Punto de conexión de entrada"
        />
      )}

      <Card
        ref={nodeRef}
        role="button"
        tabIndex={0}
        aria-label={`Nodo ${data.label || data.subtype}: ${data.text || 'Sin configurar'}`}
        aria-selected={selected}
        aria-describedby={validation ? `${id}-validation` : undefined}
        onKeyDown={handleKeyDown}
        className={cn(
          "min-w-[200px] max-w-[300px] cursor-pointer transition-all duration-200",
          "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          selected && "ring-2 ring-blue-500 ring-offset-2 shadow-lg",
          validationStatus?.bgColor,
          className
        )}
      >
        <CardContent className="p-0">
          {/* Header del nodo */}
          <div className="flex items-center justify-between p-3 border-b bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {NodeIcon && (
                <div className="flex-shrink-0">
                  <NodeIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {data.label || 'Nodo sin título'}
                </h3>
                {data.subtype && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {nodeInfo?.label || data.subtype}
                  </Badge>
                )}
              </div>
            </div>

            {/* Indicador de validación */}
            {ValidationIcon && (
              <div className="flex-shrink-0 ml-2">
                <ValidationIcon 
                  className={cn("w-4 h-4", validationStatus.color)}
                  aria-label={validationStatus.message}
                />
              </div>
            )}

            {/* Menú de acciones */}
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-2 flex-shrink-0"
                  aria-label="Opciones del nodo"
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit} className="gap-2">
                    <Edit3 className="w-4 h-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onClick={onDuplicate} className="gap-2">
                    <Copy className="w-4 h-4" />
                    Duplicar
                  </DropdownMenuItem>
                )}
                {onAddNode && (
                  <DropdownMenuItem onClick={onAddNode} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Agregar siguiente
                  </DropdownMenuItem>
                )}
                {isDeletable && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={onDelete}
                      className="gap-2 text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Contenido del nodo */}
          <div className="p-3">
            {children}
          </div>

          {/* Footer con información adicional */}
          {(data.variableName || data.saveToVariable) && (
            <div className="px-3 pb-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded px-2 py-1">
                {data.variableName && `Variable: ${data.variableName}`}
                {data.saveToVariable && `Guardar en: ${data.saveToVariable}`}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Handle de salida */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
        aria-label="Punto de conexión de salida"
      />

      {/* Información de validación para screen readers */}
      {validation && (
        <div id={`${id}-validation`} className="sr-only">
          {validation.errors.length > 0 && (
            <div>Errores: {validation.errors.join(', ')}</div>
          )}
          {validation.warnings.length > 0 && (
            <div>Advertencias: {validation.warnings.join(', ')}</div>
          )}
        </div>
      )}
    </>
  );
};
