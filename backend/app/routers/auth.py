import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, PasswordResetToken
from ..schemas import UserCreate, UserLogin, TokenResponse, UserOut, ForgotPasswordRequest, ResetPasswordRequest
from ..auth import hash_password, verify_password, create_access_token, get_current_user
from ..services.email import send_verification_email, send_password_reset_email

router = APIRouter()

EMAIL_TOKEN_EXPIRE_HOURS = 24
RESET_TOKEN_EXPIRE_HOURS = 1


def _generate_token() -> str:
    return secrets.token_urlsafe(32)


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    email_token = _generate_token()
    email_token_expires = datetime.now(timezone.utc) + timedelta(hours=EMAIL_TOKEN_EXPIRE_HOURS)

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
        email_verified=False,
        email_token=email_token,
        email_token_expires=email_token_expires,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    background_tasks.add_task(send_verification_email, user.email, user.name, email_token)

    token = create_access_token({"sub": user.id})
    return {"token": token, "user": user}


@router.post("/login", response_model=TokenResponse)
def login(body: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account suspended")

    token = create_access_token({"sub": user.id})
    return {"token": token, "user": user}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification link")

    now = datetime.now(timezone.utc)
    if user.email_token_expires and user.email_token_expires.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(status_code=400, detail="Verification link has expired")

    user.email_verified = True
    user.email_token = None
    user.email_token_expires = None
    db.commit()

    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
async def resend_verification(background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.email_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    email_token = _generate_token()
    email_token_expires = datetime.now(timezone.utc) + timedelta(hours=EMAIL_TOKEN_EXPIRE_HOURS)
    current_user.email_token = email_token
    current_user.email_token_expires = email_token_expires
    db.commit()

    print(f"[AUTH] Queuing verification email for {current_user.email}", flush=True)
    background_tasks.add_task(send_verification_email, current_user.email, current_user.name, email_token)
    return {"message": "Verification email sent"}


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    # Always return 200 to prevent email enumeration
    if not user:
        return {"message": "If that email exists, a reset link has been sent"}

    # Invalidate any existing tokens
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False,
    ).update({"used": True})
    db.commit()

    token = _generate_token()
    reset = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS),
    )
    db.add(reset)
    db.commit()

    background_tasks.add_task(send_password_reset_email, user.email, user.name, token)
    return {"message": "If that email exists, a reset link has been sent"}


@router.post("/change-password")
def change_password(
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_password = body.get("current_password", "")
    new_password = body.get("new_password", "")

    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    current_user.hashed_password = hash_password(new_password)
    db.commit()
    return {"message": "Password updated successfully"}


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    reset = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == body.token,
        PasswordResetToken.used == False,
    ).first()

    if not reset:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    now = datetime.now(timezone.utc)
    if reset.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(status_code=400, detail="Reset link has expired")

    user = db.query(User).filter(User.id == reset.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(body.new_password)
    reset.used = True
    db.commit()

    return {"message": "Password reset successfully"}
