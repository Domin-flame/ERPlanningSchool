# Guide de Test Complet - CampusWorkflow
**Date:** 2 août 2026

---

## 🎯 Objectif

Valider que tous les services backend fonctionnent correctement et que le frontend est intégré complètement.

---

## ⚙️ PHASE 1: DÉMARRAGE DES SERVICES

### 1.1 Démarrer tous les services avec Docker

```bash
cd c:\Users\GSI\3D Objects\CampusWorkflow

# Build et démarrer
docker compose up --build

# Ou sans rebuild (si images existent)
docker compose up -d
```

**Vérifier que tous les services sont "healthy":**
```bash
docker compose ps

# Résultat attendu:
# Service          Status       Health
# identity-db      Up           healthy
# academic-db      Up           healthy
# finance-db       Up           healthy
# hr-db            Up           healthy
# auth-service     Up (healthy)
# academic-service Up (healthy)
# finance-service  Up (healthy)
# hr-service       Up (healthy)
# marketing-service Up (healthy)
# gateway          Up (healthy)
# frontend         Up (healthy)
```

### 1.2 Vérifier la connectivité basique

```bash
# Gateway health
curl http://localhost:3000/health

# Expected response:
{
  "status": "healthy",
  "service": "api-gateway",
  "timestamp": "2026-08-02T10:00:00Z",
  "services": {
    "auth": "http://auth-service:8001",
    "academic": "http://academic-service:8002",
    "finance": "http://finance-service:8003",
    "hr": "http://hr-service:8004"
  }
}
```

---

## 🔐 PHASE 2: TEST SERVICE AUTHENTIFICATION

### 2.1 Créer un nouvel utilisateur (Student)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student.test@campus.edu",
    "password": "TestPassword123",
    "name": "Test Student",
    "role": "Student"
  }'

# Expected response:
{
  "id": 5,
  "name": "Test Student",
  "email": "student.test@campus.edu",
  "role": "Student",
  "phone": "",
  "department": "",
  "created_at": "2026-08-02T10:00:00Z"
}
```

### 2.2 Login et obtenir tokens

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student.test@campus.edu",
    "password": "TestPassword123"
  }'

# Expected response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 5,
    "name": "Test Student",
    "email": "student.test@campus.edu",
    "role": "Student"
  }
}
```

**Sauvegarder le token pour les tests suivants:**
```bash
# Windows PowerShell
$TOKEN = "<copier le access_token>"

# Linux/Mac
export TOKEN="<copier le access_token>"
```

### 2.3 Récupérer infos utilisateur courant

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Expected: UserRead object avec les infos
```

### 2.4 Rafraîchir le token

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Authorization: Bearer <refresh_token>"

# Expected: nouveau access_token
```

### 2.5 Tester password change

```bash
curl -X POST http://localhost:3000/api/auth/password/change \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "TestPassword123",
    "new_password": "NewPassword456"
  }'

# Expected: {"message": "Password changed successfully"}

# Verify new password works
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student.test@campus.edu",
    "password": "NewPassword456"
  }'
```

---

## 💰 PHASE 3: TEST SERVICE FINANCE

### 3.1 Login comme Admin pour populating cache

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@campus.edu",
    "password": "password123"
  }'

# Save admin token
$ADMIN_TOKEN = "<copier access_token>"
```

### 3.2 Ajouter cache student

```bash
curl -X POST http://localhost:3000/api/finance/student-ref \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id_student": 5,
    "id_person": 5,
    "matricule": "STU2026-005",
    "nom_complet_cache": "Test Student"
  }'

# Expected: {"ok": true}
```

### 3.3 Créer facture

```bash
curl -X POST http://localhost:3000/api/finance/invoices \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id_student": 5,
    "date_echeance": "2026-09-15",
    "lignes": [
      {
        "description": "Frais de scolarité Semestre 1",
        "quantite": 1,
        "prix_unitaire": 250000
      },
      {
        "description": "Frais administratifs",
        "quantite": 1,
        "prix_unitaire": 25000
      }
    ]
  }'

