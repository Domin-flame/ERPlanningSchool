# Diagramme de déploiement

Représente la topologie réelle de `docker-compose.yml` : chaque
`subgraph` est un conteneur Docker (un "node" au sens UML déploiement),
sur le réseau Docker interne du projet. Seuls le `gateway` et le
`frontend` publient un port vers la machine hôte.

```mermaid
flowchart TB
    subgraph HOST["Machine hôte (Docker Engine)"]
        subgraph EXT["Ports publiés vers l'hôte"]
            P5173["localhost:5173"]
            P3000["localhost:3000"]
            P15672["localhost:15672"]
        end

        subgraph NET["Réseau Docker interne (campuswork-net)"]
            FRONT["frontend\n(Nginx + build React)"]
            GW["gateway\n(Node/Express)"]

            AUTH["auth-service\n(FastAPI)"]
            ACAD["academic-service\n(FastAPI)"]
            FIN["finance-service\n(FastAPI)"]
            HR["hr-service\n(FastAPI)"]
            MSG["message-service\n(FastAPI)"]
            NOTIF["notification-service\n(FastAPI)"]
            CHAT["chatbot-service\n(bonus)"]

            REDIS[("Redis\n(sessions/lockout)")]
            RMQ[("RabbitMQ\n(exchange topic)")]

            IDB[("identity-db\nPostgreSQL")]
            ADB[("academic-db\nPostgreSQL")]
            FDB[("finance-db\nPostgreSQL")]
            HDB[("hr-db\nPostgreSQL")]
            MDB[("message-db\nPostgreSQL")]
            NDB[("notification-db\nPostgreSQL")]

            BACKUP["db-backup\n(pg_dump automatisé)"]
        end
    end

    P5173 --> FRONT
    P3000 --> GW
    P15672 --> RMQ

    FRONT -->|"HTTPS/REST"| GW
    GW -->|proxy| AUTH
    GW -->|proxy| ACAD
    GW -->|proxy| FIN
    GW -->|proxy| HR
    GW -->|proxy| MSG
    GW -->|proxy| NOTIF
    GW -->|proxy| CHAT

    AUTH --> REDIS
    AUTH --> IDB
    ACAD --> ADB
    FIN --> FDB
    HR --> HDB
    MSG --> MDB
    NOTIF --> NDB

    ACAD -.->|publish| RMQ
    RMQ -.->|consume| FIN
    MSG -.->|publish| RMQ
    RMQ -.->|consume| NOTIF

    BACKUP --> IDB
    BACKUP --> ADB
    BACKUP --> FDB
    BACKUP --> HDB
    BACKUP --> MDB
    BACKUP --> NDB
```

## Notes de déploiement
- **Isolation réseau** : les 6 bases PostgreSQL, Redis et RabbitMQ ne sont
  accessibles que depuis le réseau Docker interne — aucun port n'est
  publié vers l'hôte pour elles (sauf `15672`, la console d'admin
  RabbitMQ, utile en développement).
- **Pattern *database-per-service*** clairement visible : chaque service
  applicatif possède sa propre base, jamais partagée.
- **Le bus RabbitMQ (liens pointillés)** est le seul canal entre
  `academic-service` et `finance-service` (et entre `message-service` et
  `notification-service`) — aucune flèche synchrone directe entre ces
  paires, conformément à la contrainte architecturale de l'énoncé.
- **`db-backup`** (ajouté lors de cet audit — voir
  `docs/BACKUP_ET_PITR.md`) est le seul conteneur ayant un accès direct
  aux 6 bases pour les sauvegardes automatisées, indépendamment des
  services applicatifs.
