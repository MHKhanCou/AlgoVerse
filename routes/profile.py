from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, database
from auth import getCurrentUser
from repo.userProgress_repo import get_user_completion_stats, get_last_accessed_algorithm, get_user_progress_by_userid
from repo.user_repo import get_user_by_email


router = APIRouter(prefix="/profile", tags=["Profile"])

@router.get("/", response_model=schemas.UserProfile)
def get_profile(db: Session = Depends(database.get_db), current_user: models.User = Depends(getCurrentUser)):
    
    last_accessed_algo = get_last_accessed_algorithm(db, current_user.id)
    user_progress = get_user_progress_by_userid(db, current_user.id)
    stats = get_user_completion_stats(db, current_user.id)

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "last_accessed_algorithm": last_accessed_algorithm.algorithm.name if last_accessed_algorithm else None,
        "progress": [{"algorithm": p.algorithm.name, "status": p.status.value} for p in user_progress],
        "completion_stats": stats,
    }

@router.put("/update", response_model=schemas.UserProfile)
def update_profile(
    updated_data: schemas.UserUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(getCurrentUser),
):
    # Check if email already exists
    if updated_data.email and updated_data.email != current_user.email:
        existing_user = get_user_by_email(db, updated_data.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already taken")

    # Update fields
    if updated_data.name:
        current_user.name = updated_data.name
    if updated_data.email:
        current_user.email = updated_data.email
    if updated_data.password:
        current_user.password = updated_data.password  # Hash password before storing

    db.commit()
    db.refresh(current_user)

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
    }
