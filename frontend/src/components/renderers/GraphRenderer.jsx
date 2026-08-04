import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useVisualizationStore from '../../engine/state';
import './GraphRenderer.css';

/**
 * AlgoVerse V2 — Graph Renderer (React Flow)
 *
 * Renders graphs with nodes, edges, and algorithm visualization state.
 * Uses controlled React Flow (no useNodesState/useEdgesState to avoid infinite loops).
 */

// Custom node component with state-based coloring and Handle components
const AlgorithmNode = ({ data }) => {
  const stateColors = {
    default: 'var(--graph-node-default, #64748b)',
    visiting: 'var(--graph-node-current, #f59e0b)',
    visited: 'var(--graph-node-visited, #10b981)',
    exploring: 'var(--graph-node-start, #3b82f6)',
    path: 'var(--graph-node-path, #8b5cf6)',
    current: 'var(--graph-node-current, #ef4444)',
  };

  const color = stateColors[data.state] || stateColors.default;

  return (
    <div
      className="algorithm-node"
      style={{
        borderColor: color,
        background: data.state === 'default' ? 'var(--bg-secondary, #1e293b)' : `${color}20`,
      }}
    >
      <Handle type="target" position={Position.Left} id="target" />
      {data.showLabel && <span className="algorithm-node-label">{data.label}</span>}
      {data.weight !== undefined && (
        <span className="algorithm-node-weight">{data.weight}</span>
      )}
      <Handle type="source" position={Position.Right} id="source" />
    </div>
  );
};

const nodeTypes = { algorithm: AlgorithmNode };

const GraphRenderer = ({
  graph = { nodes: [], edges: [] },
  interactive = true,
  onGraphChange,
}) => {
  const { currentStep, steps } = useVisualizationStore();

  // Build node and edge states from steps up to currentStep
  const getNodeStates = useCallback(() => {
    const nodeStates = {};
    const edgeStates = {};

    // Initialize all as default
    graph.nodes.forEach(n => { nodeStates[n.id] = 'default'; });
    graph.edges.forEach(e => {
      edgeStates[`${e.source}-${e.target}`] = 'default';
    });

    // Apply steps
    for (let i = 0; i <= currentStep && i < steps.length; i++) {
      const s = steps[i];
      const isCurrentStep = (i === currentStep);
      
      if (s.nodeIds) {
        s.nodeIds.forEach(id => {
          if (s.type === 'visit') {
            nodeStates[id] = isCurrentStep ? 'current' : 'visited';
          }
          if (s.type === 'explore') {
            nodeStates[id] = isCurrentStep ? 'exploring' : 'visited';
          }
          if (s.type === 'backtrack') {
            nodeStates[id] = 'visited';
          }
        });
      }
      if (s.edge) {
        const key = `${s.edge.source}-${s.edge.target}`;
        const revKey = `${s.edge.target}-${s.edge.source}`;
        if (s.type === 'explore' || s.type === 'relax') {
          edgeStates[key] = isCurrentStep ? 'exploring' : 'visited';
          edgeStates[revKey] = isCurrentStep ? 'exploring' : 'visited';
        }
      }
      // 'path' steps (Dijkstra/Prim/Kruskal results) carry pathEdges, not a single edge.
      if (s.type === 'path' && s.pathEdges) {
        s.pathEdges.forEach(e => {
          edgeStates[`${e.source}-${e.target}`] = 'path';
          edgeStates[`${e.target}-${e.source}`] = 'path';
        });
      }
    }

    return { nodeStates, edgeStates };
  }, [graph, currentStep, steps]);

  const { nodeStates, edgeStates } = getNodeStates();

  // Build React Flow nodes (controlled)
  const nodes = useMemo(() =>
    graph.nodes.map(n => ({
      id: String(n.id),
      type: 'algorithm',
      position: { x: n.x || 0, y: n.y || 0 },
      data: {
        label: n.label || n.id,
        state: nodeStates[n.id] || 'default',
        showLabel: true,
      },
      draggable: interactive,
    })),
    [graph.nodes, nodeStates, interactive]
  );

  // Build React Flow edges (controlled)
  const edges = useMemo(() =>
    graph.edges.map(e => {
      const key = `${e.source}-${e.target}`;
      const state = edgeStates[key] || 'default';
      const color = state === 'exploring' ? '#3b82f6'
        : state === 'path' ? '#8b5cf6'
        : 'var(--border-primary, #475569)';

      return {
        id: `${e.source}-${e.target}`,
        source: String(e.source),
        target: String(e.target),
        label: e.weight ? String(e.weight) : undefined,
        animated: state === 'exploring',
        style: { 
          stroke: color, 
          strokeWidth: state === 'path' ? 4 : state === 'exploring' ? 3 : 2,
          strokeOpacity: state === 'default' ? 0.5 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color,
        },
        labelStyle: {
          fill: 'var(--text-primary, #f8fafc)',
          fontWeight: 'bold',
          fontSize: 12,
        },
        labelBgStyle: {
          fill: 'var(--bg-primary, #0f172a)',
          fillOpacity: 0.9,
        },
      };
    }),
    [graph.edges, edgeStates]
  );

  const onNodeDragStop = useCallback((event, node) => {
    if (!interactive || !onGraphChange) return;
    onGraphChange({
      ...graph,
      nodes: graph.nodes.map(n =>
        n.id === node.id ? { ...n, x: node.position.x, y: node.position.y } : n
      ),
    });
  }, [graph, interactive, onGraphChange]);

  return (
    <div className="graph-renderer">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={() => {}} // Controlled - no external state updates
        onEdgesChange={() => {}} // Controlled - no external state updates
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--border-primary, #334155)" gap={20} />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap
          nodeColor={(n) => {
            const state = n.data?.state || 'default';
            const colors = {
              default: '#64748b',
              current: '#ef4444',
              visited: '#10b981',
              exploring: '#3b82f6',
              path: '#8b5cf6',
            };
            return colors[state] || colors.default;
          }}
          style={{ background: 'var(--bg-secondary, #1e293b)' }}
          pannable={false}
          zoomable={false}
        />
      </ReactFlow>
    </div>
  );
};

