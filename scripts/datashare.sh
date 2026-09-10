#!/usr/bin/env bash
# Pilotage local de la stack DataShare : backend / frontend / dependances Docker.
#
# Toute la logique est ici ; l'action vient du 1er argument, ou du nom d'appel via
# les petits lanceurs scripts/<action> (voir scripts/README.md) :
#
#   ./scripts/start-backend-dev      ==  ./scripts/datashare.sh start-backend-dev
#   ./scripts/status-appli           ==  ./scripts/datashare.sh status-appli
#
# Actions :
#   start-backend-dev    stack Docker au besoin + mvnw spring-boot:run (profil dev, :8080)
#   start-backend-prod   .env.prod.local + mvnw package + java -jar (profil prod)
#   start-frontend-dev   npm start  (ng serve, :4200, proxy /api -> :8080)
#   start-frontend-prod  npm run start:prod  (build prod + budgets + proxy /api)
#   stop-backend         arrete le backend lance ici (PID) puis par motif / port 8080
#   stop-frontend        idem frontend (port 4200)
#   status-appli         tableau OK/NOK : backend, frontend, conteneurs db/minio/adminer
#
# Options :
#   --bg          detache le service (PID + log dans scripts/.run/) au lieu du premier plan
#   --hard        stop brutal (killall java / node)
#   --with-deps   stop-backend arrete aussi la stack Docker (alias : --wd)
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
run_dir="$repo_root/scripts/.run"
mkdir -p "$run_dir"

backend_url="http://localhost:8080"
frontend_url="http://localhost:4200"
compose_file="$repo_root/deploy/docker-compose.yml"
compose_env="$repo_root/deploy/.env"
compose_project="datashare-dev"

case "$(uname -s)" in
  MINGW* | MSYS* | CYGWIN*) is_windows=1 ;;
  *) is_windows=0 ;;
esac

# ---------------------------------------------------------------- affichage ---
c_ok=$'\033[32m'
c_no=$'\033[31m'
c_off=$'\033[0m'
say() { printf '%s\n' "$*"; }
ok() { printf '  %sOK %s %s\n' "$c_ok" "$c_off" "$*"; }
nok() { printf '  %sNOK%s %s\n' "$c_no" "$c_off" "$*"; }
die() {
  printf '%serreur:%s %s\n' "$c_no" "$c_off" "$*" >&2
  exit 1
}

# --------------------------------------------------------------- outillage ----
have() { command -v "$1" >/dev/null 2>&1; }
http_up() { curl -fsS -o /dev/null --max-time 3 "$1" 2>/dev/null; }

mvnw_bin() {
  if [ "$is_windows" = 1 ] && [ -f "$repo_root/backend/mvnw.cmd" ]; then
    printf '%s\n' "$repo_root/backend/mvnw.cmd"
  elif [ -x "$repo_root/backend/mvnw" ]; then
    printf '%s\n' "$repo_root/backend/mvnw"
  elif have mvn; then
    printf '%s\n' mvn
  else
    die "ni backend/mvnw ni mvn sur le PATH"
  fi
}

node_check() {
  have node || die "node introuvable (Node 24 attendu - voir frontend/.nvmrc)"
  local want major
  want="$(tr -dc '0-9' <"$repo_root/frontend/.nvmrc" 2>/dev/null || true)"
  major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo '?')"
  if [ -n "$want" ] && [ "$major" != "$want" ]; then
    say "  ! Node $major detecte, $want attendu (frontend/.nvmrc)"
  fi
}

container_state() {
  local s
  if s="$(docker inspect -f \
    '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
    "$1" 2>/dev/null)" && [ -n "$s" ]; then
    printf '%s\n' "$s"
  else
    printf 'absent\n'
  fi
}

# ------------------------------------------------------------- dependances ----
deps_up() {
  have docker || die "docker introuvable"
  if [ ! -f "$compose_env" ]; then
    cp "$repo_root/deploy/.env.example" "$compose_env"
    say "cree : deploy/.env (copie de .env.example)"
  fi
  say "dependances Docker (db, minio, adminer)..."
  docker compose --env-file "$compose_env" -f "$compose_file" up -d

  local tries=30 c st all
  while [ "$tries" -gt 0 ]; do
    all=1
    for c in db minio; do
      st="$(container_state "${compose_project}-${c}-1")"
      if [ "$st" != healthy ] && [ "$st" != running ]; then
        all=0
      fi
    done
    if [ "$all" = 1 ]; then
      return 0
    fi
    tries=$((tries - 1))
    sleep 2
  done
  die "db/minio non prets apres 60 s (docker compose -f deploy/docker-compose.yml ps)"
}

