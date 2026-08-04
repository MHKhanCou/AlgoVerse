/**
 * AlgoVerse V2 — Tree Algorithm Step Generators
 *
 * Each step includes treeData (level-order array) for TreeRenderer.
 */

/**
 * BST Insert step generator.
 */
export function bstInsert(values) {
  const steps = [];
  let root = null;

  function insert(node, value) {
    if (node === null) return { value, left: null, right: null };
    if (value < node.value) node.left = insert(node.left, value);
    else node.right = insert(node.right, value);
    return node;
  }

  // Convert BST to level-order array for rendering
  function treeToArray(root) {
    if (!root) return [];
    const result = [];
    const queue = [root];
    while (queue.length) {
      const node = queue.shift();
      if (node) {
        result.push(node.value);
        queue.push(node.left);
        queue.push(node.right);
      } else {
        result.push(null);
      }
    }
    // Trim trailing nulls
    while (result.length > 0 && result[result.length - 1] === null) result.pop();
    return result;
  }

  steps.push({
    type: 'visit',
    indices: [],
    codeLine: 1,
    description: `Start BST insertion with values: [${values.join(', ')}]`,
    timestamp: 0,
    treeData: [],
  });

  let current = root;
  for (const val of values) {
    steps.push({
      type: 'compare',
      indices: [val],
      codeLine: 3,
      description: `Insert ${val} into BST`,
      timestamp: 0,
      treeData: treeToArray(root),
    });

    current = insert(current, val);
    if (!root) root = current;

    steps.push({
      type: 'set',
      indices: [val],
      values: [val],
      codeLine: 5,
      description: `Inserted ${val}`,
      timestamp: 0,
      treeData: treeToArray(root),
    });
  }

  steps.push({
    type: 'sorted',
    indices: [],
    codeLine: null,
    description: `BST construction complete! Root: ${root?.value}`,
    timestamp: 0,
    treeData: treeToArray(root),
  });

  steps.forEach((s, i) => { s.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0; });

  return {
    steps,
    metadata: {
      name: 'BST Insert',
      timeComplexity: 'O(log n) average',
      spaceComplexity: 'O(log n)',
      description: 'Inserts values into a Binary Search Tree.',
    },
  };
}

/**
 * Heap Insert step generator.
 */
export function heapInsert(values) {
  const steps = [];
  const heap = [];

  function heapifyUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (heap[parent] < heap[index]) {
        steps.push({
          type: 'swap',
          indices: [parent, index],
          values: [heap[parent], heap[index]],
          codeLine: 5,
          description: `Swap ${heap[parent]} and ${heap[index]} to maintain heap property`,
          timestamp: 0,
          treeData: [...heap],
        });
        [heap[parent], heap[index]] = [heap[index], heap[parent]];
        index = parent;
      } else {
        break;
      }
    }
  }

  steps.push({
    type: 'visit',
    indices: [],
    codeLine: 1,
    description: `Start Max-Heap insertion with values: [${values.join(', ')}]`,
    timestamp: 0,
    treeData: [],
  });

  for (const val of values) {
    steps.push({
      type: 'compare',
      indices: [val],
      codeLine: 3,
      description: `Insert ${val} into heap`,
      timestamp: 0,
      treeData: [...heap],
    });

    heap.push(val);
    steps.push({
      type: 'set',
      indices: [heap.length - 1],
      values: [val],
      codeLine: 5,
      description: `Add ${val} to end of heap`,
      timestamp: 0,
      treeData: [...heap],
    });

    heapifyUp(heap.length - 1);
  }

  steps.push({
    type: 'sorted',
    indices: [],
    codeLine: null,
    description: `Heap construction complete! Root: ${heap[0]}`,
    timestamp: 0,
    treeData: [...heap],
  });

  steps.forEach((s, i) => { s.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0; });

  return {
    steps,
    metadata: {
      name: 'Heap Insert',
      timeComplexity: 'O(log n)',
      spaceComplexity: 'O(n)',
      description: 'Inserts values into a Max-Heap with heapify-up.',
    },
  };
}

export const treeAlgorithms = { bstInsert, heapInsert };

export function getTreeAlgorithm(name) {
  const key = name.toLowerCase().replace(/[\s-]/g, '');
  return treeAlgorithms[key] || bstInsert;
}
