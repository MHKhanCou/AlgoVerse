# AlgoVerse Production Readiness

What is still standing between this codebase and a deployment I would call
production ready: the open items, ranked, each with the evidence that it is
real and a specific fix.

This file replaces `Algoverse roadmap after backend.txt` (kept in the author's
Documents folder), which was written before most of this app existed. See
[Why the old roadmap was replaced](#why-the-old-roadmap-was-replaced).

Everything below was checked against the code in this repository at commit
`9312981`, not inferred from a template.

---

## Why the old roadmap was replaced

The previous roadmap is not wrong so much as *stale in a specific way*: its
phases describe work that is already shipped, so acting on it means redoing
finished work while the actual gaps stay invisible.
| Old roadmap said | Reality |
| --- | --- |
| "Frontend setup — React is recommended… 2–4 weeks" | React 19 + Vite 8 SPA, 25 route pages, visualization engine with 275 tests |
| "User authentication & authorization — implement JWT" | Implemented in `app/auth/jwt_token.py`, `app/auth/oauth2.py`, `app/middleware/admin_dependencies.py` |
| "Database migrations (Alembic)" | `backend/alembic_migrations/`, `alembic upgrade head` in the README |
| "Comprehensive API testing — 1–2 days manual + 1–2 days automated" | 105 routes and 15 tests, but the suite was red until this pass and had no CI |
| "Algorithm visualization — choose a library (Chart.js, p5.js, D3.js)" | Canvas + GSAP + React Flow renderers under `frontend/src/engine/` |
| "Containerize with Docker… deploy to Render, Railway or Heroku" | Deploys to Render (backend) and Vercel (`frontend/vercel.json`); a Dockerfile would be unused config |
| "Implement authentication using JWT (e.g. via `fastapi-jwt-auth`)" | Do not follow this. `fastapi-jwt-auth` last shipped on PyPI in **November 2020** and does not support Pydantic v2 (fastapi discussion #10718). This project runs Pydantic 2.12.5, so switching would break auth, not add to it |

The one genuinely forward-looking item it had was "input validation and error
handling" — that is now P1 items 6 and 10 here.

---

## Status of this pass

Fixed and verified in the current working tree:
| Item | Evidence |
| --- | --- |
| Backend suite was red for two independent reasons | now **31 passed** |
| Anonymous `/users` reads leaked every email + admin flag | fixed with `schemas.PublicUser`; verified no longer present, tests added |
| `POST /users/` was an unauthenticated registration bypass | now admin-only; anon → 401, tests added |
| `contests.py` loaded `.env` from `backend/app/.env` (never existed) | `ENV_FILE` now `parents[2]` (→ `backend/.env`); loader and Redis config documented, tests added |
| `APIResponse` silently dropped `email_sent` from `/register` | `schemas.RegisterResponse`; the signup page reads the field (`SignUpPage.jsx:70`) |
| Test order-dependence via the global slowapi limiter | `disable_rate_limiting` fixture in `tests/conftest.py` |
| 35 Pydantic v2 `class Config` deprecations | migrated to `ConfigDict`/`SettingsConfigDict`; warnings gone |
| `declarative_base()` SQLAlchemy 2.0 deprecation | `app/db/database.py` import moved to `sqlalchemy.orm` |
| Frontend lint was red | was `2 errors, 19 warnings`; now **0 errors** |
| Lint could not see `vite.config.js` | CI now runs `npx eslint .`, not `eslint src/ e2e/` |
| No backend CI, no declared test deps | `.github/workflows/backend.yml`, `backend/requirements-dev.txt`, pinned `requirements.txt` |
| `frontend/.env.example` documented a variable nothing reads | rewritten against `src/services/api.js` |
| Config leaked to the console in production | `api.js` logs gated on `import.meta.env.DEV`; verified absent from `dist/` |
| No security response headers | `app/middleware/security_headers.py` |
| Production could boot with an empty JWT signing key | `Settings.validate_for_production()` |

Re-verify with:

```bash
cd backend && python -m pytest tests/ -q          # expect: 73 passed
cd frontend && npm run lint                       # expect: 0 errors
cd frontend && npm run test:run                   # expect: 275 passed
cd frontend && npm run build                      # expect: exit 0, no .map files
```

## Launch-readiness pass (2026-10-21)

The remaining open P0/P1 items were fixed on `slop-reduction` and are covered by
`backend/tests/test_production_readiness.py`:

| Item | Fix |
| --- | --- |
| P0 #3 `email_sent` was hard-coded | registration sends on a worker thread and returns the real delivery result |
| P0 #4 no token revocation | `users.token_version` + JWT `ver`; reset/change increment it (migration `c3f1a9b27d64`) |
| P1 #6 liveness-only `/health` | runs `SELECT 1`; returns 503 when the database is unreachable |
| P1 #8 login logs carried emails | failures log a reason, successes log `user_id` |
| P1 #9 partial, per-process limits | storage via `RATE_LIMIT_STORAGE_URI`/`REDIS_URL`; write endpoints limited; real 429 handler |
| P1 #10 dead refresh-token code | helpers and setting removed |
| P1 #11 source maps shipped | production builds emit none |

P0 #5 (rotating credentials that were committed to the repository) remains an
operational step; it cannot be completed from code.

---

## P0

Items 1 and 2 (the anonymous email leak and the `/users/` registration bypass)
were fixed in the earlier pass; item 5 is the only P0 item still open. Items 3
and 4 were fixed in the launch-readiness pass. Numbering is kept stable so
existing cross-references stay valid.

### 1. Anonymous `/users` reads exposed every account's email — **FIXED**

`GET /users/`, `GET /users/{id}` and `GET /users/{id}/profile` had no auth
dependency (`app/routes/user.py`) and serialized `schemas.ShowUser`, which carries
`email` and `is_admin`. Driving the app showed `leaks_email=True` on all three,
and `GET /users/` returned the whole table, so every address and the set of
admins could be harvested in one unauthenticated request.

Fixed by introducing `schemas.PublicUser` / `PublicUserWithProgress` — the same
shapes without `email` or `is_admin` — and using them on those routes. Safe to do
outright because `src/services/userService.js` only ever called
`/users/{id}/public`, which was already limited. Now:

```
/users/            -> 200  leaks_email=False  leaks_is_admin=False
/users/1           -> 200  leaks_email=False  leaks_is_admin=False
/users/1/profile   -> 200  leaks_email=False  leaks_is_admin=False   (progress kept)
/users/1/public    -> 200  leaks_email=False  leaks_is_admin=False
```

Covered by `tests/test_hardening.py::TestPublicUserProjection`.

### 2. `POST /users/` was an unauthenticated registration bypass — **FIXED**

`POST /users/` called `user_repo.create_user`, which inserted a user with no
verification token, no OTP email and no rate limit — unlike `/register`, capped
at 3/minute and sending the OTP. The account could log in immediately, because
`/login` allows unverified users, so the rate limit guarded an endpoint an
attacker never had to use.

```
before:  POST /users/ (anon)  -> 201 {"id":2,"name":"Bot","email":"bot@example.com",...}
now:     POST /users/ (anon)  -> 401 {"detail":"Not authenticated"}
```

The route now requires `get_current_admin`, which keeps it usable as a seeding
path. The response is also a public projection, so it no longer echoes the new
row's email. Covered by
`tests/test_hardening.py::TestDirectUserCreation`.

### 3. `/register` always reports `email_sent: true`, even when SMTP fails — **FIXED**

`app/routes/authentication.py:199` sets `email_status = "sent"` a line after
queueing the send, then derives the response from it at line 207. Nothing
observes the background task's result, so the flag is a constant:

```python
background_tasks.add_task(send_verification_otp_email, ...)
email_status = "sent"                      # line 199 — unconditional
...
"email_sent": email_status == "sent",      # line 207 — always True
```

Observed in a real run where SMTP was unreachable:
`ERROR:app.auth.email_utils:Failed to send email to victim@example.com`, and the
endpoint still returned success with `email_sent: true`. `SignUpPage.jsx:70`
branches on that field to send the user to the OTP screen, so with a broken
mailer every new user is told to check an inbox that will never receive
anything.

**Fix.** Either await the send so the response can be truthful, or record the
outcome on the user row and expose a real "resend" state. The honest minimum is
to stop claiming success: return `email_sent: false` when the send raises.

### 4. A password change does not invalidate existing tokens — **FIXED**

Tokens carry only `sub` and `exp` (`app/auth/jwt_token.py:17`), and nothing
looks up a token version or denylist — `grep -rn "token_version\|revoked" app/`
returns nothing. Changing a password via `PUT /profile/update-password` therefore
leaves every previously issued token valid for up to 30 minutes.

Account deletion does behave correctly: `get_current_user` re-loads the user by
email on every request (`app/auth/oauth2.py:27`), so a deleted user's tokens
start failing immediately.

**Fix.** Add a `token_version` integer to `users`, put it in the token payload,
and compare on each request — a password change bumps it. This also gives you
the revocation primitive a logout endpoint would need.

### 5. The local `.env` writes to a production database

`backend/.env` sets `DATABASE_URL` to a live Neon PostgreSQL instance, and
`settings.database_url` prefers `DATABASE_URL` over everything else
(`app/core/config.py`). `SECRETS.md` documents a *different* production database
(a Render Postgres host). Consequences:

- Running the app locally from this checkout writes to real data.
- `is_production` is `True` on this machine because the URL starts with
  `postgresql`, so local runs pick production CORS origins, production frontend
  URLs and the HSTS header. That is why the app logs
  `Running in production but PROD_CORS_ORIGINS allows ['http://localhost:5173', ...]`
  on startup.
- It is unclear which of the two databases is the live one.

**Fix.** Comment out `DATABASE_URL` in `backend/.env` so local runs fall back to
`DEV_DATABASE_URL` (SQLite). Keep exactly one copy of the production
credentials, in the Render/Vercel dashboards, and delete `SECRETS.md` after
rotating what it contains — the file holds the PostgreSQL password, the JWT
signing key and a Gmail app password. It has never been committed
(`git log --all -- SECRETS.md` is empty) and it is gitignored, so the risk is a
stray `git add -f` or a zipped project folder, not history.

---

## P1 — worth fixing soon

### 6. `/health` returns 200 with a dead database — **FIXED**

`app/main.py` reports `{status, uptime_seconds, version}` and touches nothing
else. It answers "is the process alive", not "can it serve requests", so an
uptime monitor cannot distinguish a healthy app from one that lost its
database. Add a readiness check that runs `SELECT 1` and returns 503 on
failure, and point the platform health check at that instead.

### 7. Two leftover probe endpoints are publicly reachable

- `GET /api/problems/test` (`app/routes/related_problems.py:16`) — a development
  probe, no auth.
- `GET /api/contests/debug` (`app/routes/contests.py:810`) — returns each
  upstream source's fetch statistics to anonymous callers, which discloses how
  the scraper works and when it last ran.

Both should be admin-gated or compiled out in production.

### 8. Login logging carries PII and a user-enumeration side channel — **FIXED**

`app/routes/authentication.py:30,42,46,61` log the submitted email, whether the
account exists, and whether the password matched. The HTTP responses are
deliberately uniform ("Incorrect email or password"), but the logs are not, so
anyone with log access can enumerate accounts — and every login writes an email
address to stdout. Downgrade the per-step logs to `debug`, or drop the address
and keep only a hashed identifier.

### 9. Rate limiting is partial, per-process, and ignores the available Redis — **FIXED**

Only seven endpoints are limited (all in `authentication.py`), and the limiter
uses slowapi's default in-memory storage — `Limiter(key_func=get_remote_address)`
with no `storage_uri` (`app/middleware/rate_limit.py:4`). Two consequences:

- `POST /blogs/`, every `POST /comments/*` and the admin writes are unlimited,
  so bulk content spam is not rate limited at all.
- Counters live in one process, so the effective limit multiplies by worker
  count on a multi-worker deploy.

Redis is already a dependency with a working client (`app/db/redis_client.py`)
and is not wired into the limiter. Point slowapi at it and extend the limits to
the write endpoints.

### 10. There is a refresh-token config and helper but no refresh flow — **FIXED**

`REFRESH_TOKEN_EXPIRE_DAYS`, `create_refresh_token` and `verify_refresh_token`
all exist, and no route issues or accepts a refresh token. Users are logged out
every 30 minutes. Either implement the endpoint pair or delete the dead code so
the next reader is not misled.

### 10b. Redis caching silently failed locally because the `.env` loader had the wrong path

`app/routes/contests.py` loaded `backend/.env` from
`Path(...).parents[1]`, which resolves to `backend/app/.env` — a file that never
exists. The loader silently did nothing, so `REDIS_HOST` and the other `REDIS_*`
names never reached `os.environ`, and
`app/db/redis_client.py`'s `os.getenv("REDIS_HOST", "localhost")` always fell
back to localhost.

On Render this is irrelevant — real environment variables are set on the service
— but locally it made contest caching behave as if it were off, and it masked the
two real failure modes in `redis_client.py`: no `socket_timeout`, and every helper
catching bare `Exception` so a hung or broken Redis blocks the worker rather than
failing fast, and a missing cache is indistinguishable from a cache miss.

Cause is a one-line path bug (`parents[1]` → `parents[2]`); fix is one line;
failure mode was silent because of the swallowed exceptions.

### 11. Production builds publish sourcemaps — **FIXED**

`build.sourcemap` is `true` in `frontend/vite.config.js`, so `dist/` ships the
full original source. That is a reasonable debugging trade-off; it should be a
deliberate one. If you keep it, restrict map upload to your error tracker;
otherwise set it to `false` or `'hidden'` and confirm nothing in
`frontend/e2e/` depends on maps being reachable.

---

## P2 — hygiene

12. **Redis has no socket timeout and swallows every error.**
    `app/db/redis_client.py` builds the client without `socket_timeout`, and
    `set_cache`/`get_cache`/`delete_cache` catch bare `Exception` and return
    `False`/`None`. A hung Redis blocks the worker, and a broken cache is
    indistinguishable from a cache miss. Add `socket_timeout`, and log at
    warning on failure.
13. **No cache headers on read-heavy public GETs.** `/algorithms/`,
    `/algo-type/` and `/blogs/` are public, rarely change, and are fetched on
    nearly every page load. A short `Cache-Control` saves database round trips
    for free.
14. **Unpaginated list endpoints.** `/blogs/` supports `skip`/`limit`
    (`app/routes/blog.py:38`); `/users/` and `/user_progress/` return whole
    tables. Add the same window before they grow.
15. **No automated dependency updates.** Dependencies are now pinned, which
    trades silent drift for silent staleness. Add Dependabot for `pip`,
    `npm` and `github-actions`.
16. **Ad-hoc scripts and two virtualenvs at the repo root.** There are ~10
    untracked scripts (`seed_*.py`, `check_*.py`, `fix_*.py`,
    `migrate_sqlite_to_postgres.py`, `reset_neondb.py`), two SQLite files and a
    `venv/` next to `backend/venv/`. They are gitignored, so they never ship,
    but they make the working tree ambiguous — nothing distinguishes a script
    that still matters from one that was a one-off. Keep the ones you still
    run under `scripts/` with a one-line header, delete the rest.
17. **`/health` reports a hardcoded version.** `app/main.py:70` returns
    `"version": "1.0.0"` while nothing in the project tracks a version, so the
    field can only ever go stale. Read it from package metadata or remove it.
18. **No CONTRIBUTING note for adding an algorithm.** The engine has a clear
    shape (`frontend/src/engine/algorithms/`, one generator per algorithm,
    registered once, then covered by `all-algorithms.test.jsx`). A short
    document pointing at one worked example would save the next contributor
    from reverse-engineering it.
19. **Dead and broken files are still tracked.** Four worth deleting:
    - `app/models_related_problems.py` — an 8-line re-export shim importing
      `from ..models import ...`, which resolves to `backend/models.py`. That
      module does not exist, so the file raises `ImportError` the moment
      anything imports it. Nothing does (`grep -rn models_related_problems` is
      empty), which is the only reason it has not broken anything. The tables
      it re-exports are defined in `app/models.py` directly.
    - `backend/run_migrations.py` — walks a `migrations/` directory that does
      not exist (the project uses `alembic_migrations/`), so it prints
      "Migrations directory not found" and exits. Pre-Alembic leftover.
    - `frontend/requirements.txt` — a tracked, **zero-byte** file. A Python
      requirements file inside the React app.
    - `app/services/youknowwho_integration.py` is referenced only by
      `related_problems.py`; confirm which of the two problem-fetching paths is
      current before touching either.
20. **Learning-path tables exist with no API surface.** `learning_paths`,
    `path_steps`, `user_path_progress`, `user_step_progress` and
    `path_recommendations` are declared in `app/models.py` (lines 300–430) and
    created by the initial Alembic migration, so they exist in the production
    database. No route, service or repository references any of them
    (`grep -rln "LearningPath" app/routes app/services app/repositories` is
    empty). Either build the feature or drop the tables in a migration — today
    they are ~130 lines of untested model code plus five empty tables that a
    reader has to investigate before discovering nothing uses them.

---

## Deliberately not on this list

Generic roadmaps recommend these; none of them fit this project, and doing them
would add maintenance surface without removing risk:

- **A Dockerfile.** Render builds the backend from `requirements.txt` today. A
  container would only be worth adding if you need build reproducibility or a
  non-Python sidecar.
- **Splitting into microservices / Kubernetes.** There is one small service and
  one database. The split in the old roadmap (user / algorithm / progress / blog
  / notification / analytics services) is a large refactor that buys nothing at
  this scale.
- **`/api/v1` versioning.** There is exactly one consumer, the frontend, which
  is deployed from this repository. Versioning is worth adding when an external
  client depends on the API.
- **"Migrate off SQLite before you scale."** Production is already PostgreSQL;
  SQLite is only the test and local-development backend.
- **Adopting `fastapi-jwt-auth`.** See the table above — it would break Pydantic v2.

---

## Suggested order

1. P0 item 3 — `/register` reporting a successful email it never sent is the
   one remaining live defect that misleads users.
2. P0 items 4–5, together with rotating the credentials in `SECRETS.md` and
   pointing `backend/.env` at SQLite.
3. P1 items 6–7, while you are already in `main.py` and the route files.
4. Everything else when the opportunity appears.
