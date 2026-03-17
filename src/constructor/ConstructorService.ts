import { UserSessionManager } from '../auth/UserSessionManager';
import { AINodeSuggestionEngine } from '../ai/NodeSuggestionEngine';
import { IntelligentAutoCompleteEngine } from '../ai/IntelligentAutoComplete';
import { FlowAnomalyDetectionEngine } from '../ai/AnomalyDetectionEngine';
import { RealtimeNLPEngine } from '../ai/RealtimeNLPEngine';

interface Constructor {
  id: string;
  userId: string;
  name: string;
  nodes: any[];
  edges: any[];
  metadata: {
    createdAt: number;
    updatedAt: number;
    version: string;
    isActive: boolean;
  };
  integrations: {
    whatsapp: boolean;
    telegram: boolean;
    webchat: boolean;
  };
  aiConfig?: {
    suggestionsEnabled: boolean;
    autoCompleteEnabled: boolean;
    anomalyDetectionEnabled: boolean;
    nlpEnabled: boolean;
  };
}

interface ConstructorStats {
  nodeCount: number;
  edgeCount: number;
  lastModified: number;
  integrationCount: number;
  aiFeatures: string[];
}

export class ConstructorService {
  private static instance: ConstructorService;
  private sessionManager: UserSessionManager;
  private aiEngines: {
    suggestions?: AINodeSuggestionEngine;
    autoComplete?: IntelligentAutoCompleteEngine;
    anomalyDetection?: FlowAnomalyDetectionEngine;
    nlp?: RealtimeNLPEngine;
  } = {};

  private constructor() {
    this.sessionManager = UserSessionManager.getInstance();
    this.initializeAIEngines();
  }

  static getInstance(): ConstructorService {
    if (!ConstructorService.instance) {
      ConstructorService.instance = new ConstructorService();
    }
    return ConstructorService.instance;
  }

  // MÉTODO PRINCIPAL: Crear constructor único
  async createUniqueConstructor(userId: string, name?: string): Promise<Constructor> {
    console.log(`[ConstructorService] Creating unique constructor for user: ${userId}`);

    try {
      // 1. Desactivar constructores previos
      await this.deactivatePreviousConstructors(userId);

      // 2. Obtener o crear constructor único
      const constructor = await this.sessionManager.getOrCreateConstructor(userId);

      // 3. Configurar nombre si se proporciona
      if (name && name !== constructor.name) {
        constructor.name = name;
        await this.updateConstructor(userId, { name });
      }

      // 4. Inicializar IA si está habilitada
      await this.initializeAIForConstructor(constructor);

      console.log(`[ConstructorService] Constructor created/loaded: ${constructor.id}`);
      return constructor;

    } catch (error) {
      console.error('[ConstructorService] Error creating constructor:', error);
      throw new Error('Failed to create unique constructor');
    }
  }

  // Desactivar constructores previos
  async deactivatePreviousConstructors(userId: string): Promise<void> {
    console.log(`[ConstructorService] Deactivating previous constructors for user: ${userId}`);
    
    try {
      await this.sessionManager.cleanUserConstructors(userId);
      console.log('[ConstructorService] Previous constructors deactivated');
    } catch (error) {
      console.error('[ConstructorService] Error deactivating constructors:', error);
    }
  }

  // Obtener constructor activo
  async getActiveConstructor(userId: string): Promise<Constructor | null> {
    try {
      const constructor = await this.sessionManager.getActiveConstructor(userId);
      
      if (constructor) {
        // Asegurar que la IA esté inicializada
        await this.initializeAIForConstructor(constructor);
      }
      
      return constructor;
    } catch (error) {
      console.error('[ConstructorService] Error getting active constructor:', error);
      return null;
    }
  }

  // Actualizar constructor
  async updateConstructor(userId: string, updates: Partial<Constructor>): Promise<void> {
    try {
      await this.sessionManager.updateActiveConstructor(userId, updates);
      
      // Si se actualizó la configuración de IA, reinicializar
      if (updates.aiConfig) {
        const constructor = await this.getActiveConstructor(userId);
        if (constructor) {
          await this.initializeAIForConstructor(constructor);
        }
      }
      
      console.log(`[ConstructorService] Constructor updated for user: ${userId}`);
    } catch (error) {
      console.error('[ConstructorService] Error updating constructor:', error);
      throw error;
    }
  }

