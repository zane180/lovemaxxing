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


class ProfileUpdate(BaseModel):
    bio: Optional[str] = None
    city: Optional[str] = None
    interests: Optional[List[str]] = None
    vibes: Optional[List[str]] = None
    type_preferences: Optional[List[str]] = None


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
    content: str


class MessageOut(BaseModel):
    id: str
    content: str
    sender_id: str
    created_at: datetime

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
