from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import Dict, List
import json

from ..database import get_db, SessionLocal
from ..models import User, Match, Message
from ..schemas import MessageCreate, MessageOut
from ..auth import get_current_user

router = APIRouter()

# In-memory WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, List[WebSocket]] = {}  # match_id -> [ws]

    async def connect(self, match_id: str, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(match_id, []).append(ws)

    def disconnect(self, match_id: str, ws: WebSocket):
        if match_id in self.active:
            self.active[match_id] = [w for w in self.active[match_id] if w != ws]

    async def broadcast(self, match_id: str, data: dict, exclude: WebSocket = None):
        for ws in self.active.get(match_id, []):
            if ws != exclude:
                await ws.send_text(json.dumps(data))

manager = ConnectionManager()


def _get_match(match_id_or_user_id: str, current_user: User, db: Session) -> Match:
    """Get match by match_id OR by the other user's ID."""
    match = db.query(Match).filter(
        Match.id == match_id_or_user_id,
        (Match.user1_id == current_user.id) | (Match.user2_id == current_user.id),
    ).first()

    if not match:
        # Try finding by other user ID
        match = db.query(Match).filter(
            ((Match.user1_id == current_user.id) & (Match.user2_id == match_id_or_user_id)) |
            ((Match.user1_id == match_id_or_user_id) & (Match.user2_id == current_user.id))
        ).first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match


@router.get("/{match_id}/messages")
def get_messages(
    match_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    match = _get_match(match_id, current_user, db)

    # Mark messages as read
    db.query(Message).filter(
        Message.match_id == match.id,
        Message.sender_id != current_user.id,
        Message.read == False,
    ).update({"read": True})
    db.commit()

    msgs = db.query(Message).filter(
        Message.match_id == match.id
    ).order_by(Message.created_at.asc()).all()

    return {"messages": [
        {"id": m.id, "content": m.content, "sender_id": m.sender_id, "created_at": m.created_at}
        for m in msgs
    ]}


@router.post("/{match_id}/messages", response_model=MessageOut)
def send_message(
    match_id: str,
    body: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    match = _get_match(match_id, current_user, db)

    msg = Message(
        match_id=match.id,
        sender_id=current_user.id,
        content=body.content.strip(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.websocket("/ws/{match_id}")
async def websocket_endpoint(ws: WebSocket, match_id: str):
    """Real-time WebSocket for chat."""
    await manager.connect(match_id, ws)
    try:
        while True:
            data = await ws.receive_text()
            payload = json.loads(data)

            # Persist message
            db = SessionLocal()
            try:
                msg = Message(
                    match_id=match_id,
                    sender_id=payload["sender_id"],
                    content=payload["content"],
                )
                db.add(msg)
                db.commit()
                db.refresh(msg)

                out = {
                    "id": msg.id,
                    "content": msg.content,
                    "sender_id": msg.sender_id,
                    "created_at": msg.created_at.isoformat(),
                }
                await manager.broadcast(match_id, out)
            finally:
                db.close()

    except WebSocketDisconnect:
        manager.disconnect(match_id, ws)
