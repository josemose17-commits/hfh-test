const test = require("node:test");
const assert = require("node:assert/strict");
const E = require("../engine.js");
const R = require("../run-report.js");
const sc = require("../scenarios.js").SCENARIOS.find(s => s.id === "grandlive");
const copy = x => JSON.parse(JSON.stringify(x));
const rest = { kind: "rest", label: "Rest", energyDelta: 0, prefix: [], notes: [] };
function state() {
  return {
    scenario: sc.id, turn: 38, energy: 37, maxEnergy: 100, mood: 4, risk: 17, build: "sprint", resetMode: "off",
    goals: [], goalsOff: [], goalRace: false, extras: {}, caps: {}, facLevels: {}, log: [],
    stats: { speed: 434, stamina: 326, power: 453, guts: 285, wit: 355 }, trackStats: true,
    targets: { speed: 1500, stamina: 300, power: 1200, guts: 600, wit: 1100 }, calib: Array(12).fill(0.57), fcal: [0.79, 0.78],
    gl: { focus: "songs", tokenTypes: "usual", tokens: [3, 36, 30, 8, 41], lessons: { 0: 14 }, shop: {}, songs: { zensoku: 24, seishun: 24, ringring: 24, kiseki: 24, tachiichi: 27, gothisway: 34, runrun: 37 } },
    deck: { trainee: 106101, slots: [30101, 30052, 20033, 30078, 30111, 30054].map((id, i) => ({ id, lb: i === 4 ? 2 : 4, bond: [100,100,65,65,87,72][i], met: true, dates: { unlocked: i === 1, done: 0 } })) },
    facilities: E.STATS.map(stat => ({ stat, gain: null, fail: stat === "speed" ? 28 : null, cards: 0, rainbows: 0, members: stat === "speed" ? [1,0,5,2] : [], hints: [], extra: stat === "wit" ? 2 : 0, extras: {} }))
  };
}

test("strength calibration sees a strong training after the first facility", () => {
  const s = state(); s.facilities.forEach(f => { f.members = []; f.extra = 0; });
  s.facilities[4].members = [3,4,5]; s.calib = [];
  const options = E.evaluate(s, sc).options.filter(o => o.kind === "train");
  const speed = options.find(o => o.stat === "speed"), wit = options.find(o => o.stat === "wit");
  assert.ok(wit.gain > speed.gain);
  const next = E.advance(s, sc, rest);
  assert.equal(next.calib[0], Math.max(...options.map(o => o.gain)) / (48 * sc.gainScale));
});

test("reordering the same five facilities cannot change learned deck strength", () => {
  const s = state(); s.facilities[0].members = []; s.facilities[4].members = [3,4,5];
  const other = copy(s); other.facilities.reverse();
  assert.equal(E.advance(s, sc, rest).calib.at(-1), E.advance(other, sc, rest).calib.at(-1));
});

test("entered gains retain their observation priority over unentered estimates", () => {
  const s = state(); s.facilities[4].gain = 24;
  assert.ok(E.evaluate(s, sc).options.find(o => o.stat === "speed").gain > 24);
  assert.equal(E.advance(s, sc, rest).calib.at(-1), 24 / (48 * sc.gainScale));
});

test("rebuilding strength preserves the run and uses pre-command history for facility levels", () => {
  let s = state(); s.turn = 15; s.gl.songs = {}; s.calib = []; s.deck.trainee = null;
  s.facilities.forEach(f => { f.fail = 0; f.members = []; f.extra = 0; });
  for (let i = 0; i < 7; i++) {
    s.energy = 100; s.facilities.forEach(f => { f.members = []; f.fail = 0; });
    s.facilities[2].members = [2];
    const rec = E.recommend(s, sc), power = rec.ranked.find(o => o.stat === "power");
    const next = E.advance(s, sc, power);
    R.recordTurn(s, next, sc, rec, power); s = next;
  }
  const before = structuredClone(s), rebuilt = E.relearnStrength(s, sc);
  assert.deepEqual(rebuilt, s.calib);
  assert.deepEqual(s, before, "rebuilding is read-only, including historical snapshots");
  s.log.forEach(l => { delete l.diagnostics; });
  assert.deepEqual(E.relearnStrength(s, sc), rebuilt, "legacy snapshots recover levels from preceding commands");
});

test("unreadable snapshots and another scenario do not create bogus strength samples", () => {
  const s = state(); s.log = [{ snapshot: "broken" }, { snapshot: "{}" }, { snapshot: JSON.stringify(Object.assign(copy(s), { scenario: "ura" })) }];
  assert.deepEqual(E.relearnStrength(s, sc), []);
});

test("turn 38 compares Wit at 42 energy with camp Rest at 77 without allowing 28% Speed", () => {
  const s = state(), rec = E.recommend(s, sc), c = rec.recoveryComparison;
  assert.equal(rec.action.stat, "wit"); assert.equal(rec.action.fail, 0); assert.equal(rec.action.failEst, true);
  assert.deepEqual([c.wit.energyAfter, c.rest.energyAfter, c.campTurnsAfter], [42,77,2]);
  assert.equal(c.checkEnergyLesson, true);
  assert.equal(rec.ranked.find(o => o.stat === "speed").fail, 28);
  assert.ok(rec.reasons.some(n => /repeating Wit automatically/.test(n)));
  const next = E.advance(s, sc, rec.action); R.recordTurn(s, next, sc, rec, rec.action);
  assert.deepEqual(next.log[0].diagnostics.recoveryComparison, c);
  assert.deepEqual(R.build(s, sc, "", rec).recoveryComparison, c);
});

test("camp recovery comparison counts the remaining camp and respects energy caps and entered failure", () => {
  const s = state(); s.turn = 40; s.maxEnergy = 60; s.facilities[4].fail = 3;
  const c = E.recommend(s, sc).recoveryComparison;
  assert.equal(c.campTurnsAfter, 0); assert.equal(c.rest.energyAfter, 60);
  assert.equal(c.wit.fail, 3); assert.equal(c.wit.failEstimated, false);
  s.turn = 41; assert.equal(E.recommend(s, sc).recoveryComparison, null);
  s.turn = 38; s.energy = 80; assert.equal(E.recommend(s, sc).recoveryComparison, null);
});

test("an explicit held song prevents an energy-lesson prompt that would refresh the selection", () => {
  const s = state(); s.gl.shop = { "song:yumewo": {} }; E.holdSong(s, sc, "yumewo");
  assert.equal(E.recommend(s, sc).recoveryComparison.checkEnergyLesson, false);
});

test("a stronger future-training estimate can make Rest lead without a forced-rest preference", () => {
  const s = state(); s.calib = Array(12).fill(1.1);
  const rec = E.recommend(s, sc);
  assert.equal(rec.action.kind, "rest");
  assert.ok(rec.recoveryComparison.rest.value > rec.recoveryComparison.wit.value);
  assert.equal(rec.action.parts.opening, undefined);
});
