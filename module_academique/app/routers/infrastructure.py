from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.crud import CRUDBase
from app.database import get_db

router = APIRouter(tags=["Infrastructure"])

campus_crud = CRUDBase(models.Campus, "campus_id")
building_crud = CRUDBase(models.Building, "building_id")
room_crud = CRUDBase(models.Room, "room_id")


# ---------------------------------------------------------------------------
# Campus
# ---------------------------------------------------------------------------
@router.post("/campuses/", response_model=schemas.CampusRead, status_code=status.HTTP_201_CREATED)
def create_campus(payload: schemas.CampusCreate, db: Session = Depends(get_db)):
    return campus_crud.create(db, payload.model_dump())


@router.get("/campuses/", response_model=List[schemas.CampusRead])
def list_campuses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return campus_crud.get_multi(db, skip, limit)


@router.get("/campuses/{campus_id}", response_model=schemas.CampusRead)
def get_campus(campus_id: int, db: Session = Depends(get_db)):
    obj = campus_crud.get(db, campus_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Campus introuvable")
    return obj


@router.put("/campuses/{campus_id}", response_model=schemas.CampusRead)
def update_campus(campus_id: int, payload: schemas.CampusUpdate, db: Session = Depends(get_db)):
    obj = campus_crud.get(db, campus_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Campus introuvable")
    return campus_crud.update(db, obj, payload.model_dump(exclude_unset=True))


@router.delete("/campuses/{campus_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campus(campus_id: int, db: Session = Depends(get_db)):
    obj = campus_crud.get(db, campus_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Campus introuvable")
    campus_crud.remove(db, campus_id)


# ---------------------------------------------------------------------------
# Building
# ---------------------------------------------------------------------------
@router.post("/buildings/", response_model=schemas.BuildingRead, status_code=status.HTTP_201_CREATED)
def create_building(payload: schemas.BuildingCreate, db: Session = Depends(get_db)):
    if not campus_crud.get(db, payload.campus_id):
        raise HTTPException(status_code=404, detail="Campus parent introuvable")
    return building_crud.create(db, payload.model_dump())


@router.get("/buildings/", response_model=List[schemas.BuildingRead])
def list_buildings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return building_crud.get_multi(db, skip, limit)


@router.get("/buildings/{building_id}", response_model=schemas.BuildingRead)
def get_building(building_id: int, db: Session = Depends(get_db)):
    obj = building_crud.get(db, building_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Bâtiment introuvable")
    return obj


@router.put("/buildings/{building_id}", response_model=schemas.BuildingRead)
def update_building(building_id: int, payload: schemas.BuildingUpdate, db: Session = Depends(get_db)):
    obj = building_crud.get(db, building_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Bâtiment introuvable")
    return building_crud.update(db, obj, payload.model_dump(exclude_unset=True))


@router.delete("/buildings/{building_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_building(building_id: int, db: Session = Depends(get_db)):
    obj = building_crud.get(db, building_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Bâtiment introuvable")
    building_crud.remove(db, building_id)


# ---------------------------------------------------------------------------
# Room
# ---------------------------------------------------------------------------
@router.post("/rooms/", response_model=schemas.RoomRead, status_code=status.HTTP_201_CREATED)
def create_room(payload: schemas.RoomCreate, db: Session = Depends(get_db)):
    if not building_crud.get(db, payload.building_id):
        raise HTTPException(status_code=404, detail="Bâtiment parent introuvable")
    return room_crud.create(db, payload.model_dump())


@router.get("/rooms/", response_model=List[schemas.RoomRead])
def list_rooms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return room_crud.get_multi(db, skip, limit)


@router.get("/rooms/{room_id}", response_model=schemas.RoomRead)
def get_room(room_id: int, db: Session = Depends(get_db)):
    obj = room_crud.get(db, room_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Salle introuvable")
    return obj


@router.put("/rooms/{room_id}", response_model=schemas.RoomRead)
def update_room(room_id: int, payload: schemas.RoomUpdate, db: Session = Depends(get_db)):
    obj = room_crud.get(db, room_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Salle introuvable")
    return room_crud.update(db, obj, payload.model_dump(exclude_unset=True))


@router.delete("/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(room_id: int, db: Session = Depends(get_db)):
    obj = room_crud.get(db, room_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Salle introuvable")
    room_crud.remove(db, room_id)
