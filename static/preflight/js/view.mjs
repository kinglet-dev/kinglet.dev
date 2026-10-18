// Kinglet Preflight's page: shows what flow.mjs tells it (the ui port).
// Every text from a report or a file goes in as text, never as HTML.

const severities = { problem: "Problem", warning: "Warning", info: "Info", ok: "OK" };
const outcomeWords = { fixed: "Fixed in the repaired copy", "by hand": "Fix by hand" };

// What the Repair section says when it changes nothing although the check
// found something to fix.
const nothingAutomatic = "Nothing to repair automatically: automatic repair removes line that burns twice and "
  + "joins outlines left in pieces or with a tiny gap, and this design has none of these. "
  + "Each item marked “Fix by hand” above says how to fix it.";

// needsFixing: the check found a problem or a warning.
const needsFixing = (check) => check.items.some((f) => f.severity === "problem" || f.severity === "warning");

// element makes an element with a class and text.
function element(name, className, text) {
  const el = document.createElement(name);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

// item is one list item: its heading (a severity word, if any, and a
// name), then lines of detail; empty lines are left out.
function item(severity, name, lines) {
  const li = element("li");
  const head = element("p", "finding-head");
  if (severity) head.append(element("span", `severity ${severity}`, severities[severity]), " ");
  head.append(element("strong", "", name));
  li.append(head, ...lines.filter(([, text]) => text).map(([className, text]) => element("p", className, text)));
  return li;
}

// view returns the ui port for the page in root (the document).
export function view(root) {
  const $ = (name) => root.querySelector(`[data-${name}]`);
  const show = (name, shown) => { $(name).hidden = !shown; };
  let ticking = null;
  let downloadURL = null;
  let firstRun = true;
  let lastCheck = null;

  const idle = (message) => {
    clearInterval(ticking);
    $("elapsed").textContent = "";
    show("stop", false);
    $("status").textContent = message;
  };

  return {
    // started: a new design, with its file name and a URL that shows it.
    started(name, previewURL) {
      $("error").textContent = "";
      show("results", false);
      $("preview").src = previewURL;
      $("preview").alt = `The design in ${name}`;
      $("caption").textContent = name;
      $("again").disabled = false;
    },

    working(step) {
      clearInterval(ticking);
      const began = Date.now();
      $("elapsed").textContent = "";
      ticking = setInterval(() => { $("elapsed").textContent = `${Math.floor((Date.now() - began) / 1000)} s`; }, 1000);
      const loading = firstRun && step === "Checking" ? " The first time, this loads the tools: about 3 MB." : "";
      $("status").textContent = `${step}…${loading}`;
      show("stop", true);
    },

    checked(check) {
      firstRun = false;
      lastCheck = check;
      $("verdict").textContent = check.verdict;
      $("findings").replaceChildren(...check.items.map((f) => item(f.severity, f.name,
        [["", f.message], ["where", f.where && `Where: ${f.where}`], ["fix", f.fix && `Fix: ${f.fix}`]])));
      $("repair-summary").textContent = "";
      $("changes").replaceChildren();
      show("left-area", false);
      show("measured-area", false);
      show("worse", false);
      show("download", false);
      show("results", true);
    },

    // repaired: what laserfix changed or left, the copy (or null), and for
    // each check item whether the copy fixes it (see report.mjs outcomes).
    repaired(repair, copy, outcomes) {
      const detail = (entry) => item(null, entry.label, [["", entry.text], ["where", entry.where]]);
      [...$("findings").children].forEach((li, i) => {
        if (outcomes[i]) li.firstChild.append(" · ", element("span", `outcome ${outcomes[i].replace(" ", "-")}`, outcomeWords[outcomes[i]]));
      });
      const summary = needsFixing(lastCheck) ? nothingAutomatic : repair.heading;
      $("repair-summary").textContent = copy ? "The repaired copy has these changes:" : summary;
      $("changes").replaceChildren(...repair.changes.map(detail));
      $("left").replaceChildren(...repair.left.map(detail));
      show("left-area", repair.left.length > 0);
      if (repair.measured) {
        $("measured").replaceChildren(
          element("dt", "", "Line burned twice"), element("dd", "", repair.measured.stacked),
          element("dt", "", "Crossings"), element("dd", "", repair.measured.crossings));
      }
      show("measured-area", repair.measured !== null);
      show("worse", repair.worse);
      URL.revokeObjectURL(downloadURL);
      downloadURL = copy && URL.createObjectURL(new Blob([copy], { type: "image/svg+xml" }));
      const link = $("download");
      link.href = downloadURL ?? "";
      link.download = `${$("caption").textContent.replace(/\.svg$/i, "")}-fixed.svg`;
      show("download", copy !== null);
    },

    finished(check, repair) {
      const next = repair.changes.length > 0 ? "A repaired copy is ready to download."
        : needsFixing(check) ? "Nothing to repair automatically." : "Nothing to fix.";
      idle(`${check.verdict} ${next}`);
    },

    failed(message) {
      idle("");
      $("error").textContent = message;
    },

    stopped() {
      idle("Stopped. Choose a design to start again.");
    },
  };
}
