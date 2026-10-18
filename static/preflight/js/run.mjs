// Runs a Go program built for WebAssembly (GOOS=js GOARCH=wasm) entirely in
// memory: the design goes in on standard input; standard output, standard
// error and the exit code come back. Nothing touches a disk or the network.
//
// Go's js port does its input and output through globalThis.fs, a Node.js-
// style file system object (Adapter pattern): memoryFS is one that offers
// only standard input, output and error, and refuses everything else, so a
// program can read only the design it was given.

// enosys is the error Go's js port maps to "not implemented on js".
function enosys() {
  const error = new Error("not implemented");
  error.code = "ENOSYS";
  return error;
}

// memoryFS returns a file system with the given bytes as standard input,
// collecting what the program writes to standard output and error.
export function memoryFS(stdin) {
  let offset = 0;
  const stdout = [];
  const stderr = [];
  const outputs = { 1: stdout, 2: stderr };
  const refuse = (...args) => args.at(-1)(enosys());
  return {
    stdout,
    stderr,
    constants: { O_WRONLY: -1, O_RDWR: -1, O_CREAT: -1, O_TRUNC: -1, O_APPEND: -1, O_EXCL: -1, O_DIRECTORY: -1 },
    read(fd, buffer, start, length, position, callback) {
      if (fd !== 0 || position !== null) return callback(enosys());
      const n = Math.min(length, stdin.length - offset);
      buffer.set(stdin.subarray(offset, offset + n), start);
      offset += n;
      callback(null, n);
    },
    write(fd, buffer, start, length, position, callback) {
      const output = outputs[fd];
      if (output === undefined || position !== null) return callback(enosys());
      output.push(buffer.slice(start, start + length));
      callback(null, length);
    },
    open: refuse, close: refuse, fstat: refuse, stat: refuse, lstat: refuse,
    fsync: refuse, readdir: refuse, mkdir: refuse, unlink: refuse, rename: refuse,
  };
}

// join puts the chunks a program wrote into one array of bytes.
function join(chunks) {
  const bytes = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let at = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, at);
    at += chunk.length;
  }
  return bytes;
}

// run runs a compiled program once, as `name args...` with stdin (a string
// or bytes) on standard input, and resolves to
// { stdout: Uint8Array, stderr: string, code: number }.
// Go is the class wasm_exec.js defines; module is a WebAssembly.Module, so
// a program compiled once can run many times. Runs share globalThis.fs, so
// run one at a time.
export async function run(Go, module, { args, stdin }) {
  const input = typeof stdin === "string" ? new TextEncoder().encode(stdin) : stdin;
  const fs = memoryFS(input);
  globalThis.fs = fs;
  const go = new Go();
  go.argv = ["program", ...args];
  go.env = {};
  let code = 0;
  go.exit = (status) => { code = status; };
  const instance = await WebAssembly.instantiate(module, go.importObject);
  await go.run(instance);
  // A program can exit with a Go timer still set; wasm_exec.js doesn't clear
  // it, and when it fires it throws "Go program has already exited".
  for (const timeout of go._scheduledTimeouts.values()) clearTimeout(timeout);
  return { stdout: join(fs.stdout), stderr: new TextDecoder().decode(join(fs.stderr)), code };
}
