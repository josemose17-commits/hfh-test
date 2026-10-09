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

// ---- Deck mode (GameTora data) ----
const Deck = require("../deck.js");

test("card effects match GameTora at each limit break", () => {
  const k = Deck.card(30028); // Kitasan Black SSR Speed
  assert.strictEqual(Deck.levelFor(k, 0), 30);
  assert.strictEqual(Deck.levelFor(k, 4), 50);
  const max = Deck.baseEffects(k, 50);
  assert.strictEqual(max[1], 25); // friendship bonus
  assert.strictEqual(max[8], 15); // training effectiveness incl. unique +5
  assert.strictEqual(max[19], 100); // specialty priority incl. unique +20
  assert.strictEqual(max[14], 35); // initial bond
  assert.strictEqual(Deck.baseEffects(k, 30)[1], 20);
});

test("data covers cards and trainees with Global release info", () => {
  assert.ok(Deck.DATA.supports.length > 500);
  assert.ok(Deck.DATA.trainees.length > 250);
  assert.ok(Deck.DATA.supports.some((c) => Deck.onGlobal(c, "2026-10-03")));
  assert.ok(Deck.DATA.supports.some((c) => !Deck.onGlobal(c, "2026-10-03")));
  const spe = Deck.trainee(100101);
  assert.deepStrictEqual(spe.g, [0, 20, 0, 0, 10]);
  assert.strictEqual(Deck.suggestBuild(spe), "medium");
});

test("training formula: friendship, mood and card count multiply", () => {
  const k = Deck.card(30028);
  const row = sc("ura").train.speed;
  const alone = Deck.trainingGain(row, "speed", [{ card: k, level: 50, bond: 50 }], { mood: 2 });
  const rb = Deck.trainingGain(row, "speed", [{ card: k, level: 50, bond: 90 }], { mood: 4 });
  assert.strictEqual(alone.rainbows, 0);
  assert.strictEqual(rb.rainbows, 1);
  assert.ok(rb.total > alone.total * 1.5);
  // 11 speed x 1.25 friendship x (1 + 0.2 x 1.3 mood) x 1.15 training x 1.05 one card = 20
  assert.strictEqual(rb.gains[0], 20);
});

test("deck mode drives the recommendation and tracks bond", () => {
  const deck = { trainee: 100101, slots: [{ id: 30028, lb: 4, bond: 90 }, { id: 30028, lb: 0, bond: 20 }] };
  const f = facs();
  f[0].members = [0];
  f[2].members = [1];
  const s = base({ deck, facilities: f });
  const r = pick(s);
  assert.strictEqual(r.action.stat, "speed");
  assert.ok(r.action.formula);
  f[0].members = [];
  f[3].members = [1];
  const s2 = base({ turn: 6, deck, facilities: f });
  const r2 = pick(s2);
  const next = E.advance(s2, sc("ura"), r2.ranked.find((o) => o.stat === "guts"));
  assert.strictEqual(next.deck.slots[1].bond, 27);
});

// ---- Grand Concert, hints and outings ----
test("Grand Concert songs add extra stat gains and a delayed friendship bonus", () => {
  const gl = sc("grandlive");
  const s = base({ turn: 30, gl: { songs: { tachiichi: 10, bluebird: 26, zensoku: 20 }, tokens: [0, 0, 0, 0, 0] } });
  const b = E.songBonuses(s, gl);
  assert.strictEqual(b.extra.speed, 3);
  assert.strictEqual(b.fb, 5); // zensoku learned turn 20, live on 24 already happened
  const pending = E.songBonuses(base({ turn: 30, gl: { songs: { runrun: 28 } } }), gl);
  assert.strictEqual(pending.fb, 0);
  assert.strictEqual(pending.pendingFb, 5);
  const h = E.hypeStatus(base({ turn: 30, gl: { songs: { bluebird: 26 } } }), gl);
  assert.strictEqual(h.next, 36);
  assert.strictEqual(h.since, 1);
  assert.strictEqual(h.need, 2);
});

test("Grand Concert follows the song plan: lessons first, then an affordable song (not the +Guts one in year one)", () => {
  const gl = sc("grandlive");
  const s = base({ turn: 10, gl: { songs: {}, tokens: [40, 0, 0, 30, 0], lessons: {} } });
  const plan = E.songPlan(s, gl);
  assert.strictEqual(plan.target, 5);
  assert.strictEqual(plan.step, "lessons", "year one starts with 1 technique lesson before the first song");
  assert.doesNotMatch(pick(s, "grandlive").headline, /Learn/);
  s.gl.lessons = { 0: 1 };
  const r = pick(s, "grandlive");
  assert.match(r.headline, /Learn .* \(no turn used\)/);
  assert.doesNotMatch(r.headline, /Nigekiri/, "the +Guts song (also affordable) is skipped in year one");
  const adv = E.songAdvice(s, gl);
  assert.ok(adv.find((a) => a.song.id === "nigekiri").avoid);
});

test("Grand Concert song plan: 5 songs and a carry-over in year one, 3 + carry after, 18 by the Grand Live", () => {
  const gl = sc("grandlive");
  const at = (turn, songs, lessons) => E.songPlan(base({ turn, gl: { songs, tokens: [0, 0, 0, 0, 0], lessons } }), gl);
  const five = { kiseki: 6, tachiichi: 8, gothisway: 12, runrun: 16, zensoku: 20 };
  assert.strictEqual(at(22, five, { 0: 14 }).step, "lessons", "2 more lessons until the 6th song shows");
  assert.strictEqual(at(22, five, { 0: 16 }).step, "hold", "then hold it for after the live");
  const y2 = at(25, five, {});
  assert.strictEqual(y2.target, 3);
  assert.match(y2.text, /carried over first/);
  assert.deepStrictEqual(y2.focus, ["yumewo", "growup"]);
  assert.strictEqual(at(61, five, {}).target, 4, "the last half buys the 4th song instead of carrying it");
  assert.deepStrictEqual(at(50, five, {}).focus, ["daisuki", "fanfare"]);
});

