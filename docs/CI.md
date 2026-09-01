# CI / Pipeline — DataShare

Living reference for the GitHub Actions pipeline. Cross-linked from `TESTING.md`
and `MAINTENANCE.md` once those exist.

## Vue d'ensemble

Le workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) se déclenche sur
chaque **pull request** et sur **push vers `master`**. Tous les jobs tournent en
parallèle. `master` est protégée : PR obligatoire, historique linéaire, pas de
force-push ni de suppression, merge **squash uniquement** (le titre de PR devient
le message de commit).

> Les *required status checks* sont ajoutés à la protection de `master` **après le
> premier run** du pipeline (les noms de jobs n'existent côté GitHub qu'une fois
> exécutés au moins une fois).

## Jobs

| Job | Rôle | Bloquant sur `master` |
|---|---|---|
| `lint-front` | Qualité statique frontend | oui |
| `lint-back` | Qualité statique backend | oui |
| `lint-repo` | Qualité des fichiers transverses | oui |
| `commitlint` | Convention de nommage des commits/PR | oui |
| `backend-unit` | Tests unitaires backend (Surefire, `*Test`) | oui |
| `backend-integ` | Tests d'intégration + fonctionnels (Failsafe, `*IT`, Testcontainers) + porte de couverture | oui |
| `frontend-unit` | Tests unitaires frontend (Jest) | oui |
| `frontend-e2e` | Tests end-to-end (Cypress) | oui |
| `assert-prod-bundle` | Garde : la config debug ne fuit pas dans le build de prod | oui |
| `security` | Scans de sécurité et d'analyse de bugs | oui |

## Détail du lint

Le lint = vérifications **statiques, rapides, sans compilation lourde, sans test,
sans réseau**. Découpé en 4 jobs.

### `lint-front` — périmètre `frontend/`

| Outil | Commande | Ce qu'il attrape |
|---|---|---|
| **ESLint** (`angular-eslint`) | `npm run lint` | variables / imports inutilisés, `any` implicite, règles RxJS, `console.*` oublié, conventions Angular (inputs/outputs, lifecycle) |
| **ESLint — plugin template** (`@angular-eslint/template`) | inclus dans `ng lint` | **accessibilité dans les templates HTML** : `alt` manquant, `label`↔`for`, `aria-*` valides, `click` sans équivalent clavier, pas d'`autofocus`, rôles valides — **premier filet de sécurité PSH** |
| **Stylelint** | `npm run lint:style` | SCSS : règle `color-no-hex` **hors `_tokens.scss`** (garde de la frontière Figma), ordre des propriétés, nesting, unités |
| **Prettier** | `npm run format:check` | formatage homogène TS / HTML / SCSS / JSON (échoue si non formaté, ne corrige pas) |

### `lint-back` — périmètre `backend/`

Nécessite le JDK, **pas** de base de données ni de conteneur (`-DskipTests`).

| Outil | Commande | Ce qu'il attrape |
|---|---|---|
| **Spotless** (`palantir-java-format`) | `mvn spotless:check` | formatage Java, ordre des imports, imports inutilisés |
| **Checkstyle** | `mvn checkstyle:check` | nommage, longueur de ligne, Javadoc sur l'API publique, `final` sur les paramètres, conventions |
| **PMD** | `mvn pmd:check` | mauvaises pratiques : `catch` vide, complexité cyclomatique, `String` concaténée en boucle, code mort |

### `lint-repo` — périmètre racine / fichiers transverses

| Outil | Ce qu'il attrape |
|---|---|
| **actionlint** | erreurs de syntaxe / références dans `.github/workflows/*.yml` |
| **yamllint** | indentation, clés dupliquées des YAML (`docker-compose`, workflows) |
| **markdownlint** | cohérence des `.md` (TESTING / SECURITY / PERF / MAINTENANCE / DESIGN) |
| **`@figma-owned` check** (script maison) | un `*.component.html` / `*.component.scss` sans l'en-tête `@figma-owned` → échoue |

### `commitlint` — convention de commits

| Élément vérifié | Outil |
|---|---|
| **Titre de la PR** (squash → titre PR = message de commit sur `master`) | `amannn/action-semantic-pull-request` |
| Messages de commits de la branche (optionnel, plus strict) | `wagoid/commitlint-github-action` + `commitlint.config.js` |

Types autorisés : `feat, fix, docs, test, chore, ci, refactor, perf, build, style`.
Scope conseillé : `feat(upload):`, `test(auth):`, `ci(cache):`…

## `backend-unit` vs `backend-integ`

| | `backend-unit` | `backend-integ` |
|---|---|---|
| Plugin Maven | Surefire | Failsafe |
| Convention de nom | `*Test` | `*IT` |
| Commande | `mvn test` | `mvn verify` |
| Dépendances externes | aucune (Mockito) | Testcontainers (PostgreSQL, MinIO) |
| Contenu | services isolés, validators, mapping | repositories, contrôleurs (MockMvc), scénarios fonctionnels (RestAssured) |
| Couverture | agrégée avec `backend-integ` (JaCoCo) | porte **≥ 70 %** sur l'agrégat |

## `security`

- **`npm audit`** (`--audit-level=high`) — CVE des dépendances frontend
- **OWASP dependency-check** — CVE des dépendances backend (Maven)
- **CodeQL** — SAST (Java + TypeScript)
- **SpotBugs** — *patterns* de bugs Java (ex. `NullPointerException` probable sur un chemin d'exécution) ; exige la compilation, d'où sa place ici plutôt que dans `lint-back`
- **gitleaks** — secrets commités par erreur

Résultats et analyse consolidés dans `SECURITY.md`.

## `assert-prod-bundle`

Après `ng build --configuration production` :

- échoue si `debugErrors: true` (ou sa forme minifiée) apparaît dans `dist/`
- échoue si la route `styleguide` (dev only) est incluse dans le bundle livré

Complète la garde côté frontend (`environment.prod.spec.ts`) et côté backend
(`ErrorResponseProdIT`).
