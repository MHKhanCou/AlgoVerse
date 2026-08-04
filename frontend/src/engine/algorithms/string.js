/**
 * AlgoVerse V2 — String Algorithm Step Generators
 *
 * Each step includes text, pattern, and highlight data for StringRenderer.
 */

/**
 * KMP (Knuth-Morris-Pratt) String Matching step generator.
 */
export function kmp(text, pattern) {
  const steps = [];
  const n = text.length;
  const m = pattern.length;

  // Build LPS array
  const lps = new Array(m).fill(0);
  let len = 0;
  let ii = 1;

  steps.push({
    type: 'highlight',
    indices: [],
    codeLine: 2,
    description: `Build LPS array for pattern "${pattern}"`,
    timestamp: 0,
    text, pattern, lps: [...lps], patternOffset: 0, highlights: [], matchPositions: [],
  });

  while (ii < m) {
    if (pattern[ii] === pattern[len]) {
      len++;
      lps[ii] = len;
      ii++;
    } else {
      if (len !== 0) {
        len = lps[len - 1];
      } else {
        lps[ii] = 0;
        ii++;
      }
    }
  }

  steps.push({
    type: 'highlight',
    indices: [],
    codeLine: 5,
    description: `LPS array: [${lps.join(', ')}]`,
    timestamp: 0,
    text, pattern, lps: [...lps], patternOffset: 0, highlights: [], matchPositions: [],
  });

  // Search
  ii = 0;
  let j = 0;
  const matches = [];

  while (ii < n) {
    steps.push({
      type: 'compare',
      indices: [ii],
      codeLine: 8,
      description: `Compare text[${ii}]='${text[ii]}' with pattern[${j}]='${pattern[j]}'`,
      timestamp: 0,
      text, pattern, lps: [...lps], patternOffset: ii - j,
      highlights: [{ pos: ii, type: 'comparing' }, { pos: ii - j + j, type: 'pattern' }],
      matchPositions: matches.map(m => ({ start: m, end: m + m - 1 })),
    });

    if (text[ii] === pattern[j]) {
      ii++;
      j++;

      if (j === m) {
        matches.push(ii - j);
        steps.push({
          type: 'found',
          indices: Array.from({ length: m }, (_, k) => ii - j + k),
          codeLine: 10,
          description: `Pattern found at index ${ii - j}!`,
          timestamp: 0,
          text, pattern, lps: [...lps], patternOffset: ii - j,
          highlights: Array.from({ length: m }, (_, k) => ({ pos: ii - j + k, type: 'found' })),
          matchPositions: matches.map(m => ({ start: m, end: m + m - 1 })),
        });
        j = lps[j - 1];
      }
    } else {
      if (j !== 0) {
        steps.push({
          type: 'visit',
          indices: [ii],
          codeLine: 12,
          description: `Mismatch: use LPS[${j - 1}] = ${lps[j - 1]}`,
          timestamp: 0,
          text, pattern, lps: [...lps], patternOffset: ii - j + lps[j - 1],
          highlights: [{ pos: ii, type: 'mismatch' }],
          matchPositions: matches.map(m => ({ start: m, end: m + m - 1 })),
        });
        j = lps[j - 1];
      } else {
        ii++;
      }
    }
  }

  if (matches.length === 0) {
    steps.push({
      type: 'message',
      indices: [],
      codeLine: 14,
      description: `Pattern "${pattern}" not found in text`,
      timestamp: 0,
      text, pattern, lps: [...lps], patternOffset: 0, highlights: [], matchPositions: [],
    });
  } else {
    steps.push({
      type: 'sorted',
      indices: [],
      codeLine: null,
      description: `Found ${matches.length} occurrence(s) at indices: [${matches.join(', ')}]`,
      timestamp: 0,
      text, pattern, lps: [...lps], patternOffset: 0, highlights: [],
      matchPositions: matches.map(m => ({ start: m, end: m + m - 1 })),
    });
  }

  steps.forEach((s, idx) => { s.timestamp = steps.length > 1 ? idx / (steps.length - 1) : 0; });

  return {
    steps,
    metadata: {
      name: 'KMP String Matching',
      timeComplexity: 'O(n + m)',
      spaceComplexity: 'O(m)',
      description: 'Finds all occurrences of a pattern in text using LPS array for efficient backtracking.',
    },
  };
}