# Expected response with invoice_id
# Save invoice_id for payment test
$INVOICE_ID = "1"
```

### 3.4 Récupérer facture

```bash
curl http://localhost:3000/api/finance/invoices/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: facture avec lignes
```

### 3.5 Lister factures étudiant

```bash
curl http://localhost:3000/api/finance/students/5/invoices \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: liste factures pour cet étudiant
```

### 3.6 Initier paiement MoMo

```bash
curl -X POST http://localhost:3000/api/finance/payments/momo/initiate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id_invoice": 1,
    "montant": 275000,
    "methode": "MTN_MOMO",
    "numero_telephone": "237677000000"
  }'

# Expected response:
{
  "payment": {
    "id": 1,
    "montant": 275000,
    "methode": "MTN_MOMO",
    "reference": "PAY-2026-08-02-XXXXX",
    "id_invoice": 1,
    "statut": "pending"
  },
  "message": "Paiement initié — en attente de confirmation MoMo"
}

# Save reference for confirmation
$REFERENCE = "<copier reference>"
```

### 3.7 Confirmer paiement (après 5 sec)

```bash
# Option 1: Automatique (le système auto-confirme après 5 sec)
# Attendre 5 secondes...

# Option 2: Manual trigger
curl -X POST "http://localhost:3000/api/finance/payments/momo/confirm/$REFERENCE" \
  -H "Authorization: Bearer $TOKEN"

# Expected: payment avec statut="confirmed"
```

### 3.8 Vérifier facture est payée

```bash
curl http://localhost:3000/api/finance/invoices/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: invoice.statut = "PAYEE"
```

### 3.9 Test Marketing (Campaigns & Leads)

```bash
# Créer campagne
curl -X POST http://localhost:3000/api/marketing/campaigns \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Recrutement Licence 2026",
    "channel": "Email",
    "start_date": "2026-08-01",
    "end_date": "2026-09-01",
    "budget": 500000
  }'

# Lister campagnes
curl http://localhost:3000/api/marketing/campaigns \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Créer lead
curl -X POST http://localhost:3000/api/marketing/leads \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Prospect Lead",
    "email": "prospect@example.com",
    "phone": "237677000000",
    "status": "New",
    "id_campaign": 1
  }'

# Lister leads par campagne
curl http://localhost:3000/api/marketing/campaigns/1/leads \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 📚 PHASE 4: TEST SERVICE ACADÉMIQUE

### 4.1 Récupérer programmes

```bash
curl http://localhost:3000/api/academic/programs \
  -H "Authorization: Bearer $TOKEN"

# Expected: liste des programmes
```

### 4.2 Récupérer cours

```bash
curl http://localhost:3000/api/academic/courses \
  -H "Authorization: Bearer $TOKEN"

# Expected: liste des cours disponibles
```

### 4.3 Récupérer calendrier

```bash
curl http://localhost:3000/api/academic/calendar/years \
  -H "Authorization: Bearer $TOKEN"

# Expected: années académiques
```

---

## 👥 PHASE 5: TEST SERVICE HR

### 5.1 Lister employés

```bash
curl http://localhost:3000/api/hr/employees \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: liste employés
```

### 5.2 Créer employé

```bash
curl -X POST http://localhost:3000/api/hr/employees \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_email": "newstaff@campus.edu",
    "employee_number": "EMP-2026-001",
    "department": "Académique",
    "hire_date": "2026-01-01"
  }'

# Expected: nouvel employé créé
```

### 5.3 Demande de congé

```bash
curl -X POST http://localhost:3000/api/hr/leaves \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 1,
    "leave_type": "Paid Leave",
    "start_date": "2026-08-10",
    "end_date": "2026-08-15"
  }'

# Expected: demande créée
```

---

## 🌐 PHASE 6: TEST FRONTEND

### 6.1 Accéder au frontend

```
http://localhost:5173
```

### 6.2 Test Onboarding

1. **Login:** admin@campus.edu / password123
2. **Vérifier:** Redirection vers /onboarding
3. **Écran 1:** Mascote waving + boutons Démarrer/Ignorer
4. **Écran 2:** 4 cartes portails (Academic, Finance, HR, Marketing)
5. **Écran 3:** 4 fonctionnalités avec emojis
6. **Écran 4:** Mascote celebrating + bouton dashboard
7. **Navigation:** Progress bar 4 étapes mise à jour
8. **Skip:** Bouton "Ignorer" → dashboard direct
9. **Fin:** Redirection vers dashboard après écran 4

**Vérifications:**
- [ ] Animations fluides
- [ ] Mascotes affichées
- [ ] Colors CampusWorkflow appliquées
- [ ] Responsive sur mobile/tablet

