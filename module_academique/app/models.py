from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    Time,
    Boolean,
    ForeignKey,
    Numeric,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


# ---------------------------------------------------------------------------
# Structure académique
# ---------------------------------------------------------------------------
class Faculty(Base):
    __tablename__ = "faculties"

    faculty_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(20), unique=True, nullable=False)

    departments = relationship(
        "Department", back_populates="faculty", cascade="all, delete-orphan"
    )


class Department(Base):
    __tablename__ = "departments"

    department_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculties.faculty_id"), nullable=False)

    faculty = relationship("Faculty", back_populates="departments")
    programs = relationship(
        "Programs", back_populates="department", cascade="all, delete-orphan"
    )


class Programs(Base):
    __tablename__ = "programs"

    program_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    level = Column(String(50), nullable=False)
    department_id = Column(
        Integer, ForeignKey("departments.department_id"), nullable=False
    )

    department = relationship("Department", back_populates="programs")
    students = relationship("Student", back_populates="program")
    modules = relationship(
        "ModuleUE", secondary="groups", back_populates="programs"
    )


class ModuleUE(Base):
    __tablename__ = "modules_ue"

    module_id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)
    title = Column(String(150), nullable=False)
    credits_ects = Column(Integer, nullable=False)

    programs = relationship(
        "Programs", secondary="groups", back_populates="modules"
    )
    courses = relationship(
        "Course", back_populates="module", cascade="all, delete-orphan"
    )


class Group(Base):
    """Table de jonction Programs <-> Module_UE (many-to-many)."""

    __tablename__ = "groups"

    program_id = Column(Integer, ForeignKey("programs.program_id"), primary_key=True)
    module_id = Column(
        Integer, ForeignKey("modules_ue.module_id"), primary_key=True
    )


class Course(Base):
    __tablename__ = "courses"

    course_id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)
    title = Column(String(150), nullable=False)
    credits = Column(Integer, nullable=False)
    module_id = Column(
        Integer, ForeignKey("modules_ue.module_id"), nullable=False
    )

    module = relationship("ModuleUE", back_populates="courses")
    course_offerings = relationship("CourseOffering", back_populates="course")


class PrerequisiteCourse(Base):
    """Table de jonction auto-référencée sur Course (prérequis)."""

    __tablename__ = "prerequisite_courses"

    course_id = Column(Integer, ForeignKey("courses.course_id"), primary_key=True)
    course_id_1 = Column(
        Integer, ForeignKey("courses.course_id"), primary_key=True
    )


