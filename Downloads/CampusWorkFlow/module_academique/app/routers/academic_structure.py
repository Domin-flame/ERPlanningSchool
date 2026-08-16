from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.crud import CRUDBase
from app.database import get_db

router = APIRouter(tags=["Academic Structure"])

faculty_crud = CRUDBase(models.Faculty, "faculty_id")
department_crud = CRUDBase(models.Department, "department_id")
program_crud = CRUDBase(models.Programs, "program_id")
course_crud = CRUDBase(models.Course, "course_id")


# ---------------------------------------------------------------------------
# Faculty
# ---------------------------------------------------------------------------
@router.post("/faculties/", response_model=schemas.FacultyRead, status_code=status.HTTP_201_CREATED)
def create_faculty(payload: schemas.FacultyCreate, db: Session = Depends(get_db)):
    return faculty_crud.create(db, payload.model_dump())


@router.get("/faculties/", response_model=List[schemas.FacultyRead])
def list_faculties(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return faculty_crud.get_multi(db, skip, limit)


@router.get("/faculties/{faculty_id}", response_model=schemas.FacultyRead)
def get_faculty(faculty_id: int, db: Session = Depends(get_db)):
    obj = faculty_crud.get(db, faculty_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Faculty introuvable")
    return obj


@router.put("/faculties/{faculty_id}", response_model=schemas.FacultyRead)
def update_faculty(faculty_id: int, payload: schemas.FacultyUpdate, db: Session = Depends(get_db)):
    obj = faculty_crud.get(db, faculty_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Faculty introuvable")
    return faculty_crud.update(db, obj, payload.model_dump(exclude_unset=True))


@router.delete("/faculties/{faculty_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faculty(faculty_id: int, db: Session = Depends(get_db)):
    obj = faculty_crud.get(db, faculty_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Faculty introuvable")
    faculty_crud.remove(db, faculty_id)


# ---------------------------------------------------------------------------
# Department
# ---------------------------------------------------------------------------
@router.post("/departments/", response_model=schemas.DepartmentRead, status_code=status.HTTP_201_CREATED)
def create_department(payload: schemas.DepartmentCreate, db: Session = Depends(get_db)):
    if not faculty_crud.get(db, payload.faculty_id):
        raise HTTPException(status_code=404, detail="Faculty parente introuvable")
    return department_crud.create(db, payload.model_dump())


@router.get("/departments/", response_model=List[schemas.DepartmentRead])
def list_departments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return department_crud.get_multi(db, skip, limit)


@router.get("/departments/{department_id}", response_model=schemas.DepartmentRead)
def get_department(department_id: int, db: Session = Depends(get_db)):
    obj = department_crud.get(db, department_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Department introuvable")
    return obj


@router.put("/departments/{department_id}", response_model=schemas.DepartmentRead)
def update_department(department_id: int, payload: schemas.DepartmentUpdate, db: Session = Depends(get_db)):
    obj = department_crud.get(db, department_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Department introuvable")
    return department_crud.update(db, obj, payload.model_dump(exclude_unset=True))


@router.delete("/departments/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(department_id: int, db: Session = Depends(get_db)):
    obj = department_crud.get(db, department_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Department introuvable")
    department_crud.remove(db, department_id)


# ---------------------------------------------------------------------------
# Programs
# ---------------------------------------------------------------------------
@router.post("/programs/", response_model=schemas.ProgramRead, status_code=status.HTTP_201_CREATED)
def create_program(payload: schemas.ProgramCreate, db: Session = Depends(get_db)):
    if not department_crud.get(db, payload.department_id):
        raise HTTPException(status_code=404, detail="Department parent introuvable")
    return program_crud.create(db, payload.model_dump())


@router.get("/programs/", response_model=List[schemas.ProgramRead])
def list_programs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return program_crud.get_multi(db, skip, limit)


@router.get("/programs/{program_id}", response_model=schemas.ProgramRead)
def get_program(program_id: int, db: Session = Depends(get_db)):
    obj = program_crud.get(db, program_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Programme introuvable")
    return obj


@router.put("/programs/{program_id}", response_model=schemas.ProgramRead)
def update_program(program_id: int, payload: schemas.ProgramUpdate, db: Session = Depends(get_db)):
    obj = program_crud.get(db, program_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Programme introuvable")
    return program_crud.update(db, obj, payload.model_dump(exclude_unset=True))


@router.delete("/programs/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_program(program_id: int, db: Session = Depends(get_db)):
    obj = program_crud.get(db, program_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Programme introuvable")
    program_crud.remove(db, program_id)


# Note: Module_UE and groups are not present in the authoritative SQL schema
# and endpoints have been removed to keep API aligned with the database.


# ---------------------------------------------------------------------------
# Course
# ---------------------------------------------------------------------------
@router.post("/courses/", response_model=schemas.CourseRead, status_code=status.HTTP_201_CREATED)
def create_course(payload: schemas.CourseCreate, db: Session = Depends(get_db)):
    return course_crud.create(db, payload.model_dump())


@router.get("/courses/", response_model=List[schemas.CourseRead])
def list_courses(skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=200), db: Session = Depends(get_db)):
    return course_crud.get_multi(db, skip, limit)


@router.get("/courses/count", response_model=int)
def count_courses(db: Session = Depends(get_db)):
    return course_crud.count(db)


@router.get("/courses/{course_id}", response_model=schemas.CourseRead)
def get_course(course_id: int, db: Session = Depends(get_db)):
    obj = course_crud.get(db, course_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Cours introuvable")
    return obj


@router.put("/courses/{course_id}", response_model=schemas.CourseRead)
def update_course(course_id: int, payload: schemas.CourseUpdate, db: Session = Depends(get_db)):
    obj = course_crud.get(db, course_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Cours introuvable")
    return course_crud.update(db, obj, payload.model_dump(exclude_unset=True))


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: int, db: Session = Depends(get_db)):
    obj = course_crud.get(db, course_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Cours introuvable")
    course_crud.remove(db, course_id)


# ---------------------------------------------------------------------------
# Prerequisite_course (association auto-référencée sur Course)
# ---------------------------------------------------------------------------
@router.post("/prerequisites/", response_model=schemas.PrerequisiteRead, status_code=status.HTTP_201_CREATED)
def create_prerequisite(payload: schemas.PrerequisiteCreate, db: Session = Depends(get_db)):
    if payload.course_id == payload.course_id_1:
        raise HTTPException(status_code=400, detail="Un cours ne peut pas être son propre prérequis")
    if not course_crud.get(db, payload.course_id) or not course_crud.get(db, payload.course_id_1):
        raise HTTPException(status_code=404, detail="Un des deux cours est introuvable")
    obj = models.PrerequisiteCourse(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/prerequisites/", response_model=List[schemas.PrerequisiteRead])
def list_prerequisites(db: Session = Depends(get_db)):
    return db.query(models.PrerequisiteCourse).all()


@router.delete("/prerequisites/{course_id}/{course_id_1}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prerequisite(course_id: int, course_id_1: int, db: Session = Depends(get_db)):
    obj = (
        db.query(models.PrerequisiteCourse)
        .filter(
            models.PrerequisiteCourse.course_id == course_id,
            models.PrerequisiteCourse.course_id_1 == course_id_1,
        )
        .first()
    )
    if not obj:
        raise HTTPException(status_code=404, detail="Lien de prérequis introuvable")
    db.delete(obj)
    db.commit()
