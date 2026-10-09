# Uma Turn Coach

A turn-by-turn training coach for *Umamusume: Pretty Derby* career scenarios. It covers every scenario on Global now, plus every JP scenario up to the latest, so you can practice ahead of Global.

Open `index.html` in a browser. It needs no build step or server, and it saves your run in the browser.

## How to use it

1. Pick the scenario and your build (distance). Under **Settings**, set the highest failure rate you accept, your deck's race bonus and max energy.
2. Each turn, set energy and mood. For each training, tap the dots for **Cards**, **Rainbow** (friendship) cards and cards with **Bond under 80**, and tick **Hint** if one shows.
3. Optional but recommended: type each training's **Gain** (the green numbers added up) and **Fail %**. Left blank, both are estimated from card counts and energy, and the estimate shows in the box.
4. The coach names the action and any item or buff to use first. It explains why, says what it beat and by how much, and predicts your energy and mood afterwards. Tap any row in **All options** to see its breakdown.
5. Press **Done, next turn**. The turn is logged, energy and mood carry forward, and the training inputs reset. If you did something else, press **I did this** on that option. **Undo last** steps back.
6. Under **Stats**, type your current stats and, if you like, your own **Target** for each (left blank, the build's targets apply). Past a target the coach values that stat less, so it steers you toward reaching every target.
7. Mark goal races with **☆ Mark goal race** on their turns. The coach then runs them and plans energy around them. Finale races are marked for you where they are fixed.

Shortcuts: ← and → change turns.

## Your deck and trainee (exact gains)

Open **Trainee and deck** and type your trainee and up to 6 support cards. Names autocomplete from the full database. Then set each card's limit break. From then on:

- each training shows your cards as chips. Tap the ones that appear there, and add **Others** for characters not in your deck;
- tap a card once for "here" and twice for "here with a hint (!)". Friendship (rainbow) is detected from each card's type and bond;
- bonds go up by 7 for each training together and about 5 more for a hint. Card events are logged with the **+5** / **+10** buttons, or by tapping the gauge color the game shows (Blue, Green, Orange 80+, Max);
- Friend and Group cards (Light Hello and others) track outings. Once **Outings unlocked** is ticked, "Outing with ..." is weighed against training as its own option. Each card's **Outings** list (from game8's card pages) shows which event unlocks them and which choice keeps them, then every outing with what each choice gives; the coach uses those values and tells you which choice to pick for this turn (the energy one when you're tired, the stat one when you're not). Covered: SSR Tazuna (both), Riko Kashimoto, Sasami Anshinzawa, Light Hello, SR Aoi Kiryuin, The Throne's Assemblage, Team Sirius (only its last outing is listed), and the JP friend and group cards (Mei Satake, Ryoka Tsurugi, Yayoi Akikawa, Tucker Bryne, Kiyoko Hoshina, Casino Drive, Ancestors & Guides, Carvers of History, Embodiment of Legends). Other cards (the R friend cards) use typical values, for up to 5 outings. Outing values are rescaled to your card's LB (its Event Recovery for energy, Event Effectiveness for stats), an outing that raises max energy raises it in the coach too (Light Hello's first: 104), and with **Track stats** on, outing stats are added to your current stats;
- every card has an **Events** list from the Umamusume Wiki: its event chain and other events, what each choice gives (ranges by LB shown at your card's), and a ★ on the better choice for this turn (the energy choice when you're tired, the stat choice when you're not). About 80% of Global cards have every event's results on the wiki; events without results yet show their title only;
- gains, skill points, energy cost and failure come from the game's training formula with your cards' real effects at their level: stat bonus, friendship, mood effect, training effectiveness, card count, your trainee's growth bonuses, plus energy cost reduction, failure protection and conditional unique effects such as bond-gated bonuses;
- your race bonus is added up from your cards automatically.

Scenario-specific boosts that the formula doesn't cover (Unity training, island facilities, springs and so on) use an estimated multiplier. Type the real total gain on a few turns and the coach corrects it.

**Support cards** and **Trainees** tabs browse the whole database:
- **Support cards**: filter by type, rarity, Global availability, limit break and whether you own the card, and sort by any effect. Tap a card for its effects at every limit break, its unique effect, hint skills, event skills and release dates.
- **Trainees**: aptitudes, growth bonuses and unique skill.

## Career goals

Picking a trainee loads her career goals from GameTora (her objectives list): fixed goal races are marked as goal races on their turns (★ on the turn strip, and the coach races them), "pick one" goals that fall on the same turn (Oaks or Derby) count as a goal race either way, "pick one" goals on different turns show as options you choose by tapping ★ on that turn, and fan or race-count goals show on the turn plan as deadlines. You can unmark any goal turn with the goal button. Scenarios with their own goal races (L'Arc) keep those, Trackblazer keeps only the debut (its goals are Grade Points), and every scenario's finale stays as before.

## Fan goals and races

The **Optional race open** list shows the races on this turn from the career calendar (GameTora) that fit your trainee's aptitudes (B or better), with their expected fans; **Fans** tracks your fan count (type it from the game; Done on a race adds the expected fans, with your deck's Fan Bonus). When a fan goal is coming, the coach plans it with the real races before the deadline, counting your goal races and races you can only enter with more fans: it says **race now** when later races can't cover it (and adds the best race this turn if you didn't pick one), says racing now is **worth it** when it saves you races later or fits the plan for free, and says you can **keep training** when bigger races later do the job, listing them. If the goal can't be reached with races that fit, it tells you to race every chance, since missing a goal ends the run.

## My cards

Mark the support cards you own and their limit break, with the **Owned** picker on any card or **Quick add** under **My cards** in the Support cards tab. They're saved in your browser. **Copy backup code** gives a short code (`UMA1:...`) you can keep or paste into **Restore** on another device. When you add a card you own to your deck, it starts at your limit break, and **Cards I own** limits the deck picker to your cards.

## CM & decks

Pick any Champions Meeting or League of Heroes:
- **Dates**: Global dates come from GameTora, and from alpha123's Umalator for cups announced since. Global runs the cups in JP's order, so later cups get an estimated date (about every 3 weeks) marked as an estimate. League of Heroes has only run on JP so far. Its Global slot is estimated from where it fell between JP cups.
- **Course**: track, distance, surface, direction, inner/outer layout, ground, weather and season. **Set the turn coach to ...** switches the coach's build to the race's distance.
- **Skills for this race**: every skill's median and mean length gain (L) on that course for the running style you pick, plus its SP cost, L per 100 SP, and which of your cards can give it. The numbers come from alpha123's Umalator skill chart. To use your own uma's results, run the Umalator's Skill chart, copy the table and paste it under **Use your own Umalator results**.
- **Deck optimizer**: builds the deck the way you'd use Euophrys' list: the best card, then the best card given that one, and so on, with Euophrys' scoring plus the skill score for the race, then rechecks each slot with the other five fixed. It searches the cards you own (at your limit breaks) or every Global SSR and SR at LB4. Options: **Deck makeup** (how many of each card type, borrowed card included), borrow one friend card, lock cards in, how much skills count, and the Euophrys settings. It shows each card's score, the next-best card for each slot, the best skills the deck can hint, a rough career estimate from the coach's simulation, and **Which cards would improve it?**. **Use this deck in the coach** fills your deck slots.

## Parent decks

The deck optimizer's **Build a deck for** switch has two parent modes, for training parents to inherit from for a Champions Meeting or League of Heroes:

- **Ace parent**: picks the cards whose hints and events give the most white skills that are strong on that race for your running style (each weighted by its median length gain), so the parent can learn them and pass them down as skill sparks.
- **Debuffer parent**: picks the cards that give the most debuffs that work on that race: distance-locked ones (Stamina Eater for Long, Intimidate for Sprint...), surface-locked ones (Dust Cloud on dirt) and style-locked ones (Intense Gaze for End Closers) only when they fit. Only white skills count in both modes, since gold skills don't become skill sparks. The debuff list comes from the Umalator's skill data (`tools/build_debuffs.js`).

Unlike a racing deck, every target skill counts (not just the best 8), and **Stats still count** sets how much Euophrys' stat score matters. The result lists how many target skills to expect and each one's chance. Deck makeup, owned cards, borrowing and locked cards work the same way.

## Tier list

[Euophrys' tier list](https://euophrys.github.io/uma-tiers/), with skills added. The base score is Euophrys' own code, card data and scenario presets (URA, Unity Cup, Trackblazer, Grand Concert, Grand Masters), bundled unchanged (MIT): the extra weighted stats a card adds to the deck you have so far. With skills set to "Not at all" the ranking is exactly Euophrys'. On top comes a **skill score**: each skill the card can hint or give through its events, valued by its median length gain (L) on the race you pick for your running style (1 L counts like 60 Speed in Euophrys' weights) plus the SP the hint discount saves, only for skills your deck and trainee don't already cover. The total is Euophrys' score plus this skill score.

- Pick the card type, rarity, limit breaks (all, LB4, or yours), Global only, or only cards you own.
- Tap a card to add it to "your deck so far" and the list re-ranks for your next pick, like on Euophrys' site. You can start from your coach deck or one of Euophrys' preset decks, and send the result back to the coach.
- **Euophrys settings** shows and edits the scenario preset and weights (stat weights, cap, races, bond per turn, rainbow multiplier, mood), with a reset to Euophrys' defaults. The preset follows the coach's scenario; scenarios Euophrys doesn't cover yet use Grand Masters.
- The trainee (shared with the coach) applies her growth bonuses, leaves out her own character's cards and skips skills she already has.
- Under each card you can show its score split (Euophrys + skills), best skills on the race, event bond, initial bond, race bonus, friendship, training effectiveness, specialty, mood effect or hint frequency.

## Grand Concert

A **Grand Concert songs** panel appears in this scenario:
- Tokens add up by themselves: each training card shows the token it gives (its usual type, with an estimated amount). Set the type and amount the training shows if they differ (friendship training gives a second type), and **Done** adds them, capped at 200 (+50 after each live). **Undo** takes them back. You can still type your tokens directly, and ticking a song takes its cost off.
- **Song plan** (a CM ace guide, with 5 songs in year one): year one, buy 5 songs, do 2 more technique lessons so the 6th shows, and carry it over to right after the 1st Promo Live; every half year after, buy the carried song, 1 lesson, a song, 2 lessons, a song, 2 lessons, carry over (3 songs a half year); before the Grand Live, buy that 4th song too for 18 songs. Count your technique lessons with **+ technique lesson** and the panel says what's next ("Do 2 technique lessons, then buy song 3 of 5", "Hold the next song for after the live"). The coach only suggests buying a song when the plan says so, favours the two skill point songs in year two and the two +10% friendship songs in year three, and skips the +Stamina and +Guts songs in year one.
- **Opening and resets**: turns 1-4 favour bonds, Wit and a rest so you go into turn 5 with high energy (common: Train x3, then Rest); turns 5-11 favour trainings with Light Hello and the cards closest to friendship. Reset checks sit on the debut (a rainbowing card or Light Hello's +20 event) and the end of year one (5 songs and the 6th held). Resets are normal here for CM aces (around 85%).
- It tracks Hype progress (3 songs since the last live guarantee a Great Success) and ranks the songs you can learn next by value per token.
- Trainings count the tokens they give toward the songs you still need (only what those songs lack, and under the token cap), so between two close trainings the coach takes the one that gets your next song sooner.
- The coach puts "Learn ..." in front of its recommendation when you can afford a good song.
- Extra Stat Gain songs add their permanent bonus to the gain formula right away. Friendship Bonus songs start counting after the next live.
- Key turns: lessons unlock on turn 5, Promo Lives on turns 24/36/48/60, the lyrics event in Early November of Senior year (16+ songs), and the Grand Live on turn 72 (18+ songs for the special Girls' Legend U).

## Scenario-specific rules

Each scenario's rules come from GameTora's scenario articles:

- **Chairman Akikawa** (URA Finale, Grand Concert, Grand Masters, Island, Trackblazer): tick **Akikawa here** on the training she's on. Training with her adds about 7 to her bond (**Akikawa bond** keeps the count), and before her bond check (green, 60+, by Senior Early April; Trackblazer: 20, 40 and 60 at each Late December) that training is worth more, the more so when few turns are left.

- **URA Finale**: Happy Meek duel rewards; Akikawa's +30 energy snack at the end of Late July (years 2 and 3), counted in camp rest decisions; the Early March mood event; fan milestones.
- **Unity Cup**: Special Training by white-flame count, exact Spirit Burst and Extreme Spirit Burst values (Wit bursts +5 energy, Extreme sets failure to 0%), a burst counter for Team Zenith's Senior Late November event, facility levels from team rank, URA Finals at the end.
- **Trackblazer**: Grade Points by race grade, expected shop coins, a penalty for a 3rd race in a row (unless it ends the year) and a steep one for a 4th, and shop items. The best race this turn that fits your trainee (most Grade Points, then fans) is always weighed against training, as the guides race 30-40 times a career and train only on strong turns. A **Grade Point plan** tracks each year's goal (60, then 300 and 300; 30 and 200 for dirt specialists, 200 in Classic for sprint-only turf trainees), due each Late December: it counts down as you race (counting a win, so type the real number if you place lower), resets each December since surplus doesn't carry over, and says when a race can't wait, like the fan planner. Energy drinks are weighed against resting, cupcakes against outings; also the Reset Whistle on weak turns, Cleat Hammers on races, Megaphones, Ankle Weights and Charms. Umamusume of the Year bond checks.
- **Grand Concert**: songs panel (see above).
- **Grand Masters**: correct Goddess Wisdom effects (Red: +50 energy, max mood, past level 5, +35% race stats; Blue: a hint per card; Yellow: every card counts as friendship), each tried on every training. A ready Wisdom is used right away (no fragments drop while you hold 8), held when summer camp is a turn or two off, and Red counts the year-end race when it's ready on a Late December turn. The guide covers which goddess to level first (Red in Junior) and which goddess skill to aim for. Year-end races don't use a turn; the Grand Masters race comes after 5 extra training turns, with no URA Finals.
- **Project L'Arc**: the fixed goal races (Japan Derby, Prix Niel, both Arcs, Takarazuka Kinen, Prix Foy) are marked automatically; no SS Matches or Star gauge during the France expeditions; the Expectation gauge raises facility levels at 20/60/100%. A 5-member SS Match is run right away, and one at low energy is worth less (it can be lost, halving the stats).
- **U.A.F.**: genre per training for Link Training, per-genre base values, Wit costing 15 energy, Consultation advice, tournament dates.
- **Great Food Festival**: names the right dish (Sandwich, Curry, single-stat dishes, G1 Plate) for the training it picks, and cooks whenever it can in Junior (Cooking Points boost training for the rest of the run). Tasting party targets are on the turn plan.
- **Mecha**: Overdrive on strong trainings, and stored charges spent before the URA Finals. Exam turns carry the tuning plan and the reset check (restart on an A).
- **Legends**: legends are named rather than coloured, since guides disagree on the colours. The guidance turn and the My Race event are on the plan.
- **Island**: one ticket until Senior Early September; Island Training before Classic camp, and the ticket kept through Senior camp unless the turn is exceptional.
- **Onsen**: baths, PR activity as a last resort, bathing party level-ups, and a Junior November reset check (fewer than 2 springs dug).
- **Beyond Dreams**: DREAMS trainings saved for strong turns but used before each half year ends, 4 after Senior June's meeting, favoured when all three gauges are full early on and avoided on rank-up turns later.
- **Trecen-ken**: tasting sessions before friendship trainings, and before tips reset after each Late December.
- Every scenario's guide (shown with the scenario) covers its opening, plan and reset checks where guides give them: the Global ones from GameTora and English guides, the JP-only ones mostly from game8.

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

**Automatic updates:** `.github/workflows/update-data.yml` runs every day (and on demand from the Actions tab). It rebuilds the GameTora and Euophrys data, and when there are new cards, trainees, Global release dates or event values and the tests pass, it commits them to `main`, bumps the `?v=` cache version and asks GitHub Pages to rebuild. Cards and trainees also switch to "on Global" by themselves on their Global release date. Champions Meeting dates and skill values still need a manual rebuild (see below), since they depend on the Umalator's files.

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
- `data/dates.js`: Friend and Group card outings (unlock event and each outing's rewards), from game8's card pages.
- `data/card-events.js`: every support card's training events and their results, from the Umamusume Wiki (CC BY-SA 4.0). Built by `tools/build_card_events.py`, refreshed daily.
- `data/gametora.js`: generated card, trainee and skill data. `tools/build_data.py` rebuilds it.
- `deck.js`: card effects at any level, unique effects and the training gain formula.
- `engine.js`: scoring, the energy lookahead, turn advance and undo. Pure functions, shared by the page and the tests.
- `tiers.js`: tier list ranking and deck building on Euophrys' scoring plus skills. `vendor/euophrys.js` and `data/euophrys-cards.js` are Euophrys' code and card data (MIT), rebuilt with `node tools/build_euophrys.mjs`.
- `optimizer.js`: the coach's career simulation, used for the rough career estimate.
- `data/presets.js`, `data/skillvalues/`: CM/LoH presets and per-race skill values (generated, see Data).
- `tools/`: data builders, including the headless Umalator runner.
- `app.js`, `style.css`, `index.html`: the page.
- `test/`: run with `node --test test/*.test.js`.

## Limits

These are estimates, not a game simulator. Support card event effects use approximate values (bond +5 per hint or outing). Friend and Group outings use game8's values at the card level game8 lists (usually full limit break, so a lower-LB card gives a little less); outings that roll a great success or can fail are counted half and half, since the odds aren't published. Card effects and level-1 base training values come from GameTora's data. The increase per facility level, rest amounts, race rewards and scenario-specific bonuses are approximations. Real gains and failure rates from your screen always beat the built-in estimates. Turns marked "approx." are best-effort, so trust the in-game goal list when they disagree. The newest JP scenarios are based on launch-period guides.

The deck optimizer ranks decks with a simplified career simulation, not a full game simulator: card events, outings and scenario-specific mechanics are approximate, so treat close results (a few percent apart) as ties. Skill values are for one fixed stat line per distance with no other skills, like the Umalator's default chart. Your own uma's numbers can differ, which is what the paste box is for. Global dates past the announced cups are estimates.
