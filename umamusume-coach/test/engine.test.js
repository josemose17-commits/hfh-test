// Run with: node --test test/*.test.js
const test = require("node:test");
const assert = require("node:assert");
const E = require("../engine.js");
const { SCENARIOS } = require("../scenarios.js");

const sc = (id) => SCENARIOS.find((s) => s.id === id);
const fac = (stat, o) => Object.assign({ stat, gain: null, cards: 0, rainbows: 0, unbonded: 0, hint: false, fail: null, extras: {} }, o || {});
const facs = (o) => E.STATS.map((s) => fac(s, (o || {})[s]));
const base = (o) => Object.assign({
  turn: 30, energy: 80, maxEnergy: 100, mood: 3, build: "medium", risk: 12, raceBonus: 0,
  goals: [], extras: {}, stats: {}, caps: {}, calib: [], log: [],
  goalRace: false, race: "", badCondition: false, facilities: facs()
}, o);
const pick = (state, id) => E.recommend(state, sc(id || "ura"));

test("turn labels follow the 24-turn year", () => {
  assert.strictEqual(E.turnInfo(1).text, "Junior · Early Jan");
  assert.strictEqual(E.turnInfo(12).text, "Junior · Late Jun");
  assert.strictEqual(E.turnInfo(37).text, "Classic · Early Jul");
  assert.strictEqual(E.turnInfo(72).text, "Senior · Late Dec");
  assert.ok(E.isCamp(37) && E.isCamp(64) && !E.isCamp(36));
});

test("every scenario has the fields the UI and engine need", () => {
  assert.strictEqual(SCENARIOS.length, 15);
  const ids = new Set();
  SCENARIOS.forEach((s) => {
    assert.ok(!ids.has(s.id), "duplicate id " + s.id); ids.add(s.id);
    ["id", "name", "jpName", "status", "summary", "deck", "hook"].forEach((k) => assert.ok(s[k], s.id + " missing " + k));
    assert.ok(E.HOOKS[s.hook], s.id + " hook " + s.hook);
    assert.strictEqual(s.caps.length, 5, s.id + " caps");
    assert.ok(s.gainScale > 0);
    assert.ok(Array.isArray(s.coreLoop) && s.coreLoop.length);
    s.inputs.forEach((i) => assert.ok(["number", "check", "select"].includes(i.type), s.id + "." + i.id));
  });
});

test("every scenario produces a recommendation on every turn", () => {
  SCENARIOS.forEach((s) => {
    for (let t = 1; t <= s.totalTurns; t += 7) {
      const r = E.recommend(base({ turn: t, facilities: facs({ speed: { cards: 2, rainbows: 1 } }) }), s);
      assert.ok(r.action && Number.isFinite(r.action.value), s.id + " turn " + t);
    }
  });
});

test("goal race overrides everything", () => {
  const r = pick(base({ goalRace: true, facilities: facs({ speed: { cards: 4, rainbows: 3 } }) }));
  assert.strictEqual(r.action.kind, "race");
  const marked = pick(base({ turn: 20, goals: [20] }));
  assert.strictEqual(marked.action.kind, "race");
});

test("stacked speed friendship wins at good energy", () => {
  const r = pick(base({ facilities: facs({ speed: { cards: 3, rainbows: 2, fail: 2 }, stamina: { cards: 1 }, power: { cards: 1 }, wit: { cards: 1 } }) }));
  assert.strictEqual(r.action.kind, "train");
  assert.strictEqual(r.action.stat, "speed");
});

test("entered gains beat card estimates", () => {
  const r = pick(base({ facilities: facs({ speed: { cards: 3, rainbows: 1, gain: 20 }, power: { cards: 1, gain: 45 } }) }));
  assert.strictEqual(r.action.stat, "power");
});

test("low energy with risky failure rests", () => {
  const r = pick(base({ energy: 22, facilities: facs({ speed: { cards: 1, fail: 38 }, stamina: { fail: 40 }, power: { fail: 40 }, guts: { fail: 40 }, wit: { fail: 12 } }) }));
  assert.strictEqual(r.action.kind, "rest");
});

test("full energy never rests", () => {
  const r = pick(base({ energy: 100 }));
  assert.notStrictEqual(r.action.kind, "rest");
});

test("bad mood with weak trainings goes for recreation", () => {
  assert.strictEqual(pick(base({ mood: 1, energy: 85 })).action.kind, "recreation");
});

test("a strong turn is still trained at Bad mood", () => {
  const r = pick(base({ mood: 1, facilities: facs({ speed: { cards: 4, rainbows: 3, fail: 0 } }) }));
  assert.strictEqual(r.action.stat, "speed");
});

test("Junior turns value un-bonded cards", () => {
  const r = pick(base({ turn: 6, facilities: facs({ speed: { cards: 1 }, guts: { cards: 3, unbonded: 3 } }) }));
  assert.strictEqual(r.action.stat, "guts");
});

test("energy is worth more right before summer camp", () => {
  const mid = { energy: 52, facilities: facs({ stamina: { cards: 1, fail: 4 }, power: { cards: 1, fail: 4 } }) };
  const before = pick(base(Object.assign({ turn: 36 }, mid)));
  const normal = pick(base(Object.assign({ turn: 28 }, mid)));
  const restVal = (r) => r.ranked.find((o) => o.kind === "rest").value / r.typ;
  assert.ok(restVal(before) > restVal(normal), "rest should be worth more at turn 36");
  assert.strictEqual(before.action.kind, "rest");
});

