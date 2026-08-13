import {
  PIT_STOP_PENALTY,
  PIT_ERROR_EXTRA_PENALTY,
  PERFECT_PIT_PENALTY_MULT,
  SPIN_TICKS,
  BOOST_TICKS,
  EVENT_FLASH_TICKS,
  getMaxPitStops,
} from "./constants";
import { getDriverById } from "./drivers";
import { createChatMessage } from "./liveChat";
import { createEventFlash } from "./gifs";
import { rollAiTireCompound } from "./startSequence";
import { WEAR_CLIFF_THRESHOLD } from "./tires";

/** @typedef {{ type: string, gif: string, driverId?: string, untilTick: number }} RaceEventFlash */

/**
 * @param {string} type
 * @param {string} driverId
 * @param {number} currentTick
 * @returns {RaceEventFlash}
 */
function makeFlash(type, driverId, currentTick) {
  return createEventFlash(type, driverId, currentTick + EVENT_FLASH_TICKS);
}

/**
 * @param {string} driverId
 * @param {number} currentTick
 * @param {number} [spinTicks]
 */
function makeSpin(driverId, currentTick, spinTicks = SPIN_TICKS) {
  return {
    spinUntil: currentTick + spinTicks,
    flash: makeFlash("spin", driverId, currentTick),
    chat: createChatMessage("spin", driverId),
  };
}

/**
 * @param {string} driverId
 * @param {number} currentTick
 * @param {number} [boostTicks]
 */
function makeBoost(driverId, currentTick, boostTicks = BOOST_TICKS) {
  return {
    boostUntil: currentTick + boostTicks,
    flash: makeFlash("boost", driverId, currentTick),
    chat: createChatMessage("boost", driverId),
  };
}

/**
 * Per-lap perk/jerk rolls — called once when lap increments.
 * @returns {{ dnf?: boolean, spinUntil?: number, boostUntil?: number, flash: RaceEventFlash | null, chat: ReturnType<typeof createChatMessage> | null }}
 */
export function rollLapEvents(driver, driverId, currentTick) {
  const preset = getDriverById(driverId);
  if (!preset) return { flash: null, chat: null };

  if (preset.jerk.type === "dnf" && Math.random() < 0.05) {
    return {
      dnf: true,
      flash: makeFlash("dnf", driverId, currentTick),
      chat: createChatMessage("dnf", driverId),
    };
  }

  if (preset.jerk.type === "duct_tape_dnf" && Math.random() < 0.08) {
    return {
      dnf: true,
      flash: makeFlash("dnf", driverId, currentTick),
      chat: createChatMessage("dnf", driverId),
    };
  }

  if (preset.jerk.type === "spin" && Math.random() < 0.28) {
    return makeSpin(driverId, currentTick);
  }

  if (preset.jerk.type === "heavy_hands" && Math.random() < 0.24) {
    return makeSpin(driverId, currentTick);
  }

  if (preset.perk.type === "speed_boost" && Math.random() < 0.32) {
    return makeBoost(driverId, currentTick);
  }

  const u = Math.random();
  if (u < 0.22) return makeSpin(driverId, currentTick);
  if (u < 0.4) return makeBoost(driverId, currentTick);

  return { flash: null, chat: null };
}

/**
 * Mid-race surprise — fired periodically between lap lines.
 * @returns {{ spinUntil?: number, boostUntil?: number, flash: RaceEventFlash | null, chat: ReturnType<typeof createChatMessage> | null }}
 */
export function rollSurpriseEvent(driverId, currentTick) {
  const roll = Math.random();
  if (roll < 0.5) return makeSpin(driverId, currentTick, SPIN_TICKS - 1);
  if (roll < 0.88) return makeBoost(driverId, currentTick, BOOST_TICKS - 1);
  return { flash: null, chat: null };
}

/**
 * @param {import('./gameState').RaceDriver} driver
 * @param {import('./tires').TireCompound} compound
 * @param {number} currentTick
 * @param {string} driverId
 */
export function applyPitStop(driver, compound, currentTick, driverId) {
  const preset = getDriverById(driverId);
  let penalty = PIT_STOP_PENALTY;
  let pitError = false;

  if (preset?.jerk.type === "pit_error" && Math.random() < 0.35) {
    penalty += PIT_ERROR_EXTRA_PENALTY;
    pitError = true;
  }

  if (preset?.perk.type === "perfect_pit_read") {
    penalty *= PERFECT_PIT_PENALTY_MULT;
  }

  driver.tire = compound;
  driver.wear = 0;
  driver.pitting = true;
  driver.pitUntil = currentTick + 5;
  driver.position = Math.max(-0.5, driver.position - penalty);
  driver.pitCount = (driver.pitCount ?? 0) + 1;

  const eventType = pitError ? "pit_error" : "pit";
  return {
    flash: makeFlash(eventType, driverId, currentTick),
    chat: createChatMessage(eventType, driverId),
  };
}

