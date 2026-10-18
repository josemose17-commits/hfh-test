const test = require("node:test");
const assert = require("node:assert/strict");
const E = require("../engine.js");
const R = require("../run-report.js");
const sc = require("../scenarios.js").SCENARIOS.find((s) => s.id === "grandlive");
const total = (v) => v.reduce((n, x) => n + x, 0);
const zeros = () => [0, 0, 0, 0, 0];
function fixture(overrides = {}) {
  return Object.assign({
    scenario: sc.id, turn: 30, energy: 100, maxEnergy: 100, mood: 2, build: "medium", risk: 12, goals: [], goalRace: false,
    stats: { speed: 300, stamina: 200, power: 250, guts: 150, wit: 200 }, trackStats: true,
    extras: {}, caps: {}, calib: [], log: [], conditions: {}, facLevels: {},
    gl: { songs: {}, tokens: zeros(), lessons: {}, focus: "songs" },
    facilities: E.STATS.map((stat) => ({ stat, gain: stat === "speed" ? 100 : stat === "power" ? 65 : 8, cards: stat === "power" ? 4 : 0, rainbows: stat === "power" ? 1 : 0, fail: 0, extras: {} }))
  }, overrides);
}
function advance(s, chosen, observed = {}) {
  const rec = E.recommend(s, sc);
  const pick = chosen || rec.action;
  const next = E.advance(s, sc, pick, observed.result, observed);
  R.recordTurn(s, next, sc, rec, pick, observed);
  if (next.gl && next.gl.pendingConcert) {
    const pt = next.gl.pendingConcert.turn;
    E.finalizeConcert(next, sc);
    R.recordFinalization(next, sc, pt);
  }
  return next;
}
function buySong(s, id = "tachiichi") {
  s.gl.shop = { ["song:" + id]: { turn: s.turn } };
  E.buySong(s, sc, id); assert.equal(s.gl.lastBuy.id, "song:" + id);
  R.purchase(s, s.gl.lastBuy);
}

test("detailed history preserves an alternative choice, available inputs and exact capped training income", () => {
  const s = fixture(); s.gl.tokens[0] = 245;
  s.facilities[0].extras = { tok: 20, tokType: 0 };
  const rec = E.recommend(s, sc);
  const speed = rec.ranked.find((o) => o.kind === "train" && o.stat === "speed");
  assert.notEqual(rec.action.stat, "speed");
  const next = E.advance(s, sc, speed);
  R.recordTurn(s, next, sc, rec, speed);
  const report = R.build(next, sc), turn = report.turns[0];
  assert.equal(turn.followedRecommendation, false); assert.equal(turn.chosen.stat, "speed");
  assert.equal(turn.recommended.stat, rec.action.stat);
  assert.equal(turn.inputs.facilities[0].extras.tok, 20);
  assert.equal(turn.options.filter((o) => o.kind === "train").length, 5);
  assert.equal(turn.performance.training.credited[0], 5);
  assert.equal(turn.performance.training.lostAtCap[0], 15);
  assert.equal(turn.performance.training.sources[0].amountEstimated, false);
  assert.equal(turn.performance.training.sources[0].typeAssumed, false);
  assert.deepEqual(turn.performance.unreconciled, zeros());
  assert.equal(report.totals.recordedTrainingIncome[0], 5);
});

test("estimated Hello opportunities stay separate from recorded training and observed event income", () => {
  const s = fixture({ energy: 80, deck: { slots: [{ id: 30052, lb: 4, bond: 90, met: true, dates: { unlocked: false, done: 0 } }] } });
  s.facilities[0].members = [0]; s.facilities[0].extras = { tok: 10, tokType: 0 };
  const choice = E.recommend(s, sc).ranked.find((o) => o.stat === "speed");
  const next = advance(s, choice), report = R.build(next, sc);
  assert.ok(report.turns[0].chosen.expectedPerformance.sources.some((g) => g.helloExpectation));
  assert.equal(total(report.totals.recordedTrainingIncome), 10);
  assert.equal(total(report.totals.helloIncome), 0);
  const event = E.recordHelloEvent(next, sc, { amount: 20, type: 1, turn: 30 });
  R.event(next, "helloEvent", event, event.turn);
  const updated = R.build(next, sc);
  assert.equal(updated.events[0].turn, 30); assert.equal(updated.events[0].recordedTurn, 31);
  assert.equal(updated.events[0].pending, true); assert.equal(updated.totals.helloIncome[1], 20);
  assert.equal(total(updated.totals.recordedTrainingIncome), 10);
});

