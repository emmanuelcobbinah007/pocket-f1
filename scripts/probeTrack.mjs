import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PNG } from "pngjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const png = PNG.sync.read(
  fs.readFileSync(path.join(__dirname, "../public/tracks/pocket_ring.png"))
);
const { width, data } = png;

function px(x, y) {
  const i = (width * y + x) << 2;
  return { r: data[i], g: data[i + 1], b: data[i + 2] };
}

// Around stuck point - fan of coords
for (let dy = -60; dy <= 60; dy += 20) {
  let row = `y=${1282 + dy}: `;
  for (let dx = -60; dx <= 60; dx += 20) {
    const x = 2009 + dx;
    const y = 1282 + dy;
    const c = px(x, y);
    row += `[${c.r},${c.g},${c.b}] `;
  }
  console.log(row);
}

// Scan for track-like pixels in radius
function isTrack(r, g, b) {
  if (g > 122 && b < 75) return false;
  if (r > 180 || g > 180) return false;
  if (r > 100 && g < 80) return false;
  if (b >= 85 && g >= 80 && g <= 118 && r <= 45) return true;
  if (b >= 70 && g >= 70 && g <= 110 && r <= 30) return true;
  return false;
}

console.log("\nTrack pixels near stuck:");
for (let y = 1200; y < 1380; y += 5) {
  for (let x = 1950; x < 2100; x += 5) {
    const c = px(x, y);
    if (isTrack(c.r, c.g, c.b)) console.log(x, y, c);
  }
}
