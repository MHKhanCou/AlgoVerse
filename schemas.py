from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class blog(BaseModel):
    name: str
    body: str
    published: Optional[bool]

class UserCreate(BaseModel):
    username: str
    password: str
    email: EmailStr

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True

class AlgorithmCreate(BaseModel):
    name: str
    description: str
    complexity: str
    type_id: int

class AlgorithmResponse(BaseModel):
    id: int
    name: str
    description: str
    complexity: str
    type_id: int

    class Config:
        from_attributes = True

class AlgorithmTypeBase(BaseModel):
    name: str
    description: str

class AlgorithmTypeCreate(AlgorithmTypeBase):
    pass

class AlgorithmTypeResponse(AlgorithmTypeBase):
    id: int

    class Config:
        from_attributes = True

# Updated User Progress schemas
class UserProgressBase(BaseModel):
    user_id: int
    algorithm_id: int
    completed_steps: int

class UserProgressCreate(UserProgressBase):
    # Provide a default value for completed_steps if not sent
    completed_steps: Optional[int] = 0

class UserProgressResponse(UserProgressBase):
    id: int
    last_accessed: datetime

    class Config:
        from_attributes = True