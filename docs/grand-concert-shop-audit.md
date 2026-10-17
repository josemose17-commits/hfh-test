# Grand Concert: lessons, Performance and concert audit

Checked 2026-10-16, continuing the Light Hello work in PR #38. This pass audits the coach's recorded career as well as the sampled career estimator. It improves the inputs to competitive deck comparisons; it does not establish that the resulting deck order is calibrated against real careers.

## Corrected behavior

| Area | Previous behavior | Current behavior |
| --- | --- | --- |
| Required shop songs | Token aim requested 18 paid songs while also counting Make Debut! | The guarantee needs 18 including Make Debut!: normally 17 paid songs |
| Special-concert deadline | The coach's wording and counter could include turn-72 purchases | The count closes after the turn-71 command; later purchases remain visible but cannot repair that count |
| GIRLS' LEGEND U | The coach combined its one-time reward and concert reward | One-time all-stats +10 after turn 71; separate concert stats after turn 72; Friendship +10% begins after the concert |
| Final Hype / SP | The automatic final song was absent from the final Hype/lesson count | It counts for that concert, while remaining excluded from the 18-song prerequisite |
| Missing carry | Every period assumed a carried song, even in an incomplete save | Only a carry observed at the preceding concert is credited; otherwise use the ordinary cadence |
| Technique budget | Already learned/offered songs could still be charged their unlock lessons | Learned songs and displayed song offers establish the minimum unlock progress already completed |
| Final-period target | Fixed fourth-song prescription could claim completion despite missed earlier targets | Catch up to the actual 18-song total; a healthy five/three/three/three opening normally needs three more paid songs |
| Held shop | The simulator discarded technique selections at concerts; the coach retiered them | Preserve displayed offers and their original technique tier/cost across the concert |
| Mastery purchase | Bought deducted Performance without applying one-time song stats | Apply the immediate stat reward once, with stat tracking; report SP in game without inventing a complete SP balance |
| Invalid purchase | Clamping each balance to zero could accept a purchase the run could not afford | Validate all five costs and the actual random-cost type before any mutation; reject duplicates and locked songs |
| Done ordering | A prefixed lesson was deducted after training income | Pay before the action; do not let future Performance fund that earlier lesson; failure does not refund it |
| Same-command mastery | Recommendations were calculated before the mastery song they instructed the user to buy | Recalculate the command after the purchase; typed gains remain authoritative; apply the opening rule once |
| Purchase Undo | Could overwrite a later manual balance/stat change | Match the purchase's resulting fields and turn before restoring its snapshot |
| Recovery selection | Only the largest offered energy lesson was considered, on one training | Compare every typed, affordable recovery offer across all five trainings; measure capped recovery and Performance cost |
| Song holding | A fixed song count forced a hold regardless of the delayed bonus | Compare the estimated benefit of buying now against the estimated one-technique saving from carrying |
| Optional late lessons | Songs always took priority; the shop disappeared after turn 72 | Compare optional song and technique value; retain the shop and Performance value after the final concert, without crediting nonexistent later concert SP |
| Existing-song history | Adding an already learned song dated it to the current turn | The user can supply its actual learned turn; backfilling does not change tokens or current stats |

## Timing and state

The command for a concert turn is still part of the period ending at that concert. Buy its intended current-period song before completing the turn. A song deliberately carried across the first concert is bought on turn 25, not turn 24. It contributes one technique's progress in the new period; it does not replace the first normal song slot. Thus a normal period starts with two techniques, while a carried song is followed by one technique before the first newly drawn song.

The shared cadence is:

| Period | Initial technique requirements | Repeating requirements |
| --- | --- | --- |
| Before first concert | 1, 2, 3 | 4, 4, 2, 2 |
| Before second through fourth concerts | 2, 2, 2 | 4, 5, 2, 2 |
| Before final concert | 2, 2, 2 | 4, 3, 2, 2 |

