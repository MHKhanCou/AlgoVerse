import React, { useState, useEffect, useRef } from 'react';
import './GraphVisualizer.css';

const GraphVisualizer = ({ algorithm }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(500);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('bfs');
  const [startNode, setStartNode] = useState(null);
  const [endNode, setEndNode] = useState(null);
  const [visitedNodes, setVisitedNodes] = useState([]);
  const [pathNodes, setPathNodes] = useState([]);
  const [currentNode, setCurrentNode] = useState(null);
  const [graphType, setGraphType] = useState('undirected');
  const [message, setMessage] = useState('');
  const [nodeCount, setNodeCount] = useState(8);
  const canvasRef = useRef(null);
  const animationTimeoutsRef = useRef([]);
  const isDraggingRef = useRef(false);
  const dragNodeRef = useRef(null);
  
  // Clear all animation timeouts
  const clearTimeouts = () => {
    animationTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    animationTimeoutsRef.current = [];
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
    
    // Draw the graph
    setTimeout(() => drawGraph(), 0);
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
    drawGraph();
  };
  
  // Initialize the canvas and graph
  useEffect(() => {
    if (canvasRef.current) {
      // Set canvas dimensions
      const container = canvasRef.current.parentElement;
      canvasRef.current.width = container.clientWidth;
      canvasRef.current.height = 400;
      
      // Generate initial graph
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
          if (e.shiftKey) {
            // Set as start node
            setStartNode(clickedNode.id);
            drawGraph();
          } else if (e.ctrlKey || e.metaKey) {
            // Set as end node
            setEndNode(clickedNode.id);
            drawGraph();
          } else {
            // Start dragging
            isDraggingRef.current = true;
            dragNodeRef.current = clickedNode.id;
          }
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
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('mouseleave', handleMouseUp);
      
      // Cleanup
      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('mouseleave', handleMouseUp);
        clearTimeouts();
      };
    }
  }, [nodes, startNode, endNode, graphType]);
  
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
        
        // Draw edge weight
        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText(edge.weight, midX, midY);
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
      } else {
        ctx.fillStyle = '#4a6ee0'; // Default color
      }
      
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw node border
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw node label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y);
    });
  };
  
  // BFS algorithm
  const bfs = () => {
    if (startNode === null) {
      setMessage('Please select a start node (Shift + Click)');
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
      setMessage('Please select a start node (Shift + Click)');
      return;
    }
    
    if (endNode === null) {
      setMessage('Please select an end node (Ctrl + Click)');
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
        <button onClick={generateRandomGraph} disabled={isAnimating}>
          Generate New Graph
        </button>
        
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
        
        <button onClick={startAlgorithm} disabled={isAnimating}>
          {isAnimating ? 'Running...' : 'Start Algorithm'}
        </button>
        
        <div className="control-group">
          <label htmlFor="speed">Speed:</label>
          <input 
            id="speed"
            type="range" 
            min="100" 
            max="1000" 
            value={animationSpeed} 
            onChange={(e) => setAnimationSpeed(1100 - parseInt(e.target.value))}
            disabled={isAnimating}
          />
        </div>
        
        <div className="control-group">
          <label htmlFor="nodes">Nodes:</label>
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
          <span>Start Node (Shift + Click)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#9c27b0' }}></div>
          <span>End Node (Ctrl + Click)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#ffca28' }}></div>
          <span>Visited Node</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#4caf50' }}></div>
          <span>Path Node</span>
        </div>
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