test("last turn never rests", () => {
  const r = pick(base({ turn: 77, energy: 15, facilities: facs({ speed: { cards: 2, rainbows: 1, fail: 30 } }) }));
  assert.notStrictEqual(r.action.kind, "rest");
});

test("capped stats lose value", () => {
  const facilities = facs({ speed: { gain: 40, fail: 0 }, stamina: { gain: 40, fail: 0 } });
  const open = pick(base({ mood: 4, facilities }));
  assert.strictEqual(open.action.stat, "speed");
  const capped = pick(base({ mood: 4, facilities, stats: { speed: 1400, power: 1000, stamina: 600, guts: 300, wit: 500 } }));
  assert.strictEqual(capped.action.stat, "stamina");
});

test("blank failure is estimated from energy", () => {
  assert.strictEqual(E.estimateFail("speed", 100), 0);
  assert.ok(E.estimateFail("speed", 30) > 15);
  assert.ok(E.estimateFail("wit", 30) < E.estimateFail("speed", 30));
});

test("Trackblazer prefers a G1 over a weak training", () => {
  assert.strictEqual(pick(base({ race: "g1" }), "trackblazer").action.kind, "race");
  const tired = base({ race: "g3", extras: { consec: 3 }, facilities: facs({ speed: { cards: 2, rainbows: 1 } }) });
  assert.strictEqual(pick(tired, "trackblazer").action.kind, "train");
});

test("Trackblazer uses a megaphone on a stacked turn and a charm on a risky one", () => {
  const r = pick(base({ extras: { megaphone: "40" }, facilities: facs({ speed: { cards: 3, rainbows: 2, fail: 0 } }) }), "trackblazer");
  assert.match(r.headline, /Megaphone/);
  const c = pick(base({ energy: 35, extras: { charm: true }, facilities: facs({ speed: { cards: 4, rainbows: 3, fail: 25 } }) }), "trackblazer");
  assert.match(c.headline, /Charm/);
  assert.strictEqual(c.action.fail, 0);
});

test("Unity Cup Extreme Spirit Burst removes failure", () => {
  const r = pick(base({ energy: 30, facilities: facs({ power: { cards: 2, fail: 30, extras: { extreme: true } } }) }), "unity");
  assert.strictEqual(r.action.stat, "power");
  assert.strictEqual(r.action.fail, 0);
});

test("Island Training fires with 3 friendship facilities, never at camp", () => {
  const f = facs({ speed: { cards: 2, rainbows: 1 }, stamina: { cards: 2, rainbows: 1 }, power: { cards: 2, rainbows: 1 } });
  assert.strictEqual(pick(base({ turn: 44, extras: { tickets: 1 }, facilities: f }), "island").action.label, "Island Training");
  assert.notStrictEqual(pick(base({ turn: 38, extras: { tickets: 1 }, facilities: f }), "island").action.label, "Island Training");
});

test("Onsen bathes whenever the buff is off", () => {
  const r = pick(base({ extras: { baths: 1, bathOn: false }, facilities: facs({ speed: { cards: 3, rainbows: 2 } }) }), "onsen");
  assert.match(r.headline, /bath/);
  const on = pick(base({ extras: { baths: 1, bathOn: true }, facilities: facs({ speed: { cards: 3, rainbows: 2 } }) }), "onsen");
  assert.doesNotMatch(on.headline, /bath/);
});

test("L'Arc SS Match with a full lineup beats a weak turn", () => {
  assert.match(pick(base({ extras: { ss: 5 } }), "larc").action.label, /SS Match/);
  assert.strictEqual(sc("larc").totalTurns, 67);
  assert.strictEqual(pick(base({ turn: 67 }), "larc").action.kind, "race");
});

test("Ramen finale keeps training at low energy thanks to the special ramen", () => {
  const s = base({ turn: 75, energy: 30, facilities: facs({ speed: { cards: 3, rainbows: 3, fail: 14 } }) });
  assert.strictEqual(pick(s, "ramen").action.stat, "speed");
});

test("advance logs the turn, applies energy and supports undo", () => {
  const s = base({ turn: 30, energy: 80, trackStats: true, stats: { speed: 500 }, facilities: facs({ speed: { cards: 3, rainbows: 2, gain: 40, fail: 0 } }) });
  const r = pick(s);
  const next = E.advance(s, sc("ura"), r.action);
  assert.strictEqual(next.turn, 31);
  assert.ok(next.energy < 80);
  assert.ok(next.stats.speed > 500);
  assert.strictEqual(next.log.length, 1);
  assert.strictEqual(next.facilities[0].cards, 0);
  const back = E.undo(next);
  assert.strictEqual(back.turn, 30);
  assert.strictEqual(back.energy, 80);
});

test("calibration learns from entered gains", () => {
  let s = base({ turn: 26, facilities: facs({ speed: { gain: 60, cards: 2 } }) });
  for (let i = 0; i < 3; i++) {
    s = E.advance(s, sc("ura"), pick(s).action);
    s.facilities[0].gain = 60;
  }
  assert.ok(E.calibFactor(s) > 1.3);
});
