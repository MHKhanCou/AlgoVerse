# 🚀 AlgoVerse - Interactive Algorithm Learning Platform

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.68+-009688.svg)](https://fastapi.tiangolo.com)
[![SQLite](https://img.shields.io/badge/SQLite-3.36+-003B57.svg)](https://sqlite.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **A comprehensive platform for learning algorithms through interactive visualizations, practice problems, and community engagement.**

## 📋 Table of Contents

- [🌟 Features](#-features)
- [🏗️ System Architecture](#️-system-architecture)
- [🚀 Quick Start](#-quick-start)
- [📦 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [🔧 Development Setup](#-development-setup)
- [📚 API Documentation](#-api-documentation)
- [🎨 Frontend Features](#-frontend-features)
- [🔐 Authentication](#-authentication)
- [📊 Database Schema](#-database-schema)
- [🧪 Testing](#-testing)
- [🚀 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🌟 Features

### 🎯 **Core Learning Features**
- **Interactive Algorithm Visualizations** - Step-by-step visual explanations
- **Comprehensive Algorithm Library** - Sorting, searching, graph algorithms, and more
- **Practice Problems** - Curated problems with multiple difficulty levels
- **Progress Tracking** - Monitor your learning journey and achievements
- **Code Examples** - Multiple programming language implementations

### 🌐 **Community & Social**
- **Blog System** - Share insights and tutorials with the community
- **User Profiles** - Track progress and showcase achievements
- **Codeforces Integration** - Analyze competitive programming performance
- **Discussion Forums** - Engage with other learners

### 🎨 **User Experience**
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Mode** - Choose your preferred theme
- **Advanced Search** - Find algorithms, problems, and content quickly
- **Real-time Updates** - Live data synchronization

### 🔧 **Technical Features**
- **RESTful API** - Clean, documented backend architecture
- **JWT Authentication** - Secure user authentication and authorization
- **Database Migrations** - Version-controlled database schema changes
- **Error Handling** - Comprehensive error management and user feedback

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (FastAPI)     │◄──►│   (SQLite)      │
│                 │    │                 │    │                 │
│ • Components    │    │ • REST API      │    │ • User Data     │
│ • State Mgmt    │    │ • Authentication│    │ • Algorithms    │
│ • Routing       │    │ • Business Logic│    │ • Progress      │
│ • Styling       │    │ • Data Models   │    │ • Blogs         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Technology Stack**

#### **Backend**
- **FastAPI** - Modern, fast web framework for building APIs
- **SQLAlchemy** - SQL toolkit and Object-Relational Mapping
- **SQLite** - Lightweight, serverless database
- **Pydantic** - Data validation using Python type annotations
- **JWT** - JSON Web Tokens for authentication
- **Uvicorn** - ASGI server implementation

#### **Frontend**
- **React 18** - Modern JavaScript library for building user interfaces
- **React Router** - Declarative routing for React applications
- **Context API** - State management for authentication and themes
- **Lucide React** - Beautiful, customizable icons
- **CSS3** - Modern styling with flexbox, grid, and animations
- **Responsive Design** - Mobile-first approach

## 🚀 Quick Start

### **Prerequisites**
- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn package manager
- Git

### **1. Clone the Repository**
```bash
git clone https://github.com/yourusername/algoverse.git
cd algoverse
```

### **2. Backend Setup**
```bash
# Create virtual environment
python -m venv myenv

# Activate virtual environment
# Windows:
myenv\Scripts\activate
# macOS/Linux:
source myenv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python run_migrations.py

# Start the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### **3. Frontend Setup**
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

### **4. Access the Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📦 Installation

### **Detailed Backend Setup**

1. **Create and activate virtual environment:**
   ```bash
   python -m venv myenv
   
   # Windows
   myenv\Scripts\activate
   
   # macOS/Linux
   source myenv/bin/activate
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Edit .env with your configuration
   SECRET_KEY=your-secret-key-here
   ALGORITHM_TIMEOUT=30
   DATABASE_URL=sqlite:///./algoverse.db
   ```

4. **Initialize the database:**
   ```bash
   # Run migrations
   python run_migrations.py
   
   # Optional: Seed with sample data
   python seed_database.py
   ```

5. **Start the backend server:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### **Detailed Frontend Setup**

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables:**
   ```bash
   # Create .env file in frontend directory
   REACT_APP_API_URL=http://localhost:8000
   REACT_APP_CODEFORCES_API=https://codeforces.com/api
   ```

4. **Start the development server:**
   ```bash
   npm start
   # or
   yarn start
   ```

## ⚙️ Configuration

### **Backend Configuration (.env)**
```env
# Security
SECRET_KEY=your-super-secret-key-here
ALGORITHM_TIMEOUT=30

# Database
DATABASE_URL=sqlite:///./algoverse.db

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# JWT
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### **Frontend Configuration**
```env
# API Configuration
REACT_APP_API_URL=http://localhost:8000
REACT_APP_CODEFORCES_API=https://codeforces.com/api

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_DARK_MODE=true
```

## 🔧 Development Setup

### **Project Structure**
```
algoverse/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── models.py              # Database models
│   ├── schemas.py             # Pydantic schemas
│   ├── routes/                # API route handlers
│   │   ├── auth.py
│   │   ├── algorithms.py
│   │   ├── blogs.py
│   │   └── profile.py
│   ├── repositories/          # Data access layer
│   ├── auth/                  # Authentication logic
│   └── migrations/            # Database migrations
├── frontend/
│   ├── public/
│   ├── src/
│   │   ���── components/        # Reusable React components
│   │   ├── pages/            # Page components
│   │   ├── contexts/         # React Context providers
│   │   ├── services/         # API service functions
│   │   ├── styles/           # CSS stylesheets
│   │   └── utils/            # Utility functions
│   └── package.json
├── requirements.txt           # Python dependencies
├── run_migrations.py         # Database migration runner
└── README.md
```

### **Development Workflow**

1. **Create a new feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes and test:**
   ```bash
   # Backend tests
   python -m pytest tests/
   
   # Frontend tests
   cd frontend && npm test
   ```

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

4. **Create a pull request**

### **Code Style Guidelines**

#### **Backend (Python)**
- Follow PEP 8 style guidelines
- Use type hints for function parameters and return values
- Write docstrings for all functions and classes
- Use meaningful variable and function names

#### **Frontend (JavaScript/React)**
- Use functional components with hooks
- Follow React best practices
- Use meaningful component and variable names
- Keep components small and focused

## 📚 API Documentation

### **Authentication Endpoints**
```
POST   /auth/register          # Register new user
POST   /auth/login             # User login
POST   /auth/refresh           # Refresh access token
```

### **Algorithm Endpoints**
```
GET    /algorithms             # Get all algorithms
GET    /algorithms/{id}        # Get specific algorithm
GET    /algo-type              # Get algorithm types
```

### **User Profile Endpoints**
```
GET    /profile/me             # Get current user profile
PUT    /profile/update         # Update user profile
GET    /profile/stats          # Get user statistics
PUT    /profile/update-password # Update password
```

### **Blog Endpoints**
```
GET    /blogs                  # Get all blogs
POST   /blogs                  # Create new blog
GET    /blogs/{id}             # Get specific blog
PUT    /blogs/{id}             # Update blog
DELETE /blogs/{id}             # Delete blog
```

### **Progress Tracking**
```
GET    /progress               # Get user progress
POST   /progress               # Update progress
GET    /progress/stats         # Get detailed statistics
```

## 🎨 Frontend Features

### **Component Architecture**
- **Reusable Components** - Button, Modal, Card, etc.
- **Page Components** - Home, Algorithms, Profile, etc.
- **Layout Components** - Header, Footer, Sidebar
- **Context Providers** - Authentication, Theme, Search

### **State Management**
- **React Context** for global state (auth, theme)
- **Local State** with useState for component-specific data
- **Custom Hooks** for reusable stateful logic

### **Styling Approach**
- **CSS Modules** for component-specific styles
- **Global Styles** for consistent theming
- **Responsive Design** with mobile-first approach
- **Dark/Light Mode** support throughout the application

### **Key Features**
- **Algorithm Visualizer** - Interactive step-by-step visualizations
- **Code Editor** - Syntax-highlighted code examples
- **Progress Dashboard** - Visual progress tracking
- **Search & Filter** - Advanced search with multiple filters
- **Responsive Navigation** - Mobile-friendly navigation

## 🔐 Authentication

### **JWT Token System**
- **Access Tokens** - Short-lived tokens for API access
- **Refresh Tokens** - Long-lived tokens for token renewal
- **Secure Storage** - Tokens stored in httpOnly cookies (production)

### **User Roles**
- **Regular User** - Access to learning content and progress tracking
- **Admin** - Additional access to content management

### **Security Features**
- **Password Hashing** - bcrypt for secure password storage
- **CORS Protection** - Configured for frontend domain
- **Input Validation** - Pydantic schemas for request validation
- **Rate Limiting** - Protection against abuse

## 📊 Database Schema

### **Core Tables**
```sql
-- Users table
users (
    id INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    codeforces_handle VARCHAR,
    is_admin BOOLEAN DEFAULT FALSE,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Algorithms table
algorithms (
    id INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    difficulty VARCHAR,
    complexity VARCHAR,
    type_id INTEGER REFERENCES algo_types(id)
)

-- User Progress table
user_progress (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    algorithm_id INTEGER REFERENCES algorithms(id),
    status VARCHAR,
    completed_at DATETIME
)

-- Blogs table
blogs (
    id INTEGER PRIMARY KEY,
    title VARCHAR NOT NULL,
    body TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id),
    status VARCHAR DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### **Relationships**
- **One-to-Many**: User → Blogs, User → Progress
- **Many-to-One**: Algorithm → AlgorithmType
- **Many-to-Many**: User ↔ Algorithms (through UserProgress)

## 🧪 Testing

### **Backend Testing**
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run all tests
python -m pytest

# Run with coverage
python -m pytest --cov=.

# Run specific test file
python -m pytest tests/test_auth.py
```

### **Frontend Testing**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### **Test Structure**
```
tests/
├── backend/
│   ├── test_auth.py
│   ├── test_algorithms.py
│   ├── test_blogs.py
│   └── test_models.py
└── frontend/
    ├── components/
    ├── pages/
    └── utils/
```

## 🚀 Deployment

### **Production Setup**

#### **Backend Deployment**
```bash
# Install production dependencies
pip install gunicorn

# Run with Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker

# Or with Docker
docker build -t algoverse-backend .
docker run -p 8000:8000 algoverse-backend
```

#### **Frontend Deployment**
```bash
# Build for production
npm run build

# Serve with a static server
npm install -g serve
serve -s build -l 3000
```

### **Environment Variables (Production)**
```env
# Backend
SECRET_KEY=your-production-secret-key
DATABASE_URL=postgresql://user:pass@localhost/algoverse
ALLOWED_ORIGINS=https://yourdomain.com

# Frontend
REACT_APP_API_URL=https://api.yourdomain.com
```

### **Docker Deployment**
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///./algoverse.db
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Add tests** for new functionality
5. **Ensure all tests pass**
6. **Commit your changes** (`git commit -m 'Add amazing feature'`)
7. **Push to the branch** (`git push origin feature/amazing-feature`)
8. **Open a Pull Request**

### **Development Guidelines**
- Write clear, concise commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style
- Ensure all tests pass before submitting

### **Bug Reports**
When reporting bugs, please include:
- Steps to reproduce the issue
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (OS, browser, etc.)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **FastAPI** - For the excellent web framework
- **React** - For the powerful frontend library
- **Lucide** - For the beautiful icons
- **Contributors** - Thank you to all contributors who help improve AlgoVerse

## 📞 Support

- **Documentation**: [Wiki](https://github.com/yourusername/algoverse/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/algoverse/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/algoverse/discussions)
- **Email**: support@algoverse.com

---

**Made with ❤️ by the AlgoVerse Team**