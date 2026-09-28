# PERF — suivi de performance DataShare

Méthodologie, budgets et résultats. Recoupé par [`docs/CI.md`](docs/CI.md).

> Mesures serveur (k6) : `ping`, `upload` et `download` faits, résultats et interprétation en §6.
> Mesure navigateur (Lighthouse) : run debug (Performance 56), run hors debug via
> `ng serve --configuration production` (Performance 77) et run **frontend-docker + backend-prod**
> (nginx + build prod réel, Performance 99, config de déploiement la plus proche de la prod) faits,
> résultats et interprétation en §6 (tableau comparatif en §3). Les budgets front et la méthodo
> sont définitifs.

## 1. Endpoints critiques

| Endpoint | Pourquoi | Test de charge |
|---|---|---|
| `POST /api/files` | chemin le plus lourd : réception + écriture stockage | ☑ `perf/k6/upload.js` — p95 385,64 ms (seuil < 3000 ms), 0 % erreur |
| `GET /api/d/{token}` | le plus sollicité : chaque destinataire d'un lien | ☑ `perf/k6/download.js` — p95 556,42 ms (seuil < 1500 ms), 0 % erreur |
| `GET /api/ping` | référence (surcoût framework à vide) | ☑ `perf/k6/ping-smoke.js` — p95 11 ms (seuil < 300 ms), 0,01 % erreur |

## 2. Méthodologie k6

