import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { run } from "../../static/preflight/js/run.mjs";
import { readFile } from "node:fs/promises";
import { flags } from "../../static/preflight/js/settings.mjs";
import { tool, text } from "./helpers.mjs";

// The page's advanced settings, as Hugo renders them into the form.
const settings = JSON.parse(await readFile(new URL("../../data/preflight_settings.json", import.meta.url), "utf8"));

describe("settings", () => {
  const help = {};

  before(async () => {
    // Arrange (shared): each tool's own help, which states its defaults
    for (const name of ["laserlint", "laserfix"]) {
      const t = await tool(name);
      help[name] = text((await run(t.Go, t.module, { args: ["--help"], stdin: "" })).stdout);
    }
  });

  for (const s of settings) {
    it(`shows ${s.tool}'s own default for --${s.flag}`, () => {
      // Act
      const entry = help[s.tool].split(/\n(?=  --|  -h)/).find((line) => line.startsWith(`  --${s.flag} `));

      // Assert
      assert.ok(entry, `${s.tool} --help lists --${s.flag}`);
      assert.match(entry.replace(/\s+/g, " "), new RegExp(`\\(default ${s.default.replace(".", "\\.")}[,)]`));
    });
  }

  it("gives each tool only its own flags, for the values filled in", () => {
    // Arrange
    const fields = [
      { tool: "laserlint", flag: "line", value: "0.08mm" },
      { tool: "laserlint", flag: "gap", value: "" },
      { tool: "laserfix", flag: "join", value: "0.1mm" },
      { tool: "laserlint", flag: "max-details", value: " 30 " },
    ];

    // Act
    const args = flags(fields);

    // Assert
    assert.deepEqual(args, { laserlint: ["--line", "0.08mm", "--max-details", "30"], laserfix: ["--join", "0.1mm"] });
  });

  it("gives no flags when nothing is filled in, so each tool uses its defaults", () => {
    // Act
    const args = flags([]);

    // Assert
    assert.deepEqual(args, { laserlint: [], laserfix: [] });
  });
});
