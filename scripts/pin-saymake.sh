#!/usr/bin/env bash
# Pins the release files Kinglet Saymake runs: reads the release's checksums
# file from GitHub and rewrites saymake.lock with them.
# Usage: scripts/pin-saymake.sh VERSION
#   SAYMAKE_URL  as in fetch-saymake.sh (default: saymake's GitHub release)
set -euo pipefail

version="${1:-}"
if [[ $# -ne 1 || ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
  echo "usage: scripts/pin-saymake.sh VERSION" >&2; exit 2
fi
root="$(cd "$(dirname "$0")/.." && pwd)"
github='https://github.com/kinglet-dev/saymake/releases/download/v{version}/{file}'
url="${SAYMAKE_URL:-$github}"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

sed -n '/^#/p' "$root/saymake.lock" > "$tmp/lock"
sums="saymake_${version}_checksums.txt"
src="${url//\{version\}/$version}"; src="${src//\{file\}/$sums}"
curl -sfL --proto '=https,file' -o "$tmp/$sums" "$src" || { echo "pin-saymake: can't download $src" >&2; exit 1; }
row="saymake $version"
for suffix in .wasm _wasm_exec.js _wasm_exec_LICENSE.txt _web.js _web.css _web.html; do
  hash=$(awk -v f="saymake_${version}${suffix}" '$2 == f { print $1 }' "$tmp/$sums")
  if [[ ! "$hash" =~ ^[0-9a-f]{64}$ ]]; then
    echo "pin-saymake: $sums doesn't list saymake_${version}${suffix}" >&2; exit 1
  fi
  row+=" $hash"
done
echo "$row" >> "$tmp/lock"
mv -f "$tmp/lock" "$root/saymake.lock"
echo "pin-saymake: pinned saymake $version in saymake.lock"
