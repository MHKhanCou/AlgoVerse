from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session
import models 
from db import get_db
from .jwt_token import verify_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")  # Update tokenUrl to match new route

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        email = verify_access_token(token)
        if not email:
            raise credentials_exception
            
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            raise credentials_exception
            
        return user
    except JWTError:
        raise credentials_exception
    
