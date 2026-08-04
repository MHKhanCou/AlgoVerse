/**
 * AlgoVerse V2 — Search Algorithm Step Generators
 */

/**
 * Linear search step generator.
 * @param {number[]} arr - Sorted or unsorted array
 * @param {number} target - Value to find
 * @returns {import('../types').AlgorithmResult}
 */
export function linearSearch(arr, target) {
  const steps = [];

  for (let i = 0; i < arr.length; i++) {
    steps.push({
      type: 'compare',
      indices: [i],
      codeLine: 3,
      description: `Check index ${i}: ${arr[i]} ${arr[i] === target ? '==' : '!='} ${target}`,
      timestamp: 0,
    });

    if (arr[i] === target) {
      steps.push({
        type: 'found',
        indices: [i],
        codeLine: 4,
        description: `Found ${target} at index ${i}!`,
        timestamp: 0,
      });

      steps.forEach((step, idx) => {
        step.timestamp = steps.length > 1 ? idx / (steps.length - 1) : 0;
      });

      return {
        steps,
        metadata: {
          name: 'Linear Search',
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(1)',
          description: 'Checks each element sequentially until the target is found.',
        },
      };
    }
  }

  steps.push({
    type: 'message',
    indices: [],
    codeLine: 6,
    description: `${target} not found in the array`,
    timestamp: 0,
  });

  steps.forEach((step, i) => {
    step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
  });

  return {
    steps,
    metadata: {
      name: 'Linear Search',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      description: 'Checks each element sequentially until the target is found.',
    },
  };
}

/**
 * Binary search step generator.
 * @param {number[]} arr - Must be sorted
 * @param {number} target - Value to find
 * @returns {import('../types').AlgorithmResult}
 */
export function binarySearch(arr, target) {
  const steps = [];
  let left = 0;
  let right = arr.length - 1;

  steps.push({
    type: 'highlight',
    indices: Array.from({ length: arr.length }, (_, i) => i),
    codeLine: 2,
    description: `Search for ${target} in range [0, ${arr.length - 1}]`,
    timestamp: 0,
  });

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    steps.push({
      type: 'visit',
      indices: [mid],
      codeLine: 4,
      description: `Check middle index ${mid}: ${arr[mid]}`,
      timestamp: 0,
    });

    steps.push({
      type: 'compare',
      indices: [mid],
      codeLine: 5,
      description: `Comparing ${arr[mid]} with ${target}`,
      timestamp: 0,
    });

    if (arr[mid] === target) {
      steps.push({
        type: 'found',
        indices: [mid],
        codeLine: 6,
        description: `Found ${target} at index ${mid}!`,
        timestamp: 0,
      });

      steps.forEach((step, i) => {
        step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
      });

      return {
        steps,
        metadata: {
          name: 'Binary Search',
          timeComplexity: 'O(log n)',
          spaceComplexity: 'O(1)',
          description: 'Finds target by repeatedly dividing the search interval in half.',
        },
      };
    } else if (arr[mid] < target) {
      steps.push({
        type: 'highlight',
        indices: Array.from({ length: right - left + 1 }, (_, i) => left + i),
        codeLine: 8,
        description: `${arr[mid]} < ${target}, search right half`,
        timestamp: 0,
      });
      left = mid + 1;
    } else {
      steps.push({
        type: 'highlight',
        indices: Array.from({ length: right - left + 1 }, (_, i) => left + i),
        codeLine: 10,
        description: `${arr[mid]} > ${target}, search left half`,
        timestamp: 0,
      });
      right = mid - 1;
    }
  }

  steps.push({
    type: 'message',
    indices: [],
    codeLine: 12,
    description: `${target} not found in the array`,
    timestamp: 0,
  });

  steps.forEach((step, i) => {
    step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
  });

  return {
    steps,
    metadata: {
      name: 'Binary Search',
      timeComplexity: 'O(log n)',
      spaceComplexity: 'O(1)',
      description: 'Finds target by repeatedly dividing the search interval in half.',
    },
  };
}

/**
 * Jump Search step generator.
 * @param {number[]} arr - Must be sorted
 * @param {number} target - Value to find
 * @returns {import('../types').AlgorithmResult}
 */
