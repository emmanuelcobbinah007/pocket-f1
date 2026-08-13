import sharp from "sharp";

/**
 * Load PNG/JPEG/WebP as raw RGBA for pixel scripts.
 * @param {string} filePath
 */
export async function loadRaster(filePath) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data };
}
