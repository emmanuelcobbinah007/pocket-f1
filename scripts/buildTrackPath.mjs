/**
 * Build & verify track waypoints against pocket_ring.webp
 * Run: node scripts/buildTrackPath.mjs
 */
import path from "path";
import { fileURLToPath } from "url";
import { loadRaster } from "./loadRaster.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { width, height, data } = await loadRaster(
  path.join(__dirname, "../public/tracks/pocket_ring.webp")
);

function isTrack(r, g, b) {
  if (g > 128 && b < 70) return false;
  if (r > 180 || g > 180) return false;
  if (r > 100 && g < 80) return false;
  if (g > 120 && b > 130) return false;
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

function edgeDist(x, y) {
  for (let d = 1; d <= 30; d++) {
    if (
      x - d < 0 ||
      x + d >= width ||
      y - d < 0 ||
      y + d >= height ||
      !grid[y][x - d] ||
      !grid[y][x + d] ||
      !grid[y - d][x] ||
      !grid[y + d][x]
    )
      return d;
  }
  return 30;
}

/** Snap to centerline near guess (handles figure-8 overlap via proximity bias). */
function snap(gx, gy, r = 55) {
  const ix = Math.round(gx);
  const iy = Math.round(gy);
  let best = null;
  let bestScore = -999;
  for (let y = iy - r; y <= iy + r; y++) {
    for (let x = ix - r; x <= ix + r; x++) {
      if (x < 0 || y < 0 || x >= width || y >= height || !grid[y][x]) continue;
      const score = edgeDist(x, y) * 2.2 - Math.hypot(x - ix, y - iy) * 0.35;
      if (score > bestScore) {
        bestScore = score;
        best = { x, y };
      }
    }
  }
  return best;
}

/** Horizontal straight at fixed y (for inner return lane). */
function straightH(y, xFrom, xTo, step = 100) {
  const pts = [];
  const dir = xFrom <= xTo ? 1 : -1;
  for (let x = xFrom; dir > 0 ? x <= xTo : x >= xTo; x += step * dir) {
    const s = snap(x, y, 18) ?? { x, y };
    pts.push({ x: s.x, y: s.y });
  }
  return pts;
}

/**
 * Clockwise lap from start/finish (1680, 1488).
 * East on main straight → right side → top loop → west along top →
 * bridge crossover → left/middle → BL hairpin → inner straight → merge to line.
 */
const ANCHOR_GUESSES = [
  [1680, 1488],
  [1800, 1488],
  [1920, 1488],
  [2020, 1440],
  [2120, 1340],
  [2216, 1182],
  [2250, 1100],
  [2308, 1008],
  [2272, 920],
  [2330, 682],
  [2360, 647],
  [2390, 578],
  [2380, 560],
  [2584, 459],
  [2355, 332],
  [2250, 240],
  [2050, 210],
  [1850, 220],
  [1650, 280],
  [1550, 400],
  [1753, 551],
  [1650, 600],
  [1466, 577],
  [1300, 550],
  [1186, 550],
  [1050, 650],
  [891, 716],
  [743, 850],
  [614, 942],
  [380, 994],
  [339, 1180],
  [320, 1280],
  [380, 1360],
  [550, 1378],
  [1500, 1380],
  [1578, 1423],
  [1680, 1488],
];

const anchors = ANCHOR_GUESSES.map(([x, y]) => snap(x, y, 45) ?? { x, y });

/** @type {{ x: number, y: number }[]} */
let points = [anchors[0]];

for (let i = 1; i < anchors.length; i++) {
  const a = anchors[i - 1];
  const b = anchors[i];
  const dist = Math.hypot(b.x - a.x, b.y - a.y);

  // Densify long straights only when nearly horizontal at inner lane
  if (dist > 120 && Math.abs(a.y - b.y) < 8 && Math.abs(a.y - 1378) < 12) {
    const inner = straightH(a.y, a.x, b.x, 90);
    points.push(...inner.slice(1));
    continue;
  }

  if (dist > 100 && Math.abs(a.y - b.y) < 8 && Math.abs(a.y - 1488) < 12) {
    const main = straightH(a.y, a.x, b.x, 80);
    points.push(...main.slice(1));
    continue;
  }

  if (Math.hypot(b.x - points.at(-1).x, b.y - points.at(-1).y) > 20) {
    points.push(b);
  }
}

function dedupe(pts, min = 24) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const last = out.at(-1);
    if (Math.hypot(pts[i].x - last.x, pts[i].y - last.y) >= min) out.push(pts[i]);
  }
  const end = pts.at(-1);
  if (out.at(-1).x !== end.x || out.at(-1).y !== end.y) out.push(end);
  return out;
}

const simplified = dedupe(points, 28);

let onTrack = 0;
for (const p of simplified) {
  if (grid[p.y]?.[p.x]) onTrack += 1;
}

let totalLen = 0;
for (let i = 1; i < simplified.length; i++) {
  totalLen += Math.hypot(
    simplified[i].x - simplified[i - 1].x,
    simplified[i].y - simplified[i - 1].y
  );
}

console.error(
  `Generated ${simplified.length} waypoints, ~${Math.round(totalLen)}px, onTrack ${onTrack}/${simplified.length}`
);

console.log("export const WAYPOINTS = [");
for (const p of simplified) {
  console.log(`  { x: ${p.x}, y: ${p.y} },`);
}
console.log("];");
