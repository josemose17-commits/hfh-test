# Grand Concert: Light Hello audit

Checked 2026-10-16 against repository base `ea3fcd6`. Scope: competitive ace coaching and the career estimator. Card availability continues to follow the release dates in the support database. Future variants need their own verified event profile; the current profiles deliberately identify the two existing card IDs rather than assuming every future card named Light Hello behaves identically.

The follow-up [shop and concert audit](grand-concert-shop-audit.md) corrects free-song counting, the turn-71 guarantee deadline, actual carry observation, persistent technique prices, purchases/Undo, recovery comparisons and delayed bonus valuation. Its findings supersede the initial fixed carry policy described below.

## What was wrong, and what changed

| Area | Previous behavior | Result of this change |
| --- | --- | --- |
| SSR energy unique | Combined 10% normal reduction and the 30-point conditional effect as 43% | Adds them to 40%; only applies when she is present on a friendship training |
| Multiple energy reductions | Multiplied separate cards' remaining cost | Adds their reduction amounts, with a floor of zero cost |
| First meeting | Used Speed/Guts +13 at every LB; a raised bond could stand in for meeting her | Uses her actual Event Effectiveness; tracks meeting separately from bond and outing unlock |
| R outings | Fell back to generic +20-energy outings | Has all five actual outings, including the +4 maximum energy and the white fifth-outing skill |
| Fifth outing | Scored uncertain rewards but always recorded the better branch; recovery/stat fields were inconsistent | Uses scaled base rewards; the user selects Success or Great success before Done; both branches grant the appropriate hint |
| Repeat Performance forecast | Assigned every Hello the SSR +20 expectation, even on the first meeting; chose the lowest type before the training's income | Separates the first event, uses an explicit estimated repeat rate and conservative R amount, and evaluates scarcity after training income |
| Actual repeat event | The button added only 20 tokens | Records observed +20, or R +10, Guts, extra bond, optional mood, and the event's SP in its record. Does not invent a career-wide SP balance |
| Event Undo | Compared against a state captured before render normalization | Captures the resulting saved state; refuses Undo if later actions changed the run |
| Hint accounting | Could value Maverick from declining her outing unlock together with the benefits of accepting | The accept-outings deck policy excludes that rejection-only hint |
| Career estimate | Smoothed aggregate Hello event rewards over the run; no actual outings or Performance spending | Models meeting, assumed unlock timing, outings as real turns, max energy, repeat events, completion-dependent ending, and Performance spending |
| Grand Concert estimate | Used a flat scenario multiplier instead of a resource economy | Uses discrete techniques, songs, delayed friendship/specialty buffs, recovery lessons and concerts; removes the estimator's flat scenario multiplier |
| Target-stat results | Discarded calendar and resource diagnostics when returning the final stat line | Returns the same simulation metadata with the displayed predictions |

The existing turn coach's calibration against user-entered gains is retained. Its generic training-level and continuation estimates still deserve their own audit. The new estimator's explicit economy does not make the coach's lookahead an exact whole-career optimizer.

## Verified card differences

Values are at each LB's maximum level. Percentage-point additions to Energy Cost Reduction are distinguished from multiplying the remaining failure probability.

| Effect | SSR LB0 | SSR LB1 | SSR LB2 | SSR LB3 | SSR LB4 | R LB4 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Training Effectiveness | 0% | 5% | 10% | 10% | 10% | 5% |
| Initial Speed | 0 | 0 | 0 | 15 | 30 | 0 |
| Initial Guts | 25 | 26 | 27 | 28 | 30 | 25 |
| Initial bond | 25 | 26 | 27 | 28 | 30 | 25 |
| Race Bonus | 1% | 2% | 3% | 5% | 5% | 5% |
| Failure Protection | 20% | 22% | 25% | 27% | 30% | 20% |
| Normal energy reduction | 5% | 6% | 8% | 10% | 10% | 10% |
| Energy reduction with her on a friendship training | 35% | 36% | 38% | 40% | 40% | 10% |
| Event Recovery | 40% | 45% | 50% | 55% | 60% | 40% |
| Event Effectiveness | 25% | 27% | 30% | 32% | 35% | 25% |

She does not create a friendship training herself, even at 100 bond. Another support card must supply it. Her energy unique also does not increase a Wit training's positive energy recovery. Failure Protection is proportional: 30% protection against a 20% base failure chance means about 14%, not zero. Typed failure percentages remain authoritative.

For a base 19-energy Speed training, SSR LB4's combined 40% reduction consumes 12 energy after integer rounding. Her contribution depends on how often she overlaps a useful friendship training, the training's base cost, the other reductions present, and the trainee's current energy. A fixed tier bonus cannot capture those conditions.

