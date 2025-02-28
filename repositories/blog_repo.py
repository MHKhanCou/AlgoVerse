from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from models import Blog, User  # Added User import
from datetime import datetime
from schemas import AddBlog, UpdateBlog

def get_blog(db: Session, blog_id: int):
    blog = db.query(Blog).join(User).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Blog with ID = {blog_id} not found"
        )
    return blog

def if_blog_exists(db: Session, blog_id: int):
    return db.query(Blog).filter(Blog.id == blog_id).first() is not None

def get_all_blogs(db: Session):
    return db.query(Blog).all()

def get_user_blogs(db: Session, user_id: int):
    return db.query(Blog).filter(Blog.user_id == user_id).all()

def if_user_owns_blog(db: Session, blog_id: int, user_id: int):
    blog = get_blog(db, blog_id)
    return blog.user_id == user_id

def create_blog(request: AddBlog, db: Session, user_id: int):
    try:
        blog = Blog(
            title=request.title,
            body=request.body,
            user_id=user_id,
            created_at=datetime.utcnow()
        )
        db.add(blog)
        db.commit()
        db.refresh(blog)
        return blog
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating blog: {str(e)}"
        )

def update_blog(request: UpdateBlog, db: Session, blog_id: int, user_id: int):
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Blog with ID = {blog_id} not found"
        )
    
    try:
        update_data = request.dict(exclude_unset=True)
        db.query(Blog).filter(Blog.id == blog_id).update(update_data)
        db.commit()
        return db.query(Blog).filter(Blog.id == blog_id).first()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating blog: {str(e)}"
        )

def delete_blog(db: Session, blog_id: int, user_id: int):
    blog = get_blog(db, blog_id)
    
    try:
        db.delete(blog)
        db.commit()
        return {"message": f"Blog with ID = {blog_id} deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting blog: {str(e)}"
        )

def search_blogs(db: Session, query: str):
    return db.query(Blog).filter(
        (Blog.title.ilike(f"%{query}%")) |
        (Blog.body.ilike(f"%{query}%"))
    ).all()