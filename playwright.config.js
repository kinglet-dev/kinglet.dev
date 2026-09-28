// Browser checks for the built site in ./public (run `hugo build` first).
// Serves ./public with Python's standard-library web server; no network access needed.
const { defineConfig, devices } = require("@playwright/test");

const port = 4321;

module.exports = defineConfig({
  testDir: "tests/browser",
  forbidOnly: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    ...devices["Desktop Chrome"],
    // Optional: a locally installed Chromium, when the pinned browser can't be downloaded.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : {},
  },
  webServer: {
    command: `python3 -m http.server ${port} --bind 127.0.0.1 --directory public`,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: false,
  },
});
