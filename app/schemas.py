from datetime import date, datetime, time
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


# ---------------------------------------------------------------------------
# Faculty
# ---------------------------------------------------------------------------
class FacultyBase(BaseModel):
    name: str
    code: str


class FacultyCreate(FacultyBase):
    pass


class FacultyUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None


class FacultyRead(FacultyBase):
    model_config = ConfigDict(from_attributes=True)
    faculty_id: int


# ---------------------------------------------------------------------------
# Department
# ---------------------------------------------------------------------------
class DepartmentBase(BaseModel):
    name: str
    faculty_id: int


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    faculty_id: Optional[int] = None


class DepartmentRead(DepartmentBase):
    model_config = ConfigDict(from_attributes=True)
    department_id: int


# ---------------------------------------------------------------------------
# Programs
# ---------------------------------------------------------------------------
class ProgramBase(BaseModel):
    name: str
    level: str
    department_id: int


class ProgramCreate(ProgramBase):
    pass


class ProgramUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[str] = None
    department_id: Optional[int] = None


class ProgramRead(ProgramBase):
    model_config = ConfigDict(from_attributes=True)
    program_id: int


# ---------------------------------------------------------------------------
# Module_UE
# ---------------------------------------------------------------------------
class ModuleBase(BaseModel):
    code: str
    title: str
    credits_ects: int


class ModuleCreate(ModuleBase):
    pass


class ModuleUpdate(BaseModel):
    code: Optional[str] = None
    title: Optional[str] = None
    credits_ects: Optional[int] = None


class ModuleRead(ModuleBase):
    model_config = ConfigDict(from_attributes=True)
    module_id: int


# ---------------------------------------------------------------------------
# groups (Programs <-> Module_UE)
# ---------------------------------------------------------------------------
class GroupCreate(BaseModel):
    program_id: int
    module_id: int


class GroupRead(GroupCreate):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Course
# ---------------------------------------------------------------------------
class CourseBase(BaseModel):
    code: str
    title: str
    credits: int
    module_id: int


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    code: Optional[str] = None
    title: Optional[str] = None
    credits: Optional[int] = None
    module_id: Optional[int] = None


class CourseRead(CourseBase):
    model_config = ConfigDict(from_attributes=True)
    course_id: int


# ---------------------------------------------------------------------------
# Prerequisite_course
# ---------------------------------------------------------------------------
class PrerequisiteCreate(BaseModel):
    course_id: int
    course_id_1: int


class PrerequisiteRead(PrerequisiteCreate):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Academic_year
# ---------------------------------------------------------------------------
class AcademicYearBase(BaseModel):
    start_date: date
    end_date: date
    year_label: str


class AcademicYearCreate(AcademicYearBase):
    pass


class AcademicYearUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    year_label: Optional[str] = None


class AcademicYearRead(AcademicYearBase):
    model_config = ConfigDict(from_attributes=True)
    academic_year_id: int


# ---------------------------------------------------------------------------
# Semester
# ---------------------------------------------------------------------------
class SemesterBase(BaseModel):
    term_name: str
    start_date: date
    end_date: date
    is_locked: bool = False
    academic_year_id: int


class SemesterCreate(SemesterBase):
    pass


class SemesterUpdate(BaseModel):
    term_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_locked: Optional[bool] = None
    academic_year_id: Optional[int] = None


class SemesterRead(SemesterBase):
    model_config = ConfigDict(from_attributes=True)
    semester_id: int


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
class UserBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: EmailStr
    role: str  # Admin, Teacher, Student


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)
    user_id: int


# ---------------------------------------------------------------------------
# Teacher
# ---------------------------------------------------------------------------
class TeacherBase(BaseModel):
    employee_code: str
    speciality: Optional[str] = None
    user_id: int


class TeacherCreate(TeacherBase):
    pass


class TeacherUpdate(BaseModel):
    employee_code: Optional[str] = None
    speciality: Optional[str] = None
    user_id: Optional[int] = None


class TeacherRead(TeacherBase):
    model_config = ConfigDict(from_attributes=True)
    teacher_id: int


# ---------------------------------------------------------------------------
# Student
# ---------------------------------------------------------------------------
class StudentBase(BaseModel):
    matricule: str
    enrollment_date: date
    status: str
    program_id: int
    user_id: int


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    matricule: Optional[str] = None
    enrollment_date: Optional[date] = None
    status: Optional[str] = None
    program_id: Optional[int] = None
    user_id: Optional[int] = None


class StudentRead(StudentBase):
    model_config = ConfigDict(from_attributes=True)
    student_id: int


# ---------------------------------------------------------------------------
# Campus
# ---------------------------------------------------------------------------
class CampusBase(BaseModel):
    name: str
    city: str
    adress: Optional[str] = None


class CampusCreate(CampusBase):
    pass


class CampusUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    adress: Optional[str] = None


class CampusRead(CampusBase):
    model_config = ConfigDict(from_attributes=True)
    campus_id: int


# ---------------------------------------------------------------------------
# Building
# ---------------------------------------------------------------------------
class BuildingBase(BaseModel):
    name: str
    code: str
    campus_id: int


