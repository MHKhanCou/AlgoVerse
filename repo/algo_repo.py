from fastapi import HTTPException
from sqlalchemy.orm import Session
from models import Algorithm

def get_algo_by_id(db: Session, algo_id: int):
    algorithm = db.query(Algorithm).filter(Algorithm.id == algo_id).first()
    if not algorithm:
        raise HTTPException(status_code=404, detail="Algorithm not found")
    return algorithm

def get_algo_name(db: Session, algo_id: int):
    return get_algo_by_id(db: Session, algo_id: int).name

def get_all_algos(db: Session):
    algorithms = db.query(Algorithm).all()
    return algorithms

def create_algorithm(db: Session, algorithm):
    db.add(algorithm)
    db.commit()
    db.refresh(algorithm)
    return algorithm

def update_algorithm(db: Session, algo_id: int, algorithm_data: dict):
    algorithm = db.query(Algorithm).filter(Algorithm.id == algo_id)
    if not algorithm.first():
        raise HTTPException(status_code=404, detail="Algorithm not found")
    algorithm.update(algorithm_data)
    db.commit()
    return algorithm.first()

def delete_algorithm(db: Session, algo_id: int):
    algorithm = db.query(Algorithm).filter(Algorithm.id == algo_id)
    if not algorithm.first():
        raise HTTPException(status_code=404, detail="Algorithm not found")
    algorithm.delete()
    db.commit()

