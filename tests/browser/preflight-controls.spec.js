// Kinglet Preflight's controls in a real browser: settings, stopping, the
// keyboard, and what it says when something can't load.
const { test, expect } = require("./coverage");
const { serveWithCsp } = require("./csp");
const { svg, square, tooClose, busy, file } = require("./preflight-fixtures");

const choose = (page, design) => page.locator("#design").setInputFiles(design);
const status = (page) => page.getByRole("status");

test.describe("Kinglet Preflight's controls", () => {
  test.beforeEach(async ({ page }) => {
    // Arrange (shared)
    await serveWithCsp(page);
    await page.goto("/preflight/");
  });

  test("checks again with the advanced settings", async ({ page }) => {
    // Arrange
    await choose(page, file("close.svg", svg(tooClose)));
    await expect(page.locator("[data-verdict]")).toHaveText(/^Not ready/, { timeout: 60000 });
    await page.getByText("Advanced settings", { exact: true }).click();

    // Act
    await page.getByLabel("Gap", { exact: true }).fill("0.05mm");
    await page.getByRole("button", { name: "Check again" }).click();

    // Assert
    await expect(page.locator("[data-verdict]")).toHaveText(/^Ready to burn/, { timeout: 60000 });
  });

  test("points to a setting that isn't valid", async ({ page }) => {
    // Arrange
    await choose(page, file("square.svg", svg(square)));
    await expect(status(page)).toContainText("Nothing to fix", { timeout: 60000 });
    await page.getByText("Advanced settings", { exact: true }).click();

    // Act
    await page.getByLabel("Line width").fill("wide");
    await page.getByRole("button", { name: "Check again" }).click();

    // Assert
    await expect(page.getByRole("alert")).toHaveText(/^Check the advanced settings: --line: unknown unit/, { timeout: 60000 });
  });

  test("asks to try again when its worker can't start", async ({ page }) => {
    // Arrange
    await page.route("**/preflight/js/worker.mjs", (route) => route.fulfill({ status: 404, body: "" }));

    // Act
    await choose(page, file("square.svg", svg(square)));

    // Assert
    await expect(page.getByRole("alert")).toHaveText(/^The checker couldn't load\. Check your internet connection/);
    await expect(page.getByRole("button", { name: "Stop" })).toBeHidden();
  });

  test("asks to try again when a tool can't load, and loads it next time", async ({ page }) => {
    // Arrange
    let missing = true;
    await page.route("**/preflight/wasm/laserlint.wasm", (route) =>
      (missing ? route.fulfill({ status: 404, body: "" }) : route.fallback()));
    await choose(page, file("square.svg", svg(square)));
    await expect(page.getByRole("alert")).toHaveText(/^The checker couldn't load/);
    missing = false;

    // Act
    await choose(page, file("square.svg", svg(square)));

    // Assert
    await expect(status(page)).toContainText("Nothing to fix", { timeout: 60000 });
    await expect(page.locator("[data-error]")).toBeEmpty();
  });

  test("clears the error once the setting is corrected and checked again", async ({ page }) => {
    // Arrange
    await choose(page, file("square.svg", svg(square)));
    await expect(status(page)).toContainText("Nothing to fix", { timeout: 60000 });
    await page.getByText("Advanced settings", { exact: true }).click();
    await page.getByLabel("Line width").fill("wide");
    await page.getByRole("button", { name: "Check again" }).click();
    await expect(page.getByRole("alert")).toHaveText(/^Check the advanced settings/, { timeout: 60000 });

    // Act
    await page.getByLabel("Line width").fill("0.1mm");
    await page.getByRole("button", { name: "Check again" }).click();

    // Assert
    await expect(status(page)).toContainText("Nothing to fix", { timeout: 60000 });
    await expect(page.locator("[data-error]")).toBeEmpty();
  });

  test("brings its progress into view when checking again", async ({ page }) => {
    // Arrange
    await page.setViewportSize({ width: 1280, height: 700 });
    await choose(page, file("close.svg", svg(tooClose)));
    await expect(status(page)).toContainText("Nothing to repair automatically", { timeout: 60000 });
    await page.getByText("Advanced settings", { exact: true }).click();
    await page.getByLabel("Gap", { exact: true }).fill("0.05mm");
    await page.getByRole("button", { name: "Check again" }).scrollIntoViewIfNeeded();
    await expect(status(page)).not.toBeInViewport();

    // Act
    await page.getByRole("button", { name: "Check again" }).click();

    // Assert
    await expect(status(page)).toBeInViewport();
  });

  test("says the repair is under way while it runs", async ({ page }) => {
    // Act
    await choose(page, file("busy.svg", busy()));
    await expect(page.locator("[data-verdict]")).not.toBeEmpty({ timeout: 60000 });

    // Assert
    await expect(page.locator("[data-repair-summary]")).toHaveText("Repairing a copy of your design…");
    await page.getByRole("button", { name: "Stop" }).click();
  });

  test("can't check again before a design is chosen", async ({ page }) => {
    // Act
    await page.getByText("Advanced settings", { exact: true }).click();

    // Assert
    await expect(page.getByRole("button", { name: "Check again" })).toBeDisabled();
  });

  test("shows how long it has been working, and can be stopped", async ({ page }) => {
    // Arrange
    await choose(page, file("busy.svg", busy()));
    await expect(page.locator("[data-elapsed]")).toHaveText(/^[1-9]\d* s$/, { timeout: 60000 });

    // Act
    await page.getByRole("button", { name: "Stop" }).click();

    // Assert
    await expect(status(page)).toHaveText("Stopped. Choose a design to start again.");
    await expect(page.getByRole("button", { name: "Stop" })).toBeHidden();
    await expect(page.locator("[data-elapsed]")).toHaveText("");
  });

  test("starts again after being stopped", async ({ page }) => {
    // Arrange
    await choose(page, file("busy.svg", busy()));
    await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
    await page.getByRole("button", { name: "Stop" }).click();

    // Act
    await choose(page, file("square.svg", svg(square)));

    // Assert
    await expect(status(page)).toContainText("Nothing to fix", { timeout: 60000 });
  });

  test("starts over when another design is chosen while it works", async ({ page }) => {
    // Arrange
    await choose(page, file("busy.svg", busy()));
    await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();

    // Act
    await choose(page, file("square.svg", svg(square)));

    // Assert
    await expect(status(page)).toContainText("Nothing to fix", { timeout: 60000 });
    await expect(page.locator("[data-caption]")).toHaveText("square.svg");
  });

  test("opens the file chooser from the keyboard, with a visible focus outline", async ({ page }) => {
    // Arrange
    await page.locator("#design").focus();
    await expect(page.locator("#design")).toBeFocused();

    // Act
    const outline = await page.locator("label[for=design]").evaluate((label) => getComputedStyle(label).outlineStyle);
    const chooser = page.waitForEvent("filechooser");
    await page.keyboard.press("Enter");

    // Assert
    expect(outline).not.toBe("none");
    expect((await chooser).isMultiple()).toBe(false);
  });
});
