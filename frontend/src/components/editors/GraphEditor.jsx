import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  // eslint-disable-next-line no-unused-vars
  addEdge,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  MousePointer2, Plus, Trash2, Link, Weight, Undo2, Redo2,
  RotateCcw, Download, Upload, Shuffle,
} from 'lucide-react';
import './GraphEditor.css';

/**
 * AlgoVerse V2 — Graph Editor
 *
 * Full-featured interactive graph editor.
 * Create nodes, connect edges, set weights, drag to reposition.
 * Inspired by Graphisual and CS Academy graph editors.
 */

// Custom node component for the editor with Handle components
const EditorNode = ({ data, selected }) => {
  return (
    <div
      className={`editor-node ${selected ? 'selected' : ''}`}
      style={{
        borderColor: selected ? 'var(--primary, #8b5cf6)' : 'var(--border-primary, #475569)',
      }}
    >
      <Handle type="target" position={Position.Left} id="target" />
      <span className="editor-node-label">{data.label}</span>
      <Handle type="source" position={Position.Right} id="source" />
    </div>
  );
};

const nodeTypes = { editor: EditorNode };

// Helper: Convert ReactFlow nodes to flat format {id, label, x, y}
const toFlatFormat = (nodes, edges) => ({
  nodes: nodes.map(n => ({
    id: n.id,
    label: n.data?.label || n.id,
    x: n.position?.x || 0,
    y: n.position?.y || 0,
  })),
  edges: edges.map(e => ({
    source: e.source,
    target: e.target,
    weight: e.label ? parseInt(e.label) : undefined,
  })),
});

