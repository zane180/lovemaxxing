from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User, Block, Report, Match
from ..schemas import BlockCreate, ReportCreate, BlockOut
from ..auth import get_current_user

router = APIRouter()

VALID_REPORT_REASONS = {"spam", "inappropriate", "harassment", "fake", "underage", "other"}


@router.post("/block", status_code=201)
def block_user(body: BlockCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if body.blocked_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")

    target = db.query(User).filter(User.id == body.blocked_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(Block).filter(
        Block.blocker_id == current_user.id,
        Block.blocked_id == body.blocked_id,
    ).first()
    if existing:
        return {"message": "Already blocked"}

    block = Block(blocker_id=current_user.id, blocked_id=body.blocked_id)
    db.add(block)
    db.commit()

    return {"message": "User blocked"}


@router.delete("/block/{blocked_id}")
def unblock_user(blocked_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    block = db.query(Block).filter(
        Block.blocker_id == current_user.id,
        Block.blocked_id == blocked_id,
    ).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")

    db.delete(block)
    db.commit()
    return {"message": "User unblocked"}


@router.get("/blocked")
def get_blocked_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    blocks = db.query(Block).filter(Block.blocker_id == current_user.id).all()
    return {
        "blocked": [
            {"id": b.id, "blocked_id": b.blocked_id, "created_at": b.created_at}
            for b in blocks
        ]
    }


@router.post("/report", status_code=201)
def report_user(body: ReportCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if body.reported_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot report yourself")

    if body.reason not in VALID_REPORT_REASONS:
        raise HTTPException(status_code=400, detail=f"Invalid reason. Must be one of: {', '.join(VALID_REPORT_REASONS)}")

    target = db.query(User).filter(User.id == body.reported_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent duplicate reports
    existing = db.query(Report).filter(
        Report.reporter_id == current_user.id,
        Report.reported_id == body.reported_id,
    ).first()
    if existing:
        return {"message": "Already reported"}

    report = Report(
        reporter_id=current_user.id,
        reported_id=body.reported_id,
        reason=body.reason,
        details=body.details,
    )
    db.add(report)

    # Auto-block after reporting
    existing_block = db.query(Block).filter(
        Block.blocker_id == current_user.id,
        Block.blocked_id == body.reported_id,
    ).first()
    if not existing_block:
        block = Block(blocker_id=current_user.id, blocked_id=body.reported_id)
        db.add(block)

    db.commit()
    return {"message": "Report submitted. We'll review it within 24 hours."}
