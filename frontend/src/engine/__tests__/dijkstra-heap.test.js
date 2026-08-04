import { describe, it, expect } from 'vitest';
import { dijkstra, aStar, bfs, dfs } from '../algorithms/graph';

/** Reference shortest-path distances via repeated relaxation (Bellman-Ford). */
function referenceDistances(graph, startId) {
  const dist = {};
  graph.nodes.forEach(n => { dist[n.id] = Infinity; });
  dist[startId] = 0;
  for (let i = 0; i < graph.nodes.length - 1; i++) {
    for (const e of graph.edges) {
      const w = e.weight || 1;
      if (dist[e.source] + w < dist[e.target]) dist[e.target] = dist[e.source] + w;
      if (dist[e.target] + w < dist[e.source]) dist[e.source] = dist[e.target] + w;
    }
  }
  return dist;
}

/** Pull the final distance Dijkstra reported for each node from its steps. */
function reportedDistances(steps) {
  const seen = {};
  for (const s of steps) {
    const m = /^Visit node (.+) \(distance: (.+)\)$/.exec(s.description || '');
    if (m) seen[m[1]] = Number(m[2]);
  }
  return seen;
}

function randomGraph(seed, nodeCount) {
  // Deterministic LCG so failures are reproducible.
  let state = seed;
  const rand = () => (state = (state * 1103515245 + 12345) % 2147483648) / 2147483648;

  const nodes = Array.from({ length: nodeCount }, (_, i) => ({ id: `N${i}` }));
  const edges = [];
  // Spanning path guarantees connectivity.
  for (let i = 1; i < nodeCount; i++) {
    edges.push({ source: `N${i - 1}`, target: `N${i}`, weight: 1 + Math.floor(rand() * 9) });
  }
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 2; j < nodeCount; j++) {
      if (rand() < 0.35) {
        edges.push({ source: `N${i}`, target: `N${j}`, weight: 1 + Math.floor(rand() * 9) });
      }
    }
  }
  return { nodes, edges };
}

describe('dijkstra with binary heap priority queue', () => {
  it('matches Bellman-Ford distances on random connected graphs', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const graph = randomGraph(seed, 8);
      const expected = referenceDistances(graph, 'N0');
      const actual = reportedDistances(dijkstra(graph, 'N0').steps);

      for (const node of graph.nodes) {
        expect(
          actual[node.id],
          `seed ${seed}, node ${node.id}`
        ).toBe(expected[node.id]);
      }
    }
  });

  it('pops nodes in non-decreasing distance order', () => {
    const graph = randomGraph(7, 10);
    const order = [];
    for (const s of dijkstra(graph, 'N0').steps) {
      const m = /^Visit node .+ \(distance: (.+)\)$/.exec(s.description || '');
      if (m) order.push(Number(m[1]));
    }
    expect(order.length).toBeGreaterThan(1);
    for (let i = 1; i < order.length; i++) {
      expect(order[i]).toBeGreaterThanOrEqual(order[i - 1]);
    }
  });

  it('visits every node exactly once on a connected graph', () => {
    const graph = randomGraph(3, 9);
    const visits = dijkstra(graph, 'N0').steps.filter(s =>
      /^Visit node .+ \(distance:/.test(s.description || '')
    );
    expect(visits.length).toBe(graph.nodes.length);
  });
});

describe('A* with binary heap open set', () => {
  const grid = {
    nodes: [
      { id: 'A', x: 0, y: 0 },
      { id: 'B', x: 100, y: 0 },
      { id: 'C', x: 0, y: 100 },
      { id: 'D', x: 100, y: 100 },
    ],
    edges: [
      { source: 'A', target: 'B', weight: 1 },
      { source: 'A', target: 'C', weight: 1 },
      { source: 'B', target: 'D', weight: 1 },
      { source: 'C', target: 'D', weight: 1 },
    ],
  };

  it('finds a shortest path to the target', () => {
    const { steps } = aStar(grid, 'A', 'D');
    const pathStep = steps.at(-1);
    expect(pathStep.type).toBe('path');
    expect(pathStep.nodeIds[0]).toBe('A');
    expect(pathStep.nodeIds.at(-1)).toBe('D');
    expect(pathStep.nodeIds.length).toBe(3); // A -> (B|C) -> D
  });
});

describe('traversals remain correct', () => {
  const graph = randomGraph(11, 7);

  it('BFS and DFS reach every node in a connected graph', () => {
    for (const [name, fn] of [['bfs', bfs], ['dfs', dfs]]) {
      const reached = new Set();
      for (const s of fn(graph, 'N0').steps) {
        (s.nodeIds || []).forEach(id => reached.add(id));
      }
      expect(reached.size, name).toBe(graph.nodes.length);
    }
  });
});
