"use client";

import { useCallback, useRef, useState } from "react";
import { POCKET_RING, HARBOR_LOOP, SUMMIT_SWITCH } from "@/lib/tracks";
import { buildSvgPath } from "@/lib/trackPath";
import styles from "./page.module.css";

const EDITOR_TRACKS = [POCKET_RING, HARBOR_LOOP, SUMMIT_SWITCH];

export default function TrackEditorPage() {
  const [trackId, setTrackId] = useState(SUMMIT_SWITCH.id);
  const track =
    EDITOR_TRACKS.find((t) => t.id === trackId) ?? SUMMIT_SWITCH;
  const { viewBox, backgroundUrl, name } = track;
  const { width, height } = viewBox;
  const trackKey = track.id
    .split("-")
    .map((part) => part.toUpperCase())
    .join("_");

  const overlayRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [copied, setCopied] = useState(false);

  const switchTrack = (id) => {
    setTrackId(id);
    setPoints([]);
    setCopied(false);
  };

  const toTrackCoords = useCallback(
    (clientX, clientY) => {
      const el = overlayRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      return {
        x: Math.round(
          Math.max(0, Math.min(width, ((clientX - rect.left) / rect.width) * width))
        ),
        y: Math.round(
          Math.max(0, Math.min(height, ((clientY - rect.top) / rect.height) * height))
        ),
      };
    },
    [width, height]
  );

  const handleClick = (e) => {
    const coord = toTrackCoords(e.clientX, e.clientY);
    if (!coord) return;
    setPoints((prev) => [...prev, coord]);
    console.log(`{ x: ${coord.x}, y: ${coord.y} },`);
  };

  const handleUndo = () => setPoints((prev) => prev.slice(0, -1));
  const handleClear = () => setPoints([]);

  const exportText =
    `// Paste into lib/tracks.js → ${trackKey}.waypoints\n` +
    "waypoints: [\n" +
    points.map((p) => `  { x: ${p.x}, y: ${p.y} },`).join("\n") +
    "\n],";

  const copyExport = async () => {
    await navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pathD = points.length >= 2 ? buildSvgPath(points) : "";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Track path editor</h1>
        <p>
          Click the centerline in driving order (start/finish first). Copy output
          into <code>lib/tracks.js</code> under the selected track&apos;s{" "}
          <code>waypoints</code> array.
        </p>

        <div className={styles.trackPicker}>
          {EDITOR_TRACKS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`${styles.trackBtn} ${t.id === trackId ? styles.trackBtnActive : ""}`}
              onClick={() => switchTrack(t.id)}
            >
              {t.name}
              {t.available === false && (
                <span className={styles.trackBtnTag}>trace me</span>
              )}
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={handleUndo} disabled={!points.length}>
            Undo
          </button>
          <button type="button" onClick={handleClear} disabled={!points.length}>
            Clear
          </button>
          <button type="button" onClick={copyExport} disabled={points.length < 3}>
            {copied ? "Copied!" : "Copy waypoints"}
          </button>
          <span className={styles.count}>
            {name} · {width}×{height} · {points.length} points
          </span>
        </div>
      </header>

      <div
        className={styles.canvasWrap}
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={backgroundUrl}
          alt={`${name} track map`}
          className={styles.trackImg}
          draggable={false}
          onError={(e) => {
            console.warn("Track image failed to load:", backgroundUrl);
          }}
        />
        <svg
          ref={overlayRef}
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          className={styles.overlay}
          preserveAspectRatio="none"
          onClick={handleClick}
        >
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#ff3366"
              strokeWidth={10}
              strokeOpacity={0.85}
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
            />
          )}
          {points.map((p, i) => (
            <g key={`${p.x}-${p.y}-${i}`} pointerEvents="none">
              <circle
                cx={p.x}
                cy={p.y}
                r={i === 0 ? 14 : 8}
                fill={i === 0 ? "#00ff88" : "#ffdd00"}
                stroke="#000"
                strokeWidth={2}
              />
              <text
                x={p.x + 12}
                y={p.y - 8}
                fill="#fff"
                fontSize={22}
                stroke="#000"
                strokeWidth={3}
                paintOrder="stroke"
              >
                {i}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {points.length > 0 && (
        <pre className={styles.output}>{exportText}</pre>
      )}
    </div>
  );
}
