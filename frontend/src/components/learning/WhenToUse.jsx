import React from 'react';
import { Lightbulb, CheckCircle, XCircle } from 'lucide-react';
import { getAlgorithmContent } from '../../content/algorithms';
import './WhenToUse.css';

/**
 * AlgoVerse — When to Use Component
 *
 * Reads from the canonical content map in src/content/algorithms.
 * If an algorithm has no entry, this renders nothing — the previous version
 * silently fell back to Bubble Sort's guidance.
 */
const WhenToUse = ({ algorithmName = '' }) => {
  const content = getAlgorithmContent(algorithmName);
  const when = content?.whenToUse;
  if (!when || (!when.use?.length && !when.avoid?.length)) return null;

  return (
    <div className="when-to-use">
      <h3 className="when-to-use-title">
        <Lightbulb size={16} />
        When to Use: {algorithmName || 'Algorithm'}
      </h3>
      <div className="when-to-use-list">
        <div className="when-to-use-item">
          <div className="when-to-use-conditions">
            <div className="when-to-use-good">
              <CheckCircle size={14} />
              <span>Use when:</span>
            </div>
            <ul>
              {when.use.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="when-to-use-bad">
            <XCircle size={14} />
            <span>Avoid when:</span>
          </div>
          <ul>
            {when.avoid.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WhenToUse;
