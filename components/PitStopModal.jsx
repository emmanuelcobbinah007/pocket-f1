"use client";

import { TIRES } from "@/lib/tires";
import styles from "./PitStopModal.module.css";

/**
 * @param {{ onPick: (compound: string) => void, onCancel: () => void }} props
 */
export default function PitStopModal({ onPick, onCancel }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Pit Stop</h2>
        <p>Pick fresh rubber:</p>
        <div className={styles.btns}>
          {Object.entries(TIRES).map(([key, tire]) => (
            <button
              key={key}
              type="button"
              className={styles.btn}
              onClick={() => onPick(key)}
            >
              <img src={tire.iconUrl} alt="" className={styles.icon} />
              {tire.label}
            </button>
          ))}
        </div>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          Stay Out
        </button>
      </div>
    </div>
  );
}
