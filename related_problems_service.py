from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from db import get_db
from models import RelatedProblem, ProblemSourceMapping, UserProblemProgress, Algorithm, User, PlatformType, ProblemDifficulty, ProblemStatus
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import requests
import json

router = APIRouter(prefix="/api/problems", tags=["Related Problems"])

# Pydantic models for request/response
class RelatedProblemCreate(BaseModel):
    title: str
    platform: PlatformType
    difficulty: ProblemDifficulty
    problem_url: str
    problem_id: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    algorithm_id: int
    source: Optional[str] = "Manual"

class RelatedProblemUpdate(BaseModel):
    title: Optional[str] = None
    difficulty: Optional[ProblemDifficulty] = None
    problem_url: Optional[str] = None
    problem_id: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None

class RelatedProblemResponse(BaseModel):
    id: int
    title: str
    platform: PlatformType
    difficulty: ProblemDifficulty
    problem_url: str
    problem_id: Optional[str]
    description: Optional[str]
    tags: Optional[str]
    algorithm_id: int
    is_auto_suggested: bool
    source: Optional[str]
    status: ProblemStatus
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserProblemProgressUpdate(BaseModel):
    status: str
    solution_url: Optional[str] = None
    notes: Optional[str] = None

# Get related problems for an algorithm
@router.get("/algorithm/{algorithm_id}", response_model=List[RelatedProblemResponse])
async def get_algorithm_problems(
    algorithm_id: int,
    status: Optional[ProblemStatus] = Query(ProblemStatus.APPROVED, description="Filter by approval status"),
    db: Session = Depends(get_db)
):
    """Get all related problems for a specific algorithm"""
    problems = db.query(RelatedProblem).filter(
        RelatedProblem.algorithm_id == algorithm_id,
        RelatedProblem.status == status
    ).all()
    
    return problems

# Create a new related problem
@router.post("/", response_model=RelatedProblemResponse)
async def create_related_problem(
    problem: RelatedProblemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new related problem"""
    # Verify algorithm exists
    algorithm = db.query(Algorithm).filter(Algorithm.id == problem.algorithm_id).first()
    if not algorithm:
        raise HTTPException(status_code=404, detail="Algorithm not found")
    
    db_problem = RelatedProblem(
        title=problem.title,
        platform=problem.platform,
        difficulty=problem.difficulty,
        problem_url=problem.problem_url,
        problem_id=problem.problem_id,
        description=problem.description,
        tags=problem.tags,
        algorithm_id=problem.algorithm_id,
        source=problem.source,
        created_by=current_user.id,
        status=ProblemStatus.APPROVED if current_user.is_admin else ProblemStatus.PENDING
    )
    
    db.add(db_problem)
    db.commit()
    db.refresh(db_problem)
    
    return db_problem

# Update a related problem
@router.put("/{problem_id}", response_model=RelatedProblemResponse)
async def update_related_problem(
    problem_id: int,
    problem_update: RelatedProblemUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update a related problem (admin only)"""
    db_problem = db.query(RelatedProblem).filter(RelatedProblem.id == problem_id).first()
    if not db_problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    update_data = problem_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_problem, field, value)
    
    db_problem.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_problem)
    
    return db_problem

