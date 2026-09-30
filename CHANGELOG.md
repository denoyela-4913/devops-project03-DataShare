# Changelog

Toutes les modifications notables de DataShare depuis la version 1.0.0.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) ; les éléments
volontairement différés restent dans [docs/BACKLOG.md](docs/BACKLOG.md).

## [Non publié] — depuis `DATASHARE_1.0.0`

### Corrigé

- **Historique** : la carte d'un fichier expiré n'affiche plus la phrase « Ce fichier a expiré,
  il n'est plus stocké chez nous ». Le libellé « Expiré » en rouge suffit, et la phrase était
  inexacte (un fichier expiré reste en base et dans MinIO jusqu'à suppression).
  Corrigé le 30/09/2026. (#123)

### Sécurité

- **Dépendances** : mise à jour de `brace-expansion` (5.0.9 → 5.0.12, dépendance transitive du
  frontend) pour corriger trois avis de sévérité haute (DoS). Problème détecté le 30/09/2026 par
  le job CI `security` (`npm audit`), qui échouait sur toutes les PR ; corrigé le même jour
  (30/09/2026). (#124)

[Non publié]: https://github.com/denoyela-4913/devops-project03-DataShare/compare/DATASHARE_1.0.0...master
