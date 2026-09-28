// Reads the production Content-Security-Policy from static/_headers so the
// browser checks run under the same policy Cloudflare serves.
const fs = require("fs");
const path = require("path");

function productionCsp() {
  const headers = fs.readFileSync(path.join(__dirname, "..", "..", "static", "_headers"), "utf8");
  const match = headers.match(/^\s*Content-Security-Policy:\s*(.+)$/m);
  if (!match) throw new Error("static/_headers has no Content-Security-Policy");
  return match[1].trim();
}

async function serveWithCsp(page) {
  const csp = productionCsp();
  // CSP is enforced from the document response, so only documents need the header.
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() !== "document") return route.continue();
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), "content-security-policy": csp } });
  });
}

module.exports = { serveWithCsp };
