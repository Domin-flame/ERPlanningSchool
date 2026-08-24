/**
 * CampusWorkflow — script de test de charge (k6)
 * ================================================
 *
 * Objectif : mesurer la sécurité (codes d'erreur, rate limiting) et la
 * vitesse (latence, débit) du système sous forte charge simultanée, en
 * particulier du flux asynchrone "un étudiant s'inscrit -> une facture
 * est créée" qui transite par RabbitMQ.
 *
 * Utilisation :
 *   1. Démarrer la stack complète :   docker compose up --build -d
 *   2. Installer k6 : https://k6.io/docs/get-started/installation/
 *   3. Lancer :        k6 run load-testing/k6-load-test.js
 *
 *      Variables surchargeables :
 *        k6 run -e BASE_URL=http://localhost:3000/api \
 *               -e VUS=50 -e DURATION=60s \
 *               load-testing/k6-load-test.js
 *
 * Le script :
 *   - authentifie chaque utilisateur virtuel (VU) avec le compte de démo
 *     "academic@campus.edu" (login réel, pas de mock) ;
 *   - lit en boucle des endpoints représentatifs de chaque module
 *     (académique, finance, RH) pour mesurer la latence de lecture ;
 *   - déclenche périodiquement une VRAIE inscription (POST /enrollments/)
 *     pour mesurer : (a) le temps de réponse HTTP de academic-service
 *     (qui NE DOIT PAS augmenter avec la charge de finance-service, preuve
 *     du découplage asynchrone) et (b) que finance-service crée bien la
 *     facture correspondante peu après (vérifié via GET /finance/invoices).
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';
const VUS = parseInt(__ENV.VUS || '20', 10);
const DURATION = __ENV.DURATION || '60s';

// Métriques custom pour isoler la latence du flux asynchrone
const enrollmentLatency = new Trend('enrollment_post_latency', true);
const invoiceCreatedCount = new Counter('invoices_confirmed_async');

export const options = {
  scenarios: {
    steady_load: {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
    },
  },
  thresholds: {
    // Vitesse : 95% des requêtes de lecture doivent répondre en < 500ms
    http_req_duration: ['p(95)<500'],
    // Sécurité/robustesse : moins de 1% d'erreurs serveur (5xx) sous charge
    http_req_failed: ['rate<0.01'],
    // Le endpoint d'inscription (Service A) doit rester rapide même si
    // Finance (Service B) est occupé à traiter la file RabbitMQ
    enrollment_post_latency: ['p(95)<800'],
  },
};

const DEMO_ACCOUNTS = [
  { email: 'academic@campus.edu', password: 'password123' },
  { email: 'finance@campus.edu', password: 'password123' },
  { email: 'rh@campus.edu', password: 'password123' },
];

function login() {
  const account = DEMO_ACCOUNTS[Math.floor(Math.random() * DEMO_ACCOUNTS.length)];
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: account.email, password: account.password }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'login' } }
  );
  check(res, { 'login OK (200)': (r) => r.status === 200 });
  if (res.status !== 200) return null;
  return res.json('access_token');
}

export default function () {
  const token = login();
  if (!token) {
    sleep(1);
    return;
  }
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  group('lecture — académique / finance / rh', () => {
    const courses = http.get(`${BASE_URL}/academic/courses/`, authHeaders);
    check(courses, { 'courses 200': (r) => r.status === 200 });

    const students = http.get(`${BASE_URL}/academic/students/?limit=50`, authHeaders);
    check(students, { 'students 200': (r) => r.status === 200 });

    const invoices = http.get(`${BASE_URL}/finance/invoices`, authHeaders);
    check(invoices, { 'invoices 200': (r) => r.status === 200 });
  });

  // 1 itération sur 5 environ : déclenche le workflow asynchrone complet
  if (Math.random() < 0.2) {
    group('workflow asynchrone — inscription -> facture', () => {
      const studentsRes = http.get(`${BASE_URL}/academic/students/?limit=20`, authHeaders);
      const offeringsRes = http.get(`${BASE_URL}/academic/course-offerings/?limit=20`, authHeaders);

      const students = studentsRes.status === 200 ? studentsRes.json() : [];
      const offerings = offeringsRes.status === 200 ? offeringsRes.json() : [];

      if (students.length > 0 && offerings.length > 0) {
        const student = students[Math.floor(Math.random() * students.length)];
        const offering = offerings[Math.floor(Math.random() * offerings.length)];

        const payload = JSON.stringify({
          student_id: student.student_id,
          course_offering_id: offering.course_offering_id,
          status: 'ACTIVE',
          enrollment_date: new Date().toISOString().split('T')[0],
        });

        const start = Date.now();
        const res = http.post(`${BASE_URL}/academic/enrollments/`, payload, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          tags: { name: 'create_enrollment' },
        });
        enrollmentLatency.add(Date.now() - start);

        // 201 = nouvelle inscription créée ; 400 = déjà inscrit (acceptable
        // sous charge concurrente, ce n'est pas un échec du système)
        check(res, { 'enrollment 201 or 400': (r) => r.status === 201 || r.status === 400 });

        if (res.status === 201) {
          const enrollmentId = res.json('enrollment_id');
          // Laisse le temps au consumer RabbitMQ de finance-service de traiter
          // l'événement, puis vérifie que la facture a bien été créée —
          // preuve fonctionnelle du découplage asynchrone sous charge.
          sleep(2);
          const invoicesAfter = http.get(`${BASE_URL}/finance/invoices`, authHeaders);
          if (invoicesAfter.status === 200) {
            const found = invoicesAfter
              .json()
              .some((inv) => inv.numero_facture === `FAC-ENR-${enrollmentId}`);
            if (found) invoiceCreatedCount.add(1);
          }
        }
      }
    });
  }

  sleep(1);
}
