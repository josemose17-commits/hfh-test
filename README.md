# Uma Turn Coach

A turn-by-turn training coach for *Umamusume: Pretty Derby* career scenarios. It covers every scenario on Global now, plus every JP scenario up to the latest, so you can practice ahead of Global.

Open `index.html` in a browser. It needs no build step or server, and it saves your run in the browser.

## How to use it

1. Pick the scenario and your build (distance). Under **Settings**, set the highest failure rate you accept (past it each point costs a lot, so the coach only goes over when every other choice is much worse), your deck's race bonus and max energy. Each new career starts at 100 max energy; outings that raise it (Light Hello's first: +4) add it during the run.
2. Each turn, set energy and mood. For each training, tap the dots for **Cards**, **Rainbow** (friendship) cards and cards with **Bond under 80**, and tick **Hint** if one shows.
3. Optional but recommended: type each training's **Gain** (the green numbers added up) and **Fail %**. Left blank, both are estimated from card counts and energy, and the estimate shows in the box.
4. The coach names the action and any item or buff to use first. It explains why, says what it beat and by how much, and predicts your energy and mood afterwards. Tap any row in **All options** to see its breakdown.
5. The **Run check** box (when a check applies) says whether to keep going or reset the run. See [When to reset](#when-to-reset).
6. If a call looks wrong, open **This call looks wrong?** under it, say why, and copy the report: it has the turn's inputs, deck, tokens and every option's score, so it can be checked and the coach fixed.
7. If the training failed, pick **Failed** (the usual "Get Well Soon!" event: mood -1, -5 to that stat) or **Failed badly** ("Don't Overdo It!", only at 20%+ failure: mood -3, +10 energy with the top choice, -10 to that stat and 2 random stats) under **Training result** before pressing Done. A failed training still uses its energy but gives no stats, bond, tokens or facility progress. Fix the 2 random stats in Stats yourself. If the failure gave you Practice Poor, tick **Got Practice Poor** in the same row (or **Practice Poor** next to Bad condition at any time): while it's on, the coach adds 2% to estimated failure on stat trainings (a failure you type already includes it) and weighs the **Infirmary** (or an outing that cures) against the turns it would cost you. Then press **Done, next turn**. The turn is logged, energy and mood carry forward, and the training inputs reset. If you did something else, press **I did this** on that option. **Undo last** steps back.
8. Under **Stats**, type your current stats and, if you like, your own **Target** for each (left blank, the build's targets apply), and your **Stat priority** (five boxes, most important first: picking a stat for a rank moves it there; **Use the build's order** undoes it). The coach fills stats in that order, each up to its target. Targets and priority carry over to your next career. A stat far below its target counts for more and a stat past it counts less, so the coach steers you toward reaching every target. Under **Sparks ★** type the stars of each blue spark your parents give for that stat (like `3 3 2`): each raises the cap (1 star +4, 2 stars +9, 3 stars +16), and the **Cap** box shows the result. Type the cap your game shows to override it.
9. Mark goal races with **☆ Mark goal race** on their turns. The coach then runs them and plans energy around them. Goal races (career objectives and finale races) cost no energy, except in Trackblazer, where even the debut costs energy; optional races cost about 15. Finale races are marked for you where they are fixed.

Shortcuts: ← and → change turns.

## Your deck and trainee (exact gains)

Open **Trainee and deck** and type your trainee and up to 6 support cards. Names autocomplete from the full database. Then set each card's limit break. From then on:

- each training shows your cards as chips. Tap the ones that appear there, and add **Others** for characters not in your deck;
- tap a card once for "here" and twice for "here with a hint (!)". Friendship (rainbow) is detected from each card's type and bond. If the game shows a different number of rainbows (bonds drift when you start a run partway or miss events), set **Rainbow (as in game)** on that training: it fixes those cards' bonds, so this turn and later ones come out right;
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

## When to reset

At each reset point the **Run check** box in the call answers what the coach already knows (bonds from your deck, songs you've marked, a song ticked in your shop, the Light Hello +20 tick) and only asks what it can't know (Yes/No, a number or an exam rank). Tap **Not right?** next to an answer to give your own. It decides from the answers:
- **Passed**: keep going.
- **Missed**: **Reset this run**, with two choices: **Reset: start a new career** (tap twice), or **Continue and finish this run** (the coach stops asking about that check). Either way a **Run summary** opens: add a note and press **Copy run summary**, then paste it to me. It has the checks and your answers, stats against targets, stat priority, deck and bonds, songs and tokens, and every turn you logged, so the coach can be fixed. It's offered again when the run ends.

The checks (under **Settings → Reset advice**: **Building an ace (strict)**, the default, **Only when a goal is lost**, or **Off**):
- **Career goals** (every mode): a fan or Grade Point goal that even winning every race that fits you can't reach. A warning first, since races outside your aptitudes can still save it, and a reset with 2 or fewer turns to the deadline.
- **Grand Concert**: on the debut (turn 12), "Is any stat card's bond orange (80+)?" and "Has Light Hello given her +20 event?" (the **Light Hello +20 event** box counts as a yes): no to both is a reset. On turn 23, "How many songs have you bought?" and "Is a 6th song showing, held for after the live?": fewer than 5, or no 6th, is a reset (the CM-ace guide).
- **Mecha**: after each Upgrade Exam (turns 24, 36, 48, 60), "What rank did you get?": an A or lower is a reset (game8).
- **Yukoma Hot Springs**: on turn 21 (Junior November), "How many springs have you dug?": fewer than 2 is a reset (game8).
- **Bonds** (every scenario, ace mode): going into Classic (turn 24), "Are most of your stat cards (60% or more) at friendship?": a no is a warning, never a reset on its own.

## My cards

Mark the support cards you own and their limit break, with the **Owned** picker on any card or **Quick add** under **My cards** in the Support cards tab. They're saved in your browser. **Copy backup code** gives a short code (`UMA1:...`) you can keep or paste into **Restore** on another device. When you add a card you own to your deck, it starts at your limit break, and **Cards I own** limits the deck picker to your cards.

## CM & decks

Pick any Champions Meeting or League of Heroes:
- **Dates**: Global dates come from GameTora, and from alpha123's Umalator for cups announced since. Global runs the cups in JP's order, so later cups get an estimated date (about every 3 weeks) marked as an estimate. League of Heroes has only run on JP so far. Its Global slot is estimated from where it fell between JP cups.
- **Course**: track, distance, surface, direction, inner/outer layout, ground, weather and season. **Set the turn coach to ...** switches the coach's build to the race's distance.
- **Skills for this race**: every skill's median and mean length gain (L) on that course for the running style you pick, plus its SP cost, L per 100 SP, and which of your cards can give it. The numbers come from alpha123's Umalator skill chart. To use your own uma's results, run the Umalator's Skill chart, copy the table and paste it under **Use your own Umalator results**.
- **Deck optimizer**: builds the deck the way you'd use Euophrys' list: the best card, then the best card given that one, and so on, with Euophrys' scoring plus the skill score for the race, then rechecks each slot with the other five fixed. It searches the cards you own (at your limit breaks) or every Global SSR and SR at LB4. Options: **Deck makeup** (how many of each card type, borrowed card included), borrow one friend card, lock cards in, how much skills count, and the Euophrys settings. It shows each card's score, the next-best card for each slot, the best skills the deck can hint, a rough career estimate from the coach's simulation, and **Which cards would improve it?**. **Use this deck in the coach** fills your deck slots.
- **Target stats**: type the stats you're aiming for (blank boxes use the race build's targets, or press **Use the turn coach's targets**). The optimizer starts from Euophrys' pick, then simulates careers and tries the best few cards of each type in every slot, keeping a swap when the predicted stats end closer to your targets. Every point short counts, a big miss counts extra, and a miss in a stat your distance leans on (Speed most) counts up to double. Skills, must-haves, locked cards and the deck makeup still count, and it keeps to one Friend and one Group card unless your makeup asks for more. The result shows predicted stats against your targets, how far short the deck ends in total compared with Euophrys' pick, and which cards it swapped.
- **Predicted stats**: the average of 16 simulated careers with the deck. They include your trainee's starting stats and growth bonuses, every training turn to the finale (cards dealt onto trainings by specialty priority, the best training for your targets picked each turn, rests and failures by energy), the game's training formula (friendship at bond 80+, training effectiveness, stat bonuses, mood effect, unique effects), facility levels, bonds, each card's event stats, about 120 per stat from random events, optional races on about 1 turn in 10 with your race bonus, half gains past 1200, your stat caps with sparks, and a flat multiplier for the scenario's own bonuses. They leave out inheritance, goal and finale race rewards, friend card outings, New Year events, hint events' stats, scenario mechanics beyond the multiplier (songs, items, Overdrive...), and mood drops (Great mood all career), so real runs usually end higher, mostly from inheritance. Use them to compare decks.
- **Independent Training** (the 50-minute auto mode; a checkbox in the optimizer and the tier list): uma.guide notes a card's 3rd chain event rarely fires there, so skills only that event (or a later one) gives count at 20% of their usual chance, using the Umamusume Wiki's event data to tell which chain step gives each skill. Race Bonus counts for a G1-heavy parent agenda (15 G1 and 3 G2/G3 races in Euophrys' settings, unless you set your own), and the predicted stats race about 1 turn in 4. Races there are won on distance and surface aptitude alone, so stats only matter for sparks and rating. In Grand Concert, Light Hello goes in (uma.guide calls the scenario's link card mandatory there): your best copy is locked in, or she's the borrowed card, or the result says she's missing.
- **Parent decks with target stats**: ace and debuffer parents can use target stats too (**Blue spark targets** sets 1100 each). A blue spark's stat is picked at random, and its value sets the odds of 3 stars (uma.guide: none under 600, 5% to 1100, 10% over), so the predicted stats show each stat's 3★ chance. Skills are still the point: **Stats still count** sets how much of the skill score the search may give up to get closer (A little 4%, Some 10%, Half 20%, Fully 40%). Parent decks may take up to 2 Friend and 2 Group cards there, since players report they add a lot of skill points toward an SS rating. Cards' starting bonuses (Initial Speed..Wit, Initial Skill Points) count in the simulated careers, so a card like SSR Speed Matikanefukukitaru (+30 to every stat) gets its due.
- **Must-have skills**: type a skill under **Must-have skills** (the list has every skill a Global support card can give) or tap ☆ next to it in **Skills for this race**. The optimizer then puts in a card that can hint each one or give it through an event, before anything else counts, and favours cards with a better chance to offer it (an event beats a random hint). The chip shows how many of your cards give it. The result says how likely you are to be offered each must-have and from which card, or, when none of your cards gives it, which cards do. Skills your trainee already has need no card.

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

A **Grand Concert** section appears in this scenario, kept short:
- **Get**: what to buy in your lesson shop right now (or **Hold** a song for after the live), with **Undo** for your last buy.
- **Your shop**: tick what the game's shop shows and tap **Bought** when you buy one (it takes the tokens, marks the song learned or counts the technique with its stats or energy, and clears the ticks for the shop's new offers). **Songs** (the ones you can learn now, most important first; open it when your shop shows songs) and **Techniques** (the best 4, more under **more**). Pressing Done on a call that buys a song or technique does the same, even if the training fails.
- **Songs first**: the coach buys the most important song your shop shows that you can afford. Techniques are what make songs show up, so while this half still wants songs it picks the technique that keeps your next song's tokens (cheapest first); once the half's songs are bought, spare tokens go to the best stat technique. There's no technique counter to keep: the songs you've bought set the song plan.
- A status line (this half's songs, Hype for the next live, songs toward the 18) and the **Next** scenario reward with what you'll get so far.
- **Tokens**: your five piles. Done adds each training's tokens (uma.guide's formula: (9 + facility level) × 1.15 per support card, +2 per scenario-link card; Wit starts from 5; 60% main type, 30% second, 10% other; a friendship training adds your scarcest type), Bought takes a lesson's cost, capped at 200 (+50 after each live). Trainings give none before turn 5.
- **Songs you have**: chips for the songs you've learned, × to remove one, and **+ add a song you already have** (neither touches your tokens).
- **More** (folded): the song plan and this half's token budget, the token plan, the token aim, and every **scenario reward** (Make Debut! on turn 5: +10 of every token and it counts as a song; Light Hello's first training; the New Years; each Promo Live: all stats +10 with 3+ songs since the last live, +3 otherwise, 5 SP per technique and 25 per song, token cap +50; the lyrics event; GIRLS' LEGEND U: all stats +10 and Friendship +10%). Done adds Make Debut!'s tokens going into turn 5 and each live's stats.
- **Technique costs** (uma.guide): Stat +5/+8/+12 for 10/16/24 of that stat's type, Skill Points +5/+8/+12 for 10/16/24 of the type shown, from the 2nd half year Stat & SP (10 + 6, then 14 + 10) and 2 Stats (8 + 8, then 12 + 12), Energy +20/30/40 for 25/30/35 and skill hints Lv +1/2/3 for 15/25/35. Each pays 5 SP at the next live. An Energy technique in your shop is weighed against resting, and put in front of the call when it wins.
- **Song plan** (a CM ace guide, with 5 songs in year one): year one, buy 5 songs, then hold the 6th for right after the 1st Promo Live; every half year after, the carried song and 2 more, then hold the next; before the Grand Live, buy that 4th song too for 18 songs. It favours the two skill point songs in year two and the two +10% friendship songs in year three, and skips the +Stamina and +Guts songs in year one.
- **Opening and resets**: turns 1-3 favour bonds and Wit; on turn 4 (the game shows 9 turns to your debut) Rest is the pick unless energy is 85 or more, so you go into turn 5 full. Light Hello shows up from turn 5: the first time she's on a training, the coach takes it wherever she is (as long as its failure is within your limit), since her fixed first-training event gives mood +1, Speed +13, Guts +13 and +10 bond, and her outings can't open without it. On Done the coach adds that bond and mood for you (and the stats, with Track stats on). After that she's a normal card, plus her Training Together event's chance at 20 points of your scarcest type; until the debut the cards closest to friendship come next. Reset checks sit on the debut (a rainbowing card or Light Hello's +20 event) and the end of year one (5 songs and the 6th held). Resets are normal here for CM aces (around 85%).
- **Token aim**: the songs to buy in order, most important first: the ones you can buy now, then the ones that unlock later (the 18 that matter most, counting what you've learned). A song's importance is what its bonus is worth for your stat priority over the rest of the run, with the song plan's picks first and its skips last. Each song shows what it still needs, counting the tokens the songs above it use first, and **affordable** when you can buy it without taking tokens a more important song needs. Trainings get credit (**Song tokens** in each option's breakdown) for tokens that fill the top song's gap first, then the next one's, each song down the list counting less; tokens past the cap or past what the songs need count for nothing. On top of that, every token counts for the technique lessons it buys. The total is capped at about one typical training, so a much stronger training still wins.
- A **Token plan** table below adds it up: what the songs left cost by token type, what you hold, and roughly what training brings by the Grand Live, plus the technique lessons still needed.
- Extra Stat Gain songs add their permanent bonus to the gain formula right away. Friendship Bonus songs start counting after the next live.
- Key turns: lessons unlock on turn 5, Promo Lives on turns 24/36/48/60, the lyrics event in Early November of Senior year (16+ songs), and the Grand Live on turn 72 (18+ songs for the special Girls' Legend U).

## Scenario-specific rules

Each scenario's rules come from GameTora's scenario articles:

- **Chairman Akikawa** (URA Finale, Grand Concert, Grand Masters, Island, Trackblazer): tick **Akikawa here** on the training she's on. Training with her adds about 7 to her bond (**Akikawa bond** keeps the count), and before her bond check (green, 60+, by Senior Early April; Trackblazer: 20, 40 and 60 at each Late December) that training is worth more, the more so when few turns are left.

- **URA Finale**: Happy Meek duel rewards; Akikawa's +30 energy snack at the end of Late July (years 2 and 3), counted in camp rest decisions; the Early March mood event; fan milestones.
- **Unity Cup**: Special Training by white-flame count, exact Spirit Burst and Extreme Spirit Burst values (Wit bursts +5 energy, Extreme sets failure to 0%), a burst counter for Team Zenith's Senior Late November event, facility levels from team rank, URA Finals at the end.
- **Trackblazer**: Grade Points by race grade, expected shop coins, a penalty for a 3rd race in a row (unless it ends the year) and a steep one for a 4th, and shop items. The best race this turn that fits your trainee (most Grade Points, then fans) is always weighed against training, as the guides race 30-40 times a career and train only on strong turns. A **Grade Point plan** tracks each year's goal (60, then 300 and 300; 30 and 200 for dirt specialists, 200 in Classic for sprint-only turf trainees), due each Late December: it counts down as you race (counting a win, so type the real number if you place lower), resets each December since surplus doesn't carry over, and says when a race can't wait, like the fan planner. Energy drinks are weighed against resting, cupcakes against outings; also the Reset Whistle on weak turns, Cleat Hammers on races, Megaphones, Ankle Weights and Charms. Umamusume of the Year bond checks.
- **Grand Concert**: the Grand Concert section (see above).
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

Facility levels are counted from your logged trainings (every 4 raise one level), with skipped turns estimated from your training mix. Summer camp trainings don't count: every facility is level 5 during camp, and that doesn't level them up. Unity Cup uses team rank and U.A.F. uses sport level instead. You can always pick the real level shown in the game.

## Scenario openings

Each scenario's opening, from the guides, is built into the coach (on top of the Wit and Speed focus cards below):

| Scenario | Opening the coach follows | Source |
|---|---|---|
| Grand Concert | Turns 1-3: bonds and Wit. Turn 4 (9 turns to the debut): Rest unless energy is 85+. From turn 5: the first time Light Hello is on a training, take it wherever she is (her first-training event: mood +1, Speed +13, Guts +13, +10 bond, and it opens the way to her outings). | community guides, uma.guide, Umamusume Wiki |
| Unity Cup | Turns 1-4: Recreation for mood when no training is strong (uma.guide's turn points: each card building bond, Wit, a hint and a white flame count 1, a Spirit Burst 2; Recreation wins when nothing scores above 3 at Normal mood after a training, or above 1 on a full bar or at Good mood). Riko Kashimoto joins on turn 5: her first training gives +1 mood, so the first time she's on a training it comes first while you're below Great. Wit counts a little extra all of Junior. | uma.guide |
| Trackblazer | Pre-debut: bonds and the Wit facility (Wit is the hardest stat to raise here). The debut race costs energy in this scenario. | uma.guide |
| Grand Masters | Junior: bonds before fragments (no rests or outings just for 2 fragments); time your Wisdom 1-4 turns before or right after a goal race. | game8 |
| URA Finale | No scenario card joins late. Akikawa shows up on trainings from turn 4 (tick **Akikawa here**); Happy Meek duels start after her challenge event. | Game8 |

The JP-only scenarios keep the openings in their guides (Onsen's first two turns on the Hole Digger, Food Festival cooking from turn 1, and so on). Guides don't give a turn when their scenario cards join, so there's no rest-before-her rule like Grand Concert's.

Every scenario also has the two New Year events: Classic Early January (+20 energy, or a stat or skill points) and Senior Early January (+30 energy, or all stats or skill points). The energy planner knows you can take the energy, so energy spent just before them costs less, and the turn plan reminds you the turn before.

## How the coach decides

Every option is scored in value points: stats, skill points, bond building, hints, scenario bonuses, energy, mood and failure risk. A score of 100 means a typical training for that point in the career.

- **Stats**: each training raises the stats it really raises (for example Speed training gives Speed plus Power), split by the scenario's base training values. They're weighted by your build. With current stats entered, a stat far below its target counts for more (the same "need" the deck optimizer uses), and stats past your target, past 1200 or at the cap are worth less or nothing. Since the July 2026 update a stat past 1200 gains only half from training and counts about half in races, so both are applied. Enter current stats under **Stats and caps** to switch this on, and they update as you press Done.
- **Focus cards** (with your deck set): getting one card to friendship (bond 80, the orange gauge) early is a must, and a second is nice to have. The coach picks them by an early-rainbow score from each stat card's current bond and specialty priority: **score = (100 + SP) / (550 + SP) × 0.92^T × (1 + Friendship bonus) × (0.75 + 0.25 × stat weight)**. The first part is how often the card is on its own training, where it rainbows (each training weighs 100, its own 100 + its Specialty Priority, not showing up 50, from fan guides). T is the turns to orange: the trainings it still needs ((80 − bond) / 7, rounded up) divided by how often it's on some training ((500 + SP) / (550 + SP)) × 0.6 (about how often you can follow it). 0.92^T makes each turn of waiting cost about 8%, since early rainbows matter most. So a card close to orange wins until a higher-specialty card is only a little behind, and training with your focus card keeps it on top. With no card orange yet, the best one is **Focus 1 (must)**: every training it's on gets a big push (full to the debut on turn 12, fading out by the end of Junior year). The next best is **Focus 2**: a small push that only tips close calls and never outweighs extra song tokens. Once one card is orange, the best of the rest is Focus 2. Hover a Focus chip in your deck to see its numbers. Friend and Group cards aren't focus cards, and past 80 the coach doesn't count a card's bond.
- **Energy**: a lookahead plans the rest of the career, taking into account summer camps, goal races (which cost no energy) and how failure climbs as energy drops. A rest is recommended only when the energy is worth more later than this turn's training. Energy has no value on the last turn.
- **Mood**: one mood step is worth about 10% on upcoming trainings, and more just before a goal race.
- **Deck strength**: after 3 or more turns with real gains entered, the coach learns how strong your deck is compared with a typical one and rescales its estimates. With your deck set, the gains you type also teach it how big the scenario's own bonuses are (Settings shows the result). The game shows gains past 1200 already halved, so the coach halves its estimate the same way before comparing. Type the **total** (every green number added up); a number that's only the training's own stat is spotted and read as that. The learned multiplier stays within 0.7x-1.6x of the formula, so a few slips can't halve every estimate. **Forget learned deck strength** in Settings clears both.
- **Late in a run**: once stats pass 1200 (half the gain, and half the value in races) or their targets, future trainings are worth less, so the energy and mood that buy them are worth less too. The coach scales them down by how much your stats can still gain, so it doesn't rest on a good training late in the run to save energy for trainings that would add little.
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

Caps are the July 2026 values (GameTora, Game8). Inheritance raises them: at the start of a run each blue spark adds +4 (1 star), +9 (2 stars) or +16 (3 stars) to its stat's cap, and blue and green sparks at the Classic and Senior inheritance events add a little more. Type your sparks under **Stats and caps**, or the cap your game shows.

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
