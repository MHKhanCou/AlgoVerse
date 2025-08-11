from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from models import AlgorithmComment, Algorithm, User
from schemas import AddAlgorithmComment, UpdateAlgorithmComment, ShowAlgorithmComment
from db import get_db
from auth.oauth2 import get_current_user
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/comments", tags=["Algorithm Comments"])

@router.get("/algorithm/{algorithm_id}", response_model=List[ShowAlgorithmComment])
def get_algorithm_comments(
    algorithm_id: int,
    db: Session = Depends(get_db)
):
    """Get all comments for a specific algorithm"""
    try:
        # Check if algorithm exists
        algorithm = db.query(Algorithm).filter(Algorithm.id == algorithm_id).first()
        if not algorithm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Algorithm not found"
            )
        
        # Get top-level comments (no parent)
        comments = db.query(AlgorithmComment).options(
            joinedload(AlgorithmComment.user),
            joinedload(AlgorithmComment.replies).joinedload(AlgorithmComment.user)
        ).filter(
            AlgorithmComment.algorithm_id == algorithm_id,
            AlgorithmComment.parent_id.is_(None)
        ).order_by(AlgorithmComment.created_at.desc()).all()
        
        return [format_algorithm_comment(comment) for comment in comments]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching comments for algorithm {algorithm_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch comments")

@router.post("/algorithm/{algorithm_id}", response_model=ShowAlgorithmComment, status_code=status.HTTP_201_CREATED)
def create_algorithm_comment(
    algorithm_id: int,
    request: AddAlgorithmComment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new comment on an algorithm"""
    try:
        # Check if algorithm exists
        algorithm = db.query(Algorithm).filter(Algorithm.id == algorithm_id).first()
        if not algorithm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Algorithm not found"
            )
        
        # If parent_id is provided, check if parent comment exists
        if request.parent_id:
            parent_comment = db.query(AlgorithmComment).filter(
                AlgorithmComment.id == request.parent_id,
                AlgorithmComment.algorithm_id == algorithm_id
            ).first()
            if not parent_comment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent comment not found"
                )
        
        # Create new comment
        comment = AlgorithmComment(
            algorithm_id=algorithm_id,
            user_id=current_user.id,
            content=request.content,
            parent_id=request.parent_id
        )
        
        db.add(comment)
        db.commit()
        db.refresh(comment)
        
        # Load user relationship
        comment = db.query(AlgorithmComment).options(
            joinedload(AlgorithmComment.user)
        ).filter(AlgorithmComment.id == comment.id).first()
        
        return format_algorithm_comment(comment)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating algorithm comment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create comment")

@router.put("/algorithm/{comment_id}", response_model=ShowAlgorithmComment)
def update_algorithm_comment(
    comment_id: int,
    request: UpdateAlgorithmComment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an algorithm comment (only by the author)"""
    try:
        comment = db.query(AlgorithmComment).options(
            joinedload(AlgorithmComment.user)
        ).filter(AlgorithmComment.id == comment_id).first()
        
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
        
        return format_algorithm_comment(comment)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating algorithm comment {comment_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update comment")

@router.delete("/algorithm/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_algorithm_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an algorithm comment (only by the author or admin)"""
    try:
        comment = db.query(AlgorithmComment).filter(AlgorithmComment.id == comment_id).first()
        
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
        replies = db.query(AlgorithmComment).filter(AlgorithmComment.parent_id == comment_id).all()
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
        logger.error(f"Error deleting algorithm comment {comment_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete comment")

def format_algorithm_comment(comment: AlgorithmComment) -> dict:
    """Format algorithm comment for API response"""
    return {
        "id": comment.id,
        "algorithm_id": comment.algorithm_id,
        "user_id": comment.user_id,
        "content": comment.content,
        "parent_id": comment.parent_id,
        "created_at": comment.created_at,
        "updated_at": comment.updated_at,
        "is_edited": comment.is_edited,
        "likes": comment.likes or 0,
        "author_name": comment.user.name if comment.user else "Unknown",
        "replies": [format_algorithm_comment(reply) for reply in comment.replies] if hasattr(comment, 'replies') and comment.replies else []
    }