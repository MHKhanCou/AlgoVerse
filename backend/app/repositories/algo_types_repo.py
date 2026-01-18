from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from ..models import AlgorithmType, Algorithm
from ..schemas import AddAlgorithmType, UpdateAlgorithmType
import logging

logger = logging.getLogger(__name__)

def is_algorithm_type_name_unique(db: Session, name: str, exclude_id: int = None):
    query = db.query(AlgorithmType).filter(AlgorithmType.name == name)
    if exclude_id:
        query = query.filter(AlgorithmType.id != exclude_id)
    return query.first() is None

def get_algorithm_type_by_id(db: Session, type_id: int):
    algo_type = db.query(AlgorithmType).filter(AlgorithmType.id == type_id).first()
    if not algo_type:
        raise HTTPException(status_code=404, detail="Algorithm type not found")
    return algo_type

def get_algorithm_type_by_name(db: Session, name: str):
    algo_type = db.query(AlgorithmType).filter(AlgorithmType.name == name).first()
    if not algo_type:
        raise HTTPException(status_code=404, detail="Algorithm type not found")
    return algo_type

def get_all_algorithm_types(db: Session):
    return db.query(AlgorithmType).all()

def create_algorithm_type(db: Session, algo_type: AddAlgorithmType):
    try:
        if not is_algorithm_type_name_unique(db, algo_type.name):
            raise HTTPException(status_code=400, detail="Algorithm type name already exists")
        
        db_algo_type = AlgorithmType(**algo_type.dict())
        db.add(db_algo_type)
        db.commit()
        db.refresh(db_algo_type)
        return db_algo_type
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating algorithm type: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create algorithm type")
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating algorithm type: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def update_algorithm_type(db: Session, type_id: int, algo_type: UpdateAlgorithmType):
    try:
        db_algo_type = get_algorithm_type_by_id(db, type_id)
        
        if algo_type.name and algo_type.name != db_algo_type.name:
            if not is_algorithm_type_name_unique(db, algo_type.name, type_id):
                raise HTTPException(status_code=400, detail="Algorithm type name already exists")
            db_algo_type.name = algo_type.name
        
        if algo_type.description is not None:
            db_algo_type.description = algo_type.description
        
        db.commit()
        db.refresh(db_algo_type)
        return db_algo_type
    except HTTPException as he:
        raise he
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating algorithm type: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update algorithm type")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating algorithm type: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def delete_algorithm_type(db: Session, type_id: int):
    try:
        db_algo_type = get_algorithm_type_by_id(db, type_id)
        
        # Check for existing algorithms using this type
        if db.query(Algorithm).filter(Algorithm.type_id == type_id).first():
            raise HTTPException(
                status_code=400,
                detail="Cannot delete algorithm type: it is being used by existing algorithms"
            )
        
        db.delete(db_algo_type)
        db.commit()
    except HTTPException as he:
        raise he
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error deleting algorithm type: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete algorithm type")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error deleting algorithm type: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

