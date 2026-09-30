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

# Brand: logo beside the lowercase wordmark; the logo is decorative because the link text names it.
check "header shows the logo and wordmark as the home link" \
  perl -0ne 'exit(!/<a class=brand href=\/[^>]*><svg[^>]*aria-hidden=\"?true\"?[^>]*>.*?<\/svg>\s*<span>kinglet<\/span><\/a>/s)' "$site/index.html"
check "pages declare the SVG favicon" grep -q '<link rel=icon href=/favicon.svg type=image/svg+xml>' "$site/index.html"
check "favicon exists" test -f "$site/favicon.svg"
# Raster fallbacks for browsers and platforms without SVG icons (rule: icon fallbacks).
check "pages declare the ICO favicon fallback" grep -q '<link rel=icon href=/favicon.ico sizes=32x32>' "$site/index.html"
check "pages declare the Apple touch icon" grep -q '<link rel=apple-touch-icon href=/apple-touch-icon.png>' "$site/index.html"
check "favicon.ico holds 16, 32 and 48 px images" python3 -c '
import struct, sys
data = open(sys.argv[1], "rb").read()
reserved, kind, count = struct.unpack_from("<HHH", data)
sizes = sorted(data[6 + 16 * i] or 256 for i in range(count))
sys.exit(not (reserved == 0 and kind == 1 and sizes == [16, 32, 48]))' "$site/favicon.ico"
check "apple-touch-icon.png is a 180 px PNG" python3 -c '
import struct, sys
data = open(sys.argv[1], "rb").read(24)
sys.exit(not (data[:8] == b"\x89PNG\r\n\x1a\n" and struct.unpack(">II", data[16:24]) == (180, 180)))' "$site/apple-touch-icon.png"
# SVGs must contain no scripts or external references (rule: optimized, self-contained).
check "SVG files contain no scripts" bash -c "! grep -rIl --include='*.svg' -i '<script' '$site'"
check "SVG files contain no external references" bash -c "! grep -rIlE --include='*.svg' '(href|src)=\"(https?:)?//|url\\((https?:)?//' '$site'"
# Mascot: only on the 404 page and empty states, with a dark-theme variant.
mascot='<picture[^>]*><source srcset=/images/kinglet-mascot-dark.svg media="\(prefers-color-scheme: ?dark\)"><img src=/images/kinglet-mascot.svg alt'
check "404 page shows the mascot" grep -qE "$mascot" "$site/404.html"
check "mascot files exist" test -f "$site/images/kinglet-mascot.svg" -a -f "$site/images/kinglet-mascot-dark.svg"
check "tools empty state shows the mascot" bash -c "! grep -q 'class=empty' '$site/tools/index.html' || grep -qE '$mascot' '$site/tools/index.html'"
# Every image has alt text and fixed dimensions (no layout shift, CLS).
check "every img has alt, width and height" \
  perl -0ne 'while (/<img\b([^>]*)>/g) { my $a = $1; $bad++ unless $a =~ /\balt\b/ && $a =~ /\bwidth=/ && $a =~ /\bheight=/ } END { exit($bad > 0) }' $(find "$site" -name '*.html')

# Fonts are self-hosted (privacy rule) and ship with their SIL OFL 1.1 licences.
check "Outfit font is self-hosted" test -f "$site/fonts/Outfit-Variable.woff2"
check "JetBrains Mono font is self-hosted" test -f "$site/fonts/JetBrainsMono-Regular.woff2"
check "Outfit licence ships with the font" grep -q "SIL Open Font License" "$site/fonts/Outfit-OFL.txt"
check "JetBrains Mono licence ships with the font" grep -q "SIL Open Font License" "$site/fonts/JetBrainsMono-OFL.txt"
check "stylesheet uses Outfit" grep -q -- "--font-sans:Outfit" "$site"/css/main*.css
check "stylesheet uses JetBrains Mono for code" grep -q '"JetBrains Mono"' "$site"/css/main*.css
check "home page preloads Outfit" grep -q 'rel=preload[^>]*Outfit-Variable.woff2' "$site/index.html"
check "no third-party font hosts" bash -c "! grep -rIlE 'fonts\.(googleapis|gstatic)\.com' '$site'"

# The CSP (style-src 'self') blocks inline styles, which Hugo's code highlighting would add.
check "pages have no inline style attributes" bash -c "! grep -rIlE --include='*.html' '<[^>]+ style=' '$site'"

# laserlint's product page (rule: what it does, a real example, how to install, and
# links to docs, source, changelog and security contact).
tool="$site/tools/laserlint/index.html"
repo="https://github.com/kinglet-dev/laserlint"
check "laserlint page exists" test -f "$tool"
check "home page lists laserlint" grep -q 'href=/tools/laserlint/' "$site/index.html"
check "laserlint page says what it does" grep -q '<p class=lead>Checks an SVG before you laser it' "$tool"
check "laserlint page shows a real example with its verdict" grep -q 'Not ready to burn: 1 problem and 4 warnings.' "$tool"
check "laserlint page links to the latest release for installing" grep -q "href=$repo/releases/latest" "$tool"
check "laserlint page links to the source" grep -q "href=$repo>" "$tool"
check "laserlint page links to the documentation" grep -q "href=$repo#usage" "$tool"
check "laserlint page links to the changelog" grep -q "href=$repo/blob/main/CHANGELOG.md" "$tool"
check "laserlint page links to the security policy" grep -q "href=$repo/blob/main/SECURITY.md" "$tool"
# Code blocks scroll sideways on small screens, so keyboard users must be able to reach them (WCAG 2.1.1).
check "code blocks can be scrolled with the keyboard" bash -c "! grep -rIlE --include='*.html' '<pre>' '$site'"
check "laserlint page shows its diagram in both themes" \
  grep -qE '<picture[^>]*><source srcset=/images/tools/laserlint-hero-dark.svg media="\(prefers-color-scheme: ?dark\)"><img src=/images/tools/laserlint-hero-light.svg alt' "$tool"

# Performance budget (Core Web Vitals guard): the home page and everything it loads
# up front stays under 100 KB before compression, so LCP stays well inside 2.5 s.
home_bytes=$(cat "$site/index.html" "$site"/css/main*.css "$site/fonts/Outfit-Variable.woff2" \
  "$site/favicon.svg" "$site/images/kinglet-mascot.svg" 2>/dev/null | wc -c)
check "home page weight is under 100 KB (is $((home_bytes / 1024)) KB)" test "$home_bytes" -lt 102400

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
