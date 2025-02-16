from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base  # Assuming you have a database.py file setting up SQLAlchemy

# Users Table
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), nullable=False, unique=True)
    password = Column(String(255), nullable=False)  # Should be stored hashed
    email = Column(String(255), nullable=False, unique=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Relationship with UserProgress
    progress = relationship("UserProgress", back_populates="user")

# Algorithm Types Table
class AlgorithmType(Base):
    __tablename__ = "algorithm_types"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True)
    description = Column(Text, nullable=True)

    # Relationship with Algorithms
    algorithms = relationship("Algorithm", back_populates="algorithm_type")

# Algorithms Table
class Algorithm(Base):
    __tablename__ = "algorithms"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String, nullable=False, index=True)  # Ensure this field exists
    description = Column(String, nullable=False)
    complexity = Column(String, nullable=False)
    type_id = Column(Integer, ForeignKey("algorithm_types.id"), nullable=False)

    # Relationship with AlgorithmType
    algorithm_type = relationship("AlgorithmType", back_populates="algorithms")

    # Relationship with UserProgress
    progress = relationship("UserProgress", back_populates="algorithm")

# User Progress Table
class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    algorithm_id = Column(Integer, ForeignKey("algorithms.id"), nullable=False)
    completed_steps = Column(Integer, nullable=False, default=0)
    last_accessed = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    # Relationships
    user = relationship("User", back_populates="progress")
    algorithm = relationship("Algorithm", back_populates="progress")
