/**
 * AlgoVerse V2 — Sorting Algorithm Step Generators
 *
 * Each function takes input data and returns { steps, metadata }.
 * Steps are arrays of AnimationStep objects.
 */

/**
 * Generate merge sort animation steps.
 * @param {number[]} inputArray
 * @returns {import('../types').AlgorithmResult}
 */
export function mergeSort(inputArray) {
  const arr = [...inputArray];
  const steps = [];

  function merge(left, mid, right) {
    const leftArr = arr.slice(left, mid + 1);
    const rightArr = arr.slice(mid + 1, right + 1);
    let i = 0, j = 0, k = left;

    while (i < leftArr.length && j < rightArr.length) {
      steps.push({
        type: 'compare',
        indices: [left + i, mid + 1 + j],
        codeLine: 7,
        description: `Merge [${left}..${right}]: Compare ${leftArr[i]} and ${rightArr[j]}`,
        timestamp: 0,
        partitionRange: [left, right],
      });

      if (leftArr[i] <= rightArr[j]) {
        arr[k] = leftArr[i];
        steps.push({
          type: 'set',
          indices: [k],
          values: [leftArr[i]],
          codeLine: 8,
          description: `Place ${leftArr[i]} at position ${k}`,
          timestamp: 0,
          partitionRange: [left, right],
        });
        i++;
      } else {
        arr[k] = rightArr[j];
        steps.push({
          type: 'set',
          indices: [k],
          values: [rightArr[j]],
          codeLine: 10,
          description: `Place ${rightArr[j]} at position ${k}`,
          timestamp: 0,
          partitionRange: [left, right],
        });
        j++;
      }
      k++;
    }

    while (i < leftArr.length) {
      arr[k] = leftArr[i];
      steps.push({
        type: 'set',
        indices: [k],
        values: [leftArr[i]],
        codeLine: 13,
        description: `Place remaining ${leftArr[i]} at position ${k}`,
        timestamp: 0,
        partitionRange: [left, right],
      });
      i++;
      k++;
    }

    while (j < rightArr.length) {
      arr[k] = rightArr[j];
      steps.push({
        type: 'set',
        indices: [k],
        values: [rightArr[j]],
        codeLine: 15,
        description: `Place remaining ${rightArr[j]} at position ${k}`,
        timestamp: 0,
        partitionRange: [left, right],
      });
      j++;
      k++;
    }
  }

  function sort(left, right) {
    if (left >= right) return;

    const mid = Math.floor((left + right) / 2);

    steps.push({
      type: 'highlight',
      indices: Array.from({ length: right - left + 1 }, (_, i) => left + i),
      codeLine: 3,
      description: `Divide: split [${left}..${right}] → [${left}..${mid}] + [${mid+1}..${right}]`,
      timestamp: 0,
      partitionRange: [left, right],
    });

    sort(left, mid);
    sort(mid + 1, right);
    merge(left, mid, right);

    steps.push({
      type: 'highlight',
      indices: Array.from({ length: right - left + 1 }, (_, i) => left + i),
      codeLine: 3,
      description: `Merged [${left}..${right}]: [${arr.slice(left, right+1).join(', ')}]`,
      timestamp: 0,
      partitionRange: [left, right],
    });
  }

  sort(0, arr.length - 1);

  // Mark all as sorted
  steps.push({
    type: 'sorted',
    indices: Array.from({ length: arr.length }, (_, i) => i),
    codeLine: null,
    description: 'Array is sorted!',
    timestamp: 0,
  });

  // Assign timestamps (0-1 range)
  steps.forEach((step, i) => {
    step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
  });

  return {
    steps,
    metadata: {
      name: 'Merge Sort',
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(n)',
      description: 'A divide-and-conquer algorithm that divides the array into halves, sorts them separately, and then merges them back together.',
    },
  };
}

/**
 * Generate bubble sort animation steps.
 * @param {number[]} inputArray
 * @returns {import('../types').AlgorithmResult}
 */
export function bubbleSort(inputArray) {
  const arr = [...inputArray];
  const steps = [];
  const n = arr.length;

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({
        type: 'compare',
        indices: [j, j + 1],
        codeLine: 4,
        description: `Comparing ${arr[j]} and ${arr[j + 1]}`,
        timestamp: 0,
      });

      if (arr[j] > arr[j + 1]) {
        const [a, b] = [arr[j], arr[j + 1]];
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        steps.push({
          type: 'swap',
          indices: [j, j + 1],
          values: [arr[j], arr[j + 1]],
          codeLine: 5,
          description: `Swap ${a} and ${b}`,
          timestamp: 0,
        });
      }
    }
    steps.push({
      type: 'sorted',
      indices: [n - i - 1],
      codeLine: null,
      description: `${arr[n - i - 1]} is in its final position`,
      timestamp: 0,
    });
  }

  steps.push({
    type: 'sorted',
    indices: [0],
    codeLine: null,
    description: 'Array is sorted!',
    timestamp: 0,
  });

  steps.forEach((step, i) => {
    step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
  });

  return {
    steps,
    metadata: {
      name: 'Bubble Sort',
      timeComplexity: 'O(n²)',
      spaceComplexity: 'O(1)',
      description: 'A simple sorting algorithm that repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.',
    },
  };
}

