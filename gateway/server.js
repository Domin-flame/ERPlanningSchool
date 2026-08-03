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

// Microservices URLs
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
  academic: process.env.ACADEMIC_SERVICE_URL || 'http://localhost:8002',
  finance: process.env.FINANCE_SERVICE_URL || 'http://localhost:8003',
  hr: process.env.HR_SERVICE_URL || 'http://localhost:8004',
};

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());

// Swagger UI documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (req, res) => {
  res.json(swaggerSpec);
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// JWT Verification Middleware (skip for auth routes)
const verifyToken = (req, res, next) => {
  // Skip auth for public routes (use originalUrl to get full path regardless of mount point)
  if (req.originalUrl.startsWith('/api/auth/login') || 
      req.originalUrl.startsWith('/api/auth/register') ||
      req.originalUrl === '/api/health') {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'No token provided' });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ detail: 'Invalid or expired token' });
  }
};

// Helper to forward user context headers to microservices
function forwardUserHeaders(proxyReq, req) {
  if (req.user) {
    proxyReq.setHeader('X-User-ID', String(req.user.user_id));
    proxyReq.setHeader('X-User-Role', req.user.role);
    proxyReq.setHeader('X-User-Email', req.user.sub);
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    services: SERVICES
  });
});

// Aggregated services health (public, used by the frontend ServiceStatus widget)
app.get('/api/services/health', async (req, res) => {
  const checks = await Promise.all(
    Object.entries(SERVICES).map(async ([name, baseUrl]) => {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(`${baseUrl}/health`, { signal: controller.signal });
        clearTimeout(timeout);
        const responseTime = Date.now() - start;
        return { name, healthy: response.ok, responseTime };
      } catch (err) {
        return { name, healthy: false, responseTime: Date.now() - start, error: err.message };
      }
    })
  );
  res.json(checks);
});

// Helper to replay JSON body consumed by express.json() middleware
function replayBody(proxyReq, req) {
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyData = JSON.stringify(req.body);
    proxyReq.setHeader('Content-Type', 'application/json');
    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
  }
}

// API Routes with authentication
app.use('/api/auth', (req, res, next) => {
  // Public auth routes that don't require token verification
  const publicPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];
  const isPublic = publicPaths.some((p) => req.originalUrl.startsWith(p));
  
  if (isPublic) {
    return next();
  }

  // All other auth routes (me, logout, password/*) require JWT verification
  verifyToken(req, res, next);
}, createProxyMiddleware({
  target: SERVICES.auth,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/auth'
  },
  onProxyReq: (proxyReq, req, res) => {
    forwardUserHeaders(proxyReq, req);
    replayBody(proxyReq, req);
    console.log(`[Gateway] Proxying ${req.method} ${req.originalUrl} -> ${SERVICES.auth}/auth${req.path}`);
  },
  onError: (err, req, res) => {
    console.error('[Gateway] Auth Service Error:', err.message);
    res.status(503).json({ detail: 'Auth service unavailable' });
  }
}));

app.use('/api/academic', verifyToken, createProxyMiddleware({
  target: SERVICES.academic,
  changeOrigin: true,
  pathRewrite: {
    '^/api/academic': ''
  },
  onProxyReq: (proxyReq, req, res) => {
    forwardUserHeaders(proxyReq, req);
    replayBody(proxyReq, req);
    console.log(`[Gateway] Proxying ${req.method} ${req.path} -> ${SERVICES.academic}${req.path.replace('/api/academic', '')}`);
  },
  onError: (err, req, res) => {
    console.error('[Gateway] Academic Service Error:', err.message);
    res.status(503).json({ detail: 'Academic service unavailable' });
  }
}));

app.use('/api/finance', verifyToken, createProxyMiddleware({
  target: SERVICES.finance,
  changeOrigin: true,
  pathRewrite: {
    '^/api/finance': ''
  },
  onProxyReq: (proxyReq, req, res) => {
    forwardUserHeaders(proxyReq, req);
    replayBody(proxyReq, req);
    console.log(`[Gateway] Proxying ${req.method} ${req.path} -> ${SERVICES.finance}${req.path.replace('/api/finance', '')}`);
  },
  onError: (err, req, res) => {
    console.error('[Gateway] Finance Service Error:', err.message);
    res.status(503).json({ detail: 'Finance service unavailable' });
  }
}));

app.use('/api/hr', verifyToken, createProxyMiddleware({
  target: SERVICES.hr,
  changeOrigin: true,
  pathRewrite: {
    '^/api/hr': '/api/v1/hr'
  },
  onProxyReq: (proxyReq, req, res) => {
    forwardUserHeaders(proxyReq, req);
    replayBody(proxyReq, req);
    console.log(`[Gateway] Proxying ${req.method} ${req.path} -> ${SERVICES.hr}/api/v1/hr${req.path.replace('/api/hr', '')}`);
  },
  onError: (err, req, res) => {
    console.error('[Gateway] HR Service Error:', err.message);
    res.status(503).json({ detail: 'HR service unavailable' });
  }
}));

// Marketing module (via Academic/Finance service)
app.use('/api/marketing', verifyToken, createProxyMiddleware({
  target: SERVICES.finance,
  changeOrigin: true,
  pathRewrite: {
    '^/api/marketing': ''
  },
  onProxyReq: (proxyReq, req, res) => {
    forwardUserHeaders(proxyReq, req);
    replayBody(proxyReq, req);
    console.log(`[Gateway] Proxying ${req.method} ${req.path} -> ${SERVICES.finance}${req.path.replace('/api/marketing', '')}`);
  },
  onError: (err, req, res) => {
    console.error('[Gateway] Marketing Service Error:', err.message);
    res.status(503).json({ detail: 'Marketing service unavailable' });
  }
}));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ detail: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Gateway Error:', err);
  res.status(500).json({ detail: 'Internal gateway error' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📡 Services:`);
  console.log(`   - Auth: ${SERVICES.auth}`);
  console.log(`   - Academic: ${SERVICES.academic}`);
  console.log(`   - Finance: ${SERVICES.finance}`);
  console.log(`   - HR: ${SERVICES.hr}`);
});
