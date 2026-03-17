import { useMemo } from 'react';
import { Node, Edge } from '@xyflow/react';
import { FlowValidationError, NodeData } from '@/types/builder';

export const useFlowValidation = (nodes: Node[], edges: Edge[]) => {
  const errors = useMemo(() => {
    const validationErrors: FlowValidationError[] = [];

    // Validar que todos los nodos tengan contenido
    nodes.forEach((node) => {
      const data = node.data as NodeData;

      // Validar nodos de mensaje
      if (node.type === 'message' && !data.text?.trim()) {
        validationErrors.push({
          nodeId: node.id,
          nodeLabel: data.label || 'Sin nombre',
          message: 'El mensaje está vacío',
          severity: 'error',
        });
      }

      // Validar nodos de opciones
      if (node.type === 'option') {
        if (!data.text?.trim()) {
          validationErrors.push({
            nodeId: node.id,
            nodeLabel: data.label || 'Sin nombre',
            message: 'La pregunta está vacía',
            severity: 'error',
          });
        }
        if (!data.options || data.options.length === 0) {
          validationErrors.push({
            nodeId: node.id,
            nodeLabel: data.label || 'Sin nombre',
            message: 'No hay opciones configuradas',
            severity: 'error',
          });
        }
      }

      // Validar nodos de input
      if (node.type === 'input') {
        if (!data.text?.trim()) {
          validationErrors.push({
            nodeId: node.id,
            nodeLabel: data.label || 'Sin nombre',
            message: 'La pregunta está vacía',
            severity: 'error',
          });
        }
        if (!data.saveToVariable?.trim()) {
          validationErrors.push({
            nodeId: node.id,
            nodeLabel: data.label || 'Sin nombre',
            message: 'No se especificó la variable donde guardar',
            severity: 'warning',
          });
        }
      }

      // Validar nodos de acción
      if (node.type === 'action') {
        if (!data.variableName?.trim()) {
          validationErrors.push({
            nodeId: node.id,
            nodeLabel: data.label || 'Sin nombre',
            message: 'No se especificó el nombre de la variable',
            severity: 'error',
          });
        }
      }

      // Validar nodos de delay
      if (node.type === 'delay') {
        if (!data.delayTime || data.delayTime < 1) {
          validationErrors.push({
            nodeId: node.id,
            nodeLabel: data.label || 'Sin nombre',
            message: 'El tiempo de espera debe ser mayor a 0',
            severity: 'error',
          });
        }
      }
    });

    // Validar conexiones - detectar nodos huérfanos
    const connectedNodes = new Set<string>();
    connectedNodes.add('start-initial'); // El nodo inicial siempre está "conectado"

    edges.forEach((edge) => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    nodes.forEach((node) => {
      if (node.id !== 'start-initial' && !connectedNodes.has(node.id)) {
        const data = node.data as NodeData;
        validationErrors.push({
          nodeId: node.id,
          nodeLabel: data.label || 'Sin nombre',
          message: 'Nodo sin conexión (huérfano)',
          severity: 'warning',
        });
      }
    });

    // Validar que el nodo inicial tenga al menos una conexión saliente
    const hasInitialConnection = edges.some((edge) => edge.source === 'start-initial');
    if (!hasInitialConnection && nodes.length > 1) {
      validationErrors.push({
        nodeId: 'start-initial',
        nodeLabel: 'Inicio',
        message: 'El nodo inicial no tiene conexiones',
        severity: 'warning',
      });
    }

    return validationErrors;
  }, [nodes, edges]);

  const stats = useMemo(() => {
    const connectedNodes = new Set<string>();
    edges.forEach((edge) => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    const orphanNodes = nodes.filter(
      (node) => node.id !== 'start-initial' && !connectedNodes.has(node.id)
    );

    const emptyNodes = nodes.filter((node) => {
      const data = node.data as NodeData;
      if (node.type === 'message' || node.type === 'input') {
        return !data.text?.trim();
      }
      if (node.type === 'option') {
        return !data.options || data.options.length === 0;
      }
      return false;
    });

    return {
      totalNodes: nodes.length,
      messageNodes: nodes.filter((n) => n.type === 'message').length,
      optionNodes: nodes.filter((n) => n.type === 'option').length,
      actionNodes: nodes.filter((n) => n.type === 'action').length,
      conditionNodes: nodes.filter((n) => n.type === 'condition').length,
      inputNodes: nodes.filter((n) => n.type === 'input').length,
      delayNodes: nodes.filter((n) => n.type === 'delay').length,
      totalConnections: edges.length,
      orphanNodes: orphanNodes.length,
      emptyNodes: emptyNodes.length,
    };
  }, [nodes, edges]);

  const hasErrors = errors.some((e) => e.severity === 'error');
  const hasWarnings = errors.some((e) => e.severity === 'warning');

  return {
    errors,
    stats,
    hasErrors,
    hasWarnings,
    isValid: !hasErrors,
  };
};
