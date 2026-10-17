# Grand Concert affordable skill sets

This pass starts from merged PR #42. Grand Concert **race-deck** simulation now selects an affordable set of final skills for each simulated career. Static Euophrys/tier screening, parent objectives and other scenarios retain their earlier scoring. The result is an exact purchase selection for a sampled, simplified offer state, not a full race simulator or a proof of the globally best deck.

## Problems corrected

The old career skill score weighted the eight best positive expected surpluses fully and the rest at 40%. It did not enforce the career's SP budget. It also used a skill's stored incremental price as though it were the total price of a gold or double-circle skill, could count both a white skill and its replacement, and excluded all trainee skills as already learned.

The new model separates the trainee's own unique (already learned) from innate/awakening skills (available to buy). Support hints can still discount a skill that is already available to the trainee. A final skill set can contain more than eight skills when the available skills and SP support it.

## Purchase facts and prices

`data/skill-purchases.js` contains 1,028 ordinary, gold and inherited purchase records, generated from Umalator's Global and JP game-data metadata. Global records take precedence when the snapshots overlap. Each record stores the skill family, incremental SP price, previous purchase tier and rarity. Negative skills are identified separately and excluded; evolved skills and their unlock conditions are outside this model. The data are game-data facts, with source URLs and attribution, rather than copied simulator implementation.

The generator rejects ambiguous families with multiple gold branches. Current output has no such family. A regression checks that every positive skill listed by a currently released Global support has purchase metadata and every recorded chain is traversable. Future or missing records remain explicitly unsupported; the purchase model does not substitute a guessed 150-SP price.

The discount percentages for hint levels 0–5 are 0%, 10%, 20%, 30%, 35% and 40%. The model floors **each tier's** discounted price using integer percentages, then adds the unpaid tiers. This avoids binary floating-point underflow at integer boundaries such as `180 × 70 / 100 = 126`.

For example, Professor of Curvature has a 180-SP gold upgrade and a 180-SP Corner Adept ○ prerequisite. A level-3 gold hint with no white hint costs `126 + 180 = 306 SP`, not 126 SP. If the white hint is independently level 5, the total is `126 + 108 = 234 SP`. Gold hints unlock their lower tiers for purchase even when those lower tiers have no hint discount. A ○ offer also makes its ordinary ◎ version purchasable, including when ○ is already learned; it does not unlock a gold upgrade. Each tier retains its own hint level, so the ○ discount is not fabricated on ◎. A three-tier ○/◎/gold family pays all required tiers, while only the selected final version's race gain counts.

All innate and awakening entries listed for the selected trainee are assumed available at hint level 0. This includes an assumption that the listed awakening skills are unlocked; awakening level, hint books and user-specific potential are not configured. Unvalued prerequisites still cost SP. Available evolved entries are excluded and reported if they have a relevant chart value. An already learned lower tier is supported by the solver API: its cost is excluded and its modeled gain is subtracted from the upgrade. The app currently initializes only the own unique as learned.

## Offers are realized before spending

Each simulated career retains its own final SP, collected training-hint counts, actual modeled Hello hint levels and song-event exposure. SP is floored to a nonnegative integer **per career**. Averaging SP before selecting purchases could let a low-SP career spend money earned only in a different career, so selection precedes averaging.

For each collected training-hint event, the model samples one skill uniformly from that support's hint pool and adds its Hint Levels, capped at level 5. It uses the number of hint events actually collected on successful trainings, rather than a fractional expected purchase cost. This models sampling with replacement and does not change the selected training, bond, calendar or scenario draws. Hint-stat substitutions and the effect of purchasing skills early on subsequent hint pools remain omitted.

The original ordinary-event sampling drew one complete outcome from each event model group; the coupled follow-up applies complete parsed records during the career. All hints on the selected chain path arrive together; mutually exclusive choices, conditional success/failure branches and chain-ending results remain exclusive. A gold success and white failure are not sampled as two independent events. Different event groups and unresolved fallback skills retain the existing independence assumptions. Missing event-result sources still use the disclosed rarity-based level-1 prior. Raw-text eligibility restrictions and free grants remain incomplete.

