from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    birthdate: str
    gender: str
    interested_in: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ProfileUpdate(BaseModel):
    bio: Optional[str] = None
    city: Optional[str] = None
    interests: Optional[List[str]] = None
    vibes: Optional[List[str]] = None
    type_preferences: Optional[List[str]] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    show_me: Optional[bool] = None
    interested_in: Optional[str] = None


class ProfileOut(BaseModel):
    id: str
    name: str
    birthdate: str
    city: Optional[str]
    bio: Optional[str]
    photos: List[str]
    interests: List[str]
    vibes: List[str]
    match_score: Optional[float] = None
    analyzed_features: List[str]
    onboarding_complete: bool

    class Config:
        from_attributes = True


class UserOut(ProfileOut):
    email: str
    gender: str
    interested_in: str
    email_verified: bool
    min_age: int
    max_age: int
    show_me: bool


class TokenResponse(BaseModel):
    token: str
    user: UserOut


class SwipeRequest(BaseModel):
    target_id: str
    direction: str  # 'left', 'right', 'super'


class SwipeResponse(BaseModel):
    matched: bool
    match_id: Optional[str] = None
    match_score: Optional[float] = None


class MessageCreate(BaseModel):
    content: str = ""
    media_url: Optional[str] = None
    media_type: Optional[str] = None  # 'image', 'video', 'gif'


class MessageOut(BaseModel):
    id: str
    content: str
    sender_id: str
    created_at: datetime
    read: bool = False
    media_url: Optional[str] = None
    media_type: Optional[str] = None

    class Config:
        from_attributes = True


class MatchOut(BaseModel):
    id: str
    profile: ProfileOut
    matched_at: datetime
    last_message: Optional[MessageOut] = None
    unread: int = 0

    class Config:
        from_attributes = True


class BlockCreate(BaseModel):
    blocked_id: str


class ReportCreate(BaseModel):
    reported_id: str
    reason: str  # 'spam', 'inappropriate', 'harassment', 'fake', 'underage', 'other'
    details: Optional[str] = None


class BlockOut(BaseModel):
    id: str
    blocked_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class SignupPendingResponse(BaseModel):
    message: str
    email: str


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str


class ResendCodeRequest(BaseModel):
    email: EmailStr
