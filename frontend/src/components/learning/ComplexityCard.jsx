import React, { memo } from 'react';
import { Clock, HardDrive, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import './ComplexityCard.css';

/**
 * AlgoVerse V2 — Complexity Card
 *
 * Displays time/space complexity with visual indicators.
 */
const ComplexityCard = memo(({ timeComplexity, spaceComplexity, stability }) => {
  const getComplexityColor = (complexity) => {
    if (!complexity) return 'unknown';
    const c = complexity.toLowerCase();
    if (c.includes('o(1)')) return 'excellent';
    if (c.includes('o(log') || c.includes('o(n log')) return 'good';
    if (c === 'o(n)') return 'fair';
    if (c.includes('o(n²)') || c.includes('o(n^2)')) return 'poor';
    if (c.includes('o(2^n)') || c.includes('o(n!)')) return 'bad';
    return 'unknown';
  };

  const getComplexityIcon = (complexity) => {
    if (!complexity) return <Minus size={14} />;
    const c = complexity.toLowerCase();
    if (c.includes('o(1)') || c.includes('o(log')) return <TrendingUp size={14} />;
    if (c.includes('o(n²)') || c.includes('o(2^n)') || c.includes('o(n!)')) return <TrendingDown size={14} />;
    return <Minus size={14} />;
  };

  return (
    <div className="complexity-card">
      <h3 className="complexity-card-title">Complexity Analysis</h3>

      <div className="complexity-grid">
        <div className="complexity-item">
          <div className="complexity-icon">
            <Clock size={16} />
          </div>
          <div className="complexity-info">
            <span className="complexity-label">Time Complexity</span>
            <span className={`complexity-value complexity-${getComplexityColor(timeComplexity)}`}>
              {timeComplexity || 'N/A'}
            </span>
          </div>
          {getComplexityIcon(timeComplexity)}
        </div>

        <div className="complexity-item">
          <div className="complexity-icon">
            <HardDrive size={16} />
          </div>
          <div className="complexity-info">
            <span className="complexity-label">Space Complexity</span>
            <span className={`complexity-value complexity-${getComplexityColor(spaceComplexity)}`}>
              {spaceComplexity || 'N/A'}
            </span>
          </div>
          {getComplexityIcon(spaceComplexity)}
        </div>

        {stability !== undefined && (
          <div className="complexity-item">
            <div className="complexity-icon">
              <TrendingUp size={16} />
            </div>
            <div className="complexity-info">
              <span className="complexity-label">Stability</span>
              <span className={`complexity-value complexity-${stability ? 'good' : 'poor'}`}>
                {stability ? 'Stable' : 'Unstable'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default ComplexityCard;
