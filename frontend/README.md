# DataShare — frontend

Angular 22 (standalone, zoneless) · Vitest · Node 24 (`.nvmrc`).

```bash
nvm use 24
npm ci
npm start            # http://localhost:4200  (route /styleguide en dev uniquement)
npm run test:unit    # Vitest — *.spec.ts
npm run test:integ   # Vitest + Angular TestBed — *.integ.spec.ts
npm run lint && npm run lint:style && npm run format:check
npm run verify:config
npm run build        # build de production
```

- Structure : `core/` (config, http) · `shared/` (design-system, pipes) · `features/`.
- Mode debug/prod : `APP_CONFIG` (jeton d'injection) alimenté par `src/environments/`.
  Le détail technique des erreurs (`ErrorToast`) n'apparaît qu'en dev.
- Frontière Figma ⇄ code : voir [`../design/HANDOFF.md`](../design/HANDOFF.md).
  Les `*.html` / `*.scss` de composants portent l'en-tête `@figma-owned`.
- Détail du pipeline CI : [`../docs/CI.md`](../docs/CI.md).
