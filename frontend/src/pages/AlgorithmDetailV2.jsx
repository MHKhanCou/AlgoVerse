import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Code, Play, AlertTriangle, ExternalLink, Shuffle, Settings, CheckCircle, Circle, MessageCircle } from 'lucide-react';
import { PlaybackEngine } from '../engine/playback';
import { useVisualizationStore } from '../engine/state';
import { useAuth } from '../contexts/AuthContext';
import { mergeSort, bubbleSort, quickSort, insertionSort, selectionSort, heapSort } from '../engine/algorithms/sorting';
import { bfs, dfs, dijkstra, prim, kruskal, topologicalSort, aStar } from '../engine/algorithms/graph';
import { linearSearch, binarySearch, jumpSearch, exponentialSearch } from '../engine/algorithms/searching';
import { fibonacciDP, knapsack, lcs, coinChange } from '../engine/algorithms/dp';
import { fibonacci, factorial, towerOfHanoi } from '../engine/algorithms/recursion';
import { kmp, rabinKarp } from '../engine/algorithms/string';
import { bstInsert, heapInsert } from '../engine/algorithms/tree';
import ArrayRenderer from '../components/renderers/ArrayRenderer';
import GraphRenderer, { graphTemplates } from '../components/renderers/GraphRenderer';
import TreeRenderer from '../components/renderers/TreeRenderer';
import DPTableRenderer from '../components/renderers/DPTableRenderer';
import RecursionRenderer from '../components/renderers/RecursionRenderer';
import StringRenderer from '../components/renderers/StringRenderer';
import PlaybackControls from '../components/engine/PlaybackControls';
import StepDescription from '../components/engine/StepDescription';
import StatsPanel from '../components/engine/StatsPanel';
import ComplexityCard from '../components/learning/ComplexityCard';
import PrerequisitesSection from '../components/learning/PrerequisitesSection';
import CommonMistakes from '../components/learning/CommonMistakes';
import WhenToUse from '../components/learning/WhenToUse';
import SplitPane from '../components/layout/SplitPane';
import TabPanel from '../components/layout/TabPanel';
import VisualizationLayout from '../components/layout/VisualizationLayout';
import CodeEditor from '../components/editors/CodeEditor';
import GraphEditor from '../components/editors/GraphEditor';
import RelatedProblems from '../components/RelatedProblems';
import AlgorithmDiscussionBoard from '../components/AlgorithmDiscussionBoard';
import { algorithmService } from '../services/algorithmService';
import { userProgressService } from '../services/userProgressService';
import './AlgorithmDetailV2.css';

// Algorithm registry — maps algorithm names to step generators
const ALGO_REGISTRY = {
  'bubble sort': { fn: bubbleSort, type: 'array' },
  'selection sort': { fn: selectionSort, type: 'array' },
  'insertion sort': { fn: insertionSort, type: 'array' },
  'merge sort': { fn: mergeSort, type: 'array' },
  'quick sort': { fn: quickSort, type: 'array' },
  'heap sort': { fn: heapSort, type: 'array' },
  'linear search': { fn: linearSearch, type: 'search' },
  'binary search': { fn: binarySearch, type: 'search' },
  'jump search': { fn: jumpSearch, type: 'search' },
  'exponential search': { fn: exponentialSearch, type: 'search' },
  'breadth-first search': { fn: bfs, type: 'graph' },
  'depth-first search': { fn: dfs, type: 'graph' },
  "dijkstra's algorithm": { fn: dijkstra, type: 'graph' },
  "prim's algorithm": { fn: prim, type: 'graph' },
  "kruskal's algorithm": { fn: kruskal, type: 'graph' },
  "topological sort": { fn: topologicalSort, type: 'graph' },
  "a* search": { fn: aStar, type: 'graph' },
  "a-star": { fn: aStar, type: 'graph' },
  'fibonacci dp': { fn: fibonacciDP, type: 'dp' },
  'knapsack': { fn: knapsack, type: 'dp' },
  'longest common subsequence': { fn: lcs, type: 'dp' },
  'coin change': { fn: coinChange, type: 'dp' },
  'factorial': { fn: factorial, type: 'recursion' },
  // Recursive (non-memoized) Fibonacci, distinct from the DP variant above.
  // Keyed more specifically than 'fibonacci dp' so lookup order cannot
  // shadow it.
  'fibonacci recursion': { fn: fibonacci, type: 'recursion' },
  'recursive fibonacci': { fn: fibonacci, type: 'recursion' },
  'tower of hanoi': { fn: towerOfHanoi, type: 'recursion' },
  'kmp': { fn: kmp, type: 'string' },
  'rabin-karp': { fn: rabinKarp, type: 'string' },
  'bst insert': { fn: bstInsert, type: 'tree' },
  'heap insert': { fn: heapInsert, type: 'tree' },
};

