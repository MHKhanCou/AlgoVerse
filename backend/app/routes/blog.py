from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..auth import oauth2
from ..db import get_db
from ..repositories.blog_repo import if_user_owns_blog, get_blog_by_id
from ..repositories import blog_repo

router = APIRouter(prefix="/blogs", tags=["Blog"])

@router.post("/", response_model=schemas.ShowBlog)
def create(
    request: schemas.AddBlog, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    return blog_repo.create_blog(db, request, current_user.id)

@router.put("/{id}", response_model=schemas.ShowBlog)
def update(
    id: int, 
    request: schemas.UpdateBlog, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    blog = get_blog_by_id(db, id)
    if blog.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own blogs or if you are an admin"
        )
    return blog_repo.update_blog(db, request, id, current_user.id)

@router.get("/", response_model=List[schemas.ShowBlog])
def all(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="Number of blogs to skip"),
    limit: int = Query(5, ge=1, le=100, description="Number of blogs to return")
):
    return blog_repo.get_all_blogs(db, skip=skip, limit=limit)

@router.get("/user/{id}", response_model=List[schemas.ShowBlog])
def user_blogs(
    id: int,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="Number of blogs to skip"),
    limit: int = Query(5, ge=1, le=100, description="Number of blogs to return")
):
    return blog_repo.get_user_blogs(db, id, skip=skip, limit=limit)

@router.get("/{id}", response_model=schemas.ShowBlog)
def show(
    id: int, 
    db: Session = Depends(get_db)
):
    return get_blog_by_id(db, id)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(
    id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    blog = get_blog_by_id(db, id)
    if blog.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own blogs or if you are an admin"
        )
    blog_repo.delete_blog(db, id, current_user.id)
    return None

@router.get("/search/{query}", response_model=List[schemas.ShowBlog])
def search(
    query: str,
    db: Session = Depends(get_db)
):
    return blog_repo.search_blogs(db, query)
