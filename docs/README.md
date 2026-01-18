# AlgoVerse — Interactive Algorithm Learning Platform

AlgoVerse is a full-stack web application for algorithm learning and competitive programming. It combines interactive visualizations, practice tracking, and competitive analytics into a single platform.

## Overview

AlgoVerse supports:

- Interactive algorithm and data structure visualizations
- Competitive programming analytics via Codeforces integration
- Contest tracking for upcoming and live contests
- Secure user authentication with email verification
- CRUD operations for core resources
- Community features including blogs and comments

The project is designed with separate development and production environments. Development uses a lightweight SQLite database, while production uses PostgreSQL.

## Features

### Learning
- Step-by-step algorithm visualizations
- Comprehensive algorithm library
- Practice problems with progress tracking

### Competitive Programming
- Codeforces profile analyzer
- Contest tracker for major competitive programming platforms

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

### Frontend
- React 18 (Vite)
- React Router
- Context API
- Axios

### Backend
- FastAPI
- SQLAlchemy
- Pydantic
- PostgreSQL (production)
- SQLite (development)
- JWT Authentication

## Environment Modes

### Development
- Local environment
- SQLite database
- Hot reload for frontend and backend

### Production
- PostgreSQL database
- Environment configurations optimized for performance and security

## Installation

### Backend
```bash
# Clone repository
git clone https://github.com/MHKhanCou/AlgoVerse.git
cd AlgoVerse

# Setup Python environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
# Edit .env for your environment (DB, JWT keys, email provider)

# Run migrations
alembic upgrade head

# Start development server
uvicorn main:app --reload
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
- API Docs (Swagger): http://localhost:8000/docs

## Deployment

Frontend is deployed on Vercel. Backend and PostgreSQL are deployed on Render with environment-based configuration and managed services.

## Production URLs

- Main application: https://algo-verse-eight.vercel.app
- Backend API: https://algoverse-kpwz.onrender.com
- API documentation: https://algoverse-kpwz.onrender.com/docs

## Project Structure
```
AlgoVerse/
├── frontend/              # React application
├── auth/                  # Authentication logic
├── models/                # Database models
├── routes/                # API endpoints
├── repositories/          # Data access layer
├── main.py                # FastAPI entry point
└── README.md
```

## Security and Best Practices

- JWT-based authentication with expiration
- OTP email verification
- Secure password reset
- Input validation with Pydantic
- CORS and rate limiting
- Database protection via ORM

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository
2. Create a feature branch
3. Add tests
4. Submit a pull request

## Connect

- **LinkedIn**: https://www.linkedin.com/in/mhkhancou
- **Live Demo**: https://algo-verse-eight.vercel.app
