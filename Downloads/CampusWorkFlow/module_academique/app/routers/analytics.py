"""
Router Analytics — agrège les statistiques de l'ensemble du module académique.
Exposé via GET /analytics (via le gateway sous /api/academic/analytics).
Rôles autorisés : academic (direction) uniquement.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models
from app.database import get_db

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    """
    Retourne un résumé des KPI académiques :
    - Nombre total d'étudiants, enseignants, cours, programmes
    - Répartition des étudiants par statut
    - Nombre de cours par département (faculté)
    """
    total_students  = db.query(func.count(models.Student.student_id)).scalar() or 0
    total_teachers  = db.query(func.count(models.Teacher.teacher_id)).scalar() or 0
    total_courses   = db.query(func.count(models.Course.course_id)).scalar() or 0
    total_programs  = db.query(func.count(models.Programs.program_id)).scalar() or 0
    total_faculties = db.query(func.count(models.Faculty.faculty_id)).scalar() or 0

    # Répartition étudiants par statut
    status_counts = (
        db.query(models.Student.status, func.count(models.Student.student_id))
        .group_by(models.Student.status)
        .all()
    )

    # Cours par module — table modules not present in authoritative SQL; omitted
    module_counts = []

    # Programmes par département (top 10)
    dept_programs = (
        db.query(models.Department.name, func.count(models.Programs.program_id))
        .join(models.Programs, models.Programs.department_id == models.Department.department_id, isouter=True)
        .group_by(models.Department.name)
        .order_by(func.count(models.Programs.program_id).desc())
        .limit(10)
        .all()
    )

    return {
        "kpi": {
            "total_students":  total_students,
            "total_teachers":  total_teachers,
            "total_courses":   total_courses,
            "total_programs":  total_programs,
            "total_faculties": total_faculties,
        },
        "student_status_distribution": [
            {"status": s, "count": c} for s, c in status_counts
        ],
        "courses_per_module": [],
        "programs_per_department": [
            {"department": d, "count": c} for d, c in dept_programs
        ],
    }


@router.get("/finance-kpi")
def get_finance_kpi():
    """
    Placeholder — les KPI finance sont fournis par le service finance.
    Ce endpoint indique au frontend où les récupérer.
    """
    return {
        "source": "/api/finance/analytics/summary",
        "note": "Récupérer via le service finance",
    }
