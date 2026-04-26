from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, File, UploadFile
from sqlalchemy.orm import Session
from typing import Dict, List
import json
import logging

from jose import JWTError, jwt

from ..database import get_db, SessionLocal
from ..models import User, Match, Message, Block
from ..schemas import MessageCreate, MessageOut
from ..auth import get_current_user
from ..config import settings
from ..services.storage import upload_chat_media

router = APIRouter()
logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, List[WebSocket]] = {}

    async def connect(self, match_id: str, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(match_id, []).append(ws)

    def disconnect(self, match_id: str, ws: WebSocket):
        if match_id in self.active:
            self.active[match_id] = [w for w in self.active[match_id] if w != ws]

    async def broadcast(self, match_id: str, data: dict):
        for ws in list(self.active.get(match_id, [])):
            try:
                await ws.send_text(json.dumps(data, default=str))
            except Exception:
                pass


manager = ConnectionManager()


def _get_match(match_id_or_user_id: str, current_user: User, db: Session) -> Match:
    match = db.query(Match).filter(
        Match.id == match_id_or_user_id,
        (Match.user1_id == current_user.id) | (Match.user2_id == current_user.id),
    ).first()

    if not match:
        match = db.query(Match).filter(
            ((Match.user1_id == current_user.id) & (Match.user2_id == match_id_or_user_id)) |
            ((Match.user1_id == match_id_or_user_id) & (Match.user2_id == current_user.id))
        ).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match


def _serialize_message(m: Message) -> dict:
    return {
        "id": m.id,
        "content": m.content,
        "sender_id": m.sender_id,
        "created_at": m.created_at,
        "read": m.read,
        "media_url": m.media_url,
        "media_type": m.media_type,
    }


@router.get("/{match_id}/messages")
async def get_messages(
    match_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    match = _get_match(match_id, current_user, db)

    updated = db.query(Message).filter(
        Message.match_id == match.id,
        Message.sender_id != current_user.id,
        Message.read == False,
    ).update({"read": True})
    db.commit()

    if updated:
        await manager.broadcast(match.id, {
            "type": "read",
            "reader_id": current_user.id,
        })

    msgs = db.query(Message).filter(
        Message.match_id == match.id
    ).order_by(Message.created_at.asc()).all()

    return {"messages": [_serialize_message(m) for m in msgs]}


@router.post("/{match_id}/read")
async def mark_read(
    match_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    match = _get_match(match_id, current_user, db)

    updated = db.query(Message).filter(
        Message.match_id == match.id,
        Message.sender_id != current_user.id,
        Message.read == False,
    ).update({"read": True})
    db.commit()

    if updated:
        await manager.broadcast(match.id, {
            "type": "read",
            "reader_id": current_user.id,
        })

    return {"marked": updated}


@router.post("/{match_id}/media")
async def upload_media(
    match_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload an image or video for use in a chat message."""
    match = _get_match(match_id, current_user, db)

    content_type = file.content_type or ""
    if content_type.startswith("image/"):
        media_type = "image"
        max_size = 10 * 1024 * 1024  # 10 MB
    elif content_type.startswith("video/"):
        media_type = "video"
        max_size = 50 * 1024 * 1024  # 50 MB
    else:
        raise HTTPException(status_code=400, detail="Only images and videos are supported")

    contents = await file.read()
    if len(contents) > max_size:
        limit = "10 MB" if media_type == "image" else "50 MB"
        raise HTTPException(status_code=400, detail=f"File too large (max {limit})")

    try:
        url = await upload_chat_media(contents, media_type, file.filename or "")
    except Exception:
        raise HTTPException(status_code=500, detail="Upload failed")

    return {"url": url, "media_type": media_type}


@router.post("/{match_id}/messages", response_model=MessageOut)
async def send_message(
    match_id: str,
    body: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.content.strip() and not body.media_url:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    match = _get_match(match_id, current_user, db)

    other_id = match.user2_id if match.user1_id == current_user.id else match.user1_id
    block = db.query(Block).filter(
        ((Block.blocker_id == current_user.id) & (Block.blocked_id == other_id)) |
        ((Block.blocker_id == other_id) & (Block.blocked_id == current_user.id))
    ).first()
    if block:
        raise HTTPException(status_code=403, detail="Cannot message this user")

    msg = Message(
        match_id=match.id,
        sender_id=current_user.id,
        content=body.content.strip(),
        media_url=body.media_url,
        media_type=body.media_type,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    await manager.broadcast(match.id, {
        "type": "message",
        **_serialize_message(msg),
        "created_at": msg.created_at.isoformat(),
    })

    return msg


@router.websocket("/ws/{match_id}")
async def websocket_endpoint(ws: WebSocket, match_id: str, token: str = Query(...)):
    """Authenticated real-time WebSocket for chat. Pass JWT as ?token= query param."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            await ws.close(code=4001)
            return
    except JWTError:
        await ws.close(code=4001)
        return

    db = SessionLocal()
    try:
        match = db.query(Match).filter(
            Match.id == match_id,
            (Match.user1_id == user_id) | (Match.user2_id == user_id)
        ).first()
        if not match:
            await ws.close(code=4003)
            return
    finally:
        db.close()

    await manager.connect(match_id, ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(match_id, ws)
    except Exception as e:
        logger.error(f"WebSocket error in match {match_id}: {e}")
        manager.disconnect(match_id, ws)
