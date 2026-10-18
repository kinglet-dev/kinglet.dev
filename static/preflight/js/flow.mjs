// The steps Kinglet Preflight takes for one design: check it with laserlint,
// then repair it with laserfix, telling the page what happens at each step.
// Both ports are passed in: runTool(name, args, bytes) runs a tool (in the
// browser, in a worker) and resolves to { stdout, stderr, code }; ui is the
// page (see view.mjs).
import { checkReport, repairReport, outcomes } from "./report.mjs";
import { flags } from "./settings.mjs";

const decode = (bytes) => new TextDecoder().decode(bytes);

// explain turns a tool's error (exit status 2) into one sentence for the
// page: about the file, by name, or about a setting.
function explain(stderr, name) {
  const [first, second] = stderr.trim().split("\n");
  const message = first.replace(/^laser(lint|fix): /, "");
  if (second?.endsWith("--help for usage.")) return `Check the advanced settings: ${message}`;
  return message.replace(/^standard input: /, `${name}: `);
}

// preflight checks and repairs one design: { name, bytes, fields }, where
// fields are the advanced settings' form fields.
export async function preflight({ name, bytes, fields }, { runTool, ui }) {
  const args = flags(fields);
  try {
    ui.working("Checking");
    const lint = await runTool("laserlint", ["--json", ...args.laserlint, "-"], bytes);
    if (lint.code === 2) return ui.failed(explain(lint.stderr, name));
    const check = checkReport(JSON.parse(decode(lint.stdout)));
    ui.checked(check);

    ui.working("Repairing");
    const fix = await runTool("laserfix", ["--json", ...args.laserfix, "-", "-o", "-"], bytes);
    if (fix.code === 2) return ui.failed(explain(fix.stderr, name));
    const repair = repairReport(JSON.parse(fix.stderr));
    const copy = repair.changes.length > 0 ? fix.stdout : null;
    let recheck = null;
    if (copy) {
      // Check the repaired copy too, to tell which problems it fixes.
      ui.working("Checking the repaired copy");
      const again = await runTool("laserlint", ["--json", ...args.laserlint, "-"], copy);
      if (again.code === 2) return ui.failed(explain(again.stderr, "The repaired copy"));
      recheck = checkReport(JSON.parse(decode(again.stdout)));
    }
    ui.repaired(repair, copy, outcomes(check, recheck));
    ui.finished(check, repair);
  } catch (error) {
    if (error.stopped) return ui.stopped();
    ui.failed("The checker couldn't load. Check your internet connection, then choose the file again.");
  }
}
