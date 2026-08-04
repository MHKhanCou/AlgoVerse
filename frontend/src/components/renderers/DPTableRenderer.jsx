import React, { memo } from 'react';
import useVisualizationStore from '../../engine/state';
import './DPTableRenderer.css';

/**
 * AlgoVerse V2 — DP Table Renderer
 *
 * Renders DP tables from step snapshots (dpTable, dpRows, dpCols).
 * Supports 1D (Fibonacci, Coin Change) and 2D (Knapsack, LCS) tables.
 */
const DPTableRenderer = memo(({ data = [], rows = 1, cols = 1 }) => {
  const { currentStep, steps } = useVisualizationStore();
  const step = currentStep >= 0 ? steps[currentStep] : null;

  // Get table data from step snapshot
  const dpTable = step?.dpTable || data;
  const dpRows = step?.dpRows || rows;
  const dpCols = step?.dpCols || cols;
  const rowLabels = step?.dpRowLabels || null;
  const colLabels = step?.dpColLabels || null;

  // Step generators emit 2D tables (array of rows); flatten for uniform indexing.
  const flatTable = Array.isArray(dpTable[0]) ? dpTable.flat() : dpTable;

  // Build cell states from current step
  const activeIndices = new Set();
  const cellValues = {};

  if (step) {
    if (step.type === 'set' && step.indices && step.values) {
      step.indices.forEach((idx, j) => {
        if (Array.isArray(idx)) {
          // 2D indices [row, col]
          activeIndices.add(`${idx[0]}-${idx[1]}`);
          cellValues[`${idx[0]}-${idx[1]}`] = step.values[j];
        } else if (idx < dpCols) {
          // 1D index (flat)
          const r = Math.floor(idx / dpCols);
          const c = idx % dpCols;
          activeIndices.add(`${r}-${c}`);
          cellValues[`${r}-${c}`] = step.values[j];
        }
      });
    }
    if (step.type === 'visit' && step.indices) {
      step.indices.forEach(idx => {
        if (Array.isArray(idx)) {
          activeIndices.add(`${idx[0]}-${idx[1]}`);
        } else {
          const r = Math.floor(idx / dpCols);
          const c = idx % dpCols;
          activeIndices.add(`${r}-${c}`);
        }
      });
    }
    if (step.type === 'compare' && step.indices) {
      step.indices.forEach(idx => {
        if (Array.isArray(idx)) {
          activeIndices.add(`${idx[0]}-${idx[1]}`);
        } else {
          const r = Math.floor(idx / dpCols);
          const c = idx % dpCols;
          activeIndices.add(`${r}-${c}`);
        }
      });
    }
  }

  const stateColors = {
    default: 'var(--bg-secondary, #1e293b)',
    set: 'var(--info, #3b82f6)',
    visit: 'var(--warning, #f59e0b)',
    compare: 'var(--primary, #8b5cf6)',
    current: 'var(--error, #ef4444)',
  };

  // 1D table (single row)
  if (dpRows === 1 && Array.isArray(flatTable)) {
    return (
      <div className="dp-table-renderer">
        <div className="dp-table-wrapper">
          {colLabels && (
            <div className="dp-table-header" style={{ gridTemplateColumns: `repeat(${dpCols}, minmax(36px, 1fr))` }}>
              {colLabels.map((label, c) => (
                <div key={c} className="dp-table-col-header">{label}</div>
              ))}
            </div>
          )}
          <div className="dp-table-row" style={{ gridTemplateColumns: `repeat(${dpCols}, minmax(36px, 1fr))` }}>
            {flatTable.map((cell, c) => {
              const key = `0-${c}`;
              const isActive = activeIndices.has(key);
              return (
                <div
                  key={key}
                  className={`dp-table-cell ${isActive ? 'active' : ''}`}
                  style={{
                    backgroundColor: isActive ? stateColors.set : stateColors.default,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span className="dp-cell-value">{cell !== null && cell !== undefined ? cell : ''}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dp-table-legend">
          <span><span className="legend-dot" style={{background: stateColors.default}} /> Empty</span>
          <span><span className="legend-dot" style={{background: stateColors.set}} /> Set</span>
          <span><span className="legend-dot" style={{background: stateColors.visit}} /> Visit</span>
          <span><span className="legend-dot" style={{background: stateColors.compare}} /> Compare</span>
        </div>

        {step?.description && (
          <div className="dp-step-desc">{step.description}</div>
        )}
      </div>
    );
  }

  // 2D table
  return (
    <div className="dp-table-renderer">
      <div className="dp-table-wrapper">
        {colLabels && (
          <div className="dp-table-header" style={{ gridTemplateColumns: rowLabels ? `40px repeat(${dpCols}, minmax(36px, 1fr))` : `repeat(${dpCols}, minmax(36px, 1fr))` }}>
            {rowLabels && <div className="dp-table-corner" />}
            {colLabels.map((label, c) => (
              <div key={c} className="dp-table-col-header">{label}</div>
            ))}
          </div>
        )}

        {Array.from({ length: dpRows }, (_, r) => (
          <div key={r} className="dp-table-row" style={{ gridTemplateColumns: rowLabels ? `40px repeat(${dpCols}, minmax(36px, 1fr))` : `repeat(${dpCols}, minmax(36px, 1fr))` }}>
            {rowLabels && (
              <div className="dp-table-row-header">{rowLabels[r]}</div>
            )}
            {Array.from({ length: dpCols }, (_, c) => {
              const val = flatTable[r * dpCols + c] !== undefined ? flatTable[r * dpCols + c] : null;
              const key = `${r}-${c}`;
              const isActive = activeIndices.has(key);
              return (
                <div
                  key={key}
                  className={`dp-table-cell ${isActive ? 'active' : ''}`}
                  style={{
                    backgroundColor: isActive ? stateColors.set : stateColors.default,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span className="dp-cell-value">{val !== null && val !== undefined ? val : ''}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="dp-table-legend">
        <span><span className="legend-dot" style={{background: stateColors.default}} /> Empty</span>
        <span><span className="legend-dot" style={{background: stateColors.set}} /> Set</span>
        <span><span className="legend-dot" style={{background: stateColors.visit}} /> Visit</span>
        <span><span className="legend-dot" style={{background: stateColors.compare}} /> Compare</span>
      </div>

      {step?.description && (
        <div className="dp-step-desc">{step.description}</div>
      )}
    </div>
  );
});

export default DPTableRenderer;