Hello uses the hints recorded by that career's explicit outing lifecycle, rather than independently sampling her whole listed event-skill set. The unavailable Maverick route is not fabricated. Training and event skill draws use separate card-specific streams keyed by card, run and seed. Reversing deck input order therefore preserves the skill plans, and added sampling does not consume the training/calendar random stream.

The source table retains the earlier Poisson approximation for training-hint marginals. Coupled events now use sampled frequencies; incomplete-source routes retain their acquisition estimates. The purchase table instead reports availability and selections in the actual sample of careers. These are different diagnostics: a rare event can have a nonzero analytic opportunity estimate and occur in none of a small sample. Purchase percentages are sample frequencies, not calibrated probabilities or confidence intervals.

## Affordable selection and scoring

`skill-budget.js` constructs a group of alternative final purchases for each skill family. Each alternative includes all of its required unpaid tiers. The solver performs a multiple-choice knapsack over integer SP, with at most one final skill per family and an explicit option to buy none. There is no top-eight weighting, fractional purchase, greedy efficiency cutoff or SP bucket rounding.

The objective first fulfills as many offered must-have skills as the budget permits, then maximizes the sum of the final skills' chart length gains. Equal-gain sets prefer lower spending. The priority term exceeds the possible total gain difference, so a very high-value optional skill cannot silently override one affordable must-have. A gold purchase includes the learning of required lower tiers for this purpose. Missing/unaffordable requests are returned as `unmetMust`; their acquisition frequency is displayed separately from source coverage. Existing deck construction still protects must-have **source** coverage, which is not a guarantee that every career acquires or affords the skill.

Race skill value is `60 × sum of selected chart L`, averaged after individual selection. Grand Concert race-deck comparison values SP through what it can purchase. It does **not** additionally add `0.35 × raw SP` or subtract a second SP cost from the affordable skill gain. Both the direct simulation objective and target-fit/sensitivity paths follow this rule. The existing skill slider scales the resulting skill contribution. Raw SP remains in the output for inspection. SP still has its old planning weight when the simplified career policy compares training and outing actions; this policy is not jointly optimized with the end-of-career purchase solver.

This means extra SP stops raising the final score after every modeled useful purchase is affordable. It also means missing skill-chart coverage matters: there is no generic unspent-SP bonus pretending that omitted inheritance, scenario hints or other skills were purchased. With no positive chart values loaded, the UI explicitly says that it cannot value SP through skills and asks for a new search after data load or a pasted chart.

Chart L values are individual skill gains on a fixed stat line. They are added across different families as an approximation. The solver does not rerun the race with the combined skill set, model recovery/stamina synergy, or adjust acceleration conflicts, activation overlap or a pasted chart's unseen baseline skills. The exactness claim applies only to the declared additive purchase problem.

Event-route choice screening now uses each family's best gain plus its hint savings, with trainee availability treated as a baseline. This avoids counting a gold and its white as separate gains during screening and recognizes the discount value of innate hints. Fallback/static routes are not jointly optimized with the final budget or other cards' offers. Coupled choices can see hints already acquired, but still do not predict the full future budget and future offers. Follow-up: [coupled event rewards](grand-concert-coupled-events.md) now apply parsed ordinary-support stats, SP, energy and bond from the selected branch during the career. Incomplete records and other Friend/Group cards keep a labeled aggregate fallback. The event ledger is linked to the purchase example; source timing and raw-text conditions remain approximate.

## Deck comparisons and UI

Grand Concert race refinement and held-out sensitivity both use the affordable skill value. The bounded slot-swap search, six-career screening, sixteen-career finalist rescoring, static candidate prefilter and existing constraints remain in place. Static card totals and the tier list retain their earlier heuristic and can differ from the final simulated recommendation; in particular, their candidate prefilter can still miss a card whose main benefit is discounting trainee skills.

