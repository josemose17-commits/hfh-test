# Grand Concert coupled support-event rewards

This pass starts from merged PR #43. In Grand Concert career estimates, ordinary support cards with complete parsed choice records now grant stats, SP, energy, bond, mood, max energy and skill hints from the **same selected outcome**, at the same modeled time. Their old aggregate rewards are removed. Incomplete cards retain an explicitly labeled whole-card fallback. Light Hello retains her existing lifecycle.

The reward coupling is a consistency improvement. Event timing, success probabilities, choice planning, raw-text conditions and incomplete source records remain approximations; this is not a complete game simulation or a calibration of the user's historical two-song run.

## Why coupling matters

Previously, the career spread aggregate event stats/SP/energy/bond over the run, then separately sampled a skill route for the final SP purchase calculation. That could credit a stat choice while also receiving the alternative hint, grant later rewards after a failed chain had ended, and value a skill branch without its actual SP reward or energy penalty.

The discrete path now applies a parsed base reward plus **one** selected success/failure reward. It records the actual selected choice and branch. Chain-ending results stop later chain events. A hint alternative does not also grant the rejected stat alternative. Earned SP enters that same career's purchase budget; energy and bond can change later training, outings and song income.

For example, Fine Motion's final event always costs 10 energy and gives 5 Guts. Its success branch gives 10 Wit, 15 SP and a Lv3 Speed Star hint; its failure branch instead gives 5 Wit, 5 SP and a Lv1 Prepared to Pass hint. Those rewards now stay together in each simulated career. Fukukitaru's early failures give their recorded reward and end the chain, rather than retaining full later stat/SP rewards.

## Source coverage and fallback policy

The bundled source is the Umamusume Wiki event data already used by the coach. As of the 2026-10-17 Global release filter, 197 of 246 ordinary cards have a result record for every listed chain and ordinary event; 43 have partial results and six lack results. These are structural parsing counts, not a guarantee that every eligibility condition or game-version detail is understood.

`support-events.js` uses a discrete model only when every listed event has nonempty choice records. It never combines a partial set of known events with a full-card aggregate: that would make double counting impossible to audit. Incomplete ordinary cards and other Friend/Group cards retain the prior aggregate stat/SP/energy/bond estimator as a whole-card fallback. Their skill routes retain the earlier event model and priors. SSR/R Light Hello are handled by her separate explicit model, without adding ordinary support events or aggregate rewards again.

For a coupled card, an advertised event skill whose source remains unparsed retains the earlier disclosed availability prior. That unresolved skill-only fallback is not presented as a fully coupled reward route. Free skill grants, cures and raw-text conditions are reported as unmodeled notes. In particular, numeric parts of a Practice Perfect or Charming choice can be modeled while the condition's subsequent effects are still omitted. The coverage panel exposes per-card modes, missing records and notes.

The generic career allowance of 120 per stat remains separate and uncalibrated. Its attribution to nonsupport career events has not been verified. Adding parsed ordinary events does not establish that this allowance is the correct remaining baseline. Other Friend/Group outings, guest placements, inheritance, random scenario skill acquisition and secret/end rewards still have important omissions.

## Correcting an earlier-choice dependency

The existing parser had flattened Nakayama Festa's final event into one additive reward, although the source explicitly gives three alternatives depending on the first event's selected choice:

- First choice 1: 40 SP, 5 bond, and Uma Stan hint +1.
- First choice 2, success: 15 Stamina, 15 Guts, 20 SP, 5 bond, and Come What May hint +3.
- First choice 2, failure: mood −1, 10 Guts, 5 bond, and All I've Got hint +3.

`tools/build_card_events.py` now preserves those alternatives as structured `when` records referencing the earlier stage and choice. The bundled final-event record is repaired from the cited Wiki page. No success/failure percentages were inferred from that source; the configured success estimate still applies.

