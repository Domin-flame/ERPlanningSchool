# CampusWorkflow — Frontend

Interface web de **CampusWorkflow**, l'ERP universitaire unifié. Construite avec React 18, Vite et React Router 7.
Elle passe par la **gateway** (`/api`) pour parler aux microservices existants, sans aucune modification du backend.

## Démarrage

```bash
cd CampusWorkFlow/frontend
npm install
npm run dev        # http://localhost:5173 ; /api est proxifié vers BACKEND_URL (défaut http://localhost:3000)
npm run build      # build de production dans dist/
npm run lint       # ESLint (flat config : eslint.config.js)
```

Avec Docker Compose, rien ne change : `docker compose up --build frontend`.
- L'image est construite avec `VITE_API_URL` (défaut `/api`).
- nginx relaie `/api` vers `BACKEND_UPSTREAM` (la gateway).

| Variable | Rôle | Défaut |
| --- | --- | --- |
| `VITE_API_URL` | URL de base de l'API (gateway), intégrée au build | `/api` |
| `VITE_BACKEND_URL` | Alternative à `VITE_API_URL` (compatibilité) | — |
| `BACKEND_URL` | Cible du proxy Vite en développement | `http://localhost:3000` |
| `BACKEND_UPSTREAM` | Cible du proxy nginx dans le conteneur | `http://gateway:3000` |

## Architecture

```
src/
├── api/          Client HTTP (axios) + un module par service
│                 (auth, academic, finance/marketing, hr, messages, notifications, system)
├── app/          App.jsx (providers + routes) et roles.js (rôles, droits d'accès, navigation)
├── components/
│   ├── ui/       Kit d'interface réutilisable : Button, Card, StatCard, DataTable, Modal,
│   │             Form, Badge, Tabs, States (loader / vide / erreur)…
│   ├── brand/    Logo CampusWorkflow
│   └── routing/  Gardes de routes : RequireAuth, RequireRole, PublicOnly
├── context/      AuthProvider (session JWT), ToastProvider, NotificationsProvider
├── hooks/        useAuth, useToast, useNotifications, useApi / useApiAll / useMutation
├── layouts/      AppLayout (sidebar + topbar), AuthLayout
├── features/     Un dossier par domaine métier : auth, dashboard, academic, student,
│                 teacher, hr, finance, marketing, messages, notifications, calendar,
│                 assistant, settings, errors
├── styles/       theme.css (tokens), base, layout, components, features
└── utils/        Formatage (dates, FCFA…) et libellés des statuts métier
```

### Principes
- **Client API unique** (`api/http.js`) :
  - ajoute l'en-tête `Authorization` (jeton JWT) à chaque requête ;
  - sur une réponse 401, rafraîchit le jeton une seule fois, même si plusieurs requêtes échouent en même temps ;
  - si le rafraîchissement échoue, émet l'événement `cw:unauthorized`, qui déconnecte l'utilisateur ;
  - convertit les erreurs en `ApiError`, avec des messages en français et les erreurs 422 de FastAPI mises à plat.
- **Droits d'accès centralisés** (`app/roles.js`) :
  - `ROUTE_ACCESS` liste les rôles autorisés pour chaque route ;
  - la même table sert au routeur (`RequireRole`) et à la navigation latérale.
- **Dégradation propre** :
  - `useApiAll` charge plusieurs sources en parallèle ; si un service tombe, seul le bloc concerné affiche une erreur avec un bouton « Réessayer » ;
  - une donnée absente (par exemple un profil étudiant ou enseignant non rattaché) affiche un message explicite, pas un écran vide.
- **Chargement à la demande** : les pages métier sont chargées en lazy loading.
- **Anciennes URL** : elles sont redirigées vers les nouvelles routes (`LEGACY_REDIRECTS`).

## Espaces par rôle

| Rôle | Écrans |
| --- | --- |
| `student` | Tableau de bord, inscriptions aux cours, relevé de notes, factures |
| `professeur` | Tableau de bord, appel & saisie des notes, catalogue des cours, étudiants |
| `academic` | Vue d'ensemble (KPI + santé des services), étudiants, cours & modules, personnel, congés, comptes, facturation, prospects, campagnes |
| `rh` | Tableau de bord RH, personnel & paie, congés, comptes utilisateurs |
| `finance` | Tableau de bord financier, factures & paiements Mobile Money |
| `marketing` | Tableau de bord marketing, prospects (CRM), campagnes |
| Tous | Calendrier, messagerie, notifications, assistant, paramètres (mot de passe) |

## Correspondance avec la gateway

| Préfixe frontend | Service |
| --- | --- |
| `/api/auth/*` | auth-service (login, register, refresh, me, directory, users, password) |
| `/api/academic/*` | academic-service (catalogue, étudiants, enseignants, notes, présences, analytics, events) |
| `/api/finance/*`, `/api/marketing/*` | finance-service (factures, paiements MoMo, leads, campagnes) |
| `/api/hr/*` | hr-service (employés, congés, paie) |
| `/api/messages/*` | message-service (conversations, messages) |
| `/api/notifications/*` | notification-service (lecture, archivage, compteur non lus : interrogé toutes les 60 s) |
| `/api/services/health`, `/api/chatbot/message` | gateway |

> **Astuce données vides :** si les écrans affichent « Aucune donnée », vérifiez d'abord que les bases ont été initialisées (définissez `DB_AUTO_SEED=true` dans `.env` avant `docker compose up` ; la valeur par défaut est `false`). Vérifiez aussi que le compte connecté est bien rattaché à un dossier académique (étudiant ou enseignant) portant le même email.
