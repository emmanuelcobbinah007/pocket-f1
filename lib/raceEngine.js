import {
  TICK_INTERVAL_MS,
  BASE_PROGRESS_RATE,
  SC_DURATION_TICKS,
  SC_TRIGGER_CHANCE,
  SC_FLASH_TICKS,
  SURPRISE_EVENT_INTERVAL,
  SURPRISE_EVENT_CHANCE,
  NEVER_SAY_DIE_MAX_SPEED_BONUS,
  getMaxPitStops,
} from "./constants";
import { getDriverById, getDriverModifiers } from "./drivers";
import { getEffectiveSpeed, getWearPerLap } from "./tires";
import { createChatMessage, createSpectatorMessage } from "./liveChat";
import { createEventFlash } from "./gifs";
import {
  VIEWER_BASE,
  bumpViewers,
  decayViewers,
  pulseViewers,
  nextViewerPulseTick,
} from "./viewerCount";
import {
  rollLapEvents,
  rollSurpriseEvent,
  applyPitStop,
  bunchForSafetyCar,
  shouldAiPit,
  shouldAiPitUnderSafetyCar,
  pickAiPitCompound,
  scheduleNextAiPit,
  isSpinning,
  isBoosting,
  isPitting,
} from "./events";
import { detectDrsChallenge } from "./drs";


const REF_TICK_MS = 300;
const SC_SPEED = 0.35;
const CHAT_MAX = 50;
const SECONDS_PER_PROGRESS =
  (TICK_INTERVAL_MS / 1000) / BASE_PROGRESS_RATE;

/**
 * @param {import('./gameState').GameState} state
 * @returns {import('./gameState').GameState}
 */
