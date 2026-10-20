# AlgoVerse API Routes

Reference for every HTTP operation the FastAPI app exposes.

**105 operations across 12 router modules**, verified against `app.routes` — not
copied from an older revision. The previous version of this file documented
`/auth/*`, `/algo_types`, `/blog` and `/related_problems` prefixes that do not
exist in the code; the frontend was already calling the real paths, so those
entries were documentation-only drift and are corrected here.

## Base URLs

| Environment | Base URL |
| --- | --- |
| Local | `http://localhost:8000` |
| Production | `https://algoverse-kpwz.onrender.com` |

Interactive docs: `/docs` (Swagger UI) and `/redoc`.

## Regenerating this table

Route paths in this file are the source of truth only until the code changes.
To re-derive them:

```bash
cd backend
python -c "
from app.main import app
from fastapi.routing import APIRoute
for r in sorted(app.routes, key=lambda r: getattr(r, 'path', '')):
    if isinstance(r, APIRoute):
        print(','.join(sorted(m for m in r.methods if m not in ('HEAD','OPTIONS'))), r.path)
"
```

## URL layout

There is **no `/api/v1` version prefix**. Paths are a mix of styles because the
routers grew independently:

| Router | Prefix | File |
| --- | --- | --- |
| Authentication | *(none — paths are at the root)* | `app/routes/authentication.py` |
| Profile | `/profile` | `app/routes/profile.py` |
| Users | `/users` | `app/routes/user.py` |
| Algorithm Types | `/algo-type` | `app/routes/algo_types.py` |
| Algorithms | `/algorithms` | `app/routes/algorithm.py` |
| User Progress | `/user_progress` | `app/routes/user_progress.py` |
| Admin | `/admin` (+ siblings below) | `app/routes/admin.py` |
| Blog | `/blogs` | `app/routes/blog.py` |
| Comments | `/comments` | `app/routes/comments.py` |
| Algorithm Comments | `/comments` (shared) | `app/routes/algorithm_comments.py` |
| Related Problems | `/api/problems` | `app/routes/related_problems.py` |
| Contests | `/api` | `app/routes/contests.py` |

Two things worth knowing before you add a route:

- **Auth lives at the root.** `/login`, `/register`, `/verify-email` and friends
  have no prefix, so `APIRouter(tags=["Authentication"])` is mounted bare in
  `app/main.py`. Adding a prefix here breaks the frontend.
- **`/comments` is claimed twice.** `comments.py` owns `/comments/blog/*` and
  `/comments/{comment_id}`; `algorithm_comments.py` owns
  `/comments/algorithm/*`. They do not collide, but a route added as
  `/comments/{id}` in `algorithm_comments.py` silently shadows
  `/comments/{comment_id}` from `comments.py` depending on include order.

## Authentication

JWT bearer tokens: `Authorization: Bearer <access_token>`.

- Obtained from `POST /login` (any user) or `POST /admin/login` (admins only,
  and the account must have a verified email).
- Signed with `JWT_SECRET_KEY`, `HS256`, 30-minute expiry
  (`ACCESS_TOKEN_EXPIRE_MINUTES`). Refresh-token helpers exist in
  `app/auth/jwt_token.py` but no route issues a refresh token yet.
- The **Auth** column below is derived from the route's real dependency tree:
  `admin` = `get_current_admin`, `user` = `get_current_user`, `public` = no auth
  dependency. Several `admin`-marked routes enforce it inside the handler
  instead of via a dependency; that is noted where it happens.

### Rate limits

Enforced by slowapi, keyed on client address
(`app/middleware/rate_limit.py`). Only these seven endpoints are limited:

| Endpoint | Limit |
| --- | --- |
| `POST /login` | 5/minute |
| `POST /admin/login` | 5/minute |
| `POST /register` | 3/minute |
| `POST /verify-email` | 5/minute |
| `POST /resend-verification` | 3/minute |
| `POST /forgot-password` | 5/minute |
| `POST /reset-password` | 5/minute |

Every other endpoint is unlimited, including `POST /blogs/`,
`POST /comments/*` and the admin writes. The limiter is also process-local: a
second worker gets its own counters, so the effective limit multiplies with
worker count.

## Response shape

Most endpoints in `authentication.py` use `schemas.APIResponse`:

```json
{ "success": true, "message": "...", "data": { } }
```

