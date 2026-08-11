# Globetrotter - Architecture Complète

## 📐 Vue d'ensemble

Application de découverte de destinations de voyage avec :
- **Backend**: Flask (Python) - API REST
- **Frontend Mobile**: React Native
- **Design**: Premium Luxury Minimalism

## 🏗️ Structure du Projet

```
globetrotter-capstone/
├── app/                    # Backend Flask
│   ├── main.py            # Point d'entrée
│   ├── auth.py            # Authentification JWT
│   ├── destinations.py    # Gestion des destinations
│   ├── recommendations.py # Système de recommandations
│   ├── itineraries.py     # Gestion des itinéraires
│   ├── models.py          # Modèles de données
│   ├── static/            # Assets statiques
│   └── templates/         # Templates HTML (legacy)
├── mobile/                # Application React Native
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   ├── screens/       # Écrans de l'application
│   │   ├── navigation/    # Configuration navigation
│   │   ├── services/      # API client
│   │   ├── config/        # Theme et configuration
│   │   └── assets/        # Images et ressources
│   ├── App.js
│   └── package.json
├── data/                  # Données JSON
│   └── destinations.json
└── requirements.txt       # Dépendances Python
```

## 🔄 Flux de Données

### 1. Authentification

```
Mobile App → POST /login
           ← JWT Token

Token stocké dans AsyncStorage
↓
Toutes les requêtes incluent: Authorization: Bearer <token>
```

### 2. Destinations

```
Mobile App → GET /destinations?q=bali&tag=nature&max_cost=150
           ← Liste filtrée de destinations

Clic sur destination
↓
Navigation vers DestinationDetailScreen
↓
Affichage des détails complets
```

### 3. Favoris

```
Clic sur ❤️
↓
favoritesAPI.add(destinationId)
↓
Stockage local (AsyncStorage)
↓
Mise à jour UI immédiate
```

### 4. Recommandations

```
Mobile App → GET /recommendations (avec token JWT)
           ← Destinations personnalisées basées sur préférences

Backend analyse:
- Préférences utilisateur (tags)
- Historique des favoris
- Score de correspondance
```

## 🎨 Design System

### Palette de Couleurs

```javascript
Rose poudré: #F7CBCA  // Accents, badges
Beige: #DDD5D5         // Surfaces secondaires
Blanc cassé: #F1F7F7   // Background principal
Bleu clair: #D5E5E5    // Surfaces interactives
Bleu glacier: #C6D7D8  // Borders
Vert sauge: #5D6B6B    // Primary, textes importants
```

### Typography

- **Display (Georgia)**: Titres hero, H1, H2
- **Body (Inter)**: Textes courants, labels

### Spacing

```
xs: 8px   sm: 12px  md: 16px
lg: 24px  xl: 32px  xxl: 48px  xxxl: 64px
```

### Border Radius

```
sm: 12px  md: 18px  lg: 24px  xl: 32px  full: 999px
```

## 📱 Écrans React Native

### 1. LoginScreen
- **Route**: `/login`
- **Fonctionnalités**:
  - Formulaire connexion/inscription
  - Validation des champs
  - Gestion des erreurs
  - Stockage du token
- **API**: `POST /login`, `POST /register`

### 2. HomeScreen
- **Route**: `/main/home`
- **Fonctionnalités**:
  - Hero banner avec recherche
  - Catégories de navigation
  - Destinations populaires
  - Pull-to-refresh
- **API**: `GET /destinations`

### 3. ExplorerScreen
- **Route**: `/main/explorer`
- **Fonctionnalités**:
  - Barre de recherche
  - Filtres (catégorie, budget)
  - Liste paginée
  - Compteur de résultats
- **API**: `GET /destinations?q=&tag=&max_cost=`

### 4. FavoritesScreen
- **Route**: `/main/favorites`
- **Fonctionnalités**:
  - Liste des favoris
  - Retrait des favoris
  - État vide élégant
- **Storage**: AsyncStorage local

### 5. ProfileScreen
- **Route**: `/main/profile`
- **Fonctionnalités**:
  - Statistiques utilisateur
  - Préférences
  - Menu paramètres
  - Déconnexion
