import { getDriverById } from "./drivers";
import { gifForEvent } from "./gifs";

/** @typedef {'dnf' | 'spin' | 'pit' | 'pit_error' | 'safety_car' | 'overtake' | 'boost' | 'lead_change' | 'race_start' | 'spectator'} ChatEvent */

const BROADCAST = {
  dnf: [
    "And they're OUT — devastating for the team!",
    "Mechanical gremlin strikes again!",
    "Garage beckons. What a shame.",
    "Retirement — the crowd falls silent.",
  ],
  spin: [
    "SPIN! They're losing time!",
    "Too much throttle through there!",
    "A wobble — can they recover?",
    "Wall flirted with. Heart in mouth.",
  ],
  pit: [
    "Box box box! Pit stop underway.",
    "Fresh rubber going on.",
    "Strategy call — into the pits.",
    "Pit crew on the move!",
  ],
  pit_error: [
    "Slow stop! The crew fumbled it!",
    "Wheel nut drama in the pit box!",
    "That pit cost them dearly.",
  ],
  safety_car: [
    "SAFETY CAR DEPLOYED!",
    "The field bunches up. Chaos incoming.",
    "SC out — anyone's race now.",
    "Neutralized! Gaps erased.",
  ],
  overtake: [
    "MOVE COMPLETE! What a pass!",
    "They've gone through!",
    "Overtake! Brilliant stuff.",
    "Position gained — drama!",
  ],
  boost: [
    "They're flying! Purple sector pace!",
    "Where did THAT pace come from?!",
    "Flow state activated!",
  ],
  lead_change: [
    "NEW RACE LEADER!",
    "Lead change at the front!",
    "They're through for P1!",
  ],
  race_start: [
    "And we're racing at {track}!",
    "Green flag at {track}! May the chaos begin.",
    "Lights out and away we go!",
  ],
};

/** @type {{ handle: string, lines: string[] }[]} */
const SPECTATORS = [
  {
    handle: "CouchRacer99",
    lines: [
      "LETS GOOO",
      "who else is watching live??",
      "best party race ever",
      "my snacks are ready",
      "POV: I'm leading in my head",
    ],
  },
  {
    handle: "PitLanePam",
    lines: [
      "strategy nerds assemble",
      "someone box soon surely",
      "tyre deg chat let's go",
      "DRS trains forming...",
      "undercut window 👀",
    ],
  },
  {
    handle: "GrandstandGary",
    lines: [
      "WOOOO",
      "my legs are asleep but WORTH IT",
      "BEER RUN AT LAP 5",
      "came for chaos staying for chaos",
      "LOUD NOISES",
    ],
  },
  {
    handle: "F1TikTok",
    lines: [
      "this is going viral",
      "chat is this real??",
      "clip that!!!",
      "ratio in the comments",
      "no way no way no way",
    ],
  },
  {
    handle: "TelemetryTom",
    lines: [
      "pace delta is wild rn",
      "tyre cliff incoming for someone",
      "fuel? we don't do fuel here",
      "purple sector somewhere I bet",
      "data says drama in 2 laps",
    ],
  },
  {
    handle: "NeutralFan_",
    lines: [
      "no idea who to support lol",
      "just here for the vibes",
      "anyone else's heart rate up?",
      "chaos mode: ON",
      "I picked the wrong driver again",
    ],
  },
  {
    handle: "LiveFromPocket",
    lines: [
      "viewers: 12,847 📈",
      "NEW SUB HYPE",
      "thanks for the bits!",
      "watch party at mine next week",
      "global feed looking spicy",
    ],
  },
  {
    handle: "Turn1Tiffany",
    lines: [
      "T1 is always carnage",
      "brake late gang rise up",
      "someone's gonna dive bomb",
      "horns honking in the harbor",
      "I love this circuit",
    ],
  },
  {
    handle: "StrategySteve",
    lines: [
      "one-stop or two-stop?",
      "hards to the end — bold",
      "soft gang where you at",
      "SC lottery incoming maybe",
      "undercut would be chef's kiss",
    ],
  },
  {
    handle: "DRS_Dan",
    lines: [
      "DRS ENABLED let's ride",
      "mini-game time!!",
      "gap is closing...",
      "flyby mode activated",
      "tractoring in the train",
    ],
  },
  {
    handle: "WetWeatherWendy",
    lines: [
      "rain tires when??",
      "spray would be insane",
      "vis is terrible lol",
      "intermediates gang",
      "classic harbor drizzle vibes",
    ],
  },
  {
    handle: "HarborHomies",
    lines: [
      "LOCAL TRACK LET'S GO",
      "I can see my house from here",
      "dock section is scary",
      "best map in the game",
      "harbor loop supremacy",
    ],
  },
  {
    handle: "LateBrakeLarry",
    lines: [
      "send it send it send it",
      "brake? never heard of her",
      "apex or chaos",
      "full send into T3",
      "margin for error: zero",
    ],
  },
  {
    handle: "PocketRingFan",
    lines: [
      "pocket ring classic",
      "who remembers the old layout",
      "long straight DRS fest",
      "this track never misses",
      "ring around the pocket W",
    ],
  },
  {
    handle: "WatchPartyMike",
    lines: [
      "12 of us on the couch rn",
      "pass the controller",
      "we're all yelling at the pit crew",
      "someone order pizza",
      "this is better than real F1 today",
    ],
  },
];

