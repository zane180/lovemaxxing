"""
Admin endpoints — protected by ADMIN_SECRET header.
Set ADMIN_SECRET in Railway env vars.
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models import User, Match, Message, Swipe, Block, Report, PasswordResetToken
from ..config import settings

router = APIRouter()


def verify_admin(x_admin_secret: Optional[str] = Header(None)):
    admin_secret = getattr(settings, "ADMIN_SECRET", None)
    if not admin_secret:
        raise HTTPException(status_code=503, detail="Admin not configured")
    if x_admin_secret != admin_secret:
        raise HTTPException(status_code=403, detail="Invalid admin secret")


@router.get("/users")
def list_users(
    search: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin),
):
    """List all users. Optionally filter by email or name."""
    query = db.query(User)
    if search:
        query = query.filter(
            User.email.ilike(f"%{search}%") | User.name.ilike(f"%{search}%")
        )
    users = query.order_by(User.created_at.desc()).limit(limit).all()
    return {"users": [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "gender": u.gender,
            "is_active": u.is_active,
            "email_verified": u.email_verified,
            "onboarding_complete": u.onboarding_complete,
            "created_at": u.created_at,
        }
        for u in users
    ]}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    hard: bool = False,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin),
):
    """
    Delete a user by ID.
    - hard=false (default): soft delete — marks inactive, clears PII
    - hard=true: permanently removes all data from database
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if hard:
        # Get all match IDs involving this user
        match_ids = [m.id for m in db.query(Match).filter(
            (Match.user1_id == user_id) | (Match.user2_id == user_id)
        ).all()]
        # Delete all messages in those matches first
        if match_ids:
            db.query(Message).filter(Message.match_id.in_(match_ids)).delete(synchronize_session=False)
        # Delete matches
        db.query(Match).filter(
            (Match.user1_id == user_id) | (Match.user2_id == user_id)
        ).delete(synchronize_session=False)
        db.query(Swipe).filter(
            (Swipe.swiper_id == user_id) | (Swipe.target_id == user_id)
        ).delete(synchronize_session=False)
        db.query(Block).filter(
            (Block.blocker_id == user_id) | (Block.blocked_id == user_id)
        ).delete(synchronize_session=False)
        db.query(Report).filter(
            (Report.reporter_id == user_id) | (Report.reported_id == user_id)
        ).delete(synchronize_session=False)
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user_id
        ).delete(synchronize_session=False)
        db.delete(user)
        db.commit()
        return {"message": f"User {user_id} permanently deleted"}
    else:
        user.is_active = False
        user.email = f"deleted_{user_id}@deleted.lovemaxxing.com"
        user.name = "Deleted User"
        user.bio = None
        user.photos = []
        user.interests = []
        user.vibes = []
        user.analyzed_features = []
        user.type_preferences = []
        db.commit()
        return {"message": f"User {user_id} soft deleted"}


@router.patch("/users/{user_id}/reactivate")
def reactivate_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: None = Depends(verify_admin),
):
    """Reactivate a soft-deleted user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    db.commit()
    return {"message": f"User {user_id} reactivated"}
