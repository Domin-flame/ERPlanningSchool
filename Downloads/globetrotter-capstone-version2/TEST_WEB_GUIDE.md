# Guide de Test - Interface Web Globetrotter

## 🚀 Démarrage Rapide

### Lancer l'application
```bash
python app/main.py
```

Accéder à : **http://localhost:5000**

---

## ✅ Tests Fonctionnels

### 1. Test de Visualisation Sans Connexion

**Objectif** : Vérifier que l'application est visible sans authentification

#### Actions :
1. Ouvrir http://localhost:5000
2. Observer la page d'accueil (Hero avec image de fond)
3. Scroller pour voir les destinations populaires
4. Cliquer sur "Explorer" dans la navigation
5. Filtrer par budget, style, recherche

#### Résultat Attendu :
- ✅ Toutes les pages sont visibles
- ✅ Les destinations s'affichent correctement
- ✅ Les filtres fonctionnent
- ✅ Le logo.png apparaît correctement
- ✅ Pas d'erreur de chargement

---

### 2. Test d'Authentification Obligatoire

**Objectif** : Vérifier que les actions nécessitent une connexion

#### Actions Sans Connexion :
1. Cliquer sur l'icône ❤️ (favori) sur une destination
2. Observer le comportement

#### Résultat Attendu :
- ✅ Modal de connexion s'ouvre automatiquement
- ✅ Message "Connectez-vous pour activer vos voyages"
- ✅ Onglets "Connexion" / "Inscription" visibles

---

### 3. Test de Connexion Admin

**Objectif** : Se connecter avec le compte admin

#### Actions :
1. Cliquer sur "Se connecter" (bouton en haut à droite ou dans le modal)
2. Entrer :
   - **Username** : `admin`
   - **Password** : `admin123`
3. Cliquer sur "Continuer"

#### Résultat Attendu :
- ✅ Message "Connecte en tant que admin"
- ✅ Modal se ferme après 1 seconde
- ✅ Bouton "Se connecter" remplacé par le username
- ✅ Section Workspace affiche recommandations et itinéraires
- ✅ Bouton "Proposer une destination" apparaît sur la Hero

---

### 4. Test des Favoris

**Objectif** : Ajouter et gérer des favoris

#### Actions :
1. Se connecter (si pas déjà fait)
2. Cliquer sur l'icône ❤️ sur une destination
3. Observer l'animation
4. Aller dans "Favoris" (navigation)
5. Vérifier que la destination est présente

#### Résultat Attendu :
- ✅ Icône ❤️ devient rose/pleine avec animation
- ✅ Destination apparaît dans la page Favoris
- ✅ Bouton "Ajouter une note" visible sur chaque carte

---

### 5. Test des Notes Personnelles

**Objectif** : Créer et voir des notes sur les favoris

#### Actions :
1. Dans "Favoris", cliquer sur "Ajouter une note" sur une destination
2. Remplir le formulaire :
   - **Note** : "Voyage de rêve pour notre lune de miel"
   - **Date de visite** : 2026-12-15
   - **Avec qui** : "Ma femme"
   - **Budget** : 3000
3. Cliquer sur "Enregistrer"
4. Observer la carte de destination

#### Résultat Attendu :
- ✅ Modal se ferme
- ✅ Badge 📝 apparaît en haut à gauche de la carte
- ✅ Aperçu de la note visible dans la carte
- ✅ Bouton devient "Modifier" au lieu de "Ajouter une note"
- ✅ Re-cliquer charge la note existante dans le modal

---

### 6. Test de Proposition de Destination

**Objectif** : Proposer une nouvelle destination

#### Actions :
1. Sur la page d'accueil, cliquer sur "Proposer une destination" (bouton dans la Hero)
2. Remplir le formulaire :
   - **Nom** : "Budapest"
   - **Pays** : "Hongrie"
   - **Continent** : "Europe"
   - **Description** : "Ville thermale magnifique avec architecture austro-hongroise"
   - **Tags** : "culture, wellness, architecture"
   - **Coût** : 70