/** @type {Record<string, string[]>} */
const SPECTATOR_CONTEXT = {
  safety_car: [
    "SC LOTTERY LET'S GO",
    "free pit window??",
    "my driver needed this honestly",
    "field bunched I'm screaming",
  ],
  overtake: [
    "WHAT A MOVE OMG",
    "CLEAN?!?!",
    "screenshot that",
    "I spilled my drink",
  ],
  pit: [
    "box box box chat!",
    "fresh rubber hype",
    "pit lane drama time",
  ],
  dnf: [
    "nooooo",
    "devastated for them",
    "there goes my fantasy team",
  ],
  lead_change: [
    "NEW LEADER LET'S GO",
    "plot twist!!",
    "did NOT see that coming",
  ],
  spin: [
    "NOOOO",
    "heart rate 📈📈📈",
    "they're sideways!!",
    "can they save it??",
  ],
};

/**
 * @param {ChatEvent} event
 * @param {string} [driverId]
 * @param {{ trackName?: string }} [context]
 */
export function getChatLine(event, driverId, context = {}) {
  const pool = BROADCAST[event] ?? ["Something happened."];
  let line = pool[Math.floor(Math.random() * pool.length)];
  if (context.trackName) {
    line = line.replace(/\{track\}/g, context.trackName);
  }
  const driver = driverId ? getDriverById(driverId) : null;
  if (driver) return `🎙️ ${driver.name}: ${line}`;
  return `🎙️ ${line}`;
}

/**
 * @param {ChatEvent} event
 * @param {string} [driverId]
 * @param {{ trackName?: string }} [context]
 */
export function createChatMessage(event, driverId, context = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text: getChatLine(event, driverId, context),
    event,
    gif: gifForEvent(event),
  };
}

/**
 * @param {{ mood?: string, driverName?: string }} [context]
 */
export function createSpectatorMessage(context = {}) {
  const fan = SPECTATORS[Math.floor(Math.random() * SPECTATORS.length)];
  let line;

  if (context.mood && SPECTATOR_CONTEXT[context.mood] && Math.random() < 0.65) {
    const pool = SPECTATOR_CONTEXT[context.mood];
    line = pool[Math.floor(Math.random() * pool.length)];
  } else {
    line = fan.lines[Math.floor(Math.random() * fan.lines.length)];
  }

  if (context.driverName && Math.random() < 0.35) {
    line = `${context.driverName} — ${line}`;
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text: `@${fan.handle}: ${line}`,
    event: "spectator",
    gif: null,
  };
}

/** Opening burst when the race goes green. */
export function createSpectatorBurst(count = 4) {
  return Array.from({ length: count }, () => createSpectatorMessage());
}
