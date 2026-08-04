import React, { useState, useMemo } from 'react';
import { GitCompare } from 'lucide-react';
import { PlaybackEngine } from '../../engine/playback';
import { useVisualizationStore } from '../../engine/state';
import ArrayRenderer from '../renderers/ArrayRenderer';
import PlaybackControls from '../engine/PlaybackControls';
import StepDescription from '../engine/StepDescription';
import StatsPanel from '../engine/StatsPanel';
import './ComparisonView.css';

/**
 * AlgoVerse V2 — Comparison View
 *
 * Side-by-side algorithm comparison with synchronized playback.
 */

const COMPARISON_ALGORITHMS = {
  sorting: [
    { key: 'bubbleSort', name: 'Bubble Sort' },
    { key: 'selectionSort', name: 'Selection Sort' },
    { key: 'insertionSort', name: 'Insertion Sort' },
    { key: 'mergeSort', name: 'Merge Sort' },
    { key: 'quickSort', name: 'Quick Sort' },
    { key: 'heapSort', name: 'Heap Sort' },
  ],
  searching: [
    { key: 'linearSearch', name: 'Linear Search' },
    { key: 'binarySearch', name: 'Binary Search' },
  ],
};

// eslint-disable-next-line no-unused-vars
const ComparisonView = ({ category = 'sorting', algorithms }) => {
  const [algo1, setAlgo1] = useState('');
  const [algo2, setAlgo2] = useState('');
  const [inputArray, setInputArray] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [isRunning, setIsRunning] = useState(false);

  const engine1 = useMemo(() => new PlaybackEngine(), []);
  const engine2 = useMemo(() => new PlaybackEngine(), []);

  // eslint-disable-next-line no-unused-vars
  const store1 = useVisualizationStore();
  // eslint-disable-next-line no-unused-vars
  const store2 = useVisualizationStore();

  const availableAlgos = COMPARISON_ALGORITHMS[category] || COMPARISON_ALGORITHMS.sorting;

  // Generate random array
  const generateArray = () => {
    const arr = Array.from({ length: 15 }, () => Math.floor(Math.random() * 100) + 1);
    setInputArray(arr);
    engine1.stop();
    engine2.stop();
  };

  // Run both algorithms
  const handleCompare = async () => {
    if (!algo1 || !algo2 || !inputArray.length) return;

    // Dynamically import algorithms
    const { mergeSort, bubbleSort, quickSort, insertionSort, selectionSort, heapSort } = await import('../../engine/algorithms/sorting');
    const { linearSearch, binarySearch } = await import('../../engine/algorithms/searching');

    const algoMap = { mergeSort, bubbleSort, quickSort, insertionSort, selectionSort, heapSort, linearSearch, binarySearch };
    const fn1 = algoMap[algo1];
    const fn2 = algoMap[algo2];

    if (!fn1 || !fn2) return;

    const arr1 = category === 'searching' ? [...inputArray].sort((a, b) => a - b) : inputArray;
    const arr2 = category === 'searching' ? [...inputArray].sort((a, b) => a - b) : inputArray;
    const target = category === 'searching' ? arr1[Math.floor(arr1.length / 2)] : undefined;

    const result1 = category === 'searching' ? fn1(arr1, target) : fn1(arr1);
    const result2 = category === 'searching' ? fn2(arr2, target) : fn2(arr2);

    // Load steps into stores
    useVisualizationStore.getState().loadSteps(result1.steps, result1.metadata);
    engine1.init(result1.steps, { baseDuration: 0.2 });
    engine1.play();

    // Delay second algorithm slightly
    setTimeout(() => {
      engine2.init(result2.steps, { baseDuration: 0.2 });
      engine2.play();
    }, 100);
  };

  return (
    <div className="comparison-view">
      <div className="comparison-header">
        <GitCompare size={20} />
        <h3>Compare Algorithms</h3>
      </div>

      <div className="comparison-controls">
        <div className="comparison-selector">
          <label>Algorithm 1:</label>
          <select value={algo1} onChange={(e) => setAlgo1(e.target.value)} className="comparison-select">
            <option value="">Select...</option>
            {availableAlgos.map(a => (
              <option key={a.key} value={a.key}>{a.name}</option>
            ))}
          </select>
        </div>

        <span className="comparison-vs">vs</span>

        <div className="comparison-selector">
          <label>Algorithm 2:</label>
          <select value={algo2} onChange={(e) => setAlgo2(e.target.value)} className="comparison-select">
            <option value="">Select...</option>
            {availableAlgos.map(a => (
              <option key={a.key} value={a.key}>{a.name}</option>
            ))}
          </select>
        </div>

        <button onClick={generateArray} className="comparison-btn">Generate Array</button>
        <button onClick={handleCompare} className="comparison-btn primary" disabled={!algo1 || !algo2 || !inputArray.length}>
          Compare
        </button>
      </div>

      <div className="comparison-panels">
        <div className="comparison-panel">
          <h4>{availableAlgos.find(a => a.key === algo1)?.name || 'Select Algorithm 1'}</h4>
          <div className="comparison-viz">
            <ArrayRenderer data={inputArray} style="bars" showValues={true} />
          </div>
          <StatsPanel />
        </div>

        <div className="comparison-panel">
          <h4>{availableAlgos.find(a => a.key === algo2)?.name || 'Select Algorithm 2'}</h4>
          <div className="comparison-viz">
            <ArrayRenderer data={inputArray} style="bars" showValues={true} />
          </div>
          <StatsPanel />
        </div>
      </div>
    </div>
  );
};

export default ComparisonView;
