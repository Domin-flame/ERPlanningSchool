-- 1. Position_
INSERT INTO hr.Position_ (title, salary_grade, department_id) VALUES
('Directeur RH', 'Grade A', 5),
('Comptable Senior', 'Grade B', 6),
('Développeur Lead', 'Grade A', 1),
('Professeur Titulaire', 'Grade A', 1),
('Assistant Administratif', 'Grade C', 5),
('Administrateur Réseau', 'Grade B', 1),
('Responsable Maintenance', 'Grade C', 3),
('Chargé de Recrutement', 'Grade B', 5),
('Analyste Financier', 'Grade B', 6),
('Technicien IT', 'Grade C', 1);

-- 2. Employee
INSERT INTO hr.Employee (department_id, user_id, hired_date, employment_status, position_id) VALUES
(5, 1, '2020-01-15', 'Active', 1),
(6, 2, '2021-03-01', 'Active', 2),
(1, 3, '2019-06-15', 'Active', 3),
(1, 4, '2018-09-01', 'Active', 4),
(5, 5, '2022-02-10', 'Active', 5),
(1, NULL, '2023-01-08', 'Active', 6),
(3, NULL, '2021-11-20', 'Active', 7),
(5, NULL, '2022-07-01', 'On Leave', 8),
(6, NULL, '2023-04-15', 'Active', 9),
(1, NULL, '2024-01-10', 'Probation', 10);

-- 3. Contract
INSERT INTO hr.Contract (salary, contract_type, start_date, end_date, employee_id) VALUES
(4500.00, 'CDI', '2020-01-15', NULL, 1),
(3500.00, 'CDI', '2021-03-01', NULL, 2),
(4200.00, 'CDI', '2019-06-15', NULL, 3),
(5000.00, 'CDI', '2018-09-01', NULL, 4),
(2200.00, 'CDD', '2022-02-10', '2026-12-31', 5),
(3000.00, 'CDI', '2023-01-08', NULL, 6),
(2500.00, 'CDI', '2021-11-20', NULL, 7),
(2800.00, 'CDI', '2022-07-01', NULL, 8),
(3200.00, 'CDI', '2023-04-15', NULL, 9),
(1800.00, 'Stage', '2024-01-10', '2026-07-10', 10);

-- 4. leave_type
INSERT INTO hr.leave_type (name, default_days) VALUES
('Congé Annuel', 25),
('Congé Maladie', 10),
('Congé Maternité', 90),
('Congé Paternité', 14),
('Congé Sans Solde', 30),
('Formation', 5),
('Événement Familial', 3),
('Congé Sabbatique', 180),
('Récupération (RTT)', 12),
('Congé Exceptionnel', 5);

-- 5. Leave_balance
INSERT INTO hr.Leave_balance (year_, days_remaining, employee_id, leave_type_id) VALUES
(2026, 20, 1, 1),
(2026, 10, 1, 2),
(2026, 15, 2, 1),
(2026, 25, 3, 1),
(2026, 8, 4, 2),
(2026, 12, 5, 1),
(2026, 22, 6, 1),
(2026, 90, 8, 3),
(2026, 18, 9, 1),
(2026, 25, 10, 1);

-- 6. Leave_request
INSERT INTO hr.Leave_request (start_date, end_date, status, approved_by, leave_type_id, employee_id) VALUES
('2026-08-01', '2026-08-15', 'Approved', 1, 1, 2),
('2026-05-10', '2026-05-12', 'Approved', 1, 2, 3),
('2026-09-01', '2026-09-10', 'Pending', NULL, 1, 4),
('2026-06-01', '2026-06-05', 'Rejected', 1, 5, 5),
('2026-07-01', '2026-07-02', 'Approved', 1, 7, 6),
('2026-04-01', '2026-07-01', 'Approved', 1, 3, 8),
('2026-11-01', '2026-11-05', 'Pending', NULL, 1, 9),
('2026-03-15', '2026-03-16', 'Approved', 1, 9, 7),
('2026-12-20', '2026-12-31', 'Pending', NULL, 1, 10),
('2026-02-10', '2026-02-11', 'Approved', 1, 2, 1);

