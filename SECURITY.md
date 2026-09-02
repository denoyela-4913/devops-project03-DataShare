# SECURITY — garanties de sécurité DataShare

Suivi de la sécurité : surface d'attaque, décisions, scans de dépendances et leur
analyse. Recoupé par [`docs/CI.md`](docs/CI.md).

## 1. Surface d'attaque

| Zone | Menaces | Traitement |
|---|---|---|
| **Authentification** | brute-force, vol/forge de JWT, énumération d'emails | BCrypt (compte) ; JWT signé HMAC, TTL court, validation `exp`/`iss` par Spring Security ; message d'erreur d'inscription non discriminant ⏳ |
| **Accès fichier** | token de téléchargement devinable, IDOR (accès aux fichiers d'autrui) | token `SecureRandom` ≥ 128 bits, non séquentiel ; `owner_id` vérifié pour historique et suppression (`@PreAuthorize` / filtrage requête) |
| **Upload** | fichier trop gros (DoS disque), type dangereux (`.exe`…), path traversal via le nom, contenu malveillant | limite **1 Go** (Spring + `client_max_body_size` nginx) ; liste noire d'extensions **+** contrôle du type MIME réel ; nom d'objet stockage généré (jamais le nom fourni) ; antivirus hors périmètre MVP |
| **Injection** | SQL, XSS | requêtes paramétrées via JPA/Hibernate ; Angular échappe le HTML par défaut ; `Content-Type` JSON strict côté API |
| **Fuite d'information** | stacktraces, messages techniques, versions | **profil prod** : `include-stacktrace=never`, `include-message=never`, message générique + `code`, Swagger désactivé, Actuator réduit à `health` (`show-details=never`) ; front : `debugErrors=false` (garde `assert-prod-bundle`) |
| **Transport / en-têtes** | absence de HTTPS, CORS trop large, clickjacking | HTTPS au reverse-proxy ⏳ ; CORS restreint à l'origine du front ⏳ ; en-têtes de sécurité (CSP, X-Frame-Options) via nginx ⏳ |
| **Secrets** | secret JWT / identifiants BDD commités | `.gitignore` sur `.env` ; scan **gitleaks** en CI ; secrets injectés par variables d'environnement en prod (aucun défaut dans `application-prod.yml`) |

## 2. Journal des décisions

| Décision | Motif | Statut |
|---|---|---|
| Mot de passe compte haché **BCrypt** (coût par défaut Spring), min 8 caractères | standard, résistant au bruteforce hors-ligne | ☑ (règle codée, endpoint ⏳) |
| Mot de passe fichier **haché** (BCrypt), non récupérable | le cahier des charges l'exige ; pas de mécanisme de reset | ☐ US09 |
| Token de téléchargement = `SecureRandom` 128 bits, colonne `UNIQUE` | non prédictible (US02) | ☑ (schéma), ☐ génération |
| JWT via **`spring-security-oauth2-resource-server` + `oauth2-jose`**, clé **HMAC** | valider/émettre sans code de sécurité maison ; adapté à un monolithe | ☑ (dépendance), ☐ câblage US03/US04 |
| **Pas** de rotation automatique de la clé JWT dans le MVP | complexité (jeu de clés à validité recouvrante) disproportionnée ; à discuter | ☐ voir [`docs/BACKLOG.md`](docs/BACKLOG.md) |
| Profil **prod** durci (erreurs, Swagger, Actuator) | limiter la reconnaissance et la fuite d'info | ☑ |
| `owner_id` **nullable** (upload anonyme) + FK `ON DELETE CASCADE` | US07 ; suppression de compte propre | ☑ (schéma) |
| Uploads **streamés vers le disque** (`file-size-threshold`), jamais chargés en mémoire | éviter l'OOM sur fichier 1 Go | ☑ (config multipart), ☐ implémentation |

## 3. Scan de dépendances et d'analyse statique

| Outil | Périmètre | Job CI | État |
|---|---|---|---|
| **`npm audit --audit-level=high`** | dépendances frontend | `security` | ☑ — **0 vulnérabilité** au dernier run |
| **gitleaks** | secrets dans l'historique et le diff | `security` | ☑ — aucun secret détecté |
| **OWASP dependency-check** | dépendances backend (Maven, base NVD) | `security` | ☐ à câbler (PR dédiée — 1er run long : téléchargement NVD) |
| **CodeQL** | SAST Java + TypeScript | `security` | ☐ à câbler |
| **SpotBugs** | *patterns* de bugs Java (ex. `NullPointerException` probable) | `security` | ☐ à câbler |
| **Dependabot** | PR de mise à jour hebdo (maven, npm, actions, docker) | — | ☑ actif — voir [`MAINTENANCE.md`](MAINTENANCE.md) |

## 4. Analyse des résultats

- **Frontend** : `npm audit` ne remonte aucune vulnérabilité `high`/`critical` sur
  l'arbre de dépendances Angular 22 actuel. Aucune décision de dérogation nécessaire.
- **Secrets** : gitleaks ne détecte rien ; les seuls secrets du dépôt sont des valeurs
  de dev explicitement factices (`application-dev.yml`, `.env.example`).
- **Backend** : analyse en attente du câblage OWASP dependency-check / SpotBugs.

## 5. Politique

- Vulnérabilité **`high` ou `critical`** → **bloque la CI**, corrigée avant merge
  (mise à jour, ou dérogation documentée et datée dans ce fichier).
- Vulnérabilité **`moderate`** → traitée au sprint suivant (issue créée).
- Toute décision de sécurité nouvelle est ajoutée au §2.

## 6. Hors périmètre MVP (backlog)

Antivirus (ClamAV), rate-limiting / anti-bruteforce applicatif, 2FA, rotation de clé
JWT, journalisation d'audit, chiffrement au repos des fichiers. Voir
[`docs/BACKLOG.md`](docs/BACKLOG.md).
