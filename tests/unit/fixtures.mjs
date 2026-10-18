// Designs that between them produce every kind of finding and change the
// page shows, for the parity tests.
import { svg, square, tooClose } from "./helpers.mjs";

const hair = (d, stroke = "#000") => `<path d="${d}" fill="none" stroke="${stroke}"/>`;
const box = (x, y, size) => `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="none" stroke="#000"/>`;
const big = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="60mm" height="60mm" viewBox="0 0 60 60">${body}</svg>`;

export const laserlintDesigns = {
  "a clean design": svg(box(2, 2, 16)),
  "lines too close": svg(tooClose),
  "crossing lines": svg(hair("M2 2 L18 18") + hair("M2 18 L18 2")),
  "a speck": svg(square + `<circle cx="15" cy="15" r="0.1" fill="#000"/>`),
  "a white background": svg(`<rect width="20" height="20" fill="#fff" stroke="#000"/>` + square),
  "an empty design": svg(""),
  "line art": svg(`<rect x="2" y="5" width="14" height="0.3" fill="#000"/><rect x="2" y="9" width="14" height="0.3" fill="#000"/>`),
  "a busy area": big(Array.from({ length: 40 }, (_, i) => hair(`M2 ${2 + i * 0.4} H40`)).join("")),
};

export const laserfixDesigns = {
  "nothing to fix": svg(square),
  "a copy": svg(square + square),
  "many copies": big(Array.from({ length: 7 }, (_, i) => box(2 + i * 7, 2, 5).repeat(2)).join("")),
  "a shared edge": svg(box(2, 2, 5) + box(7, 2, 5)),
  "a split outline": svg(hair("M2 2 H12") + hair("M12 2 V12") + hair("M12 12 H2") + hair("M2 12 V2")),
  "a small gap": svg(hair("M2 2 H12 V12 H2 V2.03")),
  "a junction": svg(hair("M5 5 H12") + hair("M5 5 V12") + hair("M5 5 L1 1")),
  "a wide gap": svg(hair("M2 2 H12 V12 H2 V2.5")),
  "different colors": svg(box(2, 2, 5) + `<rect x="7" y="2" width="5" height="5" fill="none" stroke="#f00"/>`),
};
