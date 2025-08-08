import React, { useState, useEffect, useRef } from 'react';
import './RecursionVisualizer.css';

const RecursionVisualizer = ({ algorithm, container, step, inputData, onPerformanceUpdate, onComplexityUpdate }) => {
  const [input, setInput] = useState(5); // Default input value
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [speed, setSpeed] = useState(50); // Animation speed (ms)
  const [operations, setOperations] = useState(0);
  const [comparisons, setComparisons] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [callStack, setCallStack] = useState([]);
  const [callTree, setCallTree] = useState(null);
  const [currentCall, setCurrentCall] = useState(null);
  const [result, setResult] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [recursionType, setRecursionType] = useState('fibonacci');
  const [showCallStack, setShowCallStack] = useState(true);
  const [showTree, setShowTree] = useState(true);
  const [inputMode, setInputMode] = useState('default');
  const animationTimeoutsRef = useRef([]);
  const svgRef = useRef(null);
  
  // Update performance metrics
  useEffect(() => {
    if (onPerformanceUpdate) {
      onPerformanceUpdate({
        operations,
        comparisons,
        swaps: 0, // Recursion algorithms don't have swaps
        timeTaken: startTime ? (Date.now() - startTime) : 0
      });
    }
  }, [operations, comparisons, startTime]);

  // Update complexity metrics
  useEffect(() => {
    if (onComplexityUpdate) {
      onComplexityUpdate({
        time: algorithm.complexity?.time || 'O(2^n)',
        space: algorithm.complexity?.space || 'O(n)'
      });
    }
  }, [algorithm.complexity]);

  // Reset visualization state
  const resetVisualization = () => {
    setRunning(false);
    setCompleted(false);
    setCallStack([]);
    setCallTree(null);
    setCurrentCall(null);
    setResult(null);
    setCallHistory([]);
    setOperations(0);
    setComparisons(0);
    setStartTime(null);
    
    // Clear any ongoing animation timeouts
    animationTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    animationTimeoutsRef.current = [];
  };
  
  // Generate the call tree for Fibonacci
  const generateFibonacciTree = (n) => {
    if (n <= 0) return null;
    
    const generateTree = (n) => {
      if (n <= 1) {
        return {
          id: `fib-${n}`,
          value: n,
          args: [n],
          result: n,
          children: [],
          level: 0,
          x: 0,
          y: 0,
          width: 60
        };
      }
      
      const node = {
        id: `fib-${n}`,
        value: n,
        args: [n],
        result: null, // Will be calculated during animation
        children: [],
        level: 0,
        x: 0,
        y: 0,
        width: 60
      };
      
      const leftChild = generateTree(n - 1);
      const rightChild = generateTree(n - 2);
      
      leftChild.level = 1;
      rightChild.level = 1;
      
      node.children.push(leftChild);
      node.children.push(rightChild);
      
      return node;
    };
    
    return generateTree(n);
  };
  
  // Generate the call tree for Factorial
  const generateFactorialTree = (n) => {
    if (n < 0) return null;
    
    const generateTree = (n) => {
      if (n <= 1) {
        return {
          id: `fact-${n}`,
          value: n,
          args: [n],
          result: 1,
          children: [],
          level: 0,
          x: 0,
          y: 0,
          width: 60
        };
      }
      
      const node = {
        id: `fact-${n}`,
        value: n,
        args: [n],
        result: null, // Will be calculated during animation
        children: [],
        level: 0,
        x: 0,
        y: 0,
        width: 60
      };
      
      const child = generateTree(n - 1);
      child.level = 1;
      
      node.children.push(child);
      
      return node;
    };
    
    return generateTree(n);
  };
  
  // Calculate layout positions for the tree
  const calculateTreeLayout = (node, level = 0, xOffset = 0) => {
    if (!node) return { node: null, width: 0 };
    
    node.level = level;
    
    if (node.children.length === 0) {
      node.width = 60; // Leaf node width
      node.x = xOffset + node.width / 2;
      node.y = level * 80 + 40; // Vertical spacing
      return { node, width: node.width };
    }
    
    let totalWidth = 0;
    const processedChildren = [];
    
    // Process all children and calculate their widths
    for (let i = 0; i < node.children.length; i++) {
      const result = calculateTreeLayout(
        node.children[i],
        level + 1,
        xOffset + totalWidth
      );
      processedChildren.push(result.node);
      totalWidth += result.width;
    }
    
    node.children = processedChildren;
    node.width = Math.max(60, totalWidth); // Node width is at least 60px
    node.x = xOffset + node.width / 2;
    node.y = level * 80 + 40; // Vertical spacing
    
    return { node, width: node.width };
  };
  
  // Draw the call tree
  const drawCallTree = () => {
    if (!callTree) return;
    
    const svg = svgRef.current;
    if (!svg) return;
    
    // Clear SVG
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }
    
    // Set SVG dimensions based on tree size
    const treeWidth = callTree.width;
    const treeHeight = getTreeHeight(callTree) * 80 + 80; // Height based on levels
    
    svg.setAttribute('width', treeWidth);
    svg.setAttribute('height', treeHeight);
    svg.setAttribute('viewBox', `0 0 ${treeWidth} ${treeHeight}`);
    
    // Draw the tree recursively
    drawNode(callTree, svg);
  };
  
  // Get the height of the tree
  const getTreeHeight = (node) => {
    if (!node || node.children.length === 0) return 0;
    
    let maxHeight = 0;
    for (const child of node.children) {
      maxHeight = Math.max(maxHeight, getTreeHeight(child));
    }
    
    return maxHeight + 1;
  };
  
  // Draw a single node and its connections
  const drawNode = (node, svg) => {
    if (!node) return;
    
    // Draw connections to children first (so they appear behind nodes)
    for (const child of node.children) {
      // Create line element
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', node.x);
      line.setAttribute('y1', node.y);
      line.setAttribute('x2', child.x);
      line.setAttribute('y2', child.y);
      line.setAttribute('stroke', '#aaa');
      line.setAttribute('stroke-width', '2');
      
      // Highlight active call path
      if (currentCall && 
          (currentCall.id === node.id || currentCall.id === child.id) &&
          callStack.some(call => call.id === node.id) && 
          callStack.some(call => call.id === child.id)) {
        line.setAttribute('stroke', '#ff9800');
        line.setAttribute('stroke-width', '3');
      }
      
      svg.appendChild(line);
      
      // Recursively draw child nodes
      drawNode(child, svg);
    }
    
    // Create group for the node
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Create circle element
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', node.x);
    circle.setAttribute('cy', node.y);
    circle.setAttribute('r', 25);
    
    // Set node color based on state
    if (currentCall && currentCall.id === node.id) {
      circle.setAttribute('fill', '#ffeb3b'); // Yellow for current call
    } else if (callHistory.some(call => call.id === node.id)) {
      if (node.result !== null) {
        circle.setAttribute('fill', '#4caf50'); // Green for completed calls
      } else {
        circle.setAttribute('fill', '#ff9800'); // Orange for visited calls
      }
    } else {
      circle.setAttribute('fill', '#607d8b'); // Default color
    }
    
    circle.setAttribute('stroke', '#fff');
    circle.setAttribute('stroke-width', '2');
    g.appendChild(circle);
    
    // Create text for function name and arguments
    const functionText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    functionText.setAttribute('x', node.x);
    functionText.setAttribute('y', node.y - 5);
    functionText.setAttribute('text-anchor', 'middle');
    functionText.setAttribute('fill', '#fff');
    functionText.setAttribute('font-size', '12');
    functionText.textContent = algorithm?.name?.includes('Fibonacci') ? 'fib' : 'fact';
    g.appendChild(functionText);
    
    // Create text for argument value
    const argText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    argText.setAttribute('x', node.x);
    argText.setAttribute('y', node.y + 10);
    argText.setAttribute('text-anchor', 'middle');
    argText.setAttribute('fill', '#fff');
    argText.setAttribute('font-size', '14');
    argText.setAttribute('font-weight', 'bold');
    argText.textContent = node.value;
    g.appendChild(argText);
    
    // Create text for result (if available)
    if (node.result !== null) {
      const resultText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      resultText.setAttribute('x', node.x);
      resultText.setAttribute('y', node.y + 30);
      resultText.setAttribute('text-anchor', 'middle');
      resultText.setAttribute('fill', '#fff');
      resultText.setAttribute('font-size', '10');
      resultText.textContent = `= ${node.result}`;
      g.appendChild(resultText);
    }
    
    svg.appendChild(g);
  };
  
  // Animate Fibonacci recursion
  const animateFibonacci = async () => {
    if (running) return;
    resetVisualization();
    setRunning(true);
    
    const n = parseInt(input);
    if (isNaN(n) || n < 0 || n > 10) {
      alert('Please enter a number between 0 and 10');
      setRunning(false);
      return;
    }
    
    // Generate the call tree
    const tree = generateFibonacciTree(n);
    const layoutResult = calculateTreeLayout(tree);
    setCallTree(layoutResult.node);
    
    // Create animations
    const animations = [];
    const callStack = [];
    const callHistory = [];
    
    // DFS to create animation steps
    const createAnimations = (node) => {
      if (!node) return 0;
      
      // Push call to stack
      callStack.push(node);
      callHistory.push(node);
      
      animations.push({
        type: 'call',
        node: { ...node },
        stack: [...callStack],
        history: [...callHistory]
      });
      
      if (node.value <= 1) {
        // Base case
        animations.push({
          type: 'return',
          node: { ...node },
          result: node.value,
          stack: [...callStack],
          history: [...callHistory]
        });
        
        callStack.pop();
        return node.value;
      }
      
      // Recursive calls
      const leftResult = createAnimations(node.children[0]);
      const rightResult = createAnimations(node.children[1]);
      
      // Calculate result
      const result = leftResult + rightResult;
      node.result = result;
      
      // Return result
      animations.push({
        type: 'return',
        node: { ...node },
        result,
        stack: [...callStack],
        history: [...callHistory]
      });
      
      callStack.pop();
      return result;
    };
    
    createAnimations(tree);
    
    // Play the animations
    for (let i = 0; i < animations.length; i++) {
      const animation = animations[i];
      
      const timeout = setTimeout(() => {
        setCurrentCall(animation.node);
        setCallStack(animation.stack);
        setCallHistory(animation.history);
        
        if (animation.type === 'return') {
          // Update the node's result in the tree
          updateNodeResult(callTree, animation.node.id, animation.result);
          
          // If this is the root node's return, set the final result
          if (animation.node.id === tree.id) {
            setResult(animation.result);
            setCompleted(true);
            setRunning(false);
          }
        }
        
        // Redraw the tree
        drawCallTree();
      }, i * speed);
      
      animationTimeoutsRef.current.push(timeout);
    }
  };
  
  // Animate Factorial recursion
  const animateFactorial = async () => {
    if (running) return;
    resetVisualization();
    setRunning(true);
    
    const n = parseInt(input);
    if (isNaN(n) || n < 0 || n > 10) {
      alert('Please enter a number between 0 and 10');
      setRunning(false);
      return;
    }
    
    // Generate the call tree
    const tree = generateFactorialTree(n);
    const layoutResult = calculateTreeLayout(tree);
    setCallTree(layoutResult.node);
    
    // Create animations
    const animations = [];
    const callStack = [];
    const callHistory = [];
    
    // DFS to create animation steps
    const createAnimations = (node) => {
      if (!node) return 1;
      
      // Push call to stack
      callStack.push(node);
      callHistory.push(node);
      
      animations.push({
        type: 'call',
        node: { ...node },
        stack: [...callStack],
        history: [...callHistory]
      });
      
      if (node.value <= 1) {
        // Base case
        animations.push({
          type: 'return',
          node: { ...node },
          result: 1,
          stack: [...callStack],
          history: [...callHistory]
        });
        
        callStack.pop();
        return 1;
      }
      
      // Recursive call
      const childResult = createAnimations(node.children[0]);
      
      // Calculate result
      const result = node.value * childResult;
      node.result = result;
      
      // Return result
      animations.push({
        type: 'return',
        node: { ...node },
        result,
        stack: [...callStack],
        history: [...callHistory]
      });
      
      callStack.pop();
      return result;
    };
    
    createAnimations(tree);
    
    // Play the animations
    for (let i = 0; i < animations.length; i++) {
      const animation = animations[i];
      
      const timeout = setTimeout(() => {
        setCurrentCall(animation.node);
        setCallStack(animation.stack);
        setCallHistory(animation.history);
        
        if (animation.type === 'return') {
          // Update the node's result in the tree
          updateNodeResult(callTree, animation.node.id, animation.result);
          
          // If this is the root node's return, set the final result
          if (animation.node.id === tree.id) {
            setResult(animation.result);
            setCompleted(true);
            setRunning(false);
          }
        }
        
        // Redraw the tree
        drawCallTree();
      }, i * speed);
      
      animationTimeoutsRef.current.push(timeout);
    }
  };
  
  // Update a node's result in the tree
  const updateNodeResult = (tree, nodeId, result) => {
    if (!tree) return;
    
    if (tree.id === nodeId) {
      tree.result = result;
      return;
    }
    
    for (const child of tree.children) {
      updateNodeResult(child, nodeId, result);
    }
  };
  
  // Redraw the tree when the call tree changes
  useEffect(() => {
    drawCallTree();
  }, [callTree, currentCall, callStack, callHistory]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      animationTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);
  
  // Get problem templates
  const getProblemTemplate = (type) => {
    switch (type) {
      case 'fibonacci':
        return { small: 5, medium: 7, large: 9 };
      case 'factorial':
        return { small: 4, medium: 6, large: 8 };
      default:
        return { small: 5, medium: 7, large: 9 };
    }
  };

  // Determine which algorithm to run based on the recursion type
  const startVisualization = () => {
    if (running) return;
    
    // Initialize performance tracking
    setOperations(0);
    setComparisons(0);
    setStartTime(Date.now());
    
    if (recursionType === 'fibonacci') {
      animateFibonacci();
    } else if (recursionType === 'factorial') {
      animateFactorial();
    } else {
      // Default to Fibonacci
      animateFibonacci();
    }
  };
  
  return (
    <div className="recursion-visualizer-container">
      <div className="visualizer-controls">
        <div className="control-row">
          <div className="control-group">
            <label>Recursion Type:</label>
            <select
              value={recursionType}
              onChange={(e) => setRecursionType(e.target.value)}
              disabled={running}
            >
              <option value="fibonacci">Fibonacci</option>
              <option value="factorial">Factorial</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>Input Mode:</label>
            <select
              value={inputMode}
              onChange={(e) => setInputMode(e.target.value)}
              disabled={running}
            >
              <option value="default">Default</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>Input (n): {input}</label>
            <input
              type="number"
              min="0"
              max="10"
              value={input}
              onChange={(e) => setInput(Math.min(10, Math.max(0, parseInt(e.target.value) || 0)))}
              disabled={running}
            />
          </div>
        </div>

        {inputMode === 'custom' && (
          <div className="control-row">
            <div className="template-buttons">
              <button 
                onClick={() => setInput(getProblemTemplate(recursionType).small)}
                disabled={running}
                className="template-btn"
              >
                Small ({getProblemTemplate(recursionType).small})
              </button>
              <button 
                onClick={() => setInput(getProblemTemplate(recursionType).medium)}
                disabled={running}
                className="template-btn"
              >
                Medium ({getProblemTemplate(recursionType).medium})
              </button>
              <button 
                onClick={() => setInput(getProblemTemplate(recursionType).large)}
                disabled={running}
                className="template-btn"
              >
                Large ({getProblemTemplate(recursionType).large})
              </button>
            </div>
          </div>
        )}
        
        <div className="control-row">
          <button onClick={startVisualization} disabled={running} className="start-btn">
            {running ? 'Visualizing...' : 'Start Visualization'}
          </button>
          
          {running && (
            <button onClick={() => setRunning(false)} className="stop-btn">
              Stop
            </button>
          )}
          
          <button onClick={resetVisualization} disabled={running} className="reset-btn">
            Reset
          </button>
        </div>
        
        <div className="control-row">
          <div className="control-group">
            <label>Speed: {201 - speed}ms</label>
            <input
              type="range"
              min="5"
              max="200"
              value={201 - speed}
              onChange={(e) => setSpeed(201 - parseInt(e.target.value))}
              disabled={running}
            />
          </div>
          
          <div className="control-group">
            <label htmlFor="showCallStack">
              <input 
                id="showCallStack"
                type="checkbox" 
                checked={showCallStack} 
                onChange={() => setShowCallStack(!showCallStack)}
              />
              Show Call Stack
            </label>
          </div>
          
          <div className="control-group">
            <label htmlFor="showTree">
              <input 
                id="showTree"
                type="checkbox" 
                checked={showTree} 
                onChange={() => setShowTree(!showTree)}
              />
              Show Tree
            </label>
          </div>
        </div>
      </div>
      
      <div className="visualization-container">
        {showCallStack && (
          <div className="call-stack-container">
            <h3>Call Stack</h3>
            <div className="call-stack">
              {callStack.length === 0 ? (
                <div className="empty-stack">Stack is empty</div>
              ) : (
                [...callStack].reverse().map((call, index) => (
                  <div 
                    key={index} 
                    className={`stack-frame ${currentCall && currentCall.id === call.id ? 'current' : ''}`}
                  >
                    <span className="function-name">
                      {recursionType === 'fibonacci' ? 'fib' : 'fact'}
                    </span>
                    <span className="function-args">({call.value})</span>
                    {call.result !== null && (
                      <span className="function-result">→ {call.result}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {showTree && (
          <div className="tree-container">
            <h3>Recursion Tree</h3>
            <svg ref={svgRef} className="call-tree"></svg>
          </div>
        )}
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
        <h3>{algorithm?.name || 'Recursion Algorithm'}</h3>
        <p>{algorithm?.description || 'Visualization of a recursive algorithm.'}</p>
        {completed && (
          <div className="completion-message">
            Recursion completed! 🎉
          </div>
        )}
      </div>
    </div>
  );
};

export default RecursionVisualizer;