Two caveats:

- `POST /register` additionally returns a top-level `email_sent` boolean
  (`schemas.RegisterResponse`). The signup page reads it, so it cannot be
  dropped without changing the frontend.
- Most other routers return their Pydantic model directly, **not** this
  envelope. `/algorithms/`, `/blogs/`, `/user_progress/` and the rest return
  bare objects or lists. Do not assume the envelope is universal.

---

## Authentication — `/` (no prefix)

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/register` | public | 3/min. Creates an unverified user and emails a 6-digit OTP. Returns `email_sent`. |
| POST | `/verify-email` | public | 5/min. Body: `{token}` — the OTP, not a URL token. |
| POST | `/resend-verification` | public | 3/min. |
| POST | `/login` | public | 5/min. Form-encoded (`OAuth2PasswordRequestForm`: `username`=email). Unverified users may still log in. |
| POST | `/admin/login` | public | 5/min. Requires `is_admin` **and** a verified email, or 403/401. |
| POST | `/forgot-password` | public | 5/min. |
| POST | `/reset-password` | public | 5/min. |
| GET | `/admin/user-stats` | admin | Verified/unverified counts. |
| POST | `/admin/cleanup-otps` | admin | Clears expired OTPs. |
| POST | `/admin/cleanup-users` | admin | Deletes unverified users older than a threshold. |

## Profile — `/profile`

All require a logged-in user.

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/profile/me` | user | |
| PUT | `/profile/update` | user | Name, email, Codeforces handle. |
| PUT | `/profile/update-password` | user | Requires the current password. |
| DELETE | `/profile/delete` | user | |
| GET | `/profile/my-blogs` | user | |
| GET | `/profile/my-progress` | user | |
| GET | `/profile/stats` | user | |
| POST | `/profile/request-email-otp` | user | Step 1 of changing an email: sends an OTP to the new address. |
| POST | `/profile/verify-email-otp` | user | Step 2: submits the OTP and commits the new address. |

These two are the real email-change endpoints. Older docs listed them as
`/auth/request-email-otp` and `/auth/verify-password-otp`; neither exists.

## Users — `/users`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/users/` | public | |
| POST | `/users/` | public | Registration path separate from `/register`. No rate limit. |
| GET | `/users/{user_id}` | public | |
| GET | `/users/{user_id}/profile` | public | |
| GET | `/users/{user_id}/public` | public | Trimmed public profile. Older docs said `/users/{id}/public` is the *fix* for a failing `/users/{id}` — both exist; they return different shapes. |

## Algorithm types — `/algo-type`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/algo-type/` | public | Singular `algo-type`, not `algo_types`. |
| GET | `/algo-type/{type_id}` | public | |
| POST | `/algo-type/` | admin | |
| PUT | `/algo-type/{type_id}` | admin | |
| DELETE | `/algo-type/{type_id}` | admin | |

## Algorithms — `/algorithms`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/algorithms/` | public | |
| GET | `/algorithms/{id}` | public | |
| GET | `/algorithms/type/{type_id}` | public | |
| GET | `/algorithms/{id}/related-problems` | public | |
| POST | `/algorithms/` | admin | |
| PUT | `/algorithms/{id}` | admin | |
| DELETE | `/algorithms/{id}` | admin | |

## User progress — `/user_progress`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/user_progress/` | user | Current user only. |
| POST | `/user_progress/` | user | |
| POST | `/user_progress/batch` | user | Progress for several algorithms in one call. |
| GET | `/user_progress/detailed-stats` | user | |
| GET | `/user_progress/stats` | user | |
| GET | `/user_progress/entry/{algo_id}` | user | |
| GET | `/user_progress/last-accessed` | user | |
| POST | `/user_progress/update-access/{algo_id}` | user | |
| GET | `/user_progress/user` | user | |
| GET | `/user_progress/user/{user_id}` | user | |
| PUT | `/user_progress/{progress_id}` | user | |
| DELETE | `/user_progress/{progress_id}` | user | |

## Blog — `/blogs`

