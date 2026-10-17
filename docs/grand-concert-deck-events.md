# Grand Concert deck events, hints and sensitivity

This pass starts from merged PR #41. It addresses three remaining deck-builder gaps: event reward eligibility, the effect of event-frequency songs, and comparisons that can change with simulation assumptions. It also corrects an undercount of discounts from repeated hints. It does not establish that event skills deserve a universal source multiplier or that a suggested deck is globally optimal.

## Event eligibility

The previous scorer assigned every event skill a flat rarity-based probability and a level-1 hint. That could simultaneously credit exclusive choices, success and failure rewards, and late rewards after a choice that ends the chain. It also treated a first-step reward like a third-step reward.

The shared event model reads the bundled event records in `data/card-events.js`. For ordinary supports it follows the listed chain order, selects one choice per event, branches on success/failure, and stops a path when its chosen result ends the chain. Choice selection maximizes expected targeted skill value within that card's chain, including the net skill-point cost and explicit must-have priorities. It does not adapt those choices to skills already offered by other supports or later random training hints.

For Fine Motion SSR's recorded final event, success gives the gold skill at hint level 3 and failure gives its white counterpart at level 1. With the retained 80% SSR completion prior and a 50% conditional-success assumption, each branch has 40% availability from that event. They are exclusive branches of the same outcome distribution. This example does not claim that the game's actual success rate is 50%.

Missing event results are not treated as evidence that a listed skill is impossible. Skills without a parsed result keep the previous rarity availability prior and level-1 discount, and the result reports those unresolved sources. Raw-text conditions, alternate scenario/version records and free skill grants are not fully modeled. Friend and Group outing eligibility remains separate; Light Hello's career estimator uses its sampled lifecycle, while other special-event sources retain explicit fallback estimates. Maverick remains excluded when accepting Hello's outings.

## Arrival and success assumptions

The retained end-of-chain priors are SSR 80%, SR 65% and R 50%. They are uncalibrated assumptions, not measured game probabilities. Ordinary-event appearance uses the same legacy rarity prior. Earlier steps of a chain use a Poisson-arrival model calibrated to that chain's final-completion prior: choose an arrival mean such that `P(arrivals >= chain length)` equals the prior. Reaching later stages implies reaching earlier stages. These stages are therefore combined as one nested distribution rather than independent availability chances.

Success/failure branches use an explicit conditional-success estimate, default 50%, with 25% and 75% controls. Different events can have very different real requirements and odds. The uniform control is a sensitivity input until reliable individual rates are available. The existing Independent Training late-chain penalty is retained as an assumption.

Event stat, SP, energy and bond rewards still use the existing aggregate card estimates spread through the career. Those totals are not fully coupled to the newly selected skill branches; choosing a skill reward can replace a different stat reward in the game. This is a remaining source of bias, rather than a claim that every event lifecycle is now simulated exactly.

## Hint accumulation

Both scoring paths now keep a capped distribution of accumulated hint levels, rather than the maximum single offer. Independent sources combine by convolution up to level 5. Mutually exclusive event paths combine by probability mixture. Repeated rewards within a chain accumulate on their path, so the scorer does not count them as independent chances to first discover the skill.

Training hints use the existing expected number of collected hint events divided by the card's hint-pool size. A Poisson count models repeated hits to each skill, with the card's Hint Levels applied per hit and the total capped at 5. This preserves the existing any-hint availability approximation while including repeated-discount gains from high Hint Frequency. Finite-turn dependence, hint-stat substitutions and timing of learning a skill remain approximate. Source correlations across different cards are not fully modeled.

Hello's sampled hint outcomes retain their level distribution instead of rounding the mean to one level. Its simulated repeated hints accumulate consistently with the coach's recorded hint increments. Availability and discount remain distinct: the expected discount is averaged across the actual modeled outcomes, so a rare high-level hint does not discount every lower-level outcome.

## Song event levels

GameTora's scenario investigation confirms that event-frequency bonuses queue until the next concert, stack and remain active afterward. The simulator now retains active and pending event levels. It sums active-level turns across the career, counting a bonus only from the turn after its activating concert.

