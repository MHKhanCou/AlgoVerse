from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, schemas
from db import get_db
from auth.oauth2 import get_current_user
from repositories.user_progress_repo import get_last_accessed_algorithm, get_entry, get_user_completion_stats
from repositories.user_repo import (
    get_by_email,
    update_password,
    update_email,
    update
)
from typing import List

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.get("/", response_model=schemas.UserProfile)
def get_profile(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        last_accessed_data = get_last_accessed_algorithm(db, current_user.id)
        user_progress = get_entry(db, current_user.id)
        stats = get_user_completion_stats(db, current_user.id)

        return {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "last_accessed_algorithm": last_accessed_data["algorithm"].name if last_accessed_data else None,
            "progress": [{"algorithm": p.algorithm.name, "status": p.status.value} for p in user_progress],
            "completion_stats": stats,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/update", response_model=schemas.UserProfile)
def update_profile(
    updated_data: schemas.UpdateUser,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return update(db, current_user.id, updated_data.name, updated_data.email)

# 🔹 Change Password
@router.put("/update-password", response_model=dict)
def update_password(
    updated_data: schemas.UpdatePassword,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        return update_password(db, current_user.id, updated_data.old_password, updated_data.new_password)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 🔹 Change Email
@router.put("/update-email", response_model=dict)
def update_email(
    updated_data: schemas.UpdateEmail,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        return update_email(db, current_user.id, updated_data.email)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# delete user
@router.delete("/delete", response_model=dict)
def delete_user(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        db.query(models.User).filter(models.User.id == current_user.id).delete()
        db.commit()
        return {"message": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# my blogs
@router.get("/my-blogs", response_model=List[schemas.ShowBlog])
def get_my_blogs(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return blog_repo.get_my_blogs(db, current_user.id)


@router.get("/my-progress", response_model=List[schemas.ShowUserProgress])
def get_my_progress(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return user_progress_repo.get_my_progress(db, current_user.id)