// Runs the tools in a worker, one job at a time (Command pattern: a job is
// a message), and can stop a job by ending the worker; the next job starts
// a new one.

// runner returns { runTool(tool, args, bytes), stop() }; runTool resolves to
// the tool's { stdout, stderr, code }, and rejects with error.stopped set
// when stopped, or with the worker's error when a tool can't load.
export function runner(url = new URL("./worker.mjs", import.meta.url)) {
  let worker = null;
  let job = null;

  const settle = (outcome, value) => {
    const current = job;
    job = null;
    current?.[outcome](value);
  };

  const start = () => {
    worker = new Worker(url, { type: "module" });
    worker.onmessage = ({ data }) => (data.ok ? settle("resolve", data) : settle("reject", new Error(data.message)));
    worker.onerror = (event) => {
      event.preventDefault();
      worker.terminate();
      worker = null;
      settle("reject", new Error(event.message || "The worker couldn't start"));
    };
  };

  return {
    runTool(tool, args, stdin) {
      if (worker === null) start();
      return new Promise((resolve, reject) => {
        job = { resolve, reject };
        worker.postMessage({ tool, args, stdin });
      });
    },
    stop() {
      worker?.terminate();
      worker = null;
      settle("reject", Object.assign(new Error("stopped"), { stopped: true }));
    },
  };
}
