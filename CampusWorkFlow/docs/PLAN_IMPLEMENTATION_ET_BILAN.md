# CampusWorkFlow — Bilan et plan d'implementation

Date : 24 aout 2026

## 1. Bilan des travaux realises aujourd'hui

### Authentification, splash et onboarding

- La splash screen est affichee directement a l'ouverture de l'application.
- La navigation vers l'onboarding est memorisee avec `localStorage`.
- L'onboarding apparait uniquement lors de la premiere ouverture.
- Les sorties par « Passer » et par la derniere etape enregistrent la fin de l'onboarding.
- Le logo est centralise avec le composant `AppLogo`.
- Apres la splash, l'utilisateur est dirige vers `/onboarding` ou `/login` selon son historique.

### Portail etudiant

- Le dashboard etudiant utilise un endpoint agrege du module academique :
  `GET /academic/student/me/overview`.
- Les donnees ne sont plus fabriquees cote frontend pour les cours, notes, credits et planning.
- Le dashboard affiche les informations academiques disponibles : niveau, cycle, filiere, faculté et semestre.
- La moyenne generale, son evolution par rapport au semestre precedent et les credits valides sont calcules a partir des notes backend.
- Les factures etudiantes sont filtrees par l'utilisateur courant via Finance :
  `GET /finance/students/me/invoices`.
- Une page complete de releve de notes a ete ajoutee avec notes CC/SN par matiere.
- Le bouton PDF utilise l'impression native du navigateur pour enregistrer le releve en PDF.

### Messagerie

- Les conversations sont chargees depuis le service de messagerie.
- Les messages sont charges par conversation depuis la base.
- L'envoi, la modification et la suppression d'un message sont connectes aux endpoints backend.
- La modification et la suppression sont limitees a l'auteur du message.
- La creation de conversation utilise l'annuaire Auth.
- Les destinataires sont filtres selon le role cote interface et reverifies par le gateway.
- Pour un etudiant, les destinataires autorises sont les etudiants, professeurs, Academic et Finance.
- L'archivage des conversations n'est pas encore implemente.

### Autorisation academique

- Une couche d'autorisation objet a ete ajoutee dans `module_academique/app/authz.py`.
- Un professeur ne peut modifier que les cours qui lui sont affectes.
- Les controles sont appliques aux examens, notes, sessions, presences, creneaux et offres de cours modifiees ou supprimees.
- La Direction academique conserve l'acces global.
- La correspondance entre l'identite Auth et le compte academique se fait par email.

### Notifications

- La page Notifications affiche les notifications personnelles venant de la base.
- Les actions « Marquer comme lu », « Archiver » et « Supprimer » sont connectees au backend.
- Le champ persistant `archived` a ete ajoute au modele Notification.
- Une mise a niveau PostgreSQL ajoute cette colonne aux bases existantes.
- Les notifications sont filtrees par utilisateur authentifie.

### RH et comptes Auth

- Les endpoints Auth de gestion des comptes ont ete ajoutes :
  - `GET /auth/users`
  - `PATCH /auth/users/{id}`
- Les actions disponibles sont l'activation, la desactivation, la validation, le refus et le changement de role.
- L'acces est limite a RH et a la Direction academique.
- L'endpoint RH `PATCH /hr/employees/{id}` a ete ajoute pour modifier une fiche employe.
- La validation du salaire et des champs modifies est faite cote backend.

### Analytics et espace enseignant

- Le service frontend `analyticsService.js` a ete ajoute.
- Analytics utilise l'agregation SQL du module academique via :
  `GET /academic/analytics/summary`.
- Les imports errones dans Analytics et TeacherDashboard ont ete corriges.
- Le service `teacherService.js` a ete ajoute pour charger les cours, etudiants, examens, notes, sessions et presences reelles de l'enseignant.

### Ecran Forbidden

- La page Forbidden et sa route ont ete supprimees.
- Une URL interdite redirige maintenant directement vers le dashboard du role connecte.
- Les menus restent filtres par role afin de ne pas afficher de liens inutilisables.

## 2. Etat technique actuel

Les controles statiques des fichiers modifies ne signalent pas d'erreur. La compilation Vite a ete lancee plusieurs fois, mais le terminal de travail a parfois perdu l'acces a `npm`, `node` ou `python`; une validation complete devra donc etre rejouee dans un environnement installe correctement.

Points a surveiller avant mise en production :

- ajouter ou verifier les migrations SQL officielles pour les nouvelles colonnes ;
- executer les tests backend dans Docker ou avec Python disponible ;
- verifier les contrats Auth, Academic, RH, Finance et Message avec des donnees de test ;
- securiser aussi les connexions WebSocket, actuellement depourvues d'une verification JWT complete ;
- remplacer progressivement les aggregations frontend couteuses de l'espace enseignant par un endpoint backend agrege.

## 3. Plan futur pour Calendar

### Phase 0 — Stabilisation