Outil : [k6](https://k6.io) (scripts dans `perf/`).

- **Profil de charge** : montée progressive (`ramping-vus`) — ex. 0→20 VUs sur 30 s,
  palier 1 min, descente 10 s.
- **Seuils** (`thresholds`) :
  - `http_req_duration: p(95) < 500` (ms) pour les endpoints légers ;
  - `http_req_failed: rate < 0.01` ;
  - seuils spécifiques upload/download à définir selon la taille de fichier testée.
- **Données** : fichiers de test de tailles variées (1 Ko, 1 Mo, 100 Mo) pour l'upload.
- **Exécution** : hors CI (charge = bruit sur *runner* partagé) ; lancé manuellement
  contre l'environnement `deploy/`. Un smoke court peut être ajouté à la CI plus tard.

```bash
cd perf
k6 run k6/ping-smoke.js
# endpoint distant :
k6 run -e BASE_URL=http://localhost:8080 k6/ping-smoke.js
```

## 3. Budget de performance front

Le back est couvert par les tests k6 ; côté front, le budget porte sur le **bundle**
et le rendu navigateur.

### Budgets déclarés (`frontend/angular.json`)

| Cible | Warning | Error |
|---|---|---|
| Bundle initial | 500 ko | 1 Mo |
| Style par composant | 6 ko | 10 ko |

Le job `assert-prod-bundle` échoue si le build dépasse l'*error*.

### Mesure actuelle (build prod, `npm run build`)

Relevé du 2026-09-28 sur `master` (`acb31b0`, après #80/#81/#83/#84/#88/#92).

| Métrique | Valeur |
|---|---|
| Bundle initial (brut) | 281,74 ko (`main` 278,33 ko + `styles` 3,40 ko) |
| Bundle initial (transféré, gzip) | 76,76 ko (`main` 75,71 ko + `styles` 1,05 ko) |
| Feuille de style globale | 3,40 ko brut / 1,05 ko transféré |
| Plus gros style de composant (CSS compilé) | ~4,7 ko (`history`), ~4,1 ko (`upload`) |

Marge : 218 ko sous le warning du bundle initial (500 ko) ; les styles de composant
restent sous le warning de 6 ko. Aucun avertissement de budget au build.

Chunks *lazy* (chargés à la navigation) :

| Chunk | Brut | Transféré |
|---|---|---|
| `history-routes` | 23,46 ko | 5,75 ko |
| `upload` | 17,58 ko | 4,77 ko |
| `download` | 7,55 ko | 2,56 ko |
| `register-routes` | 5,39 ko | 1,71 ko |
| `login-routes` | 4,43 ko | 1,55 ko |
| partagé (sans nom) | 47,16 ko | 10,59 ko |
| autres (5 petits chunks) | ~7,93 ko | ~3,11 ko |

À suivre : évolution à chaque feature ; objectif de rester **sous le warning de 500 ko**
brut pour l'initial, lazy-loading des features.

### Navigateur

☑ Lighthouse (Performance, Accessibilité, Bonnes pratiques, SEO) — trois runs sur
`/upload` : **mode debug** (référence), **run hors debug** via
`ng serve --configuration production`, et **run frontend-docker + backend-prod**
(nginx servant le build `ng build --configuration production` réel, via
`scripts/start-frontend-docker`, + backend en profil `prod` via
`scripts/start-backend-prod`) :

| Métrique | Run debug | Run hors debug (`ng serve --configuration production`) | Run frontend-docker + backend-prod (nginx, build prod réel) |
|---|---|---|---|
| Performance | 56 | 77 | 99 |
| Accessibilité | 100 | 96 | 100 |
| Bonnes pratiques | 100 | 100 | 100 |
| SEO | 91 | 91 | 82 |
| First Contentful Paint | 3,2 s | 1,9 s | 1,3 s |
| Largest Contentful Paint | 6,6 s | 2,5 s | 2,2 s |
| Total Blocking Time | 100 ms | 30 ms | 10 ms |
| Cumulative Layout Shift | 0,052 | 0,024 | 0 |
| Speed Index | 3,7 s | 1,9 s | 1,3 s |

Interprétation détaillée des runs hors debug et frontend-docker + backend-prod : §6.

> **Captures à rafraîchir** : les deux premiers runs (debug, hors debug) datent du
> 22/09, avant #80 (icône d'upload), #81/#84/#92 (contrastes WCAG AA), #83 (menu
> latéral) et #88 (`100dvh`), qui touchent le rendu de `/upload` — leurs scores restent
> indicatifs. Le run frontend-docker + backend-prod, lui, a été capturé le 28/09 sur
> `master` après ces PR (et après #99→#112) : c'est la mesure la plus représentative de
> l'état actuel et de la prod réelle.
>
> **Note méthodo** : le run hors debug a été pris via le dev-server Angular en
> configuration production, pas via le nginx de `deploy/` — choix assumé à l'époque pour
> éviter de monter tout le conteneur juste pour une capture, disclosé ici. Le dev-server
> est plus pénalisant que nginx (pas de minification/compression HTTP aussi poussées
> qu'un vrai `ng build --configuration production` servi statiquement) : le run
> frontend-docker + backend-prod confirme cette hypothèse (99 vs 77 prédit meilleur).

Pages restantes à couvrir au fil des écrans livrés. Cible indicative : Performance ≥ 90,
Accessibilité ≥ 95.

## 4. Métriques suivies

| Métrique | Source | Cible indicative |
|---|---|---|
| Temps de réponse API (p50 / p95 / p99) | k6 | p95 < 500 ms (endpoints légers) |
| Taux d'erreur HTTP | k6 | < 1 % |
| Débit upload / download | k6 + taille fichier | à établir |
| Taille du bundle initial | `ng build` | < 500 ko brut |
| Temps de build front | CI | suivi (régression) |
| Score Lighthouse | manuel | Perf ≥ 90, A11y ≥ 95 |

## 5. Captures

À déposer dans `docs/screenshots/` (voir
[`docs/screenshots/README.md`](docs/screenshots/README.md)) :

- `k6-ping.png`, `k6-upload.png`, `k6-download.png` — captures des sorties du premier
  run pour chaque script (☑ disponibles, interprétation en §6).
- `lighthouse-upload-prod.png` (scores) et
  `detailled/lighthouse-upload-prod-all_details.pdf` (rapport complet) — run
  **frontend-docker + backend-prod** (nginx, build prod réel) sur `/upload`
  (☑ disponibles, interprétation en §6).
- `lighthouse-download-prod.png` et
  `detailled/lighthouse-download-prod-all_details.pdf` — même config, page `/d/:token`
  (lien réel protégé par mot de passe, run capturé séparément le même jour) (☑
  disponibles, interprétation et comparaison avec `/upload` en §6).
- `detailled/dev/lighthouse-upload-dev_v1_no DEBUG.png` (+
  `-details-part1-stats.png`/`-part2-diags.png`) — run hors debug
  (`ng serve --configuration production`) sur `/upload` (☑ disponibles, interprétation
  en §6 ; déplacés depuis la racine par #109).
- `detailled/dev/lighthouse-upload-dev_v1.png` (+ `-details-part1-stats.png`/
  `-part2-diags.png`) — premier run **mode debug**, conservé en annexe pour
  comparaison (☑ disponibles, non représentatif — voir §3 ; déplacés depuis la racine
  par #109).
- logs serveur / métriques Actuator pertinents (⏳)

## 6. Interprétation

Pour chaque run, renseigner : charge appliquée, p95/p99, taux d'erreur, goulot
identifié (CPU / IO disque / connexions BDD / GC), action décidée.

> **Effet des évolutions front #80/#81/#83/#84/#88/#92 sur k6** : aucun. k6 mesure l'API ;
> ces PR ne touchent que `frontend/src` et des docs de design, et ni le backend ni `perf/`
> n'ont changé depuis les runs du 22/09. Les résultats ci-dessous restent valables.

### `ping-smoke.js` — premier run

- **Charge** : rampe 0→10 VUs sur 50 s, palier tenu ~1 min (`running 1m11.2s`).
- **Résultat** : 52 098 requêtes, 731,9 req/s ; p95 = 11 ms, p90 = 8,98 ms,
  moy. = 5,87 ms, max = 29,75 ms — largement sous le seuil `p(95) < 300 ms`.
- **Taux d'erreur** : 0,01 % (9 requêtes sur 52 098) — sous le seuil `< 1 %` ; à
  surveiller si ça se reproduit sur un run plus long, mais négligeable en volume.
- **Goulot** : aucun — endpoint de référence à vide, temps de réponse dominé par le
  round-trip réseau local.
- **Action** : aucune ; sert de ligne de base pour comparer les endpoints applicatifs.

### `upload.js` — premier run

- **Charge** : rampe 0→5 VUs sur 50 s (`vus_max=5`).
- **Résultat** : 724 requêtes, 14,48 req/s ; p95 = 385,64 ms, p90 = 355,26 ms,
  moy. = 266,12 ms, max = 565,67 ms — sous le seuil `p(95) < 3000 ms` avec large
  marge ; 760 Mo envoyés au total (15 Mo/s) sur la durée du run.
- **Taux d'erreur** : 0 % (0/724, tous les uploads renvoient 201 + token).
- **Goulot** : non identifié à ce niveau de charge (5 VUs) — écriture stockage (MinIO)
  et streaming disque temporaire (`file-size-threshold: 2MB`) à surveiller à charge plus
  élevée ou avec des fichiers proches de la limite de 1 Go.
- **Action** : aucune à ce stade ; reste à tester avec des fichiers de tailles variées
  (1 Ko / 1 Mo / 100 Mo, cf. §2) et une charge plus soutenue avant la mise en prod.

### `download.js` — premier run

- **Charge** : rampe 0→5 VUs sur 50 s (`vus_max=5`).
- **Résultat** : 980 requêtes HTTP (489 itérations × 2 appels : métadonnées puis
  téléchargement), 19,4 req/s ; p95 = 556,42 ms, p90 = 450,78 ms, moy. = 199,29 ms,
  max = 1,04 s — sous le seuil `p(95) < 1500 ms` ; 513 Mo reçus au total (10 Mo/s).
- **Taux d'erreur** : 0 % (0/980) ; les 4 checks (statut métadonnées, protection mdp,
  statut téléchargement, en-tête `Content-Disposition`) passent à 100 %.
- **Goulot** : non identifié à ce niveau de charge — le p95 (556 ms) est nettement plus
  élevé que celui de l'upload (386 ms) pour un payload comparable : à comprendre (lecture
  MinIO + streaming de la réponse vs. écriture) avant de monter en charge.
- **Action** : creuser l'écart upload/download au prochain run ; tester avec des fichiers
  plus gros et une charge plus soutenue avant la mise en prod.

### Lighthouse — run hors debug (`ng serve --configuration production`)

- **Contexte** : run pris via le dev-server Angular en configuration production (pas
  nginx, cf. note méthodo en §3) — choix assumé pour ne pas monter tout le conteneur
  `deploy/` juste pour une capture d'écran.
- **Résultat** : Performance 77 (+21 pts vs 56 en debug), Accessibilité 96 (-4 pts vs
  100), Bonnes pratiques 100 (stable), SEO 91 (stable). Amélioration nette sur les Core
  Web Vitals : FCP 1,9 s (vs 3,2 s), LCP 2,5 s (vs 6,6 s — plus gros gain), TBT 30 ms
  (vs 100 ms), CLS 0,024 (vs 0,052), Speed Index 1,9 s (vs 3,7 s).
- **Lecture** : confirme le diagnostic posé sur le run debug — le score de 56 était bien
  tiré vers le bas par le mode debug (bundle non minifié/tree-shaké), pas par un problème
  structurel de l'appli. La seule levée du flag debug suffit à sortir Performance de la
  zone rouge, mais reste sous la cible de 90.
- **Goulot restant** : diagnostic dominant inchangé dans sa nature — JS toujours trop
  volumineux (« Réduisez la taille des ressources JavaScript », ~1701 Kio d'économies
  estimées ; 142 Kio de JS inutilisé ; 4 tâches longues sur le thread principal). Cohérent
  avec la note méthodo : même en configuration production, `ng serve` ne minifie/ne
  compresse pas au niveau d'un vrai `ng build --configuration production` servi par
  nginx (pas de gzip/brotli HTTP, bundling moins poussé) — le score en déploiement réel
  devrait donc être meilleur que 77.
- **Accessibilité** : léger recul (96 vs 100) non diagnostiqué par cette capture (pas de
  détail capturé sur la cause) ; à vérifier au prochain run — aucune régression
  fonctionnelle connue par ailleurs (front testé unitairement/e2e sans alerte a11y).
- **Action** : pas de refonte requise avant la soutenance — un score de 77 dans des
  conditions volontairement pénalisantes (dev-server, pas nginx) est un argument
  rassurant plutôt qu'un point faible à cacher. Si le temps le permet : (1) un run via un
  vrai build + `deploy/` (nginx) pour confirmer le score réel de prod ; (2) creuser
  l'écart Accessibilité 96/100.

### Lighthouse — run frontend-docker + backend-prod (nginx, build prod réel)

- **Contexte** : run pris via `scripts/start-frontend-docker` (build de
  `frontend/Dockerfile`, nginx servant le vrai `ng build --configuration production`,
  port 8082) avec le backend en profil `prod` via `scripts/start-backend-prod` (port
  8080) — la config la plus proche d'un déploiement réel testée à ce jour, répondant au
  point ouvert du run précédent. Capturé le 28/09/2026 22:12 sur `/upload`, Lighthouse
  13.4.1, Moto G Power émulé, throttling Slow 4G, page unique (même méthodo mobile que
  les deux runs précédents).
- **Résultat** : Performance 99 (+22 pts vs 77 en `ng serve` prod, +43 pts vs 56 en
  debug), Accessibilité 100 (retour au niveau du run debug, +4 pts vs 96), Bonnes
  pratiques 100 (stable), SEO 82 (-9 pts vs 91 — nouvelle régression, cf. ci-dessous).
  Core Web Vitals meilleurs sur toute la ligne : FCP 1,3 s (vs 1,9 s), LCP 2,2 s
  (vs 2,5 s), TBT 10 ms (vs 30 ms), CLS 0 (vs 0,024), Speed Index 1,3 s (vs 1,9 s).
- **Lecture** : confirme l'hypothèse de la note méthodo du run précédent — un vrai
  `ng build --configuration production` servi par nginx (minification, compression HTTP,
  pas de dev-server) fait nettement mieux qu'un `ng serve` en configuration production.
  Poids total transféré 123 KiB (vs ~1701 Kio de JS estimés « à économiser » sur le run
  dev-server) ; JS inutilisé résiduel 33 KiB seulement (vs 142 Kio). Ce run valide la
  chaîne de déploiement (`frontend/Dockerfile` + nginx) comme fidèle à la prod réelle.
- **Goulot restant (perf)** : quasi aucun à ce niveau — TBT 10 ms, CLS 0, 1 seule tâche
  longue sur le thread principal (56 ms, `main-KFKO6TW5.js`), JS inutilisé résiduel 33
  KiB sur ce même bundle (83,8 KiB transférés), latence max de la chaîne de dépendances
  réseau 62 ms (`/upload` → `main.js` → 5 chunks lazy en cascade). Rien qui justifie une
  action avant la cible de 90 — déjà dépassée (99).
- **Régression SEO (82, -9 pts)** : deux audits en échec. (1) Pas de meta description —
  connu, présent sur les 3 runs, jamais corrigé. (2) `robots.txt` invalide, 13 erreurs —
  **nouveau**, spécifique à cette config : le fallback SPA de nginx renvoie `index.html`
  (200) sur `/robots.txt` au lieu d'un 404 ou d'un vrai fichier, et Lighthouse tente de
  parser ce HTML comme un robots.txt (échec sur chaque ligne). Absent des deux runs
  précédents (dev-server), où `/robots.txt` renvoyait une 404 non auditée de la même
  façon par ce contrôle.
- **Bonnes pratiques — points non comptés dans le score** : CSP absente (mode
  enforcement), pas de HSTS, pas de COOP, pas de contrôle de frame (XFO/CSP
  `frame-ancestors`), pas de Trusted Types — tous listés « High severity » par Lighthouse
  mais sur des audits **non scorés** (n'affectent pas le 100/100). Relève d'un
  durcissement des en-têtes HTTP nginx, hors périmètre perf — à évaluer côté
  [SECURITY.md](SECURITY.md) si prévu.
- **Action** : (1) ajouter une meta description dans `index.html` — corrige le seul
  audit SEO commun aux 3 runs ; (2) servir un vrai `robots.txt` statique (200, syntaxe
  valide) depuis le nginx du conteneur plutôt que de laisser le fallback SPA le
  capturer — corrige la régression propre à ce run ; (3) ce run devient la référence
  « prod » de PERF.md ; les deux runs précédents restent en historique (effet du retrait
  du flag debug, puis effet d'un vrai build + serveur de prod).

### Lighthouse — run frontend-docker + backend-prod : téléchargement (`/d/:token`)

- **Contexte** : même config que le run précédent (nginx build prod réel, port 8082 +
  backend `prod`, port 8080), même méthodo (Lighthouse 13.4.1, Moto G Power émulé, Slow
  4G, page unique), mais capturé séparément le 28/09/2026 20:11 (2 h avant le run
  `/upload` du même jour) sur un lien réel **protégé par mot de passe** (`DESIGN.pdf`,
  0,1 Mo, expire dans 3 jours — comportement US09).
- **Scores et métriques, comparés au run `/upload`** :

  | Métrique | `/upload` | `/d/:token` (download) | Écart |
  |---|---|---|---|
  | Performance | 99 | 97 | -2 |
  | Accessibilité | 100 | 100 | = |
  | Bonnes pratiques | 100 | 100 | = |
  | SEO | 82 | 83 | +1 |
  | First Contentful Paint | 1,3 s | 1,5 s | +0,2 s |
  | Largest Contentful Paint | 2,2 s | 2,2 s | = |
  | Total Blocking Time | 10 ms | 10 ms | = |
  | Cumulative Layout Shift | 0 | 0,076 | +0,076 |
  | Speed Index | 1,3 s | 1,5 s | +0,2 s |
  | Poids total transféré | 123 KiB | 124 KiB | +1 KiB |
  | JS inutilisé (bundle principal) | 33 KiB | 26 KiB | -7 KiB |
  | Latence max chaîne critique réseau | 62 ms | 114 ms | +52 ms |
  | Éléments DOM | 24 | 38 | +14 |
  | Tâches longues (thread principal) | 1 (56 ms) | 2 (83 ms × 2) | +1 tâche |

- **Lecture** : les deux pages partagent le même bundle principal
  (`main-KFKO6TW5.js`, ~84 KiB) et plusieurs chunks lazy identiques (`chunk-CnLuz6zt.js`,
  `chunk-DxjXrnL9.js`) — attendu, même app Angular. Poids total et JS inutilisé du même
  ordre de grandeur ; download a même moins de JS inutilisé (26 vs 33 KiB), sa vue
  affichant plus d'éléments dynamiques (info fichier, bannière d'expiration, champ mot
  de passe) qui consomment une part du code déjà chargé.
- **Écart notable — CLS 0,076 (vs 0 sur upload)** : culprit identifié par Lighthouse,
  le composant `app-download`. Cause probable, visible dans la chaîne de dépendances
  réseau : l'appel métadonnées (`GET /api/d/{token}`) est chaîné **derrière** le
  chargement du bundle JS (`/d/{token}` → `main.js` → 4 chunks → **rappel de
  `/d/{token}`** à 114 ms) plutôt que lancé en parallèle — la bannière d'expiration et
  le champ mot de passe n'apparaissent donc qu'une fois cette réponse reçue, décalant
  la mise en page après le premier rendu. Cohérent avec l'« Element render delay » du
  LCP, plus élevé ici (100 ms vs 70 ms sur upload).
- **Écart notable — latence max de la chaîne critique quasi doublée (114 ms vs
  62 ms)** : directement lié au point précédent, un maillon de plus dans la chaîne
  (le rappel vers l'API de métadonnées). Sans conséquence sur les Core Web Vitals ici
  (page toujours sous les seuils), mais un axe d'optimisation si la page grossit :
  paralléliser l'appel métadonnées plutôt que de le faire dépendre du bundle JS
  complet.
- **SEO (83 vs 82)** : mêmes deux causes que sur `/upload` — pas de meta description,
  `robots.txt` invalide à cause du fallback SPA nginx (confirmé identique sur cette
  page). L'écart d'1 point n'est pas significatif (pondération des audits, pas un
  audit supplémentaire en jeu).
- **Action** : les deux correctifs SEO déjà proposés pour `/upload` (meta description,
  `robots.txt` statique) corrigent aussi ce run — un seul chantier, pas deux. Si le
  temps le permet, enquêter sur le séquencement JS → appel métadonnées de `/d/:token`
  (déclencher l'appel API en parallèle du bootstrap Angular plutôt qu'après) pour
  supprimer le CLS résiduel et rapprocher `/d/:token` du score de `/upload`.
