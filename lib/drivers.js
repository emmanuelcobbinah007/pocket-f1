/** @typedef {{ label: string, effect: string, type: string }} DriverTrait */

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   archetype: string,
 *   spriteUrl: string,
 *   carSpriteUrl: string,
 *   color: string,
 *   baseSpeed: number,
 *   perk: DriverTrait,
 *   jerk: DriverTrait,
 * }} DriverPreset
 */

/** @type {DriverPreset[]} */
export const DRIVERS = [
  {
    id: "nova",
    name: "Nova",
    archetype: "The Prodigy",
    spriteUrl: "/sprites/drivers/nova.webp",
    carSpriteUrl: "/sprites/driver_Cars/nova_car.webp",
    color: "#00D4FF",
    baseSpeed: 1.05,
    perk: {
      label: "Flow State",
      effect: "Small per-lap chance of a temporary speed burst",
      type: "speed_boost",
    },
    jerk: {
      label: "Glass Cannon",
      effect: "Small per-lap chance of a mechanical DNF",
      type: "dnf",
    },
  },
  {
    id: "steel",
    name: "Steel",
    archetype: "The Veteran",
    spriteUrl: "/sprites/drivers/steel.webp",
    carSpriteUrl: "/sprites/driver_Cars/steel_car.webp",
    color: "#8B9199",
    baseSpeed: 0.95,
    perk: {
      label: "Ice in the Veins",
      effect: "Tires degrade 25% slower than normal",
      type: "slow_degradation",
    },
    jerk: {
      label: "Old Legs",
      effect: "Slightly lower base top speed",
      type: "slow_base",
    },
  },
  {
    id: "joker",
    name: "Joker",
    archetype: "The Wildcard",
    spriteUrl: "/sprites/drivers/joker.webp",
    carSpriteUrl: "/sprites/driver_Cars/joker_car.webp",
    color: "#AA44FF",
    baseSpeed: 1.0,
    perk: {
      label: "Chaos Theory",
      effect: "Bigger window on DRS overtake mini-games",
      type: "drs_boost",
    },
    jerk: {
      label: "Loose Cannon",
      effect: "Higher chance of a spin (temporary speed loss)",
      type: "spin",
    },
  },
  {
    id: "spark",
    name: "Spark",
    archetype: "The Rookie",
    spriteUrl: "/sprites/drivers/spark.webp",
    carSpriteUrl: "/sprites/driver_Cars/spark_car.webp",
    color: "#44EE88",
    baseSpeed: 1.0,
    perk: {
      label: "Lightning Reflexes",
      effect: "50ms bonus on lights-out reaction time",
      type: "reaction_bonus",
    },
    jerk: {
      label: "Rookie Mistakes",
      effect: "Higher chance of a slow pit stop",
      type: "pit_error",
    },
  },
  {
    id: "vector",
    name: "Vector",
    archetype: "The Strategist",
    spriteUrl: "/sprites/drivers/vector.webp",
    carSpriteUrl: "/sprites/driver_Cars/vector_car.webp",
    color: "#00B8A9",
    baseSpeed: 1.0,
    perk: {
      label: "Perfect Pit Read",
      effect: "Pit stops cost far less track position",
      type: "perfect_pit_read",
    },
    jerk: {
      label: "Overthinker",
      effect: "Slightly slower reaction at the start lights",
      type: "overthinker",
    },
  },
  {
    id: "brick",
    name: "Brick",
    archetype: "The Enforcer",
    spriteUrl: "/sprites/drivers/brick.webp",
    carSpriteUrl: "/sprites/driver_Cars/brick_car.webp",
    color: "#C44D2E",
    baseSpeed: 0.97,
    perk: {
      label: "Iron Wall",
      effect: "Opponents get a smaller DRS overtake window against him",
      type: "iron_wall",
    },
    jerk: {
      label: "Heavy Hands",
      effect: "Higher chance of a track-limits spin from aggressive driving",
      type: "heavy_hands",
    },
  },
  {
    id: "blaze",
    name: "Blaze",
    archetype: "The Showman",
    spriteUrl: "/sprites/drivers/blaze.webp",
    carSpriteUrl: "/sprites/driver_Cars/blaze_car.webp",
    color: "#FF6B00",
    baseSpeed: 1.02,
    perk: {
      label: "Crowd Energy",
      effect: "Bigger DRS overtake window when he attempts a pass",
      type: "crowd_energy",
    },
    jerk: {
      label: "Camera Hog",
      effect: "Small chance of a brief pace loss right after a big overtake",
      type: "camera_hog",
    },
  },
  {
    id: "patch",
    name: "Patch",
    archetype: "The Underdog",
    spriteUrl: "/sprites/drivers/patch.webp",
    carSpriteUrl: "/sprites/driver_Cars/patch_car.webp",
    color: "#E8C547",
    baseSpeed: 0.98,
    perk: {
      label: "Never Say Die",
      effect: "Comeback speed boost that scales with how far back he's running",
      type: "never_say_die",
    },
    jerk: {
      label: "Duct-Tape Reliability",
      effect: "Higher baseline chance of a mechanical DNF",
      type: "duct_tape_dnf",
    },
  },
];

/** @param {string} id */
export function getDriverById(id) {
  return DRIVERS.find((d) => d.id === id) ?? null;
}

/** @param {string} id */
export function isDriverTaken(id, players, excludeSlot) {
  return players.some((p) => p.slot !== excludeSlot && p.driverId === id);
}

/** @param {DriverPreset | null} driver */
export function getDriverModifiers(driver) {
  if (!driver) return {};
  return {
    slowDegradation: driver.perk.type === "slow_degradation",
  };
}

/** @param {DriverPreset | null} driver */
export function getReactionAdjustMs(driver) {
  if (!driver) return 0;
  let ms = 0;
  if (driver.perk.type === "reaction_bonus") ms -= 50;
  if (driver.jerk.type === "overthinker") ms += 85;
  return ms;
}