/**
 * Rabin-Karp String Matching step generator.
 */
export function rabinKarp(text, pattern) {
  const steps = [];
  const n = text.length;
  const m = pattern.length;
  const d = 256;
  const q = 101;

  if (m > n) {
    steps.push({ type: 'message', indices: [], codeLine: 1, description: 'Pattern longer than text', timestamp: 0, text, pattern, highlights: [], matchPositions: [], patternOffset: 0 });
    return { steps, metadata: { name: 'Rabin-Karp', timeComplexity: 'O(n + m)', spaceComplexity: 'O(1)', description: 'Pattern matching using rolling hash.' } };
  }

  let p = 0;
  let t = 0;
  let h = 1;

  steps.push({
    type: 'highlight',
    indices: [],
    codeLine: 3,
    description: `Calculate hash values (d=${d}, q=${q})`,
    timestamp: 0,
    text, pattern, highlights: [], matchPositions: [], patternOffset: 0,
  });

  for (let i = 0; i < m - 1; i++) h = (h * d) % q;

  for (let i = 0; i < m; i++) {
    p = (d * p + ord(pattern[i])) % q;
    t = (d * t + ord(text[i])) % q;
  }

  steps.push({
    type: 'visit',
    indices: Array.from({ length: m }, (_, i) => i),
    codeLine: 6,
    description: `Pattern hash: ${p}, Text window hash: ${t}`,
    timestamp: 0,
    text, pattern, highlights: Array.from({ length: m }, (_, i) => ({ pos: i, type: 'pattern' })),
    matchPositions: [], patternOffset: 0,
  });

  const matches = [];

  for (let i = 0; i <= n - m; i++) {
    if (p === t) {
      let match = true;
      for (let j = 0; j < m; j++) {
        steps.push({
          type: 'compare',
          indices: [i + j],
          codeLine: 10,
          description: `Hash match! Verify: text[${i+j}]='${text[i+j]}' vs pattern[${j}]='${pattern[j]}'`,
          timestamp: 0,
          text, pattern, patternOffset: i,
          highlights: [{ pos: i + j, type: 'comparing' }, { pos: i + j, type: 'pattern' }],
          matchPositions: matches.map(m => ({ start: m, end: m + m - 1 })),
        });
        if (text[i + j] !== pattern[j]) {
          match = false;
          break;
        }
      }

      if (match) {
        matches.push(i);
        steps.push({
          type: 'found',
          indices: Array.from({ length: m }, (_, k) => i + k),
          codeLine: 12,
          description: `Pattern found at index ${i}!`,
          timestamp: 0,
          text, pattern, patternOffset: i,
          highlights: Array.from({ length: m }, (_, k) => ({ pos: i + k, type: 'found' })),
          matchPositions: matches.map(m => ({ start: m, end: m + m - 1 })),
        });
      }
    }

    if (i < n - m) {
      t = (d * (t - ord(text[i]) * h) + ord(text[i + m])) % q;
      if (t < 0) t += q;
      steps.push({
        type: 'visit',
        indices: [i + m],
        codeLine: 15,
        description: `Slide window to index ${i + 1}, new hash: ${t}`,
        timestamp: 0,
        text, pattern, patternOffset: i + 1,
        highlights: Array.from({ length: m }, (_, k) => ({ pos: i + 1 + k, type: 'pattern' })),
        matchPositions: matches.map(m => ({ start: m, end: m + m - 1 })),
      });
    }
  }

  steps.push({
    type: 'sorted',
    indices: [],
    codeLine: null,
    description: 'Rabin-Karp search complete',
    timestamp: 0,
    text, pattern, highlights: [],
    matchPositions: matches.map(m => ({ start: m, end: m + m - 1 })), patternOffset: 0,
  });

  steps.forEach((s, idx) => { s.timestamp = steps.length > 1 ? idx / (steps.length - 1) : 0; });

  return {
    steps,
    metadata: {
      name: 'Rabin-Karp',
      timeComplexity: 'O(n + m)',
      spaceComplexity: 'O(1)',
      description: 'Pattern matching using rolling hash.',
    },
  };
}

function ord(c) { return c.charCodeAt(0); }

export const stringAlgorithms = { kmp, rabinKarp };

export function getStringAlgorithm(name) {
  const key = name.toLowerCase().replace(/[\s-]/g, '');
  return stringAlgorithms[key] || kmp;
}
