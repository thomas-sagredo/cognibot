import React, { useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  useReactFlow,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomStartNode } from '../nodes/CustomStartNode';
import { ImprovedMessageNode } from '../nodes/ImprovedMessageNode';
import { BaseNode } from '../nodes/BaseNode';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  RotateCcw,
  Play,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FlowValidationError } from '@/types/builder';
import { useFlowValidation } from '@/hooks/useFlowValidation';

// Tipos de nodos personalizados
const nodeTypes = {
  start: CustomStartNode,
  message: ImprovedMessageNode,
  option: BaseNode,
  action: BaseNode,
  condition: BaseNode,
  input: BaseNode,
  delay: BaseNode,
};

interface BuilderCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  selectedNode: Node | null;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onPaneClick: () => void;
  darkMode: boolean;
  className?: string;
}

export const BuilderCanvas: React.FC<BuilderCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  selectedNode,
  onNodeClick,
  onPaneClick,
  darkMode,
  className,
}) => {
  const reactFlowInstance = useReactFlow();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Validación del flujo
  const { errors, hasErrors, hasWarnings, isValid } = useFlowValidation(nodes, edges);

  // Handlers para zoom y fit
  const handleZoomIn = useCallback(() => {
    reactFlowInstance.zoomIn();
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    reactFlowInstance.zoomOut();
  }, [reactFlowInstance]);

  const handleFitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2 });
  }, [reactFlowInstance]);

  const handleReset = useCallback(() => {
    reactFlowInstance.setCenter(400, 300);
    reactFlowInstance.setZoom(1);
  }, [reactFlowInstance]);

  // Atajos de teclado para el canvas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canvasRef.current?.contains(document.activeElement)) return;

      switch (e.key) {
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomOut();
          }
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleFitView();
          }
          break;
        case 'r':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleReset();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleFitView, handleReset]);

  // Configuración del MiniMap
  const minimapStyle = {
    height: 120,
    backgroundColor: darkMode ? '#1f2937' : '#f9fafb',
  };

  const getValidationStatusColor = () => {
    if (hasErrors) return 'bg-red-500';
    if (hasWarnings) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getValidationStatusText = () => {
    if (hasErrors) return `${errors.filter(e => e.severity === 'error').length} errores`;
    if (hasWarnings) return `${errors.filter(e => e.severity === 'warning').length} advertencias`;
    return 'Flujo válido';
  };

  const ValidationIcon = hasErrors ? AlertCircle : CheckCircle;

  return (
    <div 
      ref={canvasRef}
      className={cn(
        'relative w-full h-full bg-gray-50 dark:bg-gray-900',
        className
      )}
      tabIndex={0}
      role="application"
      aria-label="Canvas del constructor de chatbots"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className={cn(
          'react-flow-canvas',
          darkMode && 'dark'
        )}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { 
            stroke: darkMode ? '#6b7280' : '#3b82f6', 
            strokeWidth: 2 
          },
        }}
        connectionLineStyle={{
          stroke: darkMode ? '#6b7280' : '#3b82f6',
          strokeWidth: 2,
        }}
        snapToGrid={true}
        snapGrid={[15, 15]}
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode={['Meta', 'Control']}
      >
        {/* Background pattern */}
        <Background 
          color={darkMode ? '#374151' : '#e5e7eb'}
          gap={20}
          size={1}
        />

        {/* Controls personalizados */}
        <Controls 
          className={cn(
            'react-flow-controls',
            darkMode && 'dark'
          )}
          showZoom={false}
          showFitView={false}
          showInteractive={false}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="w-8 h-8 p-0"
            title="Acercar (Ctrl + +)"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="w-8 h-8 p-0"
            title="Alejar (Ctrl + -)"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFitView}
            className="w-8 h-8 p-0"
            title="Ajustar vista (Ctrl + 0)"
          >
            <Maximize className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="w-8 h-8 p-0"
            title="Resetear vista (Ctrl + R)"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </Controls>

        {/* MiniMap */}
        <MiniMap
          style={minimapStyle}
          zoomable
          pannable
          className={cn(
            'react-flow-minimap border rounded-lg',
            darkMode ? 'border-gray-600' : 'border-gray-300'
          )}
          nodeColor={(node) => {
            if (node.id === selectedNode?.id) return '#3b82f6';
            if (node.type === 'start') return '#10b981';
            return darkMode ? '#6b7280' : '#9ca3af';
          }}
        />

        {/* Panel de estado superior */}
        <Panel position="top-center" className="flex items-center gap-4">
          {/* Estado de validación */}
          <Badge 
            variant="outline" 
            className={cn(
              'flex items-center gap-2 px-3 py-1.5',
              hasErrors && 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300',
              hasWarnings && !hasErrors && 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
              !hasErrors && !hasWarnings && 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300'
            )}
          >
            <ValidationIcon className="w-4 h-4" />
            {getValidationStatusText()}
          </Badge>

          {/* Estadísticas del flujo */}
          <Badge variant="secondary" className="px-3 py-1.5">
            {nodes.length} nodos • {edges.length} conexiones
          </Badge>
        </Panel>

        {/* Panel de ayuda inferior */}
        <Panel position="bottom-right" className="text-xs text-gray-500 dark:text-gray-400">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="space-y-1">
              <div><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl + +</kbd> Acercar</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl + -</kbd> Alejar</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl + 0</kbd> Ajustar vista</div>
              <div><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Del</kbd> Eliminar nodo</div>
            </div>
          </div>
        </Panel>

        {/* Overlay de errores críticos */}
        {hasErrors && (
          <Panel position="top-left" className="max-w-md">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                    Errores en el flujo
                  </h3>
                  <div className="space-y-1">
                    {errors.filter(e => e.severity === 'error').slice(0, 3).map((error, idx) => (
                      <div key={idx} className="text-xs text-red-700 dark:text-red-300">
                        <strong>{error.nodeLabel}:</strong> {error.message}
                      </div>
                    ))}
                    {errors.filter(e => e.severity === 'error').length > 3 && (
                      <div className="text-xs text-red-600 dark:text-red-400">
                        +{errors.filter(e => e.severity === 'error').length - 3} errores más
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};
