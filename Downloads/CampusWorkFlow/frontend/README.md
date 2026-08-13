# CampusWorkflow ERP — Frontend React

Frontend React pour **CampusWorkflow**, un ERP scolaire unifié, inspiré des wireframes
(mascotte renard orange vif + blanc, navigation en bas d'écran, écran de connexion
asymétrique, splash screen, onboarding, dashboards, etc.).

## 🚀 Démarrage rapide (dev)

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement (Vite)
npm run dev
```

Ouvrez http://localhost:5173.

Le route par défaut est `/splash`. Vous pouvez accéder directement à :
- `/login` — écran de connexion asymétrique
- `/onboarding` — séquence d'onboarding
- `/` — Academic Dashboard (une fois connecté)

> En dev, Vite proxy `/api` vers `http://localhost:8000` (modifiable via `BACKEND_URL`).

## 🐳 Build & Docker

Le frontend est **dockerisé** et prêt à être lié au backend plus tard.

```bash
# Construire et lancer (frontend sur :8080, backend placeholder sur :8000)
docker compose up --build
```

- Frontend : http://localhost:8080
- Backend (placeholder) : http://localhost:8000/api/api.json

### Comment brancher le vrai backend

1. **Option A — backend dans le même docker-compose** : remplacez le service
   `backend` par votre image réelle (voir `docker-compose.yml`).
2. **Option B — backend externe** : changez l'argument de build
   `BACKEND_UPSTREAM` dans `docker-compose.yml` (ex. `http://mon-backend:8000`).

Le reverse-proxy nginx (dans le conteneur) route `/api/*` vers le backend.
Le client API (`src/api/client.js`) utilise `/api` par défaut, ou `VITE_API_URL`.

## 🔌 Structure du code

```
src/
  main.jsx            # Point d'entrée React
  App.jsx             # Routage
  api/client.js       # Client API (axios) — à connecter au backend
  data/mock.js        # Données mockées (fallback)
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

Le client API centralisé est dans `src/api/client.js`. Les données sont
actuellement mockées (`src/data/mock.js`). Pour brancher le backend :

```javascript
// Exemple dans un composant
import { api } from "../api/client";

const students = await api.get("/students");
await api.post("/courses", { title: "CS101" });
```

- Le token JWT est stocké dans `localStorage` (`cw_token`) et injecté
  automatiquement dans les en-têtes `Authorization`.
- Une réponse `401` déclenche un événement `cw:unauthorized` (déconnexion).

## 🧪 Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de dev Vite |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Prévisualiser le build |
| `docker compose up --build` | Lancer via Docker |

## 📁 Backend placeholder

Le dossier `backend-stub/` contient une réponse JSON factice servie par le
service `backend` du docker-compose, pour valider la liaison frontend↔backend.
Supprimez-le quand le vrai backend est en place.
