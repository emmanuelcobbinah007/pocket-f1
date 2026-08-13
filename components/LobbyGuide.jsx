"use client";

import { useState } from "react";
import { TIRES } from "@/lib/tires";
import {
  HOW_TO_PLAY,
  F1_BASICS,
  TIRE_GUIDE,
  WEAR_TIP,
} from "@/lib/gameGuide";
import styles from "./LobbyGuide.module.css";

const TABS = [
  { id: "play", label: "How to Play" },
  { id: "tyres", label: "Tyres" },
  { id: "f1", label: "F1 101" },
];

export default function LobbyGuide() {
  const [activeTab, setActiveTab] = useState("play");
  const [open, setOpen] = useState(false);

  return (
    <section className={styles.guide}>
      <button
        type="button"
        className={styles.guideToggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={styles.guideToggleLabel}>Race Guide</span>
        <span className={styles.guideToggleHint}>
          {open ? "Hide" : "Show"} rules, tyres & F1 basics
        </span>
      </button>

      {open && (
        <div className={styles.guideBody}>
          <div className={styles.tabs} role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.tabPanel}>
            {activeTab === "play" && (
              <ul className={styles.list}>
                {HOW_TO_PLAY.map((item) => (
                  <li key={item.title} className={styles.listItem}>
                    <strong className={styles.itemTitle}>{item.title}</strong>
                    <p className={styles.itemBody}>{item.body}</p>
                  </li>
                ))}
              </ul>
            )}

            {activeTab === "tyres" && (
              <div className={styles.tyrePanel}>
                <div className={styles.tyreCards}>
                  {TIRE_GUIDE.map((t) => {
                    const key = t.compound.toLowerCase();
                    const info = TIRES[key];
                    return (
                      <div key={t.compound} className={styles.tyreCard}>
                        {info && (
                          <img
                            src={info.iconUrl}
                            alt=""
                            className={styles.tyreIcon}
                            draggable={false}
                          />
                        )}
                        <span
                          className={styles.tyreName}
                          style={{ color: t.color }}
                        >
                          {t.compound}
                        </span>
                        <span className={styles.tyreTag}>{t.tagline}</span>
                        <p className={styles.tyrePros}>
                          <span className={styles.tyreTagLabel}>Upside</span>
                          {t.pros}
                        </p>
                        <p className={styles.tyreCons}>
                          <span className={styles.tyreTagLabel}>Downside</span>
                          {t.cons}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <p className={styles.wearTip}>{WEAR_TIP}</p>
              </div>
            )}

            {activeTab === "f1" && (
              <ul className={styles.list}>
                {F1_BASICS.map((item) => (
                  <li key={item.title} className={styles.listItem}>
                    <strong className={styles.itemTitle}>{item.title}</strong>
                    <p className={styles.itemBody}>{item.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
