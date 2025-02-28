from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from auth import oauth2
from db import get_db
from repositories.blog_repo import if_user_owns_blog  # Add this import
from repositories import blog_repo

router = APIRouter(prefix="/blogs", tags=["Blog"])

@router.post("/", response_model=schemas.ShowBlog)
def create(
    request: schemas.AddBlog, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    return blog_repo.create_blog(request, db, current_user.id)

@router.put("/{id}", response_model=schemas.ShowBlog)
def update(
    id: int, 
    request: schemas.UpdateBlog, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    blog = blog_repo.get_blog(db, id)
    if not if_user_owns_blog(db, id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own blogs"
        )
    return blog_repo.update_blog(request, db, id, current_user.id)  # Parameter order mismatch

@router.get("/", response_model=List[schemas.ShowBlog])
def all(db: Session = Depends(get_db)):
    return blog_repo.get_all_blogs(db)

@router.get("/user/{id}", response_model=List[schemas.ShowBlog])  # Changed path and return type
def user_blogs(
    id: int,  # Get id from path parameter
    db: Session = Depends(get_db)
):
    return blog_repo.get_user_blogs(db, id)  # Pass id as user_id

@router.get("/{id}", response_model=schemas.ShowBlog)
def show(
    id: int, 
    db: Session = Depends(get_db)
):
    return blog_repo.get_blog(db, id)

@router.delete("/{id}", response_model=dict)
def delete(
    id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    blog = blog_repo.get_blog(db, id)
    if blog.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own blogs"
        )
    return blog_repo.delete_blog(db, id, current_user.id)

@router.get("/search/{query}", response_model=List[schemas.ShowBlog])
def search(
    query: str,
    db: Session = Depends(get_db)
):
    return blog_repo.search_blogs(db, query)
