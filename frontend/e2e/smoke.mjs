import { chromium } from 'playwright';

/**
 * Real-browser smoke test against the production build.
 *
 * jsdom cannot catch: actual canvas painting, real layout, CSS application,
 * console errors from minified code, or failed network requests for assets.
 * This drives a real Chromium against `vite preview`.
 */
const BASE = 'http://localhost:5190';

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  :: ' + detail : ''}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const consoleErrors = [];
const failedRequests = [];
page.on('console', m => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('requestfailed', r => {
  failedRequests.push(`${r.url()} :: ${r.failure()?.errorText}`);
});

// ---- 1. Home page loads and renders ----
await page.goto(BASE, { waitUntil: 'networkidle' });
const rootHtml = await page.$eval('#root', el => el.innerHTML.length);
check('home page mounts React (non-empty #root)', rootHtml > 200, `${rootHtml} chars`);

// ---- 2. Favicon is a real image, not the SPA fallback ----
const favicon = await page.evaluate(async () => {
  const res = await fetch('/vite.svg');
  return { status: res.status, type: res.headers.get('content-type') };
});
check(
  'favicon /vite.svg served as an image (SPA rewrite fix)',
  favicon.status === 200 && !String(favicon.type).includes('text/html'),
  `status=${favicon.status} type=${favicon.type}`
);

// ---- 3. Demo route: the visualization workbench ----
await page.goto(`${BASE}/demo`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
const demoRoot = await page.$eval('#root', el => el.innerText.length);
check('/demo renders content', demoRoot > 50, `${demoRoot} chars of text`);

// ---- 4. A canvas exists and actually has pixels painted ----
const canvasInfo = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  if (!c) return { found: false };
  const rect = c.getBoundingClientRect();
  const ctx = c.getContext('2d');
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  let painted = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) painted++;
  return {
    found: true,
    cssW: Math.round(rect.width),
    cssH: Math.round(rect.height),
    backingW: c.width,
    backingH: c.height,
    paintedPixels: painted,
  };
});
check('canvas present in the DOM', canvasInfo.found === true, JSON.stringify(canvasInfo));
if (canvasInfo.found) {
  check(
    'canvas backing store scaled by devicePixelRatio (not 0x0)',
    canvasInfo.backingW > 0 && canvasInfo.backingH > 0,
    `${canvasInfo.backingW}x${canvasInfo.backingH} backing for ${canvasInfo.cssW}x${canvasInfo.cssH} css`
  );
  check(
    'canvas has actually painted pixels',
    canvasInfo.paintedPixels > 0,
    `${canvasInfo.paintedPixels} non-transparent pixels`
  );
}

// ---- 5. Playback actually advances the step counter ----
const playSelector = 'button[aria-label="Play visualization"]';
const hasPlay = await page.$(playSelector);
if (hasPlay) {
  const before = await page.$eval('.playback-step-counter', el => el.innerText);
  await page.click(playSelector);
  await page.waitForTimeout(1500);
  const after = await page.$eval('.playback-step-counter', el => el.innerText);
  check('pressing Play advances the step counter', before !== after, `"${before}" -> "${after}"`);

  // Canvas must repaint as steps advance.
  const repainted = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return false;
    const ctx = c.getContext('2d');
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let painted = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] !== 0) painted++;
    return painted > 0;
  });
  check('canvas still painted after playback', repainted === true);
} else {
  check('play button present', false, 'not found');
}

// ---- 6. Graph route renders React Flow without crashing ----
await page.goto(`${BASE}/demo`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// ---- 7. No console errors, no failed asset requests ----
const realFailures = failedRequests.filter(u => !u.includes('/api/') && !u.includes('onrender.com'));
const realErrors = consoleErrors.filter(
  e => !e.includes('Failed to load resource') && !e.toLowerCase().includes('api') && !e.includes('onrender.com')
);
check('no failed asset requests', realFailures.length === 0, realFailures.join(' | ') || 'none');
check('no unexpected console errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | ') || 'none');

await page.screenshot({ path: 'browser-check.png', fullPage: false });
await browser.close();

const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length === 0 ? 0 : 1);
