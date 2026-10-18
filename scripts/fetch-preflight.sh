#!/usr/bin/env bash
# Downloads the release files Kinglet Preflight runs (preflight.lock) into
# static/preflight/wasm/, and refuses any file whose SHA-256 differs from the
# pinned one. Runs before the Hugo build, in build.sh.
# Usage: scripts/fetch-preflight.sh
#   PREFLIGHT_LOCK  another lock file (default: preflight.lock)
#   PREFLIGHT_URL   where release files are, with {tool}, {version} and {file}
#                   (default: each tool's GitHub release)
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
lock="${PREFLIGHT_LOCK:-$root/preflight.lock}"
github='https://github.com/kinglet-dev/{tool}/releases/download/v{version}/{file}'
url="${PREFLIGHT_URL:-$github}"
out="$root/static/preflight/wasm"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

declare -A fetched=()
while read -r tool version wasm exec license extra; do
  [[ -z "$tool" || "$tool" == \#* ]] && continue
  if [[ ! "$tool" =~ ^(laserlint|laserfix)$ || -n "${extra:-}" || -n "${fetched[$tool]:-}" ]]; then
    echo "fetch-preflight: $lock has a line it can't read: $tool $version" >&2; exit 1
  fi
  if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
    echo "fetch-preflight: $tool's version '$version' isn't a release version" >&2; exit 1
  fi
  for hash in "$wasm" "$exec" "$license"; do
    if [[ ! "$hash" =~ ^[0-9a-f]{64}$ ]]; then
      echo "fetch-preflight: $tool $version isn't pinned yet. After its release, run:" >&2
      echo "  scripts/pin-preflight.sh laserlint VERSION laserfix VERSION" >&2
      exit 1
    fi
  done
  for pair in "$wasm .wasm" "$exec _wasm_exec.js" "$license _wasm_exec_LICENSE.txt"; do
    read -r hash suffix <<< "$pair"
    file="${tool}_${version}${suffix}"
    src="${url//\{tool\}/$tool}"; src="${src//\{version\}/$version}"; src="${src//\{file\}/$file}"
    curl -sfL --proto '=https,file' -o "$tmp/$file" "$src" || { echo "fetch-preflight: can't download $src" >&2; exit 1; }
    echo "$hash  $tmp/$file" | sha256sum -c --quiet - || { echo "fetch-preflight: $file doesn't match its pinned checksum" >&2; exit 1; }
    mv "$tmp/$file" "$tmp/${tool}${suffix}"
  done
  fetched[$tool]=1
done < "$lock"

if [[ ${#fetched[@]} -ne 2 ]]; then
  echo "fetch-preflight: $lock must pin laserlint and laserfix" >&2; exit 1
fi
mkdir -p "$out"
mv -f "$tmp"/laser* "$out/"
echo "fetch-preflight: verified $(ls "$out" | wc -l) files into static/preflight/wasm/"
