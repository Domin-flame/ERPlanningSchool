-- 1. Fee_structure
INSERT INTO finance.Fee_structure (academic_year, tuition_amount) VALUES
('2024-2025', 1500000.00), ('2024-2025', 2000000.00), ('2025-2026', 1600000.00),
('2025-2026', 2100000.00), ('2023-2024', 1400000.00), ('2023-2024', 1900000.00),
('2026-2027', 1700000.00), ('2026-2027', 2200000.00), ('2022-2023', 1300000.00),
('2022-2023', 1800000.00);

-- 2. Invoice
INSERT INTO finance.Invoice (issue_date, due_date, status, student_id, fee_structure_id) VALUES
('2024-09-01', '2024-10-01', 'Paid', 1, 1),
('2024-09-01', '2024-10-01', 'Partial', 2, 1),
('2024-09-01', '2024-10-01', 'Unpaid', 3, 2),
('2023-09-01', '2023-10-01', 'Paid', 4, 5),
('2023-09-01', '2023-10-01', 'Paid', 5, 5),
('2025-09-01', '2025-10-01', 'Unpaid', 6, 3),
('2025-09-01', '2025-10-01', 'Unpaid', 7, 3),
('2024-09-01', '2024-10-01', 'Overdue', 8, 2),
('2024-09-01', '2024-10-01', 'Paid', 9, 1),
('2023-09-01', '2023-10-01', 'Paid', 10, 6);

-- 3. Invoice_item
INSERT INTO finance.Invoice_item (description, amount, invoice_id) VALUES
('Frais de scolarité - Tranche 1', 750000.00, 1),
('Frais de scolarité - Tranche 2', 750000.00, 1),
('Frais de scolarité - Tranche 1', 750000.00, 2),
('Frais de scolarité - Tranche 1', 1000000.00, 3),
('Frais d''inscription', 50000.00, 1),
('Frais d''inscription', 50000.00, 2),
('Frais de laboratoire', 100000.00, 4),
('Frais de bibliothèque', 20000.00, 5),
('Frais de scolarité annuelle', 1600000.00, 6),
('Assurance étudiante', 30000.00, 7);

-- 4. Payment
INSERT INTO finance.Payment (amount_paid, payment_date, payment_method, transaction_ref, invoice_id) VALUES
(800000.00, '2024-09-10 10:30:00', 'Bank Transfer', 'TXN-2024-001', 1),
(750000.00, '2024-12-15 14:20:00', 'Bank Transfer', 'TXN-2024-002', 1),
(400000.00, '2024-09-12 11:00:00', 'Mobile Money', 'TXN-2024-003', 2),
(1400000.00, '2023-09-05 09:15:00', 'Credit Card', 'TXN-2023-004', 4),
(1400000.00, '2023-09-08 16:45:00', 'Bank Transfer', 'TXN-2023-005', 5),
(1500000.00, '2024-09-15 13:00:00', 'Cash', 'TXN-2024-006', 9),
(1900000.00, '2023-09-10 10:00:00', 'Bank Transfer', 'TXN-2023-007', 10),
(200000.00, '2024-10-05 15:30:00', 'Mobile Money', 'TXN-2024-008', 8),
(100000.00, '2025-09-10 09:00:00', 'Mobile Money', 'TXN-2025-009', 6),
(50000.00, '2025-09-11 11:30:00', 'Cash', 'TXN-2025-010', 7);

-- 5. scholarship
INSERT INTO finance.scholarship (title, discount_percentage, type) VALUES
('Bourse d''Excellence', 50.00, 'Merit'),
('Bourse Sociale', 30.00, 'Need-based'),
('Bourse de Recherche Master', 100.00, 'Merit'),
('Réduction Fratrie', 15.00, 'Special'),
('Bourse Athlétique', 25.00, 'Talent'),
('Bourse Partenariat Entreprise', 40.00, 'Corporate'),
('Bourse Diversité', 20.00, 'Inclusion'),
('Bourse Major de Promo', 75.00, 'Merit'),
('Bourse Régionale', 10.00, 'Geographic'),
('Exonération Partielle', 5.00, 'Special');

