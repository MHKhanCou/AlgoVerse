/**
 * AlgoVerse V2 — Graph Algorithm Step Generators
 *
 * Each function takes a graph and returns { steps, metadata }.
 * Graph format: { nodes: [{id, label, x, y}], edges: [{source, target, weight}] }
 */

/**
 * Binary min-heap ordered by `keyFn`.
 *
 * Dijkstra advertises O((V + E) log V) and A* likewise, so the priority queue
 * must actually be logarithmic. Re-sorting an array on every pop would make it
 * O(V^2 log V) and teach the wrong thing to anyone reading the source
 * alongside the animation.
 */
class MinHeap {
  constructor(keyFn = (item) => item.dist) {
    this.items = [];
    this.keyFn = keyFn;
  }

  get size() {
    return this.items.length;
  }

  push(item) {
    const items = this.items;
    const key = this.keyFn;
    items.push(item);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (key(items[parent]) <= key(items[i])) break;
      [items[parent], items[i]] = [items[i], items[parent]];
      i = parent;
    }
  }

  pop() {
    const items = this.items;
    const key = this.keyFn;
    if (items.length === 0) return undefined;
    const top = items[0];
    const last = items.pop();
    if (items.length > 0) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = left + 1;
        let smallest = i;
        if (left < items.length && key(items[left]) < key(items[smallest])) smallest = left;
        if (right < items.length && key(items[right]) < key(items[smallest])) smallest = right;
        if (smallest === i) break;
        [items[smallest], items[i]] = [items[i], items[smallest]];
        i = smallest;
      }
    }
    return top;
  }
}

/**
 * BFS step generator.
 * @param {{ nodes: Array, edges: Array }} graph
 * @param {string|number} startId
 * @returns {import('../types').AlgorithmResult}
 */
export function bfs(graph, startId) {
  const { nodes, edges } = graph;
  const steps = [];
  const visited = new Set();
  const queue = [startId];
  visited.add(startId);

  // Build adjacency list
  const adj = {};
  nodes.forEach(n => { adj[n.id] = []; });
  edges.forEach(e => {
    adj[e.source].push({ target: e.target, weight: e.weight || 1 });
    adj[e.target].push({ target: e.source, weight: e.weight || 1 });
  });

  steps.push({
    type: 'visit',
    nodeIds: [startId],
    codeLine: 4,
    description: `Start BFS from node ${startId}`,
    timestamp: 0,
  });

  while (queue.length > 0) {
    const current = queue.shift();

    steps.push({
      type: 'visit',
      nodeIds: [current],
      codeLine: 6,
      description: `Dequeue and visit node ${current}`,
      timestamp: 0,
    });

    for (const { target } of adj[current]) {
      if (!visited.has(target)) {
        visited.add(target);
        queue.push(target);

        steps.push({
          type: 'explore',
          nodeIds: [target],
          edge: { source: current, target },
          codeLine: 9,
          description: `Discover node ${target} from ${current}`,
          timestamp: 0,
        });
      }
    }
  }

  steps.push({
    type: 'message',
    nodeIds: [],
    codeLine: null,
    description: 'BFS traversal complete!',
    timestamp: 0,
  });

  steps.forEach((step, i) => {
    step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
  });

  return {
    steps,
    metadata: {
      name: 'Breadth-First Search',
      timeComplexity: 'O(V + E)',
      spaceComplexity: 'O(V)',
      description: 'Explores all neighbor nodes at the present depth before moving to nodes at the next depth level.',
    },
  };
}

/**
 * DFS step generator.
 * @param {{ nodes: Array, edges: Array }} graph
 * @param {string|number} startId
 * @returns {import('../types').AlgorithmResult}
 */
