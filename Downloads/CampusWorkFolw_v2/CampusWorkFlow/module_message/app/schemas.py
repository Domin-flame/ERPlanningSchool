from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ConversationCreate(BaseModel):
    name:            str
    avatar:          Optional[str] = None
    role:            str = "Direct"
    is_group:        bool = False
    participant_ids: list[int] = []


class ConversationOut(BaseModel):
    id:              str
    name:            str
    avatar:          Optional[str] = None
    role:            str = "Direct"
    is_group:        bool = False
    last_message:    Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread:          int = 0
    created_at:      Optional[datetime] = None

    class Config:
        from_attributes = True


class PaginatedConversations(BaseModel):
    total: int
    skip:  int
    limit: int
    items: list[ConversationOut]


class MessageCreate(BaseModel):
    conversation_id: str
    content:         str


class MessageUpdate(BaseModel):
    content: str


class MessageOut(BaseModel):
    id:              str
    conversation_id: str
    sender_id:       int
    sender_name:     str
    content:         str
    is_read:         bool = False
    created_at:      Optional[datetime] = None

    class Config:
        from_attributes = True


class PaginatedMessages(BaseModel):
    total: int
    skip:  int
    limit: int
    items: list[MessageOut]
