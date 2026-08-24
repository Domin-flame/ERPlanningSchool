from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.crud import CRUDBase
from app.database import get_db
from app.events import publish_enrollment_created
from app.routers.offerings import class_schedule_crud, course_offering_crud, exam_crud
from app.routers.people import student_crud
from app.authz import assert_owns_enrollment, assert_owns_exam, assert_owns_schedule, assert_owns_session, get_current_teacher

router = APIRouter(tags=["Academic Records"])

enrollment_crud = CRUDBase(models.Enrollment, "enrollment_id")
grade_crud = CRUDBase(models.Grade, "grade_id")
session_crud = CRUDBase(models.ClassSession, "session_id")
attendance_crud = CRUDBase(models.Attendance, "attendance_id")


# ---------------------------------------------------------------------------
# Enrollment
# ---------------------------------------------------------------------------
@router.post("/enrollments/", response_model=schemas.EnrollmentRead, status_code=status.HTTP_201_CREATED)
def create_enrollment(payload: schemas.EnrollmentCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    student = student_crud.get(db, payload.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")
    offering = course_offering_crud.get(db, payload.course_offering_id)
    if not offering:
        raise HTTPException(status_code=404, detail="Offre de cours introuvable")
    existing = (
        db.query(models.Enrollment)
        .filter(
            models.Enrollment.student_id == payload.student_id,
            models.Enrollment.course_offering_id == payload.course_offering_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Cet étudiant est déjà inscrit à cette offre de cours")

    enrollment = enrollment_crud.create(db, payload.model_dump())

    # ── Workflow asynchrone (RabbitMQ) ──────────────────────────────────
    # "a student enrolls" -> Service A (academic) publie l'événement et
    # répond immédiatement au client (voir app/events.py). Service B
    # (finance-service) consomme l'événement en tâche de fond et crée la
    # facture correspondante — academic-service n'attend jamais Finance.
    course = offering.course
    background_tasks.add_task(
        publish_enrollment_created,
        enrollment_id=enrollment.enrollment_id,
        student_id=student.student_id,
        user_id=student.user_id,
        matricule=student.matricule,
        full_name=student.user.name if student.user else student.matricule,
        course_offering_id=offering.course_offering_id,
        course_code=course.code if course else "N/A",
        course_title=course.title if course else offering.name,
        credits=course.credits if course else 0,
    )

    return enrollment


@router.get("/enrollments/", response_model=List[schemas.EnrollmentRead])
def list_enrollments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return enrollment_crud.get_multi(db, skip, limit)


@router.get("/enrollments/{enrollment_id}", response_model=schemas.EnrollmentRead)
def get_enrollment(enrollment_id: int, db: Session = Depends(get_db)):
    obj = enrollment_crud.get(db, enrollment_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Inscription introuvable")
    return obj


@router.put("/enrollments/{enrollment_id}", response_model=schemas.EnrollmentRead)
def update_enrollment(enrollment_id: int, payload: schemas.EnrollmentUpdate, db: Session = Depends(get_db)):
    obj = enrollment_crud.get(db, enrollment_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Inscription introuvable")
    return enrollment_crud.update(db, obj, payload.model_dump(exclude_unset=True))


@router.delete("/enrollments/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_enrollment(enrollment_id: int, db: Session = Depends(get_db)):
    obj = enrollment_crud.get(db, enrollment_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Inscription introuvable")
    enrollment_crud.remove(db, enrollment_id)


# ---------------------------------------------------------------------------
# Grade
# ---------------------------------------------------------------------------
@router.post("/grades/", response_model=schemas.GradeRead, status_code=status.HTTP_201_CREATED)
def create_grade(payload: schemas.GradeCreate, db: Session = Depends(get_db), teacher=Depends(get_current_teacher)):
    if not exam_crud.get(db, payload.exam_id):
        raise HTTPException(status_code=404, detail="Examen introuvable")
    if not enrollment_crud.get(db, payload.enrollment_id):
        raise HTTPException(status_code=404, detail="Inscription introuvable")
    assert_owns_exam(db, teacher, payload.exam_id)
    assert_owns_enrollment(db, teacher, payload.enrollment_id)
    return grade_crud.create(db, payload.model_dump())


@router.get("/grades/", response_model=List[schemas.GradeRead])
def list_grades(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return grade_crud.get_multi(db, skip, limit)


@router.get("/grades/{grade_id}", response_model=schemas.GradeRead)
def get_grade(grade_id: int, db: Session = Depends(get_db)):
    obj = grade_crud.get(db, grade_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Note introuvable")
    return obj


@router.put("/grades/{grade_id}", response_model=schemas.GradeRead)
def update_grade(grade_id: int, payload: schemas.GradeUpdate, db: Session = Depends(get_db), teacher=Depends(get_current_teacher)):
    obj = grade_crud.get(db, grade_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Note introuvable")
    assert_owns_exam(db, teacher, payload.exam_id or obj.exam_id)
    assert_owns_enrollment(db, teacher, payload.enrollment_id or obj.enrollment_id)
    return grade_crud.update(db, obj, payload.model_dump(exclude_unset=True))


@router.delete("/grades/{grade_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_grade(grade_id: int, db: Session = Depends(get_db), teacher=Depends(get_current_teacher)):
    obj = grade_crud.get(db, grade_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Note introuvable")
    assert_owns_exam(db, teacher, obj.exam_id)
    grade_crud.remove(db, grade_id)


# ---------------------------------------------------------------------------
# Session (séance de cours)
# ---------------------------------------------------------------------------
@router.post("/sessions/", response_model=schemas.SessionRead, status_code=status.HTTP_201_CREATED)
def create_session(payload: schemas.SessionCreate, db: Session = Depends(get_db), teacher=Depends(get_current_teacher)):
    if not class_schedule_crud.get(db, payload.schedule_id):
        raise HTTPException(status_code=404, detail="Créneau introuvable")
    assert_owns_schedule(db, teacher, payload.schedule_id)
    return session_crud.create(db, payload.model_dump())


@router.get("/sessions/", response_model=List[schemas.SessionRead])
def list_sessions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return session_crud.get_multi(db, skip, limit)


@router.get("/sessions/{session_id}", response_model=schemas.SessionRead)
def get_session(session_id: int, db: Session = Depends(get_db)):
    obj = session_crud.get(db, session_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Séance introuvable")
    return obj


@router.put("/sessions/{session_id}", response_model=schemas.SessionRead)
def update_session(session_id: int, payload: schemas.SessionUpdate, db: Session = Depends(get_db), teacher=Depends(get_current_teacher)):
    obj = session_crud.get(db, session_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Séance introuvable")
    assert_owns_session(db, teacher, session_id)
    if payload.schedule_id is not None:
        assert_owns_schedule(db, teacher, payload.schedule_id)
    return session_crud.update(db, obj, payload.model_dump(exclude_unset=True))


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: int, db: Session = Depends(get_db), teacher=Depends(get_current_teacher)):
    obj = session_crud.get(db, session_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Séance introuvable")
    assert_owns_session(db, teacher, session_id)
    session_crud.remove(db, session_id)


# ---------------------------------------------------------------------------
# Attendance
# ---------------------------------------------------------------------------
@router.post("/attendances/", response_model=schemas.AttendanceRead, status_code=status.HTTP_201_CREATED)
def create_attendance(payload: schemas.AttendanceCreate, db: Session = Depends(get_db), teacher=Depends(get_current_teacher)):
    if not session_crud.get(db, payload.session_id):
        raise HTTPException(status_code=404, detail="Séance introuvable")
    if not enrollment_crud.get(db, payload.enrollment_id):
        raise HTTPException(status_code=404, detail="Inscription introuvable")
    assert_owns_session(db, teacher, db.get(models.ClassSession, payload.session_id).session_id)
    assert_owns_enrollment(db, teacher, payload.enrollment_id)
    return attendance_crud.create(db, payload.model_dump())


@router.get("/attendances/", response_model=List[schemas.AttendanceRead])
def list_attendances(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return attendance_crud.get_multi(db, skip, limit)


@router.get("/attendances/{attendance_id}", response_model=schemas.AttendanceRead)
def get_attendance(attendance_id: int, db: Session = Depends(get_db)):
    obj = attendance_crud.get(db, attendance_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Présence introuvable")
    return obj


@router.put("/attendances/{attendance_id}", response_model=schemas.AttendanceRead)
def update_attendance(attendance_id: int, payload: schemas.AttendanceUpdate, db: Session = Depends(get_db), teacher=Depends(get_current_teacher)):
    obj = attendance_crud.get(db, attendance_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Présence introuvable")
    assert_owns_session(db, teacher, payload.session_id or obj.session_id)
    assert_owns_enrollment(db, teacher, payload.enrollment_id or obj.enrollment_id)
    return attendance_crud.update(db, obj, payload.model_dump(exclude_unset=True))


@router.delete("/attendances/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendance(attendance_id: int, db: Session = Depends(get_db), teacher=Depends(get_current_teacher)):
    obj = attendance_crud.get(db, attendance_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Présence introuvable")
    assert_owns_session(db, teacher, obj.session_id)
    assert_owns_enrollment(db, teacher, obj.enrollment_id)
    attendance_crud.remove(db, attendance_id)
