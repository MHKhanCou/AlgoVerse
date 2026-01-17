from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from db import get_db
from repositories.user_repo import get_user_by_email
import schemas
from jose import JWTError, jwt
from .jwt_token import SECRET_KEY, ALGORITHM, verify_access_token
from os import getenv
from dotenv import load_dotenv

load_dotenv()

# Get the base URL from environment
BASE_URL = getenv("BASE_URL", "")
# Use relative path if BASE_URL is not set, otherwise use full URL
token_url = f"{BASE_URL}/login" if BASE_URL else "/login"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=token_url)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        email = verify_access_token(token)
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
        
    user = get_user_by_email(db, token_data.email)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user
    
