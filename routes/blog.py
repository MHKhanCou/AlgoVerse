from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from routes import oauth2
import models, schemas
from database import get_db

router = APIRouter(prefix="/blogs", tags=["Blog"])

@router.post("/", response_model=schemas.ShowBlog)
def create(request: schemas.AddBlog, db: Session = Depends(get_db)):
    new = models.Blog(
        title=request.title, 
        body=request.body, 
        user_id=request.user_id
    )
    db.add(new)
    db.commit()
    db.refresh(new)
    return new

@router.put("/{id}", response_model=dict)
def update(id: int, request: schemas.UpdateBlog, db: Session = Depends(get_db)):
    blog_query = db.query(models.Blog).filter(models.Blog.id == id)
    if not blog_query.first():
        raise HTTPException(status_code=404, detail=f"Blog with ID = {id} not found")
    blog_query.update({
        models.Blog.title: request.title,
        models.Blog.body: request.body
    })
    db.commit()
    return {"message": f"Blog with ID = {id} updated successfully"}

@router.get("/", response_model=List[schemas.ShowBlog])
def all(db: Session = Depends(get_db), current_user: models.User = Depends(oauth2.get_current_user) ):
    blogs = db.query(models.Blog).all()
    return blogs

@router.get("/{id}", response_model=schemas.ShowBlog)
def show(id: int, db: Session = Depends(get_db)):
    blog = db.query(models.Blog).filter(models.Blog.id == id).first()
    if not blog:
        raise HTTPException(status_code=404, detail=f"Blog with ID = {id} not found")
    return blog

@router.delete("/{id}", response_model=dict)
def delete(id: int, db: Session = Depends(get_db)):
    blog = db.query(models.Blog).filter(models.Blog.id == id).first()
    if not blog:
        raise HTTPException(status_code=404, detail=f"Blog with ID = {id} not found")
    db.delete(blog)
    db.commit()
    return {"message": f"Blog with ID = {id} deleted successfully"}
