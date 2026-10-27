# Checks for Kinglet Saymake (/saymake/), sourced by check-site.sh, which
# defines $site and check(). The saymake release's kit runs in the page, from
# pinned, checksum-verified release files (saymake.lock, scripts/fetch-saymake.sh).
saymake_lock="${SAYMAKE_LOCK:-$(dirname "$0")/../saymake.lock}"
saymake="$site/saymake/index.html"
check "Saymake page exists" test -f "$saymake"
check "Saymake page has its own search title" grep -q "<title>Make 3D print and laser cut files from a description, free · Kinglet Saymake</title>" "$saymake"
check "Saymake page describes itself for search results" grep -qE '<meta name=description content="Describe a vase, bowl, tray, coaster or tag[^"]{40,120}">' "$saymake"
check "Saymake page has one h1" test "$(grep -o '<h1' "$saymake" | wc -l)" -eq 1
check "Saymake page has the description field" grep -q '<input id=text' "$saymake"
check "Saymake page holds the tool's markup from the pinned kit" bash -c "grep -q '<div class=saymake><form id=describe' '$saymake' && grep -q 'id=\"describe\"' '$site/saymake/kit/web.html'"
check "Saymake page says nothing typed leaves the computer" grep -q "nothing you type leaves your computer" "$saymake"
check "Saymake page loads the kit's stylesheet and module" bash -c "grep -q '<link rel=stylesheet href=/saymake/kit/web.css>' '$saymake' && grep -q '<script type=module src=/saymake/kit/web.js></script>' '$saymake'"
check "Saymake page has a link preview (Open Graph) with an image" grep -q '<meta property="og:image" content="https://kinglet.dev/images/saymake-share.png">' "$saymake"
check "Saymake page has a large Twitter card" grep -q '<meta name=twitter:card content="summary_large_image">' "$saymake"
check "Saymake page describes itself as a free web app (JSON-LD)" python3 - "$saymake" <<'PY'
import json, re, sys
html = open(sys.argv[1]).read()
block = re.search(r'<script type=application/ld\+json>(.*?)</script>', html, re.S).group(1)
data = json.loads(block)
sys.exit(not (data["@type"] == "WebApplication" and data["name"] == "Kinglet Saymake"
              and data["offers"]["price"] == "0" and data["url"] == "https://kinglet.dev/saymake/"))
PY
check "Saymake share image is a 1200 × 630 PNG" python3 -c '
import struct, sys
data = open(sys.argv[1], "rb").read(24)
sys.exit(not (data[:8] == b"\x89PNG\r\n\x1a\n" and struct.unpack(">II", data[16:24]) == (1200, 630)))' "$site/images/saymake-share.png"
check "home page links to Saymake" grep -q "href=/saymake/>" "$site/index.html"
check "saymake page offers to try it in the browser" grep -q "<a href=/saymake/>Try it in your browser</a>" "$site/tools/saymake/index.html"
check "Saymake page is in the sitemap" grep -q "<loc>https://kinglet.dev/saymake/</loc>" "$site/sitemap.xml"
check "Saymake page's CSP lets it compile WebAssembly and load only from the site" bash -c \
  "sed -n '/^\/saymake\/\$/,/^\$/p' '$site/_headers' | grep -qF \"script-src 'self' 'wasm-unsafe-eval'; connect-src 'self';\""
for file in saymake.wasm saymake_wasm_exec.js saymake_wasm_exec_LICENSE.txt web.js web.css web.html; do
  check "Saymake ships $file" test -s "$site/saymake/kit/$file"
done
check "Saymake's files match the pinned checksums" python3 - "$saymake_lock" "$site/saymake/kit" <<'PY'
import hashlib, sys
lock, folder = sys.argv[1:]
rows = [line.split() for line in open(lock) if line.strip() and not line.startswith("#")]
row = next(r for r in rows if r[0] == "saymake")
names = ["saymake.wasm", "saymake_wasm_exec.js", "saymake_wasm_exec_LICENSE.txt", "web.js", "web.css", "web.html"]
digest = lambda name: hashlib.sha256(open(f"{folder}/{name}", "rb").read()).hexdigest()
sys.exit(len(row) != 8 or any(digest(n) != h for n, h in zip(names, row[2:])))
PY
check "Go's license ships with Saymake's wasm_exec.js" grep -q "Copyright 2009 The Go Authors" "$site/saymake/kit/saymake_wasm_exec_LICENSE.txt"
