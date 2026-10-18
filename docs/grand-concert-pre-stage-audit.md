# Grand Concert Pending Phase Audit

## Goal
Grand Concert live performances (`grandlive` scenario) grant stat bonuses and token rewards at `endOfTurn` on live turns (24, 36, 48, 60, 71, 72). These were previously applied **immediately** during `endOfTurn`. As of the pending-phase refactor they are **deferred** behind an explicit `finalizeConcert` call.

## Change Summary
| Component | Before | After |
|---|---|---|
| `engine.js endOfTurn` | Grants stats + tokens immediately | Grants a **placeholder** (no stat/token gain yet); sets `gl.pendingConcert = { turn, concertIndex, scheduledRewards }` |
| `engine.js finalizeConcert` | Did not exist | **New**: applies deferred stat bonuses, token rewards, friendship bonuses, and clears `pendingConcert`; emits a `finalizeConcert` event |
| `engine.js glRewards` | Reported only finalized concerts | Now reports **pending** and **finalized** concerts, marking pending ones with `status: "pending"` |
| `engine.js songBonuses` | Applied GL U's +10% on turn 72 immediately | Keeps +10% as `pendingFb` until `finalizeConcert` is called |
| `engine.js hypeStatus` | Computed hype for the next upcoming concert | Now also reports the **pending** concert's Hype window during the pending phase |
| `engine.js shopSongs` | Used `currentPeriod` based on `state.turn` | Uses `currentPeriod` that accounts for the pending window for focus/avoid selection |
| `run-report.js inputs` | No `pendingConcert` field | Serializes `gl.pendingConcert` for round-trip persistence |
| `run-report.js build` | `report.concerts` had no pending/finalized distinction | Each concert entry has `pending: boolean` and `finalized: boolean` flags |
| `app.js onDone` | No concert finalization | Calls `E.finalizeConcert` and `R.event(next, "finalizeConcert", ...)` |
| `app.js UI` | Always enabled | "Step on stage" button added for manual finalization; turn-advancing actions **disabled** while `pendingConcert` is active |

## Data Model
```
gl.pendingConcert = {
  turn: number,          // the concert turn (e.g., 24, 36, 48, 60, 71, 72)
  concertIndex: number,  // 0-based index into SCENARIOS[gl.scenario].lives
  stats: {...},          // deferred stat bonuses (+10 Great Success, +3 otherwise)
  tokens: [...],         // deferred token rewards (5 per song, 100 bonus on Great Success)
  friendshipBonus: number, // deferred friendship bonus (GL U's +10%/song)
}
```

## Serialization
- `R.inputs(state)` includes `gl.pendingConcert` if present, so the pending phase survives save/load.
- `R.event(state, "finalizeConcert", { turn, concertIndex })` records the finalization event in the report timeline.
- Report exports (`R.build`) mark each concert with:
  - `pending: true` — concert has been triggered but not yet finalized
  - `finalized: true` — `finalizeConcert` has been called
  - `pending: false` — final state after finalization

## Test Coverage
- `test/grand-concert.test.js`: 37 tests covering pending phase, finalization, token deferral, friendship bonus deferral, hype window, shop song selection, and multi-concert sequencing.
- `test/run-report.test.js`: Added serialization and finalization tests for `pendingConcert`.
- `test/engine.test.js`: Grand Concert reward test updated to call `finalizeConcert` after `advance`.
- `test/second-concert.test.js`: All 22 tests pass with pending-phase accounting.
- `test/run-report.test.js`: "Scripted run through second concert" reconciles income/spend/corrections across pending → finalized transitions.

## Risks / Edge Cases
1. **UI must call `finalizeConcert`**: The user (or UI automation) must call `E.finalizeConcert` before the next turn. The UI provides a "Step on stage" button for this.
2. **Double-counting prevention**: `finalizeConcert` is idempotent — calling it twice on the same concert (detected by `concertIndex`) is a no-op.
3. **Pending concert on turn 72**: The final concert at turn 72 must be finalized before the run report is finalized; `R.build` will emit a warning if any concerts remain pending.
4. **Token cap interaction**: Calendar tokens are deferred separately (see `deferredCalendar` in token flow diagnostics). The pending phase ensures stat bonuses (which raise caps) don't double-count calendar tokens.

## Files Modified
- `engine.js` — pending phase logic, `finalizeConcert`, `glRewards`, `songBonuses`, `hypeStatus`, `shopSongs`, `endOfTurn`
- `run-report.js` — `inputs`, `build`, `event`, `format`
- `app.js` — "Step on stage" button, disabled actions during pending, `finalizeConcert` call
- `test/grand-concert.test.js` — 37 tests (24 new + 13 existing-adjacent)
- `test/run-report.test.js` — serialization + finalization tests
- `test/engine.test.js` — updated Grand Concert reward test
- `test/second-concert.test.js` — pending-phase assertions
