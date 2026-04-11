"""
Lovemaxxing Matching Engine

Scoring weights:
  - Interest overlap:        40%
  - Vibe / humor alignment:  20%
  - Face type compatibility:  30%  (do my features match what they prefer?)
  - Mutual attraction check:  10%  (bonus if both sides align)

Score is 0-100.
"""
from typing import List, Optional
from ..models import User


def compute_match_score(user: User, candidate: User) -> float:
    score = 0.0

    # 1. Interest overlap (40 pts)
    my_interests = set(user.interests or [])
    their_interests = set(candidate.interests or [])
    if my_interests or their_interests:
        overlap = len(my_interests & their_interests)
        union = len(my_interests | their_interests)
        jaccard = overlap / union if union > 0 else 0
        score += jaccard * 40

    # 2. Vibe alignment (20 pts)
    my_vibes = set(user.vibes or [])
    their_vibes = set(candidate.vibes or [])
    if my_vibes or their_vibes:
        vibe_overlap = len(my_vibes & their_vibes)
        vibe_union = len(my_vibes | their_vibes)
        score += (vibe_overlap / vibe_union if vibe_union > 0 else 0) * 20

    # 3. Face type compatibility (30 pts)
    # Does the candidate's detected features match what I prefer?
    my_prefs = set(_normalize(p) for p in (user.type_preferences or []))
    their_features = set(_normalize(f) for f in (candidate.analyzed_features or []))
    if my_prefs and their_features:
        pref_match = len(my_prefs & their_features) / len(my_prefs)
        score += pref_match * 30

    # Also: do my features match what THEY prefer? (mutual attraction)
    their_prefs = set(_normalize(p) for p in (candidate.type_preferences or []))
    my_features = set(_normalize(f) for f in (user.analyzed_features or []))
    if their_prefs and my_features:
        reverse_match = len(their_prefs & my_features) / len(their_prefs)
        score += reverse_match * 10  # 10 pts mutual bonus

    return round(min(score, 100), 1)


def _normalize(text: str) -> str:
    """Lowercase and strip for comparison."""
    return text.lower().strip()


def get_candidates(current_user: User, db) -> List[User]:
    """
    Fetch users who:
    - Match the current user's gender preference
    - Haven't been swiped on yet by the current user
    - Have completed onboarding
    """
    from ..models import Swipe

    # IDs already swiped
    already_swiped = db.query(Swipe.target_id).filter(
        Swipe.swiper_id == current_user.id
    ).subquery()

    # Gender filter
    gender_filter = _build_gender_filter(current_user.interested_in)

    query = db.query(User).filter(
        User.id != current_user.id,
        User.is_active == True,
        User.onboarding_complete == True,
        ~User.id.in_(already_swiped),
    )

    if gender_filter:
        query = query.filter(User.gender.in_(gender_filter))

    candidates = query.limit(50).all()

    # Score and sort
    scored = [(c, compute_match_score(current_user, c)) for c in candidates]
    scored.sort(key=lambda x: x[1], reverse=True)
    return [(c, score) for c, score in scored]


def _build_gender_filter(interested_in: str) -> Optional[List[str]]:
    if interested_in == "men":
        return ["man"]
    elif interested_in == "women":
        return ["woman"]
    else:  # everyone
        return None
