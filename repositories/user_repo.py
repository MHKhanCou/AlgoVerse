from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from models import User, Blog, UserProgress, RelatedProblem, AlgoStatus
from schemas import RegisterUser, UpdateUser, UpdatePassword, UpdateName, UpdateEmail, ShowUser, UserProfile
from auth.password_utils import hash_password, verify_password, validate_password
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def get_user_by_id(db: Session, user_id: int):
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail=f"User with id {user_id} not found")
        return user
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch user")

def if_exists(db: Session, user_id: int):
    return get_user_by_id(db, user_id)

def get_user_by_email(db: Session, email: str):
    try:
        return db.query(User).filter(User.email == email).first()
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching user by email {email}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch user")

def get_all_users(db: Session):
    try:
        return db.query(User).all()
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching all users: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch users")

def is_email_taken(db: Session, email: str, exclude_id: int = None):
    try:
        query = db.query(User).filter(User.email == email)
        if exclude_id is not None:
            query = query.filter(User.id != exclude_id)
        return query.first() is not None
    except SQLAlchemyError as e:
        logger.error(f"Database error checking email {email}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check email")

def is_name_taken(db: Session, name: str, exclude_id: int = None):
    try:
        query = db.query(User).filter(User.name == name)
        if exclude_id is not None:
            query = query.filter(User.id != exclude_id)
        return query.first() is not None
    except SQLAlchemyError as e:
        logger.error(f"Database error checking name {name}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check name")

def get_user_profile(db: Session, user_id: int):
    try:
        user = db.query(User).options(
            joinedload(User.user_progress).joinedload(UserProgress.algorithm)
        ).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail=f"User with id {user_id} not found")
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,  # Pydantic coerces to EmailStr
            "codeforces_handle": user.codeforces_handle,
            "progress": [
                {
                    "algorithm_name": p.algorithm_name or "Unknown",
                    "status": p.status
                }
                for p in user.user_progress
                if p.status in [AlgoStatus.enrolled, AlgoStatus.completed]
            ]
        }
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching profile for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch user profile")
    except Exception as e:
        logger.error(f"Unexpected error fetching profile for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def create_user(db: Session, user_data: RegisterUser):
    try:
        if is_email_taken(db, user_data.email):
            raise HTTPException(status_code=400, detail="Email already registered")
        if is_name_taken(db, user_data.name):
            raise HTTPException(status_code=400, detail="Username already taken")
        try:
            validate_password(user_data.password)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        new_user = User(
            name=user_data.name,
            email=user_data.email,
            password=hash_password(user_data.password),
            joined_at=datetime.utcnow()
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating user: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create user")
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating user: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def update_user(db: Session, user_id: int, user_data: UpdateUser):
    try:
        user = get_user_by_id(db, user_id)
        if user_data.name is not None:
            if is_name_taken(db, user_data.name, exclude_id=user_id):
                raise HTTPException(status_code=400, detail="Username already taken")
            user.name = user_data.name
        if user_data.email is not None:
            if is_email_taken(db, user_data.email, exclude_id=user_id):
                raise HTTPException(status_code=400, detail="Email already in use")
            user.email = user_data.email
        if user_data.codeforces_handle is not None:
            user.codeforces_handle = user_data.codeforces_handle
        db.commit()
        db.refresh(user)
        return user
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update user")
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def update_name(db: Session, user_id: int, name_data: UpdateName):
    try:
        user = get_user_by_id(db, user_id)
        if is_name_taken(db, name_data.name, exclude_id=user_id):
            raise HTTPException(status_code=400, detail="Username already taken")
        user.name = name_data.name
        db.commit()
        db.refresh(user)
        return user
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating name for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update name")
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating name for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def update_password(db: Session, user_id: int, password_data: UpdatePassword):
    try:
        user = get_user_by_id(db, user_id)
        if not verify_password(password_data.old_password, user.password):
            raise HTTPException(status_code=400, detail="Incorrect old password")
        if password_data.old_password == password_data.new_password:
            raise HTTPException(status_code=400, detail="New password must be different")
        try:
            validate_password(password_data.new_password)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        user.password = hash_password(password_data.new_password)
        db.commit()
        db.refresh(user)
        return user
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating password for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update password")
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating password for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def delete_user(db: Session, user_id: int):
    try:
        user = get_user_by_id(db, user_id)

        # Delete associated user progress
        db.query(UserProgress).filter(UserProgress.user_id == user_id).delete()

        # Delete associated blogs
        db.query(Blog).filter(Blog.user_id == user_id).delete()

        # Nullify creator and approver fields in related problems
        db.query(RelatedProblem).filter(RelatedProblem.created_by == user_id).update({"created_by": None})
        db.query(RelatedProblem).filter(RelatedProblem.approved_by == user_id).update({"approved_by": None})

        db.delete(user)
        db.commit()
        return {"detail": f"User {user_id} and all associated data deleted successfully"}
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error deleting user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete user")
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error deleting user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def update_email(db: Session, user_id: int, email_data: UpdateEmail):
    try:
        user = get_user_by_id(db, user_id)
        if is_email_taken(db, email_data.email, exclude_id=user_id):
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = email_data.email
        db.commit()
        db.refresh(user)
        return user
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating email for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update email")
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating email for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")