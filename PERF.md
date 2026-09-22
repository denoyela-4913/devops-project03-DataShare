# PERF — suivi de performance DataShare

Méthodologie, budgets et résultats. Recoupé par [`docs/CI.md`](docs/CI.md).

> Mesures serveur (k6) : `ping`, `upload` et `download` faits, résultats et interprétation en §6.
> Mesure navigateur (Lighthouse) : run debug (Performance 56) et run hors debug via
> `ng serve --configuration production` (Performance 77) faits, résultats et interprétation
> en §6 (tableau comparatif en §3). Les budgets front et la méthodo sont définitifs.

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
| Style par composant | 4 ko | 8 ko |

Le job `assert-prod-bundle` échoue si le build dépasse l'*error*.

### Mesure actuelle (squelette, build prod)

| Métrique | Valeur |
|---|---|
| Bundle initial (brut) | ~228 ko |
| Bundle initial (transféré, gzip) | ~64 ko |
| Feuille de style globale | < 1 ko |

À suivre : évolution à chaque feature ; objectif de rester **sous le warning de 500 ko**
brut pour l'initial, lazy-loading des features.

### Navigateur

☑ Lighthouse (Performance, Accessibilité, Bonnes pratiques, SEO) — deux runs sur
`/upload` : **mode debug** (référence) et **run hors debug** via
`ng serve --configuration production` :

| Métrique | Run debug | Run hors debug (`ng serve --configuration production`) |
|---|---|---|
| Performance | 56 | 77 |
| Accessibilité | 100 | 96 |
| Bonnes pratiques | 100 | 100 |
| SEO | 91 | 91 |
| First Contentful Paint | 3,2 s | 1,9 s |
| Largest Contentful Paint | 6,6 s | 2,5 s |
| Total Blocking Time | 100 ms | 30 ms |
| Cumulative Layout Shift | 0,052 | 0,024 |
| Speed Index | 3,7 s | 1,9 s |

Interprétation détaillée du run hors debug : §6.

> **Note méthodo** : le run hors debug a été pris via le dev-server Angular en
> configuration production, pas via le nginx de `deploy/` — choix assumé pour éviter de
> monter tout le conteneur juste pour une capture, disclosé ici. Le dev-server est plus
> pénalisant que nginx (pas de minification/compression HTTP aussi poussées qu'un vrai
> `ng build --configuration production` servi statiquement), donc le score réel en
> déploiement devrait être meilleur que 77.

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
- `lighthouse-upload.png` (scores), `lighthouse-upload-details-part1-stats.png`,
  `lighthouse-upload-details-part2-diags.png` — run hors debug
  (`ng serve --configuration production`) sur `/upload` (☑ disponibles, interprétation
  en §6).
- `lighthouse-upload(DEBUG).png`, `lighthouse-upload(DEBUG)-details-part1-stats.png`,
  `lighthouse-upload(DEBUG)-details-part2-diags.png` — premier run **mode debug**,
  conservé en annexe pour comparaison (☑ disponibles, non représentatif — voir §3).
- logs serveur / métriques Actuator pertinents (⏳)

## 6. Interprétation

Pour chaque run, renseigner : charge appliquée, p95/p99, taux d'erreur, goulot
identifié (CPU / IO disque / connexions BDD / GC), action décidée.

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