const GraphEditor = ({
  initialGraph = { nodes: [], edges: [] },
  onGraphChange,
  height = '100%',
}) => {
  // Editor state
  const [mode, setMode] = useState('select'); // 'select' | 'addNode' | 'addEdge' | 'delete' | 'weight'
  const [directed, setDirected] = useState(false);
  const [weighted, setWeighted] = useState(true);
  const [nextNodeId, setNextNodeId] = useState(0);
  const [connectFrom, setConnectFrom] = useState(null);

  // Undo/redo stacks
  const [history, setHistory] = useState([{ nodes: initialGraph.nodes, edges: initialGraph.edges }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialGraph.nodes.map(n => ({
      id: String(n.id),
      type: 'editor',
      position: { x: n.x || 0, y: n.y || 0 },
      data: { label: n.label || n.id },
      draggable: mode === 'select',
    }))
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialGraph.edges.map(e => ({
      ...e,
      id: `${e.source}-${e.target}`,
      source: String(e.source),
      target: String(e.target),
      type: 'default',
      animated: false,
      style: { stroke: 'var(--border-primary, #475569)', strokeWidth: 2 },
      markerEnd: directed ? { type: MarkerType.ArrowClosed, color: 'var(--border-primary, #475569)' } : undefined,
      label: e.weight ? String(e.weight) : undefined,
      labelStyle: { fill: 'var(--text-primary, #f8fafc)', fontWeight: 'bold', fontSize: 12 },
      labelBgStyle: { fill: 'var(--bg-primary, #0f172a)', fillOpacity: 0.9 },
    }))
  );

  // Save state to history for undo/redo
  const saveToHistory = useCallback((newNodes, newEdges) => {
    const snapshot = { nodes: newNodes, edges: newEdges };
    setHistory(prev => [...prev.slice(0, historyIndex + 1), snapshot]);
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    setNodes(prev.nodes.map(n => ({ ...n, type: 'editor', draggable: mode === 'select' })));
    setEdges(prev.edges);
    setHistoryIndex(prev => prev - 1);
  }, [history, historyIndex, mode, setNodes, setEdges]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    setNodes(next.nodes.map(n => ({ ...n, type: 'editor', draggable: mode === 'select' })));
    setEdges(next.edges);
    setHistoryIndex(prev => prev + 1);
  }, [history, historyIndex, mode, setNodes, setEdges]);

  // Add node at position
  const addNode = useCallback((x, y) => {
    const label = String.fromCharCode(65 + (nextNodeId % 26)) + (nextNodeId >= 26 ? Math.floor(nextNodeId / 26) : '');
    const newNode = {
      id: String(nextNodeId),
      type: 'editor',
      position: { x, y },
      data: { label },
      draggable: mode === 'select',
    };
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    setNextNodeId(prev => prev + 1);
    saveToHistory(newNodes, edges);
    onGraphChange?.(toFlatFormat(newNodes, edges));
  }, [nodes, edges, nextNodeId, mode, setNodes, saveToHistory, onGraphChange]);

  // Delete node
  const deleteNode = useCallback((nodeId) => {
    const newNodes = nodes.filter(n => n.id !== nodeId);
    const newEdges = edges.filter(e => e.source !== nodeId && e.target !== nodeId);
    setNodes(newNodes);
    setEdges(newEdges);
    saveToHistory(newNodes, newEdges);
    onGraphChange?.(toFlatFormat(newNodes, newEdges));
  }, [nodes, edges, setNodes, setEdges, saveToHistory, onGraphChange]);

  // Delete edge
  const deleteEdge = useCallback((edgeId) => {
    const newEdges = edges.filter(e => e.id !== edgeId);
    setEdges(newEdges);
    saveToHistory(nodes, newEdges);
    onGraphChange?.({ nodes, edges: newEdges });
  }, [nodes, edges, setEdges, saveToHistory, onGraphChange]);

  // Handle canvas click
  const onPaneClick = useCallback((event) => {
    if (mode === 'addNode') {
      const rect = event.target.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      addNode(x, y);
    } else if (mode === 'select') {
      setConnectFrom(null);
    }
  }, [mode, addNode]);

  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    if (mode === 'delete') {
      deleteNode(node.id);
    } else if (mode === 'addEdge') {
      if (connectFrom === null) {
        setConnectFrom(node.id);
      } else if (connectFrom !== node.id) {
        // Add edge
        const weight = weighted ? (prompt('Enter edge weight:', '1') || '1') : undefined;
        const newEdge = {
          id: `${connectFrom}-${node.id}`,
          source: connectFrom,
          target: node.id,
          type: 'default',
          animated: false,
          style: { stroke: 'var(--border-primary, #475569)', strokeWidth: 2 },
          markerEnd: directed ? { type: MarkerType.ArrowClosed, color: 'var(--border-primary, #475569)' } : undefined,
          label: weight ? String(weight) : undefined,
          labelStyle: { fill: 'var(--text-primary, #f8fafc)', fontWeight: 'bold', fontSize: 12 },
          labelBgStyle: { fill: 'var(--bg-primary, #0f172a)', fillOpacity: 0.9 },
        };
        const newEdges = [...edges, newEdge];
        setEdges(newEdges);
        setConnectFrom(null);
        saveToHistory(nodes, newEdges);
        onGraphChange?.({ nodes, edges: newEdges });
      }
    } else if (mode === 'weight') {
      // Set weight on connected edges
      const nodeId = node.id;
      const connectedEdges = edges.filter(e => e.source === nodeId || e.target === nodeId);
      if (connectedEdges.length > 0) {
        const weight = prompt('Enter edge weight:', '1');
        if (weight !== null) {
          const newEdges = edges.map(e => {
            if (e.source === nodeId || e.target === nodeId) {
              return { ...e, label: String(weight) };
            }
            return e;
          });
          setEdges(newEdges);
          saveToHistory(nodes, newEdges);
          onGraphChange?.({ nodes, edges: newEdges });
        }
      }
    }
  }, [mode, connectFrom, edges, nodes, directed, weighted, setEdges, saveToHistory, onGraphChange, deleteNode]);

  // Handle edge click (for delete mode)
  const onEdgeClick = useCallback((event, edge) => {
    if (mode === 'delete') {
      deleteEdge(edge.id);
    } else if (mode === 'weight') {
      const weight = prompt('Enter edge weight:', edge.label || '1');
      if (weight !== null) {
        const newEdges = edges.map(e => {
          if (e.id === edge.id) {
            return { ...e, label: String(weight) };
          }
          return e;
        });
        setEdges(newEdges);
        saveToHistory(nodes, newEdges);
        onGraphChange?.({ nodes, edges: newEdges });
      }
    }
  }, [mode, edges, nodes, setEdges, saveToHistory, onGraphChange, deleteEdge]);

  // Handle node drag end
  const onNodeDragEnd = useCallback((event, node) => {
    const newNodes = nodes.map(n =>
      n.id === node.id ? { ...n, position: node.position } : n
    );
    setNodes(newNodes);
    saveToHistory(newNodes, edges);
    onGraphChange?.(toFlatFormat(newNodes, edges));
  }, [nodes, edges, setNodes, saveToHistory, onGraphChange]);

  // Clear graph
  const clearGraph = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setNextNodeId(0);
    saveToHistory([], []);
    onGraphChange?.({ nodes: [], edges: [] });
  }, [setNodes, setEdges, saveToHistory, onGraphChange]);

  // Generate random graph
  const generateRandom = useCallback((nodeCount = 6) => {
    const newNodes = [];
    const newEdges = [];
    const radius = 150;
    const centerX = 250;
    const centerY = 150;

    for (let i = 0; i < nodeCount; i++) {
      const angle = (2 * Math.PI * i) / nodeCount;
      newNodes.push({
        id: String(i),
        type: 'editor',
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
        data: { label: String.fromCharCode(65 + (i % 26)) },
        draggable: mode === 'select',
      });
    }

    // Add edges (connect each node to the next, and some random ones)
    for (let i = 0; i < nodeCount; i++) {
      const target = (i + 1) % nodeCount;
      const weight = weighted ? String(Math.floor(Math.random() * 10) + 1) : undefined;
      newEdges.push({
        id: `${i}-${target}`,
        source: String(i),
        target: String(target),
        type: 'default',
        animated: false,
        style: { stroke: 'var(--border-primary, #475569)', strokeWidth: 2 },
        markerEnd: directed ? { type: MarkerType.ArrowClosed, color: 'var(--border-primary, #475569)' } : undefined,
        label: weight,
        labelStyle: { fill: 'var(--text-primary, #f8fafc)', fontWeight: 'bold', fontSize: 12 },
        labelBgStyle: { fill: 'var(--bg-primary, #0f172a)', fillOpacity: 0.9 },
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
    setNextNodeId(nodeCount);
    saveToHistory(newNodes, newEdges);
    onGraphChange?.(toFlatFormat(newNodes, newEdges));
  }, [mode, directed, weighted, setNodes, setEdges, saveToHistory, onGraphChange]);

  // Export graph as JSON
  const exportGraph = useCallback(() => {
    const graph = {
      nodes: nodes.map(n => ({ id: n.id, label: n.data.label, x: n.position.x, y: n.position.y })),
      edges: edges.map(e => ({ source: e.source, target: e.target, weight: e.label ? parseInt(e.label) : undefined })),
    };
    const json = JSON.stringify(graph, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  // Import graph from JSON
  const importGraph = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const graph = JSON.parse(event.target.result);
          const newNodes = graph.nodes.map(n => ({
            id: String(n.id),
            type: 'editor',
            position: { x: n.x || 0, y: n.y || 0 },
            data: { label: n.label || n.id },
            draggable: mode === 'select',
          }));
          const newEdges = (graph.edges || []).map(e => ({
            ...e,
            id: `${e.source}-${e.target}`,
            source: String(e.source),
            target: String(e.target),
            type: 'default',
            animated: false,
            style: { stroke: 'var(--border-primary, #475569)', strokeWidth: 2 },
            markerEnd: directed ? { type: MarkerType.ArrowClosed, color: 'var(--border-primary, #475569)' } : undefined,
            label: e.weight ? String(e.weight) : undefined,
            labelStyle: { fill: 'var(--text-primary, #f8fafc)', fontWeight: 'bold', fontSize: 12 },
            labelBgStyle: { fill: 'var(--bg-primary, #0f172a)', fillOpacity: 0.9 },
          }));
          setNodes(newNodes);
          setEdges(newEdges);
          setNextNodeId(newNodes.length);
          saveToHistory(newNodes, newEdges);
          onGraphChange?.(toFlatFormat(newNodes, newEdges));
        } catch (err) {
          console.error('Failed to import graph:', err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [mode, directed, setNodes, setEdges, saveToHistory, onGraphChange]);

  // Get current graph data
  const getCurrentGraph = useCallback(() => ({
    nodes: nodes.map(n => ({ id: n.id, label: n.data.label, x: n.position.x, y: n.position.y })),
    edges: edges.map(e => ({ source: e.source, target: e.target, weight: e.label ? parseInt(e.label) : undefined })),
  }), [nodes, edges]);

  // Expose getCurrentGraph via ref or callback
  React.useImperativeHandle(React.useRef(), () => ({
    getGraph: getCurrentGraph,
  }));

  return (
    <div className="graph-editor" style={{ height }}>
      {/* Toolbar */}
      <div className="graph-editor-toolbar">
        <div className="graph-editor-modes">
          <button
            className={`graph-editor-mode-btn ${mode === 'select' ? 'active' : ''}`}
            onClick={() => { setMode('select'); setConnectFrom(null); }}
            title="Select & Drag (S)"
          >
            <MousePointer2 size={16} />
          </button>
          <button
            className={`graph-editor-mode-btn ${mode === 'addNode' ? 'active' : ''}`}
            onClick={() => { setMode('addNode'); setConnectFrom(null); }}
            title="Add Node (N)"
          >
            <Plus size={16} />
          </button>
          <button
            className={`graph-editor-mode-btn ${mode === 'addEdge' ? 'active' : ''}`}
            onClick={() => { setMode('addEdge'); setConnectFrom(null); }}
            title="Add Edge (E)"
          >
            <Link size={16} />
          </button>
          <button
            className={`graph-editor-mode-btn ${mode === 'delete' ? 'active' : ''}`}
            onClick={() => { setMode('delete'); setConnectFrom(null); }}
            title="Delete (D)"
          >
            <Trash2 size={16} />
          </button>
          <button
            className={`graph-editor-mode-btn ${mode === 'weight' ? 'active' : ''}`}
            onClick={() => { setMode('weight'); setConnectFrom(null); }}
            title="Set Weight (W)"
          >
            <Weight size={16} />
          </button>
        </div>

        <div className="graph-editor-separator" />

        <div className="graph-editor-options">
          <label className="graph-editor-checkbox">
            <input type="checkbox" checked={directed} onChange={(e) => setDirected(e.target.checked)} />
            Directed
          </label>
          <label className="graph-editor-checkbox">
            <input type="checkbox" checked={weighted} onChange={(e) => setWeighted(e.target.checked)} />
            Weighted
          </label>
        </div>

        <div className="graph-editor-separator" />

        <div className="graph-editor-actions">
          <button onClick={undo} disabled={historyIndex <= 0} className="graph-editor-action-btn" title="Undo">
            <Undo2 size={14} />
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="graph-editor-action-btn" title="Redo">
            <Redo2 size={14} />
          </button>
          <button onClick={() => generateRandom()} className="graph-editor-action-btn" title="Random Graph">
            <Shuffle size={14} />
          </button>
          <button onClick={clearGraph} className="graph-editor-action-btn" title="Clear">
            <RotateCcw size={14} />
          </button>
          <button onClick={exportGraph} className="graph-editor-action-btn" title="Export JSON">
            <Download size={14} />
          </button>
          <button onClick={importGraph} className="graph-editor-action-btn" title="Import JSON">
            <Upload size={14} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="graph-editor-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onPaneClick={onPaneClick}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onNodeDragEnd={onNodeDragEnd}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={mode === 'select'}
          nodesConnectable={false}
          elementsSelectable={mode === 'select'}
        >
          <Background color="var(--border-primary, #334155)" gap={20} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {/* Mode indicator */}
      <div className="graph-editor-mode-indicator">
        {mode === 'select' && 'Select & Drag'}
        {mode === 'addNode' && 'Click to add node'}
        {mode === 'addEdge' && (connectFrom ? `Click target node (from: ${connectFrom})` : 'Click source node')}
        {mode === 'delete' && 'Click to delete'}
        {mode === 'weight' && 'Click node/edge to set weight'}
      </div>

      {/* Keyboard shortcuts */}
      <div className="graph-editor-shortcuts">
        <span><kbd>S</kbd> Select</span>
        <span><kbd>N</kbd> Add Node</span>
        <span><kbd>E</kbd> Add Edge</span>
        <span><kbd>D</kbd> Delete</span>
        <span><kbd>W</kbd> Weight</span>
      </div>
    </div>
  );
};

export default GraphEditor;
