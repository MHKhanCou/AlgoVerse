from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from db import get_db  
from repositories.user_repo import if_exists
from repositories.algo_repo import get_algo_by_id
from auth.oauth2 import get_current_user
from repositories.user_progress_repo import (
    get_all,
    upsert_progress,
    get_progress_by_userid,
    get_entry,
    get_last_accessed_algorithm,
    get_user_completion_stats
)

router = APIRouter(prefix="/user_progress", tags=["User Progress"])

@router.get("/", response_model=List[schemas.ShowUserProgress])
def get_all_progress(db: Session = Depends(get_db)):
    return get_all(db)

@router.post("/", response_model=schemas.ShowUserProgress)
def create_progress(
    request: schemas.AddUserProgress,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Use current user's id to associate progress
    user_id = current_user.id
    if not get_algo_by_id(db, request.algo_id):
        raise HTTPException(status_code=404, detail="Algorithm not found")
    return upsert_progress(db, request, user_id)

@router.put("/{algo_id}", response_model=schemas.ShowUserProgress)
def update_progress(
    algo_id: int,
    request: schemas.UpdateUserProgress,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user_id = current_user.id
    if not get_algo_by_id(db, algo_id):
        raise HTTPException(status_code=404, detail="Algorithm not found")
    
    # Create a complete progress request using the algo_id from the path and status from the request
    progress_data = schemas.AddUserProgress(
        algo_id=algo_id,
        status=request.status
    )
    return upsert_progress(db, progress_data, user_id)

@router.get("/user", response_model=List[schemas.ShowUserProgress])
def get_user_progress(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return get_progress_by_userid(db, current_user.id)

@router.get("/user/{user_id}", response_model=List[schemas.ShowUserProgress])
def get_user_progress_by_id(
    user_id: int,
    db: Session = Depends(get_db)
):
    if not if_exists(db, user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    return get_progress_by_userid(db, user_id)

@router.get("/entry/{algo_id}", response_model=schemas.ShowUserProgress)
def get_progress_entry(
    algo_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    progress = get_entry(db, current_user.id, algo_id)
    if not progress:
        raise HTTPException(status_code=404, detail="Progress entry not found")
    return progress

@router.get("/last-accessed", response_model=dict)
def get_last_accessed(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    progress = get_last_accessed_algorithm(db, current_user.id)
    if not progress:
        raise HTTPException(status_code=404, detail="No algorithm accessed yet")
    return progress

@router.get("/stats", response_model=dict)
def get_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return get_user_completion_stats(db, current_user.id)
