import { useState, useEffect } from 'react';

export const useAlgorithmPerformance = (complexity) => {
  const [metrics, setMetrics] = useState({
    operations: 0,
    comparisons: 0,
    swaps: 0,
    timeTaken: 0,
    memoryUsage: 0
  });

  const startTracking = () => {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    return {
      stop: () => {
        const endTime = performance.now();
        const endMemory = process.memoryUsage().heapUsed;
        
        setMetrics(prev => ({
          ...prev,
          timeTaken: endTime - startTime,
          memoryUsage: endMemory - startMemory
        }));
      },
      incrementOperation: () => {
        setMetrics(prev => ({
          ...prev,
          operations: prev.operations + 1
        }));
      },
      incrementComparison: () => {
        setMetrics(prev => ({
          ...prev,
          comparisons: prev.comparisons + 1
        }));
      },
      incrementSwap: () => {
        setMetrics(prev => ({
          ...prev,
          swaps: prev.swaps + 1
        }));
      }
    };
  };

  useEffect(() => {
    if (complexity) {
      // Analyze complexity and set initial estimates
      const analyzeComplexity = () => {
        const timeComplexity = complexity.time || 'O(1)';
        const spaceComplexity = complexity.space || 'O(1)';
        
        // Set initial estimates based on complexity
        setMetrics(prev => ({
          ...prev,
          estimatedTime: timeComplexity,
          estimatedSpace: spaceComplexity
        }));
      };

      analyzeComplexity();
    }
  }, [complexity]);

  return {
    metrics,
    startTracking
  };
};