3. Cliquer sur "Envoyer la proposition"

#### Résultat Attendu :
- ✅ Message "Proposition envoyee avec succes!"
- ✅ Modal se ferme après 1.5 secondes
- ✅ Proposition enregistrée dans `data/proposed_destinations.json`
- ✅ Statut "pending" dans le fichier

#### Vérification Backend :
```bash
# Ouvrir le fichier pour voir la proposition
cat data/proposed_destinations.json
```

---

### 7. Test du Design Responsive

**Objectif** : Vérifier l'adaptation sur différentes tailles d'écran

#### Actions Desktop (>1024px) :
1. Ouvrir l'application en plein écran
2. Observer la sidebar à gauche
3. Vérifier que le contenu est centré

#### Résultat Attendu :
- ✅ Sidebar visible à gauche avec navigation verticale
- ✅ Contenu décalé de 280px
- ✅ Top bar masquée
- ✅ Bottom nav masquée

#### Actions Tablet (768px - 1024px) :
1. Redimensionner la fenêtre à ~900px de largeur
2. Observer les changements

#### Résultat Attendu :
- ✅ Sidebar disparaît
- ✅ Top bar apparaît en haut
- ✅ Navigation horizontale
- ✅ Grilles adaptées (2-3 colonnes)

#### Actions Mobile (<768px) :
1. Redimensionner à ~400px ou ouvrir DevTools en mode mobile
2. Observer les changements

#### Résultat Attendu :
- ✅ Top bar simplifiée
- ✅ Bottom nav flottante en bas de l'écran
- ✅ Grilles en 1 colonne
- ✅ Hero réduit en hauteur
- ✅ Cartes empilées verticalement
- ✅ Formulaires en 1 colonne

---

### 8. Test du Skeleton Loading

**Objectif** : Voir les états de chargement

#### Actions :
1. Ouvrir DevTools (F12)
2. Aller dans Network > Throttling
3. Choisir "Slow 3G"
4. Rafraîchir la page (F5)
5. Observer les cartes pendant le chargement

#### Résultat Attendu :
- ✅ Cartes skeleton avec animation de gradient
- ✅ Animation fluide (va-et-vient horizontal)
- ✅ Pas de flash de contenu vide
- ✅ Transition douce vers le contenu réel

---

### 9. Test des Itinéraires

**Objectif** : Créer un itinéraire personnalisé

#### Actions :
1. Scroller vers le bas de la page d'accueil
2. Trouver la section "Composer un voyage"
3. Remplir :
   - **Titre** : "Tour d'Europe 2027"
   - **Destinations** : "Paris, Rome, Barcelona"
   - **Départ** : 2027-06-01
   - **Retour** : 2027-06-15
   - **Notes** : "2 semaines de découverte culturelle"
4. Cliquer sur "Ajouter"

#### Résultat Attendu :
- ✅ Formulaire se vide
- ✅ Nouvel itinéraire apparaît en dessous
- ✅ Icône calendrier visible
- ✅ Dates et destinations affichées

---

### 10. Test de Déconnexion

**Objectif** : Vérifier le retour à l'état non-connecté

#### Actions :
1. Aller dans "Profil"
2. Cliquer sur "Se deconnecter"
3. Retourner sur les autres pages

#### Résultat Attendu :
- ✅ Redirection ou mise à jour de l'interface
- ✅ Section Workspace affiche "Creez votre carnet de voyage"
- ✅ Bouton "Se connecter" réapparaît
- ✅ Cliquer sur ❤️ ouvre à nouveau le modal d'auth
- ✅ Page Favoris affiche "Connexion requise"
- ✅ Page Profil affiche "Connexion requise"

---

## 🐛 Tests de Régression

### Vérifier que les anciennes fonctionnalités marchent toujours