test("hint cards add value and extra bond; Friend outings become an option", () => {
  const deck = { slots: [{ id: 30028, lb: 4, bond: 40 }, { id: 30052, lb: 4, bond: 30, dates: { unlocked: true, done: 0 } }] };
  const f = facs();
  f[0].members = [0];
  f[0].hints = [0];
  const s = base({ turn: 20, mood: 2, deck, facilities: f });
  const r = pick(s);
  const sp = r.ranked.find((o) => o.stat === "speed");
  assert.ok(sp.parts.hint > 0);
  const outing = r.ranked.find((o) => o.outing === 1);
  assert.ok(outing, "Light Hello outing offered");
  const next = E.advance(s, sc("ura"), sp);
  assert.strictEqual(next.deck.slots[0].bond, 52); // 40 + 7 training + 5 hint
  const after = E.advance(s, sc("ura"), outing);
  assert.strictEqual(after.deck.slots[1].dates.done, 1);
  assert.strictEqual(after.deck.slots[1].bond, 35);
});

// ---- Scenario audit (GameTora articles) ----
test("facility levels: start at 1, count logged trainings, fill unlogged turns", () => {
  const ura = sc("ura");
  assert.strictEqual(E.facLevelFor(base({ turn: 1 }), ura, "speed"), 1);
  const log = [];
  for (let t = 1; t <= 8; t++) log.push({ turn: t, kind: "train", stat: t <= 4 ? "speed" : "wit" });
  assert.strictEqual(E.facLevelFor(base({ turn: 9, log }), ura, "speed"), 2);
  assert.strictEqual(E.facLevelFor(base({ turn: 9, log }), ura, "stamina"), 1);
  assert.ok(E.facLevelFor(base({ turn: 30 }), ura, "speed") >= 2); // nothing logged: estimated
  assert.strictEqual(E.facLevelFor(base({ turn: 38 }), ura, "guts"), 5); // camp
  assert.strictEqual(E.facLevelFor(base({ turn: 30, facLevels: { speed: 4 } }), ura, "speed"), 4);
  // L'Arc: Expectation gauge thresholds add levels; Onsen: bathing parties add levels
  assert.strictEqual(E.facLevelFor(base({ turn: 2, extras: { expect: 60 } }), sc("larc"), "speed"), 3);
  assert.strictEqual(E.facLevelFor(base({ turn: 26 }), sc("onsen"), "stamina") >= 2, true);
});

test("URA: Akikawa's summer snack restores 30 energy after Late July", () => {
  const s = base({ turn: 38, energy: 40, facilities: facs({ wit: { cards: 1 } }) });
  const wit = pick(s).ranked.find((o) => o.stat === "wit");
  const next = E.advance(s, sc("ura"), wit);
  assert.ok(next.energy >= 40 + 5 + 30 - 1);
  const meek = pick(base({ facilities: facs({ speed: { cards: 1, extras: { meek: true } } }) })).ranked.find((o) => o.stat === "speed");
  assert.ok(meek.parts.scenario > 0.5 * E.typAt(30, sc("ura"), 1));
});

test("Unity Cup: Special Training, Spirit Bursts and the burst counter", () => {
  const u = sc("unity");
  assert.deepStrictEqual(u.finale.turns, [74, 76, 78]);
  const s = base({ facilities: facs({ speed: { cards: 2, extras: { flames: 3, burst: 1 } }, power: { cards: 2 } }) });
  const r = pick(s, "unity");
  assert.strictEqual(r.action.stat, "speed");
  assert.match(r.action.notes.join(" "), /Special Training with 3 flames/);
  const next = E.advance(s, u, r.action);
  assert.strictEqual(next.extras.bursts, 1);
});

test("Trackblazer: a Vita beats resting, cupcakes fix mood, a 4th race in a row is avoided", () => {
  const strong = facs({ speed: { cards: 3, rainbows: 2, fail: 30 } });
  const low = base({ energy: 25, extras: { vita: "40" }, facilities: strong });
  assert.match(pick(low, "trackblazer").headline, /Drink Vita 40/);
  const sad = base({ mood: 1, extras: { cupcake: "1" }, facilities: facs({ speed: { cards: 3, rainbows: 2, fail: 0 } }) });
  assert.match(pick(sad, "trackblazer").headline, /Cupcake/);
  const tired = base({ race: "g1", extras: { consec: 3 }, facilities: facs({ speed: { cards: 2, rainbows: 1 } }) });
  assert.notStrictEqual(pick(tired, "trackblazer").action.kind, "race");
  const hammer = base({ race: "g1", extras: { hammer: "35" } });
  assert.match(pick(hammer, "trackblazer").headline, /Cleat Hammer/);
});

test("Grand Masters: correct Wisdom effects and the Grand Masters finale", () => {
  const gm = sc("grandmasters");
  assert.deepStrictEqual(gm.finale.turns, [78]);
  const r = pick(base({ energy: 20, extras: { wisdom: "red" }, facilities: facs({ speed: { cards: 3, rainbows: 1, fail: 35 } }) }), "grandmasters");
  assert.match(r.headline, /Red Wisdom/);
  assert.ok(r.action.fail < 35);
  const y = pick(base({ extras: { wisdom: "yellow" }, facilities: facs({ speed: { cards: 1, rainbows: 1 }, power: { cards: 4, rainbows: 0 } }) }), "grandmasters");
  assert.match(y.headline, /Yellow Wisdom/);
  assert.strictEqual(y.action.stat, "power");
});

