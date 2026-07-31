from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.crud import CRUDBase
from app.database import get_db

router = APIRouter(tags=["Academic Structure"])

faculty_crud = CRUDBase(models.Faculty, "faculty_id")
department_crud = CRUDBase(models.Department, "department_id")
program_crud = CRUDBase(models.Programs, "program_id")
module_crud = CRUDBase(models.ModuleUE, "module_id")
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


# ---------------------------------------------------------------------------
# Module_UE
# ---------------------------------------------------------------------------
@router.post("/modules/", response_model=schemas.ModuleRead, status_code=status.HTTP_201_CREATED)
def create_module(payload: schemas.ModuleCreate, db: Session = Depends(get_db)):
    return module_crud.create(db, payload.model_dump())


@router.get("/modules/", response_model=List[schemas.ModuleRead])
def list_modules(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return module_crud.get_multi(db, skip, limit)


@router.get("/modules/{module_id}", response_model=schemas.ModuleRead)
def get_module(module_id: int, db: Session = Depends(get_db)):
    obj = module_crud.get(db, module_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Module introuvable")
    return obj


@router.put("/modules/{module_id}", response_model=schemas.ModuleRead)
def update_module(module_id: int, payload: schemas.ModuleUpdate, db: Session = Depends(get_db)):
    obj = module_crud.get(db, module_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Module introuvable")
    return module_crud.update(db, obj, payload.model_dump(exclude_unset=True))


@router.delete("/modules/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module(module_id: int, db: Session = Depends(get_db)):
    obj = module_crud.get(db, module_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Module introuvable")
    module_crud.remove(db, module_id)


# ---------------------------------------------------------------------------
# groups (association Programs <-> Module_UE)
# ---------------------------------------------------------------------------
@router.post("/groups/", response_model=schemas.GroupRead, status_code=status.HTTP_201_CREATED)
def create_group_link(payload: schemas.GroupCreate, db: Session = Depends(get_db)):
    if not program_crud.get(db, payload.program_id):
        raise HTTPException(status_code=404, detail="Programme introuvable")
    if not module_crud.get(db, payload.module_id):
        raise HTTPException(status_code=404, detail="Module introuvable")
    existing = (
        db.query(models.Group)
        .filter(
            models.Group.program_id == payload.program_id,
            models.Group.module_id == payload.module_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Ce lien programme/module existe déjà")
    obj = models.Group(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/groups/", response_model=List[schemas.GroupRead])
def list_group_links(db: Session = Depends(get_db)):
    return db.query(models.Group).all()


@router.delete("/groups/{program_id}/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group_link(program_id: int, module_id: int, db: Session = Depends(get_db)):
    obj = (
        db.query(models.Group)
        .filter(models.Group.program_id == program_id, models.Group.module_id == module_id)
        .first()
    )
    if not obj:
        raise HTTPException(status_code=404, detail="Lien introuvable")
    db.delete(obj)
    db.commit()


# ---------------------------------------------------------------------------
# Course
# ---------------------------------------------------------------------------
@router.post("/courses/", response_model=schemas.CourseRead, status_code=status.HTTP_201_CREATED)
def create_course(payload: schemas.CourseCreate, db: Session = Depends(get_db)):
    if not module_crud.get(db, payload.module_id):
        raise HTTPException(status_code=404, detail="Module parent introuvable")
    return course_crud.create(db, payload.model_dump())


@router.get("/courses/", response_model=List[schemas.CourseRead])
def list_courses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return course_crud.get_multi(db, skip, limit)


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
