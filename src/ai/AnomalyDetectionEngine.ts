import * as tf from '@tensorflow/tfjs';
import { Node, Edge } from '@xyflow/react';

interface FlowAnomaly {
  type: 'structural' | 'behavioral' | 'performance' | 'logical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedNodes: string[];
  suggestedFix: string;
  confidence: number;
  impact: number;
  detectionTime: Date;
}

interface FlowMetrics {
  nodeCount: number;
  edgeCount: number;
  avgPathLength: number;
  cyclomaticComplexity: number;
  deadEndNodes: number;
  unreachableNodes: number;
  branchingFactor: number;
  userDropoffRate: number;
  avgCompletionTime: number;
  errorRate: number;
}

interface UserBehaviorPattern {
  sessionId: string;
  path: string[];
  completionTime: number;
  exitPoint: string;
  interactions: number;
  successful: boolean;
  timestamp: Date;
}

export class FlowAnomalyDetectionEngine {
  private isolationForest: tf.LayersModel | null = null;
  private behaviorModel: tf.LayersModel | null = null;
  private historicalData: FlowMetrics[] = [];
  private behaviorPatterns: UserBehaviorPattern[] = [];
  private thresholds: Record<string, number> = {
    dropoffRate: 0.3,
    avgCompletionTime: 300, // seconds
    errorRate: 0.1,
    cyclomaticComplexity: 10,
    deadEndNodes: 2,
  };

  constructor() {
    this.initializeModels();
  }

