// Turns the page's advanced settings into each tool's command-line flags.
// The settings themselves (labels and defaults) are in
// data/preflight_settings.json, which Hugo renders into the form.

// flags takes the form's fields, [{ tool, flag, value }], and returns each
// tool's flags for the fields filled in; an empty field leaves the tool's
// own default.
export function flags(fields) {
  const args = { laserlint: [], laserfix: [] };
  for (const { tool, flag, value } of fields) {
    const v = value.trim();
    if (v !== "") args[tool].push(`--${flag}`, v);
  }
  return args;
}