  // Agregar nodo con IA
  async addNodeWithAI(userId: string, nodeData: any): Promise<{ node: any; suggestions?: any[] }> {
    try {
      const constructor = await this.getActiveConstructor(userId);
      if (!constructor) {
        throw new Error('No active constructor found');
      }

      // Crear nodo
      const newNode = {
        id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...nodeData,
        position: nodeData.position || { x: 100, y: 100 },
      };

      // Actualizar constructor
      const updatedNodes = [...constructor.nodes, newNode];
      await this.updateConstructor(userId, { nodes: updatedNodes });

      // Obtener sugerencias de IA si está habilitada
      let suggestions: any[] = [];
      if (constructor.aiConfig?.suggestionsEnabled && this.aiEngines.suggestions) {
        try {
          const context = {
            currentNode: newNode,
            previousNodes: constructor.nodes,
            userBehavior: { commonPatterns: [], preferredNodeTypes: [], averageFlowLength: 5, completionRate: 0.8 },
            industryType: 'general',
            chatbotGoal: 'customer_service',
          };
          
          suggestions = await this.aiEngines.suggestions.getSuggestions(context);
        } catch (aiError) {
          console.warn('[ConstructorService] AI suggestions failed:', aiError);
        }
      }

      return { node: newNode, suggestions };

    } catch (error) {
      console.error('[ConstructorService] Error adding node:', error);
      throw error;
    }
  }

  // Detectar anomalías en el flujo
  async detectFlowAnomalies(userId: string): Promise<any[]> {
    try {
      const constructor = await this.getActiveConstructor(userId);
      if (!constructor || !constructor.aiConfig?.anomalyDetectionEnabled || !this.aiEngines.anomalyDetection) {
        return [];
      }

      const anomalies = await this.aiEngines.anomalyDetection.detectAnomalies(
        constructor.nodes,
        constructor.edges
      );

      console.log(`[ConstructorService] Detected ${anomalies.length} anomalies`);
      return anomalies;

    } catch (error) {
      console.error('[ConstructorService] Error detecting anomalies:', error);
      return [];
    }
  }

  // Analizar texto con NLP
  async analyzeTextWithNLP(userId: string, text: string, context?: any): Promise<any> {
    try {
      const constructor = await this.getActiveConstructor(userId);
      if (!constructor || !constructor.aiConfig?.nlpEnabled || !this.aiEngines.nlp) {
        return null;
      }

      const analysis = await this.aiEngines.nlp.analyzeIntent(text, context);
      return analysis;

    } catch (error) {
      console.error('[ConstructorService] Error analyzing text:', error);
      return null;
    }
  }

  // Obtener estadísticas del constructor
  async getConstructorStats(userId: string): Promise<ConstructorStats | null> {
    try {
      const constructor = await this.getActiveConstructor(userId);
      if (!constructor) return null;

      const aiFeatures: string[] = [];
      if (constructor.aiConfig?.suggestionsEnabled) aiFeatures.push('AI Suggestions');
      if (constructor.aiConfig?.autoCompleteEnabled) aiFeatures.push('Auto Complete');
      if (constructor.aiConfig?.anomalyDetectionEnabled) aiFeatures.push('Anomaly Detection');
      if (constructor.aiConfig?.nlpEnabled) aiFeatures.push('NLP Analysis');

      const integrationCount = Object.values(constructor.integrations).filter(Boolean).length;

      return {
        nodeCount: constructor.nodes.length,
        edgeCount: constructor.edges.length,
        lastModified: constructor.metadata.updatedAt,
        integrationCount,
        aiFeatures,
      };

    } catch (error) {
      console.error('[ConstructorService] Error getting stats:', error);
      return null;
    }
  }

  // Exportar constructor
  async exportConstructor(userId: string, format: 'json' | 'yaml' = 'json'): Promise<string> {
    try {
      const constructor = await this.getActiveConstructor(userId);
      if (!constructor) {
        throw new Error('No active constructor found');
      }

      const exportData = {
        version: '1.0',
        metadata: {
          name: constructor.name,
          exportedAt: new Date().toISOString(),
          nodeCount: constructor.nodes.length,
          edgeCount: constructor.edges.length,
        },
        nodes: constructor.nodes,
        edges: constructor.edges,
        integrations: constructor.integrations,
      };

      if (format === 'json') {
        return JSON.stringify(exportData, null, 2);
      } else {
        // Implementar YAML export si es necesario
        return JSON.stringify(exportData, null, 2);
      }

    } catch (error) {
      console.error('[ConstructorService] Error exporting constructor:', error);
      throw error;
    }
  }

  // Importar constructor
  async importConstructor(userId: string, data: string, format: 'json' | 'yaml' = 'json'): Promise<void> {
    try {
      let importData: any;

      if (format === 'json') {
        importData = JSON.parse(data);
      } else {
        // Implementar YAML import si es necesario
        importData = JSON.parse(data);
      }

      // Validar estructura
      if (!importData.nodes || !Array.isArray(importData.nodes)) {
        throw new Error('Invalid import data: missing nodes');
      }

      // Actualizar constructor con datos importados
      await this.updateConstructor(userId, {
        name: importData.metadata?.name || 'Imported Chatbot',
        nodes: importData.nodes,
        edges: importData.edges || [],
        integrations: importData.integrations || { whatsapp: false, telegram: false, webchat: true },
      });

      console.log(`[ConstructorService] Constructor imported for user: ${userId}`);

    } catch (error) {
      console.error('[ConstructorService] Error importing constructor:', error);
      throw error;
    }
  }

