/**
 * Track registry — add circuits here (image + waypoints per track).
 * @typedef {{
 *   id: string,
 *   name: string,
 *   tagline: string,
 *   viewBox: { width: number, height: number },
 *   backgroundUrl: string,
 *   waypoints: { x: number, y: number }[],
 *   drsZone: { start: number, end: number },
 *   pitEntry: number,
 *   available?: boolean,
 * }} TrackDefinition
 */

/** @type {TrackDefinition} */
export const POCKET_RING = {
  id: "pocket-ring",
  name: "Pocket Ring",
  tagline: "Figure-9 chaos · bridge crossover · party favourite",
  viewBox: { width: 2656, height: 1600 },
  backgroundUrl: "/tracks/pocket_ring.webp",
  drsZone: { start: 0.0, end: 0.06 },
  pitEntry: 0.01,
  available: true,
  waypoints: [
    { x: 1762, y: 1367 },
    { x: 1914, y: 1371 },
    { x: 2078, y: 1369 },
    { x: 2228, y: 1345 },
    { x: 2314, y: 1253 },
    { x: 2316, y: 1119 },
    { x: 2202, y: 1065 },
    { x: 2074, y: 1063 },
    { x: 1904, y: 1069 },
    { x: 1742, y: 995 },
    { x: 1586, y: 901 },
    { x: 1428, y: 883 },
    { x: 1306, y: 923 },
    { x: 1192, y: 1021 },
    { x: 1104, y: 1051 },
    { x: 970, y: 1081 },
    { x: 822, y: 1053 },
    { x: 724, y: 953 },
    { x: 726, y: 793 },
    { x: 812, y: 679 },
    { x: 996, y: 639 },
    { x: 1198, y: 615 },
    { x: 1318, y: 531 },
    { x: 1426, y: 437 },
    { x: 1574, y: 347 },
    { x: 1742, y: 289 },
    { x: 1964, y: 237 },
    { x: 2088, y: 257 },
    { x: 2212, y: 325 },
    { x: 2266, y: 435 },
    { x: 2270, y: 563 },
    { x: 2200, y: 663 },
    { x: 2082, y: 707 },
    { x: 1924, y: 709 },
    { x: 1776, y: 647 },
    { x: 1664, y: 593 },
    { x: 1582, y: 483 },
    { x: 1474, y: 369 },
    { x: 1342, y: 333 },
    { x: 1238, y: 293 },
    { x: 1124, y: 253 },
    { x: 1006, y: 237 },
    { x: 870, y: 239 },
    { x: 710, y: 249 },
    { x: 564, y: 269 },
    { x: 442, y: 325 },
    { x: 354, y: 435 },
    { x: 306, y: 597 },
    { x: 326, y: 701 },
    { x: 326, y: 789 },
    { x: 326, y: 867 },
    { x: 306, y: 943 },
    { x: 290, y: 1051 },
    { x: 298, y: 1167 },
    { x: 348, y: 1283 },
    { x: 446, y: 1331 },
    { x: 602, y: 1341 },
    { x: 780, y: 1327 },
    { x: 948, y: 1327 },
    { x: 1080, y: 1355 },
    { x: 1242, y: 1371 },
    { x: 1400, y: 1369 },
    { x: 1520, y: 1365 },
    { x: 1666, y: 1361 },
    { x: 1760, y: 1363 },
    { x: 1762, y: 1367 },
  ],
};

/** @type {TrackDefinition} */
export const HARBOR_LOOP = {
  id: "harbor-loop",
  name: "Harbor Loop",
  tagline: "Coastal street circuit · docks · waterfront straight",
  viewBox: { width: 1615, height: 974 },
  backgroundUrl: "/tracks/harbor_loop.webp",
  drsZone: { start: 0.0, end: 0.06 },
  pitEntry: 0.01,
  available: true,
  waypoints: [
    { x: 722, y: 161 },
    { x: 595, y: 170 },
    { x: 485, y: 165 },
    { x: 399, y: 160 },
    { x: 343, y: 150 },
    { x: 305, y: 155 },
    { x: 235, y: 176 },
    { x: 192, y: 257 },
    { x: 203, y: 345 },
    { x: 210, y: 424 },
    { x: 208, y: 505 },
    { x: 184, y: 563 },
    { x: 171, y: 687 },
    { x: 217, y: 756 },
    { x: 330, y: 760 },
    { x: 425, y: 742 },
    { x: 524, y: 738 },
    { x: 580, y: 667 },
    { x: 624, y: 577 },
    { x: 692, y: 526 },
    { x: 757, y: 515 },
    { x: 804, y: 467 },
    { x: 824, y: 383 },
    { x: 890, y: 327 },
    { x: 963, y: 336 },
    { x: 1026, y: 370 },
    { x: 1089, y: 399 },
    { x: 1155, y: 420 },
    { x: 1237, y: 420 },
    { x: 1330, y: 409 },
    { x: 1377, y: 356 },
    { x: 1416, y: 309 },
    { x: 1412, y: 214 },
    { x: 1364, y: 169 },
    { x: 1317, y: 163 },
    { x: 1277, y: 172 },
    { x: 1210, y: 177 },
    { x: 1156, y: 168 },
    { x: 1075, y: 152 },
    { x: 997, y: 148 },
    { x: 909, y: 155 },
    { x: 819, y: 156 },
    { x: 728, y: 163 },
  ],
};

/** @type {TrackDefinition[]} */
export const TRACKS = [POCKET_RING, HARBOR_LOOP];

export const DEFAULT_TRACK_ID = POCKET_RING.id;

/** Harbor Loop @ 1615px — carSize 150 looks right on track. */
const CAR_SIZE_REF_WIDTH = 1615;
const CAR_SIZE_REF = 150;

/** @param {TrackDefinition} track */
export function getTrackCarSize(track) {
  return Math.round(CAR_SIZE_REF * (track.viewBox.width / CAR_SIZE_REF_WIDTH));
}

/** @param {string} id */
export function getTrack(id) {
  return TRACKS.find((t) => t.id === id) ?? POCKET_RING;
}

/** @returns {TrackDefinition[]} */
export function getAvailableTracks() {
  return TRACKS.filter((t) => t.available !== false);
}
