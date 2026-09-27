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

- **Détection de type par magic-bytes — fait, avec une limite connue** : `FileService.upload`
  détecte le type réel par octets (`tika-core`) et le compare, comme l'extension déclarée, à
  `datashare.files.blocked-extensions`. Un `.exe`/`.dll`/`.com`/`.scr` (signature PE), `.bat`/
  `.cmd`, `.sh` (shebang), `.deb` ou `.rpm` renommé `.pdf` est désormais rejeté — voir `SECURITY.md` §2 et les
  tests de `FileServiceTest` (un par famille détectable).
  **Limite** : `tika-core` (choisi léger, sans `tika-parsers`) ne reconnaît que les formats à
  signature binaire propre. Restent non détectables par le contenu, seule la liste noire par
  nom de fichier les arrête : `.msi` (conteneur OLE, partagé avec les formats Office — besoin
  d'inspecter les flux internes, pas juste un préfixe d'octets), `.jar` (indiscernable d'un
  `.zip` générique sans lire l'entrée centrale du zip, hors de portée d'une détection par
  préfixe), et les scripts texte sans signature (`.ps1`, `.vbs`, `.vbe`, `.js`, `.jse`).
  **Solution de remplacement plus lourde (à instruire, PR future)** : `tika-parsers` (ou son
  sous-module de détection de conteneurs) inspecte réellement le contenu des archives ZIP/OLE
  au lieu d'un simple préfixe d'octets — fermerait l'écart `.msi`/`.jar`. Coût : dépendance
  nettement plus lourde (dizaines de libs transitives — PDFBox, POI, etc. — contre 3 libs
  légères pour `tika-core` seul) pour un gain limité à 2 des 17 extensions de la liste noire,
  les scripts texte restant de toute façon hors de portée d'une détection par contenu. À
  arbitrer si le besoin devient concret (signal d'abus réel plutôt que possibilité théorique).
- **Antivirus** (ClamAV en side-car) : hors périmètre MVP.
- **Multipart upload S3** géré explicitement pour les très gros fichiers (le SDK MinIO le
  fait déjà en interne pour `putObject` avec taille connue ; à valider sur du 1 Go réel).
- **SDK stockage — résolu** : SDK MinIO **8.6.0**. okhttp ≥ 5.x est publié en module Kotlin
  Multiplatform (le jar Maven « plain » `com.squareup.okhttp3:okhttp` est un stub vide, les
  classes réelles vivent dans `okhttp-jvm`, invisible pour une résolution Maven pure sans
  redirection de POM). Contournement : exclusion du stub + redéclaration explicite de
  `okhttp-jvm` à la même version dans `backend/pom.xml` (à revalider à chaque bump de
  `minio.version` via `mvn dependency:tree -Dincludes=com.squareup.okhttp3:okhttp`).
  Migration vers AWS SDK v2 possible = réécrire seulement `S3StorageService`.
- **Message d'erreur inline** pour le mot de passe du fichier trop court (aujourd'hui :
  validé serveur uniquement, erreur affichée en tête de carte via `<app-form-error>`, pas
  sous le champ — aucun validateur client `minLength(6)`).
