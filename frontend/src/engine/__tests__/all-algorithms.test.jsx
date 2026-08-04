import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import useVisualizationStore from '../state';
import { PlaybackEngine } from '../playback';

import ArrayRenderer from '../../components/renderers/ArrayRenderer';
import DPTableRenderer from '../../components/renderers/DPTableRenderer';
import GraphRenderer, { graphTemplates } from '../../components/renderers/GraphRenderer';
import TreeRenderer from '../../components/renderers/TreeRenderer';
import RecursionRenderer from '../../components/renderers/RecursionRenderer';
import StringRenderer from '../../components/renderers/StringRenderer';

import { mergeSort, bubbleSort, quickSort, insertionSort, selectionSort, heapSort } from '../algorithms/sorting';
import { bfs, dfs, dijkstra, prim, kruskal, topologicalSort, aStar } from '../algorithms/graph';
import { linearSearch, binarySearch, jumpSearch, exponentialSearch } from '../algorithms/searching';
import { fibonacciDP, knapsack, lcs, coinChange } from '../algorithms/dp';
import { fibonacci, factorial, towerOfHanoi } from '../algorithms/recursion';
import { kmp, rabinKarp } from '../algorithms/string';
import { bstInsert, heapInsert } from '../algorithms/tree';

/**
 * Every algorithm in the registry, driven through its renderer for every
 * single step. Prior tests only sampled a few algorithms, so a crash or a
 * blank render in any of the other ~20 would have gone unnoticed.
 */

const ARR = [5, 3, 8, 1, 9, 2];
const SORTED = [1, 2, 3, 5, 8, 9];
const GRAPH = graphTemplates.complex();
const DAG = {
  nodes: [{ id: 'A' }, { id: 'B' }, { id: 'C' }],
  edges: [
    { source: 'A', target: 'B', weight: 1 },
    { source: 'B', target: 'C', weight: 2 },
  ],
};

const CASES = [
  // [name, () => result, renderer factory]
  ['bubble sort', () => bubbleSort(ARR), () => <ArrayRenderer data={ARR} />],
  ['selection sort', () => selectionSort(ARR), () => <ArrayRenderer data={ARR} />],
  ['insertion sort', () => insertionSort(ARR), () => <ArrayRenderer data={ARR} />],
  ['merge sort', () => mergeSort(ARR), () => <ArrayRenderer data={ARR} />],
  ['quick sort', () => quickSort(ARR), () => <ArrayRenderer data={ARR} />],
  ['heap sort', () => heapSort(ARR), () => <ArrayRenderer data={ARR} />],

  ['linear search', () => linearSearch(SORTED, 8), () => <ArrayRenderer data={SORTED} />],
  ['binary search', () => binarySearch(SORTED, 8), () => <ArrayRenderer data={SORTED} />],
  ['jump search', () => jumpSearch(SORTED, 8), () => <ArrayRenderer data={SORTED} />],
  ['exponential search', () => exponentialSearch(SORTED, 8), () => <ArrayRenderer data={SORTED} />],

  ['bfs', () => bfs(GRAPH, 'A'), () => <GraphRenderer graph={GRAPH} />],
  ['dfs', () => dfs(GRAPH, 'A'), () => <GraphRenderer graph={GRAPH} />],
  ['dijkstra', () => dijkstra(GRAPH, 'A'), () => <GraphRenderer graph={GRAPH} />],
  ['prim', () => prim(GRAPH, 'A'), () => <GraphRenderer graph={GRAPH} />],
  ['kruskal', () => kruskal(GRAPH), () => <GraphRenderer graph={GRAPH} />],
  ['topological sort', () => topologicalSort(DAG), () => <GraphRenderer graph={DAG} />],
  ['a*', () => aStar(GRAPH, 'A', 'F'), () => <GraphRenderer graph={GRAPH} />],

  ['fibonacci dp', () => fibonacciDP(10), () => <DPTableRenderer data={[]} rows={1} cols={11} />],
  ['knapsack', () => knapsack([2, 3, 4, 5], [3, 4, 5, 6], 8), () => <DPTableRenderer data={[]} rows={5} cols={9} />],
  ['lcs', () => lcs('ABCB', 'BDCA'), () => <DPTableRenderer data={[]} rows={5} cols={5} />],
  ['coin change', () => coinChange([1, 5, 10], 12), () => <DPTableRenderer data={[]} rows={1} cols={13} />],

  ['fibonacci recursion', () => fibonacci(6), () => <RecursionRenderer algorithmName="fibonacci" />],
  ['factorial', () => factorial(5), () => <RecursionRenderer algorithmName="factorial" />],
  ['tower of hanoi', () => towerOfHanoi(3), () => <RecursionRenderer algorithmName="tower of hanoi" />],

  ['kmp', () => kmp('ABABDABACDABABCABAB', 'ABABCABAB'), () => <StringRenderer algorithmName="kmp" />],
  ['rabin-karp', () => rabinKarp('ABABDABACDABABCABAB', 'ABABCABAB'), () => <StringRenderer algorithmName="rabin-karp" />],

  ['bst insert', () => bstInsert([50, 30, 70, 20, 40]), () => <TreeRenderer treeData={[50, 30, 70, 20, 40]} />],
  ['heap insert', () => heapInsert([50, 30, 70, 20, 40]), () => <TreeRenderer treeData={[50, 30, 70, 20, 40]} />],
];

describe('every registered algorithm renders through all of its steps', () => {
  beforeEach(() => {
    useVisualizationStore.setState({
      steps: [], currentStep: -1, status: 'idle', speed: 1,
      stats: { comparisons: 0, swaps: 0, accesses: 0 }, metadata: null,
    });
  });

  CASES.forEach(([name, run, renderer]) => {
    it(`${name}: produces steps and renders each one without throwing`, () => {
      const result = run();

      expect(result.steps.length, `${name} produced no steps`).toBeGreaterThan(0);
      expect(result.metadata?.name, `${name} missing metadata`).toBeTruthy();
      expect(result.metadata.timeComplexity).toBeTruthy();

      // Every step must carry a normalized timestamp.
      for (const s of result.steps) {
        expect(s.type, `${name} step missing type`).toBeTruthy();
        expect(s.timestamp).toBeGreaterThanOrEqual(0);
        expect(s.timestamp).toBeLessThanOrEqual(1);
      }

      useVisualizationStore.getState().loadSteps(result.steps, result.metadata);
      const { rerender } = render(renderer());

      for (let i = 0; i < result.steps.length; i++) {
        act(() => {
          useVisualizationStore.getState().seek(i);
        });
        expect(
          () => rerender(renderer()),
          `${name} threw while rendering step ${i}`
        ).not.toThrow();
      }
    });
  });

  it('every algorithm drives the playback engine to completion', () => {
    for (const [name, run] of CASES) {
      const result = run();
      const engine = new PlaybackEngine();
      useVisualizationStore.getState().loadSteps(result.steps, result.metadata);
      engine.init(result.steps, { baseDuration: 0.01 });

      let guard = 0;
      while (engine.stepForward() && guard++ < 10000) { /* advance */ }

      const { currentStep } = useVisualizationStore.getState();
      expect(currentStep, `${name} did not reach the final step`).toBe(
        result.steps.length - 1
      );
      engine.dispose();
    }
  });
});
