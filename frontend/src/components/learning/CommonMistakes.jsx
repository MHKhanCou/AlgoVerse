import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { getAlgorithmContent } from '../../content/algorithms';
import './CommonMistakes.css';

/**
 * AlgoVerse — Common Mistakes Component
 *
 * Reads from the canonical content map in src/content/algorithms.
 * If an algorithm has no entry, this renders nothing — the previous version
 * silently fell back to Bubble Sort's mistakes, which meant algorithms like
 * KMP and 0/1 Knapsack displayed content for a different algorithm.
 */
const CommonMistakes = ({ algorithmName = '' }) => {
  const content = getAlgorithmContent(algorithmName);
  const mistakes = content?.commonMistakes;
  if (!mistakes || mistakes.length === 0) return null;

  return (
    <div className="common-mistakes">
      <h3 className="common-mistakes-title">
        <AlertTriangle size={16} />
        Common Mistakes
      </h3>
      <div className="common-mistakes-list">
        {mistakes.map((item, i) => (
          <div key={i} className="common-mistake-item">
            <div className="common-mistake-error">
              <span className="common-mistake-x">✕</span>
              <span>{item.mistake}</span>
            </div>
            <div className="common-mistake-fix">
              <span className="common-mistake-fix-label">Fix:</span>
              <span>{item.fix}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommonMistakes;
