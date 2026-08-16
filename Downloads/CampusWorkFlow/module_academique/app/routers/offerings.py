from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.crud import CRUDBase
from app.database import get_db
from app.routers.academic_structure import course_crud
from app.routers.calendar import semester_crud
from app.routers.people import teacher_crud

router = APIRouter(tags=["Course Offerings"])

course_offering_crud = CRUDBase(models.CourseOffering, "course_offering_id")
exam_crud = CRUDBase(models.Exam, "exam_id")


# ---------------------------------------------------------------------------
# Course_offering
# ---------------------------------------------------------------------------
@router.post("/course-offerings/", response_model=schemas.CourseOfferingRead, status_code=status.HTTP_201_CREATED)
def create_course_offering(payload: schemas.CourseOfferingCreate, db: Session = Depends(get_db)):
    if payload.teacher_id and not teacher_crud.get(db, payload.teacher_id):
        raise HTTPException(status_code=404, detail="Enseignant introuvable")
    if not course_crud.get(db, payload.course_id):
        raise HTTPException(status_code=404, detail="Cours introuvable")
    if not semester_crud.get(db, payload.semester_id):
        raise HTTPException(status_code=404, detail="Semestre introuvable")
    return course_offering_crud.create(db, payload.model_dump())


@router.get("/course-offerings/", response_model=List[schemas.CourseOfferingRead])
def list_course_offerings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return course_offering_crud.get_multi(db, skip, limit)


@router.get("/course-offerings/{course_offering_id}", response_model=schemas.CourseOfferingRead)
def get_course_offering(course_offering_id: int, db: Session = Depends(get_db)):
    obj = course_offering_crud.get(db, course_offering_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Offre de cours introuvable")
    return obj


@router.put("/course-offerings/{course_offering_id}", response_model=schemas.CourseOfferingRead)
def update_course_offering(course_offering_id: int, payload: schemas.CourseOfferingUpdate, db: Session = Depends(get_db)):
    obj = course_offering_crud.get(db, course_offering_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Offre de cours introuvable")
    return course_offering_crud.update(db, obj, payload.model_dump(exclude_unset=True))


@router.delete("/course-offerings/{course_offering_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course_offering(course_offering_id: int, db: Session = Depends(get_db)):
    obj = course_offering_crud.get(db, course_offering_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Offre de cours introuvable")
    course_offering_crud.remove(db, course_offering_id)


# Note: class schedule endpoints removed — not present in the authoritative SQL schema


# ---------------------------------------------------------------------------
# Exam
# ---------------------------------------------------------------------------
@router.post("/exams/", response_model=schemas.ExamRead, status_code=status.HTTP_201_CREATED)
def create_exam(payload: schemas.ExamCreate, db: Session = Depends(get_db)):
    if not course_offering_crud.get(db, payload.course_offering_id):
        raise HTTPException(status_code=404, detail="Offre de cours introuvable")
    return exam_crud.create(db, payload.model_dump())


@router.get("/exams/", response_model=List[schemas.ExamRead])
def list_exams(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return exam_crud.get_multi(db, skip, limit)


@router.get("/exams/{exam_id}", response_model=schemas.ExamRead)
def get_exam(exam_id: int, db: Session = Depends(get_db)):
    obj = exam_crud.get(db, exam_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Examen introuvable")
    return obj


@router.put("/exams/{exam_id}", response_model=schemas.ExamRead)
def update_exam(exam_id: int, payload: schemas.ExamUpdate, db: Session = Depends(get_db)):
    obj = exam_crud.get(db, exam_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Examen introuvable")
    return exam_crud.update(db, obj, payload.model_dump(exclude_unset=True))


@router.delete("/exams/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(exam_id: int, db: Session = Depends(get_db)):
    obj = exam_crud.get(db, exam_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Examen introuvable")
    exam_crud.remove(db, exam_id)
