# Second-concert run: purchase controls, missing income and training order

Checked 2026-10-17 against the user's build `20261017f` report, with commands 1–36 recorded and the career on turn 37. This follows the [first-concert audit](grand-concert-first-concert-audit.md). Build `20261017g` addresses the specific failures below. The original report stays outside the public repository; regressions use focused reconstructed states.

## What the report establishes

| Measure | Recorded result | Interpretation |
| --- | --- | --- |
| Detailed commands | 36, no turn gaps | The second concert command is included |
| First concert, turn 24 | 5 total songs: 4 paid plus Make Debut! | Full Hype; the separate five-paid-song guide target was short |
| Second concert, turn 36 | 7 total, 2 learned in this period | The recorded history is one song short of full Hype |
| Current turn 37 | 8 total, 7 paid | Run n' Run! was added as already owned on turn 37 |
| Held selection at either concert | None recorded | Repeated hold/release attempts did not leave a recorded carry |
| Recorded training Performance | 375 total | Formula amounts and mostly assumed colors |
| Calendar Performance | 50 total | Only the opening +10 of each type; no collaborator rewards |
| Actual Hello events logged | 0 | The control's location was a recording obstacle; this is not evidence that no events happened |
| Entered training amounts / types | 0 / 2 of 29 sources | Exact alternative token balances cannot be reconstructed |

The report dates the current songs as: four on turn 24, Zero Is Where the Center Stands! on 27, Go This Way on 34, and Run n' Run! on 37. The last entry uses the already-owned flow. If its real in-game purchase preceded the second concert and was entered late, the recorded concert count is wrong; the report alone cannot settle that timing. This audit therefore describes recorded progress rather than asserting the actual in-game concert result.

## Confirmed interface failures

### Bought and Hold overlapped

The previous CSS assigned every direct button in a shop row to `grid-area: buy`. Both Bought and Hold were direct children, so both occupied the same cell. The later Hold button could cover Bought. This explains the reported blocked purchase independently of token affordability or carry policy.

Song rows now contain a dedicated action group with separate Bought and Hold rows. Manual Bought stays usable while holding. An affordable purchase pays its real cost, clears the hold and obsolete offers, applies its immediate reward once, and retains strict purchase Undo.

When the coach's balance cannot pay a song that the user already bought in game, Bought opens a local recording alternative. **Already bought in game · record owned** adds the learned song and clears the old shop without charging again, granting free tokens, or adding already-received stats. The user can instead correct the balances and use the ordinary purchase path.

### Already-owned recording left stale offers

The turn-27 song-history entry marked Zero Is Where the Center Stands! learned but left the previous Run n' Run!/Go This Way/Zero shop selection active. Those offers persisted through turn 34. A real purchase refreshes the entire selection, so the engine was receiving obsolete offer information.

The shared `recordLearnedSong` path clears the selection for a current-turn purchase. A historical backfill removes the learned song's obsolete tick while preserving other currently entered offers, whose chronology is unknown. An observed carried selection receives its cadence credit only when it is the period's first learned shop song. No carry is inferred from the unrecorded history.

### Event controls were inaccessible after logging

Putting bond buttons on selected training members made them disappear as soon as Done cleared placements—the moment the player wanted to record subsequent events. The Hello button had moved outside its inner explanation but remained inside the folded Grand Concert panel.

**Event shortcuts** now sits directly below training, outside all folded sections. Every selected deck card retains +5/+10 bond buttons after Done. It also contains the actual Hello reward, outing-unlock control, observed all-token rewards and Undo. Bonds cap at 100. The old turn-level past-Hello checkbox is removed from the form; actual event recording still supplies the debut check, and legacy saved answers remain readable.

Usual training token colors are preselected again, as requested. Ranking and Done use that same assumption; an edited color overrides it. Blank amounts keep their visible formula estimate. Reports continue to distinguish untouched assumed colors from entered observations. Faster input does not establish what the game actually displayed.

## Missing calendar income

Original event tables agree that **new concert collaborators** increase each Performance cap by 50 and grant **+10 of every type** after Promo Lives. The event calendar places these after Junior late December and Classic late June/December; the scenario repeats the collaborator event after each of its four Promo Lives. The former coach raised the cap but omitted this income.

| Command ending | Reward available afterward | Cap used |
| --- | --- | ---: |
| 4 | Make Debut!: +10 each | 200 |
| 24 | New collaborators: +10 each | 250 |
| 36 | New collaborators: +10 each | 300 |
| 48 | New collaborators: +10 each | 350 |
| 60 | New collaborators: +10 each | 400 |
| 72 | No collaborator reward inferred for the final concert | Existing final-concert handling |

