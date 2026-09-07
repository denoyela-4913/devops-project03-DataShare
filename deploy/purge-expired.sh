#!/usr/bin/env bash
# Supprime les fichiers expirés (ligne stored_file + objet MinIO) via le profil Spring
# "purge". Outil d'exploitation manuel — la purge planifiée est le périmètre d'US10.
#
#   ./deploy/purge-expired.sh            lance la purge contre la stack dev
#   ./deploy/purge-expired.sh --check    valide le script sans rien exécuter
#
# Prérequis : la stack dev tourne (deploy/docker-compose.yml) et le jar est construit
# (cd backend && mvn -o package -DskipTests).
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
profiles="${DATASHARE_PURGE_PROFILES:-dev,purge}"

jars=("$here"/../backend/target/datashare-backend-*.jar)
jar="${jars[0]}"
[ -e "$jar" ] || jar=""

if [ "${1:-}" = "--check" ]; then
  echo "jar      : ${jar:-<non construit — lancer: cd backend && mvn -o package -DskipTests>}"
  echo "profils  : ${profiles}"
  echo "commande : java -jar <jar> --spring.profiles.active=${profiles}"
  exit 0
fi

if [ -z "$jar" ]; then
  echo "jar introuvable — lancer d'abord : cd backend && mvn -o package -DskipTests" >&2
  exit 1
fi

exec java -jar "$jar" --spring.profiles.active="${profiles}" "$@"
