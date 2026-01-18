from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from typing import List
from ..models import UserProgress, User, Algorithm, AlgoStatus, AlgoDifficulty, AlgoComplexity
from ..schemas import ShowUserProgress, AddUserProgress, UpdateUserProgress, ShowAlgorithm
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def get_all(db: Session):
    try:
        progress_entries = (
            db.query(UserProgress)
            .options(
                joinedload(UserProgress.user),
                joinedload(UserProgress.algorithm)
            )
            .all()
        )
        return progress_entries  # SQLAlchemy maps to ShowUserProgress
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching all progress: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch progress")
    except Exception as e:
        logger.error(f"Unexpected error fetching all progress: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def get_by_id(db: Session, progress_id: int):
    try:
        progress = db.query(UserProgress).filter(UserProgress.id == progress_id).first()
        if not progress:
            raise HTTPException(status_code=404, detail=f"Progress with id {progress_id} not found")
        return progress
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching progress {progress_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch progress")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error fetching progress {progress_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def create(db: Session, progress_data: AddUserProgress):
    try:
        # Validate user_id and algo_id
        user = db.query(User).filter(User.id == progress_data.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail=f"User with id {progress_data.user_id} not found")
        algo = db.query(Algorithm).filter(Algorithm.id == progress_data.algo_id).first()
        if not algo:
            raise HTTPException(status_code=404, detail=f"Algorithm with id {progress_data.algo_id} not found")
        
        # Check for existing progress
        existing = db.query(UserProgress).filter(
            UserProgress.user_id == progress_data.user_id,
            UserProgress.algo_id == progress_data.algo_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Progress already exists for this user and algorithm")
        
        current_time = datetime.utcnow()
        new_progress = UserProgress(
            user_id=progress_data.user_id,
            algo_id=progress_data.algo_id,
            status=progress_data.status,
            started_at=current_time,
            last_accessed=current_time  # Initialize last_accessed on creation
        )
        db.add(new_progress)
        db.commit()
        db.refresh(new_progress)
        return new_progress
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating progress: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create progress")
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating progress: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def get_entry(db: Session, user_id: int, algo_id: int):
    try:
        progress = db.query(UserProgress).filter(
            UserProgress.user_id == user_id,
            UserProgress.algo_id == algo_id
        ).first()
        return progress
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching progress for user {user_id}, algo {algo_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch progress")
    except Exception as e:
        logger.error(f"Unexpected error fetching progress for user {user_id}, algo {algo_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def get_last_accessed_algorithm(db: Session, user_id: int):
    try:
        last_accessed = db.query(UserProgress).filter(
            UserProgress.user_id == user_id
        ).order_by(UserProgress.last_accessed.desc()).first()
        if last_accessed:
            return {
                "algorithm_id": last_accessed.algo_id,
                "status": last_accessed.status,
                "last_accessed": last_accessed.last_accessed
            }
        return None
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching last accessed for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch last accessed algorithm")
    except Exception as e:
        logger.error(f"Unexpected error fetching last accessed for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def get_progress_by_userid(db: Session, user_id: int):
    try:
        progress = (
            db.query(UserProgress)
            .options(joinedload(UserProgress.algorithm))
            .filter(UserProgress.user_id == user_id)
            .all()
        )
        return progress if progress else []
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching progress for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch user progress")
    except Exception as e:
        logger.error(f"Unexpected error fetching progress for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

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
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching completion stats for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch completion stats")
    except Exception as e:
        logger.error(f"Unexpected error fetching completion stats for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def get_detailed_user_stats(db: Session, user_id: int):
    try:
        basic_stats = get_user_completion_stats(db, user_id)
        
        # Use AlgoDifficulty enum values
        difficulty_stats = {}
        for difficulty in [AlgoDifficulty.easy, AlgoDifficulty.medium, AlgoDifficulty.hard]:
            total_by_diff = db.query(UserProgress).join(Algorithm).filter(
                UserProgress.user_id == user_id,
                Algorithm.difficulty == difficulty
            ).count()
            completed_by_diff = db.query(UserProgress).join(Algorithm).filter(
                UserProgress.user_id == user_id,
                UserProgress.status == AlgoStatus.completed,
                Algorithm.difficulty == difficulty
            ).count()
            difficulty_stats[difficulty.value] = {
                "total": total_by_diff,
                "completed": completed_by_diff,
                "completion_rate": round((completed_by_diff / total_by_diff * 100), 2) if total_by_diff > 0 else 0
            }
        
        recent_completions = db.query(UserProgress).join(Algorithm).filter(
            UserProgress.user_id == user_id,
            UserProgress.status == AlgoStatus.completed
        ).order_by(UserProgress.finished_at.desc()).limit(5).all()
        
        recent = [
            {
                "algorithm_id": completion.algo_id,
                "algorithm_name": completion.algorithm_name,
                "difficulty": completion.algorithm.difficulty.value,
                "completed_at": completion.finished_at
            }
            for completion in recent_completions
        ]
        
        return {
            **basic_stats,
            "by_difficulty": difficulty_stats,
            "recent_completions": recent
        }
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching detailed stats for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch detailed stats")
    except Exception as e:
        logger.error(f"Unexpected error fetching detailed stats for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def update(db: Session, progress_id: int, progress_data: UpdateUserProgress):
    try:
        progress = get_by_id(db, progress_id)
        progress.status = progress_data.status
        if progress_data.status == AlgoStatus.completed and not progress.finished_at:
            progress.finished_at = datetime.utcnow()
        db.commit()
        db.refresh(progress)
        return progress
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating progress {progress_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update progress")
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating progress {progress_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def delete(db: Session, progress_id: int):
    try:
        progress = get_by_id(db, progress_id)
        db.delete(progress)
        db.commit()
        return None
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error deleting progress {progress_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete progress")
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error deleting progress {progress_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def delete_by_user(db: Session, user_id: int):
    try:
        # Delete all progress entries for the user
        db.query(UserProgress).filter(UserProgress.user_id == user_id).delete()
        db.commit()
        return {"message": f"All progress for user {user_id} deleted successfully"}
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error deleting progress for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete progress for user {user_id}"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error deleting progress for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

def get_batch_progress(db: Session, user_id: int, algorithm_ids: List[int]):
    """
    Get progress for multiple algorithms for a single user in a single query.
    Returns a dictionary mapping algorithm_id to progress entry.
    """
    try:
        if not algorithm_ids:
            return {}
            
        # Query all progress entries for the user and the specified algorithm IDs
        progress_entries = db.query(UserProgress).filter(
            UserProgress.user_id == user_id,
            UserProgress.algo_id.in_(algorithm_ids)
        ).all()
        
        # Create a mapping of algo_id to progress entry
        return {entry.algo_id: entry for entry in progress_entries}
        
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching batch progress for user {user_id}: {str(e)}")
        # Don't fail the entire request if batch progress fails
        return {}
    except Exception as e:
        logger.error(f"Unexpected error in get_batch_progress: {str(e)}")
        return {}