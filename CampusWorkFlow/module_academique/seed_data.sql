INSERT INTO faculties (code, name) VALUES
    ('SCI', 'Faculté des Sciences'),
    ('ING', 'Faculté d''Ingénierie'),
    ('ECO', 'Faculté d''Économie')
ON CONFLICT (code) DO NOTHING;

INSERT INTO departments (name, faculty_id)
SELECT data.name, faculty.faculty_id
FROM (VALUES
    ('Informatique', 'SCI'),
    ('Mathématiques', 'SCI'),
    ('Génie Civil', 'ING'),
    ('Finance', 'ECO')
) AS data(name, faculty_code)
JOIN faculties AS faculty ON faculty.code = data.faculty_code
WHERE NOT EXISTS (
    SELECT 1
    FROM departments AS existing
    WHERE existing.name = data.name AND existing.faculty_id = faculty.faculty_id
);

INSERT INTO programs (name, level, department_id)
SELECT data.name, data.level, department.department_id
FROM (VALUES
    ('Licence Informatique', 'Licence', 'Informatique'),
    ('Master Data Science', 'Master', 'Mathématiques'),
    ('Licence Finance', 'Licence', 'Finance')
) AS data(name, level, department_name)
JOIN departments AS department ON department.name = data.department_name
WHERE NOT EXISTS (
    SELECT 1
    FROM programs AS existing
    WHERE existing.name = data.name
      AND existing.level = data.level
      AND existing.department_id = department.department_id
);

INSERT INTO modules_ue (code, title, credits_ects) VALUES
    ('INF-FND', 'Fondamentaux de l’informatique', 6),
    ('INF-DATA', 'Systèmes et bases de données', 6),
    ('MAT-CORE', 'Mathématiques fondamentales', 6),
    ('FIN-CORE', 'Gestion financière', 5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO groups (program_id, module_id)
SELECT program.program_id, module.module_id
FROM (VALUES
    ('Licence Informatique', 'INF-FND'),
    ('Licence Informatique', 'INF-DATA'),
    ('Master Data Science', 'MAT-CORE'),
    ('Licence Finance', 'FIN-CORE')
) AS data(program_name, module_code)
JOIN programs AS program ON program.name = data.program_name
JOIN modules_ue AS module ON module.code = data.module_code
ON CONFLICT (program_id, module_id) DO NOTHING;

INSERT INTO courses (code, title, credits, module_id)
SELECT data.code, data.title, data.credits, module.module_id
FROM (VALUES
    ('INF101', 'Algorithmique de base', 6, 'INF-FND'),
    ('INF201', 'Bases de données', 6, 'INF-DATA'),
    ('MAT101', 'Algèbre linéaire', 6, 'MAT-CORE'),
    ('FIN101', 'Comptabilité générale', 5, 'FIN-CORE')
) AS data(code, title, credits, module_code)
JOIN modules_ue AS module ON module.code = data.module_code
ON CONFLICT (code) DO NOTHING;
