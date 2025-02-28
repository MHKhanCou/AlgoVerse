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
def all(db: Session = Depends(get_db)):
    return user_repo.get_all(db)

# 🔹 Get user by ID
@router.get("/{id}", response_model=schemas.ShowUser)
def show(id: int, db: Session = Depends(get_db)):
    return user_repo.if_exists(db, id)

# 🔹 Register a new user
@router.post("/", response_model=schemas.ShowUser)
def register(request: schemas.RegisterUser, db: Session = Depends(get_db)):
    return user_repo.create(request, db)

# 🔹 Get user profile (includes progress)
@router.get("/{id}/profile", response_model=schemas.UserProfile)
def profile(id: int, db: Session = Depends(get_db)):
    return user_repo.get_profile(db, id)
