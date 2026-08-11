# 🧪 Guide de Test - Nouvelles Fonctionnalités

## Prérequis

1. Backend Flask lancé sur `http://localhost:5000`
2. Application mobile lancée (Android ou iOS)
3. Compte utilisateur créé et connecté

---

## 📋 Tests Système de Reviews

### Test 1: Créer un Avis ✅

**Étapes** :
1. Ouvrir l'application
2. Rechercher "Bali" ou sélectionner une destination
3. Cliquer sur la destination pour ouvrir les détails
4. Scroller jusqu'à "Avis des voyageurs"
5. Cliquer sur "Écrire un avis"
6. Sélectionner 5 étoiles
7. Écrire un commentaire : "Destination incroyable ! Les plages sont magnifiques et la culture est fascinante."
8. Cliquer sur "Publier l'avis"

**Résultat attendu** :
- ✅ Modal se ferme
- ✅ Alert "Succès - Votre avis a été publié"
- ✅ Nouvel avis apparaît en haut de la liste
- ✅ Compteur "(X avis)" incrémenté

### Test 2: Voir les Avis Publics 👁️

**Étapes** :
1. Rester sur la page de détail
2. Scroller vers "Avis des voyageurs"
3. Observer la liste des avis

**Résultat attendu** :
- ✅ Tous les avis sont visibles
- ✅ Avatar utilisateur affiché
- ✅ Nom d'utilisateur correct
- ✅ Date formatée "15 janvier 2024"
- ✅ Étoiles correctement remplies
- ✅ Commentaire complet affiché

### Test 3: Supprimer son Avis 🗑️

**Étapes** :
1. Trouver un avis que VOUS avez écrit
2. Cliquer sur l'icône poubelle (trash)
3. Confirmer la suppression

**Résultat attendu** :
- ✅ Alert de confirmation
- ✅ Avis disparaît de la liste
- ✅ Compteur décrémenté
- ✅ Message "Avis supprimé"

### Test 4: Tentative de Suppression Avis d'un Autre ❌

**Étapes** :
1. Trouver un avis écrit par un AUTRE utilisateur
2. Vérifier la présence/absence du bouton poubelle

**Résultat attendu** :
- ✅ Pas de bouton poubelle visible
- ✅ Impossible de supprimer

### Test 5: Avis avec Différentes Notes ⭐

**Étapes** :
1. Créer 3 avis avec 1, 3 et 5 étoiles

**Résultat attendu** :
- ✅ 1 étoile : 1 étoile remplie, 4 vides
- ✅ 3 étoiles : 3 étoiles remplies, 2 vides
- ✅ 5 étoiles : 5 étoiles remplies

---

## ✅ Tests Destinations Visitées

### Test 6: Marquer comme Visité ✔️

**Étapes** :
1. Ouvrir une destination (ex: Paris)
2. Trouver le bouton "Marquer comme visité"
3. Cliquer dessus

**Résultat attendu** :
- ✅ Bouton devient vert sauge
- ✅ Texte change en "Visité"
- ✅ Icône check-circle remplie
- ✅ Alert "Succès - Ajouté à vos destinations visitées"

### Test 7: Voir la Liste des Visités 📋

**Étapes** :
1. Aller dans l'onglet "Favoris" (bottom nav)
2. Cliquer sur l'onglet "Visités"

**Résultat attendu** :
- ✅ Titre "DESTINATIONS VISITÉES"
- ✅ Sous-titre "Vos voyages accomplis"
- ✅ Liste des destinations visitées
- ✅ Compteur correct "X destinations"

### Test 8: Retirer d'une Destination Visitée ❌

**Étapes** :
1. Ouvrir une destination marquée comme visitée
2. Cliquer sur le bouton "Visité"

**Résultat attendu** :
- ✅ Bouton redevient bleu clair
- ✅ Texte "Marquer comme visité"
- ✅ Alert "Retiré de vos destinations visitées"
- ✅ Disparaît de l'onglet Visités

### Test 9: Onglet Vide 🚫

**Étapes** :
1. S'assurer de n'avoir aucune destination visitée
2. Aller dans Favoris > Visités

**Résultat attendu** :
- ✅ Icône map-pin grise
- ✅ "Aucune destination visitée"
- ✅ Message explicatif
- ✅ Compteur "0 destination"

---

## 📝 Tests Notes Personnelles

### Test 10: Créer une Note Complète 📄

**Étapes** :
1. Ajouter une destination aux favoris
2. Aller dans Favoris > Favoris
3. Cliquer sur "[+] Ajouter une note"
4. Remplir tous les champs :
   - Note : "Je veux absolument voir le coucher de soleil sur les rizières"
   - Date : "Été 2025"
   - Compagnons : "En famille (4 personnes)"
   - Budget : "3000"