/** @param {import('./gameState').RaceDriver[]} drivers @param {number} totalLaps */
export function bunchForSafetyCar(drivers, totalLaps) {
  const active = drivers.filter((d) => !d.dnf && d.lap < totalLaps);
  if (!active.length) return;

  const leader = active.reduce((a, b) =>
    a.lap + a.position >= b.lap + b.position ? a : b
  );
  const leaderTotal = leader.lap + leader.position;

  active
    .sort((a, b) => b.lap + b.position - (a.lap + a.position))
    .forEach((d, i) => {
      const total = leaderTotal - i * 0.012;
      d.lap = Math.max(0, Math.floor(total));
      d.position = total - d.lap;
    });
}

/**
 * Schedule the next AI pit window based on remaining race distance.
 * @param {number} totalLaps
 * @param {number} fromLap
 * @param {number} pitCount
 * @param {number} maxPits
 */
export function rollAiPitLap(totalLaps, fromLap, pitCount, maxPits) {
  if (pitCount >= maxPits) return null;

  const remaining = totalLaps - fromLap;
  if (remaining < 2) return null;

  const stopsLeft = maxPits - pitCount;
  const minLap = fromLap + Math.max(1, Math.floor(remaining / (stopsLeft + 1)));
  const maxLap = fromLap + Math.max(minLap - fromLap, Math.floor((remaining * 0.75) / stopsLeft));

  return minLap + Math.floor(Math.random() * (maxLap - minLap + 1));
}

/** @param {import('./gameState').RaceDriver} driver @param {number} totalLaps @param {number} maxPits */
export function scheduleNextAiPit(driver, totalLaps, maxPits) {
  if (!driver.isAi) {
    driver.pitLapTarget = null;
    return;
  }
  driver.pitLapTarget = rollAiPitLap(
    totalLaps,
    driver.lap,
    driver.pitCount ?? 0,
    maxPits
  );
}

/** @param {import('./gameState').RaceDriver} driver @param {number} totalLaps @param {number} maxPits */
export function shouldAiPit(driver, totalLaps, maxPits) {
  if (!driver.isAi || driver.dnf || driver.lap >= totalLaps) return false;
  if ((driver.pitCount ?? 0) >= maxPits) return false;
  if (driver.pitting || driver.pitUntil != null) return false;

  const wear = driver.wear ?? 0;
  if (wear >= 0.88) return true;
  if (wear >= WEAR_CLIFF_THRESHOLD && (driver.pitCount ?? 0) < maxPits) return true;

  if (driver.pitLapTarget == null) return false;
  if (driver.lap < driver.pitLapTarget) return false;

  return wear >= 0.28;
}

/** @param {import('./gameState').RaceDriver} driver @param {number} totalLaps @param {number} maxPits */
export function shouldAiPitUnderSafetyCar(driver, totalLaps, maxPits) {
  if (!driver.isAi || driver.dnf || driver.lap >= totalLaps - 1) return false;
  if ((driver.pitCount ?? 0) >= maxPits) return false;
  if (driver.pitting || driver.pitUntil != null) return false;

  let chance = 0.18;
  const wear = driver.wear ?? 0;
  if (wear >= 0.4) chance += 0.18;
  if (wear >= 0.65) chance += 0.22;
  if (wear >= WEAR_CLIFF_THRESHOLD) chance += 0.15;

  const preset = getDriverById(driver.driverId);
  if (preset?.perk.type === "perfect_pit_read") chance += 0.14;

  const lapsLeft = totalLaps - driver.lap;
  if (lapsLeft <= 3 && wear >= 0.35) chance += 0.12;

  return Math.random() < Math.min(0.72, chance);
}

/** @param {import('./gameState').RaceDriver} driver @param {number} totalLaps */
export function pickAiPitCompound(driver, totalLaps) {
  const lapsLeft = totalLaps - driver.lap;
  if (lapsLeft <= 2) {
    return Math.random() < 0.55 ? "soft" : "medium";
  }
  if (lapsLeft <= 4) {
    return rollAiTireCompound();
  }
  return Math.random() < 0.35 ? "hard" : rollAiTireCompound();
}

/**
 * @param {import('./gameState').RaceDriver} driver
 * @param {number} totalLaps
 */
export function canPit(driver, totalLaps) {
  const maxPits = getMaxPitStops(totalLaps);
  if (driver.dnf || driver.lap >= totalLaps) return false;
  return (driver.pitCount ?? 0) < maxPits;
}

/**
 * @param {import('./gameState').RaceDriver} driver
 * @param {number} currentTick
 */
function isSpinning(driver, currentTick) {
  return driver.spinUntil != null && currentTick < driver.spinUntil;
}

/**
 * @param {import('./gameState').RaceDriver} driver
 * @param {number} currentTick
 */
function isBoosting(driver, currentTick) {
  return driver.boostUntil != null && currentTick < driver.boostUntil;
}

/**
 * @param {import('./gameState').RaceDriver} driver
 * @param {number} currentTick
 */
function isPitting(driver, currentTick) {
  return driver.pitUntil != null && currentTick < driver.pitUntil;
}

export { isSpinning, isBoosting, isPitting };
