

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

import time

from .db import engine, get_db
from . import models
from .routes import admin, authentication, profile, user, algo_types, algorithm, user_progress, blog, related_problems, comments, algorithm_comments, contests
from .middleware.rate_limit import limiter
from .middleware.security_headers import SecurityHeadersMiddleware
from .core.config import settings

# Fails the boot rather than starting a production deployment that would sign
# tokens with an empty key. See Settings.validate_for_production.
settings.validate_for_production()

app = FastAPI()

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security headers live in their own middleware. ServerErrorMiddleware is NOT
# added here: FastAPI already installs one when it builds the middleware stack,
# so the previous add_middleware() call only registered a second no-op copy.
app.add_middleware(SecurityHeadersMiddleware)

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

if settings.auto_create_tables:
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
def health_check(db: Session = Depends(get_db)):
    """Readiness probe: answer 200 only when the database is reachable.

    A liveness-only response lets a load balancer keep sending traffic to an
    instance that cannot serve it, so this actually queries the database.
    """
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        raise HTTPException(status_code=503, detail="database unavailable")

    start_time = getattr(app, 'start_time', time.time())
    uptime = int(time.time() - start_time)
    
    return {
        "status": "ok",
        "uptime_seconds": uptime,
        "version": "1.0.0"
    }

# Store app start time for uptime calculation
app.start_time = time.time()