test("L'Arc: fixed goal races, no SS Matches in France", () => {
  assert.strictEqual(pick(base({ turn: 34 }), "larc").action.kind, "race");
  assert.ok(pick(base({ turn: 30, extras: { ss: 5 } }), "larc").ranked.some((o) => /SS Match/.test(o.label)));
  assert.ok(!pick(base({ turn: 38, extras: { ss: 5 } }), "larc").ranked.some((o) => /SS Match/.test(o.label)));
});

test("U.A.F.: Wit costs energy, linked genres score higher", () => {
  const r = pick(base({ facilities: facs({ wit: { cards: 1 } }) }), "uaf");
  assert.ok(r.ranked.find((o) => o.stat === "wit").energyDelta < 0);
  const g = (genre) => ({ cards: 1, extras: { genre } });
  const linked = pick(base({ facilities: facs({ speed: g("sphere"), stamina: g("sphere"), power: g("sphere"), guts: g("fight"), wit: g("free") }) }), "uaf");
  const sp = linked.ranked.find((o) => o.stat === "speed");
  const gu = linked.ranked.find((o) => o.stat === "guts");
  assert.ok(sp.parts.scenario > gu.parts.scenario);
  assert.match(linked.action.notes.join(" "), /consult Elfie/);
});

test("Great Food Festival: names the dish that matches the training", () => {
  const r = pick(base({ turn: 30, extras: { dish: "2" }, facilities: facs({ power: { cards: 3, rainbows: 2 } }) }), "cooking");
  assert.match(r.headline, /Cook Potato Garlic Pizza/);
  assert.deepStrictEqual(sc("cooking").finale.turns, [74, 76, 78]);
});

test("Beyond Dreams: use DREAMS training before the half year ends", () => {
  const r = pick(base({ turn: 47, energy: 70, extras: { dreamsLeft: 2 }, facilities: facs({ speed: { cards: 2, rainbows: 1 } }) }), "dreams");
  assert.match(r.action.label, /DREAMS/);
});

test("Grand Concert: Done adds the training's tokens (typed or estimated), capped, and Undo removes them", () => {
  const gl = sc("grandlive");
  const st = base({ turn: 10, gl: { songs: {}, tokens: [0, 0, 0, 0, 0] }, facLevels: {} });
  st.facilities[0] = fac("speed", { cards: 2, rainbows: 1, members: [], hints: [] });
  const opt = pick(st, "grandlive").ranked.find((o) => o.kind === "train" && o.stat === "speed");
  const g = E.tokenGain(st.facilities[0], st, gl);
  assert.strictEqual(g.length, 2, "friendship training gives two token types");
  assert.strictEqual(g[0].type, 0); // Speed: Dance first
  const after = E.advance(st, gl, opt);
  assert.strictEqual(after.gl.tokens[0], g[0].amount);
  assert.strictEqual(after.gl.tokens[g[1].type], g[1].amount);
  assert.deepStrictEqual(E.undo(after).gl.tokens, [0, 0, 0, 0, 0]);
  st.facilities[0].extras = { tokType: 4, tok: 30 };
  st.gl.tokens = [0, 0, 0, 0, 190];
  assert.strictEqual(E.advance(st, gl, opt).gl.tokens[4], 200, "capped at 200 before the first live");
  assert.strictEqual(E.tokenCap(Object.assign({}, st, { turn: 40 }), gl), 300);
});

test("trainee goals: fixed goal races are marked on their turns, choices only when they share a turn", () => {
  const D = require("../deck.js");
  const tr = (name) => D.DATA.trainees.find((t) => t.n === name);
  const ura = sc("ura");
  const sw = base({ turn: 27, deck: { trainee: tr("Special Week").id, slots: [] } });
  const auto = E.autoGoalTurns(sw, ura);
  [12, 27, 34, 44, 56, 70, 72].forEach((t) => assert.ok(auto.has(t), "turn " + t));
  assert.ok(E.forcedTurns(sw, ura).has(34));
  assert.ok(E.eventsFor(34, ura, sw).some((e) => /Japanese Derby/.test(e.label)));
  // On a goal turn the coach races.
  sw.goalRace = true;
  assert.strictEqual(E.recommend(sw, ura).action.kind, "race");
  // Daiwa Scarlet: Oaks or Derby, both on turn 34, so turn 34 is a goal race either way.
  const dw = base({ deck: { trainee: tr("Daiwa Scarlet").id, slots: [] } });
  assert.ok(E.autoGoalTurns(dw, ura).has(34));
  // Unmarking a trainee goal works through goalsOff.
  assert.ok(!E.autoGoalTurns(Object.assign({}, sw, { goalsOff: [34] }), ura).has(34));
  // L'Arc keeps its own fixed goals.
  assert.strictEqual(E.traineeGoals(sw, sc("larc")).length, 0);
});

test("trainee goals: 'pick one' goals on different turns are options, not forced", () => {
  const D = require("../deck.js");
  const fm = D.DATA.trainees.find((t) => t.n === "Fine Motion");
  const st = base({ deck: { trainee: fm.id, slots: [] } });
  const goals = E.traineeGoals(st, sc("ura"));
  const opts = goals.filter((g) => g.choice);
  assert.ok(opts.length >= 2 && opts.every((g) => !g.forced));
  assert.ok(goals.some((g) => g.forced && g.turn === 64), "Sapporo Kinen stays a fixed goal");
});

