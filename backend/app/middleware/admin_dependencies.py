from fastapi import Depends, HTTPException, status
from ..auth.oauth2 import get_current_user
from ..models import User

async def get_current_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user