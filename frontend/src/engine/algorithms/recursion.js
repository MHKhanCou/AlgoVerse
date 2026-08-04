/**
 * AlgoVerse V2 — Recursion Step Generators
 *
 * Each generator produces steps with treeNodes[] and callStack[] for visualization.
 * treeNodes: { id, label, parentId, result, state, depth }
 * callStack: string[] of current function calls
 */

/**
 * Fibonacci recursion step generator.
 */
export function fibonacci(n) {
  const steps = [];
  const memo = {};
  const treeNodes = [];
  const callStack = [];
  let nodeId = 0;

  function fib(num, parentId = null) {
    const myId = nodeId++;

    treeNodes.push({ id: myId, label: `fib(${num})`, parentId, result: null, state: 'current', depth: callStack.length });
    callStack.push(`fib(${num})`);

    if (num <= 1) {
      memo[num] = num;
      treeNodes[myId] = { ...treeNodes[myId], result: num, state: 'resolved' };
      steps.push({
        type: 'visit',
        indices: [num],
        codeLine: 2,
        description: `Base case: fib(${num}) = ${num}`,
        timestamp: 0,
        treeNodes: treeNodes.map(n => ({ ...n })),
        callStack: [...callStack],
      });
      callStack.pop();
      treeNodes[myId] = { ...treeNodes[myId], state: 'done' };
      return num;
    }

    if (memo[num] !== undefined) {
      treeNodes[myId] = { ...treeNodes[myId], result: memo[num], state: 'memoized' };
      steps.push({
        type: 'found',
        indices: [num],
        codeLine: 4,
        description: `Memoized: fib(${num}) = ${memo[num]}`,
        timestamp: 0,
        treeNodes: treeNodes.map(n => ({ ...n })),
        callStack: [...callStack],
      });
      callStack.pop();
      treeNodes[myId] = { ...treeNodes[myId], state: 'done' };
      return memo[num];
    }

    steps.push({
      type: 'visit',
      indices: [num],
      codeLine: 6,
      description: `Compute fib(${num}) = fib(${num-1}) + fib(${num-2})`,
      timestamp: 0,
      treeNodes: treeNodes.map(n => ({ ...n })),
      callStack: [...callStack],
    });

    const left = fib(num - 1, myId);
    const right = fib(num - 2, myId);
    const result = left + right;
    memo[num] = result;

    treeNodes[myId] = { ...treeNodes[myId], result, state: 'resolved' };
    steps.push({
      type: 'set',
      indices: [num],
      values: [result],
      codeLine: 8,
      description: `fib(${num}) = ${left} + ${right} = ${result}`,
      timestamp: 0,
      treeNodes: treeNodes.map(n => ({ ...n })),
      callStack: [...callStack],
    });

    callStack.pop();
    treeNodes[myId] = { ...treeNodes[myId], state: 'done' };
    return result;
  }

  steps.push({
    type: 'visit',
    indices: [n],
    codeLine: 1,
    description: `Start: compute fib(${n})`,
    timestamp: 0,
    treeNodes: [],
    callStack: [],
  });

  const result = fib(n);

  steps.push({
    type: 'sorted',
    indices: [],
    codeLine: null,
    description: `Result: fib(${n}) = ${result}`,
    timestamp: 0,
    treeNodes: treeNodes.map(n => ({ ...n })),
    callStack: [],
  });

  steps.forEach((step, i) => {
    step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
  });

  return {
    steps,
    metadata: {
      name: 'Fibonacci (Recursion)',
      timeComplexity: 'O(2^n)',
      spaceComplexity: 'O(n)',
      description: 'Computes Fibonacci numbers using recursive calls.',
    },
  };
}

/**
 * Factorial step generator.
 */
