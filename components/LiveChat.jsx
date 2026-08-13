"use client";

import { useEffect, useRef, useState } from "react";
import { VIEWER_BASE } from "@/lib/viewerCount";
import styles from "./LiveChat.module.css";

/**
 * @param {{
 *   messages: { id: string, text: string, gif?: string | null, event?: string }[],
 *   viewerCount?: number,
 *   hideHeader?: boolean,
 *   className?: string,
 * }} props
 */
export default function LiveChat({
  messages,
  viewerCount = VIEWER_BASE,
  hideHeader = false,
  className = "",
}) {
  const listRef = useRef(null);
  const targetRef = useRef(viewerCount);
  const [displayCount, setDisplayCount] = useState(viewerCount);
  const [trend, setTrend] = useState("flat");

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (viewerCount > targetRef.current) setTrend("up");
    else if (viewerCount < targetRef.current) setTrend("down");
    targetRef.current = viewerCount;
  }, [viewerCount]);

  useEffect(() => {
    const id = setInterval(() => {
      setDisplayCount((prev) => {
        const target = targetRef.current;
        const diff = target - prev;
        if (diff === 0) return prev;
        if (Math.abs(diff) <= 2) {
          if (prev === target) setTrend("flat");
          return target;
        }
        const step = Math.max(
          Math.abs(diff) > 400 ? 180 : 1,
          Math.round(Math.abs(diff) * 0.42)
        );
        return prev + Math.sign(diff) * step;
      });
    }, 40);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (displayCount === targetRef.current) {
      const t = setTimeout(() => setTrend("flat"), 900);
      return () => clearTimeout(t);
    }
  }, [displayCount]);

  return (
    <div className={`${styles.panel} ${className}`.trim()}>
      {!hideHeader && (
        <div className={styles.header}>
          <span>Live Chat</span>
          <span
            className={`${styles.viewerCount} ${trend === "up" ? styles.viewerUp : ""} ${trend === "down" ? styles.viewerDown : ""}`}
          >
            {displayCount.toLocaleString()} watching
          </span>
        </div>
      )}
      <ul ref={listRef} className={styles.list}>
        {messages.length === 0 && (
          <li className={styles.empty}>Waiting for race action…</li>
        )}
        {messages.map((m) => (
          <li
            key={m.id}
            className={`${styles.line} ${m.gif ? styles.lineWithGif : ""} ${m.event === "spectator" ? styles.spectator : ""}`}
          >
            <p className={styles.text}>{m.text}</p>
            {m.gif && (
              <img src={m.gif} alt="" className={styles.gif} loading="lazy" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
