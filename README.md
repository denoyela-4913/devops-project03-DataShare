# DataShare

Projet 3 — OpenClassrooms DevOps. Application de transfert de fichiers via liens
de téléchargement temporaires (type WeTransfer), avec options de protection et de
gestion pour les utilisateurs connectés.

> ⚠️ Repo en cours de mise en place. Ce README décrit la cible ; le code arrive
> par PR successives (voir [Roadmap](#roadmap)).

## Périmètre

- **MVP obligatoire** : US01→US06 (upload avec compte, téléchargement via lien,
  création de compte, connexion, historique, suppression).
- **Optionnel** : US07→US10 (upload anonyme, tags, mot de passe fichier,
  expiration automatique).

Spécifications complètes : voir le PDF fourni par OpenClassrooms.

## Stack technique

| Couche | Choix | Pourquoi |
|---|---|---|
| Back-end | **Spring Boot** (Java 21, Maven) | réutilisation P2 ; Spring Security + JWT, JPA, `@Scheduled` (purge US10), Bean Validation ; outillage de test de référence (JUnit 5, Testcontainers, RestAssured) |
| Front-end | **Angular** + **Jest** | réutilisation P2 ; Reactive Forms adaptées aux nombreux contrôles de saisie ; structure imposée |
| Base de données | **PostgreSQL** + Flyway | modèle relationnel (user↔file↔tags), contraintes d'unicité, migrations versionnées |
| Stockage | **MinIO** (API S3) derrière une abstraction `StorageService` | compatible S3 sans coût cloud ; données persistées sur volume Docker local ; bascule S3 possible sans toucher au métier |
| CI/CD | **GitHub Actions** | intégré au repo |

Deux modes de configuration : **prod** (messages d'erreur génériques) et **debug**
(détail technique en info-bulle sur le message générique). Voir [`docs/CI.md`](docs/CI.md)
et, à venir, `DESIGN.md`.

## Structure du dépôt (cible)

```
backend/     API Spring Boot 4.1 (package-by-feature : auth, user, file, download, tag, storage, expiration)
frontend/    SPA Angular 22 (zoneless) — core / shared design-system / features + Vitest + Cypress
deploy/      docker-compose (dev : Postgres + MinIO) + scripts d'installation
perf/        scripts k6
design/      passation Figma ⇄ code (voir design/HANDOFF.md) + captures de référence
docs/        documentation vivante (CI, backlog, etc.)
tools/       scripts de contrôle (en-têtes @figma-owned, etc.)
.github/     workflows, templates, CODEOWNERS, dependabot
```

## Suivi de qualité et maintenance

- [`TESTING.md`](TESTING.md) — stratégie de test, matrice US × tests, couverture, exécution
- [`SECURITY.md`](SECURITY.md) — surface d'attaque, décisions, scans de dépendances
- [`PERF.md`](PERF.md) — méthodo k6, budget de bundle, métriques
- [`MAINTENANCE.md`](MAINTENANCE.md) — MAJ des dépendances, runbook, versioning
- [`DESIGN.md`](DESIGN.md) — carte US→route→composant→endpoint, design system, accessibilité
- [`docs/CI.md`](docs/CI.md) — pipeline · [`docs/BACKLOG.md`](docs/BACKLOG.md) — éléments différés

## Workflow Git

- Branches courtes : `feat/…`, `fix/…`, `chore/…`, `test/…`, `docs/…`
  (`feat/back-*` côté logique, `feat/ui-*` côté Figma/Cursor).
- **PR obligatoire** vers `master` — merge **squash uniquement**, branche
  supprimée automatiquement.
- Titre de PR au format **Conventional Commits** (devient le message de commit).
- `master` protégée ; à terme, merge conditionné à une CI verte
  (voir [`docs/CI.md`](docs/CI.md)).

## Deux éditeurs

Le frontend visuel (`*.html` / `*.scss` de composants, tokens, icônes) est généré
depuis une maquette Figma via **Cursor** (MCP). La logique, les tests et l'infra
sont maintenus dans **VS Code / Claude Code**. Frontière documentée dans
[`design/HANDOFF.md`](design/HANDOFF.md) ; les fichiers issus de Figma portent un
en-tête `@figma-owned` (vérifié en CI).

## Roadmap

| PR | Contenu |
|---|---|
| `#0001` | bootstrap : `.gitignore`, squelette CI, templates, `docs/CI.md` |
| `#0002` | `backend/` (squelette Spring Boot 4.1) + `deploy/docker-compose` (Postgres + MinIO) |
| `#0003` | `frontend/` (squelette Angular 22 + Vitest + pile d'erreurs + stubs `@figma-owned`) + `design/` |
| `#0004` | docs qualité (`TESTING` / `SECURITY` / `PERF` / `MAINTENANCE` / `DESIGN`) |
| `#0005+` | fonctionnalités US01→US06, puis US07→US10 |

Éléments différés : voir [`docs/BACKLOG.md`](docs/BACKLOG.md).

## Démarrage

### Dépendances (PostgreSQL + MinIO)

```bash
cd deploy && cp .env.example .env && docker compose --env-file .env up -d
```

Détail et interfaces web : [`deploy/README.md`](deploy/README.md).

### Backend

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev      # http://localhost:8080
./mvnw test                                                # tests unitaires
./mvnw verify -Dsurefire.skip=true                         # tests d'intégration (Docker requis)
./mvnw spotless:apply                                      # formatage
```

- Smoke : `GET http://localhost:8080/api/ping` → `{"status":"ok"}`
- Santé : `GET http://localhost:8080/actuator/health`
- Swagger (profil dev) : `http://localhost:8080/swagger-ui.html`

### Frontend

Requiert **Node 24** (`nvm use 24` dans `frontend/`, voir `frontend/.nvmrc`).

```bash
cd frontend
npm ci
npm start                    # http://localhost:4200  (route /styleguide en dev)
npm run test:unit            # tests unitaires (Vitest)
npm run test:integ           # tests d'intégration (Vitest + TestBed)
npm run lint && npm run lint:style && npm run format:check
npm run build                # build de production
```

Le proxy `/api` vers le backend est géré par `nginx.conf` en conteneur ; en dev,
configurer un proxy `ng serve` quand les features consommeront l'API.
