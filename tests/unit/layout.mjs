// Lays out what the page shows exactly as each command line prints it, so
// the parity tests can compare the two. Test code only: the page itself
// shows the same words as headed lists.
const indent = "         ";

export function laserlintText(report) {
  let out = "";
  for (const item of report.items) {
    if (item.severity === "ok") {
      out += `OK       ${item.name}\n`;
      continue;
    }
    out += `${item.word.padEnd(8)} ${item.name}\n${indent}${item.message}\n`;
    if (item.where) out += `${indent}Where: ${item.where}\n`;
    out += `${indent}Fix: ${item.fix}\n`;
  }
  return `${out}\n${report.verdict}\n`;
}

const line = (entry) => `  ${entry.label.padEnd(8)} ${entry.text}\n           ${entry.where}\n`;

export function laserfixText(report) {
  let out = `${report.heading}\n${report.changes.map(line).join("")}`;
  if (report.left.length > 0) out += `\nLeft as they are\n${report.left.map(line).join("")}`;
  if (report.measured) {
    out += `\nChecked again\n  Line burned twice   ${report.measured.stacked}\n  Crossings           ${report.measured.crossings}\n`;
  }
  return out;
}
