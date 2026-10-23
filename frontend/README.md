# AlgoVerse Frontend

React 19 + Vite 6 single-page app. It renders the algorithm library, the
step-by-step visualizer, the blog/comment surfaces, and the admin dashboard,
and talks to the FastAPI backend in `../backend`.

## Requirements

- Node.js 24 (what CI uses) and npm 11+
- The backend running at `http://localhost:8000` for anything outside `/api`

## Setup

```bash
npm install
cp .env.example .env    # optional - the defaults work as-is
npm run dev
```

The dev server is pinned to **http://localhost:5173** (`strictPort: true`, so it
fails loudly instead of drifting to 5174 and missing the backend's CORS list).

### How the API URL is chosen

`src/services/api.js` is the only module that reads the environment:

| Mode | Base URL |
| --- | --- |
| `npm run dev` | `http://localhost:8000` (hardcoded) |
| `npm run build` | `VITE_API_URL` → `VITE_PROD_API_BASE_URL` → `https://algoverse-kpwz.onrender.com` |

Despite its name, `VITE_API_URL` holds the *backend* URL. `.env.production` is
committed and sets it; `.env.example` documents the rest. In development,
`vite.config.js` also proxies `/api/*` to the production backend, so contest and
related-problem calls work without a local server.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR on port 5173 |
| `npm run build` | Production build to `dist/` (sourcemaps, manual chunks) |
| `npm run preview` | Serve the built output locally |
| `npm run lint` | ESLint over the whole tree |
| `npm run test` | Vitest in watch mode |
| `npm run test:run` | Vitest once — 113 tests across 13 files |
| `npm run e2e` | Playwright suites in `e2e/` against the production build |

There is no formatter script: the project does not use Prettier. Formatting is
handled by ESLint plus editor defaults.

## Testing

```bash
npm run test:run
npm run lint

# e2e needs a browser binary the first time
npx playwright install chromium
npm run build && npm run e2e
```

Most tests live in `src/engine/__tests__/` and drive the visualization engine
directly: every registered algorithm is stepped through and rendered, and
`deploy-config.test.js` re-checks that no asset path the built `index.html`
references would be swallowed by the SPA rewrite in `vercel.json`.

The e2e layer exists because jsdom cannot see canvas painting, real layout, or
runtime errors in minified code. See `e2e/README.md`.

## Structure

```
src/
├── engine/          # Algorithm step generation and playback
│   ├── algorithms/  # One generator per algorithm
│   ├── state.js     # Step/state model
│   ├── playback.js  # Timeline, speed, stepping
│   ├── keyboard.js  # Keyboard control bindings
│   └── __tests__/   # 13 test files
├── pages/           # 25 route-level pages
├── components/      # renderers/, editors/, learning/, admin/, common/
├── contexts/        # AuthContext, SearchContext
├── services/        # api.js + one service per resource
├── test/setup.js    # Vitest setup (jsdom)
└── App.jsx          # Route table; heavy routes are lazy-loaded
```

## State management

- **Zustand** for the visualization engine's step state
- **React Context** (`AuthContext`, `SearchContext`) for cross-cutting concerns
- Local `useState` for everything else

## Access control

`AdminRoute.jsx` guards the `/admin/*` tree. Route-level protection is a UX
convenience only — every admin API endpoint enforces admin rights server-side
too.

## Build notes

`vite.config.js` splits the bundle into `react`, `vendor`, `monaco`,
`graphflow`, `charts`, `animation` and `syntax` chunks. Without those, chart and
animation code landed in the entry chunk (~577 kB) and every visitor paid for it
on the home page. Keep new heavy dependencies out of the entry graph, or add
them to an existing chunk.

`build.sourcemap` is on. That is deliberate for now (it makes production
stack traces usable) and is listed in `../ROADMAP.md` as a decision to revisit.

## Deployment

Vercel, configured by `vercel.json`: every path that is not an asset is
rewritten to `index.html` so client-side routing works on deep links.
`.env.production` supplies the production API URL.
