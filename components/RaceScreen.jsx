"use client";

import { useEffect, useRef } from "react";
import { useGame, useGameActions } from "./GameProvider";
import { GAME_PHASES, getLeaderboard } from "@/lib/gameState";
import { getTrack } from "@/lib/tracks";
import { getDriverById } from "@/lib/drivers";
import { getGapSeconds } from "@/lib/raceEngine";
import { TIRES } from "@/lib/tires";
import { TICK_INTERVAL_MS } from "@/lib/constants";
import { playSfx } from "@/lib/audio";
import TrackView from "./TrackView";
import LiveChat from "./LiveChat";
import ReactionGif from "./ReactionGif";
import RaceHud from "./RaceHud";
import PitStopModal from "./PitStopModal";
import DrsMiniGame from "./DrsMiniGame";
import styles from "./RaceScreen.module.css";

function driverCode(name) {
  return name.slice(0, 3).toUpperCase();
}

export default function RaceScreen() {
  const { state, dispatch } = useGame();
  const { reset } = useGameActions();
  const lastFlashRef = useRef(null);

  const humanPlayer = state.players.find((p) => p.type === "human" && p.driverId);
  const humanDriver = state.race?.drivers.find(
    (d) => d.driverId === humanPlayer?.driverId
  );

  useEffect(() => {
    if (state.phase !== GAME_PHASES.RACE || !state.race || state.race.finished) {
      return;
    }
    if (state.race.drsChallenge) return;
    const id = setInterval(() => {
      dispatch({ type: "RACE_TICK" });
    }, TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [state.phase, state.race?.finished, state.race?.drsChallenge, dispatch]);

  useEffect(() => {
    if (!state.race?.finished) return;
    const t = setTimeout(() => {
      dispatch({ type: "FINISH_RACE" });
    }, 2000);
    return () => clearTimeout(t);
  }, [state.race?.finished, dispatch]);

  useEffect(() => {
    const flash = state.race?.activeFlash;
    if (!flash || flash === lastFlashRef.current) return;
    lastFlashRef.current = flash;
    if (flash.type === "dnf") playSfx("dnf");
    else if (flash.type === "pit" || flash.type === "pit_error") playSfx("pitStop");
    else if (flash.type === "overtake" || flash.type === "lead_change") playSfx("overtake");
  }, [state.race?.activeFlash]);

  if (!state.race) return null;

  const totalLaps = state.race.totalLaps;
  const track = getTrack(state.race.trackId);
  const board = getLeaderboard(state);
  const leader = board[0];
  const pitPending = state.race.pitPending;
  const drsChallenge = state.race.drsChallenge;
  const humanIdx = board.findIndex((d) => d.driverId === humanPlayer?.driverId);
  const humanRacePos = humanIdx >= 0 ? humanIdx + 1 : null;
  const humanGap =
    humanIdx === 0
      ? "Race Leader"
      : humanIdx > 0
        ? getGapSeconds(board[humanIdx], leader) ?? "—"
        : "—";

  const handleDrsResult = (success) => {
    dispatch({ type: "DRS_RESULT", payload: { success } });
    if (success) playSfx("overtake");
  };

  const tick = state.race.tick;
  const humanSpinning =
    humanDriver?.spinUntil != null && tick < humanDriver.spinUntil;
  const humanBoosting =
    humanDriver?.boostUntil != null && tick < humanDriver.boostUntil;

  return (
    <div className={styles.screen}>
      <div className={styles.main}>
        <div className={styles.mobileStack}>
          <div className={styles.rightCol}>
            <div className={styles.trackPanel}>
              <div className={styles.trackArea}>
                <div className={styles.lapOverlay}>
                  <span className={styles.lapOverlayLabel}>LAP</span>
                  <span className={styles.lapOverlayNum}>{state.race.lap}</span>
                  <span className={styles.lapOverlayTotal}>/{totalLaps}</span>
                </div>
                {state.race.safetyCar && (
                  <div className={styles.scOverlay}>SAFETY CAR</div>
                )}
                {state.race.finished && (
                  <div className={styles.chequeredOverlay}>CHEQUERED</div>
                )}
                <ReactionGif src={state.race.activeFlash?.gif ?? null} />
                <div className={styles.trackSizer}>
                  <TrackView
                    trackId={state.race.trackId}
                    drivers={board.map((d) => ({
                      driverId: d.driverId,
                      position: d.position,
                      lap: d.lap,
                    }))}
                  />
                </div>
              </div>
            </div>

            <div className={styles.chatPanelDesktop}>
              <LiveChat
                className={styles.chatFill}
                messages={state.race.chatLog ?? []}
              />
            </div>
          </div>

          <aside className={styles.leftCol}>
            {humanPlayer?.driverId && humanDriver && (
              <RaceHud
                driverId={humanPlayer.driverId}
                racePosition={humanRacePos ?? "—"}
                gapLabel={humanGap}
                lap={state.race.lap}
                lapProgress={humanDriver.position}
                tire={humanDriver.tire}
                wear={humanDriver.wear}
                pitting={humanDriver.pitting}
                dnf={humanDriver.dnf}
                spinning={humanSpinning}
                boosting={humanBoosting}
                safetyCar={state.race.safetyCar}
                finished={state.race.finished}
                totalLaps={totalLaps}
                canPit={
                  !humanDriver.dnf &&
                  humanDriver.lap < totalLaps &&
                  !state.race.finished
                }
                onPit={() =>
                  dispatch({
                    type: "PIT_REQUEST",
                    payload: { slot: humanPlayer.slot },
                  })
                }
                onQuit={reset}
              />
            )}

            <details className={styles.lbFold} open>
            <summary className={styles.foldSummary}>
              Leaderboard · {board.length} drivers
            </summary>
            <div className={styles.lbScroll}>
              <table className={styles.leaderboard}>
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th>Driver</th>
                    <th className={styles.colGap}>Gap</th>
                    <th className={styles.colTire}>Tyre</th>
                    <th className={styles.colWear}>Wear</th>
                  </tr>
                </thead>
                <tbody>
                  {board.map((d, i) => {
                    const driver = getDriverById(d.driverId);
                    const gap =
                      i === 0 ? "—" : getGapSeconds(d, leader) ?? "—";
                    const wearPct = Math.round(d.wear * 100);
                    const isHuman = d.driverId === humanPlayer?.driverId;
                    return (
                      <tr
                        key={d.driverId}
                        className={`${i === 0 ? styles.leaderRow : ""} ${isHuman ? styles.humanRow : ""}`}
                      >
                        <td className={styles.pos}>{i + 1}</td>
                        <td className={styles.driverCell}>
                          <span
                            className={styles.driverBadge}
                            style={{ backgroundColor: driver?.color }}
                          >
                            {driver ? driverCode(driver.name) : "???"}
                          </span>
                          <span className={styles.driverName}>
                            {driver?.name}
                          </span>
                          {d.pitting && (
                            <span className={styles.statusPit}>PIT</span>
                          )}
                          {d.dnf && (
                            <span className={styles.statusOut}>OUT</span>
                          )}
                        </td>
                        <td className={`${styles.gap} ${styles.colGap}`}>
                          {i === 0 ? "LEAD" : gap}
                        </td>
                        <td className={`${styles.tire} ${styles.colTire}`}>
                          {TIRES[d.tire].label[0]}
                        </td>
                        <td className={`${styles.wear} ${styles.colWear}`}>
                          {wearPct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        </aside>
        </div>

        <div className={styles.chatPanelMobile}>
          <LiveChat
            className={styles.chatFill}
            messages={state.race.chatLog ?? []}
          />
        </div>
      </div>

      <footer className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span className={styles.eventName}>{track.name}</span>
        </div>
        <div className={styles.statusCenter}>
          {state.race.safetyCar ? (
            <span className={styles.trackStatusSc}>Safety Car</span>
          ) : state.race.finished ? (
            <span className={styles.trackStatusDone}>Race Over</span>
          ) : (
            <span className={styles.trackStatusClear}>Track Clear</span>
          )}
        </div>
        <div className={styles.statusRight}>
          <span className={styles.footerLap}>
            Lap {state.race.lap} / {totalLaps}
          </span>
        </div>
      </footer>

      {pitPending != null && (
        <PitStopModal
          onPick={(compound) =>
            dispatch({
              type: "COMPLETE_PIT",
              payload: { slot: pitPending, compound },
            })
          }
          onCancel={() => dispatch({ type: "CANCEL_PIT" })}
        />
      )}
      {drsChallenge && (
        <DrsMiniGame challenge={drsChallenge} onResult={handleDrsResult} />
      )}
    </div>
  );
}
