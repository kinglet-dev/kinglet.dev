// Kinglet Preflight's composition root: wires the page's controls to the
// steps (flow.mjs), the worker (client.mjs) and the page's view (view.mjs).
import { preflight } from "./flow.mjs";
import { runner } from "./client.mjs";
import { view } from "./view.mjs";

const $ = (name) => document.querySelector(`[data-${name}]`);
const input = document.getElementById("design");
const drop = $("drop");
const tools = runner();
const ui = view(document);
let design = null;
let runs = 0;

// begin checks the design last chosen, with the settings as they are now.
// Starting again stops the last run, whose messages to the page are then
// ignored, so only the newest run updates it.
function begin() {
  tools.stop();
  const run = ++runs;
  const current = Object.fromEntries(Object.entries(ui).map(([step, show]) =>
    [step, (...args) => { if (run === runs) show(...args); }]));
  const fields = [...$("settings").querySelectorAll("input[data-flag]")]
    .map((field) => ({ tool: field.dataset.tool, flag: field.dataset.flag, value: field.value }));
  preflight({ name: design.name, bytes: design.bytes, fields }, { runTool: tools.runTool, ui: current });
}

// choose reads a file the visitor picked or dropped, then checks it; a drop
// or a cancelled chooser with no file does nothing.
async function choose(file) {
  if (!file) return;
  if (design) URL.revokeObjectURL(design.previewURL);
  design = { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()), previewURL: URL.createObjectURL(file) };
  ui.started(design.name, design.previewURL);
  begin();
}

input.addEventListener("change", () => {
  const [file] = input.files;
  input.value = ""; // so choosing the same file again checks it again
  choose(file);
});
drop.addEventListener("dragover", (event) => {
  event.preventDefault();
  drop.classList.add("dragging");
});
drop.addEventListener("dragleave", () => drop.classList.remove("dragging"));
drop.addEventListener("drop", (event) => {
  event.preventDefault();
  drop.classList.remove("dragging");
  choose(event.dataTransfer.files[0]);
});
$("settings").addEventListener("submit", (event) => {
  event.preventDefault();
  begin();
  // The status is at the top of the page, far from this button: show it.
  $("status").scrollIntoView({ block: "center" });
});
$("stop").addEventListener("click", () => tools.stop());
