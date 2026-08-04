import React, { useRef, useEffect, useCallback, memo, useState } from 'react';
import useVisualizationStore from '../../engine/state';
import './GridRenderer.css';

/**
 * AlgoVerse V2 — Grid Renderer (Canvas)
 *
 * Renders a grid for pathfinding algorithms (A*, BFS, DFS, Dijkstra).
 * Supports wall placement, start/end nodes, and animated path finding.
 */
const GridRenderer = memo(({
  rows = 20,
  cols = 30,
  initialGrid = null,
  startNode = { row: 0, col: 0 },
  endNode = { row: 19, col: 29 },
  onGridChange,
}) => {
  const canvasRef = useRef(null);
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'light');
  const [grid, setGrid] = useState(() => initialGrid || createEmptyGrid(rows, cols));
  const [start, setStart] = useState(startNode);
  const [end, setEnd] = useState(endNode);
  const [mode, setMode] = useState('wall'); // 'wall' | 'start' | 'end' | 'eraser'

  const { currentStep, steps } = useVisualizationStore();

  // Watch for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Create empty grid
  function createEmptyGrid(rows, cols) {
    return Array.from({ length: rows }, () => Array(cols).fill('empty'));
  }

  // Build grid state from steps
  const getGridState = useCallback(() => {
    const state = grid.map(row => [...row]);

    for (let i = 0; i <= currentStep && i < steps.length; i++) {
      const s = steps[i];
      if (s.indices && s.indices.length >= 2) {
        const [row, col] = s.indices;
        if (row < state.length && col < state[0].length) {
          if (s.type === 'visit') state[row][col] = 'visited';
          if (s.type === 'explore') state[row][col] = 'frontier';
          if (s.type === 'found') state[row][col] = 'path';
        }
      }
    }

    // Mark start and end
    state[start.row][start.col] = 'start';
    state[end.row][end.col] = 'end';

    return state;
  }, [grid, currentStep, steps, start, end]);

  // Draw grid on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    const state = getGridState();

    const stateColors = {
      empty: theme === 'dark' ? '#1e293b' : '#f1f5f9',
      wall: theme === 'dark' ? '#334155' : '#64748b',
      start: '#3b82f6',
      end: '#ef4444',
      visited: 'rgba(59, 130, 246, 0.3)',
      frontier: 'rgba(245, 158, 11, 0.5)',
      path: '#10b981',
      current: '#f59e0b',
    };

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw cells
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellWidth;
        const y = r * cellHeight;

        ctx.fillStyle = stateColors[state[r][c]] || stateColors.empty;
        ctx.fillRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2);

        // Draw border
        ctx.strokeStyle = theme === 'dark' ? '#334155' : '#e2e8f0';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, cellWidth, cellHeight);
      }
    }
  }, [grid, rows, cols, theme, getGridState]);

  // Handle canvas click
  const handleCanvasClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor(x / (rect.width / cols));
    const row = Math.floor(y / (rect.height / rows));

    if (row < 0 || row >= rows || col < 0 || col >= cols) return;

    const newGrid = grid.map(r => [...r]);

    if (mode === 'wall') {
      if (newGrid[row][col] === 'empty') {
        newGrid[row][col] = 'wall';
      }
    } else if (mode === 'eraser') {
      if (newGrid[row][col] === 'wall') {
        newGrid[row][col] = 'empty';
      }
    } else if (mode === 'start') {
      setStart({ row, col });
    } else if (mode === 'end') {
      setEnd({ row, col });
    }

    setGrid(newGrid);
    onGridChange?.({ grid: newGrid, start: mode === 'start' ? { row, col } : start, end: mode === 'end' ? { row, col } : end });
  }, [grid, mode, rows, cols, start, end, onGridChange]);

  // Generate random maze
  const generateMaze = useCallback(() => {
    const newGrid = createEmptyGrid(rows, cols);
    // Simple random wall placement
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() < 0.3) {
          newGrid[r][c] = 'wall';
        }
      }
    }
    // Ensure start and end are clear
    newGrid[start.row][start.col] = 'start';
    newGrid[end.row][end.col] = 'end';
    setGrid(newGrid);
  }, [rows, cols, start, end]);

  // Clear grid
  const clearGrid = useCallback(() => {
    setGrid(createEmptyGrid(rows, cols));
  }, [rows, cols]);

  return (
    <div className="grid-renderer">
      <div className="grid-toolbar">
        <div className="grid-modes">
          <button
            className={`grid-mode-btn ${mode === 'wall' ? 'active' : ''}`}
            onClick={() => setMode('wall')}
          >
            🧱 Wall
          </button>
          <button
            className={`grid-mode-btn ${mode === 'eraser' ? 'active' : ''}`}
            onClick={() => setMode('eraser')}
          >
            🧹 Eraser
          </button>
          <button
            className={`grid-mode-btn ${mode === 'start' ? 'active' : ''}`}
            onClick={() => setMode('start')}
          >
            🟢 Start
          </button>
          <button
            className={`grid-mode-btn ${mode === 'end' ? 'active' : ''}`}
            onClick={() => setMode('end')}
          >
            🔴 End
          </button>
        </div>
        <div className="grid-actions">
          <button onClick={generateMaze} className="grid-action-btn">Random Maze</button>
          <button onClick={clearGrid} className="grid-action-btn">Clear</button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="grid-canvas"
        onClick={handleCanvasClick}
      />

      <div className="grid-legend">
        <span><span className="legend-color" style={{background: '#3b82f6'}} /> Start</span>
        <span><span className="legend-color" style={{background: '#ef4444'}} /> End</span>
        <span><span className="legend-color" style={{background: '#64748b'}} /> Wall</span>
        <span><span className="legend-color" style={{background: '#3b82f6', opacity: 0.3}} /> Visited</span>
        <span><span className="legend-color" style={{background: '#10b981'}} /> Path</span>
      </div>
    </div>
  );
});

export default GridRenderer;
