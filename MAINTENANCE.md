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

### Images tierces hors Dependabot (suivi manuel)

Dependabot ne surveille que les `Dockerfile` de `backend/` et `frontend/`. Les images
d'infrastructure sont suivies **à la main** et doivent rester **alignées aux 3 endroits** :

| Image | `deploy/docker-compose.yml` | `.github/workflows/ci.yml` (`frontend-e2e`) | Testcontainers (`MinioTestcontainersConfiguration`) |
|---|---|---|---|
| `postgres:16-alpine` | ☑ | ☑ (service) | — (module `testcontainers-postgresql`) |
| `ghcr.io/denoyela-4913/silo:RELEASE.2026-09-16T00-00-00Z` (MinIO + `mcli`) | ☑ (`minio`, `createbuckets`) | ☑ | ☑ |
| `adminer:latest` | ☑ (outil de dev uniquement) | — | — |

Historique MinIO : `minio/minio` retiré de Docker Hub (10/2025, MinIO Community passé
*source-only*, dépôt archivé le 25/04/2026), miroir `quay.io/minio` devenu privé (401,
09/2026), puis `pgsty/minio` gelé (renommé **`pgsty/silo`** le 06/08/2026). Bascule vers
**`ghcr.io/denoyela-4913/silo`** : image construite depuis notre fork
[`denoyela-4913/silo`](https://github.com/denoyela-4913/silo) (copie de `pgsty/silo`),
publiée sur GHCR (package public), tag explicite, jamais `latest`. Le client `mcli` est
embarqué : `pgsty/mc` n'est plus utilisé. Licence AGPL-3.0 : le fork public publie les
sources de l'image.

**Mettre à jour l'image MinIO** (à faire après chaque avis de sécurité de SILO,
<https://silo.pgsty.com/about/security-advisories/>) :

1. Dans le fork : *Sync fork* (ou `gh repo sync denoyela-4913/silo`).
2. Lancer le workflow *Publish GHCR image (DataShare)* du fork avec le tag `RELEASE.*` voulu :
   `gh workflow run ghcr-image.yml -R denoyela-4913/silo -f tag=RELEASE.<date>`.
3. Reporter le nouveau tag aux 3 endroits (tableau ci-dessus), lancer la CI, puis merger.

Le workflow du fork ne construit que `linux/amd64`. Le SDK Java `io.minio:minio` est
suivi séparément (Dependabot).

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
  ont été écartés au profit de **Spring Boot 4.1** (EOL ~07/2028) et **Angular 22** (EOL ~06/2028).
- Vérifier le support avant une montée majeure :
  - Spring Boot — <https://endoflife.date/spring-boot>
  - Angular — <https://endoflife.date/angular>
  - Node — <https://endoflife.date/nodejs> (cible : LTS active, actuellement **Node 24** (EOL ~04/2028))
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

### Audit de vulnérabilités des dépendances (manuel)

À lancer à la demande (avant une release, après un avis de sécurité, ou pour vérifier une PR Dependabot).

**Back — OWASP Dependency-Check** (base NVD) :

```bash
cd backend
export NVD_API_KEY=<clé NVD>          # sans clé, la mise à jour de la base NVD est très lente / limitée
./mvnw dependency-check:check          # rapport : backend/target/dependency-check-report.html
```

- La clé est lue par `pom.xml` via `${env.NVD_API_KEY}` ; ne jamais la committer. Clé gratuite :
  <https://nvd.nist.gov/developers/request-an-api-key>.
- Le premier lancement télécharge toute la base NVD (long) ; les suivants ne font qu'une mise à jour incrémentale
  (cache dans `~/.m2/repository/org/owasp/dependency-check-data`).
- La commande échoue (code ≠ 0) si une vulnérabilité atteint le seuil CVSS 7 (*high*/*critical*),
  fixé par `failBuildOnCVSS` dans `pom.xml`. Autre seuil ponctuel :
  `./mvnw dependency-check:check -DfailBuildOnCVSS=9`.
- Un faux positif se supprime dans `dependency-check-suppressions.xml` (à la racine, **commun au back
  et au front**), avec une note qui justifie (CVE visée, raison) et si possible une date de revue (`until`).
- La base NVD (`~/.m2/repository/org/owasp/dependency-check-data/`) est **partagée avec le front** :
  ne pas lancer les deux scans en même temps (base H2 verrouillée pendant la mise à jour).
- Le plugin n'est **pas** rattaché au cycle Maven (`verify` ne le lance pas) et **pas** câblé en CI :
  le seuil ne s'applique qu'aux lancements manuels. Un futur job CI devrait être planifié plutôt que
  *required* (une CVE publiée demain ferait échouer des PR sans rapport).

**Front — OWASP Dependency-Check (wrapper npm) :**

```bash
cd frontend
export NVD_API_KEY=<clé NVD>          # lue automatiquement par le wrapper
npm run security-check                 # rapport : frontend/reports/dependency-check-report.html
```

- Le wrapper `owasp-dependency-check` télécharge le CLI OWASP depuis GitHub (dans
  `frontend/dependency-check-bin/`, ignoré par git) : **Java requis** sur la machine.
- Scanne `package-lock.json` ; échoue à partir de CVSS 7 (`--failOnCVSS 7` dans le script).
- Réutilise la base NVD du back (`--data`) et le même fichier de suppressions (`--suppression`). Le CLI
  est épinglé à `v13.0.0` (`--odc-version`), la même version que le plugin Maven : une version
  différente utiliserait un autre schéma de base (sous-dossier distinct) et retélécharge toute la NVD.
  Si vous montez la version du plugin dans `pom.xml`, montez aussi `--odc-version` dans `package.json`.
- Le script utilise `$HOME` : à lancer depuis WSL/Linux (comme la CI), pas depuis `cmd`/PowerShell.

**Front — `npm audit`** (base d'avis GitHub/npm, plus rapide, sans clé ni Java) :

```bash
cd frontend
npm audit --audit-level=high           # échoue (code ≠ 0) à partir de « high » ; même commande que le job CI `security`
npm audit fix                          # applique les correctifs compatibles (semver), puis relancer les tests
```

Différence avec la CI : le job `security` traite une panne du service d'avis npm comme non
bloquante (warning) ; la commande manuelle échoue dans ce cas.

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
| `DATASHARE_STORAGE_ENDPOINT`, `DATASHARE_STORAGE_BUCKET`, `DATASHARE_STORAGE_ACCESS_KEY`, `DATASHARE_STORAGE_SECRET_KEY` | accès MinIO / S3 |
| `DATASHARE_DOWNLOAD_BASE_URL` | préfixe des liens de partage = origine publique du **frontend** + `/d` (ex. `https://datashare.example/d`) |
| `SPRING_PROFILES_ACTIVE=prod` | active le profil durci |

Aucune valeur par défaut n'est fournie dans `application-prod.yml` : une variable
manquante fait échouer le démarrage (comportement voulu).

### Migrations de base (Flyway)

- Les fichiers `backend/src/main/resources/db/migration/V*.sql` sont **immuables** une
  fois appliqués. Toute évolution = un nouveau `V{n+1}__*.sql`.
- Appliquées automatiquement au démarrage du backend.
- Vérifier l'état : table `flyway_schema_history`.

### Purge des fichiers expirés (US10, manuel en attendant `@Scheduled`)

`deploy/purge-expired.sh` (profil Spring `purge` → `ExpiredFilePurger`) supprime la ligne
**et** l'objet MinIO de chaque fichier expiré ; code de sortie 1 si un objet n'a pas pu
être supprimé. Détail : [`deploy/README.md`](deploy/README.md).

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
- Workflow séparé `codeql.yml` (SAST) : PR, push `master` et hebdomadaire.
- Ajouter un job → le faire tourner une fois → l'ajouter aux *required status checks*
  via `gh api ... /branches/master/protection`.

## 4. Versioning

- **Conventional Commits** (vérifié par `commitlint` sur le titre de PR).
- Merge **squash** uniquement ; historique linéaire.
- Branches courtes : `feat/NNNN-slug`, `fix/…`, `chore/…`, `docs/…` ; côté Figma/Cursor : `feat/ui-*`.

## 5. Dette connue

Voir [`docs/BACKLOG.md`](docs/BACKLOG.md) : PR gestion de la clé JWT, câblage OWASP
dependency-check / SpotBugs, déclenchement planifié de la purge (US10,
`@Scheduled`), durcissement en-têtes HTTP, CORS. (La porte de couverture 70 % est
active depuis les PR #0006/#0007.)