class BuildingCreate(BuildingBase):
    pass


class BuildingUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    campus_id: Optional[int] = None


class BuildingRead(BuildingBase):
    model_config = ConfigDict(from_attributes=True)
    building_id: int


# ---------------------------------------------------------------------------
# Room
# ---------------------------------------------------------------------------
class RoomBase(BaseModel):
    room_number: str
    capacity: int
    room_type: Optional[str] = None
    room_name: Optional[str] = None
    building_id: int


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    capacity: Optional[int] = None
    room_type: Optional[str] = None
    room_name: Optional[str] = None
    building_id: Optional[int] = None


class RoomRead(RoomBase):
    model_config = ConfigDict(from_attributes=True)
    room_id: int


# ---------------------------------------------------------------------------
# Course_offering
# ---------------------------------------------------------------------------
class CourseOfferingBase(BaseModel):
    name: str
    campus_id: int
    teacher_id: int
    course_id: int
    semester_id: int


class CourseOfferingCreate(CourseOfferingBase):
    pass


class CourseOfferingUpdate(BaseModel):
    name: Optional[str] = None
    campus_id: Optional[int] = None
    teacher_id: Optional[int] = None
    course_id: Optional[int] = None
    semester_id: Optional[int] = None


class CourseOfferingRead(CourseOfferingBase):
    model_config = ConfigDict(from_attributes=True)
    course_offering_id: int


# ---------------------------------------------------------------------------
# Class_schedule
# ---------------------------------------------------------------------------
class ClassScheduleBase(BaseModel):
    day_of_week: str
    start_time: time
    end_time: time
    room_id: int
    course_offering_id: int


class ClassScheduleCreate(ClassScheduleBase):
    pass


class ClassScheduleUpdate(BaseModel):
    day_of_week: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    room_id: Optional[int] = None
    course_offering_id: Optional[int] = None


class ClassScheduleRead(ClassScheduleBase):
    model_config = ConfigDict(from_attributes=True)
    schedule_id: int


# ---------------------------------------------------------------------------
# Exam
# ---------------------------------------------------------------------------
class ExamBase(BaseModel):
    exam_type: str
    exam_date: date
    weight_percentage: Decimal
    max_score: Decimal
    course_offering_id: int


class ExamCreate(ExamBase):
    pass


class ExamUpdate(BaseModel):
    exam_type: Optional[str] = None
    exam_date: Optional[date] = None
    weight_percentage: Optional[Decimal] = None
    max_score: Optional[Decimal] = None
    course_offering_id: Optional[int] = None


class ExamRead(ExamBase):
    model_config = ConfigDict(from_attributes=True)
    exam_id: int


# ---------------------------------------------------------------------------
# Enrollment
# ---------------------------------------------------------------------------
class EnrollmentBase(BaseModel):
    status: str
    enrollment_date: date
    student_id: int
    course_offering_id: int


class EnrollmentCreate(EnrollmentBase):
    pass


class EnrollmentUpdate(BaseModel):
    status: Optional[str] = None
    enrollment_date: Optional[date] = None
    student_id: Optional[int] = None
    course_offering_id: Optional[int] = None


class EnrollmentRead(EnrollmentBase):
    model_config = ConfigDict(from_attributes=True)
    enrollment_id: int


# ---------------------------------------------------------------------------
# Grade
# ---------------------------------------------------------------------------
class GradeBase(BaseModel):
    score: Decimal
    letter_grade: Optional[str] = None
    submitted_by: Optional[int] = None
    submitted_at: datetime
    exam_id: int
    enrollment_id: int


class GradeCreate(GradeBase):
    pass


class GradeUpdate(BaseModel):
    score: Optional[Decimal] = None
    letter_grade: Optional[str] = None
    submitted_by: Optional[int] = None
    submitted_at: Optional[datetime] = None
    exam_id: Optional[int] = None
    enrollment_id: Optional[int] = None


class GradeRead(GradeBase):
    model_config = ConfigDict(from_attributes=True)
    grade_id: int


# ---------------------------------------------------------------------------
# Session (ClassSession)
# ---------------------------------------------------------------------------
class SessionBase(BaseModel):
    session_date: date
    status: str
    topic_covered: Optional[str] = None
    schedule_id: int


class SessionCreate(SessionBase):
    pass


class SessionUpdate(BaseModel):
    session_date: Optional[date] = None
    status: Optional[str] = None
    topic_covered: Optional[str] = None
    schedule_id: Optional[int] = None


class SessionRead(SessionBase):
    model_config = ConfigDict(from_attributes=True)
    session_id: int


# ---------------------------------------------------------------------------
# Attendance
# ---------------------------------------------------------------------------
class AttendanceBase(BaseModel):
    status: str
    session_id: int
    enrollment_id: int


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    status: Optional[str] = None
    session_id: Optional[int] = None
    enrollment_id: Optional[int] = None


class AttendanceRead(AttendanceBase):
    model_config = ConfigDict(from_attributes=True)
    attendance_id: int
