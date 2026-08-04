import React, { useRef, useEffect, useCallback, memo } from 'react';
import useVisualizationStore from '../../engine/state';
import './TreeRenderer.css';

/**
 * AlgoVerse V2 — Tree Renderer (SVG)
 *
 * Renders binary trees (BST, Heap) as SVG with animated nodes.
 * Uses treeData from each step (not the initial input array).
 */
const TreeRenderer = memo(({ treeData = null }) => {
  const svgRef = useRef(null);
  const [theme, setTheme] = React.useState(() => document.documentElement.getAttribute('data-theme') || 'light');

  const { currentStep, steps, status } = useVisualizationStore();
  const step = currentStep >= 0 ? steps[currentStep] : null;

  // Use treeData from step if available, otherwise fall back to prop
  const activeTreeData = step?.treeData || treeData || [];

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const getNodeStates = useCallback(() => {
    if (!activeTreeData) return {};
    const states = {};

    for (let i = 0; i <= currentStep && i < steps.length; i++) {
      const s = steps[i];
      const isCurrent = (i === currentStep);

      if (s.indices && s.indices.length > 0) {
        s.indices.forEach(val => {
          if (s.type === 'visit') states[val] = isCurrent ? 'current' : 'visited';
          if (s.type === 'compare') states[val] = 'comparing';
          if (s.type === 'set') states[val] = 'inserting';
          if (s.type === 'swap') states[val] = 'swapping';
          if (s.type === 'sorted') states[val] = 'sorted';
          if (s.type === 'found') states[val] = 'found';
        });
      }
    }

    if (step && step.indices) {
      step.indices.forEach(val => {
        if (step.type === 'visit') states[val] = 'current';
        if (step.type === 'compare') states[val] = 'comparing';
        if (step.type === 'set') states[val] = 'inserting';
        if (step.type === 'swap') states[val] = 'swapping';
        if (step.type === 'sorted') states[val] = 'sorted';
        if (step.type === 'found') states[val] = 'found';
      });
    }

    return states;
  }, [activeTreeData, currentStep, steps, step]);

  const buildTreeNodes = useCallback(() => {
    if (!activeTreeData || !activeTreeData.length) return [];

    const nodes = [];
    const nodeStates = getNodeStates();

    function addNode(index, x, y, level) {
      if (index >= activeTreeData.length || activeTreeData[index] === null) return null;

      const node = {
        id: index,
        value: activeTreeData[index],
        x,
        y,
        state: nodeStates[activeTreeData[index]] || 'default',
        left: null,
        right: null,
      };

      const spacing = Math.max(30, 120 / (level + 1));
      node.left = addNode(2 * index + 1, x - spacing, y + 60, level + 1);
      node.right = addNode(2 * index + 2, x + spacing, y + 60, level + 1);

      nodes.push(node);
      if (node.left) nodes.push(node.left);
      if (node.right) nodes.push(node.right);

      return node;
    }

    addNode(0, 200, 30, 0);
    return nodes;
  }, [activeTreeData, getNodeStates]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const nodes = buildTreeNodes();

    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (!nodes.length) return;

    const stateColors = {
      default: '#64748b',
      current: '#ef4444',
      visited: '#10b981',
      comparing: '#f59e0b',
      inserting: '#3b82f6',
      swapping: '#ef4444',
      sorted: '#10b981',
      found: '#10b981',
    };

    // Draw edges
    nodes.forEach(node => {
      if (node.left) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', node.x);
        line.setAttribute('y1', node.y);
        line.setAttribute('x2', node.left.x);
        line.setAttribute('y2', node.left.y);
        line.setAttribute('stroke', 'var(--border-primary, #475569)');
        line.setAttribute('stroke-width', '2');
        svg.appendChild(line);
      }
      if (node.right) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', node.x);
        line.setAttribute('y1', node.y);
        line.setAttribute('x2', node.right.x);
        line.setAttribute('y2', node.right.y);
        line.setAttribute('stroke', 'var(--border-primary, #475569)');
        line.setAttribute('stroke-width', '2');
        svg.appendChild(line);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', node.x);
      circle.setAttribute('cy', node.y);
      circle.setAttribute('r', '20');
      circle.setAttribute('fill', `${stateColors[node.state] || stateColors.default}30`);
      circle.setAttribute('stroke', stateColors[node.state] || stateColors.default);
      circle.setAttribute('stroke-width', '2');
      svg.appendChild(circle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', node.x);
      text.setAttribute('y', node.y);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('fill', 'var(--text-primary, #f8fafc)');
      text.setAttribute('font-size', '14');
      text.setAttribute('font-weight', 'bold');
      text.textContent = node.value;
      svg.appendChild(text);
    });
  }, [buildTreeNodes]);

  return (
    <div className="tree-renderer">
      <svg
        ref={svgRef}
        viewBox="0 0 400 300"
        className="tree-svg"
        preserveAspectRatio="xMidYMid meet"
      />
      {(!activeTreeData || activeTreeData.length === 0) && (
        <div className="tree-empty">
          Run an algorithm to see the tree visualization
        </div>
      )}
      {step?.description && (
        <div className="tree-step-desc">{step.description}</div>
      )}
    </div>
  );
});

export default TreeRenderer;
