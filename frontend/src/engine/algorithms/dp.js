/**
 * AlgoVerse V2 — Dynamic Programming Step Generators
 *
 * Each step includes `dpTable` snapshot for DPTableRenderer.
 */

/**
 * Fibonacci DP step generator.
 */
export function fibonacciDP(n) {
  const steps = [];
  const dp = new Array(n + 1).fill(0);
  dp[1] = 1;

  steps.push({
    type: 'set',
    indices: [0, 1],
    values: [0, 1],
    codeLine: 2,
    description: `Initialize: dp[0]=0, dp[1]=1`,
    timestamp: 0,
    dpTable: dp.slice(),
    dpRows: 1,
    dpCols: n + 1,
  });

  for (let i = 2; i <= n; i++) {
    steps.push({
      type: 'visit',
      indices: [i],
      codeLine: 4,
      description: `Computing dp[${i}] = dp[${i-1}] + dp[${i-2}]`,
      timestamp: 0,
      dpTable: dp.slice(),
      dpRows: 1,
      dpCols: n + 1,
    });

    steps.push({
      type: 'compare',
      indices: [i - 1, i - 2],
      codeLine: 5,
      description: `Add dp[${i-1}]=${dp[i-1]} + dp[${i-2}]=${dp[i-2]}`,
      timestamp: 0,
      dpTable: dp.slice(),
      dpRows: 1,
      dpCols: n + 1,
    });

    dp[i] = dp[i - 1] + dp[i - 2];

    steps.push({
      type: 'set',
      indices: [i],
      values: [dp[i]],
      codeLine: 6,
      description: `dp[${i}] = ${dp[i]}`,
      timestamp: 0,
      dpTable: dp.slice(),
      dpRows: 1,
      dpCols: n + 1,
    });
  }

  steps.push({
    type: 'sorted',
    indices: [],
    codeLine: null,
    description: `Fibonacci(${n}) = ${dp[n]}`,
    timestamp: 0,
    dpTable: dp.slice(),
    dpRows: 1,
    dpCols: n + 1,
  });

  steps.forEach((step, i) => {
    step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
  });

  return {
    steps,
    metadata: {
      name: 'Fibonacci (DP)',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      description: 'Computes Fibonacci numbers using dynamic programming.',
    },
  };
}

/**
 * 0/1 Knapsack step generator.
 */
export function knapsack(weights, values, capacity) {
  const steps = [];
  const n = weights.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));

  steps.push({
    type: 'highlight',
    indices: [],
    codeLine: 2,
    description: `Initialize DP table: ${n + 1} rows × ${capacity + 1} columns`,
    timestamp: 0,
    dpTable: dp.map(r => [...r]),
    dpRows: n + 1,
    dpCols: capacity + 1,
    dpRowLabels: ['0', ...weights.map((_, i) => `Item ${i + 1}`)],
    dpColLabels: Array.from({ length: capacity + 1 }, (_, i) => String(i)),
  });

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - weights[i - 1]] + values[i - 1]);

        steps.push({
          type: 'set',
          indices: [[i, w]],
          values: [dp[i][w]],
          codeLine: 7,
          description: `dp[${i}][${w}] = max(${dp[i-1][w]}, ${dp[i-1][w-weights[i-1]]} + ${values[i-1]}) = ${dp[i][w]}`,
          timestamp: 0,
          dpTable: dp.map(r => [...r]),
          dpRows: n + 1,
          dpCols: capacity + 1,
          dpRowLabels: ['0', ...weights.map((_, i) => `Item ${i + 1}`)],
          dpColLabels: Array.from({ length: capacity + 1 }, (_, i) => String(i)),
        });
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  steps.push({
    type: 'sorted',
    indices: [],
    codeLine: null,
    description: `Maximum value: ${dp[n][capacity]}`,
    timestamp: 0,
    dpTable: dp.map(r => [...r]),
    dpRows: n + 1,
    dpCols: capacity + 1,
  });

  steps.forEach((step, i) => {
    step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
  });

  return {
    steps,
    metadata: {
      name: '0/1 Knapsack',
      timeComplexity: 'O(n × W)',
      spaceComplexity: 'O(n × W)',
      description: 'Selects items with maximum value while staying within weight capacity.',
    },
  };
}