- **API**: None (local)

### 6. DestinationDetailScreen
- **Route**: `/destination-detail` (modal)
- **Fonctionnalités**:
  - Image hero
  - Informations complètes
  - Galerie
  - Lieux associés
  - Toggle favori
- **API**: None (données passées en params)

## 🔌 API Endpoints

### Authentification

```
POST /register
Body: { username, password, preferences[] }
Response: { message: "User created" }

POST /login
Body: { username, password }
Response: { token: "JWT_TOKEN" }
```

### Destinations

```
GET /destinations
Query: q, tag, max_cost, continent
Response: [{ name, country, continent, description, tags, avg_cost_per_day, image }]
```

### Recommandations

```
GET /recommendations
Headers: Authorization: Bearer <token>
Query: limit
Response: [{ name, country, description, match_score, ... }]
```

### Itinéraires

```
GET /itineraries
Headers: Authorization: Bearer <token>
Response: [{ id, title, destinations[], start_date, end_date, notes }]

POST /itineraries
Headers: Authorization: Bearer <token>
Body: { title, destinations[], start_date, end_date, notes }
Response: { id, ... }
```

## 🛠️ Services

### API Client (`src/services/api.js`)

```javascript
// Configuration
const API_URL = 'http://10.0.2.2:5000'; // Android Emulator

// Intercepteurs automatiques
- Ajout du token JWT
- Gestion des erreurs 401
- Refresh token si expiré

// Modules
authAPI          // Connexion, inscription, déconnexion
destinationsAPI  // Liste, recherche, filtres
favoritesAPI     // CRUD favoris (local)
recommendationsAPI // Suggestions personnalisées
itinerariesAPI   // CRUD itinéraires
```

## 🔒 Sécurité

### Token JWT
- Stocké dans AsyncStorage
- Envoyé dans header `Authorization`
- Expiré après 24h
- Nettoyé automatiquement si invalide

### Validation Backend
- Tous les endpoints protégés vérifient le token
- Validation des données d'entrée
- Sanitization des queries SQL

## 🚀 Installation & Lancement

### Backend Flask

```bash
cd app
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Backend accessible sur `http://localhost:5000`

### Mobile React Native

```bash
cd mobile
npm install

# Android
npm run android

# iOS
npm run ios
```

## 📊 Flux Complets

### Scénario 1: Premier lancement

```
1. User ouvre l'app
2. Pas de token → LoginScreen
3. User s'inscrit (POST /register)
4. User se connecte (POST /login)
5. Token stocké
6. Navigation vers MainTabs
7. HomeScreen charge destinations (GET /destinations)
8. Affichage du hero + destinations populaires
```

### Scénario 2: Recherche et favori

```
1. User tape "Bali" dans la recherche
2. Navigation vers ExplorerScreen
3. API: GET /destinations?q=bali
4. Affichage résultats
5. User clique sur destination
6. Modal DestinationDetailScreen
7. User clique sur ❤️
8. favoritesAPI.add("Bali")
9. AsyncStorage.setItem('favorites', [...])
10. UI mise à jour (cœur rempli)
```

### Scénario 3: Recommandations

```
1. User connecté avec préférences = ["nature", "food"]
2. Backend analyse:
   - Destinations avec tag "nature" → score +3
   - Destinations avec tag "food" → score +3
   - Destinations favorites → score +2
3. Tri par score décroissant
4. Retour top 10
5. Affichage dans ProfileScreen ou HomeScreen
```

## 🎯 Améliorations Futures

### Backend
- [ ] Base de données PostgreSQL (remplacer JSON)
- [ ] Upload d'images S3
- [ ] Système de reviews/notes
- [ ] Filtres avancés (météo, langue, visa)
- [ ] Notifications push
- [ ] Analytics

### Mobile
- [ ] Mode offline
- [ ] Cache d'images
- [ ] Partage sur réseaux sociaux
- [ ] Deep linking
- [ ] Animations avancées
- [ ] Mode sombre
- [ ] Multi-langue
- [ ] Geolocation
- [ ] Carte interactive (MapBox)

## 📄 Licence

MIT - Globetrotter © 2024
