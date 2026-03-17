import { useEffect, useRef, useCallback, useState } from 'react';

// Hook para manejo de focus avanzado
export const useFocusManagement = () => {
  const focusHistoryRef = useRef<HTMLElement[]>([]);
  const currentFocusRef = useRef<HTMLElement | null>(null);

  const pushFocus = useCallback((element: HTMLElement) => {
    if (currentFocusRef.current) {
      focusHistoryRef.current.push(currentFocusRef.current);
    }
    currentFocusRef.current = element;
    element.focus();
  }, []);

  const popFocus = useCallback(() => {
    const previousElement = focusHistoryRef.current.pop();
    if (previousElement && document.contains(previousElement)) {
      currentFocusRef.current = previousElement;
      previousElement.focus();
      return true;
    }
    return false;
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return {
    pushFocus,
    popFocus,
    trapFocus,
    currentFocus: currentFocusRef.current,
  };
};

// Hook para ARIA live regions
export const useAriaLive = () => {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create live region if it doesn't exist
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.id = 'builder-live-region';
      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    }

    return () => {
      if (liveRegionRef.current && document.body.contains(liveRegionRef.current)) {
        document.body.removeChild(liveRegionRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  return { announce };
};

// Hook para navegación por teclado en el canvas
export const useCanvasKeyboardNavigation = (
  nodes: any[],
  selectedNodeId: string | null,
  onSelectNode: (id: string | null) => void
) => {
  const [focusedNodeIndex, setFocusedNodeIndex] = useState(-1);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!nodes.length) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        setFocusedNodeIndex(prev => {
          const nextIndex = prev < nodes.length - 1 ? prev + 1 : 0;
          onSelectNode(nodes[nextIndex].id);
          return nextIndex;
        });
        break;

      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        setFocusedNodeIndex(prev => {
          const nextIndex = prev > 0 ? prev - 1 : nodes.length - 1;
          onSelectNode(nodes[nextIndex].id);
          return nextIndex;
        });
        break;

      case 'Home':
        e.preventDefault();
        setFocusedNodeIndex(0);
        onSelectNode(nodes[0].id);
        break;

      case 'End':
        e.preventDefault();
        setFocusedNodeIndex(nodes.length - 1);
        onSelectNode(nodes[nodes.length - 1].id);
        break;

      case 'Escape':
        e.preventDefault();
        setFocusedNodeIndex(-1);
        onSelectNode(null);
        break;
    }
  }, [nodes, onSelectNode]);

  useEffect(() => {
    const canvas = document.querySelector('[data-testid="builder-canvas"]');
    if (canvas) {
      canvas.addEventListener('keydown', handleKeyDown);
      return () => canvas.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);

  return { focusedNodeIndex };
};

// Hook para descripciones dinámicas de nodos
export const useNodeDescriptions = () => {
  const getNodeDescription = useCallback((node: any) => {
    const baseDescription = `${node.type} node`;
    const hasConnections = node.connections?.length > 0;
    const connectionText = hasConnections 
      ? `, connected to ${node.connections.length} other nodes`
      : ', not connected';
    
    const contentText = node.data?.text 
      ? `, content: ${node.data.text.substring(0, 50)}${node.data.text.length > 50 ? '...' : ''}`
      : ', no content';

    return `${baseDescription}${connectionText}${contentText}`;
  }, []);

  const getFlowDescription = useCallback((nodes: any[], edges: any[]) => {
    return `Flow with ${nodes.length} nodes and ${edges.length} connections. ${
      nodes.length > 0 ? `Currently focused on ${nodes[0].type} node.` : 'No nodes in flow.'
    }`;
  }, []);

  return {
    getNodeDescription,
    getFlowDescription,
  };
};

// Hook para validación de accesibilidad
export const useAccessibilityValidation = () => {
  const validateElement = useCallback((element: HTMLElement) => {
    const issues: string[] = [];

    // Check for missing alt text on images
    const images = element.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        issues.push(`Image ${index + 1} missing alt text`);
      }
    });

    // Check for missing labels on form elements
    const formElements = element.querySelectorAll('input, select, textarea');
    formElements.forEach((input, index) => {
      const hasLabel = input.getAttribute('aria-label') || 
                      input.getAttribute('aria-labelledby') ||
                      element.querySelector(`label[for="${input.id}"]`);
      
      if (!hasLabel) {
        issues.push(`Form element ${index + 1} missing label`);
      }
    });

    // Check for proper heading hierarchy
    const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let lastLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > lastLevel + 1) {
        issues.push(`Heading ${index + 1} skips levels (h${lastLevel} to h${level})`);
      }
      lastLevel = level;
    });

    // Check for sufficient color contrast (basic check)
    const textElements = element.querySelectorAll('p, span, div, button, a');
    textElements.forEach((el, index) => {
      const styles = window.getComputedStyle(el);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Basic contrast check (simplified)
      if (color === 'rgb(128, 128, 128)' && backgroundColor === 'rgb(255, 255, 255)') {
        issues.push(`Element ${index + 1} may have insufficient contrast`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
      score: Math.max(0, 100 - (issues.length * 10)),
    };
  }, []);

  return { validateElement };
};

// Component para anuncios de estado
export const AccessibilityAnnouncer: React.FC = () => {
  const { announce } = useAriaLive();

  useEffect(() => {
    // Listen for builder events and announce them
    const handleBuilderEvent = (event: CustomEvent) => {
      const { type, message } = event.detail;
      
      switch (type) {
        case 'node-added':
          announce(`Node added: ${message}`);
          break;
        case 'node-deleted':
          announce(`Node deleted: ${message}`);
          break;
        case 'node-selected':
          announce(`Node selected: ${message}`);
          break;
        case 'connection-made':
          announce(`Nodes connected: ${message}`);
          break;
        case 'validation-error':
          announce(`Validation error: ${message}`, 'assertive');
          break;
        case 'save-success':
          announce('Flow saved successfully');
          break;
        case 'save-error':
          announce('Error saving flow', 'assertive');
          break;
      }
    };

    window.addEventListener('builder-event', handleBuilderEvent as EventListener);
    return () => window.removeEventListener('builder-event', handleBuilderEvent as EventListener);
  }, [announce]);

  return (
    <div
      id="builder-announcer"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );
};

// Hook para atajos de teclado accesibles
export const useAccessibleShortcuts = () => {
  const [shortcutsEnabled, setShortcutsEnabled] = useState(true);
  const { announce } = useAriaLive();

  const announceShortcut = useCallback((action: string, key: string) => {
    if (shortcutsEnabled) {
      announce(`${action} activated with ${key}`);
    }
  }, [announce, shortcutsEnabled]);

  const registerShortcut = useCallback((
    key: string,
    action: string,
    callback: () => void,
    description: string
  ) => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === key && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        callback();
        announceShortcut(action, `Ctrl+${key.toUpperCase()}`);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [announceShortcut]);

  return {
    registerShortcut,
    shortcutsEnabled,
    setShortcutsEnabled,
  };
};

// Utility para generar IDs únicos para accesibilidad
export const useAccessibleIds = (prefix: string = 'builder') => {
  const idCounter = useRef(0);
  
  const generateId = useCallback((suffix?: string) => {
    idCounter.current += 1;
    return `${prefix}-${idCounter.current}${suffix ? `-${suffix}` : ''}`;
  }, [prefix]);

  return { generateId };
};
