#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUTPUT="$ROOT/builds/linux_builds"
STAGING="$ROOT/builds/.cache"
VERSION="$(cd "$ROOT" && node -p "require('./package.json').version")"

cd "$ROOT"
rm -rf "$STAGING"
mkdir -p "$STAGING" "$OUTPUT"
npm run dist -- --linux

shopt -s nullglob
artifacts=("$STAGING"/*.AppImage)
if [ "${#artifacts[@]}" -eq 0 ]; then
  printf 'No se generó AppImage\n' >&2
  exit 1
fi

tar -cf "$OUTPUT/Plasticina-$VERSION-linux-x64.tar" -C "$STAGING" "$(basename "${artifacts[0]}")"
printf '%s\n' "$OUTPUT/Plasticina-$VERSION-linux-x64.tar"
