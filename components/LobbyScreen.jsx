"use client";

import { useState } from "react";
import { DRIVERS, getDriverById, isDriverTaken } from "@/lib/drivers";
import { TRACKS } from "@/lib/tracks";
import { LAP_OPTIONS } from "@/lib/constants";
import { useGame, useGameActions } from "./GameProvider";
import { unlockAudio } from "@/lib/audio";
import DriverPortrait from "./DriverPortrait";
import DriverDetailPanel from "./DriverDetailPanel";
import LobbyGuide from "./LobbyGuide";
import SoundToggle from "./SoundToggle";
import styles from "./LobbyScreen.module.css";

function useAudioUnlock() {
  return () => unlockAudio();
}

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
    canStart,
  } = useGameActions();
  const unlock = useAudioUnlock();
  const [activeSlot, setActiveSlot] = useState(0);
  const [previewDriverId, setPreviewDriverId] = useState(null);

  const activePlayer = state.players[activeSlot];
  const assignedCount = state.players.filter((p) => p.driverId).length;
  const allAssigned = assignedCount === 4;
  const allReady = state.players.filter((p) => p.driverId).every((p) => p.ready);

  const detailDriverId =
    previewDriverId ?? activePlayer?.driverId ?? DRIVERS[0]?.id ?? null;

  const withUnlock = (fn) => (...args) => {
    unlock();
    fn(...args);
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Pocket F1</h1>
            <p className={styles.subtitle}>
              Pick your drivers · read the guide · ready up · race
            </p>
          </div>
          <SoundToggle />
        </div>
      </header>

      <section className={styles.raceSetup}>
        <h2 className={styles.sectionLabel}>Race setup</h2>
        <div className={styles.setupGrid}>
          <div className={styles.setupBlock}>
            <span className={styles.setupLabel}>Circuit</span>
            <div className={styles.trackList}>
              {TRACKS.map((track) => {
                const selected = state.raceSettings.trackId === track.id;
                const locked = track.available === false;
                return (
                  <button
                    key={track.id}
                    type="button"
                    disabled={locked}
                    className={`${styles.trackOption} ${selected ? styles.trackOptionActive : ""} ${locked ? styles.trackOptionLocked : ""}`}
                    onClick={withUnlock(() => setTrack(track.id))}
                  >
                    <strong>{track.name}</strong>
                    <span>{track.tagline}</span>
                    {locked && <em>Coming soon</em>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className={styles.setupBlock}>
            <span className={styles.setupLabel}>Distance</span>
            <div className={styles.lapRow}>
              {LAP_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`${styles.lapBtn} ${state.raceSettings.totalLaps === n ? styles.lapBtnActive : ""}`}
                  onClick={withUnlock(() => setLaps(n))}
                >
                  {n} laps
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.slots}>
        <h2 className={styles.sectionLabel}>Players</h2>
        <div className={styles.slotGrid}>
          {state.players.map((player) => {
            const driver = player.driverId
              ? getDriverById(player.driverId)
              : null;
            const isActive = activeSlot === player.slot;

            return (
              <button
                key={player.slot}
                type="button"
                className={`${styles.slot} ${isActive ? styles.slotActive : ""} ${player.ready ? styles.slotReady : ""}`}
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
                    <span className={styles.slotName} style={{ color: driver.color }}>
                      {driver.name}
                    </span>
                  </>
                ) : (
                  <div className={styles.emptyPortrait}>?</div>
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
                    {player.ready ? "READY" : "NOT READY"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.drivers}>
        <h2 className={styles.sectionLabel}>
          Select driver for{" "}
          <span
            style={{
              color: activePlayer?.driverId
                ? getDriverById(activePlayer.driverId)?.color
                : "#ff3366",
            }}
          >
            P{activeSlot + 1}
          </span>
        </h2>

        <div className={styles.driverGrid}>
          {DRIVERS.map((driver) => {
            const taken = isDriverTaken(driver.id, state.players, activeSlot);
            const isSelected = activePlayer?.driverId === driver.id;
            const isPreview = detailDriverId === driver.id;

            return (
              <button
                key={driver.id}
                type="button"
                disabled={taken}
                className={`${styles.driverCard} ${isSelected ? styles.driverSelected : ""} ${isPreview ? styles.driverPreview : ""} ${taken ? styles.driverTaken : ""}`}
                style={{ "--driver-color": driver.color }}
                onClick={withUnlock(() => {
                  selectDriverForSlot(activeSlot, driver.id);
                  setPreviewDriverId(driver.id);
                })}
                onMouseEnter={() => setPreviewDriverId(driver.id)}
                onFocus={() => setPreviewDriverId(driver.id)}
              >
                <DriverPortrait driverId={driver.id} size="lg" />
                <div className={styles.driverInfo}>
                  <strong className={styles.driverName}>{driver.name}</strong>
                  <span className={styles.archetype}>{driver.archetype}</span>
                  <span className={styles.traitsCompact}>{driver.perk.label}</span>
                  <div className={styles.traits}>
                    <span className={styles.perk}>
                      <span className={styles.traitTag}>Perk</span>
                      {driver.perk.label}
                    </span>
                    <span className={styles.jerk}>
                      <span className={styles.traitTag}>Jerk</span>
                      {driver.jerk.label}
                    </span>
                  </div>
                </div>
                {taken && <span className={styles.takenLabel}>Taken</span>}
              </button>
            );
          })}
        </div>
      </section>

      <DriverDetailPanel driverId={detailDriverId} />

      <LobbyGuide />

      {allAssigned && !allReady && (
        <p className={styles.hint}>
          All slots filled — hit <strong>Ready All</strong> or tap each player&apos;s badge.
        </p>
      )}

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={withUnlock(fillAi)}
        >
          Fill AI Slots
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
      </footer>
    </div>
  );
}
