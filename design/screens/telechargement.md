# Téléchargement — notes d’intégration (Claude)

Visuel généré depuis Figma **Téléchargement `56:740`**. Fichiers Cursor : `download.html`, `download.scss`, `icon-download-cloud-16.svg`. **Ne pas modifier le `.ts` dans la même PR que le HTML** (HANDOFF) — le template n’ajoute pas de nouveaux symboles TS.

## Frames

| État | Mobile | Desktop |
|---|---|---|
| Protégé, MDP vide (bouton disabled) | iPhone 16-12 `56:750` | Desktop-9 `56:779` |
| Protégé, MDP saisi | iPhone 16-17 `56:1222` | Desktop-10 `58:591` |
| Public (alerte « demain ») | iPhone 16-15 `56:1092` | Desktop-11 `58:632` |
| Expiré (callout error, pas de fichier) | iPhone 16-16 `56:1178` | Desktop-12 `58:802` |

Pas de maquette pour **loading** ni **404** : même carte + callout.

## À câbler côté logique (optionnel, hors PR Figma)

1. **Expiration relative** (`data-testid="download-expiry"`) : Figma info *« Ce fichier expirera dans 3 jours. »* vs alert *« Ce fichier expirera demain. »* à partir de `metadata().expiresAt`. Placeholder actuel : *« Ce fichier expirera bientôt. »* (`type="info"`).
2. Icône bouton : `icon-download-cloud-16.svg` (export Figma instance échoué ; équivalent Lucide aligné sur `icon-upload-cloud-16`). Le disabled Figma colore le trait en `#aea49b` — le `ui-button` gère déjà l’état disabled.

Les `data-testid` et le flux `@switch` / formulaire sont inchangés. Tests integ existants doivent rester verts sans changement de `.spec.ts`.
