#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
OUTPUT="$ROOT/builds/windows_builds"
STAGING="$ROOT/builds/.cache"
VERSION=$(cd "$ROOT" && node -p "require('./package.json').version")

cd "$ROOT"
rm -rf "$STAGING"
mkdir -p "$STAGING" "$OUTPUT"
npm run dist -- --win

artifact=
for candidate in "$STAGING"/*.zip; do
  if [ -f "$candidate" ]; then
    artifact=$candidate
    break
  fi
done

if [ -z "$artifact" ]; then
  printf 'No se generó ZIP de Windows\n' >&2
  exit 1
fi

cp "$artifact" "$OUTPUT/Plasticina-$VERSION-win-x64.zip"
printf '%s\n' "$OUTPUT/Plasticina-$VERSION-win-x64.zip"