Plural `blogs`, not `blog`.

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/blogs/` | public | Approved blogs only. |
| GET | `/blogs/{id}` | public | |
| GET | `/blogs/user/{id}` | public | |
| GET | `/blogs/search/{query}` | public | |
| POST | `/blogs/` | user | Enters moderation. |
| PUT | `/blogs/{id}` | user | |
| DELETE | `/blogs/{id}` | user | |

## Comments — `/comments`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/comments/blog/{blog_id}` | public | |
| POST | `/comments/blog/{blog_id}` | user | |
| PUT | `/comments/{comment_id}` | user | Author only. |
| DELETE | `/comments/{comment_id}` | user | Author or admin. |
| GET | `/comments/algorithm/{algorithm_id}` | public | |
| POST | `/comments/algorithm/{algorithm_id}` | user | |
| PUT | `/comments/algorithm/{comment_id}` | user | Author only. |
| DELETE | `/comments/algorithm/{comment_id}` | user | Author or admin. |

## Related problems — `/api/problems`

The path prefix is `/api/problems`; there is no `/related_problems` route.

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/problems/algorithm/{algorithm_id}` | public | |
| POST | `/api/problems/` | user | Suggests a problem. |
| GET | `/api/problems/progress/{algorithm_id}` | user | |
| POST | `/api/problems/{problem_id}/progress` | user | |
| GET | `/api/problems/all` | admin | |
| GET | `/api/problems/pending` | admin | Moderation queue. |
| PUT | `/api/problems/{problem_id}` | admin | |
| DELETE | `/api/problems/{problem_id}` | admin | |
| PATCH | `/api/problems/{problem_id}/status` | admin | Approve/reject. |
| GET | `/api/problems/topic-mappings` | admin | |
| POST | `/api/problems/topic-mappings` | admin | |
| POST | `/api/problems/auto-suggest/{algorithm_id}` | admin | |
| POST | `/api/problems/sync-all` | admin | |
| GET | `/api/problems/test` | public | Health probe for this router. **Returns no data and should not be reachable on a public deployment** — see ROADMAP.md. |

## Contests — `/api/contests`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/contests` | public | Contests grouped into `running`, `upcoming`, `recent`. |
| GET | `/api/contests/{source}` | public | One source, Redis-cached. |
| GET | `/api/contests/debug` | public | Upstream fetch stats per source. **Exposes internal scraping state to anonymous callers** — see ROADMAP.md. |

## Admin — `/admin`

Every route requires an admin token. `/admin/algo-types/*`, `/admin/algorithms/*`,
`/admin/users/*`, `/admin/progress/*`, `/admin/dashboard/*`, `/admin/blogs/*` and
`/admin/related-problems/*` are separate `APIRouter` instances mounted together in
`app/main.py`.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/admin/dashboard/` | |
| GET | `/admin/dashboard/admin-info` | |
| GET | `/admin/users/` | |
| DELETE | `/admin/users/{user_id}` | |
| PUT | `/admin/users/{user_id}/make-admin` | |
| GET | `/admin/algo-types/` | |
| POST | `/admin/algo-types/` | |
| PUT | `/admin/algo-types/{type_id}` | |
| DELETE | `/admin/algo-types/{type_id}` | |
| GET | `/admin/algorithms/` | |
| POST | `/admin/algorithms/` | |
| PUT | `/admin/algorithms/{algo_id}` | |
| DELETE | `/admin/algorithms/{algo_id}` | |
| GET | `/admin/blogs/` | Optional status filter. |
| GET | `/admin/blogs/pending` | |
| POST | `/admin/blogs/{blog_id}/moderate` | Approve/reject with feedback. |
| PUT | `/admin/blogs/{blog_id}` | |
| DELETE | `/admin/blogs/{blog_id}` | |
| GET | `/admin/progress/` | |
| DELETE | `/admin/progress/user/{user_id}` | Deletes one user's progress. |
| DELETE | `/admin/progress/{progress_id}` | |
| GET | `/admin/related-problems/` | |
| GET | `/admin/related-problems/pending` | |

Admin auth routes (`/admin/login`, `/admin/user-stats`, `/admin/cleanup-otps`,
`/admin/cleanup-users`) live in `authentication.py`, not `admin.py`.

## Service

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/` | public | `{"message": "API is running"}`. |
| GET | `/health` | public | `{status, uptime_seconds, version}`. Deliberately reports no database or SMTP detail, so it answers "is the process up", not "is the app healthy" — it will return 200 with a dead database. |

## Response headers

Every response carries `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy` and `Permissions-Policy`, and in production
`Strict-Transport-Security` (`app/middleware/security_headers.py`).
