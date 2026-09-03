# figma-map — manifeste de passation

Frame Figma → fichiers cibles → statut. Complété par Cursor au fil de l'eau.

Statuts : ☐ à faire · ◐ généré, à réviser · ☑ validé (voir DoD dans [HANDOFF.md](HANDOFF.md)).

## Design system

| Frame Figma | node-id | Cible | Fichiers | Statut |
|---|---|---|---|---|
| _à renseigner_ | — | `shared/components/ui-button` | `ui-button.html`, `ui-button.scss` | ☐ |
| _à renseigner_ | — | `shared/components/error-toast` | `error-toast.html`, `error-toast.scss` | ☐ |
| DataShare_local · Login 55:333 | 55:333 | coquille appli | `app/app.html`, `app/app.scss` | ◐ |
| _à renseigner_ | — | `features/styleguide` | `styleguide.html`, `styleguide.scss` | ☐ |

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
| _téléchargement_ | — | `/d/:token` | US02 | `GET /api/d/{token}` | ☐ |
| _historique_ | — | `/history` | US05/US06 | `GET /api/files` | ☐ |
