# CI / Pipeline — DataShare

Référence vivante du pipeline GitHub Actions. Recoupée par `TESTING.md` et
`MAINTENANCE.md`.

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
| `lint-repo` | actionlint + yamllint + markdownlint + shellcheck + contrôle des en-têtes `@figma-owned` |
| `commitlint` | Conventional Commits sur le titre de PR |
| `backend-unit` | Tests unitaires backend (Surefire, `*Test`) |
| `backend-integ` | Tests d'intégration + fonctionnels backend (Failsafe, `*IT`, Testcontainers) |
| `frontend-unit` | Tests unitaires frontend (Vitest) + garde de config prod/dev |
| `frontend-integ` | Tests frontend (Vitest, projets unit + integ) + porte de couverture 70 % |
| `frontend-e2e` | Cypress contre la stack complète (Postgres + MinIO `silo` (GHCR) + backend + `ng serve`) — 3 specs : `auth.cy.ts`, `download.cy.ts`, `history.cy.ts` |
| `frontend-e2e-webkit` | essai, **non requis** : les 3 mêmes specs Cypress rejoués sur **WebKit** (moteur de Safari) avec un viewport d'iPhone 393×852 (`continue-on-error`). Ne remplace pas un test sur iPhone réel (barres rétractables, mémoire, toucher) |
| `assert-prod-bundle` | Build prod + vérifie que la config debug ne fuit pas dans `dist/` |
| `security` | gitleaks + `npm audit` + Trivy (image MinIO `silo`). À venir : OWASP dependency-check |

Workflow séparé [`.github/workflows/codeql.yml`](../.github/workflows/codeql.yml) :
**CodeQL** (voir [§ `codeql`](#codeql)).

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
| **shellcheck** | tous les scripts `*.sh` du dépôt (`deploy/`, `tools/`, etc.) |
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

**Porte bloquante active à 70 % de lignes** : back — `jacoco:check` (`BUNDLE LINE ≥ 0.70`)
dans `backend-integ`, activée par la PR #0006 ; front — `tools/check-coverage.mjs` dans
`frontend-integ`, activée par la PR #0007. Outils : JaCoCo (back), Vitest + coverage-v8
(front). Détail par user story et couverture actuelle : voir [`TESTING.md`](../TESTING.md) §6.

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
- **Trivy** (`aquasecurity/trivy-action`) — CVE OS/libs de l'image MinIO `silo`
  (tag épinglé, le même que [`deploy/docker-compose.yml`](../deploy/docker-compose.yml)).
  Scan par référence (pas de build), `severity: HIGH,CRITICAL`, **non bloquant**
  (`exit-code: 0`) : `silo` ne sert qu'en dev/CI/tests, pas de prod — voir
  [`SECURITY.md`](../SECURITY.md#3-scan-de-dépendances-et-danalyse-statique) pour
  les CVE actuellement ouvertes sans correctif. Base de vulnérabilités mise en
  cache (`~/.cache/trivy`, clé datée quotidiennement) pour éviter un
  re-téléchargement à chaque run.

À venir (PR dédiée) : OWASP dependency-check (Maven).

**SpotBugs** (*patterns* de bugs Java) évalué et **écarté du MVP** : essai réel sur le
code compilé → 9 findings priorité medium, 8 de bruit (`EI_EXPOSE_REP*`, quasi
systématique sur du Spring en injection par constructeur) pour 1 seul signal exploitable
(`DM_EXIT`). Détail et justification complète : [`BACKLOG.md`](BACKLOG.md#scans-de-sécurité-à-câbler).

## `codeql`

Workflow séparé [`.github/workflows/codeql.yml`](../.github/workflows/codeql.yml) — SAST
(analyse statique de sécurité) fourni par GitHub, gratuit sur dépôt public.

- **Déclencheurs** : chaque PR, push vers `master`, et **hebdomadaire** (lundi 04:17 UTC)
  pour appliquer les nouvelles requêtes CodeQL au code inchangé.
- **Matrice** : `java-kotlin` (backend) et `javascript-typescript` (frontend), jobs
  `codeql (java-kotlin)` / `codeql (javascript-typescript)`.
- **`build-mode: none`** : Java analysé sans compilation Maven (rapide, pas de JDK).
- **Suite `security-extended`** : requêtes de sécurité par défaut + requêtes à précision
  moindre (plus d'alertes potentielles, à trier).
- **Résultats** : onglet *Security › Code scanning* du dépôt, et annotations sur la PR.
  Le job échoue sur une erreur d'analyse, pas sur une alerte : le blocage d'une PR sur
  alerte se règle par une règle de protection *Code scanning* sur `master` (seuil
  `high`/`critical`, cohérent avec la politique de [`SECURITY.md`](../SECURITY.md) §5).

Complément hors CI : **Dependabot security alerts** (paramètres du dépôt) — alerte sur les
CVE connues des dépendances Maven, npm et Actions (onglet *Security › Dependabot*) ; le
correctif passe par les PR Dependabot hebdomadaires ou une PR manuelle.
