import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// src/engine/__tests__ -> frontend/
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

/**
 * Deployment config guard.
 *
 * The SPA rewrite must send real routes to index.html without swallowing
 * static files. The original pattern, /((?!assets/).*), rewrote everything
 * outside /assets/ — including /vite.svg, the favicon referenced by
 * index.html — so the browser received HTML where it expected an image.
 */
describe('vercel SPA rewrite', () => {
  const config = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8'));
  const rule = config.rewrites[0];
  // Vercel matches `source` against the whole path.
  const re = new RegExp(`^${rule.source}$`);

  it('rewrites application routes to index.html', () => {
    const routes = [
      '/', '/topics', '/algorithms', '/demo', '/algorithms/1',
      '/algorithms/type/2', '/blogs', '/blogs/7', '/login', '/signup',
      '/my-progress', '/admin/dashboard', '/users/42', '/codeforces',
      '/nonexistent-route',
    ];
    for (const route of routes) {
      expect(re.test(route), `${route} should be served by index.html`).toBe(true);
    }
    expect(rule.destination).toBe('/index.html');
  });

  it('does not rewrite static files', () => {
    const files = [
      '/vite.svg',
      '/favicon.ico',
      '/robots.txt',
      '/logo.png',
      '/manifest.webmanifest',
      '/assets/index-abc123.js',
      '/assets/index-abc123.css',
    ];
    for (const file of files) {
      expect(re.test(file), `${file} must be served as a file, not index.html`).toBe(false);
    }
  });

  it('covers every absolute asset referenced by the built index.html', () => {
    const distIndex = resolve(root, 'dist/index.html');
    if (!existsSync(distIndex)) return; // dist is optional in CI-less runs

    const html = readFileSync(distIndex, 'utf8');
    const refs = [...html.matchAll(/(?:href|src)="(\/[^"]+)"/g)].map(m => m[1]);
    expect(refs.length).toBeGreaterThan(0);

    for (const ref of refs) {
      expect(
        re.test(ref),
        `index.html references ${ref}, but the rewrite would return HTML for it`
      ).toBe(false);
    }
  });
});
