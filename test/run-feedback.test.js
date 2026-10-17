const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../deck.js");
const C = require("../conditions.js");
const E = require("../engine.js");
const T = require("../tiers.js");
const O = require("../optimizer.js");
const sc = require("../scenarios.js").SCENARIOS.find((s) => s.id === "grandlive");
function state(overrides = {}) {
  return Object.assign({
    turn: 30, energy: 100, maxEnergy: 100, mood: 2, build: "medium", risk: 12, goals: [], goalRace: false,
    stats: { speed: 300, stamina: 200, power: 250, guts: 150, wit: 200 }, trackStats: true,
    extras: {}, caps: {}, calib: [], log: [], conditions: {},
    gl: { songs: {}, tokens: [0, 0, 0, 0, 0], lessons: {}, focus: "songs" },
    facilities: E.STATS.map((stat) => ({ stat, gain: stat === "speed" ? 100 : stat === "power" ? 65 : 8, cards: stat === "power" ? 4 : 0, rainbows: stat === "power" ? 1 : 0, fail: 0, extras: {} }))
  }, overrides);
}
const training = (s, stat = "speed") => E.evaluate(s, sc).options.find((o) => o.kind === "train" && o.stat === stat);

test("a rare high-level training hint does not discount the common low-level event outcome", () => {
  const offers = D.skillOffers();
  offers.add(123, 0.8, 1, 1, "event"); offers.add(123, 0.1, 5, 1, "training");
  const s = offers.values()[0];
  assert.ok(Math.abs(s.p - 0.82) < 1e-12);
  assert.ok(Math.abs(s.expectedDiscount - 0.112) < 1e-12);
  assert.ok(s.conditionalDiscount < 0.14, "the old model incorrectly applied a 40% discount to all outcomes");
  assert.deepEqual(s.src, [1]); assert.equal(s.eventP, 0.8);
  assert.ok(Math.abs(s.trainingP - 0.1) < 1e-12);
});

test("hint aggregation handles overlapping offers, certain hints and absent opportunities", () => {
  const offers = D.skillOffers(); offers.add(1, 0, 5, 1); offers.add(2, 1, 3, 2);
  offers.add(2, 0.5, 5, 3, "training");
  assert.equal(offers.values().length, 1);
  const s = offers.values()[0]; assert.equal(s.p, 1);
  assert.ok(Math.abs(s.expectedDiscount - 0.35) < 1e-12);
});

test("the tier builder exposes separate event and training probabilities for real support skills", () => {
  const card = D.card(10004), id = 200532;
  const result = T.skillValue([{ id: card.id, lb: 4 }], { skills: { [id]: 2 }, costs: {}, known: new Set(), speedWeight: 1, spWeight: 0.35, races: 0, must: [] });
  const skill = result.list.find((x) => +x.id === id);
  assert.ok(skill && skill.eventP > 0 && skill.trainingP > 0);
  assert.ok(skill.p >= skill.eventP && skill.p >= skill.trainingP);
});

test("the career estimator uses the same separated skill-offer probabilities", () => {
  const ctx = O.buildCtx({ scenario: sc, build: "medium", runs: 2, skills: { 200532: 2 } });
  const result = O.simulate(ctx, [10004, 30002, 30016, 30010, 30043, 30052].map((id) => ({ card: D.card(id), lb: 4 })));
  const skill = result.skills.find((x) => +x.id === 200532);
  assert.ok(skill.eventP >= 0.5 && skill.trainingP >= 0);
  assert.ok(skill.conditionalDiscount >= 0.1 && skill.conditionalDiscount <= 0.4);
});

test("Practice Perfect replaces Practice Poor and typed failure stays authoritative", () => {
  const s = state({ energy: 30 }); s.facilities.forEach((f) => { f.fail = null; });
  C.set(s, "poor", true); const poor = training(s).fail;
  C.set(s, "perfect", true); const perfect = training(s).fail;
  assert.equal(C.has(s, "poor"), false); assert.equal(poor - perfect, 4);
  s.facilities[0].fail = 13; assert.equal(training(s).fail, 13);
  C.set(s, "poor", true); assert.equal(C.has(s, "perfect"), false);
});

test("character failure conditions are counted without making them Infirmary-curable", () => {
  const s = state({ energy: 30 }); s.facilities.forEach((f) => { f.fail = null; });
  const plain = training(s).fail; C.set(s, "underWeather", true);
  assert.equal(training(s).fail, plain + 5); assert.equal(C.curable(s), false);
  C.set(s, "shining", true); assert.equal(C.has(s, "underWeather"), false);
  assert.equal(training(s).fail, plain - 5);
});

