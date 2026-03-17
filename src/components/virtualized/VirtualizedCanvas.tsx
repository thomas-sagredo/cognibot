import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { ReactFlow, Node, Edge, useReactFlow } from '@xyflow/react';
import { useDragDropManager } from '@/hooks/useDragDropManager';
import { useVirtualization } from '@/hooks/useVirtualization';

interface VirtualizedCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  canvasWidth: number;
  canvasHeight: number;
  nodeSize: { width: number; height: number };
  enableVirtualization?: boolean;
  virtualizationThreshold?: number;
}

// Componente principal con virtualización inteligente
export const VirtualizedCanvas: React.FC<VirtualizedCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  canvasWidth,
  canvasHeight,
  nodeSize,
  enableVirtualization = true,
  virtualizationThreshold = 100,
}) => {
  const reactFlowInstance = useReactFlow();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  
  // Decidir si usar virtualización basado en el número de nodos
  const shouldVirtualize = enableVirtualization && nodes.length > virtualizationThreshold;
  
  const {
    visibleNodes,
    visibleEdges,
    gridConfig,
    updateViewport,
  } = useVirtualization({
    nodes,
    edges,
    viewport,
    canvasWidth,
    canvasHeight,
    nodeSize,
    enabled: shouldVirtualize,
  });

  const {
    dragState,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    optimizedDragPreview,
  } = useDragDropManager({
    nodes: shouldVirtualize ? visibleNodes : nodes,
    onNodesChange,
    virtualized: shouldVirtualize,
  });

  // Manejar cambios de viewport
  const handleViewportChange = useCallback((newViewport: any) => {
    setViewport(newViewport);
    updateViewport(newViewport);
  }, [updateViewport]);

  // Renderizar nodo individual (optimizado para virtualización)
  const renderNode = useCallback(({ columnIndex, rowIndex, style }: any) => {
    const nodeIndex = rowIndex * gridConfig.columnsPerRow + columnIndex;
    const node = visibleNodes[nodeIndex];
    
    if (!node) {
      return <div style={style} />;
    }

    return (
      <div
        style={{
          ...style,
          transform: `translate(${node.position.x}px, ${node.position.y}px)`,
        }}
        onMouseDown={(e) => handleDragStart(e, node)}
        onMouseMove={(e) => handleDragMove(e, node)}
        onMouseUp={(e) => handleDragEnd(e, node)}
      >
        <VirtualizedNode 
          node={node} 
          isDragging={dragState.draggedNodeId === node.id}
        />
      </div>
    );
  }, [visibleNodes, gridConfig, dragState, handleDragStart, handleDragMove, handleDragEnd]);

  if (shouldVirtualize) {
    return (
      <div ref={canvasRef} className="virtualized-canvas" style={{ width: canvasWidth, height: canvasHeight }}>
        {/* Grid virtualizado para nodos */}
        <Grid
          columnCount={gridConfig.columnsPerRow}
          columnWidth={nodeSize.width + 20}
          height={canvasHeight}
          rowCount={Math.ceil(visibleNodes.length / gridConfig.columnsPerRow)}
          rowHeight={nodeSize.height + 20}
          width={canvasWidth}
          onScroll={({ scrollLeft, scrollTop }) => {
            handleViewportChange({
              x: -scrollLeft,
              y: -scrollTop,
              zoom: viewport.zoom,
            });
          }}
        >
          {renderNode}
        </Grid>

        {/* Overlay para edges (siempre visible) */}
        <svg
          className="edges-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {visibleEdges.map((edge) => (
            <VirtualizedEdge key={edge.id} edge={edge} viewport={viewport} />
          ))}
        </svg>

        {/* Preview de drag optimizado */}
        {dragState.isDragging && optimizedDragPreview && (
          <div
            className="drag-preview"
            style={{
              position: 'absolute',
              left: dragState.dragPosition.x,
              top: dragState.dragPosition.y,
              pointerEvents: 'none',
              zIndex: 1000,
              opacity: 0.8,
            }}
          >
            {optimizedDragPreview}
          </div>
        )}
      </div>
    );
  }

  // Fallback a ReactFlow normal para pocos nodos
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onViewportChange={handleViewportChange}
      fitView
    />
  );
};

