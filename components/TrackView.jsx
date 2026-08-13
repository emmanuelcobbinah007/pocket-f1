"use client";

import { useEffect, useState } from "react";
import { getDriverById } from "@/lib/drivers";
import { getTrack, DEFAULT_TRACK_ID, getTrackCarSize } from "@/lib/tracks";
import { getTrackRuntime } from "@/lib/trackPath";
import styles from "./TrackView.module.css";

/**
 * @param {{
 *   drivers: { driverId: string, position: number, lap?: number }[],
 *   trackId?: string,
 *   showBackground?: boolean,
 *   carSize?: number,
 *   debugPath?: boolean,
 * }} props
 */
export default function TrackView({
  drivers,
  trackId = DEFAULT_TRACK_ID,
  showBackground = true,
  carSize: carSizeProp,
  debugPath,
}) {
  const track = getTrack(trackId);
  const runtime = getTrackRuntime(track);
  const { width, height } = track.viewBox;
  const carSize = carSizeProp ?? getTrackCarSize(track);
  const half = carSize / 2;
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (debugPath != null) {
      setShowDebug(debugPath);
      return;
    }
    setShowDebug(
      typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).has("debugTrack")
    );
  }, [debugPath]);

  return (
    <div
      className={styles.wrap}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={styles.svg}
        aria-hidden
      >
        {showBackground && (
          <image
            href={track.backgroundUrl}
            width={width}
            height={height}
            className={styles.bg}
          />
        )}
        {showDebug && (
          <path
            d={runtime.svgPath}
            fill="none"
            stroke="#ff3366"
            strokeWidth={12}
            strokeOpacity={0.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {drivers.map((entry) => {
          const driver = getDriverById(entry.driverId);
          if (!driver) return null;

          const progress = (entry.lap ?? 0) + entry.position;
          const { x, y } = runtime.getPositionOnTrack(progress);

          return (
            <g key={entry.driverId} transform={`translate(${x}, ${y})`}>
              <image
                href={driver.carSpriteUrl}
                x={-half}
                y={-half}
                width={carSize}
                height={carSize}
                className={styles.carImg}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