// Fixed demo inputs for DP algorithms, shared by the runner and the UI labels
// so they cannot drift apart.
const KNAPSACK_WEIGHTS = [2, 3, 4, 5];
const KNAPSACK_VALUES = [3, 4, 5, 6];
const COIN_DENOMINATIONS = [1, 5, 10, 25];

const AlgorithmDetailV2 = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [algorithm, setAlgorithm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inputArray, setInputArray] = useState([]);
  const [arraySize, setArraySize] = useState(15);
  const [inputMode, setInputMode] = useState('random');
  const [vizStyle, setVizStyle] = useState('bars');
  const [graphTemplate, setGraphTemplate] = useState('complex');
  const [graphData, setGraphData] = useState(graphTemplates.complex());
  const [graphStartNode, setGraphStartNode] = useState('A');
  const [targetValue, setTargetValue] = useState(50);
  const [showControls, setShowControls] = useState(false);
  const [progress, setProgress] = useState(null);
  const [dpN, setDpN] = useState(10);
  const [dpCapacity, setDpCapacity] = useState(10);
  const [dpAmount, setDpAmount] = useState(30);
  const [dpText1, setDpText1] = useState('ABCBDAB');
  const [dpText2, setDpText2] = useState('BDCABA');
  const [recursionN, setRecursionN] = useState(5);
  const [stringText, setStringText] = useState('ABABDABACDABABCABAB');
  const [stringPattern, setStringPattern] = useState('ABABCABAB');
  const [treeValues, setTreeValues] = useState('50,30,70,20,40,60,80');

  const { metadata } = useVisualizationStore();
  const engine = useMemo(() => new PlaybackEngine(), []);

  // Fetch algorithm data
  useEffect(() => {
    const fetchAlgorithm = async () => {
      try {
        setLoading(true);
        const data = await algorithmService.getById(id);
        setAlgorithm(data);
      } catch (error) {
        console.error('Failed to fetch algorithm:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlgorithm();
  }, [id]);

  // Auto-enroll and track progress
  useEffect(() => {
    if (!isAuthenticated || !id) return;

    const trackProgress = async () => {
      try {
        // Check if already enrolled
        const existing = await userProgressService.getEntry(id);
        if (existing) {
          setProgress(existing);
          // Update last accessed
          await userProgressService.updateLastAccessed(id);
        } else {
          // Auto-enroll
          const newProgress = await userProgressService.createProgress(id, 'enrolled');
          setProgress(newProgress);
        }
      } catch (error) {
        console.log('Progress tracking error:', error);
      }
    };

    trackProgress();
  }, [id, isAuthenticated]);

  // Mark as completed
  const handleMarkComplete = useCallback(async () => {
    if (!progress || !isAuthenticated) return;
    try {
      await userProgressService.updateProgress(progress.id, 'completed');
      setProgress({ ...progress, status: 'completed' });
    } catch (error) {
      console.error('Failed to mark complete:', error);
    }
  }, [progress, isAuthenticated]);

  // Mark as enrolled (undo complete)
  const handleMarkEnrolled = useCallback(async () => {
    if (!progress || !isAuthenticated) return;
    try {
      await userProgressService.updateProgress(progress.id, 'enrolled');
      setProgress({ ...progress, status: 'enrolled' });
    } catch (error) {
      console.error('Failed to mark enrolled:', error);
    }
  }, [progress, isAuthenticated]);

  // Generate array based on input mode and size
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

  // Initialize array
  useEffect(() => {
    generateArray();
    return () => engine.dispose();
  }, []);

  // Get algorithm type
  const algoType = useMemo(() => {
    if (!algorithm) return null;
    const name = algorithm.name?.toLowerCase() || '';
    const typeName = algorithm.type_name?.toLowerCase() || '';
    
    // Check registry first (most specific match)
    for (const [key, val] of Object.entries(ALGO_REGISTRY)) {
      if (name.includes(key)) return val;
    }
    
    // Fallback to type_name from database
    if (typeName.includes('graph')) return { type: 'graph' };
    if (typeName.includes('search')) return { type: 'search' };
    if (typeName.includes('dynamic') || typeName.includes('dp')) return { type: 'dp' };
    if (typeName.includes('tree')) return { type: 'tree' };
    if (typeName.includes('string')) return { type: 'string' };
    if (typeName.includes('recursion')) return { type: 'recursion' };
    return { type: 'array' };
  }, [algorithm]);

  // Run algorithm
  const handleStart = useCallback(() => {
    if (!algorithm || !algoType) return;

    const name = algorithm.name?.toLowerCase() || '';
    let algoFn = null;
    let algoType2 = algoType.type;

    // Exact match first, then includes
    for (const [key, val] of Object.entries(ALGO_REGISTRY)) {
      if (name === key || name.includes(key)) {
        algoFn = val.fn;
        algoType2 = val.type;
        break;
      }
    }

    if (!algoFn) {
      console.warn('No algorithm found for:', name);
      return;
    }

    let result;
    try {
      if (algoType2 === 'graph') {
        result = algoFn(graphData, graphStartNode);
      } else if (algoType2 === 'search') {
        const sorted = [...inputArray].sort((a, b) => a - b);
        const target = targetValue || sorted[Math.floor(sorted.length / 2)];
        result = algoFn(sorted, target);
      } else if (algoType2 === 'recursion') {
        result = algoFn(recursionN);
      } else if (algoType2 === 'dp') {
        if (name.includes('knapsack')) {
          result = algoFn(KNAPSACK_WEIGHTS, KNAPSACK_VALUES, dpCapacity);
        } else if (name.includes('longest common')) {
          result = algoFn(dpText1, dpText2);
        } else if (name.includes('coin change')) {
          result = algoFn(COIN_DENOMINATIONS, dpAmount);
        } else {
          result = algoFn(dpN);
        }
      } else if (algoType2 === 'string') {
        result = algoFn(stringText, stringPattern);
      } else if (algoType2 === 'tree') {
        const vals = treeValues.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
        result = algoFn(vals.length > 0 ? vals : [50, 30, 70, 20, 40]);
      } else {
        result = algoFn(inputArray);
      }

      useVisualizationStore.getState().loadSteps(result.steps, result.metadata);
      engine.init(result.steps, {
        baseDuration: algoType2 === 'graph' ? 0.5 : 0.3,
        onComplete: () => useVisualizationStore.getState().complete(),
      });
      engine.play();
    } catch (error) {
      console.error('Algorithm error:', error);
    }
  }, [algorithm, algoType, inputArray, graphData, graphStartNode, targetValue, engine, dpN, dpCapacity, dpAmount, dpText1, dpText2, recursionN, stringText, stringPattern, treeValues]);

  // Empty-table dimensions shown before a run. Derived from the same inputs
  // the step generators use, so the placeholder grid matches the real table
  // (previously hardcoded to 5x11, which only held for capacity === 10).
  const dpPlaceholder = useMemo(() => {
    const n = algorithm?.name?.toLowerCase() || '';
    if (n.includes('knapsack')) {
      return { rows: KNAPSACK_WEIGHTS.length + 1, cols: dpCapacity + 1 };
    }
    if (n.includes('longest') || n.includes('subsequence')) {
      return { rows: dpText1.length + 1, cols: dpText2.length + 1 };
    }
    if (n.includes('coin')) return { rows: 1, cols: dpAmount + 1 };
    return { rows: 1, cols: dpN + 1 };
  }, [algorithm, dpCapacity, dpText1, dpText2, dpAmount, dpN]);

  // Get category for common mistakes
  const category = useMemo(() => {
    if (!algorithm) return 'sorting';
    const name = algorithm.name?.toLowerCase() || '';
    const typeName = algorithm.type_name?.toLowerCase() || '';
    
    // Check by name first
    if (name.includes('sort')) return 'sorting';
    if (name.includes('search')) return 'searching';
    if (['bfs', 'dfs', 'dijkstra', 'prim', 'kruskal', 'topological', 'a*'].some(k => name.includes(k))) return 'graph';
    if (['fibonacci', 'knapsack', 'lcs', 'coin'].some(k => name.includes(k))) return 'dp';
    if (['factorial', 'tower'].some(k => name.includes(k))) return 'recursion';
    if (['kmp', 'rabin'].some(k => name.includes(k))) return 'string';
    if (['bst', 'heap insert'].some(k => name.includes(k))) return 'tree';
    
    // Fallback to type_name
    if (typeName.includes('graph')) return 'graph';
    if (typeName.includes('search')) return 'searching';
    if (typeName.includes('dynamic') || typeName.includes('dp')) return 'dp';
    if (typeName.includes('tree')) return 'tree';
    if (typeName.includes('string')) return 'string';
    if (typeName.includes('recursion')) return 'recursion';
    return 'sorting';
  }, [algorithm]);

  if (loading) {
    return (
      <div className="algo-detail-loading">
        <div className="loading-spinner" />
        <span>Loading algorithm...</span>
      </div>
    );
  }

  if (!algorithm) {
    return (
      <div className="algo-detail-not-found">
        <h2>Algorithm not found</h2>
        <Link to="/algorithms" className="algo-detail-back">
          <ArrowLeft size={16} /> Back to Algorithms
        </Link>
      </div>
    );
  }

  const name = algorithm.name || 'Unknown Algorithm';
  const description = algorithm.description || '';
  const explanation = algorithm.explanation || '';
  const code = algorithm.code || '';
  const difficulty = algorithm.difficulty || 'medium';

  // Build tabs
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <BookOpen size={14} />,
      content: (
        <div className="algo-detail-overview">
          <div className="algo-detail-description">
            <h3>Description</h3>
            <p>{description}</p>
          </div>

          {explanation && (
            <div className="algo-detail-explanation">
              <h3>How it works</h3>
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(explanation) }} />
            </div>
          )}

          <div className="algo-detail-grid">
            <ComplexityCard
              timeComplexity={metadata?.timeComplexity || algorithm.complexity}
              spaceComplexity={metadata?.spaceComplexity}
            />

            <PrerequisitesSection
              prerequisites={algorithm.prerequisites || []}
              related={algorithm.related || []}
            />
          </div>

          <div className="algo-detail-grid">
            <CommonMistakes category={category} algorithmName={algorithm.name} />
            <WhenToUse category={category} algorithmName={algorithm.name} />
          </div>
        </div>
      ),
    },
    {
      id: 'visualize',
      label: 'Visualize',
      icon: <Play size={14} />,
      content: (
        <div className="algo-detail-viz-wrapper">
          {/* Controls Panel */}
          <div className="algo-detail-controls">
            <button
              className="algo-detail-controls-toggle"
              onClick={() => setShowControls(!showControls)}
            >
              <Settings size={14} />
              {showControls ? 'Hide Controls' : 'Input Settings'}
            </button>

            {showControls && (
              <div className="algo-detail-controls-panel">
                {/* Sorting controls */}
                {algoType?.type === 'array' && (
                  <>
                    <div className="algo-detail-control-group">
                      <label>Size: {arraySize}</label>
                      <input
                        type="range"
                        min="5"
                        max="30"
                        value={arraySize}
                        onChange={(e) => { setArraySize(parseInt(e.target.value)); generateArray(parseInt(e.target.value)); }}
                        className="algo-detail-range"
                      />
                    </div>
                    <div className="algo-detail-control-group">
                      <label>Style:</label>
                      <select
                        value={vizStyle}
                        onChange={(e) => setVizStyle(e.target.value)}
                        className="algo-detail-select"
                      >
                        <option value="bars">Bars</option>
                        <option value="dots">Dots</option>
                        <option value="lines">Lines</option>
                      </select>
                    </div>
                    <div className="algo-detail-control-group">
                      <label>Input:</label>
                      <select
                        value={inputMode}
                        onChange={(e) => { setInputMode(e.target.value); generateArray(); }}
                        className="algo-detail-select"
                      >
                        <option value="random">Random</option>
                        <option value="sorted">Sorted</option>
                        <option value="reverse">Reverse</option>
                      </select>
                    </div>
                    <button onClick={() => generateArray()} className="algo-detail-btn">
                      <Shuffle size={14} /> New Array
                    </button>
                  </>
                )}

                {/* Search controls */}
                {algoType?.type === 'search' && (
                  <>
                    <div className="algo-detail-control-group">
                      <label>Size: {arraySize}</label>
                      <input
                        type="range"
                        min="5"
                        max="30"
                        value={arraySize}
                        onChange={(e) => { setArraySize(parseInt(e.target.value)); generateArray(parseInt(e.target.value)); }}
                        className="algo-detail-range"
                      />
                    </div>
                    <div className="algo-detail-control-group">
                      <label>Target:</label>
                      <input
                        type="number"
                        value={targetValue}
                        onChange={(e) => setTargetValue(parseInt(e.target.value) || 0)}
                        className="algo-detail-input"
                      />
                    </div>
                    <button onClick={() => generateArray()} className="algo-detail-btn">
                      <Shuffle size={14} /> New Array
                    </button>
                  </>
                )}

                {/* Graph controls */}
                {algoType?.type === 'graph' && (
                  <>
                    <div className="algo-detail-control-group">
                      <label>Graph:</label>
                      <select
                        value={graphTemplate}
                        onChange={(e) => {
                          setGraphTemplate(e.target.value);
                          const newGraph = graphTemplates[e.target.value]();
                          setGraphData(newGraph);
                          if (newGraph.nodes.length > 0) setGraphStartNode(newGraph.nodes[0].id);
                        }}
                        className="algo-detail-select"
                      >
                        {Object.keys(graphTemplates).map(key => (
                          <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="algo-detail-control-group">
                      <label>Start:</label>
                      <select
                        value={graphStartNode}
                        onChange={(e) => setGraphStartNode(e.target.value)}
                        className="algo-detail-select"
                      >
                        {graphData.nodes.map(n => (
                          <option key={n.id} value={n.id}>{n.label || n.id}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* DP controls */}
                {algoType?.type === 'dp' && (
                  <>
                    {algorithm?.name?.toLowerCase().includes('fibonacci') && (
                      <div className="algo-detail-control-group">
                        <label>n = {dpN}</label>
                        <input
                          type="range"
                          min="3"
                          max="20"
                          value={dpN}
                          onChange={(e) => setDpN(parseInt(e.target.value))}
                          className="algo-detail-range"
                        />
                      </div>
                    )}
                    {algorithm?.name?.toLowerCase().includes('knapsack') && (
                      <>
                        <div className="algo-detail-control-group">
                          <label>Capacity = {dpCapacity}</label>
                          <input
                            type="range"
                            min="5"
                            max="20"
                            value={dpCapacity}
                            onChange={(e) => setDpCapacity(parseInt(e.target.value))}
                            className="algo-detail-range"
                          />
                        </div>
                        <div className="algo-detail-control-group">
                          <label>Items: [{KNAPSACK_WEIGHTS.join(',')}]</label>
                          <span className="algo-detail-hint">Values: [{KNAPSACK_VALUES.join(',')}]</span>
                        </div>
                      </>
                    )}
                    {algorithm?.name?.toLowerCase().includes('longest') && (
                      <>
                        <div className="algo-detail-control-group">
                          <label>Text 1:</label>
                          <input
                            type="text"
                            value={dpText1}
                            onChange={(e) => setDpText1(e.target.value)}
                            className="algo-detail-input"
                            maxLength={12}
                          />
                        </div>
                        <div className="algo-detail-control-group">
                          <label>Text 2:</label>
                          <input
                            type="text"
                            value={dpText2}
                            onChange={(e) => setDpText2(e.target.value)}
                            className="algo-detail-input"
                            maxLength={12}
                          />
                        </div>
                      </>
                    )}
                    {algorithm?.name?.toLowerCase().includes('coin') && (
                      <div className="algo-detail-control-group">
                        <label>Amount = {dpAmount}</label>
                        <input
                          type="range"
                          min="5"
                          max="50"
                          value={dpAmount}
                          onChange={(e) => setDpAmount(parseInt(e.target.value))}
                          className="algo-detail-range"
                        />
                        <span className="algo-detail-hint">Coins: [{COIN_DENOMINATIONS.join(', ')}]</span>
                      </div>
                    )}
                  </>
                )}

                {/* Recursion controls */}
                {algoType?.type === 'recursion' && (
                  <div className="algo-detail-control-group">
                    <label>n = {recursionN}</label>
                    <input
                      type="range"
                      min="2"
                      max="10"
                      value={recursionN}
                      onChange={(e) => setRecursionN(parseInt(e.target.value))}
                      className="algo-detail-range"
                    />
                  </div>
                )}

                {/* String controls */}
                {algoType?.type === 'string' && (
                  <>
                    <div className="algo-detail-control-group">
                      <label>Text:</label>
                      <input
                        type="text"
                        value={stringText}
                        onChange={(e) => setStringText(e.target.value)}
                        className="algo-detail-input"
                        maxLength={25}
                      />
                    </div>
                    <div className="algo-detail-control-group">
                      <label>Pattern:</label>
                      <input
                        type="text"
                        value={stringPattern}
                        onChange={(e) => setStringPattern(e.target.value)}
                        className="algo-detail-input"
                        maxLength={15}
                      />
                    </div>
                  </>
                )}

                {/* Tree controls */}
                {algoType?.type === 'tree' && (
                  <div className="algo-detail-control-group">
                    <label>Values (comma-sep):</label>
                    <input
                      type="text"
                      value={treeValues}
                      onChange={(e) => setTreeValues(e.target.value)}
                      className="algo-detail-input"
                      placeholder="50,30,70,20,40"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Visualization Layout */}
          <VisualizationLayout
            engine={engine}
            onStart={handleStart}
            visualization={
              algoType?.type === 'graph' ? (
                <GraphRenderer graph={graphData} interactive={true} />
              ) : algoType?.type === 'tree' ? (
                <TreeRenderer treeData={inputArray} />
              ) : algoType?.type === 'dp' ? (
                <DPTableRenderer data={[]} rows={dpPlaceholder.rows} cols={dpPlaceholder.cols} />
              ) : algoType?.type === 'recursion' ? (
                <RecursionRenderer algorithmName={algorithm?.name || ''} />
              ) : algoType?.type === 'string' ? (
                <StringRenderer algorithmName={algorithm?.name || ''} />
              ) : (
                <ArrayRenderer
                  data={algoType?.type === 'search' ? [...inputArray].sort((a, b) => a - b) : inputArray}
                  style={vizStyle}
                  showValues={true}
                />
              )
            }
            code={code || '// No code available'}
            codeLanguage="python"
            algorithmType={algoType?.type || 'array'}
            metadata={metadata}
          />
        </div>
      ),
    },
    {
      id: 'code',
      label: 'Code',
      icon: <Code size={14} />,
      content: (
        <div className="algo-detail-code">
          <CodeEditor code={code || '// No code available for this algorithm'} language="python" readOnly={true} />
        </div>
      ),
    },
    {
      id: 'practice',
      label: 'Practice',
      icon: <ExternalLink size={14} />,
      content: (
        <div className="algo-detail-practice">
          <RelatedProblems algorithm={algorithm} user={user} />
        </div>
      ),
    },
    {
      id: 'discussion',
      label: 'Discussion',
      icon: <MessageCircle size={14} />,
      content: (
        <div className="algo-detail-discussion">
          <AlgorithmDiscussionBoard algorithmId={id} user={user} algorithm={algorithm} />
        </div>
      ),
    },
  ];

  return (
    <div className="algo-detail-v2">
      {/* Header */}
      <div className="algo-detail-header">
        <Link to="/algorithms" className="algo-detail-back">
          <ArrowLeft size={16} /> Algorithms
        </Link>
        <div className="algo-detail-title-row">
          <h1>{name}</h1>
          <span className={`algo-detail-difficulty algo-detail-difficulty-${difficulty}`}>
            {difficulty}
          </span>
          {isAuthenticated && progress && (
            <button
              onClick={progress.status === 'completed' ? handleMarkEnrolled : handleMarkComplete}
              className={`algo-detail-progress-btn ${progress.status === 'completed' ? 'completed' : ''}`}
            >
              {progress.status === 'completed' ? (
                <><CheckCircle size={14} /> Completed</>
              ) : (
                <><Circle size={14} /> Mark Complete</>
              )}
            </button>
          )}
        </div>
        <p className="algo-detail-description-short">{description}</p>
      </div>

      {/* Content */}
      <TabPanel tabs={tabs} defaultTab="overview" />
    </div>
  );
};

export default AlgorithmDetailV2;
