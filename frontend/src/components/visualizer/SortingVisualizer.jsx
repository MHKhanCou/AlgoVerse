import React, { useState, useEffect, useRef } from 'react';
import './SortingVisualizer.css';

const SortingVisualizer = ({ algorithm, step, inputData, onPerformanceUpdate, onComplexityUpdate }) => {
  const [array, setArray] = useState([]);
  const [sorting, setSorting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [compareIdx, setCompareIdx] = useState(-1);
  const [sortedIndices, setSortedIndices] = useState([]);
  const [speed, setSpeed] = useState(50); // Animation speed (ms)
  const [operations, setOperations] = useState(0);
  const [comparisons, setComparisons] = useState(0);
  const [swaps, setSwaps] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [size, setSize] = useState(30); // Array size
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('bubbleSort');
  const [showValues, setShowValues] = useState(true);
  const [customInput, setCustomInput] = useState('');
  const [inputMode, setInputMode] = useState('random'); // 'random', 'custom', 'sorted', 'reverse'
  const [visualizationStyle, setVisualizationStyle] = useState('bars'); // 'bars', 'dots', 'lines'
  const animationTimeoutsRef = useRef([]);
  
  // Generate array based on input mode
  const generateArray = () => {
    clearTimeouts();
    setSorting(false);
    setCompleted(false);
    setCurrentIdx(-1);
    setCompareIdx(-1);
    setSortedIndices([]);
    
    let newArray = [];
    
    switch (inputMode) {
      case 'custom':
        if (customInput.trim()) {
          newArray = customInput.split(',').map(val => {
            const num = parseInt(val.trim());
            return isNaN(num) ? Math.floor(Math.random() * 100) + 5 : Math.max(5, Math.min(100, num));
          });
          setSize(newArray.length);
        } else {
          newArray = generateRandomArray();
        }
        break;
      case 'sorted':
        newArray = generateRandomArray().sort((a, b) => a - b);
        break;
      case 'reverse':
        newArray = generateRandomArray().sort((a, b) => b - a);
        break;
      default: // 'random'
        newArray = generateRandomArray();
    }
    
    setArray(newArray);
  };
  
  const generateRandomArray = () => {
    const newArray = [];
    for (let i = 0; i < size; i++) {
      newArray.push(Math.floor(Math.random() * 100) + 5);
    }
    return newArray;
  };
  
  // Clear all animation timeouts
  const clearTimeouts = () => {
    animationTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    animationTimeoutsRef.current = [];
  };
  
  // Initialize with a random array
  useEffect(() => {
    generateArray();
    return () => clearTimeouts();
  }, [size]);

  // Update performance metrics
  useEffect(() => {
    if (onPerformanceUpdate) {
      onPerformanceUpdate({
        operations,
        comparisons,
        swaps,
        timeTaken: startTime ? (Date.now() - startTime) : 0
      });
    }
  }, [operations, comparisons, swaps, startTime]);

  // Update complexity metrics
  useEffect(() => {
    if (onComplexityUpdate) {
      onComplexityUpdate({
        time: algorithm.complexity?.time || 'O(n^2)',
        space: algorithm.complexity?.space || 'O(1)'
      });
    }
  }, [algorithm.complexity]);
  
  // Handle comparison operation
  const compare = (array, i, j) => {
    setCompareIdx(j);
    setCurrentIdx(i);
    setComparisons(prev => prev + 1);
    setOperations(prev => prev + 1);
  };

  // Handle swap operation
  const swap = (array, i, j) => {
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
    setArray([...array]);
    setSwaps(prev => prev + 1);
    setOperations(prev => prev + 1);
  };

  // Reset the visualization
  const resetArray = () => {
    clearTimeouts();
    setSorting(false);
    setCompleted(false);
    setCurrentIdx(-1);
    setCompareIdx(-1);
    setOperations(0);
    setComparisons(0);
    setSwaps(0);
    setStartTime(null);
    setSortedIndices([]);
  };
  
  // Start sorting animation
  const startSort = () => {
    if (sorting) return;
    
    resetArray();
    setSorting(true);
    
    // Choose the sorting algorithm based on selection
    const animations = [];
    switch (selectedAlgorithm) {
      case 'bubbleSort':
        bubbleSort([...array], animations);
        break;
      case 'selectionSort':
        selectionSort([...array], animations);
        break;
      case 'insertionSort':
        insertionSort([...array], animations);
        break;
      case 'quickSort':
        quickSort([...array], animations, 0, array.length - 1);
        break;
      case 'mergeSort':
        mergeSort([...array], animations, 0, array.length - 1);
        break;
      case 'heapSort':
        heapSort([...array], animations);
        break;
      default:
        bubbleSort([...array], animations);
    }
    
    // Play the animations
    playAnimations(animations);
  };
  
  // Bubble Sort implementation
  const bubbleSort = (arr, animations) => {
    const n = arr.length;
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        // Compare adjacent elements
        animations.push({ type: 'compare', indices: [j, j + 1] });
        
        if (arr[j] > arr[j + 1]) {
          // Swap elements
          animations.push({ type: 'swap', indices: [j, j + 1] });
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        }
      }
      // Mark as sorted
      animations.push({ type: 'sorted', index: n - i - 1 });
    }
    
    return arr;
  };
  
  // Selection Sort implementation
  const selectionSort = (arr, animations) => {
    const n = arr.length;
    
    for (let i = 0; i < n; i++) {
      let minIdx = i;
      animations.push({ type: 'current', index: i });
      
      for (let j = i + 1; j < n; j++) {
        // Compare elements
        animations.push({ type: 'compare', indices: [minIdx, j] });
        
        if (arr[j] < arr[minIdx]) {
          minIdx = j;
        }
      }
      
      if (minIdx !== i) {
        // Swap elements
        animations.push({ type: 'swap', indices: [i, minIdx] });
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      }
      
      // Mark as sorted
      animations.push({ type: 'sorted', index: i });
    }
    
    return arr;
  };

  // Insertion Sort implementation
  const insertionSort = (arr, animations) => {
    for (let i = 1; i < arr.length; i++) {
      let key = arr[i];
      let j = i - 1;
      
      animations.push({ type: 'current', index: i });
      
      while (j >= 0 && arr[j] > key) {
        animations.push({ type: 'compare', indices: [j, j + 1] });
        animations.push({ type: 'swap', indices: [j, j + 1] });
        
        arr[j + 1] = arr[j];
        j--;
      }
      
      arr[j + 1] = key;
      animations.push({ type: 'sorted', index: i });
    }
    
    return arr;
  };

  // Quick Sort implementation
  const quickSort = (arr, animations, low, high) => {
    if (low < high) {
      let pi = partition(arr, animations, low, high);
      quickSort(arr, animations, low, pi - 1);
      quickSort(arr, animations, pi + 1, high);
    }
    return arr;
  };

  const partition = (arr, animations, low, high) => {
    let pivot = arr[high];
    let i = low - 1;
    
    animations.push({ type: 'pivot', index: high });
    
    for (let j = low; j < high; j++) {
      animations.push({ type: 'compare', indices: [j, high] });
      
      if (arr[j] < pivot) {
        i++;
        if (i !== j) {
          animations.push({ type: 'swap', indices: [i, j] });
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
      }
    }
    
    animations.push({ type: 'swap', indices: [i + 1, high] });
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    
    return i + 1;
  };

  // Merge Sort implementation
  const mergeSort = (arr, animations, left, right) => {
    if (left < right) {
      const mid = Math.floor((left + right) / 2);
      
      mergeSort(arr, animations, left, mid);
      mergeSort(arr, animations, mid + 1, right);
      merge(arr, animations, left, mid, right);
    }
    return arr;
  };

  const merge = (arr, animations, left, mid, right) => {
    const leftArr = arr.slice(left, mid + 1);
    const rightArr = arr.slice(mid + 1, right + 1);
    
    let i = 0, j = 0, k = left;
    
    while (i < leftArr.length && j < rightArr.length) {
      animations.push({ type: 'compare', indices: [left + i, mid + 1 + j] });
      
      if (leftArr[i] <= rightArr[j]) {
        animations.push({ type: 'update', index: k, value: leftArr[i] });
        arr[k] = leftArr[i];
        i++;
      } else {
        animations.push({ type: 'update', index: k, value: rightArr[j] });
        arr[k] = rightArr[j];
        j++;
      }
      k++;
    }
    
    while (i < leftArr.length) {
      animations.push({ type: 'update', index: k, value: leftArr[i] });
      arr[k] = leftArr[i];
      i++;
      k++;
    }
    
    while (j < rightArr.length) {
      animations.push({ type: 'update', index: k, value: rightArr[j] });
      arr[k] = rightArr[j];
      j++;
      k++;
    }
  };

  // Heap Sort implementation
  const heapSort = (arr, animations) => {
    const n = arr.length;
    
    // Build max heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      heapify(arr, animations, n, i);
    }
    
    // Extract elements from heap one by one
    for (let i = n - 1; i > 0; i--) {
      animations.push({ type: 'swap', indices: [0, i] });
      [arr[0], arr[i]] = [arr[i], arr[0]];
      
      animations.push({ type: 'sorted', index: i });
      heapify(arr, animations, i, 0);
    }
    
    animations.push({ type: 'sorted', index: 0 });
    return arr;
  };

  const heapify = (arr, animations, n, i) => {
    let largest = i;
    let left = 2 * i + 1;
    let right = 2 * i + 2;
    
    if (left < n) {
      animations.push({ type: 'compare', indices: [left, largest] });
      if (arr[left] > arr[largest]) {
        largest = left;
      }
    }
    
    if (right < n) {
      animations.push({ type: 'compare', indices: [right, largest] });
      if (arr[right] > arr[largest]) {
        largest = right;
      }
    }
    
    if (largest !== i) {
      animations.push({ type: 'swap', indices: [i, largest] });
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      heapify(arr, animations, n, largest);
    }
  };
  
  // Play the sorting animations
  const playAnimations = (animations) => {
    animations.forEach((animation, index) => {
      const timeout = setTimeout(() => {
        const { type, indices, index: sortedIndex, value } = animation;
        
        if (type === 'compare') {
          setCurrentIdx(indices[0]);
          setCompareIdx(indices[1]);
        } else if (type === 'swap') {
          setArray(prevArray => {
            const newArray = [...prevArray];
            [newArray[indices[0]], newArray[indices[1]]] = 
              [newArray[indices[1]], newArray[indices[0]]];
            return newArray;
          });
        } else if (type === 'update') {
          setArray(prevArray => {
            const newArray = [...prevArray];
            newArray[sortedIndex] = value;
            return newArray;
          });
        } else if (type === 'current') {
          setCurrentIdx(sortedIndex);
        } else if (type === 'pivot') {
          setCompareIdx(sortedIndex);
        } else if (type === 'sorted') {
          setSortedIndices(prev => [...prev, sortedIndex]);
        }
        
        // Check if this is the last animation
        if (index === animations.length - 1) {
          setTimeout(() => {
            setCurrentIdx(-1);
            setCompareIdx(-1);
            setSorting(false);
            setCompleted(true);
          }, speed);
        }
      }, index * speed);
      
      animationTimeoutsRef.current.push(timeout);
    });
  };
  
  // Calculate the height percentage for each bar
  const getBarHeight = (value) => {
    const maxValue = Math.max(...array);
    return (value / maxValue) * 100;
  };

  // Get algorithm display name
  const getAlgorithmName = () => {
    const names = {
      bubbleSort: 'Bubble Sort',
      selectionSort: 'Selection Sort', 
      insertionSort: 'Insertion Sort',
      quickSort: 'Quick Sort',
      mergeSort: 'Merge Sort',
      heapSort: 'Heap Sort'
    };
    return names[selectedAlgorithm] || 'Unknown Algorithm';
  };

  // Get time complexity
  const getTimeComplexity = () => {
    const complexities = {
      bubbleSort: 'O(n²)',
      selectionSort: 'O(n²)',
      insertionSort: 'O(n²)',
      quickSort: 'O(n log n) average, O(n²) worst',
      mergeSort: 'O(n log n)',
      heapSort: 'O(n log n)'
    };
    return complexities[selectedAlgorithm] || 'Unknown';
  };

  // Get space complexity
  const getSpaceComplexity = () => {
    const complexities = {
      bubbleSort: 'O(1)',
      selectionSort: 'O(1)',
      insertionSort: 'O(1)',
      quickSort: 'O(log n)',
      mergeSort: 'O(n)',
      heapSort: 'O(1)'
    };
    return complexities[selectedAlgorithm] || 'Unknown';
  };

  // Get algorithm description
  const getAlgorithmDescription = () => {
    const descriptions = {
      bubbleSort: 'Bubble Sort repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order.',
      selectionSort: 'Selection Sort finds the minimum element from the unsorted part and puts it at the beginning.',
      insertionSort: 'Insertion Sort builds the final sorted array one item at a time by inserting each element into its correct position.',
      quickSort: 'Quick Sort divides the array into partitions around a pivot element, then recursively sorts the partitions.',
      mergeSort: 'Merge Sort divides the array into halves, sorts them separately, then merges them back together.',
      heapSort: 'Heap Sort uses a binary heap data structure to sort elements by repeatedly extracting the maximum element.'
    };
    return descriptions[selectedAlgorithm] || 'No description available.';
  };
  
  return (
    <div className="sorting-visualizer">
      <div className="visualizer-controls">
        <div className="control-row">
          <div className="control-group">
            <label htmlFor="inputMode">Input Mode:</label>
            <select 
              id="inputMode"
              value={inputMode} 
              onChange={(e) => setInputMode(e.target.value)}
              disabled={sorting}
            >
              <option value="random">Random</option>
              <option value="custom">Custom</option>
              <option value="sorted">Already Sorted</option>
              <option value="reverse">Reverse Sorted</option>
            </select>
          </div>
          
          {inputMode === 'custom' && (
            <div className="control-group">
              <label htmlFor="customInput">Custom Array:</label>
              <input
                id="customInput"
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Enter numbers separated by commas (e.g., 64,34,25,12,22,11,90)"
                disabled={sorting}
                style={{ minWidth: '300px' }}
              />
            </div>
          )}
          
          <button onClick={generateArray} disabled={sorting} className="generate-btn">
            Generate Array
          </button>
        </div>
        
        <div className="control-row">
          <div className="control-group">
            <label htmlFor="algorithm">Algorithm:</label>
            <select 
              id="algorithm"
              value={selectedAlgorithm} 
              onChange={(e) => setSelectedAlgorithm(e.target.value)}
              disabled={sorting}
            >
              <option value="bubbleSort">Bubble Sort</option>
              <option value="selectionSort">Selection Sort</option>
              <option value="insertionSort">Insertion Sort</option>
              <option value="quickSort">Quick Sort</option>
              <option value="mergeSort">Merge Sort</option>
              <option value="heapSort">Heap Sort</option>
            </select>
          </div>
          
          <div className="control-group">
            <label htmlFor="visualizationStyle">Style:</label>
            <select 
              id="visualizationStyle"
              value={visualizationStyle} 
              onChange={(e) => setVisualizationStyle(e.target.value)}
              disabled={sorting}
            >
              <option value="bars">Bars</option>
              <option value="dots">Dots</option>
              <option value="lines">Lines</option>
            </select>
          </div>
          
          <button onClick={startSort} disabled={sorting} className="sort-btn">
            {sorting ? 'Sorting...' : 'Start Sorting'}
          </button>
          
          {sorting && (
            <button onClick={() => setSorting(false)} className="stop-btn">
              Stop
            </button>
          )}
        </div>
        
        <div className="control-row">
          <div className="control-group">
            <label htmlFor="speed">Speed: {201 - speed}ms</label>
            <input 
              id="speed"
              type="range" 
              min="5" 
              max="200" 
              value={201 - speed} 
              onChange={(e) => setSpeed(201 - parseInt(e.target.value))}
              disabled={sorting}
            />
          </div>
          
          {inputMode !== 'custom' && (
            <div className="control-group">
              <label htmlFor="size">Size: {size}</label>
              <input 
                id="size"
                type="range" 
                min="5" 
                max="100" 
                value={size} 
                onChange={(e) => setSize(parseInt(e.target.value))}
                disabled={sorting}
              />
            </div>
          )}
          
          <div className="control-group">
            <label htmlFor="showValues">
              <input 
                id="showValues"
                type="checkbox" 
                checked={showValues} 
                onChange={() => setShowValues(!showValues)}
              />
              Show Values
            </label>
          </div>
        </div>
      </div>
      
      <div className={`array-container ${visualizationStyle}`}>
        {array.map((value, idx) => {
          const isActive = idx === currentIdx;
          const isComparing = idx === compareIdx;
          const isSorted = sortedIndices.includes(idx);
          const height = getBarHeight(value);
          
          if (visualizationStyle === 'bars') {
            return (
              <div 
                className={`array-bar ${isActive ? 'current' : ''} ${isComparing ? 'compare' : ''} ${isSorted ? 'sorted' : ''}`}
                key={idx}
                style={{ height: `${height}%` }}
              >
                {showValues && <span className="bar-value">{value}</span>}
              </div>
            );
          } else if (visualizationStyle === 'dots') {
            return (
              <div 
                className={`array-dot-container ${isActive ? 'current' : ''} ${isComparing ? 'compare' : ''} ${isSorted ? 'sorted' : ''}`}
                key={idx}
                style={{ height: '100%' }}
              >
                <div 
                  className="array-dot"
                  style={{ 
                    bottom: `${height}%`,
                    backgroundColor: isSorted ? '#4CAF50' : isActive ? '#FF5722' : isComparing ? '#FFC107' : '#2196F3'
                  }}
                />
                {showValues && <span className="dot-value" style={{ bottom: `${height + 2}%` }}>{value}</span>}
              </div>
            );
          } else if (visualizationStyle === 'lines') {
            return (
              <div 
                className={`array-line-container ${isActive ? 'current' : ''} ${isComparing ? 'compare' : ''} ${isSorted ? 'sorted' : ''}`}
                key={idx}
                style={{ height: '100%' }}
              >
                <div 
                  className="array-line"
                  style={{ 
                    height: `${height}%`,
                    backgroundColor: isSorted ? '#4CAF50' : isActive ? '#FF5722' : isComparing ? '#FFC107' : '#2196F3'
                  }}
                />
                {showValues && <span className="line-value">{value}</span>}
              </div>
            );
          }
        })}
      </div>
      
      {completed && (
        <div className="completion-message">
          Sorting completed! 🎉
        </div>
      )}
      
      <div className="algorithm-info">
        <h4>{getAlgorithmName()}</h4>
        <p>
          <strong>Time Complexity:</strong> {getTimeComplexity()}
        </p>
        <p>
          <strong>Space Complexity:</strong> {getSpaceComplexity()}
        </p>
        <p>{getAlgorithmDescription()}</p>
      </div>
    </div>
  );
};

export default SortingVisualizer;