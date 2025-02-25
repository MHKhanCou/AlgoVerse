from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import get_db

router = APIRouter(prefix="/algo-type", tags=["Algorithm Types"])

@router.post("/", response_model=schemas.ShowAlgorithmType)
def add(request: schemas.AddAlgorithmType, db: Session = Depends(get_db)):
    algo_type = models.AlgorithmType(
        name=request.name,
        description=request.description
    )
    db.add(algo_type)
    db.commit()
    db.refresh(algo_type)
    return algo_type

@router.put("/{id}", response_model=dict)
def update(id: int, request: schemas.UpdateAlgorithmType, db: Session = Depends(get_db)):
    algo_type_query = db.query(models.AlgorithmType).filter(models.AlgorithmType.id == id)
    if not algo_type_query.first():
        raise HTTPException(status_code=404, detail="Algorithm type not found")
    algo_type_query.update({
        models.AlgorithmType.name: request.name,
        models.AlgorithmType.description: request.description
    })
    db.commit()
    return {"message": "Algorithm type updated successfully"}

@router.get("/", response_model=List[schemas.ShowAlgorithmType])
def all(db: Session = Depends(get_db)):
    algo_types = db.query(models.AlgorithmType).all()
    return algo_types

@router.get("/{id}", response_model=schemas.ShowAlgorithmType)
def show(id: int, db: Session = Depends(get_db)):
    algo_type = db.query(models.AlgorithmType).filter(models.AlgorithmType.id == id).first()
    if not algo_type:
        raise HTTPException(status_code=404, detail="Algorithm type not found")
    return algo_type

@router.delete("/{id}", response_model=dict)
def delete(id: int, db: Session = Depends(get_db)):
    algo_type = db.query(models.AlgorithmType).filter(models.AlgorithmType.id == id).first()
    if not algo_type:
        raise HTTPException(status_code=404, detail="Algorithm type not found")
    db.delete(algo_type)
    db.commit()
    return {"message": "Algorithm type deleted successfully"}