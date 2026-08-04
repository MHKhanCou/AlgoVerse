import React, { memo } from 'react';
import { BarChart3, GitCompare, ArrowRightLeft, Eye } from 'lucide-react';
import useVisualizationStore from '../../engine/state';
import './StatsPanel.css';

/**
 * AlgoVerse V2 — Stats Panel
 *
 * Displays algorithm metrics (comparisons, swaps, accesses).
 */
const StatsPanel = memo(({ metadata: metadataProp }) => {
  const { stats, metadata: metadataStore } = useVisualizationStore();
  const metadata = metadataProp || metadataStore;

  return (
    <div className="stats-panel">
      {metadata && (
        <div className="stats-metadata">
          <span className="stats-complexity">
            <span className="stats-complexity-label">Time:</span>
            <code>{metadata.timeComplexity}</code>
          </span>
          <span className="stats-complexity">
            <span className="stats-complexity-label">Space:</span>
            <code>{metadata.spaceComplexity}</code>
          </span>
        </div>
      )}

      <div className="stats-metrics">
        <div className="stats-metric">
          <GitCompare size={14} />
          <span className="stats-metric-label">Comparisons</span>
          <span className="stats-metric-value">{stats.comparisons || 0}</span>
        </div>
        <div className="stats-metric">
          <ArrowRightLeft size={14} />
          <span className="stats-metric-label">Swaps</span>
          <span className="stats-metric-value">{stats.swaps || 0}</span>
        </div>
        <div className="stats-metric">
          <Eye size={14} />
          <span className="stats-metric-label">Accesses</span>
          <span className="stats-metric-value">{stats.accesses || 0}</span>
        </div>
        {stats.nodesVisited !== undefined && (
          <div className="stats-metric">
            <Eye size={14} />
            <span className="stats-metric-label">Nodes Visited</span>
            <span className="stats-metric-value">{stats.nodesVisited}</span>
          </div>
        )}
        {stats.edgesExplored !== undefined && (
          <div className="stats-metric">
            <ArrowRightLeft size={14} />
            <span className="stats-metric-label">Edges Explored</span>
            <span className="stats-metric-value">{stats.edgesExplored}</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default StatsPanel;
