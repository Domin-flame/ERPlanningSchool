from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from app import models
from app.database import get_db

router = APIRouter(prefix="/student/me", tags=["Student Portal"])


def _student_or_403(db: Session, user_id: Optional[int], role: Optional[str]):
    if (role or "").lower() != "student" or not user_id:
        raise HTTPException(status_code=403, detail="Acces reserve aux etudiants")
    student = db.query(models.Student).filter(models.Student.user_id == user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Profil etudiant introuvable")
    return student


def _semester_average(enrollments):
    weighted_total = 0.0
    weight_total = 0.0
    for enrollment in enrollments:
        for grade in enrollment.grades:
            maximum = float(grade.exam.max_score or 20)
            score = float(grade.score) * 20 / maximum if maximum else 0
            weight = float(grade.exam.weight_percentage or 100)
            weighted_total += score * weight
            weight_total += weight
    return round(weighted_total / weight_total, 2) if weight_total else None


@router.get("/overview")
def student_overview(
    semester_id: Optional[int] = Query(None),
    x_user_id: Optional[int] = Header(None),
    x_user_role: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    student = _student_or_403(db, x_user_id, x_user_role)
    today = date.today()
    semester = (
        db.query(models.Semester)
        .filter(models.Semester.start_date <= today, models.Semester.end_date >= today)
        .first()
        if semester_id is None
        else db.query(models.Semester).filter(models.Semester.semester_id == semester_id).first()
    )
    enrollments = list(student.enrollments)
    current = [
        enrollment
        for enrollment in enrollments
        if semester and enrollment.course_offering and enrollment.course_offering.semester_id == semester.semester_id
    ]

    courses = []
    for enrollment in current:
        offering = enrollment.course_offering
        course = offering.course
        average = _semester_average([enrollment])
        courses.append({
            "enrollment_id": enrollment.enrollment_id,
            "course_offering_id": offering.course_offering_id,
            "code": course.code,
            "title": course.title,
            "credits": course.credits,
            "module_id": course.module_id,
            "module_title": course.module.title if course.module else None,
            "average": average,
            "progress": round(sum(1 for grade in enrollment.grades if grade.score is not None) / max(len(offering.exams), 1) * 100),
            "grades": [
                {
                    "grade_id": grade.grade_id,
                    "score": float(grade.score),
                    "max_score": float(grade.exam.max_score),
                    "exam_type": grade.exam.exam_type,
                    "weight_percentage": float(grade.exam.weight_percentage),
                    "exam_id": grade.exam_id,
                }
                for grade in enrollment.grades
            ],
        })

    previous = None
    if semester:
        previous = (
            db.query(models.Semester)
            .filter(models.Semester.end_date < semester.start_date)
            .order_by(models.Semester.end_date.desc())
            .first()
        )
    previous_enrollments = [
        enrollment for enrollment in enrollments
        if previous and enrollment.course_offering and enrollment.course_offering.semester_id == previous.semester_id
    ]
    current_average = _semester_average(current)
    previous_average = _semester_average(previous_enrollments)
    validated_credits = sum(course["credits"] for course in courses if (course["average"] or 0) >= 10)

    start = today - timedelta(days=today.weekday())
    end = start + timedelta(days=7)
    schedule = []
    for enrollment in current:
        offering = enrollment.course_offering
        for class_schedule in offering.class_schedules:
            for session in class_schedule.sessions:
                if start <= session.session_date < end:
                    schedule.append({
                        "session_id": session.session_id,
                        "date": session.session_date,
                        "status": session.status,
                        "topic": session.topic_covered,
                        "day_of_week": class_schedule.day_of_week,
                        "start_time": class_schedule.start_time,
                        "end_time": class_schedule.end_time,
                        "room": class_schedule.room.room_name or class_schedule.room.room_number,
                        "code": offering.course.code,
                        "title": offering.course.title,
                    })
    schedule.sort(key=lambda item: (item["date"], item["start_time"]))

    return {
        "student": {
            "student_id": student.student_id,
            "matricule": student.matricule,
            "status": student.status,
            "level": student.program.level,
            "program": student.program.name,
            "faculty": student.program.department.faculty.name,
            "cycle": student.program.level,
        },
        "semester": {
            "semester_id": semester.semester_id if semester else None,
            "name": semester.term_name if semester else None,
            "academic_year": semester.academic_year.year_label if semester else None,
        },
        "courses": courses,
        "schedule": schedule,
        "summary": {
            "average": current_average,
            "previous_average": previous_average,
            "average_delta": round(current_average - previous_average, 2) if current_average is not None and previous_average is not None else None,
            "validated_credits": validated_credits,
            "course_count": len(courses),
        },
    }