**Which cards would improve it?** now also uses target fit and affordable skills for Grand Concert racing. It screens up to three eligible same-type replacements per unlocked, nonborrowed slot, preserves source coverage and compares each against the suggested deck with eight careers on paired seed 857563. It does not claim to test every card or establish a robust lead from one seed. Other goals and scenarios retain their static upgrade comparison. Changed settings disable the Grand Concert check; an in-progress result is discarded when its input result or settings change.

The race skill table now shows full prerequisite prices before hints and calculates L per 100 SP from that total; unsupported prices display Unknown. The result shows average final skill count, SP spent and SP left; a foldout with sampled availability/purchase frequencies; and a complete example from the career with the lower median SP budget. Every example lists each final skill's total price and its per-tier hints/prices. The averages describe different purchase sets, so the complete example is provided for checking affordability. Unsupported valued purchase records and must-have acquisition shortfalls are visible. Purchase assumptions are folded beside the result. Cache-busted assets include both new modules.

## Validation

Twenty-one purchase regressions cover integer discount boundaries, gold/white and ○/◎/gold prerequisites, automatic ◎ availability without gold, full baseline prices in the race table, separate hint levels, already learned tiers, trainee availability, affordable combination selection, more than eight skills, nonfractional affordability, must-have priority/shortfalls, zero-cost and zero-budget cases, tie spending, unknown/cyclic records, generated-data coverage, event-screening family value, memoization context, per-career sample consistency, route exclusivity, deterministic deck ordering, removal of a second raw-SP bonus, expensive-prerequisite score changes, and preservation of parent/other-scenario scoring. The knapsack is checked against exhaustive enumeration on 35 small randomized purchase problems.

The app integration checks the actual rendered purchase budget, per-tier arithmetic and full-price race table, Grand Concert refinement with blank targets, affordable sensitivity scoring, budget-aware upgrade comparisons and stale-result controls, along with the existing coach/run-export flows. The full existing suite remains part of validation. Final validation: all 233 tests pass (212 existing and 21 new), syntax checks and `git diff --check` pass, and the actual-app DOM integration passes. Browser visual QA and calibration against the user's second-concert run are still pending; no historical two-song cause is asserted here.

## Sources and reproduction

- [Umalator Global](https://alpha123.github.io/uma-tools/umalator-global/) and its [changelog](https://alpha123.github.io/uma-tools/umalator-global/stamina/) document total tier costs and replacement behavior for white/gold and ○/◎ versions.
- [Global metadata](https://github.com/alpha123/uma-tools/blob/master/umalator-global/skill_meta.json), [Global skill data](https://github.com/alpha123/uma-tools/blob/master/umalator-global/skill_data.json), [JP metadata](https://github.com/alpha123/uma-tools/blob/master/skill_meta.json), and [JP skill data](https://github.com/alpha123/uma-skill-tools/blob/master/data/skill_data.json) provide purchase families, rarity, incremental prices and negative-skill identification. Snapshots were retrieved on 2026-10-17; these links can evolve.
- Umalator's [skill selector](https://github.com/alpha123/uma-tools/blob/master/components/SkillList.tsx) was inspected to verify the purchase-tier ordering and per-tier hint discount convention. New solver and generator code were written for this repository.
- The existing [deck-event audit](grand-concert-deck-events.md) describes event arrival/success priors, song-rate assumptions and source omissions.

Rebuild the bundled facts from downloaded snapshots with:

```sh
node tools/build_skill_purchases.js global-skill-meta.json global-skill-data.json jp-skill-meta.json jp-skill-data.json
```

The two JP inputs are optional. Run `node --test` for the full suite. The optional app check is `node tools/check_hello_ui.cjs` with jsdom available in Node's module path.
