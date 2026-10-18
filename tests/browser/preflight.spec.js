// Kinglet Preflight (/preflight/) in a real browser, running the real tools
// under the production security headers: checking, repairing, and what it shows.
const fs = require("fs");
const { test, expect } = require("./coverage");
const { serveWithCsp } = require("./csp");
const { svg, square, tooClose, file } = require("./preflight-fixtures");

const choose = (page, design) => page.locator("#design").setInputFiles(design);
const status = (page) => page.getByRole("status");

test.describe("Kinglet Preflight", () => {
  test.beforeEach(async ({ page }) => {
    // Arrange (shared)
    await serveWithCsp(page);
    await page.goto("/preflight/");
  });

  test("checks and repairs a chosen design, and offers the repaired copy", async ({ page }) => {
    // Act
    await choose(page, file("twice.svg", svg(square + square)));
    await expect(status(page)).toContainText("A repaired copy is ready", { timeout: 60000 });
    const download = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download repaired copy" }).click();
    const saved = await download;

    // Assert
    await expect(page.getByRole("heading", { name: "Check", exact: true })).toBeVisible();
    await expect(page.locator("[data-verdict]")).toHaveText(/^Not ready to burn: /);
    await expect(page.locator("[data-findings]")).toContainText("Lines too close");
    await expect(page.locator("[data-changes]")).toContainText("Copies");
    await expect(page.locator("[data-changes]")).toContainText("1 shape removed, 40.0 mm of line burned twice");
    await expect(page.locator("[data-measured]")).toContainText("40.0 mm → 0.0 mm");
    expect(saved.suggestedFilename()).toBe("twice-fixed.svg");
    expect(fs.readFileSync(await saved.path(), "utf8")).toBe(svg(square));
  });

  test("shows the chosen design, named, without marks", async ({ page }) => {
    // Act
    await choose(page, file("square.svg", svg(square)));
    await expect(status(page)).toContainText("Nothing to fix", { timeout: 60000 });

    // Assert
    const preview = page.locator("[data-preview]");
    await expect(preview).toHaveAttribute("alt", "The design in square.svg");
    expect(await preview.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
    await expect(page.locator("[data-caption]")).toHaveText("square.svg");
  });

  test("checks a design dropped on the page", async ({ page }) => {
    // Arrange
    const transfer = await page.evaluateHandle((content) => {
      const data = new DataTransfer();
      data.items.add(new File([content], "close.svg", { type: "image/svg+xml" }));
      return data;
    }, svg(tooClose));

    // Act
    await page.locator("[data-drop]").dispatchEvent("dragover", { dataTransfer: transfer });
    await expect(page.locator("[data-drop]")).toHaveClass(/dragging/);
    await page.locator("[data-drop]").dispatchEvent("drop", { dataTransfer: transfer });

    // Assert
    await expect(page.locator("[data-verdict]")).toHaveText(/^Not ready to burn: 1 problem/, { timeout: 60000 });
    await expect(page.locator("[data-drop]")).not.toHaveClass(/dragging/);
  });

  test("ignores a drop that has no file in it", async ({ page }) => {
    // Arrange
    const transfer = await page.evaluateHandle(() => {
      const data = new DataTransfer();
      data.setData("text/plain", "not a file");
      return data;
    });

    // Act
    await page.locator("[data-drop]").dispatchEvent("drop", { dataTransfer: transfer });

    // Assert
    await expect(status(page)).toHaveText("");
    await expect(page.locator("[data-results]")).toBeHidden();
  });

  test("forgets a drag that leaves the page", async ({ page }) => {
    // Act
    await page.locator("[data-drop]").dispatchEvent("dragover");
    await page.locator("[data-drop]").dispatchEvent("dragleave");

    // Assert
    await expect(page.locator("[data-drop]")).not.toHaveClass(/dragging/);
  });

  test("says when there's nothing to fix, and offers no download", async ({ page }) => {
    // Act
    await choose(page, file("square.svg", svg(square)));
    await expect(status(page)).toContainText("Nothing to fix", { timeout: 60000 });

    // Assert
    await expect(page.locator("[data-repair-summary]")).toHaveText("Nothing to fix.");
    await expect(page.getByRole("link", { name: "Download repaired copy" })).toBeHidden();
    await expect(page.locator("[data-measured-area]")).toBeHidden();
  });

  test("lists what laserfix leaves as it is", async ({ page }) => {
    // Act
    await choose(page, file("gap.svg", svg(`<path d="M2 2 H12 V12 H2 V2.5" fill="none" stroke="#000"/>`)));
    await expect(status(page)).toContainText("Nothing to fix", { timeout: 60000 });

    // Assert
    await expect(page.getByRole("heading", { name: "Left as they are" })).toBeVisible();
    await expect(page.locator("[data-left]")).toContainText("close them by hand, or raise --join");
  });

  test("explains a file it can't read, by name", async ({ page }) => {
    // Act
    await choose(page, file("broken.svg", "<svg"));

    // Assert
    await expect(page.getByRole("alert")).toHaveText(/^broken\.svg: the file is not well-formed XML/, { timeout: 60000 });
    await expect(page.locator("[data-results]")).toBeHidden();
  });

  test("sends nothing anywhere: it only loads its own files, and the page can't connect out", async ({ page }) => {
    // Arrange
    const requests = [];
    page.on("request", (request) => requests.push(request));

    // Act
    await choose(page, file("twice.svg", svg(square + square)));
    await expect(status(page)).toContainText("A repaired copy is ready", { timeout: 60000 });
    const blocked = await page.evaluate(() => fetch("/").then(() => false, () => true));

    // Assert
    expect(blocked).toBe(true);
    const origin = new URL(page.url()).origin;
    for (const request of requests) {
      const url = new URL(request.url());
      expect(request.method()).toBe("GET");
      expect(url.protocol === "blob:" || url.protocol === "data:" || url.origin === origin).toBe(true);
    }
    expect(requests.map((r) => new URL(r.url()).pathname)).toContain("/preflight/wasm/laserfix.wasm");
  });

  test("runs with no console errors under the production CSP", async ({ page }) => {
    // Arrange
    const errors = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));

    // Act
    await choose(page, file("twice.svg", svg(square + square)));
    await expect(status(page)).toContainText("A repaired copy is ready", { timeout: 60000 });

    // Assert
    expect(errors).toEqual([]);
  });
});
