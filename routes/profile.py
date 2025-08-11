from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from models import User, AlgoDifficulty, AlgoComplexity, AlgoStatus
from schemas import (
    ShowUser,
    UpdatePassword,
    UpdateEmail,
    UpdateUser,
    Token,
    ShowBlog,
    ShowUserProgress,
    RequestEmailOtp,
    VerifyEmailOtp,
)
from db import get_db
from auth.oauth2 import get_current_user
from repositories import user_repo, user_progress_repo, blog_repo
from auth.jwt_token import create_access_token
from auth.email_utils import (
    generate_otp,
    send_verification_otp_email,
    get_token_expiry_time,
    is_token_expired,
)
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.get("/me", response_model=ShowUser)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return user_repo.get_user_by_id(db, current_user.id)
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching profile for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch profile")
    except Exception as e:
        logger.error(f"Unexpected error fetching profile for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/update-password", response_model=ShowUser)
def change_password(
    password_data: UpdatePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return user_repo.update_password(db, current_user.id, password_data)
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating password for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update password")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating password for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/update-email", response_model=Token)
def change_email(
    email_data: UpdateEmail,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Prevent no-op updates
        if email_data.email == current_user.email:
            raise HTTPException(status_code=400, detail="New email is the same as current email")
        updated_user = user_repo.update_email(db, current_user.id, email_data)
        access_token = create_access_token(data={"sub": updated_user.email})
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating email for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update email")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating email for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# --- OTP-based Email Change Flow ---
@router.post("/request-email-otp", response_model=dict)
def request_email_otp(
    payload: RequestEmailOtp,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Step 1: User provides a new email. We generate a 6-digit OTP, store it on the user along with
    an expiry, and temporarily store the target email in reset_token. OTP is emailed to the new email.
    """
    try:
        new_email = payload.email

        # Same email check
        if new_email == current_user.email:
            raise HTTPException(status_code=400, detail="New email is the same as current email")

        # Check if taken by another account
        if user_repo.is_email_taken(db, new_email, exclude_id=current_user.id):
            raise HTTPException(status_code=400, detail="Email already in use")

        # Generate OTP and expiry (10 minutes)
        otp = generate_otp(6)
        expires_at = get_token_expiry_time(10)

        # Persist on current user: reuse fields for OTP flows
        user = user_repo.get_user_by_id(db, current_user.id)
        user.verification_token = otp  # store OTP
        user.reset_token = new_email   # temporarily store pending new email
        user.reset_token_expires = expires_at
        db.commit()

        # Send OTP to the NEW email to prove ownership
        send_verification_otp_email(new_email, user.name or "", otp)

        return {"message": f"Verification code sent to {new_email}", "otp_expires_in": 10}
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error requesting email OTP for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process OTP request")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error requesting email OTP for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/verify-email-otp", response_model=Token)
def verify_email_otp(
    payload: VerifyEmailOtp,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Step 2: User submits the OTP. If valid and not expired, update the email to the target stored
    in reset_token, issue a fresh access token, and clear temporary fields.
    """
    try:
        user = user_repo.get_user_by_id(db, current_user.id)

        # Sanity checks
        if not user.verification_token or not user.reset_token_expires or not user.reset_token:
            raise HTTPException(status_code=400, detail="No pending email change request")

        # Ensure the email being verified matches the pending one
        if payload.email != user.reset_token:
            raise HTTPException(status_code=400, detail="Email does not match pending request")

        # Verify OTP
        if is_token_expired(user.reset_token_expires):
            # Clear pending state
            user.verification_token = None
            user.reset_token = None
            user.reset_token_expires = None
            db.commit()
            raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new code.")

        if payload.otp != user.verification_token:
            raise HTTPException(status_code=400, detail="Invalid verification code")

        # Same email check (defensive)
        if user.reset_token == user.email:
            # Clear pending state
            user.verification_token = None
            user.reset_token = None
            user.reset_token_expires = None
            db.commit()
            raise HTTPException(status_code=400, detail="New email is the same as current email")

        # Check if taken by another account (exclude current)
        if user_repo.is_email_taken(db, user.reset_token, exclude_id=user.id):
            # Clear pending state (avoid reuse of leaked OTP)
            user.verification_token = None
            user.reset_token = None
            user.reset_token_expires = None
            db.commit()
            raise HTTPException(status_code=400, detail="Email already in use")

        # Perform the update
        final_email = user.reset_token
        user.email = final_email
        # Clear pending state
        user.verification_token = None
        user.reset_token = None
        user.reset_token_expires = None
        db.commit()

        access_token = create_access_token(data={"sub": final_email})
        return {
            "access_token": access_token,
            "token_type": "bearer",
        }
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error verifying email OTP for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to verify email OTP")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error verifying email OTP for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/update", response_model=ShowUser)
def update_profile(
    user_data: UpdateUser,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return user_repo.update_user(db, current_user.id, user_data)
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating profile for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update profile")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating profile for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/delete", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Delete all UserProgress records
        user_progress_repo.delete_by_user(db, current_user.id)
        # Delete all Blog records (assuming blog_repo has delete_by_user)
        blog_repo.delete_by_user(db, current_user.id)
        # Delete the user
        user_repo.delete_user(db, current_user.id)
        return None
    except HTTPException as e:
        db.rollback()
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error deleting profile for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete profile")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error deleting profile for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/my-blogs", response_model=List[ShowBlog])
def get_my_blogs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0, description="Number of blogs to skip"),
    limit: int = Query(5, ge=1, le=100, description="Number of blogs to return"),
    include_unapproved: bool = Query(False, description="Include unapproved blogs for the current user"),
    status_filter: Optional[str] = Query(None, description="Filter by status: approved | pending | rejected | unapproved")
):
    try:
        return blog_repo.get_user_blogs(
            db,
            current_user.id,
            skip=skip,
            limit=limit,
            include_unapproved=include_unapproved,
            status_filter=status_filter
        )
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching blogs for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch blogs")
    except Exception as e:
        logger.error(f"Unexpected error fetching blogs for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/my-progress", response_model=List[ShowUserProgress])
def get_my_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return user_progress_repo.get_progress_by_userid(db, current_user.id)
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching progress for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch progress")
    except Exception as e:
        logger.error(f"Unexpected error fetching progress for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/stats", response_model=dict)
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return user_progress_repo.get_detailed_user_stats(db, current_user.id)
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching stats for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch stats")
    except Exception as e:
        logger.error(f"Unexpected error fetching stats for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")