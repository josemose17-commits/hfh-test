# Turn 38: Wit, camp rest and training-strength calibration

Checked 2026-10-17 following the user's compact report asking whether avoiding Rest and repeatedly choosing Wit is correct. This follows the [second-concert audit](grand-concert-second-concert-audit.md). The update is build `20261017h`.

## The current choice

The report is Classic Late July, turn 38: 37/100 energy, Great mood, a 17% failure limit, and no bad conditions. Speed has Hello, Tachyon, Nature and El; its **28% failure was entered**. Wit has two Others and no deck supports selected; its gain and failure fields are blank.

| Action | Reported/estimated reward | Energy afterward | What limits the choice |
| --- | --- | ---: | --- |
| Wit | Estimated +6 Speed, +17 Wit, SP and Performance | **42** | Its 0% failure is estimated, not an entered observation |
| Camp Rest | +40 energy | **77** | No current training stats; Great mood and no conditions give no additional recovery benefit here |
| Speed | Estimated +56 Speed, +33 Power, friendship Performance and possible Hello event | **22** | Entered 28% failure exceeds the selected 17% limit |

Two camp commands follow this one (39 and 40). Wit banks a modest useful training while recovering only five energy. Rest buys substantially more readiness for those unknown future placements. Neither choice preserves today's support stack into the next turn. Repeated Wit is a policy to reassess, not a justified fixed plan from this one report.

The chosen Wit is defensible under the entered/estimated information. Before spending the turn, an actually offered affordable Energy lesson deserves comparison: it uses no turn and could lower the displayed failure of the strong Speed training. The report records no shop offers, so the coach cannot assume such a lesson exists or buy one hypothetically. Its actual token type and updated failure must be entered. An explicit held selection suppresses this prompt because buying a lesson would refresh that selection.

Current balances can pay a +20 or +30 Energy lesson in Passion, Vocal or Mental, or a +40 lesson in Passion or Mental, **if offered at its documented cost**. Availability and token type remain unknown. This is an opportunity to check, not a forecast of the random shop.

## A confirmed calibration bug

The old `advance` code initialized `bestGain` to zero, then used `if (dg && !bestGain)` while visiting formula estimates. Once the first facility supplied any positive value, every later facility was skipped. In the normal array order that meant Speed alone determined the sample even when another training was much stronger. Reordering the same five inputs could change the learned strength.

This sample scales the generic continuation model used to value future energy. A string of weak first-facility estimates could depress the learned strength and therefore the apparent benefit of Rest. The current report's median is approximately **0.57**. This is a code defect; it is not proof that today's Wit choice is wrong.

`strengthSample` now compares all formula facilities when no gain is entered. Entered gains keep their existing observation priority. The sample's definition, 12-sample window, median/clamps and generic continuation assumptions stay the same. The correction applies to the shared deck-mode calibration across scenarios; the new recovery display is restricted to Grand Concert camp.

Older saves rebuild this strength series once from their original pre-command snapshots. Saved diagnostics supply the historical facility levels; older snapshots use the preceding logged training history. Unreadable snapshots and snapshots from another scenario are skipped. If there is no recoverable sample, the existing calibration is retained. The active state is repaired again after Undo into a pre-fix snapshot.

Rebuilding does not change energy, stats, bonds, tokens, songs, the separate formula multiplier (`fcal`), or recorded snapshots/outcomes. Formula-derived samples remain estimates, not measurements from the game. This fixes facility-order bias without pretending that guessed gains are observed results.

## Replay and sensitivity

The compact report omits the trainee and song dates. The reconstruction used those from the earlier same-career detailed report, the current turn-38 inputs, and the rounded supplied calibration values. It reproduces the reported ordinary Wit/Rest scores to rounding: approximately **1.25 versus 0.71**. Energy forecasts are exactly 42 and 77 under the logged model. Most current gains and failure rates remain unentered.

Replaying strength samples on the earlier detailed commands through **turn 36** changes that earlier median from about **0.57 to 0.91**. Using the replayed series with the turn-38 screen still chooses Wit, but its lead over Rest is materially smaller. This excludes the unseen full turn-37 inputs and is not a claim to reproduce the new browser save's exact migrated score.

An independent sensitivity check with a stronger future-training factor of 1.10 makes Rest lead naturally. That factor was not fitted or installed as a new default. It demonstrates that the ordinary energy comparison can choose Rest without a forced-rest bonus. Future placements, generic training-quality draws, unentered gains/failure, and the approximation to energy value prevent a proof of the optimal complete camp from this report.

The update therefore retains the computed choice instead of forcing Rest to answer the concern. Its visible recovery comparison and the calibration correction make the basis easier to judge.

## Display and diagnostic changes

- **Camp energy choice**, outside the folded explanation, shows Wit/Rest energy, remaining camp turns and whether Wit's failure is estimated.
- The conditional Energy-lesson prompt is added after the final choice, so a late Songs-first reordering cannot hide it behind notes on a discarded Speed option.
- Compact turn reports include coach build, energy deltas, gain/failure estimate flags, selection policy, Performance metrics and the recovery comparison. The previous compact report's `0%` alone did not establish an entered in-game value.
- Detailed reports retain the current comparison and the one shown for each newly logged command. Historical diagnostics are not rewritten as if this explanation existed then.

## Validation

Nine new regressions cover a strongest non-first facility, facility-order invariance, entered-gain priority, read-only rebuilding with original/legacy levels, invalid/mixed-scenario history, the 42-versus-77 comparison and hard risk limit, camp count/caps/entered failure, held-selection protection, and a natural Rest lead under a stronger continuation estimate.

The complete suite passed **296/296 tests** (287 existing plus nine new). JavaScript syntax and whitespace checks passed.

Actual-app DOM checks cover the visible comparison and new compact-report fields, saved-strength repair without changing the run's resources/history, and Undo into an old snapshot. Existing purchase, event, reward, deck-refinement, skill, sensitivity and export flows remain covered. Browser pixel/layout QA remains unavailable in this environment.

## Sources

- User's turn-38 compact report and earlier same-career detailed report through command 36. The unavailable full command-37 inputs and actual blank-field values are not inferred.
- [uma.guide's original Grand Concert guide](https://uma.guide/guides/grand-concert): Wit +5 base recovery, facility values, Energy lesson prices and no-turn lesson mechanics. Exact future offers are unknown.
- [uma.guide's Career Mechanics](https://uma.guide/guides/career-mechanics), Summer Camp section: Classic/Senior July–August timing, level-5 facilities, and Rest & Recreation's +40 energy and mood/condition benefits. Great mood and no conditions come from this user's report.
- Local `engine.js` continuation, strength-sampling loop, training estimates and failure policy. The bias and its correction were verified against actual code, rather than attributed to game rules.
