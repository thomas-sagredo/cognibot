// Web Worker for heavy graph processing
import { expose } from 'comlink';
import { Node, Edge } from '@xyflow/react';

interface GraphMetrics {
  nodeCount: number;
  edgeCount: number;
  connectedComponents: number;
  averagePathLength: number;
  clustering: number;
  centrality: Map<string, number>;
  criticalPath: string[];
  bottlenecks: string[];
  reachabilityMatrix: boolean[][];
}

interface LayoutResult {
  positions: Map<string, { x: number; y: number }>;
  iterations: number;
  energy: number;
  convergence: boolean;
}

interface PathfindingResult {
  path: string[];
  distance: number;
  alternatives: Array<{ path: string[]; distance: number }>;
}

class GraphProcessor {
  private nodeMap = new Map<string, Node>();
  private adjacencyList = new Map<string, string[]>();
  private edgeWeights = new Map<string, number>();
  
  // Initialize graph data structures
  initializeGraph(nodes: Node[], edges: Edge[]) {
    this.nodeMap.clear();
    this.adjacencyList.clear();
    this.edgeWeights.clear();

    // Build node map
    nodes.forEach(node => {
      this.nodeMap.set(node.id, node);
      this.adjacencyList.set(node.id, []);
    });

    // Build adjacency list and edge weights
    edges.forEach(edge => {
      const sourceNeighbors = this.adjacencyList.get(edge.source) || [];
      sourceNeighbors.push(edge.target);
      this.adjacencyList.set(edge.source, sourceNeighbors);
      
      // Calculate edge weight based on node types and data
      const weight = this.calculateEdgeWeight(edge);
      this.edgeWeights.set(`${edge.source}-${edge.target}`, weight);
    });
  }

  // Calculate comprehensive graph metrics
  calculateMetrics(nodes: Node[], edges: Edge[]): GraphMetrics {
    this.initializeGraph(nodes, edges);
    
    const startTime = performance.now();
    
    const metrics: GraphMetrics = {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      connectedComponents: this.findConnectedComponents(),
      averagePathLength: this.calculateAveragePathLength(),
      clustering: this.calculateClusteringCoefficient(),
      centrality: this.calculateBetweennessCentrality(),
      criticalPath: this.findCriticalPath(),
      bottlenecks: this.identifyBottlenecks(),
      reachabilityMatrix: this.buildReachabilityMatrix(),
    };

    const processingTime = performance.now() - startTime;
    console.log(`Graph metrics calculated in ${processingTime.toFixed(2)}ms`);
    
    return metrics;
  }

  // Force-directed layout algorithm (Fruchterman-Reingold)
  calculateForceDirectedLayout(
    nodes: Node[],
    edges: Edge[],
    options: {
      iterations?: number;
      width?: number;
      height?: number;
      k?: number; // Optimal distance
      temperature?: number;
    } = {}
  ): LayoutResult {
    const {
      iterations = 500,
      width = 1000,
      height = 800,
      k = Math.sqrt((width * height) / nodes.length),
      temperature = width / 10
    } = options;

    this.initializeGraph(nodes, edges);
    
    // Initialize positions randomly if not set
    const positions = new Map<string, { x: number; y: number }>();
    nodes.forEach(node => {
      positions.set(node.id, {
        x: node.position?.x || Math.random() * width,
        y: node.position?.y || Math.random() * height,
      });
    });

    let currentTemp = temperature;
    let totalEnergy = Infinity;
    let converged = false;

    for (let iter = 0; iter < iterations; iter++) {
      const forces = new Map<string, { x: number; y: number }>();
      
      // Initialize forces
      nodes.forEach(node => {
        forces.set(node.id, { x: 0, y: 0 });
      });

      // Calculate repulsive forces (all pairs)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const node1 = nodes[i];
          const node2 = nodes[j];
          
          const pos1 = positions.get(node1.id)!;
          const pos2 = positions.get(node2.id)!;
          
          const dx = pos1.x - pos2.x;
          const dy = pos1.y - pos2.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 0.01;
          
          const repulsiveForce = (k * k) / distance;
          const fx = (dx / distance) * repulsiveForce;
          const fy = (dy / distance) * repulsiveForce;
          
          const force1 = forces.get(node1.id)!;
          const force2 = forces.get(node2.id)!;
          
          force1.x += fx;
          force1.y += fy;
          force2.x -= fx;
          force2.y -= fy;
        }
      }

