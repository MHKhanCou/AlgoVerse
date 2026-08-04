import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import useVisualizationStore from '../state';
import ArrayRenderer from '../../components/renderers/ArrayRenderer';
import { knapsack, lcs } from '../algorithms/dp';
import { bfs } from '../algorithms/graph';
import { graphTemplates } from '../../components/renderers/GraphRenderer';

/**
 * ArrayRenderer must never throw on steps it does not understand.
 *
 * A real-browser sweep of the /demo page caught this: the DP tab ran a DP
 * algorithm while ArrayRenderer was still mounted, and the 2D [row, col]
 * indices hit `arr[idx] = ...` and then a forEach on a non-array, throwing
 * "Cannot read properties of undefined (reading 'forEach')" and blanking
 * the entire page. The page-level fix is to render DPTableRenderer for DP,
 * but the renderer itself must also degrade instead of taking down the app.
 */
describe('ArrayRenderer resilience to foreign step shapes', () => {
  beforeEach(() => {
    useVisualizationStore.setState({
      steps: [], currentStep: -1, status: 'idle', speed: 1,
      stats: { comparisons: 0, swaps: 0, accesses: 0 }, metadata: null,
    });
  });

  it('survives 2D DP indices without throwing', () => {
    const { steps } = knapsack([2, 3, 4, 5], [3, 4, 5, 6], 8);
    useVisualizationStore.getState().loadSteps(steps);

    const { rerender } = render(<ArrayRenderer data={[5, 3, 8, 1]} />);
    for (let i = 0; i < steps.length; i++) {
      act(() => { useVisualizationStore.getState().seek(i); });
      expect(
        () => rerender(<ArrayRenderer data={[5, 3, 8, 1]} />),
        `threw on DP step ${i}`
      ).not.toThrow();
    }
  });

  it('survives LCS steps without throwing', () => {
    const { steps } = lcs('ABCB', 'BDCA');
    useVisualizationStore.getState().loadSteps(steps);

    const { rerender } = render(<ArrayRenderer data={[1, 2, 3]} />);
    for (let i = 0; i < steps.length; i++) {
      act(() => { useVisualizationStore.getState().seek(i); });
      expect(() => rerender(<ArrayRenderer data={[1, 2, 3]} />)).not.toThrow();
    }
  });

  it('survives graph steps (nodeIds, no numeric indices)', () => {
    const { steps } = bfs(graphTemplates.complex(), 'A');
    useVisualizationStore.getState().loadSteps(steps);

    const { rerender } = render(<ArrayRenderer data={[4, 2, 7]} />);
    for (let i = 0; i < steps.length; i++) {
      act(() => { useVisualizationStore.getState().seek(i); });
      expect(() => rerender(<ArrayRenderer data={[4, 2, 7]} />)).not.toThrow();
    }
  });

  it('survives malformed steps entirely', () => {
    const steps = [
      { type: 'compare', timestamp: 0 },                       // no indices
      { type: 'swap', indices: null, timestamp: 0.2 },          // null indices
      { type: 'set', indices: 'nonsense', timestamp: 0.4 },     // wrong type
      { type: 'visit', indices: [[1, 2]], timestamp: 0.6 },     // nested
      { type: 'sorted', indices: [0], timestamp: 1 },           // valid
    ];
    useVisualizationStore.getState().loadSteps(steps);

    const { rerender } = render(<ArrayRenderer data={[9, 8]} />);
    for (let i = 0; i < steps.length; i++) {
      act(() => { useVisualizationStore.getState().seek(i); });
      expect(() => rerender(<ArrayRenderer data={[9, 8]} />)).not.toThrow();
    }
  });
});
