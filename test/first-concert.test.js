const test = require("node:test");
const assert = require("node:assert/strict");
const E = require("../engine.js");
const R = require("../run-report.js");
const sc = require("../scenarios.js").SCENARIOS.find((s) => s.id === "grandlive");
const copy = (s) => JSON.parse(JSON.stringify(s));
function state(extra = {}) {
  return Object.assign({
    turn: 23, energy: 100, maxEnergy: 100, mood: 4, build: "sprint", risk: 17, resetMode: "off",
    goals: [], goalRace: false, extras: {}, caps: {}, targets: {}, log: [], calib: [], trackStats: true,
    stats: { speed: 359, stamina: 181, power: 372, guts: 226, wit: 274 },
    gl: { songs: {}, lessons: {}, tokens: [100, 100, 100, 100, 100], shop: {}, focus: "songs" },
    facilities: E.STATS.map((stat) => ({ stat, gain: 40, fail: 0, cards: 0, rainbows: 0, extras: { tok: 10, tokType: sc.tokenOf[stat][0] } }))
  }, extra);
}
function fourSongs(s) {
  s.gl.songs = { zensoku: 24, seishun: 24, ringring: 24, kiseki: 24 };
  s.gl.lessons = { 0: 14 };
  s.gl.shop = { "song:runrun": { turn: 24 } };
  s.turn = 24;
  return s;
}

test("four purchased songs plus Make Debut do not satisfy a five-purchase guide target", () => {
  const s = fourSongs(state({ resetMode: "ace" }));
  const report = R.build(s, sc, "");
  assert.equal(report.currentProgress.total, 5);
  assert.equal(report.currentProgress.paid, 4);
  assert.equal(report.currentProgress.periodPaid, 4);
  assert.equal(report.currentProgress.hype.need, 0);
  assert.equal(report.currentProgress.periodGuideTarget, 5);
  assert.match(report.checks.items.find((x) => x.key === "songs1").why, /not a requirement for Great Success/);
});

test("an explicit unaffordable carry reserves its actual colors without pretending it is learned", () => {
  const s = fourSongs(state()); s.gl.tokens = [8, 2, 3, 7, 2];
  assert.equal(E.holdSong(s, sc, "runrun"), true);
  const b = E.periodSongBudget(s, sc), plan = E.songPlan(s, sc);
  assert.deepEqual(b.need, [14, 0, 0, 16, 14]);
  assert.deepEqual(b.short, [6, 0, 0, 9, 12]);
  assert.equal(b.carryObserved, true); assert.equal(b.buyCarryFrom, 25);
  assert.equal(b.songs.length, 0); assert.equal(plan.bought, 4); assert.equal(plan.target, 5);
  assert.equal(plan.techLeft, 0); assert.equal(E.songsLearned(s), 5);
  assert.equal(E.lessonShop(s, sc).pick.kind, "hold");
});

test("a hold requires an observed available song and expires outside its concert period", () => {
  const s = state(), before = copy(s);
  assert.equal(E.holdSong(s, sc, "runrun"), false); assert.deepEqual(s, before);
  s.gl.shop = { "song:runrun": {} };
  assert.equal(E.holdSong(s, sc, "runrun"), true);
  s.turn = 25; assert.equal(E.heldSong(s, sc), null);
  s.turn = 65; assert.equal(E.holdSong(s, sc, "runrun"), false);
});

test("the observed held selection crosses a concert and gives the real next-period lesson credit", () => {
  const s = fourSongs(state()); E.holdSong(s, sc, "runrun");
  s.goalRace = true;
  const rec = E.recommend(s, sc); assert.equal(rec.action.kind, "race");
  assert.equal(rec.action.song, undefined); assert.equal(rec.action.tech, undefined);
  const next = E.advance(s, sc, rec.action);
  assert.equal(next.turn, 25); assert.equal(next.gl.holdSong, undefined);
  assert.deepEqual(next.gl.carry, { period: 1, songs: ["runrun"] });
  E.buySong(next, sc, "runrun");
  assert.equal(next.gl.carriedPeriods[1], true);
  assert.equal(E.songPlan(next, sc).techNow, 1);
});

test("automatic carrying never recommends a technique that would replace its selection", () => {
  const s = state({ turn: 24, energy: 20 });
  s.gl.songs = { zensoku: 20, seishun: 20, ringring: 20, kiseki: 20, gothisway: 20 };
  s.gl.shop = { "song:tachiichi": {}, "stat:speed": {}, "energy:40": { type: 2 } };
  const ls = E.lessonShop(s, sc);
  assert.equal(ls.pick.kind, "hold"); assert.equal(ls.pick.tech, undefined);
  const action = E.recommend(s, sc).action;
  assert.equal(action.tech, undefined); assert.equal(action.song, undefined);
  assert.match(action.notes.join(" "), /Do not buy another lesson/);
});

test("manual purchases override a hold and Undo restores its exact reservation", () => {
  const s = fourSongs(state()); E.holdSong(s, sc, "runrun");
  const hold = copy(s.gl.holdSong);
  E.buySong(s, sc, "runrun"); assert.equal(s.gl.holdSong, undefined);
  E.undoBuy(s); assert.deepEqual(s.gl.holdSong, hold); assert.equal(s.gl.songs.runrun, undefined);
  E.buyTechnique(s, sc, "stat:wit"); assert.equal(s.gl.holdSong, undefined);
  E.undoBuy(s); assert.deepEqual(s.gl.holdSong, hold);
});

