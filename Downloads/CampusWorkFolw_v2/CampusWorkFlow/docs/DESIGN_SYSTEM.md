# CampusWorkflow — Design System (v1.0)

**Statut**: ✅ Complète et prête à l'intégration  
**Dernière mise à jour**: Août 2026

---

## 🎯 Vue d'ensemble

CampusWorkflow est une plateforme SaaS universitaire moderne et accessible avec un design professionnel centré sur la productivité administrative. Le système de design couvre tous les composants, patterns et interactions nécessaires pour construire une expérience cohérente et intuitive.

## 📋 Table des matières

1. [Principes](#principes)
2. [Palette de couleurs](#palette-de-couleurs)
3. [Typographie](#typographie)
4. [Composants](#composants)
5. [Layout & Navigation](#layout--navigation)
6. [Patterns d'interaction](#patterns-dinteraction)
7. [Accessibilité](#accessibilité)
8. [Fichiers de style](#fichiers-de-style)
9. [Intégration](#intégration)

---

## 🎨 Principes

### Valeurs de design
- **Professionnel**: Confiance, autorité, fiabilité
- **Clair**: Information lisible, décisions faciles
- **Efficace**: Workflows rapides, productivité maximale
- **Accessible**: Utilisable par tous, incluant handicaps
- **Chaleureux**: Mascotte renard sympathique, moins stéréotypé

### Caractéristiques principales
- Plateforme responsive desktop-first avec support tablet et mobile
- Sidebar collapsible pour optimiser l'espace
- Système de badges colorés pour les statuts
- Mascotte renard orange utilisée intelligemment (empty states, erreurs, succès)
- Support WCAG 2.1 AA pour accessibilité
- Animations fluides et réducibles pour utilisateurs sensibles

---

## 🎨 Palette de couleurs

### Couleurs primaires
| Nom | Hex | Usage |
|-----|-----|-------|
| Orange CW | `#FF6B00` | Actions principales, marque, mascotte |
| Orange clair | `#FF8A2A` | Hover states, illustrations |
| Orange pâle | `#FFF3E8` | Fonds, cartes actives, KPI backgrounds |

### Couleurs secondaires
| Nom | Hex | Usage |
|-----|-----|-------|
| Bleu marine | `#0F2742` | Navigation, titres, structure |
| Bleu nuit | `#071827` | Header sombre, contrastes premium |

### Couleurs neutres
| Nom | Hex | Usage |
|-----|-----|-------|
| Gris 900 | `#1A1D29` | Texte principal, contraste fort |
| Gris 600 | `#64748B` | Texte secondaire, labels |
| Gris 200 | `#E2E8F0` | Bordures, séparateurs |
| Gris 100 | `#F5F7FA` | Fond global, hover states |

### Couleurs statut
| Statut | Couleur | Hex |
|--------|---------|-----|
| Succès | Vert | `#22C55E` |
| Attention | Ambre | `#F59E0B` |
| Erreur | Rouge | `#EF4444` |
| Info | Bleu | `#3B82F6` |

**Règle**: Toutes les couleurs de statut sont accompagnées d'un texte descriptif ou d'une icône pour accessibilité.

---

## 📝 Typographie

### Famille de police
```
Font stack: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial
```

### Hiérarchie typographique
| Élément | Taille | Poids | Interligne |
|---------|--------|-------|-----------|
| Titre page | 32px | 700 | 1.2 |
| Titre section | 24px | 600 | 1.2 |
| Titre card | 18px | 600 | 1.2 |
| Body | 16px | 400 | 1.5 |
| Label | 14px | 500 | 1.5 |
| Small | 13px | 400 | 1.5 |
| Extra-small | 12px | 500 | 1.2 |

### Utilisation
- Maximiser la lisibilité
- Espacement cohérent entre éléments
- Contraste de poids pour hiérarchie
- Pas de justification du texte

---

## 🧩 Composants

### Boutons
Tous les boutons supportent les états: default, hover, active, focus, disabled

**Variantes**:
- **Primary** (Orange): Actions principales - Save, Create, Submit
- **Secondary** (Bleu marine): Actions secondaires - View Details
- **Outline** (Bordé): Actions légères - Cancel, Reset
- **Ghost** (Transparent): Liens-buttons - Infos supplémentaires
- **Danger** (Rouge): Suppressions - Delete, Remove

**Tailles**: `sm` (petit), `base` (standard), `lg` (grand)

```html
<button class="btn btn-primary">Save Changes</button>
<button class="btn btn-secondary">View Details</button>
<button class="btn btn-outline">Cancel</button>
<button class="btn btn-icon">🔍</button>
```

### Cartes
**Types**:
- **Card**: Conteneur générique avec header, body, footer
- **KPI Card**: Statistique avec icône, valeur, variation
- **Course Card**: Horizontale ou avec progression
- **Student Card**: Infos condensées

Tous les types supportent hover state pour interactivité.

### Badges & Tags
Système de statuts coloré:
- Succès (vert), Complété (vert), En cours (bleu)
- En attente (ambre), Annulé (rouge), Retardé (rouge)
- Brouillon (gris), Approuvé (vert), Rejeté (rouge)

```html
<span class="badge badge-active">Active</span>
<span class="badge badge-pending">Pending</span>
<span class="badge badge-error">Error</span>
```

### Formulaires
**Éléments**:
- Inputs texte, password, search, select, date
- Checkboxes, radio buttons, toggles
- File upload (drag-and-drop)
- Validation (error, success states)

**Tous avec**:
- Label associé
- Focus visible
- Texte d'aide optionnel
- Messages d'erreur clairs

### Tableaux
- Colonnes triables
- Pagination
- Bulk selection
- Actions par ligne
- Badges de statut
- Empty state

### Modals
Overlay semi-transparent + dialogue centré
- Header avec titre + close
- Body avec contenu scrollable
- Footer avec actions

### Toasts
Notifications positionnées bas-droit:
- Success (vert), Error (rouge), Warning (ambre), Info (bleu)
- Animation slide-in
- Auto-fermeture optionnelle

---

## 🗂️ Layout & Navigation

### Structure globale
```
┌─────────────────────────────────────────┐
│           HEADER (64px)                 │
├──────────┬──────────────────────────────┤
│          │                              │
│ SIDEBAR  │      MAIN CONTENT            │
│ (240px)  │      (fluid)                 │
│          │                              │
└──────────┴──────────────────────────────┘
```

### Sidebar
- **Expanded**: 240px largeur
- **Collapsed**: 72px (icônes + tooltips)
- Bleu marine (`#0F2742`)
- Items avec icône + label
- État actif = fond orange pâle
- User profile en bas

### Header
- Bleu marine ou blanc selon contexte
- Breadcrumbs à gauche
- Titre page
- Recherche globale
- Notifications, messages
- Avatar utilisateur

### Responsive
- **Desktop** (1440px): Sidebar expanded 240px
- **Tablet** (1024px): Sidebar collapsed 72px
- **Mobile** (768px): Sidebar devient bottom nav 64px

---

## ⚡ Patterns d'interaction

### Hover states
Tous les éléments interactifs doivent avoir un état visuel au survol:
- Boutons: changement couleur + ombre
- Cartes: légère ombre accrue
- Lignes table: fond léger gris

### Focus visible
Tous les éléments au clavier doivent avoir:
- Outline 2px orange (`#FF6B00`)
- Offset 2px
- Visible sur tous les navigateurs

### États de chargement
- Skeleton placeholders pour cartes et tables
- Spinner discret au centre
- Progress bar avec pourcentage
- Bouton avec état loading

### États d'erreur
- Input: bordure rouge + message d'erreur
- Form: résumé erreurs en haut
- Toast: notification rouge
- Page entière: 404 avec renard perdu

### États de succès
- Toast vert avec checkmark
- Badge success
- Renard célébrant (optional)
- Message de confirmation

---

## ♿ Accessibilité

### Contraste
Tous les textes ont ratio contraste ≥ 4.5:1:
- Texte noir sur blanc: ✅
- Texte blanc sur navy: ✅
- Texte sur couleurs: toujours vérifiées

### Navigation au clavier
- Tab order logique de haut en bas
- Tous les boutons cliquables au clavier
- Dropdowns ouverts avec Enter/Space
- Échap pour fermer modals

### Écran tactile (36x36px minimum)
- Zones cliquables >= 36x36px
- Espacement suffisant entre éléments
- Pas de hover uniquement (inclure focus)

### Texte alternatif
- Images ont `alt` descriptif
- Icônes avec `aria-label` ou titre
- Couleur + texte/icône pour statuts

### Réduction de mouvement
`@media (prefers-reduced-motion: reduce)` - transitions désactivées

---

## 📦 Fichiers de style

### Structure du projet
```
frontend/src/
├── styles/
│   ├── design-tokens.css    ← Variables CSS, palette, spacing
│   ├── components.css       ← Styles des composants réutilisables
│   ├── layout.css           ← Sidebar, header, main layout
│   └── index.css            ← Import principal
├── assets/
│   ├── logo.svg
│   └── mascot-fox.svg
└── main.tsx                 ← Point d'entrée app
```

### Variables CSS principales (design-tokens.css)
```css
:root {
  /* Couleurs */
  --cw-orange: #FF6B00;
  --cw-navy: #0F2742;
  --cw-text-primary: #1A1D29;
  
  /* Spacing */
  --cw-space-8: 0.5rem;
  --cw-space-16: 1rem;
  --cw-space-24: 1.5rem;
  
  /* Layout */
  --cw-sidebar-expanded: 240px;
  --cw-sidebar-collapsed: 72px;
  
  /* Autres... */
}
```

---

## 🔧 Intégration

### Étape 1: Ajouter les styles au projet
```tsx
// frontend/src/main.tsx
import './styles/design-tokens.css';
import './styles/components.css';
import './styles/layout.css';
```

### Étape 2: Utiliser les classes CSS
```html
<!-- Bouton primaire -->
<button class="btn btn-primary">Click me</button>

<!-- Card -->
<div class="card">
  <div class="card-header">
    <h2 class="card-title">Title</h2>
  </div>
  <div class="card-body">Content</div>
</div>

<!-- Grid 4 colonnes -->
<div class="grid grid-4">
  <div class="kpi-card">...</div>
</div>
```

### Étape 3: Créer des composants React réutilisables
Exemple (optionnel, pour cohérence):
```tsx
// components/Button.tsx
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'base',
  ...props
}) => (
  <button 
    className={`btn btn-${variant} btn-${size}`}
    {...props}
  />
);
```

### Étape 4: Tester la responsivité
- Desktop: Sidebar 240px, layout complet
- Tablet: Sidebar 72px, grilles 2 colonnes
- Mobile: Bottom nav, grilles 1 colonne

---

## 🎭 Mascotte Renard

### Utilisations appropriées
- ✅ Empty states ("Aucun cours trouvé")
- ✅ Erreurs 404 (renard perdu)
- ✅ États de succès (renard célébrant)
- ✅ Illustrations contextuelles légères
- ❌ Pas de surcharge (max 1-2 par page)

### Variantes disponibles
- Neutre (standard)
- Avec livre (courses)
- Avec calculatrice (finance)
- Avec documents (HR)
- Avec calendrier (calendar)
- Avec enveloppe (messages)

### Fichier principal
`frontend/src/assets/mascot-fox.svg` - SVG vectoriel simple

---

## ✅ Checklist d'implémentation

- [ ] Importer tous les fichiers CSS dans `main.tsx`
- [ ] Vérifier les variables CSS chargent correctement
- [ ] Tester tous les boutons sur tous les variants
- [ ] Tester responsive sur desktop/tablet/mobile
- [ ] Vérifier contraste et accessibilité avec DevTools
- [ ] Créer composants React pour réutilisabilité
- [ ] Tester focus/keyboard navigation
- [ ] Ajouter mascotte SVG aux empty states

---

## 🚀 Prochaines étapes

1. **Créer des composants React** réutilisables (Button, Card, KpiCard, etc.)
2. **Intégrer aux pages** existantes (Dashboard, Courses, Finance, HR)
3. **Implémenter les écrans** manquants (Chat, Calendar, Exports)
4. **Tester avec utilisateurs réels** pour accessibilité et UX
5. **Documenter les variantes** de mascotte

---

**Version**: 1.0  
**Statut**: Production-ready  
**Licence**: © 2026 CampusWorkflow
