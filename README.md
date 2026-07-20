# CampusWorkflow Auth Service

Projet de démonstration pour le CA : service d'authentification avec FastAPI, React, Docker, mots de passe hachés et JWT.

## Convention Git

- Branche principale : `main`
- Fonctionnalites : `feature/nom-court`
- Corrections : `fix/nom-court`
- Documentation : `docs/nom-court`

Exemples :

- `feature/login`
- `feature/admin-only-page`
- `fix/jwt-expiration`

## Lancer avec Docker

Depuis la racine du projet :

```bash
docker compose up --build
```

Services :

- Frontend React : http://localhost:5173
- Backend FastAPI : http://localhost:8000
- Documentation API : http://localhost:8000/docs

## Comptes de test

Au demarrage, le backend cree automatiquement :

| Role | Email | Mot de passe |
| --- | --- | --- |
| Admin | admin@campus.local | Admin123! |
| Student | student@campus.local | Student123! |

## Endpoints utiles

- `POST /auth/register` : inscription
- `POST /auth/login` : connexion et generation du JWT
- `GET /auth/me` : utilisateur connecte
- `GET /admin/secret` : page reservee aux Admins

## Explication rapide pour l'examinateur

Le mot de passe n'est jamais stocke en texte brut. Lors de l'inscription, le backend utilise `bcrypt` pour transformer le mot de passe en empreinte irreversible. Quand l'utilisateur se reconnecte, le backend compare le mot de passe fourni avec cette empreinte.

Apres une connexion reussie, le backend cree un JWT signe avec une cle secrete. Ce jeton contient l'identite de l'utilisateur, son email et son role. Quand le frontend appelle une route protegee, il envoie ce JWT dans l'en-tete `Authorization: Bearer ...`. Le backend verifie la signature et sait que le jeton n'a pas ete modifie.

## Exemple de test live

Si l'examinateur demande : "seuls les Admins peuvent voir cette page", la route backend doit utiliser la dependance `require_admin` :

```python
@app.get("/admin/secret")
def admin_secret(current_user: User = Depends(require_admin)):
    return {"message": "Bienvenue Admin"}
```

