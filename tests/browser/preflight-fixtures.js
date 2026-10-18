// Designs for the Kinglet Preflight browser tests.
const svg = (body, size = 20) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}mm" height="${size}mm" viewBox="0 0 ${size} ${size}">${body}</svg>`;
const square = `<rect x="2" y="2" width="10" height="10" fill="none" stroke="#000"/>`;
const tooClose = `<g fill="none" stroke="#000"><path d="M2 5 H12"/><path d="M2 5.2 H12"/></g>`;

// busy has thousands of small shapes, each pasted twice: slow to repair.
function busy() {
  const shapes = [];
  for (let x = 0; x < 60; x++) {
    for (let y = 0; y < 60; y++) {
      const ring = `<circle cx="${2 + x * 4.9}" cy="${2 + y * 4.9}" r="1.5" fill="none" stroke="#000"/>`;
      shapes.push(ring, ring);
    }
  }
  return svg(shapes.join(""), 300);
}

// file is a design as Playwright's setInputFiles takes it.
const file = (name, content) => ({ name, mimeType: "image/svg+xml", buffer: Buffer.from(content) });

module.exports = { svg, square, tooClose, busy, file };
