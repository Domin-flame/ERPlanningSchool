from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.crud import CRUDBase
from app.database import get_db

router = APIRouter(tags=["Academic Calendar"])

academic_year_crud = CRUDBase(models.AcademicYear, "academic_year_id")
semester_crud = CRUDBase(models.Semester, "semester_id")


# ---------------------------------------------------------------------------
# Academic_year
# ---------------------------------------------------------------------------
@router.post("/academic-years/", response_model=schemas.AcademicYearRead, status_code=status.HTTP_201_CREATED)
def create_academic_year(payload: schemas.AcademicYearCreate, db: Session = Depends(get_db)):
    return academic_year_crud.create(db, payload.model_dump())


@router.get("/academic-years/", response_model=List[schemas.AcademicYearRead])
def list_academic_years(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return academic_year_crud.get_multi(db, skip, limit)


@router.get("/academic-years/{academic_year_id}", response_model=schemas.AcademicYearRead)
def get_academic_year(academic_year_id: int, db: Session = Depends(get_db)):
    obj = academic_year_crud.get(db, academic_year_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Année académique introuvable")
    return obj


@router.put("/academic-years/{academic_year_id}", response_model=schemas.AcademicYearRead)
def update_academic_year(academic_year_id: int, payload: schemas.AcademicYearUpdate, db: Session = Depends(get_db)):
    obj = academic_year_crud.get(db, academic_year_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Année académique introuvable")
    return academic_year_crud.update(db, obj, payload.model_dump(exclude_unset=True))


@router.delete("/academic-years/{academic_year_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_academic_year(academic_year_id: int, db: Session = Depends(get_db)):
    obj = academic_year_crud.get(db, academic_year_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Année académique introuvable")
    academic_year_crud.remove(db, academic_year_id)


# ---------------------------------------------------------------------------
# Semester
# ---------------------------------------------------------------------------
@router.post("/semesters/", response_model=schemas.SemesterRead, status_code=status.HTTP_201_CREATED)
def create_semester(payload: schemas.SemesterCreate, db: Session = Depends(get_db)):
    if not academic_year_crud.get(db, payload.academic_year_id):
        raise HTTPException(status_code=404, detail="Année académique parente introuvable")
    return semester_crud.create(db, payload.model_dump())


@router.get("/semesters/", response_model=List[schemas.SemesterRead])
def list_semesters(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return semester_crud.get_multi(db, skip, limit)


@router.get("/semesters/{semester_id}", response_model=schemas.SemesterRead)
def get_semester(semester_id: int, db: Session = Depends(get_db)):
    obj = semester_crud.get(db, semester_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Semestre introuvable")
    return obj


@router.put("/semesters/{semester_id}", response_model=schemas.SemesterRead)
def update_semester(semester_id: int, payload: schemas.SemesterUpdate, db: Session = Depends(get_db)):
    obj = semester_crud.get(db, semester_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Semestre introuvable")
    return semester_crud.update(db, obj, payload.model_dump(exclude_unset=True))


@router.delete("/semesters/{semester_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_semester(semester_id: int, db: Session = Depends(get_db)):
    obj = semester_crud.get(db, semester_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Semestre introuvable")
    semester_crud.remove(db, semester_id)
