import React, { useState, useEffect, useRef } from 'react';
import SortingVisualizer from './SortingVisualizer';
import SearchVisualizer from './SearchVisualizer';
import GraphVisualizer from './GraphVisualizer';
import RecursionVisualizer from './RecursionVisualizer';
import DPVisualizer from './DPVisualizer';

import './AlgorithmVisualizer.css';

const AlgorithmVisualizer = ({ algorithm }) => {
  const [loading, setLoading] = useState(true);
  const [visualizerType, setVisualizerType] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [speed, setSpeed] = useState(100); // milliseconds per step
  const [inputData, setInputData] = useState(null);
  const [complexity, setComplexity] = useState({
    time: 'O(1)',
    space: 'O(1)',
    currentTime: 0,
    currentSpace: 0
  });
  const [performanceMetrics, setPerformanceMetrics] = useState({
    operations: 0,
    comparisons: 0,
    swaps: 0,
    timeTaken: 0
  });
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!algorithm) {
      setLoading(false);
      return;
    }

    const determineVisualizerType = () => {
      const name = algorithm.name?.toLowerCase() || '';
      const type = algorithm.type_name?.toLowerCase() || '';
      const description = algorithm.description?.toLowerCase() || '';

      // Check for graph algorithms first (BFS, DFS should be graph algorithms)
      if (
        name.includes('graph') ||
        type.includes('graph') ||
        description.includes('graph') ||
        ['bfs', 'dfs', 'dijkstra', 'prim', 'kruskal', 'breadth-first', 'depth-first', 'breadth first', 'depth first'].some(term => 
          name.includes(term) || description.includes(term))
      ) {
        return 'graph';
      }

      // Check for array/list search algorithms (not graph traversal)
      if (
        (name.includes('search') || type.includes('search') || description.includes('search')) &&
        !name.includes('bfs') && !name.includes('dfs') && 
        !name.includes('breadth') && !name.includes('depth') &&
        ['linear search', 'binary search', 'jump search', 'exponential search'].some(term => 
          name.includes(term) || description.includes(term))
      ) {
        return 'search';
      }

      // Check for sorting algorithms
      if (
        name.includes('sort') ||
        type.includes('sort') ||
        description.includes('sort') ||
        ['bubble', 'merge', 'quick', 'insertion', 'selection', 'heap'].some(term => 
          name.includes(term) || description.includes(`${term} sort`))
      ) {
        return 'sorting';
      }

      // Check for recursion algorithms
      if (
        name.includes('recursion') ||
        type.includes('recursion') ||
        description.includes('recursion') ||
        ['fibonacci', 'factorial', 'tower of hanoi'].some(term => 
          name.includes(term) || description.includes(term))
      ) {
        return 'recursion';
      }

      // Check for dynamic programming algorithms
      if (
        name.includes('dp') ||
        type.includes('dp') ||
        description.includes('dynamic programming') ||
        ['knapsack', 'coin change'].some(term => 
          name.includes(term) || description.includes(term))
      ) {
        return 'dp';
      }

      // Default to sorting if no specific type is found
      return 'sorting';
    };

    const type = determineVisualizerType();
    setVisualizerType(type);
    setLoading(false);

    // Performance tracking will be handled by individual visualizers
  }, [algorithm]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (isPlaying) {
      clearInterval(intervalRef.current);
    } else if (visualizerType && currentStep < 100) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= 99) {
            clearInterval(intervalRef.current);
            return 99;
          }
          return prev + 1;
        });
      }, speed);
    }
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      handlePlayPause();
    }
  };

  const handleInputData = (data) => {
    setInputData(data);
    setCurrentStep(0);
    setPerformanceMetrics({
      operations: 0,
      comparisons: 0,
      swaps: 0,
      timeTaken: 0
    });
  };

  return (
    <div className="algorithm-visualizer-container">
      {loading ? (
        <div className="loading">Loading visualization...</div>
      ) : visualizerType ? (
        <div className="visualizer-wrapper">


          <div className="visualizer-content">
            {visualizerType === 'sorting' && (
              <SortingVisualizer 
                algorithm={algorithm} 
                step={currentStep}
                inputData={inputData}
                onPerformanceUpdate={setPerformanceMetrics}
                onComplexityUpdate={setComplexity}
              />
            )}
            {visualizerType === 'search' && (
              <SearchVisualizer 
                algorithm={algorithm} 
                step={currentStep}
                inputData={inputData}
                onPerformanceUpdate={setPerformanceMetrics}
                onComplexityUpdate={setComplexity}
              />
            )}
            {visualizerType === 'graph' && (
              <GraphVisualizer 
                algorithm={algorithm} 
                step={currentStep}
                inputData={inputData}
                onPerformanceUpdate={setPerformanceMetrics}
                onComplexityUpdate={setComplexity}
              />
            )}
            {visualizerType === 'recursion' && (
              <RecursionVisualizer 
                algorithm={algorithm} 
                step={currentStep}
                inputData={inputData}
                onPerformanceUpdate={setPerformanceMetrics}
                onComplexityUpdate={setComplexity}
              />
            )}
            {visualizerType === 'dp' && (
              <DPVisualizer 
                algorithm={algorithm} 
                step={currentStep}
                inputData={inputData}
                onPerformanceUpdate={setPerformanceMetrics}
                onComplexityUpdate={setComplexity}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="no-visualizer">
          No visualization available for this algorithm
        </div>
      )}
    </div>
  );
};

export default AlgorithmVisualizer;