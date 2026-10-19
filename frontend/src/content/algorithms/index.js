import sorting from './sorting.json';
import searching from './searching.json';
import graph from './graph.json';
import dynamicProgramming from './dynamic-programming.json';
import recursion from './recursion.json';
import stringsAndTrees from './strings-and-trees.json';

/**
 * Canonical algorithm content.
 *
 * This directory is the single source of truth for what each algorithm page
 * says: description, explanation, when-to-use guidance and common mistakes.
 * - The learning panels (WhenToUse, CommonMistakes) read from here.
 * - backend/scripts/update_algorithm_content.py pushes description and
 *   explanation into the database from these same files.
 *
 * If you add or rename an algorithm, add it here and run
 * backend/scripts/check_algorithm_content.py — it verifies content and
 * database agree in both directions.
 */
const ALL = [
  ...sorting,
  ...searching,
  ...graph,
  ...dynamicProgramming,
  ...recursion,
  ...stringsAndTrees,
];

/**
 * Names that existed in the database or in this codebase's history before the
 * canonical naming pass. Every entry here used to render the wrong panels
 * (Bubble Sort's) because the lookup silently fell back. Keys are normalized
 * and lowercased; values are canonical names from the files above.
 */
const ALIASES = {
  bfs: 'Breadth-First Search',
  'breadth-first search (bfs)': 'Breadth-First Search',
  'breadth first search': 'Breadth-First Search',
  dfs: 'Depth-First Search',
  'depth-first search (dfs)': 'Depth-First Search',
  'depth first search': 'Depth-First Search',
  dijkstra: "Dijkstra's Algorithm",
  'dijkstras algorithm': "Dijkstra's Algorithm",
  'a*': 'A* Search',
  'a-star': 'A* Search',
  'astar': 'A* Search',
  knapsack: '0/1 Knapsack',
  'knapsack problem': '0/1 Knapsack',
  'knapsack problem (0/1)': '0/1 Knapsack',
  '0/1 knapsack problem': '0/1 Knapsack',
  lcs: 'Longest Common Subsequence',
  'longest common subsequence (lcs)': 'Longest Common Subsequence',
  kmp: 'KMP String Matching',
  'kmp algorithm': 'KMP String Matching',
  'rabin karp': 'Rabin-Karp',
  'rabin karp algorithm': 'Rabin-Karp',
  'fibonacci (dp)': 'Fibonacci DP',
  'fibonacci sequence': 'Fibonacci DP',
  'dynamic programming fibonacci': 'Fibonacci DP',
  'fibonacci recursion': 'Fibonacci',
  'recursive fibonacci': 'Fibonacci',
};

const normalize = (name) => String(name).trim().replace(/\s+/g, ' ').toLowerCase();

const BY_NAME = new Map(ALL.map((entry) => [normalize(entry.name), entry]));

/**
 * Look up the content for an algorithm by its display name.
 * Returns null when there is no entry — callers must handle that by rendering
 * nothing, never by falling back to another algorithm's content.
 */
export function getAlgorithmContent(name) {
  if (name === null || name === undefined) return null;
  const key = normalize(name);
  if (!key) return null;
  const canonical = ALIASES[key] ?? key;
  return BY_NAME.get(normalize(canonical)) ?? null;
}

export const allAlgorithmContent = ALL;
export { ALIASES, normalize };
