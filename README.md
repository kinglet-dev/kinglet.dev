# kinglet.dev

Source for [kinglet.dev](https://kinglet.dev), the website for Kinglet's small,
local-first tools. Built with [Hugo](https://gohugo.io/) and served as static
assets by a Cloudflare Worker.

## Run locally

Install Hugo 0.166.0 (standard edition is enough), then:

```sh
hugo server
```

Open http://localhost:1313. Hugo runs the same on Windows, macOS, and Linux.

## Build and check

```sh
bash build.sh   # Linux (Cloudflare and CI): installs pinned Hugo, builds, checks
```

Or, with Hugo already installed on any OS:

```sh
hugo build --gc --minify --panicOnWarning --cleanDestinationDir
bash scripts/check-site.sh public
```

## Layout

| Path | Purpose |
|---|---|
| `content/` | Pages. Each tool gets `content/tools/<tool>.md`. |
| `layouts/` | Hand-written templates (no third-party theme). |
| `assets/css/` | Stylesheet (minified and fingerprinted at build). |
| `static/` | Copied as-is: `_headers` (security headers), `.well-known/security.txt`. |
| `scripts/check-site.sh` | Checks the built site; runs in CI and before every deploy. |
| `wrangler.jsonc` | Cloudflare Worker config. |

## Adding a tool

Create `content/tools/<tool>.md` with a `title` and `description` in the
front matter. It appears on the home page and the tools catalog automatically.

## Deploy

Cloudflare Workers Builds deploys `main` on every push (deploy command
`npx wrangler deploy`). Pull requests run CI only.

## Security

See [SECURITY.md](SECURITY.md).
