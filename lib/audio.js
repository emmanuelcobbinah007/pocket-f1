/**
 * Audio — must start playback inside a user click handler (browser policy).
 * Call unlockAndPlayMenu() directly from Start button onClick.
 *
 * Uses MP3 files from public/audio/ when present; falls back to synth per track/sfx.
 */

import { AUDIO_PATHS } from "./audioPaths";
import {
  playSynthSfx,
  resumeSynthContext,
  startSynthMenu,
  startSynthRace,
  stopSynthMusic,
} from "./audioSynth";

/** @type {HTMLAudioElement | null} */
let menuTrack = null;
/** @type {HTMLAudioElement | null} */
let raceTrack = null;
let audioUnlocked = false;
let soundEnabled = true;

/** @type {{ menu?: boolean, race?: boolean, sfx: Record<string, boolean> }} */
const mp3Available = { sfx: {} };
const warned = new Set();

export function applySoundEnabled(enabled) {
  soundEnabled = enabled;
  if (!enabled) stopAllMusic();
}

export function isSoundEnabled() {
  return soundEnabled;
}

function canPlay() {
  return soundEnabled && typeof window !== "undefined";
}

/** @param {string} src */
function createAudio(src) {
  const audio = new Audio(src);
  audio.preload = "auto";
  return audio;
}

/** @param {string} url */
async function fileExists(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) return false;
    const type = res.headers.get("content-type") || "";
    return type.includes("audio") || type.includes("mpeg") || url.endsWith(".mp3");
  } catch {
    return false;
  }
}

async function hasMenuMp3() {
  if (mp3Available.menu === undefined) {
    mp3Available.menu = await fileExists(AUDIO_PATHS.menu);
    if (mp3Available.menu) {
      console.info("[Pocket F1] Menu music:", AUDIO_PATHS.menu);
    }
  }
  return mp3Available.menu;
}

async function hasRaceMp3() {
  if (mp3Available.race === undefined) {
    mp3Available.race = await fileExists(AUDIO_PATHS.race);
    if (!mp3Available.race && !warned.has("race")) {
      warned.add("race");
      console.info(
        "[Pocket F1] No race loop MP3 — synth race music until you add",
        AUDIO_PATHS.race
      );
    }
  }
  return mp3Available.race;
}

/** @param {keyof typeof AUDIO_PATHS.sfx} name */
async function hasSfxMp3(name) {
  if (mp3Available.sfx[name] === undefined) {
    const src = AUDIO_PATHS.sfx[name];
    mp3Available.sfx[name] = src ? await fileExists(src) : false;
  }
  return mp3Available.sfx[name];
}

/** @param {HTMLAudioElement} audio */
async function safePlay(audio) {
  try {
    await audio.play();
    return true;
  } catch (err) {
    if (!warned.has(audio.src)) {
      warned.add(audio.src);
      console.warn("[Pocket F1] Could not play:", audio.src, "—", err.message);
    }
    return false;
  }
}

async function playMenuMp3() {
  if (!menuTrack) menuTrack = createAudio(AUDIO_PATHS.menu);
  menuTrack.loop = true;
  menuTrack.volume = 0.5;
  const ok = await safePlay(menuTrack);
  if (!ok) {
    mp3Available.menu = false;
    stopSynthMusic();
    await resumeSynthContext();
    startSynthMenu();
  }
}

async function playRaceMp3() {
  if (!raceTrack) raceTrack = createAudio(AUDIO_PATHS.race);
  raceTrack.loop = true;
  raceTrack.volume = 0.5;
  const ok = await safePlay(raceTrack);
  if (!ok) {
    mp3Available.race = false;
    stopSynthMusic();
    await resumeSynthContext();
    startSynthRace();
  }
}

/**
 * Call directly from a click/tap handler — unlocks audio AND starts menu music.
 * Must stay in the gesture call stack for unlock (await is OK after resume).
 */
export async function unlockAndPlayMenu() {
  if (!canPlay()) return false;
  audioUnlocked = true;
  // Unlock Web Audio during the user gesture so synth SFX work even when music uses MP3.
  await resumeSynthContext();

  if (await hasMenuMp3()) {
    stopSynthMusic();
    await playMenuMp3();
    return true;
  }

  await resumeSynthContext();
  startSynthMenu();
  return true;
}

/** Legacy unlock — prefer unlockAndPlayMenu from a click handler */
export function unlockAudio() {
  if (!canPlay()) return;
  audioUnlocked = true;
  void resumeSynthContext();
}

export async function playMenuMusic() {
  if (!canPlay() || !audioUnlocked) return;

  stopRaceMusic(false);

  if (await hasMenuMp3()) {
    stopSynthMusic();
    if (!menuTrack) menuTrack = createAudio(AUDIO_PATHS.menu);
    menuTrack.loop = true;
    menuTrack.volume = 0.5;
    if (menuTrack.paused) await playMenuMp3();
    return;
  }

  stopSynthMusic();
  await resumeSynthContext();
  startSynthMenu();
}

export async function playRaceMusic() {
  if (!canPlay() || !audioUnlocked) return;

  pauseMenuMusic();

  if (await hasRaceMp3()) {
    stopSynthMusic();
    if (!raceTrack) raceTrack = createAudio(AUDIO_PATHS.race);
    raceTrack.loop = true;
    raceTrack.volume = 0.5;
    if (raceTrack.paused) await playRaceMp3();
    return;
  }

  stopSynthMusic();
  await resumeSynthContext();
  startSynthRace();
}

/** @param {boolean} [reset=true] */
function pauseMenuMusic(reset = true) {
  if (!menuTrack) return;
  menuTrack.pause();
  if (reset) menuTrack.currentTime = 0;
}

export function stopMenuMusic() {
  pauseMenuMusic(true);
  stopSynthMusic();
}

export function stopRaceMusic(reset = true) {
  if (raceTrack) {
    raceTrack.pause();
    if (reset) raceTrack.currentTime = 0;
  }
  stopSynthMusic();
}

export function stopAllMusic() {
  stopMenuMusic();
  if (raceTrack) {
    raceTrack.pause();
    raceTrack.currentTime = 0;
  }
}

/** @param {keyof typeof AUDIO_PATHS.sfx} name */
export async function playSfx(name) {
  if (!canPlay() || !audioUnlocked) return;

  if (await hasSfxMp3(name)) {
    const src = AUDIO_PATHS.sfx[name];
    if (!src) return;
    const audio = createAudio(src);
    audio.volume = 0.7;
    const ok = await safePlay(audio);
    if (ok) return;
    mp3Available.sfx[name] = false;
  }

  await resumeSynthContext();
  playSynthSfx(name);
}

export function isAudioUnlocked() {
  return audioUnlocked;
}

export { AUDIO_PATHS };
