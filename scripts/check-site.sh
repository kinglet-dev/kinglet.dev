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
check "custom 404 page exists" test -f "$site/404.html"
check "security headers file sets a CSP" grep -q "Content-Security-Policy" "$site/_headers"
check "security headers file denies framing" grep -q "frame-ancestors 'none'" "$site/_headers"
check "security headers file sets HSTS for a year" grep -q "Strict-Transport-Security: max-age=31536000; includeSubDomains" "$site/_headers"
check "security.txt has a contact" grep -q "^Contact: https://" "$site/.well-known/security.txt"
check "security.txt has an expiry" grep -q "^Expires: " "$site/.well-known/security.txt"
# .dev is HSTS-preloaded; plain-http links would be broken or downgraded.
check "no plain http links in pages" bash -c "! grep -rIl --include='*.html' 'http://' '$site'"

if [[ $failures -gt 0 ]]; then
  printf '\n%d check(s) failed\n' "$failures"
  exit 1
fi
printf '\nall checks passed\n'
