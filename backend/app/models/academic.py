from datetime import date
from enum import Enum
from sqlmodel import Field, SQLModel, Relationship


class Department(SQLModel, table=True):
    department_id: int | None = Field(default=None, primary_key=True)
    name: str
    faculty_id: int = Field(foreign_key="faculty.faculty_id")


class Faculty(SQLModel, table=True):
    faculty_id: int | None = Field(default=None, primary_key=True)
    name: str


class Program(SQLModel, table=True):
    program_id: int | None = Field(default=None, primary_key=True)
    name: str
    level: str
    department_id: int = Field(foreign_key="department.department_id")


class Student(SQLModel, table=True):
    student_id: int | None = Field(default=None, primary_key=True)
    matricule: str = Field(index=True, unique=True)  # recherche fréquente par matricule
    enrollment_date: date
    status: str
    program_id: int = Field(foreign_key="program.program_id")
    user_id: int = Field(foreign_key="user.id", index=True)  # jointure fréquente avec User


class Teacher(SQLModel, table=True):
    teacher_id: int | None = Field(default=None, primary_key=True)
    name: str
    email: str = Field(index=True, unique=True)
    user_id: int = Field(foreign_key="user.id", index=True)


class Semester(SQLModel, table=True):
    semester_id: int | None = Field(default=None, primary_key=True)
    academic_year: str
    term_name: str
    start_date: date
    end_date: date
    is_locked: bool = False


class Course(SQLModel, table=True):
    course_id: int | None = Field(default=None, primary_key=True)
    code: str = Field(index=True, unique=True)  # recherche fréquente par code de cours
    title: str
    credits: int


class PrerequisiteCourse(SQLModel, table=True):
    course_id: int = Field(foreign_key="course.course_id", primary_key=True)
    course_id_1: int = Field(foreign_key="course.course_id", primary_key=True)


class CourseOffering(SQLModel, table=True):
    course_offering_id: int | None = Field(default=None, primary_key=True)
    room: str
    capacity: int
    teacher_id: int = Field(foreign_key="teacher.teacher_id", index=True)
    course_id: int = Field(foreign_key="course.course_id", index=True)
    semester_id: int = Field(foreign_key="semester.semester_id", index=True)
    __tablename__ = "course_offering"   

class Enrollment(SQLModel, table=True):
    enrollment_id: int | None = Field(default=None, primary_key=True)
    status: str
    student_id: int = Field(foreign_key="student.student_id", index=True)
    course_offering_id: int = Field(foreign_key="course_offering.course_offering_id", index=True) 

class Grade(SQLModel, table=True):
    grade_id: int | None = Field(default=None, primary_key=True)
    score: float
    letter_grade: str
    enrollment_id: int = Field(foreign_key="enrollment.enrollment_id", index=True)


class Attendance(SQLModel, table=True):
    attendance_id: int | None = Field(default=None, primary_key=True)
    session_date: date
    status: str
    enrollment_id: int = Field(foreign_key="enrollment.enrollment_id", index=True)


class Exam(SQLModel, table=True):
    exam_id: int | None = Field(default=None, primary_key=True)
    type: str
    exam_date: date
    course_offering_id: int = Field(foreign_key="course_offering.course_offering_id", index=True) 