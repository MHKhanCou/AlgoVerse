import React from 'react';
import { AlertTriangle } from 'lucide-react';
import './CommonMistakes.css';

/**
 * AlgoVerse V2 — Common Mistakes Component
 *
 * Displays algorithm-specific common mistakes and pitfalls.
 */

const MISTAKES_BY_ALGORITHM = {
  // Sorting
  'Bubble Sort': [
    { mistake: 'Not optimizing: already sorted array still runs O(n²)', fix: 'Add a swap flag — break if no swaps in a pass' },
    { mistake: 'Off-by-one errors in inner loop boundary', fix: 'Inner loop goes to n-i-1, not n-1' },
  ],
  'Selection Sort': [
    { mistake: 'Swapping instead of selecting minimum each pass', fix: 'Track minIndex, swap only once per outer iteration' },
    { mistake: 'Not handling single-element arrays', fix: 'Check array length before entering loops' },
  ],
  'Insertion Sort': [
    { mistake: 'Overwriting elements when shifting', fix: 'Store the key, shift elements right, then place key' },
    { mistake: 'Wrong loop start index', fix: 'Start from index 1, not 0' },
  ],
  'Merge Sort': [
    { mistake: 'Not handling unequal halves when merging', fix: 'Pad shorter half or use separate index tracking' },
    { mistake: 'Creating too many sub-arrays (memory)', fix: 'Use indices instead of slicing for in-place merge' },
  ],
  'Quick Sort': [
    { mistake: 'Poor pivot choice leads to O(n²)', fix: 'Use median-of-three or random pivot' },
    { mistake: 'Not handling equal elements (infinite recursion)', fix: 'Use three-way partition for duplicates' },
  ],
  'Heap Sort': [
    { mistake: 'Incorrect heapify index calculation', fix: 'Left child = 2*i+1, right child = 2*i+2' },
    { mistake: 'Forgetting to build heap before sorting', fix: 'Run buildMaxHeap from last non-leaf node' },
  ],
  // Searching
  'Linear Search': [
    { mistake: 'Not checking all elements', fix: 'Loop from 0 to n-1, return on first match' },
    { mistake: 'Returning wrong index on no match', fix: 'Return -1 (or sentinel) when not found' },
  ],
  'Binary Search': [
    { mistake: 'Using (left + right) / 2 causes integer overflow', fix: 'Use left + (right - left) / 2' },
    { mistake: 'Off-by-one in pointer updates', fix: 'left = mid + 1, right = mid - 1' },
  ],
  'Jump Search': [
    { mistake: 'Wrong jump size calculation', fix: 'Use sqrt(n) as optimal jump size' },
    { mistake: 'Searching past the array bounds', fix: 'Min the jump with array length' },
  ],
  'Exponential Search': [
    { mistake: 'Not doubling range fast enough', fix: 'Start with range = 1, double each iteration' },
    { mistake: 'Forgetting binary search after finding range', fix: 'Run binary search on the found range' },
  ],
  // Graph
  'BFS': [
    { mistake: 'Forgetting to mark nodes as visited (infinite loops)', fix: 'Mark as visited when enqueueing, not when dequeuing' },
    { mistake: 'Not handling disconnected components', fix: 'Run BFS from each unvisited node' },
  ],
  'DFS': [
    { mistake: 'Forgetting to mark visited nodes', fix: 'Mark before recursive calls to prevent cycles' },
    { mistake: 'Stack overflow on deep recursion', fix: 'Use iterative DFS with explicit stack for large graphs' },
  ],
  "Dijkstra's Algorithm": [
    { mistake: 'Using with negative edge weights', fix: 'Use Bellman-Ford for graphs with negative weights' },
    { mistake: 'Not updating distances when shorter path found', fix: 'Always check dist[v] > dist[u] + weight' },
  ],
  "Prim's Algorithm": [
    { mistake: 'Not handling disconnected graphs', fix: 'Check if MST includes all vertices at the end' },
    { mistake: 'Adding same edge multiple times', fix: 'Track visited nodes and only add unvisited neighbors' },
  ],
  "Kruskal's Algorithm": [
    { mistake: 'Not detecting cycles when adding edges', fix: 'Use Union-Find to check if vertices are already connected' },
    { mistake: 'Not sorting edges first', fix: 'Sort edges by weight before processing' },
  ],
  'Topological Sort': [
    { mistake: 'Running on graph with cycles', fix: 'Detect cycles using DFS before topological sort' },
    { mistake: 'Not processing all nodes', fix: 'Start DFS from all unvisited nodes (handle disconnected)' },
  ],
  // DP
  'Fibonacci (DP)': [
    { mistake: 'Not memoizing overlapping subproblems', fix: 'Use array or map to cache results' },
    { mistake: 'Wrong base case (fib(-1) crash)', fix: 'Set fib(0)=0, fib(1)=1 explicitly' },
  ],
  'Knapsack Problem': [
    { mistake: 'Wrong state transition', fix: 'dp[i][w] = max(dp[i-1][w], dp[i-1][w-wt[i]] + val[i])' },
    { mistake: 'Forgetting to handle weight exceeds capacity', fix: 'Skip item if weight > current capacity' },
  ],
  'Longest Common Subsequence': [
    { mistake: 'Wrong base case for empty string', fix: 'dp[0][j] = 0 and dp[i][0] = 0 for all i, j' },
    { mistake: 'Comparing wrong indices', fix: 'If match: dp[i-1][j-1] + 1, else: max(dp[i-1][j], dp[i][j-1])' },
  ],
  'Coin Change': [
    { mistake: 'Not initializing dp array properly', fix: 'Set dp[0] = 0, all others = Infinity' },
    { mistake: 'Using wrong recurrence', fix: 'dp[i] = min(dp[i], dp[i - coin] + 1) for each coin' },
  ],
  // Recursion
  'Factorial': [
    { mistake: 'Missing base case (infinite recursion)', fix: 'Return 1 when n <= 1' },
    { mistake: 'Not handling negative input', fix: 'Throw error or return null for n < 0' },
  ],
  'Fibonacci': [
    { mistake: 'Exponential time without memoization', fix: 'Use memoization to cache repeated calls' },
    { mistake: 'Wrong base case returns', fix: 'Return 0 for n=0, 1 for n=1' },
  ],
  'Tower of Hanoi': [
    { mistake: 'Wrong recursive move count', fix: 'Optimal moves = 2^n - 1' },
    { mistake: 'Not moving smaller disks first', fix: 'Move n-1 disks to auxiliary, then largest, then n-1 to target' },
  ],
  // String
  'KMP Algorithm': [
    { mistake: 'Incorrect prefix function / LPS array', fix: 'Build LPS: lps[i] = length of longest proper prefix that is also suffix' },
    { mistake: 'Not handling pattern at end of text', fix: 'Check matches even when pattern pointer reaches end' },
  ],
  'Rabin-Karp': [
    { mistake: 'Hash collision not handled', fix: 'Verify character-by-character after hash match' },
    { mistake: 'Incorrect rolling hash update', fix: 'Remove leading digit, shift, add trailing digit' },
  ],
  // Tree
  'BST Insert': [
    { mistake: 'Not handling duplicate values', fix: 'Decide policy: ignore, left, or right for duplicates' },
    { mistake: 'Losing reference to tree root', fix: 'Return the modified root from recursive calls' },
  ],
  'Heap Insert': [
    { mistake: 'Wrong parent index calculation', fix: 'Parent = Math.floor((i - 1) / 2)' },
    { mistake: 'Not bubbling up after insert', fix: 'Compare with parent, swap if larger, repeat until heap property holds' },
  ],
};

const NAME_ALIASES = {
  'Breadth-First Search': 'BFS',
  'Depth-First Search': 'DFS',
  'Breadth-first Search': 'BFS',
  'Depth-first Search': 'DFS',
};

// eslint-disable-next-line no-unused-vars
const CommonMistakes = ({ category = 'sorting', algorithmName = '' }) => {
  const lookupName = NAME_ALIASES[algorithmName] || algorithmName;
  const mistakes = MISTAKES_BY_ALGORITHM[lookupName] || MISTAKES_BY_ALGORITHM['Bubble Sort'];

  return (
    <div className="common-mistakes">
      <h3 className="common-mistakes-title">
        <AlertTriangle size={16} />
        Common Mistakes
      </h3>
      <div className="common-mistakes-list">
        {mistakes.map((item, i) => (
          <div key={i} className="common-mistake-item">
            <div className="common-mistake-error">
              <span className="common-mistake-x">✕</span>
              <span>{item.mistake}</span>
            </div>
            <div className="common-mistake-fix">
              <span className="common-mistake-fix-label">Fix:</span>
              <span>{item.fix}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommonMistakes;
