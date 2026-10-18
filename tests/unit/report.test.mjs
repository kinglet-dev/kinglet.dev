import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { run } from "../../static/preflight/js/run.mjs";
import { checkReport, repairReport, mm } from "../../static/preflight/js/report.mjs";
import { tool, text } from "./helpers.mjs";
import { laserlintDesigns, laserfixDesigns } from "./fixtures.mjs";
import { laserlintText, laserfixText } from "./layout.mjs";

// The page words every report as the command line does. These tests run
// each tool twice, for JSON and for text, and require the page's wording,
// laid out like the command line, to equal the command line's own text.
describe("the page's report wording", () => {
  let laserlint, laserfix;
  const both = async (t, args, design) => [
    await run(t.Go, t.module, { args: ["--json", ...args], stdin: design }),
    await run(t.Go, t.module, { args, stdin: design }),
  ];

  before(async () => {
    // Arrange (shared)
    laserlint = await tool("laserlint");
    laserfix = await tool("laserfix");
  });

  for (const [name, design] of Object.entries(laserlintDesigns)) {
    it(`matches laserlint's text for ${name}`, async () => {
      // Arrange
      const [json, plain] = await both(laserlint, ["-"], design);

      // Act
      const shown = laserlintText(checkReport(JSON.parse(text(json.stdout))));

      // Assert
      assert.equal(shown, text(plain.stdout).replace(/^.*\n\n/, ""));
    });
  }

  for (const [name, design] of Object.entries(laserfixDesigns)) {
    for (const [mode, args] of [["preview", ["-"]], ["repair", ["-", "-o", "-"]]]) {
      it(`matches laserfix's ${mode} text for ${name}`, async () => {
        // Arrange
        const [json, plain] = await both(laserfix, args, design);
        const report = args.length > 1 ? json.stderr : text(json.stdout);
        const expected = (args.length > 1 ? plain.stderr : text(plain.stdout)).replace(/^.*\n\n/, "");

        // Act
        const shown = laserfixText(repairReport(JSON.parse(report)));

        // Assert
        assert.equal(shown, expected.replace(/\n(Run again with -o FILE|Wrote the repaired SVG)[^\n]*\n$/, ""));
      });
    }
  }
});

describe("checkReport", () => {
  const report = (severities) => checkReport({
    checks: [{ id: "c", name: "Check" }],
    findings: severities.map((severity) => ({ check: "c", severity, message: "m", fix: "f", locations: [] })),
  });

  it("is ready to burn with warnings and information", () => {
    // Act
    const { ready } = report(["warning", "info"]);

    // Assert
    assert.equal(ready, true);
  });

  it("isn't ready to burn with a problem", () => {
    // Act
    const { ready } = report(["warning", "problem"]);

    // Assert
    assert.equal(ready, false);
  });
});

describe("mm", () => {
  it("rounds to a tenth of a millimeter, as the command line does", () => {
    // Act
    const shown = [mm(1.04), mm(1.06), mm(0.15), mm(30)];

    // Assert
    assert.deepEqual(shown, ["1.0", "1.1", "0.1", "30.0"]);
  });

  it("rounds an exact half to the even tenth, as Go does", () => {
    // Act
    const shown = [mm(12.25), mm(12.75), mm(0.25), mm(-0.25), mm(-0.75)];

    // Assert
    assert.deepEqual(shown, ["12.2", "12.8", "0.2", "-0.2", "-0.8"]);
  });
});
