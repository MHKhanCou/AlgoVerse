from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from models import Algorithm, AlgorithmType
from schemas import AddAlgorithm, UpdateAlgorithm

def get_algorithm_by_id(db: Session, algo_id: int):
    algorithm = db.query(Algorithm).options(joinedload(Algorithm.type)).filter(Algorithm.id == algo_id).first()
    if not algorithm:
        raise HTTPException(status_code=404, detail="Algorithm not found")
    return {
        "id": algorithm.id,
        "name": algorithm.name,
        "type_id": algorithm.type_id,
        "type_name": algorithm.type.name if algorithm.type else "Unknown",
        "description": algorithm.description,
        "difficulty": algorithm.difficulty,
        "complexity": algorithm.complexity,
        "explanation": algorithm.explanation,
        "code": algorithm.code
    }

def get_algorithm_by_name(db: Session, name: str):
    algorithm = db.query(Algorithm).options(joinedload(Algorithm.type)).filter(Algorithm.name == name).first()
    if not algorithm:
        return None
    return {
        "id": algorithm.id,
        "name": algorithm.name,
        "type_id": algorithm.type_id,
        "type_name": algorithm.type.name if algorithm.type else "Unknown",
        "description": algorithm.description,
        "difficulty": algorithm.difficulty,
        "complexity": algorithm.complexity,
        "explanation": algorithm.explanation,
        "code": algorithm.code
    }

def get_all_algorithms(db: Session, skip: int = 0, limit: int = 5):
    algorithms = db.query(Algorithm).options(joinedload(Algorithm.type)).offset(skip).limit(limit).all()
    return [
        {
            "id": algo.id,
            "name": algo.name,
            "type_id": algo.type_id,
            "type_name": algo.type.name if algo.type else "Unknown",
            "description": algo.description,
            "difficulty": algo.difficulty,
            "complexity": algo.complexity,
            "explanation": algo.explanation,
            "code": algo.code
        }
        for algo in algorithms
    ]

def get_algorithms_by_type(db: Session, type_id: int, skip: int = 0, limit: int = 5):
    algorithms = db.query(Algorithm).options(joinedload(Algorithm.type)).filter(Algorithm.type_id == type_id).offset(skip).limit(limit).all()
    return [
        {
            "id": algo.id,
            "name": algo.name,
            "type_id": algo.type_id,
            "type_name": algo.type.name if algo.type else "Unknown",
            "description": algo.description,
            "difficulty": algo.difficulty,
            "complexity": algo.complexity,
            "explanation": algo.explanation,
            "code": algo.code
        }
        for algo in algorithms
    ]

def create_algorithm(db: Session, algorithm_data: AddAlgorithm):
    if get_algorithm_by_name(db, algorithm_data.name):
        raise HTTPException(status_code=400, detail="Algorithm name already exists")
    
    algo_type = get_type_by_id(db, algorithm_data.type_id)
    
    new_algorithm = Algorithm(
        name=algorithm_data.name,
        description=algorithm_data.description,
        difficulty=algorithm_data.difficulty,
        complexity=algorithm_data.complexity,  # Convert enum to string and normalize
        type_id=algorithm_data.type_id,
        explanation=algorithm_data.explanation,
        code=algorithm_data.code
    )
    
    db.add(new_algorithm)
    db.commit()
    db.refresh(new_algorithm)
    
    return {
        "id": new_algorithm.id,
        "name": new_algorithm.name,
        "type_id": new_algorithm.type_id,
        "type_name": algo_type.name,
        "description": new_algorithm.description,
        "difficulty": new_algorithm.difficulty,
        "complexity": new_algorithm.complexity,
        "explanation": new_algorithm.explanation,
        "code": new_algorithm.code
    }

def update_algorithm(db: Session, algo_id: int, algorithm_data: UpdateAlgorithm):
    algorithm = db.query(Algorithm).filter(Algorithm.id == algo_id).first()
    if not algorithm:
        raise HTTPException(status_code=404, detail="Algorithm not found")
    
    if algorithm_data.name is not None:
        existing_algo = get_algorithm_by_name(db, algorithm_data.name)
        if existing_algo and existing_algo["id"] != algo_id:
            raise HTTPException(status_code=400, detail="Algorithm name already exists")
        algorithm.name = algorithm_data.name
    
    algo_type = None
    if algorithm_data.type_id is not None:
        algo_type = get_type_by_id(db, algorithm_data.type_id)
        algorithm.type_id = algorithm_data.type_id
    
    if algorithm_data.description is not None:
        algorithm.description = algorithm_data.description
    
    if algorithm_data.difficulty is not None:
        algorithm.difficulty = algorithm_data.difficulty
    
    if algorithm_data.complexity is not None:
        algorithm.complexity = algorithm_data.complexity
    
    if algorithm_data.explanation is not None:
        algorithm.explanation = algorithm_data.explanation
    
    if algorithm_data.code is not None:
        algorithm.code = algorithm_data.code
    
    db.commit()
    db.refresh(algorithm)
    
    if algo_type is None:
        algo_type = db.query(AlgorithmType).filter(AlgorithmType.id == algorithm.type_id).first()
    
    return {
        "id": algorithm.id,
        "name": algorithm.name,
        "type_id": algorithm.type_id,
        "type_name": algo_type.name if algo_type else "Unknown",
        "description": algorithm.description,
        "difficulty": algorithm.difficulty,
        "complexity": algorithm.complexity,
        "explanation": algorithm.explanation,
        "code": algorithm.code
    }

def delete_algorithm(db: Session, algo_id: int):
    algorithm = db.query(Algorithm).filter(Algorithm.id == algo_id).first()
    if not algorithm:
        raise HTTPException(status_code=404, detail="Algorithm not found")
    db.delete(algorithm)
    db.commit()

def get_type_by_id(db: Session, type_id: int):
    algo_type = db.query(AlgorithmType).filter(AlgorithmType.id == type_id).first()
    if not algo_type:
        raise HTTPException(status_code=404, detail="Algorithm type not found")
    return algo_type