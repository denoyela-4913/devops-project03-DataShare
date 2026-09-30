# Changelog

Toutes les modifications notables de DataShare depuis la version 1.0.0.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) ; les éléments
volontairement différés restent dans [docs/BACKLOG.md](docs/BACKLOG.md).

## [Non publié] — depuis `DATASHARE_1.0.0`

### Corrigé

- **SEO** : `/robots.txt` renvoyait `index.html` (fallback SPA) au lieu d'un vrai fichier ; nginx
  le sert désormais directement (`text/plain`, `Allow: /`). Ajout d'une balise
  `<meta name="description">` dans `index.html`. Score SEO Lighthouse à 82 corrigé le
  30/09/2026. (#126)
- **Historique** : la carte d'un fichier expiré n'affiche plus la phrase « Ce fichier a expiré,
  il n'est plus stocké chez nous ». Le libellé « Expiré » en rouge suffit, et la phrase était
  inexacte (un fichier expiré reste en base et dans MinIO jusqu'à suppression).
  Corrigé le 30/09/2026. (#123)
- **Accessibilité** : `index.html` déclarait `lang="en"` alors que l'interface est en français
  (lecteurs d'écran) ; passé à `fr`. Le titre par défaut « DatashareFrontend » devient
  « DataShare – Partage de fichiers sécurisé ». Corrigé le 01/10/2026. (#127)

### Sécurité

- **Dépendances** : mise à jour de `brace-expansion` (5.0.9 → 5.0.12, dépendance transitive du
  frontend) pour corriger trois avis de sévérité haute (DoS). Problème détecté le 30/09/2026 par
  le job CI `security` (`npm audit`), qui échouait sur toutes les PR ; corrigé le même jour
  (30/09/2026). (#124)

[Non publié]: https://github.com/denoyela-4913/devops-project03-DataShare/compare/DATASHARE_1.0.0...master