test("all no-turn purchases survive and purchase Undo refunds only its matching spend", () => {
  const s = fixture(); s.gl.tokens = [100, 100, 100, 100, 100];
  const opening = s.gl.tokens.slice(); buySong(s);
  s.gl.shop = { "stat:speed": { turn: 30 } };
  E.buyTechnique(s, sc, "stat:speed"); R.purchase(s, s.gl.lastBuy);
  const last = s.gl.lastBuy;
  const beforeUndo = R.build(s, sc);
  assert.equal(beforeUndo.events.filter((e) => e.kind === "purchase").length, 2);
  assert.deepEqual(beforeUndo.totals.netPurchaseSpend, opening.map((n, i) => n - s.gl.tokens[i]));
  E.undoBuy(s); R.purchase(s, last, true);
  const report = R.build(s, sc);
  assert.equal(report.events.length, 3); assert.equal(report.events[2].kind, "purchaseUndo");
  assert.deepEqual(report.totals.netPurchaseSpend, sc.songs.find((x) => x.id === "tachiichi").cost);
  assert.equal(s.turn, 30);
});

test("a prefixed song is paid once even when the subsequent training fails", () => {
  const s = fixture(); s.gl.tokens = [100, 100, 100, 100, 100]; s.gl.shop = { "song:tachiichi": { turn: 30 } };
  const rec = E.recommend(s, sc);
  const choice = rec.ranked.find((o) => o.kind === "train");
  assert.equal(choice.song.id, "tachiichi");
  const next = advance(s, choice, { result: "fail" });
  const report = R.build(next, sc);
  assert.deepEqual(report.totals.netPurchaseSpend, sc.songs.find((x) => x.id === "tachiichi").cost);
  assert.equal(total(report.totals.recordedTrainingIncome), 0);
  assert.equal(report.turns[0].result.training, "fail");
  assert.equal(next.gl.songs.tachiichi, 30); assert.deepEqual(report.totals.unreconciled, zeros());
});

test("calendar tokens are separated from training and respect the opening cap", () => {
  const s = fixture({ turn: 4 }); s.gl.tokens = [195, 195, 195, 195, 195];
  const next = advance(s), report = R.build(next, sc);
  assert.deepEqual(report.totals.recordedTrainingIncome, zeros());
  assert.deepEqual(report.totals.calendarIncome, [5, 5, 5, 5, 5]);
  assert.deepEqual(report.totals.calendarLostAtCap, [5, 5, 5, 5, 5]);
  assert.deepEqual(report.totals.unreconciled, zeros());
});

test("token diagnostics use the facility level derived from the actual logged training mix", () => {
  const s = fixture({ turn: 17 });
  s.log = Array.from({ length: 16 }, (_, i) => ({ turn: i + 1, kind: "train", stat: "speed" }));
  const level = E.facLevelFor(s, sc, "speed");
  assert.ok(level > E.facLevelFor(Object.assign({}, s, { log: [] }), sc, "speed"));
  const choice = E.recommend(s, sc).ranked.find((o) => o.stat === "speed");
  const report = R.build(advance(s, choice), sc);
  const last = report.turns.slice(-1)[0];
  assert.equal(last.chosen.expectedPerformance.facilityLevel, level);
  assert.deepEqual(last.performance.unreconciled, zeros());
  assert.equal(last.performance.training.sources[0].amountEstimated, true);
});

