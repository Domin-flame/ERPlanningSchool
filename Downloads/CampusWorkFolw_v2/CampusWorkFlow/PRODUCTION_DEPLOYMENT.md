# Production deployment requirements

The repository is **not certified production-ready**. These changes make the
default Compose deployment safer, but an operator must complete the controls
below before exposing the application or handling real student, employee, or
payment data.

## Production configuration

- Compose defaults target local development, not production. Set
  `APP_ENV=production` explicitly before deployment.
- Override all local fallback credentials (`DB_USER`, `DB_PASSWORD`,
  `REDIS_PASSWORD`, `RABBITMQ_USER`, `RABBITMQ_PASS`, and `JWT_SECRET`) with
  unique values from a protected deployment secret store. Every PostgreSQL
  database uses the same `DB_USER` and `DB_PASSWORD`. Use randomly generated
  values; the JWT secret must be at least 32 characters. Production startup
  rejects known placeholders and short JWT secrets.
- Store `CHATBOT_API_KEY` in the same secret manager, configure the provider's
  HTTPS Chat Completions endpoint and model through `CHATBOT_API_URL` and
  `CHATBOT_MODEL`, and review the provider's data-retention/privacy terms.
  Chatbot prompts are sent to that external provider; never include passwords,
  personal records, or confidential data.
- Set `DB_AUTO_SEED=false`. Do not enable the authentication demo-account
  seed or the academic catalogue seed.
- Set `ALLOWED_ORIGINS` to the exact HTTPS origin(s) serving the frontend.
- Compose publishes only the frontend and gateway, bound to `127.0.0.1`.
  Terminate TLS at a maintained reverse proxy on the same host (or a securely
  connected load balancer) and expose only that HTTPS endpoint. Do not bind
  service, database, Redis, or RabbitMQ ports to a public interface.
- Generate URL-safe random credentials (for example, `openssl rand -hex 32`)
  so passwords interpolated into database and broker connection URLs do not
  need ambiguous URI escaping. Use separate values for each credential.
- Use a production `.env` only as a local fallback; prefer the deployment
  platform's secret injection. Never commit it.

`docker-compose.yml` uses `create_all` for some services and database init
scripts for others. This repository does not provide a complete, versioned
migration and rollback process. Existing Docker volumes are not migrated or
cleaned by changing seed defaults; review and back up existing data before
upgrading, and remove any demo accounts manually after verifying the account
list.

## Required before real production data

1. Implement and rehearse versioned migrations for every database. Define the
   backup/restore procedure and test recovery on a separate environment.
2. Choose and configure a secrets manager, including rotation of shared JWT,
   database, Redis, and RabbitMQ credentials.
3. Place the app behind HTTPS with appropriate security headers, request size
   limits, and external rate limiting. Configure trusted proxy behavior and
   production CORS origins.
4. Configure SMTP and test password recovery; configure monitoring, alerting,
   centralized logs, and service/database resource limits.
5. Obtain a security review and validate authorization, privacy, retention,
   and audit requirements for the deployment jurisdiction.
6. Replace simplified payroll/tax calculations with currently approved rules
   and complete payment provider integration and reconciliation before using
   financial workflows.
7. Run staging acceptance tests with production-like configuration and real
   migrations before deployment.

The health checks in Compose use `localhost` from inside each container, which
is correct for checking that container's own process. They are not a substitute
for external monitoring or end-to-end readiness checks.
