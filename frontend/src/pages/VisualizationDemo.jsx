import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Shuffle, GitBranch, Search, Keyboard } from 'lucide-react';
import { PlaybackEngine } from '../engine/playback';
import { useVisualizationStore } from '../engine/state';
import { useKeyboardShortcuts } from '../engine/keyboard';
import { mergeSort, bubbleSort, quickSort, insertionSort, selectionSort, heapSort } from '../engine/algorithms/sorting';
import { bfs, dfs, dijkstra, prim, kruskal, topologicalSort, aStar } from '../engine/algorithms/graph';
import { linearSearch, binarySearch, jumpSearch, exponentialSearch } from '../engine/algorithms/searching';
import { fibonacciDP, knapsack, lcs, coinChange } from '../engine/algorithms/dp';
import { fibonacci, factorial, towerOfHanoi } from '../engine/algorithms/recursion';
import { kmp } from '../engine/algorithms/string';
import ArrayRenderer from '../components/renderers/ArrayRenderer';
import GraphRenderer, { graphTemplates } from '../components/renderers/GraphRenderer';
import PlaybackControls from '../components/engine/PlaybackControls';
import StepDescription from '../components/engine/StepDescription';
import StatsPanel from '../components/engine/StatsPanel';
import SplitPane from '../components/layout/SplitPane';
import VisualizationLayout from '../components/layout/VisualizationLayout';
import CodeEditor from '../components/editors/CodeEditor';
import GraphEditor from '../components/editors/GraphEditor';
import './VisualizationDemo.css';

const ALGO_CATEGORIES = {
  sorting: {
    label: 'Sorting',
    icon: '📊',
    algorithms: {
      mergeSort: { name: 'Merge Sort', fn: mergeSort, type: 'array' },
      bubbleSort: { name: 'Bubble Sort', fn: bubbleSort, type: 'array' },
      quickSort: { name: 'Quick Sort', fn: quickSort, type: 'array' },
      insertionSort: { name: 'Insertion Sort', fn: insertionSort, type: 'array' },
      selectionSort: { name: 'Selection Sort', fn: selectionSort, type: 'array' },
      heapSort: { name: 'Heap Sort', fn: heapSort, type: 'array' },
    },
  },
  searching: {
    label: 'Searching',
    icon: '🔍',
    algorithms: {
      linearSearch: { name: 'Linear Search', fn: linearSearch, type: 'search' },
      binarySearch: { name: 'Binary Search', fn: binarySearch, type: 'search' },
      jumpSearch: { name: 'Jump Search', fn: jumpSearch, type: 'search' },
      exponentialSearch: { name: 'Exponential Search', fn: exponentialSearch, type: 'search' },
    },
  },
  graph: {
    label: 'Graph',
    icon: '🔗',
    algorithms: {
      bfs: { name: 'BFS', fn: bfs, type: 'graph' },
      dfs: { name: 'DFS', fn: dfs, type: 'graph' },
      dijkstra: { name: 'Dijkstra', fn: dijkstra, type: 'graph' },
      prim: { name: 'Prim\'s MST', fn: prim, type: 'graph' },
      kruskal: { name: 'Kruskal\'s MST', fn: kruskal, type: 'graph' },
      topologicalSort: { name: 'Topological Sort', fn: topologicalSort, type: 'graph' },
      aStar: { name: 'A* Search', fn: aStar, type: 'graph' },
    },
  },
  dp: {
    label: 'DP',
    icon: '🧮',
    algorithms: {
      fibonacciDP: { name: 'Fibonacci DP', fn: fibonacciDP, type: 'dp' },
      knapsack: { name: '0/1 Knapsack', fn: knapsack, type: 'dp' },
      lcs: { name: 'Longest Common Subsequence', fn: lcs, type: 'dp' },
      coinChange: { name: 'Coin Change', fn: coinChange, type: 'dp' },
    },
  },
  recursion: {
    label: 'Recursion',
    icon: '🔄',
    algorithms: {
      fibonacci: { name: 'Fibonacci', fn: fibonacci, type: 'recursion' },
      factorial: { name: 'Factorial', fn: factorial, type: 'recursion' },
      towerOfHanoi: { name: 'Tower of Hanoi', fn: towerOfHanoi, type: 'recursion' },
    },
  },
  string: {
    label: 'String',
    icon: '🔤',
    algorithms: {
      kmp: { name: 'KMP Matching', fn: kmp, type: 'string' },
    },
  },
};

