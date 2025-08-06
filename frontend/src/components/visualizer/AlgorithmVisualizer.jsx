import React, { useState, useEffect } from 'react';
import SortingVisualizer from './SortingVisualizer';
import GraphVisualizer from './GraphVisualizer';
import RecursionVisualizer from './RecursionVisualizer';
import DPVisualizer from './DPVisualizer';
import './AlgorithmVisualizer.css';

const AlgorithmVisualizer = ({ algorithm }) => {
  const [loading, setLoading] = useState(true);
  const [visualizerType, setVisualizerType] = useState(null);
  
  useEffect(() => {
    if (!algorithm) {
      setLoading(false);
      return;
    }
    
    // Determine the visualizer type based on algorithm properties
    const determineVisualizerType = () => {
      const name = algorithm.name?.toLowerCase() || '';
      const type = algorithm.type_name?.toLowerCase() || '';
      const description = algorithm.description?.toLowerCase() || '';
      
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
      
      // Check for graph algorithms
      if (
        name.includes('graph') ||
        type.includes('graph') ||
        description.includes('graph') ||
        ['bfs', 'dfs', 'breadth first', 'depth first', 'dijkstra', 'shortest path', 'minimum spanning'].some(term => 
          name.includes(term) || description.includes(term))
      ) {
        return 'graph';
      }
      
      // Check for recursion algorithms
      if (
        name.includes('recursion') ||
        name.includes('recursive') ||
        type.includes('recursion') ||
        description.includes('recursion') ||
        description.includes('recursive') ||
        ['fibonacci', 'factorial', 'tower of hanoi'].some(term => 
          name.includes(term) || description.includes(term))
      ) {
        return 'recursion';
      }
      
      // Check for dynamic programming algorithms
      if (
        name.includes('dynamic') ||
        name.includes('dp') ||
        type.includes('dynamic programming') ||
        description.includes('dynamic programming') ||
        description.includes('memoization') ||
        ['knapsack', 'longest common subsequence', 'lcs', 'fibonacci dp'].some(term => 
          name.includes(term) || description.includes(term))
      ) {
        return 'dp';
      }
      
      // Default to sorting if we can't determine the type
      return 'sorting';
    };
    
    setVisualizerType(determineVisualizerType());
    setLoading(false);
  }, [algorithm]);
  
  if (loading) {
    return (
      <div className="algorithm-visualizer">
        <div className="visualizer-loading">Loading visualizer...</div>
      </div>
    );
  }
  
  if (!algorithm) {
    return (
      <div className="algorithm-visualizer">
        <div className="visualizer-placeholder">
          <p>No algorithm data available</p>
          <small>Please select an algorithm to visualize</small>
        </div>
      </div>
    );
  }
  
  // Render the appropriate visualizer based on the determined type
  const renderVisualizer = () => {
    switch (visualizerType) {
      case 'sorting':
        return <SortingVisualizer algorithm={algorithm} />;
      case 'graph':
        return <GraphVisualizer algorithm={algorithm} />;
      case 'recursion':
        return <RecursionVisualizer algorithm={algorithm} />;
      case 'dp':
        return <DPVisualizer algorithm={algorithm} />;
      default:
        return (
          <div className="visualizer-placeholder">
            <p>Visualizer not available for this algorithm type</p>
            <small>We're working on adding more visualizers!</small>
          </div>
        );
    }
  };
  
  return (
    <div className="algorithm-visualizer">
      {renderVisualizer()}
    </div>
  );
};

export default AlgorithmVisualizer;