export function tickRace(state) {
  if (!state.race || state.race.finished) return state;
  if (state.race.drsChallenge) return state;

  const totalLaps = state.race.totalLaps;
  const maxPits = getMaxPitStops(totalLaps);
  const tick = state.race.tick + 1;
  const tickScale = TICK_INTERVAL_MS / REF_TICK_MS;
  const drivers = state.race.drivers.map((d) => ({ ...d }));
  let finishCounter = state.race.finishCounter;
  let safetyCar = state.race.safetyCar;
  let safetyCarUntil = state.race.safetyCarUntil;
  /** @type {import('./gameState').GameState['race']['activeFlash']} */
  let activeFlash = state.race.activeFlash;
  if (activeFlash && tick >= activeFlash.untilTick) activeFlash = null;

  let chatLog = [...(state.race.chatLog ?? [])];
  let viewerCount = state.race.viewerCount ?? VIEWER_BASE;
  let viewerNextPulseTick = state.race.viewerNextPulseTick ?? nextViewerPulseTick(tick);

  const pushChat = (msg) => {
    chatLog = [...chatLog.slice(-(CHAT_MAX - 1)), msg];
    if (msg.event) viewerCount = bumpViewers(viewerCount, msg.event);
  };

  const pushFan = (mood, driverId) => {
    const driver = driverId ? getDriverById(driverId) : null;
    pushChat(
      createSpectatorMessage({
        mood,
        driverName: driver?.name,
      })
    );
  };

  const setFlash = (flash) => {
    if (flash) activeFlash = flash;
  };

  if (safetyCar && safetyCarUntil != null) {
    if (tick >= safetyCarUntil) {
      safetyCar = false;
      safetyCarUntil = null;
    } else {
      for (const d of drivers) {
        if (d.dnf || d.lap >= totalLaps || isPitting(d, tick)) continue;
        d.position += BASE_PROGRESS_RATE * SC_SPEED * tickScale;
        while (d.position >= 1 && d.lap < totalLaps) {
          d.position -= 1;
          d.lap += 1;
        }
        if (d.lap >= totalLaps && d.finishOrder == null) {
          d.finishOrder = finishCounter++;
        }
      }
      ({ viewerCount, viewerNextPulseTick } = applyViewerDynamics(
        viewerCount,
        viewerNextPulseTick,
        tick,
        { safetyCar: true, activeFlash, tick, finished: false }
      ));

      return buildRaceState(state, {
        tick,
        drivers,
        finishCounter,
        safetyCar,
        safetyCarUntil,
        activeFlash,
        chatLog,
        viewerCount,
        viewerNextPulseTick,
        totalLaps,
      });
    }
  }

  for (const d of drivers) {
    if (shouldAiPit(d, totalLaps, maxPits)) {
      const { flash, chat } = applyPitStop(
        d,
        pickAiPitCompound(d, totalLaps),
        tick,
        d.driverId
      );
      scheduleNextAiPit(d, totalLaps, maxPits);
      setFlash(flash);
      pushChat(chat);
      pushFan("pit", d.driverId);
    }
  }

  const raceBoard = drivers
    .filter((d) => !d.dnf)
    .sort((a, b) => b.lap + b.position - (a.lap + a.position));

  for (const d of drivers) {
    if (d.dnf || d.lap >= totalLaps) continue;
    if (isPitting(d, tick)) {
      d.pitting = true;
      continue;
    }
    d.pitting = false;

    const preset = getDriverById(d.driverId);
    if (!preset || !d.tire) continue;

    const mods = getDriverModifiers(preset);
    let speed = getEffectiveSpeed(preset.baseSpeed, d.tire, d.wear, mods);

    if (preset.perk.type === "never_say_die" && raceBoard.length > 1) {
      const idx = raceBoard.findIndex((x) => x.driverId === d.driverId);
      if (idx >= 0) {
        const rearFraction = idx / (raceBoard.length - 1);
        speed *= 1 + rearFraction * NEVER_SAY_DIE_MAX_SPEED_BONUS;
      }
    }

    if (isSpinning(d, tick)) speed *= 0.45;
    if (isBoosting(d, tick)) speed *= 1.35;

    const prevLap = d.lap;
    d.position += BASE_PROGRESS_RATE * speed * tickScale;

    while (d.position >= 1 && d.lap < totalLaps) {
      d.position -= 1;
      d.lap += 1;
      d.wear = Math.min(1, d.wear + getWearPerLap(d.tire, mods));
    }

    if (d.lap > prevLap && d.lastEventLap < d.lap) {
      d.lastEventLap = d.lap;

      const lapResult = rollLapEvents(d, d.driverId, tick);
      if (lapResult.dnf) {
        d.dnf = true;
        setFlash(lapResult.flash);
        if (lapResult.chat) pushChat(lapResult.chat);
        pushFan("dnf", d.driverId);
      } else {
        if (lapResult.spinUntil) d.spinUntil = lapResult.spinUntil;
        if (lapResult.boostUntil) d.boostUntil = lapResult.boostUntil;
        if (lapResult.flash) setFlash(lapResult.flash);
        if (lapResult.chat) {
          pushChat(lapResult.chat);
          if (lapResult.spinUntil) pushFan("spin", d.driverId);
          if (lapResult.boostUntil) pushFan("boost", d.driverId);
        }
      }

      if (!safetyCar && d.lap >= 2 && Math.random() < SC_TRIGGER_CHANCE) {
        safetyCar = true;
        safetyCarUntil = tick + SC_DURATION_TICKS;
        bunchForSafetyCar(drivers, totalLaps);
        for (const ai of drivers) {
          if (!shouldAiPitUnderSafetyCar(ai, totalLaps, maxPits)) continue;
          const { flash, chat } = applyPitStop(
            ai,
            pickAiPitCompound(ai, totalLaps),
            tick,
            ai.driverId
          );
          scheduleNextAiPit(ai, totalLaps, maxPits);
          setFlash(flash);
          pushChat(chat);
          pushFan("pit", ai.driverId);
        }
        setFlash(createEventFlash("safety_car", undefined, tick + SC_FLASH_TICKS));
        pushChat(createChatMessage("safety_car"));
        pushFan("safety_car");
        pushFan("safety_car");
      }
    }

    if (d.lap >= totalLaps && d.finishOrder == null) {
      d.finishOrder = finishCounter++;
    }
  }

  if (!safetyCar && tick % SURPRISE_EVENT_INTERVAL === 0) {
    const eligible = drivers.filter(
      (d) => !d.dnf && d.lap < totalLaps && !isPitting(d, tick)
    );
    if (eligible.length > 0 && Math.random() < SURPRISE_EVENT_CHANCE) {
      const pick = eligible[Math.floor(Math.random() * eligible.length)];
      const surprise = rollSurpriseEvent(pick.driverId, tick);
      if (surprise.spinUntil) pick.spinUntil = surprise.spinUntil;
      if (surprise.boostUntil) pick.boostUntil = surprise.boostUntil;
      if (surprise.flash) setFlash(surprise.flash);
      if (surprise.chat) {
        pushChat(surprise.chat);
        if (surprise.spinUntil) pushFan("spin", pick.driverId);
        if (surprise.boostUntil) pushFan("boost", pick.driverId);
      }
    }
  }

  const board = drivers
    .filter((d) => !d.dnf)
    .sort((a, b) => b.lap + b.position - (a.lap + a.position));

  const leaderId = board[0]?.driverId ?? state.race.leaderId;
  if (leaderId && leaderId !== state.race.leaderId) {
    pushChat(createChatMessage("lead_change", leaderId));
    pushFan("lead_change", leaderId);
    setFlash(createEventFlash("lead_change", leaderId, tick + SC_FLASH_TICKS));
  }

  if (!state.race.finished && tick % 2 === 0 && Math.random() < 0.68) {
    pushFan();
  }

  if (!state.race.finished && tick % 8 === 0) {
    pushFan();
  }

  const drsChallenge =
    detectDrsChallenge(state, drivers, tick) ?? state.race.drsChallenge;

  const active = drivers.filter((d) => !d.dnf);
  const allDone =
    active.length > 0 && active.every((d) => d.lap >= totalLaps);

  ({ viewerCount, viewerNextPulseTick } = applyViewerDynamics(
    viewerCount,
    viewerNextPulseTick,
    tick,
    { safetyCar, drsChallenge, activeFlash, finished: allDone, tick }
  ));

  return buildRaceState(state, {
    tick,
    drivers,
    finishCounter,
    safetyCar,
    safetyCarUntil,
    activeFlash,
    chatLog,
    viewerCount,
    viewerNextPulseTick,
    leaderId,
    drsChallenge,
    totalLaps,
  });
}

