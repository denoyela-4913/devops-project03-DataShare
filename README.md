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
backend/     API Spring Boot (package-by-feature : auth, user, file, download, tag, storage, expiration)
frontend/    SPA Angular (core / shared design-system / features) + Cypress
deploy/      docker-compose (dev : Postgres + MinIO) + scripts d'installation
perf/        scripts k6
design/      passation Figma ⇄ code (voir design/HANDOFF.md) + captures de référence
docs/        documentation vivante (CI, etc.)
.github/     workflows, templates, CODEOWNERS, dependabot
```

Documents qualité à la racine : `TESTING.md`, `SECURITY.md`, `PERF.md`,
`MAINTENANCE.md` (+ `DESIGN.md`).

## Workflow Git

- Branches courtes : `feat/…`, `fix/…`, `chore/…`, `test/…`, `docs/…`
  (`feat/back-*` côté logique, `feat/ui-*` côté Figma/Cursor).
- **PR obligatoire** vers `master` — merge **squash uniquement**, branche
  supprimée automatiquement.
- Titre de PR au format **Conventional Commits** (devient le message de commit).
- `master` protégée ; à terme, merge conditionné à une CI verte
  (voir [`docs/CI.md`](docs/CI.md)).

## Deux éditeurs

Le frontend visuel (`*.component.html` / `*.scss`, tokens, icônes) est généré
depuis une maquette Figma via **Cursor** (MCP). La logique, les tests et l'infra
sont maintenus dans **VS Code / Claude Code**. Frontière documentée dans
`design/HANDOFF.md` ; les fichiers issus de Figma portent un en-tête `@figma-owned`.

## Roadmap

| PR | Contenu |
|---|---|
| `#0001` | bootstrap : `.gitignore`, squelette CI, templates, `docs/CI.md` |
| `#0002` | `backend/` + `deploy/docker-compose` (Postgres + MinIO) |
| `#0003` | `frontend/` (squelette + stubs `@figma-owned`) |
| `#0004` | docs qualité (`TESTING` / `SECURITY` / `PERF` / `MAINTENANCE` / `DESIGN`) + `design/` |
| `#0005+` | fonctionnalités US01→US06, puis US07→US10 |

## Démarrage

_À compléter avec l'arrivée de `backend/` et `frontend/` (voir `deploy/`)._