Training still uses the command's original cap. Collaborator income is applied later using the raised cap. It cannot finance a purchase attached before the command. The shared calendar helper drives the coach, report accounting and career estimator, keeping their base currency consistent. Normal and Great Success outcomes receive the same base collaborator reward.

Altema separately identifies +5 of every type from scenario-link characters at concert completion; GameWith lists varying additional Performance at some concerts. Exact character/event eligibility and multiplicity are not established by this report. The update provides **Link reward +5 all** for an actually received extra reward rather than automatically multiplying five points by every linked deck card. This remains an explicit modeling gap in career estimates. The +10 button covers other observed all-token income or missed old bookkeeping; automatic collaborator income must not be entered twice.

No past reward is added when loading an older save. The user's later balance corrections may already include some or all of those real rewards. Applying another +50 total for each earlier concert would risk double-counting.

### Recorded arithmetic

| Type | Training | Opening calendar | Corrections | Recorded spend | Current balance |
| --- | ---: | ---: | ---: | ---: | ---: |
| Dance | 71 | 10 | -26 | 52 | 3 |
| Passion | 57 | 10 | +24 | 87 | 4 |
| Vocal | 74 | 10 | +29 | 83 | 30 |
| Visual | 41 | 10 | 0 | 43 | 8 |
| Mental | 132 | 10 | -7 | 94 | 41 |
| **Total** | **375** | **50** | **+20** | **359** | **86** |

The recorded ledger reconciles, but it lacks individual event and unlock-purchase observations. Net corrections cannot identify the timing or type of Hello events, extra link rewards, or unrecorded technique costs. Backfilled songs are excluded from recorded spending. These gaps prevent an exact counterfactual song count.

## Challenge to the ranking

The prior preference elevated points filling an aggregate projected song/carry budget. It could prefer a hypothetical later color over finishing an actual offered song, and its synthetic score adjustment made that preference appear to be an ordinary point-score victory. It could also allow an over-limit training to remain first when no eligible training replaced it.

The new ordering is explicit:

1. Preserve forced goal races, Hello's eligible first meeting and the recovery comparison. Trainings above the configured failure limit cannot lead in Songs first.
2. Consider safe trainings whose ordinary value is at least the best recovery/other command.
3. If a candidate can fund an actually offered song by the next command, compare completion probability, expected reduction in its remaining typed cost, usable Performance, then ordinary score.
4. If no candidate can finish an offer in one command, compare usable Performance first, then partial cost reduction, then ordinary score. With no observed offer, use usable supply rather than speculative reserve colors.

An explicit held selection restricts the concrete funding target to that song. The projected sequence budget still informs spending reserves and the ordinary token component; it does not replace actual offers in this preference. Guaranteed calendar income is included when testing next-command affordability so the policy does not chase a color already covered by the concert reward.

The no-completion fallback matters. An initial replay variant preferred a roughly 21-point Hello/Guts expectation over the turn-25 32-point rainbow because it reduced the nearest song's partial gap by slightly more. That would discard substantial income without finishing a song. The final policy preserves the rainbow. This is covered by a regression.

### One-command comparisons on the recorded states

Recorded facility levels are restored for each snapshot. Replay uses the restored usual-type input policy without inserting missing calendar rewards into the user's historical balances. Each row is an independent comparison on the actual recorded path, not a simulated alternative career.

| Turn | Recorded choice | New choice | Why it matters |
| --- | --- | --- | --- |
| 25 | Speed, 0% failure | Speed, 0% | Keeps the 32-point rainbow while no candidate can finish an offered song |
| 26 | Guts, 0% | Guts, 0% | Can fund a current offer under the usual-type assumption |
| 27 | Wit, 0% | Speed, 11% | Hello supplies a separate modeled chance to finish an offer; its proc/type are uncertain |
| 28 | Guts, 5% | Speed, 5% | Run n' Run! is one Dance short; the prior Visual surplus does not close that gap |
| 29 | Wit, 18% | Rest | The configured failure limit is 17% |
| 30 | Wit, 14% | Wit, 14% | Other trainings exceed the limit or lose to recovery |
| 31 | Satsuki Sho | Satsuki Sho | Goal race protected |
| 32 | Wit, 0% | Speed, 5% | 95% modeled funding chance versus Hello/Wit's 40% event chance |
| 33 | Power, 13% | Speed, 0% | Speed funds Run n' Run!; Power can fund Go This Way but has higher failure risk |
| 34 | Japanese Derby | Japanese Derby | Goal race and its already-affordable song purchase protected |
| 35 | Rest | Rest | Over-limit trainings do not displace recovery; Hello's outing does not win automatically |
| 36 | Power, 0% | Power, 0% | Best eligible usable supply with Hello's separate event expectation |

