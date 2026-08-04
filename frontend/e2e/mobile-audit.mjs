import { chromium, devices } from 'playwright';

/**
 * Mobile layout audit against the production build.
 *
 * Reports, per route, anything that actually breaks on a phone:
 *  - horizontal overflow (the page scrolls sideways)
 *  - elements wider than the viewport, with the widest offenders named
 *  - tap targets below the 44px accessibility minimum
 *  - text smaller than 12px
 */
const BASE = process.env.E2E_BASE ?? 'http://localhost:5191';
const ROUTES = ['/', '/algorithms', '/topics', '/demo', '/blogs', '/login'];

const browser = await chromium.launch();
const context = await browser.newContext({ ...devices['iPhone SE'] });
const page = await context.newPage();

const vw = page.viewportSize().width;
console.log(`viewport: ${vw}px (iPhone SE)\n`);

const problems = [];

for (const route of ROUTES) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);

  const report = await page.evaluate((viewportWidth) => {
    const docW = document.documentElement.scrollWidth;
    const overflowing = [];

    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      // Only flag things that extend past the right edge of the viewport.
      if (r.right > viewportWidth + 1) {
        const style = getComputedStyle(el);
        if (style.position === 'fixed' || style.visibility === 'hidden') continue;
        overflowing.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().split(' ').filter(Boolean).slice(0, 2).join('.'),
          right: Math.round(r.right),
          width: Math.round(r.width),
        });
      }
    }

    // Deduplicate by class, keep the worst offender of each.
    const byKey = new Map();
    for (const o of overflowing) {
      const key = `${o.tag}.${o.cls}`;
      if (!byKey.has(key) || byKey.get(key).right < o.right) byKey.set(key, o);
    }

    const smallTaps = [];
    for (const el of document.querySelectorAll('button, a, input, select')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.height < 44) {
        smallTaps.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().split(' ').filter(Boolean)[0] || '',
          h: Math.round(r.height),
        });
      }
    }

    const tinyText = [];
    for (const el of document.querySelectorAll('body *')) {
      if (!el.textContent || el.children.length > 0) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs && fs < 12) {
        tinyText.push({ tag: el.tagName.toLowerCase(), size: fs });
      }
    }

    return {
      docWidth: docW,
      overflows: [...byKey.values()].sort((a, b) => b.right - a.right).slice(0, 6),
      smallTapCount: smallTaps.length,
      smallTapSample: smallTaps.slice(0, 4),
      tinyTextCount: tinyText.length,
    };
  }, vw);

  const scrolls = report.docWidth > vw + 1;
  const status = scrolls ? 'OVERFLOW' : 'ok';
  console.log(`${status.padEnd(9)} ${route.padEnd(14)} docWidth=${report.docWidth}`);

  if (scrolls) problems.push({ route, ...report });

  for (const o of report.overflows) {
    console.log(`             ${o.tag}.${o.cls}  right=${o.right} width=${o.width}`);
  }
  if (report.smallTapCount) {
    const s = report.smallTapSample.map(t => `${t.tag}.${t.cls}(${t.h}px)`).join(', ');
    console.log(`             small tap targets: ${report.smallTapCount}  e.g. ${s}`);
  }
  if (report.tinyTextCount) {
    console.log(`             text under 12px: ${report.tinyTextCount} nodes`);
  }
}

await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await page.screenshot({ path: 'e2e-output/mobile-home.png', fullPage: false });
await page.goto(`${BASE}/demo`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.screenshot({ path: 'e2e-output/mobile-demo.png', fullPage: false });

await browser.close();

console.log(`\nroutes with horizontal overflow: ${problems.length}/${ROUTES.length}`);

// Horizontal overflow is the failure that makes a site feel broken on a phone,
// so gate on it. Small tap targets and tiny text are reported above as advice
// rather than hard failures.
process.exit(problems.length === 0 ? 0 : 1);