test("turn Undo restores pending purchases and corrections without duplicating them", () => {
  const s = fixture(); s.gl.tokens = [100, 100, 100, 100, 100]; buySong(s);
  const old = s.gl.tokens.slice(); s.gl.tokens[4] += 3; R.balanceCorrection(s, old, 4);
  const pending = JSON.stringify(s.runPending);
  const next = advance(s);
  assert.equal(next.runPending, undefined);
  assert.equal(R.build(next, sc).events.length, 2);
  const undone = E.undo(next);
  assert.equal(JSON.stringify(undone.runPending), pending);
  assert.equal(R.build(undone, sc).events.length, 2);
  const redone = advance(undone);
  assert.equal(R.build(redone, sc).events.length, 2);
  assert.deepEqual(R.build(redone, sc).totals.netPurchaseSpend, R.build(next, sc).totals.netPurchaseSpend);
});

test("typing a balance coalesces into one correction and is never labeled earned income", () => {
  const s = fixture();
  let before = s.gl.tokens.slice(); s.gl.tokens[2] = 2; R.balanceCorrection(s, before, 2);
  before = s.gl.tokens.slice(); s.gl.tokens[2] = 25; R.balanceCorrection(s, before, 2);
  const report = R.build(s, sc);
  assert.equal(report.events.length, 1); assert.equal(report.totals.balanceCorrections[2], 25);
  assert.equal(total(report.totals.recordedTrainingIncome), 0);
});

test("concert diagnostics count a command's song purchase in the ending period", () => {
  const s = fixture({ turn: 36 });
  const [a, b, c] = sc.songs.filter((x) => x.from <= 36).slice(0, 3);
  s.gl.songs = { [a.id]: 30, [b.id]: 31 }; s.gl.tokens = [250, 250, 250, 250, 250];
  const rec = E.recommend(s, sc);
  const choice = Object.assign({}, rec.ranked.find((o) => o.kind === "train"), { song: { id: c.id }, prefix: ["Learn " + c.name] });
  const report = R.build(advance(s, choice), sc);
  const concert = report.concerts.find((c) => c.turn === 36);
  assert.equal(concert.beforeCommand.total, 3); assert.equal(concert.beforeCommand.hype.since, 2);
  assert.equal(concert.afterCommand.total, 4); assert.equal(concert.afterCommand.hype.since, 3);
  assert.equal(concert.afterCommand.hype.next, 36);
  assert.equal(concert.afterCommand.hype.need, 0);
  assert.equal(report.concerts.find((c) => c.turn === 24).recorded, false);
});

test("legacy and broken snapshots remain exportable with explicit gaps and unknown outcomes", () => {
  const s = fixture({ turn: 32 });
  s.log = [{ turn: 25, kind: "rest", label: "Rest", snapshot: JSON.stringify(fixture({ turn: 25 })) }, { turn: 30, kind: "train", stat: "speed", label: "Speed", snapshot: "broken" }];
  const report = R.build(s, sc);
  assert.equal(report.coverage.legacyTurns, 2); assert.equal(report.coverage.detailedTurns, 0);
  assert.deepEqual(report.coverage.unreadableSnapshots, [30]);
  assert.deepEqual(report.coverage.gaps, [{ after: 25, next: 30 }]);
  assert.equal(report.coverage.endsBeforeCurrentTurn, true);
  assert.equal(report.turns[0].recommended, null); assert.equal(report.turns[0].after, null);
  assert.equal(report.turns[1].inputs, null);
  assert.match(R.format(report, sc), /History has missing turns or inputs/);
});

