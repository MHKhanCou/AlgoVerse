import React, { useRef, useCallback, useEffect } from 'react';
import useVisualizationStore from '../../engine/state';
import './StepTimeline.css';

/**
 * AlgoVerse V2 — Step Timeline
 *
 * Visual timeline showing all steps as dots/markers.
 * Click any step to jump to it. Color-coded by step type.
 */
const StepTimeline = ({ engine }) => {
  const { steps, currentStep } = useVisualizationStore();
  const containerRef = useRef(null);

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
    message: 'var(--text-muted, #64748b)',
  };

  const handleStepClick = useCallback((index) => {
    if (!engine) return;
    engine.seekTo(index / Math.max(steps.length - 1, 1));
  }, [engine, steps.length]);

  // Scroll to keep current step visible
  useEffect(() => {
    if (!containerRef.current || currentStep < 0) return;
    const container = containerRef.current;
    const stepEl = container.children[currentStep];
    if (stepEl) {
      stepEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentStep]);

  if (steps.length === 0) {
    return (
      <div className="step-timeline step-timeline-empty">
        <span>No steps yet — run an algorithm to see the timeline</span>
      </div>
    );
  }

  // Show max 100 markers, sample if too many
  const maxMarkers = 100;
  const sampleRate = steps.length > maxMarkers ? Math.ceil(steps.length / maxMarkers) : 1;

  return (
    <div className="step-timeline" ref={containerRef} role="listbox" aria-label="Algorithm steps timeline">
      {steps.map((step, i) => {
        if (i % sampleRate !== 0 && i !== steps.length - 1) return null;

        const isCurrent = i === currentStep;
        const isPast = i < currentStep;
        const color = typeColors[step.type] || 'var(--text-muted, #64748b)';

        return (
          <button
            key={i}
            className={`step-timeline-marker ${isCurrent ? 'current' : ''} ${isPast ? 'past' : ''}`}
            style={{
              backgroundColor: isCurrent ? color : isPast ? `${color}60` : 'var(--bg-tertiary, #334155)',
              borderColor: isCurrent ? color : 'transparent',
            }}
            onClick={() => handleStepClick(i)}
            title={`Step ${i + 1}: ${step.description || step.type}`}
            role="option"
            aria-selected={isCurrent}
            aria-label={`Step ${i + 1}`}
          />
        );
      })}
    </div>
  );
};

export default StepTimeline;
