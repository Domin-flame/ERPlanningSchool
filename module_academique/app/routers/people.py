from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.crud import CRUDBase
from app.database import get_db
from app.events import publish_student_created

router = APIRouter(tags=["People"])

user_crud = CRUDBase(models.User, "user_id")
teacher_crud = CRUDBase(models.Teacher, "teacher_id")
student_crud = CRUDBase(models.Student, "student_id")

VALID_ROLES = {"Admin", "Teacher", "Student"}


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
@router.post("/users/", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if payload.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"role doit être l'un de {sorted(VALID_ROLES)}")
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    return user_crud.create(db, payload.model_dump())


@router.get("/users/", response_model=List[schemas.UserRead])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return user_crud.get_multi(db, skip, limit)


@router.get("/users/{user_id}", response_model=schemas.UserRead)
def get_user(user_id: int, db: Session = Depends(get_db)):
    obj = user_crud.get(db, user_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return obj


@router.put("/users/{user_id}", response_model=schemas.UserRead)
def update_user(user_id: int, payload: schemas.UserUpdate, db: Session = Depends(get_db)):
    obj = user_crud.get(db, user_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if payload.role and payload.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"role doit être l'un de {sorted(VALID_ROLES)}")
    return user_crud.update(db, obj, payload.model_dump(exclude_unset=True))


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    obj = user_crud.get(db, user_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    user_crud.remove(db, user_id)


# ---------------------------------------------------------------------------
# Teacher
# ---------------------------------------------------------------------------
@router.post("/teachers/", response_model=schemas.TeacherRead, status_code=status.HTTP_201_CREATED)
def create_teacher(payload: schemas.TeacherCreate, db: Session = Depends(get_db)):
    if not user_crud.get(db, payload.user_id):
        raise HTTPException(status_code=404, detail="Utilisateur parent introuvable")
    existing = db.query(models.Teacher).filter(models.Teacher.user_id == payload.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Cet utilisateur est déjà enregistré comme enseignant")
    return teacher_crud.create(db, payload.model_dump())


@router.get("/teachers/", response_model=List[schemas.TeacherRead])
def list_teachers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return teacher_crud.get_multi(db, skip, limit)


@router.get("/teachers/{teacher_id}", response_model=schemas.TeacherRead)
def get_teacher(teacher_id: int, db: Session = Depends(get_db)):
    obj = teacher_crud.get(db, teacher_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Enseignant introuvable")
    return obj


@router.put("/teachers/{teacher_id}", response_model=schemas.TeacherRead)
def update_teacher(teacher_id: int, payload: schemas.TeacherUpdate, db: Session = Depends(get_db)):
    obj = teacher_crud.get(db, teacher_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Enseignant introuvable")
    return teacher_crud.update(db, obj, payload.model_dump(exclude_unset=True))


@router.delete("/teachers/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    obj = teacher_crud.get(db, teacher_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Enseignant introuvable")
    teacher_crud.remove(db, teacher_id)


# ---------------------------------------------------------------------------
# Student
# ---------------------------------------------------------------------------
@router.post("/students/", response_model=schemas.StudentRead, status_code=status.HTTP_201_CREATED)
def create_student(payload: schemas.StudentCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    parent_user = user_crud.get(db, payload.user_id)
    if not parent_user:
        raise HTTPException(status_code=404, detail="Utilisateur parent introuvable")
    from app.routers.academic_structure import program_crud

    if not program_crud.get(db, payload.program_id):
        raise HTTPException(status_code=404, detail="Programme introuvable")
    existing = db.query(models.Student).filter(models.Student.user_id == payload.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Cet utilisateur est déjà enregistré comme étudiant")

    student = student_crud.create(db, payload.model_dump())

    # Publie un événement `academic.student.created` (workflow asynchrone) :
    # le service Finance l'utilisera pour peupler son cache student_ref
    # sans que cette requête HTTP n'attende sa réponse (voir app/events.py).
    background_tasks.add_task(
        publish_student_created,
        student_id=student.student_id,
        user_id=parent_user.user_id,
        matricule=student.matricule,
        full_name=parent_user.name,
    )

    return student


VALID_STUDENT_STATUSES = {"ACTIVE", "PENDING", "INACTIVE", "SUSPENDED"}


@router.post("/students/register", response_model=schemas.StudentRead, status_code=status.HTTP_201_CREATED)
def register_student(payload: schemas.StudentRegister, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Inscrit un nouvel étudiant : crée (ou réutilise) l'utilisateur puis le dossier étudiant.

    Évite au personnel académique de devoir saisir des identifiants techniques
    (user_id) : seuls le nom, l'email, le matricule et le programme sont requis.
    """
    from app.routers.academic_structure import program_crud

    name = payload.name.strip()
    matricule = payload.matricule.strip()
    status_value = payload.status.strip().upper()
    if not name or not matricule:
        raise HTTPException(status_code=422, detail="Le nom et le matricule sont obligatoires")
    if status_value not in VALID_STUDENT_STATUSES:
        raise HTTPException(status_code=422, detail=f"Statut invalide. Valeurs autorisées : {sorted(VALID_STUDENT_STATUSES)}")
    if not program_crud.get(db, payload.program_id):
        raise HTTPException(status_code=404, detail="Programme introuvable")
    if db.query(models.Student).filter(models.Student.matricule == matricule).first():
        raise HTTPException(status_code=409, detail="Ce matricule est déjà attribué")

    email = str(payload.email).lower()
    user = db.query(models.User).filter(func.lower(models.User.email) == email).first()
    if user:
        if user.student is not None:
            raise HTTPException(status_code=409, detail="Un étudiant utilise déjà cet email")
        if user.role != "Student":
            raise HTTPException(status_code=409, detail="Cet email appartient déjà à un membre du personnel")
    else:
        user = models.User(name=name, email=email, phone=payload.phone, role="Student")
        db.add(user)
        db.flush()

    student = models.Student(
        matricule=matricule,
        enrollment_date=payload.enrollment_date,
        status=status_value,
        program_id=payload.program_id,
        user_id=user.user_id,
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    background_tasks.add_task(
        publish_student_created,
        student_id=student.student_id,
        user_id=user.user_id,
        matricule=student.matricule,
        full_name=user.name,
    )
    return student


@router.get("/students/", response_model=List[schemas.StudentRead])
def list_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return student_crud.get_multi(db, skip, limit)


@router.get("/students/count", response_model=int)
def count_students(db: Session = Depends(get_db)):
    return student_crud.count(db)


@router.get("/students/{student_id}", response_model=schemas.StudentRead)
def get_student(student_id: int, db: Session = Depends(get_db)):
    obj = student_crud.get(db, student_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")
    return obj


@router.put("/students/{student_id}", response_model=schemas.StudentRead)
def update_student(student_id: int, payload: schemas.StudentUpdate, db: Session = Depends(get_db)):
    obj = student_crud.get(db, student_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")
    return student_crud.update(db, obj, payload.model_dump(exclude_unset=True))


@router.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    obj = student_crud.get(db, student_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")
    student_crud.remove(db, student_id)