-- 7. Performance_review
INSERT INTO hr.Performance_review (review_period, score, comments, reviewer_id, employee_id) VALUES
('2025-Q4', 92.50, 'Excellente gestion de l''équipe.', 1, 2),
('2025-Q4', 88.00, 'Objectifs d''enseignement atteints.', 1, 3),
('2025-Q4', 95.00, 'Recherche brillante et publications d''impact.', 1, 4),
('2025-Q4', 75.00, 'Travail satisfaisant mais attention aux délais.', 1, 5),
('2025-Q4', 85.00, 'Bonne gestion du réseau informatique.', 3, 6),
('2025-Q4', 80.00, 'Maintenance préventive bien exécutée.', 1, 7),
('2025-Q4', 90.00, 'Recrutements clés réussis.', 1, 8),
('2025-Q4', 87.50, 'Analyses financières précises.', 2, 9),
('2025-Q4', 70.00, 'En période d''adaptation.', 3, 10),
('2025-Q4', 98.00, 'Leadership exemplaire.', NULL, 1);

-- 8. Payroll_run
INSERT INTO hr.Payroll_run (period_month, period_year, process_by) VALUES
(1, 2026, 1), (2, 2026, 1), (3, 2026, 1), (4, 2026, 1), (5, 2026, 1),
(6, 2026, 1), (7, 2026, 1), (8, 2026, 1), (9, 2026, 1), (10, 2026, 1);

-- 9. Payslip
INSERT INTO hr.Payslip (gross_salary, deductions, payroll_id, employee_id) VALUES
(4500.00, 500.00, 7, 1),
(3500.00, 400.00, 7, 2),
(4200.00, 450.00, 7, 3),
(5000.00, 600.00, 7, 4),
(2200.00, 200.00, 7, 5),
(3000.00, 300.00, 7, 6),
(2500.00, 250.00, 7, 7),
(2800.00, 280.00, 7, 8),
(3200.00, 320.00, 7, 9),
(1800.00, 100.00, 7, 10);

-- 10. Asset
INSERT INTO hr.Asset (name, category, location) VALUES
('Laptop Dell XPS 15', 'Informatique', 'Bureau 101'),
('MacBook Pro 16', 'Informatique', 'Bureau 102'),
('Imprimante HP LaserJet', 'Bureautique', 'Secrétariat'),
('Projecteur Epson', 'Audiovisuel', 'Amphi A'),
('Ecran Dell 27 pouces', 'Informatique', 'Bureau 103'),
('Serveur Rack PowerEdge', 'Serveur', 'Salle Serveur'),
('Véhicule de Service', 'Transport', 'Parking A'),
('Tablette iPad Pro', 'Informatique', 'Bureau RH'),
('Routeur Cisco ISR', 'Réseau', 'Salle Serveur'),
('Scanner Fujitsu', 'Bureautique', 'Comptabilité');

-- 11. Asset_assignment
INSERT INTO hr.Asset_assignment (assignment_date, returned_date, asset_id, employee_id) VALUES
('2020-01-16', NULL, 1, 1),
('2021-03-02', NULL, 2, 2),
('2019-06-16', NULL, 5, 3),
('2022-02-11', NULL, 3, 5),
('2023-01-09', NULL, 6, 6),
('2021-11-21', NULL, 7, 7),
('2022-07-02', NULL, 8, 8),
('2023-04-16', NULL, 10, 9),
('2024-01-11', NULL, 4, 10),
('2023-02-01', '2024-01-01', 9, 6);

-- 12. Maintenance_request
INSERT INTO hr.Maintenance_request (description, status, reported_date, reported_by, asset_id) VALUES
('Écran scintille au démarrage', 'Open', '2026-07-01', 3, 5),
('Bourrage papier fréquent', 'In Progress', '2026-07-10', 5, 3),
('Vidange et révision annuelle', 'Completed', '2026-06-01', 7, 7),
('Remplacement de la lampe', 'Open', '2026-07-15', 10, 4),
('Mise à jour du firmware', 'Completed', '2026-05-20', 6, 9),
('Batterie ne tient plus la charge', 'Open', '2026-07-18', 2, 2),
('Changement de disque dur', 'Completed', '2026-04-12', 6, 6),
('Problème de numérisation recto-verso', 'In Progress', '2026-07-20', 9, 10),
('Surchauffe du processeur', 'Open', '2026-07-22', 1, 1),
('Vitre tactile fissurée', 'Pending Parts', '2026-07-25', 8, 8);