/**
 * @param {number} viewerCount
 * @param {number} viewerNextPulseTick
 * @param {number} tick
 * @param {Parameters<typeof decayViewers>[1]} ctx
 */
function applyViewerDynamics(viewerCount, viewerNextPulseTick, tick, ctx) {
  let nextCount = decayViewers(viewerCount, ctx);
  let nextPulseAt = viewerNextPulseTick;

  if (tick >= viewerNextPulseTick && !ctx.finished) {
    nextCount = pulseViewers(nextCount);
    nextPulseAt = nextViewerPulseTick(tick);
  }

  return { viewerCount: nextCount, viewerNextPulseTick: nextPulseAt };
}

/** @param {import('./gameState').GameState} state @param {object} patch */
function buildRaceState(state, patch) {
  const {
    tick,
    drivers,
    finishCounter,
    safetyCar,
    safetyCarUntil,
    activeFlash,
    chatLog,
    leaderId = state.race?.leaderId,
    drsChallenge = state.race?.drsChallenge ?? null,
    viewerCount = state.race?.viewerCount ?? VIEWER_BASE,
    viewerNextPulseTick = state.race?.viewerNextPulseTick,
  } = patch;

  const active = drivers.filter((d) => !d.dnf);
  const leaderProgress = Math.max(
    0,
    ...active.map((d) => d.lap + d.position)
  );
  const displayLap = Math.min(
    patch.totalLaps ?? state.race?.totalLaps ?? 5,
    Math.max(1, Math.floor(leaderProgress) + 1)
  );
  const raceLaps = patch.totalLaps ?? state.race?.totalLaps ?? 5;
  const allDone =
    active.length > 0 && active.every((d) => d.lap >= raceLaps);

  return {
    ...state,
    race: {
      ...state.race,
      tick,
      lap: displayLap,
      drivers,
      finishCounter,
      safetyCar,
      safetyCarUntil,
      activeFlash,
      chatLog,
      leaderId,
      drsChallenge,
      viewerCount,
      viewerNextPulseTick,
      finished: allDone,
    },
  };
}

/**
 * @param {import('./gameState').RaceDriver} driver
 * @param {import('./gameState').RaceDriver} leader
 */
export function getGapSeconds(driver, leader) {
  const leaderTotal = leader.lap + leader.position;
  const driverTotal = driver.lap + driver.position;
  const diff = leaderTotal - driverTotal;
  if (diff <= 0) return null;
  return `+${(diff * SECONDS_PER_PROGRESS).toFixed(1)}s`;
}
