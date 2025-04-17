from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from db import get_db  
from repositories import algo_types_repo
from middleware.admin_dependencies import get_current_admin

router = APIRouter(prefix="/algo-type", tags=["Algorithm Types"])

@router.post("/", response_model=schemas.ShowAlgorithmType, status_code=status.HTTP_201_CREATED)
def create_algorithm_type(
    request: schemas.AddAlgorithmType, 
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    return algo_types_repo.create_algorithm_type(db, request)

@router.put("/{type_id}", response_model=schemas.ShowAlgorithmType)
def update_algorithm_type(
    type_id: int, 
    request: schemas.UpdateAlgorithmType, 
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    return algo_types_repo.update_algorithm_type(db, type_id, request)

@router.get("/", response_model=List[schemas.ShowAlgorithmType])
def get_all_algorithm_types(db: Session = Depends(get_db)):
    return algo_types_repo.get_all_algorithm_types(db)

@router.get("/{type_id}", response_model=schemas.ShowAlgorithmType)
def get_algorithm_type(type_id: int, db: Session = Depends(get_db)):
    return algo_types_repo.get_algorithm_type_by_id(db, type_id)

@router.delete("/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_algorithm_type(
    type_id: int, 
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    algo_types_repo.delete_algorithm_type(db, type_id)
    return None
