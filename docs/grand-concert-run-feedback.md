# Grand Concert: run-feedback pass

This pass starts from merged PR #39. It targets a career that reached only two total songs by the second concert in both the game and coach. That is a real acquisition shortfall rather than evidence of a counter-only bug. Without the turn log, the exact cause—training choices, timing of purchases, available offers, or input mistakes—cannot be reconstructed.

## Feedback inventory

| Request | State before this pass | Work in this pass |
| --- | --- | --- |
| +5 and +10 bond beside trainings | Already implemented, including handlers | Preserved and exercised through the actual UI |
| Expand / shorten explanations | Already implemented | Keep expansion when inputs refresh the call |
| +4 maximum energy | Already implemented | Preserved and checked; does not also grant current energy |
| +5 energy alongside +10 | Already implemented | Preserved and checked |
| Important songs' combined token costs | Already implemented as a type-by-type table | Keep it primary; fold the additional unlock-cost estimate |
| Hello's observed +20 to a lowest type | Already implemented, with ties/type selection and Undo | Preserved; do not confuse actual and expected Performance |
| Less technique clutter | Technique lists opened by default; generic call could list hypothetical lessons | Close the advanced technique recorder and remove generic technique prefixes in Songs first mode |
| More focus on Performance | Weighted tokens could still lose to a larger stat training | Add an explicit Songs first preference with guarded selection, plus visible period progress |
| Named good and bad conditions | Generic Bad condition and Practice Poor only | Add named common and character/version conditions, deterministic effects and observed cure outcomes |
| Better deck/skill valuation | Availability was separated by source, but all successful outcomes got the highest possible hint discount | Retain the hint-level probability distribution in both tier scoring and career estimates; expose source probabilities |

## Songs first policy

New and existing app saves default to **Songs first** unless they already record a preference. The alternate **Balance stats and songs** setting retains the prior weighted policy. Direct engine callers that omit a preference retain that prior policy.

Songs first operates from turn 5 through the end of turn 71 while the 18-song guarantee is incomplete. It does not replace a required race, a baseline recovery call, or the initial Hello meeting rule. If the baseline call is a training, candidates must be within the entered failure limit and must score at least as well as the recovery alternatives. Among those candidates it prefers the largest expected Performance that fits below the current caps, accounting for failure risk. Equal Performance retains the higher ordinary score.

The selector accounts for a prefixed purchase's effect on the balances before estimating training income. Its displayed preference score is a ranking adjustment, not extra stats, additional banked tokens or a measured value in race lengths. Different Performance types are not interchangeable; the existing priority-song budgets and scarcity scoring remain relevant. The preference is not a whole-career optimizer and does not prove that raw token maximization produces the best competitive ace.

The always-visible song banner distinguishes total songs from songs learned since the previous concert. It gives the current Hype shortfall and concert turn. The old counter and deadline corrections remain in force. A selected mastery-song purchase now stays attached to every recalculated alternative action, so choosing a different training cannot receive its predicted mastery gains without paying for the song.

## Purchases without excessive recording

Lessons do not spend a career turn. The main screen focuses on offered songs and the combined costs of selected priority songs. A player who does not want to record each technique can buy those unlock lessons in game, synchronize the five Performance balances, and then use Bought for the next song. Synchronize before recording that song so its cost is not counted twice. Backfill an already learned song using its actual learned turn when its rewards are already included in current stats/balances.

The closed advanced recorder remains available for exact technique accounting and recovery lessons. It is not necessary to keep its list expanded. Done can still include one explicitly offered purchase attached to a command; it is not a substitute for making all useful purchases available in the game shop before advancing.

## Conditions

The catalog records Charming, Fast Learner, Practice Perfect ○/◎, Hot Topic, Practice Poor, Migraine, Skin Outbreak, Night Owl, Slow Metabolism and Slacker. Separate character/version entries cover Shining Brightly, Under the Weather, Fan Promise, Not Ready, Legs of Glass, Ominous Portent and the additional named conditions in the scenario reference. Some entries use their original Japanese names rather than inventing Global names.

