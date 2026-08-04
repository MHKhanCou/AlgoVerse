import React from 'react';
import { Lightbulb, CheckCircle, XCircle } from 'lucide-react';
import './WhenToUse.css';

/**
 * AlgoVerse V2 — When to Use Component
 *
 * Decision guide for when to use each algorithm.
 */

const WHEN_TO_USE_BY_ALGORITHM = {
  // Sorting
  'Bubble Sort': {
    when: ['Small datasets', 'Nearly sorted data', 'Educational purposes', 'Stability needed'],
    whenNot: ['Large datasets', 'Performance critical applications'],
  },
  'Selection Sort': {
    when: ['Small datasets', 'Memory constrained (O(1) space)', 'Minimizing swaps'],
    whenNot: ['Large datasets', 'When stability matters'],
  },
  'Insertion Sort': {
    when: ['Small datasets', 'Nearly sorted data', 'Online sorting (streaming)', 'Stability needed'],
    whenNot: ['Large datasets', 'Random order data'],
  },
  'Merge Sort': {
    when: ['Guaranteed O(n log n)', 'Stable sorting', 'Linked lists', 'External sorting'],
    whenNot: ['Memory constrained (O(n) space)', 'Small datasets (overhead)'],
  },
  'Quick Sort': {
    when: ['Average case O(n log n)', 'In-place sorting', 'Cache friendly'],
    whenNot: ['Worst case O(n²) guaranteed', 'Stability needed', 'Adversarial inputs'],
  },
  'Heap Sort': {
    when: ['Guaranteed O(n log n)', 'In-place sorting', 'Priority queue operations'],
    whenNot: ['Stability needed', 'Cache performance critical'],
  },
  // Searching
  'Linear Search': {
    when: ['Unsorted data', 'Small datasets', 'Simple implementation needed'],
    whenNot: ['Large sorted datasets', 'Performance critical'],
  },
  'Binary Search': {
    when: ['Sorted data', 'Large datasets', 'O(log n) performance needed'],
    whenNot: ['Unsorted data', 'Linked lists'],
  },
  'Jump Search': {
    when: ['Sorted data', 'Between linear and binary search', 'Block-based access'],
    whenNot: ['Unsorted data', 'Very large datasets (use binary)'],
  },
  'Exponential Search': {
    when: ['Sorted data of unknown size', 'Unbounded arrays', 'Finding range then binary search'],
    whenNot: ['Unsorted data', 'Small fixed-size arrays'],
  },
  // Graph
  'BFS': {
    when: ['Shortest path (unweighted)', 'Level-order traversal', 'Finding connected components'],
    whenNot: ['Weighted graphs', 'Cycle detection'],
  },
  'DFS': {
    when: ['Cycle detection', 'Topological sorting', 'Path finding', 'Maze solving'],
    whenNot: ['Shortest path (unweighted)'],
  },
  "Dijkstra's Algorithm": {
    when: ['Shortest path (weighted, non-negative)', 'Single-source shortest path'],
    whenNot: ['Negative edge weights', 'All-pairs shortest path'],
  },
  "Prim's Algorithm": {
    when: ['Minimum spanning tree', 'Network design', 'Connected weighted graph'],
    whenNot: ['Disconnected graph', 'Maximum spanning tree'],
  },
  "Kruskal's Algorithm": {
    when: ['Sparse graphs', 'Minimum spanning tree', 'Edge-sorted access'],
    whenNot: ['Dense graphs (use Prim)', 'Dynamic edge additions'],
  },
  'Topological Sort': {
    when: ['Task scheduling', 'Build systems', 'Course prerequisites', 'Dependency resolution'],
    whenNot: ['Graphs with cycles', 'Undirected graphs'],
  },
  // DP
  'Fibonacci (DP)': {
    when: ['Recursive Fibonacci', 'Overlapping subproblems', 'Optimal substructure'],
    whenNot: ['Linear iteration (use iterative)'],
  },
  'Knapsack Problem': {
    when: ['Item selection optimization', 'Resource allocation', 'Weight constraints'],
    whenNot: ['Unbounded knapsack (use different variant)'],
  },
  'Longest Common Subsequence': {
    when: ['String comparison', 'Diff tools', 'DNA sequence alignment'],
    whenNot: ['Exact string matching (use KMP)'],
  },
  'Coin Change': {
    when: ['Minimum coins for amount', 'Currency problems', 'Making change'],
    whenNot: ['Unlimited coins of each type (use different variant)'],
  },
  // Recursion
  'Factorial': {
    when: ['Mathematical computations', 'Combinatorics', 'Recursive learning'],
    whenNot: ['Large n (stack overflow risk)', 'Performance critical (use iterative)'],
  },
  'Fibonacci': {
    when: ['Recursive learning', 'With memoization for efficiency', 'Mathematical sequences'],
    whenNot: ['Large n without memoization', 'Simple iteration suffices'],
  },
  'Tower of Hanoi': {
    when: ['Recursive problem learning', 'Divide and conquer demonstration'],
    whenNot: ['Large n (exponential moves)', 'Performance critical'],
  },
  // String
  'KMP Algorithm': {
    when: ['Pattern matching in text', 'Multiple pattern occurrences', 'Large text with repetitive patterns'],
    whenNot: ['Single character search', 'Very short text'],
  },
  'Rabin-Karp': {
    when: ['Multiple pattern matching', 'Plagiarism detection', 'Stream processing'],
    whenNot: ['Single pattern (use KMP)', 'Hash collision prone data'],
  },
  // Tree
  'BST Insert': {
    when: ['Dynamic sorted data', 'Frequent insertions/deletions', 'Ordered traversal needed'],
    whenNot: ['Already sorted data (use array)', 'Frequent rebalancing needed (use AVL)'],
  },
  'Heap Insert': {
    when: ['Priority queue operations', 'Scheduling algorithms', 'Top-K element finding'],
    whenNot: ['Sorted data access needed', 'Frequent search by value'],
  },
};

const NAME_ALIASES = {
  'Breadth-First Search': 'BFS',
  'Depth-First Search': 'DFS',
  'Breadth-first Search': 'BFS',
  'Depth-first Search': 'DFS',
};

// eslint-disable-next-line no-unused-vars
const WhenToUse = ({ category = 'sorting', algorithmName = '' }) => {
  const lookupName = NAME_ALIASES[algorithmName] || algorithmName;
  const info = WHEN_TO_USE_BY_ALGORITHM[lookupName] || WHEN_TO_USE_BY_ALGORITHM['Bubble Sort'];

  return (
    <div className="when-to-use">
      <h3 className="when-to-use-title">
        <Lightbulb size={16} />
        When to Use: {algorithmName || 'Algorithm'}
      </h3>
      <div className="when-to-use-list">
        <div className="when-to-use-item">
          <div className="when-to-use-conditions">
            <div className="when-to-use-good">
              <CheckCircle size={14} />
              <span>Use when:</span>
            </div>
            <ul>
              {info.when.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="when-to-use-bad">
            <XCircle size={14} />
            <span>Avoid when:</span>
          </div>
          <ul>
            {info.whenNot.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WhenToUse;
