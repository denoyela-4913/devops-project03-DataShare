# PERF — suivi de performance DataShare

Méthodologie, budgets et résultats. Recoupé par [`docs/CI.md`](docs/CI.md).

> Les mesures serveur (k6) et navigateur (Lighthouse) sont ⏳ jusqu'à l'arrivée des
> endpoints critiques. Les budgets front et la méthodo sont définitifs.

## 1. Endpoints critiques

| Endpoint | Pourquoi | Test de charge |
|---|---|---|
| `POST /api/files` | chemin le plus lourd : réception + écriture stockage d'un fichier jusqu'à 1 Go | ⏳ PR US01 |
| `GET /api/d/{token}` | le plus sollicité : chaque destinataire d'un lien | ⏳ PR US02 |
| `GET /api/ping` | référence (surcoût framework à vide) | ☑ `perf/k6/ping-smoke.js` |

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

⏳ Lighthouse (Performance, Accessibilité, Best Practices) sur les pages clés une fois
les écrans en place. Cible indicative : Performance ≥ 90, Accessibilité ≥ 95.

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

- `k6-upload.png`, `k6-download.png` — synthèse d'un run (⏳ PR US01/US02)
- `lighthouse-*.png` — rapport par page clé (⏳)
- logs serveur / métriques Actuator pertinents

## 6. Interprétation (gabarit)

Pour chaque run, renseigner : charge appliquée, p95/p99, taux d'erreur, goulot
identifié (CPU / IO disque / connexions BDD / GC), action décidée.
