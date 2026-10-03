// Run with: node --test test/
const test = require("node:test");
const assert = require("node:assert");
const E = require("../engine.js");
const { SCENARIOS } = require("../scenarios.js");

const sc = (id) => SCENARIOS.find((s) => s.id === id);
const fac = (stat, o) => Object.assign({ stat, gain: 0, cards: 0, rainbows: 0, unbonded: 0, hint: false, fail: 0, extras: {} }, o || {});
const base = (o) => Object.assign({
  turn: 30, energy: 80, mood: 3, build: "medium", risk: 15, capped: {}, extras: {},
  goalRace: false, raceAvailable: false, badCondition: false,
  facilities: [fac("speed"), fac("stamina"), fac("power"), fac("guts"), fac("wit")]
}, o);

test("turn labels follow the 24-turn year", () => {
  assert.strictEqual(E.turnInfo(1).text, "Junior · Early Jan");
  assert.strictEqual(E.turnInfo(12).text, "Junior · Late Jun");
  assert.strictEqual(E.turnInfo(37).text, "Classic · Early Jul");
  assert.strictEqual(E.turnInfo(72).text, "Senior · Late Dec");
  assert.ok(E.isCamp(37) && E.isCamp(64) && !E.isCamp(36));
});

test("every scenario has the fields the UI needs", () => {
  assert.strictEqual(SCENARIOS.length, 15);
  SCENARIOS.forEach((s) => {
    ["id", "name", "jpName", "status", "summary", "deck", "hook"].forEach((k) => assert.ok(s[k], s.id + " missing " + k));
    assert.ok(E.HOOKS[s.hook], s.id + " hook " + s.hook);
    assert.ok(Array.isArray(s.coreLoop) && s.coreLoop.length);
  });
});

test("goal race overrides everything", () => {
  const r = E.recommend(base({ goalRace: true, facilities: [fac("speed", { cards: 4, rainbows: 3 }), fac("stamina"), fac("power"), fac("guts"), fac("wit")] }), sc("ura"));
  assert.strictEqual(r.action.kind, "race");
});

test("stacked speed friendship wins at good energy", () => {
  const s = base({ facilities: [fac("speed", { cards: 3, rainbows: 2, fail: 5 }), fac("stamina", { cards: 1 }), fac("power", { cards: 1 }), fac("guts"), fac("wit", { cards: 1 })] });
  const r = E.recommend(s, sc("ura"));
  assert.strictEqual(r.action.kind, "train");
  assert.strictEqual(r.action.stat, "speed");
});

test("low energy with risky failure rests", () => {
  const s = base({ energy: 22, facilities: [fac("speed", { cards: 1, fail: 38 }), fac("stamina", { fail: 40 }), fac("power", { fail: 40 }), fac("guts", { fail: 40 }), fac("wit", { fail: 12 })] });
  assert.strictEqual(E.recommend(s, sc("ura")).action.kind, "rest");
});

test("bad mood with weak trainings goes for recreation", () => {
  const s = base({ mood: 1, energy: 80 });
  assert.strictEqual(E.recommend(s, sc("ura")).action.kind, "recreation");
});

test("Junior turns value un-bonded cards", () => {
  const s = base({ turn: 6, facilities: [fac("speed", { cards: 1 }), fac("stamina"), fac("power"), fac("guts", { cards: 3, unbonded: 3 }), fac("wit")] });
  assert.strictEqual(E.recommend(s, sc("ura")).action.stat, "guts");
});

test("Trackblazer prefers a race over a weak training", () => {
  const s = base({ raceAvailable: true });
  assert.strictEqual(E.recommend(s, sc("trackblazer")).action.kind, "race");
  const tired = base({ raceAvailable: true, extras: { consec: 3 }, facilities: [fac("speed", { cards: 2, rainbows: 1 }), fac("stamina"), fac("power"), fac("guts"), fac("wit")] });
  assert.strictEqual(E.recommend(tired, sc("trackblazer")).action.kind, "train");
});

test("Trackblazer stacks megaphone on a friendship turn", () => {
  const s = base({ extras: { megaphone: true }, facilities: [fac("speed", { cards: 3, rainbows: 2 }), fac("stamina"), fac("power"), fac("guts"), fac("wit")] });
  const r = E.recommend(s, sc("trackblazer"));
  assert.match(r.headline, /Megaphone/);
});

test("Island Training fires with 3 friendship facilities", () => {
  const fs = [fac("speed", { cards: 2, rainbows: 1 }), fac("stamina", { cards: 2, rainbows: 1 }), fac("power", { cards: 2, rainbows: 1 }), fac("guts"), fac("wit")];
  const r = E.recommend(base({ turn: 44, extras: { tickets: 1 }, facilities: fs }), sc("island"));
  assert.strictEqual(r.action.kind, "scenario");
  const camp = E.recommend(base({ turn: 38, extras: { tickets: 1 }, facilities: fs }), sc("island"));
  assert.notStrictEqual(camp.action.kind, "scenario");
});

test("Onsen bathes before a strong training", () => {
  const s = base({ extras: { baths: 1, bathcap: 3 }, facilities: [fac("speed", { cards: 3, rainbows: 2 }), fac("stamina"), fac("power"), fac("guts"), fac("wit")] });
  assert.match(E.recommend(s, sc("onsen")).headline, /bath/);
});

test("Ramen finale ignores energy", () => {
  const s = base({ turn: 75, energy: 5, facilities: [fac("speed", { cards: 3, rainbows: 3, fail: 60 }), fac("stamina"), fac("power"), fac("guts"), fac("wit")] });
  const r = E.recommend(s, sc("ramen"));
  assert.strictEqual(r.action.kind, "train");
  assert.strictEqual(r.action.stat, "speed");
});

test("L'Arc ends at its own finale and has 67 turns", () => {
  assert.strictEqual(sc("larc").totalTurns, 67);
  assert.strictEqual(E.recommend(base({ turn: 67 }), sc("larc")).action.kind, "race");
});
