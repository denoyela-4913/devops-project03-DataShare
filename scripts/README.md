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
| Stopper le backend | `./scripts/stop-backend` | `.\scripts\stop-backend.ps1` | `scripts\stop-backend.cmd` |
| Stopper le frontend | `./scripts/stop-frontend` | `.\scripts\stop-frontend.ps1` | `scripts\stop-frontend.cmd` |
| Statut OK/NOK | `./scripts/status-appli` | `.\scripts\status-appli.ps1` | `scripts\status-appli.cmd` |

Équivalent en sous-commande : `./scripts/datashare.sh <action>` /
`.\scripts\datashare.ps1 <action>`.

## Options

| Option | Effet |
|---|---|
| `--bg` (`-Bg`) | détache le service : sortie dans `scripts/.run/<nom>.log`, PID dans `scripts/.run/<nom>.pid`. Par défaut les `start-*` tournent **au premier plan** (Ctrl+C arrête). |
| `--hard` (`-Hard`) | arrêt brutal : `killall java` / `node` (au lieu du ciblage par motif + port). |
| `--with-deps` / `--wd` (`-WithDeps` / `-Wd`) | `stop-backend` arrête aussi la stack Docker (`docker compose down`). |

## Ce que font les scripts

- **start-backend-dev** — démarre au besoin la stack Docker (`deploy/`, crée
  `deploy/.env` depuis `.env.example` si absent), attend `db` + `minio` sains, puis
  `mvnw spring-boot:run` profil `dev` (fork désactivé → un seul process).
- **start-backend-prod** — génère au premier lancement `deploy/.env.prod.local`
  (non versionné : DB / MinIO = conteneurs dev, secret JWT tiré au sort,
  `DATASHARE_DOWNLOAD_BASE_URL=http://localhost:4200/d`), `mvnw -DskipTests package`,
  puis `java -jar target/datashare-backend-*.jar --spring.profiles.active=prod`.
  C'est une **config durcie contre l'infra locale**, pas un déploiement (images
  Docker prod : voir `docs/BACKLOG.md`).
- **start-frontend-dev** — `npm start` (`ng serve`, proxy `/api` → `:8080`).
  Avertit si la version de Node ≠ `frontend/.nvmrc`.
- **start-frontend-prod** — `npm run start:prod` (`ng serve --configuration
  production` : build prod, budgets, `/styleguide` retiré, même proxy `/api`).
- **stop-backend** / **stop-frontend** — tuent le process du `.pid` (arbre
  complet), puis par motif (`spring-boot:run`, `datashare-backend` / `ng serve`)
  et enfin ce qui écoute sur `8080` / `4200`.
- **status-appli** — tableau `OK/NOK` : backend (`/actuator/health`), frontend
  (`:4200`), conteneurs `datashare-dev-{db,minio,adminer}-1`. Code de sortie =
  nombre de `NOK`.

## Notes

- `scripts/.run/` (PID + logs) est ignoré par Git.
- Pas de liens symboliques (le dépôt est en `core.symlinks=false`) : chaque action
  a un vrai petit fichier par shell.
- Windows : les `.cmd` passent par `powershell -File datashare.ps1` ; les
  wrappers `.ps1` s'utilisent depuis une session PowerShell.
