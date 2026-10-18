const test = require("node:test");
const assert = require("node:assert/strict");
const E = require("../engine.js");
const R = require("../run-report.js");
const O = require("../optimizer.js");
const GC = require("../grand-concert.js");
const sc = require("../scenarios.js").SCENARIOS.find(s => s.id === "grandlive");
const copy = x => JSON.parse(JSON.stringify(x));
const sum = xs => xs.reduce((a, n) => a + n, 0);
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
const rest = { kind: "rest", label: "Rest", energyDelta: 0, prefix: [], notes: [] };
function state(extra = {}) {
  return Object.assign({
    scenario: sc.id, turn: 33, energy: 100, maxEnergy: 100, mood: 4, build: "sprint", risk: 17,
    resetMode: "off", goals: [], goalRace: false, extras: {}, stats: { speed: 400, stamina: 200, power: 400, guts: 250, wit: 350 },
    trackStats: true, caps: {}, targets: {}, calib: [], log: [], facLevels: {},
    gl: { tokens: [13, 21, 13, 35, 61], songs: {}, lessons: {}, shop: { "song:runrun": {}, "song:gothisway": {} }, focus: "songs", tokenTypes: "usual" },
    facilities: E.STATS.map(stat => ({ stat, gain: 40, fail: 0, cards: 0, rainbows: 0, members: [], extras: { tok: 11, tokType: sc.tokenOf[stat][0] } }))
  }, extra);
}
function hello(s) {
  s.deck = { slots: [{ id: 30052, lb: 4, bond: 90, met: true, dates: { unlocked: false, done: 0 } }] };
  s.facilities[4].members = [0];
  return s;
}
function advance(s, choice = rest, result) {
  const rec = E.recommend(s, sc), next = E.advance(s, sc, choice, result);
  R.recordTurn(s, next, sc, rec, choice, { result });
  if (next.gl && next.gl.pendingConcert) {
    const pt = next.gl.pendingConcert.turn;
    E.finalizeConcert(next, sc);
    R.event(next, "finalizeConcert", { turn: pt });
  }
  return next;
}

test("Make Debut and the four Promo Lives award base +10 all at the correct cap", () => {
  assert.deepEqual(E.calendarPerformance(4, sc), { amount: 10, cap: 200, source: "Make Debut!" });
  for (const [i, turn] of [24, 36, 48, 60].entries()) {
    assert.deepEqual(E.calendarPerformance(turn, sc), { amount: 10, cap: 250 + 50 * i, source: "New concert collaborators" });
    const s = state({ turn }); s.gl.shop = {}; s.gl.tokens = [1, 2, 3, 4, 5];
    assert.deepEqual(advance(s).gl.tokens, [11, 12, 13, 14, 15], "normal Hype still receives collaborators");
    s.gl.songs = { zensoku: turn, seishun: turn, runrun: turn };
    assert.deepEqual(advance(s).gl.tokens, [11, 12, 13, 14, 15], "Great Success does not duplicate the base reward");
  }
  assert.equal(E.calendarPerformance(72, sc), null);
  assert.equal(E.calendarPerformance(25, sc), null);
  assert.equal(E.calendarPerformance(24, { id: "ura" }), null);
});

test("concert training uses the old cap, collaborators use the raised cap, and Undo is exact", () => {
  const s = state({ turn: 24 }); s.gl.shop = {}; s.gl.tokens = [199, 199, 199, 199, 199];
  const choice = E.recommend(s, sc).ranked.find(o => o.stat === "speed");
  const next = advance(s, choice), report = R.build(next, sc);
  assert.deepEqual(next.gl.tokens, [210, 209, 209, 209, 209]);
  assert.deepEqual(report.totals.recordedTrainingIncome, [1, 0, 0, 0, 0]);
  assert.deepEqual(report.totals.trainingLostAtCap, [10, 0, 0, 0, 0]);
  assert.deepEqual(report.totals.calendarIncome, [10, 10, 10, 10, 10]);
  assert.deepEqual(report.totals.unreconciled, [0, 0, 0, 0, 0]);
  assert.deepEqual(E.undo(next).gl.tokens, s.gl.tokens);
  assert.deepEqual(advance(E.undo(next), choice).gl.tokens, next.gl.tokens, "redo credits once");
});

