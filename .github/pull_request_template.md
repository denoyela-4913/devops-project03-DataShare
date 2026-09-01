<!-- Titre de la PR = Conventional Commit (il devient le message de commit après squash).
     Ex: feat(upload): limite de taille à 1 Go côté serveur -->

## Contexte

<!-- Que fait cette PR et pourquoi. -->

## User stories couvertes

<!-- ex: US01, US02 — ou "n/a" -->

## Type de changement

- [ ] `feat` — nouvelle fonctionnalité
- [ ] `fix` — correction de bug
- [ ] `refactor` / `perf` / `style`
- [ ] `test` — tests uniquement
- [ ] `docs`
- [ ] `ci` / `chore` / `build`

## Checklist générale

- [ ] Titre de PR au format Conventional Commit
- [ ] Tests ajoutés / mis à jour (unit, integ, e2e selon le cas)
- [ ] Validation des entrées **côté client ET serveur** si applicable
- [ ] Gestion d'erreurs : message générique + `code`, détail seulement en mode debug
- [ ] Documentation à jour (`TESTING.md` / `SECURITY.md` / `PERF.md` / `MAINTENANCE.md` / `DESIGN.md` / `docs/`)
- [ ] CI verte

## Checklist design & accessibilité (PSH) — si la PR touche l'UI

- [ ] Aucune valeur de style en dur : couleurs / espacements / typo via `_tokens.scss`
- [ ] États gérés : `hover`, `focus-visible`, `disabled`, `error`, `empty`, `loading`
- [ ] Responsive : breakpoints de la maquette respectés
- [ ] Contraste texte/fond ≥ AA (4.5:1, ou 3:1 pour le grand texte)
- [ ] Navigation clavier complète + ordre de tabulation logique
- [ ] Libellés de formulaire (`label`/`for`), `aria-*` valides, messages d'erreur reliés au champ
- [ ] Cibles tactiles ≥ 44×44 px
- [ ] `prefers-reduced-motion` respecté si animation
- [ ] Fichiers `*.component.html` / `*.scss` conservent l'en-tête `@figma-owned`

## Captures / preuves

<!-- screenshots, rapport de couverture, sortie k6, etc. -->
