from datetime import date, datetime, time
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


# ---------------------------------------------------------------------------
# Faculty
# ---------------------------------------------------------------------------
class FacultyBase(BaseModel):
    name: str


class FacultyCreate(FacultyBase):
    pass


class FacultyUpdate(BaseModel):
    name: Optional[str] = None


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
    # Modules not present in SQL schema; removed to reflect DB
    pass


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
    # groups table not present in SQL schema; keep placeholder if needed
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


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    code: Optional[str] = None
    title: Optional[str] = None
    credits: Optional[int] = None
    # module_id removed (not present in SQL Course)


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
    # AcademicYear table not present in SQL schema; semester stores academic_year as varchar
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
    # AcademicYear table removed; keep placeholder field for compatibility
    academic_year_id: Optional[int] = None


# ---------------------------------------------------------------------------
# Semester
# ---------------------------------------------------------------------------
class SemesterBase(BaseModel):
    academic_year: str
    term_name: str
    start_date: date
    end_date: date
    is_locked: bool = False


class SemesterCreate(SemesterBase):
    pass


class SemesterUpdate(BaseModel):
    term_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_locked: Optional[bool] = None
    # The authoritative schema stores academic year as string in Semester
    academic_year_id: Optional[int] = None


class SemesterRead(SemesterBase):
    model_config = ConfigDict(from_attributes=True)
    semester_id: int


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
class UserBase(BaseModel):
    name: str
    # phone not present in SQL User_
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
    # Teacher table in SQL includes name, email and user_id
    name: str
    email: EmailStr
    user_id: Optional[int] = None


class TeacherCreate(TeacherBase):
    pass


class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
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
    # Campus/building/room not present in SQL; kept for compatibility but may be unused
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
    # SQL Course_offering: room, capacity, teacher_id, course_id, semester_id
    room: Optional[str] = None
    capacity: Optional[int] = None
    teacher_id: Optional[int] = None
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
    # Class schedules not present in SQL; placeholder kept for compatibility
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
    # SQL Exam: type (string) and exam_date timestamp, course_offering_id
    exam_type: str
    exam_date: datetime
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
    # In SQL grades refer to enrollment (and submitted_by)
    exam_id: Optional[int] = None
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
    # Sessions table not present in SQL schema; replaced by Attendance.session_date
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
    # SQL Attendance: session_date, status, enrollment_id
    session_date: date
    status: str
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