# ---------------------------------------------------------------------------
# Calendrier académique
# ---------------------------------------------------------------------------
class AcademicYear(Base):
    __tablename__ = "academic_years"

    academic_year_id = Column(Integer, primary_key=True, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    year_label = Column(String(20), unique=True, nullable=False)

    semesters = relationship(
        "Semester", back_populates="academic_year", cascade="all, delete-orphan"
    )


class Semester(Base):
    __tablename__ = "semesters"

    semester_id = Column(Integer, primary_key=True, index=True)
    term_name = Column(String(50), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_locked = Column(Boolean, nullable=False, default=False)
    academic_year_id = Column(
        Integer, ForeignKey("academic_years.academic_year_id"), nullable=False
    )

    academic_year = relationship("AcademicYear", back_populates="semesters")
    course_offerings = relationship("CourseOffering", back_populates="semester")


# ---------------------------------------------------------------------------
# Personnes
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    phone = Column(String(30))
    email = Column(String(150), unique=True, nullable=False)
    role = Column(String(20), nullable=False)  # Admin, Teacher, Student

    teacher = relationship(
        "Teacher", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    student = relationship(
        "Student", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class Teacher(Base):
    __tablename__ = "teachers"

    teacher_id = Column(Integer, primary_key=True, index=True)
    employee_code = Column(String(30), unique=True, nullable=False)
    speciality = Column(String(150))
    user_id = Column(Integer, ForeignKey("users.user_id"), unique=True, nullable=False)

    user = relationship("User", back_populates="teacher")
    course_offerings = relationship("CourseOffering", back_populates="teacher")


class Student(Base):
    __tablename__ = "students"

    student_id = Column(Integer, primary_key=True, index=True)
    matricule = Column(String(30), unique=True, nullable=False)
    enrollment_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False)
    program_id = Column(Integer, ForeignKey("programs.program_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), unique=True, nullable=False)

    program = relationship("Programs", back_populates="students")
    user = relationship("User", back_populates="student")
    enrollments = relationship(
        "Enrollment", back_populates="student", cascade="all, delete-orphan"
    )


# ---------------------------------------------------------------------------
# Infrastructure
# ---------------------------------------------------------------------------
class Campus(Base):
    __tablename__ = "campuses"

    campus_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    city = Column(String(100), nullable=False)
    adress = Column(String(255))

    buildings = relationship(
        "Building", back_populates="campus", cascade="all, delete-orphan"
    )
    course_offerings = relationship("CourseOffering", back_populates="campus")


class Building(Base):
    __tablename__ = "buildings"

    building_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(20), nullable=False)
    campus_id = Column(Integer, ForeignKey("campuses.campus_id"), nullable=False)

    campus = relationship("Campus", back_populates="buildings")
    rooms = relationship(
        "Room", back_populates="building", cascade="all, delete-orphan"
    )


class Room(Base):
    __tablename__ = "rooms"

    room_id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(20), nullable=False)
    capacity = Column(Integer, nullable=False)
    room_type = Column(String(50))
    room_name = Column(String(100))
    building_id = Column(
        Integer, ForeignKey("buildings.building_id"), nullable=False
    )

    building = relationship("Building", back_populates="rooms")
    class_schedules = relationship("ClassSchedule", back_populates="room")


# ---------------------------------------------------------------------------
# Offres de cours, emploi du temps, examens
# ---------------------------------------------------------------------------
class CourseOffering(Base):
    __tablename__ = "course_offerings"

    course_offering_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    campus_id = Column(Integer, ForeignKey("campuses.campus_id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.teacher_id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.course_id"), nullable=False)
    semester_id = Column(
        Integer, ForeignKey("semesters.semester_id"), nullable=False
    )

    campus = relationship("Campus", back_populates="course_offerings")
    teacher = relationship("Teacher", back_populates="course_offerings")
    course = relationship("Course", back_populates="course_offerings")
    semester = relationship("Semester", back_populates="course_offerings")
    class_schedules = relationship(
        "ClassSchedule", back_populates="course_offering", cascade="all, delete-orphan"
    )
    exams = relationship(
        "Exam", back_populates="course_offering", cascade="all, delete-orphan"
    )
    enrollments = relationship(
        "Enrollment", back_populates="course_offering", cascade="all, delete-orphan"
    )


class ClassSchedule(Base):
    __tablename__ = "class_schedules"

    schedule_id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(String(15), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.room_id"), nullable=False)
    course_offering_id = Column(
        Integer, ForeignKey("course_offerings.course_offering_id"), nullable=False
    )

    room = relationship("Room", back_populates="class_schedules")
    course_offering = relationship("CourseOffering", back_populates="class_schedules")
    sessions = relationship(
        "ClassSession", back_populates="schedule", cascade="all, delete-orphan"
    )


class Exam(Base):
    __tablename__ = "exams"

    exam_id = Column(Integer, primary_key=True, index=True)
    exam_type = Column(String(50), nullable=False)
    exam_date = Column(Date, nullable=False)
    weight_percentage = Column(Numeric(5, 2), nullable=False)
    max_score = Column(Numeric(5, 2), nullable=False)
    course_offering_id = Column(
        Integer, ForeignKey("course_offerings.course_offering_id"), nullable=False
    )

    course_offering = relationship("CourseOffering", back_populates="exams")
    grades = relationship("Grade", back_populates="exam", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Inscriptions, notes, séances, présences
# ---------------------------------------------------------------------------
class Enrollment(Base):
    __tablename__ = "enrollments"

    enrollment_id = Column(Integer, primary_key=True, index=True)
    status = Column(String(20), nullable=False)
    enrollment_date = Column(Date, nullable=False)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    course_offering_id = Column(
        Integer, ForeignKey("course_offerings.course_offering_id"), nullable=False
    )

    student = relationship("Student", back_populates="enrollments")
    course_offering = relationship("CourseOffering", back_populates="enrollments")
    grades = relationship(
        "Grade", back_populates="enrollment", cascade="all, delete-orphan"
    )
    attendances = relationship(
        "Attendance", back_populates="enrollment", cascade="all, delete-orphan"
    )


class Grade(Base):
    __tablename__ = "grades"

    grade_id = Column(Integer, primary_key=True, index=True)
    score = Column(Numeric(5, 2), nullable=False)
    letter_grade = Column(String(5))
    # teacher_id de la personne ayant soumis la note (non contraint par FK dans le MLD source)
    submitted_by = Column(Integer)
    submitted_at = Column(DateTime, nullable=False)
    exam_id = Column(Integer, ForeignKey("exams.exam_id"), nullable=False)
    enrollment_id = Column(
        Integer, ForeignKey("enrollments.enrollment_id"), nullable=False
    )

    exam = relationship("Exam", back_populates="grades")
    enrollment = relationship("Enrollment", back_populates="grades")


class ClassSession(Base):
    __tablename__ = "sessions"

    session_id = Column(Integer, primary_key=True, index=True)
    session_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False)
    topic_covered = Column(Text)
    schedule_id = Column(
        Integer, ForeignKey("class_schedules.schedule_id"), nullable=False
    )

    schedule = relationship("ClassSchedule", back_populates="sessions")
    attendances = relationship(
        "Attendance", back_populates="session", cascade="all, delete-orphan"
    )


class Attendance(Base):
    __tablename__ = "attendances"

    attendance_id = Column(Integer, primary_key=True, index=True)
    status = Column(String(20), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.session_id"), nullable=False)
    enrollment_id = Column(
        Integer, ForeignKey("enrollments.enrollment_id"), nullable=False
    )

    session = relationship("ClassSession", back_populates="attendances")
    enrollment = relationship("Enrollment", back_populates="attendances")