test("report generation is read-only and omits nested Undo data and unrelated UI state", () => {
  const s = fixture(); s.gl.tokens = [100, 100, 100, 100, 100]; buySong(s);
  s.db = { query: "not-report-data" }; s.gl.lh20Undo = { before: "nested-snapshot" };
  R.event(s, "songBackfill", { id: "example", learnedTurn: 10, paid: false });
  const saved = JSON.stringify(s), rec = E.recommend(s, sc), report = R.build(s, sc, "check this", rec);
  assert.equal(JSON.stringify(s), saved);
  const text = R.format(report, sc);
  assert.doesNotMatch(text, /nested-snapshot|not-report-data|"lastBuy"|"lh20Undo"|"snapshot":/);
  assert.equal(report.why, "check this"); assert.equal(report.current.gl.tokens.length, 5);
  assert.equal(report.events[1].paid, false);
  assert.equal(report.currentOptions.length, rec.ranked.length);
});

test("the final command and non-Grand-Concert exports retain valid coverage and reset checks", () => {
  const ura = require("../scenarios.js").SCENARIOS.find((s) => s.id === "ura");
  const s = fixture({ scenario: ura.id, turn: ura.totalTurns, resetMode: "ace" });
  const rec = E.recommend(s, ura), next = E.advance(s, ura, rec.action);
  R.recordTurn(s, next, ura, rec, rec.action);
  const report = R.build(next, ura);
  assert.equal(report.coverage.endsBeforeCurrentTurn, false);
  assert.equal(report.currentProgress, null); assert.equal(report.turns[0].performance, null);
  assert.ok(report.checks); assert.equal(report.turns[0].followedRecommendation, true);
  assert.doesNotMatch(R.format(report, ura).split("\n\n")[0], /Recorded training income/);
});

test("pendingConcert serializes in inputs, and build marks pending vs finalized concerts", () => {
  const s = fixture({ turn: 24 }); s.gl.tokens = [100, 100, 100, 100, 100];
  const rest = E.evaluate(s, sc).options.find((o) => o.kind === "rest");
  const next = E.advance(s, sc, rest);
  assert.ok(next.gl.pendingConcert, "advance at a concert turn sets pendingConcert");
  const serialized = R.inputs(next);
  assert.deepEqual(serialized.gl.pendingConcert, { turn: 24, concertIndex: 0 }, "pendingConcert is serialized in inputs");
  R.recordTurn(s, next, sc, E.recommend(s, sc), rest, {});
  E.finalizeConcert(next, sc);
  R.recordFinalization(next, sc, 24);
  const report = R.build(next, sc);
  const concert = report.concerts.find((c) => c.turn === 24);
  assert.equal(concert.pending, false, "not pending after finalizing");
  assert.equal(concert.finalized, true, "marked finalized after the event");
});

test("a scripted run through the second concert reconciles recorded income, spend and corrections", () => {
  let s = fixture({ turn: 1, energy: 100, log: [] });
  const opening = s.gl.tokens.slice();
  while (s.turn <= 36) {
    const correctionBefore = s.gl.tokens.slice();
    if (s.turn === 10) { s.gl.tokens[0] += 50; R.balanceCorrection(s, correctionBefore, 0); }
    if (s.turn >= 5) {
      const song = sc.songs.find((x) => x.from <= s.turn && !s.gl.songs[x.id] && x.cost.every((n, i) => n <= s.gl.tokens[i]));
      if (song) buySong(s, song.id);
    }
    s.facilities.forEach((f, i) => { f.gain = 30; f.fail = 0; f.extras = { tok: 20, tokType: i }; });
    s = advance(s);
  }
  const report = R.build(s, sc), t = report.totals;
  assert.equal(report.coverage.detailedTurns, 36); assert.deepEqual(report.coverage.gaps, []);
  assert.deepEqual(t.unreconciled, zeros());
  const calculated = opening.map((n, i) => n + t.recordedTrainingIncome[i] + t.calendarIncome[i] + t.helloIncome[i] + t.balanceCorrections[i] - t.netPurchaseSpend[i]);
  assert.deepEqual(calculated, s.gl.tokens);
  assert.equal(report.concerts.filter((c) => c.recorded && c.afterCommand).length, 2);
  assert.ok(JSON.stringify(report).length < 2000000, "exports should contain compact records, not recursively nested history");
});
