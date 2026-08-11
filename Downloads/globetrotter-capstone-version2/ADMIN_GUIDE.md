# 👨‍💼 Guide Administrateur - Globetrotter

## 🔑 Accès Admin

**Identifiants**:
- Username: `admin`
- Password: `admin123`

⚠️ **Important**: Changez ces identifiants en production !

---

## 🎯 Responsabilités Admin

En tant qu'administrateur, vous avez accès à des fonctionnalités spéciales pour :
1. **Modérer les propositions** de destinations soumises par les utilisateurs
2. **Approuver** les destinations de qualité
3. **Rejeter** les propositions inappropriées

---

## 🚀 Connexion Admin

### Via API (Postman/curl)

```bash
POST http://localhost:5000/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Réponse**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "is_admin": true,
  "message": "Admin login successful"
}
```

💾 **Sauvegardez ce token** - Il sera nécessaire pour toutes les actions admin.

---

## 📋 Gestion des Propositions

### 1. Voir les Propositions en Attente

```bash
GET http://localhost:5000/admin/proposals?status=pending
Authorization: Bearer <votre_token_admin>
```

**Réponse**:
```json
[
  {
    "id": "65caf314-b594-42f0-857c-b2906c827514",
    "submitted_by": "john_doe",
    "status": "pending",
    "name": "Île Maurice",
    "country": "Maurice",
    "continent": "Africa",
    "description": "Paradis tropical avec plages de sable blanc...",
    "tags": ["beach", "nature", "luxury"],
    "avg_cost_per_day": 120,
    "image": "mauritius.jpg",
    "submitted_at": "2024-01-15T10:30:00.000Z",
    "reviewed_at": null,
    "admin_comment": ""
  }
]
```

### 2. Approuver une Proposition

```bash
POST http://localhost:5000/admin/proposals/{proposal_id}/approve
Authorization: Bearer <votre_token_admin>
Content-Type: application/json

{
  "comment": "Excellente description, photos de qualité. Approuvé !"
}
```

**Effet**:
- ✅ Statut changé en "approved"
- ✅ Destination ajoutée au catalogue principal (`destinations.json`)
- ✅ Visible par tous les utilisateurs
- ✅ Commentaire admin enregistré

### 3. Rejeter une Proposition

```bash
POST http://localhost:5000/admin/proposals/{proposal_id}/reject
Authorization: Bearer <votre_token_admin>
Content-Type: application/json

{
  "comment": "Description trop vague. Veuillez fournir plus de détails sur les attractions et la culture locale."
}
```

**Effet**:
- ❌ Statut changé en "rejected"
- ❌ PAS ajoutée au catalogue
- 💬 Commentaire visible par l'utilisateur qui a soumis

---

## 🔍 Filtrer les Propositions

### Toutes les propositions

```bash
GET http://localhost:5000/admin/proposals
Authorization: Bearer <votre_token_admin>
```

### En attente uniquement

```bash
GET http://localhost:5000/admin/proposals?status=pending
Authorization: Bearer <votre_token_admin>
```

### Approuvées

```bash
GET http://localhost:5000/admin/proposals?status=approved
Authorization: Bearer <votre_token_admin>
```

### Rejetées

```bash
GET http://localhost:5000/admin/proposals?status=rejected
Authorization: Bearer <votre_token_admin>
```

---

## ✅ Critères d'Approbation

### ✓ Approuver si:
- Description complète et informative (>100 caractères)
- Nom et pays correctement orthographiés
- Tags pertinents et précis
- Coût journalier réaliste
- Image appropriée (si fournie)
- Pas de contenu offensant ou spam

### ✗ Rejeter si:
- Description trop courte (<50 caractères)
- Informations manquantes
- Contenu inapproprié
- Doublon d'une destination existante
- Destination fictive ou erronée
- Spam ou publicité

---

## 📊 Dashboard Admin (Stats)

### Voir toutes les statistiques

**Nombre de propositions par statut**:
```python
# Exemple de script Python
import requests

token = "votre_token_admin"
headers = {"Authorization": f"Bearer {token}"}

# Toutes les propositions
all = requests.get("http://localhost:5000/admin/proposals", headers=headers).json()

# Compter par statut
pending = len([p for p in all if p['status'] == 'pending'])
approved = len([p for p in all if p['status'] == 'approved'])
rejected = len([p for p in all if p['status'] == 'rejected'])

print(f"En attente: {pending}")
print(f"Approuvées: {approved}")
print(f"Rejetées: {rejected}")
```

---

## 🛠️ Outils de Modération

### Commandes Utiles

**Lister les fichiers de données**:
```bash
# Windows
dir data\*.json

# Linux/Mac
ls -lh data/*.json
```

**Voir le contenu d'un fichier**:
```bash
# Windows
type data\proposed_destinations.json

# Linux/Mac
cat data/proposed_destinations.json
```

**Backup des données**:
```bash
# Windows
copy data\*.json backup\

# Linux/Mac
cp data/*.json backup/
```

