import React, { useState, useEffect, useRef } from 'react';
import './DPVisualizer.css';

const DPVisualizer = ({ algorithm, container }) => {
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [speed, setSpeed] = useState(50); // Animation speed (ms)
  const [dpTable, setDpTable] = useState([]);
  const [currentCell, setCurrentCell] = useState(null);
  const [visitedCells, setVisitedCells] = useState([]);
  const [dpProblem, setDpProblem] = useState('fibonacci'); // 'fibonacci', 'knapsack', 'lcs'
  const [inputN, setInputN] = useState(10); // For Fibonacci
  const [inputW, setInputW] = useState(10); // For Knapsack (weight capacity)
  const [inputItems, setInputItems] = useState([
    { weight: 2, value: 6 },
    { weight: 3, value: 10 },
    { weight: 4, value: 12 },
    { weight: 5, value: 15 }
  ]); // For Knapsack
  const [inputStr1, setInputStr1] = useState('ABCBDAB'); // For LCS
  const [inputStr2, setInputStr2] = useState('BDCABA'); // For LCS
  const [result, setResult] = useState(null);
  const animationTimeoutsRef = useRef([]);
  
  // Reset visualization state
  const resetVisualization = () => {
    setRunning(false);
    setCompleted(false);
    setDpTable([]);
    setCurrentCell(null);
    setVisitedCells([]);
    setResult(null);
    
    // Clear any ongoing animation timeouts
    animationTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    animationTimeoutsRef.current = [];
  };
  
  // Initialize DP table for Fibonacci
  const initFibonacciTable = (n) => {
    const table = new Array(n + 1).fill(-1);
    table[0] = 0;
    table[1] = 1;
    return table;
  };
  
  // Initialize DP table for Knapsack
  const initKnapsackTable = (items, capacity) => {
    const table = Array(items.length + 1)
      .fill()
      .map(() => Array(capacity + 1).fill(-1));
    
    // Base case: 0 items or 0 capacity
    for (let i = 0; i <= items.length; i++) {
      table[i][0] = 0;
    }
    
    for (let w = 0; w <= capacity; w++) {
      table[0][w] = 0;
    }
    
    return table;
  };
  
  // Initialize DP table for LCS (Longest Common Subsequence)
  const initLCSTable = (str1, str2) => {
    const table = Array(str1.length + 1)
      .fill()
      .map(() => Array(str2.length + 1).fill(-1));
    
    // Base case: empty string
    for (let i = 0; i <= str1.length; i++) {
      table[i][0] = 0;
    }
    
    for (let j = 0; j <= str2.length; j++) {
      table[0][j] = 0;
    }
    
    return table;
  };
  
  // Animate Fibonacci DP solution
  const animateFibonacci = async () => {
    if (running) return;
    resetVisualization();
    setRunning(true);
    
    const n = parseInt(inputN);
    if (isNaN(n) || n < 0 || n > 30) {
      alert('Please enter a number between 0 and 30');
      setRunning(false);
      return;
    }
    
    // Initialize DP table
    const table = initFibonacciTable(n);
    setDpTable(table);
    
    // Create animations
    const animations = [];
    
    // Base cases are already filled
    animations.push({
      type: 'visit',
      cell: { i: 0 },
      value: 0
    });
    
    animations.push({
      type: 'visit',
      cell: { i: 1 },
      value: 1
    });
    
    // Fill the table
    for (let i = 2; i <= n; i++) {
      animations.push({
        type: 'current',
        cell: { i }
      });
      
      // Calculate F(i) = F(i-1) + F(i-2)
      const value = table[i - 1] + table[i - 2];
      table[i] = value;
      
      animations.push({
        type: 'fill',
        cell: { i },
        value
      });
    }
    
    // Set the result
    animations.push({
      type: 'result',
      value: table[n]
    });
    
    // Play the animations
    await playAnimations(animations, table);
  };
  
  // Animate Knapsack DP solution
  const animateKnapsack = async () => {
    if (running) return;
    resetVisualization();
    setRunning(true);
    
    const capacity = parseInt(inputW);
    if (isNaN(capacity) || capacity < 1 || capacity > 20) {
      alert('Please enter a capacity between 1 and 20');
      setRunning(false);
      return;
    }
    
    // Initialize DP table
    const table = initKnapsackTable(inputItems, capacity);
    setDpTable(table);
    
    // Create animations
    const animations = [];
    
    // Base cases are already filled
    for (let i = 0; i <= inputItems.length; i++) {
      animations.push({
        type: 'visit',
        cell: { i, j: 0 },
        value: 0
      });
    }
    
    for (let j = 0; j <= capacity; j++) {
      animations.push({
        type: 'visit',
        cell: { i: 0, j },
        value: 0
      });
    }
    
    // Fill the table
    for (let i = 1; i <= inputItems.length; i++) {
      const item = inputItems[i - 1]; // 0-indexed items
      
      for (let w = 1; w <= capacity; w++) {
        animations.push({
          type: 'current',
          cell: { i, j: w }
        });
        
        // If item weight is more than capacity, skip it
        if (item.weight > w) {
          table[i][w] = table[i - 1][w];
          animations.push({
            type: 'fill',
            cell: { i, j: w },
            value: table[i][w],
            message: `Item ${i} (weight ${item.weight}) is too heavy for capacity ${w}, using previous value.`
          });
        } else {
          // Max of (not taking the item, taking the item)
          const notTaking = table[i - 1][w];
          const taking = table[i - 1][w - item.weight] + item.value;
          table[i][w] = Math.max(notTaking, taking);
          
          animations.push({
            type: 'fill',
            cell: { i, j: w },
            value: table[i][w],
            message: taking > notTaking
              ? `Taking item ${i} (value ${item.value}) gives better value: ${taking} > ${notTaking}`
              : `Not taking item ${i} gives better value: ${notTaking} >= ${taking}`
          });
        }
      }
    }
    
    // Set the result
    animations.push({
      type: 'result',
      value: table[inputItems.length][capacity]
    });
    
    // Play the animations
    await playAnimations(animations, table);
  };
  
  // Animate LCS (Longest Common Subsequence) DP solution
  const animateLCS = async () => {
    if (running) return;
    resetVisualization();
    setRunning(true);
    
    if (!inputStr1 || !inputStr2) {
      alert('Please enter both strings');
      setRunning(false);
      return;
    }
    
    // Initialize DP table
    const table = initLCSTable(inputStr1, inputStr2);
    setDpTable(table);
    
    // Create animations
    const animations = [];
    
    // Base cases are already filled
    for (let i = 0; i <= inputStr1.length; i++) {
      animations.push({
        type: 'visit',
        cell: { i, j: 0 },
        value: 0
      });
    }
    
    for (let j = 0; j <= inputStr2.length; j++) {
      animations.push({
        type: 'visit',
        cell: { i: 0, j },
        value: 0
      });
    }
    
    // Fill the table
    for (let i = 1; i <= inputStr1.length; i++) {
      for (let j = 1; j <= inputStr2.length; j++) {
        animations.push({
          type: 'current',
          cell: { i, j }
        });
        
        // If characters match
        if (inputStr1[i - 1] === inputStr2[j - 1]) {
          table[i][j] = table[i - 1][j - 1] + 1;
          animations.push({
            type: 'fill',
            cell: { i, j },
            value: table[i][j],
            message: `Characters match: ${inputStr1[i - 1]} = ${inputStr2[j - 1]}, adding 1 to diagonal.`
          });
        } else {
          // Characters don't match, take max of left or top
          table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
          animations.push({
            type: 'fill',
            cell: { i, j },
            value: table[i][j],
            message: `Characters don't match: ${inputStr1[i - 1]} ≠ ${inputStr2[j - 1]}, taking max of left (${table[i][j - 1]}) or top (${table[i - 1][j]}).`
          });
        }
      }
    }
    
    // Set the result
    animations.push({
      type: 'result',
      value: table[inputStr1.length][inputStr2.length]
    });
    
    // Play the animations
    await playAnimations(animations, table);
  };
  
  // Play the algorithm animations
  const playAnimations = async (animations, finalTable) => {
    for (let i = 0; i < animations.length; i++) {
      const animation = animations[i];
      
      const timeout = setTimeout(() => {
        if (animation.type === 'visit') {
          setVisitedCells(prev => [...prev, animation.cell]);
          setCurrentCell(null);
          
          // Update the table with the value
          if (animation.value !== undefined) {
            setDpTable(prev => {
              const newTable = Array.isArray(prev[0]) 
                ? prev.map(row => [...row])
                : [...prev];
              
              if (Array.isArray(newTable[0])) {
                newTable[animation.cell.i][animation.cell.j] = animation.value;
              } else {
                newTable[animation.cell.i] = animation.value;
              }
              
              return newTable;
            });
          }
        } else if (animation.type === 'current') {
          setCurrentCell(animation.cell);
        } else if (animation.type === 'fill') {
          setVisitedCells(prev => [...prev, animation.cell]);
          setCurrentCell(null);
          
          // Update the table with the value
          setDpTable(prev => {
            const newTable = Array.isArray(prev[0]) 
              ? prev.map(row => [...row])
              : [...prev];
            
            if (Array.isArray(newTable[0])) {
              newTable[animation.cell.i][animation.cell.j] = animation.value;
            } else {
              newTable[animation.cell.i] = animation.value;
            }
            
            return newTable;
          });
        } else if (animation.type === 'result') {
          setResult(animation.value);
          setCompleted(true);
          setRunning(false);
        }
      }, i * speed);
      
      animationTimeoutsRef.current.push(timeout);
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      animationTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);
  
  // Determine which algorithm to run based on the selected problem
  const startVisualization = () => {
    if (running) return;
    
    // Extract algorithm name from the algorithm object
    const algoName = algorithm?.name?.toLowerCase() || '';
    
    // Try to determine the DP problem from the algorithm name
    if (algoName.includes('fibonacci')) {
      setDpProblem('fibonacci');
      animateFibonacci();
    } else if (algoName.includes('knapsack')) {
      setDpProblem('knapsack');
      animateKnapsack();
    } else if (algoName.includes('lcs') || algoName.includes('common subsequence')) {
      setDpProblem('lcs');
      animateLCS();
    } else {
      // Use the currently selected problem
      if (dpProblem === 'fibonacci') {
        animateFibonacci();
      } else if (dpProblem === 'knapsack') {
        animateKnapsack();
      } else if (dpProblem === 'lcs') {
        animateLCS();
      }
    }
  };
  
  // Render the DP table
  const renderDPTable = () => {
    if (!dpTable || dpTable.length === 0) {
      return (
        <div className="empty-table">Select a problem and start visualization</div>
      );
    }
    
    if (dpProblem === 'fibonacci') {
      return (
        <div className="fibonacci-table">
          <div className="table-header">
            <div className="header-cell">i</div>
            {dpTable.map((_, i) => (
              <div key={i} className="header-cell">{i}</div>
            ))}
          </div>
          <div className="table-row">
            <div className="header-cell">F(i)</div>
            {dpTable.map((value, i) => {
              const isCurrent = currentCell && currentCell.i === i;
              const isVisited = visitedCells.some(cell => cell.i === i);
              
              return (
                <div 
                  key={i} 
                  className={`table-cell ${
                    isCurrent ? 'current' : isVisited ? 'visited' : ''
                  }`}
                >
                  {value >= 0 ? value : ''}
                </div>
              );
            })}
          </div>
        </div>
      );
    } else if (dpProblem === 'knapsack') {
      return (
        <div className="knapsack-table">
          <div className="table-header">
            <div className="header-cell corner-cell">i\w</div>
            {Array.from({ length: dpTable[0].length }, (_, j) => (
              <div key={j} className="header-cell">{j}</div>
            ))}
          </div>
          {dpTable.map((row, i) => (
            <div key={i} className="table-row">
              <div className="header-cell">{i}</div>
              {row.map((value, j) => {
                const isCurrent = currentCell && currentCell.i === i && currentCell.j === j;
                const isVisited = visitedCells.some(cell => cell.i === i && cell.j === j);
                
                return (
                  <div 
                    key={j} 
                    className={`table-cell ${
                      isCurrent ? 'current' : isVisited ? 'visited' : ''
                    }`}
                  >
                    {value >= 0 ? value : ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      );
    } else if (dpProblem === 'lcs') {
      return (
        <div className="lcs-table">
          <div className="table-header">
            <div className="header-cell corner-cell"></div>
            <div className="header-cell"></div>
            {inputStr2.split('').map((char, j) => (
              <div key={j} className="header-cell char-cell">{char}</div>
            ))}
          </div>
          <div className="table-row">
            <div className="header-cell"></div>
            {Array.from({ length: dpTable[0].length }, (_, j) => (
              <div key={j} className="header-cell">{j}</div>
            ))}
          </div>
          {dpTable.map((row, i) => (
            <div key={i} className="table-row">
              <div className="header-cell char-cell">
                {i > 0 ? inputStr1[i - 1] : ''}
              </div>
              <div className="header-cell">{i}</div>
              {row.map((value, j) => {
                const isCurrent = currentCell && currentCell.i === i && currentCell.j === j;
                const isVisited = visitedCells.some(cell => cell.i === i && cell.j === j);
                
                return (
                  <div 
                    key={j} 
                    className={`table-cell ${
                      isCurrent ? 'current' : isVisited ? 'visited' : ''
                    }`}
                  >
                    {value >= 0 ? value : ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      );
    }
    
    return null;
  };
  
  // Render problem-specific inputs
  const renderProblemInputs = () => {
    if (dpProblem === 'fibonacci') {
      return (
        <div className="control-group">
          <label>n:</label>
          <input
            type="number"
            min="1"
            max="30"
            value={inputN}
            onChange={(e) => setInputN(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
            disabled={running}
          />
        </div>
      );
    } else if (dpProblem === 'knapsack') {
      return (
        <>
          <div className="control-group">
            <label>Capacity (W):</label>
            <input
              type="number"
              min="1"
              max="20"
              value={inputW}
              onChange={(e) => setInputW(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
              disabled={running}
            />
          </div>
          <div className="items-table">
            <div className="items-header">
              <div>Item</div>
              <div>Weight</div>
              <div>Value</div>
            </div>
            {inputItems.map((item, index) => (
              <div key={index} className="item-row">
                <div>{index + 1}</div>
                <div>{item.weight}</div>
                <div>{item.value}</div>
              </div>
            ))}
          </div>
        </>
      );
    } else if (dpProblem === 'lcs') {
      return (
        <>
          <div className="control-group">
            <label>String 1:</label>
            <input
              type="text"
              value={inputStr1}
              onChange={(e) => setInputStr1(e.target.value.toUpperCase())}
              disabled={running}
              maxLength={10}
            />
          </div>
          <div className="control-group">
            <label>String 2:</label>
            <input
              type="text"
              value={inputStr2}
              onChange={(e) => setInputStr2(e.target.value.toUpperCase())}
              disabled={running}
              maxLength={10}
            />
          </div>
        </>
      );
    }
    
    return null;
  };
  
  return (
    <div className="dp-visualizer-container">
      <div className="visualizer-controls">
        <div className="control-group">
          <label>Problem:</label>
          <select
            value={dpProblem}
            onChange={(e) => setDpProblem(e.target.value)}
            disabled={running}
          >
            <option value="fibonacci">Fibonacci</option>
            <option value="knapsack">0/1 Knapsack</option>
            <option value="lcs">Longest Common Subsequence</option>
          </select>
        </div>
        {renderProblemInputs()}
        <button onClick={startVisualization} disabled={running}>
          {running ? 'Visualizing...' : 'Start Visualization'}
        </button>
        <button onClick={resetVisualization} disabled={running}>
          Reset
        </button>
        <div className="control-group">
          <label>Speed:</label>
          <input
            type="range"
            min="5"
            max="200"
            value={speed}
            onChange={(e) => setSpeed(200 - parseInt(e.target.value))}
            disabled={running}
          />
        </div>
      </div>
      
      <div className="dp-table-container">
        {renderDPTable()}
      </div>
      
      <div className="result-container">
        {result !== null && (
          <div className="final-result">
            <h3>Final Result:</h3>
            <div className="result-value">{result}</div>
          </div>
        )}
      </div>
      
      <div className="algorithm-info">
        <h3>{algorithm?.name || 'Dynamic Programming Algorithm'}</h3>
        <p>{algorithm?.description || 'Visualization of a dynamic programming algorithm.'}</p>
        {completed && (
          <div className="completion-message">
            DP solution completed! 🎉
          </div>
        )}
      </div>
    </div>
  );
};

export default DPVisualizer;