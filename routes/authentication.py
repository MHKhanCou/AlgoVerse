from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from config import verify_password
from fastapi.security import OAuth2PasswordRequestForm
from . import JWTtoken

import models, schemas
from database import get_db
from repo.user_repo import get_user_by_email

router = APIRouter(prefix="/login", tags=["Authentication"])

@router.post("/")
def login(request: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_user_by_email(db, request.username)
    print(user)
    if not verify_password(request.password, user.password):
        raise HTTPException(status_code=404, detail="Invalid password")
    access_token = JWTtoken.create_access_token(data = {"sub" : user.email})
    return {"access_token": access_token, "token_type": "bearer"}
    