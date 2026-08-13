"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGame, useGameActions } from "./GameProvider";
import { getDriverById, getReactionAdjustMs } from "@/lib/drivers";
import { TIRES } from "@/lib/tires";
import { allTiresPicked, getLobbyPlayers } from "@/lib/gameState";
import {
  rollAiTireCompound,
  rollAiReactionMs,
  applyJumpStartPenalty,
  rollLightsOutDelay,
  LIGHT_INTERVAL_MS,
  LIGHT_COUNT,
} from "@/lib/startSequence";
import { playSfx } from "@/lib/audio";
import { getTrack } from "@/lib/tracks";
import { getGridProgress } from "@/lib/trackPath";
import TrackView from "./TrackView";
import DriverPortrait from "./DriverPortrait";
import styles from "./StartSequence.module.css";

/** @typedef {'tires' | 'lights' | 'results'} StartStep */

function driverCode(name) {
  return name.slice(0, 3).toUpperCase();
}

export default function StartSequence() {
  const { state, dispatch } = useGame();
  const { reset } = useGameActions();

  const [step, setStep] = useState(/** @type {StartStep} */ ("tires"));
  const [lightsOn, setLightsOn] = useState(0);
  const [lightsOut, setLightsOut] = useState(false);
  const [lightsOutAt, setLightsOutAt] = useState(/** @type {number | null} */ (null));
  const [reactions, setReactions] = useState(/** @type {Record<number, number>} */ ({}));
  const [jumpStarts, setJumpStarts] = useState(/** @type {Record<number, boolean>} */ ({}));
  const [humanReacted, setHumanReacted] = useState(false);

  const activePlayers = getLobbyPlayers(state).filter((p) => p.driverId);
  const track = getTrack(state.raceSettings.trackId);
  const humanPlayer = activePlayers.find((p) => p.type === "human");
  const lightsOutAtRef = useRef(/** @type {number | null} */ (null));
  const playersRef = useRef(activePlayers);
  playersRef.current = activePlayers;

  useEffect(() => {
    if (step !== "tires") return;

    const timers = activePlayers
      .filter((p) => p.type === "ai" && !state.tirePicks[p.slot])
      .map((p, i) =>
        setTimeout(() => {
          dispatch({
            type: "PICK_TIRE",
            payload: { slot: p.slot, compound: rollAiTireCompound() },
          });
        }, 400 + i * 300)
      );

    return () => timers.forEach(clearTimeout);
  }, [step, activePlayers, state.tirePicks, dispatch]);

  useEffect(() => {
    if (step === "tires" && allTiresPicked(state)) {
      const t = setTimeout(() => setStep("lights"), 800);
      return () => clearTimeout(t);
    }
  }, [step, state]);

  useEffect(() => {
    if (step !== "lights") return;

    /** @type {ReturnType<typeof setTimeout>[]} */
    const timers = [];

    for (let i = 1; i <= LIGHT_COUNT; i++) {
      timers.push(
        setTimeout(() => {
          setLightsOn(i);
          playSfx("lightBeep");
        }, i * LIGHT_INTERVAL_MS)
      );
    }

    const delay = rollLightsOutDelay();
    const lightsOutTime = LIGHT_COUNT * LIGHT_INTERVAL_MS + delay;

    timers.push(
      setTimeout(() => {
        setLightsOut(true);
        setLightsOn(0);
        const now = Date.now();
        lightsOutAtRef.current = now;
        setLightsOutAt(now);
        playSfx("lightsOut");

        const aiReactions = {};
        playersRef.current
          .filter((p) => p.type === "ai")
          .forEach((p) => {
            aiReactions[p.slot] = rollAiReactionMs(p.driverId);
          });
        setReactions((prev) => ({ ...prev, ...aiReactions }));
      }, lightsOutTime)
    );

    return () => timers.forEach(clearTimeout);
  }, [step]);

  const handleReact = useCallback(() => {
    const human = activePlayers.find((p) => p.type === "human");
    if (!human || humanReacted) return;

    const now = Date.now();
    const outAt = lightsOutAtRef.current;

    if (!outAt) {
      setJumpStarts((prev) => ({ ...prev, [human.slot]: true }));
      setReactions((prev) => ({
        ...prev,
        [human.slot]: applyJumpStartPenalty(800, true),
      }));
      setHumanReacted(true);
      return;
    }

    let ms = now - outAt;
    ms = Math.max(0, ms + getReactionAdjustMs(getDriverById(human.driverId)));

    setReactions((prev) => ({ ...prev, [human.slot]: ms }));
    setHumanReacted(true);
  }, [activePlayers, humanReacted]);

  useEffect(() => {
    if (step !== "lights" || !lightsOutAt) return;

    const onKey = (e) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        handleReact();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, lightsOutAt, handleReact]);

  useEffect(() => {
    if (step !== "lights" || !lightsOutAt || humanReacted) return;

    const t = setTimeout(() => {
      const human = activePlayers.find((p) => p.type === "human");
      if (!human || humanReacted) return;
      setReactions((prev) => ({ ...prev, [human.slot]: 1200 }));
      setHumanReacted(true);
    }, 3000);

    return () => clearTimeout(t);
  }, [step, lightsOutAt, humanReacted, activePlayers]);

  useEffect(() => {
    if (step !== "lights" || !lightsOutAt) return;

    const allDone = activePlayers.every((p) => reactions[p.slot] != null);
    if (!allDone) return;

    const t = setTimeout(() => setStep("results"), 600);
    return () => clearTimeout(t);
  }, [step, lightsOutAt, reactions, activePlayers]);

  useEffect(() => {
    if (step !== "results") return;

    const t = setTimeout(() => {
      dispatch({
        type: "INIT_RACE",
        payload: { reactions, jumpStarts },
      });
    }, 2500);
    return () => clearTimeout(t);
  }, [step, reactions, jumpStarts, dispatch]);

  const sortedByReaction = [...activePlayers].sort(
    (a, b) => (reactions[a.slot] ?? 9999) - (reactions[b.slot] ?? 9999)
  );

  const gridDrivers = sortedByReaction.length
    ? sortedByReaction
    : [...activePlayers].sort((a, b) => a.slot - b.slot);

  const stepTitle =
    step === "tires"
      ? "Tyre Selection"
      : step === "lights"
        ? "Lights Out"
        : "Grid Order";

  const stepSub =
    step === "tires"
      ? "Pick your compound before formation lap"
      : step === "lights"
        ? "Wait for the lights — then go!"
        : "Launching race…";

  const canReact = step === "lights" && lightsOutAt && !humanReacted;
  const humanSlot = humanPlayer?.slot;
  const humanJumped = humanSlot != null && jumpStarts[humanSlot];
  const humanMs = humanSlot != null ? reactions[humanSlot] : null;

  return (
    <div
      className={styles.screen}
      onClick={canReact ? handleReact : undefined}
      onKeyDown={
        canReact
          ? (e) => {
              if (e.code === "Space" || e.code === "Enter") {
                e.preventDefault();
                handleReact();
              }
            }
          : undefined
      }
      role={canReact ? "button" : undefined}
      tabIndex={canReact ? 0 : undefined}
    >
      <div className={styles.main}>
        <aside className={styles.leftCol}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>{stepTitle}</span>
            <span className={styles.panelSub}>{stepSub}</span>
          </div>

          <div className={styles.leftScroll}>
            {step === "tires" &&
              activePlayers.map((player) => {
                const driver = getDriverById(player.driverId);
                const picked = state.tirePicks[player.slot];
                const isHuman = player.type === "human";

                return (
                  <div
                    key={player.slot}
                    className={`${styles.playerRow} ${isHuman ? styles.humanRow : ""}`}
                  >
                    <DriverPortrait driverId={driver.id} size="sm" />
                    <div className={styles.playerMeta}>
                      <span
                        className={styles.playerName}
                        style={{ color: driver.color }}
                      >
                        {driver.name}
                      </span>
                      {isHuman ? (
                        <div className={styles.tireBtns}>
                          {Object.entries(TIRES).map(([key, tire]) => (
                            <button
                              key={key}
                              type="button"
                              className={`${styles.tireBtn} ${styles[key]} ${picked === key ? styles.tireSelected : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                dispatch({
                                  type: "PICK_TIRE",
                                  payload: { slot: player.slot, compound: key },
                                });
                              }}
                            >
                              <img
                                src={tire.iconUrl}
                                alt=""
                                className={styles.tireIcon}
                              />
                              {tire.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className={styles.aiPick}>
                          {picked ? TIRES[picked].label : "Choosing…"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

            {(step === "lights" || step === "results") && (
              <table className={styles.gridTable}>
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th>Driver</th>
                    <th>Tyre</th>
                    {step === "results" && <th>Reaction</th>}
                  </tr>
                </thead>
                <tbody>
                  {(step === "results" ? sortedByReaction : gridDrivers).map(
                    (p, i) => {
                      const d = getDriverById(p.driverId);
                      const jumped = jumpStarts[p.slot];
                      const isHuman = p.type === "human";
                      return (
                        <tr
                          key={p.slot}
                          className={`${i === 0 && step === "results" ? styles.poleRow : ""} ${isHuman ? styles.humanRow : ""}`}
                        >
                          <td className={styles.pos}>P{i + 1}</td>
                          <td>
                            <span
                              className={styles.driverBadge}
                              style={{ backgroundColor: d?.color }}
                            >
                              {d ? driverCode(d.name) : "???"}
                            </span>
                            <span className={styles.gridName}>{d?.name}</span>
                          </td>
                          <td className={styles.compound}>
                            {TIRES[state.tirePicks[p.slot]]?.label ?? "—"}
                          </td>
                          {step === "results" && (
                            <td className={styles.time}>
                              {reactions[p.slot]}ms
                              {jumped && (
                                <span className={styles.jumpTag}>JUMP</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            )}

            {step === "tires" && humanPlayer && (
              <div className={styles.tireHint}>
                <strong>Soft</strong> = pace · <strong>Medium</strong> = balance ·{" "}
                <strong>Hard</strong> = durability
              </div>
            )}
          </div>
        </aside>

        <div className={styles.rightCol}>
          <div className={styles.trackPanel}>
            <div className={styles.trackArea}>
              {(step === "lights" || step === "results") && (
                <TrackView
                  trackId={track.id}
                  drivers={gridDrivers.map((p, i) => ({
                    driverId: p.driverId,
                    position: getGridProgress(i),
                    lap: 0,
                  }))}
                />
              )}
              {step === "tires" && (
                <div className={styles.trackPlaceholder}>
                  <span className={styles.trackPlaceholderTitle}>
                    {track.name}
                  </span>
                  <span className={styles.trackPlaceholderSub}>
                    Grid forming once tyres are selected…
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.controlPanel}>
            {step === "lights" && (
              <>
                <div className={styles.lightsWrap}>
                  <div className={styles.lights}>
                    {Array.from({ length: LIGHT_COUNT }).map((_, i) => (
                      <div
                        key={i}
                        className={`${styles.light} ${!lightsOut && i < lightsOn ? styles.lightOn : ""} ${lightsOut ? styles.lightOut : ""}`}
                      />
                    ))}
                  </div>
                </div>

                {!lightsOutAt && (
                  <p className={styles.phasePrompt}>Standby — lights coming on…</p>
                )}

                {canReact && (
                  <button
                    type="button"
                    className={styles.goBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReact();
                    }}
                  >
                    GO! — Tap or Space
                  </button>
                )}

                {step === "lights" && lightsOutAt && humanReacted && (
                  <p
                    className={`${styles.phasePrompt} ${humanJumped ? styles.promptWarn : styles.promptOk}`}
                  >
                    {humanJumped
                      ? "Jump start — penalty applied!"
                      : `Reaction: ${humanMs}ms`}
                  </p>
                )}
              </>
            )}

            {step === "results" && (
              <p className={styles.phasePrompt}>Green flag incoming…</p>
            )}

            {step === "tires" && !allTiresPicked(state) && (
              <p className={styles.phasePrompt}>
                Waiting for all tyre choices…
              </p>
            )}

            {step === "tires" && allTiresPicked(state) && (
              <p className={styles.phasePrompt}>Tyres locked — rolling to grid…</p>
            )}
          </div>
        </div>
      </div>

      <footer className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span className={styles.eventName}>{track.name}</span>
          <span className={styles.phaseTag}>{stepTitle}</span>
        </div>
        <div className={styles.statusCenter}>
          {step === "lights" && !lightsOutAt && (
            <span className={styles.statusWaiting}>Formation Lap</span>
          )}
          {step === "lights" && lightsOutAt && !humanReacted && (
            <span className={styles.statusGo}>Lights Out!</span>
          )}
          {step === "results" && (
            <span className={styles.statusClear}>Track Clear</span>
          )}
          {step === "tires" && (
            <span className={styles.statusWaiting}>Pre-Race</span>
          )}
        </div>
        <div className={styles.statusRight}>
          {step === "tires" && (
            <button type="button" className={styles.backBtn} onClick={reset}>
              Quit
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
