import { useState, useCallback, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import { toast } from 'sonner';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
}

const MAX_HISTORY = 50;

export const useHistory = (initialNodes: Node[], initialEdges: Edge[]) => {
  const [history, setHistory] = useState<HistoryState[]>([
    { nodes: initialNodes, edges: initialEdges, timestamp: Date.now() }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Guardar estado en el historial
  const saveToHistory = useCallback((nodes: Node[], edges: Edge[]) => {
    setHistory(prev => {
      // Eliminar estados futuros si estamos en medio del historial
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Agregar nuevo estado
      const newState: HistoryState = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        timestamp: Date.now(),
      };
      
      newHistory.push(newState);
      
      // Limitar tamaño del historial
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
        setCurrentIndex(prev => prev - 1);
      } else {
        setCurrentIndex(newHistory.length - 1);
      }
      
      return newHistory;
    });
  }, [currentIndex]);

  // Deshacer
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      toast.success('Cambio deshecho', { duration: 1000 });
      return history[currentIndex - 1];
    } else {
      toast.warning('No hay más cambios para deshacer', { duration: 1000 });
      return null;
    }
  }, [currentIndex, history]);

  // Rehacer
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      toast.success('Cambio rehecho', { duration: 1000 });
      return history[currentIndex + 1];
    } else {
      toast.warning('No hay más cambios para rehacer', { duration: 1000 });
      return null;
    }
  }, [currentIndex, history]);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    saveToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    currentState: history[currentIndex],
    historyLength: history.length,
    currentIndex,
  };
};
