from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db
from app.rabbitmq import publish_message_event

router = APIRouter(prefix="/api/v1/messages", tags=["Messages"])


@router.post("/", response_model=schemas.MessageOut, status_code=201)
async def send_message(
    payload: schemas.MessageCreate,
    request: Request,
    db:      Session = Depends(get_db),
    user=Depends(get_current_user),
):
    conv = db.get(models.Conversation, payload.conversation_id)
    if not conv:
        raise HTTPException(404, "Conversation introuvable")

    # Vérifier que l'expéditeur est bien participant
    is_participant = db.query(models.ConversationParticipant).filter_by(
        conversation_id=payload.conversation_id,
        user_id=user.user_id,
    ).first()
    if not is_participant:
        raise HTTPException(403, "Vous n'êtes pas participant de cette conversation")

    msg = models.Message(
        conversation_id=payload.conversation_id,
        sender_id=user.user_id,
        sender_name=user.sub or f"Utilisateur {user.user_id}",
        content=payload.content,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Broadcast WebSocket aux autres participants
    broadcast = getattr(request.app.state, "broadcast", None)
    if broadcast:
        await broadcast(
            payload.conversation_id,
            {
                "type": "new_message",
                "id": msg.id,
                "sender_id": msg.sender_id,
                "sender_name": msg.sender_name,
                "content": msg.content,
                "created_at": msg.created_at.isoformat() if msg.created_at else None,
            },
        )

    # Notifier les autres participants via RabbitMQ → notification-service
    other_participants = db.query(models.ConversationParticipant).filter(
        models.ConversationParticipant.conversation_id == payload.conversation_id,
        models.ConversationParticipant.user_id != user.user_id,
    ).all()

    for part in other_participants:
        await publish_message_event(
            recipient_user_id=part.user_id,
            sender_name=msg.sender_name,
            conversation_name=conv.name,
            preview=payload.content,
        )

    return msg


@router.get("/conversation/{conversation_id}", response_model=schemas.PaginatedMessages)
def list_messages(
    conversation_id: str,
    skip:  int = Query(0, ge=0),
    limit: int = Query(30, ge=1, le=100),
    db:    Session = Depends(get_db),
    user=Depends(get_current_user),
):
    conv = db.get(models.Conversation, conversation_id)
    if not conv:
        raise HTTPException(404, "Conversation introuvable")

    # Vérifier participation
    is_participant = db.query(models.ConversationParticipant).filter_by(
        conversation_id=conversation_id,
        user_id=user.user_id,
    ).first()
    if not is_participant:
        raise HTTPException(403, "Accès refusé")

    total = db.query(models.Message).filter_by(conversation_id=conversation_id).count()
    msgs = (
        db.query(models.Message)
        .filter_by(conversation_id=conversation_id)
        .order_by(models.Message.created_at.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    # Marquer comme lus
    for m in msgs:
        if m.sender_id != user.user_id and not m.is_read:
            m.is_read = True
    db.commit()

    return schemas.PaginatedMessages(total=total, skip=skip, limit=limit, items=msgs)


@router.patch("/{message_id}", response_model=schemas.MessageOut)
def update_message(
    message_id: str,
    payload: schemas.MessageUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    message = db.get(models.Message, message_id)
    if not message:
        raise HTTPException(404, "Message introuvable")
    if message.sender_id != user.user_id:
        raise HTTPException(403, "Vous ne pouvez modifier que vos messages")
    content = payload.content.strip()
    if not content:
        raise HTTPException(400, "Le message ne peut pas être vide")
    message.content = content
    db.commit()
    db.refresh(message)
    return message


@router.delete("/{message_id}", status_code=204)
def delete_message(
    message_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    message = db.get(models.Message, message_id)
    if not message:
        raise HTTPException(404, "Message introuvable")
    if message.sender_id != user.user_id:
        raise HTTPException(403, "Vous ne pouvez supprimer que vos messages")
    db.delete(message)
    db.commit()
