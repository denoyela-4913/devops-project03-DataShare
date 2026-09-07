# deploy/ — environnement de dev

Fournit les dépendances externes du backend : **PostgreSQL** et **MinIO** (stockage compatible S3).

## Démarrer

```bash
# bash
cd deploy
cp .env.example .env      # ajuster si besoin
docker compose --env-file .env up -d
```

```powershell
# PowerShell
cd deploy
Copy-Item .env.example .env   # ajuster si besoin
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
# bash
cd ../backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

```powershell
# PowerShell — l'argument -D… doit être quoté, sinon Maven le coupe au premier
# point ("Unknown lifecycle phase \".run.profiles=dev\"")
cd ../backend
./mvnw spring-boot:run '-Dspring-boot.run.profiles=dev'
```

Les valeurs par défaut de `application.yml` pointent déjà sur ce PostgreSQL.
Alternative sans Maven (nécessite `./mvnw package` au préalable) :
`java -jar target/datashare-backend-*.jar --spring.profiles.active=dev`.

## Purger les fichiers expirés (outil manuel)

Supprime les fichiers dont la date d'expiration est dépassée — ligne `stored_file`
**et** objet MinIO. Outil d'exploitation ; la purge automatique planifiée est le
périmètre d'US10 et réutilisera la même logique (`com.datashare.maintenance.ExpiredFilePurger`).

```bash
# la stack dev tourne, et le jar est construit :
cd ../backend && mvn -o package -DskipTests && cd ../deploy

./purge-expired.sh
#   → "Purge : 2/2 fichier(s) expiré(s) supprimé(s) — 0 échec(s) stockage"
#   → l'appli s'arrête seule (code 1 si un objet n'a pas pu être supprimé)

./purge-expired.sh --check    # valide le script sans rien exécuter
```

Fabriquer un fichier expiré pour tester (après avoir déposé un fichier via l'appli) :

```bash
docker compose -f docker-compose.yml exec db \
  psql -U datashare -d datashare \
  -c "UPDATE stored_file SET expires_at = now() - interval '2 days' WHERE original_name = 'test.txt';"
```

Vérifier :

```bash
docker compose -f docker-compose.yml exec db \
  psql -U datashare -d datashare \
  -c "SELECT id, original_name FROM stored_file WHERE expires_at < now();"   # → 0 ligne
```

Contre un autre environnement : `DATASHARE_PURGE_PROFILES=prod,purge` + les variables
`DATASHARE_DB_*` / `DATASHARE_STORAGE_*` / `DATASHARE_JWT_SECRET`.

## Arrêter

```bash
docker compose down        # garde les données
docker compose down -v     # efface les volumes (reset complet)
```

## Note

La conteneurisation du backend/frontend et un `docker-compose.prod.yml` complet
arriveront dans une PR ultérieure. Les tests d'intégration n'utilisent **pas** ce
compose : ils démarrent leurs propres conteneurs via Testcontainers.