1. Executer les builds frontend et les tests de chaque module.
2. Corriger les migrations et confirmer la structure des bases.
3. Verifier les roles et permissions sur les routes gateway et microservices.
4. Confirmer les correspondances entre `user_account.id`, utilisateurs academiques, employes RH et `student_ref` Finance.
5. Ajouter des tests d'integration pour les permissions objet.

### Phase 1 — MVP Calendar

Creer un module Calendar central avec trois notions distinctes :

- evenement : element visible dans le calendrier ;
- rappel : alerte programmee pour un evenement ;
- notification : message emis lorsqu'un rappel arrive a echeance.

Tables minimales recommandees :

```text
calendar_events
- id
- user_id
- title
- description
- event_date
- start_time
- end_time
- source_module
- source_type
- source_id
- status
- created_at
- updated_at

calendar_reminders
- id
- event_id
- user_id
- remind_at
- channel
- status
- sent_at
- created_at
```

Endpoints MVP :

```text
GET    /calendar/events
POST   /calendar/events
GET    /calendar/events/{id}
PATCH  /calendar/events/{id}
DELETE /calendar/events/{id}
POST   /calendar/events/{id}/reminders
PATCH  /calendar/reminders/{id}
DELETE /calendar/reminders/{id}
```

Regles essentielles :

- chaque evenement doit avoir un proprietaire ou des participants ;
- `source_module`, `source_type` et `source_id` identifient l'origine metier ;
- un utilisateur ne voit que ses evenements et ceux qui lui sont partages ;
- les donnees sensibles Finance et RH doivent appliquer leurs permissions propres ;
- le frontend ne doit pas decider seul de la visibilite.

### Phase 2 — Branchement du frontend Calendar

1. Remplacer les appels directs `personal/events`, `academic/events`, `finance/events` et `hr/events` par l'API Calendar.
2. Conserver les couleurs par module et les filtres de l'interface.
3. Implementer la creation d'un rappel manuel.
4. Ajouter les choix de rappel : a l'heure, 5 minutes, 30 minutes, 1 heure, 1 jour avant ou personnalise.
5. Ajouter la repetition : aucune, quotidienne, hebdomadaire, mensuelle.
6. Ajouter une vue « Mes rappels » dans Calendar.

### Phase 3 — Evenements automatiques par domaine

#### Academic

- examen programme ;
- seance de cours ;
- soutenance ;
- inscription a valider ;
- publication de notes.

#### Finance

- echeance de facture ;
- paiement confirme ;
- paiement partiel ;
- retard de paiement.

#### RH

- demande de conge ;
- conge approuve ou refuse ;
- expiration de contrat ;
- validation d'une inscription ou d'un profil employe.

Chaque module doit publier ou appeler Calendar avec une reference metier stable, sans dupliquer la logique metier dans Calendar.

### Phase 4 — Notifications et worker

1. Ajouter une table `calendar_notifications` ou reutiliser le service Notification avec une reference `source_event_id`.
2. Creer un worker qui recherche les rappels :

```sql
WHERE remind_at <= NOW()
  AND status = 'PENDING'
```

3. Marquer chaque rappel comme traite de maniere idempotente.
4. Emettre une notification in-app dans le service Notification.
5. Ajouter l'email ensuite, via SendGrid ou un SMTP configure.
6. Ajouter les preferences utilisateur par canal : in-app, email, push.

SendGrid ne doit pas etre une dependance du premier MVP. Il devient utile lorsque les notifications internes sont fiables et que le worker est teste.

### Phase 5 — Message broker et fiabilite

Lorsque les flux directs sont stabilises, utiliser RabbitMQ deja present dans le projet pour publier des evenements tels que :

```text
EXAM_SCHEDULED
PAYMENT_DUE
PAYMENT_CONFIRMED
LEAVE_REQUESTED
LEAVE_APPROVED
CONTRACT_EXPIRING
REGISTRATION_PENDING
```

Le service Calendar et le service Notification pourront alors consommer ces evenements sans coupler directement tous les modules entre eux.

### Phase 6 — Tests et exploitation

- tests de permissions par role et par proprietaire ;
- tests d'idempotence des evenements ;
- tests de recurrence et de fuseau horaire ;
- tests du worker lorsque Calendar est ferme ;
- tests d'integration RabbitMQ ;
- tests de non-divulgation des donnees Finance/RH ;
- supervision des erreurs d'envoi email et des rappels echoues.

## 4. Ordre recommande

```text
1. Stabiliser les bases et les permissions
2. Finaliser notifications in-app
3. Creer Calendar MVP events/reminders
4. Brancher le frontend Calendar
5. Integrer Academic, Finance et RH
6. Ajouter le worker de rappels
7. Ajouter email SendGrid/SMTP
8. Ajouter RabbitMQ et les evenements automatiques
9. Ajouter recurrence avancee et push
```

L'objectif est d'obtenir rapidement un Calendar fiable et utile, sans transformer la premiere implementation en chantier distribue difficile a tester.
