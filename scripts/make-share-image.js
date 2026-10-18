// Renders a share image's SVG source (assets-src/) to the 1200 × 630 PNG
// link previews need, with the site's own fonts (rule: share images).
// Usage: node scripts/make-share-image.js assets-src/NAME.svg static/images/NAME.png
// Uses Playwright's Chromium (set PLAYWRIGHT_CHROMIUM_PATH to use another).
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const [source, target] = process.argv.slice(2);
const fonts = path.join(__dirname, "..", "static", "fonts");
const font = (name, file) => `@font-face { font-family: "${name}"; src: url(data:font/woff2;base64,${
  fs.readFileSync(path.join(fonts, file)).toString("base64")}); font-weight: 100 900; }`;

(async () => {
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<style>${font("Outfit", "Outfit-Variable.woff2")}${font("JetBrains Mono", "JetBrainsMono-Regular.woff2")}
    body { margin: 0 }</style>${fs.readFileSync(source, "utf8")}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.fonts.check("32px Outfit") && document.fonts.check("24px 'JetBrains Mono'"));
  await page.locator("svg").screenshot({ path: target });
  await browser.close();
})();