export function dfs(graph, startId) {
  const { nodes, edges } = graph;
  const steps = [];
  const visited = new Set();

  // Build adjacency list
  const adj = {};
  nodes.forEach(n => { adj[n.id] = []; });
  edges.forEach(e => {
    adj[e.source].push({ target: e.target, weight: e.weight || 1 });
    adj[e.target].push({ target: e.source, weight: e.weight || 1 });
  });

  function dfsVisit(nodeId, depth = 0) {
    visited.add(nodeId);

    steps.push({
      type: 'visit',
      nodeIds: [nodeId],
      codeLine: 5,
      description: `Visit node ${nodeId} (depth ${depth})`,
      timestamp: 0,
    });

    for (const { target } of adj[nodeId]) {
      if (!visited.has(target)) {
        steps.push({
          type: 'explore',
          nodeIds: [target],
          edge: { source: nodeId, target },
          codeLine: 8,
          description: `Explore edge ${nodeId} → ${target}`,
          timestamp: 0,
        });
        dfsVisit(target, depth + 1);
      }
    }

    steps.push({
      type: 'backtrack',
      nodeIds: [nodeId],
      codeLine: 11,
      description: `Backtrack from node ${nodeId}`,
      timestamp: 0,
    });
  }

  steps.push({
    type: 'visit',
    nodeIds: [startId],
    codeLine: 3,
    description: `Start DFS from node ${startId}`,
    timestamp: 0,
  });

  dfsVisit(startId);

  steps.push({
    type: 'message',
    nodeIds: [],
    codeLine: null,
    description: 'DFS traversal complete!',
    timestamp: 0,
  });

  steps.forEach((step, i) => {
    step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
  });

  return {
    steps,
    metadata: {
      name: 'Depth-First Search',
      timeComplexity: 'O(V + E)',
      spaceComplexity: 'O(V)',
      description: 'Explores as far as possible along each branch before backtracking.',
    },
  };
}

/**
 * Dijkstra's algorithm step generator.
 * @param {{ nodes: Array, edges: Array }} graph
 * @param {string|number} startId
 * @returns {import('../types').AlgorithmResult}
 */
export function dijkstra(graph, startId) {
  const { nodes, edges } = graph;
  const steps = [];

  // Build adjacency list
  const adj = {};
  nodes.forEach(n => { adj[n.id] = []; });
  edges.forEach(e => {
    adj[e.source].push({ target: e.target, weight: e.weight || 1 });
    adj[e.target].push({ target: e.source, weight: e.weight || 1 });
  });

  // Initialize distances
  const dist = {};
  const prev = {};
  const visited = new Set();
  nodes.forEach(n => { dist[n.id] = Infinity; });
  dist[startId] = 0;

  steps.push({
    type: 'visit',
    nodeIds: [startId],
    codeLine: 5,
    description: `Initialize: set distance to ${startId} = 0`,
    timestamp: 0,
  });

  const pq = new MinHeap();
  pq.push({ id: startId, dist: 0 });

  while (pq.size > 0) {
    const { id: current } = pq.pop();

    if (visited.has(current)) continue;
    visited.add(current);

    steps.push({
      type: 'visit',
      nodeIds: [current],
      codeLine: 10,
      description: `Visit node ${current} (distance: ${dist[current]})`,
      timestamp: 0,
    });

    for (const { target, weight } of adj[current]) {
      if (visited.has(target)) continue;

      const newDist = dist[current] + weight;
      steps.push({
        type: 'compare',
        nodeIds: [current, target],
        edge: { source: current, target },
        codeLine: 13,
        description: `Check ${current} → ${target}: ${dist[current]} + ${weight} = ${newDist} vs ${dist[target] === Infinity ? '∞' : dist[target]}`,
        timestamp: 0,
      });

      if (newDist < dist[target]) {
        dist[target] = newDist;
        prev[target] = current;
        pq.push({ id: target, dist: newDist });

        steps.push({
          type: 'relax',
          nodeIds: [target],
          edge: { source: current, target },
          codeLine: 15,
          description: `Update distance to ${target}: ${newDist}`,
          timestamp: 0,
        });
      }
    }
  }

  // Reconstruct paths for display
  const pathEdges = [];
  Object.keys(prev).forEach(nodeId => {
    pathEdges.push({ source: prev[nodeId], target: nodeId });
  });

  steps.push({
    type: 'path',
    nodeIds: Object.keys(dist).filter(id => dist[id] < Infinity),
    pathEdges,
    codeLine: null,
    description: 'Dijkstra\'s algorithm complete!',
    timestamp: 0,
  });

  steps.forEach((step, i) => {
    step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
  });

  return {
    steps,
    metadata: {
      name: 'Dijkstra\'s Algorithm',
      timeComplexity: 'O((V + E) log V)',
      spaceComplexity: 'O(V)',
      description: 'Finds the shortest path between nodes in a weighted graph with non-negative edge weights.',
    },
  };
}

