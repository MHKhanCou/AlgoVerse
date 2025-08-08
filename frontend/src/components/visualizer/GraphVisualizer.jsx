import React, { useState, useEffect, useRef } from 'react';
import './GraphVisualizer.css';

const GraphVisualizer = ({ algorithm, step, inputData, onPerformanceUpdate, onComplexityUpdate }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(500);
  const [operations, setOperations] = useState(0);
  const [comparisons, setComparisons] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('bfs');
  const [startNode, setStartNode] = useState(null);
  const [endNode, setEndNode] = useState(null);
  const [startNodeInput, setStartNodeInput] = useState('');
  const [endNodeInput, setEndNodeInput] = useState('');
  const [graphEditorMode, setGraphEditorMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [visitedNodes, setVisitedNodes] = useState([]);
  const [pathNodes, setPathNodes] = useState([]);
  const [currentNode, setCurrentNode] = useState(null);
  const [graphType, setGraphType] = useState('undirected');
  const [message, setMessage] = useState('');
  const [nodeCount, setNodeCount] = useState(8);
  const [inputMode, setInputMode] = useState('random');
  const [customGraph, setCustomGraph] = useState('');
  const [showWeights, setShowWeights] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [nextNodeId, setNextNodeId] = useState(0);
  const canvasRef = useRef(null);
  const animationTimeoutsRef = useRef([]);
  const isDraggingRef = useRef(false);
  const dragNodeRef = useRef(null);
  const connectingRef = useRef(false);
  const connectFromRef = useRef(null);
  
  // Clear all animation timeouts
  const clearTimeouts = () => {
    animationTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    animationTimeoutsRef.current = [];
  };

  // Add new node to graph
  const addNode = (x, y) => {
    const newNode = {
      id: nextNodeId,
      x: x,
      y: y,
      radius: 20,
      label: String.fromCharCode(65 + nextNodeId) // A, B, C, ...
    };
    setNodes(prev => [...prev, newNode]);
    setNextNodeId(prev => prev + 1);
    setTimeout(() => drawGraph(), 0);
  };

  // Remove selected node and its edges
  const removeNode = (nodeId) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setEdges(prev => prev.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
    setTimeout(() => drawGraph(), 0);
  };

  // Add edge between two nodes
  const addEdge = (sourceId, targetId, weight = 1) => {
    const newEdge = { source: sourceId, target: targetId, weight };
    setEdges(prev => {
      const newEdges = [...prev, newEdge];
      if (graphType === 'undirected') {
        newEdges.push({ source: targetId, target: sourceId, weight });
      }
      return newEdges;
    });
    setTimeout(() => drawGraph(), 0);
  };

  // Clear the entire graph
  const clearGraph = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setSelectedEdge(null);
    setNextNodeId(0);
    setStartNode(null);
    setEndNode(null);
    setStartNodeInput('');
    setEndNodeInput('');
    setTimeout(() => drawGraph(), 0);
  };
  
  // Generate graph based on input mode
  const generateGraph = () => {
    if (inputMode === 'custom') {
      generateCustomGraph();
    } else if (inputMode === 'editor') {
      clearGraph();
      setGraphEditorMode(true);
    } else {
      generateRandomGraph();
    }
  };

  // Generate a custom graph from user input
  const generateCustomGraph = () => {
    clearTimeouts();
    setIsAnimating(false);
    setCompleted(false);
    setVisitedNodes([]);
    setPathNodes([]);
    setCurrentNode(null);
    setStartNode(null);
    setEndNode(null);
    setMessage('');

    if (!customGraph.trim()) {
      generateRandomGraph();
      return;
    }

    try {
      // Parse custom graph input
      // Format: "A-B:5,B-C:3,A-C:8" (node1-node2:weight)
      const edgeStrings = customGraph.split(',').map(s => s.trim());
      const nodeSet = new Set();
      const newEdges = [];

      edgeStrings.forEach(edgeStr => {
        const [connection, weightStr] = edgeStr.split(':');
        const [source, target] = connection.split('-').map(s => s.trim().toUpperCase());
        const weight = weightStr ? parseInt(weightStr) : 1;

        if (source && target && source !== target) {
          nodeSet.add(source);
          nodeSet.add(target);
          
          // Convert letters to node IDs
          const sourceId = source.charCodeAt(0) - 65;
          const targetId = target.charCodeAt(0) - 65;
          
          newEdges.push({ source: sourceId, target: targetId, weight });
          
          if (graphType === 'undirected') {
            newEdges.push({ source: targetId, target: sourceId, weight });
          }
        }
      });

      // Create nodes from the parsed data
      const nodeArray = Array.from(nodeSet).sort();
      const canvasWidth = canvasRef.current.width;
      const canvasHeight = canvasRef.current.height;
      const padding = 50;
      
      const newNodes = nodeArray.map((label, index) => {
        const angle = (2 * Math.PI * index) / nodeArray.length;
        const radius = Math.min(canvasWidth, canvasHeight) / 3;
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        
        return {
          id: label.charCodeAt(0) - 65,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          radius: 20,
          label
        };
      });

      setNodes(newNodes);
      setEdges(newEdges);
      setNextNodeId(Math.max(...newNodes.map(n => n.id)) + 1);
      
      setTimeout(() => drawGraph(), 0);
    } catch (error) {
      console.error('Error parsing custom graph:', error);
      generateRandomGraph();
    }
  };

  // Generate a random graph
  const generateRandomGraph = () => {
    clearTimeouts();
    setIsAnimating(false);
    setCompleted(false);
    setVisitedNodes([]);
    setPathNodes([]);
    setCurrentNode(null);
    setStartNode(null);
    setEndNode(null);
    setMessage('');
    
    const newNodes = [];
    const canvasWidth = canvasRef.current.width;
    const canvasHeight = canvasRef.current.height;
    const padding = 50; // Padding from canvas edges
    
    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
      newNodes.push({
        id: i,
        x: Math.random() * (canvasWidth - 2 * padding) + padding,
        y: Math.random() * (canvasHeight - 2 * padding) + padding,
        radius: 20,
        label: String.fromCharCode(65 + i) // A, B, C, ...
      });
    }
    
    // Create edges
    const newEdges = [];
    const isDirected = graphType === 'directed';
    
    // For each node, connect to 1-3 other nodes
    newNodes.forEach(node => {
      const numConnections = Math.floor(Math.random() * 3) + 1;
      const connectedNodes = new Set();
      
      for (let i = 0; i < numConnections; i++) {
        let targetNodeId;
        do {
          targetNodeId = Math.floor(Math.random() * newNodes.length);
        } while (targetNodeId === node.id || connectedNodes.has(targetNodeId));
        
        connectedNodes.add(targetNodeId);
        
        // Add edge with random weight (1-10)
        const weight = Math.floor(Math.random() * 10) + 1;
        newEdges.push({
          source: node.id,
          target: targetNodeId,
          weight
        });
        
        // For undirected graphs, add the reverse edge
        if (!isDirected) {
          newEdges.push({
            source: targetNodeId,
            target: node.id,
            weight
          });
        }
      }
    });
    
    setNodes(newNodes);
    setEdges(newEdges);
    setNextNodeId(newNodes.length);
    
    // Draw the graph
    setTimeout(() => drawGraph(), 0);
  };

  // Get predefined graph templates
  const getGraphTemplate = (template) => {
    switch (template) {
      case 'linear':
        return 'A-B:1,B-C:2,C-D:3,D-E:4';
      case 'star':
        return 'A-B:1,A-C:2,A-D:3,A-E:4,A-F:5';
      case 'cycle':
        return 'A-B:1,B-C:2,C-D:3,D-E:4,E-A:5';
      case 'complete':
        return 'A-B:1,A-C:2,A-D:3,B-C:4,B-D:5,C-D:6';
      default:
        return '';
    }
  };
  
  // Reset the graph state
  const resetGraph = () => {
    clearTimeouts();
    setIsAnimating(false);
    setCompleted(false);
    setVisitedNodes([]);
    setPathNodes([]);
    setCurrentNode(null);
    setMessage('');
    if (canvasRef.current) {
      drawGraph();
    }
  };
  
  // Initialize the canvas and graph
  useEffect(() => {
    if (canvasRef.current && nodes.length === 0) {
      // Set canvas dimensions
      const container = canvasRef.current.parentElement;
      canvasRef.current.width = container.clientWidth;
      canvasRef.current.height = 400;
      
      // Generate initial graph only once
      generateRandomGraph();
      
      // Add event listeners for node interaction
      const canvas = canvasRef.current;
      
      const handleMouseDown = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Check if a node was clicked
        const clickedNode = nodes.find(node => {
          const dx = mouseX - node.x;
          const dy = mouseY - node.y;
          return Math.sqrt(dx * dx + dy * dy) <= node.radius;
        });
        
        if (clickedNode) {
          if (graphEditorMode) {
            if (e.shiftKey && selectedNode !== null && selectedNode !== clickedNode.id) {
              // Shift+click to connect nodes
              const weight = prompt('Enter edge weight (default: 1):', '1');
              const edgeWeight = parseInt(weight) || 1;
              addEdge(selectedNode, clickedNode.id, edgeWeight);
              setSelectedNode(null);
            } else {
              // Select node for editing
              setSelectedNode(clickedNode.id);
              drawGraph();
            }
            return;
          } else {
            // In visualization mode, allow dragging
            isDraggingRef.current = true;
            dragNodeRef.current = clickedNode.id;
          }
        } else if (graphEditorMode) {
          // Click on empty space to add new node
          addNode(mouseX, mouseY);
        }
      };

      const handleDoubleClick = (e) => {
        if (!graphEditorMode) return;
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Check if clicking on empty space
        const clickedNode = nodes.find(node => {
          const dx = mouseX - node.x;
          const dy = mouseY - node.y;
          return Math.sqrt(dx * dx + dy * dy) <= node.radius;
        });
        
        if (!clickedNode) {
          addNode(mouseX, mouseY);
        }
      };

      const handleKeyDown = (e) => {
        if (graphEditorMode && selectedNode !== null && e.key === 'Delete') {
          removeNode(selectedNode);
        }
      };
      
      const handleMouseMove = (e) => {
        if (isDraggingRef.current && dragNodeRef.current !== null) {
          const rect = canvas.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          setNodes(prevNodes => {
            const newNodes = [...prevNodes];
            const nodeIndex = newNodes.findIndex(node => node.id === dragNodeRef.current);
            
            if (nodeIndex !== -1) {
              newNodes[nodeIndex] = {
                ...newNodes[nodeIndex],
                x: mouseX,
                y: mouseY
              };
            }
            
            return newNodes;
          });
          
          drawGraph();
        }
      };
      
      const handleMouseUp = () => {
        isDraggingRef.current = false;
        dragNodeRef.current = null;
      };
      
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('dblclick', handleDoubleClick);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('mouseleave', handleMouseUp);
      document.addEventListener('keydown', handleKeyDown);
      
      // Cleanup
      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('dblclick', handleDoubleClick);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('mouseleave', handleMouseUp);
        document.removeEventListener('keydown', handleKeyDown);
        clearTimeouts();
      };
    }
  }, [nodes, startNode, endNode, graphType, graphEditorMode, selectedNode]);
  
  // Draw the graph on the canvas
  const drawGraph = () => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    const canvas = canvasRef.current;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw edges
    edges.forEach(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source);
      const targetNode = nodes.find(node => node.id === edge.target);
      
      if (sourceNode && targetNode) {
        ctx.beginPath();
        
        // Set edge color based on path
        if (pathNodes.includes(edge.source) && pathNodes.includes(edge.target) &&
            pathNodes.indexOf(edge.target) === pathNodes.indexOf(edge.source) + 1) {
          ctx.strokeStyle = '#4caf50'; // Green for path
          ctx.lineWidth = 3;
        } else {
          ctx.strokeStyle = '#aaa';
          ctx.lineWidth = 1;
        }
        
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.stroke();
        
        // Draw arrow for directed graphs
        if (graphType === 'directed') {
          const angle = Math.atan2(targetNode.y - sourceNode.y, targetNode.x - sourceNode.x);
          const arrowLength = 10;
          const arrowX = targetNode.x - targetNode.radius * Math.cos(angle);
          const arrowY = targetNode.y - targetNode.radius * Math.sin(angle);
          
          ctx.beginPath();
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(
            arrowX - arrowLength * Math.cos(angle - Math.PI / 6),
            arrowY - arrowLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            arrowX - arrowLength * Math.cos(angle + Math.PI / 6),
            arrowY - arrowLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fill();
        }
        
        // Draw edge weight if enabled
        if (showWeights) {
          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;
          ctx.fillStyle = '#333';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Add background for better readability
          const text = edge.weight.toString();
          const textMetrics = ctx.measureText(text);
          const padding = 4;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(
            midX - textMetrics.width / 2 - padding,
            midY - 8,
            textMetrics.width + padding * 2,
            16
          );
          
          ctx.fillStyle = '#333';
          ctx.fillText(text, midX, midY);
        }
      }
    });
    
    // Draw nodes
    nodes.forEach(node => {
      ctx.beginPath();
      
      // Set node color based on state
      if (node.id === currentNode) {
        ctx.fillStyle = '#ff5252'; // Red for current node
      } else if (node.id === startNode) {
        ctx.fillStyle = '#2196f3'; // Blue for start node
      } else if (node.id === endNode) {
        ctx.fillStyle = '#9c27b0'; // Purple for end node
      } else if (pathNodes.includes(node.id)) {
        ctx.fillStyle = '#4caf50'; // Green for path nodes
      } else if (visitedNodes.includes(node.id)) {
        ctx.fillStyle = '#ffca28'; // Yellow for visited nodes
      } else if (graphEditorMode && node.id === selectedNode) {
        ctx.fillStyle = '#ff9800'; // Orange for selected node in editor
      } else {
        ctx.fillStyle = '#4a6ee0'; // Default color
      }
      
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw node border
      ctx.strokeStyle = graphEditorMode && node.id === selectedNode ? '#ff5722' : '#333';
      ctx.lineWidth = graphEditorMode && node.id === selectedNode ? 3 : 2;
      ctx.stroke();
      
      // Draw node label if enabled
      if (showLabels) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y);
      }
    });
  };
  
  // BFS algorithm
  const bfs = () => {
    if (startNode === null) {
      setMessage('Please enter a start node');
      return;
    }
    
    resetGraph();
    setIsAnimating(true);
    
    const animations = [];
    const visited = new Set();
    const queue = [startNode];
    visited.add(startNode);
    animations.push({ type: 'visit', nodeId: startNode });
    
    while (queue.length > 0) {
      const current = queue.shift();
      animations.push({ type: 'process', nodeId: current });
      
      // If we found the end node, stop
      if (endNode !== null && current === endNode) {
        break;
      }
      
      // Get all adjacent nodes
      const adjacentEdges = edges.filter(edge => edge.source === current);
      
      for (const edge of adjacentEdges) {
        if (!visited.has(edge.target)) {
          visited.add(edge.target);
          queue.push(edge.target);
          animations.push({ type: 'visit', nodeId: edge.target, from: current });
        }
      }
    }
    
    playAnimations(animations);
  };
  
  // Dijkstra's algorithm
  const dijkstra = () => {
    if (startNode === null) {
      setMessage('Please enter a start node');
      return;
    }
    
    if (endNode === null) {
      setMessage('Please enter an end node');
      return;
    }
    
    resetGraph();
    setIsAnimating(true);
    
    const animations = [];
    const distances = {};
    const previous = {};
    const unvisited = new Set();
    const path = [];
    
    // Initialize distances
    nodes.forEach(node => {
      distances[node.id] = Infinity;
      previous[node.id] = null;
      unvisited.add(node.id);
    });
    distances[startNode] = 0;
    
    animations.push({ type: 'visit', nodeId: startNode });
    
    while (unvisited.size > 0) {
      // Find node with minimum distance
      let current = null;
      let minDistance = Infinity;
      
      for (const nodeId of unvisited) {
        if (distances[nodeId] < minDistance) {
          minDistance = distances[nodeId];
          current = nodeId;
        }
      }
      
      // If we can't find a node or we found the end node, break
      if (current === null || current === endNode || distances[current] === Infinity) {
        break;
      }
      
      animations.push({ type: 'process', nodeId: current });
      unvisited.delete(current);
      
      // Update distances to neighbors
      const adjacentEdges = edges.filter(edge => edge.source === current);
      
      for (const edge of adjacentEdges) {
        const neighbor = edge.target;
        
        if (unvisited.has(neighbor)) {
          const tentativeDistance = distances[current] + edge.weight;
          
          if (tentativeDistance < distances[neighbor]) {
            distances[neighbor] = tentativeDistance;
            previous[neighbor] = current;
            animations.push({ type: 'visit', nodeId: neighbor, from: current });
          }
        }
      }
    }
    
    // Reconstruct path if end node was reached
    if (previous[endNode] !== null || endNode === startNode) {
      let current = endNode;
      while (current !== null) {
        path.unshift(current);
        current = previous[current];
      }
      
      animations.push({ type: 'path', path });
    }
    
    playAnimations(animations);
  };
  
  // Play the animations
  const playAnimations = (animations) => {
    const visitedSet = new Set();
    const pathSet = [];
    
    animations.forEach((animation, index) => {
      const timeout = setTimeout(() => {
        if (animation.type === 'visit') {
          visitedSet.add(animation.nodeId);
          setVisitedNodes([...visitedSet]);
        } else if (animation.type === 'process') {
          setCurrentNode(animation.nodeId);
        } else if (animation.type === 'path') {
          setPathNodes(animation.path);
        }
        
        drawGraph();
        
        // Check if this is the last animation
        if (index === animations.length - 1) {
          setTimeout(() => {
            setCurrentNode(null);
            setIsAnimating(false);
            setCompleted(true);
            
            if (selectedAlgorithm === 'dijkstra' && pathNodes.length > 0) {
              // Calculate total path weight
              let totalWeight = 0;
              for (let i = 0; i < pathNodes.length - 1; i++) {
                const edge = edges.find(
                  e => e.source === pathNodes[i] && e.target === pathNodes[i + 1]
                );
                if (edge) totalWeight += edge.weight;
              }
              setMessage(`Shortest path found! Total weight: ${totalWeight}`);
            } else if (selectedAlgorithm === 'bfs' && endNode !== null && pathNodes.includes(endNode)) {
              setMessage('Path found!');
            } else if (selectedAlgorithm === 'dijkstra' && endNode !== null && !pathNodes.includes(endNode)) {
              setMessage('No path exists to the target node.');
            }
          }, animationSpeed);
        }
      }, index * animationSpeed);
      
      animationTimeoutsRef.current.push(timeout);
    });
  };
  
  // Start the selected algorithm
  const startAlgorithm = () => {
    if (isAnimating) return;
    
    switch (selectedAlgorithm) {
      case 'bfs':
        bfs();
        break;
      case 'dijkstra':
        dijkstra();
        break;
      default:
        bfs();
    }
  };
  
  return (
    <div className="graph-visualizer">
      <div className="visualizer-controls">
        <div className="control-row">
          <div className="control-group">
            <label htmlFor="inputMode">Input Mode:</label>
            <select 
              id="inputMode"
              value={inputMode} 
              onChange={(e) => setInputMode(e.target.value)}
              disabled={isAnimating}
            >
              <option value="random">Random Graph</option>
              <option value="custom">Custom Graph</option>
              <option value="editor">Graph Editor</option>
            </select>
          </div>
          
          <div className="control-group">
            <label htmlFor="graphType">Graph Type:</label>
            <select 
              id="graphType"
              value={graphType} 
              onChange={(e) => setGraphType(e.target.value)}
              disabled={isAnimating}
            >
              <option value="undirected">Undirected</option>
              <option value="directed">Directed</option>
            </select>
          </div>
          
          <div className="control-group">
            <label htmlFor="algorithm">Algorithm:</label>
            <select 
              id="algorithm"
              value={selectedAlgorithm} 
              onChange={(e) => setSelectedAlgorithm(e.target.value)}
              disabled={isAnimating}
            >
              <option value="bfs">Breadth-First Search</option>
              <option value="dijkstra">Dijkstra's Algorithm</option>
            </select>
          </div>
        </div>

        {inputMode === 'custom' && (
          <div className="control-row">
            <div className="control-group custom-input-group">
              <label htmlFor="customGraph">Custom Graph (Format: A-B:5,B-C:3,C-D:2):</label>
              <input 
                id="customGraph"
                type="text" 
                value={customGraph}
                onChange={(e) => setCustomGraph(e.target.value)}
                placeholder="A-B:5,B-C:3,C-D:2"
                disabled={isAnimating}
              />
            </div>
            
            <div className="template-buttons">
              <button 
                onClick={() => setCustomGraph(getGraphTemplate('linear'))}
                disabled={isAnimating}
                className="template-btn"
              >
                Linear
              </button>
              <button 
                onClick={() => setCustomGraph(getGraphTemplate('star'))}
                disabled={isAnimating}
                className="template-btn"
              >
                Star
              </button>
              <button 
                onClick={() => setCustomGraph(getGraphTemplate('cycle'))}
                disabled={isAnimating}
                className="template-btn"
              >
                Cycle
              </button>
              <button 
                onClick={() => setCustomGraph(getGraphTemplate('complete'))}
                disabled={isAnimating}
                className="template-btn"
              >
                Complete
              </button>
            </div>
          </div>
        )}

        {inputMode === 'editor' && (
          <div className="control-row">
            <div className="control-group">
              <label>Graph Editor:</label>
              <div className="editor-buttons">
                <button 
                  onClick={() => setGraphEditorMode(!graphEditorMode)}
                  disabled={isAnimating}
                  className={`editor-btn ${graphEditorMode ? 'active' : ''}`}
                >
                  {graphEditorMode ? 'Exit Editor' : 'Enter Editor'}
                </button>
                <button 
                  onClick={clearGraph}
                  disabled={isAnimating || !graphEditorMode}
                  className="clear-btn"
                >
                  Clear Graph
                </button>
              </div>
            </div>
            {graphEditorMode && (
              <div className="editor-instructions">
                <p>• Click to add nodes • Click nodes to select • Shift+Click to connect • Delete key to remove</p>
              </div>
            )}
          </div>
        )}
        
        <div className="control-row">
          <div className="control-group">
            <label htmlFor="startNodeInput">Start Node:</label>
            <input
              id="startNodeInput"
              type="text"
              value={startNodeInput}
              onChange={(e) => setStartNodeInput(e.target.value.toUpperCase())}
              placeholder="Enter node (e.g., A)"
              disabled={isAnimating}
              maxLength={1}
            />
          </div>
          
          <div className="control-group">
            <label htmlFor="endNodeInput">End Node:</label>
            <input
              id="endNodeInput"
              type="text"
              value={endNodeInput}
              onChange={(e) => setEndNodeInput(e.target.value.toUpperCase())}
              placeholder="Enter node (e.g., B)"
              disabled={isAnimating}
              maxLength={1}
            />
          </div>
          
          <button 
            onClick={() => {
              // Find and set start node
              if (startNodeInput) {
                const startNodeId = startNodeInput.charCodeAt(0) - 65;
                const foundStartNode = nodes.find(n => n.id === startNodeId);
                if (foundStartNode) {
                  setStartNode(startNodeId);
                } else {
                  setMessage(`Node ${startNodeInput} not found in graph`);
                  setTimeout(() => setMessage(''), 3000);
                }
              }
              
              // Find and set end node
              if (endNodeInput) {
                const endNodeId = endNodeInput.charCodeAt(0) - 65;
                const foundEndNode = nodes.find(n => n.id === endNodeId);
                if (foundEndNode) {
                  setEndNode(endNodeId);
                } else {
                  setMessage(`Node ${endNodeInput} not found in graph`);
                  setTimeout(() => setMessage(''), 3000);
                }
              }
              
              drawGraph();
            }}
            disabled={isAnimating}
            className="set-nodes-btn"
          >
            Set Nodes
          </button>
        </div>
        
        <div className="control-row">
          <button onClick={generateGraph} disabled={isAnimating} className="generate-btn">
            {inputMode === 'editor' ? 'New Graph' : 'Generate Graph'}
          </button>
          
          <button onClick={startAlgorithm} disabled={isAnimating} className="start-btn">
            {isAnimating ? 'Running...' : 'Start Algorithm'}
          </button>
          
          {isAnimating && (
            <button onClick={() => { clearTimeouts(); setIsAnimating(false); }} className="stop-btn">
              Stop
            </button>
          )}
          
          <button onClick={resetGraph} disabled={isAnimating} className="reset-btn">
            Reset
          </button>
        </div>
        
        <div className="control-row">
          <div className="control-group">
            <label htmlFor="speed">Speed: {201 - (animationSpeed / 5)}ms</label>
            <input 
              id="speed"
              type="range" 
              min="5" 
              max="200" 
              value={201 - (animationSpeed / 5)} 
              onChange={(e) => setAnimationSpeed((201 - parseInt(e.target.value)) * 5)}
              disabled={isAnimating}
            />
          </div>
          
          {inputMode !== 'custom' && inputMode !== 'editor' && (
            <div className="control-group">
              <label htmlFor="nodes">Nodes: {nodeCount}</label>
              <input 
                id="nodes"
                type="range" 
                min="4" 
                max="15" 
                value={nodeCount} 
                onChange={(e) => setNodeCount(parseInt(e.target.value))}
                disabled={isAnimating}
              />
            </div>
          )}
          
          <div className="control-group">
            <label htmlFor="showWeights">
              <input 
                id="showWeights"
                type="checkbox" 
                checked={showWeights} 
                onChange={() => setShowWeights(!showWeights)}
              />
              Show Weights
            </label>
          </div>
          
          <div className="control-group">
            <label htmlFor="showLabels">
              <input 
                id="showLabels"
                type="checkbox" 
                checked={showLabels} 
                onChange={() => setShowLabels(!showLabels)}
              />
              Show Labels
            </label>
          </div>
        </div>
      </div>
      
      <div className="graph-container">
        <canvas ref={canvasRef}></canvas>
        
        {message && (
          <div className="graph-message">{message}</div>
        )}
      </div>
      
      <div className="graph-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#2196f3' }}></div>
          <span>Start Node</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#9c27b0' }}></div>
          <span>End Node</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#ffca28' }}></div>
          <span>Visited Node</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#4caf50' }}></div>
          <span>Path Node</span>
        </div>
        {graphEditorMode && (
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ff9800' }}></div>
            <span>Selected Node</span>
          </div>
        )}
      </div>
      
      <div className="algorithm-info">
        <h4>{selectedAlgorithm === 'bfs' ? 'Breadth-First Search' : 'Dijkstra\'s Algorithm'}</h4>
        <p>
          <strong>Time Complexity:</strong> {selectedAlgorithm === 'bfs' ? 'O(V + E)' : 'O((V + E) log V)'}
        </p>
        <p>
          <strong>Space Complexity:</strong> {selectedAlgorithm === 'bfs' ? 'O(V)' : 'O(V)'}
        </p>
        <p>
          {selectedAlgorithm === 'bfs' 
            ? 'BFS explores all neighbor nodes at the present depth before moving to nodes at the next depth level.'
            : 'Dijkstra\'s algorithm finds the shortest path between nodes in a graph with non-negative edge weights.'}
        </p>
      </div>
      
      {completed && !message && (
        <div className="completion-message">
          Algorithm execution completed!
        </div>
      )}
    </div>
  );
};

export default GraphVisualizer;