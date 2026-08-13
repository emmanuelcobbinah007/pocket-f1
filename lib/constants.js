export const MAX_PLAYERS = 4;
export const DEFAULT_LAPS = 5;
/** @deprecated use state.raceSettings.totalLaps */
export const TOTAL_LAPS = DEFAULT_LAPS;
export const LAP_OPTIONS = [3, 5, 7, 10];
export const TICK_INTERVAL_MS = 250;

/** Lap progress added per tick at speed 1.0 — ~28 s/lap at 250 ms ticks. */
export const BASE_PROGRESS_RATE = 0.009;

/** Safety car — ~8 s deployment at 250 ms ticks. */
export const SC_DURATION_TICKS = 32;
export const SC_TRIGGER_CHANCE = 0.16;
export const SC_FLASH_TICKS = 12;

/** Mid-race surprise rolls every N ticks when not under SC. */
export const SURPRISE_EVENT_INTERVAL = 3;
export const SURPRISE_EVENT_CHANCE = 0.58;

/** Spin / boost / flash durations (ticks). */
export const SPIN_TICKS = 8;
export const BOOST_TICKS = 10;
export const EVENT_FLASH_TICKS = 10;

export const AI_REACTION_MIN_MS = 150;
export const AI_REACTION_MAX_MS = 500;
export const ROOKIE_REACTION_BONUS_MS = 50;

export const JUMP_START_PENALTY = 0.08;
export const JUMP_START_PENALTY_MS = 500;
export const PIT_STOP_PENALTY = 0.12;
export const PIT_ERROR_EXTRA_PENALTY = 0.06;

export const DRS_GAP_THRESHOLD = 0.025;
export const OVERTAKE_WINDOW_MS = 800;

export const GAME_PHASES = {
  TITLE: "title",
  LOBBY: "lobby",
  TRACK: "track",
  START: "start",
  RACE: "race",
  PODIUM: "podium",
};

export const DRS_BOOST_WINDOW_MULT = 1.5;
