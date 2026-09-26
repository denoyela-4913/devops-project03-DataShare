# DESIGN — architecture fonctionnelle et système visuel

Vue produit / architecture. Le **processus** de passation Figma ⇄ code est dans
[`design/HANDOFF.md`](design/HANDOFF.md).

## 1. Carte fonctionnelle

| US | Route Angular | Composants | Endpoint API | DTO | Statut |
|---|---|---|---|---|---|
| US03 — création de compte | `/register` | `features/auth/register` + `field-error` | `POST /api/auth/register` | `RegisterRequest` → `TokenResponse` | ☑ (front + back, e2e) |
| US04 — connexion | `/login` | `features/auth/login` + `field-error` | `POST /api/auth/login` | `LoginRequest` → `TokenResponse` | ☑ |
| US01 — upload (compte) | `/upload` (garde `authGuard`) | `features/upload` (landing/form/succès) + `field-error` | `POST /api/files` (multipart, JWT requis) | `file` + `password?` + `expirationDays` → `UploadResponse` | ☑ (front + back ; US07 anonyme relâchera la garde) |
| US02 — téléchargement | `/d/:token` (public) | `features/download` | `GET`/`POST /api/d/{token}` | `FileMetadata` | ☑ (front + back, e2e ; visuel Figma livré, expiration relative) |
| US05 — historique | `/history` (garde `authGuard`, `/` y redirige) | `features/history` + `file-card` + `ui-switch`, pipes `expiryStatus`/`fileSize` | `GET /api/files` (+ `GET /api/me` pour l'email) | `FileSummary[]` | ☑ (front + back, e2e ; visuel Figma livré) |
| US06 — suppression | `/history` | `file-card` + `confirm-dialog` (`<dialog>` natif) | `DELETE /api/files/{id}` → `204` | — | ☑ (front + back, e2e) |
| US08 — tags | `/history`, `/upload` | `tag-chip`, filtrage | endpoints tags (`V2`) | `Tag[]` | ☐ |
| Transverse — erreurs | toutes | `form-error` (dans la carte), `form-notice` (succès), `error-toast` (filet réseau) | — | `ErrorResponse` | ☑ |

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
| `field-error` | message d'erreur d'un contrôle de formulaire (a11y `role="alert"`, `aria-describedby`) | ☑ |
| `form-error` | erreur **serveur** en tête de formulaire (dans la carte), `role="alert"`, détail technique dépliable en mode debug | ☑ (login/register/upload/download/history) |
| `form-notice` | confirmation d'action réussie en tête d'écran (bleu, `role="status"`, auto-disparition 3 s) | ☑ (suppression `/history`) |
| `error-toast` | filet global : panne réseau et erreurs non prises en charge par un écran ; flottant en bas, auto-fermeture | ☑ |
| `ui-input` | champ de formulaire + libellé (remplace `ui-text-field`) | ☑ (consommé dans login/register/upload) |
| `ui-select` | liste déroulante + libellé + chevron | ☑ (consommé dans upload) |
| `ui-header` | en-tête appli (logo + action) | ☑ (consommé dans la coquille `app`, masqué sur `/history`) |
| `ui-switch` | filtre segmenté Tous / Actifs / Expiré | ☑ (consommé dans `/history`) |
| `ui-callout` | bandeau inline Info / Alert / Error | ☑ (consommé dans `/download`, `/history`) |
| `file-card` | ligne d'historique (nom, taille, expiration, état ; « Accéder » = lien `/d/:token` nouvel onglet, « Supprimer ») | ☑ (consommé dans `/history`) |
| `confirm-dialog` | confirmation d'action destructive, `<dialog>` natif (US06) | ◐ placeholder fonctionnel sans frame Figma (consommé dans `/history`) |
| `password-field` | saisie de mot de passe accessible (afficher/masquer) | ☐ |
| `tag-chip` | étiquette de tag (US08) | ☐ |
| `empty-state` / `loading-skeleton` | états vides / de chargement | ☐ |

## 3. Accessibilité (utilisateurs PSH)

**Cible : WCAG 2.1 niveau AA.**

| Moyen | Où |
|---|---|
| Lint a11y des templates | `@angular-eslint/template` + `templateAccessibility` (job `lint-front`) : `alt`, `label`/`for`, `aria-*` valides, click/clavier, rôles |
| Styles transverses | `frontend/src/styles/_a11y.scss` : `:focus-visible` visible et non supprimé, `prefers-reduced-motion`, `.sr-only`, `.skip-link` |
| Coquille | lien d'évitement `#main`, `<main>` identifié |
| Checklist de PR | section « design & accessibilité » de `.github/pull_request_template.md` |
| Contraste | vérifié sur les tokens (≥ 4,5:1 texte, ≥ 3:1 grand texte / éléments d'interface) ; écarts corrigés par rapport à Figma, voir §3.1 |
| Cibles tactiles | ≥ 44×44 px, vérifié par composant |
| Vérification manuelle | navigation clavier complète + lecteur d'écran sur les parcours critiques ⏳ |

### 3.1 Écarts assumés avec Figma : contraste

Certaines couleurs de la maquette Figma ne respectent pas le contraste minimum exigé par
les WCAG (niveau AA, cible du projet). Elles sont **volontairement corrigées dans le code**.

**Seuils** ([WCAG 2.1, critère 1.4.3 « Contraste (minimum) »](https://www.w3.org/TR/WCAG21/#contrast-minimum),
inchangé en 2.2) : rapport de luminance ≥ **4,5:1** pour le texte normal, ≥ 3:1 pour le
grand texte (≥ 24 px, ou 18,66 px en gras). Critère 1.4.11 « Contraste des éléments non
textuels » : ≥ **3:1** pour les bordures de composants d'interface. Les éléments désactivés
sont exemptés (1.4.3) ; ils sont corrigés ici par confort. Les boutons du projet font
14 à 16 px : le seuil de 4,5:1 s'applique.

| Élément | Jeton (`_tokens.scss`) | Figma | Ratio | Code | Ratio | Critère |
|---|---|---|---|---|---|---|
| Texte bouton primaire | `--color-btn-primary-text` | `#ba681f` | 3,5:1 ✗ | `#8f4a12` | 5,6:1 ✓ | 1.4.3 |
| Texte bouton secondaire, tertiaire, « Changer » | `--color-btn-tertiary-text` | `#e27f29` | 2,7:1 ✗ | `#9c4a0a` | 5,9:1 ✓ | 1.4.3 |
| Bordure bouton secondaire / « Changer » | `--color-btn-secondary-stroke`, `--color-btn-change-stroke` | `#ffa569` | 1,8:1 ✗ | `#d7630b` | 3,5:1 ✓ | 1.4.11 |
| Texte bouton désactivé (exempté, corrigé par confort) | `--color-btn-disabled-text` | `#aea49b` | 2,0:1 | `#6f6259` | 4,8:1 ✓ | 1.4.3 (exempté) |
| Texte du callout d'alerte | `--color-callout-alert-text` | `#aa642b` | 4,3:1 ✗ | `#8f4a12` | 6,2:1 ✓ | 1.4.3 |
| Lien de partage (après téléversement) | `--color-link-url-bg` + `--color-link-url-text` | `#ff5e00` / `#d8640b` | 1,2:1 ✗ | `#ffc191` / `#1e1e1e` | 10,5:1 ✓ | 1.4.3 |
| Logo « DataShare » du menu latéral (Mon espace) | `.history__logo` (`--color-black`, 32 px : grand texte, seuil 3:1) | blanc | 1,7:1 en haut du dégradé ✗ (3,5:1 en bas) | noir `#000` (inchangé) | 12,5:1 en haut, 6,0:1 en bas ✓ | 1.4.3 (3:1) |
| Croix de fermeture du menu latéral | `assets/icons/icon-close.svg` (trait 2,5 px, composant d'interface : seuil 3:1) | blanc | 1,7:1 sur le haut du dégradé ✗ | `#1e1e1e` (celui des labels) | 9,9:1 ✓ | 1.4.11 (3:1) |

Ratios calculés avec la formule WCAG de luminance relative, sur le fond réel de l'écran
(`#fff7f7` pour les boutons, `#fff5ed` pour le callout).

Impacts de ces écarts :

- **Visuel** : les textes de boutons et d'alerte passent d'un orange vif à un brun plus
  sombre ; le lien de partage passe d'un rectangle orange vif à un fond pêche `#ffc191`
  (fond des cartes fichier) avec texte noir. Formes, tailles, fonds et libellés
  inchangés, sauf le fond du lien.
- **Périmètre** : tous les `ui-button` (primaire, secondaire, tertiaire, désactivé), le
  bouton « Changer », le callout d'alerte et le lien de partage. Boutons sombre et
  danger, callouts d'info et d'erreur : inchangés (déjà conformes).
- **Fidélité Figma** : écart assumé. `_tokens.scss` et `design/tokens.reference.json`
  sont `@figma-owned` : **ne pas resynchroniser ces valeurs depuis Figma** sans avoir
  d'abord mis à jour la maquette (voir [`design/HANDOFF.md`](design/HANDOFF.md)).
- **Tests** : aucun test à modifier (aucune assertion sur les couleurs).

## 4. Responsive

- **Mobile-first**, breakpoints à extraire des frames Figma (`_breakpoints.scss` est
  encore un stub ☐, voir [`design/figma-map.md`](design/figma-map.md)).
- Contenu large (tableaux d'historique) : défilement horizontal dans son conteneur,
  jamais de débordement de la page.

## 5. Deux éditeurs

Le frontend visuel (`*.html` / `*.scss` de composants, tokens, icônes) est généré
depuis Figma via **Cursor** ; la logique, les tests et l'infra dans **VS Code /
Claude Code**. Frontière, contrat de préservation (testids, bindings, ARIA) et
*definition of done* d'un écran : [`design/HANDOFF.md`](design/HANDOFF.md). Manifeste
de suivi : [`design/figma-map.md`](design/figma-map.md).
