from fastapi import HTTPException
from sqlalchemy.orm import Session
from models import Algorithm, AlgoDifficulty, AlgoComplexity

def get_algo_by_id(db: Session, algo_id: int):
    algorithm = db.query(Algorithm).filter(Algorithm.id == algo_id).first()
    if not algorithm:
        raise HTTPException(status_code=404, detail="Algorithm not found")
    return algorithm

def get_algo_by_name(db: Session, name: str):
    return db.query(Algorithm).filter(Algorithm.name == name).first()

def get_all(db: Session):
    return db.query(Algorithm).all()

def create(db: Session, algorithm_data: dict):
    # Validate difficulty
    diff_input = algorithm_data["difficulty"]
    if isinstance(diff_input, str):
        diff_input = diff_input.lower()
        difficulty = next((d for d in AlgoDifficulty if d.value == diff_input), None)
    else:
        difficulty = diff_input
    if difficulty is None:
        raise HTTPException(
            status_code=400, 
            detail="Invalid algorithm difficulty. Must be one of: easy, medium, hard"
        )
    
    # Validate complexity
    comp_input = algorithm_data["complexity"]
    if isinstance(comp_input, str):
        complexity = next((c for c in AlgoComplexity if c.value == comp_input), None)
    else:
        complexity = comp_input
    if complexity is None:
        raise HTTPException(
            status_code=400, 
            detail="Invalid algorithm complexity. Must be one of: O(1), O(log n), O(n), O(n log n), O(n^2), O(n^3), O(2^n), O(n!)"
        )
    
    # Check if name already exists
    if get_algo_by_name(db, algorithm_data["name"]):
        raise HTTPException(status_code=400, detail="Algorithm name already exists")
    
    # Validate algorithm type exists
    from repo.algo_type_repo import get_algo_type_by_id
    try:
        get_algo_type_by_id(db, algorithm_data["type_id"])
    except:
        raise HTTPException(status_code=404, detail="Algorithm type not found")
    
    # Create new algorithm with the validated enum values
    new_algorithm = Algorithm(
        name=algorithm_data["name"],
        description=algorithm_data["description"],
        difficulty=difficulty,
        complexity=complexity,
        type_id=algorithm_data["type_id"]
    )
    
    db.add(new_algorithm)
    db.commit()
    db.refresh(new_algorithm)
    return new_algorithm

def update(db: Session, algo_id: int, algorithm_data: dict):
    # Retrieve the algorithm to update
    algorithm = db.query(Algorithm).filter(Algorithm.id == algo_id).first()
    if not algorithm:
        raise HTTPException(status_code=404, detail="Algorithm not found")
    
    # Check for uniqueness of the new name, if being updated
    if "name" in algorithm_data:
        existing_algo = get_algo_by_name(db, algorithm_data["name"])
        if existing_algo and existing_algo.id != algo_id:
            raise HTTPException(status_code=400, detail="Algorithm name already exists")
    
    # Validate new type_id if provided
    if "type_id" in algorithm_data:
        from repo.algo_type_repo import get_algo_type_by_id
        get_algo_type_by_id(db, algorithm_data["type_id"])  # raises exception if not found

    # Convert and validate difficulty if provided
    if "difficulty" in algorithm_data:
        diff_input = algorithm_data["difficulty"]
        if isinstance(diff_input, str):
            diff_input = diff_input.lower()
            difficulty = next((d for d in AlgoDifficulty if d.value == diff_input), None)
        else:
            difficulty = diff_input
        if difficulty is None:
            raise HTTPException(
                status_code=400, 
                detail="Invalid algorithm difficulty. Must be one of: easy, medium, hard"
            )
        algorithm_data["difficulty"] = difficulty

    # Convert and validate complexity if provided
    if "complexity" in algorithm_data:
        comp_input = algorithm_data["complexity"]
        if isinstance(comp_input, str):
            complexity = next((c for c in AlgoComplexity if c.value == comp_input), None)
        else:
            complexity = comp_input
        if complexity is None:
            raise HTTPException(
                status_code=400, 
                detail="Invalid algorithm complexity. Must be one of: O(1), O(log n), O(n), O(n log n), O(n^2), O(n^3), O(2^n), O(n!)"
            )
        algorithm_data["complexity"] = complexity

    db.query(Algorithm).filter(Algorithm.id == algo_id).update(algorithm_data)
    db.commit()
    return db.query(Algorithm).filter(Algorithm.id == algo_id).first()

def delete(db: Session, algo_id: int):
    algorithm = db.query(Algorithm).filter(Algorithm.id == algo_id).first()
    if not algorithm:
        raise HTTPException(status_code=404, detail="Algorithm not found")
    db.delete(algorithm)
    db.commit()