/**
 * Procedural audio fallback when MP3 files are missing from public/audio/.
 * Retro-style bleeps — swap in real files via lib/audioPaths.js anytime.
 */

/** @type {AudioContext | null} */
let ctx = null;

/** @type {{ stop: () => void } | null} */
let activeMusic = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return ctx;
}

export async function resumeSynthContext() {
  const ac = getCtx();
  if (!ac) return null;
  if (ac.state === "suspended") await ac.resume();
  return ac;
}

/** @param {number} freq @param {number} dur @param {OscillatorType} [type] @param {number} [vol] */
function tone(freq, dur, type = "square", vol = 0.12) {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** @param {number} from @param {number} to @param {number} dur */
function sweep(from, to, dur) {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t + dur);
  gain.gain.setValueAtTime(0.08, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noiseBurst(dur, vol = 0.15) {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  const bufferSize = Math.floor(ac.sampleRate * dur);
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const src = ac.createBufferSource();
  const gain = ac.createGain();
  src.buffer = buffer;
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(gain);
  gain.connect(ac.destination);
  src.start(t);
}

/** @param {string} name */
export function playSynthSfx(name) {
  switch (name) {
    case "lightBeep":
      tone(660, 0.07, "square", 0.1);
      break;
    case "lightsOut":
      noiseBurst(0.18, 0.2);
      sweep(320, 90, 0.35);
      break;
    case "pitStop":
      for (let i = 0; i < 6; i++) {
        setTimeout(() => tone(180 + i * 20, 0.04, "square", 0.08), i * 55);
      }
      break;
    case "dnf":
      sweep(280, 60, 0.5);
      break;
    case "overtake":
      sweep(440, 880, 0.12);
      tone(880, 0.06, "square", 0.06);
      break;
    case "podium":
      [523, 659, 784, 1047].forEach((f, i) => {
        setTimeout(() => tone(f, 0.22, "triangle", 0.14), i * 120);
      });
      break;
    default:
      tone(440, 0.08);
  }
}

/** @typedef {{ freq: number, len?: number, type?: OscillatorType, vol?: number } | null} SeqStep */

/** @param {AudioContext} ac @param {AudioNode} dest @param {number} freq @param {number} dur @param {OscillatorType} type @param {number} vol */
function scheduleTone(ac, dest, freq, dur, type, vol) {
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.012);
  gain.gain.setValueAtTime(vol * 0.85, t + dur * 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

/** @param {SeqStep[]} melody @param {SeqStep[]} bass @param {number} bpm @param {{ step?: "8n" | "16n", swing?: number }} [opts] */
function startPatternMusic(melody, bass, bpm, opts = {}) {
  stopSynthMusic();
  const ac = getCtx();
  if (!ac) return;

  const master = ac.createGain();
  master.gain.value = 0.28;
  master.connect(ac.destination);

  const steps = Math.max(melody.length, bass.length);
  const stepDiv = opts.step === "16n" ? 4 : 2;
  const stepSec = 60 / bpm / stepDiv;
  let step = 0;
  /** @type {ReturnType<typeof setInterval> | null} */
  let intervalId = null;
  let stopped = false;

  const tick = () => {
    if (stopped) return;
    const i = step % steps;
    const m = melody[i];
    const b = bass[i];
    const noteLen = stepSec * (opts.step === "16n" ? 0.85 : 0.92);

    if (m) {
      scheduleTone(
        ac,
        master,
        m.freq,
        noteLen * (m.len ?? 1),
        m.type ?? "triangle",
        m.vol ?? 0.11
      );
    }
    if (b) {
      scheduleTone(
        ac,
        master,
        b.freq,
        noteLen * 1.05,
        b.type ?? "triangle",
        b.vol ?? 0.09
      );
    }
    step += 1;
  };

  tick();
  intervalId = setInterval(tick, stepSec * 1000);

  activeMusic = {
    stop: () => {
      stopped = true;
      if (intervalId) clearInterval(intervalId);
      const t = ac.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      setTimeout(() => {
        try {
          master.disconnect();
        } catch {
          /* noop */
        }
      }, 180);
      activeMusic = null;
    },
  };
}

// A minor — lobby / title vibe (4-bar loop)
const MENU_MELODY = [
  { freq: 440, type: "triangle", vol: 0.1 }, // A4
  { freq: 392, type: "triangle", vol: 0.09 }, // G4
  { freq: 440, type: "triangle", vol: 0.1 },
  { freq: 494, type: "triangle", vol: 0.11 }, // B4
  { freq: 440, type: "triangle", vol: 0.1 },
  null,
  { freq: 392, type: "triangle", vol: 0.09 },
  { freq: 330, type: "triangle", vol: 0.09 }, // E4
  { freq: 294, type: "triangle", vol: 0.08 }, // D4
  { freq: 330, type: "triangle", vol: 0.09 },
  { freq: 392, type: "triangle", vol: 0.1 },
  null,
  { freq: 440, type: "triangle", vol: 0.1 },
  { freq: 392, type: "triangle", vol: 0.09 },
  { freq: 330, type: "triangle", vol: 0.09 },
  null,
  { freq: 392, type: "triangle", vol: 0.1 },
  { freq: 440, type: "triangle", vol: 0.1 },
  { freq: 523, type: "triangle", vol: 0.11 }, // C5
  { freq: 494, type: "triangle", vol: 0.1 },
  { freq: 440, type: "triangle", vol: 0.1 },
  { freq: 392, type: "triangle", vol: 0.09 },
  null,
  null,
  { freq: 330, type: "triangle", vol: 0.08 },
  { freq: 294, type: "triangle", vol: 0.08 },
  { freq: 330, type: "triangle", vol: 0.09 },
  { freq: 392, type: "triangle", vol: 0.09 },
  { freq: 440, type: "triangle", vol: 0.1 },
  null,
  null,
  null,
];

const MENU_BASS = [
  { freq: 110, vol: 0.1 }, // A2
  null,
  { freq: 110, vol: 0.09 },
  null,
  { freq: 98, vol: 0.09 }, // G2
  null,
  { freq: 98, vol: 0.09 },
  null,
  { freq: 82, vol: 0.09 }, // E2
  null,
  { freq: 82, vol: 0.09 },
  null,
  { freq: 73, vol: 0.09 }, // D2
  null,
  { freq: 82, vol: 0.09 },
  null,
  { freq: 98, vol: 0.09 },
  null,
  { freq: 110, vol: 0.1 },
  null,
  { freq: 110, vol: 0.09 },
  null,
  { freq: 82, vol: 0.09 },
  null,
  { freq: 73, vol: 0.09 },
  null,
  { freq: 82, vol: 0.09 },
  null,
  { freq: 110, vol: 0.1 },
  null,
  null,
  null,
];

// Driving race loop — fast arpeggio + bass
const RACE_MELODY = [
  { freq: 330, type: "square", vol: 0.06 },
  { freq: 392, type: "square", vol: 0.06 },
  { freq: 494, type: "square", vol: 0.07 },
  { freq: 392, type: "square", vol: 0.06 },
  { freq: 330, type: "square", vol: 0.06 },
  { freq: 294, type: "square", vol: 0.06 },
  { freq: 330, type: "square", vol: 0.06 },
  { freq: 262, type: "square", vol: 0.06 },
  { freq: 294, type: "square", vol: 0.06 },
  { freq: 330, type: "square", vol: 0.06 },
  { freq: 392, type: "square", vol: 0.07 },
  { freq: 440, type: "square", vol: 0.07 },
  { freq: 392, type: "square", vol: 0.06 },
  { freq: 330, type: "square", vol: 0.06 },
  { freq: 294, type: "square", vol: 0.06 },
  null,
];

const RACE_BASS = [
  { freq: 82, type: "sawtooth", vol: 0.05 },
  null,
  { freq: 82, type: "sawtooth", vol: 0.05 },
  null,
  { freq: 73, type: "sawtooth", vol: 0.05 },
  null,
  { freq: 73, type: "sawtooth", vol: 0.05 },
  null,
  { freq: 65, type: "sawtooth", vol: 0.05 },
  null,
  { freq: 65, type: "sawtooth", vol: 0.05 },
  null,
  { freq: 82, type: "sawtooth", vol: 0.05 },
  null,
  { freq: 82, type: "sawtooth", vol: 0.05 },
  null,
];

export function startSynthMenu() {
  startPatternMusic(MENU_MELODY, MENU_BASS, 92, { step: "16n" });
}

export function startSynthRace() {
  startPatternMusic(RACE_MELODY, RACE_BASS, 148, { step: "16n" });
}

export function stopSynthMusic() {
  activeMusic?.stop();
  activeMusic = null;
}

export function isSynthSupported() {
  return typeof window !== "undefined" && !!(window.AudioContext || window.webkitAudioContext);
}
