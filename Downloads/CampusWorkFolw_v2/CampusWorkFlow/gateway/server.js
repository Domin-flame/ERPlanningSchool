const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// ── Services ─────────────────────────────────────────────────
const SERVICES = {
  auth:         process.env.AUTH_SERVICE_URL         || 'http://localhost:8001',
  academic:     process.env.ACADEMIC_SERVICE_URL     || 'http://localhost:8002',
  finance:      process.env.FINANCE_SERVICE_URL      || 'http://localhost:8003',
  hr:           process.env.HR_SERVICE_URL           || 'http://localhost:8004',
  message:      process.env.MESSAGE_SERVICE_URL      || 'http://localhost:8005',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8006',
};

// ── Middlewares ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json());

// ── Swagger ────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));

// ── Rate limiting ──────────────────────────────────────────────
// Mitigation OWASP API4:2023 (Unrestricted Resource Consumption) et
// OWASP API2:2023 (Broken Authentication — force brute sur /login).
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Trop de requêtes depuis cette IP. Réessayez dans 15 minutes.' },
});
app.use('/api/', limiter);

// Limiteur dédié, plus strict, sur les endpoints d'authentification
// sensibles (login / register / reset) pour ralentir le credential
// stuffing et le brute force de mots de passe, indépendamment du quota
// global de l'API.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
});
app.use(['/api/auth/login', '/api/auth/register', '/api/auth/password/reset'], authLimiter);

// ── JWT verification ───────────────────────────────────────────
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/password/reset',
  '/api/health',
  '/health',
];

const verifyToken = (req, res, next) => {
  const isPublic = PUBLIC_PATHS.some((p) => req.originalUrl.startsWith(p));
  if (isPublic) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ detail: 'Token invalide ou expiré' });
  }
};

// ── RBAC (contrôle d'accès centralisé) ───────────────────────────
// Mitigation OWASP API Top 10 — "Broken Function Level Authorization" /
// "Broken Object Level Authorization" : les microservices académique et
// finance/marketing ne vérifient pas eux-mêmes le rôle de l'appelant, donc
// SANS cette barrière, n'importe quel compte authentifié (ex. "student")
// pourrait créer/modifier/supprimer n'importe quelle ressource pédagogique
// ou financière. Le gateway impose donc ici, de façon centralisée et
// auditable en un seul endroit, quels rôles ont le droit d'effectuer des
// écritures (POST/PUT/PATCH/DELETE) sur chaque domaine métier.
//
// Rôles valides : academic | professeur | student | rh | finance | marketing
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const RBAC_RULES = [
  // { prefix, methods (default: all), allow (roles autorisés) }
  // HR — 'student' et 'marketing' n'ont aucun accès au module RH.
  { prefix: '/api/hr', allow: ['academic', 'rh', 'finance', 'professeur'] },

  // Académique — lecture ouverte à tous les rôles authentifiés (portails
  // Dashboard/Analytics en ont besoin) ; écriture réservée à la Direction
  // (academic) et aux enseignants (ex : saisie de notes / présences).
  { prefix: '/api/academic', methods: WRITE_METHODS, allow: ['academic', 'professeur'] },

  // Finance — écriture (facturation, paiements) réservée à Finance et à la
  // Direction ; lecture élargie (un étudiant doit pouvoir consulter ses
  // propres factures depuis son tableau de bord).
  { prefix: '/api/finance', methods: WRITE_METHODS, allow: ['academic', 'finance'] },

  // Marketing — même logique, réservé à Marketing + Direction en écriture.
  { prefix: '/api/marketing', methods: WRITE_METHODS, allow: ['academic', 'marketing'] },
];

function rbacGuard(req, res, next) {
  if (!req.user) return next(); // routes publiques déjà filtrées par verifyToken

  const rule = RBAC_RULES.find((r) => req.originalUrl.startsWith(r.prefix));
  if (!rule) return next();

  const methodGuarded = !rule.methods || rule.methods.has(req.method);
  if (!methodGuarded) return next();

  const role = (req.user.role || '').toLowerCase();
  if (!rule.allow.includes(role)) {
    return res.status(403).json({
      detail: `Rôle '${req.user.role}' non autorisé pour cette action (${req.method} ${rule.prefix})`,
    });
  }
  return next();
}

