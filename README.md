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

The API is versioned under `/api` where applicable.

### Frontend
- React 18 (Vite)
- React Router
- Context API
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

# Setup environment variables
cp backend/.env.example backend/.env
# Edit backend/.env as needed

# Run database migrations
cd backend
alembic upgrade head
```

Alembic is used for schema migrations in both development and production.

# Start backend server
uvicorn app.main:app --reload --port 8000
```

> Note: The root `main.py` exists only for deployment convenience.
> All application logic lives in `backend/app/main.py`.

---

### Frontend

```bash
cd frontend
npm install
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
│   │   ├── main.py            # Application entry point
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── routes/            # API endpoints
│   │   ├── auth/              # Authentication utilities
│   │   ├── repositories/      # Data access layer
│   │   ├── services/          # Business logic
│   │   └── middleware/        # Custom middleware
│   ├── alembic.ini
│   ├── alembic_migrations/    # Database migrations
│   └── .env.example
├── frontend/                  # React application
├── requirements.txt           # Backend dependencies
└── README.md                  # This file
```

---

## Environment Variables

### Backend

* `DATABASE_URL` — Database connection string
* `SECRET_KEY` — JWT secret key
* `SMTP_HOST` — Email server host
* `SMTP_USER` — Email username
* `SMTP_PASSWORD` — Email password

The database backend is selected via `DATABASE_URL` (SQLite for development, PostgreSQL for production).

### Frontend

* `VITE_API_BASE_URL` — Backend API base URL

---

## Documentation

* [API Docs](https://algoverse-kpwz.onrender.com/docs)

---

## Connect

* **LinkedIn**: [https://www.linkedin.com/in/mhkhancou](https://www.linkedin.com/in/mhkhancou)
* **Live Demo**: [https://algo-verse-eight.vercel.app](https://algo-verse-eight.vercel.app)
