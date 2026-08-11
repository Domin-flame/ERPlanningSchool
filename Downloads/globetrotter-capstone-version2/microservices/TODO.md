# GlobeTrotter Phase 2 - Fix Docker Compose Container Conflict

## Objective
Fix the `Conflict. The container name "/globetrotter_itinerary_db" is already in use` error by:
- Keeping PostgreSQL (removing MySQL) in the compose files.
- Cleaning up stale/conflicting Docker containers.

## Steps
- [x] Analyze the error and understand root cause (stale containers + MySQL/Postgres mismatch)
- [x] Confirm with user: keep PostgreSQL, remove MySQL

## Implementation
- [ ] Revert root `docker-compose.yml` to PostgreSQL 15 (ports 5433/5434/5435, psycopg2 URLs)
- [ ] Revert `microservices/docker-compose.yml` to PostgreSQL 15 (same changes)
- [ ] Stop and remove stale `globetrotter_*` containers (itinerary_db, user_db, destinations_db, rabbitmq, services)
- [ ] Remove orphan `globetrotter_app` container

## Follow-up
- [ ] `docker compose up --build` (from microservices dir)
- [ ] Verify all services healthy and gateway responds on :8000
