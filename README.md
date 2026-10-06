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
- **Support cards**: filter by type, rarity, Global availability, limit break and whether you own the card, and sort by any effect. Tap a card for its effects at every limit break, its unique effect, hint skills, event skills and release dates.
- **Trainees**: aptitudes, growth bonuses and unique skill.

## My cards

Mark the support cards you own and their limit break, with the **Owned** picker on any card or **Quick add** under **My cards** in the Support cards tab. They're saved in your browser. **Copy backup code** gives a short code (`UMA1:...`) you can keep or paste into **Restore** on another device. When you add a card you own to your deck, it starts at your limit break, and **Cards I own** limits the deck picker to your cards.

## CM & decks

Pick any Champions Meeting or League of Heroes:
- **Dates**: Global dates come from GameTora, and from alpha123's Umalator for cups announced since. Global runs the cups in JP's order, so later cups get an estimated date (about every 3 weeks) marked as an estimate. League of Heroes has only run on JP so far. Its Global slot is estimated from where it fell between JP cups.
- **Course**: track, distance, surface, direction, inner/outer layout, ground, weather and season. **Set the turn coach to ...** switches the coach's build to the race's distance.
- **Skills for this race**: every skill's median and mean length gain (L) on that course for the running style you pick, plus its SP cost, L per 100 SP, and which of your cards can give it. The numbers come from alpha123's Umalator skill chart. To use your own uma's results, run the Umalator's Skill chart, copy the table and paste it under **Use your own Umalator results**.
- **Deck optimizer**: finds the best 6 cards among the cards you own, or every Global SSR and SR at max limit break. It plays simulated careers in the scenario picked at the top, with the same card formula as the coach: specialty priority, friendship training, bond, facility levels, energy, rests, failure and optional races with your race bonus. Every skill the deck can hint is valued by its median L on the chosen course minus its SP cost. Pick the trainee right there (shared with the coach): her growth bonuses count, her own character's cards and the skills she already has are left out. Options: borrow one friend card, lock cards in, and choose how much skills count. It never puts the same character in twice or uses your trainee's own character. Results show what each card adds, the expected final stats and SP, the best skills the deck can hint, close alternatives, and **Which cards would improve it?**, a list of cards to pull or limit break next. **Use this deck in the coach** fills your deck slots.

## Tier list

