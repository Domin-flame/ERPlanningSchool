# Diagramme de séquence — Connexion et rotation du refresh token

Couvre `POST /auth/login`, `POST /auth/refresh` (avec rotation à usage
unique) et `POST /auth/logout`, tel qu'implémenté dans
`module_authentification/app/main.py`.

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant GW as API Gateway
    participant A as auth-service
    participant R as Redis
    participant DB as identity-db (PostgreSQL)

    U->>GW: POST /api/auth/login {email, password}
    GW->>A: proxy (route publique, pas de vérif JWT)
    A->>R: get_lock_ttl(email)
    alt compte verrouillé
        R-->>A: ttl > 0
        A-->>GW: 429 "Compte verrouillé"
        GW-->>U: 429
    else compte actif
        A->>DB: SELECT user_account WHERE email = :email
        DB-->>A: hashed_password, role
        A->>A: bcrypt.verify(password, hashed_password)
        alt mot de passe invalide
            A->>R: record_failed_login(email)
            R-->>A: nb_échecs
            opt nb_échecs >= 5
                A->>R: lock_account(email, 15min)
            end
            A-->>GW: 401 "Identifiants invalides"
            GW-->>U: 401
        else mot de passe valide
            A->>R: clear_failed_login(email)
            A->>A: crée access_token (jti1, exp 24h)
            A->>A: crée refresh_token (jti2, exp 7j)
            A-->>GW: 200 {access_token, refresh_token}
            GW-->>U: 200
        end
    end

    Note over U,A: Plus tard — l'access token approche de son expiration
    U->>GW: POST /api/auth/refresh {refresh_token}
    GW->>A: proxy
    A->>A: décode JWT, extrait jti2
    A->>R: is_refresh_jti_used(jti2) ?
    alt jti2 déjà utilisé (rejeu)
        R-->>A: true
        A-->>GW: 401 "Déjà utilisé"
        GW-->>U: 401
    else jamais utilisé
        R-->>A: false
        A->>R: mark_refresh_jti_used(jti2, ttl_restant)
        A->>A: crée nouveau access_token (jti3) + refresh_token (jti4)
        A-->>GW: 200 {access_token, refresh_token}
        GW-->>U: 200
        Note over U: L'ANCIEN refresh_token (jti2) est désormais invalide
    end

    U->>GW: POST /api/auth/logout {refresh_token}, Authorization: Bearer ...
    GW->>A: proxy
    A->>R: blacklist_token(access_token, ttl_restant)
    A->>R: mark_refresh_jti_used(jti_refresh, ttl_restant)
    A-->>GW: 200 "Déconnecté"
    GW-->>U: 200
```