- **Message de succès : durée pas toujours celle du dernier upload — corrigé** (bug
  constaté en recette après #53) : « Félicitations, ton fichier sera conservé chez nous
  pendant … ! » pouvait afficher la durée d'un upload précédent plutôt que celle du
  dernier fichier envoyé, `expirationSentence` (`upload.ts`) étant un `computed` lu sur le
  contrôle de formulaire `expiration` (que `uploadAnother()` remet à `'7'`) et non sur la
  réponse serveur. Corrigé en déduisant la phrase de `expiresAt`, renvoyé par
  `POST /api/files` (`Instant.now().plus(days, ChronoUnit.DAYS)` côté `FileService`) : le
  nombre de jours restants avant expiration est arrondi et rapproché de la durée proposée
  la plus proche (1, 3 ou 7 j). Couvert par un test d'intégration qui enchaîne
  7 j → 3 j → 1 j dans `upload.integ.spec.ts`.
- **Compte supprimé** : un upload avec un token valide dont le compte a disparu échoue en
  500 (violation de clé étrangère `owner_id`) — pourrait être un 401 explicite.

## Téléchargement de fichiers (US02) — améliorations différées

- **Chargement en mémoire navigateur** : le front récupère le fichier en `Blob` (fetch)
  avant de déclencher l'enregistrement. Pour un fichier proche de 1 Go sur un appareil
  contraint, c'est risqué. Alternative : POST → « ticket » court à usage unique, puis
  navigation native vers un `GET` streamé (`Content-Disposition`), le navigateur écrit
  directement sur disque. Écarté du MVP pour rester aligné sur le contrat documenté
  (`GET`/`POST /api/d/{token}`) et le niveau de l'upload (déjà bufferisé).
- **Requêtes Range / reprise de téléchargement** : non supporté (téléchargement complet
  uniquement). À ajouter si lecture de médias volumineux en flux.
- **Composant `password-field`** dédié (afficher/masquer) : aujourd'hui un simple
  `app-ui-input` + `type="password"`.
- **Lien à usage unique / compteur de téléchargements** : le lien reste valide jusqu'à
  expiration (téléchargements multiples), comme un lien WeTransfer.

## Expiration des fichiers (US10) — planifié

Un fichier expiré reste en base et dans MinIO jusqu'à suppression. Aujourd'hui :

- l'UI affiche « Ce fichier a expiré » et retire les actions sur la carte ;
- le nettoyage se fait **à la main** via `deploy/purge-expired.sh` (profil Spring
  `purge` → `com.datashare.maintenance.ExpiredFilePurger`).

**US10 = rendre cette purge automatique** : un `@Scheduled` (`@EnableScheduling`,
un profil `prod` actif) qui appelle `ExpiredFilePurger.purge()` périodiquement.
La logique existe déjà et est testée (`ExpiredFilePurgerIT`) — US10 n'ajoute que le
déclencheur. Nécessaire pour les comptes abandonnés dont le propriétaire ne revient
jamais purger sa liste.

## Historique / suppression de fichiers (US05/US06) — améliorations différées

- **Pagination de `GET /api/files`** : la liste complète est renvoyée. Suffisant tant
  que le nombre de fichiers par compte reste faible (les fichiers expirent en ≤ 7 j).
  À paginer (`Pageable`, scroll/pagination front) si ça grandit.
- **Suppression du stockage best-effort** : `DELETE /api/files/{id}` retire la ligne puis
  `storage.delete` en `try/catch` (log si échec). Un échec du stockage laisse un objet
  orphelin inoffensif ; pas de mécanisme de rejeu/compensation. Un audit MinIO ponctuel
  suffirait à nettoyer.
- **Filtre Tous/Actifs/Expiré côté client** : appliqué sur la liste déjà chargée, pas de
  paramètre serveur. Cohérent avec l'absence de pagination.

## Affichage des erreurs / notifications — différé

- **Token de succès (vert)** : `form-notice` utilise pour l'instant les tokens Callout
  Info (bleu), faute de token vert au dépôt. À demander à Cursor si le design veut un
  vrai « succès ».
- **Retour « lien copié »** : le bouton « Copier le lien » de `file-card` (`/history`)
  n'a aucun retour visuel. Pourrait réutiliser `<app-form-notice>` (« Lien copié »).
- **`error-toast` / détail dev** : le filet global garde l'info-bulle `title` pour le
  détail technique (rare : surtout des pannes réseau sans `debug`). Un `<details>` comme
  dans `form-error` serait plus accessible si le besoin apparaît.

## Couverture de tests

- **Back : porte à 70 % active** (PR #0006) — `jacoco:merge` + `jacoco:check` au `verify`.
- **Front : porte à 70 % active** (PR #0007) — `tools/check-coverage.mjs` dans `frontend-integ`.

## Rotation / refresh token JWT

Pas de refresh token dans le MVP (re-login à l'expiration, 1 h). Un refresh token
(rotation, révocation, stockage httpOnly) est un ajout naturel post-MVP.

## Scans de sécurité à câbler

Job CI `security` : actuellement gitleaks + `npm audit` ; **CodeQL** fait (workflow
`codeql.yml`) et **Dependabot security alerts** activées. À ajouter dans une PR dédiée :

- **OWASP dependency-check** (Maven) — CVE des dépendances backend, **bloquant en CI**
  (les alertes Dependabot ne bloquent pas). 1er run long (téléchargement de la base NVD)
  → prévoir le cache / une clé API NVD.

**SpotBugs — écarté du MVP, essai fait.** `spotbugs-maven-plugin` exige la compilation
(donc sa place naturelle serait `security`, pas `lint-back`) ; avant de le câbler, essai
réel sans toucher au repo : `mvn com.github.spotbugs:spotbugs-maven-plugin:4.8.6.4:spotbugs`
sur le code compilé en JDK 21 (celui du projet et de la CI). **9 findings, tous priorité 2
(medium)** :

- **7× `EI_EXPOSE_REP2`** (le constructeur garde une référence directe à un objet mutable
  reçu) — `RestAuthenticationEntryPoint`, `DownloadController`, `FileController`,
  `FileProperties`, `FileService`, `ExpiredFilePurger`, `PurgeRunner`.
- **1× `EI_EXPOSE_REP`** — `FileProperties.blockedExtensions`, un getter renvoie la
  collection interne mutable (même famille que ci-dessus).
- **1× `DM_EXIT`** — `PurgeRunner.run` appelle `System.exit(...)`.

`EI_EXPOSE_REP`/`EI_EXPOSE_REP2` (8 findings sur 9, ~89 %) sont un pattern quasi
systématique sur du Spring en injection par constructeur : un bean injecté est censé être
partagé, pas copié défensivement — bruit de contexte plutôt qu'un vrai risque ici. Seul
`DM_EXIT` mérite un vrai coup d'œil manuel, et un signal isolé ne justifie pas d'intégrer
et maintenir tout un outil (config des exclusions, faux positifs à trier à chaque run,
etc.) pour le MVP. **Décision : hors MVP** ; à revisiter si le code s'étoffe (plus de
logique métier = plus de vrais bugs `NPE`/`null` détectables) ou si un jeu de détecteurs
plus adapté au DI Spring apparaît.

*Note d'environnement* : l'essai a d'abord échoué sous JDK 25 (`Unsupported class file
major version 69` — le moteur ASM de SpotBugs 4.8.6.4 ne lit pas le bytecode compilé/livré
par un JDK aussi récent, y compris les classes du JDK lui-même) ; il faut un JDK dont
SpotBugs supporte la version de class-file, JDK 21 dans notre cas.

## Durcissement HTTP (prod)

CORS restreint à l'origine du front, en-têtes de sécurité via nginx (CSP,
X-Frame-Options, X-Content-Type-Options, Referrer-Policy), HTTPS au reverse-proxy.
À traiter avec la PR de déploiement.

## Image MinIO (fork `silo`)

**Fait** : MinIO tourne sur `ghcr.io/denoyela-4913/silo` (notre fork de `pgsty/silo`, image
construite en CI et publiée sur GHCR, `mcli` embarqué), voir [`MAINTENANCE.md`](../MAINTENANCE.md).
Reste à décider à terme : suivre `pgsty/silo` (mises à jour de sécurité manuelles), publier
aussi `linux/arm64`, ou basculer vers AWS S3 (seul `S3StorageService` à réécrire). Un
scanner d'images (Trivy/Grype) en CI donnerait la liste réelle des CVE de l'image.

## Cible iPhone (Safari iOS) — limites connues

Cible web responsive (pas d'application native). Traité : hauteur de page `100vh` + `100dvh`,
champs à 16 px (pas de zoom automatique), job Cypress WebKit `frontend-e2e-webkit` (essai,
non requis). Restent :

- **Test sur un iPhone réel** : WebKit sous Linux ne reproduit ni les barres rétractables,
  ni la mémoire d'iOS, ni le toucher. Passage manuel à prévoir avant la soutenance.
- **Téléchargement en `Blob`** : le fichier est chargé en entier en mémoire de l'onglet
  (`download.ts`, `saveBlob`). Acceptable pour le MVP ; un gros fichier (proche de 1 Go)
  peut échouer sur iPhone. Piste : lien natif en flux (`GET`) avec, pour les fichiers
  protégés, un jeton court à usage unique plutôt que le mot de passe dans l'URL.
- **Upload long** : iOS suspend l'onglet en arrière-plan (écran verrouillé) et l'envoi peut
  échouer ; pas de reprise ni de barre de progression.
- **Zones sûres** (`safe-area-inset`) : sans objet tant qu'on reste dans Safari sans
  `viewport-fit=cover` ; à traiter si on ajoute un fond plein écran ou une PWA
  installable (manifeste, icône, mode plein écran).
- **Job WebKit non requis** : à rendre obligatoire s'il se révèle stable ; les parcours
  s'adaptent au viewport (menu latéral sous 833 px pour la déconnexion).

## Conteneurisation complète

`docker-compose.prod.yml` (backend + frontend nginx + db) et les scripts d'installation
complets : PR ultérieure dédiée au déploiement.
