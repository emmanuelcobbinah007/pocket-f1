import {
  AI_REACTION_MIN_MS,
  AI_REACTION_MAX_MS,
  JUMP_START_PENALTY_MS,
} from "./constants";
import { getDriverById, getReactionAdjustMs } from "./drivers";

/** @returns {import('./tires').TireCompound} */
export function rollAiTireCompound() {
  const r = Math.random();
  if (r < 0.25) return "soft";
  if (r < 0.65) return "medium";
  return "hard";
}

/**
 * @param {string} driverId
 * @returns {number} reaction ms
 */
export function rollAiReactionMs(driverId) {
  let ms =
    AI_REACTION_MIN_MS +
    Math.random() * (AI_REACTION_MAX_MS - AI_REACTION_MIN_MS);
  ms += getReactionAdjustMs(getDriverById(driverId));
  return Math.round(Math.max(AI_REACTION_MIN_MS, ms));
}

/**
 * @param {number} reactionMs
 * @param {boolean} jumpStart
 * @returns {number}
 */
export function applyJumpStartPenalty(reactionMs, jumpStart) {
  if (!jumpStart) return reactionMs;
  return reactionMs + JUMP_START_PENALTY_MS;
}

/** Random delay before lights out (ms) */
export function rollLightsOutDelay() {
  return 800 + Math.random() * 2200;
}

export const LIGHT_INTERVAL_MS = 700;
export const LIGHT_COUNT = 5;