test("a failed concert training receives calendar income without fabricated training income", () => {
  const s = state({ turn: 36 }); s.gl.shop = {}; s.gl.tokens = [0, 0, 0, 0, 0];
  const choice = E.recommend(s, sc).ranked.find(o => o.stat === "power");
  const next = advance(s, choice, "fail"), r = R.build(next, sc);
  assert.deepEqual(next.gl.tokens, [10, 10, 10, 10, 10]);
  assert.equal(sum(r.totals.recordedTrainingIncome), 0);
  assert.equal(sum(r.totals.calendarIncome), 50);
});

test("future collaborator income cannot pay for a purchase before the command", () => {
  const s = state({ turn: 24 }); s.gl.tokens = [4, 0, 0, 6, 4];
  const rejected = advance(s, Object.assign({}, rest, { song: { id: "runrun" } }));
  assert.equal(rejected, s, "an invalid prefixed purchase rejects the command");
  const next = advance(s);
  assert.equal(next.gl.songs.runrun, undefined);
  assert.deepEqual(next.gl.tokens, [14, 10, 10, 16, 14]);
  E.buySong(next, sc, "runrun"); assert.equal(next.gl.songs.runrun, 25);
});

test("the career economy credits the same collaborator currency and preserves existing offers", () => {
  const economy = GC.create(O.buildCtx({ scenario: sc, build: "medium", runs: 1 }), () => 0.2);
  const offer = { kind: "song", offers: [] }; economy.state.shop = offer;
  for (const turn of [24, 36, 48, 60]) economy.end(turn, () => {});
  assert.deepEqual(economy.state.tokens, [40, 40, 40, 40, 40]);
  assert.deepEqual(economy.state.earned, [40, 40, 40, 40, 40]);
  assert.equal(economy.state.shop, offer);
  economy.end(72, () => {}); assert.deepEqual(economy.state.tokens, [40, 40, 40, 40, 40]);
});

test("manual +10/+5 rewards retain caps and their own observed-income accounting", () => {
  const s = state(); s.gl.tokens = [249, 240, 20, 0, 250];
  const reward = E.recordTokenReward(s, sc, 10);
  assert.deepEqual(reward.credited, [1, 10, 10, 10, 0]);
  assert.deepEqual(reward.lostAtCap, [9, 0, 0, 0, 10]);
  R.event(s, "observedTokenReward", reward);
  R.event(s, "observedTokenReward", E.recordTokenReward(s, sc, 5));
  const r = R.build(s, sc);
  assert.deepEqual(r.totals.observedRewardIncome, [1, 10, 15, 15, 0]);
  assert.equal(sum(r.totals.calendarIncome), 0);
  assert.equal(sum(r.totals.balanceCorrections), 0);
  assert.match(R.format(r, sc), /Observed all-token rewards/);
  const before = copy(s); assert.equal(E.recordTokenReward(s, sc, 20), null); assert.deepEqual(s, before);
});

test("usual unedited types agree in the forecast and Done but remain assumed observations", () => {
  const s = state(); s.gl.shop = {}; s.facilities[0].extras = { tok: 13 };
  const expected = E.tokenGain(s.facilities[0], s, sc, true);
  assert.deepEqual(expected, E.tokenGain(s.facilities[0], s, sc, false));
  assert.equal(expected[0].type, 0);
  const choice = E.recommend(s, sc).ranked.find(o => o.stat === "speed"), next = advance(s, choice);
  const r = R.build(next, sc);
  assert.equal(r.turns[0].performance.training.sources[0].typeAssumed, true);
  assert.equal(r.observations.enteredTypes, 0);
  assert.equal(next.gl.tokens[0], 26);
  s.facilities[0].extras.tokType = 2;
  assert.equal(E.tokenGain(s.facilities[0], s, sc, true)[0].type, 2);
});

test("unset probabilistic types produce discrete 60/30/10 paths rather than five fractional awards", () => {
  const s = state(); delete s.gl.tokenTypes; s.facilities[0].extras = { tok: 10 };
  const paths = E.performanceOutcomes(s.facilities[0], s, sc);
  near(sum(paths.map(p => p.probability)), 1);
  assert.equal(paths.length, 5);
  paths.forEach(p => { assert.equal(sum(p.credited), 10); assert.equal(p.credited.filter(n => n > 0).length, 1); });
  near(paths.find(p => p.credited[0] === 10).probability, 0.6);
  near(paths.find(p => p.credited[3] === 10).probability, 0.3);
});

