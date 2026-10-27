#!/usr/bin/env bash
# Downloads the release files Kinglet Saymake runs (saymake.lock) into
# static/saymake/kit/, and refuses any file whose SHA-256 differs from the
# pinned one. Runs before the Hugo build, in build.sh; the page's layout reads
# the tool's markup from there (web.html).
# Usage: scripts/fetch-saymake.sh
#   SAYMAKE_LOCK  another lock file (default: saymake.lock)
#   SAYMAKE_URL   where release files are, with {version} and {file}
#                 (default: saymake's GitHub release)
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
lock="${SAYMAKE_LOCK:-$root/saymake.lock}"
github='https://github.com/kinglet-dev/saymake/releases/download/v{version}/{file}'
url="${SAYMAKE_URL:-$github}"
out="$root/static/saymake/kit"
# Each release file's suffix, and the name the kit's module looks for.
suffixes=(.wasm _wasm_exec.js _wasm_exec_LICENSE.txt _web.js _web.css _web.html)
names=(saymake.wasm saymake_wasm_exec.js saymake_wasm_exec_LICENSE.txt web.js web.css web.html)

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

rows=0
while read -r tool version rest; do
  [[ -z "$tool" || "$tool" == \#* ]] && continue
  read -r -a hashes <<< "$rest"
  if [[ "$tool" != saymake || ${#hashes[@]} -ne ${#suffixes[@]} || $rows -gt 0 ]]; then
    echo "fetch-saymake: $lock has a line it can't read: $tool $version" >&2; exit 1
  fi
  if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
    echo "fetch-saymake: the version '$version' isn't a release version" >&2; exit 1
  fi
  for i in "${!suffixes[@]}"; do
    hash="${hashes[$i]}"
    if [[ ! "$hash" =~ ^[0-9a-f]{64}$ ]]; then
      echo "fetch-saymake: saymake $version isn't pinned yet. After its release, run:" >&2
      echo "  scripts/pin-saymake.sh VERSION" >&2
      exit 1
    fi
    file="saymake_${version}${suffixes[$i]}"
    src="${url//\{version\}/$version}"; src="${src//\{file\}/$file}"
    curl -sfL --proto '=https,file' -o "$tmp/$file" "$src" || { echo "fetch-saymake: can't download $src" >&2; exit 1; }
    echo "$hash  $tmp/$file" | sha256sum -c --quiet - || { echo "fetch-saymake: $file doesn't match its pinned checksum" >&2; exit 1; }
    mv "$tmp/$file" "$tmp/${names[$i]}"
  done
  rows=1
done < "$lock"

if [[ $rows -ne 1 ]]; then
  echo "fetch-saymake: $lock must pin saymake" >&2; exit 1
fi
mkdir -p "$out"
for name in "${names[@]}"; do mv -f "$tmp/$name" "$out/"; done
echo "fetch-saymake: verified ${#names[@]} files into static/saymake/kit/"
