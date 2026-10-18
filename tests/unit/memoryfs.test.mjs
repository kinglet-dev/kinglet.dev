import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { memoryFS } from "../../static/preflight/js/run.mjs";

describe("memoryFS", () => {
  // call runs one file system call and returns what its callback got.
  const call = (method, ...args) => new Promise((resolve) => method(...args, (error, n) => resolve({ error, n })));

  it("reads standard input to its end, then reads nothing", async () => {
    // Arrange
    const fs = memoryFS(new Uint8Array([1, 2, 3]));
    const buffer = new Uint8Array(2);

    // Act
    const first = await call(fs.read, 0, buffer, 0, 2, null);
    const second = await call(fs.read, 0, buffer, 1, 1, null);
    const last = await call(fs.read, 0, buffer, 0, 2, null);

    // Assert
    assert.deepEqual([first.n, second.n, last.n], [2, 1, 0]);
    assert.deepEqual([...buffer], [1, 3]);
  });

  it("refuses to read anything but standard input", async () => {
    // Act
    const { error } = await call(memoryFS(new Uint8Array([1])).read, 3, new Uint8Array(1), 0, 1, null);

    // Assert
    assert.equal(error.code, "ENOSYS");
  });

  it("refuses to read standard input at a position", async () => {
    // Act
    const { error } = await call(memoryFS(new Uint8Array([1])).read, 0, new Uint8Array(1), 0, 1, 0);

    // Assert
    assert.equal(error.code, "ENOSYS");
  });

  it("keeps what is written to standard output and error apart", async () => {
    // Arrange
    const fs = memoryFS(new Uint8Array());

    // Act
    const out = await call(fs.write, 1, new Uint8Array([9, 8, 7]), 1, 2, null);
    await call(fs.write, 2, new Uint8Array([5]), 0, 1, null);

    // Assert
    assert.equal(out.n, 2);
    assert.deepEqual(fs.stdout.map((c) => [...c]), [[8, 7]]);
    assert.deepEqual(fs.stderr.map((c) => [...c]), [[5]]);
  });

  it("refuses to write anywhere but standard output and error", async () => {
    // Act
    const { error } = await call(memoryFS(new Uint8Array()).write, 3, new Uint8Array([1]), 0, 1, null);

    // Assert
    assert.equal(error.code, "ENOSYS");
  });

  it("refuses to write at a position", async () => {
    // Act
    const { error } = await call(memoryFS(new Uint8Array()).write, 1, new Uint8Array([1]), 0, 1, 4);

    // Assert
    assert.equal(error.code, "ENOSYS");
  });

  it("refuses every other file operation", async () => {
    // Arrange
    const fs = memoryFS(new Uint8Array());
    const others = ["open", "close", "fstat", "stat", "lstat", "fsync", "readdir", "mkdir", "unlink", "rename"];

    // Act
    const errors = await Promise.all(others.map((name) => call(fs[name], "x")));

    // Assert
    assert.deepEqual(errors.map(({ error }) => error.code), others.map(() => "ENOSYS"));
  });
});