# ------------------------------------------------------- lancement service ----
# run_service <nom> <repertoire> <commande...>
run_service() {
  local name="$1" dir="$2"
  shift 2
  local log="$run_dir/$name.log" pidfile="$run_dir/$name.pid"

  if [ "${bg:-0}" = 1 ]; then
    say "$name - arriere-plan, log : scripts/.run/$name.log"
    (
      cd "$dir" || exit 1
      exec "$@"
    ) >"$log" 2>&1 &
    printf '%s\n' "$!" >"$pidfile"
    say "$name demarre (PID $(cat "$pidfile"))"
  else
    say "$name - premier plan (Ctrl+C pour arreter)"
    cd "$dir" || die "repertoire introuvable : $dir"
    exec "$@"
  fi
}

# --------------------------------------------------------------- .env prod ----
ensure_prod_env() {
  local f="$repo_root/deploy/.env.prod.local"
  if [ -f "$f" ]; then
    return 0
  fi
  if [ -f "$compose_env" ]; then
    # shellcheck disable=SC1090
    . "$compose_env"
  fi
  local secret
  # head en tete de pipe (lit 512 octets puis sort) -> pas de SIGPIPE sous pipefail
  secret="$(head -c 512 /dev/urandom | LC_ALL=C tr -dc 'A-Za-z0-9')"
  secret="${secret:0:48}"
  cat >"$f" <<EOF
# Genere par scripts/datashare - profil prod contre la stack Docker DEV locale.
# Local, non versionne (deploy/.env.* est gitignore). Supprimer pour regenerer.
DATASHARE_DB_URL=jdbc:postgresql://localhost:${POSTGRES_PORT:-5432}/${POSTGRES_DB:-datashare}
DATASHARE_DB_USERNAME=${POSTGRES_USER:-datashare}
DATASHARE_DB_PASSWORD=${POSTGRES_PASSWORD:-datashare}
DATASHARE_JWT_SECRET=${secret}
DATASHARE_STORAGE_ENDPOINT=http://localhost:${MINIO_API_PORT:-9000}
DATASHARE_STORAGE_BUCKET=${DATASHARE_STORAGE_BUCKET:-datashare-files}
DATASHARE_STORAGE_ACCESS_KEY=${MINIO_ROOT_USER:-datashare}
DATASHARE_STORAGE_SECRET_KEY=${MINIO_ROOT_PASSWORD:-datashare-secret}
DATASHARE_DOWNLOAD_BASE_URL=http://localhost:4200/d
EOF
  say "genere : deploy/.env.prod.local"
}

# ------------------------------------------------------------------- stop -----
kill_pidfile() {
  local pidfile="$run_dir/$1.pid" pid
  [ -f "$pidfile" ] || return 0
  pid="$(cat "$pidfile" 2>/dev/null || true)"
  rm -f "$pidfile"
  [ -n "${pid:-}" ] || return 0
  if [ "$is_windows" = 1 ]; then
    taskkill //T //F //PID "$pid" >/dev/null 2>&1 || true
  else
    kill "$pid" 2>/dev/null || true
    sleep 1
    kill -9 "$pid" 2>/dev/null || true
  fi
}

kill_pattern() {
  local pat="$1"
  if [ "$is_windows" = 1 ]; then
    return 0
  fi
  if have pkill; then
    pkill -f "$pat" 2>/dev/null || true
  fi
}

kill_port() {
  local port="$1" pid
  if [ "$is_windows" = 1 ]; then
    netstat -ano 2>/dev/null | tr -s ' ' | grep -E ":$port .*LISTENING" | awk '{print $NF}' | sort -u |
      while read -r pid; do
        if [ -n "$pid" ]; then
          taskkill //F //PID "$pid" >/dev/null 2>&1 || true
        fi
      done
    return 0
  fi
  if have lsof; then
    lsof -ti "tcp:$port" 2>/dev/null | while read -r pid; do
      kill -9 "$pid" 2>/dev/null || true
    done
  fi
}