// Static graph generator utilities
export const graphTemplates = {
  simple: () => ({
    nodes: [
      { id: 'A', label: 'A', x: 50, y: 100 },
      { id: 'B', label: 'B', x: 200, y: 50 },
      { id: 'C', label: 'C', x: 200, y: 200 },
      { id: 'D', label: 'D', x: 350, y: 100 },
    ],
    edges: [
      { source: 'A', target: 'B', weight: 4 },
      { source: 'A', target: 'C', weight: 2 },
      { source: 'B', target: 'D', weight: 3 },
      { source: 'C', target: 'D', weight: 5 },
    ],
  }),

  complex: () => ({
    nodes: [
      { id: 'A', label: 'A', x: 50, y: 150 },
      { id: 'B', label: 'B', x: 150, y: 50 },
      { id: 'C', label: 'C', x: 150, y: 250 },
      { id: 'D', label: 'D', x: 280, y: 80 },
      { id: 'E', label: 'E', x: 280, y: 220 },
      { id: 'F', label: 'F', x: 400, y: 150 },
    ],
    edges: [
      { source: 'A', target: 'B', weight: 2 },
      { source: 'A', target: 'C', weight: 4 },
      { source: 'B', target: 'D', weight: 7 },
      { source: 'B', target: 'E', weight: 1 },
      { source: 'C', target: 'E', weight: 3 },
      { source: 'D', target: 'F', weight: 5 },
      { source: 'E', target: 'F', weight: 2 },
    ],
  }),

  linear: () => ({
    nodes: [
      { id: 'A', label: 'A', x: 50, y: 150 },
      { id: 'B', label: 'B', x: 150, y: 150 },
      { id: 'C', label: 'C', x: 250, y: 150 },
      { id: 'D', label: 'D', x: 350, y: 150 },
      { id: 'E', label: 'E', x: 450, y: 150 },
    ],
    edges: [
      { source: 'A', target: 'B', weight: 1 },
      { source: 'B', target: 'C', weight: 2 },
      { source: 'C', target: 'D', weight: 3 },
      { source: 'D', target: 'E', weight: 4 },
    ],
  }),

  star: () => ({
    nodes: [
      { id: 'Center', label: 'C', x: 200, y: 150 },
      { id: 'N1', label: '1', x: 100, y: 50 },
      { id: 'N2', label: '2', x: 300, y: 50 },
      { id: 'N3', label: '3', x: 300, y: 250 },
      { id: 'N4', label: '4', x: 100, y: 250 },
    ],
    edges: [
      { source: 'Center', target: 'N1', weight: 1 },
      { source: 'Center', target: 'N2', weight: 2 },
      { source: 'Center', target: 'N3', weight: 3 },
      { source: 'Center', target: 'N4', weight: 4 },
    ],
  }),

  cycle: () => ({
    nodes: [
      { id: 'A', label: 'A', x: 200, y: 50 },
      { id: 'B', label: 'B', x: 350, y: 150 },
      { id: 'C', label: 'C', x: 200, y: 250 },
      { id: 'D', label: 'D', x: 50, y: 150 },
    ],
    edges: [
      { source: 'A', target: 'B', weight: 1 },
      { source: 'B', target: 'C', weight: 2 },
      { source: 'C', target: 'D', weight: 3 },
      { source: 'D', target: 'A', weight: 4 },
    ],
  }),
};

export default GraphRenderer;
