import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { run } from "../../static/preflight/js/run.mjs";
import { preflight } from "../../static/preflight/js/flow.mjs";
import { tool, svg, square, tooClose, text } from "./helpers.mjs";

// The page's ports: runTool runs a tool (here in this process, as the
// worker does in the browser), and ui records what the page is told.
describe("preflight", () => {
  const tools = {};
  const runTool = (name, args, stdin) => run(tools[name].Go, tools[name].module, { args, stdin });
  const recorder = () => {
    const calls = [];
    const ui = new Proxy({}, { get: (_, method) => (...args) => { calls.push([method, ...args]); } });
    return { calls, ui, methods: () => calls.map(([m, a]) => (m === "working" ? `${m} ${a}` : m)) };
  };
  const bytes = (s) => new TextEncoder().encode(s);

  before(async () => {
    // Arrange (shared)
    tools.laserlint = await tool("laserlint");
    tools.laserfix = await tool("laserfix");
  });

  it("checks the design, then repairs it, telling the page each step", async () => {
    // Arrange
    const { ui, calls, methods } = recorder();

    // Act
    await preflight({ name: "twice.svg", bytes: bytes(svg(square + square)), fields: [] }, { runTool, ui });

    // Assert
    assert.deepEqual(methods(), ["working Checking", "checked", "working Repairing",
      "working Checking the repaired copy", "repaired", "finished"]);
    const [, check] = calls[1];
    const [, repair, repaired, labels] = calls[4];
    assert.equal(labels[check.items.findIndex((item) => item.severity === "problem")], "fixed");
    assert.match(check.verdict, /^Not ready to burn: /);
    assert.equal(repair.changes[0].label, "Copies");
    assert.equal(text(repaired), svg(square));
  });

  it("offers no repaired copy when there's nothing to fix", async () => {
    // Arrange
    const { ui, calls } = recorder();

    // Act
    await preflight({ name: "square.svg", bytes: bytes(svg(square)), fields: [] }, { runTool, ui });

    // Assert
    const [, repair, repaired, labels] = calls.find(([m]) => m === "repaired");
    assert.equal(repair.heading, "Nothing to fix.");
    assert.equal(repaired, null);
    assert.ok(labels.every((label) => label === null));
    assert.ok(!calls.some(([m, step]) => m === "working" && step === "Checking the repaired copy"));
  });

  it("passes the advanced settings to each tool", async () => {
    // Arrange
    const { ui, calls } = recorder();
    const fields = [{ tool: "laserlint", flag: "gap", value: "0.05mm" }];

    // Act
    await preflight({ name: "close.svg", bytes: bytes(svg(tooClose)), fields }, { runTool, ui });

    // Assert
    const [, check] = calls.find(([m]) => m === "checked");
    assert.equal(check.ready, true);
  });

  it("explains a file that can't be checked, naming it, and stops there", async () => {
    // Arrange
    const { ui, calls, methods } = recorder();

    // Act
    await preflight({ name: "broken.svg", bytes: bytes("<svg"), fields: [] }, { runTool, ui });

    // Assert
    assert.deepEqual(methods(), ["working Checking", "failed"]);
    assert.match(calls[1][1], /^broken\.svg: /);
    assert.doesNotMatch(calls[1][1], /laserlint|standard input/);
  });

  it("points to the advanced settings when a setting isn't valid", async () => {
    // Arrange
    const { ui, calls } = recorder();
    const fields = [{ tool: "laserlint", flag: "line", value: "wide" }];

    // Act
    await preflight({ name: "square.svg", bytes: bytes(svg(square)), fields }, { runTool, ui });

    // Assert
    const [method, message] = calls.at(-1);
    assert.equal(method, "failed");
    assert.match(message, /^Check the advanced settings: .*--line/);
    assert.doesNotMatch(message, /--help/);
  });

  it("explains a repair setting that isn't valid in the same way", async () => {
    // Arrange
    const { ui, calls } = recorder();
    const fields = [{ tool: "laserfix", flag: "join", value: "far" }];

    // Act
    await preflight({ name: "square.svg", bytes: bytes(svg(square)), fields }, { runTool, ui });

    // Assert
    const [method, message] = calls.at(-1);
    assert.equal(method, "failed");
    assert.match(message, /^Check the advanced settings: .*--join/);
  });

  it("says so if the repaired copy can't be checked again", async () => {
    // Arrange: the third run, checking the copy, fails
    const { ui, calls } = recorder();
    let runs = 0;
    const third = (name, args, stdin) =>
      (++runs === 3 ? Promise.resolve({ code: 2, stderr: "laserlint: standard input: broken\n" }) : runTool(name, args, stdin));

    // Act
    await preflight({ name: "twice.svg", bytes: bytes(svg(square + square)), fields: [] }, { runTool: third, ui });

    // Assert
    assert.deepEqual(calls.at(-1), ["failed", "The repaired copy: broken"]);
  });

  it("says so when stopped, and nothing more", async () => {
    // Arrange
    const { ui, methods } = recorder();
    const stopping = () => Promise.reject(Object.assign(new Error("stopped"), { stopped: true }));

    // Act
    await preflight({ name: "square.svg", bytes: bytes(svg(square)), fields: [] }, { runTool: stopping, ui });

    // Assert
    assert.deepEqual(methods(), ["working Checking", "stopped"]);
  });

  it("asks to try again when the checker can't load", async () => {
    // Arrange
    const { ui, calls } = recorder();
    const offline = () => Promise.reject(new TypeError("Failed to fetch"));

    // Act
    await preflight({ name: "square.svg", bytes: bytes(svg(square)), fields: [] }, { runTool: offline, ui });

    // Assert
    const [method, message] = calls.at(-1);
    assert.equal(method, "failed");
    assert.match(message, /couldn't load.*connection/);
  });
});