test("fan goals: waits when bigger races later cover it, races when it must, and counts fans on Done", () => {
  const D = require("../deck.js");
  const ura = sc("ura");
  const tm = D.DATA.trainees.find((t) => t.n === "Tamamo Cross"); // 5,000 fans by turn 29
  const st = (turn, fans) => base({ turn, fans, deck: { trainee: tm.id, slots: [] }, race: "", raceName: "" });
  const early = E.fanPlan(st(14, 700), ura);
  assert.strictEqual(early.goal.fans, 5000);
  assert.strictEqual(early.status, "wait");
  assert.strictEqual(E.recommend(st(14, 700), ura).action.kind !== "race", true);
  const late = E.recommend(st(26, 2500), ura);
  assert.strictEqual(late.fanPlan.status, "urgent");
  assert.strictEqual(late.action.kind, "race", "with no later way to make the goal, it races now");
  const after = E.advance(st(26, 2500), ura, late.action);
  assert.ok(after.fans > 2500, "Done on a race adds its fans");
  assert.strictEqual(E.fanPlan(st(20, 6000), ura).status, "met");
});

test("race calendar: races on a turn fit the trainee's aptitudes", () => {
  const D = require("../deck.js");
  const urara = D.DATA.trainees.find((t) => t.n === "Haru Urara"); // dirt sprinter
  const races = E.racesAt(base({ deck: { trainee: urara.id, slots: [] } }), 50);
  assert.ok(races.every((r) => r.s === 2), "only dirt races for a dirt-only trainee");
  assert.ok(E.racesAt(base({}), 27).some((r) => r.n === "Kisaragi Sho"));
});

test("Grand Concert opening: turn 4 rests when energy is 65 or less, so turn 5 starts full", () => {
  const gl = sc("grandlive");
  const s = (energy) => base({ turn: 4, energy, mood: 2, gl: { songs: {}, tokens: [0, 0, 0, 0, 0], lessons: {} }, facilities: facs({ speed: { cards: 1, unbonded: 1 }, wit: { cards: 1, unbonded: 1 } }) });
  assert.strictEqual(E.recommend(s(60), gl).action.kind, "rest");
  assert.strictEqual(E.recommend(s(95), gl).action.kind, "train");
  assert.ok(E.eventsFor(12, gl, { goals: [] }).some((e) => e.label === "Reset check"));
  assert.ok(E.eventsFor(12, gl, { goals: [] }).some((e) => /Debut/.test(e.label)), "the debut still shows");
});

test("Trackblazer: Grade Point goals replace career goals, count down on races and reset each December", () => {
  const D = require("../deck.js");
  const tb = sc("trackblazer");
  const tr = (n) => D.DATA.trainees.find((t) => t.n === n).id;
  const sw = (o) => base(Object.assign({ deck: { trainee: tr("Special Week"), slots: [] }, fans: 30000 }, o));
  assert.deepStrictEqual(E.traineeGoals(sw({}), tb).map((g) => g.turn), [12], "only the debut stays a goal race");
  assert.strictEqual(E.gradeGoal(sw({ turn: 20 }), tb).goal, 60);
  assert.strictEqual(E.gradeGoal(base({ turn: 30, deck: { trainee: tr("Haru Urara"), slots: [] } }), tb).goal, 200, "dirt target");
  assert.strictEqual(E.gradeGoal(base({ turn: 30, deck: { trainee: tr("Curren Chan"), slots: [] } }), tb).goal, 200, "sprint-only target");
  // 200 still needed on turn 46: the races left after this turn pay at most 180, so race now.
  const late = sw({ turn: 46, extras: { gpNeed: 200, gpDue: 48 } });
  const rec = E.recommend(late, tb);
  assert.strictEqual(rec.gradePlan.status, "urgent");
  assert.strictEqual(rec.action.kind, "race");
  const after = E.advance(late, tb, rec.action);
  assert.strictEqual(after.extras.gpNeed, 200 - rec.action.gp);
  // A typed count from another year doesn't apply.
  assert.strictEqual(E.gradePlan(sw({ turn: 50, extras: { gpNeed: 20, gpDue: 48 } }), tb).need, 300);
  // The deadline turn resets the count for next year's goal.
  const dec = E.advance(sw({ turn: 48, extras: { gpNeed: 0, gpDue: 48 } }), tb, { kind: "rest", energyDelta: 50, moodDelta: 0, prefix: [], notes: [], consume: {} });
  assert.strictEqual(dec.extras.gpNeed, undefined);
  assert.strictEqual(E.gradePlan(dec, tb).need, 300);
});

test("Grand Masters: Wisdom waits for a camp that's a turn away, and Red counts the year-end race", () => {
  const gm = sc("grandmasters");
  const s = (turn, wisdom) => base({ turn, energy: 90, extras: { wisdom }, facilities: facs({ speed: { cards: 3, rainbows: 1 }, power: { cards: 1 } }) });
  assert.ok(/Wisdom/.test(E.recommend(s(30, "yellow"), gm).headline), "uses it right away");
  assert.ok(!/Wisdom/.test(E.recommend(s(36, "yellow"), gm).headline), "holds it for camp");
  const red = E.recommend(s(24, "red"), gm);
  assert.ok(/Red Wisdom/.test(red.headline));
  assert.ok(red.action.notes.some((n) => /year-end race/.test(n)));
});

