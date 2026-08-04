import { describe, it, expect, beforeEach } from 'vitest';
import useVisualizationStore from '../state';
import { PlaybackEngine } from '../playback';
import { bubbleSort } from '../algorithms/sorting';

function authoritative(steps, upto) {
  return steps.slice(0, upto + 1).reduce(
    (acc, s) => {
      if (s.type === 'compare') acc.comparisons++;
      if (s.type === 'swap') acc.swaps++;
      acc.accesses++;
      return acc;
    },
    { comparisons: 0, swaps: 0, accesses: 0 }
  );
}

describe('replaying a region must not inflate stats', () => {
  beforeEach(() => {
    useVisualizationStore.setState({
      steps: [], currentStep: -1, status: 'idle', speed: 1,
      stats: { comparisons: 0, swaps: 0, accesses: 0 },
    });
  });

  it('re-running the same steps yields the same counts, not doubled ones', () => {
    const { steps } = bubbleSort([5, 3, 8, 1]);
    const engine = new PlaybackEngine();
    useVisualizationStore.getState().loadSteps(steps);
    engine.init(steps, { baseDuration: 0.01 });

    // Simulate the timeline replaying the first few steps twice, which is
    // what happens when a user seeks backward and presses play again.
    const replay = 4;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < replay; i++) {
        // Invoke the same code path the GSAP callback uses.
        engine._applyStepState(steps[i], i);
      }
    }

    const { stats } = useVisualizationStore.getState();
    expect(stats).toEqual(authoritative(steps, replay - 1));
    engine.dispose();
  });

  it('preserves graph-specific metrics when seeking', async () => {
    const { bfs } = await import('../algorithms/graph');
    const graph = {
      nodes: [{ id: 'A' }, { id: 'B' }, { id: 'C' }],
      edges: [
        { source: 'A', target: 'B', weight: 1 },
        { source: 'B', target: 'C', weight: 2 },
      ],
    };
    const { steps } = bfs(graph, 'A');
    useVisualizationStore.getState().loadSteps(steps);

    const last = steps.length - 1;
    useVisualizationStore.getState().seek(last);
    const { stats } = useVisualizationStore.getState();

    const expectedVisits = steps.filter(
      s => s.type === 'visit' || s.type === 'explore'
    ).length;
    const expectedEdges = steps.filter(
      s => s.type === 'explore' || s.type === 'relax'
    ).length;

    // These were previously computed only by the incremental helper, so
    // seeking dropped them entirely.
    expect(stats.nodesVisited).toBe(expectedVisits);
    expect(stats.edgesExplored).toBe(expectedEdges);
  });

  it('seeking backward then forward lands on identical stats', () => {
    const { steps } = bubbleSort([7, 2, 9, 4]);
    useVisualizationStore.getState().loadSteps(steps);

    useVisualizationStore.getState().seek(6);
    const first = { ...useVisualizationStore.getState().stats };

    useVisualizationStore.getState().seek(1);
    useVisualizationStore.getState().seek(6);
    const second = { ...useVisualizationStore.getState().stats };

    expect(second).toEqual(first);
    expect(second).toEqual(authoritative(steps, 6));
  });
});
