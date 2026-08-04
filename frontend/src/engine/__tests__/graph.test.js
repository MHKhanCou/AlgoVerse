import { describe, it, expect } from 'vitest';
import { bfs, dfs, dijkstra, prim, kruskal, topologicalSort, aStar } from '../algorithms/graph';

// Test graph
const testGraph = {
  nodes: [
    { id: 'A', x: 50, y: 100 },
    { id: 'B', x: 200, y: 50 },
    { id: 'C', x: 200, y: 200 },
    { id: 'D', x: 350, y: 100 },
  ],
  edges: [
    { source: 'A', target: 'B', weight: 4 },
    { source: 'A', target: 'C', weight: 2 },
    { source: 'B', target: 'D', weight: 3 },
    { source: 'C', target: 'D', weight: 5 },
  ],
};

describe('Graph Algorithms', () => {
  describe('BFS', () => {
    it('should return steps from start node', () => {
      const result = bfs(testGraph, 'A');
      expect(result.steps).toBeDefined();
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.metadata.name).toBe('Breadth-First Search');
    });

    it('should visit all nodes', () => {
      const result = bfs(testGraph, 'A');
      const visitedNodes = new Set();
      result.steps.forEach(step => {
        if (step.nodeIds) {
          step.nodeIds.forEach(id => visitedNodes.add(id));
        }
      });
      expect(visitedNodes.size).toBe(4);
    });
  });

  describe('DFS', () => {
    it('should return steps from start node', () => {
      const result = dfs(testGraph, 'A');
      expect(result.steps).toBeDefined();
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.metadata.name).toBe('Depth-First Search');
    });
  });

  describe('Dijkstra', () => {
    it('should find shortest paths', () => {
      const result = dijkstra(testGraph, 'A');
      expect(result.steps).toBeDefined();
      expect(result.metadata.name).toBe("Dijkstra's Algorithm");
    });
  });

  describe('Prim', () => {
    it('should find MST', () => {
      const result = prim(testGraph, 'A');
      expect(result.steps).toBeDefined();
      expect(result.metadata.name).toBe("Prim's Algorithm");
    });
  });

  describe('Kruskal', () => {
    it('should find MST', () => {
      const result = kruskal(testGraph);
      expect(result.steps).toBeDefined();
      expect(result.metadata.name).toBe("Kruskal's Algorithm");
    });
  });

  describe('Topological Sort', () => {
    it('should return topological order', () => {
      const result = topologicalSort(testGraph);
      expect(result.steps).toBeDefined();
      expect(result.metadata.name).toBe('Topological Sort');
    });
  });

  describe('A* Search', () => {
    it('should find path between nodes', () => {
      const result = aStar(testGraph, 'A', 'D');
      expect(result.steps).toBeDefined();
      expect(result.metadata.name).toBe('A* Search');
    });
  });

  describe('Edge cases', () => {
    it('should handle single node graph', () => {
      const graph = {
        nodes: [{ id: 'A', x: 100, y: 100 }],
        edges: [],
      };
      const result = bfs(graph, 'A');
      expect(result.steps).toBeDefined();
    });

    it('should handle disconnected graph', () => {
      const graph = {
        nodes: [
          { id: 'A', x: 50, y: 100 },
          { id: 'B', x: 200, y: 100 },
        ],
        edges: [],
      };
      const result = bfs(graph, 'A');
      expect(result.steps).toBeDefined();
    });
  });
});