/**
 * Prim's MST algorithm step generator.
 * @param {{ nodes: Array, edges: Array }} graph
 * @param {string|number} startId
 * @returns {import('../types').AlgorithmResult}
 */
export function prim(graph, startId) {
  const { nodes, edges } = graph;
  const steps = [];

  // Build adjacency list
  const adj = {};
  nodes.forEach(n => { adj[n.id] = []; });
  edges.forEach(e => {
    adj[e.source].push({ target: e.target, weight: e.weight || 1 });
    adj[e.target].push({ target: e.source, weight: e.weight || 1 });
  });

  const inMST = new Set();
  const mstEdges = [];
  inMST.add(startId);

  steps.push({
    type: 'visit',
    nodeIds: [startId],
    codeLine: 4,
    description: `Start Prim's from node ${startId}`,
    timestamp: 0,
  });

  while (inMST.size < nodes.length) {
    let bestEdge = null;
    let bestWeight = Infinity;

    // Find minimum weight edge from MST to non-MST
    for (const nodeId of inMST) {
      for (const { target, weight } of adj[nodeId]) {
        if (!inMST.has(target) && weight < bestWeight) {
          bestWeight = weight;
          bestEdge = { source: nodeId, target };
        }
      }
    }

    if (!bestEdge) break;

    steps.push({
      type: 'compare',
      nodeIds: [bestEdge.source, bestEdge.target],
      edge: bestEdge,
      codeLine: 8,
      description: `Consider edge ${bestEdge.source} → ${bestEdge.target} (weight: ${bestWeight})`,
      timestamp: 0,
    });

    inMST.add(bestEdge.target);
    mstEdges.push(bestEdge);

    steps.push({
      type: 'explore',
      nodeIds: [bestEdge.target],
      edge: bestEdge,
      codeLine: 11,
      description: `Add edge ${bestEdge.source} → ${bestEdge.target} to MST`,
      timestamp: 0,
    });
  }

  steps.push({
    type: 'path',
    nodeIds: Array.from(inMST),
    pathEdges: mstEdges,
    codeLine: null,
    description: `Prim's MST complete! Total weight: ${mstEdges.reduce((sum, e) => {
      const edge = edges.find(ed => (ed.source === e.source && ed.target === e.target) || (ed.source === e.target && ed.target === e.source));
      return sum + (edge?.weight || 1);
    }, 0)}`,
    timestamp: 0,
  });

  steps.forEach((step, i) => {
    step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
  });

  return {
    steps,
    metadata: {
      name: 'Prim\'s Algorithm',
      timeComplexity: 'O(E log V)',
      spaceComplexity: 'O(V)',
      description: 'Finds a minimum spanning tree for a weighted undirected graph.',
    },
  };
}

/**
 * Kruskal's MST step generator.
 * @param {{ nodes: Array, edges: Array }} graph
 * @returns {import('../types').AlgorithmResult}
 */