test("future scenarios: guide rules (SS Match energy, DREAMS refills, island tickets, Overdrive, tips, cooking)", () => {
  // L'Arc: an SS Match at very low energy can be lost, so it's worth less.
  const larc = sc("larc");
  const ss = (energy) => E.evaluate(base({ turn: 20, energy, extras: { ss: 5 } }), larc).options.find((o) => /SS Match/.test(o.label));
  assert.ok(ss(8).value < ss(80).value);
  assert.ok(ss(8).notes.some((n) => /halves/.test(n)));
  // Beyond Dreams: 4 DREAMS trainings after Senior June's meeting; avoid them on rank-up turns later on.
  const dreams = sc("dreams");
  const rest = { kind: "rest", energyDelta: 50, moodDelta: 0, prefix: [], notes: [], consume: {} };
  assert.strictEqual(E.advance(base({ turn: 60, extras: {} }), dreams, rest).extras.dreamsLeft, 4);
  assert.strictEqual(E.advance(base({ turn: 48, extras: {} }), dreams, rest).extras.dreamsLeft, 2);
  const dr = (fullgauge) => E.evaluate(base({ turn: 52, energy: 90, extras: { dreamsLeft: 2 }, facilities: facs({ speed: { cards: 2, rainbows: 1, extras: { members: 2, fullgauge } } }) }), dreams).options.find((o) => /DREAMS/.test(o.label));
  assert.ok(dr(1).value < dr(0).value, "a rank-up turn makes DREAMS training worth less");
  // Island: Senior spring keeps the one ticket unless the turn is exceptional; Classic uses it before camp.
  const isl = sc("island");
  const island = (turn, rb) => E.evaluate(base({ turn, extras: { tickets: 1 }, facilities: facs({ speed: { cards: 2, rainbows: rb ? 1 : 0 }, stamina: { cards: 2, rainbows: rb ? 1 : 0 }, power: { cards: 2, rainbows: rb ? 1 : 0 } }) }), isl).options.some((o) => o.label === "Island Training");
  assert.ok(!island(52, true), "3 friendship facilities isn't enough to spend it in Senior spring");
  assert.ok(island(36, false), "Classic: use it before camp");
  // Mecha: stored Overdrive is spent before the URA Finals.
  assert.match(E.recommend(base({ turn: 71, extras: { overdrive: true }, facilities: facs({ speed: { cards: 1 } }) }), sc("mecha")).headline, /Overdrive/);
  // Trecen-ken: tips reset after Late December, so a tasting is held then.
  const tips = (turn) => E.recommend(base({ turn, extras: { tips: 4, tasting: true }, facilities: facs({ speed: { cards: 2 } }) }), sc("ramen")).headline;
  assert.match(tips(47), /tasting/);
  assert.doesNotMatch(tips(43), /tasting/, "mid-year it waits for a friendship training");
  // Great Food Festival: Junior cooks even on an ordinary training (Cooking Points last all run).
  const cook = (turn) => E.recommend(base({ turn, energy: 90, extras: { dish: "1" }, facilities: facs({ speed: { cards: 1 } }) }), sc("cooking")).headline;
  assert.match(cook(5), /Cook/);
  assert.doesNotMatch(cook(30), /Cook/);
  // Onsen: the Junior reset check shows on the plan.
  assert.ok(E.eventsFor(21, sc("onsen"), { goals: [] }).some((e) => e.label === "Reset check"));
});

test("friend card outings: game8 data per card, the best choice for this turn, and no outing once they're all done", () => {
  const D = require("../deck.js");
  const DATES = require("../data/dates.js");
  // Every card is a friend or group card, and every hint is a real skill.
  Object.entries(DATES.cards).forEach(([id, info]) => {
    const c = D.card(+id);
    assert.ok(c && (c.ty === "friend" || c.ty === "group"), id + " is a friend or group card");
    assert.ok(info.dates.length >= 3 && info.dates.length <= 5, id + " outing count");
    const hints = [];
    const walk = (o) => { if (!o) return; if (o.opts) o.opts.forEach(walk); (o.h || []).forEach(([sid]) => hints.push(sid)); };
    info.dates.forEach(walk);
    ["keep", "lose", "alt"].forEach((k) => walk(info.unlock[k]));
    hints.forEach((sid) => assert.ok(D.DATA.skills[sid], id + " hint " + sid));
  });
  const deck = (id, done) => ({ slots: [{ id, lb: 4, bond: 90, dates: { unlocked: true, done } }] });
  const outing = (o) => E.evaluate(base(Object.assign({ facilities: facs() }, o)), sc("ura")).options.find((x) => x.outing != null);
  // Light Hello's 3rd outing: the +80 energy choice when tired, Speed +20 / Guts +20 when not.
  const tired = outing({ energy: 5, deck: deck(30052, 2) });
  assert.match(tired.label, /\(3\/5\)/);
  assert.match(tired.notes[0], /\+80 energy/);
  assert.match(outing({ energy: 95, mood: 4, deck: deck(30052, 2) }).notes[0], /Speed \+20/);
  assert.strictEqual(outing({ energy: 50, deck: deck(30052, 5) }), undefined, "no 6th outing");
  // Sasami's outings can fail, and the coach says so.
  assert.match(outing({ energy: 50, deck: deck(30080, 0) }).notes[0], /can fail/);
  // A card without data still gets the typical outing.
  assert.match(outing({ energy: 50, deck: deck(10021, 0) }).notes[0], /typical values/);
  // Advancing on an outing counts it.
  const st = base({ energy: 25, deck: deck(30052, 2) });
  assert.strictEqual(E.advance(st, sc("ura"), outing({ energy: 25, deck: deck(30052, 2) })).deck.slots[0].dates.done, 3);
});

test("outings scale to the card's LB, raise max energy, count stats, and stop at 5 without data", () => {
  const ura = sc("ura");
  const deck = (id, lb, done) => ({ slots: [{ id, lb, bond: 90, dates: { unlocked: true, done } }] });
  const outing = (st) => E.evaluate(st, ura).options.find((x) => x.outing != null);
  // Light Hello's 1st outing: +40 energy at LB4 (game8), +35 at LB0 (Event Recovery 60% vs 40%).
  assert.match(outing(base({ energy: 30, deck: deck(30052, 4, 0) })).notes[0], /\+40 energy/);
  const lb0 = base({ energy: 30, deck: deck(30052, 0, 0) });
  assert.match(outing(lb0).notes[0], /\+35 energy/);
  const after = E.advance(lb0, ura, outing(lb0));
  assert.strictEqual(after.maxEnergy, 104, "+4 max energy");
  // Tracked stats take the outing's gains.
  const tracked = base({ energy: 30, trackStats: true, stats: { guts: 400 }, deck: deck(30052, 0, 1) });
  assert.strictEqual(E.advance(tracked, ura, outing(tracked)).stats.guts, 412);
  // A card without outing data stops after 5.
  assert.strictEqual(outing(base({ deck: deck(10021, 4, 5) })), undefined);
});

