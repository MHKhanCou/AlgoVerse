from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from models import BlogComment, Blog, User
from schemas import AddComment, UpdateComment, ShowComment
from db import get_db
from auth.oauth2 import get_current_user
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/comments", tags=["Comments"])

@router.get("/blog/{blog_id}", response_model=List[ShowComment])
def get_blog_comments(
    blog_id: int,
    db: Session = Depends(get_db)
):
    """Get all comments for a specific blog"""
    try:
        # Check if blog exists
        blog = db.query(Blog).filter(Blog.id == blog_id).first()
        if not blog:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Blog not found"
            )
        
        # Get top-level comments (no parent)
        comments = db.query(BlogComment).options(
            joinedload(BlogComment.user),
            joinedload(BlogComment.replies).joinedload(BlogComment.user)
        ).filter(
            BlogComment.blog_id == blog_id,
            BlogComment.parent_id.is_(None)
        ).order_by(BlogComment.created_at.desc()).all()
        
        return [format_comment(comment) for comment in comments]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching comments for blog {blog_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch comments")

@router.post("/blog/{blog_id}", response_model=ShowComment, status_code=status.HTTP_201_CREATED)
def create_comment(
    blog_id: int,
    request: AddComment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new comment on a blog"""
    try:
        # Check if blog exists
        blog = db.query(Blog).filter(Blog.id == blog_id).first()
        if not blog:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Blog not found"
            )
        
        # If parent_id is provided, check if parent comment exists
        if request.parent_id:
            parent_comment = db.query(BlogComment).filter(
                BlogComment.id == request.parent_id,
                BlogComment.blog_id == blog_id
            ).first()
            if not parent_comment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent comment not found"
                )
        
        # Create new comment
        comment = BlogComment(
            blog_id=blog_id,
            user_id=current_user.id,
            content=request.content,
            parent_id=request.parent_id
        )
        
        db.add(comment)
        db.commit()
        db.refresh(comment)
        
        # Load user relationship
        comment = db.query(BlogComment).options(
            joinedload(BlogComment.user)
        ).filter(BlogComment.id == comment.id).first()
        
        return format_comment(comment)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating comment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create comment")

@router.put("/{comment_id}", response_model=ShowComment)
def update_comment(
    comment_id: int,
    request: UpdateComment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a comment (only by the author)"""
    try:
        comment = db.query(BlogComment).options(
            joinedload(BlogComment.user)
        ).filter(BlogComment.id == comment_id).first()
        
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found"
            )
        
        # Check if user owns the comment
        if comment.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this comment"
            )
        
        # Update comment
        comment.content = request.content
        comment.updated_at = datetime.utcnow()
        comment.is_edited = True
        
        db.commit()
        db.refresh(comment)
        
        return format_comment(comment)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating comment {comment_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update comment")

@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a comment (only by the author or admin)"""
    try:
        comment = db.query(BlogComment).filter(BlogComment.id == comment_id).first()
        
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found"
            )
        
        # Check if user owns the comment or is admin
        if comment.user_id != current_user.id and not current_user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this comment"
            )
        
        # Delete all replies first (cascade delete)
        replies = db.query(BlogComment).filter(BlogComment.parent_id == comment_id).all()
        for reply in replies:
            db.delete(reply)
        
        # Delete the comment
        db.delete(comment)
        db.commit()
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting comment {comment_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete comment")

def format_comment(comment: BlogComment) -> dict:
    """Format comment for API response"""
    return {
        "id": comment.id,
        "blog_id": comment.blog_id,
        "user_id": comment.user_id,
        "content": comment.content,
        "parent_id": comment.parent_id,
        "created_at": comment.created_at,
        "updated_at": comment.updated_at,
        "is_edited": comment.is_edited,
        "author_name": comment.user.name if comment.user else "Unknown",
        "replies": [format_comment(reply) for reply in comment.replies] if hasattr(comment, 'replies') and comment.replies else []
    }