# Sauvegarde automatisée et restauration Point-In-Time (PITR)

Ce document couvre le critère « Database Management » du cahier des charges
SEN4121 : *« Automated backup and point-in-time recovery procedure, tested
and documented with screenshots or logs »*.

> ⚠️ **Important** : les scripts et la configuration ci-dessous sont prêts à
> l'emploi, mais ils doivent être **exécutés dans votre environnement Docker
> réel** (`docker compose up`). Les captures d'écran/logs exigés par
> l'énoncé doivent être produits par vous en lançant réellement les
> commandes listées ici, puisqu'aucun conteneur Docker/PostgreSQL n'a pu
> être démarré dans l'environnement où ce document a été rédigé.

## 1. Vue d'ensemble de la stratégie

Deux mécanismes complémentaires, tous deux automatisés par le service
`db-backup` du `docker-compose.yml` :

| Mécanisme | Outil | Fréquence | Usage |
|---|---|---|---|
| Sauvegarde logique | `pg_dump` (compressé gzip) | Toutes les 24h (configurable) | Restaurer une base à un état passé précis (backup.sh / restore.sh) |
| Sauvegarde physique + WAL archivés | `pg_basebackup` + `archive_command` | Base backup manuel/périodique + WAL en continu | Restauration **Point-In-Time** à la seconde près (pitr) |

Les 6 bases (`identity-db`, `academic-db`, `finance-db`, `hr-db`,
`message-db`, `notification-db`) ont le WAL archiving activé
(`wal_level=replica`, `archive_mode=on`) vers un volume Docker dédié par
base (ex. `finance-wal`), et sont toutes couvertes par les sauvegardes
logiques automatiques.

## 2. Sauvegarde logique automatisée (pg_dump)

Le service `db-backup` du docker-compose exécute `postgres/backup/backup.sh`
en boucle : toutes les `BACKUP_INTERVAL_SECONDS` secondes (86400 = 24h par
défaut), il dump les 6 bases avec `pg_dump`, compresse chaque dump en
`.sql.gz`, et purge automatiquement les sauvegardes plus vieilles que
`RETENTION_DAYS` jours (7 par défaut).

Les dumps sont stockés dans le volume nommé `pg-backups`, organisés par
base : `/backups/<db_name>/<db_name>_<horodatage>.sql.gz`.

### Déclencher une sauvegarde immédiate (pour le test/démo)

```bash
docker compose up -d                     # tout le système doit être démarré
docker compose run --rm db-backup /scripts/backup.sh once
```

Attendu dans les logs : un dump réussi (`OK (taille)`) pour chacune des
6 bases. **C'est la capture d'écran/log à joindre au rapport.**

Pour lister les sauvegardes produites :

```bash
docker compose run --rm db-backup ls -R /backups
```

### Restaurer une base depuis un dump logique

```bash
docker compose run --rm db-backup /scripts/restore.sh \
    finance_db finance-db /backups/finance_db/finance_db_20260926_020000.sql.gz
```

Le script demande une confirmation explicite (`oui`) avant de supprimer et
recréer la base ciblée, puis importe le dump. **Test recommandé pour le
rapport** : modifier une ligne dans une table, prendre un dump (`once`),
modifier/supprimer la même ligne, puis restaurer — vérifier que la donnée
d'origine est revenue, et capturer les logs de chaque étape.

## 3. Restauration Point-In-Time (PITR)

### 3.1. Pourquoi le pg_dump seul ne suffit pas

Un dump logique ne permet de revenir qu'à l'instant **où il a été pris**
(ex. la sauvegarde de 02h00). Le PITR permet de restaurer une base à
**n'importe quel instant précis** entre deux base backups (ex. "juste avant
la requête accidentelle de 14h37"), en combinant :
1. Le dernier **base backup physique** (copie binaire complète du cluster)
   pris avant l'instant cible.
2. Les **fichiers WAL archivés** depuis ce base backup, rejoués jusqu'à
   l'instant cible exact.

### 3.2. Configuration déjà en place (docker-compose.yml)

Chaque service `*-db` est démarré avec :

```yaml
command: >
  postgres
  -c wal_level=replica
  -c archive_mode=on
  -c archive_command='test ! -f /var/lib/postgresql/wal_archive/%f && cp %p /var/lib/postgresql/wal_archive/%f'
  -c max_wal_senders=3
```

et monte un volume dédié (ex. `finance-wal:/var/lib/postgresql/wal_archive`)
qui accumule en continu tous les segments WAL générés — c'est ce flux qui
rend le PITR possible.

### 3.3. Étape 1 — Prendre un base backup physique

```bash
docker compose run --rm db-backup /scripts/pg_basebackup.sh finance-db
```

Résultat : une copie complète du cluster dans le volume `pg-backups`, sous
`/backups/basebackups/finance-db_<horodatage>/`. À planifier régulièrement
(ex. hebdomadaire) en plus des dumps logiques quotidiens.

### 3.4. Étape 2 — Restaurer à un instant précis (procédure manuelle)

> Le PITR nécessite d'arrêter temporairement le conteneur Postgres ciblé et
> de remplacer son volume de données par le base backup — ce sont des
> opérations destructives volontairement **non automatisées en un seul
> script**, pour éviter qu'une erreur de frappe n'écrase une base de
> production.

1. **Arrêter le service concerné** (ex. finance) :
   ```bash
   docker compose stop finance-db
   ```

2. **Vider le volume de données actuel** et y copier le base backup choisi :
   ```bash
   docker run --rm -v erplanningschool-master_finance-data:/target \
     -v erplanningschool-master_pg-backups:/backups \
     alpine sh -c "rm -rf /target/* && cp -a /backups/basebackups/finance-db_<HORODATAGE>/. /target/"
   ```
   *(adapter le préfixe du nom de volume à celui affiché par
   `docker volume ls` sur votre machine)*

3. **Créer le fichier `recovery.signal`** et configurer la cible de
   restauration dans `postgresql.auto.conf` du volume restauré :
   ```bash
   docker run --rm -v erplanningschool-master_finance-data:/target alpine sh -c "
     touch /target/recovery.signal
     cat >> /target/postgresql.auto.conf <<EOF
   restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'
   recovery_target_time = '2026-09-26 14:36:00+00'
   recovery_target_action = 'promote'
   EOF
   "
   ```
   Remplacer `recovery_target_time` par l'instant exact souhaité (juste
   avant l'incident).

4. **Redémarrer le service** :
   ```bash
   docker compose start finance-db
   docker compose logs -f finance-db
   ```
   PostgreSQL détecte `recovery.signal`, rejoue les WAL archivés depuis le
   base backup jusqu'à `recovery_target_time`, puis se "promeut" en base
   normale, prête à l'écriture. **C'est ce log de démarrage (mode
   "recovery" → "database system is ready to accept connections") qui doit
   être capturé pour le rapport.**

5. Vérifier les données restaurées :
   ```bash
   docker compose exec finance-db psql -U campus_user -d finance_db -c "SELECT ..."
   ```

### 3.5. Résumé pour le rapport

Pour le livrable "tested and documented with screenshots or logs", capturer
au minimum :
- Le log de `backup.sh once` réussi pour les 6 bases (§2).
- Une restauration logique réussie avec `restore.sh` (§2, test recommandé).
- Le log de `pg_basebackup.sh` réussi (§3.3).
- Le log de démarrage PostgreSQL en mode recovery → promotion réussie après
  une restauration PITR (§3.4, étape 4).
