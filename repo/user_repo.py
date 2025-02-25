from fastapi import HTTPException
from sqlalchemy.orm import Session
from models import User

def get_user_by_id(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code = 404, detail = "user not found")
    return user

def get_user_by_email(db: Session, email: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code = 404, detail = "user not found")
    return user

def is_email_used(db: Session, email: str):
    user = db.query(User).filter(User.email == email).first()
    if user:
        raise HTTPException(status_code = 400, detail = "Email already registered")
    return user

def get_all_users(db: Session):
    users = db.query(User).all()
    return users

def create_user(db: Session, user):
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_user(db: Session, user_id: int, user):
    db.query(User).filter(User.id == user_id).update(user)
    db.commit()

def delete_user(db: Session, user_id: int):
    db.query(User).filter(User.id == user_id).delete()
    db.commit()