test("each random rainbow path excludes its actual main type when choosing the second", () => {
  const s = state(); delete s.gl.tokenTypes; s.gl.tokens = [0, 0, 0, 0, 0];
  s.facilities[0].extras = { tok: 10 }; s.facilities[0].rainbows = 1;
  for (const p of E.performanceOutcomes(s.facilities[0], s, sc)) {
    assert.equal(sum(p.credited), 20);
    assert.equal(p.credited.filter(n => n === 10).length, 2);
  }
});

test("Hello outcomes separate no event, tied lowest types and cap waste", () => {
  const s = hello(state()); s.gl.tokens = [240, 249, 249, 240, 249];
  const paths = E.performanceOutcomes(s.facilities[4], s, sc);
  near(sum(paths.map(p => p.probability)), 1);
  assert.equal(paths.length, 3);
  near(paths.find(p => p.hello === 0).probability, 0.6);
  paths.filter(p => p.hello > 0).forEach(p => { near(p.probability, 0.2); assert.equal(p.hello, 10); });
  assert.equal(paths[0].credited[4], 1);
  assert.deepEqual(s.gl.tokens, [240, 249, 249, 240, 249], "forecast is read-only");
  s.deck.slots[0].met = false;
  assert.equal(E.performanceOutcomes(s.facilities[4], s, sc).length, 1);
});

test("turn-33-shaped offers favor certain Run n' Run funding over a riskier Go This Way alternative", () => {
  const s = state(); s.facilities[2].gain = 120; s.facilities[2].fail = 13;
  const rec = E.recommend(s, sc), power = rec.ranked.find(o => o.stat === "power");
  assert.equal(rec.action.stat, "speed"); assert.equal(rec.action, rec.ranked[0]);
  assert.equal(rec.action.performancePriority.completionProbability, 1);
  assert.equal(rec.action.performancePriority.offeredGap, 1);
  assert.ok(power.value > rec.action.value, "ordinary point scores stay honest when preference changes order");
  assert.equal(rec.action.parts.songFocus, undefined);
  assert.match(rec.versus.policy, /100% chance/); assert.equal(rec.confidence, "under entered assumptions");
  assert.match(rec.action.selectionPolicy.assumptions, /Usual|usual/);
});

test("an actual Hello proc can finish an offered song but its expected +8 is never a saved award", () => {
  const s = hello(state()); s.gl.shop = { "song:runrun": {} }; s.gl.tokens = [14, 30, 30, 0, 14];
  s.facilities[3].extras = { tok: 12, tokType: 3 };
  const rec = E.recommend(s, sc);
  assert.equal(rec.action.stat, "wit"); near(rec.action.performancePriority.completionProbability, 0.4);
  near(rec.action.performancePriority.hello, 8);
  const next = advance(s, rec.action);
  assert.deepEqual(next.gl.tokens, [14, 30, 30, 0, 25]);
  assert.equal(sum(R.build(next, sc).totals.helloIncome), 0);
});

test("funding chance includes failure probability, within the configured failure limit", () => {
  const s = state(); s.gl.shop = { "song:runrun": {} };
  s.facilities[0].fail = 10; s.facilities[2].extras = { tok: 11, tokType: 0 };
  const rec = E.recommend(s, sc);
  assert.equal(rec.action.stat, "power");
  near(rec.ranked.find(o => o.stat === "speed").performancePriority.completionProbability, 0.9);
  s.facilities[2].fail = 18; assert.equal(E.recommend(s, sc).action.stat, "speed");
});

test("unknown future colors cannot outrank more usable tokens through a fabricated reserve", () => {
  const s = state(); s.gl.shop = {}; s.gl.tokens = [0, 100, 0, 100, 100];
  s.facilities[4].extras = { tok: 30, tokType: 4 };
  const rec = E.recommend(s, sc);
  assert.equal(rec.action.stat, "wit"); assert.equal(rec.action.performancePriority.usable, 30);
  assert.equal(rec.action.selectionPolicy.objective, "usable Performance");
});

