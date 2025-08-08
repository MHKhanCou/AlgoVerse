from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()

class PlatformType(enum.Enum):
    CODEFORCES = "Codeforces"
    LEETCODE = "LeetCode" 
    ATCODER = "AtCoder"
    CODECHEF = "CodeChef"
    HACKERRANK = "HackerRank"
    SPOJ = "SPOJ"
    UVA = "UVa"
    HACKEREARTH = "HackerEarth"
    TOPCODER = "TopCoder"
    GEEKSFORGEEKS = "GeeksforGeeks"

class ProblemDifficulty(enum.Enum):
    BEGINNER = "beginner"
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"

class ProblemStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class RelatedProblem(Base):
    __tablename__ = "related_problems"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    platform = Column(Enum(PlatformType), nullable=False)
    difficulty = Column(Enum(ProblemDifficulty), nullable=False)
    problem_url = Column(String(500), nullable=False)
    problem_id = Column(String(50))  # Platform-specific problem ID
    description = Column(Text)
    tags = Column(String(500))  # Comma-separated tags
    
    # Algorithm relationship
    algorithm_id = Column(Integer, ForeignKey('algorithms.id'), nullable=False)
    algorithm = relationship("Algorithm", back_populates="related_problems")
    
    # Source tracking
    is_auto_suggested = Column(Boolean, default=False)
    source = Column(String(100))  # e.g., "YouKnowWho Academy", "Manual"
    source_mapping_id = Column(String(100))  # External mapping reference
    
    # Approval workflow
    status = Column(Enum(ProblemStatus), default=ProblemStatus.PENDING)
    approved_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    
    # Relationships
    approver = relationship("User", foreign_keys=[approved_by])
    creator = relationship("User", foreign_keys=[created_by])

class ProblemSourceMapping(Base):
    __tablename__ = "problem_source_mappings"
    
    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String(100), nullable=False)  # "YouKnowWho Academy"
    algorithm_name = Column(String(100), nullable=False)
    algorithm_id = Column(Integer, ForeignKey('algorithms.id'), nullable=False)
    
    # Mapping data
    topic_tags = Column(Text)  # JSON array of topic tags from source
    problem_list_url = Column(String(500))  # URL to the problem list
    last_synced = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    algorithm = relationship("Algorithm")

class UserProblemProgress(Base):
    __tablename__ = "user_problem_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    problem_id = Column(Integer, ForeignKey('related_problems.id'), nullable=False)
    
    # Progress tracking
    status = Column(String(20), default="not_started")  # not_started, attempted, solved
    attempts = Column(Integer, default=0)
    first_attempt_at = Column(DateTime, nullable=True)
    solved_at = Column(DateTime, nullable=True)
    
    # Optional: Solution link if user wants to share
    solution_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    problem = relationship("RelatedProblem")

# Add to existing models.py file
# Add this relationship to the Algorithm model:
# related_problems = relationship("RelatedProblem", back_populates="algorithm")
