import React, { useState, useEffect, useRef } from 'react';
import './SortingVisualizer.css';

const SortingVisualizer = ({ algorithm }) => {
  const [array, setArray] = useState([]);
  const [sorting, setSorting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [compareIdx, setCompareIdx] = useState(-1);
  const [sortedIndices, setSortedIndices] = useState([]);
  const [speed, setSpeed] = useState(50); // Animation speed (ms)
  const [size, setSize] = useState(30); // Array size
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('bubbleSort');
  const [showValues, setShowValues] = useState(true);
  const animationTimeoutsRef = useRef([]);
  
  // Generate a new random array
  const generateArray = () => {
    clearTimeouts();
    setSorting(false);
    setCompleted(false);
    setCurrentIdx(-1);
    setCompareIdx(-1);
    setSortedIndices([]);
    
    const newArray = [];
    for (let i = 0; i < size; i++) {
      newArray.push(Math.floor(Math.random() * 100) + 5); // Values between 5-104
    }
    setArray(newArray);
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
  
  // Reset the visualization
  const resetArray = () => {
    clearTimeouts();
    setSorting(false);
    setCompleted(false);
    setCurrentIdx(-1);
    setCompareIdx(-1);
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
      // Add more sorting algorithms here
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
  
  // Play the sorting animations
  const playAnimations = (animations) => {
    animations.forEach((animation, index) => {
      const timeout = setTimeout(() => {
        const { type, indices, index: sortedIndex } = animation;
        
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
  
  return (
    <div className="sorting-visualizer">
      <div className="visualizer-controls">
        <button onClick={generateArray} disabled={sorting}>
          Generate New Array
        </button>
        
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
            {/* Add more sorting algorithms here */}
          </select>
        </div>
        
        <button onClick={startSort} disabled={sorting}>
          {sorting ? 'Sorting...' : 'Start Sorting'}
        </button>
        
        <div className="control-group">
          <label htmlFor="speed">Speed:</label>
          <input 
            id="speed"
            type="range" 
            min="5" 
            max="200" 
            value={speed} 
            onChange={(e) => setSpeed(200 - parseInt(e.target.value) + 5)}
            disabled={sorting}
          />
        </div>
        
        <div className="control-group">
          <label htmlFor="size">Size:</label>
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
      
      <div className="array-container">
        {array.map((value, idx) => (
          <div 
            className={`array-bar ${idx === currentIdx ? 'current' : ''} ${idx === compareIdx ? 'compare' : ''} ${sortedIndices.includes(idx) ? 'sorted' : ''}`}
            key={idx}
            style={{ height: `${getBarHeight(value)}%` }}
          >
            {showValues && <span className="bar-value">{value}</span>}
          </div>
        ))}
      </div>
      
      {completed && (
        <div className="completion-message">
          Sorting completed! 🎉
        </div>
      )}
      
      <div className="algorithm-info">
        <h4>{selectedAlgorithm === 'bubbleSort' ? 'Bubble Sort' : 'Selection Sort'}</h4>
        <p>
          <strong>Time Complexity:</strong> {selectedAlgorithm === 'bubbleSort' ? 'O(n²)' : 'O(n²)'}
        </p>
        <p>
          <strong>Space Complexity:</strong> {selectedAlgorithm === 'bubbleSort' ? 'O(1)' : 'O(1)'}
        </p>
        <p>
          {selectedAlgorithm === 'bubbleSort' 
            ? 'Bubble Sort repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order.'
            : 'Selection Sort finds the minimum element from the unsorted part and puts it at the beginning.'}
        </p>
      </div>
    </div>
  );
};

export default SortingVisualizer;