export function factorial(n) {
  const steps = [];
  const treeNodes = [];
  const callStack = [];
  let nodeId = 0;

  function fact(num, parentId = null) {
    const myId = nodeId++;

    treeNodes.push({ id: myId, label: `${num}!`, parentId, result: null, state: 'current', depth: callStack.length });
    callStack.push(`${num}!`);

    if (num <= 1) {
      treeNodes[myId] = { ...treeNodes[myId], result: 1, state: 'resolved' };
      steps.push({
        type: 'visit',
        indices: [num],
        codeLine: 2,
        description: `Base case: factorial(${num}) = 1`,
        timestamp: 0,
        treeNodes: treeNodes.map(n => ({ ...n })),
        callStack: [...callStack],
      });
      callStack.pop();
      treeNodes[myId] = { ...treeNodes[myId], state: 'done' };
      return 1;
    }

    steps.push({
      type: 'visit',
      indices: [num],
      codeLine: 4,
      description: `Compute factorial(${num}) = ${num} × factorial(${num-1})`,
      timestamp: 0,
      treeNodes: treeNodes.map(n => ({ ...n })),
      callStack: [...callStack],
    });

    const subResult = fact(num - 1, myId);
    const result = num * subResult;

    treeNodes[myId] = { ...treeNodes[myId], result, state: 'resolved' };
    steps.push({
      type: 'set',
      indices: [num],
      values: [result],
      codeLine: 6,
      description: `factorial(${num}) = ${num} × ${subResult} = ${result}`,
      timestamp: 0,
      treeNodes: treeNodes.map(n => ({ ...n })),
      callStack: [...callStack],
    });

    callStack.pop();
    treeNodes[myId] = { ...treeNodes[myId], state: 'done' };
    return result;
  }

  steps.push({
    type: 'visit',
    indices: [n],
    codeLine: 1,
    description: `Start: compute factorial(${n})`,
    timestamp: 0,
    treeNodes: [],
    callStack: [],
  });

  const result = fact(n);

  steps.push({
    type: 'sorted',
    indices: [],
    codeLine: null,
    description: `Result: factorial(${n}) = ${result}`,
    timestamp: 0,
    treeNodes: treeNodes.map(n => ({ ...n })),
    callStack: [],
  });

  steps.forEach((step, i) => {
    step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
  });

  return {
    steps,
    metadata: {
      name: 'Factorial',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      description: 'Computes factorial using recursive calls.',
    },
  };
}

/**
 * Tower of Hanoi step generator.
 * All steps include pegs snapshot and real call stack.
 */
export function towerOfHanoi(n) {
  const steps = [];
  const moveCount = [0];
  const pegs = { A: [], B: [], C: [] };
  for (let i = n; i >= 1; i--) pegs.A.push(i);

  function snapshotPegs() {
    return { A: [...pegs.A], B: [...pegs.B], C: [...pegs.C] };
  }

  const callStack = [];

  function moveDisk(num, from, to) {
    const disk = pegs[from].pop();
    pegs[to].push(disk);
    moveCount[0]++;

    steps.push({
      type: 'visit',
      indices: [num],
      codeLine: 3,
      description: `Move disk ${num} from peg ${from} → peg ${to} (move #${moveCount[0]})`,
      timestamp: 0,
      pegs: snapshotPegs(),
      callStack: [...callStack],
      moveCount: moveCount[0],
    });
  }

  function hanoi(num, from, to, aux) {
    if (num === 1) {
      moveDisk(num, from, to);
      return;
    }

    callStack.push(`hanoi(${num}, ${from}→${to})`);

    steps.push({
      type: 'highlight',
      indices: [num],
      codeLine: 5,
      description: `Move ${num} disks: ${from} → ${to} (aux: ${aux})`,
      timestamp: 0,
      pegs: snapshotPegs(),
      callStack: [...callStack],
    });

    hanoi(num - 1, from, aux, to);
    moveDisk(num, from, to);
    hanoi(num - 1, aux, to, from);

    callStack.pop();
  }

  steps.push({
    type: 'visit',
    indices: [n],
    codeLine: 1,
    description: `Start: move ${n} disks from A → C (using B as auxiliary)`,
    timestamp: 0,
    pegs: snapshotPegs(),
    callStack: [],
  });

  hanoi(n, 'A', 'C', 'B');

  steps.push({
    type: 'sorted',
    indices: [],
    codeLine: null,
    description: `Completed in ${Math.pow(2, n) - 1} moves! All disks on peg C.`,
    timestamp: 0,
    pegs: snapshotPegs(),
    callStack: [],
  });

  steps.forEach((step, i) => {
    step.timestamp = steps.length > 1 ? i / (steps.length - 1) : 0;
  });

  return {
    steps,
    metadata: {
      name: 'Tower of Hanoi',
      timeComplexity: 'O(2^n)',
      spaceComplexity: 'O(n)',
      description: 'Moves n disks from source to destination using an auxiliary peg.',
    },
  };
}

/** Map of all recursion algorithms */
export const recursionAlgorithms = { fibonacci, factorial, towerOfHanoi };

/** Get algorithm by name */
export function getRecursionAlgorithm(name) {
  const key = name.toLowerCase().replace(/[\s-]/g, '');
  return recursionAlgorithms[key] || fibonacci;
}
