# AlgoVerse Production Rules & Standards

## Environment Configuration Standards

### Environment-Based Configuration
All configuration must be environment-aware with clear separation between development and production.

#### Required Environment Variables
```bash
# Core Environment
ENVIRONMENT=development|production

# Database Configuration
# Development (SQLite)
DATABASE_URL=sqlite:///./algoverse.db

# Production (PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database_name

# API Configuration
VITE_API_BASE_URL=http://localhost:8000                    # Development
VITE_API_BASE_URL=https://your-backend.onrender.com           # Production

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:8000     # Development
CORS_ORIGINS=https://yourdomain.vercel.app                   # Production
```

### 🎯 **Environment Detection Logic**
```javascript
// Frontend - Vite
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Backend - Python
import os
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
IS_PRODUCTION = ENVIRONMENT == 'production'
```

## 🔐 **Centralized API System Rules**

### ✅ **Mandatory Standards**
All API calls MUST use the centralized `api` service from `frontend/src/services/api.js`.

#### **❌ FORBIDDEN PATTERNS**
```javascript
// ❌ NEVER do this - Direct axios calls
import axios from 'axios';
axios.get('/api/users');  // FORBIDDEN

// ❌ NEVER do this - Hardcoded URLs
fetch('http://localhost:8000/api/users');  // FORBIDDEN

// ❌ NEVER do this - Manual token handling
const token = localStorage.getItem('token');
axios.get('/api/users', {
  headers: { Authorization: `Bearer ${token}` }  // FORBIDDEN
```

#### **✅ REQUIRED PATTERNS**
```javascript
// ✅ ALWAYS do this - Use centralized API
import api from './services/api';
api.get('/users');  // CORRECT

// ✅ ALWAYS do this - Let api handle tokens automatically
api.get('/protected-endpoint');  // CORRECT - Token injected automatically

// ✅ ALWAYS do this - Use environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;  // CORRECT
```

### 📁 **Service Layer Standards**
```javascript
// ✅ CORRECT - Service structure
import api from './api';

export const userService = {
  async getUser() {
    const response = await api.get('/users/me');
    return response.data;
  }
};

// ❌ INCORRECT - Mixed patterns
import api from './api';
import axios from 'axios';

export const mixedService = {
  async getUser() {
    return axios.get('/users/me');  // INCONSISTENT
  },
  
  async getPosts() {
    return api.get('/posts');     // INCONSISTENT
  }
};
```

## 🌐 **Deployment Standards**

### 📦 **Frontend Deployment (Vercel)**
```json
// package.json - Production dependencies
{
  "name": "algoverse-frontend",
  "version": "1.3.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "vercel --prod"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.8.0"
  }
}

// vite.config.js - Production build
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: true
      }
    }
  },
  server: {
    port: 5173,
    host: true
  }
});
```

### 🗄️ **Backend Deployment (Render)**
```python
# requirements.txt - Production dependencies
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.7
python-multipart==0.0.6

# Dockerfile - Production container
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🔒 **Security Standards**

### 🛡️ **Authentication & Authorization**
```python
# ✅ CORRECT - JWT Configuration
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
JWT_ALGORITHM=HS256
JWT_SECRET_KEY=your-strong-secret-key-here

# ✅ CORRECT - Password Hashing
BCRYPT_ROUNDS=12

# ✅ CORRECT - CORS Configuration
CORS_ORIGINS=["https://yourdomain.vercel.app"]
CORS_ALLOW_CREDENTIALS=True
```

### 🔍 **Input Validation & Sanitization**
```python
# ✅ ALWAYS validate and sanitize input
from pydantic import BaseModel, EmailStr, validator

class UserCreate(BaseModel):
    email: EmailStr
    password: str(min_length=8)
    name: str(strip_whitespace=True, min_length=2)

# ✅ NEVER trust user input directly
def create_user(user_data: dict):
    # ✅ CORRECT - Validate with Pydantic
    validated_data = UserCreate(**user_data)
    
    # ❌ NEVER do this - Direct database insertion
    # db.execute("INSERT INTO users VALUES (?)", user_data.values())
```

## 📊 **Database Standards**

### 🗄️ **Environment-Specific Databases**
```bash
# ✅ Development - SQLite (local)
DATABASE_URL=sqlite:///./algoverse.db

# ✅ Production - PostgreSQL (cloud)
DATABASE_URL=postgresql://user:password@host:port/database
```

### 🔄 **Migration Standards**
```python
# ✅ ALWAYS use Alembic for schema changes
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('users', sa.Column('new_field', sa.String()))

def downgrade():
    op.drop_column('users', 'new_field')

# ❌ NEVER use custom migration scripts
# def custom_migration():
#     conn = sqlite3.connect('db.sqlite')
#     conn.execute("ALTER TABLE users ADD COLUMN new_field TEXT")
```

## 📝 **Code Quality Standards**

### 🏗️ **File Structure**
```
AlgoVerse/
├── backend/
│   ├── app/
│   │   ├── routes/          # API endpoints
│   │   ├── repositories/     # Data access layer
│   │   ├── services/        # Business logic
│   │   ├── models.py         # Database models
│   │   ├── schemas.py        # Request/response models
│   │   └── auth/            # Authentication
│   ├── alembic_migrations/     # Schema migrations
│   ├── requirements.txt         # Dependencies
│   └── .env                 # Environment variables
└── frontend/
    ├── src/
    │   ├── services/           # API services (centralized)
    │   ├── components/         # React components
    │   ├── pages/              # Page components
    │   ├── contexts/           # React contexts
    │   └── utils/              # Utility functions
    ├── package.json
    ├── vite.config.js
    └── .env                  # Environment variables
```

### 🧪 **Import Standards**
```python
# ✅ CORRECT - Relative imports
from .models import User
from .schemas import UserCreate
from .repositories import UserRepository

# ❌ INCORRECT - Absolute imports
from backend.app.models import User
from backend.app.schemas import UserCreate
```

## 🚨 **Common Pitfalls to Avoid**

### ❌ **NEVER Do These**
1. **Hardcoded URLs**: Always use environment variables
2. **Manual Token Handling**: Use centralized API interceptors
3. **Direct Database Access**: Always use repository pattern
4. **Mixed API Clients**: Use only the centralized api service
5. **Environment Mixing**: Never use production secrets in development
6. **CORS Misconfiguration**: Always specify exact allowed origins

### ✅ **ALWAYS Do These**
1. **Environment Variables**: Use different configs for dev/prod
2. **Centralized API**: All calls through api.js service
3. **Input Validation**: Use Pydantic models for all input
4. **Error Handling**: Consistent error responses across all endpoints
5. **Security Headers**: Proper CORS and security headers
6. **Database Migrations**: Use Alembic for all schema changes

## 📋 **Checklist for Compliance**

### Pre-Deployment Checklist
- [ ] Environment variables properly set
- [ ] Centralized API implemented everywhere
- [ ] No hardcoded URLs or secrets
- [ ] Proper error handling implemented
- [ ] Security best practices followed
- [ ] Database migrations using Alembic
- [ ] CORS configured correctly
- [ ] Production build optimized

### Post-Deployment Verification
- [ ] All endpoints responding correctly
- [ ] Authentication flow working
- [ ] Database connections stable
- [ ] No console errors in production
- [ ] Security headers properly configured

---

**🎯 RULE: If it's not in this document, it's not allowed in production!**

*Last Updated: January 19, 2026*
*Version: 1.0*
