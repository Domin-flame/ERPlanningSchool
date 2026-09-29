from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/api/v1/conversations", tags=["Conversations"])


@router.get("/", response_model=schemas.PaginatedConversations)
def list_conversations(
    skip:  int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db:    Session = Depends(get_db),
    user=Depends(get_current_user),
):
    conv_ids = [
        p.conversation_id
        for p in db.query(models.ConversationParticipant)
        .filter_by(user_id=user.user_id)
        .all()
    ]

    base_q = (
        db.query(models.Conversation)
        .filter(models.Conversation.id.in_(conv_ids))
        .order_by(models.Conversation.created_at.desc())
    )
    total = base_q.count()
    convs = base_q.offset(skip).limit(limit).all()

    result = []
    for conv in convs:
        last = (
            db.query(models.Message)
            .filter_by(conversation_id=conv.id)
            .order_by(models.Message.created_at.desc())
            .first()
        )
        unread = (
            db.query(models.Message)
            .filter(
                models.Message.conversation_id == conv.id,
                models.Message.sender_id != user.user_id,
                models.Message.is_read == False,  # noqa: E712
            )
            .count()
        )
        result.append(
            schemas.ConversationOut(
                id=conv.id,
                name=conv.name,
                avatar=conv.avatar,
                role=conv.role,
                is_group=conv.is_group,
                last_message=last.content if last else None,
                last_message_at=last.created_at if last else None,
                unread=unread,
                created_at=conv.created_at,
            )
        )

    return schemas.PaginatedConversations(total=total, skip=skip, limit=limit, items=result)


@router.post("/", response_model=schemas.ConversationOut, status_code=201)
def create_conversation(
    payload: schemas.ConversationCreate,
    db:      Session = Depends(get_db),
    user=Depends(get_current_user),
):
    conv = models.Conversation(
        name=payload.name,
        avatar=payload.avatar,
        role=payload.role,
        is_group=payload.is_group,
        created_by=user.user_id,
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)

    db.add(models.ConversationParticipant(conversation_id=conv.id, user_id=user.user_id))
    for pid in payload.participant_ids:
        if pid != user.user_id:
            db.add(models.ConversationParticipant(conversation_id=conv.id, user_id=pid))
    db.commit()

    return schemas.ConversationOut(
        id=conv.id,
        name=conv.name,
        avatar=conv.avatar,
        role=conv.role,
        is_group=conv.is_group,
        created_at=conv.created_at,
    )
