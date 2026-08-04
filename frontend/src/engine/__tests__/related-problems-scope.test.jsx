import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

/**
 * RelatedProblems.handleUpdateProgress declared `existingProgress` with
 * `const` inside its try block while the catch block referenced it when
 * reverting the optimistic update. A failing API call therefore threw
 * ReferenceError from inside the error handler, converting a recoverable
 * network failure into a crash.
 *
 * The bug is purely lexical, so assert it structurally: the declaration must
 * dominate both blocks. This is what eslint's no-undef flagged, and it stays
 * green only while the binding is hoisted above the try.
 */
describe('RelatedProblems: existingProgress scope', () => {
  const src = readFileSync(
    resolve(root, 'src/components/RelatedProblems.jsx'),
    'utf8'
  );

  it('declares existingProgress before the try block that uses it', () => {
    const handlerStart = src.indexOf('const handleUpdateProgress');
    expect(handlerStart).toBeGreaterThan(-1);

    const handler = src.slice(handlerStart, handlerStart + 3000);
    const declIdx = handler.indexOf('const existingProgress');
    const tryIdx = handler.indexOf('try {');

    expect(declIdx, 'existingProgress declaration not found').toBeGreaterThan(-1);
    expect(tryIdx, 'try block not found').toBeGreaterThan(-1);
    expect(
      declIdx < tryIdx,
      'existingProgress must be declared before the try block, otherwise the ' +
      'catch block references an out-of-scope binding and throws ReferenceError'
    ).toBe(true);
  });

  it('the catch block still uses existingProgress to revert', () => {
    const catchIdx = src.indexOf('// Revert optimistic update on error');
    expect(catchIdx).toBeGreaterThan(-1);
    const revert = src.slice(catchIdx, catchIdx + 400);
    expect(revert).toContain('existingProgress');
  });
});

/**
 * A behavioural companion: reproduce the exact scoping shape in isolation and
 * confirm the broken form throws while the fixed form does not. This documents
 * *why* the structural assertion above matters.
 */
describe('the scoping bug, reproduced in isolation', () => {
  it('const inside try is not visible to catch', () => {
    expect(() => {
      try {
        // eslint-disable-next-line no-unused-vars
        const scoped = { status: 'solved' };
        throw new Error('api failed');
      } catch {
        // Referencing `scoped` here is a ReferenceError.
        return scoped.status; // eslint-disable-line no-undef
      }
    }).toThrow(ReferenceError);
  });

  it('hoisting the declaration makes the catch block safe', () => {
    const run = () => {
      const scoped = { status: 'solved' };
      try {
        throw new Error('api failed');
      } catch {
        return scoped?.status ?? 'not_started';
      }
    };
    expect(run()).toBe('solved');
  });
});
