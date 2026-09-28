<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="static/images/kinglet-mascot-dark.svg">
    <img src="static/images/kinglet-mascot.svg" alt="The Kinglet mascot: a small olive-green kinglet with a ruby crest, perched on a branch" width="160" height="160">
  </picture>
</p>

<h1 align="center">kinglet.dev</h1>

<p align="center">
  Source for <a href="https://kinglet.dev">kinglet.dev</a>, the home of Kinglet's small, local-first developer tools.
</p>

<p align="center">
  <a href="https://github.com/kinglet-dev/kinglet.dev/actions/workflows/ci.yml"><img src="https://github.com/kinglet-dev/kinglet.dev/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
</p>

A static site built with [Hugo](https://gohugo.io/) and served as static assets
by a Cloudflare Worker. No JavaScript, no cookies, no analytics, no third-party
fonts or scripts. Every build is checked before it can deploy: security
headers, WCAG 2.2 AA colour contrast, self-hosted fonts, icons, image
dimensions, SVG safety and a page-weight budget.

## Prerequisites

- [Hugo](https://gohugo.io/installation/) 0.166.0, standard edition
- Python 3 (standard library only), used by the contrast check and to serve the site for browser checks
- Node.js 22 or later, used only for the browser checks
- Bash and Perl, used by the site checks (included in Linux and macOS; on
  Windows use Git Bash or WSL)

## Run locally

```sh
hugo server
```

Open http://localhost:1313.

## Build and check

```sh
bash build.sh   # Linux (Cloudflare and CI): installs pinned Hugo, builds, runs the site checks
```

Or, with Hugo already installed on any OS:

```sh
hugo build --gc --minify --panicOnWarning --cleanDestinationDir
bash scripts/check-site.sh public
npm ci --ignore-scripts && npx playwright install chromium
npx playwright test   # browser checks against ./public
```

A failing check exits non-zero. The browser checks load every page in
Chromium, in light and dark mode and under the production Content-Security-Policy, and check
320 px layouts, target sizes, keyboard focus, the mascot variant, fonts and reduced motion.

## Layout

| Path | Purpose |
|---|---|
| `content/` | Pages. Each tool gets `content/tools/<tool>.md`. |
| `layouts/` | Hand-written templates (no third-party theme). |
| `layouts/_partials/logo.html` | Inline logo; follows the theme through `currentColor`. |
| `assets/css/` | Stylesheet with the brand tokens (minified and fingerprinted at build). |
| `static/` | Copied as-is: `_headers` (security headers), `.well-known/security.txt`, favicons. |
| `static/fonts/` | Self-hosted Outfit and JetBrains Mono, each with its licence. |
| `static/images/` | Mascot SVGs (light and dark). |
| `scripts/check-site.sh` | Checks the built site; runs in CI and before every deploy. |
| `scripts/check-contrast.py` | WCAG 2.2 AA contrast of the colour tokens in both themes. |
| `tests/browser/`, `playwright.config.js` | Browser checks (Playwright). |
| `wrangler.jsonc` | Cloudflare Worker config. |

## Adding a tool

Create `content/tools/<tool>.md` with a `title` and `description` in the
front matter. It appears on the home page and the tools catalog automatically.

## Deploy

Changes reach `main` only through pull requests whose CI passed: `main` is
protected by a GitHub ruleset that requires the **Build and check** status
check, blocks direct and force pushes, and has no bypass.

- **GitHub Actions (CI)** runs `build.sh` (build and site checks), then the
  browser checks, on every pull request and on `main`.
- **Cloudflare Workers Builds** runs `build.sh` again and deploys `main` on
  every push (deploy command `npx wrangler deploy`); other branches get
  preview builds. The browser checks don't run there because Cloudflare's
  build image lacks the system libraries Chromium needs, which is why the
  protected branch is what keeps a failing browser check from deploying.

## Compatibility

The site targets current Chrome, Safari, Firefox and Edge on Windows, macOS,
Linux, iOS and Android, from 320 px phones to wide desktops, in light and dark
mode.

## Dependencies

| Dependency | Used for | Licence |
|---|---|---|
| [Hugo](https://github.com/gohugoio/hugo) 0.166.0 | Building the site (pinned, checksum-verified) | Apache 2.0 |
| [Outfit](https://github.com/Outfitio/Outfit-Fonts) | Brand typeface | SIL OFL 1.1 |
| [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) | Code and terminal output | SIL OFL 1.1 |
| [Playwright](https://github.com/microsoft/playwright) 1.63.0 | Browser checks only; never shipped (pinned in `package-lock.json`) | Apache 2.0 |
| [actions/checkout](https://github.com/actions/checkout) v7.0.1 | CI (pinned by commit SHA) | MIT |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

Please report vulnerabilities privately; see [SECURITY.md](SECURITY.md).

## Licence

Code is [MIT](LICENSE). The fonts in `static/fonts/` keep their own SIL Open
Font License 1.1, included next to each font.
The Kinglet name, logo and mascot are not covered by the MIT License; see
[TRADEMARKS.md](TRADEMARKS.md).