# Approve/reject a problem
@router.patch("/{problem_id}/status")
async def update_problem_status(
    problem_id: int,
    status: ProblemStatus,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Approve or reject a problem (admin only)"""
    db_problem = db.query(RelatedProblem).filter(RelatedProblem.id == problem_id).first()
    if not db_problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    db_problem.status = status
    db_problem.approved_by = current_user.id
    db_problem.approved_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": f"Problem {status.value} successfully"}

# Delete a problem
@router.delete("/{problem_id}")
async def delete_related_problem(
    problem_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a related problem (admin only)"""
    db_problem = db.query(RelatedProblem).filter(RelatedProblem.id == problem_id).first()
    if not db_problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    db.delete(db_problem)
    db.commit()
    
    return {"message": "Problem deleted successfully"}

# Get pending problems for admin review
@router.get("/pending", response_model=List[RelatedProblemResponse])
async def get_pending_problems(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all pending problems for admin review"""
    problems = db.query(RelatedProblem).filter(
        RelatedProblem.status == ProblemStatus.PENDING
    ).all()
    
    return problems

# User problem progress tracking
@router.post("/{problem_id}/progress")
async def update_user_problem_progress(
    problem_id: int,
    progress_update: UserProblemProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's progress on a specific problem"""
    # Verify problem exists
    problem = db.query(RelatedProblem).filter(RelatedProblem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Get or create progress record
    progress = db.query(UserProblemProgress).filter(
        UserProblemProgress.user_id == current_user.id,
        UserProblemProgress.problem_id == problem_id
    ).first()
    
    if not progress:
        progress = UserProblemProgress(
            user_id=current_user.id,
            problem_id=problem_id,
            status=progress_update.status,
            solution_url=progress_update.solution_url,
            notes=progress_update.notes,
            first_attempt_at=datetime.utcnow() if progress_update.status != "not_started" else None,
            solved_at=datetime.utcnow() if progress_update.status == "solved" else None
        )
        db.add(progress)
    else:
        progress.status = progress_update.status
        progress.attempts += 1
        progress.solution_url = progress_update.solution_url
        progress.notes = progress_update.notes
        progress.updated_at = datetime.utcnow()
        
        if progress_update.status == "solved" and not progress.solved_at:
            progress.solved_at = datetime.utcnow()
        elif progress_update.status == "attempted" and not progress.first_attempt_at:
            progress.first_attempt_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Progress updated successfully"}

# Get user's problem progress
@router.get("/progress/{algorithm_id}")
async def get_user_algorithm_progress(
    algorithm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's progress on all problems for a specific algorithm"""
    progress_data = db.query(
        RelatedProblem,
        UserProblemProgress
    ).outerjoin(
        UserProblemProgress,
        (UserProblemProgress.problem_id == RelatedProblem.id) & 
        (UserProblemProgress.user_id == current_user.id)
    ).filter(
        RelatedProblem.algorithm_id == algorithm_id,
        RelatedProblem.status == ProblemStatus.APPROVED
    ).all()
    
    result = []
    for problem, progress in progress_data:
        result.append({
            "problem": {
                "id": problem.id,
                "title": problem.title,
                "platform": problem.platform.value,
                "difficulty": problem.difficulty.value,
                "problem_url": problem.problem_url
            },
            "progress": {
                "status": progress.status if progress else "not_started",
                "attempts": progress.attempts if progress else 0,
                "solved_at": progress.solved_at if progress else None,
                "solution_url": progress.solution_url if progress else None
            } if progress else {"status": "not_started", "attempts": 0, "solved_at": None, "solution_url": None}
        })
    
    return result

# Auto-suggest problems (YouKnowWho Academy integration placeholder)
@router.post("/auto-suggest/{algorithm_id}")
async def auto_suggest_problems(
    algorithm_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Auto-suggest problems from trusted sources like YouKnowWho Academy"""
    algorithm = db.query(Algorithm).filter(Algorithm.id == algorithm_id).first()
    if not algorithm:
        raise HTTPException(status_code=404, detail="Algorithm not found")
    
    # This is a placeholder for YouKnowWho Academy integration
    # In a real implementation, you would:
    # 1. Map algorithm names to YouKnowWho Academy topics
    # 2. Fetch problems from their API/scrape their website
    # 3. Create RelatedProblem entries with is_auto_suggested=True
    
    suggested_problems = []
    
    # Mock data for demonstration
    if algorithm.name.lower().find("binary search") != -1:
        mock_problems = [
            {
                "title": "Binary Search Implementation",
                "platform": PlatformType.LEETCODE,
                "difficulty": ProblemDifficulty.EASY,
                "problem_url": "https://leetcode.com/problems/binary-search/",
                "problem_id": "704",
                "description": "Implement binary search on a sorted array"
            },
            {
                "title": "Search Insert Position",
                "platform": PlatformType.LEETCODE,
                "difficulty": ProblemDifficulty.EASY,
                "problem_url": "https://leetcode.com/problems/search-insert-position/",
                "problem_id": "35",
                "description": "Find the index where target should be inserted"
            }
        ]
        
        for mock_problem in mock_problems:
            # Check if problem already exists
            existing = db.query(RelatedProblem).filter(
                RelatedProblem.algorithm_id == algorithm_id,
                RelatedProblem.problem_url == mock_problem["problem_url"]
            ).first()
            
            if not existing:
                new_problem = RelatedProblem(
                    title=mock_problem["title"],
                    platform=mock_problem["platform"],
                    difficulty=mock_problem["difficulty"],
                    problem_url=mock_problem["problem_url"],
                    problem_id=mock_problem["problem_id"],
                    description=mock_problem["description"],
                    algorithm_id=algorithm_id,
                    is_auto_suggested=True,
                    source="YouKnowWho Academy",
                    status=ProblemStatus.PENDING,
                    created_by=current_user.id
                )
                
                db.add(new_problem)
                suggested_problems.append(new_problem)
    
    db.commit()
    
    return {
        "message": f"Auto-suggested {len(suggested_problems)} problems for review",
        "suggested_count": len(suggested_problems)
    }

# Placeholder for authentication dependencies
# These should be imported from your existing auth system
async def get_current_user():
    # Implement your current user authentication logic
    pass

async def get_current_admin():
    # Implement your current admin authentication logic
    pass
