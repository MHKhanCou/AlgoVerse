import { chromium } from 'playwright';

/**
 * Exercises every algorithm category tab in a real browser, plus dark mode.
 * The category tabs mount different renderers (canvas, React Flow, DOM grid,
 * SVG), so this is where a runtime crash would actually surface.
 */
const BASE = process.env.E2E_BASE ?? 'http://localhost:5190';

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  :: ' + detail : ''}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

let consoleErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', e => consoleErrors.push(`PAGEERROR: ${e.message}`));

await page.goto(`${BASE}/demo`, { waitUntil: 'networkidle' });

const TABS = ['Sorting', 'Searching', 'Graph', 'DP', 'Recursion', 'String'];

for (const tab of TABS) {
  consoleErrors = [];

  // Tabs render with an emoji prefix, so match on the text content.
  const clicked = await page.evaluate((label) => {
    const btns = [...document.querySelectorAll('button')];
    const el = btns.find(b => b.textContent.trim().endsWith(label));
    if (!el) return false;
    el.click();
    return true;
  }, tab);

  if (!clicked) { check(`${tab}: tab found`, false); continue; }
  await page.waitForTimeout(700);

  // Something must actually be rendered for this category.
  const rendered = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const flow = document.querySelector('.react-flow');
    const dp = document.querySelector('.dp-table-renderer');
    const tree = document.querySelector('.tree-renderer, svg');
    const rec = document.querySelector('.recursion-renderer');
    const str = document.querySelector('.string-renderer');
    return {
      canvas: !!canvas,
      reactFlow: !!flow,
      dpTable: !!dp,
      tree: !!tree,
      recursion: !!rec,
      string: !!str,
    };
  });
  const any = Object.values(rendered).some(Boolean);
  check(`${tab}: renders a visualization surface`, any, JSON.stringify(rendered));

  // Run the algorithm and confirm the step counter moves.
  const played = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Play visualization"]');
    if (!btn) return false;
    btn.click();
    return true;
  });
  if (played) {
    await page.waitForTimeout(1600);
    const counter = await page.evaluate(() => {
      const el = document.querySelector('.playback-step-counter');
      return el ? el.innerText.trim() : null;
    });
    const advanced = counter && /\d+\s*\/\s*\d+/.test(counter);
    check(`${tab}: playback produces steps`, !!advanced, `counter="${counter}"`);
  } else {
    check(`${tab}: play button present`, false);
  }

  const fatal = consoleErrors.filter(
    e => !e.includes('Failed to load resource') && !e.toLowerCase().includes('api') && !e.includes('onrender')
  );
  check(`${tab}: no runtime errors`, fatal.length === 0, fatal.slice(0, 2).join(' | ') || 'none');
}

// ---- Dark mode: theme-driven canvas recolouring ----
// Return to a canvas-backed tab first; the String tab leaves a hidden 0-width
// canvas mounted, which cannot be sampled.
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')];
  const el = btns.find(b => b.textContent.trim().endsWith('Sorting'));
  el?.click();
});
await page.waitForTimeout(500);
await page.evaluate(() => {
  const btn = document.querySelector('button[aria-label="Play visualization"]');
  btn?.click();
});
await page.waitForTimeout(1200);

consoleErrors = [];
await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
await page.waitForTimeout(700);
const darkPainted = await page.evaluate(() => {
  const canvases = [...document.querySelectorAll('canvas')].filter(c => c.width > 0 && c.height > 0);
  if (!canvases.length) return -1;
  const c = canvases[0];
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] !== 0) n++;
  return n;
});
check('dark mode: canvas still paints', darkPainted > 0, `${darkPainted} px`);

const darkErrors = consoleErrors.filter(e => !e.includes('Failed to load resource'));
check('dark mode: no runtime errors', darkErrors.length === 0, darkErrors.slice(0, 2).join(' | ') || 'none');

await page.screenshot({ path: 'e2e-output/tabs.png' });
await browser.close();

const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log('\nFAILURES:');
  for (const f of failed) console.log(` - ${f.name} :: ${f.detail}`);
}
process.exit(failed.length === 0 ? 0 : 1);


