from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    Boolean,
    ForeignKey,
    Numeric,
    Text,
    UniqueConstraint,
    CheckConstraint,
    text,
)
from sqlalchemy.orm import relationship

from app.database import Base


# ---------------------------------------------------------------------------
# Models aligned with postgres/academic_schema_tables.sql (schema: academic)
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "user_"
    __table_args__ = {"schema": "academic"}

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    role = Column(String(50), nullable=False)

    teacher = relationship(
        "Teacher", back_populates="user", uselist=False
    )
    student = relationship(
        "Student", back_populates="user", uselist=False
    )


class Faculty(Base):
    __tablename__ = "faculty"
    __table_args__ = {"schema": "academic"}

    faculty_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)

    departments = relationship(
        "Department", back_populates="faculty", cascade="all, delete-orphan"
    )


class Department(Base):
    __tablename__ = "department"
    __table_args__ = {"schema": "academic"}

    department_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    faculty_id = Column(Integer, ForeignKey("academic.faculty.faculty_id"), nullable=False)

    faculty = relationship("Faculty", back_populates="departments")
    programs = relationship(
        "Programs", back_populates="department", cascade="all, delete-orphan"
    )


class Programs(Base):
    __tablename__ = "programs"
    __table_args__ = {"schema": "academic"}

    program_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    level = Column(String(50), nullable=False)
    department_id = Column(Integer, ForeignKey("academic.department.department_id"), nullable=False)

    department = relationship("Department", back_populates="programs")
    students = relationship("Student", back_populates="program")


class Teacher(Base):
    __tablename__ = "teacher"
    __table_args__ = {"schema": "academic"}

    teacher_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("academic.user_.user_id"), unique=True)

    user = relationship("User", back_populates="teacher")
    course_offerings = relationship("CourseOffering", back_populates="teacher")


class Student(Base):
    __tablename__ = "student"
    __table_args__ = {"schema": "academic"}

    student_id = Column(Integer, primary_key=True, index=True)
    matricule = Column(String(50), unique=True, nullable=False)
    enrollment_date = Column(Date, nullable=False)
    status = Column(String(50), nullable=False)
    program_id = Column(Integer, ForeignKey("academic.programs.program_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("academic.user_.user_id"), unique=True)

    program = relationship("Programs", back_populates="students")
    user = relationship("User", back_populates="student")
    enrollments = relationship(
        "Enrollment", back_populates="student", cascade="all, delete-orphan"
    )


class Course(Base):
    __tablename__ = "course"
    __table_args__ = {"schema": "academic", "extend_existing": True}

    course_id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)
    title = Column(String(150), nullable=False)
    credits = Column(Integer, nullable=False)

    course_offerings = relationship("CourseOffering", back_populates="course")


class PrerequisiteCourse(Base):
    __tablename__ = "prerequisite_course"
    __table_args__ = {"schema": "academic"}

    course_id = Column(Integer, ForeignKey("academic.course.course_id"), primary_key=True)
    course_id_1 = Column(Integer, ForeignKey("academic.course.course_id"), primary_key=True)


class Semester(Base):
    __tablename__ = "semester"
    __table_args__ = {"schema": "academic"}

    semester_id = Column(Integer, primary_key=True, index=True)
    academic_year = Column(String(20), nullable=False)
    term_name = Column(String(50), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_locked = Column(Boolean, default=False)

    course_offerings = relationship("CourseOffering", back_populates="semester")


class CourseOffering(Base):
    __tablename__ = "course_offering"
    __table_args__ = {"schema": "academic"}

    course_offering_id = Column(Integer, primary_key=True, index=True)
    room = Column(String(50))
    capacity = Column(Integer)
    teacher_id = Column(Integer, ForeignKey("academic.teacher.teacher_id"))
    course_id = Column(Integer, ForeignKey("academic.course.course_id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("academic.semester.semester_id"), nullable=False)

    teacher = relationship("Teacher", back_populates="course_offerings")
    course = relationship("Course", back_populates="course_offerings")
    semester = relationship("Semester", back_populates="course_offerings")
    enrollments = relationship(
        "Enrollment", back_populates="course_offering", cascade="all, delete-orphan"
    )
    exams = relationship("Exam", back_populates="course_offering", cascade="all, delete-orphan")


class Enrollment(Base):
    __tablename__ = "enrollment"
    __table_args__ = (
        UniqueConstraint("student_id", "course_offering_id", name="unique_student_course_offering"),
        {"schema": "academic"},
    )

    enrollment_id = Column(Integer, primary_key=True, index=True)
    status = Column(String(50), nullable=False)
    enrollment_date = Column(Date, nullable=False, server_default=text('CURRENT_DATE'))
    student_id = Column(Integer, ForeignKey("academic.student.student_id"), nullable=False)
    course_offering_id = Column(Integer, ForeignKey("academic.course_offering.course_offering_id"), nullable=False)

    student = relationship("Student", back_populates="enrollments")
    course_offering = relationship("CourseOffering", back_populates="enrollments")
    grades = relationship(
        "Grade", back_populates="enrollment", cascade="all, delete-orphan"
    )


class Exam(Base):
    __tablename__ = "exam"
    __table_args__ = {"schema": "academic"}

    exam_id = Column(Integer, primary_key=True, index=True)
    # column name in SQL is `type`
    exam_type = Column('type', String(50), nullable=False)
    exam_date = Column(DateTime, nullable=False)
    course_offering_id = Column(Integer, ForeignKey("academic.course_offering.course_offering_id"), nullable=False)

    course_offering = relationship("CourseOffering", back_populates="exams")
    # grades linked via enrollment in this schema


class Grade(Base):
    __tablename__ = "grades"
    __table_args__ = (
        CheckConstraint('score >= 0 AND score <= 100', name='score_range_check'),
        {"schema": "academic"},
    )

    grade_id = Column(Integer, primary_key=True, index=True)
    score = Column(Numeric(5, 2), nullable=False)
    letter_grade = Column(String(5))
    submitted_by = Column(Integer, ForeignKey("academic.teacher.teacher_id"))
    submitted_at = Column(DateTime, server_default=text('CURRENT_TIMESTAMP'))
    enrollment_id = Column(Integer, ForeignKey("academic.enrollment.enrollment_id"), nullable=False)

    enrollment = relationship("Enrollment", back_populates="grades")


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (
        CheckConstraint("status IN ('Present', 'Absent', 'Excused', 'Late')", name='attendance_status_check'),
        {"schema": "academic"},
    )

    attendance_id = Column(Integer, primary_key=True, index=True)
    session_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False)
    enrollment_id = Column(Integer, ForeignKey("academic.enrollment.enrollment_id"), nullable=False)

    enrollment = relationship("Enrollment", back_populates="attendances")
