from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import get_db

router = APIRouter(prefix="/algorithm", tags=["Algorithm"])

@router.post("/", response_model=schemas.ShowAlgorithm)
def add(request: schemas.AddAlgorithm, db: Session = Depends(get_db)):
    algo = models.Algorithm(
        name=request.name,
        description=request.description,
        difficulty=request.difficulty,
        complexity=request.complexity,
        type_id=request.type_id
    )
    db.add(algo)
    db.commit()
    db.refresh(algo)
    return algo

@router.put("/{id}", response_model=dict)
def update(id: int, request: schemas.UpdateAlgorithm, db: Session = Depends(get_db)):
    algo_query = db.query(models.Algorithm).filter(models.Algorithm.id == id)
    if not algo_query.first():
        raise HTTPException(status_code=404, detail="Algorithm not found")
    algo_query.update({
        models.Algorithm.name: request.name,
        models.Algorithm.description: request.description,
        models.Algorithm.difficulty: request.difficulty,
        models.Algorithm.complexity: request.complexity,
        models.Algorithm.type_id: request.type_id
    })
    db.commit()
    return {"message": "Algorithm updated successfully"}

@router.get("/", response_model=List[schemas.ShowAlgorithm])
def all(db: Session = Depends(get_db)):
    algos = db.query(models.Algorithm).all()
    return algos

@router.get("/{id}", response_model=schemas.ShowAlgorithm)
def show(id: int, db: Session = Depends(get_db)):
    algo = db.query(models.Algorithm).filter(models.Algorithm.id == id).first()
    if not algo:
        raise HTTPException(status_code=404, detail="Algorithm not found")
    return algo

@router.delete("/{id}", response_model=dict)
def delete(id: int, db: Session = Depends(get_db)):
    algo = db.query(models.Algorithm).filter(models.Algorithm.id == id).first()
    if not algo:
        raise HTTPException(status_code=404, detail="Algorithm not found")
    db.delete(algo)
    db.commit()
    return {"message": "Algorithm deleted successfully"}
