from fastapi import HTTPException
from sqlalchemy.orm import Session
from models import User
from datetime import datetime
from auth.password_utils import hash_password, verify_password, validate_password

# 🔹 Check if user exists
def if_exists(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def get_by_email(db: Session, email: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# 🔹 Check if an email is already used
def is_email_used(db: Session, email: str) -> bool:
    return db.query(User).filter(User.email == email).first() is not None

# 🔹 Check if a username is already used
def is_name_used(db: Session, name: str) -> bool:
    return db.query(User).filter(User.name == name).first() is not None

def get_all(db: Session):
    try:
        users = db.query(User).all()
        return users
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving users: {str(e)}"
        )

# 🔹 Get user profile with progress
def get_profile(db: Session, user_id: int):
    user = if_exists(db, user_id)
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "progress": [{"algorithm": p.algorithm.name, "status": p.status.value} for p in user.user_progress]
    }

# 🔹 Create a new user
def create(request, db: Session):
    if is_email_used(db, request.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if is_name_used(db, request.name):
        raise HTTPException(status_code=400, detail="Username already taken")

    try:
        validate_password(request.password)	    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    new_user = User(
        name=request.name,
        email=request.email,
        password=hash_password(request.password),
        joined_at=datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# 🔹 Update user attributes (name, email)
def update(db: Session, user_id: int, update_data: dict):
    user = if_exists(db, user_id)

    if is_email_used(db, update_data["email"]):
            raise HTTPException(status_code=400, detail="Email already in use")

    if is_name_used(db, update_data["name"]):
            raise HTTPException(status_code=400, detail="Username already taken")

    db.query(User).filter(User.id == user_id).update(update_data)
    db.commit()
    return user

# 🔹 Change Password
def update_password(db: Session, user_id: int, old_password: str, new_password: str):
    user = if_exists(db, user_id)

    if not verify_password(old_password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect old password")

    if old_password == new_password:
        raise HTTPException(status_code=400, detail="New password must be different")

    validate_password(new_password)

    db.query(User).filter(User.id == user_id).update({"password": hash_password(new_password)})
    db.commit()

# change email
def update_email(db: Session, user_id: int, old_email: str, new_email: str):
    user = if_exists(db, user_id)

    if old_email != user.email:
        raise HTTPException(status_code=400, detail="Incorrect old email")
    
    if is_email_used(db, new_email):
        raise HTTPException(status_code=400, detail="Email already in use")

    db.query(User).filter(User.id == user_id).update({"email": new_email})
    db.commit()
    return user