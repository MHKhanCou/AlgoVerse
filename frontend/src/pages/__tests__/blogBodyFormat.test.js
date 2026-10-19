import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// src/pages/__tests__ -> frontend/
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

/**
 * Blog bodies are authored as plain text in a textarea and rendered as a
 * React text node (SingleBlog.jsx: `{blog.body}`). The database stores
 * exactly what the author typed, newlines included, so the reader must use
 * `white-space: pre-wrap` or every paragraph break collapses into a single
 * run-on blob.
 */
describe('blog body formatting', () => {
  const css = readFileSync(resolve(root, 'src/styles/SingleBlog.css'), 'utf8');
  const block = css.match(/\.blog-body\s*\{([^}]*)\}/s);
  const declarations = block ? block[1] : '';

  it('has a .blog-body rule', () => {
    expect(block, '.blog-body rule missing from SingleBlog.css').not.toBeNull();
  });

  it('preserves the author\u2019s line breaks with white-space: pre-wrap', () => {
    expect(declarations).toMatch(/white-space:\s*pre-wrap/);
  });
});
