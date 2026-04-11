from sqlalchemy import Column, String, DateTime, Boolean, Integer, Float, ForeignKey, JSON, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from .database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Gender(str, enum.Enum):
    man = "man"
    woman = "woman"
    nonbinary = "nonbinary"
    other = "other"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    birthdate = Column(String, nullable=False)
    gender = Column(String, nullable=False)
    interested_in = Column(String, nullable=False)
    city = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    photos = Column(JSON, default=list)          # list of URLs
    interests = Column(JSON, default=list)
    vibes = Column(JSON, default=list)
    analyzed_features = Column(JSON, default=list)   # AI-detected facial features
    type_preferences = Column(JSON, default=list)     # what they're attracted to
    onboarding_complete = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    sent_swipes = relationship("Swipe", foreign_keys="Swipe.swiper_id", back_populates="swiper")
    received_swipes = relationship("Swipe", foreign_keys="Swipe.target_id", back_populates="target")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")


class Swipe(Base):
    __tablename__ = "swipes"

    id = Column(String, primary_key=True, default=gen_uuid)
    swiper_id = Column(String, ForeignKey("users.id"), nullable=False)
    target_id = Column(String, ForeignKey("users.id"), nullable=False)
    direction = Column(String, nullable=False)  # 'left', 'right', 'super'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    swiper = relationship("User", foreign_keys=[swiper_id], back_populates="sent_swipes")
    target = relationship("User", foreign_keys=[target_id], back_populates="received_swipes")


class Match(Base):
    __tablename__ = "matches"

    id = Column(String, primary_key=True, default=gen_uuid)
    user1_id = Column(String, ForeignKey("users.id"), nullable=False)
    user2_id = Column(String, ForeignKey("users.id"), nullable=False)
    match_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])
    messages = relationship("Message", back_populates="match", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=gen_uuid)
    match_id = Column(String, ForeignKey("matches.id"), nullable=False)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    match = relationship("Match", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
