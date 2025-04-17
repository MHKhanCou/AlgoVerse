import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime
from models import AlgoDifficulty, AlgoComplexity, AlgoStatus

class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

    class Config:
        from_attributes = True

# Auth Schemas
class Login(BaseModel):  # Fixed: Capitalized class name
    username: EmailStr
    password: str

    class Config:
        from_attributes = True

class ShowBlog(BaseModel):
    id: int
    title: Optional[str] = None
    body: Optional[str] = None
    author: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AddBlog(BaseModel):
    title: str
    body: str 

    class Config:
        from_attributes = True

class UpdateBlog(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None

    class Config:
        from_attributes = True

# Algorithm schemas

class AlgorithmProgress(BaseModel):
    algorithm_name: str
    status: AlgoStatus

    class Config:
        from_attributes = True

class AddAlgorithmType(BaseModel):
    name: str
    description: str

    class Config:
        from_attributes = True

class UpdateAlgorithmType(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True

class ShowAlgorithmType(BaseModel):
    id: int
    name: Optional[str] = None
    description: Optional[str] = None
    

    class Config:
        from_attributes = True


class AddAlgorithm(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    difficulty: AlgoDifficulty
    complexity: AlgoComplexity
    type_id: int
    code: Optional[str] = None
    explanation: Optional[str] = None

    class Config:
        from_attributes = True

class UpdateAlgorithm(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[AlgoDifficulty] = None
    complexity: Optional[AlgoComplexity] = None
    type_id: Optional[int] = None
    explanation: Optional[str] = None
    code: Optional[str] = None

    class Config:
        from_attributes = True

class ShowAlgorithm(BaseModel):
    id: int
    name: str
    type_id: int
    type_name: str
    description: str
    difficulty: AlgoDifficulty
    complexity: AlgoComplexity
    explanation: Optional[str] = None
    code: Optional[str] = None

    class Config:
        from_attributes = True
      
# User schemas

class UserProfile(BaseModel):
    id: int
    name: str
    email: EmailStr
    progress: List[AlgorithmProgress]

    class Config:
        from_attributes = True

class UpdatePassword(BaseModel):
    old_password: str
    new_password: str

    class Config:
        from_attributes = True

class UpdateName(BaseModel):
    name: str

    class Config:
        from_attributes = True

class UpdateEmail(BaseModel):
    email: EmailStr

    class Config:
        from_attributes = True

class RegisterUser(BaseModel):
    name: str
    email: EmailStr
    password: str

    class Config:
        from_attributes = True

class ShowUser(BaseModel):
    id: int
    name: str
    email: str
    is_admin: bool
    joined_at: Optional[datetime] = None  # Fixed: renamed from created_at

    class Config:
        from_attributes = True  # Fixed: removed duplicate Config

class UpdateUser(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

    class Config:
        from_attributes = True

  
# User progress schemas
class AddUserProgress(BaseModel):
    algo_id: int
    status: str  # Ensure 'enrolled' and 'completed' are valid values
    user_id: Optional[int] = None  # Optional, set by backend

    class Config:
        from_attributes = True

class UpdateUserProgress(BaseModel):
    status: AlgoStatus
    finished_at: Optional[datetime] = None
    class Config:
        from_attributes = True


class ShowUserProgress(BaseModel):
    id: int
    user_id: int  # Added user_id field
    algo_id: int
    user_name: Optional[str] = None
    algorithm_name: Optional[str] = None
    status: AlgoStatus
    started_at: datetime
    last_accessed: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    algorithm: Optional[ShowAlgorithm] = None

    class Config:
        from_attributes = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[dict] = None

class TokenData(BaseModel):
    email: Optional[str] = None
