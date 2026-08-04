import React, { useState, useCallback, useRef, useEffect } from 'react';
import './SplitPane.css';

/**
 * AlgoVerse V2 — Split Pane Layout
 *
 * Resizable split between two panels (e.g., visualization + code).
 */
const SplitPane = ({
  left,
  right,
  defaultSplit = 60, // percentage for left panel
  minSplit = 20,
  maxSplit = 80,
  direction = 'horizontal', // 'horizontal' | 'vertical'
  stackBelow = 768, // px viewport width below which panes stack vertically
}) => {
  const [split, setSplit] = useState(defaultSplit);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Side-by-side panes do not fit on a phone. Track the viewport so the
  // inline width styles below can be dropped entirely when stacked; a CSS
  // media query alone cannot win against an inline style.
  const [isStacked, setIsStacked] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= stackBelow
  );

  useEffect(() => {
    const onResize = () => setIsStacked(window.innerWidth <= stackBelow);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [stackBelow]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    if (isStacked) return; // no dragging when stacked
    setIsDragging(true);
  }, [isStacked]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      let percentage;

      if (direction === 'horizontal') {
        percentage = ((e.clientX - rect.left) / rect.width) * 100;
      } else {
        percentage = ((e.clientY - rect.top) / rect.height) * 100;
      }

      setSplit(Math.max(minSplit, Math.min(maxSplit, percentage)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, direction, minSplit, maxSplit]);

  return (
    <div
      ref={containerRef}
      className={`split-pane split-pane-${direction} ${isDragging ? 'split-pane-dragging' : ''} ${isStacked ? 'split-pane-stacked' : ''}`}
    >
      <div
        className="split-pane-left"
        style={isStacked
          ? undefined
          : direction === 'horizontal'
            ? { width: `${split}%` }
            : { height: `${split}%` }
        }
      >
        {left}
      </div>

      <div
        className="split-pane-divider"
        onMouseDown={handleMouseDown}
      />

      <div
        className="split-pane-right"
        style={isStacked
          ? undefined
          : direction === 'horizontal'
            ? { width: `${100 - split}%` }
            : { height: `${100 - split}%` }
        }
      >
        {right}
      </div>
    </div>
  );
};

export default SplitPane;
