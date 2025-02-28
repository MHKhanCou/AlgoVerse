from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from db import get_db  
from repositories import algo_repo
from middleware.admin_dependencies import get_current_admin  # Updated import path

router = APIRouter(prefix="/algorithm", tags=["Algorithm"])

@router.post("/", response_model=schemas.ShowAlgorithm)
def add(
    request: schemas.AddAlgorithm, 
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)  # Add admin check
):
    try:
        return algo_repo.create(db, request.dict())
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/{id}", response_model=schemas.ShowAlgorithm)
def update(
    id: int, 
    request: schemas.UpdateAlgorithm, 
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)  # Add admin check
):
    return algo_repo.update(db, id, request.dict())

@router.get("/", response_model=List[schemas.ShowAlgorithm])
def all(db: Session = Depends(get_db)):
    return algo_repo.get_all(db)

@router.get("/{id}", response_model=schemas.ShowAlgorithm)
def show(id: int, db: Session = Depends(get_db)):
    return algo_repo.get_algo_by_id(db, id)

@router.delete("/{id}", response_model=dict)
def delete(
    id: int, 
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)  # Add admin check
):
    algo_repo.delete(db, id)
    return {"message": "Algorithm deleted successfully"}
