# Suivi de bugs (Bug Tracking)

Le cahier des charges demande une preuve de suivi de bugs ("issue tracker
board, e.g., GitHub Issues/Trello, with resolved and open items"). Ce
document liste les tickets réellement identifiés pendant l'audit du
projet (colonne **Terminé**, avec la preuve — fichier(s) modifié(s) et
tests qui valident la correction) et les tickets encore ouverts.

> ⚠️ **À faire par vous** : reproduire ces tickets sous forme de véritables
> issues dans l'onglet **GitHub Issues** (ou un board Trello) de votre
> dépôt, avec des labels (`bug`, `security`, `enhancement`) et les
> assigner aux membres du groupe. Ce fichier n'est pas un substitut au
> board réel — c'est la matière brute pour le créer en quelques minutes
> (copier-coller chaque ticket ci-dessous comme une issue), et une preuve
> écrite immédiatement disponible en attendant.

---

## ✅ Terminé (Done)

| # | Titre | Sévérité | Composant | Preuve de correction |
|---|---|---|---|---|
| 1 | Aucune limite sur les tentatives de connexion échouées (brute force possible) | 🔴 Critique | `module_authentification` | `app/redis_client.py` (`record_failed_login`, `lock_account`), `app/main.py` (`login()`) ; tests : `tests/test_account_lockout.py` (3 tests) |
| 2 | Refresh token réutilisable indéfiniment jusqu'à expiration (pas de rotation réelle) | 🔴 Critique | `module_authentification` | `app/main.py` (`_create_refresh_token`, `refresh_token()`, `logout()`) ; tests : `tests/test_refresh_rotation.py` (3 tests) |
| 3 | Aucun test automatisé sur `module_authentification`, `module_finance_marketing`, `module_rh`, `module_message`, `module_notification`, `gateway`, `frontend` | 🟠 Majeur | Tous les services sauf `module_academique` | 84 tests ajoutés au total (voir `tests/` de chaque service) |
| 4 | Aucun pipeline CI/CD — pas de build/test automatique sur push vers `main` | 🟠 Majeur | Racine du dépôt | `.github/workflows/ci.yml` (4 jobs : tests Python, Gateway, Frontend, build Docker) |
| 5 | Aucune sauvegarde automatisée, aucune procédure PITR documentée | 🟠 Majeur | Infrastructure (PostgreSQL ×6) | `postgres/backup/*.sh`, service `db-backup` dans `docker-compose.yml`, `docs/BACKUP_ET_PITR.md` |
| 6 | `QUICK_START.md` référence un script `verify-and-run.sh` qui n'existe pas (macOS/Linux) | 🟡 Mineur | Documentation | `verify-and-run.sh` créé |
| 7 | `QUICK_START.md` liste des comptes de démonstration erronés (`admin@campus.edu`, `staff@campus.edu`...) qui ne correspondent à aucun compte réellement seedé | 🟡 Mineur | Documentation | `QUICK_START.md` corrigé avec les 6 comptes réels |
| 8 | `QUICK_START.md` référence 3 fichiers inexistants (`README_SETUP.md`, `CONNECTIVITY_STATUS.md`, `DESIGN_IMPLEMENTATION_SUMMARY.md`) | 🟡 Mineur | Documentation | Liens morts retirés de `QUICK_START.md` |
| 9 | `start.bat` supprime des volumes Docker nommés en dur (`campusworkflow_*`) qui ne correspondent pas au préfixe réel du projet | 🟡 Mineur | Scripts de déploiement | `start.bat` réécrit (utilise `docker compose down -v` au lieu de noms de volumes devinés) |
| 10 | `SECURITY.md` ne documentait explicitement que 3 risques OWASP (le cahier des charges en demande 5) | 🟡 Mineur | Documentation | `SECURITY.md` étendu à 6 risques détaillés (A01, A02, A03, A07, A05, + XSS/CSRF/A08) |
| 16 | **Incohérence critique entre les scripts SQL bruts (`postgres/*.sql`) et les modèles ORM réels** — `academic-service` et `hr-service` s'auto-créent silencieusement leurs PROPRES tables vides (noms au pluriel) à côté des tables seedées (noms au singulier), ignorant toutes les données de démo ; `finance-service` plantait carrément (`relation does not exist`) car ses colonnes ORM (français) ne correspondent à AUCUNE colonne du script SQL (anglais) | 🔴 **Critique** | `academic-db`, `finance-db`, `hr-db` | Découvert en faisant tourner la vraie pile (Postgres/Redis/RabbitMQ + les 4 services) hors Docker. Corrigé dans `docker-compose.yml` (`DATABASE_SCHEMA: public`, retrait des montages SQL obsolètes, `DB_AUTO_INIT: "true"` pour finance) + nouveaux scripts de seed ORM (`scripts/seed_academic.py`, `seed_finance.py`, `seed_hr.py`), vérifiés fonctionnels via API réelle (login + lecture des données seedées à travers le gateway) |

## 🔵 Ouvert (Open / To Do)

| # | Titre | Sévérité | Composant | Notes |
|---|---|---|---|---|
| 12 | MFA (multi-facteur) optionnel pour les comptes admin — non implémenté | 🟢 Mineur (bonus) | `module_authentification` | Explicitement listé comme "bonus" dans l'énoncé, pas requis |
| 13 | `GET /finance/invoices` renvoie l'ensemble des factures aux rôles autorisés, sans filtrage par étudiant côté API | 🟡 Mineur | `module_finance_marketing` | Limitation déjà documentée dans `README.md` §8 ("Limites connues") |
| 14 | Correspondance entre l'utilisateur académique (`module_academique.User`) et le compte d'authentification (`module_authentification`) non systématiquement réconciliée | 🟡 Mineur | `module_academique` / `module_authentification` | Limitation pré-existante, documentée dans `README.md` §8 |
| 15 | Résultats du test de charge k6 à valider dans l'environnement Docker réel de l'équipe | 🟡 Mineur | `load-testing/` | Résultats réels obtenus (hors Docker, vrais PostgreSQL/Redis/RabbitMQ) — voir `load-testing/RESULTS.md`. À rejouer contre le vrai `docker-compose` pour les chiffres définitifs du rapport. |
| 17 | Les politiques RLS (Row-Level Security) du script SQL abandonné (`finance.Invoice`...) ne sont pas recréées sur les nouvelles tables auto-créées (schéma `public`) | 🟡 Mineur | `module_finance_marketing` | Ces politiques ciblaient déjà des tables que l'application ne consultait jamais (voir #16) — pas une régression, mais à recréer si une isolation au niveau ligne est requise |

---

## Corrigé après relecture (Done, ajout)

| # | Titre | Sévérité | Composant | Preuve de correction |
|---|---|---|---|---|
| 11 | Pas de SRS structurée ISO/IEC/IEEE 29148 ni de suite UML complète | 🔴 Critique | Documentation | `docs/SRS.md` (SRS complète) + `docs/uml/` (cas d'utilisation, classes, 2 séquences dont le workflow async, ERD par service, déploiement) |

---

## Comment ce board a été alimenté

Chaque ticket "Terminé" correspond à un écart réel identifié en confrontant
le code du dépôt à l'énoncé `Large_System_Environment_SET_A_Summer_2026.pdf`
(audit initial), puis corrigé et **vérifié par une exécution réelle des
tests** (pas seulement écrit) avant d'être marqué comme résolu — voir les
suites de tests citées en colonne "Preuve de correction".
