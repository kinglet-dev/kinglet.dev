#!/usr/bin/env bash
# Pins the release files Kinglet Preflight runs: reads each release's
# checksums file from GitHub and rewrites preflight.lock with them.
# Usage: scripts/pin-preflight.sh laserlint VERSION laserfix VERSION
#   PREFLIGHT_URL  as in fetch-preflight.sh (default: each tool's GitHub release)
set -euo pipefail

if [[ $# -ne 4 || "$1" != laserlint || "$3" != laserfix ]]; then
  echo "usage: scripts/pin-preflight.sh laserlint VERSION laserfix VERSION" >&2; exit 2
fi
root="$(cd "$(dirname "$0")/.." && pwd)"
github='https://github.com/kinglet-dev/{tool}/releases/download/v{version}/{file}'
url="${PREFLIGHT_URL:-$github}"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

sed -n '/^#/p' "$root/preflight.lock" > "$tmp/lock"
for pair in "$1 $2" "$3 $4"; do
  read -r tool version <<< "$pair"
  if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
    echo "pin-preflight: '$version' isn't a release version" >&2; exit 2
  fi
  sums="${tool}_${version}_checksums.txt"
  src="${url//\{tool\}/$tool}"; src="${src//\{version\}/$version}"; src="${src//\{file\}/$sums}"
  curl -sfL --proto '=https,file' -o "$tmp/$sums" "$src" || { echo "pin-preflight: can't download $src" >&2; exit 1; }
  row="$tool $version"
  for suffix in .wasm _wasm_exec.js _wasm_exec_LICENSE.txt; do
    hash=$(awk -v f="${tool}_${version}${suffix}" '$2 == f { print $1 }' "$tmp/$sums")
    if [[ ! "$hash" =~ ^[0-9a-f]{64}$ ]]; then
      echo "pin-preflight: $sums doesn't list ${tool}_${version}${suffix}" >&2; exit 1
    fi
    row+=" $hash"
  done
  echo "$row" >> "$tmp/lock"
done
mv -f "$tmp/lock" "$root/preflight.lock"
echo "pin-preflight: pinned laserlint $2 and laserfix $4 in preflight.lock"