/**
 * Generate quicksort animation steps.
 * @param {number[]} inputArray
 * @returns {import('../types').AlgorithmResult}
 */
export function quickSort(inputArray) {
  const arr = [...inputArray];
  const steps = [];
  const sortedIndices = new Set();

  function partition(low, high) {
    const pivot = arr[high];
    steps.push({
      type: 'highlight',
      indices: [high],
      codeLine: 3,
      description: `Pivot selected: ${pivot} | Partition [${low}..${high}]`,
      timestamp: 0,
      partitionRange: [low, high],
      sortedIndices: [...sortedIndices],
    });

    let i = low - 1;

    for (let j = low; j < high; j++) {
      steps.push({
        type: 'compare',
        indices: [j, high],
        codeLine: 5,
        description: `Compare ${arr[j]} with pivot ${pivot}`,
        timestamp: 0,
        partitionRange: [low, high],
        sortedIndices: [...sortedIndices],
      });

      if (arr[j] < pivot) {
        i++;
        const [a, b] = [arr[i], arr[j]];
        [arr[i], arr[j]] = [arr[j], arr[i]];
        steps.push({
          type: 'swap',
          indices: [i, j],
          values: [arr[i], arr[j]],
          codeLine: 6,
          description: `Swap ${a} and ${b}`,
          timestamp: 0,
          partitionRange: [low, high],
          sortedIndices: [...sortedIndices],
        });
      }
    }

    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    steps.push({
      type: 'swap',
      indices: [i + 1, high],
      values: [arr[i + 1], arr[high]],
      codeLine: 8,
      description: `Place pivot ${pivot} at position ${i + 1}`,
      timestamp: 0,
      partitionRange: [low, high],
      sortedIndices: [...sortedIndices],
    });

    sortedIndices.add(i + 1);
    steps.push({
      type: 'sorted',
      indices: [i + 1],
      codeLine: null,
      description: `${pivot} is in its final position`,
      timestamp: 0,
      partitionRange: null,
      sortedIndices: [...sortedIndices],
    });

    return i + 1;
  }

  function sort(low, high) {
    if (low < high) {
      const pi = partition(low, high);
      sort(low, pi - 1);
      sort(pi + 1, high);
    }
  }

  sort(0, arr.length - 1);

  steps.push({
    type: 'sorted',
    indices: Array.from({ length: arr.length }, (_, i) => i),
    codeLine: null,
    description: 'Array is sorted!',
    timestamp: 0,
  });

  steps.forEach((step, i) => {
    step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
  });

  return {
    steps,
    metadata: {
      name: 'Quick Sort',
      timeComplexity: 'O(n log n) average',
      spaceComplexity: 'O(log n)',
      description: 'A divide-and-conquer algorithm that selects a pivot element and partitions the array around it.',
    },
  };
}

/**
 * Generate insertion sort animation steps.
 * @param {number[]} inputArray
 * @returns {import('../types').AlgorithmResult}
 */
export function insertionSort(inputArray) {
  const arr = [...inputArray];
  const steps = [];

  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;

    steps.push({
      type: 'visit',
      indices: [i],
      codeLine: 2,
      description: `Insert ${key} into sorted portion`,
      timestamp: 0,
    });

    while (j >= 0 && arr[j] > key) {
      steps.push({
        type: 'compare',
        indices: [j, j + 1],
        codeLine: 4,
        description: `Comparing ${arr[j]} > ${key}`,
        timestamp: 0,
      });

      arr[j + 1] = arr[j];
      steps.push({
        type: 'set',
        indices: [j + 1],
        values: [arr[j]],
        codeLine: 5,
        description: `Shift ${arr[j]} right`,
        timestamp: 0,
      });
      j--;
    }

    arr[j + 1] = key;
    steps.push({
      type: 'set',
      indices: [j + 1],
      values: [key],
      codeLine: 7,
      description: `Place ${key} at position ${j + 1}`,
      timestamp: 0,
    });
  }

  steps.push({
    type: 'sorted',
    indices: Array.from({ length: arr.length }, (_, i) => i),
    codeLine: null,
    description: 'Array is sorted!',
    timestamp: 0,
  });

  steps.forEach((step, i) => {
    step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
  });

  return {
    steps,
    metadata: {
      name: 'Insertion Sort',
      timeComplexity: 'O(n²)',
      spaceComplexity: 'O(1)',
      description: 'A simple sorting algorithm that builds the final sorted array one item at a time.',
    },
  };
}