Shop selections remain until a purchase refreshes them. Newly checked offers are stamped with the observed turn; offers already present while crossing a concert receive that concert's turn if an older save did not have a stamp. If an old save opens after the concert with no observation history, the coach cannot reconstruct its previous price or a missing carry. It uses the current tier/normal cadence rather than inventing that history. The user can correct balances and the displayed shop against the game.

The final guarantee is checked after Senior Early December, turn 71. A lesson taken during that command counts. GIRLS' LEGEND U is then acquired before the turn-72 command; its immediate stat reward and its later concert bonus are separate. Sources also report special concerts below 18 songs without a confirmed condition. The UI therefore describes 18 as a **guaranteed threshold**, rather than treating every lower count as proof of failure. The estimator counts the conservative 18-song guarantee and does not simulate those unexplained cases.

## Estimated decisions remain estimates

The carry comparison uses the difference between buying the same song now and buying it just after this concert. Immediate mastery benefits accrue over the intervening commands; friendship and specialty benefits wait for their respective concerts. That estimated loss is compared with one useful next-period technique plus its next concert's SP. Training frequency, friendship frequency, stat weights and the technique value are approximations. The five-song Junior target, three-song intermediate targets, focus multipliers and scarcity prices also remain guide heuristics.

Future budgets assume a planned carry succeeds; the current-period budget credits only an observed carry. Song costs in the displayed budget still describe a selected priority queue, not a prediction of the next three offers. Supply estimates include the current command through the relevant deadline and are not conditioned on every goal race or future placement. Technique costs vary with the actual offers, so the simple budget remains approximate.

The estimator shares cadence, delayed bonus valuation and carry decisions with the coach, but uses sampled shops and its own greedy purchase policy. It does not implement every mixed song/technique offer near song completion, the benefit of support-event-frequency songs, or a whole-career dynamic program. It retains the Light Hello probability and unlock assumptions documented in the [first audit](grand-concert-light-hello.md). No real competitive-ace run has been supplied for calibration. These limitations can affect close rankings.

## Validation

The focused regression file covers the turn-71 boundary, free-song counting, normal versus carried cadence, inferred unlock progress, catching up after missed targets, immediate rewards, duplicate/invalid purchases, typed costs, stale Undo, purchase-before-income ordering, failed training, same-command mastery with both formula and typed gains, separate final-song/concert rewards, held technique prices, delayed friendship valuation, conditional holding, recovery overflow and optional late lessons.

The DOM integration executes the real page scripts and handlers. It checks song rewards and Undo, historical learned turns, disabled unaffordable/unknown-type buttons, selecting the actual token type, held prices, and the closed deadline display, alongside the existing Hello and deck-search checks. Full browser layout QA remains pending; DOM integration does not establish visual correctness.

Commands:

```sh
node --test test/*.test.js
NODE_PATH=/path/to/node_modules node tools/check_hello_ui.cjs
git diff --check
```

The integration check requires jsdom as a QA dependency; it is not added to the browser application.

## Sources

- [GameTora's scenario investigation](https://gametora.com/umamusume/our-grand-concert): persistent three-offer shops, immediate versus concert bonuses, measured lesson cadence, the one-technique carry credit, automatic songs, Hype and concert SP. The shared cadence follows its initial/loop table.
- [GameWith's special-concert investigation](https://gamewith.jp/uma-musume/article/show/361539): decision after the Early December command, 18-song guarantee, full-song hint upgrade, and reports of unexplained below-threshold special concerts. This resolves the otherwise ambiguous instruction to acquire songs "before" the final concert.
- [uma.guide's Grand Concert tables](https://uma.guide/guides/grand-concert): Performance formula, technique costs and song effects; cross-checked against the GameTora tables. Its illustrative first-period cadence differs in the later repeated slot, so the shared cadence follows GameTora's explicit loop.

No external simulator implementation was copied. The existing project's guide-derived scoring constants are still estimates and are identified above.