5. Cliquer sur "Sauvegarder"

**Résultat attendu** :
- ✅ Modal se ferme
- ✅ Alert "Note sauvegardée"
- ✅ Aperçu de la note apparaît sous la carte
- ✅ Bouton devient "Modifier la note"

### Test 11: Modifier une Note Existante ✏️

**Étapes** :
1. Cliquer sur "Modifier la note"
2. Changer le budget : "3500"
3. Ajouter au texte : "et visiter Ubud"
4. Sauvegarder

**Résultat attendu** :
- ✅ Modifications enregistrées
- ✅ Aperçu mis à jour
- ✅ Anciennes données écrasées

### Test 12: Note Partielle (Seulement Texte) 📝

**Étapes** :
1. Créer une nouvelle note
2. Remplir uniquement le champ "Note"
3. Laisser date, compagnons et budget vides
4. Sauvegarder

**Résultat attendu** :
- ✅ Note sauvegardée avec succès
- ✅ Champs optionnels = null dans l'API
- ✅ Affichage sans erreur

### Test 13: Voir l'Aperçu de la Note 👀

**Étapes** :
1. Retourner sur la liste des favoris
2. Observer la carte avec une note

**Résultat attendu** :
- ✅ Icône file-text
- ✅ Début du texte affiché (tronqué à 2 lignes)
- ✅ Style italique
- ✅ Couleur gris secondaire

### Test 14: Supprimer une Note 🗑️

**Étapes** :
1. Ouvrir la modal d'édition d'une note
2. Effacer tout le texte
3. Sauvegarder

**Résultat attendu** :
- ✅ Note supprimée ou sauvegardée vide
- ✅ Aperçu disparaît
- ✅ Bouton redevient "Ajouter une note"

### Test 15: Notes sur Plusieurs Favoris 🔢

**Étapes** :
1. Créer des notes sur 3 destinations différentes
2. Naviguer entre les favoris

**Résultat attendu** :
- ✅ Chaque destination a sa propre note
- ✅ Les notes ne se mélangent pas
- ✅ Toutes les notes sont persistées

---

## 🔄 Tests d'Intégration

### Test 16: Workflow Complet - Découverte à Avis 🌟

**Étapes** :
1. Rechercher "Tokyo"
2. Ouvrir la destination
3. Lire les avis existants
4. Ajouter aux favoris ❤️
5. Créer une note personnelle
6. Marquer comme visité ✅
7. Écrire un avis public

**Résultat attendu** :
- ✅ Toutes les actions fonctionnent
- ✅ Pas de conflit entre les fonctionnalités
- ✅ Données correctement sauvegardées

### Test 17: Changement d'Onglets 🔁

**Étapes** :
1. Ajouter 2 destinations aux favoris
2. Marquer 1 destination comme visitée
3. Aller dans Favoris
4. Basculer entre Favoris et Visités

**Résultat attendu** :
- ✅ Onglet Favoris : 2 destinations
- ✅ Onglet Visités : 1 destination
- ✅ Compteurs corrects
- ✅ Données ne se mélangent pas

### Test 18: Offline puis Online 📡

**Étapes** :
1. Créer une note (online)
2. Activer le mode avion
3. Consulter la note
4. Désactiver le mode avion
5. Créer un avis (nécessite online)

**Résultat attendu** :
- ✅ Notes visibles offline (AsyncStorage)
- ✅ Avis nécessitent connexion
- ✅ Message d'erreur explicite si offline

### Test 19: Déconnexion/Reconnexion 🔐

**Étapes** :
1. Créer notes, favoris, avis
2. Se déconnecter
3. Se reconnecter

**Résultat attendu** :
- ✅ Favoris restaurés (AsyncStorage)
- ✅ Notes restaurées
- ✅ Avis chargés depuis le serveur

---

## 🐛 Tests d'Erreur

### Test 20: Avis sans Commentaire ❌

**Étapes** :
1. Ouvrir modal d'avis
2. Laisser le commentaire vide
3. Essayer de publier

**Résultat attendu** :
- ✅ Alert "Erreur - Veuillez écrire un commentaire"
- ✅ Modal reste ouverte
- ✅ Pas d'envoi à l'API

### Test 21: Budget Invalide 💵

**Étapes** :
1. Créer une note
2. Entrer "abc" dans le budget
3. Sauvegarder

**Résultat attendu** :
- ✅ Validation côté client (keyboard numeric)
- ✅ Ou validation serveur si envoyé
- ✅ Message d'erreur clair

