/** @typedef {keyof typeof GIFS} GifType */

/** @type {Record<GifType, string>} */
export const GIFS = {
  celebrate: "/gifs/celebrate.gif",
  crash: "/gifs/crash.gif",
  facepalm: "/gifs/facepalm.gif",
  shock: "/gifs/shock.gif",
  overtake: "/gifs/overtake.gif",
  pit_crew: "/gifs/pit-crew.gif",
  boost: "/gifs/boost.gif",
  spin: "/gifs/spin.gif",
  safety_car: "/gifs/safety-car.gif",
  champagne: "/gifs/champagne.gif",
  drs: "/gifs/drs1.gif",
  fist_pump: "/gifs/fist-pump.gif",
  fire: "/gifs/fire1.gif",
  slow_clap: "/gifs/slow-clap.gif",
};

/** @type {Record<string, GifType[]>} */
export const EVENT_GIF_POOLS = {
  dnf: ["crash", "shock", "facepalm"],
  spin: ["spin", "facepalm", "shock"],
  pit: ["pit_crew", "shock"],
  pit_error: ["facepalm", "pit_crew", "slow_clap"],
  safety_car: ["safety_car", "shock", "facepalm"],
  overtake: ["overtake", "drs", "fist_pump", "celebrate"],
  boost: ["boost", "fire", "celebrate"],
  lead_change: ["shock", "fist_pump", "overtake", "celebrate"],
  podium: ["celebrate", "champagne", "fist_pump"],
  race_start: ["fist_pump", "celebrate", "fire"],
};

/** Events that attach a GIF in live chat. */
export const GIF_CHAT_EVENTS = new Set([
  "dnf",
  "spin",
  "pit",
  "pit_error",
  "safety_car",
  "overtake",
  "boost",
  "lead_change",
  "race_start",
]);

/**
 * @param {string} event
 * @returns {string | null}
 */
export function pickGifForEvent(event) {
  const pool = EVENT_GIF_POOLS[event];
  if (!pool?.length) return null;
  const key = pool[Math.floor(Math.random() * pool.length)];
  return GIFS[key] ?? null;
}

/**
 * @param {string} event
 * @returns {string | null}
 */
export function gifForEvent(event) {
  if (!GIF_CHAT_EVENTS.has(event)) return null;
  return pickGifForEvent(event);
}

/** Always returns a GIF path for race flash overlays. */
export function flashGifForEvent(event) {
  return pickGifForEvent(event) ?? GIFS.shock;
}

/**
 * @param {string} type
 * @param {string} [driverId]
 * @param {number} untilTick
 */
export function createEventFlash(type, driverId, untilTick) {
  return {
    type,
    gif: flashGifForEvent(type),
    driverId,
    untilTick,
  };
}

/** @deprecated use EVENT_GIF_POOLS */
export const EVENT_GIF = {
  dnf: "crash",
  spin: "spin",
  pit: "pit_crew",
  pit_error: "facepalm",
  safety_car: "safety_car",
  overtake: "overtake",
  boost: "boost",
  lead_change: "shock",
  podium: "celebrate",
};

/** @deprecated use GIF_CHAT_EVENTS */
export const GIF_EVENTS = GIF_CHAT_EVENTS;
