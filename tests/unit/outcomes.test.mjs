import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { run } from "../../static/preflight/js/run.mjs";
import { checkReport, outcomes } from "../../static/preflight/js/report.mjs";
import { tool, svg, square, tooClose, text } from "./helpers.mjs";

// Whether each problem and warning is fixed in the repaired copy: the page
// checks the copy again and compares.
describe("outcomes", () => {
  let laserlint, laserfix;
  const check = async (design) =>
    checkReport(JSON.parse(text((await run(laserlint.Go, laserlint.module, { args: ["--json", "-"], stdin: design })).stdout)));
  const repaired = async (design) =>
    (await run(laserfix.Go, laserfix.module, { args: ["-", "-o", "-"], stdin: design })).stdout;
  const labelled = (report, labels) => report.items.map((item, i) => [item.name, item.severity, labels[i]]);

  before(async () => {
    // Arrange (shared)
    laserlint = await tool("laserlint");
    laserfix = await tool("laserfix");
  });

  it("marks problems the repaired copy no longer has as fixed", async () => {
    // Arrange
    const design = svg(square + square);
    const before = await check(design);
    const after = await check(await repaired(design));

    // Act
    const labels = outcomes(before, after);

    // Assert
    assert.deepEqual(labelled(before, labels).filter(([, severity]) => severity === "problem"),
      [["Lines too close", "problem", "fixed"], ["Crossings", "problem", "fixed"]]);
  });

  it("marks problems the repaired copy still has as fixed by hand", async () => {
    // Arrange
    const design = svg(square + square + tooClose);
    const before = await check(design);
    const after = await check(await repaired(design));

    // Act
    const labels = outcomes(before, after);

    // Assert
    assert.deepEqual(labelled(before, labels).filter(([name]) => name === "Lines too close"),
      [["Lines too close", "problem", "by hand"]]);
    assert.deepEqual(labelled(before, labels).filter(([name, severity]) => name === "Crossings" && severity === "problem"),
      [["Crossings", "problem", "fixed"]]);
  });

  it("marks every problem and warning as fixed by hand when there's no repaired copy", async () => {
    // Arrange
    const before = await check(svg(tooClose + `<path d="M2 15 L18 19 M2 19 L18 15" fill="none" stroke="#000"/>`));

    // Act
    const labels = outcomes(before, null);

    // Assert
    const marked = labelled(before, labels).filter(([, severity]) => severity === "problem" || severity === "warning");
    assert.ok(marked.some(([, severity]) => severity === "warning"));
    assert.deepEqual(marked.map(([, , label]) => label), marked.map(() => "by hand"));
  });

  it("leaves information and checks that found nothing unmarked", async () => {
    // Arrange
    const before = await check(svg(square));

    // Act
    const labels = outcomes(before, null);

    // Assert
    assert.deepEqual(labelled(before, labels).filter(([, , label]) => label !== null), []);
    assert.ok(before.items.some((item) => item.severity === "info"));
  });
});
