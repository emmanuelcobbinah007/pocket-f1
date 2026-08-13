"use client";

import { useGame } from "./GameProvider";
import { unlockAndPlayMenu } from "@/lib/audio";
import SoundToggle from "./SoundToggle";
import styles from "./TitleScreen.module.css";

export default function TitleScreen() {
  const { state, dispatch } = useGame();

  const handleStart = async () => {
    if (state.soundEnabled) {
      await unlockAndPlayMenu();
    }
    dispatch({ type: "ENTER_LOBBY" });
  };

  return (
    <div className={styles.screen}>
      <div className={styles.topBar}>
        <SoundToggle />
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>Pocket F1</h1>
        <p className={styles.tagline}>Figure-9 chaos. Four drivers. One podium.</p>
        <p className={styles.sub}>Retro party racing — 3 to 5 minutes of mayhem.</p>

        <button type="button" className={styles.startBtn} onClick={handleStart}>
          Start
        </button>

        <p className={styles.hint}>
          {state.soundEnabled
            ? "Click Start — menu music plays after your first tap"
            : "Sound is off — use the toggle above to enable music"}
        </p>
      </div>

      <div className={styles.decor}>
        <span className={styles.stripe} />
        <span className={styles.stripe} />
        <span className={styles.stripe} />
      </div>
    </div>
  );
}
