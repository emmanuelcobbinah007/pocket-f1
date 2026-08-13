import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadRaster } from "./loadRaster.mjs";
import { WAYPOINTS, getPositionOnTrack } from "../lib/trackPath.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { width, height, data } = await loadRaster(
  path.join(__dirname, "../public/tracks/pocket_ring.webp")
);

function isTrack(r, g, b) {
  if (g > 128 && b < 70) return false;
  if (b >= 85 && g >= 80 && g <= 118 && r <= 45) return true;
  if (b >= 70 && g >= 70 && g <= 110 && r <= 30) return true;
  return false;
}

function onTrack(x, y) {
  const i = (Math.round(y) * width + Math.round(x)) << 2;
  return isTrack(data[i], data[i + 1], data[i + 2]);
}

console.log("Grid slots:");
for (let g = 0; g < 4; g++) {
  const p = -g * 0.015;
  const { x, y } = getPositionOnTrack(p);
  console.log(
    `  P${g + 1} p=${p} -> (${Math.round(x)}, ${Math.round(y)}) ${onTrack(x, y) ? "track" : "OFF"}`
  );
}

const d = WAYPOINTS.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
const dots = WAYPOINTS.map(
  (p, i) =>
    `<circle cx="${p.x}" cy="${p.y}" r="${i === 0 ? 10 : 5}" fill="${i === 0 ? "#0f0" : "#ff0"}"/>`
).join("\n");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <image href="pocket_ring.webp" width="${width}" height="${height}"/>
  <path d="${d}" fill="none" stroke="#ff3366" stroke-width="10" opacity="0.85"/>
  ${dots}
</svg>`;

fs.writeFileSync(
  path.join(__dirname, "../public/tracks/pocket_ring_debug.svg"),
  svg
);
console.log("Wrote public/tracks/pocket_ring_debug.svg");
