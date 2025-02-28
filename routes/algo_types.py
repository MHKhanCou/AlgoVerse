from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from db import get_db  
from repositories import algo_types_repo
from middleware.admin_dependencies import get_current_admin

router = APIRouter(prefix="/algo-type", tags=["Algorithm Types"])

@router.post("/", response_model=schemas.ShowAlgorithmType)
def add(
    request: schemas.AddAlgorithmType, 
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)  # Add admin check
):
    return algo_types_repo.create(db, request)

@router.put("/{id}", response_model=schemas.ShowAlgorithmType)
def update(
    id: int, 
    request: schemas.UpdateAlgorithmType, 
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)  # Add admin check
):
    return algo_types_repo.update(db, id, request)

@router.get("/", response_model=List[schemas.ShowAlgorithmType])
def all(db: Session = Depends(get_db)):
    return algo_types_repo.get_all(db)

@router.get("/{id}", response_model=schemas.ShowAlgorithmType)
def show(id: int, db: Session = Depends(get_db)):
    return algo_types_repo.get_type_by_id(db, id)

@router.delete("/{id}", response_model=dict)
def delete(
    id: int, 
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)  # Add admin check
):
    algo_types_repo.delete_type(db, id)
    return {"message": "Algorithm type deleted successfully"}
