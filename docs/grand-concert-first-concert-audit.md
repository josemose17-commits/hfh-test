# First-concert run: saving, colors and Light Hello

Checked 2026-10-17 against a detailed build `20261017e` report covering commands 1–23, with the run paused on turn 24 before Hopeful Stakes and the first Promo Live. The user confirmed that all recorded purchases happened on turn 24 and that **Run n' Run!** was left showing to carry into Classic. This audit does not treat the report as a second-concert failure.

Follow-up: the [second-concert audit](grand-concert-second-concert-audit.md) supersedes this pass's training preference, blank type selector and Hello-control placement. It also fixes the missing collaborator reward, overlapping Bought/Hold controls and stale shop offers after recording an owned song.

## What the report establishes

The run learned four shop songs: Full Speed Ahead! Umadol Power☆, Here Comes Our Time, Ring Ring Diary and Believe in Miracles! The free Make Debut! makes the displayed total **five**. Run n' Run! was not purchased and is not part of that total.

| Measure | Recorded result | Meaning |
| --- | --- | --- |
| Detailed commands | 23, with no turn gaps | The report stops before the concert command |
| Purchased songs | 4 | The five-paid-song ace guide target is one short |
| Total songs including Make Debut! | 5 | Enough songs for full first-concert Hype |
| Recorded techniques | 14 | Consistent with reaching the fifth shop-song selection |
| Token-earning trainings | 18 | Nine were Wit trainings |
| Training sources with entered amounts/types | 0 / 18 for each | Every recorded training amount and type used an estimate/default |
| Logged actual Hello token events | 0 | A prior +20 checkbox is present, but it is not a token credit |
| Stat cards at bond 80+ | 1 of 5 | Agnes Tachyon is orange; Hello's bond 100 does not count as a stat-card rainbow |

The five-paid-plus-sixth-held target is an aggressive guide heuristic. It is different from the three-total-song Hype requirement and the later 18-song guarantee. This change keeps the selected ace guide target, labels purchases separately, and explains what its reset advice means. It does not turn four purchases into five or count a held offer as a learned song.

## Token reconciliation

| Token | Recorded training | Opening reward | Entered correction | Purchases | Ending balance |
| --- | ---: | ---: | ---: | ---: | ---: |
| Dance | 55 | 10 | -5 | 52 | 8 |
| Passion | 32 | 10 | +47 | 87 | 2 |
| Vocal | 47 | 10 | +8 | 62 | 3 |
| Visual | 13 | 10 | +27 | 43 | 7 |
| Mental | 83 | 10 | -18 | 73 | 2 |
| **Total** | **230** | **50** | **+59** | **317** | **22** |

The arithmetic reconciles: 230 + 50 + 59 − 317 = 22. There was no recorded cap loss. This is bookkeeping reconciliation, not proof that the inferred training colors matched the game. The user corrected balances immediately before the turn-24 purchases, so the report cannot locate the real color differences during earlier commands. Nor can the net +59 correction identify how many Hello events happened or which types they awarded.

Run n' Run! costs 14 Dance, 16 Visual and 14 Mental. Against the final balance, buying it still requires:

| Token | Song cost | Held balance | Shortfall |
| --- | ---: | ---: | ---: |
| Dance | 14 | 8 | **6** |
| Visual | 16 | 7 | **9** |
| Mental | 14 | 2 | **12** |

That is **27 points of particular colors**. The five Passion/Vocal points cannot substitute. A displayed selection can cross the concert while unaffordable; the player can earn the remaining points in the next period before buying it. Funding it by the concert is a reserve goal, not a condition for the selection to persist.

## Purchase timing

The user confirmed the purchases were genuinely delayed until turn 24. Friendship bonuses activate after their concert, but training mastery bonuses start when learned. In this run Ring Ring Diary's Stamina training bonus and Believe in Miracles!'s Wit training bonus therefore did no work on commands 1–23. Their potential earlier gains are unknown because the earlier random shop selections were not observed. The report cannot establish when either song could have been bought or calculate a justified exact loss.

The UI now says to use lessons during the run and learn valuable training-bonus songs early when offered. Techniques remain in the requested Advanced section; the visible budget includes their additional cost. Hiding that section no longer comes with copy that merely points to song totals and leaves the unlock loop implicit.

## Was training with Hello wrong?

Not as a blanket conclusion. The first meeting on turn 5 had four cards on Speed and earned the fixed first-training reward. After meeting, the retained SSR model estimates a 40% repeat-event rate for +20 to a lowest type. That is **+8 in expectation**, with an individual outcome of no event or an actual event; it is not a guaranteed +8 award.

For example, the recorded turn-6 Power option had about 15 formula training points plus 8 expected Hello points, versus about 17 training points on Speed. Under the existing total-points policy, Power was a defensible expected-value choice. Several low-energy Wit turns also had recovery value. This single run, without individual proc records and displayed training tokens, cannot calibrate the event probability.

The confirmed weakness was the override: Songs first compared total expected usable points and could displace a color-helpful alternative even when a large part of the winning pile did not fill the period's song needs. The ordinary weighted scoring already had scarcity information, but this later override ignored it. Spending advice also mainly protected one next song at a time.

Outing unlock and placements remain as recorded. The report marks Hello's outings locked, and the optional clarification supplied no additional observation. The audit does not infer that high bond unlocked them or invent missing support placements.

## Changes

### A shared period budget