export function kruskal(graph) {
  const { nodes, edges } = graph;
  const steps = [];
  
  // Sort edges by weight
  const sortedEdges = [...edges].sort((a, b) => (a.weight || 1) - (b.weight || 1));
  
  steps.push({
    type: 'highlight',
    nodeIds: [],
    codeLine: 2,
    description: `Sort all ${sortedEdges.length} edges by weight`,
    timestamp: 0,
  });

  // Union-Find data structure
  const parent = {};
  nodes.forEach(n => { parent[n.id] = n.id; });

  function find(x) {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }

  const mstEdges = [];
  let totalWeight = 0;

  for (const edge of sortedEdges) {
    const rootSource = find(edge.source);
    const rootTarget = find(edge.target);

    steps.push({
      type: 'compare',
      nodeIds: [edge.source, edge.target],
      edge: { source: edge.source, target: edge.target },
      codeLine: 5,
      description: `Check edge ${edge.source} → ${edge.target} (weight: ${edge.weight || 1})`,
      timestamp: 0,
    });

    if (rootSource !== rootTarget) {
      parent[rootSource] = rootTarget;
      mstEdges.push(edge);
      totalWeight += edge.weight || 1;

      steps.push({
        type: 'explore',
        nodeIds: [edge.source, edge.target],
        edge: { source: edge.source, target: edge.target },
        codeLine: 8,
        description: `Add edge to MST: ${edge.source} → ${edge.target}`,
        timestamp: 0,
      });
    } else {
      steps.push({
        type: 'backtrack',
        nodeIds: [edge.source, edge.target],
        codeLine: 10,
        description: `Skip edge (would create cycle): ${edge.source} → ${edge.target}`,
        timestamp: 0,
      });
    }
  }

  steps.push({
    type: 'path',
    nodeIds: nodes.map(n => n.id),
    pathEdges: mstEdges,
    codeLine: null,
    description: `Kruskal's MST complete! Total weight: ${totalWeight}`,
    timestamp: 0,
  });

  steps.forEach((step, i) => {
    step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
  });

  return {
    steps,
    metadata: {
      name: 'Kruskal\'s Algorithm',
      timeComplexity: 'O(E log E)',
      spaceComplexity: 'O(V)',
      description: 'Finds minimum spanning tree by sorting edges and adding non-cycle edges.',
    },
  };
}

/**
 * Topological Sort step generator.
 * @param {{ nodes: Array, edges: Array }} graph
 * @returns {import('../types').AlgorithmResult}
 */
export function topologicalSort(graph) {
  const { nodes, edges } = graph;
  const steps = [];

  // Build adjacency list and in-degree count
  const adj = {};
  const inDegree = {};
  nodes.forEach(n => {
    adj[n.id] = [];
    inDegree[n.id] = 0;
  });
  edges.forEach(e => {
    adj[e.source].push(e.target);
    inDegree[e.target]++;
  });

  steps.push({
    type: 'highlight',
    nodeIds: nodes.map(n => n.id),
    codeLine: 2,
    description: `Compute in-degrees for all nodes`,
    timestamp: 0,
  });

  // Find all nodes with in-degree 0
  const queue = [];
  nodes.forEach(n => {
    if (inDegree[n.id] === 0) {
      queue.push(n.id);
      steps.push({
        type: 'visit',
        nodeIds: [n.id],
        codeLine: 5,
        description: `Node ${n.id} has in-degree 0, add to queue`,
        timestamp: 0,
      });
    }
  });

  const result = [];

  while (queue.length > 0) {
    const current = queue.shift();
    result.push(current);

    steps.push({
      type: 'visit',
      nodeIds: [current],
      codeLine: 8,
      description: `Process node ${current}`,
      timestamp: 0,
    });

    for (const neighbor of adj[current]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
        steps.push({
          type: 'explore',
          nodeIds: [neighbor],
          codeLine: 10,
          description: `Node ${neighbor} now has in-degree 0, add to queue`,
          timestamp: 0,
        });
      }
    }
  }

  if (result.length !== nodes.length) {
    steps.push({
      type: 'message',
      nodeIds: [],
      codeLine: null,
      description: 'Graph has a cycle — topological sort not possible',
      timestamp: 0,
    });
  } else {
    steps.push({
      type: 'sorted',
      nodeIds: result,
      codeLine: null,
      description: `Topological order: ${result.join(' → ')}`,
      timestamp: 0,
    });
  }

  steps.forEach((step, i) => {
    step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
  });

  return {
    steps,
    metadata: {
      name: 'Topological Sort',
      timeComplexity: 'O(V + E)',
      spaceComplexity: 'O(V)',
      description: 'Linear ordering of vertices such that for every edge, source comes before destination.',
    },
  };
}

