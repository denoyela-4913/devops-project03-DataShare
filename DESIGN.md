# DESIGN — architecture fonctionnelle et système visuel

Vue produit / architecture. Le **processus** de passation Figma ⇄ code est dans
[`design/HANDOFF.md`](design/HANDOFF.md).

## 1. Carte fonctionnelle

| US | Route Angular | Composants | Endpoint API | DTO | Statut |
|---|---|---|---|---|---|
| US03 — création de compte | `/register` | `features/auth/register` + `field-error` | `POST /api/auth/register` | `RegisterRequest` → `TokenResponse` | ☑ (front + back, e2e) |
| US04 — connexion | `/login` | `features/auth/login` + `field-error` | `POST /api/auth/login` | `LoginRequest` → `TokenResponse` | ☑ |
| — espace personnel | `/` (garde `authGuard`) | `features/home` | `GET /api/me` | `MeResponse` | ☑ (placeholder avant US05) |
| US01 — upload (compte) | `/upload` (garde `authGuard`) | `features/upload` (landing/form/succès) + `field-error` | `POST /api/files` (multipart, JWT requis) | `file` + `password?` + `expirationDays` → `UploadResponse` | ☑ (front + back ; US07 anonyme relâchera la garde) |
| US02 — téléchargement | `/d/:token` | `features/download` + `password-field` | `GET`/`POST /api/d/{token}` | `FileMetadata` | ☐ |
| US05 — historique | `/history` | `features/history` + `file-card`, pipes `expiryStatus`/`fileSize` | `GET /api/files` | `FileSummary[]` | ☐ |
| US06 — suppression | `/history` | `file-card` + `confirm-dialog` | `DELETE /api/files/{id}` | — | ☐ |
| US08 — tags | `/history`, `/upload` | `tag-chip`, filtrage | endpoints tags (`V2`) | `Tag[]` | ☐ |
| Transverse | toutes | `app` (coquille), `error-toast` | — | `ErrorResponse` | ☑ |

## 2. Système visuel (design system)

| Élément | Source | Fichier |
|---|---|---|
| Tokens (couleurs, espacements, rayons, ombres, z-index) | variables Figma via Cursor | `frontend/src/styles/_tokens.scss` (**@figma-owned**) |
| Typographie | styles de texte Figma | `frontend/src/styles/_typography.scss` (**@figma-owned**) |
| Breakpoints | frames Figma | `frontend/src/styles/_breakpoints.scss` (**@figma-owned**) |
| Assemblage / thème | logique | `frontend/src/styles/theme.scss` |
| Composants | Figma (structure) + Angular (logique) | `frontend/src/app/shared/components/*` |

**Règle** : aucune valeur de style en dur. Les couleurs hexadécimales ne sont
autorisées que dans `_tokens.scss` (règle Stylelint `color-no-hex`, vérifiée par
`lint-front`).

### Inventaire des composants

| Composant | Rôle | Statut |
|---|---|---|
| `ui-button` | bouton (variants primary / secondary / tertiary / dark / danger) | ☑ (consommé dans login/register/upload) |
| `error-toast` | bandeau d'erreur global, détail technique en mode debug | ☑ |
| `field-error` | message d'erreur d'un contrôle de formulaire (a11y `role="alert"`, `aria-describedby`) | ☑ |
| `ui-input` | champ de formulaire + libellé (remplace `ui-text-field`) | ☑ (consommé dans login/register/upload) |
| `ui-select` | liste déroulante + libellé + chevron | ☑ (consommé dans upload) |
| `ui-header` | en-tête appli (logo + action) | ◐ (testé, pas encore consommé) |
| `ui-switch` | filtre segmenté Tous / Actifs / Expiré | ◐ (testé, réservé au filtre `/history`) |
| `ui-callout` | bandeau inline Info / Alert / Error | ◐ (testé, pas encore consommé) |
| `password-field` | saisie de mot de passe accessible (afficher/masquer) | ☐ |
| `tag-chip` | étiquette de tag (US08) | ☐ |
| `file-card` | ligne d'historique (nom, taille, expiration, état) | ☐ |
| `confirm-dialog` | confirmation d'action destructive (US06) | ☐ |
| `empty-state` / `loading-skeleton` | états vides / de chargement | ☐ |

## 3. Accessibilité (utilisateurs PSH)

**Cible : WCAG 2.1 niveau AA.**

| Moyen | Où |
|---|---|
| Lint a11y des templates | `@angular-eslint/template` + `templateAccessibility` (job `lint-front`) : `alt`, `label`/`for`, `aria-*` valides, click/clavier, rôles |
| Styles transverses | `frontend/src/styles/_a11y.scss` : `:focus-visible` visible et non supprimé, `prefers-reduced-motion`, `.sr-only`, `.skip-link` |
| Coquille | lien d'évitement `#main`, `<main>` identifié |
| Checklist de PR | section « design & accessibilité » de `.github/pull_request_template.md` |
| Contraste | vérifié sur les tokens (≥ 4.5:1 texte, ≥ 3:1 grand texte / éléments d'interface) |
| Cibles tactiles | ≥ 44×44 px, vérifié par composant |
| Vérification manuelle | navigation clavier complète + lecteur d'écran sur les parcours critiques ⏳ |

## 4. Responsive

- **Mobile-first**, breakpoints issus des frames Figma (`_breakpoints.scss`).
- Contenu large (tableaux d'historique) : défilement horizontal dans son conteneur,
  jamais de débordement de la page.

## 5. Deux éditeurs

Le frontend visuel (`*.html` / `*.scss` de composants, tokens, icônes) est généré
depuis Figma via **Cursor** ; la logique, les tests et l'infra dans **VS Code /
Claude Code**. Frontière, contrat de préservation (testids, bindings, ARIA) et
*definition of done* d'un écran : [`design/HANDOFF.md`](design/HANDOFF.md). Manifeste
de suivi : [`design/figma-map.md`](design/figma-map.md).
