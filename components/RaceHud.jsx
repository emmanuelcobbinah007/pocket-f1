"use client";

import DriverPortrait from "./DriverPortrait";
import { getDriverById } from "@/lib/drivers";
import { TIRES, WEAR_CLIFF_THRESHOLD } from "@/lib/tires";
import styles from "./RaceHud.module.css";

/**
 * @param {{
 *   driverId: string,
 *   racePosition: number,
 *   gapLabel: string,
 *   lap: number,
 *   lapProgress: number,
 *   tire: import("@/lib/tires").TireCompound,
 *   wear: number,
 *   pitting: boolean,
 *   dnf: boolean,
 *   spinning: boolean,
 *   boosting: boolean,
 *   safetyCar: boolean,
 *   finished: boolean,
 *   totalLaps: number,
 *   canPit: boolean,
 *   onPit: () => void,
 *   onQuit: () => void,
 * }} props
 */
export default function RaceHud({
  driverId,
  racePosition,
  gapLabel,
  lap,
  lapProgress,
  tire,
  wear,
  pitting,
  dnf,
  spinning,
  boosting,
  safetyCar,
  finished,
  totalLaps,
  canPit,
  onPit,
  onQuit,
}) {
  const driver = getDriverById(driverId);
  const tireInfo = TIRES[tire];
  const wearPct = Math.round(wear * 100);
  const progressPct = Math.round(Math.max(0, Math.min(1, lapProgress)) * 100);

  let wearColor = "#3fb950";
  if (wear >= WEAR_CLIFF_THRESHOLD) wearColor = "#f85149";
  else if (wear >= 0.5) wearColor = "#d29922";

  return (
    <div className={styles.hud}>
      <div className={styles.topRow}>
        <DriverPortrait driverId={driverId} size="lg" />

        <div className={styles.driverInfo}>
          <div className={styles.nameRow}>
            <span className={styles.driverName} style={{ color: driver?.color }}>
              {driver?.name ?? "Driver"}
            </span>
            <span className={styles.posBadge}>P{racePosition}</span>
          </div>
          <span className={styles.gapLabel}>{gapLabel}</span>

          <div className={styles.lapBlock}>
            <span className={styles.lapLabel}>LAP</span>
            <span className={styles.lapNumbers}>
              <span className={styles.lapCurrent}>{lap}</span>
              <span className={styles.lapSep}>/</span>
              <span className={styles.lapTotal}>{totalLaps}</span>
            </span>
          </div>
        </div>
      </div>

      <div className={styles.progressBlock}>
        <div className={styles.progressHeader}>
          <span>Lap progress</span>
          <span>{progressPct}%</span>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPct}%`, backgroundColor: driver?.color }}
          />
        </div>
      </div>

      <div className={styles.tireBlock}>
        <img
          src={tireInfo.iconUrl}
          alt=""
          className={styles.tireIcon}
          draggable={false}
        />
        <div className={styles.tireDetails}>
          <div className={styles.tireHeader}>
            <span className={styles.tireCompound}>{tireInfo.label}</span>
            <span className={styles.tireWear} style={{ color: wearColor }}>
              {wearPct}% wear
            </span>
          </div>
          <div className={styles.wearTrack}>
            <div
              className={styles.wearFill}
              style={{ width: `${wearPct}%`, backgroundColor: wearColor }}
            />
          </div>
          {wear >= WEAR_CLIFF_THRESHOLD && (
            <span className={styles.cliffWarn}>Tyres past cliff — pace loss!</span>
          )}
        </div>
      </div>

      <div className={styles.statusRow}>
        {dnf && <span className={styles.chipOut}>RETIRED</span>}
        {pitting && <span className={styles.chipPit}>IN PIT</span>}
        {spinning && <span className={styles.chipSpin}>SPIN</span>}
        {boosting && <span className={styles.chipBoost}>FLOW STATE</span>}
        {safetyCar && <span className={styles.chipSc}>SAFETY CAR</span>}
        {finished && !dnf && <span className={styles.chipDone}>FINISHED</span>}
        {!dnf && !pitting && !spinning && !boosting && !safetyCar && !finished && (
          <span className={styles.chipOk}>On track</span>
        )}
      </div>

      <div className={styles.controls}>
        {canPit && (
          <button
            type="button"
            className={styles.pitBtn}
            disabled={pitting}
            onClick={onPit}
          >
            Box Box — Pit Stop
          </button>
        )}
        <button type="button" className={styles.quitBtn} onClick={onQuit}>
          Quit Race
        </button>
      </div>
    </div>
  );
}
