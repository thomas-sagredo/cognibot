import React, { useState, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { BuilderToolbar } from './BuilderToolbar';
import { BuilderCanvas } from './BuilderCanvas';
import { BuilderSidebar } from './BuilderSidebar';
import { MobileBuilderView } from './MobileBuilderView';
import { TabletBuilderView } from './TabletBuilderView';
import { useBuilderState } from '@/hooks/useBuilderState';
import { useFlowValidation } from '@/hooks/useFlowValidation';
import { useAutoSave } from '@/hooks/useAutoSave';
import { LoadingOverlay } from '@/components/ui/loading-states';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ResponsiveBuilderLayout: React.FC = () => {
  // Media queries para responsive design
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  const isDesktop = !isMobile && !isTablet;

  // Estado del builder
  const builderState = useBuilderState();
  const {
    nodes,
    edges,
    selectedNode,
    darkMode,
    showSimulator,
    setDarkMode,
    setShowSimulator,
  } = builderState;

  // Validación del flujo
  const { errors, hasErrors, hasWarnings, isValid } = useFlowValidation(nodes, edges);

  // Auto-guardado
  const { isSaving, lastSaved, saveFlow } = useAutoSave(builderState);

  // Estado para mobile drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Aplicar tema oscuro
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Simular carga inicial
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Handlers para la toolbar
  const handleSave = () => {
    saveFlow();
  };

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleToggleSimulator = () => {
    setShowSimulator(!showSimulator);
  };

  // Loading state
  if (isLoading) {
    return (
      <LoadingOverlay 
        isVisible={true} 
        message="Cargando constructor de chatbots..." 
      />
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <ReactFlowProvider>
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
          {/* Mobile Header */}
          <div className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Drawer open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Menu className="w-5 h-5" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="h-[80vh]">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">Herramientas</h2>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                    <BuilderSidebar 
                      {...builderState}
                      isMobile={true}
                      onClose={() => setIsMobileMenuOpen(false)}
                    />
                  </div>
                </DrawerContent>
              </Drawer>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Constructor
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={showSimulator ? "default" : "outline"}
                size="sm"
                onClick={handleToggleSimulator}
                className="text-xs px-2"
              >
                {showSimulator ? 'Canvas' : 'Simular'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleDarkMode}
                className="p-2"
              >
                {darkMode ? '☀️' : '🌙'}
              </Button>
            </div>
          </div>

          {/* Mobile Content */}
          <div className="flex-1 overflow-hidden">
            <MobileBuilderView 
              builderState={builderState}
              validation={{ errors, hasErrors, hasWarnings, isValid }}
              onSave={handleSave}
              isSaving={isSaving}
            />
          </div>
        </div>
      </ReactFlowProvider>
    );
  }

  // Tablet Layout
  if (isTablet) {
    return (
      <ReactFlowProvider>
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
          <BuilderToolbar
            isSaving={isSaving}
            lastSaved={lastSaved}
            onSave={handleSave}
            errors={errors}
            hasErrors={hasErrors}
            hasWarnings={hasWarnings}
            isValid={isValid}
            darkMode={darkMode}
            onToggleDarkMode={handleToggleDarkMode}
            showSimulator={showSimulator}
            onToggleSimulator={handleToggleSimulator}
          />
          
          <div className="flex-1 overflow-hidden">
            <TabletBuilderView 
              builderState={builderState}
              validation={{ errors, hasErrors, hasWarnings, isValid }}
            />
          </div>
        </div>
      </ReactFlowProvider>
    );
  }

  // Desktop Layout
  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <BuilderToolbar
          isSaving={isSaving}
          lastSaved={lastSaved}
          onSave={handleSave}
          errors={errors}
          hasErrors={hasErrors}
          hasWarnings={hasWarnings}
          isValid={isValid}
          darkMode={darkMode}
          onToggleDarkMode={handleToggleDarkMode}
          showSimulator={showSimulator}
          onToggleSimulator={handleToggleSimulator}
        />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar izquierdo */}
          <div className={cn(
            "transition-all duration-300 border-r border-gray-200 dark:border-gray-700",
            builderState.sidebarCollapsed ? "w-16" : "w-80"
          )}>
            <BuilderSidebar {...builderState} />
          </div>

          {/* Canvas principal */}
          <div className="flex-1 relative">
            <BuilderCanvas {...builderState} />
          </div>

          {/* Panel de propiedades derecho */}
          {selectedNode && (
            <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="h-full overflow-y-auto">
                {/* Aquí iría el panel de propiedades mejorado */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-4">
                    Propiedades del Nodo
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Editando: {selectedNode.data.label}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Simulador (si está activo) */}
          {showSimulator && (
            <div className="w-96 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="h-full overflow-y-auto">
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-4">
                    Simulador de Chat
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Prueba tu chatbot aquí
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default ResponsiveBuilderLayout;
