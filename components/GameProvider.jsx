"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import {
  createInitialGameState,
  selectDriver,
  toggleReady,
  fillAiPlayers,
  canStartRace,
  enterLobby,
  advanceToTrack,
  advanceToStart,
  pickTire,
  initRace,
  advanceToPodium,
  completePit,
  cancelPit,
  setPitPending,
  readyAllPlayers,
  setRaceTrack,
  setRaceLaps,
  setPlayerCount,
  toggleSound,
  resetToLobby,
  GAME_PHASES,
} from "@/lib/gameState";
import { tickRace } from "@/lib/raceEngine";
import { resolveDrs } from "@/lib/drs";
import {
  applySoundEnabled,
  playMenuMusic,
  playRaceMusic,
  stopMenuMusic,
  stopRaceMusic,
  stopAllMusic,
  playSfx,
  unlockAndPlayMenu,
} from "@/lib/audio";

/** @typedef {import('@/lib/gameState').GameState} GameState */

/** @type {React.Context<{ state: GameState, dispatch: React.Dispatch<{ type: string, payload?: unknown }> } | null>} */
const GameContext = createContext(null);

function gameReducer(state, action) {
  switch (action.type) {
    case "ENTER_LOBBY":
      return enterLobby(state);
    case "SELECT_DRIVER":
      return selectDriver(state, action.payload.slot, action.payload.driverId);
    case "TOGGLE_READY":
      return toggleReady(state, action.payload.slot);
    case "FILL_AI":
      return fillAiPlayers(state);
    case "READY_ALL":
      return readyAllPlayers(state);
    case "START_RACE":
      return advanceToTrack(state);
    case "ADVANCE_TO_START":
      return advanceToStart(state);
    case "PICK_TIRE":
      return pickTire(state, action.payload.slot, action.payload.compound);
    case "INIT_RACE":
      return initRace(state, action.payload.reactions, action.payload.jumpStarts);
    case "RACE_TICK":
      return tickRace(state);
    case "DRS_RESULT":
      return resolveDrs(state, action.payload.success);
    case "FINISH_RACE":
      return advanceToPodium(state);
    case "PIT_REQUEST":
      return setPitPending(state, action.payload.slot);
    case "COMPLETE_PIT":
      return completePit(state, action.payload.slot, action.payload.compound);
    case "CANCEL_PIT":
      return cancelPit(state);
    case "SET_TRACK":
      return setRaceTrack(state, action.payload.trackId);
    case "SET_LAPS":
      return setRaceLaps(state, action.payload.totalLaps);
    case "SET_PLAYER_COUNT":
      return setPlayerCount(state, action.payload.playerCount);
    case "TOGGLE_SOUND":
      return toggleSound(state);
    case "RESET":
      return resetToLobby();
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialGameState);

  useEffect(() => {
    applySoundEnabled(state.soundEnabled);
  }, [state.soundEnabled]);

  useEffect(() => {
    if (!state.soundEnabled) {
      stopAllMusic();
      return;
    }

    const menuPhases = [GAME_PHASES.LOBBY, GAME_PHASES.TRACK, GAME_PHASES.START];
    if (menuPhases.includes(state.phase)) {
      playMenuMusic();
    } else if (state.phase === GAME_PHASES.RACE) {
      playRaceMusic();
    } else if (state.phase === GAME_PHASES.PODIUM) {
      stopRaceMusic();
      playSfx("podium");
    } else if (state.phase === GAME_PHASES.TITLE) {
      stopMenuMusic();
      stopRaceMusic();
    }
  }, [state.phase, state.soundEnabled]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

export function useGameActions() {
  const { state, dispatch } = useGame();

  const selectDriverForSlot = useCallback(
    (slot, driverId) => dispatch({ type: "SELECT_DRIVER", payload: { slot, driverId } }),
    [dispatch]
  );

  const toggleReadyForSlot = useCallback(
    (slot) => dispatch({ type: "TOGGLE_READY", payload: { slot } }),
    [dispatch]
  );

  const fillAi = useCallback(() => dispatch({ type: "FILL_AI" }), [dispatch]);

  const readyAll = useCallback(() => dispatch({ type: "READY_ALL" }), [dispatch]);

  const startRace = useCallback(() => {
    if (canStartRace(state)) dispatch({ type: "START_RACE" });
  }, [state, dispatch]);

  const reset = useCallback(() => dispatch({ type: "RESET" }), [dispatch]);

  const setTrack = useCallback(
    (trackId) => dispatch({ type: "SET_TRACK", payload: { trackId } }),
    [dispatch]
  );

  const setLaps = useCallback(
    (totalLaps) => dispatch({ type: "SET_LAPS", payload: { totalLaps } }),
    [dispatch]
  );

  const setPlayerCountAction = useCallback(
    (playerCount) =>
      dispatch({ type: "SET_PLAYER_COUNT", payload: { playerCount } }),
    [dispatch]
  );

  const toggleSoundAction = useCallback(async () => {
    const turningOn = !state.soundEnabled;
    dispatch({ type: "TOGGLE_SOUND" });
    if (turningOn && state.phase !== GAME_PHASES.TITLE) {
      await unlockAndPlayMenu();
    }
  }, [dispatch, state.soundEnabled, state.phase]);

  return {
    selectDriverForSlot,
    toggleReadyForSlot,
    fillAi,
    readyAll,
    startRace,
    reset,
    setTrack,
    setLaps,
    setPlayerCount: setPlayerCountAction,
    toggleSound: toggleSoundAction,
    canStart: canStartRace(state),
  };
}
