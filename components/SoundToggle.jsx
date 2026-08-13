"use client";

import { useGame, useGameActions } from "./GameProvider";
import styles from "./SoundToggle.module.css";

export default function SoundToggle({ className = "" }) {
  const { state } = useGame();
  const { toggleSound } = useGameActions();
  const on = state.soundEnabled;

  return (
    <button
      type="button"
      className={`${styles.toggle} ${on ? styles.on : styles.off} ${className}`}
      onClick={toggleSound}
      aria-pressed={on}
      aria-label={on ? "Sound on — click to mute" : "Sound off — click to unmute"}
      title={on ? "Mute sound" : "Unmute sound"}
    >
      <span className={styles.icon} aria-hidden>
        {on ? "🔊" : "🔇"}
      </span>
      <span className={styles.label}>{on ? "Sound on" : "Sound off"}</span>
    </button>
  );
}
