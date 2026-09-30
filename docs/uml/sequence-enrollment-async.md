# Diagramme de séquence — Workflow asynchrone : inscription → facture

**C'est le diagramme exigé par l'énoncé** ("at least two sequence
diagrams, one covering the cross-service asynchronous workflow"). Il
couvre l'exemple donné explicitement : *"a new student enrollment
triggering a finance invoice"*, implémenté via RabbitMQ (exchange
`topic`) entre `academic-service` (producteur) et `finance-service`
(consommateur), sans appel HTTP synchrone entre les deux.

```mermaid
sequenceDiagram
    actor S as Étudiant
    participant GW as API Gateway
    participant AC as academic-service
    participant ADB as academic-db
    participant MQ as RabbitMQ (exchange topic)
    participant FN as finance-service
    participant FDB as finance-db

    S->>GW: POST /api/academic/enrollments/ {student_id, course_offering_id}
    GW->>GW: verifyToken + rbacGuard (student autorisé en écriture académique)
    GW->>AC: proxy POST /enrollments/

    AC->>ADB: SELECT enrollment WHERE student_id AND course_offering_id
    alt déjà inscrit
        ADB-->>AC: ligne existante
        AC-->>GW: 400 "Déjà inscrit"
        GW-->>S: 400
    else nouvelle inscription
        AC->>ADB: INSERT INTO enrollments (...)
        ADB-->>AC: enrollment_id
        AC-->>GW: 201 {enrollment_id, ...}
        GW-->>S: 201 (réponse immédiate — AC ne bloque JAMAIS sur Finance)

        Note over AC,MQ: Publication asynchrone — fire-and-forget
        AC->>MQ: publish("academic.enrollment.created", {enrollment_id, student_id, course_offering_id})

        Note over MQ,FN: Traitement en arrière-plan, découplé dans le temps
        MQ->>FN: deliver("academic.enrollment.created")
        FN->>FDB: SELECT invoice WHERE numero_facture = 'FAC-ENR-{enrollment_id}'
        alt facture déjà créée (message redélivré)
            FDB-->>FN: ligne existante
            FN->>MQ: ack (idempotent — aucune action supplémentaire)
        else première réception
            FDB-->>FN: aucune ligne
            FN->>FDB: INSERT INTO invoice (numero_facture, montant_total, id_student, statut='EMISE')
            FN->>FDB: INSERT INTO invoice_line (description, prix_unitaire)
            FDB-->>FN: id_invoice
            FN->>MQ: ack
        end
    end

    Note over S,FN: Plus tard — l'étudiant consulte ses factures
    S->>GW: GET /api/finance/invoices
    GW->>FN: proxy
    FN->>FDB: SELECT invoice WHERE id_student = :id
    FDB-->>FN: [FAC-ENR-{enrollment_id}, ...]
    FN-->>GW: 200 [...]
    GW-->>S: 200 — la facture créée en arrière-plan est visible
```

## Points clés démontrés par ce diagramme
1. **Découplage réel** : `academic-service` répond `201` à l'étudiant
   **avant** que `finance-service` ait traité l'événement — la latence de
   Finance n'affecte jamais le temps de réponse de l'inscription (mesuré
   dans `load-testing/RESULTS.md` : p95 ≈ 6,85–16,5 ms sur ce endpoint,
   indépendamment de la charge sur Finance).
2. **Idempotence** : si RabbitMQ redélivre le même message (ex : crash du
   consommateur avant l'`ack`), `finance-service` vérifie l'existence
   préalable de la facture avant d'en créer une — aucune facture en
   double, exigence explicite du cahier des charges.
3. **Aucun appel HTTP direct** entre `academic-service` et
   `finance-service` — seul le bus de messages les relie, ce qui satisfait
   la contrainte architecturale obligatoire de l'énoncé.
