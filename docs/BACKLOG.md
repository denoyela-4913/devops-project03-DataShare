# Backlog / éléments différés

Ce qui a été volontairement écarté d'une PR, avec le contexte, pour ne pas le perdre.

## PR « gestion de la clé » (à discuter)

Reprise d'une idée du Projet 2 : la clé de signature JWT (secret propre à la machine)
porterait un contrôle d'âge — si elle a plus de 24 h, on la vérifie / régénère.

**Statut : non planifié.** À reprendre avec un **point de vue critique** avant toute
implémentation. Points à instruire :

- Une rotation du secret HMAC toutes les 24 h invalide tous les tokens en cours, sauf
  à gérer un jeu de clés à validité recouvrante (identifiées par `kid`).
- Avec des access tokens courts (15–60 min) et sans refresh token, une rotation
  quotidienne est très perturbante pour l'utilisateur.
- Alternatives plus simples : secret stable géré par un gestionnaire de secrets / variable
  d'environnement ; ou RS256 + endpoint JWKS avec rotation propre (publication de la
  nouvelle clé, conservation de l'ancienne le temps du recouvrement, retrait).
- Pour un MVP évalué, un secret stable bien géré suffit généralement ; la rotation est
  un sujet d'exploitation qui peut être **documenté dans `MAINTENANCE.md`** sans code.

## Upload de fichiers (US01) — améliorations différées

- **Détection de type par magic-bytes** (Apache Tika ou équivalent) : aujourd'hui, contrôle
  par extension + `Content-Type` déclaré uniquement. Un `.exe` renommé `.pdf` passe.
- **Antivirus** (ClamAV en side-car) : hors périmètre MVP.
- **Multipart upload S3** géré explicitement pour les très gros fichiers (le SDK MinIO le
  fait déjà en interne pour `putObject` avec taille connue ; à valider sur du 1 Go réel).
- **SDK stockage** : SDK MinIO 8.5.x retenu (okhttp 4.x, résolution Maven propre). MinIO 9.x
  tire okhttp 5.x multiplateforme qui ne se résout pas sans métadonnées Gradle. Migration
  vers AWS SDK v2 possible = réécrire seulement `S3StorageService`.
- **Message d'erreur inline** pour le mot de passe du fichier trop court (aujourd'hui :
  validé serveur, affiché via `ErrorToast`).
- **Compte supprimé** : un upload avec un token valide dont le compte a disparu échoue en
  500 (violation de clé étrangère `owner_id`) — pourrait être un 401 explicite.

## Couverture de tests

- **Back : porte à 70 % active** (PR #0006) — `jacoco:merge` + `jacoco:check` au `verify`.
- **Front : porte à 70 % active** (PR #0007) — `tools/check-coverage.mjs` dans `frontend-integ`.

## Rotation / refresh token JWT

Pas de refresh token dans le MVP (re-login à l'expiration, 1 h). Un refresh token
(rotation, révocation, stockage httpOnly) est un ajout naturel post-MVP.

## Scans de sécurité à câbler

Job CI `security` : actuellement gitleaks + `npm audit`. À ajouter dans une PR dédiée :

- **OWASP dependency-check** (Maven) — CVE des dépendances backend. 1er run long
  (téléchargement de la base NVD) → prévoir le cache / une clé API NVD.
- **CodeQL** — SAST Java + TypeScript (workflow `codeql.yml` séparé possible).
- **SpotBugs** (`spotbugs-maven-plugin`) — *patterns* de bugs Java. Exige la
  compilation, d'où sa place dans `security` et non `lint-back`.

## Durcissement HTTP (prod)

CORS restreint à l'origine du front, en-têtes de sécurité via nginx (CSP,
X-Frame-Options, X-Content-Type-Options, Referrer-Policy), HTTPS au reverse-proxy.
À traiter avec la PR de déploiement.

## Conteneurisation complète

`docker-compose.prod.yml` (backend + frontend nginx + db) et les scripts d'installation
complets : PR ultérieure dédiée au déploiement.
