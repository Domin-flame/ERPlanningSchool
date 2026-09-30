/**
 * Tests du Gateway : vérification JWT, RBAC centralisé, rate limiting.
 *
 * On n'a pas besoin des vrais microservices en aval : /health et le RBAC
 * (qui bloque AVANT le proxy) sont testables directement. Pour les routes
 * proxiées vers un backend absent, on vérifie juste que le gateway répond
 * 503 "Service indisponible" plutôt que de planter — ce qui prouve que le
 * middleware de proxy est bien branché.
 */
process.env.JWT_SECRET = 'test-secret-for-ci';
process.env.PORT = '0'; // sans effet ici car server.js n'écoute pas en mode test

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../server');

const SECRET = process.env.JWT_SECRET;

function token(role, overrides = {}) {
  return jwt.sign({ sub: 'user@example.com', user_id: 1, role, ...overrides }, SECRET);
}

describe('GET /health', () => {
  it('renvoie un statut healthy sans authentification', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
});

describe('Vérification JWT (verifyToken)', () => {
  it('refuse une route protégée sans token', async () => {
    const res = await request(app).get('/api/academic/anything');
    expect(res.status).toBe(401);
  });

  it('refuse un token invalide', async () => {
    const res = await request(app)
      .get('/api/academic/anything')
      .set('Authorization', 'Bearer not-a-valid-jwt');
    expect(res.status).toBe(401);
  });

  it('laisse passer les routes publiques sans token (proxy tenté, backend absent -> 503)', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'x' });
    // Pas de 401 : la route est publique. Le backend auth n'existe pas ici,
    // donc le proxy répond 503 (« Service auth indisponible »).
    expect(res.status).not.toBe(401);
    expect([503, 502, 404]).toContain(res.status);
  });
});

describe('RBAC centralisé (rbacGuard)', () => {
  it("bloque un 'student' qui tente une écriture sur /api/academic", async () => {
    const res = await request(app)
      .post('/api/academic/courses')
      .set('Authorization', `Bearer ${token('student')}`)
      .send({ name: 'Algo 1' });
    expect(res.status).toBe(403);
  });

  it("autorise 'professeur' à écrire sur /api/academic (backend absent -> 503, pas 403)", async () => {
    const res = await request(app)
      .post('/api/academic/courses')
      .set('Authorization', `Bearer ${token('professeur')}`)
      .send({ name: 'Algo 1' });
    expect(res.status).not.toBe(403);
  });

  it("bloque 'student' et 'marketing' sur /api/hr (aucun accès)", async () => {
    for (const role of ['student', 'marketing']) {
      const res = await request(app)
        .get('/api/hr/employees')
        .set('Authorization', `Bearer ${token(role)}`);
      expect(res.status).toBe(403);
    }
  });

  it("autorise 'rh' sur /api/hr (backend absent -> pas de 403)", async () => {
    const res = await request(app)
      .get('/api/hr/employees')
      .set('Authorization', `Bearer ${token('rh')}`);
    expect(res.status).not.toBe(403);
  });

  it("bloque 'student' qui tente une écriture sur /api/finance", async () => {
    const res = await request(app)
      .post('/api/finance/invoices')
      .set('Authorization', `Bearer ${token('student')}`)
      .send({ amount: 1000 });
    expect(res.status).toBe(403);
  });

  it("la lecture (GET) sur /api/finance n'est pas soumise au RBAC d'écriture", async () => {
    // Les règles RBAC pour /api/finance ne s'appliquent qu'aux méthodes
    // d'écriture (WRITE_METHODS) — un GET doit donc passer le rbacGuard
    // même pour un rôle 'student' (contrôle fin délégué au service).
    const res = await request(app)
      .get('/api/finance/invoices/mine')
      .set('Authorization', `Bearer ${token('student')}`);
    expect(res.status).not.toBe(403);
  });
});

describe('Inscriptions étudiantes (/api/academic/enrollments)', () => {
  const auth = (role) => `Bearer ${token(role)}`;

  it("autorise un 'student' à créer une inscription (backend absent -> pas de 403)", async () => {
    const res = await request(app)
      .post('/api/academic/enrollments/')
      .set('Authorization', auth('student'))
      .send({ student_id: 1, course_offering_id: 1 });
    expect(res.status).not.toBe(403);
  });

  it("bloque un 'student' qui tente de supprimer une inscription", async () => {
    const res = await request(app)
      .delete('/api/academic/enrollments/1')
      .set('Authorization', auth('student'));
    expect(res.status).toBe(403);
  });

  it("bloque 'marketing' sur la création d'inscription", async () => {
    const res = await request(app)
      .post('/api/academic/enrollments/')
      .set('Authorization', auth('marketing'))
      .send({ student_id: 1, course_offering_id: 1 });
    expect(res.status).toBe(403);
  });
});

describe('Chatbot (/api/chatbot, /api/ai)', () => {
  const auth = (role) => `Bearer ${token(role)}`;

  it('refuse /api/chatbot/message sans token', async () => {
    const res = await request(app).post('/api/chatbot/message').send({ message: 'Bonjour' });
    expect(res.status).toBe(401);
  });

  it('proxifie /api/chatbot/message pour un utilisateur connecté (backend absent -> 503)', async () => {
    const res = await request(app)
      .post('/api/chatbot/message')
      .set('Authorization', auth('student'))
      .send({ message: 'Bonjour' });
    expect([503, 502]).toContain(res.status);
  });

  it('proxifie un POST /api/ai/chats avec un corps vide "{}" sans bloquer', async () => {
    const res = await request(app)
      .post('/api/ai/chats')
      .set('Authorization', auth('student'))
      .send({});
    expect([503, 502]).toContain(res.status);
  });
});

describe('Rate limiting global', () => {
  it("ne bloque pas une navigation normale (plusieurs dizaines d'appels API)", async () => {
    const statuses = [];
    for (let i = 0; i < 150; i += 1) {
      const res = await request(app).get('/api/route-inexistante');
      statuses.push(res.status);
    }
    expect(statuses).not.toContain(429);
  });
});

describe('Rate limiting (démo)', () => {
  it('bloque après 5 requêtes en 60s sur /api/demo/ratelimit', async () => {
    for (let i = 0; i < 5; i += 1) {
      const res = await request(app).get('/api/demo/ratelimit');
      expect(res.status).toBe(200);
    }
    const sixth = await request(app).get('/api/demo/ratelimit');
    expect(sixth.status).toBe(429);
  });
});

describe('Routes inconnues', () => {
  it('renvoie 404 sur une route qui ne correspond à rien', async () => {
    const res = await request(app).get('/api/route-qui-n-existe-pas');
    expect(res.status).toBe(404);
  });
});
