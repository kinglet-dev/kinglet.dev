#!/usr/bin/env bash
# Checks the built site in ./public for the behaviour the site promises.
# Usage: hugo build --gc --minify && scripts/check-site.sh [public-dir]
set -uo pipefail

site="${1:-public}"
failures=0

pass() { printf 'ok    %s\n' "$1"; }
fail() { printf 'FAIL  %s\n' "$1"; failures=$((failures + 1)); }

# check <description> <command...>: runs the command; passes if it succeeds.
check() {
  local description="$1"; shift
  if "$@" >/dev/null 2>&1; then pass "$description"; else fail "$description"; fi
}

check "home page exists" test -f "$site/index.html"
check "home page names the brand" grep -q "Kinglet" "$site/index.html"
check "home page has a title" grep -qi "<title>[^<]" "$site/index.html"
check "home page links to the tools catalog" grep -q 'href="*/tools/' "$site/index.html"
check "tools catalog page exists" test -f "$site/tools/index.html"

if [[ $failures -gt 0 ]]; then
  printf '\n%d check(s) failed\n' "$failures"
  exit 1
fi
printf '\nall checks passed\n'
