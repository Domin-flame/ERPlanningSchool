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
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { detail: 'Trop de requêtes depuis cette IP. Réessayez dans 15 minutes.' },
});
app.use('/api/', limiter);

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

app.use('/api/academic', verifyToken, makeProxy(SERVICES.academic, { '^/api/academic': '' }, 'academic'));

app.use('/api/finance', verifyToken, makeProxy(SERVICES.finance, { '^/api/finance': '' }, 'finance'));

app.use('/api/hr', verifyToken, makeProxy(SERVICES.hr, { '^/api/hr': '/api/v1/hr' }, 'hr'));

// Marketing — proxié vers finance-service (endpoints /campaigns et /leads)
app.use('/api/marketing', verifyToken, makeProxy(SERVICES.finance, { '^/api/marketing': '' }, 'marketing'));

// Messagerie
app.use('/api/messages', verifyToken, makeProxy(SERVICES.message, { '^/api/messages': '/api/v1' }, 'message'));

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
