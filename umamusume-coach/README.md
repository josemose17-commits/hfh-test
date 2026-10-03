# Uma Turn Coach

A turn-by-turn training coach for *Umamusume: Pretty Derby* career scenarios. It covers the scenarios on Global now, plus every JP scenario up to the latest, so you can plan ahead.

Open `index.html` in a browser. It needs no build step or server.

## How to use it

1. Pick your scenario and build (distance), and set the highest failure rate you'll accept.
2. Click the current turn on the strip, or step with ◀ ▶.
3. Enter what the game shows: energy, mood, and for each training the total gain (sum of the green numbers), card count, rainbow (friendship) cards, un-bonded cards, failure % and hints. Scenario-specific fields (spirit flames, bath tickets, ramen tips, and so on) appear when the scenario uses them.
4. The coach names the action (train X, rest, recreation, infirmary, race or a scenario action), lists why, and ranks every option. It also says when to use an item or buff first (Megaphone, bath, tasting session, Overdrive, etc.).
5. **Next turn, clear trainings** moves to the next turn and keeps energy and mood.

The **Turn plan** tab lists the career's phases and key turns (debut, summer camps, scenario checkpoints, finale). **Scenario guide** explains how to play the selected scenario and what deck to use.

## Scenarios

| # | Scenario | JP | Global |
|---|----------|----|--------|
| 1 | URA Finale | 2021-02 | Live |
| 2 | Unity Cup (Aoharu) | 2021-08 | Live (2025-11) |
| 3 | Trackblazer (Climax) | 2022-02 | Live (2026-03) |
| 4 | Grand Live | 2022-08 | Live (2026-07) |
| 5 | Grand Masters | 2023-02 | Next (est. late 2026) |
| 6 | Project L'Arc | 2023-08 | TBA |
| 7 | U.A.F. Ready GO! | 2024-02 | TBA |
| 8 | Great Food Festival | 2024-06 | TBA |
| 9 | Run! Mecha Umamusume | 2024-10 | TBA |
| 10 | The Twinkle Legends | 2025-02 | TBA |
| 11 | Welcome to the Island | 2025-06 | TBA |
| 12 | Yukoma Hot Springs | 2025-10 | TBA |
| 13 | Beyond Dreams | 2026-02 | TBA |
| 14 | Rasshai! Trecen-ken! | 2026-06 (JP latest) | TBA |
| 15 | 朋、史解き ―午式駿大祭― | Announced for late Oct 2026 | TBA |

Scenario 15 has no mechanics published yet, so it uses the general coaching rules.

## Files

- `scenarios.js`: scenario data (mechanics, key turns, deck advice, extra inputs).
- `engine.js`: scoring and decision logic. Pure functions, shared by the page and the tests.
- `app.js`, `style.css`, `index.html`: the page.
- `test/engine.test.js`: run with `node --test test/*.test.js`.

## Limits

The scores are heuristics, not a simulator. Entering the real total gain for each training gives much better calls than the card-count estimate. Turns marked "approx." are best-effort, so trust the in-game goal list when they disagree. Notes for the newest JP scenarios come from launch-period guides and may change as players refine strategies.
