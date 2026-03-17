import React, { useState } from 'react';
import { BuilderCanvas } from './BuilderCanvas';
import { BuilderSidebar } from './BuilderSidebar';
import { ImprovedPropertiesPanel } from '../ImprovedPropertiesPanel';
import { ChatSimulator } from '../ChatSimulator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import {
  Eye,
  EyeOff,
  Settings,
  Layers,
  Play,
  PanelLeftClose,
  PanelLeftOpen,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabletBuilderViewProps {
  builderState: any;
  validation: {
    errors: any[];
    hasErrors: boolean;
    hasWarnings: boolean;
    isValid: boolean;
  };
}

export const TabletBuilderView: React.FC<TabletBuilderViewProps> = ({
  builderState,
  validation,
}) => {
  const [activeView, setActiveView] = useState<'canvas' | 'simulator'>('canvas');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showProperties, setShowProperties] = useState(true);

  const {
    nodes,
    edges,
    selectedNode,
    setSelectedNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    darkMode,
    updateNode,
    sidebarCollapsed,
    setSidebarCollapsed,
    activeSidebarItem,
    setActiveSidebarItem,
    addNode,
    variables,
  } = builderState;

  const handleNodeClick = (event: React.MouseEvent, node: any) => {
    setSelectedNode(node);
    if (!showProperties) {
      setShowProperties(true);
    }
  };

  const handlePaneClick = () => {
    setSelectedNode(null);
  };

  const getValidationIcon = () => {
    if (validation.hasErrors) return AlertCircle;
    if (validation.hasWarnings) return AlertCircle;
    return CheckCircle;
  };

  const getValidationColor = () => {
    if (validation.hasErrors) return 'text-red-500';
    if (validation.hasWarnings) return 'text-orange-500';
    return 'text-green-500';
  };

  const ValidationIcon = getValidationIcon();

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top Controls */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2"
            >
              {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </Button>

            <div className="flex items-center gap-2">
              <ValidationIcon className={cn("w-4 h-4", getValidationColor())} />
              <span className={cn("text-sm", getValidationColor())}>
                {validation.hasErrors ? `${validation.errors.filter(e => e.severity === 'error').length} errores` :
                 validation.hasWarnings ? `${validation.errors.filter(e => e.severity === 'warning').length} advertencias` :
                 'Flujo válido'}
              </span>
            </div>
          </div>

          {/* Center - View Toggle */}
          <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'canvas' | 'simulator')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="canvas" className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Canvas
              </TabsTrigger>
              <TabsTrigger value="simulator" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Simulador
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {nodes.length} nodos • {edges.length} conexiones
            </Badge>
            
            {selectedNode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProperties(!showProperties)}
                className="p-2"
              >
                {showProperties ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Sidebar */}
          {showSidebar && (
            <>
              <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
                <BuilderSidebar
                  sidebarCollapsed={sidebarCollapsed}
                  setSidebarCollapsed={setSidebarCollapsed}
                  activeSidebarItem={activeSidebarItem}
                  setActiveSidebarItem={setActiveSidebarItem}
                  addNode={addNode}
                  variables={variables}
                  darkMode={darkMode}
                />
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}

          {/* Main Canvas/Simulator */}
          <ResizablePanel defaultSize={showSidebar ? (showProperties ? 50 : 75) : (showProperties ? 75 : 100)}>
            <div className="h-full">
              {activeView === 'canvas' ? (
                <BuilderCanvas
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  selectedNode={selectedNode}
                  onNodeClick={handleNodeClick}
                  onPaneClick={handlePaneClick}
                  darkMode={darkMode}
                />
              ) : (
                <div className="h-full bg-gray-100 dark:bg-gray-800 p-4">
                  <ChatSimulator 
                    nodes={nodes}
                    edges={edges}
                    isTablet={true}
                  />
                </div>
              )}
            </div>
          </ResizablePanel>

          {/* Properties Panel */}
          {showProperties && selectedNode && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
                <div className="h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        Propiedades
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowProperties(false)}
                        className="p-1"
                      >
                        <EyeOff className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedNode.data.label || 'Nodo sin título'}
                    </p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                    <ImprovedPropertiesPanel
                      selectedNode={selectedNode}
                      onUpdateNode={updateNode}
                      onClose={() => setShowProperties(false)}
                    />
                  </div>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* Bottom Status Bar */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span>Vista: {activeView === 'canvas' ? 'Canvas' : 'Simulador'}</span>
            {selectedNode && (
              <span>Seleccionado: {selectedNode.data.label || selectedNode.id}</span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <span>Zoom: Ctrl + +/-</span>
            <span>Guardar: Ctrl + S</span>
          </div>
        </div>
      </div>
    </div>
  );
};
