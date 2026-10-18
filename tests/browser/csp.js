// Serves the site with the security headers from static/_headers, applied
// per path as Cloudflare's asset server does (checked against Wrangler's
// local server, 2026-10-18): every matching rule's headers are joined, but
// when a matching rule detaches a header ("! Name"), only the values set by
// rules that detach it are kept; a repeated pattern replaces the earlier rule.
const fs = require("fs");
const path = require("path");

// rules reads static/_headers into [{ pattern, set: {name: value}, detach: [name] }].
function rules() {
  const text = fs.readFileSync(path.join(__dirname, "..", "..", "static", "_headers"), "utf8");
  const parsed = [];
  for (const line of text.split("\n")) {
    if (/^\S/.test(line)) parsed.push({ pattern: line.trim(), set: {}, detach: [] });
    const header = line.match(/^\s+(!\s+)?([\w-]+)(?::\s*(.+))?$/);
    if (!header || parsed.length === 0) continue;
    const rule = parsed.at(-1);
    if (header[1]) rule.detach.push(header[2].toLowerCase());
    else rule.set[header[2].toLowerCase()] = header[3].trim();
  }
  return parsed;
}

// matches tests a URL path against a rule's pattern; "*" matches anything.
function matches(pattern, urlPath) {
  const regex = new RegExp(`^${pattern.split("*").map((p) => p.replace(/[.?+^$()[\]{}|\\]/g, "\\$&")).join(".*")}$`);
  return regex.test(urlPath);
}

// headersFor returns the headers from static/_headers for a path.
function headersFor(urlPath) {
  const byPattern = new Map(rules().map((r) => [r.pattern, r]));
  const applying = [...byPattern.values()].filter((r) => matches(r.pattern, urlPath));
  const headers = {};
  for (const name of new Set(applying.flatMap((r) => Object.keys(r.set)))) {
    const detaching = applying.some((r) => r.detach.includes(name));
    const values = applying
      .filter((r) => Object.hasOwn(r.set, name) && (!detaching || r.detach.includes(name)))
      .map((r) => r.set[name]);
    if (values.length > 0) headers[name] = values.join(", ");
  }
  return headers;
}

// A request still loading when a test ends (a worker's download, say) can't
// be answered any more; that isn't a failure of the test.
const ended = /Test ended|has been disposed|has been closed/;

async function serveWithCsp(page) {
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    try {
      const response = await route.fetch();
      await route.fulfill({ response, headers: { ...response.headers(), ...headersFor(url.pathname) } });
    } catch (error) {
      if (!ended.test(error.message)) throw error;
    }
  });
}

module.exports = { serveWithCsp, headersFor };
