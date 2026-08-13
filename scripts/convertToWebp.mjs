/**
 * Convert PNG/JPEG assets under public/ to WebP.
 *
 * Usage:
 *   npm run convert-webp
 *   npm run convert-webp -- --delete-source   (remove originals after convert)
 *
 * GUI alternative: https://squoosh.app (drag folders, pick WebP, download)
 * CLI alternative: cwebp -q 90 input.png -o output.webp  (Google libwebp)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "../public");
const SOURCE_EXT = /\.(png|jpe?g)$/i;
const deleteSource = process.argv.includes("--delete-source");

/** @type {{ path: string, bytes: number }[]} */
const results = [];

async function convertFile(filePath) {
  const outPath = filePath.replace(SOURCE_EXT, ".webp");
  if (fs.existsSync(outPath)) {
    const srcStat = fs.statSync(filePath);
    const outStat = fs.statSync(outPath);
    if (outStat.mtimeMs >= srcStat.mtimeMs) {
      console.log("Skip (webp newer):", path.relative(PUBLIC, outPath));
      return;
    }
  }

  const before = fs.statSync(filePath).size;
  await sharp(filePath)
    .webp({ quality: 90, effort: 6, smartSubsample: true })
    .toFile(outPath);
  const after = fs.statSync(outPath).size;
  const rel = path.relative(PUBLIC, outPath);
  const saved = ((1 - after / before) * 100).toFixed(0);
  console.log(`✓ ${rel}  (${formatBytes(before)} → ${formatBytes(after)}, −${saved}%)`);
  results.push({ path: rel, bytes: after });

  if (deleteSource) {
    fs.unlinkSync(filePath);
    console.log(`  removed ${path.basename(filePath)}`);
  }
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

async function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
    } else if (SOURCE_EXT.test(entry.name)) {
      await convertFile(full);
    }
  }
}

console.log("Converting PNG/JPEG → WebP in public/\n");
await walk(PUBLIC);

if (!results.length) {
  console.log("\nNo PNG/JPEG files found. Drop assets in public/ first.");
} else {
  const total = results.reduce((sum, r) => sum + r.bytes, 0);
  console.log(`\nDone — ${results.length} file(s), ${formatBytes(total)} WebP total.`);
  if (!deleteSource) {
    console.log("Originals kept. Re-run with --delete-source to remove them.");
  }
}
