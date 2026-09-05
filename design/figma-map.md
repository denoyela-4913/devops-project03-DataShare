# figma-map — manifeste de passation

Frame Figma → fichiers cibles → statut. Complété par Cursor au fil de l'eau.

Statuts : ☐ à faire · ◐ généré, à réviser · ☑ validé (voir DoD dans [HANDOFF.md](HANDOFF.md)).

## Design system

| Frame Figma | node-id | Cible | Fichiers | Statut |
|---|---|---|---|---|
| Button Component | 20:598 | `shared/components/ui-button` | `ui-button.html`, `ui-button.scss` | ☑ |
| Input Component | 9:121 | `shared/components/ui-input` | `ui-input.html`, `ui-input.scss` | ☑ |
| Select Component | 9:237 | `shared/components/ui-select` | `ui-select.html`, `ui-select.scss` | ☑ |
| Header | 24:440 | `shared/components/ui-header` | `ui-header.html`, `ui-header.scss` | ◐ (testé, pas encore consommé — coquille appli à revoir) |
| Switch Component | 35:301 | `shared/components/ui-switch` | `ui-switch.html`, `ui-switch.scss` | ◐ (testé, pas encore consommé — réservé au filtre `/history`) |
| Callout Component | 56:1078 | `shared/components/ui-callout` | `ui-callout.html`, `ui-callout.scss` | ◐ (testé, pas encore consommé) |
| DataShare_local · Login 55:333 | 55:333 | coquille appli | `app/app.html`, `app/app.scss` | ◐ |
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
| _inscription_ (Desktop - 7, iPhone 16 - 10) | 55:419 / 56:491 | `/register` | US03 | `POST /api/auth/register` | ◐ |
| _connexion_ (Desktop - 6, iPhone 16 - 9) | 55:400 / 55:343 | `/login` | US04 | `POST /api/auth/login` | ◐ |
| Téléversement 32:515 (Desktop - 2/1/3, iPhone 16 - 1/2/4/3) | 32:515 | `/upload` | US01/US07 | `POST /api/files` | ◐ |
| _téléchargement_ (à exporter) | — | `/d/:token` | US02 | `GET`/`POST /api/d/{token}` | ◐ (logique + placeholder fonctionnel, visuel Figma à venir) |
| _historique_ | — | `/history` | US05/US06 | `GET /api/files` | ☐ |