test("Charming adds training bond and a selected hint is still counted once", () => {
  const s = state({ deck: { slots: [{ id: 30002, lb: 4, bond: 40 }] }, conditions: { charming: true } });
  s.facilities[0].members = [0]; s.facilities[0].hints = [0];
  assert.equal(E.focusCards(E.deckInfo(s), s)[0].trainings, 5);
  const next = E.advance(s, sc, training(s));
  assert.equal(next.deck.slots[0].bond, 40 + 7 + 2 + 5);
});

test("Hot Topic changes both the displayed Akikawa bond forecast and the recorded gain", () => {
  const s = state({ turn: 50, conditions: { hotTopic: true }, extras: { akiBond: 30 } });
  s.facilities[0].extras.aki = true;
  const option = training(s);
  assert.ok(option.notes.some((n) => n.includes("30 → 39")));
  assert.equal(E.advance(s, sc, option).extras.akiBond, 39);
});

test("Slow Metabolism suppresses training Speed while typed totals rescale the remaining stats", () => {
  const s = state({ conditions: { slowMetabolism: true } });
  s.facilities[0].gain = 40;
  const option = training(s); assert.equal(option.statGains.speed, 0); assert.equal(option.statGains.power, 40);
  assert.equal(E.advance(s, sc, option).stats.speed, 300);
});

test("Migraine prevents mood gains until a successful cure, while failed treatment preserves conditions", () => {
  const s = state({ conditions: { migraine: true, nightOwl: true, perfect: true } });
  const options = E.evaluate(s, sc).options;
  const recreation = options.find((o) => o.kind === "recreation" && o.outing == null);
  assert.equal(recreation.parts.mood, 0); assert.equal(E.advance(s, sc, recreation).mood, 2);
  const infirmary = options.find((o) => o.kind === "infirmary");
  assert.equal(C.has(E.advance(s, sc, infirmary, undefined, { cured: false }), "migraine"), true);
  const cured = E.advance(s, sc, infirmary);
  assert.equal(C.has(cured, "migraine"), false); assert.equal(C.has(cured, "perfect"), true);
  const outingState = state({ energy: 20, conditions: { migraine: true }, deck: { slots: [{ id: 30052, lb: 4, bond: 90, met: true, dates: { unlocked: true, done: 4 } }] } });
  outingState.facilities.forEach((f) => { f.gain = 8; });
  const outing = E.recommend(outingState, sc);
  assert.equal(outing.action.outing, 0);
  assert.equal(outing.after.mood, 2, "a non-curing outing must not forecast mood recovery");
  assert.equal(E.advance(outingState, sc, outing.action, undefined, { outing: "great" }).mood, 2);
});

test("camp rest clears ordinary bad conditions while preserving career-specific ones", () => {
  const s = state({ turn: 38, conditions: { migraine: true, skin: true, underWeather: true } });
  const rest = E.evaluate(s, sc).options.find((o) => o.kind === "rest");
  assert.ok(rest.parts.mood > 0, "camp recovery can raise mood because it clears Migraine");
  const next = E.advance(s, sc, rest);
  assert.equal(C.has(next, "skin"), false); assert.equal(C.has(next, "underWeather"), true);
  assert.equal(next.mood, 3);
});

test("Slacker's observed skipped training consumes a turn without inventing a failure event", () => {
  const s = state({ energy: 60, conditions: { slacker: true } });
  const next = E.advance(s, sc, training(s), "slacker");
  assert.equal(next.energy, 60); assert.equal(next.mood, 2); assert.deepEqual(next.stats, s.stats);
  assert.deepEqual(next.gl.tokens, s.gl.tokens); assert.equal(next.log[0].failed, "slacker");
  assert.deepEqual(E.undo(next).conditions, s.conditions);
});

test("Songs first favors more usable Performance among safe worthwhile trainings", () => {
  const s = state(); s.gl.focus = "balanced";
  const balanced = E.recommend(s, sc).action;
  s.gl.focus = "songs"; const songs = E.recommend(s, sc).action;
  assert.equal(balanced.stat, "speed"); assert.equal(songs.stat, "power");
  assert.ok(songs.notes.some((n) => n.startsWith("Songs first:")));
  s.facilities[2].fail = 40;
  assert.notEqual(E.recommend(s, sc).action.stat, "power", "a high-failure token pile does not win this preference");
});

test("Songs first cannot manufacture value from capped Performance or override goal races", () => {
  const s = state(); s.gl.tokens = [250, 250, 250, 250, 250];
  assert.equal(E.recommend(s, sc).action.stat, "speed");
  s.goalRace = true; assert.equal(E.recommend(s, sc).action.kind, "race");
});

test("every recalculated mastery-song training carries its own purchase instruction", () => {
  const s = state(); s.gl.tokens = [100, 100, 100, 100, 100]; s.gl.shop = { "song:tachiichi": {} };
  const result = E.recommend(s, sc);
  for (const option of result.ranked.filter((o) => o.kind === "train")) {
    assert.equal(option.song.id, "tachiichi");
    assert.equal(E.advance(s, sc, option).gl.songs.tachiichi, 30);
  }
});
