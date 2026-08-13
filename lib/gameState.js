import { GAME_PHASES, MAX_PLAYERS, DEFAULT_LAPS, JUMP_START_PENALTY } from "./constants";
import { DEFAULT_TRACK_ID, getTrack } from "./tracks";
import { DRIVERS, getDriverById } from "./drivers";
import { TIRES } from "./tires";
import { createChatMessage } from "./liveChat";
import { rollAiPitLap, applyPitStop } from "./events";

/** @typedef {'human' | 'ai'} PlayerType */

/**
 * @typedef {{
 *   slot: number,
 *   type: PlayerType,
 *   driverId: string | null,
 *   ready: boolean,
 *   name: string,
 * }} LobbyPlayer
 */

/**
 * @typedef {{
 *   driverId: string,
 *   position: number,
 *   lap: number,
 *   tire: import('./tires').TireCompound | null,
 *   wear: number,
 *   reactionMs: number | null,
 *   dnf: boolean,
 *   pitting: boolean,
 *   spinUntil: number | null,
 *   boostUntil: number | null,
 *   gap: number,
 *   finishOrder: number | null,
 *   pitUntil: number | null,
 *   pitLapTarget: number | null,
 *   lastEventLap: number,
 * }} RaceDriver
 */

/**
 * @typedef {{
 *   phase: string,
 *   players: LobbyPlayer[],
 *   raceSettings: { trackId: string, totalLaps: number },
 *   race: {
 *     lap: number,
 *     totalLaps: number,
 *     trackId: string,
 *     tick: number,
 *     drivers: RaceDriver[],
 *     safetyCar: boolean,
 *     finished: boolean,
 *     finishCounter: number,
 *     results: { driverId: string, position: number }[],
 *     chatLog: { id: string, text: string, event: string }[],
 *     activeFlash: { type: string, gif: string, driverId?: string, untilTick: number } | null,
 *     safetyCarUntil: number | null,
 *     leaderId: string | null,
 *     pitPending: number | null,
 *     drsChallenge: {
 *       attackerId: string,
 *       defenderId: string,
 *       expiresTick: number,
 *       windowMs: number,
 *     } | null,
 *   } | null,
 *   tirePicks: Record<number, import('./tires').TireCompound | null>,
 *   soundEnabled: boolean,
 *   lightsOutAt: number | null,
 *   reactions: Record<number, number | null>,
 * }} GameState
 */

/** @returns {boolean} */
function readStoredSoundEnabled() {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem("pocket-f1-sound-enabled");
  if (stored === null) return true;
  return stored === "true";
}

/** @returns {GameState} */
export function createInitialGameState() {
  return {
    phase: GAME_PHASES.TITLE,
    players: createEmptyPlayerSlots(),
    race: null,
    raceSettings: {
      trackId: DEFAULT_TRACK_ID,
      totalLaps: DEFAULT_LAPS,
    },
    soundEnabled: readStoredSoundEnabled(),
    tirePicks: {},
    lightsOutAt: null,
    reactions: {},
  };
}

/** @returns {LobbyPlayer[]} */
export function createEmptyPlayerSlots() {
  return Array.from({ length: MAX_PLAYERS }, (_, slot) => ({
    slot,
    type: slot === 0 ? "human" : "ai",
    driverId: null,
    ready: false,
    name: `Player ${slot + 1}`,
  }));
}

/** @param {GameState} state @param {string} trackId */
export function setRaceTrack(state, trackId) {
  return {
    ...state,
    raceSettings: { ...state.raceSettings, trackId },
  };
}

/** @param {GameState} state @param {number} totalLaps */
export function setRaceLaps(state, totalLaps) {
  return {
    ...state,
    raceSettings: { ...state.raceSettings, totalLaps },
  };
}

/** @param {GameState} state */
export function toggleSound(state) {
  const soundEnabled = !state.soundEnabled;
  if (typeof window !== "undefined") {
    window.localStorage.setItem("pocket-f1-sound-enabled", String(soundEnabled));
  }
  return { ...state, soundEnabled };
}