const CODE_SNIPPETS = {
  mergeSort: `def merge_sort(arr):
    if len(arr) <= 1: return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)`,
  bubbleSort: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]`,
  quickSort: `def quicksort(arr, low, high):
    if low < high:
        pi = partition(arr, low, high)
        quicksort(arr, low, pi-1)
        quicksort(arr, pi+1, high)`,
  insertionSort: `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j+1] = arr[j]
            j -= 1
        arr[j+1] = key`,
  selectionSort: `def selection_sort(arr):
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i+1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]`,
  heapSort: `def heapsort(arr):
    n = len(arr)
    for i in range(n//2-1, -1, -1):
        heapify(arr, n, i)
    for i in range(n-1, 0, -1):
        arr[0], arr[i] = arr[i], arr[0]
        heapify(arr, i, 0)`,
  linearSearch: `def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1`,
  binarySearch: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target: return mid
        elif arr[mid] < target: left = mid + 1
        else: right = mid - 1
    return -1`,
  bfs: `def bfs(graph, start):
    visited = set([start])
    queue = [start]
    while queue:
        node = queue.pop(0)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)`,
  dfs: `def dfs(graph, node, visited=None):
    if visited is None: visited = set()
    visited.add(node)
    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited)`,
  dijkstra: `def dijkstra(graph, start):
    dist = {n: float('inf') for n in graph}
    dist[start] = 0
    pq = [(0, start)]
    while pq:
        d, u = heappop(pq)
        for v, w in graph[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                heappush(pq, (dist[v], v))`,
  prim: `def prim(graph, start):
    mst = []
    visited = {start}
    while len(visited) < len(graph):
        edges = [(w, u, v) for u in visited
                 for v, w in graph[u] if v not in visited]
        if not edges: break
        w, u, v = min(edges)
        mst.append((u, v, w))
        visited.add(v)`,
};

