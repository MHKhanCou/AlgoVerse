import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional

class login(BaseModel):
    username: str
    password: str
    class Config:
        from_attributes = True

class ShowBlog(BaseModel):
    title : str
    body : str
    created_at : datetime.datetime 
    updated_at : datetime.datetime 
    class Config:
        from_attributes = True

class AddBlog(BaseModel):
    title: str
    body: str
    user_id: int    
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
    name: str
    email: str
    joined_at: datetime.datetime
    class Config:
        from_attributes = True

class UpdateUser(BaseModel):
    name: str
    email: str
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
    difficulty: str
    complexity: str
    type_id: int
    class Config:
        from_attributes = True

class UpdateAlgorithm(BaseModel):
    name: str
    description: str
    difficulty: str
    complexity: str
    type_id: int
    class Config:
        from_attributes = True

class ShowAlgorithm(BaseModel):
    id: int
    name: str
    description: str
    difficulty: str
    complexity: str
    type_id: int
    class Config:
        from_attributes = True

class AddUserProgress(BaseModel):
    user_id: int
    algo_id: int
    status: str
    class Config:
        from_attributes = True

class UpdateUserProgress(BaseModel):
    status: str
    class Config:
        from_attributes = True

class ShowUserProgress(BaseModel):
    id: int
    user_id: int
    algo_id: int
    status: str
    class Config:
        from_attributes = True


# token schema

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None