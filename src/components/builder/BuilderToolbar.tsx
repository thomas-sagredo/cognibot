import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Save,
  Loader2,
  Eye,
  Moon,
  Sun,
  AlertCircle,
  CheckCircle,
  Clock,
  Undo,
  Redo,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FlowValidationError } from '@/types/builder';

interface BuilderToolbarProps {
  // Estado de guardado
  isSaving: boolean;
  lastSaved: Date;
  onSave: () => void;
  
  // Validación
  errors: FlowValidationError[];
  hasErrors: boolean;
  hasWarnings: boolean;
  isValid: boolean;
  
  // Tema
  darkMode: boolean;
  onToggleDarkMode: () => void;
  
  // Simulador
  showSimulator: boolean;
  onToggleSimulator: () => void;
  
  // Historial (opcional - para futuras implementaciones)
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  
  // Testing
  onTestFlow?: () => void;
}

export const BuilderToolbar: React.FC<BuilderToolbarProps> = ({
  isSaving,
  lastSaved,
  onSave,
  errors,
  hasErrors,
  hasWarnings,
  isValid,
  darkMode,
  onToggleDarkMode,
  showSimulator,
  onToggleSimulator,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onTestFlow,
}) => {
  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Guardado hace un momento';
    if (diffInMinutes === 1) return 'Guardado hace 1 minuto';
    if (diffInMinutes < 60) return `Guardado hace ${diffInMinutes} minutos`;
    
    return `Guardado a las ${date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  };

  const getValidationStatus = () => {
    if (hasErrors) {
      return {
        icon: AlertCircle,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        text: `${errors.filter(e => e.severity === 'error').length} errores`,
      };
    }
    
    if (hasWarnings) {
      return {
        icon: AlertCircle,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        text: `${errors.filter(e => e.severity === 'warning').length} advertencias`,
      };
    }
    
    return {
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      text: 'Flujo válido',
    };
  };

  const validationStatus = getValidationStatus();
  const ValidationIcon = validationStatus.icon;

  return (
    <div className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
      {/* Lado izquierdo - Acciones principales */}
      <div className="flex items-center gap-3">
        {/* Botón de guardar */}
        <Button
          size="sm"
          onClick={onSave}
          disabled={!isValid || isSaving}
          className={cn(
            "gap-2",
            isSaving && "cursor-not-allowed"
          )}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? 'Guardando...' : 'Guardar'}
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Historial - Deshacer/Rehacer */}
        {(onUndo || onRedo) && (
          <>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onUndo}
                disabled={!canUndo}
                className="p-2"
                title="Deshacer (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRedo}
                disabled={!canRedo}
                className="p-2"
                title="Rehacer (Ctrl+Shift+Z)"
              >
                <Redo className="w-4 h-4" />
              </Button>
            </div>
            <Separator orientation="vertical" className="h-6" />
          </>
        )}

        {/* Estado de validación */}
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
          validationStatus.bgColor
        )}>
          <ValidationIcon className={cn("w-4 h-4", validationStatus.color)} />
          <span className={validationStatus.color}>
            {validationStatus.text}
          </span>
        </div>

        {/* Último guardado */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock className="w-4 h-4" />
          <span>{formatLastSaved(lastSaved)}</span>
        </div>
      </div>

      {/* Lado derecho - Controles de vista */}
      <div className="flex items-center gap-2">
        {/* Botón de prueba */}
        {onTestFlow && (
          <Button
            variant="outline"
            size="sm"
            onClick={onTestFlow}
            className="gap-2"
            disabled={hasErrors}
          >
            <Play className="w-4 h-4" />
            Probar
          </Button>
        )}

        {/* Toggle simulador */}
        <Button
          variant={showSimulator ? "default" : "outline"}
          size="sm"
          onClick={onToggleSimulator}
          className="gap-2"
        >
          <Eye className="w-4 h-4" />
          {showSimulator ? 'Ocultar' : 'Simular'}
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Toggle tema oscuro */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleDarkMode}
          className="p-2"
          title={darkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
        >
          {darkMode ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
