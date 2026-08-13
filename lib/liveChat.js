import { getDriverById } from "./drivers";
import { gifForEvent } from "./gifs";

/** @typedef {'dnf' | 'spin' | 'pit' | 'pit_error' | 'safety_car' | 'overtake' | 'boost' | 'lead_change' | 'race_start'} ChatEvent */

const POOLS = {
  dnf: [
    "That's a brutal retirement.",
    "Mechanical gremlin strikes again!",
    "And they're OUT. Devastating.",
    "Garage beckons. What a shame.",
  ],
  spin: [
    "SPIN! They're losing time!",
    "Too much throttle through there!",
    "A wobble — can they recover?",
    "Wall flirted with. Heart in mouth.",
  ],
  pit: [
    "Box box box! Pit stop underway.",
    "Fresh rubber going on.",
    "Strategy call — into the pits.",
    "Pit crew on the move!",
  ],
  pit_error: [
    "Slow stop! The crew fumbled it!",
    "Wheel nut drama in the pit box!",
    "That pit cost them dearly.",
  ],
  safety_car: [
    "SAFETY CAR DEPLOYED!",
    "The field bunches up. Chaos incoming.",
    "SC out — anyone's race now.",
    "Neutralized! Gaps erased.",
  ],
  overtake: [
    "MOVE COMPLETE! What a pass!",
    "They've gone through!",
    "Overtake! Brilliant stuff.",
    "Position gained — drama!",
  ],
  boost: [
    "They're flying! Purple sector pace!",
    "Where did THAT pace come from?!",
    "Flow state activated!",
  ],
  lead_change: [
    "NEW RACE LEADER!",
    "Lead change at the front!",
    "They're through for P1!",
  ],
  race_start: [
    "And we're racing at {track}!",
    "Green flag at {track}! May the chaos begin.",
    "Lights out and away we go!",
  ],
};

/**
 * @param {ChatEvent} event
 * @param {string} [driverId]
 * @param {{ trackName?: string }} [context]
 */
export function getChatLine(event, driverId, context = {}) {
  const pool = POOLS[event] ?? ["Something happened."];
  let line = pool[Math.floor(Math.random() * pool.length)];
  if (context.trackName) {
    line = line.replace(/\{track\}/g, context.trackName);
  }
  const driver = driverId ? getDriverById(driverId) : null;
  if (driver) return `${driver.name}: ${line}`;
  return line;
}

/**
 * @param {ChatEvent} event
 * @param {string} [driverId]
 * @param {{ trackName?: string }} [context]
 * @returns {{ id: string, text: string, event: ChatEvent, gif: string | null }}
 */
export function createChatMessage(event, driverId, context = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text: getChatLine(event, driverId, context),
    event,
    gif: gifForEvent(event),
  };
}
