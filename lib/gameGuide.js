import { DEFAULT_LAPS } from "./constants";

/** @typedef {{ title: string, body: string }} GuideSection */

/** @type {GuideSection[]} */
export const HOW_TO_PLAY = [
  {
    title: "Pick & ready up",
    body: "Up to 4 players pick a unique driver, then tap READY on each slot (or use Ready All). Fill empty slots with AI if you're short on friends.",
  },
  {
    title: "Tyres & lights out",
    body: "Before the race, choose Hard, Medium, or Soft tyres. Watch the five red lights — tap when they go out. Jump the start and you'll take a penalty.",
  },
  {
    title: "Race & pit",
    body: `Short sprint around the chosen circuit. Tyres wear each lap — past 75% wear you hit a pace cliff. Hit Box Box to pit for fresh rubber (costs track position). Default races are ${DEFAULT_LAPS} laps; change distance in the lobby.`,
  },
  {
    title: "DRS overtake mini-game",
    body: "Close behind a car on the start straight? A timing prompt appears — hit it cleanly to complete the pass. Joker gets a wider window thanks to Chaos Theory.",
  },
  {
    title: "Chaos & safety car",
    body: "Perks and jerks can fire each lap — speed bursts, spins, DNFs, and more. A Safety Car bunches the field and wipes gaps. Watch live chat for the drama.",
  },
];

/** @type {GuideSection[]} */
export const F1_BASICS = [
  {
    title: "Tyre compounds",
    body: "In real F1, teams pick soft (fast, fragile), medium (balanced), or hard (slow, durable) rubber. Pocket F1 uses the same trade-off — strategy matters on a 5-lap dash.",
  },
  {
    title: "Pit stops",
    body: "Boxing loses time on track but resets tyre wear. Real crews aim for ~2 s stops; here a pit costs progress and can go wrong if your driver has the Rookie Mistakes jerk.",
  },
  {
    title: "DRS",
    body: "Drag Reduction System — a rear wing flap that opens when you're close enough on a straight, making overtakes easier. We turn that into a reaction mini-game on the main straight.",
  },
  {
    title: "Safety Car",
    body: "Deployed after incidents to slow the field. Everyone bunches up — gaps disappear and late-race chaos follows. Same idea here when one deploys mid-race.",
  },
  {
    title: "Perks & jerks",
    body: "Our party twist on driver personality. Every racer has a upside (perk) and downside (jerk) inspired by F1 storylines — reliability, tyre whisperers, hotheads, rookies.",
  },
];

/** @type {{ compound: string, tagline: string, pros: string, cons: string, color: string }[]} */
export const TIRE_GUIDE = [
  {
    compound: "Soft",
    tagline: "Qualifying pace",
    pros: "+8% speed — best for a short stint or aggressive start.",
    cons: "Wears 4× faster than Hard. Falls off a cliff after ~2 laps.",
    color: "#f85149",
  },
  {
    compound: "Medium",
    tagline: "The safe default",
    pros: "Balanced speed and wear — good for one-stop or playing it safe.",
    cons: "No extreme upside. Outpaced on fresh Softs.",
    color: "#d29922",
  },
  {
    compound: "Hard",
    tagline: "Sunday long-run",
    pros: "Slowest to wear — Steel's Ice in the Veins perk stacks even further.",
    cons: "−8% speed. Hard to stay with faster compounds on low wear.",
    color: "#e6edf3",
  },
];

export const WEAR_TIP =
  "Tyre wear is shown as a % in your HUD. Above 75% you lose serious pace — plan a pit before the cliff, or gamble and pray.";
