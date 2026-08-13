import {
  DRS_GAP_THRESHOLD,
  OVERTAKE_WINDOW_MS,
  DRS_BOOST_WINDOW_MULT,
  CROWD_ENERGY_WINDOW_MULT,
  IRON_WALL_WINDOW_MULT,
  TICK_INTERVAL_MS,
  CAMERA_HOG_TICKS,
} from "./constants";
import { getDriverById } from "./drivers";
import { getTrackRuntime } from "./trackPath";
import { createChatMessage, createSpectatorMessage } from "./liveChat";
import { createEventFlash } from "./gifs";
import { VIEWER_BASE, bumpViewers } from "./viewerCount";

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

  const attackerPreset = getDriverById(attacker.driverId);
  const defenderPreset = getDriverById(defender.driverId);
  let windowMs = OVERTAKE_WINDOW_MS;
  if (attackerPreset?.perk.type === "drs_boost") {
    windowMs *= DRS_BOOST_WINDOW_MULT;
  }
  if (attackerPreset?.perk.type === "crowd_energy") {
    windowMs *= CROWD_ENERGY_WINDOW_MULT;
  }
  if (defenderPreset?.perk.type === "iron_wall") {
    windowMs *= IRON_WALL_WINDOW_MULT;
  }

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
  let viewerCount = state.race.viewerCount ?? VIEWER_BASE;

  if (success && attacker && defender) {
    applyOvertake(attacker, defender);
    activeFlash = createEventFlash("overtake", attackerId, state.race.tick + 7);
    const overtakeMsg = createChatMessage("overtake", attackerId);
    const fanMsg = createSpectatorMessage({
      mood: "overtake",
      driverName: getDriverById(attackerId)?.name,
    });
    chatLog = [...chatLog.slice(-48), overtakeMsg, fanMsg];
    viewerCount = bumpViewers(viewerCount, overtakeMsg.event);
    viewerCount = bumpViewers(viewerCount, fanMsg.event);

    const attackerPreset = getDriverById(attackerId);
    if (attackerPreset?.jerk.type === "camera_hog" && Math.random() < 0.45) {
      attacker.spinUntil = state.race.tick + CAMERA_HOG_TICKS;
    }
  }

  return {
    ...state,
    race: {
      ...state.race,
      drivers,
      drsChallenge: null,
      activeFlash,
      chatLog,
      viewerCount,
      leaderId: success ? attackerId : state.race.leaderId,
    },
  };
}
