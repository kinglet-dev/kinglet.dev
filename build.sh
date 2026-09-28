#!/usr/bin/env bash
# Builds kinglet.dev. Runs in Cloudflare Workers Builds and in GitHub CI.
# Installs a pinned Hugo, verifies its checksum, builds, then checks the output.
# Adapted from https://gohugo.io/host-and-deploy/host-on-cloudflare/ (Hugo only).
set -euo pipefail

HUGO_VERSION=0.166.0
HUGO_SHA256=45228f5a52eb118b0ca168068f01d7df0447314a24056f1d29667ed9fc368308
HUGO_TARBALL="hugo_${HUGO_VERSION}_linux-amd64.tar.gz"

tmp_dir=$(mktemp -d)
trap 'rm -rf "${tmp_dir}"' EXIT

echo "Installing Hugo ${HUGO_VERSION}..."
curl -sfL -o "${tmp_dir}/${HUGO_TARBALL}" \
  "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/${HUGO_TARBALL}"
echo "${HUGO_SHA256}  ${tmp_dir}/${HUGO_TARBALL}" | sha256sum -c -
mkdir -p "${HOME}/.local/hugo"
tar -C "${HOME}/.local/hugo" -xf "${tmp_dir}/${HUGO_TARBALL}" hugo
export PATH="${HOME}/.local/hugo:${PATH}"
hugo version

echo "Building the site..."
HUGO_CACHEDIR="${PWD}/.cache/hugo" hugo build --gc --minify --panicOnWarning --cleanDestinationDir

echo "Checking the site..."
bash scripts/check-site.sh public

# Browser checks (Playwright, pinned in package-lock.json; test tooling only, never shipped).
echo "Running browser checks..."
npm ci --ignore-scripts --no-audit --no-fund
npx playwright install --only-shell chromium
npx playwright test
