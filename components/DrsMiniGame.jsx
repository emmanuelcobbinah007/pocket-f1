"use client";

import { useEffect, useCallback, useRef } from "react";
import { getDriverById } from "@/lib/drivers";
import styles from "./DrsMiniGame.module.css";

/**
 * @param {{
 *   challenge: { attackerId: string, defenderId: string, windowMs: number },
 *   onResult: (success: boolean) => void,
 * }} props
 */
export default function DrsMiniGame({ challenge, onResult }) {
  const resolved = useRef(false);
  const attacker = getDriverById(challenge.attackerId);
  const defender = getDriverById(challenge.defenderId);

  const finish = useCallback(
    (success) => {
      if (resolved.current) return;
      resolved.current = true;
      onResult(success);
    },
    [onResult]
  );

  useEffect(() => {
    const failTimer = setTimeout(() => finish(false), challenge.windowMs);
    const onKey = (e) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        clearTimeout(failTimer);
        finish(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(failTimer);
      window.removeEventListener("keydown", onKey);
    };
  }, [challenge.windowMs, finish]);

  return (
    <div className={styles.overlay} onClick={() => finish(true)} role="button" tabIndex={0}>
      <div className={styles.box}>
        <span className={styles.label}>DRS ZONE</span>
        <h2 className={styles.title}>Overtake {defender?.name}!</h2>
        <p className={styles.prompt}>TAP or press SPACE</p>
        <div className={styles.barTrack}>
          <div
            className={styles.barFill}
            style={{ animationDuration: `${challenge.windowMs}ms` }}
          />
        </div>
        <span className={styles.attacker} style={{ color: attacker?.color }}>
          {attacker?.name}
        </span>
      </div>
    </div>
  );
}
