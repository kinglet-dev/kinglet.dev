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
hugo build --gc --minify --panicOnWarning --cleanDestinationDir
bash scripts/check-site.sh public
npm ci --ignore-scripts && npx playwright install chromium
npx playwright test   # browser checks against ./public
```

## Layout

| Path | Purpose |
|---|---|
| `content/` | Pages. Each tool gets `content/tools/<tool>.md`. |
| `layouts/` | Hand-written templates; `_partials/logo.html` is the inline logo. |
| `assets/css/` | Stylesheet with the brand tokens. |
| `static/` | Copied as-is: security headers, `security.txt`, favicons, fonts, mascot. |
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

## Deploy

`main` is protected: changes land only through pull requests whose
**Build and check** CI job passed. GitHub CI runs `build.sh`, then the browser
checks. Cloudflare Workers Builds runs `build.sh` again and deploys `main`;
other branches get preview builds. The browser checks run only in CI because
Cloudflare's build image lacks the libraries Chromium needs.

## Security and licence

Report vulnerabilities privately; see [SECURITY.md](SECURITY.md). Code is
[MIT](LICENSE); fonts keep their SIL OFL 1.1 licences in `static/fonts/`. The
Kinglet name, logo and mascot are not covered by the MIT License; see
[TRADEMARKS.md](TRADEMARKS.md).