/**
 * A* Pathfinding step generator.
 * @param {{ nodes: Array, edges: Array }} graph
 * @param {string|number} startId
 * @param {string|number} endId
 * @returns {import('../types').AlgorithmResult}
 */
export function aStar(graph, startId, endId) {
  const { nodes, edges } = graph;
  const steps = [];

  // Build adjacency list
  const adj = {};
  nodes.forEach(n => { adj[n.id] = []; });
  edges.forEach(e => {
    adj[e.source].push({ target: e.target, weight: e.weight || 1 });
    adj[e.target].push({ target: e.source, weight: e.weight || 1 });
  });

  // Heuristic: use node index as simple heuristic (in real life, use coordinates)
  const heuristic = (nodeId) => {
    const endNode = nodes.find(n => n.id === endId);
    const currNode = nodes.find(n => n.id === nodeId);
    if (!endNode || !currNode) return 0;
    const dx = (currNode.x || 0) - (endNode.x || 0);
    const dy = (currNode.y || 0) - (endNode.y || 0);
    return Math.sqrt(dx * dx + dy * dy) / 100; // Normalize
  };

  const gScore = {};
  const fScore = {};
  const prev = {};
  const visited = new Set();
  nodes.forEach(n => { gScore[n.id] = Infinity; fScore[n.id] = Infinity; });
  gScore[startId] = 0;
  fScore[startId] = heuristic(startId);

  steps.push({
    type: 'visit',
    nodeIds: [startId],
    codeLine: 5,
    description: `Initialize: g(${startId})=0, f(${startId})=${fScore[startId].toFixed(2)}`,
    timestamp: 0,
  });

  const openSet = new MinHeap((item) => item.f);
  openSet.push({ id: startId, f: fScore[startId] });

  while (openSet.size > 0) {
    const { id: current } = openSet.pop();

    if (current === endId) {
      // Reconstruct path
      const path = [];
      let curr = endId;
      while (curr) {
        path.unshift(curr);
        curr = prev[curr];
      }
      const pathEdges = [];
      for (let i = 0; i < path.length - 1; i++) {
        pathEdges.push({ source: path[i], target: path[i + 1] });
      }
      steps.push({
        type: 'path',
        nodeIds: path,
        pathEdges,
        codeLine: null,
        description: `Path found: ${path.join(' → ')} (cost: ${gScore[endId].toFixed(2)})`,
        timestamp: 0,
      });
      steps.forEach((s, i) => { s.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0; });
      return { steps, metadata: { name: 'A* Search', timeComplexity: 'O((V + E) log V)', spaceComplexity: 'O(V)', description: 'Finds shortest path using heuristic-guided search.' } };
    }

    visited.add(current);
    steps.push({
      type: 'visit',
      nodeIds: [current],
      codeLine: 8,
      description: `Visit ${current} (g=${gScore[current].toFixed(2)}, f=${fScore[current].toFixed(2)})`,
      timestamp: 0,
    });

    for (const { target, weight } of adj[current]) {
      if (visited.has(target)) continue;
      const tentativeG = gScore[current] + weight;
      if (tentativeG < gScore[target]) {
        prev[target] = current;
        gScore[target] = tentativeG;
        fScore[target] = tentativeG + heuristic(target);
        openSet.push({ id: target, f: fScore[target] });
        steps.push({
          type: 'explore',
          nodeIds: [target],
          edge: { source: current, target },
          codeLine: 12,
          description: `Update ${target}: g=${tentativeG.toFixed(2)}, f=${fScore[target].toFixed(2)}`,
          timestamp: 0,
        });
      }
    }
  }

  steps.push({
    type: 'message',
    nodeIds: [],
    codeLine: null,
    description: `No path found from ${startId} to ${endId}`,
    timestamp: 0,
  });

  steps.forEach((s, i) => { s.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0; });
  return { steps, metadata: { name: 'A* Search', timeComplexity: 'O((V + E) log V)', spaceComplexity: 'O(V)', description: 'Finds shortest path using heuristic-guided search.' } };
}

