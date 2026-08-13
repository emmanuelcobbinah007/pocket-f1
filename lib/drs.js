import {
  DRS_GAP_THRESHOLD,
  OVERTAKE_WINDOW_MS,
  DRS_BOOST_WINDOW_MULT,
  TICK_INTERVAL_MS,
} from "./constants";
import { getDriverById } from "./drivers";
import { getTrackRuntime } from "./trackPath";
import { createChatMessage, createSpectatorMessage } from "./liveChat";
import { createEventFlash } from "./gifs";

/**
 * @param {import('./gameState').GameState} state
 * @param {import('./gameState').RaceDriver[]} drivers
 * @param {number} tick
 */
export function detectDrsChallenge(state, drivers, tick) {
  if (state.race?.drsChallenge) return null;

  const human = state.players.find((p) => p.type === "human" && p.driverId);
  if (!human?.driverId) return null;

  const board = [...drivers]
    .filter((d) => !d.dnf)
    .sort((a, b) => b.lap + b.position - (a.lap + a.position));

  const idx = board.findIndex((d) => d.driverId === human.driverId);
  if (idx <= 0) return null;

  const attacker = board[idx];
  const defender = board[idx - 1];
  const gap =
    defender.lap + defender.position - (attacker.lap + attacker.position);

  if (gap <= 0 || gap > DRS_GAP_THRESHOLD) return null;

  const trackId = state.race?.trackId ?? state.raceSettings?.trackId;
  const { isInDrsZone } = getTrackRuntime(trackId);
  if (!isInDrsZone(attacker.position)) return null;

  const preset = getDriverById(attacker.driverId);
  const windowMs =
    preset?.perk.type === "drs_boost"
      ? OVERTAKE_WINDOW_MS * DRS_BOOST_WINDOW_MULT
      : OVERTAKE_WINDOW_MS;

  return {
    attackerId: attacker.driverId,
    defenderId: defender.driverId,
    expiresTick: tick + Math.ceil(windowMs / TICK_INTERVAL_MS) + 2,
    windowMs,
  };
}

/**
 * @param {import('./gameState').RaceDriver} attacker
 * @param {import('./gameState').RaceDriver} defender
 */
export function applyOvertake(attacker, defender) {
  const defenderTotal = defender.lap + defender.position;
  const newTotal = defenderTotal + 0.012;
  attacker.lap = Math.floor(newTotal);
  attacker.position = newTotal - attacker.lap;
}

/**
 * @param {import('./gameState').GameState} state
 * @param {boolean} success
 */
export function resolveDrs(state, success) {
  if (!state.race?.drsChallenge) return state;

  const { attackerId, defenderId } = state.race.drsChallenge;
  const drivers = state.race.drivers.map((d) => ({ ...d }));
  const attacker = drivers.find((d) => d.driverId === attackerId);
  const defender = drivers.find((d) => d.driverId === defenderId);

  let activeFlash = state.race.activeFlash;
  let chatLog = [...(state.race.chatLog ?? [])];

  if (success && attacker && defender) {
    applyOvertake(attacker, defender);
    activeFlash = createEventFlash("overtake", attackerId, state.race.tick + 7);
    chatLog = [
      ...chatLog.slice(-48),
      createChatMessage("overtake", attackerId),
      createSpectatorMessage({
        mood: "overtake",
        driverName: getDriverById(attackerId)?.name,
      }),
    ];
  }

  return {
    ...state,
    race: {
      ...state.race,
      drivers,
      drsChallenge: null,
      activeFlash,
      chatLog,
      leaderId: success ? attackerId : state.race.leaderId,
    },
  };
}
