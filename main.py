from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import models
from db import engine, get_db

from routes import admin, authentication, profile, user, algo_types, algorithm, user_progress, blog

app = FastAPI()

models.Base.metadata.create_all(bind=engine)

# Root endpoint and DB test
@app.get("/")
def read_root():
    return {"message": "🚀 FastAPI is running with SQLite!"}

@app.get("/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"message": "✅ Database connection successful!"}
    except Exception as e:
        return {"error": str(e)}

app.include_router(admin.router)
app.include_router(authentication.router)
app.include_router(profile.router)
app.include_router(user.router)
app.include_router(algo_types.router)
app.include_router(algorithm.router)
app.include_router(user_progress.router)
app.include_router(blog.router)

