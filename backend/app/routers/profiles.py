from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from ..database import get_db
from ..models import User
from ..schemas import ProfileUpdate, ProfileOut, UserOut
from ..auth import get_current_user
from ..services.face_analysis import analyze_face_features
from ..services.storage import upload_photo

router = APIRouter()


@router.get("/me", response_model=UserOut)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_profile(
    body: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/photo", response_model=UserOut)
async def upload_profile_photo(
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    url = await upload_photo(photo)
    photos = list(current_user.photos or [])
    photos.insert(0, url)
    current_user.photos = photos[:6]  # max 6 photos
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/analyze-face")
async def analyze_face(
    photo: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    features = await analyze_face_features(photo)
    return {"features": features}


@router.post("/complete-onboarding", response_model=UserOut)
async def complete_onboarding(
    photos: List[UploadFile] = File(...),
    interests: str = Form(...),
    vibes: str = Form(...),
    type_preferences: str = Form(...),
    bio: str = Form(...),
    analyzed_features: str = Form("[]"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Upload photos
    photo_urls = []
    for photo in photos[:6]:
        url = await upload_photo(photo)
        photo_urls.append(url)

    # If no analyzed features from client, analyze first photo
    features = json.loads(analyzed_features)
    if not features and photos:
        features = await analyze_face_features(photos[0])

    current_user.photos = photo_urls
    current_user.interests = json.loads(interests)
    current_user.vibes = json.loads(vibes)
    current_user.type_preferences = json.loads(type_preferences)
    current_user.analyzed_features = features
    current_user.bio = bio
    current_user.onboarding_complete = True

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=ProfileOut)
def get_profile(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="Profile not found")
    return user
