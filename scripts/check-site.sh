#!/usr/bin/env bash
# Checks the built site in ./public for the behaviour the site promises.
# Usage: hugo build --gc --minify --cleanDestinationDir && scripts/check-site.sh [public-dir]
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

# Fonts are self-hosted (privacy rule) and ship with their SIL OFL 1.1 licences.
check "Outfit font is self-hosted" test -f "$site/fonts/Outfit-Variable.woff2"
check "JetBrains Mono font is self-hosted" test -f "$site/fonts/JetBrainsMono-Regular.woff2"
check "Outfit licence ships with the font" grep -q "SIL Open Font License" "$site/fonts/Outfit-OFL.txt"
check "JetBrains Mono licence ships with the font" grep -q "SIL Open Font License" "$site/fonts/JetBrainsMono-OFL.txt"
check "stylesheet uses Outfit" grep -q -- "--font-sans:Outfit" "$site"/css/main*.css
check "stylesheet uses JetBrains Mono for code" grep -q '"JetBrains Mono"' "$site"/css/main*.css
check "home page preloads Outfit" grep -q 'rel=preload[^>]*Outfit-Variable.woff2' "$site/index.html"
check "no third-party font hosts" bash -c "! grep -rIlE 'fonts\.(googleapis|gstatic)\.com' '$site'"

# WCAG 2.2 AA contrast of the colour tokens, light and dark (scripts/check-contrast.py).
stylesheets=("$site"/css/main*.css)
check "exactly one stylesheet is built" test "${#stylesheets[@]}" -eq 1 -a -f "${stylesheets[0]}"
if python3 "$(dirname "$0")/check-contrast.py" "${stylesheets[0]}"; then
  pass "colour tokens meet WCAG 2.2 AA contrast"
else
  fail "colour tokens meet WCAG 2.2 AA contrast"
fi

if [[ $failures -gt 0 ]]; then
  printf '\n%d check(s) failed\n' "$failures"
  exit 1
fi
printf '\nall checks passed\n'
