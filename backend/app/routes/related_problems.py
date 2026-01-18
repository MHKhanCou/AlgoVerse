from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import RelatedProblem, ProblemSourceMapping, UserProblemProgress, Algorithm, User, PlatformType, ProblemDifficulty, ProblemStatus
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from ..auth.oauth2 import get_current_user
from ..middleware.admin_dependencies import get_current_admin
import requests
import json

router = APIRouter(prefix="/api/problems", tags=["Related Problems"])

# Test endpoint
@router.get("/test")
async def test_endpoint():
    """Test endpoint to verify API is working"""
    return {"message": "Related Problems API is working!", "status": "success"}

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
    status: Optional[str] = Query("approved", description="Filter by approval status"),
    db: Session = Depends(get_db)
):
    """Get all related problems for a specific algorithm"""
    try:
        # Convert string status to enum
        if status == "approved":
            status_enum = ProblemStatus.APPROVED
        elif status == "pending":
            status_enum = ProblemStatus.PENDING
        elif status == "rejected":
            status_enum = ProblemStatus.REJECTED
        else:
            status_enum = ProblemStatus.APPROVED  # Default to approved
            
        problems = db.query(RelatedProblem).filter(
            RelatedProblem.algorithm_id == algorithm_id,
            RelatedProblem.status == status_enum
        ).all()
        
        return problems
    except Exception as e:
        print(f"Error in get_algorithm_problems: {e}")
        return []

# Get all problems for admin
@router.get("/all", response_model=List[RelatedProblemResponse])
async def get_all_problems(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Get all problems (admin only)"""
    problems = db.query(RelatedProblem).all()
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

# Pydantic model for status update
class ProblemStatusUpdate(BaseModel):
    status: str

# Approve/reject a problem
@router.patch("/{problem_id}/status")
async def update_problem_status(
    problem_id: int,
    status_update: ProblemStatusUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Approve or reject a problem (admin only)"""
    db_problem = db.query(RelatedProblem).filter(RelatedProblem.id == problem_id).first()
    if not db_problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Convert string to enum
    if status_update.status == "approved":
        new_status = ProblemStatus.APPROVED
    elif status_update.status == "rejected":
        new_status = ProblemStatus.REJECTED
    elif status_update.status == "pending":
        new_status = ProblemStatus.PENDING
    else:
        raise HTTPException(status_code=400, detail="Invalid status value")
    
    db_problem.status = new_status
    db_problem.approved_by = current_user.id
    db_problem.approved_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": f"Problem {new_status.value} successfully"}

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

# Auto-suggest problems from YouKnowWho Academy
@router.post("/auto-suggest/{algorithm_id}")
async def auto_suggest_problems(
    algorithm_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Auto-suggest problems from external sources (admin only)"""
    algorithm = db.query(Algorithm).filter(Algorithm.id == algorithm_id).first()
    if not algorithm:
        raise HTTPException(status_code=404, detail="Algorithm not found")
    
    try:
        # Import and use YouKnowWho integration service
        from services.youknowwho_integration import get_youknowwho_service
        
        service = get_youknowwho_service(db)
        suggested_problems = service.suggest_problems(algorithm_id, algorithm.name, current_user.id)
        
        if suggested_problems:
            return {
                "message": f"Successfully suggested {len(suggested_problems)} problems for {algorithm.name}",
                "suggested_problems": suggested_problems,
                "status": "success"
            }
        else:
            return {
                "message": f"No new problems found to suggest for {algorithm.name}. All available problems may already be in the system.",
                "suggested_problems": [],
                "status": "info"
            }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error auto-suggesting problems: {str(e)}"
        )

# Get topic list mapping for YouKnowWho Academy integration
@router.get("/topic-mappings")
async def get_topic_mappings(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get algorithm to topic mappings for external sources"""
    mappings = db.query(ProblemSourceMapping).filter(
        ProblemSourceMapping.is_active == True
    ).all()
    
    return mappings

# Create or update topic mapping
@router.post("/topic-mappings")
async def create_topic_mapping(
    algorithm_id: int,
    source_name: str = "YouKnowWho Academy",
    topic_tags: str = "",
    problem_list_url: Optional[str] = None,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create or update topic mapping for external sources"""
    algorithm = db.query(Algorithm).filter(Algorithm.id == algorithm_id).first()
    if not algorithm:
        raise HTTPException(status_code=404, detail="Algorithm not found")
    
    # Check if mapping already exists
    existing_mapping = db.query(ProblemSourceMapping).filter(
        ProblemSourceMapping.algorithm_id == algorithm_id,
        ProblemSourceMapping.source_name == source_name
    ).first()
    
    if existing_mapping:
        existing_mapping.topic_tags = topic_tags
        existing_mapping.problem_list_url = problem_list_url
        existing_mapping.last_synced = datetime.utcnow()
        existing_mapping.updated_at = datetime.utcnow()
    else:
        new_mapping = ProblemSourceMapping(
            source_name=source_name,
            algorithm_name=algorithm.name,
            algorithm_id=algorithm_id,
            topic_tags=topic_tags,
            problem_list_url=problem_list_url
        )
        db.add(new_mapping)
    
    db.commit()
    
    return {"message": "Topic mapping updated successfully"}

# Sync all algorithms with YouKnowWho Academy
@router.post("/sync-all")
async def sync_all_algorithms(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Sync all algorithms with YouKnowWho Academy (admin only)"""
    try:
        from services.youknowwho_integration import get_youknowwho_service
        
        service = get_youknowwho_service(db)
        result = service.sync_all_algorithms(current_user.id)
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error syncing algorithms: {str(e)}"
        )
