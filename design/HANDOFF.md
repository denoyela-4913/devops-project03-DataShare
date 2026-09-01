# Passation Figma ⇄ code (Cursor ⇄ Claude Code)

Le frontend visuel est généré depuis Figma via **Cursor** (le pont MCP `figma-mcp-bridge`
ne fonctionne de façon fiable que là). La logique, les tests et l'infra sont maintenus
dans **VS Code / Claude Code**. Même arbre git, séparation par fichier + par branche.

## Frontière de propriété

| Fichiers | Propriétaire | Éditeur |
|---|---|---|
| `frontend/src/**/*.html` (templates de composants) | **Figma** | Cursor |
| `frontend/src/**/*.scss` (styles de composants) | **Figma** | Cursor |
| `frontend/src/styles/_tokens.scss`, `_typography.scss`, `_breakpoints.scss` | **Figma** | Cursor |
| `frontend/src/assets/icons/*`, `frontend/src/assets/images/*` | **Figma** | Cursor |
| `design/tokens.reference.json`, `design/screens/*` | **Figma** | Cursor |
| `frontend/src/**/*.ts`, `*.spec.ts`, `*.integ.spec.ts` | **Logique** | Claude Code |
| `frontend/src/styles/_a11y.scss`, `theme.scss`, `styles.scss` | **Logique** | Claude Code |
| `backend/**`, `.github/**`, `deploy/**`, `*.md` | **Infra / doc** | Claude Code |

Tout fichier « Figma » porte un en-tête `@figma-owned` (vérifié par le job CI `lint-repo`).

## Ce que Cursor peut refaire — et ce qu'il doit préserver

Cursor **restyle librement** : classes, structure visuelle, mise en page, tailles, couleurs
(via les tokens), icônes.

Cursor **ne doit jamais casser**, dans les `.html` :

- les attributs `data-testid="…"`
- le contrôle de flux `@if` / `@for` / `@switch`
- les liaisons `[attr]="…"`, `(event)="…"`, `{{ interpolation }}`
- les rôles et libellés ARIA (`role`, `aria-*`), le `<router-outlet/>`, `<ng-content/>`
- les composants référencés (`<app-error-toast/>`, etc.)

Dans les `.scss` : utiliser **exclusivement les tokens** de `_tokens.scss` (règle Stylelint
`color-no-hex` — aucune couleur en dur hors `_tokens.scss`).

## Workflow git

- Branches : Cursor → `feat/ui-<frame>` ; Claude Code → `feat/back-*`, `feat/front-*`, `chore/*`.
- PR obligatoire vers `master`, squash, titre Conventional Commit (`feat(ui): …`).
- CI verte obligatoire (dont `lint-front`, `frontend-unit`, `frontend-integ`, `assert-prod-bundle`).
- On ne modifie pas le `.ts` et le `.html` d'un même composant dans la même PR.

## Synchro des tokens

1. Cursor lit les variables Figma via le MCP.
2. Cursor écrit `frontend/src/styles/_tokens.scss` (custom properties `:root`) — dont
   `--color-focus` (utilisé par `_a11y.scss`).
3. Cursor met à jour `design/tokens.reference.json` (dump brut, preuve de synchro).

## Definition of Done d'un écran

- [ ] Fidélité visuelle à la frame
- [ ] Tokens uniquement (aucune valeur en dur)
- [ ] États : `hover`, `focus-visible`, `disabled`, `error`, `empty`, `loading`
- [ ] Responsive : breakpoints de la maquette
- [ ] Contraste ≥ AA (4.5:1 ; 3:1 grand texte)
- [ ] Navigation clavier complète + ordre de tabulation logique
- [ ] Libellés de formulaire, `aria-*` valides, erreurs reliées au champ
- [ ] Cibles tactiles ≥ 44×44 px
- [ ] `prefers-reduced-motion` respecté
- [ ] `data-testid` et bindings préservés ; `npm run test:unit` + `test:integ` verts

## Après génération (Cursor)

```bash
cd frontend
nvm use 24
npm run lint && npm run lint:style && npm run format:check
npm run test:unit && npm run test:integ
npm run build            # vérifie le budget de bundle
```
