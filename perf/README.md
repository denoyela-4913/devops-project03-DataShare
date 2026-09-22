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

### Via Docker (si k6 n'est pas installable localement)

⚠️ Dans le conteneur, `localhost` désigne le conteneur lui-même, pas la machine hôte où
tournent le front/back : il faut cibler `host.docker.internal` (résolu nativement par
Docker Desktop sous Windows/macOS), sinon les requêtes échouent sans jamais atteindre
le backend (0 octet échangé).

```bash
cd perf

docker run --rm -i grafana/k6 run -e BASE_URL=http://host.docker.internal:8080 - < k6/ping-smoke.js

docker run --rm -i grafana/k6 run -e BASE_URL=http://host.docker.internal:8080 -e TOKEN=$TOKEN - < k6/upload.js

docker run --rm -i grafana/k6 run -e BASE_URL=http://host.docker.internal:8080 - < k6/download.js

```

## Scripts

| Script | Cible | État |
|---|---|---|
| `k6/ping-smoke.js` | `GET /api/ping` — étalon | disponible |
| `k6/upload.js` | `POST /api/files` (auth) | disponible — voir en-tête du script pour le token |
| `k6/download.js` | `GET /api/d/{token}` | disponible |

Les tests de charge **ne tournent pas en CI** (bruit sur *runner* partagé) : ils sont
lancés à la main contre l'environnement `deploy/`. Déposer les captures de résultats
dans `docs/screenshots/`.
