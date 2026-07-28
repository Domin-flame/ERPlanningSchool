-- ============================================================
-- Script de test des index — Semaine 2 (SEN4121)
-- À lancer avec : psql $DATABASE_URL -f test_indexes.sql
-- ============================================================

ANALYZE;


-- ------------------------------------------------------------
-- 1) Student.matricule (unique + index)
-- ------------------------------------------------------------
-- Attendu : "Index Scan using ix_student_matricule"
EXPLAIN ANALYZE
SELECT * FROM student WHERE matricule = 'ICTU202600042';


-- ------------------------------------------------------------
-- 2) User.email (unique + index)
-- ------------------------------------------------------------
EXPLAIN ANALYZE
SELECT * FROM "user" WHERE email = 'student1234_johndoe@ictu.cm';


-- ------------------------------------------------------------
-- 3) Invoice.student_id — factures d'un étudiant (Finance)
-- ------------------------------------------------------------
EXPLAIN ANALYZE
SELECT * FROM invoice WHERE student_id = 42;


-- ------------------------------------------------------------
-- 4) Payment.transaction_ref (unique + index)
-- ------------------------------------------------------------
EXPLAIN ANALYZE
SELECT * FROM payment WHERE transaction_ref = 'TXN-00042-1';


-- ------------------------------------------------------------
-- 5) Payment.invoice_id — paiements liés à une facture
-- ------------------------------------------------------------
EXPLAIN ANALYZE
SELECT * FROM payment WHERE invoice_id = 1;


-- ------------------------------------------------------------
-- 6) Employee.user_id — jointure HR <-> User
-- ------------------------------------------------------------
EXPLAIN ANALYZE
SELECT * FROM employee WHERE user_id = 5001;


-- ------------------------------------------------------------
-- 7) CONTRE-EXEMPLE : colonne NON indexée (User.name)
-- ------------------------------------------------------------
-- Attendu : "Seq Scan" — sert à montrer la différence à l'oral
EXPLAIN ANALYZE
SELECT * FROM "user" WHERE name = 'Jean Dupont';


-- ------------------------------------------------------------
-- 8) Comparer le TEMPS avec/sans index (facultatif mais convaincant)
-- ------------------------------------------------------------
SET enable_indexscan = off;
EXPLAIN ANALYZE
SELECT * FROM student WHERE matricule = 'ICTU202600042';
SET enable_indexscan = on;  -- ne pas oublier de réactiver !


-- ------------------------------------------------------------
-- 9) Lister tous les index existants (si l'examinateur demande)
-- ------------------------------------------------------------
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('user', 'student', 'employee', 'invoice', 'payment', 'payslip', 'leave_request')
ORDER BY tablename;


-- ------------------------------------------------------------
-- 10) Vérifier la répartition payé/non-payé (contexte métier utile)
-- ------------------------------------------------------------
SELECT status, count(*) FROM invoice GROUP BY status;