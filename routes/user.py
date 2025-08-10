from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import schemas
from repositories import user_repo
from db import get_db  

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# 🔹 Get all users
@router.get("/", response_model=List[schemas.ShowUser])
def get_all_users(db: Session = Depends(get_db)):
    return user_repo.get_all_users(db)

# 🔹 Get user by ID
@router.get("/{user_id}", response_model=schemas.ShowUser)
def get_user(user_id: int, db: Session = Depends(get_db)):
    return user_repo.get_user_by_id(db, user_id)

# 🔹 Register a new user
@router.post("/", response_model=schemas.ShowUser, status_code=status.HTTP_201_CREATED)
def create_user(request: schemas.RegisterUser, db: Session = Depends(get_db)):
    return user_repo.create_user(db, request)

# 🔹 Get user profile (includes progress)
@router.get("/{user_id}/profile", response_model=schemas.UserProfile)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    return user_repo.get_user_profile(db, user_id)

# 🔹 Public user profile (no auth) – limited, non-sensitive data
@router.get("/{user_id}/public", response_model=schemas.PublicUserProfile)
def get_public_user_profile(user_id: int, db: Session = Depends(get_db)):
    return user_repo.get_public_user_profile(db, user_id)

