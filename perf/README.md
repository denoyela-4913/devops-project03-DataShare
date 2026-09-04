# perf/ — tests de performance

Tests de charge [k6](https://k6.io). Méthodologie et interprétation : [`../PERF.md`](../PERF.md).

## Installation de k6

| OS | Commande |
|---|---|
| Windows | `winget install k6.k6` ou `choco install k6` |
| macOS | `brew install k6` |
| Linux | voir <https://grafana.com/docs/k6/latest/set-up/install-k6/> |
| Docker | `docker run --rm -i grafana/k6 run - < k6/ping-smoke.js` |

## Lancer

```bash
cd perf

# étalon local (backend sur :8080)
k6 run k6/ping-smoke.js

# cible explicite
k6 run -e BASE_URL=http://localhost:8080 k6/ping-smoke.js
```

## Scripts

| Script | Cible | État |
|---|---|---|
| `k6/ping-smoke.js` | `GET /api/ping` — étalon | disponible |
| `k6/upload.js` | `POST /api/files` (auth) | disponible — voir en-tête du script pour le token |
| `k6/download.js` | `GET /api/d/{token}` | à créer (PR US02) |

Les tests de charge **ne tournent pas en CI** (bruit sur *runner* partagé) : ils sont
lancés à la main contre l'environnement `deploy/`. Déposer les captures de résultats
dans `docs/screenshots/`.