`periodSongBudget` selects the remaining current-period priority purchases plus one prospective carry, and adds their five-type costs. Actual displayed songs lead the projection. Later selections remain unknown and are labeled projected. Two alternatives in one current selection are not evidence that one will survive the other being bought.

The primary table shows period-song costs, carry reserve, balances and typed shortfalls. The older gross half-period budget now includes the carry cost too and no longer announces that total points alone mean the run is on track. Unlock-technique costs remain additional, with unknown types and estimated standard prices.

Technique ranking minimizes conflict with this sequence reserve, rather than just the next song. If an unlock lesson is required and every affordable observed choice consumes reserved colors, the coach can choose the least conflicting lesson and reports the loss. This is a guide-based priority projection, not an optimal shop planner or a forecast of random offers.

### Training selection

Among safe, worthwhile training candidates, Songs first compares expected capped points that fill the period's typed song/carry gaps, then total usable points, then the normal score. The first Hello meeting, recovery comparison, goal races and configured failure limit retain their existing protection.

When no song selection is observed, the color budget is only a projection. A projected-color alternative must stay within half a typical training's normal score of the total-points choice. This heuristic prevents an uncertain color forecast from discarding a clearly stronger training. Observed selections can guide the full Songs-first preference. Once all song gaps are funded, total usable points again decide the preference.

The explanation separates formula/entered training points from Hello's expected contribution. Expected events still never enter saved balances. The report exports the preference's usable total, song-gap contribution, Hello contribution and budget vectors so the next disagreement can be audited.

### Explicit holding

Mark the actual offered song and choose **Hold after concert**. This is allowed before the guide's purchase target is reached and does not falsely mark the target complete. The coach reserves that song's colors and stops automatic purchases that would refresh the selection. **Release hold** restores normal purchase advice.

The previous automatic carry path could attach a spare-token technique to its hold recommendation, or choose a recovery lesson alongside it. Both purchases would replace the selection. Holding now produces neither recommendation. A manual Bought action still records what the player actually did, clears the hold, and can be undone with the existing strict state check.

The selection survives the concert, and a song bought afterward receives the existing one-technique carry credit. Turn-24 text now consistently says buy **from turn 25**, rather than the old contradictory turn-24 instruction. Carry intent is included in reports and purchase Undo snapshots.

### Observations and counts

- The main status distinguishes purchased songs from total songs. The guide check explicitly excludes Make Debut! and held offers.
- Training type selectors show **Type shown?** until entered, rather than appearing to have an observed primary type already selected. Formula amounts remain visibly estimated until filled.
- The actual Hello-event button is outside the collapsed Hello explanation. Its copy distinguishes recording a reward from ticking the past-event debut check.
- Reports count entered amounts/types, actual Hello event entries and the special case where a prior +20 is checked with no token-event entry. Balance corrections remain corrections.

## Replay and validation

Historical decisions were compared against the new engine using their recorded inputs and their original recorded facility levels. They were not rewritten as if they had been the original recommendations. Separate purchase comparisons used each actually recorded turn-24 selection along the actual path; an alternative purchase would refresh the random shop, so those comparisons are not a replay of a possible alternative whole run.

The final snapshot comparison changes one of 18 token-earning training recommendations: turn 19, Wit to Guts, under the recorded estimates. It changes two of the 18 purchase recommendations: one Speed technique to Stamina and one Wit technique to the observed hint lesson, protecting later song colors. This is evidence that the corrected policy behaves differently at the identified tradeoffs. It is not evidence of a particular final song count or a guaranteed better career. The original full report remains outside the public source tree; regression cases use focused reconstructed states.

Fourteen new regressions cover purchased/free counts, observed unaffordable carry, invalid/expired holds, concert transitions, ordinary carry refresh hazards, manual purchase/Undo, sequence reserves, color versus total preferences, Hello expectation, conservative unobserved forecasts, fallback priority ordering, alternative-offer uncertainty, necessary unlock spending, and report observations. Actual-app integration exercises holding/releasing, the exact 6/9/12 shortfalls, a turn-24-to-25 transition, the subsequent purchase/carry credit, unknown token inputs, and the visible Hello control.

Final validation passed **265/265 tests** (251 existing checks, with five expectations updated for the intended behavior, plus 14 new regressions). Actual-app DOM integration, JavaScript syntax checks and `git diff --check` also passed. The updated existing expectations cover after-concert wording, explicit training-point copy, the newly included carry cost, preventing a purchase while holding, and selecting/paying a reserve-preserving lesson. Browser visual QA remains pending. Exact future shops, displayed token amounts/types, missing actual event timing, and real-run calibration remain open; no rate was fitted to the end-balance correction.

## Sources

- User-supplied build `20261017e` detailed report and the two explicit clarifications: purchases all on turn 24; Run n' Run! held. Empty optional placement/outing answers add no facts.
- [GameTora's original scenario investigation](https://gametora.com/umamusume/our-grand-concert): tested lesson cadence, refreshing selections, carry credit, immediate mastery versus queued concert bonuses, Hype and SP rewards. Checked 2026-10-17.
- [uma.guide's Grand Concert guide](https://uma.guide/guides/grand-concert): Performance formula/types and Hello source-rate estimate. Its rate and recommended targets are not treated as measurements from this run; the existing documented 40% coach assumption remains.
- Earlier [shop audit](grand-concert-shop-audit.md), [feedback audit](grand-concert-run-feedback.md), [Hello audit](grand-concert-light-hello.md) and [run diagnostics](grand-concert-run-diagnostics.md) explain the inherited assumptions and source differences.