      // Calculate attractive forces (connected nodes)
      edges.forEach(edge => {
        const pos1 = positions.get(edge.source)!;
        const pos2 = positions.get(edge.target)!;
        
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.01;
        
        const attractiveForce = (distance * distance) / k;
        const fx = (dx / distance) * attractiveForce;
        const fy = (dy / distance) * attractiveForce;
        
        const force1 = forces.get(edge.source)!;
        const force2 = forces.get(edge.target)!;
        
        force1.x += fx;
        force1.y += fy;
        force2.x -= fx;
        force2.y -= fy;
      });

      // Apply forces and update positions
      let maxDisplacement = 0;
      nodes.forEach(node => {
        const force = forces.get(node.id)!;
        const pos = positions.get(node.id)!;
        
        const displacement = Math.sqrt(force.x * force.x + force.y * force.y);
        maxDisplacement = Math.max(maxDisplacement, displacement);
        
        if (displacement > 0) {
          const limitedDisplacement = Math.min(displacement, currentTemp);
          pos.x += (force.x / displacement) * limitedDisplacement;
          pos.y += (force.y / displacement) * limitedDisplacement;
          
          // Keep within bounds
          pos.x = Math.max(50, Math.min(width - 50, pos.x));
          pos.y = Math.max(50, Math.min(height - 50, pos.y));
        }
      });

      // Cool down
      currentTemp *= 0.95;
      
      // Check convergence
      if (maxDisplacement < 1.0) {
        converged = true;
        console.log(`Layout converged after ${iter} iterations`);
        break;
      }

