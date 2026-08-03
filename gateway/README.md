# API Gateway - CampusWorkflow

## Description

API Gateway pour CampusWorkflow ERP. Point d'entrée unique pour tous les microservices.

## Fonctionnalités

- ✅ Reverse proxy vers les microservices
- ✅ JWT verification
- ✅ Rate limiting (100 req/15min)
- ✅ CORS
- ✅ Security headers (Helmet)
- ✅ Logging (Morgan)
- ✅ User context forwarding

## Installation

```bash
npm install
```

## Configuration

Créer un fichier `.env` :

```env
PORT=3000
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
AUTH_SERVICE_URL=http://auth-service:8001
ACADEMIC_SERVICE_URL=http://academic-service:8002
FINANCE_SERVICE_URL=http://finance-service:8003
HR_SERVICE_URL=http://hr-service:8004
```

## Démarrage

```bash
# Development
npm run dev

# Production
npm start
```

## Docker

```bash
docker build -t campusworkflow-gateway .
docker run -p 3000:3000 campusworkflow-gateway
```

## Routes

### Public
- `GET /health` - Health check

### Authentification (pas de token requis)
- `POST /api/auth/register` → Auth Service
- `POST /api/auth/login` → Auth Service

### Protégé (token JWT requis)
- `/api/auth/*` → Auth Service
- `/api/academic/*` → Academic Service
- `/api/finance/*` → Finance Service
- `/api/hr/*` → HR Service

## Architecture

```
Client Request
      ↓
   Gateway (:3000)
      ├── JWT Verification
      ├── Rate Limiting
      ├── Add User Headers
      ↓
┌─────┴──────┬──────────┬─────────┐
│    Auth    │ Academic │ Finance │ HR
│   :8001    │  :8002   │  :8003  │ :8004
```

## Headers forwarded to services

Le Gateway ajoute ces headers à chaque requête :

```
X-User-ID: 4
X-User-Role: Student
X-User-Email: student@campus.local
```

## Sécurité

- **JWT** : Vérifie la signature et l'expiration
- **Rate Limiting** : 100 requêtes par IP par 15 minutes
- **Helmet** : Headers de sécurité HTTP
- **CORS** : Configuré pour le frontend

## Développement

```bash
npm install
npm run dev
```

Le serveur redémarre automatiquement avec nodemon.

## Tests

```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

## Logs

Les logs incluent :
- Timestamp
- Method
- Path
- Status code
- Response time

Format Morgan : `combined`
