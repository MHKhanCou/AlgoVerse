import { describe, it, expect } from 'vitest';
import { allAlgorithmContent, getAlgorithmContent } from '../algorithms';

/**
 * The 34 algorithms present in the production database, by exact name.
 * If this list and the content disagree, the learning panels would silently
 * render nothing (or worse, the wrong algorithm) — so this is asserted, not
 * assumed. The Python checker backend/scripts/algorithm_content.py
 * verifies the other direction against a live database.
 */
const CANONICAL_NAMES = [
  '0/1 Knapsack',
  'A* Search',
  'BST In-Order Traversal',
  'BST Insert',
  'BST Search',
  'Bellman-Ford',
  'Binary Search',
  'Breadth-First Search',
  'Bubble Sort',
  'Coin Change',
  'Counting Sort',
  'Depth-First Search',
  "Dijkstra's Algorithm",
  'Exponential Search',
  'Factorial',
  'Fibonacci',
  'Fibonacci DP',
  'Hash Table',
  'Heap Insert',
  'Heap Sort',
  'Insertion Sort',
  'Jump Search',
  'KMP String Matching',
  "Kruskal's Algorithm",
  'Linear Search',
  'Longest Common Subsequence',
  'Merge Sort',
  "Prim's Algorithm",
  'Quick Sort',
  'Rabin-Karp',
  'Selection Sort',
  'Shell Sort',
  'Topological Sort',
  'Tower of Hanoi',
];

// Phrases that mark text as plausible-sounding filler rather than content.
// The goal is not style policing — it is catching regressions back toward
// generated boilerplate.
const FILLER_PHRASES = [
  'it is important to note',
  'in conclusion',
  'in this article',
  'as we can see',
  'simply put',
  'when it comes to',
];

describe('algorithm content', () => {
  it('covers exactly the algorithms in the production database', () => {
    const names = allAlgorithmContent.map((entry) => entry.name).sort();
    expect(names).toEqual([...CANONICAL_NAMES].sort());
  });

  it('resolves every canonical name, case-insensitively and with whitespace noise', () => {
    for (const name of CANONICAL_NAMES) {
      expect(getAlgorithmContent(name), `exact: ${name}`).toBeTruthy();
      expect(getAlgorithmContent(name.toUpperCase()), `upper: ${name}`).toBeTruthy();
      expect(getAlgorithmContent(`  ${name}  `), `padded: ${name}`).toBeTruthy();
    }
  });

  it('resolves legacy names that previously fell back to Bubble Sort content', () => {
    // These names exist in older databases and in the frontend's own history;
    // each one used to render Bubble Sort's panels.
    const legacy = {
      'Breadth-First Search (BFS)': 'Breadth-First Search',
      'Depth-First Search (DFS)': 'Depth-First Search',
      BFS: 'Breadth-First Search',
      DFS: 'Depth-First Search',
      'Knapsack Problem': '0/1 Knapsack',
      'Knapsack Problem (0/1)': '0/1 Knapsack',
      'KMP Algorithm': 'KMP String Matching',
      KMP: 'KMP String Matching',
      'Fibonacci (DP)': 'Fibonacci DP',
      'Fibonacci Sequence': 'Fibonacci DP',
      'A*': 'A* Search',
      'A-Star': 'A* Search',
      'Longest Common Subsequence (LCS)': 'Longest Common Subsequence',
    };
    for (const [legacyName, canonical] of Object.entries(legacy)) {
      const content = getAlgorithmContent(legacyName);
      expect(content, `legacy name: ${legacyName}`).toBeTruthy();
      expect(content.name, `legacy name: ${legacyName}`).toBe(canonical);
    }
  });

  it('returns null for unknown names instead of guessing', () => {
    expect(getAlgorithmContent('Bubble Sword')).toBeNull();
    expect(getAlgorithmContent('')).toBeNull();
    expect(getAlgorithmContent(null)).toBeNull();
    expect(getAlgorithmContent(undefined)).toBeNull();
  });

  it.each(allAlgorithmContent.map((entry) => [entry.name, entry]))(
    '%s has complete, substantive content',
    (_name, entry) => {
      expect(entry.description.length).toBeGreaterThan(60);
      expect(entry.explanation).toContain('<h3>');
      expect(entry.explanation).toContain('</p>');
      expect(entry.whenToUse.use.length).toBeGreaterThanOrEqual(2);
      expect(entry.whenToUse.avoid.length).toBeGreaterThanOrEqual(2);
      expect(entry.commonMistakes.length).toBeGreaterThanOrEqual(2);
      for (const { mistake, fix } of entry.commonMistakes) {
        expect(mistake.length).toBeGreaterThan(20);
        expect(fix.length).toBeGreaterThan(15);
      }
    },
  );

  it.each(allAlgorithmContent.map((entry) => [entry.name, entry]))(
    '%s contains no generated-filler phrases',
    (_name, entry) => {
      const haystack = `${entry.description} ${entry.explanation}`.toLowerCase();
      for (const phrase of FILLER_PHRASES) {
        expect(haystack.includes(phrase), `filler phrase "${phrase}"`).toBe(false);
      }
    },
  );

  it('has no duplicate names', () => {
    const names = allAlgorithmContent.map((entry) => entry.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