      // Report progress every 50 iterations
      if (iter % 50 === 0) {
        self.postMessage({
          type: 'layout-progress',
          progress: iter / iterations,
          energy: maxDisplacement,
        });
      }
    }

    return {
      positions,
      iterations,
      energy: totalEnergy,
      convergence: converged,
    };
  }

  // A* pathfinding algorithm
  findOptimalPath(
    startId: string,
    endId: string,
    nodes: Node[],
    edges: Edge[]
  ): PathfindingResult {
    this.initializeGraph(nodes, edges);
    
    const openSet = new Set([startId]);
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    
    // Initialize scores
    nodes.forEach(node => {
      gScore.set(node.id, Infinity);
      fScore.set(node.id, Infinity);
    });
    
    gScore.set(startId, 0);
    fScore.set(startId, this.heuristic(startId, endId));
    
    while (openSet.size > 0) {
      // Find node with lowest fScore
      let current = '';
      let lowestF = Infinity;
      
      for (const nodeId of openSet) {
        const f = fScore.get(nodeId) || Infinity;
        if (f < lowestF) {
          lowestF = f;
          current = nodeId;
        }
      }
      
      if (current === endId) {
        // Reconstruct path
        const path = [current];
        let temp = current;
        
        while (cameFrom.has(temp)) {
          temp = cameFrom.get(temp)!;
          path.unshift(temp);
        }
        
        return {
          path,
          distance: gScore.get(endId) || 0,
          alternatives: this.findAlternativePaths(startId, endId, path),
        };
      }
      
      openSet.delete(current);
      const neighbors = this.adjacencyList.get(current) || [];
      
      for (const neighbor of neighbors) {
        const tentativeG = (gScore.get(current) || 0) + 
          (this.edgeWeights.get(`${current}-${neighbor}`) || 1);
        
        if (tentativeG < (gScore.get(neighbor) || Infinity)) {
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, tentativeG);
          fScore.set(neighbor, tentativeG + this.heuristic(neighbor, endId));
          
          if (!openSet.has(neighbor)) {
            openSet.add(neighbor);
          }
        }
      }
    }
    
    // No path found
    return {
      path: [],
      distance: Infinity,
      alternatives: [],
    };
  }

  // Detect cycles in the graph
  detectCycles(): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];
    
    const dfs = (nodeId: string, path: string[]): void => {
      if (recursionStack.has(nodeId)) {
        // Found cycle
        const cycleStart = path.indexOf(nodeId);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart));
        }
        return;
      }
      
      if (visited.has(nodeId)) return;
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const neighbors = this.adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        dfs(neighbor, [...path, nodeId]);
      }
      
      recursionStack.delete(nodeId);
    };
    
    for (const nodeId of this.nodeMap.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }
    
    return cycles;
  }

  // Helper methods
  private calculateEdgeWeight(edge: Edge): number {
    // Weight based on edge properties and node types
    let weight = 1;
    
    // Increase weight for complex transitions
    if (edge.data?.condition) weight += 2;
    if (edge.data?.probability && edge.data.probability < 0.5) weight += 1;
    
    return weight;
  }

  private findConnectedComponents(): number {
    const visited = new Set<string>();
    let components = 0;
    
    const dfs = (nodeId: string): void => {
      visited.add(nodeId);
      const neighbors = this.adjacencyList.get(nodeId) || [];
      
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        }
      }
    };
    
    for (const nodeId of this.nodeMap.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
        components++;
      }
    }
    
    return components;
  }

  private calculateAveragePathLength(): number {
    const allPairs: number[] = [];
    
    for (const start of this.nodeMap.keys()) {
      const distances = this.dijkstra(start);
      
      for (const [target, distance] of distances) {
        if (distance !== Infinity && start !== target) {
          allPairs.push(distance);
        }
      }
    }
    
    return allPairs.length > 0 
      ? allPairs.reduce((sum, dist) => sum + dist, 0) / allPairs.length 
      : 0;
  }

  private calculateClusteringCoefficient(): number {
    let totalClustering = 0;
    let nodeCount = 0;
    
    for (const [nodeId, neighbors] of this.adjacencyList) {
      if (neighbors.length < 2) continue;
      
      let triangles = 0;
      const possibleTriangles = (neighbors.length * (neighbors.length - 1)) / 2;
      
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          const neighbor1Connections = this.adjacencyList.get(neighbors[i]) || [];
          if (neighbor1Connections.includes(neighbors[j])) {
            triangles++;
          }
        }
      }
      
      totalClustering += triangles / possibleTriangles;
      nodeCount++;
    }
    
    return nodeCount > 0 ? totalClustering / nodeCount : 0;
  }

  private calculateBetweennessCentrality(): Map<string, number> {
    const centrality = new Map<string, number>();
    
    // Initialize centrality scores
    for (const nodeId of this.nodeMap.keys()) {
      centrality.set(nodeId, 0);
    }
    
    // For each pair of nodes
    for (const source of this.nodeMap.keys()) {
      for (const target of this.nodeMap.keys()) {
        if (source === target) continue;
        
        // Find all shortest paths
        const paths = this.findAllShortestPaths(source, target);
        
        if (paths.length === 0) continue;
        
        // Count how many paths go through each node
        const pathCounts = new Map<string, number>();
        
        paths.forEach(path => {
          path.forEach(nodeId => {
            if (nodeId !== source && nodeId !== target) {
              pathCounts.set(nodeId, (pathCounts.get(nodeId) || 0) + 1);
            }
          });
        });
        
        // Update centrality scores
        pathCounts.forEach((count, nodeId) => {
          const currentCentrality = centrality.get(nodeId) || 0;
          centrality.set(nodeId, currentCentrality + count / paths.length);
        });
      }
    }
    
    return centrality;
  }

  private findCriticalPath(): string[] {
    // Find the longest path in the graph (critical path)
    let longestPath: string[] = [];
    let maxLength = 0;
    
    for (const startNode of this.nodeMap.keys()) {
      const path = this.findLongestPathFrom(startNode);
      if (path.length > maxLength) {
        maxLength = path.length;
        longestPath = path;
      }
    }
    
    return longestPath;
  }

  private identifyBottlenecks(): string[] {
    const centrality = this.calculateBetweennessCentrality();
    const threshold = this.calculateCentralityThreshold(centrality);
    
    return Array.from(centrality.entries())
      .filter(([_, score]) => score > threshold)
      .map(([nodeId, _]) => nodeId);
  }

  private buildReachabilityMatrix(): boolean[][] {
    const nodeIds = Array.from(this.nodeMap.keys());
    const matrix: boolean[][] = [];
    
    nodeIds.forEach((sourceId, i) => {
      matrix[i] = [];
      const reachable = this.findReachableNodes(sourceId);
      
      nodeIds.forEach((targetId, j) => {
        matrix[i][j] = reachable.has(targetId);
      });
    });
    
    return matrix;
  }

  private dijkstra(startId: string): Map<string, number> {
    const distances = new Map<string, number>();
    const visited = new Set<string>();
    const queue = [{ nodeId: startId, distance: 0 }];
    
    // Initialize distances
    for (const nodeId of this.nodeMap.keys()) {
      distances.set(nodeId, Infinity);
    }
    distances.set(startId, 0);
    
    while (queue.length > 0) {
      // Sort by distance and get closest unvisited node
      queue.sort((a, b) => a.distance - b.distance);
      const current = queue.shift()!;
      
      if (visited.has(current.nodeId)) continue;
      visited.add(current.nodeId);
      
      const neighbors = this.adjacencyList.get(current.nodeId) || [];
      
      for (const neighbor of neighbors) {
        if (visited.has(neighbor)) continue;
        
        const weight = this.edgeWeights.get(`${current.nodeId}-${neighbor}`) || 1;
        const newDistance = current.distance + weight;
        
        if (newDistance < (distances.get(neighbor) || Infinity)) {
          distances.set(neighbor, newDistance);
          queue.push({ nodeId: neighbor, distance: newDistance });
        }
      }
    }
    
    return distances;
  }

  private heuristic(nodeId1: string, nodeId2: string): number {
    const node1 = this.nodeMap.get(nodeId1);
    const node2 = this.nodeMap.get(nodeId2);
    
    if (!node1 || !node2) return 0;
    
    // Euclidean distance between node positions
    const dx = (node1.position?.x || 0) - (node2.position?.x || 0);
    const dy = (node1.position?.y || 0) - (node2.position?.y || 0);
    
    return Math.sqrt(dx * dx + dy * dy) / 100; // Normalize
  }

  private findAlternativePaths(
    startId: string,
    endId: string,
    mainPath: string[]
  ): Array<{ path: string[]; distance: number }> {
    // Find alternative paths by temporarily removing edges from main path
    const alternatives: Array<{ path: string[]; distance: number }> = [];
    
    for (let i = 0; i < mainPath.length - 1; i++) {
      const edgeKey = `${mainPath[i]}-${mainPath[i + 1]}`;
      const originalWeight = this.edgeWeights.get(edgeKey);
      
      // Temporarily remove edge
      this.edgeWeights.set(edgeKey, Infinity);
      
      // Find alternative path
      const altResult = this.findOptimalPath(startId, endId, [], []);
      
      if (altResult.path.length > 0 && altResult.distance !== Infinity) {
        alternatives.push({
          path: altResult.path,
          distance: altResult.distance,
        });
      }
      
      // Restore edge
      if (originalWeight !== undefined) {
        this.edgeWeights.set(edgeKey, originalWeight);
      }
    }
    
    return alternatives.slice(0, 3); // Return top 3 alternatives
  }

  private findAllShortestPaths(startId: string, endId: string): string[][] {
    // Simplified implementation - in practice, you'd use more sophisticated algorithms
    const result = this.findOptimalPath(startId, endId, [], []);
    return result.path.length > 0 ? [result.path] : [];
  }

  private findLongestPathFrom(startId: string): string[] {
    const visited = new Set<string>();
    let longestPath: string[] = [];
    
    const dfs = (nodeId: string, currentPath: string[]): void => {
      if (visited.has(nodeId)) return;
      
      visited.add(nodeId);
      currentPath.push(nodeId);
      
      if (currentPath.length > longestPath.length) {
        longestPath = [...currentPath];
      }
      
      const neighbors = this.adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        dfs(neighbor, currentPath);
      }
      
      currentPath.pop();
      visited.delete(nodeId);
    };
    
    dfs(startId, []);
    return longestPath;
  }

  private calculateCentralityThreshold(centrality: Map<string, number>): number {
    const scores = Array.from(centrality.values());
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    return mean + stdDev; // Nodes above one standard deviation
  }

  private findReachableNodes(startId: string): Set<string> {
    const reachable = new Set<string>();
    const queue = [startId];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (reachable.has(current)) continue;
      
      reachable.add(current);
      const neighbors = this.adjacencyList.get(current) || [];
      
      for (const neighbor of neighbors) {
        if (!reachable.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }
    
    return reachable;
  }
}

// Expose worker methods
const graphProcessor = new GraphProcessor();

const workerAPI = {
  calculateMetrics: graphProcessor.calculateMetrics.bind(graphProcessor),
  calculateLayout: graphProcessor.calculateForceDirectedLayout.bind(graphProcessor),
  findPath: graphProcessor.findOptimalPath.bind(graphProcessor),
  detectCycles: graphProcessor.detectCycles.bind(graphProcessor),
};

expose(workerAPI);

export type GraphWorkerAPI = typeof workerAPI;