Both the static skill-event planner and the new career model follow the earlier choice. The coach's event description displays the conditional alternatives rather than describing them as a combined grant. The parser accepts the source's bold-marker variants. It also recognizes “End of chain event” as a termination marker; existing records with that exact raw note are understood at runtime.

## Event timing assumptions

Each ordinary support has an independent discrete chain clock. A constant daily chance is calibrated so the probability of at least the listed number of chain arrivals over the career equals the retained rarity prior: SSR 80%, SR 65%, R 50%, **before** choice termination or conditional failures. Calibration uses a binomial tail, allowing at most one chain step per card per turn. This replaces the old end-of-career Poisson mixture only for coupled career events; static tier scoring and incomplete-source fallback still use their older acquisition model.

Each listed non-chain event has an independent one-time clock calibrated to its rarity prior. A chain event and an ordinary event can occur on the same turn, and different cards do not compete for a global event slot. This independence is an explicit approximation. The model schedules opportunities across all calendar turns, including goal races, camp and finale turns; actual game eligibility restrictions are not established here. Event records are applied after that turn's chosen command, before the simulator's concert-end activation. Events on the same turn are processed in stable card-ID order.

The 0% default song-rate setting adds no assumed boost. With an experimental boost selected, the daily chain chance changes from `p` to `1 − (1 − p)^(1 + boost × active levels)`. Pending levels do not apply before the concert; ordinary clocks and Hello's lifecycle receive no such multiplier. The numerical conversion remains unverified. Earlier chain arrivals can now change both resources and skills rather than only the final skill score.

Independent Training retains the earlier 20% late-chain availability assumption through a per-career gate after the second step. The first two steps remain available. The choice policy uses that probability without knowing the sampled gate. It is an inherited modeling assumption, not a verified mechanic.

Arrival and outcome draws use stateless card/run/turn/event keys. Additional branch draws do not consume the training/calendar RNG or shift unrelated event streams. Input deck order is normalized. Actual changed rewards can still change later selected actions and collected training hints; matching seeds do not imply identical careers under different event assumptions.

## Choice policy and actual payout

At an event, the policy compares the expected numeric reward and marginal hint value for each available choice. Resource value uses current stats/targets, energy, mood, bond and available hints. A limited lookahead includes remaining chain rewards and the chance of reaching them within the remaining turns; explicit chain-ending options lose continuation value. Prior choice history is carried through that lookahead and the realized path. Available must-have hints retain priority.

This is a heuristic choice policy. Future event values reuse the current resource valuation and current active rate rather than predicting every intervening training, future song, condition or other card's rewards. Generic SP planning still uses the retained 0.35 weight, while final race-deck SP is valued through actual affordable skill selection. The policy is not a joint optimizer of the whole career, choices and final purchases.

Only the realized outcome is applied. Each positive scalar stat/SP/recovery reward is scaled once by the appropriate support effect; penalties and bond are not amplified. Source ranges are interpolated by LB and are already treated as scaled ranges, avoiding a second multiplier. No currently released ordinary Global card has Event Recovery or Event Effectiveness in this dataset; synthetic regressions cover the scaling convention for future use. Hello's separately verified scaling is unchanged.

Max energy changes precede recovery. Stats, energy, mood and bond are clipped to valid limits. The retained generic stat/energy spread is also clipped before discrete events, preventing an already-invalid state from turning a positive event into an apparent loss. Random-stat rewards select the specified number of distinct stats. Source numeric arrays are not reused as multiple independent grants.

## Hints and purchase budgets

Each collected training hint is allocated to a skill during the career using a separate card-specific stream. Event choices can therefore see hints already acquired. Hello's actually acquired hints also enter that choice context. Hint levels accumulate and cap at five. No new training/calendar random draws are consumed to allocate the hint.

The final purchase calculation uses the recorded event hints and the same career's final SP. Coupled events are not independently rolled again at purchase time. Incomplete-record routes and unresolved skill sources retain their disclosed fallbacks. The analytic training percentages in the source table still use the older hint-pool approximation; coupled event percentages are sample frequencies. The per-career availability/purchase table remains the authoritative description of the sampled affordable purchase problem.

