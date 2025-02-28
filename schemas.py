import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import AlgoDifficulty, AlgoComplexity, AlgoStatus


class login(BaseModel):
    username: EmailStr
    password: str

    class Config:
        from_attributes = True

class ShowBlog(BaseModel):
    title: str
    body: str
    author: str
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
    title: str
    body: str

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
    email: EmailStr
    joined_at: datetime

    class Config:
        from_attributes = True

class UpdateUser(BaseModel):
    name: str
    email: EmailStr

    class Config:
        from_attributes = True

class AlgorithmProgress(BaseModel):
    algorithm: str
    status: str

    class Config:
        from_attributes = True

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

class AddAlgorithmType(BaseModel):
    name: str
    description: str

    class Config:
        from_attributes = True

class UpdateAlgorithmType(BaseModel):
    name: str
    description: str

    class Config:
        from_attributes = True

class ShowAlgorithmType(BaseModel):
    id: int
    name: str
    description: str

    class Config:
        from_attributes = True

class AddAlgorithm(BaseModel):
    name: str
    description: str
    difficulty: AlgoDifficulty
    complexity: AlgoComplexity
    type_id: int

    class Config:
        from_attributes = True

class UpdateAlgorithm(BaseModel):
    name: str
    description: str
    difficulty: AlgoDifficulty
    complexity: AlgoComplexity
    type_id: int

    class Config:
        from_attributes = True

class ShowAlgorithm(BaseModel):
    id: int
    name: str
    type_name: str
    description: str
    difficulty: AlgoDifficulty
    complexity: AlgoComplexity

    class Config:
        from_attributes = True

class AddUserProgress(BaseModel):
    algo_id: int
    status: AlgoStatus

    class Config:
        from_attributes = True

class UpdateUserProgress(BaseModel):
    status: AlgoStatus

    class Config:
        from_attributes = True


class ShowUserProgress(BaseModel):
    id: int
    user_name: Optional[str] = None
    algorithm_name: Optional[str] = None
    status: AlgoStatus

    class Config:
        from_attributes = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
