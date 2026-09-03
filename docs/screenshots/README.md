# docs/screenshots/

Captures d'écran référencées par les documents qualité. À produire **au fil des PR**
de features (pas maintenant : il n'y a rien à mesurer).

| Fichier | Contenu | Quand | Doc |
|---|---|---|---|
| `coverage-backend.png` | rapport JaCoCo (`backend/target/site/jacoco-merged/index.html`) montrant ≥ 70 % (actuellement ~93 %) | **maintenant** (porte active depuis PR #0006) | `TESTING.md` |
| `coverage-frontend.png` | rapport Vitest (`frontend/coverage/index.html`) | PR #0007 (activation de la porte front) | `TESTING.md` |
| `k6-upload.png` | synthèse d'un run k6 sur `POST /api/files` | PR US01 | `PERF.md` |
| `k6-download.png` | synthèse d'un run k6 sur `GET /api/d/{token}` | PR US02 | `PERF.md` |
| `lighthouse-home.png` | rapport Lighthouse de la page d'accueil | PR features front | `PERF.md` |
| `lighthouse-upload.png` | rapport Lighthouse de la page d'upload | PR US01 front | `PERF.md` |

## Comment produire

- **Couverture** : lancer les tests avec couverture, ouvrir le `index.html` généré,
  capturer le tableau de synthèse.
- **k6** : `k6 run …`, capturer le résumé de fin (`http_req_duration`, `checks`,
  `http_req_failed`).
- **Lighthouse** : DevTools Chrome → onglet Lighthouse → analyser la page → capturer
  les 4 scores + les diagnostics principaux.

Format : PNG, largeur raisonnable (< 1600 px). Nommer exactement comme dans le tableau.