  private async initializeModels() {
    // Initialize Isolation Forest for structural anomalies
    this.isolationForest = tf.sequential({
      layers: [
        tf.layers.dense({ units: 64, activation: 'relu', inputShape: [10] }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' }), // Anomaly score
      ],
    });

    // Initialize behavior pattern model
    this.behaviorModel = tf.sequential({
      layers: [
        tf.layers.lstm({ units: 128, returnSequences: true, inputShape: [null, 5] }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.lstm({ units: 64 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' }), // Anomaly probability
      ],
    });

    this.isolationForest.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    this.behaviorModel.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });
  }

  async detectAnomalies(
    nodes: Node[],
    edges: Edge[],
    userBehavior?: UserBehaviorPattern[]
  ): Promise<FlowAnomaly[]> {
    const anomalies: FlowAnomaly[] = [];

    // 1. Structural anomalies
    const structuralAnomalies = await this.detectStructuralAnomalies(nodes, edges);
    anomalies.push(...structuralAnomalies);

    // 2. Logical anomalies
    const logicalAnomalies = this.detectLogicalAnomalies(nodes, edges);
    anomalies.push(...logicalAnomalies);

    // 3. Performance anomalies
    const performanceAnomalies = this.detectPerformanceAnomalies(nodes, edges);
    anomalies.push(...performanceAnomalies);

    // 4. Behavioral anomalies (if user data available)
    if (userBehavior && userBehavior.length > 0) {
      const behavioralAnomalies = await this.detectBehavioralAnomalies(userBehavior);
      anomalies.push(...behavioralAnomalies);
    }

    return anomalies.sort((a, b) => b.severity.localeCompare(a.severity));
  }

  private async detectStructuralAnomalies(nodes: Node[], edges: Edge[]): Promise<FlowAnomaly[]> {
    const anomalies: FlowAnomaly[] = [];
    const metrics = this.calculateFlowMetrics(nodes, edges);

    // Use ML model for anomaly detection
    if (this.isolationForest && this.historicalData.length > 100) {
      const features = this.extractFeatures(metrics);
      const anomalyScore = await this.isolationForest.predict(features) as tf.Tensor;
      const score = await anomalyScore.data();

      if (score[0] > 0.8) { // High anomaly score
        anomalies.push({
          type: 'structural',
          severity: 'high',
          description: 'Flow structure deviates significantly from normal patterns',
          affectedNodes: nodes.map(n => n.id),
          suggestedFix: 'Review flow structure and simplify complex paths',
          confidence: score[0],
          impact: 0.8,
          detectionTime: new Date(),
        });
      }
    }

    // Rule-based structural checks
    
    // Check for dead ends
    const deadEnds = this.findDeadEndNodes(nodes, edges);
    if (deadEnds.length > this.thresholds.deadEndNodes) {
      anomalies.push({
        type: 'structural',
        severity: 'medium',
        description: `Found ${deadEnds.length} dead-end nodes that may confuse users`,
        affectedNodes: deadEnds,
        suggestedFix: 'Add fallback options or redirect to main flow',
        confidence: 0.9,
        impact: 0.6,
        detectionTime: new Date(),
      });
    }

    // Check for unreachable nodes
    const unreachable = this.findUnreachableNodes(nodes, edges);
    if (unreachable.length > 0) {
      anomalies.push({
        type: 'structural',
        severity: 'high',
        description: `Found ${unreachable.length} unreachable nodes`,
        affectedNodes: unreachable,
        suggestedFix: 'Connect isolated nodes to the main flow or remove them',
        confidence: 1.0,
        impact: 0.7,
        detectionTime: new Date(),
      });
    }

    // Check for excessive complexity
    if (metrics.cyclomaticComplexity > this.thresholds.cyclomaticComplexity) {
      anomalies.push({
        type: 'structural',
        severity: 'medium',
        description: `Flow complexity (${metrics.cyclomaticComplexity}) exceeds recommended threshold`,
        affectedNodes: this.findComplexNodes(nodes, edges),
        suggestedFix: 'Simplify decision trees and reduce branching',
        confidence: 0.85,
        impact: 0.5,
        detectionTime: new Date(),
      });
    }

    return anomalies;
  }

  private detectLogicalAnomalies(nodes: Node[], edges: Edge[]): FlowAnomaly[] {
    const anomalies: FlowAnomaly[] = [];

    // Check for infinite loops
    const loops = this.detectInfiniteLoops(nodes, edges);
    loops.forEach(loop => {
      anomalies.push({
        type: 'logical',
        severity: 'critical',
        description: `Potential infinite loop detected in nodes: ${loop.join(' → ')}`,
        affectedNodes: loop,
        suggestedFix: 'Add exit conditions or loop counters',
        confidence: 0.95,
        impact: 1.0,
        detectionTime: new Date(),
      });
    });

    // Check for missing fallback options
    const missingFallbacks = this.findMissingFallbacks(nodes, edges);
    if (missingFallbacks.length > 0) {
      anomalies.push({
        type: 'logical',
        severity: 'medium',
        description: 'Some option nodes lack fallback handling',
        affectedNodes: missingFallbacks,
        suggestedFix: 'Add "Other" or "None of the above" options',
        confidence: 0.8,
        impact: 0.6,
        detectionTime: new Date(),
      });
    }

    // Check for inconsistent variable usage
    const variableIssues = this.detectVariableInconsistencies(nodes);
    variableIssues.forEach(issue => {
      anomalies.push({
        type: 'logical',
        severity: 'medium',
        description: issue.description,
        affectedNodes: issue.nodes,
        suggestedFix: issue.fix,
        confidence: 0.9,
        impact: 0.4,
        detectionTime: new Date(),
      });
    });

    return anomalies;
  }

  private detectPerformanceAnomalies(nodes: Node[], edges: Edge[]): FlowAnomaly[] {
    const anomalies: FlowAnomaly[] = [];

    // Check for excessively long paths
    const longPaths = this.findLongPaths(nodes, edges);
    longPaths.forEach(path => {
      if (path.length > 15) { // Threshold for long paths
        anomalies.push({
          type: 'performance',
          severity: 'medium',
          description: `Long conversation path detected (${path.length} steps)`,
          affectedNodes: path,
          suggestedFix: 'Consider shortcuts or early resolution options',
          confidence: 0.8,
          impact: 0.5,
          detectionTime: new Date(),
        });
      }
    });

    // Check for resource-heavy nodes
    const heavyNodes = this.findResourceHeavyNodes(nodes);
    if (heavyNodes.length > 0) {
      anomalies.push({
        type: 'performance',
        severity: 'low',
        description: 'Some nodes may cause performance issues',
        affectedNodes: heavyNodes,
        suggestedFix: 'Optimize media files and reduce API calls',
        confidence: 0.7,
        impact: 0.3,
        detectionTime: new Date(),
      });
    }

    return anomalies;
  }

  private async detectBehavioralAnomalies(
    userBehavior: UserBehaviorPattern[]
  ): Promise<FlowAnomaly[]> {
    const anomalies: FlowAnomaly[] = [];

    if (!this.behaviorModel) return anomalies;

    // Analyze user behavior patterns
    const dropoffPoints = this.analyzeDropoffPoints(userBehavior);
    const highDropoffPoints = dropoffPoints.filter(point => point.rate > this.thresholds.dropoffRate);

    highDropoffPoints.forEach(point => {
      anomalies.push({
        type: 'behavioral',
        severity: point.rate > 0.5 ? 'high' : 'medium',
        description: `High user dropoff rate (${Math.round(point.rate * 100)}%) at node`,
        affectedNodes: [point.nodeId],
        suggestedFix: 'Review message clarity and add engagement elements',
        confidence: 0.85,
        impact: point.rate,
        detectionTime: new Date(),
      });
    });

    // Analyze completion times
    const slowPaths = this.analyzeCompletionTimes(userBehavior);
    slowPaths.forEach(path => {
      if (path.avgTime > this.thresholds.avgCompletionTime) {
        anomalies.push({
          type: 'behavioral',
          severity: 'medium',
          description: `Users take unusually long on this path (avg: ${Math.round(path.avgTime)}s)`,
          affectedNodes: path.nodes,
          suggestedFix: 'Simplify instructions or add progress indicators',
          confidence: 0.8,
          impact: 0.4,
          detectionTime: new Date(),
        });
      }
    });

    return anomalies;
  }

  // Helper methods for anomaly detection

  private calculateFlowMetrics(nodes: Node[], edges: Edge[]): FlowMetrics {
    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      avgPathLength: this.calculateAveragePathLength(nodes, edges),
      cyclomaticComplexity: this.calculateCyclomaticComplexity(nodes, edges),
      deadEndNodes: this.findDeadEndNodes(nodes, edges).length,
      unreachableNodes: this.findUnreachableNodes(nodes, edges).length,
      branchingFactor: this.calculateBranchingFactor(nodes, edges),
      userDropoffRate: 0, // Would be populated from real data
      avgCompletionTime: 0, // Would be populated from real data
      errorRate: 0, // Would be populated from real data
    };
  }

  private findDeadEndNodes(nodes: Node[], edges: Edge[]): string[] {
    return nodes
      .filter(node => !edges.some(edge => edge.source === node.id))
      .filter(node => node.id !== this.findStartNode(nodes)?.id)
      .map(node => node.id);
  }

  private findUnreachableNodes(nodes: Node[], edges: Edge[]): string[] {
    const startNode = this.findStartNode(nodes);
    if (!startNode) return [];

    const reachable = new Set<string>();
    const queue = [startNode.id];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (reachable.has(current)) continue;

      reachable.add(current);
      
      const outgoingEdges = edges.filter(edge => edge.source === current);
      outgoingEdges.forEach(edge => {
        if (!reachable.has(edge.target)) {
          queue.push(edge.target);
        }
      });
    }

    return nodes
      .filter(node => !reachable.has(node.id))
      .map(node => node.id);
  }

