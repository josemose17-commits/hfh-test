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

## Your deck and trainee (exact gains)

Open **Trainee and deck** and type your trainee and up to 6 support cards. Names autocomplete from the full database. Then set each card's limit break. From then on:

- each training shows your cards as chips. Tap the ones that appear there, and add **Others** for characters not in your deck;
- tap a card once for "here" and twice for "here with a hint (!)". Friendship (rainbow) is detected from each card's type and bond;
- bonds go up by 7 for each training together and about 5 more for a hint. Card events are logged with the **+5** / **+10** buttons, or by tapping the gauge color the game shows (Blue, Green, Orange 80+, Max);
- Friend and Group cards (Light Hello and others) track outings. Once **Outings unlocked** is ticked, "Outing with ..." is weighed against training as its own option;
- gains, skill points, energy cost and failure come from the game's training formula with your cards' real effects at their level: stat bonus, friendship, mood effect, training effectiveness, card count, your trainee's growth bonuses, plus energy cost reduction, failure protection and conditional unique effects such as bond-gated bonuses;
- your race bonus is added up from your cards automatically.

Scenario-specific boosts that the formula doesn't cover (Unity training, island facilities, springs and so on) use an estimated multiplier. Type the real total gain on a few turns and the coach corrects it.

**Support cards** and **Trainees** tabs browse the whole database:
- **Support cards**: filter by type, rarity, Global availability and limit break, and sort by any effect. Tap a card for its effects at every limit break, its unique effect, hint skills, event skills and release dates.
- **Trainees**: aptitudes, growth bonuses and unique skill.

## Grand Concert

A **Grand Concert songs** panel appears in this scenario:
- Type your tokens from the lesson screen and tick songs as you learn them.
- It tracks Hype progress (3 songs since the last live guarantee a Great Success) and ranks the songs you can learn next by value per token.
- The coach puts "Learn ..." in front of its recommendation when you can afford a good song.
- Extra Stat Gain songs add their permanent bonus to the gain formula right away. Friendship Bonus songs start counting after the next live.
- Key turns: lessons unlock on turn 5, Promo Lives on turns 24/36/48/60, the lyrics event in Early November of Senior year (16+ songs), and the Grand Live on turn 72 (18+ songs for the special Girls' Legend U).

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

## Data

`data/gametora.js` holds 563 support cards (effects at every level, unique effects, hint and event skills, JP and Global release dates), 270 trainees (aptitudes, growth bonuses, skills) and the skill names they reference. It comes from [GameTora](https://gametora.com/umamusume). Effect values at each level use a port of GameTora's own interpolation, so they match its card pages. Base training values per scenario come from GameTora's scenario pages. Onsen, Beyond Dreams and Trecen-ken haven't been published yet, so they use Island's values as a stand-in.

To refresh the data (needs network access to gametora.com):

```
python3 tools/build_data.py
```

The generated file is committed, so the coach works offline.

## Files

- `scenarios.js`: scenario data (mechanics, caps, base training values, key turns, deck advice, extra inputs).
- `data/gametora.js`: generated card, trainee and skill data. `tools/build_data.py` rebuilds it.
- `deck.js`: card effects at any level, unique effects and the training gain formula.
- `engine.js`: scoring, the energy lookahead, turn advance and undo. Pure functions, shared by the page and the tests.
- `app.js`, `style.css`, `index.html`: the page.
- `test/engine.test.js`: run with `node --test test/*.test.js`.

## Limits

These are estimates, not a game simulator. Support card event effects and Friend/Group outing rewards use approximate values (bond +5 per hint or outing, outings about +20 energy, +1 mood and a few stats). Exact per-event values need GameTora's training event data. Card effects and level-1 base training values come from GameTora's data. The increase per facility level, rest amounts, race rewards and scenario-specific bonuses are approximations. Real gains and failure rates from your screen always beat the built-in estimates. Turns marked "approx." are best-effort, so trust the in-game goal list when they disagree. The newest JP scenarios are based on launch-period guides.