  // Configurar integraciones
  async configureIntegration(userId: string, integration: string, enabled: boolean, config?: any): Promise<void> {
    try {
      const constructor = await this.getActiveConstructor(userId);
      if (!constructor) {
        throw new Error('No active constructor found');
      }

      const updatedIntegrations = {
        ...constructor.integrations,
        [integration]: enabled,
      };

      await this.updateConstructor(userId, { integrations: updatedIntegrations });
      
      console.log(`[ConstructorService] Integration ${integration} ${enabled ? 'enabled' : 'disabled'} for user: ${userId}`);

    } catch (error) {
      console.error('[ConstructorService] Error configuring integration:', error);
      throw error;
    }
  }

  // MÉTODOS PRIVADOS

  private async initializeAIEngines(): Promise<void> {
    try {
      // Inicializar engines de IA de forma lazy
      console.log('[ConstructorService] AI engines will be initialized on demand');
    } catch (error) {
      console.error('[ConstructorService] Error initializing AI engines:', error);
    }
  }

  private async initializeAIForConstructor(constructor: Constructor): Promise<void> {
    try {
      const aiConfig = constructor.aiConfig || {
        suggestionsEnabled: true,
        autoCompleteEnabled: true,
        anomalyDetectionEnabled: true,
        nlpEnabled: true,
      };

      // Inicializar engines según configuración
      if (aiConfig.suggestionsEnabled && !this.aiEngines.suggestions) {
        const { AINodeSuggestionEngine } = await import('../ai/NodeSuggestionEngine');
        this.aiEngines.suggestions = new AINodeSuggestionEngine();
      }

      if (aiConfig.autoCompleteEnabled && !this.aiEngines.autoComplete) {
        const { IntelligentAutoCompleteEngine } = await import('../ai/IntelligentAutoComplete');
        const apiKey = process.env.REACT_APP_OPENAI_API_KEY || '';
        if (apiKey) {
          this.aiEngines.autoComplete = new IntelligentAutoCompleteEngine(apiKey);
        }
      }

      if (aiConfig.anomalyDetectionEnabled && !this.aiEngines.anomalyDetection) {
        const { FlowAnomalyDetectionEngine } = await import('../ai/AnomalyDetectionEngine');
        this.aiEngines.anomalyDetection = new FlowAnomalyDetectionEngine();
      }

      if (aiConfig.nlpEnabled && !this.aiEngines.nlp) {
        const { RealtimeNLPEngine } = await import('../ai/RealtimeNLPEngine');
        this.aiEngines.nlp = new RealtimeNLPEngine();
      }

      // Actualizar configuración si no existe
      if (!constructor.aiConfig) {
        await this.sessionManager.updateActiveConstructor(constructor.userId, { aiConfig });
      }

    } catch (error) {
      console.error('[ConstructorService] Error initializing AI for constructor:', error);
    }
  }

  // Métodos públicos para debugging
  getAIEnginesStatus(): Record<string, boolean> {
    return {
      suggestions: !!this.aiEngines.suggestions,
      autoComplete: !!this.aiEngines.autoComplete,
      anomalyDetection: !!this.aiEngines.anomalyDetection,
      nlp: !!this.aiEngines.nlp,
    };
  }

  async validateConstructorIntegrity(userId: string): Promise<{ isValid: boolean; issues: string[] }> {
    try {
      const constructor = await this.getActiveConstructor(userId);
      if (!constructor) {
        return { isValid: false, issues: ['No active constructor found'] };
      }

      const issues: string[] = [];

      // Validar estructura básica
      if (!constructor.nodes || constructor.nodes.length === 0) {
        issues.push('Constructor has no nodes');
      }

      // Validar nodos
      constructor.nodes.forEach((node, index) => {
        if (!node.id) issues.push(`Node ${index} missing ID`);
        if (!node.type) issues.push(`Node ${index} missing type`);
        if (!node.position) issues.push(`Node ${index} missing position`);
      });

      // Validar edges
      constructor.edges.forEach((edge, index) => {
        if (!edge.source) issues.push(`Edge ${index} missing source`);
        if (!edge.target) issues.push(`Edge ${index} missing target`);
        
        // Verificar que source y target existen
        const sourceExists = constructor.nodes.some(n => n.id === edge.source);
        const targetExists = constructor.nodes.some(n => n.id === edge.target);
        
        if (!sourceExists) issues.push(`Edge ${index} references non-existent source: ${edge.source}`);
        if (!targetExists) issues.push(`Edge ${index} references non-existent target: ${edge.target}`);
      });

      return {
        isValid: issues.length === 0,
        issues,
      };

    } catch (error) {
      console.error('[ConstructorService] Error validating constructor:', error);
      return { isValid: false, issues: ['Validation failed due to error'] };
    }
  }
}
