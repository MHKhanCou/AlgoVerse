from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from config import check_email, check_username, hash_password, validate_password
from database import get_db

router = APIRouter(prefix="/users", tags=["User"])

@router.post("/", response_model=schemas.ShowUser)
def register(request: schemas.RegisterUser, db: Session = Depends(get_db)):
    if(check_username(request.name, db)):
        raise HTTPException(status_code=400, detail="Username already exists")
    if(check_email(request.email, db)):
        raise HTTPException(status_code=400, detail="Email already exists")
    try:
        validate_password(request.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    new = models.User(
        name=request.name,
        email=request.email,
        password=hash_password(request.password)
    )
    return new

@router.put("/{id}", response_model=dict)
def update(id: int, request: schemas.UpdateUser, db: Session = Depends(get_db)):
    user_query = db.query(models.User).filter(models.User.id == id)
    if not user_query.first():
        raise HTTPException(status_code=404, detail=f"User with ID = {id} not found")
    user_query.update({
        models.User.name: request.name,
        models.User.email: request.email
    })
    db.commit()
    return {"message": f"User with ID = {id} updated successfully"}

@router.get("/", response_model=List[schemas.ShowUser])
def all(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users

@router.get("/{id}", response_model=schemas.ShowUser)
def show(id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User with ID = {id} not found")
    return user

@router.delete("/{id}", response_model=dict)
def delete(id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User with ID = {id} not found")
    db.delete(user)
    db.commit()
    return {"message": f"User with ID = {id} deleted successfully"}
