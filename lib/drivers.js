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
    spriteUrl: "/sprites/drivers/nova.png",
    carSpriteUrl: "/sprites/driver_Cars/nova_car.png",
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
    spriteUrl: "/sprites/drivers/steel.png",
    carSpriteUrl: "/sprites/driver_Cars/steel_car.png",
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
    spriteUrl: "/sprites/drivers/joker.png",
    carSpriteUrl: "/sprites/driver_Cars/joker_car.png",
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
    spriteUrl: "/sprites/drivers/spark.png",
    carSpriteUrl: "/sprites/driver_Cars/spark_car.png",
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
