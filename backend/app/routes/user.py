from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List
from .. import schemas
from ..models import User
from ..repositories import user_repo
from ..db import get_db
from ..middleware.admin_dependencies import get_current_admin
from ..middleware.rate_limit import limiter

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# 🔹 Get all users
# Anonymous. Returns a public projection: no email, no is_admin.
@router.get("/", response_model=List[schemas.PublicUser])
def get_all_users(db: Session = Depends(get_db)):
    return user_repo.get_all_users(db)

# 🔹 Get user by ID
@router.get("/{user_id}", response_model=schemas.PublicUser)
def get_user(user_id: int, db: Session = Depends(get_db)):
    return user_repo.get_user_by_id(db, user_id)

# 🔹 Create a user directly (no OTP mail).
# Admin-only: this bypasses /register's 3/minute limit and its verification
# email, so leaving it anonymous gave anyone an unlimited, unverified account
# factory next to the rate-limited registration endpoint.
@router.post(
    "/",
    response_model=schemas.PublicUser,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("10/minute")
def create_user(
    request: Request,
    user_data: schemas.RegisterUser,
    db: Session = Depends(get_db),
    _current_admin: User = Depends(get_current_admin),
):
    return user_repo.create_user(db, user_data)

# 🔹 Get user profile (includes progress)
@router.get("/{user_id}/profile", response_model=schemas.PublicUserWithProgress)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    return user_repo.get_user_profile(db, user_id)

# 🔹 Public user profile (no auth) – limited, non-sensitive data
@router.get("/{user_id}/public", response_model=schemas.PublicUserProfile)
def get_public_user_profile(user_id: int, db: Session = Depends(get_db)):
    return user_repo.get_public_user_profile(db, user_id)

