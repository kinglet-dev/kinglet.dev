// Turns laserlint's and laserfix's JSON reports (kinglet.report/v1) into
// what the page shows, in the same words the command line uses. The parity
// tests (tests/unit/report.test.mjs) hold the two to the same text.

// mm formats a length or coordinate to a tenth of a millimeter as Go's %.1f
// does: like toFixed, except that an exact half goes to the even tenth.
export function mm(value) {
  const quarters = value * 4; // exact: a power of two
  if (Number.isInteger(quarters) && quarters % 2 !== 0) {
    const tenths = Math.floor(value * 10);
    const even = ((tenths % 2) + 2) % 2 === 0 ? tenths : tenths + 1;
    return (even / 10).toFixed(1);
  }
  return value.toFixed(1);
}

const point = (p) => `(${mm(p.x_mm)}, ${mm(p.y_mm)})`;

// laserlint ------------------------------------------------------------

const words = { problem: "PROBLEM", warning: "WARNING", info: "INFO" };

// count says "1 problem", "2 warnings" or "3 info".
const count = (n, word) => `${n} ${n === 1 || word === "info" ? word : `${word}s`}`;

// list joins items as "a, b and c".
const list = (items) =>
  items.length === 1 ? items[0] : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

function verdict(findings) {
  const counts = ["problem", "warning", "info"]
    .map((severity) => [severity, findings.filter((f) => f.severity === severity).length])
    .filter(([, n]) => n > 0)
    .map(([severity, n]) => count(n, severity));
  if (findings.some((f) => f.severity === "problem")) return `Not ready to burn: ${list(counts)}.`;
  return counts.length > 0 ? `Ready to burn, with ${list(counts)}.` : "Ready to burn.";
}

// checkReport: { ready, verdict, items: [{ name, severity, word, message,
// where, fix }] }, one item per finding, or one "ok" item for a check that
// found nothing, in the order the checks ran.
export function checkReport(json) {
  const items = [];
  for (const check of json.checks) {
    const found = json.findings.filter((f) => f.check === check.id);
    if (found.length === 0) items.push({ name: check.name, severity: "ok", word: "OK" });
    for (const f of found) {
      const where = f.locations.length > 0 ? `${f.locations.map(point).join(", ")} mm from the top-left` : "";
      items.push({ name: check.name, severity: f.severity, word: words[f.severity], message: f.message, where, fix: f.fix });
    }
  }
  return { ready: !json.findings.some((f) => f.severity === "problem"), verdict: verdict(json.findings), items };
}

// outcomes says, for each item of a check, whether the repaired copy fixes
// it: "fixed" when checking the copy again finds nothing of that kind (the
// same check, with the same fix), "by hand" when it still does or there is
// no repaired copy (recheck is null), and null for information and checks
// that found nothing.
export function outcomes(check, recheck) {
  const remaining = new Set((recheck?.items ?? []).map((item) => `${item.name}\n${item.fix}`));
  return check.items.map((item) => {
    if (item.severity !== "problem" && item.severity !== "warning") return null;
    return recheck && !remaining.has(`${item.name}\n${item.fix}`) ? "fixed" : "by hand";
  });
}

// laserfix -------------------------------------------------------------

const plural = (n, one, many) => (n === 1 ? one : many);

// kinds words each kind of change, before and after it's made.
const kinds = {
  copy: ["Copies",
    (t) => `${t.n} ${plural(t.n, "shape", "shapes")}, ${mm(t.length)} mm of line burned twice → remove the later copy`,
    (t) => `${t.n} ${plural(t.n, "shape", "shapes")} removed, ${mm(t.length)} mm of line burned twice`],
  trim: ["Shared",
    (t) => `${t.n} ${plural(t.n, "shape", "shapes")}, ${mm(t.length)} mm of line burned twice → trim it from the later shape`,
    (t) => `${t.n} ${plural(t.n, "shape", "shapes")} trimmed, ${mm(t.length)} mm of line burned twice`],
  join: ["Split",
    (t) => `${t.n} ${plural(t.n, "outline", "outlines")} in ${t.pieces} pieces → join each into one path`,
    (t) => `${t.n} ${plural(t.n, "outline", "outlines")} joined from ${t.pieces} pieces`],
  close: ["Open",
    (t) => `${t.n} ${plural(t.n, "outline", "outlines")} with a small gap → close ${plural(t.n, "it", "them")}`,
    (t) => `${t.n} ${plural(t.n, "outline", "outlines")} closed`],
};

const labels = { junction: "Junction", gap: "Gap", stacked: "Overlap" };

// places lists up to five places, then says how many more.
function places(points) {
  const more = points.length - 5;
  return `at ${points.slice(0, 5).map(point).join(", ")}${more > 0 ? ` and ${more} more` : ""}`;
}

// changes groups the changes by kind, in the order kinds first appear.
function changes(all, done) {
  const byKind = new Map();
  for (const c of all) byKind.set(c.kind, [...(byKind.get(c.kind) ?? []), c]);
  return [...byKind].map(([kind, cs]) => {
    const total = {
      n: cs.length,
      length: cs.reduce((sum, c) => sum + c.length_mm, 0),
      pieces: cs.reduce((sum, c) => sum + c.pieces, 0), // only joins have pieces
    };
    const [label, would, made] = kinds[kind];
    return { label, text: (done ? made : would)(total), where: places(cs) };
  });
}

// repairReport: { written, heading, changes, left, measured, worse }: what
// would change (or changed, once written), what was left as it was, and,
// for a written copy, the measurements before and after.
export function repairReport(json) {
  const written = json.summary.written;
  const changed = json.changes.length > 0;
  const heading = !changed ? "Nothing to fix." : written ? "Changed" : "Would change";
  const left = json.findings.map((f) => ({
    label: labels[f.check], text: `${f.message} → ${f.fix}`, where: places(f.locations),
  }));
  const measured = written && changed ? {
    stacked: `${mm(json.before.stacked_mm)} mm → ${mm(json.after.stacked_mm)} mm`,
    crossings: `${json.before.crossings} → ${json.after.crossings}`,
  } : null;
  return { written, heading, changes: changes(json.changes, written), left, measured, worse: json.summary.worse };
}