const VisualizationDemo = () => {
  const [category, setCategory] = useState('sorting');
  const [selectedAlgo, setSelectedAlgo] = useState('mergeSort');
  const [inputArray, setInputArray] = useState([]);
  const [arraySize, setArraySize] = useState(20);
  const [inputMode, setInputMode] = useState('random');
  const [targetValue, setTargetValue] = useState(42);
  const [vizStyle, setVizStyle] = useState('bars');
  const [showValues, setShowValues] = useState(true);
  const [graphTemplate, setGraphTemplate] = useState('complex');
  const [graphData, setGraphData] = useState(graphTemplates.complex());
  const [graphStartNode, setGraphStartNode] = useState('A');
  const [code, setCode] = useState('');

  const { steps, metadata } = useVisualizationStore();
  const engine = useMemo(() => new PlaybackEngine(), []);

  // Keyboard shortcuts
  useKeyboardShortcuts(engine);

  const currentAlgo = ALGO_CATEGORIES[category]?.algorithms[selectedAlgo];

  // Generate array based on input mode
  const generateArray = useCallback((size) => {
    const s = size || arraySize;
    let arr;
    if (inputMode === 'sorted') {
      arr = Array.from({ length: s }, (_, i) => i + 1);
    } else if (inputMode === 'reverse') {
      arr = Array.from({ length: s }, (_, i) => s - i);
    } else {
      arr = Array.from({ length: s }, () => Math.floor(Math.random() * 100) + 1);
    }
    setInputArray(arr);
    // Reset visualization state when array changes
    engine.stop();
    useVisualizationStore.getState().reset();
  }, [arraySize, inputMode, engine]);

  // Initialize
  useEffect(() => {
    generateArray();
    return () => engine.dispose();
  }, []);

  // Switch category
  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    const algos = ALGO_CATEGORIES[newCategory].algorithms;
    setSelectedAlgo(Object.keys(algos)[0]);
    engine.stop();
  };

  // Switch algorithm
  const handleAlgoChange = (algoKey) => {
    setSelectedAlgo(algoKey);
    engine.stop();
  };

  // Run algorithm
  const handleStart = useCallback(() => {
    if (!currentAlgo) return;

    let result;
    if (currentAlgo.type === 'array') {
      if (!inputArray.length) return;
      result = currentAlgo.fn(inputArray);
    } else if (currentAlgo.type === 'search') {
      if (!inputArray.length) return;
      const sorted = [...inputArray].sort((a, b) => a - b);
      result = currentAlgo.fn(sorted, targetValue);
    } else if (currentAlgo.type === 'graph') {
      result = currentAlgo.fn(graphData, graphStartNode);
    }

    if (!result) return;

    useVisualizationStore.getState().loadSteps(result.steps, result.metadata);
    engine.init(result.steps, {
      baseDuration: currentAlgo.type === 'graph' ? 0.5 : 0.3,
      onComplete: () => useVisualizationStore.getState().complete(),
    });
    engine.play();
  }, [currentAlgo, inputArray, targetValue, graphData, engine]);

  // Update code
  useEffect(() => {
    setCode(CODE_SNIPPETS[selectedAlgo] || '');
  }, [selectedAlgo]);

  // Get visualization area
  const renderVisualization = () => {
    if (currentAlgo?.type === 'graph') {
      return (
        <div className="viz-demo-viz-area viz-demo-graph-area">
          <GraphEditor
            initialGraph={graphData}
            onGraphChange={(newGraph) => {
              setGraphData(newGraph);
              if (newGraph.nodes.length > 0) {
                setGraphStartNode(newGraph.nodes[0].id);
              }
            }}
          />
        </div>
      );
    }

    return (
      <div className="viz-demo-viz-area">
        <ArrayRenderer
          data={currentAlgo?.type === 'search' ? [...inputArray].sort((a, b) => a - b) : inputArray}
          style={vizStyle}
          showValues={showValues}
        />
      </div>
    );
  };

  return (
    <div className="viz-demo">
      <div className="viz-demo-header">
        <h1>AlgoVerse V2 — Visualization Engine</h1>
        <p className="viz-demo-subtitle">Interactive algorithm visualization with step-by-step execution</p>
      </div>

      {/* Category tabs */}
      <div className="viz-demo-tabs">
        {Object.entries(ALGO_CATEGORIES).map(([key, cat]) => (
          <button
            key={key}
            className={`viz-demo-tab ${category === key ? 'active' : ''}`}
            onClick={() => handleCategoryChange(key)}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="viz-demo-toolbar">
        <div className="viz-demo-toolbar-group">
          <label>Algorithm:</label>
          <select
            value={selectedAlgo}
            onChange={(e) => handleAlgoChange(e.target.value)}
            className="viz-demo-select"
          >
            {Object.entries(ALGO_CATEGORIES[category].algorithms).map(([key, algo]) => (
              <option key={key} value={key}>{algo.name}</option>
            ))}
          </select>
        </div>

        {currentAlgo?.type !== 'graph' && (
          <>
            <div className="viz-demo-toolbar-group">
              <label>Style:</label>
              <select value={vizStyle} onChange={(e) => setVizStyle(e.target.value)} className="viz-demo-select">
                <option value="bars">Bars</option>
                <option value="dots">Dots</option>
                <option value="lines">Lines</option>
              </select>
            </div>
            <div className="viz-demo-toolbar-group">
              <label>Size:</label>
              <input
                type="range"
                min="5"
                max="50"
                value={arraySize}
                onChange={(e) => { setArraySize(parseInt(e.target.value)); generateArray(parseInt(e.target.value)); }}
                className="viz-demo-range"
              />
              <span className="viz-demo-range-label">{arraySize}</span>
            </div>
            <div className="viz-demo-toolbar-group">
              <label>Input:</label>
              <select value={inputMode} onChange={(e) => { setInputMode(e.target.value); generateArray(); }} className="viz-demo-select">
                <option value="random">Random</option>
                <option value="sorted">Sorted</option>
                <option value="reverse">Reverse</option>
              </select>
            </div>
            <label className="viz-demo-checkbox">
              <input type="checkbox" checked={showValues} onChange={(e) => setShowValues(e.target.checked)} />
              Values
            </label>
          </>
        )}

        {currentAlgo?.type === 'search' && (
          <div className="viz-demo-toolbar-group">
            <label>Target:</label>
            <input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(parseInt(e.target.value) || 0)}
              className="viz-demo-input"
            />
          </div>
        )}

        {currentAlgo?.type === 'graph' && (
          <>
            <div className="viz-demo-toolbar-group">
              <label>Graph:</label>
              <select
                value={graphTemplate}
                onChange={(e) => {
                  setGraphTemplate(e.target.value);
                  const newGraph = graphTemplates[e.target.value]();
                  setGraphData(newGraph);
                  // Reset start node to first node
                  if (newGraph.nodes.length > 0) {
                    setGraphStartNode(newGraph.nodes[0].id);
                  }
                }}
                className="viz-demo-select"
              >
                {Object.keys(graphTemplates).map(key => (
                  <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="viz-demo-toolbar-group">
              <label>Start:</label>
              <select
                value={graphStartNode}
                onChange={(e) => setGraphStartNode(e.target.value)}
                className="viz-demo-select"
              >
                {graphData.nodes.map(n => (
                  <option key={n.id} value={n.id}>{n.label || n.id}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Visualization with shared layout */}
      <VisualizationLayout
        engine={engine}
        onStart={handleStart}
        visualization={renderVisualization()}
        code={code}
        codeLanguage="python"
        algorithmType={currentAlgo?.type || 'array'}
        metadata={metadata}
        header={
          <div className="viz-demo-toolbar">
            {/* Toolbar content remains the same */}
          </div>
        }
      />

      {/* Keyboard shortcuts hint */}
      <div className="viz-demo-shortcuts">
        <Keyboard size={14} />
        <span><kbd>Space</kbd> Play/Pause</span>
        <span><kbd>←</kbd><kbd>→</kbd> Step</span>
        <span><kbd>R</kbd> Reset</span>
        <span><kbd>+</kbd><kbd>-</kbd> Speed</span>
      </div>
    </div>
  );
};

export default VisualizationDemo;
