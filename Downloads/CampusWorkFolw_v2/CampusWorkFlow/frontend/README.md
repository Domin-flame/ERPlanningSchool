# CampusWorkflow ERP — Frontend React

Frontend React pour **CampusWorkflow**, un ERP scolaire unifié

## 🚀 Démarrage rapide (dev)

```bash
# Se placer dans le bon dossier 
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement (Vite)
npm run dev
```

Ouvrez http://localhost:5173.

L'application ouvre le tableau de bord après connexion. `/splash` redirige vers
l'onboarding lors de la première visite, puis vers la connexion. Vous pouvez aussi
accéder directement à :
- `/login` — écran de connexion asymétrique
- `/onboarding` — séquence d'onboarding
- `/` — Academic Dashboard (une fois connecté)

> En développement, Vite proxy `/api` vers `http://localhost:3000`
> (modifiable avec `BACKEND_URL`).

## 🐳 Build & Docker

Le frontend est **dockerisé** 

```bash
# Construire et lancer (frontend sur :5174)
docker compose up --build
```

- Frontend : http://localhost:5174


## 🔌 Structure du code

```
src/
  main.jsx            # Point d'entrée React
  App.jsx             # Routage
  app/access.js       # Destinations, accès par rôle et navigation
  api/client.js       # Client HTTP Axios et gestion des erreurs d'auth
  components/         # Composants UI réutilisables
    Layout.jsx        # Shell : topbar, sidebar (desktop), bottom tabs (mobile)
    FoxMascot.jsx     # Mascotte renard (SVG)
    Badge, Breadcrumbs, StatCard, Skeleton, EmptyState,
    Modal, Toast, Accordion, Tooltip
  pages/              # Pages
    Splash, Login, Onboarding,
    Dashboard, Students, Courses, Calendar,
    Finance, HR, Messages, Analytics, Settings
  styles/index.css    # Thème (orange renard) + styles
```

## 🔑 Connexion au backend

Le client API centralisé est dans `src/api/client.js`. Pour brancher le backend :

```javascript
// Exemple dans un composant
import { api } from "../api/client";

const students = await api.get("/students");
await api.post("/courses", { title: "CS101" });
```

- Le token JWT est stocké dans `localStorage` (`cw_token`) et injecté
  automatiquement dans les en-têtes `Authorization`.
- Une réponse `401` renouvelle le jeton via le client API ; si le renouvellement
  échoue, l'événement `cw:unauthorized` ferme la session.

## 🧪 Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de dev Vite |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Prévisualiser le build |
| `docker compose up --build` | Lancer via Docker |
