from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db

router = APIRouter(prefix="/user_progress", tags=["User Progress"])

@router.post("/", response_model=schemas.ShowUserProgress)
def add(request: schemas.AddUserProgress, db: Session = Depends(get_db)):
    user_progress = models.UserProgress(
        user_id=request.user_id,
        algorithm_id=request.algorithm_id,
        status=request.status
    )
    db.add(user_progress)
    db.commit()
    db.refresh(user_progress)
    return user_progress

@router.put("/{id}", response_model=schemas.UpdateUserProgress)
def update(id: int, request: schemas.AddUserProgress, db: Session = Depends(get_db)):
    user_progress = db.query(models.UserProgress).filter(models.UserProgress.id == id)
    if not user_progress.first():
        raise HTTPException(status_code=404, detail="User progress not found")
    user_progress.update({
        models.UserProgress.user_id: request.user_id,
        models.UserProgress.algorithm_id: request.algorithm_id,
        models.UserProgress.status: request.status
    })
    db.commit()
    return {"message": "User progress updated successfully"}

@router.get("/", response_model=List[schemas.ShowUserProgress])
def alls(db: Session = Depends(get_db)):
    progress = db.query(models.UserProgress).all()
    return progress

@router.get("/{id}", response_model=schemas.ShowUserProgress)
def show(id: int, db: Session = Depends(get_db)):
    user_progress = db.query(models.UserProgress).filter(models.UserProgress.id == id).first()
    if not user_progress:
        raise HTTPException(status_code=404, detail="User progress not found")
    return user_progress

@router.delete("/{id}")
def delete(id: int, db: Session = Depends(get_db)):
    user_progress = db.query(models.UserProgress).filter(models.UserProgress.id == id).first()
    if not user_progress:
        raise HTTPException(status_code=404, detail="User progress not found")
    db.delete(user_progress)
    db.commit()
    return {"message": "User progress deleted successfully"}

# last accessed algorithm of a user
@router.get("/last-accessed/{user_id}")
def last_accessed(user_id: int, db: Session = Depends(get_db)):
    if not db.query(models.User).filter(models.User.id == user_id).first():
        raise HTTPException(status_code=404, detail="User not found")
    user_progress = db.query(models.UserProgress).filter(models.UserProgress.user_id == user_id).order_by(models.UserProgress.id.desc()).first()
    if not user_progress:
        raise HTTPException(status_code=404, detail="User has not accessed any algorithm")
    return {"last_accessed": user_progress.algo_id}

# all algorithms accessed by a user
def all_accessed(user_id: int, db: Session = Depends(get_db)):
    if not db.query(models.User).filter(models.User.id == user_id).first():
        raise HTTPException(status_code=404, detail="User not found")
    user_progress = db.query(models.UserProgress).filter(models.UserProgress.user_id == user_id).all()
    if not user_progress:
        raise HTTPException(status_code=404, detail="User has not accessed any algorithm")
    return list({progress.algo for progress in user_progress})
