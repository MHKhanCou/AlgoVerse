import React, { memo } from 'react';
import useVisualizationStore from '../../engine/state';
import './StatePanel.css';

/**
 * AlgoVerse V2 — State Panel
 *
 * Shows algorithm-specific state information.
 * Different content based on algorithm type.
 */
const StatePanel = memo(({ algorithmType = 'array' }) => {
  const { steps, currentStep, stats, metadata } = useVisualizationStore();
  const step = currentStep >= 0 ? steps[currentStep] : null;

  const renderSortingState = () => (
    <div className="state-panel-grid">
      <div className="state-item">
        <span className="state-label">Comparisons</span>
        <span className="state-value">{stats.comparisons || 0}</span>
      </div>
      <div className="state-item">
        <span className="state-label">Swaps</span>
        <span className="state-value">{stats.swaps || 0}</span>
      </div>
      <div className="state-item">
        <span className="state-label">Accesses</span>
        <span className="state-value">{stats.accesses || 0}</span>
      </div>
      {step?.indices && (
        <div className="state-item">
          <span className="state-label">Current Indices</span>
          <span className="state-value state-value-mono">[{step.indices.join(', ')}]</span>
        </div>
      )}
    </div>
  );

  const renderGraphState = () => (
    <div className="state-panel-grid">
      <div className="state-item">
        <span className="state-label">Nodes Visited</span>
        <span className="state-value">{stats.nodesVisited || 0}</span>
      </div>
      <div className="state-item">
        <span className="state-label">Edges Explored</span>
        <span className="state-value">{stats.edgesExplored || 0}</span>
      </div>
      {step?.nodeIds && (
        <div className="state-item">
          <span className="state-label">Current Nodes</span>
          <span className="state-value state-value-mono">{step.nodeIds.join(', ')}</span>
        </div>
      )}
      {step?.edge && (
        <div className="state-item">
          <span className="state-label">Current Edge</span>
          <span className="state-value state-value-mono">{step.edge.source} → {step.edge.target}</span>
        </div>
      )}
    </div>
  );

  const renderSearchState = () => (
    <div className="state-panel-grid">
      <div className="state-item">
        <span className="state-label">Comparisons</span>
        <span className="state-value">{stats.comparisons || 0}</span>
      </div>
      <div className="state-item">
        <span className="state-label">Accesses</span>
        <span className="state-value">{stats.accesses || 0}</span>
      </div>
      {step?.indices && (
        <div className="state-item">
          <span className="state-label">Checking</span>
          <span className="state-value state-value-mono">index {step.indices[0]}</span>
        </div>
      )}
    </div>
  );

  const renderDPState = () => (
    <div className="state-panel-grid">
      <div className="state-item">
        <span className="state-label">Operations</span>
        <span className="state-value">{stats.accesses || 0}</span>
      </div>
      {step?.indices && (
        <div className="state-item">
          <span className="state-label">Current Cell</span>
          <span className="state-value state-value-mono">[{step.indices.join(', ')}]</span>
        </div>
      )}
      {step?.values && (
        <div className="state-item">
          <span className="state-label">Value</span>
          <span className="state-value state-value-mono">{step.values[0]}</span>
        </div>
      )}
    </div>
  );

  const renderers = {
    array: renderSortingState,
    graph: renderGraphState,
    search: renderSearchState,
    dp: renderDPState,
  };

  const renderer = renderers[algorithmType] || renderSortingState;

  return (
    <div className="state-panel">
      <div className="state-panel-header">
        <span className="state-panel-title">State</span>
        {metadata?.name && (
          <span className="state-panel-algo">{metadata.name}</span>
        )}
      </div>
      {renderer()}
    </div>
  );
});

export default StatePanel;
