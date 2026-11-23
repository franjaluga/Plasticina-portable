#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUTPUT="$ROOT/builds/windows_builds"
STAGING="$ROOT/builds/.cache"
VERSION="$(cd "$ROOT" && node -p "require('./package.json').version")"

cd "$ROOT"
rm -rf "$STAGING"
mkdir -p "$STAGING" "$OUTPUT"
npm run dist -- --win

shopt -s nullglob
artifacts=("$STAGING"/*.zip)
if [ "${#artifacts[@]}" -eq 0 ]; then
  printf 'No se generó ZIP de Windows\n' >&2
  exit 1
fi

cp "${artifacts[0]}" "$OUTPUT/Plasticina-$VERSION-win-x64.zip"
printf '%s\n' "$OUTPUT/Plasticina-$VERSION-win-x64.zip"
