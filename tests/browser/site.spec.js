// Browser checks for the WCAG 2.2 AA and UI rules that static checks can't see.
const { test, expect } = require("@playwright/test");
const { serveWithCsp } = require("./csp");

const pages = ["/", "/tools/", "/404.html"];
const headerLinks = ".site-header nav a";

for (const colorScheme of ["light", "dark"]) {
  test.describe(`In the ${colorScheme} theme`, () => {
    test.use({ colorScheme });

    test.beforeEach(async ({ page }) => {
      // Arrange (shared)
      await serveWithCsp(page);
    });

    for (const path of pages) {
      test(`${path} fits a 320 px wide screen without horizontal scrolling`, async ({ page }) => {
        // Arrange
        await page.setViewportSize({ width: 320, height: 640 });

        // Act
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

        // Assert
        expect(overflow).toBeLessThanOrEqual(0);
      });

      test(`${path} loads with no console errors under the production CSP`, async ({ page }) => {
        // Arrange
        const errors = [];
        page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
        page.on("pageerror", (error) => errors.push(error.message));

        // Act
        await page.goto(path);
        await page.waitForLoadState("networkidle");

        // Assert
        expect(errors).toEqual([]);
      });
    }

    test("header links are at least 24 px tall for mouse users", async ({ page }) => {
      // Arrange
      await page.goto("/");

      // Act
      const heights = await page.locator(headerLinks).evaluateAll((links) =>
        links.map((link) => link.getBoundingClientRect().height));

      // Assert
      expect(heights.length).toBeGreaterThan(0);
      for (const height of heights) expect(height).toBeGreaterThanOrEqual(24);
    });

    test("tabbing reaches the home link, then each header link, with a visible focus outline", async ({ page }) => {
      // Arrange
      await page.goto("/");
      const expected = ["kinglet", "Tools", "GitHub"];
      const reached = [];

      // Act
      for (let i = 0; i < expected.length; i++) {
        await page.keyboard.press("Tab");
        reached.push(await page.evaluate(() => {
          const el = document.activeElement;
          const style = getComputedStyle(el);
          return { text: el.textContent.trim(), outline: style.outlineStyle, width: parseFloat(style.outlineWidth) };
        }));
      }

      // Assert
      expect(reached.map((r) => r.text)).toEqual(expected);
      for (const focus of reached) {
        expect(focus.outline).not.toBe("none");
        expect(focus.width).toBeGreaterThanOrEqual(2);
      }
    });

    test("the mascot matches the theme", async ({ page }) => {
      // Arrange
      const expected = colorScheme === "dark" ? "kinglet-mascot-dark.svg" : "kinglet-mascot.svg";

      // Act
      await page.goto("/404.html");
      const source = await page.locator(".mascot img").evaluate((img) => img.currentSrc);

      // Assert
      expect(source.endsWith(`/images/${expected}`)).toBe(true);
    });

    test("the Outfit brand font is loaded from the site itself", async ({ page }) => {
      // Arrange
      await page.goto("/");

      // Act
      await page.evaluate(() => document.fonts.ready);
      const loaded = await page.evaluate(() => document.fonts.check("16px Outfit"));

      // Assert
      expect(loaded).toBe(true);
    });
  });
}

test.describe("On touch screens", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test("header links are at least 44 px tall (Apple HIG)", async ({ page }) => {
    // Arrange
    await page.goto("/");

    // Act
    const heights = await page.locator(headerLinks).evaluateAll((links) =>
      links.map((link) => link.getBoundingClientRect().height));

    // Assert
    expect(heights.length).toBeGreaterThan(0);
    for (const height of heights) expect(height).toBeGreaterThanOrEqual(44);
  });
});

test.describe("With reduced motion requested", () => {
  test.use({ reducedMotion: "reduce" });

  test("pages run no animations or transitions", async ({ page }) => {
    // Arrange
    await page.goto("/");

    // Act
    const running = await page.evaluate(() => document.getAnimations().length);

    // Assert
    expect(running).toBe(0);
  });
});
