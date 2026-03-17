import React, { useState } from 'react';
import { BuilderCanvas } from './BuilderCanvas';
import { ImprovedPropertiesPanel } from '../ImprovedPropertiesPanel';
import { ChatSimulator } from '../ChatSimulator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Eye,
  Settings,
  Layers,
  Play,
  AlertCircle,
  CheckCircle,
  Edit3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBuilderViewProps {
  builderState: any;
  validation: {
    errors: any[];
    hasErrors: boolean;
    hasWarnings: boolean;
    isValid: boolean;
  };
  onSave: () => void;
  isSaving: boolean;
}

export const MobileBuilderView: React.FC<MobileBuilderViewProps> = ({
  builderState,
  validation,
  onSave,
  isSaving,
}) => {
  const [activeTab, setActiveTab] = useState('canvas');
  const [showPropertiesSheet, setShowPropertiesSheet] = useState(false);

  const {
    nodes,
    edges,
    selectedNode,
    setSelectedNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    darkMode,
    showSimulator,
    updateNode,
  } = builderState;

  const handleNodeClick = (event: React.MouseEvent, node: any) => {
    setSelectedNode(node);
    if (node.id !== 'start-initial') {
      setShowPropertiesSheet(true);
    }
  };

  const handlePaneClick = () => {
    setSelectedNode(null);
    setShowPropertiesSheet(false);
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
      {/* Status Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ValidationIcon className={cn("w-4 h-4", getValidationColor())} />
            <span className={cn("text-sm", getValidationColor())}>
              {validation.hasErrors ? `${validation.errors.filter(e => e.severity === 'error').length} errores` :
               validation.hasWarnings ? `${validation.errors.filter(e => e.severity === 'warning').length} advertencias` :
               'Flujo válido'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {nodes.length} nodos
            </Badge>
            <Button
              size="sm"
              onClick={onSave}
              disabled={!validation.isValid || isSaving}
              className="text-xs px-3"
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* Tab Navigation */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <TabsList className="w-full h-12 bg-transparent p-0">
              <TabsTrigger 
                value="canvas" 
                className="flex-1 h-full data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20"
              >
                <Layers className="w-4 h-4 mr-2" />
                Canvas
              </TabsTrigger>
              <TabsTrigger 
                value="simulator" 
                className="flex-1 h-full data-[state=active]:bg-green-50 dark:data-[state=active]:bg-green-900/20"
              >
                <Play className="w-4 h-4 mr-2" />
                Simular
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            <TabsContent value="canvas" className="h-full m-0 p-0">
              <div className="relative h-full">
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

                {/* Floating Edit Button */}
                {selectedNode && selectedNode.id !== 'start-initial' && (
                  <div className="absolute bottom-4 right-4">
                    <Button
                      size="lg"
                      onClick={() => setShowPropertiesSheet(true)}
                      className="rounded-full w-14 h-14 shadow-lg"
                    >
                      <Edit3 className="w-5 h-5" />
                    </Button>
                  </div>
                )}

                {/* Error Overlay for Mobile */}
                {validation.hasErrors && (
                  <div className="absolute top-4 left-4 right-4">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-red-800 dark:text-red-200">
                            {validation.errors.filter(e => e.severity === 'error').length} errores encontrados
                          </p>
                          <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                            Toca los nodos con errores para corregirlos
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="simulator" className="h-full m-0 p-0">
              <div className="h-full bg-gray-100 dark:bg-gray-800">
                <ChatSimulator 
                  nodes={nodes}
                  edges={edges}
                  isMobile={true}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Properties Sheet */}
      <Sheet open={showPropertiesSheet} onOpenChange={setShowPropertiesSheet}>
        <SheetContent side="bottom" className="h-[80vh] p-0">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Editar Nodo
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPropertiesSheet(false)}
                >
                  Cerrar
                </Button>
              </div>
              {selectedNode && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedNode.data.label || 'Nodo sin título'}
                </p>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {selectedNode && (
                <ImprovedPropertiesPanel
                  selectedNode={selectedNode}
                  onUpdateNode={updateNode}
                  onClose={() => setShowPropertiesSheet(false)}
                />
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
