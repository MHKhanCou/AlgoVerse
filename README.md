# AlgoVerse — Interactive Algorithm Learning Platform

AlgoVerse is a full-stack web application for algorithm learning and competitive programming. It combines interactive visualizations, practice tracking, and competitive analytics into a single platform.

**Live Demo**: https://algo-verse-eight.vercel.app

---

## Features

### Learning
- Interactive algorithm visualizations
- Comprehensive algorithm library
- Practice problems with progress tracking

### Competitive Programming
- Codeforces profile analyzer
- Contest tracker for major platforms

### User Management
- Email verification and OTP
- JWT authentication and authorization
- Profile CRUD and settings
- Password reset

### Community
- Blog system
- Commenting
- Admin dashboard with role-based access

---

## Technologies

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL (production) / SQLite (development)
- JWT Authentication
- Alembic migrations

Routes are flat and unversioned; only the contests and related-problem routers
live under `/api`. [backend/ROUTES_DOCUMENTATION.md](backend/ROUTES_DOCUMENTATION.md)
lists every endpoint with its auth requirement and rate limit.

### Frontend
- React 19 (Vite 6)
- React Router 7
- Context API + Zustand
- Axios

---

## Quick Start

### Backend

```bash
# Clone repository
git clone https://github.com/MHKhanCou/AlgoVerse.git
cd AlgoVerse

# Create virtual environment
python -m venv venv
source venv/bin/activate    # macOS / Linux
venv\Scripts\activate       # Windows

# Install dependencies
pip install -r requirements.txt

# Optional: test tooling (pytest + httpx)
pip install -r backend/requirements-dev.txt

# Setup environment variables
cp backend/.env.example backend/.env
# Edit backend/.env as needed

# Run database migrations
cd backend
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload --port 8000
```

Alembic is used for schema migrations in both development and production.

> Note: The root `main.py` exists only for deployment convenience.
> All application logic lives in `backend/app/main.py`.

---

### Frontend

```bash
cd frontend
npm install
cp .env.example .env    # optional - the defaults work as-is
npm run dev
```

---

## Local Access

* Frontend: [http://localhost:5173](http://localhost:5173)
* Backend API: [http://localhost:8000](http://localhost:8000)
* API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
* Health Check: [http://localhost:8000/health](http://localhost:8000/health)

---

## Production URLs

* Main application: [https://algo-verse-eight.vercel.app](https://algo-verse-eight.vercel.app)
* Backend API: [https://algoverse-kpwz.onrender.com](https://algoverse-kpwz.onrender.com)
* API documentation: [https://algoverse-kpwz.onrender.com/docs](https://algoverse-kpwz.onrender.com/docs)

---

## Project Structure

```
AlgoVerse/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py             # App assembly: routers, CORS, middleware
│   │   ├── models.py           # SQLAlchemy models
│   │   ├── schemas.py          # Pydantic request/response schemas
│   │   ├── core/config.py      # Environment-based settings
│   │   ├── db/                 # Engine, session factory, Redis client
│   │   ├── auth/               # JWT, password hashing, email/OTP
│   │   ├── repositories/       # Data access layer
│   │   ├── services/           # Contest + problem integrations
│   │   ├── middleware/         # Rate limiting, admin guards, security headers
│   │   └── routes/             # 12 routers
│   ├── alembic_migrations/     # Schema migrations
│   ├── tests/                  # pytest suite (in-memory SQLite)
│   ├── pytest.ini
│   ├── requirements-dev.txt    # pytest + httpx
│   └── .env.example
├── frontend/                   # React application
│   ├── src/
│   │   ├── engine/             # Visualization engine + its unit tests
│   │   └── pages/, components/, contexts/, services/
│   ├── e2e/                    # Playwright suites
│   ├── .env.example
│   └── vercel.json             # SPA rewrite rule
├── .github/workflows/          # frontend.yml + backend.yml
├── requirements.txt            # Pinned backend runtime dependencies
└── ROADMAP.md                  # Production readiness roadmap
```

---

## Environment Variables

### Backend

Copy `backend/.env.example` to `backend/.env` and fill in what you need.

* `ENVIRONMENT` — `development` or `production`. A `postgresql://` `DATABASE_URL`
  is also treated as production.
* `DATABASE_URL` — Wins over the two below. Render sets this automatically.
* `DEV_DATABASE_URL` / `PROD_DATABASE_URL` — Used only when `DATABASE_URL` is unset.
  Development defaults to a local SQLite file.
* `JWT_SECRET_KEY` — Signs access tokens. **Required in production**: the app
  refuses to start without it rather than issue tokens signed with an empty key.
* `PROD_CORS_ORIGINS` — Comma-separated allowed origins. Deliberately excludes
  localhost, because the API sends credentials.
* `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `FROM_EMAIL` — Gmail
  app-password OTP delivery. `DISABLE_EMAIL=true` skips sending entirely.
* `AUTO_CREATE_TABLES` — Off in production by default. Use Alembic.

### Frontend

* `VITE_API_URL` — Backend API base URL for a production build. The name is
  historical: it is the *API's* URL, not this app's.
* `VITE_PROD_API_BASE_URL` — Fallback used when `VITE_API_URL` is unset.
* `VITE_ENVIRONMENT` — Label only. The dev/prod choice comes from Vite's build
  mode, not from this variable.

`src/services/api.js` is the only module that reads them. Development always
calls `http://localhost:8000` no matter what is configured.

---

## Testing

```bash
# Backend - run from backend/
python -m pytest tests/ -q

# Frontend - run from frontend/
npm run test:run    # unit + visualization engine tests
npm run lint        # eslint over the whole tree
npm run e2e         # Playwright against the production build
```

The backend suite uses in-memory SQLite and overrides the database dependency,
so it needs no PostgreSQL instance and no secrets.

---

## Documentation

* [Interactive API docs](https://algoverse-kpwz.onrender.com/docs) — Swagger UI, also at `/redoc`
* [API route reference](backend/ROUTES_DOCUMENTATION.md) — every endpoint, its auth requirement and its rate limit
* [Production readiness roadmap](ROADMAP.md) — open gaps, ranked, with the evidence for each

---

## Connect

* **LinkedIn**: [https://www.linkedin.com/in/mhkhancou](https://www.linkedin.com/in/mhkhancou)
* **Live Demo**: [https://algo-verse-eight.vercel.app](https://algo-verse-eight.vercel.app)
