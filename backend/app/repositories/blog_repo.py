from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from ..models import Blog, User, BlogStatus
from ..schemas import AddBlog, UpdateBlog
from ..repositories.user_repo import if_exists
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
        "author_id": blog.user.id if blog.user else None,
        "created_at": blog.created_at,
        "updated_at": blog.updated_at,
        "status": blog.status,
        "admin_feedback": blog.admin_feedback,
        "approved_at": blog.approved_at
    }

def get_all_blogs(db: Session, skip: int = 0, limit: int = 5):
    try:
        # Only return approved blogs for public viewing
        blogs = db.query(Blog).options(joinedload(Blog.user)).filter(
            Blog.status == BlogStatus.approved
        ).offset(skip).limit(limit).all()
        return [
            {
                "id": blog.id,
                "title": blog.title,
                "body": blog.body,
                "author": blog.user.name if blog.user else "Unknown",
                "author_id": blog.user.id if blog.user else None,
                "created_at": blog.created_at,
                "updated_at": blog.updated_at,
                "status": blog.status,
                "admin_feedback": blog.admin_feedback,
                "approved_at": blog.approved_at
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
            "updated_at": blog.updated_at,
            "status": blog.status,
            "admin_feedback": blog.admin_feedback,
            "approved_at": blog.approved_at
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
            "updated_at": blog_obj.updated_at,
            "status": blog_obj.status,
            "admin_feedback": blog_obj.admin_feedback,
            "approved_at": blog_obj.approved_at
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
                "updated_at": blog.updated_at,
                "status": blog.status,
                "admin_feedback": blog.admin_feedback,
                "approved_at": blog.approved_at
            }
            for blog in blogs
        ]
    except SQLAlchemyError as e:
        logger.error(f"Database error searching blogs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to search blogs")

def get_user_blogs(db: Session, user_id: int, skip: int = 0, limit: int = 5, include_unapproved: bool = False, status_filter: str = None):
    try:
        # By default, only return approved blogs (safe for public routes)
        query = (
            db.query(Blog)
            .options(joinedload(Blog.user))
            .filter(Blog.user_id == user_id)
        )

        # Apply status filtering
        if status_filter:
            if status_filter == "approved":
                query = query.filter(Blog.status == BlogStatus.approved)
            elif status_filter == "pending":
                query = query.filter(Blog.status == BlogStatus.pending)
            elif status_filter == "rejected":
                query = query.filter(Blog.status == BlogStatus.rejected)
            elif status_filter == "unapproved":
                query = query.filter(Blog.status.in_([BlogStatus.pending, BlogStatus.rejected]))
            elif status_filter == "all":
                # No additional filter; return all statuses for this user
                pass
        else:
            # Backward-compatible behavior using include_unapproved
            if not include_unapproved:
                query = query.filter(Blog.status == BlogStatus.approved)

        blogs = (
            query
            .order_by(Blog.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return [
            {
                "id": blog.id,
                "title": blog.title,
                "body": blog.body,
                "author": blog.user.name if blog.user else "Unknown",
                "author_id": blog.user.id if blog.user else None,
                "created_at": blog.created_at,
                "updated_at": blog.updated_at,
                "status": blog.status,
                "admin_feedback": blog.admin_feedback,
                "approved_at": blog.approved_at,
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

# Blog moderation functions
def get_pending_blogs(db: Session, skip: int = 0, limit: int = 10):
    """Get all pending blogs for admin review"""
    try:
        blogs = db.query(Blog).options(joinedload(Blog.user)).filter(
            Blog.status == BlogStatus.pending
        ).offset(skip).limit(limit).all()
        return [
            {
                "id": blog.id,
                "title": blog.title,
                "body": blog.body,
                "author": blog.user.name if blog.user else "Unknown",
                "created_at": blog.created_at,
                "updated_at": blog.updated_at,
                "status": blog.status,
                "admin_feedback": blog.admin_feedback,
                "approved_at": blog.approved_at
            }
            for blog in blogs
        ]
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching pending blogs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch pending blogs")

def get_all_blogs_for_admin(db: Session, status_filter: str = None, skip: int = 0, limit: int = 10):
    """Get all blogs with optional status filter for admin"""
    try:
        query = db.query(Blog).options(joinedload(Blog.user))
        
        if status_filter:
            if status_filter == "pending":
                query = query.filter(Blog.status == BlogStatus.pending)
            elif status_filter == "approved":
                query = query.filter(Blog.status == BlogStatus.approved)
            elif status_filter == "rejected":
                query = query.filter(Blog.status == BlogStatus.rejected)
        
        blogs = query.offset(skip).limit(limit).all()
        return [
            {
                "id": blog.id,
                "title": blog.title,
                "body": blog.body,
                "author": blog.user.name if blog.user else "Unknown",
                "user": {
                    "id": blog.user.id if blog.user else 0,
                    "name": blog.user.name if blog.user else "Unknown",
                    "email": blog.user.email if blog.user else "No email",
                    "is_admin": blog.user.is_admin if blog.user else False,
                    "codeforces_handle": blog.user.codeforces_handle if blog.user else None,
                    "joined_at": blog.user.joined_at.isoformat() if blog.user and blog.user.joined_at else None
                },
                "created_at": blog.created_at,
                "updated_at": blog.updated_at,
                "status": blog.status,
                "admin_feedback": blog.admin_feedback,
                "approved_at": blog.approved_at
            }
            for blog in blogs
        ]
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching blogs for admin: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch blogs")

def moderate_blog(db: Session, blog_id: int, action: BlogStatus, admin_id: int, feedback: str = None):
    """Approve, reject, or modify blog status"""
    try:
        blog = db.query(Blog).filter(Blog.id == blog_id).first()
        if not blog:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Blog with ID {blog_id} not found"
            )
        
        blog.status = action
        blog.admin_feedback = feedback
        blog.approved_by = admin_id
        
        if action == BlogStatus.approved:
            from datetime import datetime
            blog.approved_at = datetime.utcnow()
        
        db.commit()
        db.refresh(blog)
        
        return {
            "id": blog.id,
            "title": blog.title,
            "body": blog.body,
            "author": blog.user.name if blog.user else "Unknown",
            "created_at": blog.created_at,
            "updated_at": blog.updated_at,
            "status": blog.status,
            "admin_feedback": blog.admin_feedback,
            "approved_at": blog.approved_at
        }
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error moderating blog: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to moderate blog")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error moderating blog: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
