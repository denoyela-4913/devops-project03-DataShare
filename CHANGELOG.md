# Changelog

Toutes les modifications notables de DataShare depuis la version 1.0.0.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) ; les éléments
volontairement différés restent dans [docs/BACKLOG.md](docs/BACKLOG.md).

## [Non publié] — depuis `DATASHARE_1.0.1`

### Ajouté

- **Test depuis un mobile** : l'appli est accessible depuis un mobile sur le même Wi-Fi
  (`start-frontend-dev` écoute sur `0.0.0.0` par défaut, `--local` pour `localhost` seul) ou en 5G
  via un tunnel Cloudflare (`scripts/start-tunnel`). Nouveaux scripts `scripts/lan-setup`
  (pare-feu Windows + Hyper-V, `enable` / `disable` / `status`, élévation UAC attendue) et
  `scripts/lan-check` (diagnostic réseau et URL à ouvrir sur le mobile). Guide pas à pas, retour
  arrière et dépannage : [`docs/TESTS-MOBILE.md`](docs/TESTS-MOBILE.md). (#142)
- **Copie du lien** : repli `document.execCommand('copy')` quand `navigator.clipboard` est absent
  (page en HTTP sur une IP du réseau local), message « Copie impossible » annoncé aux lecteurs
  d'écran si la copie échoue. (#142)

### Modifié

- **Liens de partage** : le backend renvoie un chemin relatif (`/d/<token>`) quand
  `DATASHARE_DOWNLOAD_BASE_URL` est absente, et le frontend y ajoute l'origine du navigateur : le
  lien est valable quelle que soit l'adresse d'ouverture (`localhost`, IP du réseau local,
  tunnel). La variable devient **optionnelle**, y compris en production (où elle reste utile
  pour imposer https et un domaine unique). `.env.prod.local` généré par `start-backend-prod`
  ne la contient plus ; un fichier déjà généré garde l'ancienne ligne, à supprimer à la main. (#142)

### Sécurité

- **Dépendances frontend** : `npm audit fix` (source-map-js, joi, postcss-selector-parser,
  stylelint). Reste `braces` (GHSA-vfj7-8cjw-p6xm, outils de développement uniquement), sans
  correctif publié : **exception temporaire** dans `frontend/audit-allowlist.json`, expirant à
  `reviewBy` (7 jours) et réévaluée chaque semaine par le workflow `audit-weekly`. Le job
  `security` passe par `frontend/tools/audit-check.mjs` au lieu de `npm audit` direct.
  Décidé le 07/10/2026. (#143)

### Documentation

- **Fiches d'apprentissage** (`learning/`) : deux nouvelles fiches avec leurs flashcards et
  exports PDF / CSV Anki — *nginx reverse proxy* (`location ^~ /api/`, streaming, limites) et
  *PostgreSQL dans Docker* (explorer la base, lire et supprimer des tuples, depuis le terminal
  ou l'onglet Exec de Docker Desktop). Le style des fiches gagne les « bulles » de vulgarisation
  (citations Markdown). Ajouté le 02/10/2026. (#131)

## [1.0.1] — 02/10/2026 (depuis `DATASHARE_1.0.0`)

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
- **Accessibilité** : le texte d'aide « Laissez vide pour un lien public » du champ mot de passe
  (page d'upload) n'est plus affiché, conformément au frame Figma. Il reste lu par les
  lecteurs d'écran (`sr-only` + `aria-describedby`). Corrigé le 01/10/2026. (#129)

### Performance

- **Frontend (nginx)** : compression gzip des ressources texte (JS/CSS/JSON/SVG) et cache d'un an
  (`immutable`) sur les JS/CSS hashés ; `index.html` reste en `no-cache` pour que les
  déploiements soient pris en compte immédiatement. Ajouté le 01/10/2026. (#128, reprise de #108)

### Sécurité

- **Dépendances** : mise à jour de `brace-expansion` (5.0.9 → 5.0.12, dépendance transitive du
  frontend) pour corriger trois avis de sévérité haute (DoS). Problème détecté le 30/09/2026 par
  le job CI `security` (`npm audit`), qui échouait sur toutes les PR ; corrigé le même jour
  (30/09/2026). (#124)

[Non publié]: https://github.com/denoyela-4913/devops-project03-DataShare/compare/DATASHARE_1.0.1...master
[1.0.1]: https://github.com/denoyela-4913/devops-project03-DataShare/compare/DATASHARE_1.0.0...DATASHARE_1.0.1