test("when no training can finish a song, a tiny partial gap edge cannot discard a large rainbow haul", () => {
  const s = hello(state({ turn: 25 })); s.gl.tokens = [8, 2, 3, 7, 2];
  s.gl.shop = { "song:runrun": {}, "song:tachiichi": {}, "song:gothisway": {} };
  s.facilities[4].members = []; s.facilities[3].members = [0];
  s.facilities[0].rainbows = 1; s.facilities[0].extras = { tok: 16, tokType: 0 };
  s.facilities[3].extras = { tok: 13, tokType: 3 };
  const rec = E.recommend(s, sc), guts = rec.ranked.find(o => o.stat === "guts");
  assert.equal(rec.action.stat, "speed"); assert.equal(rec.action.performancePriority.usable, 32);
  assert.ok(guts.performancePriority.offeredGapReduction > rec.action.performancePriority.offeredGapReduction);
  assert.match(rec.action.selectionPolicy.why, /no eligible training can finish/);
});

test("the guaranteed concert reward already funding an offer removes its color preference", () => {
  const s = state({ turn: 36 }); s.gl.shop = { "song:runrun": {} };
  s.facilities[4].extras = { tok: 30, tokType: 4 };
  const rec = E.recommend(s, sc);
  assert.equal(rec.action.stat, "wit"); assert.equal(rec.action.performancePriority.calendarReward, 10);
  assert.equal(rec.action.performancePriority.offeredGap, 0);
});

test("Songs first does not rank an over-limit training above safe recovery", () => {
  const s = state({ energy: 28 });
  s.facilities.forEach(f => { f.fail = 18; f.gain = 250; });
  const rec = E.recommend(s, sc); assert.notEqual(rec.action.kind, "train");
  assert.match(rec.reasons.join(" "), /failure limit/);
});

test("forced goal races and Hello's first meeting retain their priority", () => {
  const s = hello(state({ goalRace: true })); assert.equal(E.recommend(s, sc).action.kind, "race");
  s.goalRace = false; s.turn = 6; s.deck.slots[0].met = false;
  s.deck.slots[0].dates.unlocked = false; s.facilities[4].members = []; s.facilities[3].members = [0];
  const action = E.recommend(s, sc).action;
  assert.equal(action.stat, "guts"); assert.equal(action.firstEvent.idx, 0);
});

test("already-owned recording clears the stale selection without inventing income, cost or stats", () => {
  const s = state(); s.gl.tokens = [0, 0, 0, 0, 0]; E.holdSong(s, sc, "runrun");
  const before = copy(s);
  assert.equal(E.recordLearnedSong(s, sc, "runrun", 33), true);
  assert.deepEqual(s.gl.tokens, before.gl.tokens); assert.deepEqual(s.stats, before.stats);
  assert.deepEqual(s.gl.shop, {}); assert.equal(s.gl.holdSong, undefined);
  assert.equal(s.gl.songs.runrun, 33); assert.equal(E.songPlan(s, sc).bought, 1);
  assert.equal(E.recordLearnedSong(s, sc, "runrun", 33), false);
});

test("historical backfill removes its obsolete offer and validates the real learned date", () => {
  const s = state(), before = copy(s);
  assert.equal(E.recordLearnedSong(s, sc, "runrun", 34), false); assert.deepEqual(s, before);
  assert.equal(E.recordLearnedSong(s, sc, "runrun", 20), true);
  assert.equal(s.gl.shop["song:runrun"], undefined); assert.ok(s.gl.shop["song:gothisway"]);
  assert.equal(E.songPlan(s, sc).bought, 0, "a historical song does not count in the current period");
});

test("an observed carry receives its cadence credit when its real purchase is recorded owned", () => {
  const s = state({ turn: 25 }); s.gl.carry = { period: 1, songs: ["runrun"] };
  assert.equal(E.recordLearnedSong(s, sc, "runrun", 25), true);
  assert.equal(s.gl.carriedPeriods[1], true); assert.equal(s.gl.carry, undefined);
  assert.equal(E.songPlan(s, sc).techNow, 1);
});

test("recording Hello after a concert preserves the event's pre-calendar cap headroom", () => {
  const s = hello(state({ turn: 36 })); s.gl.shop = {}; s.gl.tokens = [250, 240, 250, 250, 250];
  const choice = E.recommend(s, sc).ranked.find(o => o.stat === "wit");
  const next = advance(s, choice); assert.equal(next.gl.tokens[1], 250);
  const reward = E.recordHelloEvent(next, sc, { amount: 20, type: 1, turn: 36 });
  assert.equal(reward.credited, 10); assert.equal(reward.beforeCalendar, true);
  assert.equal(next.gl.tokens[1], 260, "event capped at old 250, then later +10 collaborators");
  R.event(next, "helloEvent", reward, 36);
  assert.equal(R.build(next, sc).totals.helloIncome[1], 10);
});