## Outings and events

Raw event rewards are stored in `light-hello.js`, scaled once using Event Recovery for energy and Event Effectiveness for stats/SP, then rounded down. Mood, maximum energy, bond, Performance and hint levels are not multiplied by those effects.

| Outing | SSR LB0 | SSR LB4 | R LB4 |
| --- | --- | --- | --- |
| 1 | 35 energy; max energy +4; mood +1 | 40 energy; max energy +4; mood +1 | 35 energy; max energy +4; mood +1 |
| 2 | 35 energy; Guts +12; mood +1 | 40 energy; Guts +13; mood +1 | 35 energy; Guts +12; mood +1 |
| 3, recovery choice | 70 energy; mood +1 | 80 energy; mood +1 | 70 energy; mood +1 |
| 3, stat choice | Speed/Guts +18 each; mood +1 | Speed/Guts +20 each; mood +1 | Speed/Guts +18 each; mood +1 |
| 4 | 42 energy; Guts +12; mood +1 | 48 energy; Guts +13; mood +1 | 42 energy; Guts +12; mood +1 |
| 5, Great success | 42 energy; Speed/Guts +12 each; mood +1; hint Lv3 | 48 energy; Speed/Guts +13 each; mood +1; hint Lv3 | 42 energy; Speed/Guts +12 each; mood +1; hint Lv3 |
| 5, Success | 28 energy; Speed/Guts +6 each; mood +1; hint Lv1 | 32 energy; Speed/Guts +6 each; mood +1; hint Lv1 | 28 energy; Speed/Guts +6 each; mood +1; hint Lv1 |

Each outing also gives 5 bond. SSR's fifth outing grants See Ya Later!; R's grants Playtime's Over!. The success branch changes the hint level, not whether the skill exists. Outings consume a career turn and cannot be taken at summer camp or instead of a mandatory race.

Meeting her the first time gives Speed/Guts +12 at SSR LB0, +13 at SSR LB4, mood +1 and 10 event bond, in addition to ordinary training bond. It enables a later outing-unlock event; it does not immediately unlock outings. Accepting that event is essential to the outing plan. Declining gives a different package, including Maverick, and removes the outings.

An observed Grand Concert repeat event also gives scaled Guts/SP and 7 extra event bond. At SSR LB4 that is Guts +4 and 4 SP. These are separate from the normal training bond. The manual record control should be used after Done has added the normal training tokens. It rejects duplicate records for the same turn and requires the user to resolve ties in token type. Undo restores all recorded effects together.

The coach can now track the fifth outing's granted hint in the saved run. It still does not track purchases of every skill or a complete career SP balance.

## How her value now reaches the estimate

1. Her actual initial stats and bond enter the run.
2. Each selected training applies her situational training effectiveness, proportional failure protection and energy reduction.
3. After the first meeting, repeat events are sampled at the selected assumed rate. Actual sampled tokens go to a currently scarce type.
4. Outings are offered after the model's assumed unlock. Each consumes a free turn, applies its chosen or sampled outcome and respects the current energy cap. Overflow is measured separately from useful recovery.
5. Performance is spent in persistent three-offer shops. Technique and song costs use the existing scenario data. Technique progression resets at concerts; an offered song can carry over.
6. Song mastery applies immediately; friendship and specialty rewards wait for the concert. Techniques can restore energy and replace a later rest. Concert rewards depend on the songs and techniques actually acquired.
7. Her ending depends on completing all five outings. The estimator credits her fifth-outing skill only in runs that reach it. Aggregate Hello event totals are removed so outings and endings are not counted a second time.
8. The result reports extra Hello Performance, energy saved, useful/wasted outing recovery, outing completion, songs, techniques, concert results and deadline success. Target searches retain those diagnostics.

This is a transparent comparison model, not evidence that one deck will always outperform another in the game. It does not force Light Hello into every manually played ace deck. The existing Independent Training setting retains its separate scenario-card policy.

## Uncertainty and validation limits

| Quantity | Treatment | Why it remains uncertain |
| --- | --- | --- |
| SSR repeat-event probability | Default assumption 40%; selectable 36% and 45% sensitivity checks | uma.guide reports 45%; a separate 100-training test reported 36%; no official probability was verified |
| R +10/+20 event mixture | Forecast uses the +10 floor; actual recorder accepts either amount | Scenario references mention both amounts but do not establish a dependable mixture |
| Outing-unlock timing | Assumed 15% per eligible turn after meeting and bond 60; 5%/30% sensitivity settings | This timing and threshold are model assumptions; the coach relies on the actual unlock checkbox |
| Fifth-outing outcome probability | Assumed 50/50 | Both reward branches are verified; their probability is not |
| Shop draws | Sample published category weights; simplified selection within categories | Exact current Global draw distributions have not been verified |
| Friendship's second Performance type | Sample a currently lowest type other than the first | References describe a strong tendency, not a guaranteed deterministic rule |
| Song policy | Greedy valuation plus a conditional carry policy comparing delayed benefits with one saved technique | Not a solved dynamic program or a proof of optimal song choices; see the follow-up audit |