The source does not establish a numerical percentage increase per level. The primary investigation notes in `umasim/data/grand_live_memo.md` identify a value of 15 while explicitly leaving its interpretation unverified. It is not treated as 15 percentage points or a 15% multiplier here.

The default **0%** setting adds no assumed rate boost. The optional **+5% / +10% relative rate per active level** settings are experimental sensitivity assumptions. Under those settings, each simulated career's chain-arrival mean is multiplied by `1 + assumed boost * average active levels`. The model averages the resulting per-career event distributions; it does not evaluate only the mean exposure. Ordinary non-chain events and Hello's outings do not receive this multiplier. It does not multiply a skill's intrinsic race value, and it does not invent extra recorded Performance.

Static Euophrys/tier skill scoring uses the baseline event priors because it has no sampled purchase calendar. Grand Concert career refinement uses the simulated exposure and selected assumption. Song-buying policy still uses its existing heuristic and is not optimized jointly with the new event-acquisition model. Extra event-stat rewards from faster completion remain omitted.

Follow-up: Grand Concert race comparisons now use [per-career affordable purchase selection](grand-concert-skill-budget.md), including upgrade/prerequisite costs and replacement gains. Static tier screening and parent objectives retain their earlier heuristic. The purchase audit documents remaining chart, event-route and source limitations.

## Deck refinement and comparisons

Grand Concert race decks now receive the target-stat refinement step even when custom target boxes are blank. Blank boxes use the existing build defaults. The static Euophrys deck remains the starting point and candidate prefilter. For Grand Concert race decks the refinement objective uses the career estimator's skill acquisition, so the event controls and sampled song timing affect the comparison. Parent decks retain their existing skill-retention objective. Search remains a bounded slot-swap heuristic over a prefiltered candidate set.

The optional **Check ranking sensitivity** action compares the suggestion with up to two eligible next-best same-type replacements and the initial Euophrys deck if it differs. It preserves locked slots, borrowing status and must-have coverage when constructing replacements. Must-have losses are checked from covered skill IDs rather than a score threshold, so improving one probability cannot hide the loss of another skill. It does not test every possible deck.

Each default comparison uses three held-out seeds and eight careers per deck per seed. Decks within a check use the same seed and assumptions. Profiles vary Hello repeat/unlock assumptions, conditional event success and the uncalibrated song-level boost; duplicate parameter sets are omitted. The 0%, 5% and 10% song-rate assumptions remain covered even when the user changes the selected setting. For Grand Concert racing, the follow-up objective combines target fit and affordable skill value; SP contributes through the skills it buys. A positive gap favors the suggested deck. Results report mean gaps, seed ranges and leading/tied checks. These are sensitivity diagnostics, not confidence intervals or win probabilities. Changed settings mark the result stale and disable rechecking until a new deck search completes.

## Validation

Sixteen new regressions cover exclusive reward distributions, nested chain stages, real Fine Motion success/failure rewards and hint levels, success settings, exclusive choices, chain-ending choices, repeated rewards across stages, unknown-source fallback, ordinary versus chain events, concert activation timing, simulated exposure, shared tier scoring, hint accumulation, repeated training hints, must-have coverage and reproducible paired sensitivity. Existing constraint, parent, career, coach and run-report tests remain included.

Actual-app DOM checks cover the new assumptions and defaults, Grand Concert refinement with blank targets, source diagnostics, eligible sensitivity comparisons, copy/download and prior coach controls. A fresh skill-data load legitimately makes an earlier result stale; the integration waits for that data before evaluating button availability. Visual browser review and calibration against real competitive runs remain pending.

## References

- [GameTora scenario investigation](https://gametora.com/umamusume/our-grand-concert), especially lesson-bonus activation and the song list.
- [Fine Motion's GameTora support page](https://gametora.com/umamusume/supports/30010-fine-motion), for card identity and listed event skills.
- The repository's [event data](../data/card-events.js) and [importer](../tools/build_card_events.py), sourced from Umamusume Wiki training-event observations under CC BY-SA 4.0. The parsed success/failure example comes from those bundled records.
- [The original Grand Live investigation notes](https://github.com/mee1080/umasim/blob/main/data/grand_live_memo.md), for the explicitly unresolved event-bonus magnitude. No simulator implementation was copied; the probability and comparison code in this pass is original.
