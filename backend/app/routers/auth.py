import secrets
import random
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, PasswordResetToken
from ..schemas import (
    UserCreate, UserLogin, TokenResponse, UserOut,
    ForgotPasswordRequest, ResetPasswordRequest,
    VerifyCodeRequest, ResendCodeRequest, SignupPendingResponse,
)
from ..auth import hash_password, verify_password, create_access_token, get_current_user
from ..services.email import send_verification_code_email, send_password_reset_email

router = APIRouter()

CODE_EXPIRE_MINUTES = 10
RESET_TOKEN_EXPIRE_HOURS = 1


def _generate_token() -> str:
    return secrets.token_urlsafe(32)


def _generate_code() -> str:
    return f"{random.randint(0, 999999):06d}"


@router.post("/signup", response_model=SignupPendingResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email.lower()).first()

    if existing and existing.email_verified:
        raise HTTPException(status_code=400, detail="Email already registered")

    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    code = _generate_code()
    code_expires = datetime.now(timezone.utc) + timedelta(minutes=CODE_EXPIRE_MINUTES)

    if existing and not existing.email_verified:
        existing.hashed_password = hash_password(body.password)
        existing.name = body.name
        existing.birthdate = body.birthdate
        existing.gender = body.gender
        existing.interested_in = body.interested_in
        existing.email_token = code
        existing.email_token_expires = code_expires
        db.commit()
        db.refresh(existing)
        user = existing
    else:
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
            email_token=code,
            email_token_expires=code_expires,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    background_tasks.add_task(send_verification_code_email, user.email, user.name, code)
    return {"message": "Verification code sent to your email", "email": user.email}


@router.post("/verify-code", response_model=TokenResponse)
def verify_code(body: VerifyCodeRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect code. Please try again.")

    if user.email_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    if not user.email_token or user.email_token != body.code:
        raise HTTPException(status_code=400, detail="Incorrect code. Please try again.")

    now = datetime.now(timezone.utc)
    expires = user.email_token_expires
    if expires:
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires < now:
            raise HTTPException(status_code=400, detail="Code has expired. Request a new one.")

    user.email_verified = True
    user.email_token = None
    user.email_token_expires = None
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id})
    return {"token": token, "user": user}


@router.post("/resend-code")
async def resend_code(body: ResendCodeRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()

    if not user or user.email_verified:
        return {"message": "If that email is pending verification, a new code has been sent"}

    # Rate limit: allow resend only after 60 seconds
    if user.email_token_expires:
        expires = user.email_token_expires
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        seconds_remaining = (expires - datetime.now(timezone.utc)).total_seconds()
        if seconds_remaining > (CODE_EXPIRE_MINUTES * 60 - 60):
            raise HTTPException(status_code=429, detail="Please wait before requesting a new code")

    code = _generate_code()
    code_expires = datetime.now(timezone.utc) + timedelta(minutes=CODE_EXPIRE_MINUTES)
    user.email_token = code
    user.email_token_expires = code_expires
    db.commit()

    background_tasks.add_task(send_verification_code_email, user.email, user.name, code)
    return {"message": "New verification code sent"}


@router.post("/login", response_model=TokenResponse)
def login(body: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account suspended")
    if not user.email_verified:
        raise HTTPException(status_code=403, detail="Please verify your email before logging in")

    token = create_access_token({"sub": user.id})
    return {"token": token, "user": user}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user:
        return {"message": "If that email exists, a reset link has been sent"}

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
