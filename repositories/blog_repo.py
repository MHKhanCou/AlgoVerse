from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from models import Blog, User
from schemas import AddBlog, UpdateBlog
from repositories.user_repo import if_exists
import logging

logger = logging.getLogger(__name__)

def get_blog_by_id(db: Session, blog_id: int):
    blog = db.query(Blog).options(joinedload(Blog.user)).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Blog with ID {blog_id} not found"
        )
    return {
        "id": blog.id,
        "title": blog.title,
        "body": blog.body,
        "author": blog.user.name if blog.user else "Unknown",
        "created_at": blog.created_at,
        "updated_at": blog.updated_at
    }

def get_all_blogs(db: Session, skip: int = 0, limit: int = 5):
    try:
        blogs = db.query(Blog).options(joinedload(Blog.user)).offset(skip).limit(limit).all()
        return [
            {
                "id": blog.id,
                "title": blog.title,
                "body": blog.body,
                "author": blog.user.name if blog.user else "Unknown",
                "created_at": blog.created_at,
                "updated_at": blog.updated_at
            }
            for blog in blogs
        ]
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching blogs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch blogs")

def create_blog(db: Session, request: AddBlog, user_id: int):
    try:
        user = if_exists(db, user_id)
        blog = Blog(
            title=request.title,
            body=request.body,
            user_id=user_id
        )
        db.add(blog)
        db.commit()
        db.refresh(blog)
        return {
            "id": blog.id,
            "title": blog.title,
            "body": blog.body,
            "author": user.name if user else "Unknown",
            "created_at": blog.created_at,
            "updated_at": blog.updated_at
        }
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating blog: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create blog")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating blog: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def update_blog(db: Session, request: UpdateBlog, blog_id: int, user_id: int):
    try:
        blog = get_blog_by_id(db, blog_id)
        if blog["author"] != db.query(User).filter(User.id == user_id).first().name:
            raise HTTPException(status_code=403, detail="Not authorized to update this blog")
        
        blog_obj = db.query(Blog).filter(Blog.id == blog_id).first()
        if request.title is not None:
            blog_obj.title = request.title
        if request.body is not None:
            blog_obj.body = request.body
            
        db.commit()
        db.refresh(blog_obj)
        return {
            "id": blog_obj.id,
            "title": blog_obj.title,
            "body": blog_obj.body,
            "author": blog["author"],
            "created_at": blog_obj.created_at,
            "updated_at": blog_obj.updated_at
        }
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating blog: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update blog")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating blog: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def delete_blog(db: Session, blog_id: int, user_id: int):
    try:
        blog = get_blog_by_id(db, blog_id)
        user = db.query(User).filter(User.id == user_id).first()
        if blog["author"] != user.name and not user.is_admin:
            raise HTTPException(status_code=403, detail="Not authorized to delete this blog")
        blog_obj = db.query(Blog).filter(Blog.id == blog_id).first()
        db.delete(blog_obj)
        db.commit()
        return None
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error deleting blog: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete blog")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error deleting blog: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
def delete_by_user(db: Session, user_id: int):
    try:
        blogs = db.query(Blog).filter(Blog.user_id == user_id).all()
        if not blogs:
            return None
        for blog in blogs:
            db.delete(blog)
        db.commit()
        return None
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error deleting blogs for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete blogs")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error deleting blogs for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def search_blogs(db: Session, query: str):
    try:
        blogs = db.query(Blog).options(joinedload(Blog.user)).filter(
            (Blog.title.ilike(f"%{query}%")) |
            (Blog.body.ilike(f"%{query}%"))
        ).all()
        return [
            {
                "id": blog.id,
                "title": blog.title,
                "body": blog.body,
                "author": blog.user.name if blog.user else "Unknown",
                "created_at": blog.created_at,
                "updated_at": blog.updated_at
            }
            for blog in blogs
        ]
    except SQLAlchemyError as e:
        logger.error(f"Database error searching blogs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to search blogs")

def get_user_blogs(db: Session, user_id: int, skip: int = 0, limit: int = 5):
    try:
        blogs = db.query(Blog).options(joinedload(Blog.user)).filter(Blog.user_id == user_id).offset(skip).limit(limit).all()
        return [
            {
                "id": blog.id,
                "title": blog.title,
                "body": blog.body,
                "author": blog.user.name if blog.user else "Unknown",
                "created_at": blog.created_at,
                "updated_at": blog.updated_at
            }
            for blog in blogs
        ]
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching user blogs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch user blogs")

def if_user_owns_blog(db: Session, blog_id: int, user_id: int):
    try:
        blog = db.query(Blog).filter(Blog.id == blog_id).first()
        if not blog:
            return False
        return blog.user_id == user_id
    except SQLAlchemyError as e:
        logger.error(f"Database error checking blog ownership: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check blog ownership")