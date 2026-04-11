from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User, Swipe, Match
from ..schemas import SwipeRequest, SwipeResponse, MatchOut, ProfileOut
from ..auth import get_current_user
from ..services.matching_engine import get_candidates, compute_match_score

router = APIRouter()


@router.get("/discover")
def discover(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get ranked candidate profiles for the swipe stack."""
    scored_candidates = get_candidates(current_user, db)

    profiles = []
    for candidate, score in scored_candidates[:20]:
        profile_data = {
            "id": candidate.id,
            "name": candidate.name,
            "birthdate": candidate.birthdate,
            "city": candidate.city,
            "bio": candidate.bio,
            "photos": candidate.photos or [],
            "interests": candidate.interests or [],
            "vibes": candidate.vibes or [],
            "analyzed_features": candidate.analyzed_features or [],
            "onboarding_complete": candidate.onboarding_complete,
            "match_score": score,
        }
        profiles.append(profile_data)

    return {"profiles": profiles}


@router.post("/swipe", response_model=SwipeResponse)
def swipe(
    body: SwipeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a swipe and check for mutual match."""
    if body.target_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot swipe on yourself")

    target = db.query(User).filter(User.id == body.target_id, User.is_active == True).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent duplicate swipes
    existing = db.query(Swipe).filter(
        Swipe.swiper_id == current_user.id,
        Swipe.target_id == body.target_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already swiped on this user")

    # Record swipe
    swipe = Swipe(
        swiper_id=current_user.id,
        target_id=body.target_id,
        direction=body.direction,
    )
    db.add(swipe)
    db.commit()

    # Check for mutual right swipe
    if body.direction in ("right", "super"):
        mutual = db.query(Swipe).filter(
            Swipe.swiper_id == body.target_id,
            Swipe.target_id == current_user.id,
            Swipe.direction.in_(["right", "super"]),
        ).first()

        if mutual:
            # Check if match already exists
            existing_match = db.query(Match).filter(
                ((Match.user1_id == current_user.id) & (Match.user2_id == body.target_id)) |
                ((Match.user1_id == body.target_id) & (Match.user2_id == current_user.id))
            ).first()

            if not existing_match:
                score = compute_match_score(current_user, target)
                match = Match(
                    user1_id=current_user.id,
                    user2_id=body.target_id,
                    match_score=score,
                )
                db.add(match)
                db.commit()
                db.refresh(match)
                return SwipeResponse(matched=True, match_id=match.id, match_score=score)

    return SwipeResponse(matched=False)


@router.get("/matches")
def get_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all matches for current user."""
    matches = db.query(Match).filter(
        (Match.user1_id == current_user.id) | (Match.user2_id == current_user.id)
    ).order_by(Match.created_at.desc()).all()

    result = []
    for match in matches:
        # Get the other user
        other = match.user2 if match.user1_id == current_user.id else match.user1

        last_msg = None
        unread = 0
        if match.messages:
            sorted_msgs = sorted(match.messages, key=lambda m: m.created_at, reverse=True)
            last_msg = sorted_msgs[0]
            unread = sum(1 for m in match.messages if not m.read and m.sender_id != current_user.id)

        result.append({
            "id": match.id,
            "profile": {
                "id": other.id,
                "name": other.name,
                "birthdate": other.birthdate,
                "city": other.city,
                "bio": other.bio,
                "photos": other.photos or [],
                "interests": other.interests or [],
                "vibes": other.vibes or [],
                "analyzed_features": other.analyzed_features or [],
                "onboarding_complete": other.onboarding_complete,
                "match_score": match.match_score,
            },
            "matched_at": match.created_at,
            "last_message": {
                "id": last_msg.id,
                "content": last_msg.content,
                "sender_id": last_msg.sender_id,
                "created_at": last_msg.created_at,
            } if last_msg else None,
            "unread": unread,
        })

    return {"matches": result}
