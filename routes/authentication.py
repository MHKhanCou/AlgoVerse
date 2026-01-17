from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import EmailStr
from auth.email_utils import generate_token, generate_otp, send_verification_email, send_verification_otp_email, send_password_reset_email, send_password_reset_otp_email, get_token_expiry_time, is_token_expired
from auth.cleanup_users import cleanup_expired_unverified_users, cleanup_expired_otps, get_unverified_user_stats
from repositories import user_repo
from repositories.user_repo import get_user_by_email
import schemas, models
from db import get_db  
from auth.password_utils import hash_password, verify_password
from auth.jwt_token import create_access_token  
from datetime import datetime
import logging

router = APIRouter(tags=["Authentication"])

logger = logging.getLogger(__name__)

# Regular user login
@router.post("/login", response_model=schemas.Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    logger.info(f"Login attempt for email: {form_data.username}")
    
    user = get_user_by_email(db, form_data.username)
    
    if not user:
        logger.warning(f"User not found: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    logger.info(f"User found: {user.email}, verified: {user.is_verified}")
    
    try:
        password_ok = verify_password(form_data.password, user.password)
        logger.info(f"Password verification result: {password_ok}")
    except Exception as e:
        logger.exception("Password verification failed")
        password_ok = False
    
    if not password_ok:
        logger.warning(f"Password verification failed for: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Allow unverified users to login (they can browse the site)
    # Email verification is optional for basic access
    logger.info(f"User login successful: {form_data.username}, verified: {user.is_verified}")
        
    try:
        access_token = create_access_token(data={"sub": user.email})
        logger.info(f"Token created successfully for: {form_data.username}")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Token creation failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create access token",
        )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "is_admin": user.is_admin,
            "is_verified": user.is_verified  # Include verification status
        }
    }

# Admin login  
@router.post("/admin/login", response_model=schemas.Token)
async def admin_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = get_user_by_email(db, form_data.username)
    try:
        password_ok = bool(user) and verify_password(form_data.password, user.password)
    except Exception as e:
        logger.exception("Password verification failed")
        password_ok = False
    if not password_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is admin
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    
    # Admins must have verified email
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admins must verify their email address before logging in. Check your email for the verification code.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        access_token = create_access_token(data={"sub": user.email})
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Token creation failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create access token",
        )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "is_admin": user.is_admin
        }
    }

@router.post("/register", response_model=schemas.APIResponse)
async def register(request: schemas.RegisterUser, db: Session = Depends(get_db), background_tasks: BackgroundTasks = BackgroundTasks()):
    # Check if user already exists
    existing_user = get_user_by_email(db, request.email)
    if existing_user:
        # If user exists and is not verified, we can resend OTP
        if not existing_user.is_verified:
            # Generate a new OTP and update expiry
            new_otp = generate_otp(6)
            existing_user.verification_token = new_otp
            existing_user.reset_token_expires = get_token_expiry_time(10) # 10-minute expiry
            db.commit()

            # Add email sending to background tasks
            background_tasks.add_task(send_verification_otp_email, existing_user.email, existing_user.name, new_otp)
            
            return {
                "success": True,
                "email_sent": True,
                "message": f"This email is already registered but not verified. A new verification code has been sent to {existing_user.email}.",
                "data": {
                    "user_id": existing_user.id,
                    "email": existing_user.email,
                    "otp_expires_in": 10
                }
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists and is verified."
            )

    # Generate verification OTP code (6 digits)
    verification_otp = generate_otp(6)
    otp_expires = get_token_expiry_time(10)  # 10 minutes expiry for OTP
    
    # Create user with verification OTP
    hashed_password = hash_password(request.password)
    user = models.User(
        name=request.name,
        email=request.email,
        password=hashed_password,
        verification_token=verification_otp,  # Store OTP in same field
        reset_token_expires=otp_expires,  # Use this field for OTP expiry
        is_verified=False
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Add email sending to background tasks (non-blocking)
    try:
        background_tasks.add_task(send_verification_otp_email, user.email, user.name, verification_otp)
        email_status = "sent"
        email_message = f"A 6-digit verification code has been sent to {user.email}."
    except Exception as e:
        email_status = "failed"
        email_message = "Verification email could not be sent. You can verify your email later from profile settings."
        logger.error(f"Failed to send verification email to {user.email}: {e}")
    
    # Return success immediately, don't wait for email
    return {
        "success": True,
        "email_sent": email_status == "sent",
        "message": f"Registration successful! {email_message} The code will expire in 10 minutes.",
        "data": {
            "user_id": user.id,
            "email": user.email,
            "otp_expires_in": 10,  # minutes
            "requires_verification": False  # Allow browsing without verification
        }
    }


# Email verification endpoint (now handles OTP)
@router.post("/verify-email", response_model=schemas.APIResponse)
def verify_email(request: schemas.EmailVerification, db: Session = Depends(get_db)):
    # Find user with the verification token (now OTP)
    user = db.query(models.User).filter(models.User.verification_token == request.token).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please check the code and try again."
        )
    
    if user.is_verified:
        return {
            "success": True,
            "message": "Email address is already verified",
            "data": None
        }
    
    # Check if OTP has expired (using reset_token_expires field)
    if user.reset_token_expires and is_token_expired(user.reset_token_expires):
        # Clear expired OTP
        user.verification_token = None
        user.reset_token_expires = None
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code."
        )
    
    # Mark user as verified and clear the OTP
    user.is_verified = True
    user.verification_token = None
    user.reset_token_expires = None
    db.commit()
    
    return {
        "success": True,
        "message": "Email verified successfully! You can now log in.",
        "data": {
            "user_id": user.id,
            "email": user.email
        }
    }