test("technique spending protects later song colors rather than only the immediate song", () => {
  const s = state({ turn: 24 });
  s.gl.tokens = [28, 89, 65, 38, 65]; s.gl.songs = { zensoku: 24 }; s.gl.lessons = { 0: 1 };
  s.gl.shop = { "stat:speed": {}, "stat:stamina": {}, "hint:1": { type: 1 } };
  const ls = E.lessonShop(s, sc);
  assert.ok(ls.reserve[0] >= 35, "later Dance songs remain reserved even though the next Power song costs no Dance");
  assert.equal(ls.pick.kind, "tech"); assert.equal(ls.pick.item.id, "stat:stamina");
  assert.equal(ls.items.find((x) => x.id === "stat:speed").keeps, false);
});

test("Songs first favors needed colors over a larger irrelevant token pile", () => {
  const s = state(); s.gl.tokens = [14, 100, 100, 0, 14]; s.gl.shop = { "song:runrun": {} };
  E.holdSong(s, sc, "runrun");
  s.facilities[0].extras = { tok: 50, tokType: 0 };
  s.facilities[3].extras = { tok: 20, tokType: 3 };
  const action = E.recommend(s, sc).action;
  assert.equal(action.stat, "guts"); assert.equal(action.performancePriority.towardSongs, 16);
  s.facilities[3].fail = 40; assert.notEqual(E.recommend(s, sc).action.stat, "guts");
  s.facilities[3].fail = 0; s.gl.tokens[3] = 16;
  assert.equal(E.recommend(s, sc).action.stat, "speed", "when every song gap is funded, usable total breaks the tie");
});

test("a training that certainly funds the offered song beats Hello's random chance to finish it", () => {
  const s = state({ deck: { slots: [{ id: 30052, lb: 4, bond: 100, met: true, dates: { unlocked: false, done: 0 } }] } });
  s.facilities.forEach((f) => { f.members = []; }); s.facilities[4].members = [0];
  s.gl.tokens = [14, 100, 100, 0, 14]; s.gl.shop = { "song:runrun": {} }; E.holdSong(s, sc, "runrun");
  s.facilities[3].extras = { tok: 16, tokType: 3 };
  const rec = E.recommend(s, sc), wit = rec.ranked.find((o) => o.stat === "wit");
  assert.equal(wit.performancePriority.hello, 8); assert.equal(wit.performancePriority.training, 10);
  assert.equal(rec.action.stat, "guts");
  const next = E.advance(s, sc, rec.action);
  assert.deepEqual(next.gl.tokens, [14, 100, 100, 16, 14]);
});

test("an unobserved color projection does not displace a much stronger total-points training", () => {
  const s = state(); s.gl.tokens = [0, 100, 100, 0, 100];
  s.facilities.forEach((f) => { f.gain = 8; });
  s.facilities[4].gain = 120; s.facilities[4].extras = { tok: 30, tokType: 4 };
  assert.equal(E.periodSongBudget(s, sc).observedSelection, false);
  const action = E.recommend(s, sc).action;
  assert.equal(action.stat, "wit");
  assert.equal(action.performancePriority.towardSongs, 0);
  assert.equal(action.performancePriority.usable, 30);
});

test("first-period carry text starts after the concert and projections remain labeled unobserved", () => {
  const s = state(); s.gl.songs = { zensoku: 20, seishun: 20, runrun: 20, kiseki: 20, tachiichi: 20 };
  assert.match(E.songPlan(s, sc).text, /from turn 25/);
  assert.equal(E.periodSongBudget(s, sc).carryObserved, false);
  assert.ok(E.periodSongBudget(s, sc).carry);
  assert.equal(E.periodSongBudget(s, sc).carry.id, "gothisway", "a useful Power song ranks above the avoided Guts/Stamina songs");
});

test("alternative songs in the same current selection do not prove a future carry", () => {
  const s = fourSongs(state()); s.gl.shop["song:gothisway"] = {};
  const b = E.periodSongBudget(s, sc);
  assert.equal(b.wanted, 1); assert.equal(b.songs.length, 1);
  assert.equal(b.carryObserved, false, "the current purchase refreshes all three offers");
  assert.equal(E.tokenPlan(s, sc).half.carryTokens, b.carry.cost.reduce((a, n) => a + n, 0));
});

test("unlocking a carry can use the least conflicting lesson when no reserve-safe offer exists", () => {
  const s = state(); s.gl.songs = { zensoku: 20, seishun: 20, ringring: 20, kiseki: 20, gothisway: 20 };
  s.gl.lessons = { 0: 14 }; s.gl.tokens = [14, 0, 0, 16, 14];
  s.gl.shop = { "stat:speed": {}, "stat:guts": {} };
  const ls = E.lessonShop(s, sc);
  assert.equal(ls.phase, "hold"); assert.equal(ls.songsOffered, 0);
  assert.equal(ls.pick.kind, "tech");
  assert.equal(ls.pick.item.conflict, Math.min(...ls.techs.filter((t) => t.offered && t.afford).map((t) => t.conflict)));
});

test("new diagnostics distinguish entered observations, an unlogged Hello checkbox and explicit carry", () => {
  const s = state(); s.extras.lh20 = true; s.gl.shop = { "song:runrun": {} }; E.holdSong(s, sc, "runrun");
  const rec = E.recommend(s, sc), next = E.advance(s, sc, rec.action);
  R.recordTurn(s, next, sc, rec, rec.action);
  const report = R.build(next, sc, "", E.recommend(next, sc));
  assert.equal(report.observations.trainingSources, 1);
  assert.equal(report.observations.enteredAmounts, 1); assert.equal(report.observations.enteredTypes, 1);
  assert.equal(report.observations.helloCheckWithoutEvent, true);
  assert.equal(report.currentProgress.held, "runrun");
  assert.ok(report.turns[0].chosen.performancePriority);
  assert.match(R.format(report, sc), /no actual Hello token event was logged/);
});