- [ ] Recherche de destinations par mot-clé
- [ ] Filtres par style (Nature, Culture, etc.)
- [ ] Filtre par budget
- [ ] Modal de détail de destination
- [ ] Galerie d'images dans le détail
- [ ] Cartes éditoriales (Restaurants, Activités, Hotels)
- [ ] Footer visible en bas de page
- [ ] Logo cliquable retourne à l'accueil

---

## 📱 Test sur Vrais Devices

### Test Mobile Réel
1. Sur votre téléphone, accéder à http://[VOTRE_IP]:5000
2. Vérifier :
   - Touch gestures fonctionnent
   - Bottom nav est accessible au pouce
   - Formulaires ont le bon clavier (email, number, date)
   - Pas de zoom automatique sur les inputs
   - Scroll fluide

### Test Tablet Réel
1. Sur tablette, même URL
2. Vérifier :
   - Layout intermédiaire adapté
   - Grilles en 2-3 colonnes
   - Navigation claire

---

## 🎨 Test Visuel

### Vérifier la Palette de Couleurs
- **Rose poudré** (#F7CBCA) : Accents, badges de notes
- **Beige** (#DDD5D5) : Surfaces secondaires
- **Blanc cassé** (#F1F7F7) : Background principal
- **Bleu glacier** (#C6D7D8) : Bordures, états hover
- **Vert sauge** (#5D6B6B) : Boutons primaires, textes

### Vérifier la Typographie
- **Bell MT** : Titres hero et sections (h1, h2)
- **Inter** : Corps de texte et UI

### Vérifier les Border Radius
- Cards : 18-24px (premium look)
- Buttons : 18px
- Pills : 999px (full rounded)

---

## ⚠️ Tests d'Erreur

### Test de Mauvais Identifiants
1. Se connecter avec username: "wronguser" / password: "wrongpass"
2. Observer le message d'erreur dans le notice

### Test de Champs Vides
1. Essayer de soumettre le formulaire de proposition sans remplir
2. Vérifier que les champs `required` bloquent la soumission

### Test de Déconnexion du Backend
1. Arrêter le serveur Flask
2. Essayer une action (ajouter un favori)
3. Observer le comportement (message d'erreur)

---

## 📊 Checklist Complète

### Fonctionnalités ✅
- [ ] Visualisation sans connexion
- [ ] Authentification obligatoire pour actions
- [ ] Connexion admin (admin/admin123)
- [ ] Inscription nouveau compte
- [ ] Ajout/retrait de favoris
- [ ] Notes personnelles sur favoris
- [ ] Proposition de destinations
- [ ] Création d'itinéraires
- [ ] Recommandations personnalisées
- [ ] Recherche et filtres

### Design ✅
- [ ] Logo logo.png visible partout
- [ ] Palette rose/beige/sauge respectée
- [ ] Typographie Bell MT + Inter
- [ ] Border radius 18-24px
- [ ] Skeleton loading fluide
- [ ] Animations douces

### Responsive ✅
- [ ] Desktop (>1024px) : Sidebar
- [ ] Tablet (768-1024px) : Top bar
- [ ] Mobile (<768px) : Bottom nav
- [ ] Small mobile (<480px) : Optimisé
- [ ] Touch-friendly (44px+ boutons)

### Accessibilité ✅
- [ ] Navigation clavier complète
- [ ] aria-labels présents
- [ ] Focus visible
- [ ] Contraste suffisant
- [ ] Textes alternatifs sur images

---

## 🎯 Résultat Final

Si tous les tests passent, vous devez avoir :

✅ **Application complète et fonctionnelle**  
✅ **Design premium et responsive**  
✅ **Authentification sécurisée**  
✅ **Toutes les features demandées implémentées**  
✅ **Logo corrigé**  
✅ **Pattern skeleton**  
✅ **Notes reliées aux favoris**  

**L'application est prête pour utilisation ! 🎉**
