CREATE SCHEMA IF NOT EXISTS academic;

-- Table Core / Utilisateurs transversaux
CREATE TABLE academic.User_ (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL
);

-- Structure Académique
CREATE TABLE academic.Faculty (
    faculty_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL
);

CREATE TABLE academic.Department (
    department_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    faculty_id INT NOT NULL REFERENCES academic.Faculty(faculty_id) ON DELETE CASCADE
);

CREATE TABLE academic.Programs (
    program_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    level VARCHAR(50) NOT NULL,
    department_id INT NOT NULL REFERENCES academic.Department(department_id) ON DELETE CASCADE
);

-- Acteurs
CREATE TABLE academic.Teacher (
    teacher_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    user_id INT UNIQUE REFERENCES academic.User_(user_id) ON DELETE SET NULL
);

CREATE TABLE academic.Student (
    student_id SERIAL PRIMARY KEY,
    matricule VARCHAR(50) UNIQUE NOT NULL,
    enrollment_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    program_id INT NOT NULL REFERENCES academic.Programs(program_id) ON DELETE RESTRICT,
    user_id INT UNIQUE REFERENCES academic.User_(user_id) ON DELETE SET NULL
);

-- Cours & Semestres
CREATE TABLE academic.Course (
    course_id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    credits INT NOT NULL CHECK (credits > 0)
);

CREATE TABLE academic.Prerequisite_course (
    course_id INT NOT NULL REFERENCES academic.Course(course_id) ON DELETE CASCADE,
    course_id_1 INT NOT NULL REFERENCES academic.Course(course_id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, course_id_1),
    CHECK (course_id <> course_id_1)
);

CREATE TABLE academic.Semester (
    semester_id SERIAL PRIMARY KEY,
    academic_year VARCHAR(20) NOT NULL,
    term_name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE
);

CREATE TABLE academic.Course_offering (
    course_offering_id SERIAL PRIMARY KEY,
    room VARCHAR(50),
    capacity INT CHECK (capacity > 0),
    teacher_id INT REFERENCES academic.Teacher(teacher_id) ON DELETE SET NULL,
    course_id INT NOT NULL REFERENCES academic.Course(course_id) ON DELETE CASCADE,
    semester_id INT NOT NULL REFERENCES academic.Semester(semester_id) ON DELETE CASCADE
);

-- Inscriptions, Notes, Présences et Examens
CREATE TABLE academic.Enrollment (
    enrollment_id SERIAL PRIMARY KEY,
    status VARCHAR(50) NOT NULL,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    student_id INT NOT NULL REFERENCES academic.Student(student_id) ON DELETE CASCADE,
    course_offering_id INT NOT NULL REFERENCES academic.Course_offering(course_offering_id) ON DELETE CASCADE,
    CONSTRAINT unique_student_course_offering UNIQUE (student_id, course_offering_id)
);

CREATE TABLE academic.Exam (
    exam_id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    exam_date TIMESTAMP NOT NULL,
    course_offering_id INT NOT NULL REFERENCES academic.Course_offering(course_offering_id) ON DELETE CASCADE
);

CREATE TABLE academic.Grades (
    grade_id SERIAL PRIMARY KEY,
    score NUMERIC(5, 2) NOT NULL CHECK (score >= 0 AND score <= 100),
    letter_grade VARCHAR(5),
    submitted_by INT REFERENCES academic.Teacher(teacher_id) ON DELETE SET NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enrollment_id INT NOT NULL REFERENCES academic.Enrollment(enrollment_id) ON DELETE CASCADE
);

CREATE TABLE academic.Attendance (
    attendance_id SERIAL PRIMARY KEY,
    session_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'Excused', 'Late')),
    enrollment_id INT NOT NULL REFERENCES academic.Enrollment(enrollment_id) ON DELETE CASCADE
);