Guest/supporter placements, the benefit of support-event-frequency songs, random mood drops, Some Crafty Research's random timing, R's secondary repeat event, other Pal/Group outings, inheritance and some secret/ending rewards remain omitted. Those omissions can affect both absolute stats and deck ordering. The model starts Grand Concert at Normal mood and lets its actions raise mood; it does not simulate every mood-loss event. Comparisons involving another Pal or Group are especially incomplete because only Hello has an explicit lifecycle here.

Six careers are used during target search, then all tested candidate decks are rescored with sixteen. This is screening, not a statistical confidence guarantee. Close results should be checked with more runs and different seeds, including the rate sensitivities. No real user run has yet been supplied to calibrate this model.

The user-facing diagnostics name these limitations. The UI must not present sampled outcomes, predicted totals or assumed probabilities as confirmed game mechanics.

## Checks

- Existing engine/optimizer/tier tests, plus fifteen focused Hello regression tests.
- Currency conservation, complete turn accounting, no negative budgets, deterministic slot-order invariance and context isolation.
- Actual repeat-event recording, tie handling, cap overflow, duplicate prevention and Undo.
- Both fifth-outing outcomes, both rarities, skill hints, first meeting, and camp restrictions.
- Target-stat result metadata preserved with its exact predicted stat line.
- Optional `tools/check_hello_ui.cjs` runs the actual page scripts and event handlers in jsdom: SSR/R controls, token-event Undo, fifth-outing selection, target search and diagnostics. Requires jsdom; run with it available in Node's module path.
- Full browser layout QA is still pending: no local browser executable was available; its download failed; the separate cloud browser could not reach the local server. DOM integration does not replace a visual browser check.

## Sources and conflicts

- [GameTora SSR card effects](https://gametora.com/umamusume/supports/30052-light-hello) and [R card effects](https://gametora.com/umamusume/supports/10083-light-hello): levels, ordinary effects and SSR conditional unique.
- [GameWith fifth outing](https://gamewith.jp/uma-musume/article/show/360446): base-to-scaled ranges, both outcomes and different R/SSR skills. This resolves the existing fifth-outing table, whose values were not consistently scaled.
- [GameWith SSR](https://gamewith.jp/uma-musume/article/show/359859) and [R](https://gamewith.jp/uma-musume/article/show/360184): first meeting, unlock, outing/event ranges and endings.
- [GameWith repeat event](https://gamewith.jp/uma-musume/article/show/360456): first/repeat distinction, scaled Guts/SP and extra bond.
- [game8 SSR](https://game8.jp/umamusume/473490): cross-check for outings and event choices. Its fifth-outing fields claim an LB4 reference level but conflict with the base-to-scaled ranges; they were not used as an already-scaled source for that outing.
- [Umamusume Wiki scenario](https://umamusu.wiki/Game:Grand_Concert): R's +10/+20 scenario effect. The shared event entries expose the same gold fifth-outing hint for R and SSR, conflicting with both the R card's skill data and GameWith's explicit R branch; those shared fields are overridden.
- [uma.guide scenario guide](https://uma.guide/guides/grand-concert): token formula, 45% estimate, lesson costs, song progression and concerts.
- [Independent 100-training observation](https://kamigame.jp/umamusume/page/246602706137909656.html): 36 observed repeat events. This is a sample, not proof of the underlying probability.
- [Reference calculation source](https://github.com/mee1080/umasim/blob/main/core/src/commonMain/kotlin/io/github/mee1080/umasim/simulation2/Calculator.kt) and [support-effect combination](https://github.com/mee1080/umasim/blob/main/core/src/commonMain/kotlin/io/github/mee1080/umasim/data/SupportCard.kt): cross-check additive energy reduction and integer rounding. No simulator implementation was imported; the project keeps its own estimator and identifies its approximations.

Next validation should use a real competitive-ace run report containing trainee, target course/style, exact deck/LBs, and the turn log. It should compare the observed Hello meetings, event count, unlocked outings, energy overflows, song purchases and final stats against these diagnostics before treating small ranking differences as actionable.
