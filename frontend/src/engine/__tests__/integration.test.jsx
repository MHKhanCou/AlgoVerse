import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import ArrayRenderer from '../../components/renderers/ArrayRenderer';
import DPTableRenderer from '../../components/renderers/DPTableRenderer';
import PlaybackControls from '../../components/engine/PlaybackControls';
import useVisualizationStore from '../state';
import { PlaybackEngine } from '../playback';
import { bubbleSort, quickSort } from '../algorithms/sorting';
import { knapsack } from '../algorithms/dp';

/**
 * End-to-end-ish checks that drive the real components through the real
 * playback engine, rather than only testing step generators in isolation.
 * Every bug fixed in this pass lived in exactly this seam.
 */

function resetStore() {
  useVisualizationStore.setState({
    steps: [],
    currentStep: -1,
    status: 'idle',
    speed: 1,
    codeLine: null,
    description: null,
    stats: { comparisons: 0, swaps: 0, accesses: 0 },
    metadata: null,
  });
}

describe('playback engine driving real renderers', () => {
  beforeEach(() => resetStore());

  it('stepping forward through every step never double-counts stats', () => {
    const { steps } = bubbleSort([5, 3, 8, 1]);
    const engine = new PlaybackEngine();
    useVisualizationStore.getState().loadSteps(steps);
    engine.init(steps, { baseDuration: 0.1 });

    for (let i = 0; i < steps.length; i++) engine.stepForward();

    const { stats, currentStep } = useVisualizationStore.getState();
    expect(currentStep).toBe(steps.length - 1);

    // Authoritative counts recomputed from the step list.
    const expected = steps.reduce(
      (acc, s) => {
        if (s.type === 'compare') acc.comparisons++;
        if (s.type === 'swap') acc.swaps++;
        acc.accesses++;
        return acc;
      },
      { comparisons: 0, swaps: 0, accesses: 0 }
    );
    expect(stats.comparisons).toBe(expected.comparisons);
    expect(stats.swaps).toBe(expected.swaps);
    expect(stats.accesses).toBe(expected.accesses);
    engine.dispose();
  });

  it('stepping forward then back returns to the identical earlier state', () => {
    const { steps } = quickSort([9, 2, 7, 4, 1]);
    const engine = new PlaybackEngine();
    useVisualizationStore.getState().loadSteps(steps);
    engine.init(steps, { baseDuration: 0.1 });

    engine.stepForward();
    engine.stepForward();
    engine.stepForward();
    const at3 = { ...useVisualizationStore.getState().stats };

    engine.stepForward();
    engine.stepBackward();
    const back = useVisualizationStore.getState();

    expect(back.currentStep).toBe(2);
    expect(back.stats).toEqual(at3);
    engine.dispose();
  });

  it('preserves user speed across re-runs (regression)', () => {
    const { steps } = bubbleSort([3, 1, 2]);
    const engine = new PlaybackEngine();

    engine.init(steps, { baseDuration: 0.1 });
    engine.setSpeed(2.5);
    expect(useVisualizationStore.getState().speed).toBe(2.5);

    // Re-running the algorithm must not silently reset to 1x.
    engine.init(steps, { baseDuration: 0.1 });
    expect(engine.timeline.timeScale()).toBe(2.5);
    engine.dispose();
  });

  it('isPlaying reflects paused state so the Space toggle works', () => {
    const { steps } = bubbleSort([3, 1, 2]);
    const engine = new PlaybackEngine();
    useVisualizationStore.getState().loadSteps(steps);
    engine.init(steps, { baseDuration: 0.1 });

    expect(engine.isPlaying()).toBe(false);
    engine.play();
    expect(engine.isPlaying()).toBe(true);
    engine.pause();
    // The old timeline.isActive() check returned false here too, which is
    // why Space could not resume after a pause.
    expect(engine.isPlaying()).toBe(false);
    engine.play();
    expect(engine.isPlaying()).toBe(true);
    engine.dispose();
  });
});

describe('ArrayRenderer canvas painting', () => {
  beforeEach(() => resetStore());

  it('does not reallocate the canvas backing store on repeated draws', () => {
    const { steps } = bubbleSort([4, 2, 6, 1]);
    useVisualizationStore.getState().loadSteps(steps);

    const { container, rerender } = render(<ArrayRenderer data={[4, 2, 6, 1]} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();

    // The canvas has a stable 800x400 box (see test/setup.js), so the size
    // never changes across redraws. Count writes to `width` after the first
    // paint: the guard should make them zero. The old code wrote on every
    // single draw, which cleared and reallocated the backing store per frame.
    let widthWrites = 0;
    const desc = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(canvas),
      'width'
    );
    Object.defineProperty(canvas, 'width', {
      get: () => desc.get.call(canvas),
      set: (v) => {
        widthWrites++;
        desc.set.call(canvas, v);
      },
      configurable: true,
    });

    for (let i = 0; i < 5; i++) {
      act(() => {
        useVisualizationStore.getState().seek(i);
      });
      rerender(<ArrayRenderer data={[4, 2, 6, 1]} />);
    }

    expect(widthWrites).toBe(0);
  });

  it('renders without throwing for every step of a real sort', () => {
    const { steps } = quickSort([5, 1, 4, 2, 8]);
    useVisualizationStore.getState().loadSteps(steps);
    const { rerender } = render(<ArrayRenderer data={[5, 1, 4, 2, 8]} />);

    for (let i = 0; i < steps.length; i++) {
      act(() => {
        useVisualizationStore.getState().seek(i);
      });
      expect(() => rerender(<ArrayRenderer data={[5, 1, 4, 2, 8]} />)).not.toThrow();
    }
  });
});

describe('DP table across a full run', () => {
  beforeEach(() => resetStore());

  it('shows a fully populated knapsack table at every set step', () => {
    const { steps } = knapsack([2, 3, 4, 5], [3, 4, 5, 6], 8);
    useVisualizationStore.getState().loadSteps(steps);

    const setIndices = steps
      .map((s, i) => (s.type === 'set' ? i : -1))
      .filter(i => i >= 0);
    expect(setIndices.length).toBeGreaterThan(0);

    const { container, rerender } = render(
      <DPTableRenderer data={[]} rows={5} cols={9} />
    );

    for (const idx of setIndices) {
      act(() => {
        useVisualizationStore.getState().seek(idx);
      });
      rerender(<DPTableRenderer data={[]} rows={5} cols={9} />);
      const cells = [...container.querySelectorAll('.dp-cell-value')];
      // Every cell must carry a value; blank cells were the original bug.
      expect(cells.every(c => c.textContent !== '')).toBe(true);
    }
  });
});

describe('PlaybackControls wiring', () => {
  beforeEach(() => resetStore());

  it('reports accurate progress and step count during a run', () => {
    const { steps } = bubbleSort([3, 1, 2]);
    const engine = new PlaybackEngine();
    useVisualizationStore.getState().loadSteps(steps);
    engine.init(steps, { baseDuration: 0.1 });

    const { rerender } = render(<PlaybackControls engine={engine} onStart={() => {}} />);
    expect(screen.getByText(`0 / ${steps.length}`)).toBeTruthy();

    act(() => { engine.stepForward(); });
    rerender(<PlaybackControls engine={engine} onStart={() => {}} />);
    expect(screen.getByText(`1 / ${steps.length}`)).toBeTruthy();

    act(() => { engine.stepForward(); });
    rerender(<PlaybackControls engine={engine} onStart={() => {}} />);
    expect(screen.getByText(`2 / ${steps.length}`)).toBeTruthy();
    engine.dispose();
  });
});
