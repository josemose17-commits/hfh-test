# Grand Concert run diagnostics

This pass follows merged PR #40. It adds the evidence needed to investigate a career reaching only two total songs by its second concert. It does not change the training policy, song prices, purchase policy or deck ranking, and does not claim to establish the original run's cause.

## What is retained

Each newly logged command stores its original recommendation, every ranked option, the actual chosen action and whether it followed the recommendation. Options include scores, score components, failure assumptions, predicted gains, prefixed purchases and the model's expected Performance. The original pre-command snapshot supplies the entered training inputs, support placements, bonds, conditions, settings, shop ticks and balances. A compact closing checkpoint records stats, energy, mood, conditions, tokens, songs and lesson counts. The chosen training/outing/treatment result is retained.

No-turn purchases are separate events. Each purchase retains its ID, label, command turn, checked offers, token cost and before/after balances, energy and stats. Purchasing several lessons before training no longer overwrites all but the last one in the diagnostic history. Purchase Undo adds a reversal event; net purchase spend subtracts the refund. Backfilled and removed songs are explicitly history corrections, without invented token spending or refunds. Their actual learned turn and recording turn are distinct.

An observed Hello event retains its awarded type, nominal amount, credited amount and effect turn. An event entered immediately after Done can apply to the previous turn while its recording turn is the current one. Undo restores the original event state and prevents duplicate credit. Expected Hello opportunities remain in option estimates and never enter recorded token income.

Editing a token balance creates a balance-correction event. Consecutive edits to the same field coalesce, so typing `25` does not create two separate rewards. Corrections can include an unrecorded in-game purchase or event; the report does not guess which. A cost entered only through a balance correction is not also counted as a recorded purchase.

## Token accounting

The command ledger separates:

1. Starting balances.
2. Song/technique costs attached to that command, paid before training even if it fails.
3. Requested, credited and capped-away training income by type.
4. Fixed calendar token income and its cap losses.
5. Closing recorded balances and any unreconciled difference.

Training source records distinguish entered amounts from formula amounts, and selected types from assumed types. The facility level is resolved using the original logged training history before compacting the calculation state; otherwise a specialized training mix could give the report the wrong formula amount. Failure and observed Slacker absence produce no training income. Formula income is a recorded coach estimate rather than an independently observed game reward.

Totals summarize only covered data. They separate recorded training income, calendar rewards, observed Hello income, cap losses, net purchase spend and balance corrections. Starting a report midway through a run does not manufacture its opening balances or missing transactions. Per-turn unreconciled differences remain inspectable even if opposite errors cancel in the total.

For each concert whose command was logged, the report distinguishes progress before the command from progress after it. A song purchased as part of that command counts in the ending concert period, even though the saved state has advanced to the next period. A concert skipped by a manual turn jump has no invented closing result. Current song counts and the turn-71 deadline retain the existing engine rules.

## Export and compatibility

The report is available under **Career log → Detailed run report** and **This call looks wrong?** throughout the run, including when reset advice is off. Copy produces a short readable overview followed by schema-v2 JSON; Download produces standalone JSON. The existing reset-summary button uses the same full report. The current unlogged turn includes its inputs and ranked options. Reset-check results and the user's answers remain included.

Older log entries export their saved inputs where readable. Their historical recommendation is not recomputed using today's code and presented as original. Missing outcomes and between-command purchases stay unknown. Coverage reports legacy turns, unreadable snapshots, the first recorded turn, gaps and the current turn's relationship to the history. Manual jumps and partial careers are visible. Completed final commands do not create a false missing-turn warning merely because the engine keeps the terminal turn number.

No raw Undo snapshots are exported. UI search state, nested purchase backups and nested Hello Undo data are omitted. Finished diagnostic events live on their turn's log entry; only events since the last command remain pending. The existing turn Undo snapshot restores those pending events, so undoing and redoing a command neither loses earlier purchases nor duplicates them. The retained history follows the coach's existing 90-entry log limit. Starting a new career clears its diagnostic history along with the existing run state.

A storage check found that the old Hello event backup copied the entire turn log into both its before/after strings. Those strings then entered later turn snapshots, recursively increasing saved data. New event backups omit the log and preserve the independent log when the event is undone. Legacy event backups retain their existing read path. The strict state-change guard remains; undoing a subsequent command first restores the event's valid Undo state.

Reports are built locally and shared only by an explicit copy or download action. The app does not read the game screen. Only the offers the user marks and actions they record are known; an unticked offer does not prove the game failed to offer a song. Diagnostic recording does not calibrate the Performance formula or establish a deck's competitive quality.

## Validation

Thirteen focused regressions exercise alternative choices, capped entered training income, estimated versus observed Hello rewards, multiple no-turn purchases and purchase Undo, prefixed purchases on failed training, calendar tokens, log-derived facility levels, turn Undo, coalesced corrections, concert-boundary purchases, legacy/broken history, read-only exports, final-command coverage and non-Grand-Concert reset reports. A scripted 36-command run through the second concert reconciles the covered ledger to the closing token balances. It verifies accounting, not a real game's song acquisition quality.

The actual-app DOM integration checks export availability with reset advice off, notes, current and completed history, recorded purchases and corrections, the alternative-action handler, JSON download, Hello event Undo and turn Undo. Existing shortcut, condition, shop, deck and Hello controls remain covered. Full visual browser review and a real run through the second concert remain pending.
