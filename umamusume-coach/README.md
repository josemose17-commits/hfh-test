# Uma Turn Coach

A turn-by-turn training coach for *Umamusume: Pretty Derby* career scenarios. It covers every scenario on Global now, plus every JP scenario up to the latest, so you can practice ahead of Global.

Open `index.html` in a browser. It needs no build step or server, and it saves your run in the browser.

## How to use it

1. Pick the scenario and your build (distance). Under **Settings**, set the highest failure rate you accept, your deck's race bonus and max energy.
2. Each turn, set energy and mood. For each training, tap the dots for **Cards**, **Rainbow** (friendship) cards and cards with **Bond under 80**, and tick **Hint** if one shows.
3. Optional but recommended: type each training's **Gain** (the green numbers added up) and **Fail %**. Left blank, both are estimated from card counts and energy, and the estimate shows in the box.
4. The coach names the action and any item or buff to use first. It explains why, says what it beat and by how much, and predicts your energy and mood afterwards. Tap any row in **All options** to see its breakdown.
5. Press **Done, next turn**. The turn is logged, energy and mood carry forward, and the training inputs reset. If you did something else, press **I did this** on that option. **Undo last** steps back.
6. Mark goal races with **☆ Mark goal race** on their turns. The coach then runs them and plans energy around them. Finale races are marked for you where they are fixed.

Shortcuts: ← and → change turns.

## How the coach decides

Every option is scored in value points: stats, skill points, bond building, hints, scenario bonuses, energy, mood and failure risk. A score of 100 means a typical training for that point in the career.

- **Stats**: each training raises the stats it really raises (for example Speed training gives Speed plus Power). They're weighted by your build. Stats past your build's "enough" point, past 1200 (which counts half in races) or at the scenario cap are worth less or nothing. Enter current stats under **Stats and caps** to switch this on, and they update as you press Done.
- **Energy**: a lookahead plans the rest of the career, taking into account summer camps, goal races and how failure climbs as energy drops. A rest is recommended only when the energy is worth more later than this turn's training. Energy has no value on the last turn.
- **Mood**: one mood step is worth about 10% on upcoming trainings, and more just before a goal race.
- **Deck strength**: after 3 or more turns with real gains entered, the coach learns how strong your deck is compared with a typical one and rescales its estimates.
- **Scenarios**: each scenario adds its own rules, such as Spirit Bursts and Extreme bursts, Megaphones, Ankle Weights and Charms, Goddess Wisdom colors, SS Matches, Heat-Ups, dishes, Overdrive, legend buffs, Island Training, baths and PR activity, DREAMS training, and tasting sessions.

## Scenarios

| # | Scenario | JP | Global | Base caps (Spd/Sta/Pow/Gut/Wit) |
|---|----------|----|--------|------|
| 1 | URA Finale | 2021-02 | Live | 1400/1400/1400/1400/1400 |
| 2 | Unity Cup (Aoharu) | 2021-08 | Live (2025-11) | 1300/1300/1300/1300/1800 |
| 3 | Trackblazer (Climax) | 2022-02 | Live (2026-03) | 1200/1900/1200/1200/1500 |
| 4 | Grand Concert (Grand Live) | 2022-08 | Live (2026-07) | 1600/1300/1300/1500/1300 |
| 5 | Grand Masters | 2023-02 | Next (est. late 2026) | 1500/1400/1500/1300/1300 |
| 6 | Project L'Arc | 2023-08 | TBA | 1600/1600/1500/1500/1300 |
| 7 | U.A.F. Ready GO! | 2024-02 | TBA | 1700/1500/1500/1500/1300 |
| 8 | Great Food Festival | 2024-06 | TBA | 1750/1000/1700/1700/1350 |
| 9 | Run! Mecha Umamusume | 2024-10 | TBA | 1750/1700/1500/1300/1300 |
| 10 | The Twinkle Legends | 2025-02 | TBA | 1850/1600/1600/1500/1450 |
| 11 | Welcome to the Island | 2025-06 | TBA | 1850/1700/1700/1600/1300 |
| 12 | Yukoma Hot Springs | 2025-10 | TBA | 1900/1800/1700/1700/1400 |
| 13 | Beyond Dreams | 2026-02 | TBA | 2100/1700/1700/1700/1800 |
| 14 | Rasshai! Trecen-ken! | 2026-06 (JP latest) | TBA | 2150/1800/1700/1700/1800 |
| 15 | 朋、史解き ―午式駿大祭― | Announced for late Oct 2026 | TBA | unknown (Trecen-ken's assumed) |

Inheritance can raise caps. Override them under **Stats and caps**.

## Files

- `scenarios.js`: scenario data (mechanics, caps, key turns, deck advice, extra inputs).
- `engine.js`: scoring, the energy lookahead, turn advance and undo. Pure functions, shared by the page and the tests.
- `app.js`, `style.css`, `index.html`: the page.
- `test/engine.test.js`: run with `node --test test/*.test.js`.

## Limits

These are estimates, not a game simulator. Energy costs, rest amounts, race rewards and scenario bonuses are approximations from guides. Real gains and failure rates from your screen always beat the built-in estimates. Turns marked "approx." are best-effort, so trust the in-game goal list when they disagree. The newest JP scenarios are based on launch-period guides.
