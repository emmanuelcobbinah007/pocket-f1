"use client";

import { GameProvider, useGame } from "./GameProvider";
import { GAME_PHASES } from "@/lib/gameState";
import TitleScreen from "./TitleScreen";
import LobbyScreen from "./LobbyScreen";
import TrackLoadIn from "./TrackLoadIn";
import StartSequence from "./StartSequence";
import RaceScreen from "./RaceScreen";
import PodiumScreen from "./PodiumScreen";

function GameRouter() {
  const { state } = useGame();

  switch (state.phase) {
    case GAME_PHASES.TITLE:
      return <TitleScreen />;
    case GAME_PHASES.LOBBY:
      return <LobbyScreen />;
    case GAME_PHASES.TRACK:
      return <TrackLoadIn />;
    case GAME_PHASES.START:
      return <StartSequence />;
    case GAME_PHASES.RACE:
      return <RaceScreen />;
    case GAME_PHASES.PODIUM:
      return <PodiumScreen />;
    default:
      return <TitleScreen />;
  }
}

export default function GameShell() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}