/** Map of all graph algorithms */
/**
 * Bellman-Ford step generator.
 *
 * Relaxes every edge V - 1 times (order within a sweep does not matter),
 * exits early when a sweep changes nothing, then runs one extra sweep as
 * the negative-cycle check. The demo graphs are undirected, so each edge
 * is relaxed in both directions.
 * @param {{ nodes: Array, edges: Array }} graph
 * @param {string|number} startId
 * @returns {import('../types').AlgorithmResult}
 */
export function bellmanFord(graph, startId) {
  const { nodes, edges } = graph;
  const steps = [];
  const dist = {};
  const prev = {};
  nodes.forEach(n => { dist[n.id] = Infinity; });
  dist[startId] = 0;

  steps.push({
    type: 'visit',
    nodeIds: [startId],
    codeLine: 4,
    description: `Initialize: distance to ${startId} = 0, every other node = ∞.`,
    timestamp: 0,
  });

  const relaxSweep = (round) => {
    let changed = false;

    for (const edge of edges) {
      const weight = edge.weight || 1;
      const candidates = [
        { source: edge.source, target: edge.target, w: weight },
        { source: edge.target, target: edge.source, w: weight },
      ];

      for (const { source, target, w } of candidates) {
        if (dist[source] === Infinity) continue;
        const newDist = dist[source] + w;

        steps.push({
          type: 'compare',
          nodeIds: [source, target],
          edge: { source, target },
          codeLine: 9,
          description: `Sweep ${round}: check ${source} → ${target}: ${dist[source]} + ${w} = ${newDist} vs ${dist[target] === Infinity ? '∞' : dist[target]}.`,
          timestamp: 0,
        });

        if (newDist < dist[target]) {
          dist[target] = newDist;
          prev[target] = source;
          changed = true;
          steps.push({
            type: 'relax',
            nodeIds: [target],
            edge: { source, target },
            codeLine: 10,
            description: `Update ${target}: distance ${newDist} via ${source}.`,
            timestamp: 0,
          });
        }
      }
    }

    return changed;
  };

  const maxSweeps = Math.max(1, nodes.length - 1);
  let usedSweeps = 0;

  for (let round = 1; round <= maxSweeps; round++) {
    usedSweeps = round;
    if (!relaxSweep(round)) break;
  }

  if (usedSweeps < maxSweeps) {
    steps.push({
      type: 'message',
      nodeIds: [],
      codeLine: 12,
      description: `Sweep ${usedSweeps} changed nothing — distances are final; the remaining sweeps are skipped.`,
      timestamp: 0,
    });
  }

  const cycleChanged = relaxSweep(maxSweeps + 1);
  steps.push({
    type: 'message',
    nodeIds: [],
    codeLine: 14,
    description: cycleChanged
      ? `Sweep ${maxSweeps + 1} still improved a distance — a reachable negative cycle exists, so no finite shortest paths.`
      : `Sweep ${maxSweeps + 1} made no update — no negative cycle; the distances are exact.`,
    timestamp: 0,
  });

  const pathEdges = [];
  Object.keys(prev).forEach(nodeId => {
    pathEdges.push({ source: prev[nodeId], target: nodeId });
  });

  steps.push({
    type: 'path',
    nodeIds: Object.keys(dist).filter(id => dist[id] < Infinity),
    pathEdges,
    codeLine: null,
    description: 'Bellman-Ford complete!',
    timestamp: 0,
  });

  steps.forEach((step, i) => {
    step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
  });

  return {
    steps,
    metadata: {
      name: 'Bellman-Ford',
      timeComplexity: 'O(V·E)',
      spaceComplexity: 'O(V)',
      description: 'Relaxes every edge V − 1 times to find shortest paths even with negative weights, and detects negative cycles with one extra sweep.',
    },
  };
}

export const graphAlgorithms = { bfs, dfs, dijkstra, prim, kruskal, topologicalSort, aStar, bellmanFord };

/** Get algorithm by name */
export function getGraphAlgorithm(name) {
  const key = name.toLowerCase().replace(/[\s-]/g, '');
  return graphAlgorithms[key] || bfs;
}
