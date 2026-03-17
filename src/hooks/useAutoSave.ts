import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { AUTO_SAVE_INTERVAL } from '@/types/builder';

interface UseAutoSaveProps {
  nodes: any[];
  edges: any[];
  variables: any[];
  welcomeMessage: string;
  setLastSaved: (date: Date) => void;
}

export const useAutoSave = (builderState: UseAutoSaveProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const autoSaveRef = useRef<NodeJS.Timeout>();
  const lastSaveDataRef = useRef<string>('');
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Mutation para guardar
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user) throw new Error('Usuario no autenticado');
      
      const chatbotData = {
        nombre: `Chatbot ${new Date().toLocaleDateString()}`,
        descripcion: 'Chatbot creado con el constructor visual',
        configuracion: {
          nodes: data.nodes,
          edges: data.edges,
          variables: data.variables,
          welcomeMessage: data.welcomeMessage,
          version: '1.0.0',
          lastModified: new Date().toISOString(),
        }
      };

      // Si hay un chatbot existente, actualizarlo; si no, crear uno nuevo
      const existingChatbotId = localStorage.getItem('currentChatbotId');
      
      if (existingChatbotId) {
        return await apiService.updateChatbot(parseInt(existingChatbotId), chatbotData);
      } else {
        const response = await apiService.createChatbot(chatbotData);
        localStorage.setItem('currentChatbotId', response.id.toString());
        return response;
      }
    },
    onSuccess: () => {
      const now = new Date();
      setLastSaved(now);
      builderState.setLastSaved(now);
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
      toast.success('Cambios guardados automáticamente', {
        duration: 2000,
      });
    },
    onError: (error: any) => {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar los cambios', {
        description: 'Inténtalo de nuevo o verifica tu conexión',
        duration: 4000,
      });
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  // Función para guardar manualmente
  const saveFlow = useCallback(async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    
    const dataToSave = {
      nodes: builderState.nodes,
      edges: builderState.edges,
      variables: builderState.variables,
      welcomeMessage: builderState.welcomeMessage,
    };

    await saveMutation.mutateAsync(dataToSave);
  }, [builderState, isSaving, saveMutation]);

  // Auto-guardado inteligente
  useEffect(() => {
    // Limpiar timeout anterior
    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current);
    }

    // Crear hash del estado actual para detectar cambios
    const currentData = JSON.stringify({
      nodes: builderState.nodes,
      edges: builderState.edges,
      variables: builderState.variables,
      welcomeMessage: builderState.welcomeMessage,
    });

    // Solo auto-guardar si hay cambios y más de un nodo
    if (
      builderState.nodes.length > 1 && 
      currentData !== lastSaveDataRef.current &&
      !isSaving
    ) {
      autoSaveRef.current = setTimeout(() => {
        lastSaveDataRef.current = currentData;
        saveFlow();
      }, AUTO_SAVE_INTERVAL);
    }

    // Cleanup
    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [
    builderState.nodes,
    builderState.edges,
    builderState.variables,
    builderState.welcomeMessage,
    isSaving,
    saveFlow
  ]);

  // Guardar antes de cerrar la página
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const currentData = JSON.stringify({
        nodes: builderState.nodes,
        edges: builderState.edges,
        variables: builderState.variables,
        welcomeMessage: builderState.welcomeMessage,
      });

      if (currentData !== lastSaveDataRef.current && builderState.nodes.length > 1) {
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [builderState]);

  // Atajos de teclado para guardar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFlow();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saveFlow]);

  return {
    isSaving: isSaving || saveMutation.isPending,
    lastSaved,
    saveFlow,
    hasUnsavedChanges: () => {
      const currentData = JSON.stringify({
        nodes: builderState.nodes,
        edges: builderState.edges,
        variables: builderState.variables,
        welcomeMessage: builderState.welcomeMessage,
      });
      return currentData !== lastSaveDataRef.current;
    },
  };
};
