# Globetrotter Mobile App

Application React Native premium pour la découverte de destinations de voyage.

## 🎨 Design System

- **Palette**: Rose poudré, Beige, Bleu glacier, Vert sauge
- **Style**: Luxury Minimalism, Soft UI, Editorial Design
- **Typography**: Georgia (Display), Inter (Body)

## 📁 Architecture

```
mobile/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── Button.js
│   │   └── DestinationCard.js
│   ├── screens/             # Écrans de l'application
│   │   ├── LoginScreen.js
│   │   ├── HomeScreen.js
│   │   ├── ExplorerScreen.js
│   │   ├── FavoritesScreen.js
│   │   ├── ProfileScreen.js
│   │   └── DestinationDetailScreen.js
│   ├── navigation/          # Navigation
│   │   └── AppNavigator.js
│   ├── services/            # API et services
│   │   └── api.js
│   ├── config/              # Configuration
│   │   └── theme.js
│   └── assets/              # Images et ressources
├── App.js                   # Point d'entrée
├── index.js
└── package.json
```

## 🚀 Installation

### Prérequis

- Node.js >= 18
- React Native CLI
- Android Studio (Android) ou Xcode (iOS)

### Étapes

```bash
cd mobile
npm install

# iOS uniquement
cd ios && pod install && cd ..

# Lancer sur Android
npm run android

# Lancer sur iOS
npm run ios
```

## 🔌 Configuration API

Par défaut, l'app se connecte à `http://10.0.2.2:5000` pour l'émulateur Android.

Pour changer l'URL, éditez `src/services/api.js`:

```javascript
const API_URL = 'https://your-api-url.com';
```

## 📱 Fonctionnalités

### ✅ Implémentées

- **Authentification**
  - Connexion / Inscription
  - Gestion du token JWT
  - Déconnexion

- **Accueil**
  - Hero banner immersif
  - Recherche de destinations
  - Catégories de navigation
  - Destinations populaires

- **Explorer**
  - Recherche et filtres
  - Filtrage par catégorie
  - Filtrage par budget
  - Liste de résultats

- **Favoris**
  - Ajout/retrait de favoris
  - Liste des favoris
  - Persistance locale

- **Profil**
  - Affichage des statistiques
  - Préférences utilisateur
  - Menu de paramètres
  - Déconnexion

- **Détail de destination**
  - Image hero
  - Informations complètes
  - Galerie d'images
  - Lieux associés
  - Gestion des favoris

## 🎯 API Endpoints utilisés

- `POST /login` - Authentification
- `POST /register` - Inscription
- `GET /destinations` - Liste des destinations
- `GET /destinations?q=search&tag=nature&max_cost=100` - Recherche filtrée
- `GET /recommendations` - Recommandations personnalisées
- `GET /itineraries` - Liste des itinéraires
- `POST /itineraries` - Créer un itinéraire

## 🎨 Composants Principaux

### Button
```jsx
<Button
  title="Connexion"
  variant="primary" // primary, secondary, ghost
  onPress={handlePress}
  loading={false}
  icon={<Icon name="heart" />}
/>
```

### DestinationCard
```jsx
<DestinationCard
  destination={destination}
  isFavorite={true}
  onPress={handlePress}
  onToggleFavorite={handleToggle}
/>
```

## 🎭 Thème

Tous les styles utilisent le design system défini dans `src/config/theme.js`:

- `COLORS` - Palette de couleurs
- `SPACING` - Système d'espacement
- `RADIUS` - Border radius
- `TYPOGRAPHY` - Styles de texte
- `SHADOWS` - Ombres premium

## 📦 Dépendances Principales

- `react-navigation` - Navigation
- `axios` - Requêtes HTTP
- `async-storage` - Stockage local
- `react-native-vector-icons` - Icônes
- `react-native-linear-gradient` - Gradients
- `react-native-gesture-handler` - Gestes

## 🐛 Debugging

### Android
```bash
adb logcat | grep ReactNative
```

### iOS
```bash
npx react-native log-ios
```

### Network
Vérifiez que le backend Flask est lancé sur le port 5000.

## 📄 Licence

MIT