// Componente de nodo optimizado para virtualización
const VirtualizedNode: React.FC<{
  node: Node;
  isDragging: boolean;
}> = React.memo(({ node, isDragging }) => {
  return (
    <div
      className={`virtualized-node ${isDragging ? 'dragging' : ''}`}
      style={{
        width: 200,
        height: 100,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '8px',
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.2s ease',
        boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div className="node-header">
        <strong>{node.data?.label || node.type}</strong>
      </div>
      <div className="node-content">
        {node.data?.text && (
          <p className="text-sm text-gray-600 truncate">
            {node.data.text}
          </p>
        )}
      </div>
    </div>
  );
});

// Componente de edge optimizado
const VirtualizedEdge: React.FC<{
  edge: Edge;
  viewport: { x: number; y: number; zoom: number };
}> = React.memo(({ edge, viewport }) => {
  // Calcular posiciones de los nodos source y target
  const sourcePos = { x: 100, y: 50 }; // Simplificado - en realidad calcularías desde los nodos
  const targetPos = { x: 300, y: 150 };

  // Aplicar transformación del viewport
  const adjustedSource = {
    x: (sourcePos.x + viewport.x) * viewport.zoom,
    y: (sourcePos.y + viewport.y) * viewport.zoom,
  };
  
  const adjustedTarget = {
    x: (targetPos.x + viewport.x) * viewport.zoom,
    y: (targetPos.y + viewport.y) * viewport.zoom,
  };

  return (
    <path
      d={`M ${adjustedSource.x} ${adjustedSource.y} L ${adjustedTarget.x} ${adjustedTarget.y}`}
      stroke="#3b82f6"
      strokeWidth={2}
      fill="none"
      markerEnd="url(#arrowhead)"
    />
  );
});

// Hook para manejo de drag and drop optimizado
const useDragDropManager = ({
  nodes,
  onNodesChange,
  virtualized = false,
}: {
  nodes: Node[];
  onNodesChange: (changes: any[]) => void;
  virtualized?: boolean;
}) => {
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedNodeId: null as string | null,
    dragOffset: { x: 0, y: 0 },
    dragPosition: { x: 0, y: 0 },
  });

  const dragStartPos = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();

  const handleDragStart = useCallback((e: React.MouseEvent, node: Node) => {
    e.preventDefault();
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const offset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    dragStartPos.current = { x: e.clientX, y: e.clientY };
    
    setDragState({
      isDragging: true,
      draggedNodeId: node.id,
      dragOffset: offset,
      dragPosition: { x: e.clientX - offset.x, y: e.clientY - offset.y },
    });

    // Optimización: usar requestAnimationFrame para smooth dragging
    const handleMouseMove = (e: MouseEvent) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(() => {
        setDragState(prev => ({
          ...prev,
          dragPosition: {
            x: e.clientX - prev.dragOffset.x,
            y: e.clientY - prev.dragOffset.y,
          },
        }));
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Calcular nueva posición
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      // Solo actualizar si hubo movimiento significativo
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        const changes = [{
          id: node.id,
          type: 'position',
          position: {
            x: node.position.x + deltaX,
            y: node.position.y + deltaY,
          },
        }];
        
        onNodesChange(changes);
      }

      setDragState({
        isDragging: false,
        draggedNodeId: null,
        dragOffset: { x: 0, y: 0 },
        dragPosition: { x: 0, y: 0 },
      });

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [onNodesChange]);

  const handleDragMove = useCallback((e: React.MouseEvent, node: Node) => {
    // Handled by document event listeners
  }, []);

  const handleDragEnd = useCallback((e: React.MouseEvent, node: Node) => {
    // Handled by document event listeners
  }, []);

  // Preview optimizado para drag
  const optimizedDragPreview = useMemo(() => {
    if (!dragState.isDragging || !dragState.draggedNodeId) return null;

    const draggedNode = nodes.find(n => n.id === dragState.draggedNodeId);
    if (!draggedNode) return null;

    return (
      <VirtualizedNode 
        node={draggedNode} 
        isDragging={true}
      />
    );
  }, [dragState, nodes]);

  return {
    dragState,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    optimizedDragPreview,
  };
};

// Hook para virtualización inteligente
const useVirtualization = ({
  nodes,
  edges,
  viewport,
  canvasWidth,
  canvasHeight,
  nodeSize,
  enabled,
}: {
  nodes: Node[];
  edges: Edge[];
  viewport: { x: number; y: number; zoom: number };
  canvasWidth: number;
  canvasHeight: number;
  nodeSize: { width: number; height: number };
  enabled: boolean;
}) => {
  const [visibleNodes, setVisibleNodes] = useState<Node[]>([]);
  const [visibleEdges, setVisibleEdges] = useState<Edge[]>([]);

  const gridConfig = useMemo(() => ({
    columnsPerRow: Math.floor(canvasWidth / (nodeSize.width + 20)),
    rowsVisible: Math.ceil(canvasHeight / (nodeSize.height + 20)),
  }), [canvasWidth, canvasHeight, nodeSize]);

  const updateViewport = useCallback((newViewport: { x: number; y: number; zoom: number }) => {
    if (!enabled) {
      setVisibleNodes(nodes);
      setVisibleEdges(edges);
      return;
    }

    // Calcular qué nodos están visibles en el viewport actual
    const visibleBounds = {
      left: -newViewport.x / newViewport.zoom,
      top: -newViewport.y / newViewport.zoom,
      right: (-newViewport.x + canvasWidth) / newViewport.zoom,
      bottom: (-newViewport.y + canvasHeight) / newViewport.zoom,
    };

    // Filtrar nodos visibles con buffer
    const buffer = 100; // Buffer para smooth scrolling
    const filteredNodes = nodes.filter(node => {
      return (
        node.position.x + nodeSize.width >= visibleBounds.left - buffer &&
        node.position.x <= visibleBounds.right + buffer &&
        node.position.y + nodeSize.height >= visibleBounds.top - buffer &&
        node.position.y <= visibleBounds.bottom + buffer
      );
    });

    // Filtrar edges que conectan nodos visibles
    const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = edges.filter(edge => 
      visibleNodeIds.has(edge.source) || visibleNodeIds.has(edge.target)
    );

    setVisibleNodes(filteredNodes);
    setVisibleEdges(filteredEdges);
  }, [enabled, nodes, edges, canvasWidth, canvasHeight, nodeSize]);

  // Actualizar cuando cambien los datos
  useEffect(() => {
    updateViewport(viewport);
  }, [nodes, edges, viewport, updateViewport]);

  return {
    visibleNodes,
    visibleEdges,
    gridConfig,
    updateViewport,
  };
};
