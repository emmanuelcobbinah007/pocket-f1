/**
 * Traces track centerline from pocket_ring.webp.
 * Run: node scripts/traceTrack.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadRaster } from "./loadRaster.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { width, height, data } = await loadRaster(
  path.join(__dirname, "../public/tracks/pocket_ring.webp")
);

/** Both asphalt teals + lane surface in pocket_ring.webp */
function isTrack(r, g, b) {
  if (g > 128 && b < 70) return false;
  if (r > 180 || g > 180) return false;
  if (r > 100 && g < 80) return false;
  if (g > 120 && b > 130) return false; // purple runoff
  if (b >= 85 && g >= 80 && g <= 118 && r <= 45) return true;
  if (b >= 70 && g >= 70 && g <= 110 && r <= 30) return true;
  if (g >= 104 && g <= 112 && b >= 118 && b <= 128 && r >= 14 && r <= 40)
    return true;
  return false;
}

const grid = Array.from({ length: height }, () => Array(width).fill(false));
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (width * y + x) << 2;
    grid[y][x] = isTrack(data[i], data[i + 1], data[i + 2]);
  }
}

function onTrack(x, y) {
  const ix = Math.round(x);
  const iy = Math.round(y);
  return ix >= 0 && ix < width && iy >= 0 && iy < height && grid[iy][ix];
}

function centerScore(x, y, angle) {
  if (!onTrack(x, y)) return -999;
  const px = -Math.sin(angle);
  const py = Math.cos(angle);
  let l = 0, r = 0;
  for (let w = 1; w <= 50; w++) {
    if (onTrack(x + px * w, y + py * w)) l++;
    else break;
  }
  for (let w = 1; w <= 50; w++) {
    if (onTrack(x - px * w, y - py * w)) r++;
    else break;
  }
  return Math.min(l, r) - Math.abs(l - r) * 0.35;
}

function cellKey(x, y) {
  return `${Math.round(x / 6)},${Math.round(y / 6)}`;
}

const STEP = 32;
const START = { x: 1780, y: 1470 };
const visited = new Set([cellKey(START.x, START.y)]);
const points = [{ ...START }];
let cx = START.x;
let cy = START.y;

for (let iter = 0; iter < 1200; iter++) {
  let angle = 0;
  if (points.length >= 2) {
    const p = points[points.length - 2];
    const c = points[points.length - 1];
    angle = Math.atan2(c.y - p.y, c.x - p.x);
  }

  let best = null;
  let bestScore = -999;

  for (let da = -0.75; da <= 0.75; da += 0.03) {
    const a = angle + da;
    for (let d = STEP * 0.55; d <= STEP * 1.45; d += 2) {
      const tx = cx + Math.cos(a) * d;
      const ty = cy + Math.sin(a) * d;
      const k = cellKey(tx, ty);
      if (visited.has(k)) continue;
      if (!onTrack(tx, ty)) continue;
      const score =
        centerScore(tx, ty, a) -
        Math.abs(d - STEP) * 0.04 -
        Math.abs(da) * 0.12;
      if (score > bestScore) {
        bestScore = score;
        best = { x: Math.round(tx), y: Math.round(ty), k };
      }
    }
  }

  // Recovery: pick nearest unvisited track pixel ahead-ish
  if (!best || bestScore < 0) {
    for (let r = STEP; r < STEP * 4; r += 4) {
      for (let a = 0; a < Math.PI * 2; a += 0.2) {
        const tx = cx + Math.cos(a) * r;
        const ty = cy + Math.sin(a) * r;
        const k = cellKey(tx, ty);
        if (visited.has(k) || !onTrack(tx, ty)) continue;
        best = { x: Math.round(tx), y: Math.round(ty), k };
        bestScore = 1;
        break;
      }
      if (best) break;
    }
  }

  if (!best) {
    console.error("stuck", cx, cy, iter);
    break;
  }

  if (points.length > 100) {
    if (Math.hypot(best.x - START.x, best.y - START.y) < 50) {
      points.push({ x: START.x, y: START.y });
      break;
    }
  }

  visited.add(best.k);
  const last = points[points.length - 1];
  if (Math.hypot(best.x - last.x, best.y - last.y) > 10) {
    points.push({ x: best.x, y: best.y });
  }
  cx = best.x;
  cy = best.y;
}

function simplify(pts, minDist = 42) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const last = out[out.length - 1];
    if (Math.hypot(pts[i].x - last.x, pts[i].y - last.y) >= minDist) {
      out.push(pts[i]);
    }
  }
  const end = pts[pts.length - 1];
  const last = out[out.length - 1];
  if (last.x !== end.x || last.y !== end.y) out.push(end);
  return out;
}

const simplified = simplify(points);
const closed =
  simplified.at(-1).x === START.x && simplified.at(-1).y === START.y;
console.error(
  `Traced ${points.length} -> ${simplified.length}, closed=${closed}, length~${Math.round(simplified.reduce((s, p, i, a) => i ? s + Math.hypot(p.x - a[i - 1].x, p.y - a[i - 1].y) : 0, 0))}px`
);

const svg = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`,
  `<path d="M ${simplified.map((p) => `${p.x} ${p.y}`).join(" L ")}" fill="none" stroke="#ff3366" stroke-width="10" opacity="0.9"/>`,
  ...simplified.map(
    (p, i) =>
      `<circle cx="${p.x}" cy="${p.y}" r="${i === 0 ? 14 : 8}" fill="${i === 0 ? "#0f0" : "#ff0"}"/>`
  ),
  "</svg>",
];
fs.writeFileSync(
  path.join(__dirname, "../public/tracks/pocket_ring_debug.svg"),
  svg.join("\n")
);

console.log("export const WAYPOINTS = [");
for (const p of simplified) {
  console.log(`  { x: ${p.x}, y: ${p.y} },`);
}
console.log("];");
