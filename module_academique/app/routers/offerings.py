from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.crud import CRUDBase
from app.database import get_db
from app.routers.academic_structure import course_crud
from app.routers.calendar import semester_crud
from app.routers.infrastructure import campus_crud, room_crud
from app.routers.people import teacher_crud
from app.authz import assert_owns_exam, assert_owns_offering, assert_owns_schedule, get_current_teacher

router = APIRouter(tags=["Course Offerings"])

course_offering_crud = CRUDBase(models.CourseOffering, "course_offering_id")
class_schedule_crud = CRUDBase(models.ClassSchedule, "schedule_id")
exam_crud = CRUDBase(models.Exam, "exam_id")


# ---------------------------------------------------------------------------
# Course_offering
# ---------------------------------------------------------------------------
@router.post("/course-offerings/", response_model=schemas.CourseOfferingRead, status_code=status.HTTP_201_CREATED)
def create_course_offering(payload: schemas.CourseOfferingCreate, db: Session = Depends(get_db)):
    if not campus_crud.get(db, payload.campus_id):
        raise HTTPException(status_code=404, detail="Campus introuvable")
    if not teacher_crud.get(db, payload.teacher_id):
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
def update_course_offering(course_offering_id: int, payload: schemas.CourseOfferingUpdate, db: Session = Depends(get_db), teacher=Depends(get_current_teacher)):
    obj = course_offering_crud.get(db, course_offering_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Offre de cours introuvable")
    assert_owns_offering(db, teacher, course_offering_id)
    return course_offering_crud.update(db, obj, payload.model_dump(exclude_unset=True))


@router.delete("/course-offerings/{course_offering_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course_offering(course_offering_id: int, db: Session = Depends(get_db), teacher=Depends(get_current_teacher)):
    obj = course_offering_crud.get(db, course_offering_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Offre de cours introuvable")
    assert_owns_offering(db, teacher, course_offering_id)
    course_offering_crud.remove(db, course_offering_id)


# ---------------------------------------------------------------------------
# Class_schedule
# ---------------------------------------------------------------------------
@router.post("/class-schedules/", response_model=schemas.ClassScheduleRead, status_code=status.HTTP_201_CREATED)
def create_class_schedule(payload: schemas.ClassScheduleCreate, db: Session = Depends(get_db)):
    if not room_crud.get(db, payload.room_id):
        raise HTTPException(status_code=404, detail="Salle introuvable")
    if not course_offering_crud.get(db, payload.course_offering_id):
        raise HTTPException(status_code=404, detail="Offre de cours introuvable")
    if payload.start_time >= payload.end_time:
        raise HTTPException(status_code=400, detail="start_time doit être antérieur à end_time")
    return class_schedule_crud.create(db, payload.model_dump())


@router.get("/class-schedules/", response_model=List[schemas.ClassScheduleRead])
def list_class_schedules(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return class_schedule_crud.get_multi(db, skip, limit)


@router.get("/class-schedules/{schedule_id}", response_model=schemas.ClassScheduleRead)
def get_class_schedule(schedule_id: int, db: Session = Depends(get_db)):
    obj = class_schedule_crud.get(db, schedule_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Créneau introuvable")
    return obj


@router.put("/class-schedules/{schedule_id}", response_model=schemas.ClassScheduleRead)
def update_class_schedule(schedule_id: int, payload: schemas.ClassScheduleUpdate, db: Session = Depends(get_db), teacher=Depends(get_current_teacher)):
    obj = class_schedule_crud.get(db, schedule_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Créneau introuvable")
    assert_owns_schedule(db, teacher, schedule_id)
    return class_schedule_crud.update(db, obj, payload.model_dump(exclude_unset=True))


@router.delete("/class-schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class_schedule(schedule_id: int, db: Session = Depends(get_db), teacher=Depends(get_current_teacher)):
    obj = class_schedule_crud.get(db, schedule_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Créneau introuvable")
    assert_owns_schedule(db, teacher, schedule_id)
    class_schedule_crud.remove(db, schedule_id)


# ---------------------------------------------------------------------------
# Exam
# ---------------------------------------------------------------------------
@router.post("/exams/", response_model=schemas.ExamRead, status_code=status.HTTP_201_CREATED)
def create_exam(payload: schemas.ExamCreate, db: Session = Depends(get_db), teacher=Depends(get_current_teacher)):
    if not course_offering_crud.get(db, payload.course_offering_id):
        raise HTTPException(status_code=404, detail="Offre de cours introuvable")
    assert_owns_offering(db, teacher, payload.course_offering_id)
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
def update_exam(exam_id: int, payload: schemas.ExamUpdate, db: Session = Depends(get_db), teacher=Depends(get_current_teacher)):
    obj = exam_crud.get(db, exam_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Examen introuvable")
    assert_owns_exam(db, teacher, exam_id)
    if payload.course_offering_id is not None:
        assert_owns_offering(db, teacher, payload.course_offering_id)
    return exam_crud.update(db, obj, payload.model_dump(exclude_unset=True))


@router.delete("/exams/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(exam_id: int, db: Session = Depends(get_db), teacher=Depends(get_current_teacher)):
    obj = exam_crud.get(db, exam_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Examen introuvable")
    assert_owns_exam(db, teacher, exam_id)
    exam_crud.remove(db, exam_id)
