from typing import Generic, List, Optional, Type, TypeVar

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

ModelType = TypeVar("ModelType")


class CRUDBase(Generic[ModelType]):
    """Fournit les opérations CRUD génériques pour un modèle SQLAlchemy
    disposant d'une clé primaire simple (un seul champ)."""

    def __init__(self, model: Type[ModelType], pk_field: str):
        self.model = model
        self.pk_field = pk_field

    def get(self, db: Session, id_: int) -> Optional[ModelType]:
        return (
            db.query(self.model)
            .filter(getattr(self.model, self.pk_field) == id_)
            .first()
        )

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[ModelType]:
        return db.query(self.model).offset(skip).limit(limit).all()

    def get_paginated(self, db: Session, skip: int = 0, limit: int = 20) -> dict:
        """Retourne {'total': int, 'items': list} pour la pagination frontend."""
        total = db.query(self.model).count()
        items = db.query(self.model).offset(skip).limit(limit).all()
        return {"total": total, "skip": skip, "limit": limit, "items": items}

    def count(self, db: Session) -> int:
        return db.query(self.model).count()

    def create(self, db: Session, obj_in: dict) -> ModelType:
        db_obj = self.model(**obj_in)
        db.add(db_obj)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Un enregistrement {self.model.__name__} avec ces valeurs uniques existe déjà.",
            )
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: ModelType, obj_in: dict) -> ModelType:
        for field, value in obj_in.items():
            if value is not None:
                setattr(db_obj, field, value)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Conflit de mise à jour sur {self.model.__name__} (valeur unique déjà utilisée).",
            )
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, id_: int) -> Optional[ModelType]:
        obj = self.get(db, id_)
        if obj is not None:
            db.delete(obj)
            db.commit()
        return obj
