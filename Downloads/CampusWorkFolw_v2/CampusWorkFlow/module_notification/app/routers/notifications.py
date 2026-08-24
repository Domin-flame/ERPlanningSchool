from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])


@router.get("/", response_model=schemas.PaginatedNotifications)
def list_notifications(
    unread_only: bool = False,
    include_archived: bool = False,
    category:    str | None = None,
    skip:        int = Query(0, ge=0, description="Nombre d'éléments à ignorer"),
    limit:       int = Query(20, ge=1, le=100, description="Nombre max d'éléments retournés"),
    db:          Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(models.Notification).filter(
        models.Notification.user_id == user.user_id
    )
    if unread_only:
        q = q.filter(models.Notification.read == False)  # noqa: E712
    if not include_archived:
        q = q.filter(models.Notification.archived == False)  # noqa: E712
    if category:
        q = q.filter(models.Notification.category == category)

    total = q.count()
    items = (
        q.order_by(models.Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return schemas.PaginatedNotifications(total=total, skip=skip, limit=limit, items=items)


@router.get("/unread-count", response_model=int)
def unread_count(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.Notification).filter(
        models.Notification.user_id == user.user_id,
        models.Notification.read == False,  # noqa: E712
    ).count()


@router.post("/", response_model=schemas.NotificationOut, status_code=201)
def create_notification(
    payload: schemas.NotificationCreate,
    db:      Session = Depends(get_db),
    user=Depends(get_current_user),
):
    notif = models.Notification(**payload.model_dump())
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


@router.post("/read", response_model=dict)
def mark_read(
    payload: schemas.NotificationMarkRead,
    db:      Session = Depends(get_db),
    user=Depends(get_current_user),
):
    q = db.query(models.Notification).filter(
        models.Notification.user_id == user.user_id
    )
    if payload.ids:
        q = q.filter(models.Notification.id.in_(payload.ids))
    q.update({"read": True}, synchronize_session=False)
    db.commit()
    return {"ok": True}


@router.delete("/{notification_id}", status_code=204)
def delete_notification(
    notification_id: str,
    db:              Session = Depends(get_db),
    user=Depends(get_current_user),
):
    notif = db.get(models.Notification, notification_id)
    if not notif or notif.user_id != user.user_id:
        raise HTTPException(404, "Notification introuvable")
    db.delete(notif)
    db.commit()


@router.patch("/{notification_id}/archive", response_model=schemas.NotificationOut)
def archive_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    notif = db.get(models.Notification, notification_id)
    if not notif or notif.user_id != user.user_id:
        raise HTTPException(404, "Notification introuvable")
    notif.archived = True
    db.commit()
    db.refresh(notif)
    return notif
