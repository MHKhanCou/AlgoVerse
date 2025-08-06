from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from db import get_db  
from auth.password_utils import hash_password, verify_password
from auth.jwt_token import create_access_token  
from auth.email_utils import generate_token, send_verification_email, send_password_reset_email, get_token_expiry_time, is_token_expired
from repositories import user_repo
from repositories.user_repo import get_user_by_email
import schemas, models
from datetime import datetime

router = APIRouter(tags=["Authentication"])

# Regular user login
@router.post("/login", response_model=schemas.Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if email is verified
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please verify your email address before logging in",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.email})
    
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

# Admin login  
@router.post("/admin/login", response_model=schemas.Token)
async def admin_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.password):
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
    
    # Check if email is verified
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please verify your email address before logging in",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.email})
    
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
def register(request: schemas.RegisterUser, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = get_user_by_email(db, request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    # Generate verification token
    verification_token = generate_token()
    
    # Create user with verification token
    hashed_password = hash_password(request.password)
    user = models.User(
        name=request.name,
        email=request.email,
        password=hashed_password,
        verification_token=verification_token,
        is_verified=False
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Send verification email
    if send_verification_email(user.email, user.name, verification_token):
        return {
            "success": True,
            "message": "Registration successful! Please check your email to verify your account.",
            "data": {
                "user_id": user.id,
                "email": user.email
            }
        }
    else:
        # If email sending fails, still return success but with different message
        return {
            "success": True,
            "message": "Registration successful! However, we couldn't send the verification email. Please contact support.",
            "data": {
                "user_id": user.id,
                "email": user.email
            }
        }

# Email verification endpoint
@router.post("/verify-email", response_model=schemas.APIResponse)
def verify_email(request: schemas.EmailVerification, db: Session = Depends(get_db)):
    # Find user with the verification token
    user = db.query(models.User).filter(models.User.verification_token == request.token).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    if user.is_verified:
        return {
            "success": True,
            "message": "Email address is already verified",
            "data": None
        }
    
    # Mark user as verified and clear the token
    user.is_verified = True
    user.verification_token = None
    db.commit()
    
    return {
        "success": True,
        "message": "Email verified successfully! You can now log in.",
        "data": {
            "user_id": user.id,
            "email": user.email
        }
    }

# Resend verification email
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
    
    # Generate new verification token
    verification_token = generate_token()
    user.verification_token = verification_token
    db.commit()
    
    # Send verification email
    if send_verification_email(user.email, user.name, verification_token):
        return {
            "success": True,
            "message": "Verification email sent successfully! Please check your email.",
            "data": None
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email. Please try again later."
        )

# Forgot password endpoint
@router.post("/forgot-password", response_model=schemas.APIResponse)
def forgot_password(request: schemas.ForgotPassword, db: Session = Depends(get_db)):
    user = get_user_by_email(db, request.email)
    
    if not user:
        # Don't reveal that the user doesn't exist for security reasons
        return {
            "success": True,
            "message": "If an account with this email exists, a password reset link has been sent.",
            "data": None
        }
    
    # Generate password reset token
    reset_token = generate_token()
    reset_expires = get_token_expiry_time(30)  # 30 minutes expiry
    
    user.reset_token = reset_token
    user.reset_token_expires = reset_expires
    db.commit()
    
    # Send password reset email
    if send_password_reset_email(user.email, user.name, reset_token):
        return {
            "success": True,
            "message": "If an account with this email exists, a password reset link has been sent.",
            "data": None
        }
    else:
        return {
            "success": True,
            "message": "If an account with this email exists, a password reset link has been sent.",
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
