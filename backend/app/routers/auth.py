from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserLogin, TokenResponse, UserOut
from ..auth import hash_password, verify_password, create_access_token

router = APIRouter()


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(body: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=body.email.lower(),
        hashed_password=hash_password(body.password),
        name=body.name,
        birthdate=body.birthdate,
        gender=body.gender,
        interested_in=body.interested_in,
        photos=[],
        interests=[],
        vibes=[],
        analyzed_features=[],
        type_preferences=[],
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id})
    return {"token": token, "user": user}


@router.post("/login", response_model=TokenResponse)
def login(body: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.id})
    return {"token": token, "user": user}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(lambda: None)):  # replaced at runtime
    return current_user
