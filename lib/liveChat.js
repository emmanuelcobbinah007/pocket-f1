import { getDriverById } from "./drivers";
import { gifForEvent } from "./gifs";

/** @typedef {'dnf' | 'spin' | 'pit' | 'pit_error' | 'safety_car' | 'overtake' | 'boost' | 'lead_change' | 'race_start' | 'spectator'} ChatEvent */

const BROADCAST = {
  dnf: [
    "{driver} is OUT — devastating for the team!",
    "Mechanical gremlin got {driver}!",
    "{driver} into the garage. What a shame.",
    "Retirement for {driver} — the crowd falls silent.",
    "That's race over for {driver}. Brutal.",
  ],
  spin: [
    "{driver} SPINS! They're losing time!",
    "Too much throttle from {driver} through there!",
    "{driver} wobbles — can they recover?",
    "{driver} flirted with the wall. Heart in mouth.",
    "Moment for {driver} — sideways!",
  ],
  pit: [
    "Box box box! {driver} pits!",
    "Fresh rubber for {driver}.",
    "Strategy call — {driver} into the pits.",
    "{driver}'s pit crew on the move!",
    "{driver} stops for new tyres.",
  ],
  pit_error: [
    "Slow stop for {driver}! The crew fumbled it!",
    "Wheel nut drama in {driver}'s pit box!",
    "That pit cost {driver} dearly.",
    "{driver} stationary too long — nightmare stop!",
  ],
  safety_car: [
    "SAFETY CAR DEPLOYED!",
    "The field bunches up. Chaos incoming.",
    "SC out — anyone's race now.",
    "Neutralized! Gaps erased.",
    "Safety car — lottery time for the whole grid!",
  ],
  overtake: [
    "{driver} completes the move! What a pass!",
    "{driver} goes through — brilliant!",
    "Overtake for {driver}! Drama!",
    "{driver} gains a position — send it!",
    "Move made! {driver} moves up the order!",
  ],
  boost: [
    "{driver} is flying! Purple sector pace!",
    "Where did {driver}'s pace come from?!",
    "{driver} hits a hot lap!",
    "That's mega pace from {driver}!",
    "{driver} on a tear right now!",
  ],
  lead_change: [
    "NEW RACE LEADER — {driver}!",
    "Lead change! {driver} to the front!",
    "{driver} through for P1!",
    "{driver} takes the lead!",
  ],
  race_start: [
    "And we're racing at {track}!",
    "Green flag at {track}! May the chaos begin.",
    "Lights out and away we go at {track}!",
    "{track} — eight on the grid, one couch king.",
    "Party mode: ON. {track} is live!",
  ],
};

