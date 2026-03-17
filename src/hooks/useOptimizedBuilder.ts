import { useMemo, useCallback, useRef, useState } from 'react';
import { Node, Edge, Connection } from '@xyflow/react';
import { debounce } from 'lodash-es';

// Hook optimizado con memoización estratégica
export const useOptimizedBuilder = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Refs para evitar re-renders innecesarios
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  
  // Actualizar refs cuando cambie el estado
  nodesRef.current = nodes;
  edgesRef.current = edges;

  // Memoizar nodo seleccionado para evitar re-renders
  const selectedNode = useMemo(() => 
    nodes.find(node => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  // Memoizar estadísticas del flujo
  const flowStats = useMemo(() => ({
    totalNodes: nodes.length,
    totalEdges: edges.length,
    nodeTypes: nodes.reduce((acc, node) => {
      acc[node.type || 'default'] = (acc[node.type || 'default'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    orphanNodes: nodes.filter(node => 
      !edges.some(edge => edge.source === node.id || edge.target === node.id)
    ).length,
  }), [nodes, edges]);

  // Callbacks memoizados para operaciones de nodos
  const nodeOperations = useMemo(() => ({
    addNode: (type: string, position: { x: number; y: number }, data?: any) => {
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: data || {},
      };
      
      setNodes(prev => [...prev, newNode]);
      return newNode.id;
    },

    updateNode: (id: string, updates: Partial<Node>) => {
      setNodes(prev => prev.map(node => 
        node.id === id ? { ...node, ...updates } : node
      ));
    },

    deleteNode: (id: string) => {
      setNodes(prev => prev.filter(node => node.id !== id));
      setEdges(prev => prev.filter(edge => 
        edge.source !== id && edge.target !== id
      ));
      if (selectedNodeId === id) {
        setSelectedNodeId(null);
      }
    },

    duplicateNode: (id: string) => {
      const node = nodesRef.current.find(n => n.id === id);
      if (!node) return;

      const newNode: Node = {
        ...node,
        id: `${node.type}-${Date.now()}`,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
      };

      setNodes(prev => [...prev, newNode]);
      return newNode.id;
    },
  }), [selectedNodeId]);

  // Callbacks memoizados para operaciones de edges
  const edgeOperations = useMemo(() => ({
    addEdge: (connection: Connection) => {
      const newEdge: Edge = {
        id: `${connection.source}-${connection.target}`,
        source: connection.source!,
        target: connection.target!,
        type: 'smoothstep',
        animated: true,
      };
      
      setEdges(prev => [...prev, newEdge]);
    },

    deleteEdge: (id: string) => {
      setEdges(prev => prev.filter(edge => edge.id !== id));
    },
  }), []);

  // Debounced operations para operaciones costosas
  const debouncedOperations = useMemo(() => ({
    updateNodeData: debounce((id: string, data: any) => {
      nodeOperations.updateNode(id, { data });
    }, 300),

    validateFlow: debounce(() => {
      // Lógica de validación costosa
      console.log('Validating flow...');
    }, 500),
  }), [nodeOperations]);

  // Handlers optimizados para ReactFlow
  const flowHandlers = useMemo(() => ({
    onNodesChange: useCallback((changes: any[]) => {
      setNodes(prev => {
        // Aplicar cambios de forma optimizada
        return changes.reduce((acc, change) => {
          switch (change.type) {
            case 'position':
              return acc.map(node => 
                node.id === change.id 
                  ? { ...node, position: change.position }
                  : node
              );
            case 'select':
              return acc.map(node => 
                node.id === change.id 
                  ? { ...node, selected: change.selected }
                  : node
              );
            default:
              return acc;
          }
        }, prev);
      });
    }, []),

    onEdgesChange: useCallback((changes: any[]) => {
      setEdges(prev => {
        return changes.reduce((acc, change) => {
          switch (change.type) {
            case 'select':
              return acc.map(edge => 
                edge.id === change.id 
                  ? { ...edge, selected: change.selected }
                  : edge
              );
            case 'remove':
              return acc.filter(edge => edge.id !== change.id);
            default:
              return acc;
          }
        }, prev);
      });
    }, []),

    onConnect: useCallback((connection: Connection) => {
      edgeOperations.addEdge(connection);
    }, [edgeOperations]),

    onNodeClick: useCallback((event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
    }, []),

    onPaneClick: useCallback(() => {
      setSelectedNodeId(null);
    }, []),
  }), [edgeOperations]);

  return {
    // Estado
    nodes,
    edges,
    selectedNode,
    flowStats,
    
    // Operaciones
    nodeOperations,
    edgeOperations,
    debouncedOperations,
    
    // Handlers para ReactFlow
    flowHandlers,
    
    // Utilidades
    getNodeById: useCallback((id: string) => 
      nodesRef.current.find(node => node.id === id), []
    ),
    
    getConnectedNodes: useCallback((nodeId: string) => {
      const connectedEdges = edgesRef.current.filter(
        edge => edge.source === nodeId || edge.target === nodeId
      );
      return connectedEdges.map(edge => 
        edge.source === nodeId ? edge.target : edge.source
      );
    }, []),
  };
};