Known deterministic effects reach the command model: failure modifiers affect estimates while typed failure stays authoritative; Charming changes recorded training bond and early-friendship estimates; Hot Topic changes the tracked NPC bond forecast; Slow Metabolism removes training Speed before rescaling a typed total; and Migraine prevents mood recovery until cured, including the outing forecast and observed result. The observed skipped-training result for Slacker consumes the turn without inventing normal failure penalties, training income or a facility-level increase. A previously bought energy lesson remains bought even if the trainee does not show up.

Acquiring Practice Perfect clears Practice Poor. Acquiring Practice Poor removes Practice Perfect ○. Selecting Shining Brightly replaces Under the Weather, and vice versa. Ordinary cures retain positive and career-specific conditions. The Infirmary can be recorded as Not cured; camp rest clears ordinary negative conditions. If the game shows a partial or different result, adjust the individual flags to match it.

Unknown random event rates are not sampled into the saved run. Energy/mood losses, random condition acquisition, character rewards, the two one-use protection statuses and aptitude changes are recorded as actually observed. Fast Learner's 10% skill-purchase reduction is explained, but no complete skill-purchase balance is claimed. The continuation/condition-cure valuation remains approximate; a catalog entry does not mean its entire future career lifecycle is simulated. Current run conditions are not transplanted into a hypothetical new CM career.

## Event skill versus training hint correction

Skill race value still comes from the selected course/style data. Availability and discounts are different quantities. Training hints share a card's hint pool; high Hint Frequency helps that opportunity. Event skills use separate, explicitly estimated completion probabilities. The intrinsic race value of the same skill is not multiplied merely because it is offered by an event.

Previously, any possible higher-level hint supplied the highest discount to every outcome. For a synthetic example, take an 80% Lv1 event and a separate 10% Lv5 training hint. The chance of any hint is 82%. The correct unconditional expected discount is 11.2% of base skill cost, not 82% times a 40% discount. Both tier ranking and the career estimator now compute the maximum-hint-level distribution and its expected discount. Skill-source overlap is combined probabilistically and is not shown as additive percentages.

Source probabilities remain assumptions: the rarity-based event completion prior, individual event success/choice eligibility and dependencies have not all been calibrated. Grand Concert's event-frequency songs are still omitted from that acquisition model. The source breakdown makes those differences inspectable; it does not establish a universal event-skill premium or optimal deck ranking.

## Validation and limits

Fifteen additional regressions cover the hint distribution in both scoring paths, condition replacement and deterministic effects, NPC/support bond, authoritative inputs, cure outcomes, skipped training, caps and goal races, the Songs first choice, and purchase instructions on alternative mastery-song actions. Existing coach, scenario, optimizer and tier regressions remain part of the full suite.

The DOM integration exercises the real handlers for bond/energy/max-energy shortcuts, explanation persistence, condition selection, failed/successful treatment, the song-focused default, collapsed technique recording, the second-concert banner and source diagnostics, alongside the earlier Hello and purchase checks. Full visual browser QA remains pending. A representative competitive run log is still required to measure whether song acquisition and final deck results improve in practice.

## References

- [GameTora scenario investigation](https://gametora.com/umamusume/our-grand-concert): songs, Performance, lessons that do not consume turns, concert timing and delayed support-event bonuses.
- [GameTora new-player FAQ](https://gametora.com/umamusume/guides/new-player-faq): ordinary support training bond and Charming's additional bond.
- [Uma Musume Wiki condition catalog](https://umamusu.wiki/Game:Conditions): named conditions, modifiers, character-specific removal and replacement rules. Entries for newer versions are tracked separately from ordinary conditions.
- [uma.guide career mechanics](https://uma.guide/guides/career-mechanics): common condition effects, observed cure methods and camp rest; cure probabilities and random penalties are not invented here.

The probability correction is original arithmetic in this repository; it does not copy an external simulator implementation.