The [purchase model](grand-concert-skill-budget.md) otherwise retains its full prerequisite costs, family replacements, must-have purchase priority, exact additive knapsack and lack of a second raw-SP bonus. Its example now identifies its career and includes that career's event trace. Parent skill objectives and static tier scores retain their existing scoring, while Grand Concert career resources use coupling where records permit it. Other scenarios retain aggregate rewards.

## Diagnostics and comparisons

**Support-event rewards** shows each card's reward model, event counts, chain completion/termination and credited stats, SP, energy, bond, mood and max energy. Cap losses are reported. The ledger uses the same career as the complete purchase example when one is shown; it lists turn, event, choice, branch, granted bundle and credited numeric rewards. Internally, entries retain before/after resource snapshots. Aggregate fallback rewards are labeled rather than reconstructed as observed discrete events.

The default sensitivity profiles now include a **Legacy aggregate reward comparison**, in addition to the existing Hello, success and song-rate assumptions. A lead that reverses between models should be treated as dependent on the reward estimator. Its seed range is still a sensitivity diagnostic, not a statistical confidence bound or a proof of global optimality. The bounded candidate prefilter, search, finalist rescore and upgrade shortlists are otherwise unchanged.

Repeated outcome resolution and marginal hint valuation are memoized without changing the reward or choice rules. A complete 16-career result, including every event trace, was compared byte-for-byte before and after memoization. This is an output-preservation check, not a general performance claim.

## Validation

The final full suite passed **251/251 tests**, including the 18 new support-event regressions. The actual-app DOM integration check, JavaScript syntax checks and `git diff --check` also passed.

Eighteen new regression tests cover calibrated discrete clocks, stable draws, real Fine Motion outcome bundles, scaling/ranges, exclusive stat-versus-hint choices, energy-dependent choices, chain-ending failures, continuation value, event order/repetition limits, active-only song boosts, Independent Training gating, distinct random stats, Nakayama's conditional rewards/parser/rendering, whole-card fallback, removal of duplicate aggregates, matched event/purchase ledgers, and max-energy/cap ordering.

Existing slot-order invariance, affordable-budget, constraint, scenario, coach, Hello and run-report checks remain included. The prior regression that held stats fixed under event-song changes is explicitly preserved for **legacy aggregate mode**; coupled mode intentionally allows event resource changes to affect the career. App integration checks cover coupled coverage, actual ledger rows, the matching purchase example, sensitivity and upgrade flows, and prior controls/exports.

Browser visual QA and calibration against a real second-concert run remain pending. The model does not assert why the user's earlier run had only two songs.

## Sources

- [Fine Motion final event](https://umamusu.wiki/w/index.php?title=Game:Training_Events/830010003&oldid=48068): base and mutually exclusive final rewards.
- [Fukukitaru first event](https://umamusu.wiki/w/index.php?title=Game:Training_Events/830078001&oldid=65635): conditional early termination and the alternative ending choice.
- [Nakayama Festa final event](https://umamusu.wiki/w/index.php?title=Game:Training_Events/830043004&oldid=46991): dependency on the first selected choice, with distinct conditional outcomes.
- Bundled `data/card-events.js`, its [source Wiki](https://umamusu.wiki/), and `tools/build_card_events.py`: source data are CC BY-SA 4.0; game materials belong to Cygames. The repaired record and new structure preserve that attribution.
- Existing [deck-event](grand-concert-deck-events.md), [purchase](grand-concert-skill-budget.md) and [Hello](grand-concert-light-hello.md) audits document the inherited priors and source limitations.

Run `node --test` for the full suite. The optional actual-app check is `node tools/check_hello_ui.cjs` with jsdom on Node's module path. The parser regression disables bytecode writing, makes no network request and does not modify the source data.
