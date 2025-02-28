from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from models import UserProgress, AlgoStatus
import schemas

def get_all(db: Session):
    return db.query(UserProgress).join(UserProgress.user).join(UserProgress.algorithm).all()

def upsert_progress(db: Session, progress_request: schemas.AddUserProgress, user_id: int):
    """
    Create or update a UserProgress entry.
    If a progress entry for the given user and algorithm exists, update its status.
    Otherwise, create a new entry.
    """
    algo_id = progress_request.algo_id
    status_value = progress_request.status
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.algo_id == algo_id
    ).first()
    
    if not progress:
        # Create new progress entry if it doesn't exist
        progress = UserProgress(
            user_id=user_id,
            algo_id=algo_id,
            status=status_value
        )
        db.add(progress)
    else:
        # Update the existing progress entry
        progress.status = status_value
        if status_value == AlgoStatus.completed:
            progress.finished_at = func.now()
    
    try:
        db.commit()
        db.refresh(progress)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    return progress

def get_entry(db: Session, user_id: int, algo_id: int):
    try:
        progress = db.query(UserProgress).filter(
            UserProgress.user_id == user_id,
            UserProgress.algo_id == algo_id
        ).first()
        return progress
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving user progress: {str(e)}"
        )

def get_last_accessed_algorithm(db: Session, user_id: int):
    try:
        last_accessed = db.query(UserProgress).filter(
            UserProgress.user_id == user_id
        ).order_by(UserProgress.last_accessed.desc()).first()
        if last_accessed:
            return {
                "algorithm": last_accessed.algo_id,
                "status": last_accessed.status,
                "last_accessed": last_accessed.last_accessed
            }
        return None
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving last accessed algorithm: {str(e)}"
        )

def get_progress_by_userid(db: Session, user_id: int):
    try:
        progress = db.query(UserProgress).filter(UserProgress.user_id == user_id).all()
        return progress if progress else []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

def get_user_completion_stats(db: Session, user_id: int):
    try:
        total = db.query(UserProgress).filter(UserProgress.user_id == user_id).count()
        solved = db.query(UserProgress).filter(
            UserProgress.user_id == user_id,
            UserProgress.status == AlgoStatus.completed
        ).count()
        return {
            "total_problems": total,
            "solved_problems": solved,
            "completion_rate": round((solved / total * 100), 2) if total > 0 else 0
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
