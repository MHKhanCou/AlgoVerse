import React, { memo } from 'react';
import { Info } from 'lucide-react';
import useVisualizationStore from '../../engine/state';
import './StepDescription.css';

/**
 * AlgoVerse V2 — Step Description
 *
 * Shows a human-readable description of the current animation step.
 */
const StepDescription = memo(() => {
  const { description, currentStep, steps } = useVisualizationStore();
  const step = currentStep >= 0 ? steps[currentStep] : null;

  const typeLabels = {
    compare: 'Comparing',
    swap: 'Swapping',
    set: 'Setting',
    visit: 'Visiting',
    explore: 'Exploring',
    relax: 'Relaxing',
    backtrack: 'Backtracking',
    highlight: 'Highlighting',
    sorted: 'Sorted',
    found: 'Found',
    path: 'Path',
    message: 'Info',
  };

  const typeColors = {
    compare: 'var(--warning, #f59e0b)',
    swap: 'var(--error, #ef4444)',
    set: 'var(--info, #3b82f6)',
    visit: 'var(--primary, #8b5cf6)',
    explore: 'var(--info, #3b82f6)',
    relax: 'var(--success, #10b981)',
    backtrack: 'var(--warning, #f59e0b)',
    highlight: 'var(--primary, #8b5cf6)',
    sorted: 'var(--success, #10b981)',
    found: 'var(--success, #10b981)',
    path: 'var(--primary, #8b5cf6)',
    message: 'var(--text-secondary, #94a3b8)',
  };

  if (!step && currentStep === -1) {
    return (
      <div className="step-description step-description-idle">
        <Info size={14} />
        <span>Press play or step forward to begin</span>
      </div>
    );
  }

  if (!step) return null;

  return (
    <div className="step-description">
      <span
        className="step-description-type"
        style={{ color: typeColors[step.type] || typeColors.message }}
      >
        {typeLabels[step.type] || step.type}
      </span>
      <span className="step-description-text">
        {step.description || description || 'Processing...'}
      </span>
      {step.indices && step.indices.length > 0 && (
        <span className="step-description-indices">
          [{step.indices.join(', ')}]
        </span>
      )}
    </div>
  );
});

export default StepDescription;