/**
 * @param {GameState} state
 * @param {number} slot
 * @param {string} driverId
 */
export function selectDriver(state, slot, driverId) {
  const taken = state.players.some(
    (p) => p.slot !== slot && p.driverId === driverId
  );
  if (taken) return state;

  const players = state.players.map((p) =>
    p.slot === slot ? { ...p, driverId, ready: true } : p
  );
  return { ...state, players };
}

/**
 * @param {GameState} state
 * @param {number} slot
 */
export function toggleReady(state, slot) {
  const players = state.players.map((p) =>
    p.slot === slot && p.driverId ? { ...p, ready: !p.ready } : p
  );
  return { ...state, players };
}

/** @param {GameState} state */
export function fillAiPlayers(state) {
  const taken = new Set(
    state.players.filter((p) => p.driverId).map((p) => p.driverId)
  );
  const available = DRIVERS.map((d) => d.id).filter((id) => !taken.has(id));

  let idx = 0;
  const players = state.players.map((p) => {
    if (p.slot === 0) return p;
    if (!p.driverId && idx < available.length) {
      return {
        ...p,
        type: "ai",
        driverId: available[idx++],
        ready: true,
      };
    }
    if (p.driverId && p.type === "ai") {
      return { ...p, ready: true };
    }
    return p;
  });

  return { ...state, players };
}

/** @param {GameState} state */
export function readyAllPlayers(state) {
  const players = state.players.map((p) =>
    p.driverId ? { ...p, ready: true } : p
  );
  return { ...state, players };
}

/** @param {GameState} state */
export function canStartRace(state) {
  const active = state.players.filter((p) => p.driverId);
  if (active.length < 2) return false;
  return active.every((p) => p.ready);
}

/** @param {GameState} state */
export function enterLobby(state) {
  return { ...state, phase: GAME_PHASES.LOBBY };
}

/** @param {GameState} state */
export function advanceToTrack(state) {
  return { ...state, phase: GAME_PHASES.TRACK };
}

/** @param {GameState} state */
export function advanceToStart(state) {
  const tirePicks = {};
  state.players.forEach((p) => {
    if (p.driverId) tirePicks[p.slot] = null;
  });
  return {
    ...state,
    phase: GAME_PHASES.START,
    tirePicks,
    lightsOutAt: null,
    reactions: {},
  };
}

/**
 * @param {GameState} state
 * @param {number} slot
 * @param {import('./tires').TireCompound} compound
 */
export function pickTire(state, slot, compound) {
  return {
    ...state,
    tirePicks: { ...state.tirePicks, [slot]: compound },
  };
}

/** @param {GameState} state */
export function allTiresPicked(state) {
  return state.players
    .filter((p) => p.driverId)
    .every((p) => state.tirePicks[p.slot] != null);
}

/**
 * @param {GameState} state
 * @param {Record<number, number>} reactions slot → reaction ms
 * @param {Record<number, boolean>} [jumpStarts]
 */
export function initRace(state, reactions, jumpStarts = {}) {
  const activePlayers = state.players.filter((p) => p.driverId);

  /** @type {RaceDriver[]} */
  const drivers = activePlayers.map((p) => ({
    driverId: p.driverId,
    position: 0,
    lap: 0,
    tire: state.tirePicks[p.slot] ?? "medium",
    wear: 0,
    reactionMs: reactions[p.slot] ?? null,
    dnf: false,
    pitting: false,
    spinUntil: null,
    boostUntil: null,
    gap: 0,
    finishOrder: null,
    pitUntil: null,
    pitLapTarget: p.type === "ai" ? rollAiPitLap() : null,
    lastEventLap: -1,
  }));

  const slotByDriver = Object.fromEntries(
    activePlayers.map((p) => [p.driverId, p.slot])
  );

  // Sort by reaction time — fastest start leads (lower ms = ahead)
  const sorted = [...drivers].sort(
    (a, b) => (a.reactionMs ?? 9999) - (b.reactionMs ?? 9999)
  );
  sorted.forEach((d, i) => {
    const slot = slotByDriver[d.driverId];
    const jumpPenalty = jumpStarts[slot] ? JUMP_START_PENALTY : 0;
    d.gap = i * 0.015 + jumpPenalty;
    d.position = -d.gap;
  });

  return {
    ...state,
    phase: GAME_PHASES.RACE,
    pitPending: null,
    race: {
      lap: 1,
      tick: 0,
      totalLaps: state.raceSettings.totalLaps,
      trackId: state.raceSettings.trackId,
      drivers,
      safetyCar: false,
      safetyCarUntil: null,
      finished: false,
      finishCounter: 0,
      results: [],
      chatLog: [
        createChatMessage("race_start", undefined, {
          trackName: getTrack(state.raceSettings.trackId).name,
        }),
      ],
      activeFlash: null,
      leaderId: sorted[0]?.driverId ?? null,
      pitPending: null,
      drsChallenge: null,
    },
    reactions,
  };
}

