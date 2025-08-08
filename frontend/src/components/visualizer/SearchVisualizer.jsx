import React, { useState, useEffect, useRef } from 'react';
import './SearchVisualizer.css';

const SearchVisualizer = ({ algorithm, step, inputData, onPerformanceUpdate, onComplexityUpdate }) => {
  const [array, setArray] = useState([]);
  const [searching, setSearching] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [compareIdx, setCompareIdx] = useState(-1);
  const [foundIdx, setFoundIdx] = useState(-1);
  const [left, setLeft] = useState(-1);
  const [right, setRight] = useState(-1);
  const [mid, setMid] = useState(-1);
  const [target, setTarget] = useState(null);
  const [speed, setSpeed] = useState(500);
  const [operations, setOperations] = useState(0);
  const [comparisons, setComparisons] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [size, setSize] = useState(20);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('linearSearch');
  const [customTarget, setCustomTarget] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [maxSteps, setMaxSteps] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [inputMode, setInputMode] = useState('random'); // 'random', 'custom', 'sorted'
  const [visualizationStyle, setVisualizationStyle] = useState('bars'); // 'bars', 'dots', 'lines'
  const [showValues, setShowValues] = useState(true);
  const animationTimeoutsRef = useRef([]);

  // Generate array based on input mode
  const generateArray = () => {
    clearTimeouts();
    resetSearch();
    
    let newArray = [];
    
    switch (inputMode) {
      case 'custom':
        if (customInput.trim()) {
          newArray = customInput.split(',').map(val => {
            const num = parseInt(val.trim());
            return isNaN(num) ? Math.floor(Math.random() * 100) + 1 : Math.max(1, Math.min(100, num));
          });
          setSize(newArray.length);
        } else {
          newArray = generateRandomArray();
        }
        break;
      case 'sorted':
        newArray = generateRandomArray().sort((a, b) => a - b);
        break;
      default: // 'random'
        newArray = generateRandomArray();
    }
    
    // Sort array for binary search and other algorithms that require sorted input
    if (['binarySearch', 'exponentialSearch', 'jumpSearch'].includes(selectedAlgorithm)) {
      newArray.sort((a, b) => a - b);
    }
    
    setArray(newArray);
    
    // Set target based on custom input or random
    if (customTarget.trim()) {
      const targetNum = parseInt(customTarget.trim());
      setTarget(isNaN(targetNum) ? newArray[0] : targetNum);
    } else {
      const randomTarget = newArray[Math.floor(Math.random() * newArray.length)];
      setTarget(randomTarget);
    }
  };
  
  const generateRandomArray = () => {
    const newArray = [];
    for (let i = 0; i < size; i++) {
      newArray.push(Math.floor(Math.random() * 100) + 1);
    }
    return newArray;
  };

  const clearTimeouts = () => {
    animationTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    animationTimeoutsRef.current = [];
  };

  const resetArray = () => {
    clearTimeouts();
    setSearching(false);
    setCompleted(false);
    setCurrentIdx(-1);
    setCompareIdx(-1);
    setFoundIdx(-1);
    setLeft(-1);
    setRight(-1);
    setMid(-1);
    setCurrentStep(0);
    setOperations(0);
    setComparisons(0);
    setStartTime(null);
  };

  useEffect(() => {
    generateArray();
    return () => clearTimeouts();
  }, [size, selectedAlgorithm]);

  useEffect(() => {
    if (customTarget) {
      setTarget(parseInt(customTarget));
    }
  }, [customTarget]);

  const resetSearch = () => {
    clearTimeouts();
    setSearching(false);
    setCompleted(false);
    setCurrentIdx(-1);
    setCompareIdx(-1);
    setFoundIdx(-1);
    setLeft(-1);
    setRight(-1);
    setMid(-1);
    setCurrentStep(0);
    setOperations(0);
    setComparisons(0);
    setStartTime(null);
  };

  const startSearch = () => {
    if (searching) return;
    if (target === null || target === undefined) {
      alert('Please enter a target value to search for');
      return;
    }

    resetSearch();
    setSearching(true);

    const animations = [];
    let result = -1;

    switch (selectedAlgorithm) {
      case 'linearSearch':
        result = linearSearch([...array], target, animations);
        break;
      case 'binarySearch':
        result = binarySearch([...array], target, animations);
        break;
      case 'jumpSearch':
        result = jumpSearch([...array], target, animations);
        break;
      case 'exponentialSearch':
        result = exponentialSearch([...array], target, animations);
        break;
      default:
        result = linearSearch([...array], target, animations);
    }

    setMaxSteps(animations.length);
    playAnimations(animations, result);
  };

  const linearSearch = (arr, target, animations) => {
    for (let i = 0; i < arr.length; i++) {
      animations.push({ type: 'current', index: i, message: `Checking index ${i}: ${arr[i]}` });
      
      if (arr[i] === target) {
        animations.push({ 
          type: 'found', 
          index: i, 
          message: `Found ${target} at index ${i}!` 
        });
        return i;
      }
      
      animations.push({ 
        type: 'notFound', 
        index: i, 
        message: `${arr[i]} ≠ ${target}, continue searching...` 
      });
    }
    
    animations.push({ 
      type: 'complete', 
      index: -1, 
      message: `${target} not found in the array` 
    });
    return -1;
  };

  const binarySearch = (arr, target, animations) => {
    let left = 0;
    let right = arr.length - 1;

    animations.push({ 
      type: 'initialize', 
      left: left, 
      right: right, 
      message: `Searching for ${target} in sorted array` 
    });

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      
      animations.push({ 
        type: 'setMid', 
        left: left, 
        right: right, 
        mid: mid, 
        message: `Set mid = ${mid}, checking arr[${mid}] = ${arr[mid]}` 
      });

      if (arr[mid] === target) {
        animations.push({ 
          type: 'found', 
          index: mid, 
          message: `Found ${target} at index ${mid}!` 
        });
        return mid;
      } else if (arr[mid] < target) {
        left = mid + 1;
        animations.push({ 
          type: 'searchRight', 
          left: left, 
          right: right, 
          message: `${arr[mid]} < ${target}, search right half [${left}, ${right}]` 
        });
      } else {
        right = mid - 1;
        animations.push({ 
          type: 'searchLeft', 
          left: left, 
          right: right, 
          message: `${arr[mid]} > ${target}, search left half [${left}, ${right}]` 
        });
      }
    }

    animations.push({ 
      type: 'complete', 
      index: -1, 
      message: `${target} not found in the array` 
    });
    return -1;
  };

  const jumpSearch = (arr, target, animations) => {
    const n = arr.length;
    let step = Math.floor(Math.sqrt(n));
    let prev = 0;

    animations.push({ 
      type: 'initialize', 
      message: `Jump Search with step size ${step}` 
    });

    // Jump through blocks
    while (arr[Math.min(step, n) - 1] < target) {
      animations.push({ 
        type: 'jump', 
        index: Math.min(step, n) - 1, 
        message: `Jump to index ${Math.min(step, n) - 1}: ${arr[Math.min(step, n) - 1]} < ${target}` 
      });

      prev = step;
      step += Math.floor(Math.sqrt(n));

      if (prev >= n) {
        animations.push({ 
          type: 'complete', 
          index: -1, 
          message: `${target} not found - exceeded array bounds` 
        });
        return -1;
      }
    }

    // Linear search in identified block
    animations.push({ 
      type: 'blockFound', 
      left: prev, 
      right: Math.min(step, n) - 1, 
      message: `Found block [${prev}, ${Math.min(step, n) - 1}], performing linear search` 
    });

    for (let i = prev; i < Math.min(step, n); i++) {
      animations.push({ 
        type: 'current', 
        index: i, 
        message: `Checking index ${i}: ${arr[i]}` 
      });

      if (arr[i] === target) {
        animations.push({ 
          type: 'found', 
          index: i, 
          message: `Found ${target} at index ${i}!` 
        });
        return i;
      }

      if (arr[i] > target) {
        break;
      }
    }

    animations.push({ 
      type: 'complete', 
      index: -1, 
      message: `${target} not found in the array` 
    });
    return -1;
  };

  const exponentialSearch = (arr, target, animations) => {
    if (arr[0] === target) {
      animations.push({ 
        type: 'found', 
        index: 0, 
        message: `Found ${target} at index 0!` 
      });
      return 0;
    }

    // Find range for binary search by repeated doubling
    let i = 1;
    while (i < arr.length && arr[i] <= target) {
      animations.push({ 
        type: 'exponential', 
        index: i, 
        message: `Checking index ${i}: ${arr[i]} <= ${target}, double the range` 
      });
      i *= 2;
    }

    const left = i / 2;
    const right = Math.min(i, arr.length - 1);

    animations.push({ 
      type: 'rangeFound', 
      left: left, 
      right: right, 
      message: `Found range [${left}, ${right}], performing binary search` 
    });

    // Perform binary search in the found range
    return binarySearchInRange(arr, target, left, right, animations);
  };

  const binarySearchInRange = (arr, target, left, right, animations) => {
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      
      animations.push({ 
        type: 'setMid', 
        left: left, 
        right: right, 
        mid: mid, 
        message: `Set mid = ${mid}, checking arr[${mid}] = ${arr[mid]}` 
      });

      if (arr[mid] === target) {
        animations.push({ 
          type: 'found', 
          index: mid, 
          message: `Found ${target} at index ${mid}!` 
        });
        return mid;
      } else if (arr[mid] < target) {
        left = mid + 1;
        animations.push({ 
          type: 'searchRight', 
          left: left, 
          right: right, 
          message: `${arr[mid]} < ${target}, search right half [${left}, ${right}]` 
        });
      } else {
        right = mid - 1;
        animations.push({ 
          type: 'searchLeft', 
          left: left, 
          right: right, 
          message: `${arr[mid]} > ${target}, search left half [${left}, ${right}]` 
        });
      }
    }

    animations.push({ 
      type: 'complete', 
      index: -1, 
      message: `${target} not found in the array` 
    });
    return -1;
  };

  const playAnimations = (animations, result) => {
    animations.forEach((animation, index) => {
      const timeout = setTimeout(() => {
        setCurrentStep(index + 1);
        const { type, index: idx, left: l, right: r, mid: m, message } = animation;

        if (type === 'current' || type === 'jump' || type === 'exponential') {
          setCurrentIdx(idx);
          setCompareIdx(-1);
        } else if (type === 'initialize' || type === 'blockFound' || type === 'rangeFound') {
          setLeft(l !== undefined ? l : -1);
          setRight(r !== undefined ? r : -1);
        } else if (type === 'setMid') {
          setLeft(l);
          setRight(r);
          setMid(m);
          setCurrentIdx(-1);
        } else if (type === 'searchLeft' || type === 'searchRight') {
          setLeft(l);
          setRight(r);
          setMid(-1);
        } else if (type === 'found') {
          setFoundIdx(idx);
          setCurrentIdx(-1);
          setCompareIdx(-1);
        } else if (type === 'notFound') {
          setCurrentIdx(-1);
        }

        // Check if this is the last animation
        if (index === animations.length - 1) {
          setTimeout(() => {
            setSearching(false);
            setCompleted(true);
          }, speed);
        }
      }, index * speed);

      animationTimeoutsRef.current.push(timeout);
    });
  };

  const getBarColor = (index) => {
    if (foundIdx === index) return '#10B981'; // Green - found
    if (currentIdx === index) return '#F59E0B'; // Yellow - current
    if (mid === index) return '#8B5CF6'; // Purple - mid point
    if (left <= index && index <= right && (left !== -1 && right !== -1)) return '#3B82F6'; // Blue - search range
    return '#6B7280'; // Gray - default
  };

  const getAlgorithmName = () => {
    const names = {
      linearSearch: 'Linear Search',
      binarySearch: 'Binary Search',
      jumpSearch: 'Jump Search',
      exponentialSearch: 'Exponential Search'
    };
    return names[selectedAlgorithm] || 'Unknown Algorithm';
  };

  const getTimeComplexity = () => {
    const complexities = {
      linearSearch: 'O(n)',
      binarySearch: 'O(log n)',
      jumpSearch: 'O(√n)',
      exponentialSearch: 'O(log n)'
    };
    return complexities[selectedAlgorithm] || 'Unknown';
  };

  const getAlgorithmDescription = () => {
    const descriptions = {
      linearSearch: 'Linear Search checks each element sequentially until the target is found or the end is reached.',
      binarySearch: 'Binary Search repeatedly divides a sorted array in half, comparing the target with the middle element.',
      jumpSearch: 'Jump Search skips elements by fixed steps, then performs linear search in the identified block.',
      exponentialSearch: 'Exponential Search finds a range by repeated doubling, then performs binary search in that range.'
    };
    return descriptions[selectedAlgorithm] || 'No description available.';
  };

  return (
    <div className="search-visualizer">
      <div className="visualizer-controls">
        <div className="control-row">
          <div className="control-group">
            <label htmlFor="inputMode">Input Mode:</label>
            <select 
              id="inputMode"
              value={inputMode} 
              onChange={(e) => setInputMode(e.target.value)}
              disabled={searching}
            >
              <option value="random">Random</option>
              <option value="custom">Custom</option>
              <option value="sorted">Sorted</option>
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
                placeholder="Enter numbers separated by commas (e.g., 10,25,30,45,60,75,90)"
                disabled={searching}
                style={{ minWidth: '300px' }}
              />
            </div>
          )}
          
          <button onClick={generateArray} disabled={searching} className="generate-btn">
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
              disabled={searching}
            >
              <option value="linearSearch">Linear Search</option>
              <option value="binarySearch">Binary Search</option>
              <option value="jumpSearch">Jump Search</option>
              <option value="exponentialSearch">Exponential Search</option>
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="target">Target Value:</label>
            <input 
              id="target"
              type="number" 
              value={customTarget || target || ''} 
              onChange={(e) => setCustomTarget(e.target.value)}
              disabled={searching}
              placeholder="Enter target value"
            />
          </div>
          
          <div className="control-group">
            <label htmlFor="visualizationStyle">Style:</label>
            <select 
              id="visualizationStyle"
              value={visualizationStyle} 
              onChange={(e) => setVisualizationStyle(e.target.value)}
              disabled={searching}
            >
              <option value="bars">Bars</option>
              <option value="dots">Dots</option>
              <option value="lines">Lines</option>
            </select>
          </div>

          <button onClick={startSearch} disabled={searching} className="search-btn">
            {searching ? 'Searching...' : 'Start Search'}
          </button>
          
          {searching && (
            <button onClick={() => setSearching(false)} className="stop-btn">
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
              disabled={searching}
            />
          </div>
          
          {inputMode !== 'custom' && (
            <div className="control-group">
              <label htmlFor="size">Size: {size}</label>
              <input 
                id="size"
                type="range" 
                min="5" 
                max="50" 
                value={size} 
                onChange={(e) => setSize(parseInt(e.target.value))}
                disabled={searching}
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
          const isFound = foundIdx === idx;
          const isMid = mid === idx;
          const inRange = left <= idx && idx <= right && (left !== -1 && right !== -1);
          
          if (visualizationStyle === 'bars') {
            return (
              <div 
                className={`array-element ${isActive ? 'current' : ''} ${isComparing ? 'compare' : ''} ${isFound ? 'found' : ''} ${isMid ? 'mid' : ''} ${inRange ? 'range' : ''}`}
                key={idx}
                style={{ backgroundColor: getBarColor(idx) }}
              >
                {showValues && <span className="element-value">{value}</span>}
                <span className="element-index">{idx}</span>
              </div>
            );
          } else if (visualizationStyle === 'dots') {
            return (
              <div 
                className={`array-dot-container ${isActive ? 'current' : ''} ${isComparing ? 'compare' : ''} ${isFound ? 'found' : ''}`}
                key={idx}
                style={{ height: '100%' }}
              >
                <div 
                  className="array-dot"
                  style={{ 
                    backgroundColor: getBarColor(idx)
                  }}
                />
                {showValues && <span className="dot-value">{value}</span>}
                <span className="dot-index">{idx}</span>
              </div>
            );
          } else if (visualizationStyle === 'lines') {
            return (
              <div 
                className={`array-line-container ${isActive ? 'current' : ''} ${isComparing ? 'compare' : ''} ${isFound ? 'found' : ''}`}
                key={idx}
                style={{ height: '100%' }}
              >
                <div 
                  className="array-line"
                  style={{ 
                    backgroundColor: getBarColor(idx)
                  }}
                />
                {showValues && <span className="line-value">{value}</span>}
                <span className="line-index">{idx}</span>
              </div>
            );
          }
        })}
      </div>

      {searching && (
        <div className="search-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(currentStep / maxSteps) * 100}%` }}
            />
          </div>
          <span>Step {currentStep} of {maxSteps}</span>
        </div>
      )}

      {completed && (
        <div className={`completion-message ${foundIdx !== -1 ? 'success' : 'not-found'}`}>
          {foundIdx !== -1 ? 
            `🎉 Found ${target} at index ${foundIdx}!` : 
            `❌ ${target} not found in the array`}
        </div>
      )}

      <div className="search-info">
        <div className="legend">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#6B7280' }}></div>
            <span>Unvisited</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#F59E0B' }}></div>
            <span>Current</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#8B5CF6' }}></div>
            <span>Mid Point</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#3B82F6' }}></div>
            <span>Search Range</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#10B981' }}></div>
            <span>Found</span>
          </div>
        </div>

        <div className="algorithm-details">
          <h4>{getAlgorithmName()}</h4>
          <p><strong>Time Complexity:</strong> {getTimeComplexity()}</p>
          <p><strong>Target:</strong> {target}</p>
          <p>{getAlgorithmDescription()}</p>
        </div>
      </div>
    </div>
  );
};

export default SearchVisualizer;