test("your own target stats replace the build's", () => {
  const ura = sc("ura");
  const st = (targets) => base({ stats: { speed: 1100 }, targets, facilities: facs({ speed: { cards: 1, gain: 20 } }) });
  const v = (t) => E.evaluate(st(t), ura).options.find((o) => o.stat === "speed").parts.stats;
  assert.ok(v({ speed: 1000 }) < v({ speed: 1500 }), "past your target, Speed counts less");
});

test("Chairman Akikawa: training with her is worth more before the bond check and raises her bond", () => {
  const gl = sc("grandlive");
  assert.ok(gl.inputs.some((i) => i.id === "aki") && gl.inputs.some((i) => i.id === "akiBond"));
  const st = (turn, bond, aki) => base({ turn, extras: { akiBond: bond }, gl: { songs: {}, tokens: [0, 0, 0, 0, 0], lessons: {} }, facilities: facs({ guts: { cards: 1, extras: { aki } } }) });
  const guts = (s) => E.evaluate(s, gl).options.find((o) => o.stat === "guts");
  assert.ok(guts(st(50, 30, true)).value > guts(st(50, 30, false)).value);
  assert.ok(guts(st(50, 30, true)).notes.some((n) => /Akikawa is here/.test(n)));
  assert.ok(!guts(st(56, 30, true)).notes.some((n) => /Akikawa/.test(n)), "after the check it doesn't matter");
  assert.strictEqual(E.advance(st(50, 30, true), gl, guts(st(50, 30, true))).extras.akiBond, 37);
});

test("Grand Concert: trainings count the tokens they give toward the songs you still need", () => {
  const gl = sc("grandlive");
  const st = (tokens) => base({ turn: 40, gl: { songs: {}, tokens, lessons: {} }, facilities: facs({ guts: { cards: 2 } }) });
  const guts = (s) => E.evaluate(s, gl).options.find((o) => o.stat === "guts");
  const none = guts(st([0, 0, 0, 0, 0]));
  assert.ok(none.notes.some((n) => /Visual toward/.test(n)));
  const full = guts(st([200, 200, 200, 200, 200]));
  assert.ok(none.value > full.value, "tokens you don't need add nothing");
});

test("support card events from the wiki: chain and other events, ranges by LB, best choice ranked", () => {
  const CE = require("../data/card-events.js");
  assert.ok(CE.meta.license.indexOf("CC BY-SA") === 0);
  const kb = E.cardEvents(30028); // SSR Kitasan Black
  assert.strictEqual(kb.chain.length, 3);
  assert.ok(kb.other.length >= 2);
  const ev = kb.chain[1]; // Paying It Forward: energy, or a Speed + hint gamble
  const tired = E.rankEventChoices(base({ energy: 10 }), sc("ura"), ev, 4);
  assert.strictEqual(tired.length, 2);
  assert.match(tired[0].text, /energy/);
  assert.ok(/on success/.test(E.eventText(ev.c[1], 4)));
  // Light Hello's unlock event: keep the outings, even though the other choice gives Wit +40.
  const lhUnlock = E.cardEvents(30052).other.find((e) => (e.c || []).some((c) => c.unlock));
  const pick = E.rankEventChoices(base({ energy: 90 }), sc("ura"), lhUnlock, 4);
  assert.match(pick[0].text, /unlocks outings/);
  assert.match(pick[1].text, /locks outings/);
  // A range like [10, 16] reads as 10 at LB0 and 16 at LB4.
  const ranged = Object.values(CE.events).find((e) => (e.c || []).some((c) => Array.isArray(c.e)));
  if (ranged) {
    const c = ranged.c.find((x) => Array.isArray(x.e));
    assert.match(E.eventText(c, 0), new RegExp("\\+" + c.e[0] + " energy"));
    assert.match(E.eventText(c, 4), new RegExp("\\+" + c.e[1] + " energy"));
  }
});

test("goal races cost no energy; optional races do", () => {
  const goal = pick(base({ energy: 50, goalRace: true }));
  assert.strictEqual(goal.action.kind, "race");
  assert.strictEqual(goal.action.energyDelta, 0);
  assert.strictEqual(goal.after.energy, 50);
  const opt = E.evaluate(base({ energy: 50, race: "g1" }), sc("ura")).options.find((o) => o.kind === "race");
  assert.ok(opt && !opt.forced);
  assert.strictEqual(opt.energyDelta, -15);
  // Done on a goal race keeps your energy.
  const next = E.advance(base({ energy: 50, goalRace: true }), sc("ura"), goal.action);
  assert.strictEqual(next.energy, 50);
});

test("caps: scenario base plus blue spark uncaps, or your own cap", () => {
  const gl = sc("grandlive");
  assert.deepStrictEqual(gl.caps, [1600, 1300, 1300, 1500, 1300]);
  assert.deepStrictEqual(sc("ura").caps, [1400, 1400, 1400, 1400, 1400]);
  assert.deepStrictEqual(SCENARIOS[1].caps, [1300, 1300, 1300, 1300, 1800]);
  assert.deepStrictEqual(SCENARIOS[2].caps, [1200, 1900, 1200, 1200, 1500]);
  assert.strictEqual(E.sparkUncap("3 3 2"), 41);
  assert.strictEqual(E.sparkUncap("1,2"), 13);
  const caps = E.capsFor({ caps: { wit: 1350 }, sparks: { speed: "3 3", guts: "1" } }, gl);
  assert.deepStrictEqual(caps, { speed: 1632, stamina: 1300, power: 1300, guts: 1504, wit: 1350 });
});

