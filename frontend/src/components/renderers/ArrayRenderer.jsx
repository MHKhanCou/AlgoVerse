import React, { useRef, useEffect, useCallback, useState, memo } from 'react';
import useVisualizationStore from '../../engine/state';

/**
 * AlgoVerse V2 — Array Renderer (Canvas)
 *
 * Renders an array as bars, dots, or lines with color-coded states.
 * Uses layered Canvas for 60fps performance.
 */
const ArrayRenderer = memo(({
  data = [],
  style = 'bars', // 'bars' | 'dots' | 'lines'
  showValues = true,
  maxBarHeight = 300,
  onArrayChange,
}) => {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'light');

  const { currentStep, steps, status } = useVisualizationStore();
  const step = currentStep >= 0 ? steps[currentStep] : null;

  // Watch for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.getAttribute('data-theme') || 'light';
      setTheme(newTheme);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Build current array state from steps up to currentStep
  const getArrayState = useCallback(() => {
    if (!data.length) return [];
    const arr = [...data];
    const colors = new Array(arr.length).fill('default');
    const sortedSet = new Set();

    for (let i = 0; i <= currentStep && i < steps.length; i++) {
      const s = steps[i];
      if (s.type === 'swap' && s.indices && s.values) {
        s.indices.forEach((idx, j) => {
          if (s.values[j] !== undefined) arr[idx] = s.values[j];
        });
      }
      if (s.type === 'set' && s.indices && s.values) {
        s.indices.forEach((idx, j) => {
          if (s.values[j] !== undefined) arr[idx] = s.values[j];
        });
      }
      if (s.type === 'compare') {
        s.indices.forEach(idx => { colors[idx] = 'comparing'; });
      }
      if (s.type === 'visit') {
        s.indices.forEach(idx => { colors[idx] = 'visiting'; });
      }
      if (s.type === 'highlight') {
        s.indices.forEach(idx => { colors[idx] = 'highlight'; });
      }
      if (s.type === 'sorted') {
        s.indices.forEach(idx => {
          colors[idx] = 'sorted';
          sortedSet.add(idx);
        });
      }
      if (s.type === 'found') {
        s.indices.forEach(idx => { colors[idx] = 'found'; });
      }
    }

    // Apply current step colors (overwrite previous)
    if (step) {
      // Highlight partition range (for merge/quick sort)
      if (step.partitionRange) {
        const [lo, hi] = step.partitionRange;
        for (let i = lo; i <= hi; i++) {
          if (colors[i] === 'default') colors[i] = 'partition';
        }
      }
      if (step.type === 'compare') {
        step.indices.forEach(idx => { colors[idx] = 'comparing'; });
      }
      if (step.type === 'swap' || step.type === 'set') {
        step.indices.forEach(idx => { colors[idx] = 'swapping'; });
      }
      if (step.type === 'visit') {
        step.indices.forEach(idx => { colors[idx] = 'visiting'; });
      }
      if (step.type === 'sorted') {
        step.indices.forEach(idx => { colors[idx] = 'sorted'; });
      }
      if (step.type === 'found') {
        step.indices.forEach(idx => { colors[idx] = 'found'; });
      }
      // Mark sorted indices from sortedIndices set
      if (step.sortedIndices) {
        step.sortedIndices.forEach(idx => { colors[idx] = 'sorted'; });
      }
    }

    return arr.map((val, i) => ({ value: val, color: colors[i], index: i }));
  }, [data, currentStep, steps, step]);

  // Draw on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const arrayState = getArrayState();
    if (!arrayState.length) return;

    // Clear
    ctx.clearRect(0, 0, width, height);

    const maxValue = Math.max(...arrayState.map(d => d.value), 1);
    const padding = 20;
    const availWidth = width - padding * 2;
    const availHeight = height - padding * 2;

    const colorMap = {
      default: 'var(--text-primary, #64748b)',
      comparing: 'var(--warning, #f59e0b)',
      swapping: 'var(--error, #ef4444)',
      visiting: 'var(--info, #3b82f6)',
      highlight: 'var(--primary, #8b5cf6)',
      sorted: 'var(--success, #10b981)',
      found: 'var(--success, #10b981)',
      partition: 'rgba(139, 92, 246, 0.25)',
    };

    // Resolve CSS variables for canvas
    const resolvedColors = {};
    const computedStyle = getComputedStyle(document.documentElement);
    Object.entries(colorMap).forEach(([key, cssVar]) => {
      if (cssVar.startsWith('var(')) {
        const varName = cssVar.match(/var\((--[^,)]+)/)?.[1];
        resolvedColors[key] = varName ? computedStyle.getPropertyValue(varName).trim() || cssVar : cssVar;
      } else {
        resolvedColors[key] = cssVar;
      }
    });

    if (style === 'bars') {
      const barWidth = Math.max(2, (availWidth / arrayState.length) - 2);
      const gap = Math.min(2, availWidth / arrayState.length * 0.2);

      arrayState.forEach((item, i) => {
        const barHeight = (item.value / maxValue) * availHeight;
        const x = padding + i * (barWidth + gap);
        const y = height - padding - barHeight;

        ctx.fillStyle = resolvedColors[item.color] || resolvedColors.default;
        ctx.fillRect(x, y, barWidth, barHeight);

        if (showValues && barWidth > 15) {
          ctx.fillStyle = resolvedColors.default;
          ctx.font = '11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(item.value, x + barWidth / 2, y - 5);
        }
      });
    } else if (style === 'dots') {
      const dotRadius = Math.max(3, Math.min(12, availWidth / arrayState.length / 3));
      const spacing = availWidth / arrayState.length;

      arrayState.forEach((item, i) => {
        const x = padding + i * spacing + spacing / 2;
        const y = height - padding - (item.value / maxValue) * availHeight;

        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = resolvedColors[item.color] || resolvedColors.default;
        ctx.fill();

        if (showValues) {
          ctx.fillStyle = resolvedColors.default;
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(item.value, x, y - dotRadius - 5);
        }
      });
    } else if (style === 'lines') {
      const spacing = availWidth / (arrayState.length - 1 || 1);

      ctx.beginPath();
      ctx.strokeStyle = resolvedColors.default;
      ctx.lineWidth = 2;

      arrayState.forEach((item, i) => {
        const x = padding + i * spacing;
        const y = height - padding - (item.value / maxValue) * availHeight;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Draw colored dots at each point
      arrayState.forEach((item, i) => {
        const x = padding + i * spacing;
        const y = height - padding - (item.value / maxValue) * availHeight;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = resolvedColors[item.color] || resolvedColors.default;
        ctx.fill();
      });
    }
  }, [getArrayState, showValues, style, theme]);

  // Animation loop
  useEffect(() => {
    const render = () => {
      draw();
      if (status === 'playing') {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [draw, status]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: maxBarHeight + 40,
        display: 'block',
      }}
    />
  );
});

export default ArrayRenderer;
