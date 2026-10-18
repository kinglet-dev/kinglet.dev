import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { run } from "../../static/preflight/js/run.mjs";
import { tool, svg, square, tooClose, text } from "./helpers.mjs";
import { laserlintDesigns } from "./fixtures.mjs";

describe("run", () => {
  let laserlint, laserfix;

  before(async () => {
    // Arrange (shared)
    laserlint = await tool("laserlint");
    laserfix = await tool("laserfix");
  });

  it("passes the design on standard input and returns the report with exit code 0", async () => {
    // Act
    const result = await run(laserlint.Go, laserlint.module, { args: ["-"], stdin: svg(square) });

    // Assert
    assert.equal(result.code, 0);
    assert.match(text(result.stdout), /\nReady to burn[.,]/);
    assert.equal(result.stderr, "");
  });

  it("returns exit code 1 when the design has problems", async () => {
    // Act
    const result = await run(laserlint.Go, laserlint.module, { args: ["-"], stdin: svg(tooClose) });

    // Assert
    assert.equal(result.code, 1);
    assert.match(text(result.stdout), /^PROBLEM  Lines too close$/m);
  });

  it("returns standard error and exit code 2 when the file can't be read", async () => {
    // Act
    const result = await run(laserlint.Go, laserlint.module, { args: ["-"], stdin: "<svg" });

    // Assert
    assert.equal(result.code, 2);
    assert.match(result.stderr, /^laserlint: standard input: /);
    assert.equal(result.stdout.length, 0);
  });

  it("returns the repaired copy on standard output and the report on standard error", async () => {
    // Act
    const result = await run(laserfix.Go, laserfix.module, { args: ["-", "-o", "-"], stdin: svg(square + square) });

    // Assert
    assert.equal(result.code, 0);
    assert.equal(text(result.stdout), svg(square));
    assert.match(result.stderr, /Copies +1 shape removed/);
  });

  it("reads a design larger than one read of standard input", async () => {
    // Arrange
    const many = Array.from({ length: 5000 }, (_, i) => `<!-- ${i} -->`).join("");

    // Act
    const result = await run(laserlint.Go, laserlint.module, { args: ["-"], stdin: svg(many + square) });

    // Assert
    assert.ok(svg(many + square).length > 32 * 1024);
    assert.equal(result.code, 0);
  });

  it("starts each run afresh, with nothing left from the last one", async () => {
    // Arrange
    await run(laserlint.Go, laserlint.module, { args: ["-"], stdin: svg(tooClose) });

    // Act
    const result = await run(laserlint.Go, laserlint.module, { args: ["-"], stdin: svg(square) });

    // Assert
    assert.equal(result.code, 0);
    assert.doesNotMatch(text(result.stdout), /PROBLEM/);
  });

  it("refuses to open files, so only the design given can be read", async () => {
    // Act
    const result = await run(laserlint.Go, laserlint.module, { args: ["design.svg"], stdin: "" });

    // Assert
    assert.equal(result.code, 2);
    assert.match(result.stderr, /^laserlint: can't open design\.svg: /);
  });

  it("takes the design as bytes, as read from a file", async () => {
    // Arrange
    const bytes = new TextEncoder().encode(svg(tooClose));

    // Act
    const result = await run(laserlint.Go, laserlint.module, { args: ["-"], stdin: bytes });

    // Assert
    assert.equal(result.code, 1);
  });

  it("leaves no timer set once the program has exited", async () => {
    // Arrange: track timers; Go still has one set when a busy design's run ends
    const pending = new Set();
    const { setTimeout: set, clearTimeout: clear } = globalThis;
    globalThis.setTimeout = (fn, ms) => {
      const id = set(() => { pending.delete(id); fn(); }, ms);
      pending.add(id);
      return id;
    };
    globalThis.clearTimeout = (id) => { pending.delete(id); clear(id); };

    // Act
    try {
      await run(laserlint.Go, laserlint.module, { args: ["-"], stdin: laserlintDesigns["a busy area"] });
    } finally {
      Object.assign(globalThis, { setTimeout: set, clearTimeout: clear });
    }
    const left = pending.size;
    for (const id of pending) clear(id);

    // Assert
    assert.equal(left, 0);
  });

  it("passes the arguments, such as --version", async () => {
    // Act
    const result = await run(laserfix.Go, laserfix.module, { args: ["--version"], stdin: "" });

    // Assert
    assert.equal(result.code, 0);
    assert.match(text(result.stdout), /^laserfix 0\.2\.0-dev\n$/);
  });
});