/**
 * Generate selection sort animation steps.
 * @param {number[]} inputArray
 * @returns {import('../types').AlgorithmResult}
 */
export function selectionSort(inputArray) {
  const arr = [...inputArray];
  const steps = [];
  const n = arr.length;

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    steps.push({
      type: 'visit',
      indices: [i],
      codeLine: 2,
      description: `Finding minimum in unsorted portion starting at ${i}`,
      timestamp: 0,
    });

    for (let j = i + 1; j < n; j++) {
      steps.push({
        type: 'compare',
        indices: [minIdx, j],
        codeLine: 4,
        description: `Comparing ${arr[minIdx]} with ${arr[j]}`,
        timestamp: 0,
      });

      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }

    if (minIdx !== i) {
      const [a, b] = [arr[i], arr[minIdx]];
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      steps.push({
        type: 'swap',
        indices: [i, minIdx],
        values: [arr[i], arr[minIdx]],
        codeLine: 7,
        description: `Swap ${a} and ${b}`,
        timestamp: 0,
      });
    }

    steps.push({
      type: 'sorted',
      indices: [i],
      codeLine: null,
      description: `${arr[i]} is in its final position`,
      timestamp: 0,
    });
  }

  steps.push({
    type: 'sorted',
    indices: [n - 1],
    codeLine: null,
    description: 'Array is sorted!',
    timestamp: 0,
  });

  steps.forEach((step, i) => {
    step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
  });

  return {
    steps,
    metadata: {
      name: 'Selection Sort',
      timeComplexity: 'O(n²)',
      spaceComplexity: 'O(1)',
      description: 'A simple sorting algorithm that repeatedly finds the minimum element and places it at the beginning.',
    },
  };
}

/**
 * Generate heap sort animation steps.
 * @param {number[]} inputArray
 * @returns {import('../types').AlgorithmResult}
 */
export function heapSort(inputArray) {
  const arr = [...inputArray];
  const steps = [];
  const n = arr.length;

  function heapify(size, root) {
    let largest = root;
    const left = 2 * root + 1;
    const right = 2 * root + 2;

    if (left < size) {
      steps.push({
        type: 'compare',
        indices: [left, largest],
        codeLine: 4,
        description: `Comparing left child ${arr[left]} with ${arr[largest]}`,
        timestamp: 0,
      });
      if (arr[left] > arr[largest]) largest = left;
    }

    if (right < size) {
      steps.push({
        type: 'compare',
        indices: [right, largest],
        codeLine: 6,
        description: `Comparing right child ${arr[right]} with ${arr[largest]}`,
        timestamp: 0,
      });
      if (arr[right] > arr[largest]) largest = right;
    }

    if (largest !== root) {
      const [a, b] = [arr[root], arr[largest]];
      [arr[root], arr[largest]] = [arr[largest], arr[root]];
      steps.push({
        type: 'swap',
        indices: [root, largest],
        values: [arr[root], arr[largest]],
        codeLine: 9,
        description: `Swap ${a} and ${b}`,
        timestamp: 0,
      });
      heapify(size, largest);
    }
  }

  // Build max heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(n, i);
  }

  // Extract elements
  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    steps.push({
      type: 'swap',
      indices: [0, i],
      values: [arr[0], arr[i]],
      codeLine: 14,
      description: `Move ${arr[0]} to end`,
      timestamp: 0,
    });
    steps.push({
      type: 'sorted',
      indices: [i],
      codeLine: null,
      description: `${arr[i]} is in its final position`,
      timestamp: 0,
    });
    heapify(i, 0);
  }

  steps.push({
    type: 'sorted',
    indices: [0],
    codeLine: null,
    description: 'Array is sorted!',
    timestamp: 0,
  });

  steps.forEach((step, i) => {
    step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
  });

  return {
    steps,
    metadata: {
      name: 'Heap Sort',
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(1)',
      description: 'A comparison-based sorting algorithm that uses a binary heap data structure.',
    },
  };
}

/** Map of all sorting algorithms */
export const sortingAlgorithms = {
  bubbleSort,
  selectionSort,
  insertionSort,
  quickSort,
  mergeSort,
  heapSort,
};

/** Get algorithm by name */
export function getSortingAlgorithm(name) {
  const key = name.toLowerCase().replace(/[\s-]/g, '');
  return sortingAlgorithms[key] || bubbleSort;
}
