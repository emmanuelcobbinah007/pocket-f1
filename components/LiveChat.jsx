"use client";

import { useEffect, useRef } from "react";
import styles from "./LiveChat.module.css";

/**
 * @param {{
 *   messages: { id: string, text: string, gif?: string | null }[],
 *   hideHeader?: boolean,
 *   className?: string,
 * }} props
 */
export default function LiveChat({ messages, hideHeader = false, className = "" }) {
  const listRef = useRef(null);
  const viewerCount = 8420 + (messages.length % 17) * 137;

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div className={`${styles.panel} ${className}`.trim()}>
      {!hideHeader && (
        <div className={styles.header}>
          <span>Live Chat</span>
          <span className={styles.viewerCount}>
            {viewerCount.toLocaleString()} watching
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