async function messageConversationGuard(req, res, next) {
  if (req.method !== 'POST' || !req.user) return next();
  const participantIds = req.body?.participant_ids;
  if (!Array.isArray(participantIds) || participantIds.length === 0) {
    return res.status(400).json({ detail: 'Au moins un destinataire est requis' });
  }
  try {
    const directoryResponse = await fetch(`${SERVICES.auth}/auth/directory`, {
      headers: { Authorization: req.headers.authorization },
    });
    if (!directoryResponse.ok) return res.status(503).json({ detail: 'Annuaire indisponible' });
    const directory = await directoryResponse.json();
    const byId = new Map(directory.map((entry) => [Number(entry.id), entry]));
    const callerRole = String(req.user.role || '').toLowerCase();
    const allowedForStudent = new Set(['student', 'professeur', 'academic', 'finance']);
    const forbidden = participantIds.some((id) => {
      const recipient = byId.get(Number(id));
      if (!recipient) return true;
      if (callerRole !== 'student') return false;
      return !allowedForStudent.has(String(recipient.role || '').toLowerCase());
    });
    if (forbidden) return res.status(403).json({ detail: 'Destinataire non autorisé pour votre rôle' });
    return next();
  } catch (error) {
    console.error('[Gateway] message permission check error:', error.message);
    return res.status(503).json({ detail: 'Impossible de vérifier les permissions du destinataire' });
  }
}

// ── Helpers ────────────────────────────────────────────────────
function forwardUserHeaders(proxyReq, req) {
  if (req.user) {
    proxyReq.setHeader('X-User-ID',    String(req.user.user_id));
    proxyReq.setHeader('X-User-Role',  req.user.role);
    proxyReq.setHeader('X-User-Email', req.user.sub);
  }
}

function replayBody(proxyReq, req) {
  if (req.body && Object.keys(req.body).length > 0) {
    const body = JSON.stringify(req.body);
    proxyReq.setHeader('Content-Type', 'application/json');
    proxyReq.setHeader('Content-Length', Buffer.byteLength(body));
    proxyReq.write(body);
  }
}

function makeProxy(target, pathRewrite, serviceName) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    onProxyReq: (proxyReq, req) => {
      forwardUserHeaders(proxyReq, req);
      replayBody(proxyReq, req);
    },
    onProxyRes: (proxyRes) => {
      try { proxyRes.headers['x-handled-by'] = serviceName; } catch (_) {}
    },
    onError: (err, req, res) => {
      console.error(`[Gateway] ${serviceName} error:`, err.message);
      res.status(503).json({ detail: `Service ${serviceName} indisponible` });
    },
  });
}

// ── Health ─────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'api-gateway', timestamp: new Date().toISOString(), services: SERVICES });
});

app.get('/api/services/health', async (req, res) => {
  const checks = await Promise.all(
    Object.entries(SERVICES).map(async ([name, baseUrl]) => {
      const start = Date.now();
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 3000);
        const resp = await fetch(`${baseUrl}/health`, { signal: ctrl.signal });
        clearTimeout(t);
        return { name, healthy: resp.ok, responseTime: Date.now() - start };
      } catch (err) {
        return { name, healthy: false, responseTime: Date.now() - start, error: err.message };
      }
    })
  );
  res.json(checks);
});

// ── Proxy routes ───────────────────────────────────────────────

// Auth — routes publiques d'abord, puis protégées
app.use('/api/auth', (req, res, next) => {
  const pub = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/password/reset'];
  if (pub.some((p) => req.originalUrl.startsWith(p))) return next();
  verifyToken(req, res, next);
}, makeProxy(SERVICES.auth, { '^/api/auth': '/auth' }, 'auth'));

app.use('/api/academic', verifyToken, rbacGuard, makeProxy(SERVICES.academic, { '^/api/academic': '' }, 'academic'));

app.use('/api/finance', verifyToken, rbacGuard, makeProxy(SERVICES.finance, { '^/api/finance': '' }, 'finance'));

app.use('/api/hr', verifyToken, rbacGuard, makeProxy(SERVICES.hr, { '^/api/hr': '/api/v1/hr' }, 'hr'));

// Marketing — proxié vers finance-service (endpoints /campaigns et /leads)
app.use('/api/marketing', verifyToken, rbacGuard, makeProxy(SERVICES.finance, { '^/api/marketing': '' }, 'marketing'));

// Messagerie
app.use('/api/messages', verifyToken, messageConversationGuard, makeProxy(SERVICES.message, { '^/api/messages': '/api/v1' }, 'message'));

// Notifications
app.use('/api/notifications', verifyToken, makeProxy(SERVICES.notification, { '^/api/notifications': '/api/v1/notifications' }, 'notification'));

// ── Demo rate-limit ────────────────────────────────────────────
const demoLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });
app.get('/api/demo/ratelimit', demoLimiter, (req, res) => {
  res.set('X-Handled-By', 'gateway');
  res.json({ message: 'ok', info: 'Réponse du gateway (non proxiée)' });
});

// ── 404 / Error handlers ───────────────────────────────────────
app.use((req, res) => res.status(404).json({ detail: 'Route introuvable' }));
app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(500).json({ detail: 'Erreur interne du gateway' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway sur le port ${PORT}`);
  Object.entries(SERVICES).forEach(([n, u]) => console.log(`   → ${n}: ${u}`));
});
