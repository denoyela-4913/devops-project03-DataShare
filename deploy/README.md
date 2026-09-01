# deploy/ — environnement de dev

Fournit les dépendances externes du backend : **PostgreSQL** et **MinIO** (stockage compatible S3).

## Démarrer

```bash
cd deploy
cp .env.example .env      # ajuster si besoin
docker compose --env-file .env up -d
```

| Service | URL | Identifiants (défaut) |
|---|---|---|
| PostgreSQL | `localhost:5432` | `datashare` / `datashare`, base `datashare` |
| MinIO (API S3) | `http://localhost:9000` | `datashare` / `datashare-secret` |
| MinIO (console web) | `http://localhost:9001` | idem |
| Adminer (UI base) | `http://localhost:8081` | serveur `db` |

Le bucket `datashare-files` est créé automatiquement au démarrage (service `createbuckets`).

## Lancer le backend contre cet environnement

```bash
cd ../backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Les valeurs par défaut de `application.yml` pointent déjà sur ce PostgreSQL.

## Arrêter

```bash
docker compose down        # garde les données
docker compose down -v     # efface les volumes (reset complet)
```

## Note

La conteneurisation du backend/frontend et un `docker-compose.prod.yml` complet
arriveront dans une PR ultérieure. Les tests d'intégration n'utilisent **pas** ce
compose : ils démarrent leurs propres conteneurs via Testcontainers.