export function jumpSearch(arr, target) {
  const steps = [];
  const n = arr.length;
  const jump = Math.floor(Math.sqrt(n));

  steps.push({
    type: 'highlight',
    indices: Array.from({ length: n }, (_, i) => i),
    codeLine: 2,
    description: `Jump size: ${jump} (sqrt of ${n})`,
    timestamp: 0,
  });

  let prev = 0;
  let step = jump;

  // Jump forward to find the block
  while (step < n && arr[step] < target) {
    steps.push({
      type: 'visit',
      indices: [step],
      codeLine: 5,
      description: `Jump to index ${step}: ${arr[step]} < ${target}`,
      timestamp: 0,
    });
    prev = step;
    step += jump;
  }

  // Linear search within the block
  steps.push({
    type: 'highlight',
    indices: Array.from({ length: Math.min(jump, n - prev) }, (_, i) => prev + i),
    codeLine: 8,
    description: `Linear search in block [${prev}, ${Math.min(step, n) - 1}]`,
    timestamp: 0,
  });

  for (let i = prev; i < Math.min(step, n); i++) {
    steps.push({
      type: 'compare',
      indices: [i],
      codeLine: 10,
      description: `Check index ${i}: ${arr[i]} ${arr[i] === target ? '==' : '!='} ${target}`,
      timestamp: 0,
    });

    if (arr[i] === target) {
      steps.push({
        type: 'found',
        indices: [i],
        codeLine: 11,
        description: `Found ${target} at index ${i}!`,
        timestamp: 0,
      });
      steps.forEach((s, idx) => { s.timestamp = steps.length > 1 ? idx / (steps.length - 1) : 0; });
      return {
        steps,
        metadata: {
          name: 'Jump Search',
          timeComplexity: 'O(√n)',
          spaceComplexity: 'O(1)',
          description: 'Finds target by jumping ahead by fixed steps, then doing linear search.',
        },
      };
    }
  }

  steps.push({
    type: 'message',
    indices: [],
    codeLine: 13,
    description: `${target} not found in the array`,
    timestamp: 0,
  });

  steps.forEach((s, idx) => { s.timestamp = steps.length > 1 ? idx / (steps.length - 1) : 0; });

  return {
    steps,
    metadata: {
      name: 'Jump Search',
      timeComplexity: 'O(√n)',
      spaceComplexity: 'O(1)',
      description: 'Finds target by jumping ahead by fixed steps, then doing linear search.',
    },
  };
}

/**
 * Exponential Search step generator.
 * @param {number[]} arr - Must be sorted
 * @param {number} target - Value to find
 * @returns {import('../types').AlgorithmResult}
 */
export function exponentialSearch(arr, target) {
  const steps = [];
  const n = arr.length;

  if (n === 0) {
    steps.push({ type: 'message', indices: [], codeLine: 1, description: 'Empty array', timestamp: 0 });
    return { steps, metadata: { name: 'Exponential Search', timeComplexity: 'O(log n)', spaceComplexity: 'O(1)', description: 'Finds range then uses binary search.' } };
  }

  // Step 1: Find range
  let bound = 1;
  steps.push({
    type: 'visit',
    indices: [0],
    codeLine: 3,
    description: `Start: check index 0`,
    timestamp: 0,
  });

  if (arr[0] === target) {
    steps.push({ type: 'found', indices: [0], codeLine: 4, description: `Found ${target} at index 0!`, timestamp: 0 });
    steps.forEach((s, idx) => { s.timestamp = steps.length > 1 ? idx / (steps.length - 1) : 0; });
    return { steps, metadata: { name: 'Exponential Search', timeComplexity: 'O(log n)', spaceComplexity: 'O(1)', description: 'Finds range then uses binary search.' } };
  }

  while (bound < n && arr[bound] <= target) {
    steps.push({
      type: 'visit',
      indices: [bound],
      codeLine: 6,
      description: `Double range: index ${bound}, value ${arr[bound]}`,
      timestamp: 0,
    });
    bound *= 2;
  }

  // Step 2: Binary search in the found range
  const left = Math.floor(bound / 2);
  const right = Math.min(bound, n - 1);

  steps.push({
    type: 'highlight',
    indices: Array.from({ length: right - left + 1 }, (_, i) => left + i),
    codeLine: 9,
    description: `Binary search in range [${left}, ${right}]`,
    timestamp: 0,
  });

  // Now do binary search
  let l = left, r = right;
  while (l <= r) {
    const mid = Math.floor((l + r) / 2);
    steps.push({
      type: 'compare',
      indices: [mid],
      codeLine: 11,
      description: `Check index ${mid}: ${arr[mid]} ${arr[mid] === target ? '==' : '!='} ${target}`,
      timestamp: 0,
    });

    if (arr[mid] === target) {
      steps.push({ type: 'found', indices: [mid], codeLine: 12, description: `Found ${target} at index ${mid}!`, timestamp: 0 });
      steps.forEach((s, idx) => { s.timestamp = steps.length > 1 ? idx / (steps.length - 1) : 0; });
      return { steps, metadata: { name: 'Exponential Search', timeComplexity: 'O(log n)', spaceComplexity: 'O(1)', description: 'Finds range then uses binary search.' } };
    } else if (arr[mid] < target) {
      l = mid + 1;
    } else {
      r = mid - 1;
    }
  }

  steps.push({ type: 'message', indices: [], codeLine: 14, description: `${target} not found in the array`, timestamp: 0 });
  steps.forEach((s, idx) => { s.timestamp = steps.length > 1 ? idx / (steps.length - 1) : 0; });

  return {
    steps,
    metadata: {
      name: 'Exponential Search',
      timeComplexity: 'O(log n)',
      spaceComplexity: 'O(1)',
      description: 'Finds range by doubling, then uses binary search.',
    },
  };
}

/** Map of all search algorithms */
export const searchAlgorithms = { linearSearch, binarySearch, jumpSearch, exponentialSearch };

/** Get algorithm by name */
export function getSearchAlgorithm(name) {
  const key = name.toLowerCase().replace(/[\s-]/g, '');
  return searchAlgorithms[key] || linearSearch;
}
