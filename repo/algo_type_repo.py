from fastapi import HTTPException
from sqlalchemy.orm import Session
from models import AlgorithmType

def get_algo_type_by_id(db: Session, type_id: int):
    algo_type = db.query(AlgorithmType).filter(AlgorithmType.id == type_id).first()
    if not algo_type:
        raise HTTPException(status_code=404, detail="Algorithm type not found")
    return algo_type

def get_algo_type_by_name(db: Session, name: str):
    algo_type = db.query(AlgorithmType).filter(AlgorithmType.name == name).first()
    if not algo_type:
        raise HTTPException(status_code=404, detail="Algorithm type not found")
    return algo_type

def get_all_algo_types(db: Session):
    algo_types = db.query(AlgorithmType).all()
    return algo_types

def create_algo_type(db: Session, algo_type):
    db.add(algo_type)
    db.commit()
    db.refresh(algo_type)
    return algo_type

def update_algo_type(db: Session, type_id: int, algo_type):
    db_algo_type = get_algo_type_by_id(db, type_id)
    if not db_algo_type:
        raise HTTPException(status_code=404, detail="Algorithm type not found")
    
    db.query(AlgorithmType).filter(AlgorithmType.id == type_id).update(algo_type)
    db.commit()
    return get_algo_type_by_id(db, type_id)

def delete_algo_type(db: Session, type_id: int):
    db_algo_type = get_algo_type_by_id(db, type_id)
    if not db_algo_type:
        raise HTTPException(status_code=404, detail="Algorithm type not found")
    
    db.query(AlgorithmType).filter(AlgorithmType.id == type_id).delete()
    db.commit()