/**
 * Longest Common Subsequence step generator.
 */
export function lcs(text1, text2) {
  const steps = [];
  const m = text1.length;
  const n = text2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  steps.push({
    type: 'highlight',
    indices: [],
    codeLine: 2,
    description: `Initialize DP table for LCS of "${text1}" and "${text2}"`,
    timestamp: 0,
    dpTable: dp.map(r => [...r]),
    dpRows: m + 1,
    dpCols: n + 1,
    dpRowLabels: ['', ...text1.split('')],
    dpColLabels: ['', ...text2.split('')],
  });

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        steps.push({
          type: 'set',
          indices: [[i, j]],
          values: [dp[i][j]],
          codeLine: 6,
          description: `Match '${text1[i-1]}': dp[${i}][${j}] = dp[${i-1}][${j-1}] + 1 = ${dp[i][j]}`,
          timestamp: 0,
          dpTable: dp.map(r => [...r]),
          dpRows: m + 1,
          dpCols: n + 1,
          dpRowLabels: ['', ...text1.split('')],
          dpColLabels: ['', ...text2.split('')],
        });
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        steps.push({
          type: 'visit',
          indices: [[i, j]],
          codeLine: 8,
          description: `No match: dp[${i}][${j}] = max(${dp[i-1][j]}, ${dp[i][j-1]}) = ${dp[i][j]}`,
          timestamp: 0,
          dpTable: dp.map(r => [...r]),
          dpRows: m + 1,
          dpCols: n + 1,
          dpRowLabels: ['', ...text1.split('')],
          dpColLabels: ['', ...text2.split('')],
        });
      }
    }
  }

  steps.push({
    type: 'sorted',
    indices: [],
    codeLine: null,
    description: `LCS length: ${dp[m][n]}`,
    timestamp: 0,
    dpTable: dp.map(r => [...r]),
    dpRows: m + 1,
    dpCols: n + 1,
  });

  steps.forEach((step, i) => {
    step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
  });

  return {
    steps,
    metadata: {
      name: 'Longest Common Subsequence',
      timeComplexity: 'O(m × n)',
      spaceComplexity: 'O(m × n)',
      description: 'Finds the longest subsequence common to two sequences.',
    },
  };
}

/**
 * Coin Change step generator.
 */
export function coinChange(coins, amount) {
  const steps = [];
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;

  steps.push({
    type: 'set',
    indices: [0],
    values: [0],
    codeLine: 2,
    description: `Initialize: dp[0] = 0`,
    timestamp: 0,
    dpTable: dp.map(v => v === Infinity ? -1 : v),
    dpRows: 1,
    dpCols: amount + 1,
    dpColLabels: Array.from({ length: amount + 1 }, (_, i) => String(i)),
  });

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i && dp[i - coin] !== Infinity) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }

    steps.push({
      type: 'set',
      indices: [i],
      values: [dp[i] === Infinity ? -1 : dp[i]],
      codeLine: 8,
      description: `dp[${i}] = ${dp[i] === Infinity ? '∞' : dp[i]}`,
      timestamp: 0,
      dpTable: dp.map(v => v === Infinity ? -1 : v),
      dpRows: 1,
      dpCols: amount + 1,
      dpColLabels: Array.from({ length: amount + 1 }, (_, i) => String(i)),
    });
  }

  steps.push({
    type: 'sorted',
    indices: [],
    codeLine: null,
    description: dp[amount] === Infinity
      ? `Amount ${amount} cannot be made with given coins`
      : `Minimum coins for ${amount}: ${dp[amount]}`,
    timestamp: 0,
    dpTable: dp.map(v => v === Infinity ? -1 : v),
    dpRows: 1,
    dpCols: amount + 1,
  });

  steps.forEach((step, i) => {
    step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
  });

  return {
    steps,
    metadata: {
      name: 'Coin Change',
      timeComplexity: 'O(amount × coins)',
      spaceComplexity: 'O(amount)',
      description: 'Finds minimum number of coins to make a given amount.',
    },
  };
}

export const dpAlgorithms = { fibonacciDP, knapsack, lcs, coinChange };

export function getDPAlgorithm(name) {
  const key = name.toLowerCase().replace(/[\s-]/g, '');
  return dpAlgorithms[key] || fibonacciDP;
}
