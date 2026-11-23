#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
OUTPUT="$ROOT/builds/linux_builds"
STAGING="$ROOT/builds/.cache"
VERSION=$(cd "$ROOT" && node -p "require('./package.json').version")

cd "$ROOT"
rm -rf "$STAGING"
mkdir -p "$STAGING" "$OUTPUT"
npm run dist -- --linux

artifact=
for candidate in "$STAGING"/*.AppImage; do
  if [ -f "$candidate" ]; then
    artifact=$candidate
    break
  fi
done

if [ -z "$artifact" ]; then
  printf 'No se generó AppImage\n' >&2
  exit 1
fi

tar -cf "$OUTPUT/Plasticina-$VERSION-linux-x64.tar" -C "$STAGING" "$(basename "$artifact")"
printf '%s\n' "$OUTPUT/Plasticina-$VERSION-linux-x64.tar"
