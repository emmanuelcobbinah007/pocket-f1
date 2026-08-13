import {
  PIT_STOP_PENALTY,
  PIT_ERROR_EXTRA_PENALTY,
  SPIN_TICKS,
  BOOST_TICKS,
  EVENT_FLASH_TICKS,
} from "./constants";
import { getDriverById } from "./drivers";
import { createChatMessage } from "./liveChat";
import { createEventFlash } from "./gifs";
import { rollAiTireCompound } from "./startSequence";

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

  if (preset.jerk.type === "spin" && Math.random() < 0.28) {
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

  driver.tire = compound;
  driver.wear = 0;
  driver.pitting = true;
  driver.pitUntil = currentTick + 5;
  driver.position = Math.max(-0.5, driver.position - penalty);

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

/** AI pit target lap — randomized per driver */
export function rollAiPitLap() {
  return 2 + Math.floor(Math.random() * 2);
}

/** @param {import('./gameState').RaceDriver} driver */
export function shouldAiPit(driver) {
  return (
    driver.pitLapTarget != null &&
    driver.lap >= driver.pitLapTarget &&
    driver.wear >= 0.35 &&
    !driver.pitting &&
    driver.pitUntil == null
  );
}

export function pickAiPitCompound() {
  return rollAiTireCompound();
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