### Test 22: Token Expiré 🔓

**Étapes** :
1. Laisser l'app ouverte 24h+
2. Essayer de créer un avis

**Résultat attendu** :
- ✅ Erreur 401 détectée
- ✅ Token supprimé
- ✅ Redirection vers login
- ✅ Message explicatif

### Test 23: Destination Inexistante 🚫

**Étapes** :
1. Essayer d'accéder à `/destination-detail` avec une destination invalide

**Résultat attendu** :
- ✅ Gestion d'erreur gracieuse
- ✅ Pas de crash de l'app
- ✅ Message utilisateur clair

---

## 📱 Tests UI/UX

### Test 24: Animations 🎬

**Actions** :
- Modal apparition/disparition
- Hover sur boutons
- Toggle visited
- Ajout aux favoris

**Résultat attendu** :
- ✅ Animations fluides 250ms
- ✅ Pas de lag
- ✅ Transitions naturelles

### Test 25: Responsive 📐

**Étapes** :
1. Tester sur différentes tailles d'écran
2. Rotation portrait/paysage

**Résultat attendu** :
- ✅ Layout s'adapte
- ✅ Textes lisibles
- ✅ Boutons accessibles
- ✅ Pas de débordement

### Test 26: Accessibilité ♿

**Vérifications** :
- Labels sur inputs
- Contraste des textes
- Taille des touch targets
- Feedback visuel

**Résultat attendu** :
- ✅ Tous les champs ont des labels
- ✅ Contraste > 4.5:1
- ✅ Boutons > 44x44px
- ✅ Focus states visibles

---

## 🔥 Tests de Charge

### Test 27: Beaucoup d'Avis 📊

**Étapes** :
1. Créer 50+ avis sur une destination
2. Ouvrir la page

**Résultat attendu** :
- ✅ Chargement rapide
- ✅ Scroll fluide
- ✅ Pas de ralentissement
- ✅ (Bonus: Pagination à implémenter)

### Test 28: Beaucoup de Favoris 💾

**Étapes** :
1. Ajouter 100+ favoris
2. Naviguer dans la liste

**Résultat attendu** :
- ✅ Liste performante
- ✅ Lazy loading des images
- ✅ Pas de lag

---

## ✅ Checklist Finale

### Backend
- [ ] Tous les endpoints répondent (200/201)
- [ ] Validation des données d'entrée
- [ ] Authentification fonctionnelle
- [ ] Fichiers JSON bien formés
- [ ] Pas d'erreurs dans les logs

### Frontend
- [ ] Toutes les modals s'ouvrent/ferment
- [ ] Formulaires valident les données
- [ ] Erreurs réseau gérées
- [ ] Loading states affichés
- [ ] Navigation fluide

### Données
- [ ] Reviews enregistrés correctement
- [ ] Visited persisté
- [ ] Notes sauvegardées
- [ ] Pas de perte de données
- [ ] Sync entre écrans

### UX
- [ ] Animations fluides
- [ ] Feedback immédiat
- [ ] Messages d'erreur clairs
- [ ] Design cohérent
- [ ] Palette respectée

---

## 📝 Rapport de Bug

Si vous trouvez un bug, documentez :

```
Titre : [Type] Description courte

Étapes pour reproduire :
1. Action 1
2. Action 2
3. Action 3

Résultat attendu :
Ce qui devrait se passer

Résultat obtenu :
Ce qui se passe réellement

Screenshots :
[Ajouter captures d'écran]

Environnement :
- OS: Android 13 / iOS 16
- Appareil: Pixel 7 / iPhone 14
- Version app: 2.0
```

---

## 🎯 Scénarios Prioritaires

### Priorité 1 (Critique) 🔴
- [x] Créer et voir un avis
- [x] Marquer comme visité
- [x] Créer une note sur favori

### Priorité 2 (Important) 🟡
- [x] Supprimer un avis
- [x] Modifier une note
- [x] Basculer Favoris/Visités

### Priorité 3 (Optionnel) 🟢
- [x] Animations
- [x] Empty states
- [x] Offline mode

---

## 🚀 Prêt pour Production ?

Avant de déployer, vérifier :

- [ ] ✅ Tous les tests passent
- [ ] 🔒 Sécurité vérifiée (tokens, validation)
- [ ] 📊 Performance acceptable (<2s chargement)
- [ ] 🎨 Design conforme au brief
- [ ] 📱 Responsive sur tous devices
- [ ] ♿ Accessibilité basique respectée
- [ ] 📝 Documentation à jour
- [ ] 🐛 Bugs critiques corrigés

---

**Happy Testing! 🎉**