  private detectInfiniteLoops(nodes: Node[], edges: Edge[]): string[][] {
    const loops: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]): void => {
      if (recursionStack.has(nodeId)) {
        // Found a cycle
        const cycleStart = path.indexOf(nodeId);
        if (cycleStart !== -1) {
          loops.push(path.slice(cycleStart));
        }
        return;
      }

      if (visited.has(nodeId)) return;

      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const outgoingEdges = edges.filter(edge => edge.source === nodeId);
      outgoingEdges.forEach(edge => {
        dfs(edge.target, [...path]);
      });

      recursionStack.delete(nodeId);
    };

    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    });

    return loops;
  }

  private findMissingFallbacks(nodes: Node[], edges: Edge[]): string[] {
    return nodes
      .filter(node => node.type === 'option')
      .filter(node => {
        const options = node.data?.options || [];
        return !options.some((option: any) => 
          option.label?.toLowerCase().includes('other') ||
          option.label?.toLowerCase().includes('none')
        );
      })
      .map(node => node.id);
  }

  private detectVariableInconsistencies(nodes: Node[]): Array<{
    description: string;
    nodes: string[];
    fix: string;
  }> {
    const issues: Array<{ description: string; nodes: string[]; fix: string }> = [];
    const variableUsage = new Map<string, { setters: string[]; getters: string[] }>();

    // Analyze variable usage
    nodes.forEach(node => {
      const data = node.data || {};
      
      // Check for variable setters
      if (data.saveToVariable) {
        const usage = variableUsage.get(data.saveToVariable) || { setters: [], getters: [] };
        usage.setters.push(node.id);
        variableUsage.set(data.saveToVariable, usage);
      }

      // Check for variable getters (in text content)
      if (data.text && typeof data.text === 'string') {
        const variableMatches = data.text.match(/\{\{(\w+)\}\}/g);
        if (variableMatches) {
          variableMatches.forEach(match => {
            const varName = match.replace(/[{}]/g, '');
            const usage = variableUsage.get(varName) || { setters: [], getters: [] };
            usage.getters.push(node.id);
            variableUsage.set(varName, usage);
          });
        }
      }
    });

    // Find issues
    variableUsage.forEach((usage, varName) => {
      if (usage.getters.length > 0 && usage.setters.length === 0) {
        issues.push({
          description: `Variable "${varName}" is used but never set`,
          nodes: usage.getters,
          fix: `Add a node that sets the "${varName}" variable`,
        });
      }

      if (usage.setters.length > 0 && usage.getters.length === 0) {
        issues.push({
          description: `Variable "${varName}" is set but never used`,
          nodes: usage.setters,
          fix: `Use the "${varName}" variable in a message or remove the setter`,
        });
      }
    });

    return issues;
  }

  private findStartNode(nodes: Node[]): Node | undefined {
    return nodes.find(node => node.type === 'start' || node.id.includes('start'));
  }

  private calculateAveragePathLength(nodes: Node[], edges: Edge[]): number {
    // Simplified calculation - would need more sophisticated graph analysis
    return edges.length > 0 ? edges.length / Math.max(1, nodes.length - 1) : 0;
  }

  private calculateCyclomaticComplexity(nodes: Node[], edges: Edge[]): number {
    // McCabe's cyclomatic complexity: M = E - N + 2P
    // E = edges, N = nodes, P = connected components (simplified to 1)
    return Math.max(1, edges.length - nodes.length + 2);
  }

  private calculateBranchingFactor(nodes: Node[], edges: Edge[]): number {
    const branchingNodes = nodes.filter(node => 
      edges.filter(edge => edge.source === node.id).length > 1
    );
    
    if (branchingNodes.length === 0) return 1;
    
    const totalBranches = branchingNodes.reduce((sum, node) => 
      sum + edges.filter(edge => edge.source === node.id).length, 0
    );
    
    return totalBranches / branchingNodes.length;
  }

  private findComplexNodes(nodes: Node[], edges: Edge[]): string[] {
    return nodes
      .filter(node => edges.filter(edge => edge.source === node.id).length > 3)
      .map(node => node.id);
  }

  private findLongPaths(nodes: Node[], edges: Edge[]): string[][] {
    const paths: string[][] = [];
    const startNode = this.findStartNode(nodes);
    
    if (!startNode) return paths;

    const dfs = (nodeId: string, currentPath: string[], visited: Set<string>): void => {
      if (visited.has(nodeId) || currentPath.length > 20) return;

      const newPath = [...currentPath, nodeId];
      const outgoingEdges = edges.filter(edge => edge.source === nodeId);
      
      if (outgoingEdges.length === 0) {
        // End of path
        paths.push(newPath);
        return;
      }

      const newVisited = new Set(visited);
      newVisited.add(nodeId);

      outgoingEdges.forEach(edge => {
        dfs(edge.target, newPath, newVisited);
      });
    };

    dfs(startNode.id, [], new Set());
    return paths;
  }

  private findResourceHeavyNodes(nodes: Node[]): string[] {
    return nodes
      .filter(node => {
        const data = node.data || {};
        return (
          data.mediaUrl || // Has media
          data.apiCall || // Makes API calls
          (data.options && data.options.length > 10) // Too many options
        );
      })
      .map(node => node.id);
  }

  private analyzeDropoffPoints(behavior: UserBehaviorPattern[]): Array<{
    nodeId: string;
    rate: number;
  }> {
    const nodeStats = new Map<string, { visits: number; exits: number }>();

    behavior.forEach(pattern => {
      pattern.path.forEach((nodeId, index) => {
        const stats = nodeStats.get(nodeId) || { visits: 0, exits: 0 };
        stats.visits++;
        
        if (!pattern.successful && index === pattern.path.length - 1) {
          stats.exits++;
        }
        
        nodeStats.set(nodeId, stats);
      });
    });

    return Array.from(nodeStats.entries()).map(([nodeId, stats]) => ({
      nodeId,
      rate: stats.exits / stats.visits,
    }));
  }

  private analyzeCompletionTimes(behavior: UserBehaviorPattern[]): Array<{
    nodes: string[];
    avgTime: number;
  }> {
    const pathTimes = new Map<string, number[]>();

    behavior.forEach(pattern => {
      const pathKey = pattern.path.join('->');
      const times = pathTimes.get(pathKey) || [];
      times.push(pattern.completionTime);
      pathTimes.set(pathKey, times);
    });

    return Array.from(pathTimes.entries()).map(([pathKey, times]) => ({
      nodes: pathKey.split('->'),
      avgTime: times.reduce((sum, time) => sum + time, 0) / times.length,
    }));
  }

  private extractFeatures(metrics: FlowMetrics): tf.Tensor {
    return tf.tensor2d([[
      metrics.nodeCount,
      metrics.edgeCount,
      metrics.avgPathLength,
      metrics.cyclomaticComplexity,
      metrics.deadEndNodes,
      metrics.unreachableNodes,
      metrics.branchingFactor,
      metrics.userDropoffRate,
      metrics.avgCompletionTime / 1000, // Normalize to seconds
      metrics.errorRate,
    ]]);
  }

  // Public methods for training and updating
  addHistoricalData(metrics: FlowMetrics) {
    this.historicalData.push(metrics);
    
    // Keep only recent data (last 1000 entries)
    if (this.historicalData.length > 1000) {
      this.historicalData = this.historicalData.slice(-1000);
    }
  }

  addBehaviorData(patterns: UserBehaviorPattern[]) {
    this.behaviorPatterns.push(...patterns);
    
    // Keep only recent data (last 5000 patterns)
    if (this.behaviorPatterns.length > 5000) {
      this.behaviorPatterns = this.behaviorPatterns.slice(-5000);
    }
  }

  updateThresholds(newThresholds: Partial<typeof this.thresholds>) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }
}

// React Hook for using anomaly detection
export const useAnomalyDetection = () => {
  const [engine] = useState(() => new FlowAnomalyDetectionEngine());
  const [anomalies, setAnomalies] = useState<FlowAnomaly[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeFlow = useCallback(async (
    nodes: Node[],
    edges: Edge[],
    userBehavior?: UserBehaviorPattern[]
  ) => {
    setIsAnalyzing(true);
    try {
      const detectedAnomalies = await engine.detectAnomalies(nodes, edges, userBehavior);
      setAnomalies(detectedAnomalies);
      return detectedAnomalies;
    } finally {
      setIsAnalyzing(false);
    }
  }, [engine]);

  const addTrainingData = useCallback((
    metrics: FlowMetrics,
    behavior?: UserBehaviorPattern[]
  ) => {
    engine.addHistoricalData(metrics);
    if (behavior) {
      engine.addBehaviorData(behavior);
    }
  }, [engine]);

  return {
    anomalies,
    analyzeFlow,
    addTrainingData,
    isAnalyzing,
    engine,
  };
};
