import * as tf from '@tensorflow/tfjs';
import { Node, Edge } from '@xyflow/react';

interface NodePattern {
  sequence: string[];
  frequency: number;
  context: string;
  successRate: number;
}

interface SuggestionContext {
  currentNode: Node;
  previousNodes: Node[];
  userBehavior: UserBehaviorData;
  industryType: string;
  chatbotGoal: string;
}

interface UserBehaviorData {
  commonPatterns: string[];
  preferredNodeTypes: string[];
  averageFlowLength: number;
  completionRate: number;
}

export class AINodeSuggestionEngine {
  private model: tf.LayersModel | null = null;
  private patternDatabase: NodePattern[] = [];
  private userEmbeddings: Map<string, Float32Array> = new Map();
  private isTraining = false;

  constructor() {
    this.initializeModel();
    this.loadPatternDatabase();
  }

  private async initializeModel() {
    try {
      // Load pre-trained model or create new one
      this.model = await tf.loadLayersModel('/models/node-suggestion-model.json');
    } catch (error) {
      console.log('Creating new model...');
      this.model = this.createModel();
    }
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.embedding({
          inputDim: 1000, // Vocabulary size
          outputDim: 128,
          inputLength: 10, // Sequence length
        }),
        tf.layers.lstm({
          units: 256,
          returnSequences: true,
          dropout: 0.2,
        }),
        tf.layers.lstm({
          units: 128,
          dropout: 0.2,
        }),
        tf.layers.dense({
          units: 64,
          activation: 'relu',
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 32, // Number of possible node types
          activation: 'softmax',
        }),
      ],
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });

    return model;
  }

  async getSuggestions(context: SuggestionContext): Promise<NodeSuggestion[]> {
    if (!this.model) {
      await this.initializeModel();
    }

    // Extract features from context
    const features = this.extractFeatures(context);
    
    // Get predictions from model
    const predictions = await this.predict(features);
    
    // Combine with pattern-based suggestions
    const patternSuggestions = this.getPatternBasedSuggestions(context);
    
    // Merge and rank suggestions
    const suggestions = this.mergeAndRankSuggestions(predictions, patternSuggestions, context);
    
    return suggestions.slice(0, 5); // Top 5 suggestions
  }

  private extractFeatures(context: SuggestionContext): tf.Tensor {
    const sequence = context.previousNodes
      .slice(-10) // Last 10 nodes
      .map(node => this.nodeTypeToId(node.type))
      .concat(Array(10).fill(0)) // Pad to length 10
      .slice(0, 10);

    return tf.tensor2d([sequence], [1, 10]);
  }

  private async predict(features: tf.Tensor): Promise<NodeSuggestion[]> {
    if (!this.model) return [];

    const prediction = this.model.predict(features) as tf.Tensor;
    const probabilities = await prediction.data();
    
    const suggestions: NodeSuggestion[] = [];
    
    probabilities.forEach((prob, index) => {
      if (prob > 0.1) { // Threshold for suggestions
        suggestions.push({
          nodeType: this.idToNodeType(index),
          confidence: prob,
          reason: 'AI Pattern Recognition',
          template: this.getNodeTemplate(this.idToNodeType(index)),
          estimatedImpact: this.calculateImpact(prob),
        });
      }
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private getPatternBasedSuggestions(context: SuggestionContext): NodeSuggestion[] {
    const currentSequence = context.previousNodes
      .slice(-3)
      .map(node => node.type);

    return this.patternDatabase
      .filter(pattern => 
        pattern.sequence.slice(0, currentSequence.length)
          .every((type, index) => type === currentSequence[index])
      )
      .map(pattern => ({
        nodeType: pattern.sequence[currentSequence.length],
        confidence: pattern.frequency * pattern.successRate,
        reason: `Common pattern (${pattern.frequency} occurrences)`,
        template: this.getNodeTemplate(pattern.sequence[currentSequence.length]),
        estimatedImpact: pattern.successRate,
      }))
      .sort((a, b) => b.confidence - a.confidence);
  }

  private mergeAndRankSuggestions(
    aiSuggestions: NodeSuggestion[],
    patternSuggestions: NodeSuggestion[],
    context: SuggestionContext
  ): NodeSuggestion[] {
    const merged = new Map<string, NodeSuggestion>();

    // Add AI suggestions
    aiSuggestions.forEach(suggestion => {
      merged.set(suggestion.nodeType, {
        ...suggestion,
        confidence: suggestion.confidence * 0.7, // Weight AI suggestions
      });
    });

    // Merge pattern suggestions
    patternSuggestions.forEach(suggestion => {
      const existing = merged.get(suggestion.nodeType);
      if (existing) {
        existing.confidence = Math.max(existing.confidence, suggestion.confidence * 0.3);
        existing.reason += ` + ${suggestion.reason}`;
      } else {
        merged.set(suggestion.nodeType, {
          ...suggestion,
          confidence: suggestion.confidence * 0.3,
        });
      }
    });

    // Apply user behavior boost
    Array.from(merged.values()).forEach(suggestion => {
      if (context.userBehavior.preferredNodeTypes.includes(suggestion.nodeType)) {
        suggestion.confidence *= 1.2;
      }
    });

    return Array.from(merged.values())
      .sort((a, b) => b.confidence - a.confidence);
  }

  async trainOnUserData(flows: Array<{ nodes: Node[]; edges: Edge[]; metrics: FlowMetrics }>) {
    if (this.isTraining) return;
    
    this.isTraining = true;
    
    try {
      const trainingData = this.prepareTrainingData(flows);
      
      if (this.model && trainingData.xs.shape[0] > 0) {
        await this.model.fit(trainingData.xs, trainingData.ys, {
          epochs: 10,
          batchSize: 32,
          validationSplit: 0.2,
          callbacks: {
            onEpochEnd: (epoch, logs) => {
              console.log(`Training epoch ${epoch}: loss = ${logs?.loss}`);
            },
          },
        });
        
        // Save updated model
        await this.model.save('indexeddb://node-suggestion-model');
      }
    } finally {
      this.isTraining = false;
    }
  }

  private prepareTrainingData(flows: Array<{ nodes: Node[]; edges: Edge[]; metrics: FlowMetrics }>) {
    const sequences: number[][] = [];
    const targets: number[][] = [];

    flows.forEach(flow => {
      const nodeSequence = flow.nodes.map(node => this.nodeTypeToId(node.type));
      
      for (let i = 10; i < nodeSequence.length; i++) {
        const input = nodeSequence.slice(i - 10, i);
        const target = nodeSequence[i];
        
        sequences.push(input);
        
        // One-hot encode target
        const oneHot = Array(32).fill(0);
        oneHot[target] = 1;
        targets.push(oneHot);
      }
    });

    return {
      xs: tf.tensor2d(sequences),
      ys: tf.tensor2d(targets),
    };
  }

  private nodeTypeToId(nodeType: string): number {
    const typeMap: Record<string, number> = {
      'message': 0,
      'input': 1,
      'option': 2,
      'condition': 3,
      'action': 4,
      'delay': 5,
      // Add more mappings...
    };
    return typeMap[nodeType] || 0;
  }

  private idToNodeType(id: number): string {
    const idMap: Record<number, string> = {
      0: 'message',
      1: 'input',
      2: 'option',
      3: 'condition',
      4: 'action',
      5: 'delay',
      // Add more mappings...
    };
    return idMap[id] || 'message';
  }

  private getNodeTemplate(nodeType: string): Partial<Node> {
    const templates: Record<string, Partial<Node>> = {
      'message': {
        data: {
          text: 'AI suggested message',
          type: 'text',
        },
      },
      'input': {
        data: {
          placeholder: 'Enter your response...',
          validation: 'text',
        },
      },
      'option': {
        data: {
          options: [
            { label: 'Option 1', value: 'opt1' },
            { label: 'Option 2', value: 'opt2' },
          ],
        },
      },
    };
    
    return templates[nodeType] || {};
  }

  private calculateImpact(confidence: number): number {
    // Estimate impact based on confidence and historical data
    return Math.min(confidence * 100, 95);
  }

  private async loadPatternDatabase() {
    try {
      const response = await fetch('/api/node-patterns');
      this.patternDatabase = await response.json();
    } catch (error) {
      console.warn('Could not load pattern database:', error);
    }
  }
}

interface NodeSuggestion {
  nodeType: string;
  confidence: number;
  reason: string;
  template: Partial<Node>;
  estimatedImpact: number;
}

interface FlowMetrics {
  completionRate: number;
  averageSessionTime: number;
  userSatisfaction: number;
  conversionRate: number;
}

// React Hook for using AI suggestions
export const useAINodeSuggestions = () => {
  const [engine] = useState(() => new AINodeSuggestionEngine());
  const [suggestions, setSuggestions] = useState<NodeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getSuggestions = useCallback(async (context: SuggestionContext) => {
    setIsLoading(true);
    try {
      const newSuggestions = await engine.getSuggestions(context);
      setSuggestions(newSuggestions);
    } finally {
      setIsLoading(false);
    }
  }, [engine]);

  const trainEngine = useCallback(async (flows: any[]) => {
    await engine.trainOnUserData(flows);
  }, [engine]);

  return {
    suggestions,
    getSuggestions,
    trainEngine,
    isLoading,
  };
};
