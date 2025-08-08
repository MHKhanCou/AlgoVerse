# 🚀 AlgoVerse Setup Guide

> **Complete step-by-step guide to set up AlgoVerse on your local machine**

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Configuration](#configuration)
5. [Database Setup](#database-setup)
6. [Running the Application](#running-the-application)
7. [Development Workflow](#development-workflow)
8. [Troubleshooting](#troubleshooting)
9. [Production Deployment](#production-deployment)

## 🔧 Prerequisites

### **System Requirements**
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: At least 2GB free space
- **Internet**: Required for package downloads and API integrations

### **Required Software**

#### **1. Python 3.8+**
```bash
# Check Python version
python --version
# or
python3 --version

# If not installed, download from: https://python.org/downloads/
```

#### **2. Node.js 16+**
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# If not installed, download from: https://nodejs.org/
```

#### **3. Git**
```bash
# Check Git version
git --version

# If not installed, download from: https://git-scm.com/
```

#### **4. Code Editor (Recommended)**
- **VS Code**: https://code.visualstudio.com/
- **PyCharm**: https://jetbrains.com/pycharm/
- **WebStorm**: https://jetbrains.com/webstorm/

### **Optional Tools**
- **Postman**: For API testing - https://postman.com/
- **DB Browser for SQLite**: For database inspection - https://sqlitebrowser.org/

## ⚡ Quick Start

### **1. Clone Repository**
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

# Run migrations
python run_migrations.py

# Start backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### **3. Frontend Setup**
```bash
# Open new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start frontend server
npm start
```

### **4. Access Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📖 Detailed Setup

### **Step 1: Environment Preparation**

#### **Windows Setup**
```powershell
# Install Python (if not installed)
# Download from https://python.org/downloads/
# Make sure to check "Add Python to PATH"

# Install Node.js (if not installed)
# Download from https://nodejs.org/

# Verify installations
python --version
node --version
npm --version
git --version
```

#### **macOS Setup**
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python
brew install python

# Install Node.js
brew install node

# Install Git
brew install git

# Verify installations
python3 --version
node --version
npm --version
git --version
```

#### **Linux (Ubuntu) Setup**
```bash
# Update package list
sudo apt update

# Install Python
sudo apt install python3 python3-pip python3-venv

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt install git

# Verify installations
python3 --version
node --version
npm --version
git --version
```

### **Step 2: Project Setup**

#### **Clone and Navigate**
```bash
# Clone the repository
git clone https://github.com/yourusername/algoverse.git

# Navigate to project directory
cd algoverse

# Check project structure
ls -la
```

#### **Project Structure Overview**
```
algoverse/
├── backend/
│   ├── main.py              # FastAPI application entry
│   ├── models.py            # Database models
│   ├── schemas.py           # Pydantic schemas
│   ├── routes/              # API route handlers
│   ├── repositories/        # Data access layer
│   ├── auth/               # Authentication logic
│   └── migrations/         # Database migrations
├── frontend/
│   ├── public/             # Static files
│   ├── src/                # React source code
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API services
│   │   └── styles/        # CSS files
│   └── package.json       # Node.js dependencies
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
├── run_migrations.py      # Database migration script
└── README.md             # Project documentation
```

### **Step 3: Backend Configuration**

#### **Create Virtual Environment**
```bash
# Create virtual environment
python -m venv myenv

# Activate virtual environment
# Windows Command Prompt:
myenv\Scripts\activate.bat

# Windows PowerShell:
myenv\Scripts\Activate.ps1

# macOS/Linux:
source myenv/bin/activate

# Verify activation (should show (myenv) in prompt)
which python  # Should point to myenv/bin/python
```

#### **Install Python Dependencies**
```bash
# Upgrade pip
python -m pip install --upgrade pip

# Install requirements
pip install -r requirements.txt

# Verify installation
pip list
```

#### **Environment Variables Setup**
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your preferred editor
# Windows:
notepad .env
# macOS:
open -e .env
# Linux:
nano .env
```

#### **.env Configuration**
```env
# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM_TIMEOUT=30

# Database
DATABASE_URL=sqlite:///./algoverse.db

# CORS (for development)
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# JWT Configuration
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Optional: External API Keys
CODEFORCES_API_KEY=your-api-key-if-needed
```

#### **Database Initialization**
```bash
# Run database migrations
python run_migrations.py

# Verify database creation
ls -la *.db  # Should show algoverse.db

# Optional: Seed with sample data
python -c "
from db import engine, SessionLocal
from models import Base, User, Algorithm, AlgoType
from auth.password_utils import hash_password

# Create tables
Base.metadata.create_all(bind=engine)

# Add sample data
db = SessionLocal()
try:
    # Add sample algorithm type
    algo_type = AlgoType(name='Sorting', description='Sorting algorithms')
    db.add(algo_type)
    db.commit()
    
    # Add sample algorithm
    algorithm = Algorithm(
        name='Bubble Sort',
        description='Simple sorting algorithm',
        difficulty='easy',
        complexity='O(n²)',
        type_id=algo_type.id
    )
    db.add(algorithm)
    db.commit()
    
    print('Sample data added successfully!')
except Exception as e:
    print(f'Error: {e}')
    db.rollback()
finally:
    db.close()
"
```

### **Step 4: Frontend Configuration**

#### **Navigate to Frontend Directory**
```bash
cd frontend
```

#### **Install Node.js Dependencies**
```bash
# Install dependencies
npm install

# Alternative: Use yarn if preferred
# npm install -g yarn
# yarn install

# Verify installation
npm list --depth=0
```

#### **Frontend Environment Variables**
```bash
# Create frontend .env file
touch .env  # Linux/macOS
# or create manually on Windows

# Add configuration
echo "REACT_APP_API_URL=http://localhost:8000" >> .env
echo "REACT_APP_CODEFORCES_API=https://codeforces.com/api" >> .env
```

#### **Frontend .env Configuration**
```env
# API Configuration
REACT_APP_API_URL=http://localhost:8000
REACT_APP_CODEFORCES_API=https://codeforces.com/api

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_DARK_MODE=true

# Development Settings
REACT_APP_DEBUG=true
GENERATE_SOURCEMAP=true
```

## ⚙️ Configuration

### **Backend Configuration Details**

#### **Database Configuration**
```python
# db.py configuration
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./algoverse.db")

# For PostgreSQL (production):
# SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/algoverse"

# For MySQL (alternative):
# SQLALCHEMY_DATABASE_URL = "mysql+pymysql://user:password@localhost/algoverse"
```

#### **CORS Configuration**
```python
# main.py CORS setup
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### **JWT Configuration**
```python
# auth/jwt_token.py
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
```

### **Frontend Configuration Details**

#### **API Service Configuration**
```javascript
// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

#### **Theme Configuration**
```javascript
// src/contexts/ThemeContext.js
const ThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newValue));
      return newValue;
    });
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

## 🗄️ Database Setup

### **SQLite Setup (Default)**
```bash
# SQLite is included with Python, no additional setup needed
# Database file will be created automatically

# To inspect database:
# Install DB Browser for SQLite: https://sqlitebrowser.org/
# Or use command line:
sqlite3 algoverse.db
.tables
.schema users
.quit
```

### **PostgreSQL Setup (Production)**
```bash
# Install PostgreSQL
# Ubuntu:
sudo apt install postgresql postgresql-contrib

# macOS:
brew install postgresql

# Windows: Download from https://postgresql.org/

# Create database
sudo -u postgres createdb algoverse

# Create user
sudo -u postgres createuser --interactive algoverse_user

# Update .env file
DATABASE_URL=postgresql://algoverse_user:password@localhost/algoverse

# Install Python PostgreSQL adapter
pip install psycopg2-binary
```

### **Database Migration**
```bash
# Run migrations
python run_migrations.py

# Check migration status
python -c "
import sqlite3
conn = sqlite3.connect('algoverse.db')
cursor = conn.cursor()
cursor.execute('SELECT name FROM sqlite_master WHERE type=\"table\";')
tables = cursor.fetchall()
print('Tables:', [table[0] for table in tables])
conn.close()
"
```

## 🏃 Running the Application

### **Development Mode**

#### **Terminal 1: Backend Server**
```bash
# Navigate to project root
cd algoverse

# Activate virtual environment
# Windows:
myenv\Scripts\activate
# macOS/Linux:
source myenv/bin/activate

# Start backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Server should start with output:
# INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
# INFO:     Started reloader process
# INFO:     Started server process
# INFO:     Waiting for application startup.
# INFO:     Application startup complete.
```

#### **Terminal 2: Frontend Server**
```bash
# Navigate to frontend directory
cd algoverse/frontend

# Start frontend server
npm start

# Server should start with output:
# Compiled successfully!
# You can now view algoverse in the browser.
# Local:            http://localhost:3000
# On Your Network:  http://192.168.1.x:3000
```

### **Verification Steps**

#### **1. Backend Health Check**
```bash
# Test API endpoint
curl http://localhost:8000/

# Expected response:
# {"message": "Welcome to AlgoVerse API"}

# Test API documentation
# Open browser: http://localhost:8000/docs
```

#### **2. Frontend Health Check**
```bash
# Open browser: http://localhost:3000
# You should see the AlgoVerse homepage

# Check console for errors (F12 in browser)
# No errors should be present
```

#### **3. Database Connection Test**
```bash
# Test database connection
python -c "
from db import SessionLocal
from models import User

db = SessionLocal()
try:
    count = db.query(User).count()
    print(f'Database connected successfully. User count: {count}')
except Exception as e:
    print(f'Database connection failed: {e}')
finally:
    db.close()
"
```

### **Production Mode**

#### **Backend Production Setup**
```bash
# Install production server
pip install gunicorn

# Run with Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Or with environment variables
export SECRET_KEY="your-production-secret-key"
export DATABASE_URL="postgresql://user:pass@localhost/algoverse"
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### **Frontend Production Build**
```bash
# Build for production
npm run build

# Serve with static server
npm install -g serve
serve -s build -l 3000

# Or with nginx (recommended)
# Copy build files to nginx web root
sudo cp -r build/* /var/www/html/
```

## 🔄 Development Workflow

### **Daily Development Routine**

#### **1. Start Development Session**
```bash
# Pull latest changes
git pull origin main

# Activate virtual environment
source myenv/bin/activate  # or myenv\Scripts\activate on Windows

# Update dependencies if needed
pip install -r requirements.txt
cd frontend && npm install && cd ..

# Start servers (in separate terminals)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
cd frontend && npm start
```

#### **2. Making Changes**
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes...

# Test changes
python -m pytest  # Backend tests
cd frontend && npm test  # Frontend tests

# Commit changes
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

#### **3. Code Quality Checks**
```bash
# Backend code formatting
pip install black flake8
black .
flake8 .

# Frontend code formatting
cd frontend
npm install --save-dev prettier eslint
npm run lint
npm run format
```

### **Testing**

#### **Backend Testing**
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
python -m pytest

# Run with coverage
pip install pytest-cov
python -m pytest --cov=.

# Run specific test file
python -m pytest tests/test_auth.py -v
```

#### **Frontend Testing**
```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage --watchAll=false
```

### **Database Management**

#### **Creating Migrations**
```bash
# Create new migration
python -c "
import os
from datetime import datetime

migration_name = input('Migration name: ')
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
filename = f'migrations/{timestamp}_{migration_name}.py'

template = '''\"\"\"
Migration: {migration_name}
Date: {date}
Description: Add description here
\"\"\"

import sqlite3
from pathlib import Path

def run_migration():
    \"\"\"Run the migration\"\"\"
    db_path = Path(__file__).parent.parent / 'algoverse.db'
    
    if not db_path.exists():
        print(f'Database not found at {{db_path}}')
        return False
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Add your migration SQL here
        # cursor.execute('ALTER TABLE users ADD COLUMN new_field TEXT')
        
        conn.commit()
        print('Migration completed successfully!')
        return True
        
    except Exception as e:
        print(f'Migration failed: {{e}}')
        return False
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    run_migration()
'''.format(
    migration_name=migration_name,
    date=datetime.now().strftime('%Y-%m-%d')
)

os.makedirs('migrations', exist_ok=True)
with open(filename, 'w') as f:
    f.write(template)

print(f'Migration created: {filename}')
"
```

#### **Running Migrations**
```bash
# Run all migrations
python run_migrations.py

# Run specific migration
python migrations/20240101_120000_add_user_field.py
```

## 🔧 Troubleshooting

### **Common Issues and Solutions**

#### **1. Port Already in Use**
```bash
# Error: Port 8000 is already in use
# Solution: Kill process using the port

# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:8000 | xargs kill -9

# Or use different port:
uvicorn main:app --reload --port 8001
```

#### **2. Module Not Found Errors**
```bash
# Error: ModuleNotFoundError: No module named 'fastapi'
# Solution: Ensure virtual environment is activated and dependencies installed

# Check if virtual environment is active
which python  # Should point to myenv/bin/python

# If not active, activate it:
source myenv/bin/activate  # macOS/Linux
myenv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

#### **3. Database Connection Issues**
```bash
# Error: sqlite3.OperationalError: no such table: users
# Solution: Run database migrations

python run_migrations.py

# If still failing, recreate database:
rm algoverse.db
python run_migrations.py
```

#### **4. CORS Issues**
```bash
# Error: CORS policy blocking requests
# Solution: Check CORS configuration in main.py

# Ensure frontend URL is in allowed origins:
allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"]

# For development, you can temporarily allow all origins:
allow_origins=["*"]  # NOT for production!
```

#### **5. Frontend Build Issues**
```bash
# Error: npm ERR! code ELIFECYCLE
# Solution: Clear npm cache and reinstall

cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### **6. Python Virtual Environment Issues**
```bash
# Error: Virtual environment not working
# Solution: Recreate virtual environment

# Remove existing environment
rm -rf myenv

# Create new environment
python -m venv myenv

# Activate and install dependencies
source myenv/bin/activate  # macOS/Linux
myenv\Scripts\activate     # Windows
pip install -r requirements.txt
```

### **Debug Mode**

#### **Backend Debug Mode**
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG  # Linux/macOS
set LOG_LEVEL=DEBUG     # Windows

# Run with debug
uvicorn main:app --reload --log-level debug
```

#### **Frontend Debug Mode**
```bash
# Enable React debug mode
export REACT_APP_DEBUG=true  # Linux/macOS
set REACT_APP_DEBUG=true     # Windows

# Start with debug
npm start
```

### **Performance Issues**

#### **Backend Performance**
```bash
# Monitor API response times
# Add timing middleware to main.py

import time
from fastapi import Request

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response
```

#### **Frontend Performance**
```bash
# Analyze bundle size
cd frontend
npm run build
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer build/static/js/*.js
```

## 🚀 Production Deployment

### **Environment Preparation**

#### **Server Requirements**
- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB recommended)
- **Storage**: 20GB+ SSD
- **OS**: Ubuntu 20.04 LTS (recommended)

#### **Server Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3 python3-pip python3-venv nodejs npm nginx postgresql postgresql-contrib

# Install PM2 for process management
sudo npm install -g pm2

# Create application user
sudo useradd -m -s /bin/bash algoverse
sudo usermod -aG sudo algoverse
```

### **Application Deployment**

#### **1. Clone and Setup**
```bash
# Switch to application user
sudo su - algoverse

# Clone repository
git clone https://github.com/yourusername/algoverse.git
cd algoverse

# Setup backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Setup frontend
cd frontend
npm install
npm run build
cd ..
```

#### **2. Database Setup**
```bash
# Create PostgreSQL database
sudo -u postgres createdb algoverse
sudo -u postgres createuser algoverse_user
sudo -u postgres psql -c "ALTER USER algoverse_user WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE algoverse TO algoverse_user;"

# Update environment variables
cat > .env << EOF
SECRET_KEY=your-super-secure-production-key
DATABASE_URL=postgresql://algoverse_user:secure_password@localhost/algoverse
ALLOWED_ORIGINS=https://yourdomain.com
ACCESS_TOKEN_EXPIRE_MINUTES=30
EOF

# Run migrations
python run_migrations.py
```

#### **3. Process Management**
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'algoverse-api',
    script: 'venv/bin/gunicorn',
    args: 'main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000',
    cwd: '/home/algoverse/algoverse',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### **4. Nginx Configuration**
```bash
# Create nginx configuration
sudo tee /etc/nginx/sites-available/algoverse << EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        root /home/algoverse/algoverse/frontend/build;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files
    location /static/ {
        root /home/algoverse/algoverse/frontend/build;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/algoverse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### **5. SSL Certificate**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### **Monitoring and Maintenance**

#### **Application Monitoring**
```bash
# Check application status
pm2 status
pm2 logs algoverse-api

# Monitor system resources
htop
df -h
free -h

# Check nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

#### **Database Backup**
```bash
# Create backup script
cat > backup.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
pg_dump -U algoverse_user -h localhost algoverse > backup_\$DATE.sql
# Keep only last 7 days of backups
find . -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x backup.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /home/algoverse/algoverse/backup.sh
```

#### **Log Rotation**
```bash
# Configure log rotation
sudo tee /etc/logrotate.d/algoverse << EOF
/home/algoverse/.pm2/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 0644 algoverse algoverse
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

## 🎉 Conclusion

You now have a complete AlgoVerse setup! Here's what you've accomplished:

✅ **Development Environment**: Fully configured local development setup  
✅ **Database**: SQLite for development, PostgreSQL for production  
✅ **API Server**: FastAPI backend with authentication and CORS  
✅ **Frontend**: React application with modern tooling  
✅ **Production Ready**: Deployment configuration with nginx and PM2  

### **Next Steps**
1. **Explore the Application**: Navigate through different features
2. **Read the Documentation**: Check out the API docs at `/docs`
3. **Customize**: Modify the application to fit your needs
4. **Contribute**: Submit issues and pull requests
5. **Deploy**: Use the production guide to deploy your instance

### **Getting Help**
- **Documentation**: Check README.md and SYSTEM_ANALYSIS.md
- **Issues**: Report bugs on GitHub Issues
- **Community**: Join discussions on GitHub Discussions
- **Support**: Contact the development team

**Happy coding! 🚀**