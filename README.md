# AlgoVerse — Interactive Algorithm Learning Platform

AlgoVerse is a full-stack web application for algorithm learning and competitive programming. It combines interactive visualizations, practice tracking, and competitive analytics into a single platform.

**Live Demo**: https://algo-verse-eight.vercel.app

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

## Technologies

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL (production) / SQLite (development)
- JWT Authentication
- Alembic migrations

### Frontend
- React 18 (Vite)
- React Router
- Context API
- Axios

## Quick Start

### Backend
```bash
# Clone repository
git clone https://github.com/MHKhanCou/AlgoVerse.git
cd AlgoVerse

# Setup environment
python -m venv venv
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r backend/requirements.txt

# Setup environment
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Run migrations
cd backend
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Local Access

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

## Production URLs

- Main application: https://algo-verse-eight.vercel.app
- Backend API: https://algoverse-kpwz.onrender.com
- API documentation: https://algoverse-kpwz.onrender.com/docs

## Project Structure
```
AlgoVerse/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── main.py            # FastAPI entry point
│   │   ├── models/            # Database models
│   │   ├── routes/            # API endpoints
│   │   ├── auth/              # Authentication logic
│   │   ├── repositories/      # Data access layer
│   │   ├── services/          # Business logic
│   │   └── middleware/        # Custom middleware
│   ├── alembic/               # Database migrations
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables
├── frontend/                  # React application
├── docs/                      # Documentation
│   ├── README.md             # Detailed setup guide
│   ├── SETUP_GUIDE.md        # Comprehensive setup
│   └── SYSTEM_ANALYSIS.md    # Technical analysis
└── README.md                  # This file
```

## Environment Variables

### Backend Required Variables
- `DATABASE_URL` - Database connection string
- `SECRET_KEY` - JWT secret key
- `SMTP_HOST` - Email server host
- `SMTP_USER` - Email username
- `SMTP_PASSWORD` - Email password

### Frontend Required Variables
- `VITE_API_BASE_URL` - Backend API URL

## Documentation

- [Setup Guide](docs/SETUP_GUIDE.md) - Detailed setup instructions
- [System Analysis](docs/SYSTEM_ANALYSIS.md) - Technical architecture
- [API Documentation](https://algoverse-kpwz.onrender.com/docs) - Interactive API docs

## Connect

- **LinkedIn**: https://www.linkedin.com/in/mhkhancou
- **Live Demo**: https://algo-verse-eight.vercel.app
