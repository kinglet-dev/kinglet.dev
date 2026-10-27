# kinglet.dev

Source for [kinglet.dev](https://kinglet.dev): a Hugo site served as static
assets by a Cloudflare Worker.

## Run locally

Needs Hugo 0.166.0 (standard edition).

```sh
hugo server
```

Open http://localhost:1313.

## Build and check

```sh
bash build.sh   # Linux (Cloudflare and CI): installs pinned Hugo, builds, runs the site checks
```

Or, with Hugo, Python 3, Node.js 22+, Bash and Perl installed:

```sh
bash scripts/fetch-preflight.sh   # Kinglet Preflight's tools, verified (see below)
bash scripts/fetch-saymake.sh     # Kinglet Saymake's kit, verified (see below)
hugo build --gc --minify --panicOnWarning --cleanDestinationDir
bash scripts/check-site.sh public
npm ci --ignore-scripts && npx playwright install chromium
npm run test:unit     # Preflight's modules, with 100% coverage
npx playwright test   # browser checks against ./public, including axe-core
```

## Layout

| Path | Purpose |
|---|---|
| `content/` | Pages. Each tool gets `content/tools/<tool>.md`. |
| `layouts/` | Hand-written templates; `_partials/logo.html` is the inline logo. |
| `assets/css/` | Stylesheet with the brand tokens. |
| `static/` | Copied as-is: security headers, `security.txt`, favicons, fonts, mascot. |
| `static/preflight/js/` | Kinglet Preflight's page and worker modules. |
| `data/preflight_settings.json` | Preflight's advanced settings: one per tool flag, with its default. |
| `preflight.lock` | The tool releases Preflight runs, pinned by SHA-256. |
| `saymake.lock` | The saymake release Kinglet Saymake runs, pinned by SHA-256. |
| `assets-src/` | SVG sources of raster images, such as the share image. |
| `scripts/` | Site checks and the contrast check. |
| `tests/browser/` | Browser checks (Playwright). |
| `wrangler.jsonc` | Cloudflare Worker config. |

## Adding a tool

Create `content/tools/<tool>.md` with a `title` and `description` in the
front matter. It appears on the home page and the tools catalog automatically.

A tool page also needs, per the product-page rule, a real example, how to
install it, and links to docs, source, changelog and security policy
(`content/tools/laserlint.md` is the model). Optional front matter:

- `hero`: a diagram name; put `<hero>-light.svg` and `<hero>-dark.svg`
  (880 × 330, no scripts or external references) in `static/images/tools/`,
  and describe it in `heroAlt`.
- `download`: the latest-release URL, shown as the page's Download button.
- `source`: the repository URL, shown beside it.

Add the page's required content to `scripts/check-site.sh` and its path to
`tests/browser/site.spec.js`, failing first.

## Kinglet Preflight

[/preflight/](https://kinglet.dev/preflight/) runs laserlint and laserfix in
the browser: each tool's release `.wasm`, with the `wasm_exec.js` from the Go
version that built it, in a worker (`static/preflight/js/worker.mjs`).

- **Tool releases:** `build.sh` runs `scripts/fetch-preflight.sh`, which
  downloads the releases pinned in `preflight.lock` into
  `static/preflight/wasm/` (not committed) and stops if a checksum differs.
  To move to new releases, run
  `scripts/pin-preflight.sh laserlint VERSION laserfix VERSION`, which reads
  each release's checksums file. The site checks confirm what ships matches.
- **Wording:** the page words reports as the command lines do;
  `tests/unit/report.test.mjs` runs each tool in JSON and text mode and
  requires the same text, and `tests/unit/settings.test.mjs` holds the
  settings' defaults to each tool's `--help`.
- **Security headers:** `/preflight/` may run its own scripts and start its
  worker but connect nowhere; only `/preflight/js/*` (the worker) may fetch
  from the site and compile WebAssembly. The browser tests apply
  `static/_headers` per path the way Cloudflare does (`tests/browser/csp.js`).
- **Coverage:** `npm run test:unit` covers the modules that run in Node;
  the browser tests measure the page's own modules with V8 and fail below
  100% (`tests/browser/coverage.js`). Run the whole browser suite for that.
- **Share image:** after changing `assets-src/preflight-share.svg`, run
  `node scripts/make-share-image.js assets-src/preflight-share.svg static/images/preflight-share.png`.

## Kinglet Saymake

[/saymake/](https://kinglet.dev/saymake/) runs saymake's kit, which each
saymake release publishes: the tool's markup (`_web.html`), its stylesheet
(`_web.css`, scoped under `.saymake`), its module (`_web.js`), the `.wasm`
and Go's `wasm_exec.js`. The page's code and its tests live in the saymake
repository; this site pins the files and lays the page out.

- **Release:** `build.sh` runs `scripts/fetch-saymake.sh`, which downloads
  the release pinned in `saymake.lock` into `static/saymake/kit/` (not
  committed) and stops if a checksum differs; `layouts/saymake.html` reads the
  tool's markup from there. To move to a new release, run
  `scripts/pin-saymake.sh VERSION`. saymake's release files are reproducible,
  so the same source gives the same checksums.
- **Security headers:** `/saymake/` may load its own files from the site and
  compile WebAssembly, and connect nowhere else (`static/_headers`).
- **Checks:** `scripts/check-site-saymake.sh` (run by `check-site.sh`) and
  `tests/browser/saymake.spec.js` run the pinned kit under those headers.
- **Share image:** after changing `assets-src/saymake-share.svg`, run
  `node scripts/make-share-image.js assets-src/saymake-share.svg static/images/saymake-share.png`.

## Deploy

`main` is protected: changes land only through pull requests whose
**Build and check** CI job passed. GitHub CI runs `build.sh`, then the browser
checks. Cloudflare Workers Builds runs `build.sh` again and deploys `main`;
other branches get preview builds. The browser checks run only in CI because
Cloudflare's build image lacks the libraries Chromium needs.

## Security and license

Report vulnerabilities privately; see [SECURITY.md](SECURITY.md). Code is
[MIT](LICENSE); fonts keep their SIL OFL 1.1 licenses in `static/fonts/`. The
Kinglet name, logo and mascot are not covered by the MIT License; see
[TRADEMARKS.md](TRADEMARKS.md).
