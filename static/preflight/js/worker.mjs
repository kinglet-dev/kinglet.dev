// Kinglet Preflight's worker: runs laserlint and laserfix away from the
// page, so the page stays responsive however long a design takes. This is
// the worker's composition root: it only loads each tool once and wires
// messages to run.mjs (covered by the browser tests).
import { run } from "./run.mjs";

const tools = {};

// load imports a tool's wasm_exec.js (it defines globalThis.Go) and
// compiles its .wasm, once per tool.
function load(name) {
  tools[name] ??= (async () => {
    await import(`../wasm/${name}_wasm_exec.js`);
    const module = await WebAssembly.compileStreaming(fetch(`../wasm/${name}.wasm`));
    return { Go: globalThis.Go, module };
  })();
  return tools[name];
}

// A message is one job, { tool, args, stdin }; the reply is its result.
self.onmessage = async ({ data: { tool, args, stdin } }) => {
  try {
    const { Go, module } = await load(tool);
    const result = await run(Go, module, { args, stdin });
    self.postMessage({ ok: true, ...result }, [result.stdout.buffer]);
  } catch (error) {
    delete tools[tool];
    self.postMessage({ ok: false, message: String(error) });
  }
};
