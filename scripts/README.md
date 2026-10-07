# scripts/ — pilotage local de la stack

Démarrer / arrêter / diagnostiquer le backend, le frontend et les dépendances
Docker, **depuis la racine du dépôt**.

Toute la logique vit dans un seul fichier par shell — `datashare.sh` (bash) et
`datashare.ps1` (PowerShell). Les fichiers `start-backend-dev`, `status-appli`, …
sont de simples lanceurs de 2 lignes qui appellent le dispatcher avec l'action
déduite de leur nom.

## Utilisation

| Besoin | bash / Git Bash / Linux / macOS | PowerShell | cmd |
|---|---|---|---|
| Backend dev (`:8080`) | `./scripts/start-backend-dev` | `.\scripts\start-backend-dev.ps1` | `scripts\start-backend-dev.cmd` |
| Backend prod | `./scripts/start-backend-prod` | `.\scripts\start-backend-prod.ps1` | `scripts\start-backend-prod.cmd` |
| Frontend dev (`:4200`) | `./scripts/start-frontend-dev` | `.\scripts\start-frontend-dev.ps1` | `scripts\start-frontend-dev.cmd` |
| Frontend prod | `./scripts/start-frontend-prod` | `.\scripts\start-frontend-prod.ps1` | `scripts\start-frontend-prod.cmd` |
| Frontend « prod » en conteneur nginx (perf/Lighthouse, `:8082`) | `./scripts/start-frontend-docker` | — | — |
| Stopper le backend | `./scripts/stop-backend` | `.\scripts\stop-backend.ps1` | `scripts\stop-backend.cmd` |
| Stopper le frontend | `./scripts/stop-frontend` | `.\scripts\stop-frontend.ps1` | `scripts\stop-frontend.cmd` |
| Stopper le frontend docker | `./scripts/stop-frontend-docker` | — | — |
| Statut OK/NOK | `./scripts/status-appli` | `.\scripts\status-appli.ps1` | `scripts\status-appli.cmd` |
| Pare-feu pour un mobile en Wi-Fi (`enable` / `disable` / `status`) | `./scripts/lan-setup enable` | `.\scripts\lan-setup.ps1 enable` | `scripts\lan-setup.cmd enable` |
| Diagnostic réseau local + URL pour le mobile | `./scripts/lan-check` | — | — |
| Tunnel public (mobile en 5G) | `./scripts/start-tunnel` | — | — |

Équivalent en sous-commande : `./scripts/datashare.sh <action>` /
`.\scripts\datashare.ps1 <action>`.

## Options

| Option | Effet |
|---|---|
| `--bg` (`-Bg`) | détache le service : sortie dans `scripts/.run/<nom>.log`, PID dans `scripts/.run/<nom>.pid`. Par défaut les `start-*` tournent **au premier plan** (Ctrl+C arrête). |
| `--hard` (`-Hard`) | arrêt brutal : `killall java` / `node` (au lieu du ciblage par motif + port). |
| `--with-deps` / `--wd` (`-WithDeps` / `-Wd`) | `stop-backend` arrête aussi la stack Docker (`docker compose down`). |
| `--local` (`-Local`) | **`start-frontend-dev` uniquement** : `ng serve` n'écoute que sur `localhost`. Par défaut il écoute sur `0.0.0.0` (accessible depuis un mobile en Wi-Fi si le pare-feu est ouvert). Refusée par les autres actions. |

## Ce que font les scripts

- **start-backend-dev** — démarre au besoin la stack Docker (`deploy/`, crée
  `deploy/.env` depuis `.env.example` si absent), attend `db` + `minio` sains, puis
  `mvnw spring-boot:run` profil `dev` (fork désactivé → un seul process).
- **start-backend-prod** — génère au premier lancement `deploy/.env.prod.local`
  (non versionné : DB / MinIO = conteneurs dev, secret JWT tiré au sort,
  sans `DATASHARE_DOWNLOAD_BASE_URL` : liens relatifs), `mvnw -DskipTests package`,
  puis `java -jar target/datashare-backend-*.jar --spring.profiles.active=prod`.
  C'est une **config durcie contre l'infra locale**, pas un déploiement (images
  Docker prod : voir `docs/BACKLOG.md`).
- **start-frontend-dev** — `npm start -- --host 0.0.0.0` (`ng serve` sur toutes les
  interfaces, proxy `/api` → `:8080`) ; `--local` revient à `localhost` seul. Affiche l'URL
  réseau local (IP du PC trouvée dynamiquement). Avertit si la version de Node ≠ `frontend/.nvmrc`.
- **start-frontend-prod** — `npm run start:prod` (`ng serve --configuration
  production` : build prod, budgets, `/styleguide` retiré, même proxy `/api`).
  Reste le dev-server Angular, pas un vrai déploiement.
- **start-frontend-docker** — construit `frontend/Dockerfile` (build prod servi par
  nginx : gzip, cache des assets hashés) et lance le conteneur sur `:8082` (port
  configurable via `FRONTEND_DOCKER_PORT`), relié au backend lancé en dehors de Docker
  via `--add-host backend:<IP de la VM WSL>` — `host.docker.internal`/`host-gateway`
  résout vers l'hôte Windows sous Docker Desktop + WSL2, pas vers la VM où tourne le
  backend, d'où ce contournement. Sert à mesurer perf/Lighthouse dans des conditions
  proches d'un vrai déploiement (voir `PERF.md`). Bash/WSL + Docker Desktop pour
  l'instant, pas de `.ps1`/`.cmd`.
- **stop-backend** / **stop-frontend** — tuent le process du `.pid` (arbre
  complet), puis par motif (`spring-boot:run`, `datashare-backend` / `ng serve`)
  et enfin ce qui écoute sur `8080` / `4200`.
- **stop-frontend-docker** — retire le conteneur (`docker rm -f`).
- **lan-setup** — ouvre / ferme / affiche les règles de pare-feu (Windows **et** Hyper-V, ports
  4200 et 8082) pour qu'un mobile du même Wi-Fi joigne l'appli. `enable` et `disable` se relancent
  en administrateur (fenêtre UAC séparée, attendue par le script). Le lanceur bash appelle
  `powershell.exe` via l'interop WSL.
- **lan-check** — diagnostic côté WSL : IP du PC, ports qui écoutent sur toutes les interfaces,
  réponse HTTP via l'IP LAN, URL à ouvrir sur le mobile (`--ping <ip>`, `--serve`).
- **start-tunnel** — tunnel Cloudflare (`cloudflared`) vers `http://localhost:8082` (`--port`
  pour un autre port) : adresse publique `https://xxx.trycloudflare.com` pour un mobile en 5G.
  Vise toujours `localhost`, refuse de démarrer si rien n'écoute.
- **status-appli** — tableau `OK/NOK` : backend (`/actuator/health`), frontend
  (`:4200`), conteneurs `datashare-dev-{db,minio,adminer}-1`. Code de sortie =
  nombre de `NOK`.

Mode d'emploi complet des trois scénarios (PC, mobile Wi-Fi, mobile 5G), pour défaire et pour
le dépannage : [`docs/TESTS-MOBILE.md`](../docs/TESTS-MOBILE.md).

## Notes

- `scripts/.run/` (PID + logs) est ignoré par Git.
- Pas de liens symboliques (le dépôt est en `core.symlinks=false`) : chaque action
  a un vrai petit fichier par shell.
- Windows : les `.cmd` passent par `powershell -File datashare.ps1` ; les
  wrappers `.ps1` s'utilisent depuis une session PowerShell.
