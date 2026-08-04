import { chromium } from 'playwright';

/**
 * Drives the real algorithm detail route (/algorithms/:id) in Chromium.
 *
 * The backend may be unreachable from this machine, in which case the page
 * shows its "not found" branch. That is still worth asserting: it must
 * degrade cleanly rather than throwing.
 */
const BASE = 'http://localhost:5190';

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  :: ' + detail : ''}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

const pageErrors = [];
page.on('pageerror', e => pageErrors.push(e.message));

// Serve a deterministic algorithm payload so the test does not depend on
// the remote backend being up.
await page.route('**/algorithms/**', async route => {
  const url = route.request().url();
  if (url.includes('localhost:5190')) return route.continue();
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      id: 1,
      name: 'Bubble Sort',
      description: 'A simple comparison sort.',
      explanation: '<p>Safe</p><img src=x onerror="window.__XSS__=1">',
      code: 'def bubble_sort(a):\n    pass',
      difficulty: 'easy',
      complexity: 'O(n^2)',
      type_name: 'Sorting',
    }),
  });
});
await page.route('**/user-progress/**', route =>
  route.fulfill({ status: 200, contentType: 'application/json', body: 'null' })
);

await page.goto(`${BASE}/algorithms/1`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const state = await page.evaluate(() => ({
  text: document.querySelector('#root')?.innerText?.slice(0, 400) ?? '',
  htmlLen: document.querySelector('#root')?.innerHTML?.length ?? 0,
  stillLoading: document.body.innerText.includes('Loading algorithm'),
  xss: window.__XSS__ === 1,
  hasOnError: document.querySelector('#root')?.innerHTML?.includes('onerror') ?? false,
}));

check('detail page renders substantial content', state.htmlLen > 500, `${state.htmlLen} chars`);
check('detail page is not stuck on the loading spinner', !state.stillLoading);
check('no XSS executed from explanation HTML', state.xss === false);
check('no onerror attribute survives sanitization', state.hasOnError === false);

// If the mock resolved, the visualization tab should be reachable.
const tabClicked = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')];
  const el = btns.find(b => b.textContent.trim().includes('Visualize'));
  if (!el) return false;
  el.click();
  return true;
});
if (tabClicked) {
  await page.waitForTimeout(1200);
  const viz = await page.evaluate(() => {
    const canvases = [...document.querySelectorAll('canvas')].filter(c => c.width > 0);
    if (!canvases.length) return { canvas: false };
    const c = canvases[0];
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] !== 0) n++;
    return { canvas: true, painted: n };
  });
  check('visualize tab paints a canvas', viz.canvas && viz.painted > 0, JSON.stringify(viz));

  const played = await page.evaluate(() => {
    const b = document.querySelector('button[aria-label="Play visualization"]');
    if (!b) return null;
    b.click();
    return true;
  });
  if (played) {
    await page.waitForTimeout(1500);
    const counter = await page.evaluate(() => {
      const el = document.querySelector('.playback-step-counter');
      return el ? el.innerText.trim() : null;
    });
    check('detail page playback advances', /\d+\s*\/\s*\d+/.test(counter ?? ''), `counter="${counter}"`);
  }
} else {
  check('Visualize tab present', false, `page text: ${state.text.slice(0, 120)}`);
}

check('no uncaught page errors', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | ') || 'none');

await page.screenshot({ path: 'detail-page.png' });
await browser.close();

const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length === 0 ? 0 : 1);
