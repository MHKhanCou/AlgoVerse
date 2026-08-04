# End-to-end browser checks

Real-Chromium smoke tests that run against the **production build**. They
catch what jsdom structurally cannot: actual canvas painting, real layout,
CSS application, runtime errors in minified code, and failed asset requests.

These found two bugs the jsdom suite missed:

- The `/demo` DP tab crashed the page with
  `Cannot read properties of undefined (reading 'forEach')`, because
  `VisualizationDemo` never implemented DP/recursion/string execution and fed
  2D DP step indices to `ArrayRenderer`. That also made the Recursion and
  String tabs unreachable.
- `/vite.svg` (the favicon) was served as HTML by the SPA rewrite.

## Running

```bash
npx playwright install chromium   # one-time: fetch the browser binary
npm run build
npm run e2e
```

`npm run e2e` starts `vite preview`, waits for it to answer, runs all three
suites, and always tears the server down. It exits non-zero if any suite
fails, and CI gates on it (see `.github/workflows/frontend.yml`).

Screenshots are written to `e2e-output/` (gitignored). CI uploads them as an
artifact when a run fails, so failures are diagnosable without reproducing
locally.

To run one suite against an already-running server:

```bash
E2E_BASE=http://localhost:5190 node e2e/tabs.mjs
```

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
