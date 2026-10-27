// WCAG 2.2 A and AA checks with axe-core (MPL-2.0; approved 2026-10-18 for
// CI only: it runs in the test browser and never ships with the site).
const fs = require("fs");
const { test, expect } = require("./coverage");
const { serveWithCsp } = require("./csp");
const { svg, square, file } = require("./preflight-fixtures");

const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const pages = ["/", "/tools/", "/tools/laserlint/", "/tools/laserfix/", "/tools/saymake/", "/preflight/", "/saymake/", "/404.html"];

// violations runs axe-core in the page (page.evaluate isn't bound by the
// page's CSP) and lists each rule broken, with the elements that break it.
async function violations(page) {
  await page.evaluate(axeSource);
  const results = await page.evaluate(() =>
    window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }));
  return results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join("; ")})`);
}

for (const colorScheme of ["light", "dark"]) {
  test.describe(`Accessibility in the ${colorScheme} theme`, () => {
    test.use({ colorScheme });

    test.beforeEach(async ({ page }) => {
      // Arrange (shared)
      await serveWithCsp(page);
    });

    for (const path of pages) {
      test(`${path} meets WCAG 2.2 AA`, async ({ page }) => {
        // Arrange
        await page.goto(path);
        await page.waitForFunction(() => document.fonts.check("16px Outfit"));

        // Act
        const broken = await violations(page);

        // Assert
        expect(broken).toEqual([]);
      });
    }

    test("Saymake's result, checks and settings meet WCAG 2.2 AA", async ({ page }) => {
      // Arrange
      await page.goto("/saymake/");
      await expect(page.getByRole("status")).toHaveText("Ready. Describe an object to start.", { timeout: 30000 });
      await page.getByLabel("Description", { exact: true }).fill("a mug with a thick handle");
      await page.getByRole("button", { name: "Make it" }).click();
      await expect(page.getByRole("list", { name: "Printing checks" })).toBeVisible();
      await page.getByText("Printer", { exact: true }).click();

      // Act
      const broken = await violations(page);

      // Assert
      expect(broken).toEqual([]);
    });

    test("Preflight's results and settings meet WCAG 2.2 AA", async ({ page }) => {
      // Arrange
      await page.goto("/preflight/");
      await page.locator("#design").setInputFiles(file("twice.svg", svg(square + square)));
      await expect(page.getByRole("status")).toContainText("A repaired copy is ready", { timeout: 60000 });
      await page.getByText("Advanced settings", { exact: true }).click();

      // Act
      const broken = await violations(page);

      // Assert
      expect(broken).toEqual([]);
    });
  });
}
