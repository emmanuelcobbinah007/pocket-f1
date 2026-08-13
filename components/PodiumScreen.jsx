"use client";

import { useMemo } from "react";
import { useGame, useGameActions } from "./GameProvider";
import { getDriverById } from "@/lib/drivers";
import { pickGifForEvent } from "@/lib/gifs";
import { getTrack } from "@/lib/tracks";
import DriverPortrait from "./DriverPortrait";
import styles from "./PodiumScreen.module.css";

const PODIUM_ORDER = [2, 1, 3];

const MEDAL = {
  1: { label: "Winner", className: styles.gold },
  2: { label: "P2", className: styles.silver },
  3: { label: "P3", className: styles.bronze },
};

function driverCode(name) {
  return name.slice(0, 3).toUpperCase();
}

export default function PodiumScreen() {
  const { state } = useGame();
  const { reset } = useGameActions();

  if (!state.race?.results.length) return null;

  const results = state.race.results;
  const top3 = results.filter((r) => r.position <= 3);
  const rest = results.filter((r) => r.position > 3);
  const winner = top3.find((r) => r.position === 1);
  const winnerDriver = winner ? getDriverById(winner.driverId) : null;
  const podiumGif = useMemo(() => pickGifForEvent("podium"), []);
  const track = getTrack(state.race?.trackId ?? state.raceSettings.trackId);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.chequeredStrip} aria-hidden />
        <h1>Podium</h1>
        <p className={styles.sub}>{track.name} — Race Complete</p>
      </header>

      <div className={styles.body}>
        <div className={styles.podiumWrap}>
          <div className={styles.podium}>
            {PODIUM_ORDER.map((place) => {
              const entry = top3.find((r) => r.position === place);
              if (!entry) return null;
              const driver = getDriverById(entry.driverId);
              const medal = MEDAL[place];
              const heightClass =
                place === 1
                  ? styles.first
                  : place === 2
                    ? styles.second
                    : styles.third;

              return (
                <div key={entry.driverId} className={styles.standWrap}>
                  <div
                    className={`${styles.stand} ${heightClass} ${medal.className}`}
                    style={{ "--driver-color": driver?.color }}
                  >
                    <span className={styles.place}>P{place}</span>
                    <DriverPortrait
                      driverId={entry.driverId}
                      size={place === 1 ? "lg" : "md"}
                    />
                    <span
                      className={styles.driverBadge}
                      style={{ backgroundColor: driver?.color }}
                    >
                      {driver ? driverCode(driver.name) : "???"}
                    </span>
                    <span
                      className={styles.driverName}
                      style={{ color: driver?.color }}
                    >
                      {driver?.name}
                    </span>
                    {place === 1 && (
                      <span className={styles.winnerTag}>{medal.label}</span>
                    )}
                  </div>
                  <div className={`${styles.plinth} ${medal.className}`} />
                </div>
              );
            })}
          </div>
        </div>

        <aside className={styles.sidePanel}>
          {winnerDriver && (
            <div className={styles.winnerCard}>
              <span className={styles.winnerCardLabel}>Race Winner</span>
              <DriverPortrait driverId={winner.driverId} size="lg" />
              <span
                className={styles.winnerCardName}
                style={{ color: winnerDriver.color }}
              >
                {winnerDriver.name}
              </span>
              <img
                src={podiumGif ?? "/gifs/celebrate.gif"}
                alt=""
                className={styles.celebrateGif}
              />
            </div>
          )}

          {rest.length > 0 && (
            <div className={styles.resultsCard}>
              <span className={styles.resultsTitle}>Final Classification</span>
              <ul className={styles.rest}>
                {rest.map((entry) => {
                  const d = getDriverById(entry.driverId);
                  return (
                    <li key={entry.driverId} className={styles.restRow}>
                      <span className={styles.restPos}>P{entry.position}</span>
                      <span
                        className={styles.restBadge}
                        style={{ backgroundColor: d?.color }}
                      >
                        {d ? driverCode(d.name) : "???"}
                      </span>
                      <span className={styles.restName}>{d?.name}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>
      </div>

      <footer className={styles.footer}>
        <button type="button" className={styles.btn} onClick={reset}>
          Back to Lobby
        </button>
      </footer>
    </div>
  );
}