Five of twelve choices change. This does not imply five errors under every objective, or guarantee more songs in an alternative run. Types, amounts, later refreshed shops and actual event outcomes remain unknown. In particular, Power on turn 33 was not useless currency: Vocal could fund another real offered song. The clear distinction is the safer funding route under the selected Songs-first objective.

### Honest explanations and random events

The main call shows **#1**, its criterion, and the assumptions. The alternatives show funding chance, cost-gap reduction and usable tokens; ordinary scores remain separate. Preference ordering no longer fabricates `parts.songFocus` points or draws ordinary-score bars that imply a false ordering. Recovery selected because of the failure limit has its own explanation.

Hello is evaluated as discrete no-event and event outcomes. If lowest types tie, event paths split their probability. An expected +8 is never treated as a certain award capable of paying a song. Caps and training failure affect the funding chance. Random unentered types retain separate 60/30/10 outcome paths for API callers using the probabilistic policy; the browser's fast default uses the visible preselected usual type.

Actual Hello recording defaults to a lowest type and allows an explicit override. Tied auto choices are marked assumed in reports. Duplicate clicks preserve the existing Undo. When recording immediately after a concert command, the logged pre-calendar balance determines the event's old-cap headroom; the later +10 does not erase room the event had before that reward. This relies on unchanged logged closing balances.

Observed all-token rewards have their own earned/lost-at-cap totals, separate from automatic calendar income, balance corrections and purchases. Reward Undo removes only its matching pending entry. Old detailed diagnostics remain historical; exporting does not rewrite them with today's rewards or recommendations.

## Validation and limits

**287/287 tests passed**, including 22 new regressions. The added cases cover reward dates/caps, failed commands, pre-command affordability, simulator currency, observed rewards, forecast/Done type consistency, discrete random/rainbow/Hello paths, funding probability, avoiding partial-gap overreach, hard risk eligibility, forced actions, stale offers, owned-song recording, carry credit and concert-day Hello cap ordering. Two carried-technique fixtures were updated for the legitimate new +10 income; the previous Hello comparison now explicitly compares certain song completion with a random chance.

Actual-app DOM integration passed the real event handlers for separate Bought/Hold action groups, held purchases, underfunded recording, persistent six-card bond buttons after Done, reward Undo, outing unlock, fast defaults, removal of the old checkbox, Hello outside every folded section, tie/duplicate Undo, and the visible ranking criterion. Existing deck refinement, affordable skills, coupled events, sensitivity and upgrade-comparison checks passed too. JavaScript syntax and whitespace checks passed. Browser pixel/layout QA remains pending; DOM structure and CSS have been reviewed, but a rendered browser screenshot was unavailable in this environment.

This policy ranks the entered one-command candidates. It is not an exhaustive future-shop planner or proof of the best whole career. The coach still combines logging a command with its automatic concert transition; GameTora documents an in-game lesson window before stepping on stage. Purchases made in that window must be entered with their actual learned turn, and a late already-owned entry must not be treated as proof that the game missed full Hype. Conditional link rewards, unobserved refreshes, exact proc rates and next-run calibration remain open. No probability was fitted to the end-balance corrections.

## Sources

- User-supplied build `20261017f` detailed report, through command 36. Actual support placements, outing state, corrections and recorded dates are retained; missing observations are not inferred.
- [GameWith's original event tables](https://gamewith.jp/uma-musume/article/show/360338): new collaborators' +50 cap and +10 each; separate concert rewards and variable extra Performance.
- [Kamigame's event calendar](https://kamigame.jp/umamusume/page/225288435567465728.html): dated collaborator events after Junior late December and Classic late June/December, with normal/Great Success examples. Its separate event-choice typo is not used for token types.
- [Altema's event observations](https://altema.jp/umamusume/glandlivesentakushi): base collaborator income and separate scenario-link +5-all results. Exact eligibility is left observed rather than generalized per deck card.
- [GameTora's original scenario investigation](https://gametora.com/umamusume/our-grand-concert): tested offer refreshes, carry cadence, token distributions, mastery/concert timing, Hype and the pre-stage lesson window. Checked 2026-10-17.
