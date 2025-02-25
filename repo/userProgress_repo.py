from fastapi import HTTPException
from sqlalchemy.orm import Session
from models import User, UserProgress

# User progress tracking functions
def get_user_progress(db: Session, user_id: int):
    progress = db.query(UserProgress).filter(UserProgress.user_id == user_id).first()
    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found for this user")
    return progress

def update_user_progress(db: Session, user_id: int, problem_id: int, status: str):
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.problem_id == problem_id
    ).first()
    
    if not progress:
        progress = UserProgress(
            user_id=user_id,
            problem_id=problem_id,
            status=status,
            attempts=1
        )
        db.add(progress)
    else:
        progress.status = status
        progress.attempts += 1
        
    db.commit()
    db.refresh(progress)
    return progress

def get_user_completion_stats(db: Session, user_id: int):
    total_problems = db.query(UserProgress).filter(
        UserProgress.user_id == user_id
    ).count()
    
    solved_problems = db.query(UserProgress).filter(
        UserProgress.user_id == user_id,
        UserProgress.status == "completed"
    ).count()
    
    return {
        "total_problems": total_problems,
        "solved_problems": solved_problems,
        "completion_rate": (solved_problems / total_problems * 100) if total_problems > 0 else 0
    }


def get_last_accessed_algorithm(user_id: int, db: Session):
    last_accessed = db.query(UserProgress).filter(
        UserProgress.user_id == user_id
    ).order_by(UserProgress.last_accessed.desc()).first()
    if not last_accessed:
        return None
    return last_accessed.algorithm_id

def get_user_progress_by_userid(db: Session, user_id: int):
    progress = db.query(UserProgress).filter(UserProgress.user_id == user_id).all()
    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found for this user")
    return progress