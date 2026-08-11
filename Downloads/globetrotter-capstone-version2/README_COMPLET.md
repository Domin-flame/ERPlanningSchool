# 🌍 Globetrotter - Assistant de Voyage Premium

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.14-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-18-blue.svg)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/flask-3.0-green.svg)](https://flask.palletsprojects.com/)
[![React Native](https://img.shields.io/badge/react_native-latest-blue.svg)](https://reactnative.dev/)

Application premium de découverte, planification et partage de voyages avec interface web responsive et application mobile native.

---

## ✨ Fonctionnalités Principales

### 🔐 Authentification & Sécurité
- **Visualisation libre** : Consultation des destinations sans compte
- **Authentification obligatoire** pour toutes les actions (favoris, notes, propositions)
- **Compte admin** : `admin` / `admin123`
- **JWT tokens** : Sécurisation des endpoints API
- **Hash de mots de passe** : werkzeug.security

### 🗺️ Découverte de Destinations
- **Catalogue complet** : 9+ destinations avec photos, descriptions, coûts
- **Recherche avancée** : Par nom, pays, continent, tags
- **Filtres intelligents** : Budget, style (nature, culture, food, adventure, wellness)
- **Cartes visuelles** : Map panel avec pins interactifs
- **Galerie d'images** : Aperçus et détails immersifs

### ❤️ Favoris & Notes Personnelles
- **Ajout/retrait de favoris** : Un clic pour sauvegarder
- **Notes privées complètes** :
  - Texte libre pour impressions
  - Date de visite souhaitée
  - Compagnons de voyage
  - Budget prévu
- **Badge visuel** : Indicateur de présence de note sur les cartes
- **Aperçu de note** : Preview dans la liste des favoris
- **Édition facile** : Modal dédié avec formulaire complet

### 💬 Avis & Communauté
- **Avis publics** : Système de reviews visibles par tous
- **Notation 1-5 étoiles** : Évaluation des destinations
- **Commentaires** : Partage d'expériences
- **Gestion** : Les utilisateurs peuvent supprimer leurs propres avis

### 📍 Journal de Voyage
- **Destinations visitées** : Liste personnelle
- **Toggle visuel** : Bouton vert sur les cartes de destinations
- **Page dédiée** : Vue d'ensemble de tous les lieux visités
- **Intégration favoris** : Onglets "Favoris" / "Visités"

### ➕ Propositions de Destinations
- **Formulaire complet** :
  - Nom, pays, continent
  - Description détaillée
  - Tags personnalisés
  - Coût moyen par jour
- **Workflow de validation** : Admin approuve ou rejette
- **Statuts** : pending → approved/rejected
- **Feedback** : Commentaire de l'admin lors du rejet

### 🗓️ Planification d'Itinéraires
- **Créateur d'itinéraires** :
  - Titre du voyage
  - Liste de destinations
  - Dates de début et fin
  - Notes personnelles
- **Vue d'ensemble** : Tous les itinéraires sur une page
- **Persistance** : Sauvegardé dans `itineraries.json`

### 🎯 Recommandations Personnalisées
- **IA de matching** : Basé sur vos préférences
- **Score de correspondance** : Algorithme de recommandation
- **Limite configurable** : Top N destinations
- **Mise à jour dynamique** : Actualisation à la demande

---

## 🎨 Design System Premium

### Palette de Couleurs
```css
Rose poudré : #F7CBCA  /* Accents, badges, états actifs */
Beige       : #DDD5D5  /* Surfaces secondaires */
Blanc cassé : #F1F7F7  /* Background principal */
Bleu glacier: #C6D7D8  /* Bordures, hover states */
Vert sauge  : #5D6B6B  /* Boutons primaires, textes */
```

### Typographie
- **Display** : Bell MT (titres, hero)
- **Body** : Inter (texte, UI)
- **Hiérarchie** : 6 niveaux de titres
- **Line height** : 1.7 pour lisibilité optimale

### UI/UX Principles
- **Soft UI** : Ombres douces, bordures arrondies (18-24px)
- **Luxury Minimalism** : Espaces généreux, contenu aéré
- **Editorial Layout** : Inspiration magazines de voyage
- **Micro-interactions** : Animations subtiles au hover/focus

---

## 📱 Design Responsive Mobile-First

### Breakpoints
| Device | Width | Layout |
|--------|-------|--------|
| Desktop | >1024px | Sidebar gauche + contenu centré |
| Tablet | 768-1024px | Top bar + navigation horizontale |
| Mobile | <768px | Bottom nav flottante + 1 colonne |
| Small Mobile | <480px | Optimisations supplémentaires |

### Navigation Adaptative
- **Desktop** : Sidebar fixe à gauche (280px)
- **Tablet** : Top bar sticky avec navigation horizontale
- **Mobile** : Bottom nav flottante accessible au pouce

### Grilles Fluides
- **Desktop** : 2-4 colonnes selon le contenu
- **Tablet** : 2-3 colonnes
- **Mobile** : 1 colonne empilée

### Images Responsives
- `<picture>` avec sources multiples
- Aspect ratios adaptés par device
- Lazy loading pour performance

---

## ⏳ Skeleton Loading Pattern

### Composants de Chargement
- **SkeletonCard** : Placeholder de carte de destination
- **SkeletonGrid** : Grille de placeholders
- **Animation fluide** : Gradient animé (shimmer effect)

### États de Chargement
- Destinations (home, explorer)
- Favoris avec notes
- Recommandations personnalisées
- Itinéraires

### Avantages
- ✅ Pas de flash de contenu vide
- ✅ Perception de vitesse améliorée
- ✅ UX professionnelle et moderne
- ✅ Feedback visuel continu

---

## 🏗️ Architecture Technique

### Backend (Flask)
```
app/
├── __init__.py           # Factory + routes principales
├── main.py               # Entry point
├── models.py             # Helpers data + utilisateurs
├── auth.py               # JWT + login/register
├── destinations.py       # CRUD destinations
├── reviews.py            # Avis + visited + favorite notes
├── recommendations.py    # Algorithme de matching
├── itineraries.py        # Planification voyages
└── proposals.py          # Propositions + validation admin
```

### Frontend Web (React)
```
app/Frontend/
├── react/
│   ├── index.html        # Template principal
│   └── app.js            # Application React complète (~1200 lignes)
└── css/
    └── styles.css        # Design system (~1100 lignes)
```

### Mobile (React Native)
```
mobile/src/
├── screens/              # 7 écrans modulaires
│   ├── LoginScreen.js
│   ├── HomeScreen.js
│   ├── ExplorerScreen.js
│   ├── FavoritesVisitedScreen.js
│   ├── DestinationDetailScreen.js
│   └── ProfileScreen.js
├── components/           # Composants réutilisables
│   ├── Button.js
│   ├── DestinationCard.js
│   └── ReviewCard.js
├── navigation/           # Bottom tabs + Stack
│   └── AppNavigator.js
├── services/
│   └── api.js            # Client API centralisé
└── config/
    └── theme.js          # Couleurs et styles
```

### Data (JSON Storage)
```
data/
├── users.json                    # Comptes utilisateurs (admin inclus)
├── destinations.json             # Catalogue de destinations
├── reviews.json                  # Avis publics
├── visited.json                  # Destinations visitées
├── favorite_notes.json           # Notes personnelles privées
├── proposed_destinations.json    # Propositions en attente
└── itineraries.json              # Itinéraires planifiés
```

---

## 🚀 Installation & Lancement

### Prérequis
- Python 3.14+
- Node.js 16+ (pour mobile)
- npm ou yarn

### Backend Flask

#### 1. Installation
```bash
# Cloner le repo
git clone <repo_url>
cd globetrotter-capstone

# Créer environnement virtuel
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Installer dépendances
pip install -r requirements.txt
```

#### 2. Lancement
```bash
python app\main.py
```

✅ Serveur démarré sur : **http://localhost:5000**

#### 3. Accès
- **Interface Web** : http://localhost:5000
- **API** : http://localhost:5000/api/...

### Application Mobile React Native

#### 1. Installation
```bash
cd mobile
npm install
```

#### 2. Configuration API
Dans `mobile/src/services/api.js`, vérifier :
```javascript
// Android Emulator
const API_BASE = 'http://10.0.2.2:5000';

// iOS Simulator ou device réel
const API_BASE = 'http://localhost:5000';
```

#### 3. Lancement
```bash
# Android
npm run android

# iOS
npm run ios
```

---

## 👤 Comptes de Test

### Administrateur
```
Username : admin
Password : admin123
```

**Permissions** :
- ✅ Valider/rejeter les propositions de destinations
- ✅ Accès endpoint `/proposals/admin`
- ✅ Toutes les fonctionnalités utilisateur

### Utilisateur Standard
```
Username : test_user_20260724124642
Password : [voir data/users.json pour le hash]
```

**Permissions** :
- ✅ Ajouter aux favoris
- ✅ Créer des notes personnelles
- ✅ Proposer des destinations
- ✅ Créer des itinéraires
- ✅ Laisser des avis

### Créer un Nouveau Compte
1. Cliquer sur "Se connecter"
2. Onglet "Inscription"
3. Remplir le formulaire
4. Le compte est créé instantanément

---

## 📡 API Endpoints

### Authentification
```http
POST /register          # Créer un compte
POST /login             # Se connecter (renvoie JWT)
```

### Destinations
```http
GET  /destinations                    # Lister toutes
GET  /destinations/search?q=...       # Rechercher
GET  /destinations/filter?tag=...     # Filtrer par tag
```

### Avis
```http
GET    /reviews/{destination_name}    # Lister les avis
POST   /reviews/{destination_name}    # Créer un avis (auth)
DELETE /reviews/{review_id}           # Supprimer son avis (auth)
```

### Destinations Visitées
```http
GET    /visited                       # Mes destinations visitées (auth)
POST   /visited/{destination_name}    # Marquer comme visité (auth)
DELETE /visited/{destination_name}    # Retirer de visité (auth)
```

### Notes Personnelles
```http
GET    /favorite-notes                     # Toutes mes notes (auth)
GET    /favorite-notes/{destination_name}  # Note d'une destination (auth)
PUT    /favorite-notes/{destination_name}  # Créer/modifier note (auth)
DELETE /favorite-notes/{destination_name}  # Supprimer note (auth)
```

### Propositions
```http
POST   /proposals                     # Proposer une destination (auth)
GET    /proposals/admin               # Lister toutes (admin only)
POST   /proposals/{id}/approve        # Approuver (admin only)
POST   /proposals/{id}/reject         # Rejeter (admin only)
```

### Itinéraires
```http
GET    /itineraries                   # Mes itinéraires (auth)
POST   /itineraries                   # Créer itinéraire (auth)
```

### Recommandations
```http
GET    /recommendations?limit=5       # Recommandations perso (auth)
```

---

## 🧪 Tests

### Tests Automatisés Backend
```bash
python tests\test_api.py
```

**Résultats** :
- ✅ 16/16 tests passent (100%)
- Couverture :
  - Authentification (register, login, admin)
  - CRUD destinations
  - Avis publics
  - Visited tracking
  - Notes personnelles
  - Propositions et validation admin

### Tests Manuels Interface Web
Voir le guide complet : **[TEST_WEB_GUIDE.md](TEST_WEB_GUIDE.md)**

**Checklist** :
- [ ] Visualisation sans connexion
- [ ] Authentification obligatoire
- [ ] Connexion admin
- [ ] Favoris + notes personnelles
- [ ] Proposition de destinations
- [ ] Responsive mobile/tablet/desktop
- [ ] Skeleton loading
- [ ] Itinéraires

### Tests Mobile
1. Lancer l'émulateur/simulateur
2. `npm run android` ou `npm run ios`
3. Tester :
   - Login/register
   - Navigation bottom tabs
   - Ajout favoris
   - Création d'avis
   - Propositions

---

## 📚 Documentation Complète

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Architecture technique détaillée |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | Référence API complète |
| [TEST_GUIDE.md](TEST_GUIDE.md) | Guide de tests backend |
| [TEST_WEB_GUIDE.md](TEST_WEB_GUIDE.md) | Guide de tests interface web |
| [ADMIN_GUIDE.md](ADMIN_GUIDE.md) | Guide administrateur |
| [CHANGELOG_WEB.md](CHANGELOG_WEB.md) | Historique des modifications web |
| [VERIFICATION_FONCTIONNALITES.md](VERIFICATION_FONCTIONNALITES.md) | Vérification features |
| [NOUVELLES_FONCTIONNALITES.md](NOUVELLES_FONCTIONNALITES.md) | Features ajoutées |

---

## 🎯 Roadmap

### Version Actuelle (2.0)
✅ Interface web responsive complète  
✅ Application mobile React Native  
✅ Authentification obligatoire pour actions  
✅ Notes personnelles sur favoris  
✅ Propositions avec validation admin  
✅ Skeleton loading pattern  
✅ Admin inscrit (admin/admin123)  
✅ Logo corrigé (logo.png)  

### Prochaines Versions

#### v2.1 - Interface Admin
- [ ] Dashboard admin dédié
- [ ] Gestion visuelle des propositions
- [ ] Statistiques et analytics
- [ ] Modération des avis

#### v2.2 - Upload & Médias
- [ ] Upload d'images pour propositions
- [ ] Galerie photos utilisateurs
- [ ] Videos de destinations
- [ ] Compression automatique d'images

#### v2.3 - Social Features
- [ ] Partage de favoris entre users
- [ ] Following system
- [ ] Feed d'activités
- [ ] Notifications push

#### v2.4 - Améliorations UX
- [ ] Mode sombre
- [ ] Export PDF d'itinéraires
- [ ] Offline mode (PWA)
- [ ] Recherche vocale

#### v2.5 - Intégrations
- [ ] API Google Maps
- [ ] Booking.com API
- [ ] OpenWeather API
- [ ] Currency converter

---

## 🤝 Contribution

### Comment Contribuer
1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Standards de Code
- **Python** : PEP 8
- **JavaScript** : ESLint + Prettier
- **CSS** : BEM methodology
- **Commits** : Conventional Commits

---

## 📄 License

Ce projet est sous licence MIT. Voir [LICENSE](LICENSE) pour plus de détails.

---

## 👨‍💻 Auteur

**Équipe Globetrotter**  
📧 Email : contact@globetrotter.com  
🌐 Website : https://globetrotter.com

---

## 🙏 Remerciements

- Design inspiré par : Airbnb, Lonely Planet, Culture Trip
- Palette de couleurs : Premium luxury travel aesthetic
- Icônes : Lucide Icons
- Fonts : Bell MT, Inter

---

## 📊 Statistiques du Projet

```
Lignes de code Python   : ~2000
Lignes de code JS       : ~1200 (web) + ~800 (mobile)
Lignes de code CSS      : ~1100
Composants React        : 25+
Endpoints API           : 15
Tests automatisés       : 16
Taux de réussite        : 100%
```

---

**🌍 Bon voyage avec Globetrotter ! ✈️**
