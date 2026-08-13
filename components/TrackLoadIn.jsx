"use client";

import { useEffect } from "react";
import { useGame, useGameActions } from "./GameProvider";
import { getLobbyPlayers } from "@/lib/gameState";
import { getDriverById } from "@/lib/drivers";
import { getTrack } from "@/lib/tracks";
import { getGridProgress } from "@/lib/trackPath";
import TrackView from "./TrackView";
import styles from "./TrackLoadIn.module.css";

export default function TrackLoadIn() {
  const { state, dispatch } = useGame();
  const { reset } = useGameActions();

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: "ADVANCE_TO_START" });
    }, 2000);
    return () => clearTimeout(timer);
  }, [dispatch]);

  const track = getTrack(state.raceSettings.trackId);
  const { totalLaps } = state.raceSettings;
  const activeDrivers = getLobbyPlayers(state)
    .filter((p) => p.driverId)
    .sort((a, b) => a.slot - b.slot);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1>{track.name}</h1>
        <p className={styles.flavor}>
          {track.tagline} · {totalLaps} laps
        </p>
      </header>

      <div className={styles.trackWrap}>
        <TrackView
          trackId={track.id}
          drivers={activeDrivers.map((p, i) => ({
            driverId: p.driverId,
            position: getGridProgress(i),
            lap: 0,
          }))}
        />
      </div>

      <div className={styles.grid}>
        {activeDrivers.map((p, i) => {
          const d = getDriverById(p.driverId);
          return (
            <div key={p.slot} className={styles.entry} style={{ borderColor: d?.color }}>
              <span className={styles.car} style={{ background: d?.color }} />
              <span>P{i + 1} {d?.name}</span>
            </div>
          );
        })}
      </div>

      <p className={styles.nextHint}>Loading circuit…</p>

      <button type="button" className={styles.backBtn} onClick={reset}>
        ← Back to Lobby
      </button>
    </div>
  );
}
