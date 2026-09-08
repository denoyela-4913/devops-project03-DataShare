# figma-map — manifeste de passation

Frame Figma → fichiers cibles → statut. Complété par Cursor au fil de l'eau.

Statuts : ☐ à faire · ◐ généré, à réviser · ☑ validé (voir DoD dans [HANDOFF.md](HANDOFF.md)).

## Design system

| Frame Figma | node-id | Cible | Fichiers | Statut |
|---|---|---|---|---|
| Button Component | 20:598 | `shared/components/ui-button` | `ui-button.html`, `ui-button.scss` | ☑ |
| Input Component | 9:121 | `shared/components/ui-input` | `ui-input.html`, `ui-input.scss` | ☑ |
| Select Component | 9:237 | `shared/components/ui-select` | `ui-select.html`, `ui-select.scss` | ☑ |
| Header | 24:440 | `shared/components/ui-header` | `ui-header.html`, `ui-header.scss` | ☑ (coquille : « Se connecter » / « Mon espace ») |
| Switch Component | 35:301 | `shared/components/ui-switch` | `ui-switch.html`, `ui-switch.scss` | ☑ (filtre de `/history`) |
| Callout Component | 56:1078 | `shared/components/ui-callout` | `ui-callout.html`, `ui-callout.scss` | ☑ (`/download`, `/history`) |
| Mon espace · cartes (Desktop-4) | 15:390 | `shared/components/file-card` | `file-card.html`, `file-card.scss` | ☑ (« Accéder » lien nouvel onglet, « Supprimer ») |
| _à créer_ | — | `shared/components/confirm-dialog` | `confirm-dialog.html`, `confirm-dialog.scss` | ◐ (placeholder fonctionnel) |
| DataShare_local · Login 55:333 + Header 24:440 + Desktop-5 | 55:333 / 16:186 | coquille appli | `app/app.html`, `app/app.scss` | ☑ (en-tête `ui-header` + pied ; chrome masqué sur `/history`) |
| Composants UI 9:113 | 9:113 | `features/styleguide` | `styleguide.html`, `styleguide.scss` | ◐ |

## Tokens

| Source Figma | Cible | Statut |
|---|---|---|
| Variables (couleurs, espacements, rayons, ombres) | `src/styles/_tokens.scss` | ◐ |
| Styles de texte | `src/styles/_typography.scss` | ◐ |
| Breakpoints | `src/styles/_breakpoints.scss` | ☐ |
| — | `design/tokens.reference.json` | ◐ |

## Écrans (features à venir)

| Frame Figma | node-id | Route | US | Endpoint | Statut |
|---|---|---|---|---|---|
| _inscription_ (Desktop - 7, iPhone 16 - 10) | 55:419 / 56:491 | `/register` | US03 | `POST /api/auth/register` | ☑ (front + back, e2e) |
| _connexion_ (Desktop - 6, iPhone 16 - 9) | 55:400 / 55:343 | `/login` | US04 | `POST /api/auth/login` | ☑ (front + back, e2e) |
| Téléversement 32:515 (Desktop - 2/1/3, iPhone 16 - 1/2/4/3) | 32:515 | `/upload` | US01/US07 | `POST /api/files` | ☑ (US01 livré ; US07 dépôt anonyme à venir) |
| Téléchargement 56:740 (Desktop-9/10/11/12, iPhone 16-12/17/15/16) | 56:779 / 58:591 / 58:632 / 58:802 / 56:750 / 56:1222 / 56:1092 / 56:1178 | `/d/:token` | US02 | `GET`/`POST /api/d/{token}` | ☑ (visuel livré, expiry relatif câblé ; loading/404 = même carte, sans frame dédiée) |
| Mon espace 32:516 (Desktop-4, iPhone-5/6) | 15:390 / 27:338 / 27:540 | `/history` | US05/US06 | `GET`/`DELETE /api/files` | ☑ (visuel livré ; sidebar dans la page ; upload anonyme hors MVP) |
