from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from schemas import ShowAlgorithm, AddAlgorithm, UpdateAlgorithm, ShowAlgorithmType, AddAlgorithmType, UpdateAlgorithmType, ShowBlog, AddBlog, UpdateBlog, ShowUser, ShowUserProgress, AddUserProgress, UpdateUserProgress
from models import User, AlgorithmType, Algorithm, Blog, UserProgress
import models
from db import get_db
from middleware.admin_dependencies import get_current_admin
from repositories import algo_repo, algo_types_repo, user_repo, user_progress_repo, blog_repo
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Main admin router
router = APIRouter(prefix="/admin", tags=["Admin"])

# Subrouters
router_users = APIRouter(prefix="/users", tags=["Admin - Users"])
router_algo_types = APIRouter(prefix="/algo-types", tags=["Admin - Algorithm Types"])
router_algorithms = APIRouter(prefix="/algorithms", tags=["Admin - Algorithms"])
router_progress = APIRouter(prefix="/progress", tags=["Admin - User Progress"])
router_dashboard = APIRouter(prefix="/dashboard", tags=["Admin - Dashboard"])
router_blogs = APIRouter(prefix="/blogs", tags=["Admin - Blogs"])

# User Management
@router_users.get("/", response_model=List[ShowUser])
async def get_all_users(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return user_repo.get_all_users(db)

@router_users.put("/{user_id}/make-admin", response_model=ShowUser)
async def make_admin(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    user = user_repo.if_exists(db, user_id)
    user.is_admin = True
    db.commit()
    db.refresh(user)
    return user

@router_users.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    user_repo.delete_user(db, user_id)
    return None

# Algorithm Type Management
@router_algo_types.get("/", response_model=List[ShowAlgorithmType])
async def get_all_algorithm_types(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return algo_types_repo.get_all_algorithm_types(db)

@router_algo_types.post("/", response_model=ShowAlgorithmType, status_code=status.HTTP_201_CREATED)
async def create_algorithm_type(algo_type: AddAlgorithmType, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return algo_types_repo.create_algorithm_type(db, algo_type)

@router_algo_types.put("/{type_id}", response_model=ShowAlgorithmType, status_code=status.HTTP_200_OK)
async def update_algorithm_type(type_id: int, algo_type: UpdateAlgorithmType, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return algo_types_repo.update_algorithm_type(db, type_id, algo_type)

@router_algo_types.delete("/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_algorithm_type(type_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    algo_types_repo.delete_algorithm_type(db, type_id)
    return None

# Algorithm Management
@router_algorithms.get("/", response_model=List[ShowAlgorithm])
async def get_all_algorithms(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return algo_repo.get_all_algorithms(db)

@router_algorithms.post("/", response_model=ShowAlgorithm, status_code=status.HTTP_201_CREATED)
async def create_algorithm(algo: AddAlgorithm, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return algo_repo.create_algorithm(db, algo)

@router_algorithms.put("/{algo_id}", response_model=ShowAlgorithm, status_code=status.HTTP_200_OK)
async def update_algorithm(algo_id: int, algo: UpdateAlgorithm, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return algo_repo.update_algorithm(db, algo_id, algo)

@router_algorithms.delete("/{algo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_algorithm(algo_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    algo_repo.delete_algorithm(db, algo_id)
    return None

# Blog Management
@router_blogs.get("/", response_model=List[ShowBlog])
async def get_all_blogs(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return blog_repo.get_all_blogs(db)

@router_blogs.put("/{blog_id}", response_model=ShowBlog, status_code=status.HTTP_200_OK)
async def update_blog(blog_id: int, blog: UpdateBlog, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return blog_repo.update_blog(db=db, request=blog, blog_id=blog_id, user_id=admin.id)

@router_blogs.delete("/{blog_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_blog(blog_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    blog_repo.delete_blog(db=db, blog_id=blog_id, user_id=admin.id)
    return None

# User Progress Management
@router_progress.get("/", response_model=List[ShowUserProgress])
async def get_all_progress(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return user_progress_repo.get_all(db)

@router_progress.delete("/{progress_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_progress(progress_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    user_progress_repo.delete(db, progress_id)
    return None

@router_progress.delete("/user/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_progress(user_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    user_progress_repo.delete(db, user_id)
    return None

# Dashboard
@router_dashboard.get("/")
async def get_dashboard_stats(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    return {
        "total_users": db.query(User).count(),
        "total_algorithms": db.query(models.Algorithm).count(),
        "total_blogs": db.query(models.Blog).count(),
        "user_progress": db.query(models.UserProgress).count()
    }
@router_dashboard.get("/admin/dashboard")
async def get_admin_dashboard_stats(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    try:
        logger.info(f"Admin dashboard accessed by user: {admin.username}")
        return {
            "username": admin.username,
            "email": admin.email,
            "is_admin": admin.is_admin
        }
    except Exception as e:
        logger.error(f"Error in get_admin_dashboard_stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Include subrouters
router.include_router(router_blogs)
router.include_router(router_users)
router.include_router(router_algo_types)
router.include_router(router_algorithms)
router.include_router(router_progress)
router.include_router(router_dashboard)