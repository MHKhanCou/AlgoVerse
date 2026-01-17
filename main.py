from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from os import getenv
import models
from db import engine, get_db

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