### 6.3 Test Chat

1. **URL:** http://localhost:5173/messaging
2. **Vérifier:** Liste conversations
3. **Click conversation:** Zone chat s'ouvre
4. **Envoyer message:** Texte s'affiche dans bubble orange
5. **Réception:** Réponse auto-générée après 500ms
6. **Recherche:** Filtre conversations par nom
7. **Actions:** Appel, Vidéo buttons
8. **Empty state:** Mascote "message" si pas de convos

**Vérifications:**
- [ ] Scroll vers dernier message auto
- [ ] Timestamps corrects
- [ ] Indicateurs en ligne/hors ligne
- [ ] Animations smooth

### 6.4 Test Calendar

1. **URL:** http://localhost:5173/calendar
2. **Vérifier:** Vue calendrier mois courant
3. **Navigation:** Buttons prev/next mois changent l'affichage
4. **Click jour:** Sidebar montre événements du jour
5. **Événements:** Codes couleur par type (blocs colorés)
6. **Modal événement:** Click sur événement → détails
7. **Créer événement:** Form avec tous les champs

**Vérifications:**
- [ ] Jours correctement positionnés
- [ ] Événements visibles sur jours
- [ ] Responsive (mobile: 1 col, desktop: 7 cols)
- [ ] Colors: Cours (marine), Examen (salmon), etc.

### 6.5 Test Notifications

1. **URL:** http://localhost:5173/notifications
2. **Vérifier:** Liste notifications
3. **Compteur non lus:** Badge rouge en haut
4. **Filtres:** Buttons Academic/Finance/HR/System
5. **Toggle "Non lues":** Affiche uniquement unread
6. **Actions:** Marquer comme lu, Supprimer
7. **Stats:** 4 blocs (Non lues, Success, Warnings, Errors)

**Vérifications:**
- [ ] Notifications affichées
- [ ] Filtrage fonctionne
- [ ] Actions supprimant/marquant lu
- [ ] Stats compteurs corrects

### 6.6 Test Dashboards

1. **StudentDashboard:** Cours, devoirs, emploi du temps, finances
2. **AdminDashboard:** Overview statistiques, gestion
3. **StaffDashboard:** Staff-specific content
4. **Pages métier:** Academic, Finance, HR, Marketing

**Vérifications:**
- [ ] Correct dashboard par rôle
- [ ] Données affichées
- [ ] Boutons actions visibles
- [ ] Empty states avec mascote

### 6.7 Test Profil & Sécurité

1. **URL:** http://localhost:5173/profile
2. **Vérifier:** Infos utilisateur
3. **Edit:** Modifier nom/téléphone/département
4. **Sécurité:** Onglet password + 2FA
5. **Change password:** Form fonctionne
6. **Settings:** http://localhost:5173/settings

---

## 🔐 PHASE 7: TEST RBAC/ABAC

### 7.1 Test RBAC (Role-Based Access Control)

```bash
# Login as Student
TOKEN_STUDENT = $(Login student@campus.edu / password123)

# Essayer d'accéder HR (forbidden)
curl http://localhost:3000/api/hr/employees \
  -H "Authorization: Bearer $TOKEN_STUDENT"
# Expected: 401 Unauthorized ou forbidden

# Essayer d'accéder Academic (allowed)
curl http://localhost:3000/api/academic/courses \
  -H "Authorization: Bearer $TOKEN_STUDENT"
# Expected: 200 OK
```

### 7.2 Test Frontend RBAC

1. **Login as Student:** /dashboard → StudentDashboard
2. **Login as Admin:** /dashboard → AdminDashboard
3. **Try /hr as Student:** "Accès refusé" message
4. **Try /marketing as Student:** "Accès refusé" message
5. **Try /academic as Student:** OK ✅

### 7.3 Test ABAC (Attribute-Based Access Control)

**Code test (via DevTools console):**

