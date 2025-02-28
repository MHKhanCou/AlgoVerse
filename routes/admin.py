from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import schemas, models
from db import get_db  
from middleware.admin_dependencies import get_current_admin
from repositories import algo_repo, algo_types_repo, user_repo, user_progress_repo

# Main admin router
router = APIRouter(prefix="/admin", tags=["Admin"])

# Subrouters
router_users = APIRouter(prefix="/users", tags=["Admin - Users"])
router_algo_types = APIRouter(prefix="/algo-types", tags=["Admin - Algorithm Types"])
router_algorithms = APIRouter(prefix="/algorithms", tags=["Admin - Algorithms"])
router_progress = APIRouter(prefix="/progress", tags=["Admin - User Progress"])
router_dashboard = APIRouter(prefix="/dashboard", tags=["Admin - Dashboard"])

# User Management

@router_users.delete("/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    return user_repo.delete_user(db, user_id)

@router_users.put("/{user_id}/make-admin")
async def make_admin(user_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    user = user_repo.if_exists(db, user_id)
    user.is_admin = True
    db.commit()
    db.refresh(user)
    return user

# Algorithm Type Management

@router_algo_types.post("/", response_model=schemas.ShowAlgorithmType)
async def create_algo_type(algo_type: schemas.AddAlgorithmType, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    return type_repo.create_algo_type(db, algo_type)

@router_algo_types.put("/{type_id}", response_model=schemas.ShowAlgorithmType)
async def update_algo_type(type_id: int, algo_type: schemas.UpdateAlgorithmType, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    return type_repo.update_algo_type(db, type_id, algo_type.dict())

@router_algo_types.delete("/{type_id}")
async def delete_algo_type(type_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    return type_repo.delete_algo_type(db, type_id)

# Algorithm Management
@router_algorithms.post("/", response_model=schemas.ShowAlgorithm)
async def create_algorithm(algo: schemas.AddAlgorithm, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    return algo_repo.create_algorithm(db, algo)

@router_algorithms.put("/{algo_id}", response_model=schemas.ShowAlgorithm)
async def update_algorithm(algo_id: int, algo: schemas.UpdateAlgorithm, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    return algo_repo.update_algorithm(db, algo_id, algo.dict())

@router_algorithms.delete("/{algo_id}")
async def delete_algorithm(algo_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    return algo_repo.delete_algorithm(db, algo_id)

# User Progress Management
@router_progress.delete("/{progress_id}")
async def delete_progress(progress_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    return user_progress_repo.delete_progress(db, progress_id)

@router_progress.delete("/user/{user_id}")
async def delete_user_progress(user_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    return user_progress_repo.delete_user_progress(db, user_id)

# Dashboard
@router_dashboard.get("/")
async def get_dashboard_stats(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    return {
        "total_users": db.query(models.User).count(),
        "total_algorithms": db.query(models.Algorithm).count(),
        "total_blogs": db.query(models.Blog).count(),
        "user_progress": db.query(models.UserProgress).count()
    }

# Include all subrouters
router.include_router(router_users)
router.include_router(router_algo_types)
router.include_router(router_algorithms)
router.include_router(router_progress)
router.include_router(router_dashboard)