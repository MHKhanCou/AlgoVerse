# AlgoVerse - Learn Algorithms Visually

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.68+-009688.svg)](https://fastapi.tiangolo.com)

> A modern web application for learning algorithms through interactive visualizations and practice problems.

## ✨ Features

- **Interactive Algorithm Visualizer** - Step-by-step visualization of sorting and searching algorithms
- **Practice Problems** - Curated problems with multiple difficulty levels
- **Progress Tracking** - Monitor your learning journey
- **Responsive Design** - Works on desktop and mobile devices
- **Dark/Light Theme** - Choose your preferred color scheme

## 💻 Tech Stack

**Frontend**
- React 18 with Hooks
- React Router for navigation
- Context API for state management
- Custom CSS for styling

**Backend**
- FastAPI (Python)
- SQLAlchemy ORM
- SQLite (development) / PostgreSQL (production)
- JWT Authentication

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn
- PostgreSQL (for production)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MHKhanCou/AlgoVerse.git
   cd AlgoVerse
   ```

2. Set up the backend:
   ```bash
   # Create and activate virtual environment
   python -m venv myenv
   myenv\Scripts\activate  # Windows
   # source myenv/bin/activate  # Mac/Linux

   # Install dependencies
   pip install -r requirements.txt

   # Set up environment variables
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Set up the database:
   ```bash
   # For development (SQLite - default)
   # The database will be created automatically on first run

   # For production (PostgreSQL)
   # 1. Create a PostgreSQL database
   # 2. Update DATABASE_URL in .env (use your actual credentials):
   #    # Example configuration (replace with your actual values):
   #    DATABASE_URL=postgresql://username:password@localhost:5432/algoverse
   #    
   #    # Important: Never commit real credentials to version control!
   #    # This is just an example format.
   #
   # 3. Run migrations:
   #    alembic upgrade head
   ```

4. Start the server:
   ```bash
   uvicorn main:app --reload
   ```

5. Set up the frontend:
   ```bash
   cd frontend
   npm install
   npm start
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
algoverse/
├── frontend/          # React frontend
│   ├── public/        # Static files
│   └── src/           # Source code
│       ├── components/ # Reusable UI components
│       ├── contexts/   # React context providers
│       └── services/   # API service functions
├── backend/           # FastAPI backend
│   ├── auth/          # Authentication logic
│   ├── models/        # Database models
│   ├── routes/        # API endpoints
│   └── db/            # Database configuration
├── .env               # Environment variables
└── requirements.txt   # Python dependencies
```

## Project Overview

This project demonstrates a full-stack web application for learning algorithms through interactive visualizations. It serves as a practical implementation of modern web development practices, combining:

- **Backend**: FastAPI for high-performance API development
- **Frontend**: React with functional components and hooks
- **Database**: SQLAlchemy ORM with support for both SQLite and PostgreSQL

Built with scalability and maintainability in mind, this project follows best practices in code organization and architecture.

## PostgreSQL Setup (Production)

For production deployment, we recommend using PostgreSQL. Here's how to set it up:

1. Install PostgreSQL on your server
2. Create a new database and user:
   ```sql
   CREATE DATABASE algoverse;
   CREATE USER algoverse_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE algoverse TO algoverse_user;
   ```
3. Update your `.env` file:
   ```
   DATABASE_URL=postgresql://algoverse_user:your_secure_password@localhost:5432/algoverse
   AUTO_CREATE_TABLES=false
   ```
4. Run migrations:
   ```bash
   alembic upgrade head
   ```

For questions or contributions, please open an issue in the repository.