test("training past 1200 gives half the gain", () => {
  assert.strictEqual(E.trainedGain("speed", 20, { speed: 1300 }), 10);
  assert.strictEqual(E.trainedGain("speed", 20, { speed: 1190 }), 15);
  assert.strictEqual(E.trainedGain("speed", 20, { speed: 900 }), 20);
  assert.strictEqual(E.trainedGain("speed", 20, {}), 20);
  const r = E.evaluate(base({ stats: { speed: 1300, stamina: 600, power: 700, guts: 300, wit: 500 }, facilities: facs({ speed: { cards: 2 } }) }), sc("ura"));
  const sp = r.options.find((o) => o.kind === "train" && o.stat === "speed");
  const low = E.evaluate(base({ stats: { speed: 900, stamina: 600, power: 700, guts: 300, wit: 500 }, facilities: facs({ speed: { cards: 2 } }) }), sc("ura"));
  const sp2 = low.options.find((o) => o.kind === "train" && o.stat === "speed");
  assert.ok(Math.abs(sp.statGains.speed * 2 - sp2.statGains.speed) < 0.01, "speed gain halves past 1200");
  assert.ok(Math.abs(sp.statGains.power - sp2.statGains.power) < 0.01, "power below 1200 is untouched");
});

test("a stat far below its target gets priority", () => {
  const st = (stamina) => base({ stats: { speed: 900, stamina, power: 700, guts: 400, wit: 600 }, facilities: facs({ speed: { gain: 24, fail: 0 }, stamina: { gain: 24, fail: 0 } }) });
  const gap = (state) => {
    const o = E.evaluate(state, sc("ura")).options;
    return o.find((x) => x.stat === "stamina").parts.stats / o.find((x) => x.stat === "speed").parts.stats;
  };
  assert.ok(gap(st(300)) > gap(st(950)) * 1.3, "low stamina should count for more");
  // Without current stats, the build weights alone decide: Speed first.
  const noStats = E.evaluate(base({ facilities: facs({ speed: { gain: 24, fail: 0 }, stamina: { gain: 24, fail: 0 } }) }), sc("ura")).options;
  assert.ok(noStats.find((x) => x.stat === "speed").parts.stats > noStats.find((x) => x.stat === "stamina").parts.stats);
});

test("Grand Concert song tokens only tip close calls", () => {
  const r = E.evaluate(base({ turn: 30, facilities: facs(Object.fromEntries(E.STATS.map((s) => [s, { gain: 30, fail: 0, cards: 2 }]))) }), sc("grandlive"));
  r.options.filter((o) => o.kind === "train").forEach((o) => assert.ok(o.parts.scenario <= 0.12 * r.ctx.typ + 1e-9, o.stat));
});

// Opening deck: SSR Kitasan Black (Speed, specialty 100), Silence Suzuka (Speed 65), Curren Chan
// (Wit 65), Nishino Flower (Wit 50), Gold Ship (Stamina), Light Hello (Friend).
const openDeck = (bonds) => ({ trainee: null, slots: [30028, 30002, 30068, 30082, 30004, 30052].map((id, i) => ({ id, lb: 4, bond: bonds ? bonds[i] : null })) });
const dfac = (o) => E.STATS.map((s) => Object.assign(fac(s), { members: [], hints: [], extra: 0 }, (o || {})[s]));

test("opening: the Wit and Speed cards with the highest specialty priority are maxed first", () => {
  const info = E.deckInfo({ deck: openDeck() });
  const focus = E.focusCards(info);
  assert.deepStrictEqual(focus.map((f) => f.card.n), ["Curren Chan", "Kitasan Black"]);
  // Curren Chan alone on Wit beats three other cards building bond on Speed.
  const r = pick(base({ turn: 2, energy: 90, deck: openDeck(), facilities: dfac({ speed: { members: [1, 3, 4] }, wit: { members: [2] } }) }));
  assert.strictEqual(r.action.stat, "wit");
  assert.ok(r.reasons.some((n) => /focus card/.test(n)));
  // Kitasan Black counts wherever she shows up.
  const g = pick(base({ turn: 3, energy: 90, deck: openDeck(), facilities: dfac({ speed: { members: [1, 3, 4] }, guts: { members: [0] } }) }));
  assert.strictEqual(g.action.stat, "guts");
  // Once both are maxed, back to the training with the most cards building bond.
  const done = pick(base({ turn: 6, energy: 90, deck: openDeck([100, null, 100, null, null, null]), facilities: dfac({ speed: { members: [1, 3, 4] }, wit: { members: [2] } }) }));
  assert.strictEqual(done.action.stat, "speed");
});

test("Grand Concert: rest on turn 4 (9 turns to the debut) unless energy is very high", () => {
  const gl = sc("grandlive");
  assert.strictEqual(E.turnsToDebut(4), 9);
  const f = dfac({ speed: { members: [0, 1] }, wit: { members: [2] } });
  for (const e of [40, 60, 80]) {
    const r = E.recommend(base({ turn: 4, energy: e, mood: 2, deck: openDeck(), facilities: f }), gl);
    assert.strictEqual(r.action.kind, "rest", "energy " + e);
  }
  const high = E.recommend(base({ turn: 4, energy: 90, mood: 2, deck: openDeck(), facilities: f }), gl);
  assert.notStrictEqual(high.action.kind, "rest");
});