Like [Euophrys' tier list](https://euophrys.github.io/uma-tiers/): every card at every limit break (or LB4 only, or your own limit breaks), ranked S to F by what it adds to the deck you have so far. Pick a **Trainee** (shared with the coach and the deck optimizer): her growth bonuses count, her own character's cards are left out, and it shows her aptitude for the race and offers her best running style. Tap a card to add it and the list re-ranks for your next pick; **Load my coach deck** starts from your current deck and **Use in the coach** sends it back. On top of Euophrys' approach, each score comes from simulated careers in your scenario, and adds the skills the card can hint, valued by their median length gain on the race you pick (and running style). Under each card you can show its best skills there, event bond, initial bond, race bonus, friendship, training effectiveness, specialty, mood effect, or the stats and SP it adds. Owned cards are ringed.

## Grand Concert

A **Grand Concert songs** panel appears in this scenario:
- Type your tokens from the lesson screen and tick songs as you learn them.
- It tracks Hype progress (3 songs since the last live guarantee a Great Success) and ranks the songs you can learn next by value per token.
- The coach puts "Learn ..." in front of its recommendation when you can afford a good song.
- Extra Stat Gain songs add their permanent bonus to the gain formula right away. Friendship Bonus songs start counting after the next live.
- Key turns: lessons unlock on turn 5, Promo Lives on turns 24/36/48/60, the lyrics event in Early November of Senior year (16+ songs), and the Grand Live on turn 72 (18+ songs for the special Girls' Legend U).

## Scenario-specific rules

Each scenario's rules come from GameTora's scenario articles:

- **URA Finale**: Happy Meek duel rewards; Akikawa's +30 energy snack at the end of Late July (years 2 and 3), counted in camp rest decisions; the Early March mood event; fan milestones.
- **Unity Cup**: Special Training by white-flame count, exact Spirit Burst and Extreme Spirit Burst values (Wit bursts +5 energy, Extreme sets failure to 0%), a burst counter for Team Zenith's Senior Late November event, facility levels from team rank, URA Finals at the end.
- **Trackblazer**: Grade Points by race grade, expected shop coins, a steep penalty for a 4th race in a row, and shop items. Energy drinks are weighed against resting, cupcakes against outings; also the Reset Whistle on weak turns, Cleat Hammers on races, Megaphones, Ankle Weights and Charms. Umamusume of the Year bond checks.
- **Grand Concert**: songs panel (see above).
- **Grand Masters**: correct Goddess Wisdom effects (Red: +50 energy, max mood, past level 5; Blue: a hint per card; Yellow: every card counts as friendship), each tried on every training. Year-end races don't use a turn; the Grand Masters race comes after 5 extra training turns, with no URA Finals.
- **Project L'Arc**: the fixed goal races (Japan Derby, Prix Niel, both Arcs, Takarazuka Kinen, Prix Foy) are marked automatically; no SS Matches or Star gauge during the France expeditions; the Expectation gauge raises facility levels at 20/60/100%.
- **U.A.F.**: genre per training for Link Training, per-genre base values, Wit costing 15 energy, Consultation advice, tournament dates.
- **Great Food Festival**: names the right dish (Sandwich, Curry, single-stat dishes, G1 Plate) for the training it picks.
- **Mecha / Legends / Island / Onsen / Beyond Dreams / Trecen-ken**: exam, Dream Fest, assembly, bathing party and review dates; URA Finals where the scenario has them; Onsen's party level-ups; DREAMS trainings saved for strong turns but used before each half-year ends.

Facility levels are counted from your logged trainings (every 4 raise one level), with skipped turns estimated from your training mix. Unity Cup uses team rank and U.A.F. uses sport level instead. You can always pick the real level shown in the game.

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

Card event rewards (stats, skill points, energy and **bond** each card's events give over a career) come from the event table in [Euophrys' tier list](https://github.com/Euophrys/umamusume-tierlist) (MIT). Cards it doesn't list yet use its fallback (+5 bond, +7/+9 to every stat for SR/SSR) and are marked as estimates. Each deck slot shows its card's total event bond.

`data/gametora.js` holds 563 support cards (effects at every level, unique effects, hint and event skills, JP and Global release dates), 270 trainees (aptitudes, growth bonuses, skills) and the skill names they reference. It comes from [GameTora](https://gametora.com/umamusume). Effect values at each level use a port of GameTora's own interpolation, so they match its card pages. Base training values per scenario come from GameTora's scenario pages. Onsen, Beyond Dreams and Trecen-ken haven't been published yet, so they use Island's values as a stand-in.

To refresh the data (needs network access to gametora.com):

```
python3 tools/build_data.py
```

The generated file is committed, so the coach works offline.

Champions Meeting and League of Heroes presets (`data/presets.js`) come from GameTora's event lists plus alpha123's Umalator preset lists:

```
python3 tools/build_presets.py <GameTora cache dir> <umalator-global bundle.js> <umalator bundle.js> <umalator course_data.json> presets.json
```

Skill values (`data/skillvalues/`) come from running alpha123's [Umalator](https://alpha123.github.io/uma-tools/umalator-global/) headless: `tools/umalator_run.js` loads its `simulator.worker.js` in Node and runs the same skill chart as the site, for every skill, preset and running style, with a strong Global stat line for the distance. The values match the website's own skill chart exactly for the same setup. uma-tools is GPL-3.0 and none of its code is included here: the runner loads a downloaded copy at build time, and only the resulting numbers are committed. Cups Global has announced use the Global Umalator; later cups and League of Heroes use the JP one, which has every course. To rebuild (takes a few hours on 4 cores, and resumes if stopped):

```
node tools/build_skillvalues.js presets.json <umalator-global dir> <umalator dir> <cache dir> --workers=4
node tools/build_skillvalues.js presets.json <umalator-global dir> <umalator dir> <cache dir> --compose=data/skillvalues --skills=<GameTora skills.json>
```

When releasing a change to the site, bump the `?v=` number on the file links in `index.html` so browsers fetch the new files instead of cached ones.

## Files

- `scenarios.js`: scenario data (mechanics, caps, base training values, key turns, deck advice, extra inputs).
- `data/gametora.js`: generated card, trainee and skill data. `tools/build_data.py` rebuilds it.
- `deck.js`: card effects at any level, unique effects and the training gain formula.
- `engine.js`: scoring, the energy lookahead, turn advance and undo. Pure functions, shared by the page and the tests.
- `optimizer.js`: career simulation and deck search; `optimizer.worker.js` runs it off the main thread.
- `data/presets.js`, `data/skillvalues/`: CM/LoH presets and per-race skill values (generated, see Data).
- `tools/`: data builders, including the headless Umalator runner.
- `app.js`, `style.css`, `index.html`: the page.
- `test/`: run with `node --test test/*.test.js`.

## Limits

These are estimates, not a game simulator. Support card event effects and Friend/Group outing rewards use approximate values (bond +5 per hint or outing, outings about +20 energy, +1 mood and a few stats). Exact per-event values need GameTora's training event data. Card effects and level-1 base training values come from GameTora's data. The increase per facility level, rest amounts, race rewards and scenario-specific bonuses are approximations. Real gains and failure rates from your screen always beat the built-in estimates. Turns marked "approx." are best-effort, so trust the in-game goal list when they disagree. The newest JP scenarios are based on launch-period guides.

The deck optimizer ranks decks with a simplified career simulation, not a full game simulator: card events, outings and scenario-specific mechanics are approximate, so treat close results (a few percent apart) as ties. Skill values are for one fixed stat line per distance with no other skills, like the Umalator's default chart. Your own uma's numbers can differ, which is what the paste box is for. Global dates past the announced cups are estimates.
