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

/**
 * Convert a BST to a level-order array for the TreeRenderer
 * (trailing nulls trimmed).
 */
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
  while (result.length > 0 && result[result.length - 1] === null) result.pop();
  return result;
}

/**
 * Build a BST from a list of values (same placement rule as BST Insert:
 * smaller left, everything else right).
 */
function buildBst(values) {
  let root = null;

  function insert(node, value) {
    if (node === null) return { value, left: null, right: null };
    if (value < node.value) node.left = insert(node.left, value);
    else node.right = insert(node.right, value);
    return node;
  }

  for (const value of values) root = insert(root, value);
  return root;
}

/**
 * BST Search step generator.
 *
 * Builds the tree from the given values, then searches for the last value
 * inserted (a deep target, so the demo shows several decisions).
 */
export function bstSearch(values) {
  const steps = [];
  const root = buildBst(values);
  const tree = treeToArray(root);
  const target = values[values.length - 1];

  steps.push({
    type: 'visit',
    indices: [],
    codeLine: 1,
    description: `Search for ${target} in the BST built from [${values.join(', ')}].`,
    timestamp: 0,
    treeData: tree,
  });

  let current = root;
  let comparisons = 0;
  let found = false;

  while (current) {
    comparisons += 1;
    if (target === current.value) {
      steps.push({
        type: 'found',
        indices: [current.value],
        codeLine: 3,
        description: `Found ${target} after ${comparisons} comparison${comparisons === 1 ? '' : 's'}.`,
        timestamp: 0,
        treeData: tree,
      });
      found = true;
      break;
    }

    const goLeft = target < current.value;
    steps.push({
      type: 'compare',
      indices: [current.value],
      codeLine: 3,
      description: `Compare ${target} with ${current.value}: ${target} ${goLeft ? '<' : '>'} ${current.value}, go ${goLeft ? 'left' : 'right'}.`,
      timestamp: 0,
      treeData: tree,
    });
    current = goLeft ? current.left : current.right;
  }

  if (!found) {
    steps.push({
      type: 'visit',
      indices: [],
      codeLine: 5,
      description: `${target} is not in the tree — the walk ended at a null child.`,
      timestamp: 0,
      treeData: tree,
    });
  }

  steps.push({
    type: 'visit',
    indices: [],
    codeLine: null,
    description: 'Each comparison discards one whole subtree: O(log n) steps on a balanced tree, O(n) on a degenerate one.',
    timestamp: 0,
    treeData: tree,
  });

  steps.forEach((s, i) => { s.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0; });

  return {
    steps,
    metadata: {
      name: 'BST Search',
      timeComplexity: 'O(log n) average, O(n) worst',
      spaceComplexity: 'O(1)',
      description: 'Walks from the root, going left for smaller and right for larger keys, until the value is found or a null child ends the search.',
    },
  };
}

/**
 * BST (in-order) Traversal step generator.
 *
 * Visits left subtree, then the node, then the right subtree — which reads
 * the keys of a BST out in sorted order.
 */
export function bstTraversal(values) {
  const steps = [];
  const root = buildBst(values);
  const tree = treeToArray(root);
  const output = [];

  steps.push({
    type: 'visit',
    indices: [],
    codeLine: 1,
    description: `In-order traversal of the BST built from [${values.join(', ')}]: left subtree, then the node, then the right subtree.`,
    timestamp: 0,
    treeData: tree,
  });

  function inOrder(node) {
    if (!node) return;
    inOrder(node.left);
    output.push(node.value);
    steps.push({
      type: 'sorted',
      indices: [node.value],
      codeLine: 4,
      description: `Visit ${node.value} — every smaller key is already out, so it takes position ${output.length} in [${output.join(', ')}].`,
      timestamp: 0,
      treeData: tree,
    });
    inOrder(node.right);
  }

  inOrder(root);

  steps.push({
    type: 'sorted',
    indices: [...output],
    codeLine: null,
    description: `In-order output: [${output.join(', ')}] — sorted, which is the BST ordering invariant restated.`,
    timestamp: 0,
    treeData: tree,
  });

  steps.forEach((s, i) => { s.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0; });

  return {
    steps,
    metadata: {
      name: 'BST In-Order Traversal',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(h) recursion stack',
      description: 'Visits the left subtree, the node, then the right subtree — producing the keys of a BST in sorted order.',
    },
  };
}

export const treeAlgorithms = { bstInsert, heapInsert, bstSearch, bstTraversal };

export function getTreeAlgorithm(name) {
  const key = name.toLowerCase().replace(/[\s-]/g, '');
  return treeAlgorithms[key] || bstInsert;
}