# ----------------------------------------------------------------- status -----
status_appli() {
  local fail=0 c st
  say "DataShare - statut"

  if http_up "$backend_url/actuator/health"; then
    ok "backend    $backend_url"
  else
    nok "backend    $backend_url"
    fail=$((fail + 1))
  fi

  if http_up "$frontend_url"; then
    ok "frontend   $frontend_url"
  else
    nok "frontend   $frontend_url"
    fail=$((fail + 1))
  fi

  if have docker; then
    for c in db minio adminer; do
      st="$(container_state "${compose_project}-${c}-1")"
      case "$st" in
        healthy | running) ok "docker $c ($st)" ;;
        *)
          nok "docker $c ($st)"
          fail=$((fail + 1))
          ;;
      esac
    done
  else
    nok "docker (client absent)"
    fail=$((fail + 1))
  fi

  say ""
  if [ "$fail" -eq 0 ]; then
    say "tout est OK"
  else
    say "$fail element(s) NOK"
  fi
  return "$fail"
}

# ------------------------------------------------------------------ dispatch --
bg=0
hard=0
with_deps=0
action=""
for arg in "$@"; do
  case "$arg" in
    --bg) bg=1 ;;
    -f | --foreground) bg=0 ;;
    --hard) hard=1 ;;
    --with-deps | --wd) with_deps=1 ;;
    -h | --help) action="help" ;;
    -*) die "option inconnue : $arg" ;;
    *)
      if [ -z "$action" ]; then
        action="$arg"
      else
        die "argument en trop : $arg"
      fi
      ;;
  esac
done
[ -n "$action" ] || die "action manquante - essayez: $(basename "$0") status-appli"

case "$action" in
  start-backend-dev)
    deps_up
    run_service backend "$repo_root/backend" \
      "$(mvnw_bin)" -q spring-boot:run \
      -Dspring-boot.run.profiles=dev -Dspring-boot.run.fork=false
    ;;
  start-backend-prod)
    deps_up
    ensure_prod_env
    say "build du jar (mvnw -DskipTests package)..."
    (cd "$repo_root/backend" && "$(mvnw_bin)" -q -DskipTests package)
    jars=("$repo_root"/backend/target/datashare-backend-*.jar)
    jar="${jars[0]}"
    [ -e "$jar" ] || die "jar introuvable apres package"
    set -a
    # shellcheck disable=SC1091
    . "$repo_root/deploy/.env.prod.local"
    set +a
    run_service backend "$repo_root/backend" java -jar "$jar" --spring.profiles.active=prod
    ;;
  start-frontend-dev)
    node_check
    run_service frontend "$repo_root/frontend" npm start
    ;;
  start-frontend-prod)
    node_check
    run_service frontend "$repo_root/frontend" npm run start:prod
    ;;
  stop-backend)
    kill_pidfile backend
    if [ "$hard" = 1 ]; then
      if [ "$is_windows" = 1 ]; then
        taskkill //F //IM java.exe >/dev/null 2>&1 || true
      else
        pkill -9 java 2>/dev/null || true
      fi
    else
      kill_pattern "spring-boot:run"
      kill_pattern "datashare-backend"
    fi
    kill_port 8080
    if [ "$with_deps" = 1 ] && have docker; then
      docker compose --env-file "$compose_env" -f "$compose_file" down
    fi
    say "backend arrete"
    ;;
  stop-frontend)
    kill_pidfile frontend
    if [ "$hard" = 1 ]; then
      if [ "$is_windows" = 1 ]; then
        taskkill //F //IM node.exe >/dev/null 2>&1 || true
      else
        pkill -9 node 2>/dev/null || true
      fi
    else
      kill_pattern "ng serve"
      kill_pattern "@angular/build"
    fi
    kill_port 4200
    say "frontend arrete"
    ;;
  status-appli | status)
    status_appli
    ;;
  help)
    sed -n '2,22p' "${BASH_SOURCE[0]}" | sed 's/^#\{1,\} \{0,1\}//'
    ;;
  *)
    die "action inconnue : $action"
    ;;
esac
