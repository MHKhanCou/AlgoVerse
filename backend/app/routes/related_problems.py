from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import RelatedProblem, ProblemSourceMapping, UserProblemProgress, Algorithm, User, PlatformType, ProblemDifficulty, ProblemStatus
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from ..auth.oauth2 import get_current_user, get_current_user_optional
from ..middleware.admin_dependencies import get_current_admin
from ..middleware.rate_limit import limiter
from ..services import problem_suggestions
import requests
import json

router = APIRouter(prefix="/api/problems", tags=["Related Problems"])

# Test endpoint - admin-only for production safety
@router.get("/test", include_in_schema=False)
async def test_endpoint(
    _admin: User = Depends(get_current_admin),
):
    """Admin-only health probe for this router."""
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
    
    model_config = ConfigDict(from_attributes=True)

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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve related problems"
        )

# Get all related problems
@router.get("/all", response_model=List[RelatedProblemResponse])
async def get_all_related_problems(
    status: Optional[str] = Query("approved", description="Filter by approval status"),
    db: Session = Depends(get_db)
):
    """Get all related problems"""
    try:
        # Convert string status to enum
        if status == "approved":
            status_enum = ProblemStatus.APPROVED
        elif status == "pending":
            status_enum = ProblemStatus.PENDING
        elif status == "rejected":
            status_enum = ProblemStatus.REJECTED
        else:
            status_enum = ProblemStatus.APPROVED
            
        problems = db.query(RelatedProblem).filter(
            RelatedProblem.status == status_enum
        ).all()
        
        return problems
    except Exception as e:
        print(f"Error in get_all_related_problems: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve related problems"
        )

# Create a new related problem
@router.post("/", response_model=RelatedProblemResponse, status_code=status.HTTP_201_CREATED)
async def create_related_problem(
    problem_data: RelatedProblemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Requires authentication
):
    """Create a new related problem - requires authentication"""
    try:
        # Check if algorithm exists
        algorithm = db.query(Algorithm).filter(Algorithm.id == problem_data.algorithm_id).first()
        if not algorithm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Algorithm with id {problem_data.algorithm_id} not found"
            )
        
        # Check for duplicate problem URL
        existing = db.query(RelatedProblem).filter(
            RelatedProblem.problem_url == problem_data.problem_url
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Problem with this URL already exists"
            )
        
        # Create new problem
        new_problem = RelatedProblem(
            title=problem_data.title,
            platform=problem_data.platform,
            difficulty=problem_data.difficulty,
            problem_url=problem_data.problem_url,
            problem_id=problem_data.problem_id,
            description=problem_data.description,
            tags=problem_data.tags,
            algorithm_id=problem_data.algorithm_id,
            source=problem_data.source,
            status=ProblemStatus.PENDING,  # Default to pending for admin review
            is_auto_suggested=False
        )
        
        db.add(new_problem)
        db.commit()
        db.refresh(new_problem)
        
        return new_problem
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in create_related_problem: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create related problem"
        )

# Update a related problem
@router.put("/{problem_id}", response_model=RelatedProblemResponse)
async def update_related_problem(
    problem_id: int,
    problem_data: RelatedProblemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Requires authentication
):
    """Update a related problem - requires authentication"""
    try:
        problem = db.query(RelatedProblem).filter(RelatedProblem.id == problem_id).first()
        if not problem:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Related problem not found"
            )
        
        # Update fields
        update_data = problem_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(problem, field, value)
        
        db.commit()
        db.refresh(problem)
        
        return problem
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in update_related_problem: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update related problem"
        )

# Update problem status (approve/reject)
@router.patch("/{problem_id}/status")
async def update_problem_status(
    problem_id: int,
    status_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)  # Admin only
):
    """Update problem status (approve/reject) - admin only"""
    try:
        problem = db.query(RelatedProblem).filter(RelatedProblem.id == problem_id).first()
        if not problem:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Related problem not found"
            )
        
        new_status = status_data.get("status")
        if new_status not in ["approved", "rejected"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be 'approved' or 'rejected'"
            )
        
        problem.status = ProblemStatus.APPROVED if new_status == "approved" else ProblemStatus.REJECTED
        problem.reviewed_at = datetime.now()
        
        db.commit()
        db.refresh(problem)
        
        return {
            "id": problem.id,
            "status": problem.status.value,
            "message": f"Problem {new_status}"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in update_problem_status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update problem status"
        )

# Delete a related problem
@router.delete("/{problem_id}")
async def delete_related_problem(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)  # Admin only
):
    """Delete a related problem - admin only"""
    try:
        problem = db.query(RelatedProblem).filter(RelatedProblem.id == problem_id).first()
        if not problem:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Related problem not found"
            )
        
        db.delete(problem)
        db.commit()
        
        return {"message": "Related problem deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in delete_related_problem: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete related problem"
        )

