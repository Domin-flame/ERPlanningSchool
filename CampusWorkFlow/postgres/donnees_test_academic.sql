-- 1. User_
INSERT INTO academic.User_ (name, email, role) VALUES
('Jean Dupont', 'jean.dupont@univ.edu', 'Teacher'),
('Marie Curie', 'marie.curie@univ.edu', 'Teacher'),
('Albert Einstein', 'albert.einstein@univ.edu', 'Teacher'),
('Paul Dirac', 'paul.dirac@univ.edu', 'Teacher'),
('Ada Lovelace', 'ada.lovelace@univ.edu', 'Teacher'),
('Alice Martin', 'alice.martin@student.univ.edu', 'Student'),
('Bob Smith', 'bob.smith@student.univ.edu', 'Student'),
('Charlie Brown', 'charlie.brown@student.univ.edu', 'Student'),
('Diana Prince', 'diana.prince@student.univ.edu', 'Student'),
('Evan Wright', 'evan.wright@student.univ.edu', 'Student'),
('Fiona Gallagher', 'fiona.gallagher@student.univ.edu', 'Student'),
('George Clark', 'george.clark@student.univ.edu', 'Student'),
('Hannah Abbott', 'hannah.abbott@student.univ.edu', 'Student'),
('Ian Malcolm', 'ian.malcolm@student.univ.edu', 'Student'),
('Julia Roberts', 'julia.roberts@student.univ.edu', 'Student');

-- 2. Faculty
INSERT INTO academic.Faculty (name) VALUES
('Faculté des Sciences'), ('Faculté d''Ingénierie'), ('Faculté des Lettres'), ('Faculté d''Économie'),
('Faculté de Droit'), ('Faculté de Médecine'), ('Faculté des Arts'), ('Faculté des Sciences Sociales'),
('Faculté d''Architecture'), ('Faculté d''Agronomie');

-- 3. Department
INSERT INTO academic.Department (name, faculty_id) VALUES
('Informatique', 1), ('Mathématiques', 1), ('Génie Civil', 2), ('Génie Électrique', 2),
('Gestion', 4), ('Finance', 4), ('Droit Privé', 5), ('Médicine Générale', 6),
('Histoire', 3), ('Sociologie', 8);

-- 4. Programs
INSERT INTO academic.Programs (name, level, department_id) VALUES
('Licence Informatique', 'Licence', 1), ('Master Génie Logiciel', 'Master', 1),
('Licence Mathématiques', 'Licence', 2), ('Master Data Science', 'Master', 2),
('Licence Génie Civil', 'Licence', 3), ('Master Électricité', 'Master', 4),
('Licence Finance', 'Licence', 6), ('Master MBA', 'Master', 5),
('Licence Droit', 'Licence', 7), ('Doctorat Informatique', 'Doctorat', 1);

-- 5. Teacher
INSERT INTO academic.Teacher (name, email, user_id) VALUES
('Jean Dupont', 'jean.dupont@univ.edu', 1),
('Marie Curie', 'marie.curie@univ.edu', 2),
('Albert Einstein', 'albert.einstein@univ.edu', 3),
('Paul Dirac', 'paul.dirac@univ.edu', 4),
('Ada Lovelace', 'ada.lovelace@univ.edu', 5),
('Alan Turing', 'alan.turing@univ.edu', NULL),
('Grace Hopper', 'grace.hopper@univ.edu', NULL),
('Richard Feynman', 'richard.feynman@univ.edu', NULL),
('Nikola Tesla', 'nikola.tesla@univ.edu', NULL),
('Claude Shannon', 'claude.shannon@univ.edu', NULL);

-- 6. Student
INSERT INTO academic.Student (matricule, enrollment_date, status, program_id, user_id) VALUES
('STD-001', '2024-09-01', 'Active', 1, 6),
('STD-002', '2024-09-01', 'Active', 1, 7),
('STD-003', '2024-09-01', 'Active', 2, 8),
('STD-004', '2023-09-01', 'Active', 2, 9),
('STD-005', '2023-09-01', 'Active', 3, 10),
('STD-006', '2025-09-01', 'Active', 4, 11),
('STD-007', '2025-09-01', 'Active', 5, 12),
('STD-008', '2024-09-01', 'Suspended', 6, 13),
('STD-009', '2024-09-01', 'Active', 7, 14),
('STD-010', '2023-09-01', 'Graduated', 8, 15);

-- 7. Course
INSERT INTO academic.Course (code, title, credits) VALUES
('INF101', 'Algorithmique de base', 6),
('INF102', 'Bases de données SQL', 6),
('INF201', 'Programmation Orientée Objet', 6),
('MAT101', 'Algèbre Linéaire', 4),
('MAT102', 'Analyse Mathématique', 4),
('GEL101', 'Circuits Électriques', 5),
('GCI101', 'Résistance des Matériaux', 5),
('FIN101', 'Comptabilité Générale', 4),
('MGT101', 'Principes de Management', 3),
('INF301', 'Architecture Logicielle', 6);

