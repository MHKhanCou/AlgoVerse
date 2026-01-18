from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..db import get_db  
from ..repositories import algo_repo
from ..middleware.admin_dependencies import get_current_admin

router = APIRouter(prefix="/algorithms", tags=["Algorithms"])

@router.post("/", response_model=schemas.ShowAlgorithm)
def create_algorithm(
    request: schemas.AddAlgorithm, 
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    try:
        return algo_repo.create_algorithm(db, request)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/{id}", response_model=schemas.ShowAlgorithm)
def update_algorithm(
    id: int, 
    request: schemas.UpdateAlgorithm, 
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    try:
        return algo_repo.update_algorithm(db, id, request)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/", response_model=List[schemas.ShowAlgorithm])
def get_all_algorithms(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="Number of algorithms to skip"),
    limit: int = Query(5, ge=1, le=100, description="Number of algorithms to return")
):
    return algo_repo.get_all_algorithms(db, skip=skip, limit=limit)

@router.get("/{id}", response_model=schemas.ShowAlgorithm)
def get_algorithm(id: int, db: Session = Depends(get_db)):
    return algo_repo.get_algorithm_by_id(db, id)

@router.get("/{id}/related-problems")
def get_algorithm_related_problems(id: int, db: Session = Depends(get_db)):
    """Get related problems for a specific algorithm"""
    try:
        # Check if algorithm exists
        algorithm = db.query(models.Algorithm).filter(models.Algorithm.id == id).first()
        if not algorithm:
            raise HTTPException(status_code=404, detail="Algorithm not found")
        
        # Get approved related problems for this algorithm
        problems = db.query(models.RelatedProblem).filter(
            models.RelatedProblem.algorithm_id == id,
            models.RelatedProblem.status == models.ProblemStatus.APPROVED
        ).all()
        
        # Format the problems for frontend consumption
        formatted_problems = []
        for problem in problems:
            formatted_problems.append({
                "id": problem.id,
                "title": problem.title,
                "name": problem.title,  # Frontend expects 'name' field
                "platform": problem.platform.value if problem.platform else "Unknown",
                "difficulty": problem.difficulty.value if problem.difficulty else "Medium",
                "url": problem.problem_url,
                "problem_url": problem.problem_url,
                "problem_id": problem.problem_id,
                "description": problem.description,
                "tags": problem.tags,
                "algorithm_id": problem.algorithm_id,
                "status": problem.status.value if problem.status else "pending",
                "created_at": problem.created_at.isoformat() if problem.created_at else None,
                "updated_at": problem.updated_at.isoformat() if problem.updated_at else None
            })
        
        return formatted_problems
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching related problems: {str(e)}"
        )

@router.get("/type/{type_id}", response_model=List[schemas.ShowAlgorithm])
def get_algorithms_by_type(
    type_id: int,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0, description="Number of algorithms to skip"),
    limit: int = Query(5, ge=1, le=100, description="Number of algorithms to return")
):
    return algo_repo.get_algorithms_by_type(db, type_id, skip=skip, limit=limit)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_algorithm(
    id: int, 
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    try:
        algo_repo.delete_algorithm(db, id)
        return None
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
