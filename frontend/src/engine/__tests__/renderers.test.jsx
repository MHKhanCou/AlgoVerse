import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import DPTableRenderer from '../../components/renderers/DPTableRenderer';
import useVisualizationStore from '../../engine/state';
import { knapsack, fibonacciDP } from '../../engine/algorithms/dp';
import { prim, dijkstra } from '../../engine/algorithms/graph';

describe('DPTableRenderer with 2D dpTable snapshots', () => {
  it('renders knapsack values instead of blank cells', () => {
    const { steps } = knapsack([2, 3, 4, 5], [3, 4, 5, 6], 10);
    // last 'set' step has a filled table
    const lastSet = [...steps].reverse().find(s => s.type === 'set');
    useVisualizationStore.getState().loadSteps(steps);
    useVisualizationStore.getState().seek(steps.indexOf(lastSet));

    const { container } = render(<DPTableRenderer data={[]} rows={5} cols={11} />);
    const cells = [...container.querySelectorAll('.dp-cell-value')];
    expect(cells.length).toBe(5 * 11);
    // At least one cell shows the optimal value, i.e. table is not empty.
    const nonEmpty = cells.filter(c => c.textContent !== '');
    expect(nonEmpty.length).toBe(cells.length);
    expect(cells.some(c => Number(c.textContent) > 0)).toBe(true);
  });

  it('still renders 1D tables (fibonacci)', () => {
    const { steps } = fibonacciDP(8);
    useVisualizationStore.getState().loadSteps(steps);
    useVisualizationStore.getState().seek(steps.length - 1);
    const { container } = render(<DPTableRenderer data={[]} rows={1} cols={9} />);
    const cells = [...container.querySelectorAll('.dp-cell-value')];
    expect(cells.map(c => c.textContent)).toEqual(['0', '1', '1', '2', '3', '5', '8', '13', '21']);
  });
});

describe('graph path steps', () => {
  it("prim's final step carries pathEdges without an edge field", () => {
    const graph = {
      nodes: [{ id: 'A' }, { id: 'B' }, { id: 'C' }],
      edges: [
        { source: 'A', target: 'B', weight: 1 },
        { source: 'B', target: 'C', weight: 2 },
      ],
    };
    const last = prim(graph, 'A').steps.at(-1);
    expect(last.type).toBe('path');
    expect(last.edge).toBeUndefined();
    expect(last.pathEdges.length).toBe(2);

    const dLast = dijkstra(graph, 'A').steps.at(-1);
    expect(dLast.type).toBe('path');
    expect(dLast.edge).toBeUndefined();
  });
});