/**
 * @param {GameState} state
 * @param {number} slot
 */
export function setPitPending(state, slot) {
  if (!state.race) return state;
  return {
    ...state,
    race: { ...state.race, pitPending: slot },
  };
}

/**
 * @param {GameState} state
 * @param {number} slot
 * @param {import('./tires').TireCompound} compound
 */
export function completePit(state, slot, compound) {
  if (!state.race) return state;

  const player = state.players.find((p) => p.slot === slot);
  if (!player?.driverId) return state;

  const drivers = state.race.drivers.map((d) => ({ ...d }));
  const driver = drivers.find((d) => d.driverId === player.driverId);
  if (!driver || driver.dnf || driver.lap >= state.race.totalLaps) {
    return { ...state, race: { ...state.race, pitPending: null } };
  }

  const { flash, chat } = applyPitStop(
    driver,
    compound,
    state.race.tick,
    player.driverId
  );

  return {
    ...state,
    race: {
      ...state.race,
      drivers,
      pitPending: null,
      activeFlash: flash,
      chatLog: [...state.race.chatLog.slice(-19), chat],
    },
  };
}

/** @param {GameState} state */
export function cancelPit(state) {
  if (!state.race) return state;
  return { ...state, race: { ...state.race, pitPending: null } };
}

/** @param {GameState} state */
export function advanceToPodium(state) {
  if (!state.race) return state;

  const results = [...state.race.drivers]
    .filter((d) => !d.dnf)
    .sort((a, b) => {
      if (a.finishOrder != null && b.finishOrder != null) {
        return a.finishOrder - b.finishOrder;
      }
      if (a.lap !== b.lap) return b.lap - a.lap;
      return b.position - a.position;
    })
    .map((d, i) => ({ driverId: d.driverId, position: i + 1 }));

  const dnfDrivers = state.race.drivers
    .filter((d) => d.dnf)
    .map((d, i) => ({ driverId: d.driverId, position: results.length + i + 1 }));

  return {
    ...state,
    phase: GAME_PHASES.PODIUM,
    race: {
      ...state.race,
      finished: true,
      results: [...results, ...dnfDrivers],
    },
  };
}

/** @param {GameState} state */
export function resetToLobby(state) {
  const { trackId, totalLaps } = state.raceSettings;
  return {
    ...createInitialGameState(),
    phase: GAME_PHASES.LOBBY,
    raceSettings: { trackId, totalLaps },
  };
}

/** @param {GameState} state */
export function getActiveDrivers(state) {
  return state.players
    .filter((p) => p.driverId)
    .map((p) => ({ ...p, driver: getDriverById(p.driverId) }));
}

/** @param {GameState} state */
export function getLeaderboard(state) {
  if (!state.race) return [];
  return [...state.race.drivers]
    .filter((d) => !d.dnf)
    .sort((a, b) => {
      const aTotal = a.lap + a.position;
      const bTotal = b.lap + b.position;
      return bTotal - aTotal;
    });
}

export { GAME_PHASES, TIRES };
export { DEFAULT_LAPS, DEFAULT_LAPS as TOTAL_LAPS } from "./constants";
