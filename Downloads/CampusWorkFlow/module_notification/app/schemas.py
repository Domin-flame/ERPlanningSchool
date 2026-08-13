from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NotificationBase(BaseModel):
    title:    str
    message:  str
    type:     str = "info"      # info | success | warning | error
    category: str = "system"   # academic | finance | hr | system


class NotificationCreate(NotificationBase):
    user_id: int


class NotificationOut(NotificationBase):
    id:         str
    read:       bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaginatedNotifications(BaseModel):
    total: int
    skip:  int
    limit: int
    items: list[NotificationOut]


class NotificationMarkRead(BaseModel):
    ids: list[str] = []   # vide = marquer tout comme lu
