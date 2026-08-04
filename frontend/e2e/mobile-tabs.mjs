import { chromium, devices } from 'playwright';

/**
 * Mobile interaction test: every category tab must be reachable and usable
 * on a phone, including the ones that require scrolling the tab strip.
 */
const BASE = process.env.E2E_BASE ?? 'http://localhost:5195';
const TABS = ['Sorting', 'Searching', 'Graph', 'DP', 'Recursion', 'String'];

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  :: ' + detail : ''}`);
}

const browser = await chromium.launch();
const context = await browser.newContext({ ...devices['iPhone SE'] });
const page = await context.newPage();

const errors = [];
page.on('pageerror', e => errors.push(e.message));

await page.goto(`${BASE}/demo`, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);

// The tab strip must be tall enough to tap and scrollable to reach them all.
const strip = await page.evaluate(() => {
  const el = document.querySelector('.viz-demo-tabs');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { h: Math.round(r.height), scrollW: el.scrollWidth, clientW: el.clientWidth };
});
check('tab strip has a tappable height', strip && strip.h >= 44, `height=${strip?.h}px`);
check('tab strip scrolls to reveal all tabs', strip && strip.scrollW > strip.clientW,
  `scrollWidth=${strip?.scrollW} clientWidth=${strip?.clientW}`);

for (const tab of TABS) {
  // scrollIntoView mimics the swipe a user would make.
  const clicked = await page.evaluate((label) => {
    const btns = [...document.querySelectorAll('.viz-demo-tab')];
    const el = btns.find(b => b.textContent.trim().endsWith(label));
    if (!el) return false;
    el.scrollIntoView({ block: 'nearest', inline: 'center' });
    el.click();
    return true;
  }, tab);

  if (!clicked) { check(`${tab}: reachable`, false); continue; }
  await page.waitForTimeout(600);

  const active = await page.evaluate((label) => {
    const el = document.querySelector('.viz-demo-tab.active');
    return el ? el.textContent.trim().endsWith(label) : false;
  }, tab);
  check(`${tab}: tap activates the tab`, active);
}

// The visualization itself must still render at phone width.
const viz = await page.evaluate(() => {
  const c = [...document.querySelectorAll('canvas')].filter(x => x.width > 0)[0];
  const flow = document.querySelector('.react-flow');
  const dp = document.querySelector('.dp-table-renderer');
  const str = document.querySelector('.string-renderer');
  return { canvas: !!c, reactFlow: !!flow, dp: !!dp, str: !!str };
});
check('a visualization surface renders on mobile', Object.values(viz).some(Boolean), JSON.stringify(viz));

// Monaco aborts its in-flight model/worker requests when the editor is torn
// down, which this test does six times in a row far faster than a human could.
// Those surface as bare "Canceled" rejections and are not app errors.
const realErrors = errors.filter(e => !/^Canceled$/i.test(e.trim()));
check('no runtime errors', realErrors.length === 0, realErrors.slice(0, 2).join(' | ') || 'none');

await page.screenshot({ path: 'e2e-output/mobile-tabs.png' });
await browser.close();

const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length === 0 ? 0 : 1);
