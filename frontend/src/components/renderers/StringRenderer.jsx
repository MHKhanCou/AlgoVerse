import React, { memo } from 'react';
import useVisualizationStore from '../../engine/state';
import './StringRenderer.css';

/**
 * AlgoVerse V2 — String Renderer
 *
 * Renders text and pattern as character cells with highlighting.
 * Supports KMP and Rabin-Karp visualization.
 */
// Reads its content from the current step, not from props.
const StringRenderer = memo(({ algorithmName = '' }) => {
  const { currentStep, steps } = useVisualizationStore();
  const step = currentStep >= 0 ? steps[currentStep] : null;

  const text = step?.text || 'ABABDABACDABABCABAB';
  const pattern = step?.pattern || 'ABABCABAB';
  const patternOffset = step?.patternOffset || 0;
  const highlights = step?.highlights || [];
  const matchPositions = step?.matchPositions || [];
  const lps = step?.lps || null;

  // Build text cell states
  const getCharState = (pos) => {
    const highlight = highlights.find(h => h.pos === pos);
    if (highlight) return highlight.type;

    for (const match of matchPositions) {
      if (pos >= match.start && pos < match.end + 1) return 'found';
    }
    return 'default';
  };

  // Build pattern cell states (relative to pattern position)
  const getPatternCharState = (patternIdx) => {
    const absPos = patternOffset + patternIdx;
    const highlight = highlights.find(h => h.type === 'pattern' && h.pos === absPos);
    if (highlight) {
      // Check if this pattern char has a special state
      const textHighlight = highlights.find(h => h.pos === absPos && h.type !== 'pattern');
      if (textHighlight) return textHighlight.type;
      return 'pattern';
    }
    return 'default';
  };

  const stateClasses = {
    default: '',
    comparing: 'highlight-comparing',
    pattern: 'highlight-pattern',
    found: 'highlight-found',
    mismatch: 'highlight-mismatch',
  };

  return (
    <div className="string-renderer">
      {/* Text row */}
      <div className="string-row">
        <span className="string-label">Text:</span>
        <div className="string-cells">
          {text.split('').map((char, i) => {
            const state = getCharState(i);
            return (
              <span
                key={i}
                className={`string-cell ${stateClasses[state] || ''}`}
                title={`text[${i}] = '${char}'`}
              >
                {char}
              </span>
            );
          })}
        </div>
      </div>

      {/* Pattern row (offset aligned with text) */}
      <div className="string-row">
        <span className="string-label">Pattern:</span>
        <div className="string-cells" style={{ paddingLeft: `${patternOffset * 32}px` }}>
          {pattern.split('').map((char, i) => {
            const state = getPatternCharState(i);
            return (
              <span
                key={i}
                className={`string-cell ${stateClasses[state] || ''}`}
                title={`pattern[${i}] = '${char}'`}
              >
                {char}
              </span>
            );
          })}
        </div>
      </div>

      {/* Index row */}
      <div className="string-row">
        <span className="string-label" />
        <div className="string-cells string-indices">
          {text.split('').map((_, i) => (
            <span key={i} className="string-cell index-cell">{i}</span>
          ))}
        </div>
      </div>

      {/* LPS array for KMP */}
      {lps && (
        <div className="string-lps">
          <h4>LPS Array</h4>
          <div className="string-cells lps-cells">
            {pattern.split('').map((char, i) => (
              <div key={i} className="lps-cell">
                <span className="lps-char">{char}</span>
                <span className="lps-value">{lps[i]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hash info for Rabin-Karp */}
      {algorithmName.toLowerCase().includes('rabin') && step?.description?.includes('hash') && (
        <div className="string-hash-info">
          <span className="hash-badge">Rolling Hash</span>
        </div>
      )}

      {/* Legend */}
      <div className="string-legend">
        <span><span className="legend-dot comparing" /> Comparing</span>
        <span><span className="legend-dot found" /> Found</span>
        <span><span className="legend-dot mismatch" /> Mismatch</span>
        <span><span className="legend-dot pattern" /> Pattern</span>
      </div>

      {/* Step description */}
      {step?.description && (
        <div className="string-step-desc">{step.description}</div>
      )}
    </div>
  );
});

export default StringRenderer;
