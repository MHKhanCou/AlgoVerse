from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, Enum, DateTime, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from db import Base
import enum

# Enums
class AlgoStatus(enum.Enum):
    enrolled = "enrolled"
    completed = "completed"

class AlgoDifficulty(enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"

class AlgoComplexity(enum.Enum):
    O1 = "O(1)"
    Ologn = "O(logn)"
    On = "O(n)"
    Onlogn = "O(nlogn)"
    On2 = "O(n^2)"
    On3 = "O(n^3)"
    O2n = "O(2^n)"
    Onfact = "O(n!)"

# Related Problems Enums
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

# Learning Paths Enums
class PathDifficulty(enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate" 
    ADVANCED = "advanced"
    EXPERT = "expert"

class PathStatus(enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    PAUSED = "paused"

# User Model
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    joined_at = Column(DateTime, default=datetime.utcnow)
    is_admin = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    codeforces_handle = Column(String, nullable=True)  # Codeforces handle
    # Relationship to track user's progress on algorithms
    user_progress = relationship("UserProgress", back_populates="user")
    blog = relationship("Blog", back_populates="user", foreign_keys="Blog.user_id")

# AlgorithmType Model
class AlgorithmType(Base):
    __tablename__ = "algorithm_types"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text)

    algorithms = relationship("Algorithm", back_populates="type")
    
# Algorithm Model
class Algorithm(Base):
    __tablename__ = "algorithms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text, nullable=False)
    difficulty = Column(Enum(AlgoDifficulty), nullable=False)
    complexity = Column(Enum(AlgoComplexity), nullable=False)
    type_id = Column(Integer, ForeignKey("algorithm_types.id"), nullable=False)

    # 🆕 Add these two:
    explanation = Column(Text, nullable=True)
    code = Column(Text, nullable=True)

    type = relationship("AlgorithmType", back_populates="algorithms")
    user_progress = relationship("UserProgress", back_populates="algorithm")
    related_problems = relationship("RelatedProblem", back_populates="algorithm")
    comments = relationship("AlgorithmComment", back_populates="algorithm", cascade="all, delete-orphan")

    @property
    def type_name(self):
        return self.type.name if self.type else None
# UserProgress Model
class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    algo_id = Column(Integer, ForeignKey("algorithms.id"), nullable=False)
    status = Column(Enum(AlgoStatus), default=AlgoStatus.enrolled, nullable=False)
    started_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    last_accessed = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    finished_at = Column(TIMESTAMP, nullable=True)

    # Relationships
    user = relationship("User", back_populates="user_progress")
    algorithm = relationship("Algorithm", back_populates="user_progress")
    @property
    def user_name(self):
        return self.user.name if self.user else None
    @property
    def algorithm_name(self):
        return self.algorithm.name if self.algorithm else None
# BLOG

# Blog Status Enum
class BlogStatus(enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class Blog(Base):
    __tablename__ = "blog"
    id = Column(Integer, unique=True, primary_key=True, index=True, autoincrement=True)
    title = Column(String(250), nullable=False)
    body = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  
    created_at = Column(TIMESTAMP, server_default=func.now())  
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    status = Column(Enum(BlogStatus), default=BlogStatus.pending, nullable=False)
    admin_feedback = Column(Text, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(TIMESTAMP, nullable=True)

    user = relationship("User", back_populates="blog", foreign_keys=[user_id])
    admin = relationship("User", foreign_keys=[approved_by])
    comments = relationship("BlogComment", back_populates="blog", cascade="all, delete-orphan")

    @property
    def author(self):
        return self.user.name if self.user else None

# Blog Comment Model
class BlogComment(Base):
    __tablename__ = "blog_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    blog_id = Column(Integer, ForeignKey("blog.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    parent_id = Column(Integer, ForeignKey("blog_comments.id"), nullable=True)  # For nested comments
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_edited = Column(Boolean, default=False)
    
    # Relationships
    blog = relationship("Blog", back_populates="comments")
    user = relationship("User")
    parent = relationship("BlogComment", remote_side=[id])
    replies = relationship("BlogComment", back_populates="parent")
    
    @property
    def author_name(self):
        return self.user.name if self.user else "Unknown"

# Algorithm Comment Model
class AlgorithmComment(Base):
    __tablename__ = "algorithm_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    algorithm_id = Column(Integer, ForeignKey("algorithms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    parent_id = Column(Integer, ForeignKey("algorithm_comments.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_edited = Column(Boolean, default=False)
    likes = Column(Integer, default=0)
    
    # Relationships
    algorithm = relationship("Algorithm", back_populates="comments")
    user = relationship("User")
    parent = relationship("AlgorithmComment", remote_side=[id])
    replies = relationship("AlgorithmComment", back_populates="parent")
    
    @property
    def author_name(self):
        return self.user.name if self.user else "Unknown"

# Related Problems Models
class RelatedProblem(Base):
    __tablename__ = "related_problems"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    platform = Column(Enum(PlatformType), nullable=False)
    difficulty = Column(Enum(ProblemDifficulty), nullable=False)
    problem_url = Column(String(500), nullable=False, unique=True, index=True)
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

# Learning Paths Models
class LearningPath(Base):
    __tablename__ = "learning_paths"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    difficulty = Column(Enum(PathDifficulty), nullable=False)
    estimated_hours = Column(Integer, default=0)
    prerequisites = Column(Text)  # JSON array of prerequisite path IDs
    
    # Visual and metadata
    icon = Column(String(50), default="🎯")
    color = Column(String(7), default="#3B82F6")  # Hex color
    thumbnail_url = Column(String(500))
    
    # Content organization
    is_featured = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    
    # Statistics
    enrollment_count = Column(Integer, default=0)
    completion_rate = Column(Float, default=0.0)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey('users.id'))
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    steps = relationship("PathStep", back_populates="path", cascade="all, delete-orphan")
    enrollments = relationship("UserPathProgress", back_populates="path")

class PathStep(Base):
    __tablename__ = "path_steps"
    
    id = Column(Integer, primary_key=True, index=True)
    path_id = Column(Integer, ForeignKey('learning_paths.id'), nullable=False)
    step_order = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    
    # Content references
    algorithm_id = Column(Integer, ForeignKey('algorithms.id'), nullable=True)
    external_url = Column(String(500), nullable=True)
    content_type = Column(String(20), default="algorithm")  # algorithm, video, article, quiz
    
    # Requirements
    is_required = Column(Boolean, default=True)
    estimated_minutes = Column(Integer, default=30)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    path = relationship("LearningPath", back_populates="steps")
    algorithm = relationship("Algorithm")
    completions = relationship("UserStepProgress", back_populates="step")

class UserPathProgress(Base):
    __tablename__ = "user_path_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    path_id = Column(Integer, ForeignKey('learning_paths.id'), nullable=False)
    
    # Progress tracking
    status = Column(Enum(PathStatus), default=PathStatus.NOT_STARTED)
    progress_percentage = Column(Float, default=0.0)
    current_step_id = Column(Integer, ForeignKey('path_steps.id'), nullable=True)
    
    # Time tracking
    total_time_spent = Column(Integer, default=0)  # in minutes
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    last_accessed = Column(DateTime, default=datetime.utcnow)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    path = relationship("LearningPath", back_populates="enrollments")
    current_step = relationship("PathStep", foreign_keys=[current_step_id])
    step_progress = relationship("UserStepProgress", back_populates="path_progress")

class UserStepProgress(Base):
    __tablename__ = "user_step_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    step_id = Column(Integer, ForeignKey('path_steps.id'), nullable=False)
    path_progress_id = Column(Integer, ForeignKey('user_path_progress.id'), nullable=False)
    
    # Progress
    is_completed = Column(Boolean, default=False)
    time_spent = Column(Integer, default=0)  # in minutes
    
    # Optional feedback
    rating = Column(Integer, nullable=True)  # 1-5 stars
    notes = Column(Text, nullable=True)
    
    # Timestamps
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User")
    step = relationship("PathStep", back_populates="completions")
    path_progress = relationship("UserPathProgress", back_populates="step_progress")

class PathRecommendation(Base):
    __tablename__ = "path_recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    path_id = Column(Integer, ForeignKey('learning_paths.id'), nullable=False)
    
    # Recommendation details
    confidence_score = Column(Float, default=0.0)  # 0.0 to 1.0
    reason = Column(Text)  # Why this path was recommended
    recommendation_type = Column(String(50), default="ai_generated")  # ai_generated, popularity_based, skill_based
    
    # Status
    is_viewed = Column(Boolean, default=False)
    is_dismissed = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User")
    path = relationship("LearningPath")