---

## 🚨 Actions d'Urgence

### Supprimer une destination approuvée par erreur

1. Ouvrir `data/destinations.json`
2. Chercher la destination par nom
3. Supprimer l'entrée complète
4. Sauvegarder le fichier
5. Redémarrer le serveur Flask

### Réactiver une proposition rejetée

1. Ouvrir `data/proposed_destinations.json`
2. Trouver la proposition (par ID)
3. Changer `"status": "rejected"` en `"status": "pending"`
4. Effacer `"admin_comment"`
5. Sauvegarder

---

## 📧 Communication avec les Utilisateurs

### Messages Standards

**Approbation**:
```
"Excellente proposition ! Nous l'avons ajoutée au catalogue. Merci pour votre contribution !"
```

**Rejet - Détails manquants**:
```
"Merci pour votre proposition. Pourriez-vous ajouter plus de détails sur les attractions locales, la culture et les activités disponibles ?"
```

**Rejet - Doublon**:
```
"Cette destination existe déjà dans notre catalogue. Vous pouvez la consulter dans l'onglet Explorer."
```

**Rejet - Qualité**:
```
"Nous recherchons des descriptions plus détaillées pour offrir la meilleure expérience à nos utilisateurs. N'hésitez pas à soumettre à nouveau avec plus d'informations."
```

---

## 📈 Workflow de Modération

### Processus Recommandé

```
1. Se connecter en tant qu'admin
   ↓
2. Lister les propositions pending
   ↓
3. Pour chaque proposition:
   ├─ Lire attentivement
   ├─ Vérifier la qualité
   ├─ Google la destination (vérification)
   ├─ Décider: Approuver ou Rejeter
   └─ Ajouter un commentaire constructif
   ↓
4. Exécuter l'action (approve/reject)
   ↓
5. Vérifier que le statut a changé
   ↓
6. Passer à la suivante
```

### Fréquence Recommandée

- **Idéal**: Modérer 2 fois par jour
- **Minimum**: Modérer 1 fois par jour
- **Maximum délai**: 48h pour répondre à une proposition

---

## 🔒 Sécurité Admin

### Bonnes Pratiques

1. ✅ **Ne jamais partager** les identifiants admin
2. ✅ **Changer le mot de passe** en production
3. ✅ **Logger toutes les actions** admin
4. ✅ **Backup régulier** des données
5. ✅ **Vérifier les propositions** avant approbation
6. ✅ **Être respectueux** dans les commentaires

### Changer le Mot de Passe Admin

Éditer `app/proposals.py`:

```python
# Ligne 18-19
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "nouveau_mot_de_passe_securise"
```

Puis redémarrer le serveur.

---

## 📞 Support

### En cas de problème

1. **Serveur ne démarre pas**:
   - Vérifier que le port 5000 est libre
   - Vérifier les logs dans la console

2. **Token invalide**:
   - Se reconnecter (`POST /admin/login`)
   - Token expire après 24h

3. **Proposition ne s'affiche pas**:
   - Vérifier `data/proposed_destinations.json`
   - Vérifier le statut (pending/approved/rejected)

4. **Erreur lors de l'approbation**:
   - Vérifier que le fichier `destinations.json` est accessible
   - Vérifier les permissions en écriture

---

## 📊 Métriques à Suivre

### KPIs Admin

- **Temps de réponse moyen**: <24h idéal
- **Taux d'approbation**: 60-70% recommandé
- **Qualité des destinations**: Avis >4/5 après approbation
- **Engagement utilisateurs**: Nombre de propositions/mois

---

## 🎓 Formation

### Ressources

- `API_DOCUMENTATION.md` - Documentation complète API
- `TEST_GUIDE.md` - Guide de test
- `ARCHITECTURE.md` - Architecture système

### Vidéos (à créer)

1. "Comment se connecter en tant qu'admin"
2. "Modérer une proposition en 2 minutes"
3. "Gérer les cas difficiles"

---

## ✅ Checklist Admin Quotidienne

- [ ] Se connecter au système
- [ ] Consulter les nouvelles propositions
- [ ] Modérer toutes les propositions pending
- [ ] Vérifier les destinations récemment ajoutées
- [ ] Consulter les avis négatifs
- [ ] Backup des données (hebdomadaire)

---

## 🎯 Objectifs Admin

### Court Terme (1 mois)
- Traiter toutes les propositions en <24h
- Maintenir >95% de satisfaction utilisateurs
- Ajouter 10+ nouvelles destinations de qualité

### Moyen Terme (3 mois)
- Catalogue de 50+ destinations
- Processus de modération automatisé (IA)
- Dashboard admin visuel

### Long Terme (6 mois)
- Équipe de modérateurs
- Système de badges pour contributeurs
- API publique pour partenaires

---

**Bonne modération ! 🎉**

Pour toute question, consulter la documentation ou contacter le développeur.