# Get pending problems (for admin review)
@router.get("/pending", response_model=List[RelatedProblemResponse])
async def get_pending_problems(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)  # Admin only
):
    """Get all pending problems for admin review - admin only"""
    try:
        problems = db.query(RelatedProblem).filter(
            RelatedProblem.status == ProblemStatus.PENDING
        ).all()
        
        return problems
    except Exception as e:
        print(f"Error in get_pending_problems: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve pending problems"
        )

# Record user problem-solving progress
@router.post("/{problem_id}/progress")
async def record_problem_progress(
    problem_id: int,
    progress_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Authentication required
):
    """Record problem-solving progress for a user"""
    try:
        # Check if related problem exists
        problem = db.query(RelatedProblem).filter(RelatedProblem.id == problem_id).first()
        if not problem:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Related problem not found"
            )
        
        # Get or create user problem progress
        existing_progress = db.query(UserProblemProgress).filter(
            UserProblemProgress.user_id == current_user.id,
            UserProblemProgress.problem_id == problem_id
        ).first()
        
        if existing_progress:
            # Update existing progress
            existing_progress.status = progress_data.get("status", existing_progress.status)
            existing_progress.solution_url = progress_data.get("solution_url")
            existing_progress.notes = progress_data.get("notes")
            existing_progress.updated_at = datetime.now()
        else:
            # Create new progress record
            new_progress = UserProblemProgress(
                user_id=current_user.id,
                problem_id=problem_id,
                algorithm_id=problem.algorithm_id,
                status=progress_data.get("status", ProblemStatus.PENDING),
                solution_url=progress_data.get("solution_url"),
                notes=progress_data.get("notes")
            )
            db.add(new_progress)
        
        db.commit()
        
        return {
            "message": "Progress recorded successfully",
            "problem_id": problem_id,
            "status": progress_data.get("status", "recorded")
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in record_problem_progress: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record progress"
        )

# Get user progress for an algorithm
@router.get("/progress/{algorithm_id}")
async def get_user_algorithm_progress(
    algorithm_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Authentication required
):
    """Get user's problem-solving progress for an algorithm"""
    try:
        progress = db.query(UserProblemProgress).filter(
            UserProblemProgress.user_id == current_user.id,
            UserProblemProgress.algorithm_id == algorithm_id
        ).all()
        
        return {
            "algorithm_id": algorithm_id,
            "problems_solved": len([p for p in progress if p.status == ProblemStatus.SOLVED]),
            "problems_attempted": len([p for p in progress if p.status in [ProblemStatus.SOLVED, ProblemStatus.ATTEMPTED]]),
            "total_problems": len(progress),
            "progress": [
                {
                    "problem_id": p.problem_id,
                    "problem_title": p.related_problem.title if p.related_problem else "Unknown",
                    "status": p.status.value,
                    "solution_url": p.solution_url,
                    "notes": p.notes
                }
                for p in progress
            ]
        }
    except Exception as e:
        print(f"Error in get_user_algorithm_progress: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve progress"
        )

