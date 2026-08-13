"use client";

import { useState } from "react";
import { getDriverById } from "@/lib/drivers";
import styles from "./DriverPortrait.module.css";

/**
 * Portrait placeholder — colored block until sprite WebP is available.
 * @param {{ driverId: string, size?: 'sm' | 'md' | 'lg' }} props
 */
export default function DriverPortrait({ driverId, size = "md" }) {
  const driver = getDriverById(driverId);
  const [imgFailed, setImgFailed] = useState(false);

  if (!driver) return null;

  const showImage = !imgFailed;

  return (
    <div
      className={`${styles.portrait} ${styles[size]}`}
      style={{
        backgroundColor: driver.color,
        borderColor: driver.color,
      }}
    >
      {showImage ? (
        <img
          src={driver.spriteUrl}
          alt={driver.name}
          className={styles.img}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className={styles.initial}>{driver.name[0]}</span>
      )}
    </div>
  );
}
