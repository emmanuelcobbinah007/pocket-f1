/** @typedef {'dnf' | 'spin' | 'pit' | 'pit_error' | 'safety_car' | 'overtake' | 'boost' | 'lead_change' | 'race_start' | 'spectator'} ViewerEvent */

export const VIEWER_BASE = 8420;
export const VIEWER_MIN = 5000;
export const VIEWER_MAX = 98000;

/** Periodic pulse every 2–4 s at 250 ms ticks. */
export const VIEWER_PULSE_MIN_TICKS = 8;
export const VIEWER_PULSE_MAX_TICKS = 16;

/** @type {Record<ViewerEvent, [number, number]>} min/max bump per event */
const EVENT_BUMPS = {
  race_start: [2000, 4500],
  safety_car: [3000, 6000],
  lead_change: [1500, 3500],
  overtake: [1000, 3000],
  dnf: [800, 2200],
  spin: [500, 1400],
  boost: [400, 1100],
  pit: [300, 900],
  pit_error: [600, 1600],
  spectator: [40, 120],
};

/**
 * @param {number} count
 * @param {ViewerEvent} event
 */
export function bumpViewers(count, event) {
  const range = EVENT_BUMPS[event];
  if (!range) return count;
  const delta = range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
  return clampViewers(count + delta);
}

/**
 * Quiet-lap pulse: random ±1k–3k swing.
 * @param {number} count
 */
export function pulseViewers(count) {
  const magnitude = 1000 + Math.floor(Math.random() * 2001);
  const sign = Math.random() < 0.5 ? -1 : 1;
  return clampViewers(count + sign * magnitude);
}

/**
 * @param {number} tick
 * @returns {number}
 */
export function nextViewerPulseTick(tick) {
  const span = VIEWER_PULSE_MAX_TICKS - VIEWER_PULSE_MIN_TICKS + 1;
  return tick + VIEWER_PULSE_MIN_TICKS + Math.floor(Math.random() * span);
}

/**
 * @param {number} count
 * @param {{ safetyCar?: boolean, drsChallenge?: unknown, activeFlash?: { type?: string } | null, finished?: boolean, tick?: number }} ctx
 */
export function decayViewers(count, ctx = {}) {
  let next = count;

  if (ctx.finished) {
    next -= 500 + Math.floor(Math.random() * 700);
  } else if (ctx.safetyCar) {
    next += 200 + Math.floor(Math.random() * 500);
  } else if (ctx.drsChallenge) {
    next += 150 + Math.floor(Math.random() * 400);
  } else if (ctx.activeFlash?.type === "overtake" || ctx.activeFlash?.type === "lead_change") {
    next += 120 + Math.floor(Math.random() * 350);
  } else {
    next -= 80 + Math.floor(Math.random() * 220);
  }

  if (ctx.tick != null && ctx.tick % 24 === 0) {
    next -= 300 + Math.floor(Math.random() * 500);
  }

  return clampViewers(next);
}

/** @param {number} count */
export function clampViewers(count) {
  return Math.max(VIEWER_MIN, Math.min(VIEWER_MAX, Math.round(count)));
}
