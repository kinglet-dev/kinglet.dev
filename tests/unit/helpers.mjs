// Shared test setup: the release files Kinglet Preflight runs, as fetched
// and verified by scripts/fetch-preflight.sh into static/preflight/wasm/.
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const wasmDir = fileURLToPath(new URL("../../static/preflight/wasm/", import.meta.url));

// tool loads a tool's wasm_exec.js (it defines globalThis.Go) and compiles
// its .wasm, so a test can run it.
export async function tool(name) {
  await import(pathToFileURL(path.join(wasmDir, `${name}_wasm_exec.js`)).href);
  const module = await WebAssembly.compile(await readFile(path.join(wasmDir, `${name}.wasm`)));
  return { Go: globalThis.Go, module };
}

// svg is a 20 × 20 mm document where one user unit is one millimeter.
export const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="20mm" height="20mm" viewBox="0 0 20 20">${body}</svg>`;

// A 10 mm hairline square, and two 10 mm hairlines 0.2 mm apart.
export const square = `<rect x="2" y="2" width="10" height="10" fill="none" stroke="#000"/>`;
export const tooClose = `<g fill="none" stroke="#000"><path d="M2 5 H12"/><path d="M2 5.2 H12"/></g>`;

export const text = (bytes) => new TextDecoder().decode(bytes);
