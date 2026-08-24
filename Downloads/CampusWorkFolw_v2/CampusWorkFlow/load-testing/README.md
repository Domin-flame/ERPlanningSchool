# Tests de charge — CampusWorkflow

## Pourquoi ce dossier

Le cahier des charges demande de vérifier la **sécurité** et la **vitesse**
du système sous forte charge, avec un focus particulier sur le workflow
asynchrone RabbitMQ (`inscription -> facture`). Ce dossier contient un
script [k6](https://k6.io) prêt à l'emploi qui couvre les deux angles.

## Prérequis

1. La stack complète doit tourner : `docker compose up --build -d`
   (depuis la racine du projet).
2. Installer k6 : https://k6.io/docs/get-started/installation/
   - macOS : `brew install k6`
   - Linux : voir la doc officielle (paquet `.deb`/`.rpm` ou binaire statique)
   - Windows : `choco install k6` ou `winget install k6`

## Lancer le test

```bash
k6 run load-testing/k6-load-test.js
```

Paramètres ajustables (valeurs par défaut : 20 utilisateurs virtuels
pendant 60 secondes) :

```bash
k6 run -e BASE_URL=http://localhost:3000/api -e VUS=50 -e DURATION=2m \
       load-testing/k6-load-test.js
```

## Ce que le script mesure

| Aspect | Comment |
|---|---|
| **Vitesse (latence)** | `http_req_duration` sur les lectures académique/finance/RH — seuil : p(95) < 500 ms |
| **Vitesse du flux async** | `enrollment_post_latency` — le temps de réponse de `POST /academic/enrollments/` reste bas (< 800 ms au p95) *même sous forte charge*, preuve que academic-service ne bloque jamais en attendant finance-service |
| **Sécurité / robustesse** | `http_req_failed` — moins de 1% d'erreurs serveur (5xx) tolérées sous charge |
| **Correction fonctionnelle sous charge** | Après chaque inscription réussie, le script attend 2 s puis vérifie via `GET /finance/invoices` que la facture `FAC-ENR-<id>` a bien été créée par le consumer RabbitMQ — preuve que le découplage ne perd pas de messages sous charge concurrente |
| **Rate limiting** | Lancer le script avec un grand nombre de VUs (`-e VUS=200`) fait apparaître des réponses `429` sur `/api/auth/login` une fois le quota du gateway dépassé — comportement attendu (voir `SECURITY.md`) |

## Lire les résultats

À la fin de l'exécution, k6 affiche un résumé avec les percentiles de
latence (p90/p95/p99), le taux d'erreurs, et le statut des seuils
(`thresholds`) définis dans le script — `✓` si le système respecte les
objectifs de vitesse/sécurité fixés, `✗` sinon.

Le compteur custom `invoices_confirmed_async` indique combien
d'inscriptions déclenchées pendant le test ont effectivement abouti à une
facture visible côté Finance — un bon indicateur de la fiabilité du
message broker sous charge.

## Alternative JMeter

Le même scénario (login -> lecture -> inscription -> vérification facture)
peut être reproduit dans Apache JMeter avec un plan de test classique :
1. Thread Group (N utilisateurs, boucle infinie ou durée fixe)
2. HTTP Request `POST /api/auth/login` + Extracteur JSON (`access_token`)
3. HTTP Header Manager avec `Authorization: Bearer ${access_token}`
4. HTTP Request `GET /api/academic/courses/`, `GET /api/finance/invoices`
5. HTTP Request `POST /api/academic/enrollments/`
6. Constant Timer (2000 ms) puis `GET /api/finance/invoices` + Assertion
   sur la présence de `FAC-ENR-<id>`

k6 a été retenu comme script fourni car il est scriptable en JavaScript
(plus simple à versionner et à relire qu'un fichier `.jmx` XML), mais les
deux outils sont interchangeables pour cet usage.
