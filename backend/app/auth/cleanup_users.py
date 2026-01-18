"""
User cleanup utilities for AlgoVerse
Handles automatic cleanup of unverified users after OTP expiration
"""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ..db import get_db
from .. import models
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

def cleanup_expired_unverified_users(db: Session, max_age_hours: int = 24) -> Dict[str, int]:
    """
    Clean up unverified users whose OTP codes have expired
    
    Args:
        db: Database session
        max_age_hours: Maximum age in hours before unverified users are deleted (default: 24)
    
    Returns:
        Dict with cleanup statistics
    """
    try:
        # Calculate the cutoff time
        cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
        
        # Find unverified users whose OTP has expired and were created before cutoff
        unverified_users = db.query(models.User).filter(
            and_(
                models.User.is_verified == False,
                models.User.created_at < cutoff_time,
                # Either no expiry time set or expiry time has passed
                models.User.reset_token_expires < datetime.utcnow()
            )
        ).all()
        
        user_count = len(unverified_users)
        deleted_emails = []
        
        for user in unverified_users:
            deleted_emails.append(user.email)
            logger.info(f"Cleaning up unverified user: {user.email} (created: {user.created_at})")
            
            # Delete the user
            db.delete(user)
        
        # Commit the changes
        db.commit()
        
        logger.info(f"Successfully cleaned up {user_count} unverified users")
        
        return {
            "deleted_count": user_count,
            "deleted_emails": deleted_emails,
            "cutoff_time": cutoff_time.isoformat(),
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Error during user cleanup: {str(e)}")
        db.rollback()
        return {
            "deleted_count": 0,
            "deleted_emails": [],
            "error": str(e),
            "success": False
        }

def cleanup_expired_otps(db: Session) -> Dict[str, int]:
    """
    Clean up expired OTP codes from users (without deleting the users)
    This is useful for cleaning up expired codes while keeping the user accounts
    
    Args:
        db: Database session
    
    Returns:
        Dict with cleanup statistics
    """
    try:
        current_time = datetime.utcnow()
        
        # Find users with expired OTP codes
        users_with_expired_otps = db.query(models.User).filter(
            and_(
                models.User.verification_token.isnot(None),
                models.User.reset_token_expires < current_time
            )
        ).all()
        
        cleaned_count = 0
        
        for user in users_with_expired_otps:
            logger.info(f"Clearing expired OTP for user: {user.email}")
            user.verification_token = None
            user.reset_token_expires = None
            cleaned_count += 1
        
        # Commit the changes
        db.commit()
        
        logger.info(f"Successfully cleaned {cleaned_count} expired OTP codes")
        
        return {
            "cleaned_count": cleaned_count,
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Error during OTP cleanup: {str(e)}")
        db.rollback()
        return {
            "cleaned_count": 0,
            "error": str(e),
            "success": False
        }

def get_unverified_user_stats(db: Session) -> Dict[str, int]:
    """
    Get statistics about unverified users
    
    Args:
        db: Database session
    
    Returns:
        Dict with user statistics
    """
    try:
        current_time = datetime.utcnow()
        
        # Total unverified users
        total_unverified = db.query(models.User).filter(
            models.User.is_verified == False
        ).count()
        
        # Unverified users with active OTP (not expired)
        active_otp_count = db.query(models.User).filter(
            and_(
                models.User.is_verified == False,
                models.User.verification_token.isnot(None),
                models.User.reset_token_expires > current_time
            )
        ).count()
        
        # Unverified users with expired OTP
        expired_otp_count = db.query(models.User).filter(
            and_(
                models.User.is_verified == False,
                models.User.verification_token.isnot(None),
                models.User.reset_token_expires <= current_time
            )
        ).count()
        
        # Users older than 24 hours and still unverified
        cutoff_24h = current_time - timedelta(hours=24)
        old_unverified = db.query(models.User).filter(
            and_(
                models.User.is_verified == False,
                models.User.created_at < cutoff_24h
            )
        ).count()
        
        return {
            "total_unverified": total_unverified,
            "active_otp_count": active_otp_count,
            "expired_otp_count": expired_otp_count,
            "old_unverified_24h": old_unverified,
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Error getting user stats: {str(e)}")
        return {
            "error": str(e),
            "success": False
        }

# Convenience function to run cleanup from command line
def run_cleanup_job(max_age_hours: int = 24):
    """
    Run the cleanup job - can be called from a cron job or scheduler
    
    Args:
        max_age_hours: Maximum age in hours before unverified users are deleted
    """
    logger.info(f"Starting user cleanup job (max_age_hours: {max_age_hours})")
    
    db = next(get_db())
    
    try:
        # Get stats before cleanup
        stats_before = get_unverified_user_stats(db)
        logger.info(f"Stats before cleanup: {stats_before}")
        
        # Clean expired OTPs first
        otp_cleanup_result = cleanup_expired_otps(db)
        logger.info(f"OTP cleanup result: {otp_cleanup_result}")
        
        # Clean up old unverified users
        user_cleanup_result = cleanup_expired_unverified_users(db, max_age_hours)
        logger.info(f"User cleanup result: {user_cleanup_result}")
        
        # Get stats after cleanup
        stats_after = get_unverified_user_stats(db)
        logger.info(f"Stats after cleanup: {stats_after}")
        
        return {
            "stats_before": stats_before,
            "otp_cleanup": otp_cleanup_result,
            "user_cleanup": user_cleanup_result,
            "stats_after": stats_after,
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Error in cleanup job: {str(e)}")
        return {
            "error": str(e),
            "success": False
        }
    finally:
        db.close()

if __name__ == "__main__":
    # Run cleanup when script is executed directly
    logging.basicConfig(level=logging.INFO)
    result = run_cleanup_job()
    print(f"Cleanup job result: {result}")