# Resend verification OTP
@router.post("/resend-verification", response_model=schemas.APIResponse)
def resend_verification(request: schemas.ResendVerification, db: Session = Depends(get_db)):
    user = get_user_by_email(db, request.email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address"
        )
    
    if user.is_verified:
        return {
            "success": True,
            "message": "Email address is already verified",
            "data": None
        }
    
    # Generate new verification OTP
    verification_otp = generate_otp(6)
    otp_expires = get_token_expiry_time(10)  # 10 minutes expiry
    
    user.verification_token = verification_otp
    user.reset_token_expires = otp_expires
    db.commit()
    
    # Send verification email with new OTP
    if send_verification_otp_email(user.email, user.name, verification_otp):
        return {
            "success": True,
            "message": f"New verification code sent to {user.email}! The code will expire in 10 minutes.",
            "data": {
                "otp_expires_in": 10
            }
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email. Please try again later."
        )

# Forgot password endpoint (now uses OTP)
@router.post("/forgot-password", response_model=schemas.APIResponse)
def forgot_password(request: schemas.ForgotPassword, db: Session = Depends(get_db)):
    user = get_user_by_email(db, request.email)
    
    if not user:
        # Don't reveal that the user doesn't exist for security reasons
        return {
            "success": True,
            "message": "If an account with this email exists, a 6-digit reset code has been sent.",
            "data": None
        }
    
    # Generate password reset OTP (6 digits)
    reset_otp = generate_otp(6)
    reset_expires = get_token_expiry_time(10)  # 10 minutes expiry for OTP
    
    user.reset_token = reset_otp
    user.reset_token_expires = reset_expires
    db.commit()
    
    # Send password reset email with OTP
    if send_password_reset_otp_email(user.email, user.name, reset_otp):
        return {
            "success": True,
            "message": "If an account with this email exists, a 6-digit reset code has been sent. The code will expire in 10 minutes.",
            "data": {
                "otp_expires_in": 10
            }
        }
    else:
        return {
            "success": True,
            "message": "If an account with this email exists, a 6-digit reset code has been sent.",
            "data": None
        }

# Reset password endpoint
@router.post("/reset-password", response_model=schemas.APIResponse)
def reset_password(request: schemas.ResetPassword, db: Session = Depends(get_db)):
    # Find user with the reset token
    user = db.query(models.User).filter(models.User.reset_token == request.token).first()
    
    if not user or not user.reset_token_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token"
        )
    
    # Check if token has expired
    if is_token_expired(user.reset_token_expires):
        # Clear expired token
        user.reset_token = None
        user.reset_token_expires = None
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token has expired. Please request a new one."
        )
    
    # Update password and clear reset token
    user.password = hash_password(request.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    
    # Also mark user as verified if they reset password successfully
    if not user.is_verified:
        user.is_verified = True
        user.verification_token = None
    
    db.commit()
    
    return {
        "success": True,
        "message": "Password reset successfully! You can now log in with your new password.",
        "data": {
            "user_id": user.id,
            "email": user.email
        }
    }

# Admin endpoint - Get user statistics
@router.get("/admin/user-stats", response_model=schemas.APIResponse)
def get_user_statistics(db: Session = Depends(get_db)):
    """Get statistics about verified and unverified users (Admin only)"""
    try:
        stats = get_unverified_user_stats(db)
        
        # Add total verified users count
        verified_users = db.query(models.User).filter(
            models.User.is_verified == True
        ).count()
        
        stats["total_verified"] = verified_users
        stats["total_users"] = verified_users + stats.get("total_unverified", 0)
        
        return {
            "success": True,
            "message": "User statistics retrieved successfully",
            "data": stats
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user statistics: {str(e)}"
        )

# Admin endpoint - Clean expired OTPs
@router.post("/admin/cleanup-otps", response_model=schemas.APIResponse)
def cleanup_otps(db: Session = Depends(get_db)):
    """Clean up expired OTP codes without deleting users (Admin only)"""
    try:
        result = cleanup_expired_otps(db)
        
        if result["success"]:
            return {
                "success": True,
                "message": f"Successfully cleaned {result['cleaned_count']} expired OTP codes",
                "data": result
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Unknown error occurred")
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cleanup OTPs: {str(e)}"
        )

# Admin endpoint - Clean unverified users
@router.post("/admin/cleanup-users", response_model=schemas.APIResponse)
def cleanup_users(max_age_hours: int = 24, db: Session = Depends(get_db)):
    """Clean up unverified users older than specified hours (Admin only)"""
    try:
        result = cleanup_expired_unverified_users(db, max_age_hours)
        
        if result["success"]:
            return {
                "success": True,
                "message": f"Successfully deleted {result['deleted_count']} unverified users older than {max_age_hours} hours",
                "data": result
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Unknown error occurred")
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cleanup users: {str(e)}"
        )