/** First-person radio lines keyed by driver id, then event. */
/** @type {Record<string, Partial<Record<ChatEvent, string[]>>>} */
const DRIVER_LINES = {
  nova: {
    dnf: ["No no no — she's gone!", "I had pace for days… cruel.", "DNF? Not like this."],
    spin: ["Whoa — catching it!", "That apex came fast.", "Still in it, still pushing."],
    pit: ["Box me, I'm losing grip.", "Fresh tyres — let's fly.", "Copy, pit this lap."],
    pit_error: ["What was THAT stop?!", "Crew, we talked about this!", "Lost half the field in the box…"],
    overtake: ["See ya!", "That's the prodigy move.", "DRS and gone — easy."],
    boost: ["Flow state — LET'S GO!", "Everything's clicking now.", "This is MY lap."],
    lead_change: ["P1. As planned.", "Front row energy.", "Lead mine — try and take it."],
  },
  steel: {
    dnf: ["…That's it, then.", "Had a good run. No regrets.", "Mechanicals. It happens."],
    spin: ["Steady… steady…", "Bit of a wobble — recovering.", "Old legs still know the track."],
    pit: ["Box. Manage the tyres.", "Smooth stop, please.", "Undercut if you can."],
    pit_error: ["Slow stop — damage done.", "Pit crew, we need cleaner.", "That hurt the strategy."],
    overtake: ["Experience pays off.", "Patient pass — no drama.", "Around the outside. Classic."],
    boost: ["Still got pace in the tank.", "Ice cold — pushing now.", "Veteran surge."],
    lead_change: ["Leading. Calm and steady.", "P1 — don't do anything silly.", "Front now. Protect it."],
  },
  joker: {
    dnf: ["HAHA— wait, that's not funny.", "Chaos claimed me!", "Wildcard out. Plot twist."],
    spin: ["WHEEE— I mean, recovering!", "Did anyone clip that?", "Chaos theory in action."],
    pit: ["Surprise pit! Maybe?", "Box? Sure, why not.", "Strategy? What strategy."],
    pit_error: ["Even the pit crew went chaotic.", "That stop was… creative.", "Wheel nut roulette — I lost."],
    overtake: ["YOINK!", "Didn't see THAT coming, did ya?", "Chaos pass — clean-ish!"],
    boost: ["Random speed unlocked!", "The universe wants me fast.", "Purple sector? Sure."],
    lead_change: ["P1! Absolute madness!", "Leading? This script is wild.", "Top spot — don't jinx it chat."],
  },
  spark: {
    dnf: [
      "Is the race over for me??",
      "Nooo my first big moment…",
      "Garage lights — I'm so sorry.",
      "…I'm out. Rookie year hurts.",
      "DNF. I'll get 'em next race.",
    ],
    overtake: ["I DID IT!", "Rookie move of the day!", "Was that clean? I think so!"],
    spin: ["WHOA sorry sorry sorry!", "Still learning that corner!", "Okay okay I'm fine I'm fine"],
    pit: ["Box box — uh, confirming?", "Fresh tyres please!", "Pit stop — don't mess up crew!"],
    pit_error: ["I'm SO sorry to the crew…", "That stop was on me, wasn't it?", "Rookie mistake in the pits…"],
    boost: ["HOLY pace!", "Where did THAT come from?!", "Reflexes activated!"],
    lead_change: ["LEADING?! ME?!", "P1 — someone pinch me!", "Front of the grid — don't crash don't crash"],
  },
  vector: {
    dnf: ["Strategy irrelevant if the car stops.", "Model said P3. Reality said DNF.", "Reliability failure — log it."],
    spin: ["Adjusting line — data was wrong.", "Track limits got me.", "Recovering position loss."],
    pit: ["Box. Undercut window open.", "Stop when ready — minimal loss.", "Tyres done. Execute stop."],
    pit_error: ["Unacceptable stop time.", "That wasn't the plan at all.", "Pit delta ruined the strategy."],
    overtake: ["Calculated pass complete.", "Gap exploited — move done.", "Overtake executed per plan."],
    boost: ["Pace injection — temporary.", "Model predicted this surge.", "Optimal lap — pushing now."],
    lead_change: ["P1. Maintain delta.", "Lead acquired. Protect undercut.", "Front now — strategy paying off."],
  },
  brick: {
    dnf: ["Car's gone. Wall still standing.", "DNF. Unlucky.", "Out — but I made 'em work for every pass."],
    spin: ["Too aggressive — my bad.", "Limits aren't a suggestion, apparently.", "Spinning — but I'm tough."],
    pit: ["Box. Hards are cooked.", "Pit — make it quick.", "Fresh rubber. I'll defend harder."],
    pit_error: ["Even walls pit slow sometimes.", "That stop hurt.", "Crew — we need sharper."],
    overtake: ["…Did I just pass someone?", "Rare overtake — savored.", "Move made. Don't expect many."],
    boost: ["Iron wall charging forward.", "Unexpected pace — use it.", "Moving up — come at me."],
    lead_change: ["P1. Try and pass THIS.", "Leading — good luck getting by.", "Front spot — defensive mode ON."],
  },
  blaze: {
    dnf: ["NOOO the show's over?!", "DNF — worst plot twist ever.", "Camera's not following me anymore…"],
    spin: ["Showmanship — I mean, correction!", "Bit of flair through there.", "Still got style though."],
    pit: ["Box — fresh tyres for the highlight reel!", "Pit stop — make it cinematic.", "Tyres gone — send me back out fast!"],
    pit_error: ["Even the pit stop wasn't highlight-worthy…", "Slow stop — crowd booing.", "That wasn't the show I wanted."],
    overtake: ["THAT'S for the fans!", "Overtake of the DAY!", "Move complete — clip THAT!"],
    boost: ["Crowd's lifting me — WOO!", "Showman's pace — activated!", "Purple sector for the cameras!"],
    lead_change: ["P1! WAVE TO THE CROWD!", "Leading — this is my stage!", "Front row — spotlight ON."],
  },
  patch: {
    dnf: ["…Called it. Duct tape failed.", "Car finally gave up.", "DNF. Story of my season."],
    spin: ["Still rolling — barely.", "Patch job holding… I think.", "Wobble — car's held together so far."],
    pit: ["Box — this thing needs everything.", "Fresh tyres on the bargain bin special.", "Pit — please don't drop the car."],
    pit_error: ["Even the pit crew looked surprised.", "Slow stop — story of my life.", "That cost me everything."],
    overtake: ["Never say die — MOVE!", "From the back to… slightly less back!", "They counted me out — wrong."],
    boost: ["Comeback mode ENGAGED!", "Further back = faster me!", "Underdog surge — feel it!"],
    lead_change: ["P1?! FROM THIS CAR?!", "Leading — nobody believed in us!", "Front — the comeback is REAL."],
  },
};

