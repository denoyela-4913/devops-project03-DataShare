#!/usr/bin/env bash
# Vérifie que tout template/style de composant Angular porte l'en-tête @figma-owned.
# Voir design/HANDOFF.md.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
missing=0

while IFS= read -r -d '' file; do
  if ! grep -q '@figma-owned' "$file"; then
    echo "MANQUE @figma-owned : ${file#"$root"/}"
    missing=1
  fi
done < <(find "$root/frontend/src/app" \( -name '*.html' -o -name '*.scss' \) -print0 2>/dev/null)

if [ "$missing" -ne 0 ]; then
  echo ""
  echo "Ces fichiers sont maintenus depuis Figma via Cursor et doivent porter l'en-tête."
  exit 1
fi
echo "OK — tous les templates/styles de composants portent l'en-tête @figma-owned."