-- 8. Prerequisite_course
INSERT INTO academic.Prerequisite_course (course_id, course_id_1) VALUES
(2, 1), (3, 1), (10, 2), (10, 3), (5, 4),
(6, 4), (7, 5), (8, 9), (4, 1), (3, 2);

-- 9. Semester
INSERT INTO academic.Semester (academic_year, term_name, start_date, end_date, is_locked) VALUES
('2024-2025', 'Semestre 1', '2024-09-01', '2025-01-31', TRUE),
('2024-2025', 'Semestre 2', '2025-02-01', '2025-06-30', FALSE),
('2025-2026', 'Semestre 1', '2025-09-01', '2026-01-31', FALSE),
('2025-2026', 'Semestre 2', '2026-02-01', '2026-06-30', FALSE),
('2023-2024', 'Semestre 1', '2023-09-01', '2024-01-31', TRUE),
('2023-2024', 'Semestre 2', '2024-02-01', '2024-06-30', TRUE),
('2026-2027', 'Semestre 1', '2026-09-01', '2027-01-31', FALSE),
('2026-2027', 'Semestre 2', '2027-02-01', '2027-06-30', FALSE),
('2022-2023', 'Semestre 1', '2022-09-01', '2023-01-31', TRUE),
('2022-2023', 'Semestre 2', '2023-02-01', '2023-06-30', TRUE);

-- 10. Course_offering
INSERT INTO academic.Course_offering (room, capacity, teacher_id, course_id, semester_id) VALUES
('Amphi A', 100, 1, 1, 1),
('Labo 2', 30, 2, 2, 1),
('Salle 101', 50, 3, 3, 2),
('Amphi B', 120, 4, 4, 1),
('Salle 102', 40, 5, 5, 2),
('Labo 1', 35, 6, 6, 1),
('Salle 201', 45, 7, 7, 2),
('Amphi C', 90, 8, 8, 1),
('Salle 202', 50, 9, 9, 2),
('Labo 3', 30, 10, 10, 3);

-- 11. Enrollment
INSERT INTO academic.Enrollment (status, enrollment_date, student_id, course_offering_id) VALUES
('Enrolled', '2024-09-05', 1, 1),
('Enrolled', '2024-09-05', 1, 2),
('Enrolled', '2024-09-06', 2, 1),
('Enrolled', '2024-09-06', 2, 2),
('Completed', '2025-02-01', 3, 3),
('Completed', '2024-09-05', 4, 4),
('Enrolled', '2025-02-02', 5, 5),
('Enrolled', '2024-09-07', 6, 6),
('Dropped', '2025-02-10', 7, 7),
('Enrolled', '2024-09-08', 8, 8);

-- 12. Exam
INSERT INTO academic.Exam (type, exam_date, course_offering_id) VALUES
('Midterm', '2024-11-15 09:00:00', 1),
('Final', '2025-01-20 14:00:00', 1),
('Midterm', '2024-11-16 10:00:00', 2),
('Final', '2025-01-22 09:00:00', 2),
('Quiz', '2025-03-10 11:00:00', 3),
('Final', '2025-06-15 14:00:00', 3),
('Midterm', '2024-11-18 08:30:00', 4),
('Final', '2025-01-25 10:00:00', 4),
('Final', '2025-06-18 14:00:00', 5),
('Midterm', '2024-11-20 13:00:00', 6);

-- 13. Grades
INSERT INTO academic.Grades (score, letter_grade, submitted_by, enrollment_id) VALUES
(85.50, 'A', 1, 1),
(78.00, 'B', 2, 2),
(92.00, 'A+', 1, 3),
(65.00, 'C', 2, 4),
(88.00, 'A', 3, 5),
(72.50, 'B-', 4, 6),
(90.00, 'A', 5, 7),
(55.00, 'D', 6, 8),
(40.00, 'F', 7, 9),
(81.00, 'B+', 8, 10);

-- 14. Attendance
INSERT INTO academic.Attendance (session_date, status, enrollment_id) VALUES
('2024-09-10', 'Present', 1),
('2024-09-12', 'Present', 1),
('2024-09-10', 'Absent', 2),
('2024-09-12', 'Present', 2),
('2024-09-11', 'Present', 3),
('2024-09-11', 'Excused', 4),
('2025-02-15', 'Present', 5),
('2024-09-15', 'Present', 6),
('2025-02-16', 'Late', 7),
('2024-09-18', 'Present', 8);