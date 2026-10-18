// Measures which code of the page's own modules ran, with V8's precise
// block coverage (it sees every branch), across all browser tests, so the
// browser-only modules are held to 100% like the rest (engineering rules,
// section 3). The worker's module is its composition root: the end-to-end
// tests cover it, as main is covered for Go.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const base = require("@playwright/test");

const outDir = path.join(__dirname, "..", "..", "test-results", "js-coverage");
const measured = /\/preflight\/js\/(view|client|page)\.mjs$/;

// test is Playwright's test, collecting coverage of every page it opens.
const test = base.test.extend({
  page: async ({ page, browserName }, use) => {
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await use(page);
    const entries = (await page.coverage.stopJSCoverage()).filter((e) => measured.test(new URL(e.url).pathname));
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, `${crypto.randomUUID()}.json`), JSON.stringify(entries));
  },
});

// executed marks each character of a script that ran, from V8's ranges:
// nested ranges come after the ranges they sit in, and override them.
function executed(entry) {
  const ran = new Array(entry.source.length).fill(true);
  const ranges = entry.functions.flatMap((f) => f.ranges)
    .sort((a, b) => a.startOffset - b.startOffset || b.endOffset - a.endOffset);
  for (const r of ranges) ran.fill(r.count > 0, r.startOffset, r.endOffset);
  return ran;
}

// uncovered merges every test's coverage and lists code that never ran.
function uncovered() {
  const scripts = new Map();
  for (const file of fs.existsSync(outDir) ? fs.readdirSync(outDir) : []) {
    for (const entry of JSON.parse(fs.readFileSync(path.join(outDir, file), "utf8"))) {
      const name = path.basename(new URL(entry.url).pathname);
      const ran = executed(entry);
      const seen = scripts.get(name);
      scripts.set(name, { source: entry.source, ran: seen ? seen.ran.map((r, i) => r || ran[i]) : ran });
    }
  }
  const missing = [];
  for (const [name, { source, ran }] of scripts) {
    const lines = new Set();
    ran.forEach((r, i) => { if (!r && /\S/.test(source[i])) lines.add(source.slice(0, i).split("\n").length); });
    if (lines.size > 0) missing.push(`${name}: lines ${[...lines].join(", ")} never ran`);
  }
  return { scripts: [...scripts.keys()].sort(), missing };
}

module.exports = { test, expect: base.expect, uncovered, outDir };
