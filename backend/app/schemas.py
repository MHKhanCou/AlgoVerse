import datetime
from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional, List, Any, Dict
from datetime import datetime
from .models import AlgoDifficulty, AlgoComplexity, AlgoStatus, BlogStatus

class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)


# /register reports whether the verification OTP email was dispatched, which
# the signup page reads to decide whether to send the user to the OTP screen.
# It lives on its own model so the generic APIResponse shape stays stable.
class RegisterResponse(APIResponse):
    email_sent: Optional[bool] = None

# Auth Schemas
class Login(BaseModel):  # Fixed: Capitalized class name
    username: EmailStr
    password: str

    model_config = ConfigDict(from_attributes=True)

# User schemas
class ShowUser(BaseModel):
    id: int
    name: str
    email: str
    is_admin: bool
    codeforces_handle: Optional[str] = None
    joined_at: Optional[datetime] = None  # Fixed: renamed from created_at

    model_config = ConfigDict(from_attributes=True)

class ShowBlog(BaseModel):
    id: int
    title: Optional[str] = None
    body: Optional[str] = None
    author: Optional[str] = None
    author_id: Optional[int] = None
    user: Optional[ShowUser] = None
    created_at: datetime
    updated_at: datetime
    status: BlogStatus
    admin_feedback: Optional[str] = None
    approved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class AddBlog(BaseModel):
    title: str
    body: str 

    model_config = ConfigDict(from_attributes=True)

class UpdateBlog(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Algorithm schemas

class AlgorithmProgress(BaseModel):
    algorithm_name: str
    status: AlgoStatus

    model_config = ConfigDict(from_attributes=True)

class AddAlgorithmType(BaseModel):
    name: str
    description: str

    model_config = ConfigDict(from_attributes=True)

class UpdateAlgorithmType(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ShowAlgorithmType(BaseModel):
    id: int
    name: Optional[str] = None
    description: Optional[str] = None
    

    model_config = ConfigDict(from_attributes=True)


class AddAlgorithm(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    difficulty: AlgoDifficulty
    complexity: AlgoComplexity
    type_id: int
    code: Optional[str] = None
    explanation: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class UpdateAlgorithm(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[AlgoDifficulty] = None
    complexity: Optional[AlgoComplexity] = None
    type_id: Optional[int] = None
    explanation: Optional[str] = None
    code: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

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

    model_config = ConfigDict(from_attributes=True)
      
class UserProfile(BaseModel):
    id: int
    name: str
    email: EmailStr
    codeforces_handle: Optional[str] = None
    progress: List[AlgorithmProgress]

    model_config = ConfigDict(from_attributes=True)

# Public-facing profile for guests and other users (no sensitive fields)
class PublicUserProfile(BaseModel):
    id: int
    name: str
    codeforces_handle: Optional[str] = None
    topics_covered: List[str] = []
    total_algorithms_enrolled: int
    total_algorithms_completed: int
    joined_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# Public projection for the anonymous /users routes.
#
# These routes used to serialize ShowUser, which carries the email address and
# the is_admin flag. GET /users/ has no auth dependency, so any caller could
# page through every account and harvest addresses plus the list of admins.
# Nothing in the frontend reads these two routes (src/services/userService.js
# only calls /users/{id}/public), so the fields can be dropped outright.
class PublicUser(BaseModel):
    id: int
    name: str
    codeforces_handle: Optional[str] = None
    joined_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PublicUserWithProgress(PublicUser):
    """Same as PublicUser plus the enrolled/completed algorithm list."""

    progress: List[AlgorithmProgress] = []


class UpdatePassword(BaseModel):
    old_password: str
    new_password: str

    model_config = ConfigDict(from_attributes=True)

class UpdateName(BaseModel):
    name: str

    model_config = ConfigDict(from_attributes=True)

class UpdateEmail(BaseModel):
    email: EmailStr
    """Request payload for updating a user's email address."""

    model_config = ConfigDict(from_attributes=True)

class RegisterUser(BaseModel):
    name: str
    email: EmailStr
    password: str

    model_config = ConfigDict(from_attributes=True)

class UpdateUser(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    codeforces_handle: Optional[str] = None

class BatchProgressRequest(BaseModel):
    algorithm_ids: List[int]

    model_config = ConfigDict(from_attributes=True)

class UpdateCodeforcesHandle(BaseModel):
    codeforces_handle: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

  
# User progress schemas
class AddUserProgress(BaseModel):
    algo_id: int
    status: str  # Ensure 'enrolled' and 'completed' are valid values
    user_id: Optional[int] = None  # Optional, set by backend

    model_config = ConfigDict(from_attributes=True)

class UpdateUserProgress(BaseModel):
    status: AlgoStatus
    finished_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


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

    model_config = ConfigDict(from_attributes=True)

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[dict] = None

class TokenData(BaseModel):
    email: Optional[str] = None

# Email verification and password reset schemas
class EmailVerification(BaseModel):
    token: str
    """Request payload for verifying a user's email address."""

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    token: str
    new_password: str

class ResendVerification(BaseModel):
    email: EmailStr

# Email change with OTP flow
class RequestEmailOtp(BaseModel):
    email: EmailStr
    """Request payload for requesting an OTP to change a user's email address."""

class VerifyEmailOtp(BaseModel):
    email: EmailStr
    otp: str
    """Request payload for verifying an OTP to change a user's email address."""

# Blog moderation schemas
class BlogModerationAction(BaseModel):
    status: BlogStatus
    admin_feedback: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Comment schemas
class AddComment(BaseModel):
    content: str
    parent_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class UpdateComment(BaseModel):
    content: str

    model_config = ConfigDict(from_attributes=True)

class ShowComment(BaseModel):
    id: int
    blog_id: int
    user_id: int
    content: str
    parent_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    is_edited: bool
    author_name: str
    replies: List['ShowComment'] = []

    model_config = ConfigDict(from_attributes=True)

# Forward reference for nested comments
ShowComment.model_rebuild()

# Algorithm Comment schemas
class AddAlgorithmComment(BaseModel):
    content: str
    parent_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class UpdateAlgorithmComment(BaseModel):
    content: str

    model_config = ConfigDict(from_attributes=True)

class ShowAlgorithmComment(BaseModel):
    id: int
    algorithm_id: int
    user_id: int
    content: str
    parent_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    is_edited: bool
    likes: int = 0
    author_name: str
    replies: List['ShowAlgorithmComment'] = []

    model_config = ConfigDict(from_attributes=True)

# Forward reference for nested algorithm comments
ShowAlgorithmComment.model_rebuild()

# schemas.py
class ContestCacheBase(BaseModel):
    source: str
    data: Dict[str, Any]
    last_fetched_at: datetime

class ContestCacheCreate(ContestCacheBase):
    pass


class ContestCache(ContestCacheBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
