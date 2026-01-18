from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..models import User, UserProgress
from ..schemas import ShowUserProgress, AddUserProgress, UpdateUserProgress
from ..db import get_db
from ..repositories.user_repo import if_exists
from ..repositories.algo_repo import get_algorithm_by_id
from ..auth.oauth2 import get_current_user
from datetime import datetime
from ..repositories.user_progress_repo import (
    get_all,
    create,
    update,
    get_by_id,
    get_progress_by_userid,
    get_entry,
    get_last_accessed_algorithm,
    get_user_completion_stats,
    get_detailed_user_stats,
    delete,
    get_batch_progress as get_batch_progress_repo
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/user_progress", tags=["User Progress"])

@router.get("/", response_model=List[ShowUserProgress])
def get_all_user_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all progress for the current user (not admin-level access).
    """
    try:
        return get_progress_by_userid(db, current_user.id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user progress for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/", response_model=ShowUserProgress, status_code=status.HTTP_201_CREATED)
def create_progress(
    request: AddUserProgress,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Validate algo_id
        if not get_algorithm_by_id(db, request.algo_id):
            raise HTTPException(status_code=404, detail="Algorithm not found")
        
        # Check if progress already exists
        existing_progress = get_entry(db, current_user.id, request.algo_id)
        if existing_progress:
            raise HTTPException(status_code=400, detail="Progress already exists for this algorithm")
            
        # Set user_id from current_user
        progress_data = AddUserProgress(
            user_id=current_user.id,
            algo_id=request.algo_id,
            status=request.status
        )
        return create(db, progress_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating progress for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/{progress_id}", response_model=ShowUserProgress)
def update_progress(
    progress_id: int,
    request: UpdateUserProgress,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        progress = get_by_id(db, progress_id)
        if progress.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this progress")
        if request.status == "completed":
            request.finished_at = datetime.utcnow()  # Set finished_at timestamp
        return update(db, progress_id, request)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating progress {progress_id} for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/user", response_model=List[ShowUserProgress])
def get_user_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return get_progress_by_userid(db, current_user.id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching progress for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/user/{user_id}", response_model=List[ShowUserProgress])
def get_user_progress_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        if not if_exists(db, user_id):
            raise HTTPException(status_code=404, detail=f"User with id {user_id} not found")
        return get_progress_by_userid(db, user_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching progress for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/entry/{algo_id}", response_model=ShowUserProgress)
def get_progress_entry(
    algo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        progress = get_entry(db, current_user.id, algo_id)
        if not progress:
            raise HTTPException(status_code=404, detail="Progress entry not found")
        return progress
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching progress entry for user {current_user.id}, algo {algo_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/last-accessed", response_model=dict)
def get_last_accessed(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        progress = get_last_accessed_algorithm(db, current_user.id)
        if not progress:
            raise HTTPException(status_code=404, detail="No algorithm accessed yet")
        return progress
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching last accessed for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/stats", response_model=dict)
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return get_user_completion_stats(db, current_user.id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching stats for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/detailed-stats", response_model=dict)
def get_detailed_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return get_detailed_user_stats(db, current_user.id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching detailed stats for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/update-access/{algo_id}", response_model=dict)
def update_last_accessed(
    algo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        progress = get_entry(db, current_user.id, algo_id)
        if not progress:
            raise HTTPException(status_code=404, detail="Progress entry not found")
        progress.last_accessed = datetime.utcnow()
        db.commit()
        return {"message": "Last accessed updated"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating last accessed for user {current_user.id}, algo {algo_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

from ..schemas import BatchProgressRequest

@router.post("/batch", response_model=dict)
def get_batch_progress(
    request: BatchProgressRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get progress for multiple algorithms in a single request.
    Returns a dictionary mapping algorithm IDs to their progress entries.
    """
    try:
        algorithm_ids = request.algorithm_ids
        if not algorithm_ids:
            return {}
            
        # Get batch progress
        progress_map = get_batch_progress_repo(db, current_user.id, algorithm_ids)
        
        # Convert SQLAlchemy models to dicts for JSON serialization
        return {
            str(algo_id): {
                "id": progress.id,
                "user_id": progress.user_id,
                "algo_id": progress.algo_id,
                "status": progress.status,
                "started_at": progress.started_at.isoformat() if progress.started_at else None,
                "finished_at": progress.finished_at.isoformat() if progress.finished_at else None,
                "last_accessed": progress.last_accessed.isoformat() if progress.last_accessed else None
            }
            for algo_id, progress in progress_map.items()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in batch progress: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch batch progress")

@router.delete("/{progress_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_progress(
    progress_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        progress = get_by_id(db, progress_id)
        if progress.user_id != current_user.id and not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Not authorized to delete this progress")
        delete(db, progress_id)
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting progress {progress_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")