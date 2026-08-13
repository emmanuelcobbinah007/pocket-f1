import { getDriverById } from "@/lib/drivers";
import DriverPortrait from "./DriverPortrait";
import styles from "./DriverDetailPanel.module.css";

/**
 * @param {{ driverId: string | null }} props
 */
export default function DriverDetailPanel({ driverId }) {
  const driver = driverId ? getDriverById(driverId) : null;

  if (!driver) {
    return (
      <div className={styles.panel}>
        <p className={styles.placeholder}>
          Select a driver below to see their perk, jerk, and playstyle.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.panel} style={{ "--driver-color": driver.color }}>
      <div className={styles.header}>
        <DriverPortrait driverId={driver.id} size="md" />
        <div>
          <h3 className={styles.name} style={{ color: driver.color }}>
            {driver.name}
          </h3>
          <span className={styles.archetype}>{driver.archetype}</span>
        </div>
      </div>

      <div className={styles.traits}>
        <div className={`${styles.trait} ${styles.perk}`}>
          <span className={styles.traitLabel}>Perk</span>
          <strong className={styles.traitName}>{driver.perk.label}</strong>
          <p className={styles.traitEffect}>{driver.perk.effect}</p>
        </div>
        <div className={`${styles.trait} ${styles.jerk}`}>
          <span className={styles.traitLabel}>Jerk</span>
          <strong className={styles.traitName}>{driver.jerk.label}</strong>
          <p className={styles.traitEffect}>{driver.jerk.effect}</p>
        </div>
      </div>

      <p className={styles.playstyle}>
        {PLAYSTYLE[driver.id] ?? "A balanced pick for any grid slot."}
      </p>
    </div>
  );
}

const PLAYSTYLE = {
  nova: "High risk, high reward — raw pace with a chance of blowing up. For players who want to lead or DNF trying.",
  steel: "Tyre whisperer — slower outright but stays consistent while others fall off the cliff. Strong one-stop strategy.",
  joker: "Chaos agent — DRS mini-games are easier and spins are more likely. Perfect if you like drama and comebacks.",
  spark: "Starts matter — bonus reaction time off the line, but pit crew can fumble. Great for human players who nail lights out.",
  vector: "Mr. Consistency — cheap pits and calm racecraft. Slightly slow off the line, but strategy pays off over a longer race.",
  brick: "Moving chicane — hard to pass, not the fastest. Ideal AI blocker or human who defends P1 with Iron Wall.",
  blaze: "Highlight reel — bigger overtake windows and front-row pace, but may lose time showboating after a pass.",
  patch: "Comeback kid — faster the further back he runs, if the car holds together. High DNF risk keeps it spicy.",
};
