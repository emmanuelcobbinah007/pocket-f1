/** @typedef {'hard' | 'medium' | 'soft'} TireCompound */

/** @typedef {{ speedMultiplier: number, degradationPerLap: number, label: string, iconUrl: string }} TireStats */

/** @type {Record<TireCompound, TireStats>} */
export const TIRES = {
  hard: {
    label: "Hard",
    speedMultiplier: 0.92,
    degradationPerLap: 0.01,
    iconUrl: "/sprites/icons/tire-hard.png",
  },
  medium: {
    label: "Medium",
    speedMultiplier: 1.0,
    degradationPerLap: 0.02,
    iconUrl: "/sprites/icons/tire-medium.png",
  },
  soft: {
    label: "Soft",
    speedMultiplier: 1.08,
    degradationPerLap: 0.04,
    iconUrl: "/sprites/icons/tire-soft.png",
  },
};

export const WEAR_CLIFF_THRESHOLD = 0.75;
export const WEAR_CLIFF_PENALTY = 0.35;
/** Global tyre wear multiplier — 1.75 = 75% faster degradation. */
export const WEAR_RATE_MULTIPLIER = 1.75;

/**
 * @param {number} baseSpeed
 * @param {TireCompound} compound
 * @param {number} wear
 * @param {{ slowDegradation?: boolean }} [modifiers]
 */
export function getEffectiveSpeed(baseSpeed, compound, wear, modifiers = {}) {
  const tire = TIRES[compound];
  let wearFactor = 1 - wear;
  if (wear >= WEAR_CLIFF_THRESHOLD) {
    wearFactor -= WEAR_CLIFF_PENALTY;
  }
  return baseSpeed * tire.speedMultiplier * Math.max(0.1, wearFactor);
}

/** Wear added per lap — respects passive tire-management perk */
export function getWearPerLap(compound, modifiers = {}) {
  let rate = TIRES[compound].degradationPerLap * WEAR_RATE_MULTIPLIER;
  if (modifiers.slowDegradation) rate *= 0.75;
  return rate;
}
