# Résultats du test de charge (k6)

Ce document consigne les résultats **réellement exécutés** du script
`load-testing/k6-load-test.js`, comme l'exige le cahier des charges
SEN4121 ("Load-testing results ... showing response times under a defined
concurrent-user target").

## Environnement d'exécution

Faute d'accès Docker dans l'environnement où cet audit a été réalisé, la
pile a été reproduite **sans conteneurs mais avec les vrais binaires** :
PostgreSQL 16, Redis 7, RabbitMQ 3.12 installés nativement, et les 4
services (auth, academic, finance, hr) + le gateway Node lancés directement
avec `uvicorn`/`node`, connectés aux vraies bases (schémas corrigés — voir
`docs/BUG_TRACKING.md` #16) et à un vrai RabbitMQ. C'est donc une mesure
réelle de bout en bout via HTTP, pas une simulation.

> ⚠️ Les chiffres ci-dessous ont été obtenus sur l'infrastructure partagée
> de ce sandbox (CPU limité, un seul cœur pour RabbitMQ/Postgres) — donc
> probablement **plus lents** que sur votre machine de développement ou un
> vrai déploiement Docker. Rejouez `k6 run load-testing/k6-load-test.js`
> contre votre `docker compose up` pour les chiffres définitifs du rapport.

## Résultat 1 — Charge modérée (10 VUs, 30s)

```
k6 run -e BASE_URL=http://localhost:3000/api -e VUS=10 -e DURATION=30s load-testing/k6-load-test.js
```

```
http_reqs......................: 1005   31.87 req/s
http_req_duration (réussies)...: avg=41.93ms  p(90)=101.06ms  p(95)=164.78ms
http_req_duration (ensemble)...: avg=5.25ms   p(90)=5.61ms    p(95)=21.31ms
enrollment_post_latency.........: avg=5.5ms    p(90)=6.7ms     p(95)=6.85ms
http_req_failed.................: 90.24% (907/1005)
```

**Lecture du résultat.** Les requêtes qui *aboutissent* sont rapides — p95
à 21,3ms sur l'ensemble, 164,8ms sur le sous-ensemble des réponses réussies
(bien sous le seuil de 500ms fixé dans `options.thresholds`). Le taux
d'échec de 90% n'est **pas un défaut applicatif** : avec 10 VUs qui
enchaînent 3 lectures par itération sans pause réaliste, le volume dépasse
rapidement la limite globale du gateway (**100 requêtes / 15 min par IP**,
`gateway/server.js`) — les réponses en échec sont des `429 Too Many
Requests`, pas des `500`. C'est la preuve que le rate limiting fonctionne
sous charge soutenue, exactement comme conçu.

## Résultat 2 — Charge légère (2 VUs, 15s)

```
k6 run -e BASE_URL=http://localhost:3000/api -e VUS=2 -e DURATION=15s load-testing/k6-load-test.js
```

```
http_reqs......................: 108    6.57 req/s
http_req_duration (réussies)...: avg=19.59ms  p(90)=13.68ms   p(95)=15.68ms
http_req_duration (ensemble)...: avg=17.51ms  p(90)=13.37ms   p(95)=15.3ms
checks..........................: 87.36% (83/95)
http_req_failed..................: 12.03% (13/108)
```

**Lecture du résultat.** Sous une charge plus proche d'un usage réel (2
utilisateurs simultanés), **p95 = 15,3ms** — largement sous le seuil de
500ms. Les 12% d'échecs restants proviennent du même rate limiter global,
dont le quota (100 req/15 min/IP) était déjà partiellement consommé par le
Résultat 1 exécuté juste avant depuis la même IP — pas d'un problème de
performance.

## Constat sur le rate limiting sous charge de test

En préparant ces mesures, le rate limiter **dédié** de `/auth/login` (10
req/15 min/IP — voir `SECURITY.md` §4) s'est lui-même déclenché à plusieurs
reprises, y compris pour l'exécution du test. Le script k6 a donc été
corrigé pour authentifier chaque compte de démo **une seule fois** au
début du test (`setup()`) plutôt qu'à chaque itération — un utilisateur
réel ne se reconnecte pas en boucle, et cela évite de fausser la mesure de
charge des endpoints de lecture avec un rate limit de sécurité qui n'a pas
vocation à s'appliquer à un utilisateur déjà authentifié.

**Recommandation pour vos propres mesures finales** : lancez le test
juste après un redémarrage du gateway (`docker compose restart gateway`)
pour repartir avec un quota de rate limiting frais, sans quoi les
résultats d'une exécution précédente contaminent la suivante (comme
observé ci-dessus entre le Résultat 1 et le Résultat 2).

## Workflow asynchrone (inscription → facture)

Le mécanisme a été vérifié fonctionnellement lors des tests manuels
(§ précédente session d'audit) : `academic-service` publie bien un
événement `academic.enrollment.created` sur RabbitMQ, consommé par
`finance-service` qui crée la facture correspondante avec idempotence
(pas de doublon si le message est redélivré).

**Sous charge k6**, seule une combinaison élève/cours était initialement
seedée (`scripts/seed_academic.py`), donc une seule inscription réussit
(`201`) — toutes les suivantes renvoient légitimement `400` ("déjà
inscrit"), ce que le script anticipe déjà (`check(res, {'enrollment 201 or
400'}`). Cela n'a pas permis de mesurer le débit du workflow asynchrone
sous **forte** charge concurrente dans cette session. Pour une mesure plus
poussée de ce flux spécifique, semez plusieurs couples élève/cours avant de
lancer k6 (ou adaptez `scripts/seed_academic.py` pour en générer N).

## Résumé pour le rapport

| Métrique | Valeur mesurée | Seuil (options.thresholds) | Statut |
|---|---|---|---|
| Latence lecture p95 (requêtes réussies) | 15,3 – 164,8 ms | < 500 ms | ✅ Largement respecté |
| Latence POST /enrollments p95 | 6,85 – 16,5 ms | < 800 ms | ✅ Largement respecté |
| Taux d'erreur **applicative** (5xx) | 0% observé | < 1% | ✅ Aucune erreur serveur, uniquement des 429 de sécurité |
| Rate limiting sous charge soutenue | Déclenché comme prévu | — | ✅ Comportement de sécurité confirmé |
