# Pocket F1 — Project Context

## What this is
A miniature, party-style F1 racing game for up to 4 players, built for a same-day hackathon/meetup demo. Retro 16-bit art style, chiptune-inspired original music, silly and fast to understand. Goal: make people who've never watched F1 feel the tension of a start, the risk of a strategy call, and the chaos of bad luck — in about 3-5 minutes of play.

**Deployment target:** pocket-f1.vercel.app (Next.js recommended for easy Vercel deploy, but plain HTML+Canvas+JS is also fine — pick whichever is faster to get running, don't overthink it).

## Scope for today
- 4 players max, local session first (all in one browser/device or same-room hotseat). Real cross-device networking (WebSocket relay or Supabase/Firebase realtime) is a **stretch goal only** — do not block core gameplay on it.
- One track only. Track is just a flat oval/circuit visual — doesn't need real geometry, can be a stylized loop with a progress-bar-like position tracker.
- 4 preset drivers, not customizable.

## Tech stack
- Frontend: Next.js (or plain HTML/Canvas/JS if faster) + simple JS/JSON state, no heavy game engine needed.
- Art: pre-generated pixel-art sprite images (not code-drawn) — see Art section below.
- Audio: one looping original chiptune-style menu track, one looping in-race track (can be the same track, different intensity), plus a handful of short SFX (lights-out beep, pit stop, DNF, overtake, podium fanfare).
- State management: plain JS objects is enough. No Redux/etc needed for this scope.

## Screen flow (in order)
1. **Lobby / Driver Select** — up to 4 players each pick one of 4 preset drivers. Shows driver name, sprite, perk, and jerk as flavor text. "Ready" toggle per player. Menu music loops here.
2. **Track load-in** — brief transition to the track view. Players see the circuit, their car icon, laps remaining, and the fake live chat panel (empty/idle here).
3. **Tire pick + Lights-out sequence** (combined step, happens once per race, right after track load-in and before racing starts):
   - Each player picks a starting tire compound: Hard / Medium / Soft.
   - Immediately after all picks are locked in, the 5 red lights sequence plays with a random delay before lights out.
   - Human players react by tapping/clicking as fast as possible after lights go out (penalize jump starts — clicking before lights out = time penalty).
   - AI drivers get a random reaction time between **150ms–500ms**, rolled fresh per race per driver.
   - Reaction time becomes each driver's starting gap/position for the race.
4. **Race loop** — the main gameplay screen. See "Race Loop" section below.
5. **Podium / Results screen** — final standings, one reaction GIF per finishing position, replay/back-to-lobby button.

## Driver data model
```js
{
  id: string,
  name: string,          // flavor name, can be F1-inspired but not literal real driver likeness/quotes
  spriteUrl: string,     // pre-generated pixel art asset
  color: string,         // accent color for UI/track marker
  perk: { label: string, effect: string },  // e.g. "Slipstream King": small chance per lap of a speed boost
  jerk: { label: string, effect: string },  // e.g. "Reliability Gremlin": small chance per lap of a DNF
}
```
Define exactly 4 presets. Example shape (rename/reflavor freely, avoid using real F1 drivers' actual names/likeness/quotes — keep it "inspired by" archetypes, not 1:1 real people, to stay clear of any real-person portrayal issues):
- **The Prodigy** — perk: occasional qualifying-pace burst (temporary speed boost); jerk: small random DNF chance (mechanical gremlin).
- **The Veteran** — perk: better tire management (slower degradation); jerk: slightly slower base pace.
- **The Wildcard** — perk: bigger overtake mini-game window; jerk: higher chance of a spin (temporary speed loss).
- **The Rookie** — perk: fast reaction time bonus (shifts their AI/human reaction roll faster); jerk: higher pit-stop error chance (slower pit).

## Tire compound model
```js
{
  hard:   { speedMultiplier: 0.92, degradationPerLap: 0.01 },
  medium: { speedMultiplier: 1.00, degradationPerLap: 0.02 },
  soft:   { speedMultiplier: 1.08, degradationPerLap: 0.04 },
}
```
Effective speed each tick = baseSpeed × tireSpeedMultiplier × (1 − accumulatedWear). Wear accumulates by degradationPerLap each lap; once wear crosses a threshold, speed drops off sharply to signal "you need to pit."

## Race loop (core simulation)
- Tick-based simulation, e.g. `setInterval` every 200–500ms.
- Each tick: advance each driver's track position based on effective speed, update leaderboard/gaps, tick down tire wear, check for triggered events.
- Live gap/leaderboard displayed prominently (this is the "TV overlay" feel).
- Players can call their car into the pits at any time (own choice, not forced) → prompts a tire compound re-pick → applies a pit-time penalty, resets wear to 0 on new tires.
- AI drivers pit on their own logic — **randomize pit lap slightly per AI driver** so all 4 don't pit on the same lap (cheap realism win).

## Event system (build after the core loop works)
- **Perk/jerk rolls**: small probability check per driver per lap based on their perk/jerk definitions (speed boost, DNF, spin, pit error, etc).
- **Safety car** (rare random event): bunches all drivers' gaps back together regardless of current spread. Classic F1 chaos/comeback moment, cheap to implement (just reset relative gaps), big drama payoff.
- **DRS overtake mini-game**: when two drivers' gap drops under a threshold, trigger a quick single-key timing-window prompt for the trailing driver to attempt an overtake.
- **Live chat panel**: canned message pool that fires on trigger events (pit stop, DNF, overtake, safety car, lead change). Not generative — just a pool of pre-written flavor lines picked at random per event type.
- **Reaction GIFs**: fire a short GIF alongside major events (DNF, overtake, podium) to keep tone lighthearted. Use generic racing/celebration reaction GIFs, not real broadcast footage clips.

## Art direction
- 16-bit / retro pixel art style throughout — sprites, UI chrome, track.
- Sprites are **pre-generated images**, not drawn in code. Plan for: 4 driver/car sprites, a track background, simple UI icons (tire icons for hard/medium/soft, flag icons, chat icons).
- Keep a consistent limited color palette across all generated assets so they read as one cohesive game.

## Audio direction
- One original chiptune-inspired loop for menu, one (can be same track/different layer) for in-race — inspired by the high-energy feel of the real F1 theme, but an **original composition**, not a recreation of the copyrighted Brian Tyler theme.
- Short SFX: lights-out beep sequence, pit-stop chime, DNF sting, overtake whoosh, podium fanfare.

## Explicitly out of scope for today (stretch goals only)
- Real cross-device multiplayer networking.
- Multiple tracks.
- Rain/wet weather tire mechanics.
- Custom/unlockable drivers.
- Persistent stats or accounts.

## Build order reference
1. Lock stack and scope
2. Build the data model (drivers, tires, race state)
3. Build lobby + driver select screen
4. Build tire pick + lights-out sequence
5. Build the core race loop (no events yet — get a boring race finishing end to end first)
6. Layer in events: perks/jerks, pit stops, safety car
7. Build DRS overtake mini-game
8. Build podium screen and polish pass (only after this, attempt real networking if time remains)
