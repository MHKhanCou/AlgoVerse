from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from models import User, AlgoDifficulty, AlgoComplexity, AlgoStatus
from schemas import ShowUser, UpdatePassword, UpdateEmail, Token, ShowBlog, ShowUserProgress
from db import get_db
from auth.oauth2 import get_current_user
from repositories import user_repo, user_progress_repo, blog_repo
from auth.jwt_token import create_access_token
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.get("/me", response_model=ShowUser)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return user_repo.get_user_by_id(db, current_user.id)
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching profile for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch profile")
    except Exception as e:
        logger.error(f"Unexpected error fetching profile for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/update-password", response_model=ShowUser)
def change_password(
    password_data: UpdatePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return user_repo.update_password(db, current_user.id, password_data)
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating password for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update password")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating password for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/update-email", response_model=Token)
def change_email(
    email_data: UpdateEmail,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        updated_user = user_repo.update_email(db, current_user.id, email_data)
        access_token = create_access_token(data={"sub": updated_user.email})
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating email for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update email")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating email for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/delete", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Delete all UserProgress records
        user_progress_repo.delete_by_user(db, current_user.id)
        # Delete all Blog records (assuming blog_repo has delete_by_user)
        blog_repo.delete_by_user(db, current_user.id)
        # Delete the user
        user_repo.delete_user(db, current_user.id)
        return None
    except HTTPException as e:
        db.rollback()
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error deleting profile for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete profile")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error deleting profile for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/my-blogs", response_model=List[ShowBlog])
def get_my_blogs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0, description="Number of blogs to skip"),
    limit: int = Query(5, ge=1, le=100, description="Number of blogs to return")
):
    try:
        return blog_repo.get_user_blogs(db, current_user.id, skip=skip, limit=limit)
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching blogs for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch blogs")
    except Exception as e:
        logger.error(f"Unexpected error fetching blogs for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/my-progress", response_model=List[ShowUserProgress])
def get_my_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return user_progress_repo.get_progress_by_userid(db, current_user.id)
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching progress for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch progress")
    except Exception as e:
        logger.error(f"Unexpected error fetching progress for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/stats", response_model=dict)
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return user_progress_repo.get_detailed_user_stats(db, current_user.id)
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching stats for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch stats")
    except Exception as e:
        logger.error(f"Unexpected error fetching stats for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")