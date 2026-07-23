

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware import Middleware
from starlette.middleware.errors import ServerErrorMiddleware

import time

from .db import engine
from . import models
from .routes import admin, authentication, profile, user, algo_types, algorithm, user_progress, blog, related_problems, comments, algorithm_comments, contests
from .middleware.rate_limit import limiter
from .core.config import settings

app = FastAPI()

# Rate limiting
app.state.limiter = limiter
app.add_middleware(ServerErrorMiddleware)

# CORS origins from settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]  # Important for file downloads
)

# Remove duplicate root endpoint
@app.get("/")
async def root():
    return {"message": "API is running"}

if settings.AUTO_CREATE_TABLES:
    models.Base.metadata.create_all(bind=engine)

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
    
    return {
        "status": "ok",
        "uptime_seconds": uptime,
        "version": "1.0.0"
    }

# Store app start time for uptime calculation
app.start_time = time.time()
