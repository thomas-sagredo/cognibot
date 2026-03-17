import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsProps {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onToggleSimulator?: () => void;
  onToggleDarkMode?: () => void;
  onSelectAll?: () => void;
  onEscape?: () => void;
  disabled?: boolean;
}

export const useKeyboardShortcuts = ({
  onSave,
  onUndo,
  onRedo,
  onDelete,
  onDuplicate,
  onZoomIn,
  onZoomOut,
  onFitView,
  onToggleSimulator,
  onToggleDarkMode,
  onSelectAll,
  onEscape,
  disabled = false,
}: UseKeyboardShortcutsProps) => {
  
  const shortcuts: KeyboardShortcut[] = [
    // Guardado
    {
      key: 's',
      ctrlKey: true,
      action: () => {
        onSave?.();
        toast.success('Guardando...', { duration: 1000 });
      },
      description: 'Guardar flujo',
      preventDefault: true,
    },
    
    // Deshacer/Rehacer
    {
      key: 'z',
      ctrlKey: true,
      action: () => {
        onUndo?.();
        toast.info('Deshecho', { duration: 1000 });
      },
      description: 'Deshacer',
      preventDefault: true,
    },
    {
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      action: () => {
        onRedo?.();
        toast.info('Rehecho', { duration: 1000 });
      },
      description: 'Rehacer',
      preventDefault: true,
    },
    
    // Eliminar
    {
      key: 'Delete',
      action: () => {
        onDelete?.();
      },
      description: 'Eliminar nodo seleccionado',
    },
    {
      key: 'Backspace',
      action: () => {
        onDelete?.();
      },
      description: 'Eliminar nodo seleccionado',
    },
    
    // Duplicar
    {
      key: 'd',
      ctrlKey: true,
      action: () => {
        onDuplicate?.();
        toast.success('Nodo duplicado', { duration: 1000 });
      },
      description: 'Duplicar nodo seleccionado',
      preventDefault: true,
    },
    
    // Zoom
    {
      key: '=',
      ctrlKey: true,
      action: () => {
        onZoomIn?.();
      },
      description: 'Acercar',
      preventDefault: true,
    },
    {
      key: '+',
      ctrlKey: true,
      action: () => {
        onZoomIn?.();
      },
      description: 'Acercar',
      preventDefault: true,
    },
    {
      key: '-',
      ctrlKey: true,
      action: () => {
        onZoomOut?.();
      },
      description: 'Alejar',
      preventDefault: true,
    },
    
    // Ajustar vista
    {
      key: '0',
      ctrlKey: true,
      action: () => {
        onFitView?.();
      },
      description: 'Ajustar vista',
      preventDefault: true,
    },
    
    // Seleccionar todo
    {
      key: 'a',
      ctrlKey: true,
      action: () => {
        onSelectAll?.();
      },
      description: 'Seleccionar todos los nodos',
      preventDefault: true,
    },
    
    // Toggle simulador
    {
      key: 'p',
      ctrlKey: true,
      action: () => {
        onToggleSimulator?.();
        toast.info('Simulador alternado', { duration: 1000 });
      },
      description: 'Alternar simulador',
      preventDefault: true,
    },
    
    // Toggle modo oscuro
    {
      key: 't',
      ctrlKey: true,
      action: () => {
        onToggleDarkMode?.();
      },
      description: 'Alternar modo oscuro',
      preventDefault: true,
    },
    
    // Escape
    {
      key: 'Escape',
      action: () => {
        onEscape?.();
      },
      description: 'Cancelar acción actual',
    },
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled) return;
    
    // No procesar si estamos en un input, textarea o elemento editable
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true' ||
      target.closest('[contenteditable="true"]')
    ) {
      return;
    }

    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrlKey === (event.ctrlKey || event.metaKey);
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
      const altMatches = !!shortcut.altKey === event.altKey;
      
      return keyMatches && ctrlMatches && shiftMatches && altMatches;
    });

    if (matchingShortcut) {
      if (matchingShortcut.preventDefault) {
        event.preventDefault();
      }
      matchingShortcut.action();
    }
  }, [shortcuts, disabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Función para mostrar ayuda de atajos
  const showShortcutsHelp = useCallback(() => {
    const shortcutsList = shortcuts
      .map(shortcut => {
        let keys = [];
        if (shortcut.ctrlKey) keys.push('Ctrl');
        if (shortcut.shiftKey) keys.push('Shift');
        if (shortcut.altKey) keys.push('Alt');
        keys.push(shortcut.key);
        
        return `${keys.join(' + ')}: ${shortcut.description}`;
      })
      .join('\n');

    toast.info('Atajos de teclado disponibles:', {
      description: shortcutsList,
      duration: 5000,
    });
  }, [shortcuts]);

  return {
    shortcuts,
    showShortcutsHelp,
  };
};

// Hook específico para el canvas
export const useCanvasKeyboardShortcuts = (reactFlowInstance: any) => {
  const handleZoomIn = useCallback(() => {
    reactFlowInstance?.zoomIn();
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    reactFlowInstance?.zoomOut();
  }, [reactFlowInstance]);

  const handleFitView = useCallback(() => {
    reactFlowInstance?.fitView({ padding: 0.2 });
  }, [reactFlowInstance]);

  const handleSelectAll = useCallback(() => {
    const nodes = reactFlowInstance?.getNodes();
    if (nodes) {
      const updatedNodes = nodes.map((node: any) => ({
        ...node,
        selected: true,
      }));
      reactFlowInstance?.setNodes(updatedNodes);
    }
  }, [reactFlowInstance]);

  return {
    handleZoomIn,
    handleZoomOut,
    handleFitView,
    handleSelectAll,
  };
};

// Utilidad para formatear atajos para mostrar
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const keys = [];
  
  if (shortcut.ctrlKey) {
    keys.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
  }
  if (shortcut.shiftKey) keys.push('⇧');
  if (shortcut.altKey) keys.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt');
  
  // Formatear teclas especiales
  let keyDisplay = shortcut.key;
  switch (shortcut.key.toLowerCase()) {
    case 'delete':
      keyDisplay = '⌫';
      break;
    case 'backspace':
      keyDisplay = '⌫';
      break;
    case 'escape':
      keyDisplay = '⎋';
      break;
    case 'enter':
      keyDisplay = '↵';
      break;
    case ' ':
      keyDisplay = '␣';
      break;
    default:
      keyDisplay = shortcut.key.toUpperCase();
  }
  
  keys.push(keyDisplay);
  return keys.join(' + ');
};
