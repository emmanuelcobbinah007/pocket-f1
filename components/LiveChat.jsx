"use client";

import { useEffect, useRef } from "react";
import styles from "./LiveChat.module.css";

/**
 * @param {{
 *   messages: { id: string, text: string, gif?: string | null }[],
 * }} props
 */
export default function LiveChat({ messages }) {
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>Live Chat</div>
      <ul ref={listRef} className={styles.list}>
        {messages.length === 0 && (
          <li className={styles.empty}>Waiting for race action…</li>
        )}
        {messages.map((m) => (
          <li
            key={m.id}
            className={`${styles.line} ${m.gif ? styles.lineWithGif : ""}`}
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
