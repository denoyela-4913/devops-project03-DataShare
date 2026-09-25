# SECURITY — garanties de sécurité DataShare

Suivi de la sécurité : surface d'attaque, décisions, scans de dépendances et leur
analyse. Recoupé par [`docs/CI.md`](docs/CI.md).

## 1. Surface d'attaque

| Zone | Menaces | Traitement |
|---|---|---|
| **Authentification** | brute-force, vol/forge de JWT, énumération d'emails | BCrypt (compte) ; JWT signé HMAC, TTL court, validation `exp`/`iss` par Spring Security ; message d'erreur d'inscription non discriminant ⏳ |
| **Accès fichier** | token de téléchargement devinable, IDOR (accès aux fichiers d'autrui) | token `SecureRandom` 192 bits, non séquentiel ; `owner_id` (sujet du JWT) filtré dans la requête pour l'historique (`findByOwnerId…`) et la suppression (`findByIdAndOwnerId`) → le fichier d'autrui répond **404**, indiscernable d'un id inconnu |
| **Upload** | fichier trop gros (DoS disque), type dangereux (`.exe`…) y compris renommé, path traversal via le nom, contenu malveillant | limite **1 Go** (Spring + `client_max_body_size` nginx) ; liste noire d'extensions **+** détection du type réel par octets (`tika-core`, limitée aux formats à signature binaire — voir §2) ; nom d'objet stockage généré (jamais le nom fourni) ; antivirus hors périmètre MVP |
| **Injection** | SQL, XSS | requêtes paramétrées via JPA/Hibernate ; Angular échappe le HTML par défaut ; `Content-Type` JSON strict côté API |
| **Fuite d'information** | stacktraces, messages techniques, versions | **profil prod** : `include-stacktrace=never`, `include-message=never`, message générique + `code`, Swagger désactivé, Actuator réduit à `health` (`show-details=never`) ; front : `debugErrors=false` (garde `assert-prod-bundle`) |
| **Transport / en-têtes** | absence de HTTPS, CORS trop large, clickjacking | HTTPS au reverse-proxy ⏳ ; CORS restreint à l'origine du front ⏳ ; en-têtes de sécurité (CSP, X-Frame-Options) via nginx ⏳ |
| **Secrets** | secret JWT / identifiants BDD commités | `.gitignore` sur `.env` ; scan **gitleaks** en CI ; secrets injectés par variables d'environnement en prod (aucun défaut dans `application-prod.yml`) |

## 2. Journal des décisions

| Décision | Motif | Statut |
|---|---|---|
| Mot de passe compte haché **BCrypt** (coût par défaut), min 8 caractères | standard, résistant au bruteforce hors-ligne | ☑ (US03, `AuthService`) |
| Mot de passe fichier **haché** BCrypt (≥ 6 car.), non récupérable | le cahier des charges l'exige ; pas de mécanisme de reset | ☑ (US01, validé serveur ; contrôle client inline → backlog) |
| Token de téléchargement = `SecureRandom` **192 bits** → base64url 32 car., colonne `UNIQUE` | non prédictible (US02) | ☑ (`DownloadTokens`) |
| **Liste noire d'extensions** (`exe, bat, sh, jar…`, configurable) + nom de fichier assaini (composants de chemin retirés) **+ détection du type réel par octets** (`tika-core`, `FileService.detectContentType`/`extensionForContentType`) : le Content-Type stocké et servi au téléchargement vient de la détection, jamais du client | politique de sécurité US01 ; rattrape un exécutable/script **renommé** avec une extension autorisée — dans la limite de ce qu'une signature binaire trahit (voir note ci-dessous) | ☑ |
| ↳ Limite connue : `tika-core` (léger, sans `tika-parsers`) détecte fiablement `exe`/`dll`/`com`/`scr` (PE), `bat`/`cmd`, `sh` (shebang), `deb` (archive `ar`), `rpm` — **pas** `.msi` (conteneur OLE ambigu avec les formats Office), `.jar` (indiscernable d'un `.zip` par simple préfixe d'octets sans lire l'entrée centrale), ni les scripts texte sans signature (`ps1`, `vbs`, `vbe`, `js`, `jse`). Pour ces cas, seule la liste noire par nom de fichier protège | `tika-parsers` (détection par inspection de conteneur, plus lourd) fermerait l'écart — arbitrage poids/couverture, non fait dans le MVP | ☐ voir [`docs/BACKLOG.md`](docs/BACKLOG.md) |
| `owner_id` du fichier = **sujet du JWT** (jamais fourni par le client) | pas d'usurpation de propriétaire | ☑ |
| Stockage objet : **SDK MinIO** (protocole S3). Interface `StorageService` générique | migration vers AWS SDK v2 = réécrire seulement `S3StorageService` | ☑ ; voir [`docs/BACKLOG.md`](docs/BACKLOG.md) |
| JWT **HS256**, `oauth2-resource-server` (validation) + `oauth2-jose` / `NimbusJwtEncoder` (émission), clé HMAC ≥ 32 octets depuis l'environnement en prod | valider/émettre sans code de sécurité maison ; adapté à un monolithe | ☑ (US03/US04) |
| Access token **1 h**, **pas de refresh token** (re-login) | simplicité MVP | ☑ ; refresh → [`docs/BACKLOG.md`](docs/BACKLOG.md) |
| Message d'erreur de connexion **identique** pour email inconnu et mdp faux (401 `INVALID_CREDENTIALS`) ; cause réelle uniquement dans le champ `debug` (mode verbeux) | pas d'énumération de comptes | ☑ |
| `GET /api/me` **relit le compte en base** (pas seulement les claims) | un token valide dont le compte a été supprimé est rejeté (401) | ☑ |
| Endpoints protégés : 401 rendu au format `ErrorResponse` (`RestAuthenticationEntryPoint`) | cohérence de l'API | ☑ |
| **Deux chaînes de filtres** (`SecurityConfig`) : endpoints publics (`/api/auth/*`, `/api/d/*`, ping, health, Swagger) servis **sans aucune validation** d'un éventuel `Authorization: Bearer` ; tout le reste exige un JWT valide | bug constaté en recette : un vieux token expiré envoyé par le front faisait échouer login/inscription en 401 ; côté front, l'intercepteur n'envoie plus le token vers ces routes | ☑ (`SecurityFilterChainIT`) |
| Page de partage `/d/:token` **isolée de la session** du navigateur (en-tête toujours « Se connecter », aucune donnée du compte ouvert dans un autre onglet) | un destinataire de lien ne doit rien voir du compte connecté localement | ☑ (`app.spec`) |
| Fichier d'un autre utilisateur → **404** (pas 403) | ne pas révéler l'existence d'une ressource d'autrui | ☑ (`FileControllerIT`) |
| Image MinIO **`pgsty/minio`** (fork communautaire), **tag épinglé** — idem `pgsty/mc` | `minio/minio` retiré de Docker Hub (10/2025), miroir `quay.io/minio` devenu privé (09/2026) ; jamais de `latest` pour rester reproductible | ☑ (`deploy/`, CI, Testcontainers) ; confiance dans le fork à réévaluer, voir [`MAINTENANCE.md`](MAINTENANCE.md) |
| **Pas** de rotation automatique de la clé JWT dans le MVP | complexité (jeu de clés à validité recouvrante) disproportionnée ; à discuter | ☐ voir [`docs/BACKLOG.md`](docs/BACKLOG.md) |
| Profil **prod** durci (erreurs, Swagger, Actuator) | limiter la reconnaissance et la fuite d'info | ☑ |
| `owner_id` **nullable** (upload anonyme) + FK `ON DELETE CASCADE` | US07 ; suppression de compte propre | ☑ (schéma) |
| Uploads **streamés** (`file-size-threshold: 2MB` → disque temp) puis vers le stockage sans bufferisation intégrale | éviter l'OOM sur fichier 1 Go | ☑ |

## 3. Scan de dépendances et d'analyse statique

| Outil | Périmètre | Job CI | État |
|---|---|---|---|
| **`npm audit --audit-level=high`** | dépendances frontend | `security` | ☑ — **0 vulnérabilité** au dernier run |
| **gitleaks** | secrets dans l'historique et le diff | `security` | ☑ — aucun secret détecté |
| **OWASP dependency-check** | dépendances backend (Maven, base NVD) | `security` | ☐ à câbler (PR dédiée — 1er run long : téléchargement NVD) |
| **CodeQL** (`security-extended`) | SAST Java + TypeScript | `codeql` (workflow `codeql.yml`) : PR, push `master`, hebdo | ☑ actif — résultats dans *Security › Code scanning* |
| **SpotBugs** | *patterns* de bugs Java (ex. `NullPointerException` probable) | `security` | ☐ à câbler |
| **Dependabot** | PR de mise à jour hebdo (maven, npm, actions, docker) | — | ☑ actif — voir [`MAINTENANCE.md`](MAINTENANCE.md) |
| **Dependabot security alerts** | CVE connues des dépendances (Maven **backend compris**, npm, Actions) — alerte dans *Security › Dependabot* | — (paramètre du dépôt) | ☑ actif — couvre en partie, sans bloquer la CI, le périmètre d'OWASP dependency-check en attendant son câblage |

## 4. Analyse des résultats

- **Frontend** : `npm audit` ne remonte aucune vulnérabilité `high`/`critical` sur
  l'arbre de dépendances Angular 22 actuel. Aucune décision de dérogation nécessaire.
- **Secrets** : gitleaks ne détecte rien ; les seuls secrets du dépôt sont des valeurs
  de dev explicitement factices (`application-dev.yml`, `.env.example`).
- **Code (Java + TypeScript)** : CodeQL actif ; les alertes éventuelles sont triées dans
  *Security › Code scanning* (correction, ou rejet motivé et daté ici).
- **Backend (dépendances)** : Dependabot security alerts actives ; analyse OWASP
  dependency-check / SpotBugs en attente de câblage.

## 5. Politique

- Vulnérabilité **`high` ou `critical`** → **bloque la CI**, corrigée avant merge
  (mise à jour, ou dérogation documentée et datée dans ce fichier).
- Vulnérabilité **`moderate`** → traitée au sprint suivant (issue créée).
- Toute décision de sécurité nouvelle est ajoutée au §2.

## 6. Hors périmètre MVP (backlog)

Antivirus (ClamAV), rate-limiting / anti-bruteforce applicatif, 2FA, rotation de clé
JWT, journalisation d'audit, chiffrement au repos des fichiers. Voir
[`docs/BACKLOG.md`](docs/BACKLOG.md).