# Auto-suggest problems for an algorithm
@router.post("/auto-suggest/{algorithm_id}")
async def auto_suggest_problems(
    algorithm_id: int,
    suggestion_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)  # Admin only for now
):
    """Auto-suggest problems for an algorithm based on tags and difficulty"""
    try:
        # Check if algorithm exists
        algorithm = db.query(Algorithm).filter(Algorithm.id == algorithm_id).first()
        if not algorithm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Algorithm with id {algorithm_id} not found"
            )
        
        # Get algorithm tags
        algo_tags = algorithm.tags.split(",") if algorithm.tags else []
        
        # Search for problems with matching tags
        suggested = db.query(RelatedProblem).filter(
            RelatedProblem.status == ProblemStatus.APPROVED,
            RelatedProblem.algorithm_id != algorithm_id,
            RelatedProblem.difficulty == algorithm.difficulty
        ).limit(suggestion_data.get("limit", 5)).all()
        
        return {
            "algorithm_id": algorithm_id,
            "suggested_problems": [
                {
                    "id": p.id,
                    "title": p.title,
                    "platform": p.platform.value,
                    "difficulty": p.difficulty.value,
                    "problem_url": p.problem_url,
                    "tags": p.tags,
                    "similarity_score": "N/A"  # Could implement tag matching logic
                }
                for p in suggested
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in auto_suggest_problems: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate suggestions"
        )

# Suggest practice problems for an algorithm
@router.get("/suggest/{algorithm_id}")
@limiter.limit("30/minute")
async def suggest_practice_problems(
    request: Request,
    algorithm_id: int,
    count: int = Query(5, ge=3, le=8, description="How many problems to suggest"),
    level: Optional[int] = Query(None, ge=800, le=3500, description="Explicit Codeforces rating level"),
    refresh: bool = Query(False, description="Bypass the cache (signed-in users only)"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Suggest real practice problems for an algorithm.

    Problems come from a verified pool: the Codeforces problemset API plus a
    curated CSES task list. When an AI key is configured the model selects
    and explains from that pool only, so every returned link is real.
    Without a key the pool is ranked deterministically.
    """
    algorithm = db.query(Algorithm).filter(Algorithm.id == algorithm_id).first()
    if not algorithm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Algorithm with id {algorithm_id} not found",
        )
    # A cache-bypass costs a model call, so it is reserved for signed-in users.
    allow_refresh = bool(refresh and current_user)
    return problem_suggestions.suggest_for_algorithm(
        db,
        algorithm,
        count=count,
        explicit_level=level,
        user=current_user,
        refresh=allow_refresh,
    )

# Get topic mappings
@router.get("/topic-mappings")
async def get_topic_mappings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)  # Admin only
):
    """Get all topic-to-algorithm mappings - admin only"""
    try:
        mappings = db.query(ProblemSourceMapping).all()
        
        return {
            "mappings": [
                {
                    "id": m.id,
                    "topic": m.topic,
                    "algorithm_id": m.algorithm_id,
                    "algorithm_name": m.algorithm.name if m.algorithm else "Unknown",
                    "source": m.source,
                    "created_at": m.created_at.isoformat() if m.created_at else None
                }
                for m in mappings
            ]
        }
    except Exception as e:
        print(f"Error in get_topic_mappings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve topic mappings"
        )

# Create topic mapping
@router.post("/topic-mappings")
async def create_topic_mapping(
    mapping_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)  # Admin only
):
    """Create a new topic-to-algorithm mapping - admin only"""
    try:
        # Check if algorithm exists
        algorithm = db.query(Algorithm).filter(Algorithm.id == mapping_data.get("algorithm_id")).first()
        if not algorithm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Algorithm with id {mapping_data.get('algorithm_id')} not found"
            )
        
        # Check for duplicate mapping
        existing = db.query(ProblemSourceMapping).filter(
            ProblemSourceMapping.topic == mapping_data.get("topic"),
            ProblemSourceMapping.algorithm_id == mapping_data.get("algorithm_id")
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Topic mapping already exists"
            )
        
        # Create new mapping
        new_mapping = ProblemSourceMapping(
            topic=mapping_data.get("topic"),
            algorithm_id=mapping_data.get("algorithm_id"),
            source=mapping_data.get("source", "Manual"),
            notes=mapping_data.get("notes")
        )
        
        db.add(new_mapping)
        db.commit()
        db.refresh(new_mapping)
        
        return {
            "id": new_mapping.id,
            "topic": new_mapping.topic,
            "algorithm_id": new_mapping.algorithm_id,
            "message": "Topic mapping created successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in create_topic_mapping: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create topic mapping"
        )

# Sync all problems from external sources
@router.post("/sync-all")
async def sync_all_problems(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)  # Admin only
):
    """Sync problems from all external sources - admin only"""
    try:
        # Check if algorithm exists
        algorithm = db.query(Algorithm).filter(Algorithm.id == 1).first()
        if not algorithm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Default algorithm not found"
            )
        
        # Get existing problems
        existing_problems = db.query(RelatedProblem).filter(
            RelatedProblem.algorithm_id == 1
        ).all()
        
        existing_urls = {p.problem_url for p in existing_problems}
        
        # This is a placeholder - in production, you would integrate with
        # actual problem APIs like LeetCode, Codeforces, etc.
        sample_problems = [
            {
                "title": "Two Sum",
                "platform": PlatformType.LEETCODE,
                "difficulty": ProblemDifficulty.EASY,
                "problem_url": "https://leetcode.com/problems/two-sum/",
                "problem_id": "two-sum",
                "tags": "array,hash-table",
                "source": "Manual"
            },
            {
                "title": "Add Two Numbers",
                "platform": PlatformType.LEETCODE,
                "difficulty": ProblemDifficulty.MEDIUM,
                "problem_url": "https://leetcode.com/problems/add-two-numbers/",
                "problem_id": "add-two-numbers",
                "tags": "linked-list,math",
                "source": "Manual"
            }
        ]
        
        added = 0
        skipped = 0
        
        for problem_data in sample_problems:
            if problem_data["problem_url"] not in existing_urls:
                new_problem = RelatedProblem(
                    title=problem_data["title"],
                    platform=problem_data["platform"],
                    difficulty=problem_data["difficulty"],
                    problem_url=problem_data["problem_url"],
                    problem_id=problem_data.get("problem_id"),
                    tags=problem_data.get("tags"),
                    algorithm_id=1,
                    source=problem_data.get("source", "Manual"),
                    status=ProblemStatus.APPROVED,
                    is_auto_suggested=False
                )
                db.add(new_problem)
                added += 1
            else:
                skipped += 1
        
        db.commit()
        
        return {
            "message": "Sync completed",
            "added": added,
            "skipped": skipped,
            "total_existing": len(existing_problems) + added
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in sync_all_problems: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to sync problems"
        )
