from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
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
    Ologn = "O(log n)"
    On = "O(n)"
    Onlogn = "O(n log n)"
    On2 = "O(n^2)"
    On3 = "O(n^3)"
    O2n = "O(2^n)"
    Onfact = "O(n!)"

# User Model
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), unique=True, index=True)
    email = Column(String(50), unique=True)
    password = Column(String(255))
    joined_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationship to track user's progress on algorithms
    user_progress = relationship("UserProgress", back_populates="user")
    blog = relationship("Blog", back_populates="user")

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

    # Relationships
    type = relationship("AlgorithmType", back_populates="algorithms")
    user_progress = relationship("UserProgress", back_populates="algorithm")

# UserProgress Model
class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    algo_id = Column(Integer, ForeignKey("algorithms.id"), nullable=False)
    status = Column(Enum(AlgoStatus), default=AlgoStatus.enrolled, nullable=False)
    started_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    last_updated = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    finished_at = Column(TIMESTAMP, nullable=True)

    # Relationships
    user = relationship("User", back_populates="user_progress")
    algorithm = relationship("Algorithm", back_populates="user_progress")

# BLOG

class Blog(Base):
    __tablename__ = "blog"

    id = Column(Integer, unique=True, primary_key=True, index=True, autoincrement=True)
    title = Column(String(250), nullable=False)
    body = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey(User.id), nullable=False)  
    created_at = Column(TIMESTAMP, server_default=func.now())  
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="blog")