# MAINTENANCE — DataShare

Procédures de maintenance : dépendances, exploitation, pipeline, dette.

## 1. Mise à jour des dépendances

### Automatisation — Dependabot

`.github/dependabot.yml` ouvre des PR **hebdomadaires** pour :

| Écosystème | Répertoire | Préfixe de commit |
|---|---|---|
| GitHub Actions | `/` | `ci` |
| Maven | `/backend` | `build` |
| npm | `/frontend` | `build` |
| Docker | `/backend`, `/frontend` | `build` |

Chaque PR Dependabot passe par la CI complète (mêmes *required checks* que les autres).

### Niveaux de risque

| Type | Exemple | Traitement |
|---|---|---|
| **patch** (`x.y.Z`) | correctif de bug/sécu | revue rapide, merge si CI verte ; *auto-merge* envisageable plus tard |
| **minor** (`x.Y.z`) | nouvelles API rétro-compatibles | lire le changelog, merge si CI verte |
| **major** (`X.y.z`) d'une lib | rupture d'API | **PR dédiée**, adaptation du code, tests renforcés |
| **major** d'un framework (Angular, Spring Boot) | migration | PR dédiée + `ng update` / notes de migration Spring ; planifiée, jamais dans l'urgence |

### Cadence et principes

- Traiter les PR Dependabot **chaque semaine** (ne pas laisser s'accumuler).
- **Ne jamais démarrer ou rester sur une version hors support OSS.** Leçon de ce
  projet : Spring Boot 3.5 (fin de support 30/06/2026) et Angular 19 (EOL ~05/2026)
  ont été écartés au profit de **Spring Boot 4.1** et **Angular 22**.
- Vérifier le support avant une montée majeure :
  - Spring Boot — <https://endoflife.date/spring-boot>
  - Angular — <https://endoflife.date/angular>
  - Node — <https://endoflife.date/nodejs> (cible : LTS active, actuellement **Node 24**)
- Après une montée : `./mvnw verify` (back) et `npm run test:unit && npm run test:integ && npm run build` (front) en local avant de pousser.

### Procédure montée majeure — Angular

```bash
cd frontend
nvm use 24
npx ng update @angular/core @angular/cli   # applique les schematics de migration
npm run lint && npm run test:unit && npm run test:integ && npm run build
```

### Procédure montée majeure — Spring Boot

1. Bumper `<parent>` dans `backend/pom.xml`.
2. Lire les *release notes* et le *migration guide* de la version cible.
3. `./mvnw verify` ; corriger les ruptures (starters renommés, API retirées).
4. Vérifier les versions gérées par le BOM (Testcontainers, etc.).

## 2. Exploitation (runbook)

### Lancer

| Composant | Dev | Prod |
|---|---|---|
| Dépendances (PostgreSQL, MinIO) | `cd deploy && docker compose --env-file .env up -d` | conteneurs gérés / service managé |
| Backend | `./mvnw spring-boot:run -Dspring-boot.run.profiles=dev` | `java -jar` du build, profil `prod` |
| Frontend | `npm start` | image `frontend/Dockerfile` (nginx) |

### Variables d'environnement (prod)

| Variable | Rôle |
|---|---|
| `DATASHARE_DB_URL`, `DATASHARE_DB_USERNAME`, `DATASHARE_DB_PASSWORD` | connexion PostgreSQL |
| `DATASHARE_JWT_SECRET` | clé HMAC de signature JWT (≥ 32 octets) |
| `DATASHARE_STORAGE_*` (endpoint, bucket, clés) | accès MinIO / S3 |
| `SPRING_PROFILES_ACTIVE=prod` | active le profil durci |

Aucune valeur par défaut n'est fournie dans `application-prod.yml` : une variable
manquante fait échouer le démarrage (comportement voulu).

### Migrations de base (Flyway)

- Les fichiers `backend/src/main/resources/db/migration/V*.sql` sont **immuables** une
  fois appliqués. Toute évolution = un nouveau `V{n+1}__*.sql`.
- Appliquées automatiquement au démarrage du backend.
- Vérifier l'état : table `flyway_schema_history`.

### Sauvegarde / restauration

```bash
# PostgreSQL
docker exec datashare-dev-db-1 pg_dump -U datashare datashare > backup.sql
docker exec -i datashare-dev-db-1 psql -U datashare datashare < backup.sql

# MinIO (via mc, ou snapshot du volume Docker minio-data)
```

### Rotation des secrets

- **BDD / MinIO** : changer la variable d'environnement + redéployer.
- **Secret JWT** : changer `DATASHARE_JWT_SECRET` invalide tous les jetons en cours
  (déconnexion générale). Une rotation propre (jeu de clés `kid`) est un item de
  backlog — voir [`docs/BACKLOG.md`](docs/BACKLOG.md).

## 3. Pipeline CI

Référence complète : [`docs/CI.md`](docs/CI.md).

- 11 jobs, tous *required* sur `master` (sauf `commitlint` qui ne s'exécute que sur PR).
- Ajouter un job → le faire tourner une fois → l'ajouter aux *required status checks*
  via `gh api ... /branches/master/protection`.

## 4. Versioning

- **Conventional Commits** (vérifié par `commitlint` sur le titre de PR).
- Merge **squash** uniquement ; historique linéaire.
- Branches courtes : `feat/NNNN-slug`, `fix/…`, `chore/…`, `docs/…` ; côté Figma/Cursor : `feat/ui-*`.

## 5. Dette connue

Voir [`docs/BACKLOG.md`](docs/BACKLOG.md) : PR gestion de la clé JWT, câblage OWASP
dependency-check / CodeQL / SpotBugs, activation de la porte de couverture 70 %,
durcissement en-têtes HTTP, CORS.