/** @type {{ handle: string, lines: string[], drivers?: string[] }[]} */
const SPECTATORS = [
  {
    handle: "CouchRacer99",
    lines: [
      "LETS GOOO",
      "who else is watching live??",
      "best party race ever",
      "my snacks are ready",
      "POV: I'm leading in my head",
      "8 drivers on grid is INSANE",
      "controller passing in 3… 2…",
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
      "Vector's pit delta is cheating btw",
      "two-stop vs one-stop WAR",
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
      "Blaze just showboated again lol",
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
      "Patch P1 arc when??",
      "POV: you're Brick defending P1",
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
      "Vector undercut looking optimal",
      "Patch comeback multiplier is real",
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
      "picked Spark — no regrets",
      "8-way grid pick paralysis",
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
      "Summit Switch debut hype!!",
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
      "Summit hairpin 1 is SCARY",
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
      "Vector on a one-stop — watch",
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
      "Blaze DRS window is HUGE",
      "Brick's iron wall is annoying lol",
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
      "Summit fog would go hard",
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
    handle: "SummitSwitchSquad",
    lines: [
      "ALPINE RACE LET'S GO",
      "cliffside section = no thanks",
      "mountain tunnel is cinema",
      "Summit Switch traced perfectly",
      "hairpins for DAYS",
      "new map who dis",
      "best track in the game now",
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
      "Joker or Blaze — pick your chaos",
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
      "4-8 player grid is perfect",
    ],
  },
  {
    handle: "NovaNation",
    drivers: ["Nova"],
    lines: [
      "Nova flow state incoming",
      "prodigy arc let's GO",
      "Nova or bust",
      "glass cannon racing is art",
      "Nova P1 or DNF no in between",
    ],
  },
  {
    handle: "SteelCity",
    drivers: ["Steel"],
    lines: [
      "Steel never spins (much)",
      "veteran W incoming",
      "ice in the veins baby",
      "Steel P1 quietly",
      "old legs still quick",
    ],
  },
  {
    handle: "JokerHive",
    drivers: ["Joker"],
    lines: [
      "Joker chaos let's GOOO",
      "wildcard szn",
      "no strategy just vibes",
      "Joker leading would break the sim",
      "chaos theory believers rise",
    ],
  },
  {
    handle: "SparkSquad",
    drivers: ["Spark"],
    lines: [
      "rookie hype!!",
      "Spark got the reflexes",
      "first season fairy tale??",
      "Spark leading I'm crying",
      "lightning start incoming",
    ],
  },
  {
    handle: "VectorAnalytics",
    drivers: ["Vector"],
    lines: [
      "perfect pit read is broken",
      "Vector undercut loading…",
      "strategist diff",
      "Vector P3 minimum trust",
      "overthinker at the start tho lol",
    ],
  },
  {
    handle: "BrickWallFC",
    drivers: ["Brick"],
    lines: [
      "good luck passing Brick",
      "iron wall activated",
      "moving chicane energy",
      "Brick defending P1 for 10 laps",
      "DRS? never heard of her — Brick",
    ],
  },
  {
    handle: "BlazeNation",
    drivers: ["Blaze"],
    lines: [
      "Blaze for the highlight reel",
      "showman szn",
      "crowd energy OP",
      "Blaze overtake clip THAT",
      "camera hog but we love him",
    ],
  },
  {
    handle: "PatchBelievers",
    drivers: ["Patch"],
    lines: [
      "never say die!!",
      "Patch comeback loading…",
      "duct tape and dreams",
      "underdog arc let's GO",
      "Patch P1 I'm not even joking",
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
    "Patch needed this SC badly",
    "Vector smiling rn for sure",
  ],
  overtake: [
    "WHAT A MOVE OMG",
    "CLEAN?!?!",
    "screenshot that",
    "I spilled my drink",
    "Blaze showboating after that pass lol",
    "Brick got passed?? rare sight",
  ],
  pit: [
    "box box box chat!",
    "fresh rubber hype",
    "pit lane drama time",
    "Vector pit delta is illegal",
    "Spark pit crew nervous rn",
  ],
  dnf: [
    "nooooo",
    "devastated for them",
    "there goes my fantasy team",
    "Patch DNF called it",
    "Nova glass cannon strikes again",
  ],
  lead_change: [
    "NEW LEADER LET'S GO",
    "plot twist!!",
    "did NOT see that coming",
    "Patch leading WHAT",
    "Blaze P1 for the cameras",
  ],
  spin: [
    "NOOOO",
    "heart rate 📈📈📈",
    "they're sideways!!",
    "can they save it??",
    "Joker spin or strategy??",
    "Brick heavy hands moment",
  ],
  boost: [
    "WHERE DID THAT PACE COME FROM",
    "purple sector chat!!",
    "Nova flow state??",
    "Patch comeback boost let's GO",
  ],
};

/**
 * @param {string} template
 * @param {{ trackName?: string, driverName?: string }} ctx
 */
function fillTemplate(template, ctx) {
  let line = template;
  if (ctx.trackName) line = line.replace(/\{track\}/g, ctx.trackName);
  if (ctx.driverName) line = line.replace(/\{driver\}/g, ctx.driverName);
  return line;
}

/**
 * @param {ChatEvent} event
 * @param {string} [driverId]
 * @param {{ trackName?: string }} [context]
 */
export function getChatLine(event, driverId, context = {}) {
  const driver = driverId ? getDriverById(driverId) : null;
  const driverName = driver?.name;

  if (driverId && DRIVER_LINES[driverId]?.[event]?.length) {
    const pool = DRIVER_LINES[driverId][event];
    const line = pool[Math.floor(Math.random() * pool.length)];
    return `📻 ${driverName}: ${line}`;
  }

  const pool = BROADCAST[event] ?? ["Something happened."];
  let line = pool[Math.floor(Math.random() * pool.length)];
  line = fillTemplate(line, {
    trackName: context.trackName,
    driverName: driverName ?? "The leader",
  });

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
  let pool = SPECTATORS;

  if (context.driverName && Math.random() < 0.42) {
    const fanAccounts = SPECTATORS.filter(
      (s) => s.drivers?.includes(context.driverName)
    );
    if (fanAccounts.length) pool = fanAccounts;
  }

  const fan = pool[Math.floor(Math.random() * pool.length)];
  let line;

  if (context.mood && SPECTATOR_CONTEXT[context.mood] && Math.random() < 0.65) {
    const moodPool = SPECTATOR_CONTEXT[context.mood];
    line = moodPool[Math.floor(Math.random() * moodPool.length)];
  } else {
    line = fan.lines[Math.floor(Math.random() * fan.lines.length)];
  }

  if (context.driverName && Math.random() < 0.38 && !fan.drivers?.includes(context.driverName)) {
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
export function createSpectatorBurst(count = 6) {
  return Array.from({ length: count }, () => createSpectatorMessage());
}
