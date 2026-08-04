import React, { memo, useMemo } from 'react';
import useVisualizationStore from '../../engine/state';
import './RecursionRenderer.css';

/**
 * AlgoVerse V2 — Recursion Renderer
 *
 * Visualizes recursion with:
 * - Call stack (left panel)
 * - Recursion tree (center)
 * - Tower of Hanoi pegs (special mode)
 */

const RecursionRenderer = memo(({ data = [], algorithmName = '' }) => {
  const { currentStep, steps } = useVisualizationStore();
  const step = currentStep >= 0 ? steps[currentStep] : null;

  const isTowerOfHanoi = algorithmName.toLowerCase().includes('tower') || algorithmName.toLowerCase().includes('hanoi');

  // Get current tree nodes and call stack from step
  const treeNodes = step?.treeNodes || [];
  const callStack = step?.callStack || [];
  const pegs = step?.pegs || null;

  // Build tree layout positions
  const treeLayout = useMemo(() => {
    if (!treeNodes.length) return [];

    const positioned = [];
    const childrenMap = {};

    treeNodes.forEach(node => {
      if (node.parentId !== null && node.parentId !== undefined) {
        if (!childrenMap[node.parentId]) childrenMap[node.parentId] = [];
        childrenMap[node.parentId].push(node.id);
      }
    });

    const NODE_W = 80;
    const NODE_H = 50;
    const LEVEL_H = 70;
    const MIN_X = 40;

    function getSubtreeWidth(nodeId) {
      const children = childrenMap[nodeId] || [];
      if (children.length === 0) return NODE_W;
      return children.reduce((sum, cid) => sum + getSubtreeWidth(cid), 0) + (children.length - 1) * 15;
    }

    function positionNode(nodeId, left, top) {
      const node = treeNodes[nodeId] || treeNodes.find(n => n.id === nodeId);
      if (!node) return;

      const children = childrenMap[nodeId] || [];
      const subtreeW = getSubtreeWidth(nodeId);
      const x = left + subtreeW / 2;
      const y = top;

      positioned.push({ ...node, x, y });

      let childLeft = left;
      children.forEach(cid => {
        const cw = getSubtreeWidth(cid);
        positionNode(cid, childLeft, y + LEVEL_H);
        childLeft += cw + 15;
      });
    }

    // Find root (parentId === null)
    const root = treeNodes.find(n => n.parentId === null || n.parentId === undefined);
    if (root) {
      const rootWidth = getSubtreeWidth(root.id);
      positionNode(root.id, MIN_X, 20);
    }

    return positioned;
  }, [treeNodes]);

  const stateColors = {
    default: '#64748b',
    current: '#ef4444',
    resolved: '#10b981',
    memoized: '#f59e0b',
    done: '#3b82f6',
  };

  if (isTowerOfHanoi && pegs) {
    return (
      <div className="recursion-renderer">
        <div className="hanoi-visualization">
          {['A', 'B', 'C'].map(pegName => (
            <div key={pegName} className="hanoi-peg">
              <div className="hanoi-peg-label">{pegName}</div>
              <div className="hanoi-peg-pole" />
              <div className="hanoi-peg-base" />
              <div className="hanoi-disks">
                {(pegs[pegName] || []).map((disk, idx) => (
                  <div
                    key={disk}
                    className="hanoi-disk"
                    style={{
                      width: `${40 + disk * 20}px`,
                      backgroundColor: step?.indices?.includes(disk) ? 'var(--primary, #8b5cf6)' : `hsl(${disk * 40}, 70%, 55%)`,
                      bottom: `${idx * 24}px`,
                    }}
                  >
                    <span>{disk}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="recursion-call-stack">
          <h4>Call Stack</h4>
          <div className="call-stack-frames">
            {callStack.length === 0 ? (
              <div className="call-stack-empty">Empty</div>
            ) : (
              callStack.map((frame, i) => (
                <div key={i} className={`call-stack-frame ${i === 0 ? 'active' : ''}`}>
                  {frame}
                </div>
              ))
            )}
          </div>
        </div>
        {step?.description && (
          <div className="recursion-step-desc">{step.description}</div>
        )}
      </div>
    );
  }

  return (
    <div className="recursion-renderer">
      <div className="recursion-tree-panel">
        <h4>Recursion Tree</h4>
        <svg
          className="recursion-tree-svg"
          viewBox={`0 0 ${Math.max(400, treeLayout.reduce((m, n) => Math.max(m, n.x + 60), 400))} ${Math.max(200, treeLayout.reduce((m, n) => Math.max(m, n.y + 60), 200))}`}
          preserveAspectRatio="xMidYMin meet"
        >
          {/* Draw edges */}
          {treeLayout.map(node => {
            if (node.parentId === null || node.parentId === undefined) return null;
            const parent = treeLayout.find(n => n.id === node.parentId);
            if (!parent) return null;
            return (
              <line
                key={`edge-${node.id}-${parent.id}`}
                x1={parent.x}
                y1={parent.y + 18}
                x2={node.x}
                y2={node.y - 18}
                stroke="var(--border-primary, #475569)"
                strokeWidth="2"
              />
            );
          })}
          {/* Draw nodes */}
          {treeLayout.map(node => (
            <g key={`node-${node.id}`}>
              <circle
                cx={node.x}
                cy={node.y}
                r="22"
                fill={`${stateColors[node.state] || stateColors.default}20`}
                stroke={stateColors[node.state] || stateColors.default}
                strokeWidth="2"
              />
              <text
                x={node.x}
                y={node.y - 3}
                textAnchor="middle"
                fill="var(--text-primary, #f8fafc)"
                fontSize="11"
                fontWeight="600"
                fontFamily="JetBrains Mono, monospace"
              >
                {node.label}
              </text>
              {node.result !== null && node.result !== undefined && (
                <text
                  x={node.x}
                  y={node.y + 10}
                  textAnchor="middle"
                  fill="var(--primary, #8b5cf6)"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  ={node.result}
                </text>
              )}
            </g>
          ))}
          {treeLayout.length === 0 && (
            <text x="200" y="100" textAnchor="middle" fill="var(--text-muted)" fontSize="14">
              Press Play to start
            </text>
          )}
        </svg>
      </div>

      <div className="recursion-call-stack">
        <h4>Call Stack</h4>
        <div className="call-stack-frames">
          {callStack.length === 0 ? (
            <div className="call-stack-empty">Empty</div>
          ) : (
            callStack.map((frame, i) => (
              <div key={i} className={`call-stack-frame ${i === 0 ? 'active' : ''}`}>
                {frame}
              </div>
            ))
          )}
        </div>
      </div>

      {step?.description && (
        <div className="recursion-step-desc">{step.description}</div>
      )}
    </div>
  );
});

export default RecursionRenderer;
