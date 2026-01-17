from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from os import getenv
from datetime import datetime

import logging
import time

from db import get_db, engine
import models
from routes import admin, authentication, profile, user, algo_types, algorithm, user_progress, blog, related_problems, comments, algorithm_comments, contests
from auth.oauth2 import get_current_user
from models import User

app = FastAPI()

# List of allowed origins - must be explicit when using credentials
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://algoverse.vercel.app",
    "https://algo-verse-eight.vercel.app",
    "https://algo-verse-git-main-mehedi-hasan-khans-projects.vercel.app",
    "https://algo-verse-a9e9uoryp-mehedi-hasan-khans-projects.vercel.app",
    "https://algo-verse-q7tt2blgw-mehedi-hasan-khans-projects.vercel.app",
    "https://algo-verse-scs5d79vc-mehedi-hasan-khans-projects.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]  # Important for file downloads
)

# Remove duplicate root endpoint
@app.get("/")
async def root():
    return {"message": "API is running"}

AUTO_CREATE_TABLES = getenv("AUTO_CREATE_TABLES", "true").lower() in ("1", "true", "yes", "y")
if AUTO_CREATE_TABLES:
    models.Base.metadata.create_all(bind=engine)

@app.get("/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"message": "✅ Database connection successful!"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/test-auth")
def test_auth(current_user: User = Depends(get_current_user)):
    return {
        "message": "✅ Authentication successful!",
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "is_admin": current_user.is_admin
        }
    }

app.include_router(authentication.router)
app.include_router(profile.router)
app.include_router(user.router)
app.include_router(algo_types.router)
app.include_router(algorithm.router)
app.include_router(user_progress.router)
app.include_router(admin.router)
app.include_router(blog.router)
app.include_router(related_problems.router)
app.include_router(comments.router)
app.include_router(algorithm_comments.router)
app.include_router(contests.router, prefix="/api")
# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and load balancers"""
    start_time = getattr(app, 'start_time', time.time())
    uptime = int(time.time() - start_time)
    
    # Check database connectivity
    db_status = "connected"
    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as e:
        db_status = f"error: {str(e)[:50]}"
        logging.error(f"Health check - DB error: {e}")
    
    # Check SMTP connectivity (non-blocking)
    smtp_status = "reachable"
    try:
        from auth.email_utils import SMTP_HOST, SMTP_PORT, DISABLE_EMAIL
        if DISABLE_EMAIL:
            smtp_status = "disabled"
        else:
            import smtplib
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=5)
            server.quit()
    except Exception as e:
        smtp_status = f"error: {str(e)[:50]}"
        logging.error(f"Health check - SMTP error: {e}")
    
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime_seconds": uptime,
        "database": db_status,
        "smtp": smtp_status,
        "version": "1.0.0"
    }

# Store app start time for uptime calculation
app.start_time = time.time()