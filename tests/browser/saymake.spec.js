// Kinglet Saymake (/saymake/): the saymake release's kit, pinned in
// saymake.lock, running in the site's layout under the production policy.
const { test, expect } = require("@playwright/test");
const { serveWithCsp } = require("./csp");

// ready opens Saymake and waits until its tool has started.
async function ready(page) {
  await serveWithCsp(page);
  await page.goto("/saymake/");
  await expect(page.getByRole("status")).toHaveText("Ready. Describe an object to start.", { timeout: 30000 });
}

test("makes a shape from a description and downloads it, connecting only to the site", async ({ page }) => {
  // Arrange
  const refused = [], outside = [];
  page.on("console", (m) => { if (/Content Security Policy|Refused/.test(m.text())) refused.push(m.text()); });
  page.on("request", (r) => { if (!/^http:\/\/127\.0\.0\.1:4321\//.test(r.url()) && !/^(data|blob):/.test(r.url())) outside.push(r.url()); });
  await ready(page);
  const waiting = page.waitForEvent("download");

  // Act
  await page.getByLabel("Description", { exact: true }).fill("an oblique vase, 20 cm");
  await page.getByRole("button", { name: "Make it" }).click();
  await expect(page.getByRole("status")).toHaveText("Made a vase, 100.8 × 100.8 × 200 mm.");
  await page.getByRole("button", { name: "Download STL (.stl)" }).click();

  // Assert
  expect((await waiting).suggestedFilename()).toBe("vase.stl");
  await expect(page.getByRole("status")).toHaveText("Downloading vase.stl.");
  expect(refused).toEqual([]);
  expect(outside).toEqual([]);
});

test("makes flat shapes too, as outlines to cut", async ({ page }) => {
  // Arrange
  await ready(page);

  // Act
  await page.getByLabel("Description", { exact: true }).fill("hexagonal coaster with rounded corners, 4in");
  await page.getByRole("button", { name: "Make it" }).click();

  // Assert
  await expect(page.getByRole("img", { name: /^Outline of the coaster/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download SVG (.svg)" })).toBeVisible();
});

test("fits the site's column: the preview above the settings", async ({ page }) => {
  // Arrange
  await page.setViewportSize({ width: 1280, height: 900 });
  await ready(page);

  // Act
  await page.getByLabel("Description", { exact: true }).fill("a tall fluted vase, 20 cm");
  await page.getByRole("button", { name: "Make it" }).click();
  await expect(page.getByRole("status")).toHaveText(/^Made a vase/);
  const preview = await page.locator(".sm-preview").boundingBox();
  const settings = await page.locator(".sm-side").boundingBox();

  // Assert
  expect(settings.y).toBeGreaterThan(preview.y + preview.height - 1);
});
