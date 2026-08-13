/**
 * Track path math — works with any track from lib/tracks.js.
 * Tune paths via /dev/track or edit waypoints in tracks.js.
 */

import { DEFAULT_TRACK_ID, getTrack, POCKET_RING } from "./tracks";

export const GRID_SLOT_GAP = 0.012;

/** @deprecated use getTrack() — kept for dev tools */
export const TRACK = POCKET_RING;

/** @deprecated use POCKET_RING.waypoints */
export const WAYPOINTS = POCKET_RING.waypoints;

/** @param {{ x: number, y: number }[]} points */
export function buildSvgPath(points) {
  if (points.length < 2) return "";
  const [first, ...rest] = points;
  let d = `M ${first.x} ${first.y}`;
  for (const curr of rest) {
    d += ` L ${curr.x} ${curr.y}`;
  }
  return d;
}

/** Progress on start/finish straight for grid slot (0 = pole). */
export function getGridProgress(slotIndex) {
  return -slotIndex * GRID_SLOT_GAP;
}

/**
 * @param {{ a: {x:number,y:number}, b: {x:number,y:number} }} seg
 * @param {number} t 0–1 along segment
 * @param {boolean} reverse
 */
function pointOnSegment(seg, t, reverse = false) {
  const local = reverse ? 1 - t : t;
  const x = seg.a.x + (seg.b.x - seg.a.x) * local;
  const y = seg.a.y + (seg.b.y - seg.a.y) * local;
  let angle =
    (Math.atan2(seg.b.y - seg.a.y, seg.b.x - seg.a.x) * 180) / Math.PI + 90;
  if (reverse) angle += 180;
  return { x, y, angle };
}

/**
 * @param {import('./tracks').TrackDefinition} track
 */
export function createTrackRuntime(track) {
  const waypoints = track.waypoints;
  const segments = [];
  let totalLength = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segments.push({ a, b, len, startDist: totalLength, index: i });
    totalLength += len;
  }

  function positionBeforeStart(dist) {
    let remaining = dist;

    for (let i = segments.length - 1; i >= 0 && remaining > 0; i--) {
      const seg = segments[i];
      if (remaining <= seg.len) {
        return pointOnSegment(seg, 1 - remaining / seg.len);
      }
      remaining -= seg.len;
    }

    const start = waypoints[0];
    return { x: start.x, y: start.y, angle: 90 };
  }

  /** @param {number} progress */
  function getPositionOnTrack(progress) {
    if (progress < 0) {
      return positionBeforeStart(-progress * totalLength);
    }

    const t = progress % 1;
    const targetDist = t * totalLength;
    const lookAhead = Math.min(28, totalLength * 0.004);

    let x = 0;
    let y = 0;
    let found = false;

    for (const seg of segments) {
      if (targetDist <= seg.startDist + seg.len) {
        const local = (targetDist - seg.startDist) / seg.len;
        const pos = pointOnSegment(seg, local);
        x = pos.x;
        y = pos.y;
        found = true;
        break;
      }
    }

    if (!found) {
      const last = waypoints[waypoints.length - 1];
      return { x: last.x, y: last.y, angle: 0 };
    }

    const aheadDist = (targetDist + lookAhead) % totalLength;
    let ax = x;
    let ay = y;
    for (const seg of segments) {
      if (aheadDist <= seg.startDist + seg.len) {
        const local = (aheadDist - seg.startDist) / seg.len;
        const pos = pointOnSegment(seg, local);
        ax = pos.x;
        ay = pos.y;
        break;
      }
    }

    const angle =
      (Math.atan2(ay - y, ax - x) * 180) / Math.PI + 90;

    return { x, y, angle };
  }

  /** @param {number} progress */
  function isInDrsZone(progress) {
    const t = progress < 0 ? progress : progress % 1;
    if (t < 0) return Math.abs(t) <= track.drsZone.end;
    return t >= track.drsZone.start && t <= track.drsZone.end;
  }

  return {
    track,
    svgPath: buildSvgPath(waypoints),
    totalLength,
    getPositionOnTrack,
    isInDrsZone,
  };
}

/** @type {Map<string, ReturnType<typeof createTrackRuntime>>} */
const runtimeCache = new Map();

/** @param {import('./tracks').TrackDefinition | string} trackOrId */
export function getTrackRuntime(trackOrId) {
  const track =
    typeof trackOrId === "string" ? getTrack(trackOrId) : trackOrId;
  let runtime = runtimeCache.get(track.id);
  if (!runtime) {
    runtime = createTrackRuntime(track);
    runtimeCache.set(track.id, runtime);
  }
  return runtime;
}

const defaultRuntime = getTrackRuntime(DEFAULT_TRACK_ID);

/** @deprecated use getTrackRuntime(trackId).getPositionOnTrack */
export function getPositionOnTrack(progress) {
  return defaultRuntime.getPositionOnTrack(progress);
}

/** @deprecated */
export function isInDrsZone(progress) {
  return defaultRuntime.isInDrsZone(progress);
}

/** @deprecated */
export const TRACK_SVG_PATH = defaultRuntime.svgPath;

/** @deprecated */
export const TRACK_TOTAL_LENGTH = defaultRuntime.totalLength;
