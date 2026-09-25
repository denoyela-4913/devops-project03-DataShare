# docs/screenshots/

Captures d'écran référencées par les documents qualité. Les captures k6/Lighthouse
ci-dessous sont disponibles ; le run Lighthouse mode debug est conservé en annexe pour
comparaison avec le run hors debug (voir `PERF.md` §3/§6). `lighthouse-home.png` reste à
produire au fil des PR de features.

| Fichier | Contenu | Quand | Doc |
|---|---|---|---|
| `coverage-backend.png` | rapport JaCoCo (`backend/target/site/jacoco-merged/index.html`) montrant ≥ 70 % (actuellement ~88 %) | **maintenant** (porte active depuis PR #0006) | `TESTING.md` |
| `coverage-frontend.png` | rapport Vitest (`frontend/coverage/datashare-frontend/index.html`) montrant ≥ 70 % (actuellement ~95 %) | **maintenant** (porte active depuis PR #0007) | `TESTING.md` |
| `k6-ping.png` | synthèse d'un run k6 sur `GET /api/ping` (référence) | **maintenant** (disponible) | `PERF.md` |
| `k6-upload.png` | synthèse d'un run k6 sur `POST /api/files` | **maintenant** (disponible) | `PERF.md` |
| `k6-download.png` | synthèse d'un run k6 sur `GET /api/d/{token}` | **maintenant** (disponible) | `PERF.md` |
| `lighthouse-home.png` | rapport Lighthouse de la page d'accueil | PR features front | `PERF.md` |
| `lighthouse-upload.png` | rapport Lighthouse page d'upload — scores, run hors debug (`ng serve --configuration production`) | **maintenant** (disponible) | `PERF.md` |
| `lighthouse-upload-details-part1-stats.png` | rapport Lighthouse page d'upload — statistiques détaillées, run hors debug (1/2) | **maintenant** (disponible) | `PERF.md` |
| `lighthouse-upload-details-part2-diags.png` | rapport Lighthouse page d'upload — diagnostics détaillés, run hors debug (2/2) | **maintenant** (disponible) | `PERF.md` |
| `lighthouse-upload(DEBUG).png` | rapport Lighthouse page d'upload — scores, run **mode debug** (annexe, non représentatif) | **maintenant** (disponible) | `PERF.md` |
| `lighthouse-upload(DEBUG)-details-part1-stats.png` | rapport Lighthouse page d'upload — statistiques détaillées, run mode debug (1/2, annexe) | **maintenant** (disponible) | `PERF.md` |
| `lighthouse-upload(DEBUG)-details-part2-diags.png` | rapport Lighthouse page d'upload — diagnostics détaillés, run mode debug (2/2, annexe) | **maintenant** (disponible) | `PERF.md` |

## Comment produire

- **Couverture** : lancer les tests avec couverture, ouvrir le `index.html` généré,
  capturer le tableau de synthèse.
- **k6** : `k6 run …`, capturer le résumé de fin (`http_req_duration`, `checks`,
  `http_req_failed`).
- **Lighthouse** : DevTools Chrome → onglet Lighthouse → analyser la page → capturer
  les 4 scores + les diagnostics principaux.

Format : PNG, largeur raisonnable (< 1600 px). Nommer exactement comme dans le tableau.
