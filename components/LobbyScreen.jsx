"use client";

import { useState } from "react";
import { DRIVERS, getDriverById, isDriverTaken } from "@/lib/drivers";
import { TRACKS, getTrack } from "@/lib/tracks";
import { LAP_OPTIONS, MIN_PLAYERS, MAX_PLAYERS } from "@/lib/constants";
import { getLobbyPlayers } from "@/lib/gameState";
import { useGame, useGameActions } from "./GameProvider";
import { unlockAudio } from "@/lib/audio";
import DriverPortrait from "./DriverPortrait";
import DriverDetailPanel from "./DriverDetailPanel";
import LobbyGuide from "./LobbyGuide";
import SoundToggle from "./SoundToggle";
import styles from "./LobbyScreen.module.css";

/** @typedef {'setup' | 'grid'} LobbyStep */

const GRID_SIZE_OPTIONS = [4, 5, 6, 7, 8];

export default function LobbyScreen() {
  const { state } = useGame();
  const {
    selectDriverForSlot,
    toggleReadyForSlot,
    fillAi,
    readyAll,
    startRace,
    setTrack,
    setLaps,
    setPlayerCount,
    canStart,
  } = useGameActions();
  const unlock = () => unlockAudio();

  const [step, setStep] = useState(/** @type {LobbyStep} */ ("setup"));
  const [activeSlot, setActiveSlot] = useState(0);
  const [previewDriverId, setPreviewDriverId] = useState(null);

  const lobbyPlayers = getLobbyPlayers(state);
  const playerCount = state.raceSettings.playerCount;
  const activePlayer = lobbyPlayers.find((p) => p.slot === activeSlot) ?? lobbyPlayers[0];
  const assignedCount = lobbyPlayers.filter((p) => p.driverId).length;
  const allAssigned = assignedCount === playerCount;
  const allReady = allAssigned && lobbyPlayers.every((p) => p.ready);
  const selectedTrack = getTrack(state.raceSettings.trackId);

  const detailDriverId =
    previewDriverId ?? activePlayer?.driverId ?? DRIVERS[0]?.id ?? null;

  const withUnlock = (fn) => (...args) => {
    unlock();
    fn(...args);
  };

  const goToGrid = () => {
    unlock();
    setStep("grid");
    const firstEmpty = lobbyPlayers.find((p) => !p.driverId);
    setActiveSlot(firstEmpty?.slot ?? 0);
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div className={styles.headerSpacer} aria-hidden />
          <div className={styles.headerTitles}>
            <h1 className={styles.title}>Pocket F1</h1>
            <p className={styles.subtitle}>Party grid racing · pick · ready · go</p>
          </div>
          <div className={styles.headerActions}>
            <SoundToggle />
          </div>
        </div>

        <nav className={styles.stepper} aria-label="Lobby steps">
          <button
            type="button"
            className={`${styles.step} ${step === "setup" ? styles.stepActive : styles.stepDone}`}
            onClick={() => setStep("setup")}
          >
            <span className={styles.stepNum}>1</span>
            <span className={styles.stepLabel}>Race setup</span>
          </button>
          <span className={styles.stepLine} aria-hidden />
          <button
            type="button"
            className={`${styles.step} ${step === "grid" ? styles.stepActive : ""}`}
            onClick={() => setStep("grid")}
            disabled={false}
          >
            <span className={styles.stepNum}>2</span>
            <span className={styles.stepLabel}>Grid & drivers</span>
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        {step === "setup" && (
          <div className={styles.setupPane}>
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Circuit</h2>

              <div className={styles.trackHero}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedTrack.backgroundUrl}
                  alt={`${selectedTrack.name} preview`}
                  className={styles.trackHeroImg}
                  draggable={false}
                />
                <div className={styles.trackHeroCaption}>
                  <strong>{selectedTrack.name}</strong>
                  <span>{selectedTrack.tagline}</span>
                </div>
              </div>

              <div className={styles.trackCards}>
                {TRACKS.map((track) => {
                  const selected = state.raceSettings.trackId === track.id;
                  const locked = track.available === false;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      disabled={locked}
                      className={`${styles.trackCard} ${selected ? styles.trackCardActive : ""} ${locked ? styles.trackCardLocked : ""}`}
                      onClick={withUnlock(() => setTrack(track.id))}
                    >
                      <div className={styles.trackThumb}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={track.backgroundUrl}
                          alt=""
                          loading="lazy"
                          draggable={false}
                        />
                      </div>
                      <div className={styles.trackCardBody}>
                        <strong>{track.name}</strong>
                        <span>{track.tagline}</span>
                        {locked && <em>Coming soon</em>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Distance</h2>
              <div className={styles.lapRow}>
                {LAP_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`${styles.lapBtn} ${state.raceSettings.totalLaps === n ? styles.lapBtnActive : ""}`}
                    onClick={withUnlock(() => setLaps(n))}
                  >
                    {n}
                    <span className={styles.lapBtnSub}>laps</span>
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Grid size</h2>
              <p className={styles.panelHint}>
                {MIN_PLAYERS}–{MAX_PLAYERS} drivers on track
              </p>
              <div className={styles.gridSizeRow}>
                {GRID_SIZE_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`${styles.gridSizeBtn} ${playerCount === n ? styles.gridSizeBtnActive : ""}`}
                    onClick={withUnlock(() => setPlayerCount(n))}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </section>

            <LobbyGuide />

            <div className={styles.setupSummary}>
              <span>{selectedTrack.name}</span>
              <span>·</span>
              <span>{state.raceSettings.totalLaps} laps</span>
              <span>·</span>
              <span>{playerCount} drivers</span>
            </div>
          </div>
        )}

        {step === "grid" && (
          <div className={styles.gridPane}>
            <div className={styles.gridLayout}>
              <section className={styles.panel}>
                <div className={styles.gridHeader}>
                  <h2 className={styles.panelTitle}>Starting grid</h2>
                  <span className={styles.gridProgress}>
                    {assignedCount}/{playerCount} assigned
                  </span>
                </div>

                <div
                  className={styles.slotGrid}
                  data-count={playerCount}
                >
                  {lobbyPlayers.map((player) => {
                    const driver = player.driverId
                      ? getDriverById(player.driverId)
                      : null;
                    const isActive = activeSlot === player.slot;

                    return (
                      <button
                        key={player.slot}
                        type="button"
                        className={`${styles.slot} ${isActive ? styles.slotActive : ""} ${player.ready ? styles.slotReady : ""} ${driver ? styles.slotFilled : ""}`}
                        onClick={withUnlock(() => {
                          setActiveSlot(player.slot);
                          if (player.driverId) setPreviewDriverId(player.driverId);
                        })}
                      >
                        <span className={styles.slotLabel}>
                          P{player.slot + 1}
                          {player.type === "ai" && (
                            <span className={styles.aiTag}>AI</span>
                          )}
                        </span>

                        {driver ? (
                          <>
                            <DriverPortrait driverId={driver.id} size="sm" />
                            <span
                              className={styles.slotName}
                              style={{ color: driver.color }}
                            >
                              {driver.name}
                            </span>
                          </>
                        ) : (
                          <div className={styles.emptyPortrait}>+</div>
                        )}

                        {driver && (
                          <span
                            role="switch"
                            aria-checked={player.ready}
                            className={`${styles.readyBadge} ${player.ready ? styles.readyOn : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              withUnlock(toggleReadyForSlot)(player.slot);
                            }}
                          >
                            {player.ready ? "Ready" : "Tap ready"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className={styles.panel}>
                <h2 className={styles.panelTitle}>
                  Driver for{" "}
                  <span
                    style={{
                      color: activePlayer?.driverId
                        ? getDriverById(activePlayer.driverId)?.color
                        : "#ff3366",
                    }}
                  >
                    P{(activeSlot ?? 0) + 1}
                  </span>
                </h2>

                <div className={styles.driverPickList}>
                  {DRIVERS.map((driver) => {
                    const taken = isDriverTaken(
                      driver.id,
                      lobbyPlayers,
                      activeSlot
                    );
                    const isSelected = activePlayer?.driverId === driver.id;

                    return (
                      <button
                        key={driver.id}
                        type="button"
                        disabled={taken}
                        className={`${styles.driverPick} ${isSelected ? styles.driverPickSelected : ""} ${taken ? styles.driverPickTaken : ""}`}
                        style={{ "--driver-color": driver.color }}
                        onClick={withUnlock(() => {
                          selectDriverForSlot(activeSlot, driver.id);
                          setPreviewDriverId(driver.id);
                        })}
                        onMouseEnter={() => setPreviewDriverId(driver.id)}
                        onFocus={() => setPreviewDriverId(driver.id)}
                      >
                        <DriverPortrait driverId={driver.id} size="md" />
                        <div className={styles.driverPickMeta}>
                          <strong>{driver.name}</strong>
                          <span>{driver.archetype}</span>
                          <span className={styles.driverPickPerk}>
                            {driver.perk.label}
                          </span>
                        </div>
                        {taken && <span className={styles.takenLabel}>Taken</span>}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            <DriverDetailPanel driverId={detailDriverId} />

            {allAssigned && !allReady && (
              <p className={styles.hint}>
                All slots filled — use <strong>Ready All</strong> or tap each badge.
              </p>
            )}
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        {step === "setup" ? (
          <>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={goToGrid}
            >
              Next: Pick drivers →
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => setStep("setup")}
            >
              ← Setup
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={withUnlock(fillAi)}
            >
              Fill AI
            </button>
            {allAssigned && !allReady && (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={withUnlock(readyAll)}
              >
                Ready All
              </button>
            )}
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={!canStart}
              onClick={withUnlock(startRace)}
            >
              Lights Out →
            </button>
          </>
        )}
      </footer>
    </div>
  );
}