-- 6. Student_scholarship
INSERT INTO finance.Student_scholarship (academic_year, Approved_by, student_id, scholarship_id) VALUES
('2024-2025', 1, 1, 1),
('2024-2025', 1, 2, 2),
('2023-2024', 1, 4, 3),
('2023-2024', 1, 5, 4),
('2025-2026', 1, 6, 5),
('2025-2026', 1, 7, 6),
('2024-2025', 1, 8, 7),
('2024-2025', 1, 9, 8),
('2023-2024', 1, 10, 9),
('2025-2026', 1, 3, 10);

-- 7. Campaign
INSERT INTO finance.Campaign (name, channel, start_date, end_date, budget) VALUES
('Portes Ouvertes 2025', 'Event', '2025-02-01', '2025-03-01', 500000.00),
('Campagne Réseaux Sociaux 2025', 'Digital', '2025-05-01', '2025-08-31', 1200000.00),
('Panneaux Publicitaires Ville', 'Billboard', '2025-06-01', '2025-07-31', 2000000.00),
('Salons de l''Étudiant', 'Event', '2025-01-10', '2025-01-25', 800000.00),
('Emailing Lycées 2025', 'Email', '2025-04-01', '2025-05-15', 150000.00),
('Campagne Radio Locale', 'Radio', '2025-07-01', '2025-08-15', 600000.00),
('Sponsor Google Ads', 'Digital', '2025-03-01', '2025-09-01', 1000000.00),
('Inbound Marketing Blog', 'Content', '2025-01-01', '2025-12-31', 300000.00),
('Journée Orientation', 'Event', '2025-04-20', '2025-04-21', 250000.00),
('Campagne Presso', 'Press', '2025-05-15', '2025-06-15', 400000.00);

-- 8. Lead_
INSERT INTO finance.Lead_ (full_name, email, phone, status, approved_to, campaign_id) VALUES
('Lucas Morel', 'lucas.morel@gmail.com', '+33612345678', 'Converted', 8, 1),
('Sophie Bernard', 'sophie.b@yahoo.fr', '+33623456789', 'Contacted', 8, 2),
('Thomas Petit', 'thomas.petit@hotmail.com', '+33634567890', 'New', NULL, 2),
('Emma Roux', 'emma.roux@outlook.com', '+33645678901', 'Qualified', 8, 3),
('Hugo Leroy', 'hugo.leroy@gmail.com', '+33656789012', 'Unqualified', 8, 4),
('Chloé David', 'chloe.david@gmail.com', '+33667890123', 'Contacted', 8, 5),
('Maxime Bertrand', 'max.bertrand@gmail.com', '+33678901234', 'New', NULL, 6),
('Léa Fournier', 'lea.fournier@yahoo.fr', '+33689012345', 'Converted', 8, 7),
('Antoine Girard', 'antoine.g@gmail.com', '+33690123456', 'Qualified', 8, 8),
('Camille Bonnet', 'camille.bonnet@gmail.com', '+33601234567', 'New', NULL, 1);

-- 9. Budget
INSERT INTO finance.Budget (fiscal_year, allocated_amount) VALUES
(2024, 50000000.00), (2025, 55000000.00), (2026, 60000000.00),
(2023, 45000000.00), (2022, 40000000.00), (2027, 65000000.00),
(2021, 35000000.00), (2020, 30000000.00), (2019, 28000000.00),
(2018, 25000000.00);

-- 10. Expense_request
INSERT INTO finance.Expense_request (amount, status, approved_by, budget_id) VALUES
(150000.00, 'Approved', 1, 3),
(45000.00, 'Approved', 1, 3),
(1200000.00, 'Pending', NULL, 3),
(300000.00, 'Approved', 1, 2),
(85000.00, 'Rejected', 1, 3),
(500000.00, 'Approved', 1, 3),
(250000.00, 'Approved', 1, 2),
(60000.00, 'Pending', NULL, 3),
(180000.00, 'Approved', 1, 1),
(95000.00, 'Approved', 1, 3);