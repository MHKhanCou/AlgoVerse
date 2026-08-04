# End-to-end browser checks

Real-Chromium smoke tests that run against the **production build**. They
catch what jsdom structurally cannot: actual canvas painting, real layout,
CSS application, runtime errors in minified code, and failed asset requests.

These found two bugs the 109-test jsdom suite missed:

- The `/demo` DP tab crashed the page with
  `Cannot read properties of undefined (reading 'forEach')`, because
  `VisualizationDemo` never implemented DP/recursion/string execution and fed
  2D DP step indices to `ArrayRenderer`.
- `/vite.svg` (the favicon) was served as HTML by the SPA rewrite.

## Running

Playwright is intentionally **not** a project dependency, to keep `npm ci`
lean. Install it on demand:

```bash
npm install -g playwright        # or: npx playwright@latest
npx playwright install chromium

npm run build
npx vite preview --port 5190 --strictPort &

node e2e/smoke.mjs   # page load, favicon, canvas pixels, playback
node e2e/tabs.mjs    # all 6 algorithm categories + dark mode
node e2e/detail.mjs  # /algorithms/:id route, sanitization, playback
```

Both exit non-zero on failure, so they can be wired into CI once a
Playwright-provisioned runner is available.

## What each covers

`smoke.mjs`
- Home page mounts React
- `/vite.svg` returns `image/svg+xml`, not the SPA fallback
- `/demo` renders content
- A canvas exists, has a non-zero backing store, and has painted pixels
- Pressing Play advances the step counter
- No failed asset requests, no console errors

`tabs.mjs`
- Each of Sorting / Searching / Graph / DP / Recursion / String renders a
  visualization surface and produces playback steps with no runtime errors
- Dark mode still paints the canvas

`detail.mjs`
- `/algorithms/:id` renders with a mocked API (no backend needed)
- Hostile `explanation` HTML is sanitized: no `onerror` survives and no
  script executes
- The Visualize tab paints a canvas and playback advances

