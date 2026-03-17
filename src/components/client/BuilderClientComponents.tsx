'use client';

// Client Components para interactividad del builder
import React, { useState, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useOptimizedBuilder } from '@/hooks/useOptimizedBuilder';
import { LazyBuilderComponents } from '@/utils/lazyComponents';

// Client Component principal que maneja la interactividad
export function InteractiveBuilder({
  initialData,
  userConfig,
}: {
  initialData?: any;
  userConfig?: any;
}) {
  const [isHydrated, setIsHydrated] = useState(false);
  const builderState = useOptimizedBuilder();

  // Hydration check
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Initialize with server data
  useEffect(() => {
    if (initialData && isHydrated) {
      // Initialize builder with server-provided data
      builderState.nodeOperations.initializeFromServer(initialData);
    }
  }, [initialData, isHydrated, builderState]);

  if (!isHydrated) {
    // Return server-rendered content during hydration
    return <BuilderSSRFallback />;
  }

  return (
    <ReactFlowProvider>
      <div className="interactive-builder">
        <LazyBuilderComponents.Canvas {...builderState.flowHandlers} />
        <LazyBuilderComponents.Sidebar />
        <LazyBuilderComponents.PropertiesPanel />
      </div>
    </ReactFlowProvider>
  );
}

// Fallback component for SSR/hydration
function BuilderSSRFallback() {
  return (
    <div className="builder-ssr-fallback">
      <div className="h-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Initializing builder...</p>
        </div>
      </div>
    </div>
  );
}

// Client Component para manejo de estado global
export function BuilderStateManager({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: any;
}) {
  const [builderState, setBuilderState] = useState(initialState || {});

  // Sync with server state
  useEffect(() => {
    if (typeof window !== 'undefined' && window.__BUILDER_CONFIG__) {
      setBuilderState(prev => ({
        ...prev,
        config: window.__BUILDER_CONFIG__,
      }));
    }
  }, []);

  return (
    <BuilderContext.Provider value={{ builderState, setBuilderState }}>
      {children}
    </BuilderContext.Provider>
  );
}

// Context for builder state
const BuilderContext = React.createContext<{
  builderState: any;
  setBuilderState: React.Dispatch<React.SetStateAction<any>>;
} | null>(null);

export const useBuilderContext = () => {
  const context = React.useContext(BuilderContext);
  if (!context) {
    throw new Error('useBuilderContext must be used within BuilderStateManager');
  }
  return context;
};

// Client Component para real-time features
export function BuilderRealtimeFeatures({
  chatbotId,
}: {
  chatbotId?: string;
}) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!chatbotId) return;

    // Setup WebSocket connection for real-time collaboration
    const ws = new WebSocket(`ws://localhost:8000/ws/builder/${chatbotId}`);
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log('Connected to real-time builder');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Handle real-time updates
      handleRealtimeUpdate(data);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('Disconnected from real-time builder');
    };

    return () => {
      ws.close();
    };
  }, [chatbotId]);

  const handleRealtimeUpdate = (data: any) => {
    // Handle different types of real-time updates
    switch (data.type) {
      case 'node_added':
        // Update local state with new node
        break;
      case 'node_updated':
        // Update existing node
        break;
      case 'user_cursor':
        // Show other users' cursors
        break;
    }
  };

  return (
    <div className="realtime-status">
      {isConnected && (
        <div className="flex items-center gap-2 text-xs text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Real-time sync active
        </div>
      )}
    </div>
  );
}

// Client Component para analytics y tracking
export function BuilderAnalytics({
  userId,
  chatbotId,
}: {
  userId: string;
  chatbotId?: string;
}) {
  useEffect(() => {
    // Track builder usage
    const trackEvent = (event: string, properties?: any) => {
      // Send to analytics service
      console.log('Analytics:', event, properties);
    };

    // Track page view
    trackEvent('builder_opened', {
      userId,
      chatbotId,
      timestamp: new Date().toISOString(),
    });

    // Track user interactions
    const handleNodeAdd = () => trackEvent('node_added');
    const handleNodeDelete = () => trackEvent('node_deleted');
    const handleSave = () => trackEvent('chatbot_saved');

    // Add event listeners
    document.addEventListener('builder:node_added', handleNodeAdd);
    document.addEventListener('builder:node_deleted', handleNodeDelete);
    document.addEventListener('builder:saved', handleSave);

    return () => {
      document.removeEventListener('builder:node_added', handleNodeAdd);
      document.removeEventListener('builder:node_deleted', handleNodeDelete);
      document.removeEventListener('builder:saved', handleSave);
    };
  }, [userId, chatbotId]);

  return null; // This component doesn't render anything
}

// Client Component para keyboard shortcuts
export function BuilderKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle global keyboard shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            document.dispatchEvent(new CustomEvent('builder:save'));
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              document.dispatchEvent(new CustomEvent('builder:redo'));
            } else {
              document.dispatchEvent(new CustomEvent('builder:undo'));
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
}

// Declare global types for server-injected data
declare global {
  interface Window {
    __BUILDER_CONFIG__?: {
      nodeTypes: any[];
      permissions: string[];
    };
  }
}
