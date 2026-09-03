# CI / Pipeline — DataShare

Référence vivante du pipeline GitHub Actions. Recoupée par `TESTING.md` et
`MAINTENANCE.md` une fois ceux-ci créés.

## Vue d'ensemble

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) se déclenche sur chaque
**pull request** et sur **push vers `master`**. Tous les jobs tournent en parallèle.

`master` est protégée : PR obligatoire, historique linéaire, pas de force-push ni de
suppression, merge **squash uniquement** (titre de PR = message de commit), **CI verte
obligatoire**.

> Après l'ajout d'un job, il faut l'ajouter à la liste des *required status checks* de
> `master` **une fois qu'il a tourné au moins une fois** (les noms n'existent côté
> GitHub qu'après un run).

## Jobs

| Job | Rôle |
|---|---|
| `lint-front` | ESLint (TS + a11y templates) + Stylelint + Prettier |
| `lint-back` | Spotless + Checkstyle + PMD |
| `lint-repo` | actionlint + yamllint + contrôle des en-têtes `@figma-owned` |
| `commitlint` | Conventional Commits sur le titre de PR |
| `backend-unit` | Tests unitaires backend (Surefire, `*Test`) |
| `backend-integ` | Tests d'intégration + fonctionnels backend (Failsafe, `*IT`, Testcontainers) |
| `frontend-unit` | Tests unitaires frontend (Vitest) + garde de config prod/dev |
| `frontend-integ` | Tests d'intégration frontend (Vitest + Angular TestBed) |
| `frontend-e2e` | *(placeholder)* Cypress — activé avec la feature auth (US03/US04) |
| `assert-prod-bundle` | Build prod + vérifie que la config debug ne fuit pas dans `dist/` |
| `security` | gitleaks + `npm audit`. À venir : OWASP dependency-check, CodeQL, SpotBugs |

## Détail du lint

Vérifications **statiques, rapides, sans test, sans réseau**.

### `lint-front` — périmètre `frontend/`

| Outil | Commande | Ce qu'il attrape |
|---|---|---|
| **ESLint** (`angular-eslint`) | `npm run lint` | variables/imports inutilisés, conventions Angular, `any` implicite |
| **ESLint — règles template** (`@angular-eslint/template` + `templateAccessibility`) | inclus dans `ng lint` | **a11y HTML** : `alt`, `label`/`for`, `aria-*` valides, click/clavier, rôles — filet PSH |
| **Stylelint** (`stylelint-config-standard-scss`) | `npm run lint:style` | SCSS : règle **`color-no-hex` hors `src/styles/_tokens.scss`** (frontière Figma), syntaxe |
| **Prettier** | `npm run format:check` | formatage TS/HTML/SCSS/JSON |

### `lint-back` — périmètre `backend/`

| Outil | Commande | Ce qu'il attrape |
|---|---|---|
| **Spotless** (`palantir-java-format`) | `mvn spotless:check` | formatage Java, ordre + imports inutilisés |
| **Checkstyle** | `mvn checkstyle:check` | nommage, accolades, imports superflus, blocs vides |
| **PMD** | `mvn pmd:check` | code mort, `catch` vide, comparaisons douteuses |

### `lint-repo` — fichiers transverses

| Outil | Ce qu'il attrape |
|---|---|
| **actionlint** | erreurs de syntaxe/refs dans `.github/workflows/*.yml` |
| **yamllint** (`.yamllint.yaml`, profil *relaxed*) | indentation, clés dupliquées |
| **markdownlint** (`.markdownlint-cli2.jsonc`, profil permissif) | structure des titres, cohérence des listes, sauts de ligne, liens |
| **`tools/check-figma-owned.sh`** | tout `frontend/src/app/**/*.{html,scss}` doit porter l'en-tête `@figma-owned` |

### `commitlint`

Titre de PR au format Conventional Commits (`amannn/action-semantic-pull-request`).
Types : `feat, fix, docs, test, chore, ci, refactor, perf, build, style`.

## Les 4 couches de test frontend

| Couche | Job | Outil | DOM | Backend | HTTP | Exemples |
|---|---|---|---|---|---|---|
| **unit** | `frontend-unit` | Vitest | non / shallow | non | service mocké | pipes, services, `token.store`, logique isolée |
| **integ** | `frontend-integ` | Vitest + `TestBed` + jsdom | oui | non | `HttpTestingController` | `error-toast` rendu + intercepteur, formulaire + validation, garde de route |
| **e2e** | `frontend-e2e` | Cypress | oui (navigateur) | réel (dockerisé) | réel | 3–4 parcours critiques |
| *(bundle)* | `assert-prod-bundle` | build + grep | — | — | — | la config debug ne fuit pas dans `dist/` |

Séparation par nommage : `*.spec.ts` = unit, `*.integ.spec.ts` = integ. Un `test`
target Angular avec deux configurations (`unit` / `integ`).

## `backend-unit` vs `backend-integ`

| | `backend-unit` | `backend-integ` |
|---|---|---|
| Plugin | Surefire | Failsafe |
| Nom | `*Test` | `*IT` |
| Commande | `./mvnw test` | `./mvnw verify -Dsurefire.skip=true` |
| Dépendances | aucune (Mockito) | Testcontainers (PostgreSQL, MinIO) |

## Couverture

**Rapport seul** pour l'instant (back : JaCoCo ; front : Vitest v8), pas de seuil
bloquant. La porte à **70 %** est activée quand le code métier arrive (PR US01).

## `assert-prod-bundle`

1. `npm run verify:config` — `environment.ts` (prod) : `production=true`, `debugErrors=false` ;
   `environment.development.ts` : l'inverse. Hors build Angular (donc non soumis aux
   `fileReplacements`).
2. `npm run build` (config `production`).
3. Échoue si `dist/` contient `debugErrors: true` / `debugErrors:!0`, ou un chunk `styleguide`.

Pendants côté back : `ProdProfileConfigTest` (unit) — le profil prod ne réactive pas le
mode verbeux.

## `security`

- **gitleaks** — secrets commités
- **`npm audit --audit-level=high`** — CVE des dépendances frontend. Une vraie
  vulnérabilité fait échouer le job ; une indisponibilité de l'endpoint d'avis npm
  (503, timeout) est traitée comme non bloquante (message `::warning::`).

À venir (PR dédiée) : OWASP dependency-check (Maven), CodeQL (Java + TS), SpotBugs
(*patterns* de bugs Java, ex. `NullPointerException` probable sur un chemin d'exécution).
