"""Autorisation objet pour les ressources académiques."""
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.database import get_db


def get_current_role(x_user_role: str = Header(..., alias="X-User-Role")) -> str:
    return x_user_role.lower()


def get_current_email(x_user_email: str = Header(..., alias="X-User-Email")) -> str:
    return x_user_email.lower()


def get_current_academic_user(
    email: str = Depends(get_current_email),
    db: Session = Depends(get_db),
) -> models.User:
    user = db.query(models.User).filter(models.User.email.ilike(email)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Aucun profil académique n'est associé à ce compte.")
    return user


def get_current_teacher(
    role: str = Depends(get_current_role),
    academic_user: models.User = Depends(get_current_academic_user),
    db: Session = Depends(get_db),
):
    if role == "academic":
        return None
    teacher = db.query(models.Teacher).filter(models.Teacher.user_id == academic_user.user_id).first()
    if not teacher:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Votre compte n'est pas enregistré comme enseignant.")
    return teacher


def assert_owns_offering(db: Session, teacher, course_offering_id: int) -> None:
    if teacher is None:
        return
    offering = db.query(models.CourseOffering).filter(models.CourseOffering.course_offering_id == course_offering_id).first()
    if not offering:
        raise HTTPException(status_code=404, detail="Cours introuvable.")
    if offering.teacher_id != teacher.teacher_id:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas l'enseignant affecté à ce cours.")


def assert_owns_exam(db: Session, teacher, exam_id: int) -> models.Exam:
    exam = db.query(models.Exam).filter(models.Exam.exam_id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Épreuve introuvable.")
    assert_owns_offering(db, teacher, exam.course_offering_id)
    return exam


def assert_owns_enrollment(db: Session, teacher, enrollment_id: int) -> models.Enrollment:
    enrollment = db.query(models.Enrollment).filter(models.Enrollment.enrollment_id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Inscription introuvable.")
    assert_owns_offering(db, teacher, enrollment.course_offering_id)
    return enrollment


def assert_owns_schedule(db: Session, teacher, schedule_id: int) -> models.ClassSchedule:
    schedule = db.query(models.ClassSchedule).filter(models.ClassSchedule.schedule_id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Créneau introuvable.")
    assert_owns_offering(db, teacher, schedule.course_offering_id)
    return schedule


def assert_owns_session(db: Session, teacher, session_id: int) -> models.ClassSession:
    session = db.query(models.ClassSession).filter(models.ClassSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Séance introuvable.")
    assert_owns_offering(db, teacher, session.schedule.course_offering_id)
    return session