test("Grand Concert: train with Light Hello the first time she shows up, wherever she is", () => {
  const gl = sc("grandlive");
  const st = (guts, o) => base(Object.assign({ turn: 6, energy: 95, mood: 2, deck: openDeck(), facilities: dfac({ speed: { members: [0, 1] }, guts, wit: { members: [2] } }) }, o));
  const r = E.recommend(st({ members: [5] }), gl);
  assert.strictEqual(r.action.stat, "guts");
  assert.ok(r.reasons.some((n) => /Light Hello is here for the first time/.test(n)));
  // Her first-training event is applied on Done: +7 training and +10 event bond, mood +1.
  const next = E.advance(st({ members: [5] }), gl, r.action);
  const lh = next.deck.slots[5];
  assert.ok(lh.met);
  assert.strictEqual(lh.bond, E.deckInfo({ deck: openDeck() }).slots[5].bond + 17);
  assert.strictEqual(next.mood, 3);
  // Later on, even well after the debut, it's still her first time if you haven't trained with her.
  assert.strictEqual(E.recommend(st({ members: [5] }, { turn: 20 }), gl).action.stat, "guts");
  // Once you've trained with her, she's a normal card again.
  const metDeck = openDeck(); metDeck.slots[5].met = true;
  assert.strictEqual(E.recommend(st({ members: [5] }, { deck: metDeck }), gl).action.stat, "speed");
  // Not when her training's failure is above your limit.
  const risky = E.recommend(st({ members: [5], fail: 30 }), gl);
  assert.notStrictEqual(risky.action.stat, "guts");
});

test("Unity Cup opening: Recreation for mood by uma.guide's turn points, Riko's first training", () => {
  const u = sc("unity");
  // Kitasan Black, Silence Suzuka, Curren Chan, Nishino Flower, Gold Ship, SSR Riko Kashimoto.
  const deck = (bonds) => ({ trainee: null, slots: [30028, 30002, 30068, 30082, 30004, 30036].map((id, i) => ({ id, lb: 4, bond: bonds ? bonds[i] : null })) });
  const st = (o) => base(Object.assign({ turn: 2, energy: 80, mood: 2, deck: deck() }, o));
  // Nothing above 3 points at Normal mood after a training: Recreation.
  const weak = E.recommend(st({ facilities: dfac({ speed: { members: [1] }, stamina: { members: [4] }, wit: { members: [3] } }) }), u);
  assert.strictEqual(weak.action.kind, "recreation");
  // Four cards building bond on one training: train.
  const strong = E.recommend(st({ deck: deck([null, null, null, null, null, 30]), facilities: dfac({ speed: { members: [1, 3, 4, 5] } }) }), u);
  assert.strictEqual(strong.action.kind, "train");
  // A focus card (Curren Chan, Wit) on a training beats the Recreation rule.
  const focus = E.recommend(st({ facilities: dfac({ wit: { members: [2] }, speed: { members: [1] } }) }), u);
  assert.strictEqual(focus.action.stat, "wit");
  // Great mood already: no Recreation push.
  const great = E.recommend(st({ mood: 4, facilities: dfac({ speed: { members: [1] }, stamina: { members: [4] } }) }), u);
  assert.notStrictEqual(great.action.kind, "recreation");
  // Riko joins on turn 5: her first training (below Great) comes first, later ones don't.
  const riko = E.recommend(st({ turn: 6, mood: 3, facilities: dfac({ speed: { members: [1, 3] }, guts: { members: [5] } }) }), u);
  assert.strictEqual(riko.action.stat, "guts");
  assert.ok(riko.reasons.some((n) => /Riko Kashimoto is here/.test(n)));
  const later = E.recommend(st({ turn: 6, mood: 3, deck: deck([null, null, null, null, null, 60]), facilities: dfac({ speed: { members: [1, 3] }, guts: { members: [5] } }) }), u);
  assert.strictEqual(later.action.stat, "speed");
  // Unity's base values since the July 2026 update.
  assert.deepStrictEqual(u.train.power, [0, 4, 9, 0, 0, 4, -20]);
});

test("Trackblazer opening: Wit before the debut, and the debut costs energy", () => {
  const tb = sc("trackblazer");
  const r = E.recommend(base({ turn: 12, goalRace: true, energy: 40 }), tb);
  assert.strictEqual(r.action.kind, "race");
  assert.strictEqual(r.after.energy, 25);
  const ev = E.evaluate(base({ turn: 3, facilities: facs({ speed: { gain: 12, fail: 0 }, wit: { gain: 12, fail: 0 } }) }), tb).options;
  assert.ok(ev.find((o) => o.stat === "wit").parts.opening > 0);
  assert.ok(!ev.find((o) => o.stat === "speed").parts.opening);
  // Other scenarios' goal races stay free.
  assert.strictEqual(E.recommend(base({ turn: 12, goalRace: true, energy: 40 }), sc("unity")).after.energy, 40);
});

test("New Year: the turn plan says energy can be spent before it", () => {
  const ev = E.eventsFor(24, sc("ura"), base({ turn: 24 }));
  assert.ok(ev.some((e) => /New Year/.test(e.label) && /\+20 energy/.test(e.tip)));
  assert.ok(E.eventsFor(48, sc("ura"), base({ turn: 48 })).some((e) => /\+30 energy/.test(e.tip)));
});

test("summer camp trainings don't raise facility levels", () => {
  // Every turn up to 41 logged: Speed on the 4 Classic camp turns, rests otherwise.
  const log = [];
  for (let t = 1; t <= 40; t++) log.push(E.isCamp(t) ? { turn: t, kind: "train", stat: "speed" } : { turn: t, kind: "rest", stat: null });
  const s = base({ turn: 41, log });
  assert.strictEqual(E.facLevelFor(s, sc("ura"), "speed"), 1);
  // The same 4 Speed trainings outside camp do level it up.
  const log2 = log.map((l) => (l.turn >= 30 && l.turn <= 33 ? { turn: l.turn, kind: "train", stat: "speed" } : l.kind === "train" ? { turn: l.turn, kind: "rest", stat: null } : l));
  assert.strictEqual(E.facLevelFor(base({ turn: 41, log: log2 }), sc("ura"), "speed"), 2);
  // During camp itself every facility is level 5.
  assert.strictEqual(E.facLevelFor(base({ turn: 38, log }), sc("ura"), "speed"), 5);
});