```javascript
import { abacEngine, UserAttributes, ResourceAttributes } from '@/services/abac.service'

// Test 1: Super Admin can do anything
const admin = { id: 1, email: 'admin@test.com', role: 'Super Admin', status: 'active' }
const resource = { id: '1', owner: 2, type: 'course', visibility: 'private', status: 'active' }
console.log(abacEngine.evaluate('delete', admin, resource)) // true

// Test 2: Student can only view own resource
const student = { id: 2, email: 'student@test.com', role: 'Student', status: 'active' }
const studentResource = { id: '1', owner: 2, type: 'grade', visibility: 'private', status: 'active' }
console.log(abacEngine.evaluate('view', student, studentResource)) // true
console.log(abacEngine.evaluate('edit', student, studentResource)) // true
console.log(abacEngine.evaluate('delete', student, studentResource)) // false

// Test 3: Suspended user blocked
const suspended = { id: 3, email: 'suspended@test.com', role: 'Student', status: 'suspended' }
console.log(abacEngine.evaluate('view', suspended, resource)) // false

// Test 4: Student cannot view private resource of another
const otherResource = { id: '2', owner: 1, type: 'grade', visibility: 'private', status: 'active' }
console.log(abacEngine.evaluate('view', student, otherResource)) // false

// Test 5: Student can view public resource
const publicResource = { id: '3', owner: 1, type: 'course', visibility: 'public', status: 'active' }
console.log(abacEngine.evaluate('view', student, publicResource)) // true
```

**Expected console output:**
```
true   (admin delete)
true   (student view own)
true   (student edit own)
false  (student cannot delete)
false  (suspended blocked)
false  (student cannot view other private)
true   (student can view public)
```

---

## 🚨 PHASE 8: TEST ERREURS & EDGE CASES

### 8.1 Token Expiration

```bash
# Créer token et attendre 24h+ (ou changer expiration en code)
# Expected: 401 Unauthorized
```

### 8.2 Invalid Token

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer invalid.token.here"
# Expected: 401 Unauthorized
```

### 8.3 Missing Authorization

```bash
curl http://localhost:3000/api/academic/courses
# Expected: 401 Unauthorized
```

### 8.4 Rate Limiting

```bash
# Envoyer 100+ requests en 15 min
for i in {1..150}; do
  curl http://localhost:3000/health
done
# Expected: 429 Too Many Requests après 100
```

### 8.5 Non-existent Resources

```bash
curl http://localhost:3000/api/finance/invoices/99999 \
  -H "Authorization: Bearer $TOKEN"
# Expected: 404 Not Found
```

### 8.6 Invalid Data

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "weak",
    "name": ""
  }'
# Expected: 422 Unprocessable Entity with validation errors
```

---

## 📊 PHASE 9: PERFORMANCE & MONITORING

### 9.1 Check Gateway Logs

```bash
docker compose logs -f gateway
```

### 9.2 Check Service Logs

```bash
docker compose logs -f auth-service
docker compose logs -f finance-service
docker compose logs -f academic-service
```

### 9.3 Database Queries

```bash
# Connect to finance-db
docker compose exec finance-db psql -U app_finance_service -d finance_db

# Example queries
SELECT * FROM finance.invoice;
SELECT * FROM finance.payment;
SELECT * FROM finance.campaign;
SELECT * FROM finance."Lead_";
```

### 9.4 Response Times

**Vérifier les temps de réponse en DevTools:**
- Auth endpoints: < 200ms
- Finance endpoints: < 300ms
- Academic endpoints: < 500ms
- Chat/Calendar: < 100ms (frontend)

---

## ✅ SIGN-OFF CHECKLIST

- [ ] Phase 1: Services démarrent sans erreur
- [ ] Phase 2: Auth endpoints fonctionnent
- [ ] Phase 3: Finance complète (invoices + payments)
- [ ] Phase 4: Academic récupère données
- [ ] Phase 5: HR endpoints fonctionnent
- [ ] Phase 6: Frontend pages chargent
- [ ] Phase 6: Onboarding 4 écrans OK
- [ ] Phase 6: Chat, Calendar, Notifications OK
- [ ] Phase 7: RBAC bloque accès non autorisé
- [ ] Phase 7: ABAC politiques s'appliquent
- [ ] Phase 8: Erreurs gérées correctement
- [ ] Phase 9: Performance acceptable

---

## 🎉 RÉSULTAT FINAL

Si tous les tests passent: ✅ **PRÊT POUR PRODUCTION**

**Fichiers de référence:**
- `IMPLEMENTATION_REPORT.md` - Résumé complet
- `VERIFICATION_CHECKLIST.md` - Checklist détaillée
- `QUICK_START.md` - Démarrage rapide

---

**Date:** 2 août 2026  
**Version:** 1.0  
**Statut:** ✅ TEST GUIDE COMPLET
