const test = require("node:test");
const assert = require("node:assert/strict");
const B = require("../skill-budget.js");
const O = require("../optimizer.js");
const D = require("../deck.js");
const Events = require("../skill-events.js");
const { SCENARIOS } = require("../scenarios.js");
const sc = SCENARIOS.find((s) => s.id === "grandlive");
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
const custom = (skills, metadata, extra = {}) => B.create(Object.assign({ skills, metadata }, extra));

test("hint discounts use integer percentages and floor each tier independently", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((lv) => B.discounted(180, lv)), [180, 162, 144, 126, 117, 108]);
  assert.equal(B.discounted(90, 3), 63);
  assert.equal(B.discounted(103, 4), 66);
  assert.equal(B.discounted(180, 9), 108);
});

test("gold costs include an undiscounted white prerequisite when only gold is hinted", () => {
  const p = B.create({ skills: { 200331: 4, 200332: 1 } });
  const low = p.solve({ 200331: 3 }, 305), enough = p.solve({ 200331: 3 }, 306);
  assert.equal(low.selected[0].id, "200332", "a gold hint also unlocks its white prerequisite");
  assert.equal(low.spent, 180);
  assert.deepEqual(enough.selected.map((o) => o.id), ["200331"]);
  assert.equal(enough.spent, 306);
  assert.deepEqual(enough.selected[0].tiers.map((t) => [t.id, t.hint, t.cost]), [["200332", 0, 180], ["200331", 3, 126]]);
  assert.equal(enough.L, 4, "gold replaces the white gain");
});

test("gold and lower tiers retain their own cumulative hint discounts", () => {
  const p = B.create({ skills: { 200331: 4, 200332: 1 } });
  const result = p.solve({ 200331: 3, 200332: 5 }, 234);
  assert.equal(result.spent, 234);
  assert.equal(result.selected[0].id, "200331");
});

test("green double-circle and gold upgrades pay all tiers without stacking race gains", () => {
  const p = B.create({ skills: { 200012: 0.4, 200011: 0.7, 200014: 1.2 } });
  assert.deepEqual(p.chain("200014"), ["200012", "200011", "200014"]);
  const result = p.solve({ 200014: 1 }, 317);
  assert.equal(result.selected.length, 1); assert.equal(result.L, 1.2); assert.equal(result.spent, 317);
  assert.deepEqual(p.solve({ 200014: 1 }, 316).selected.map((s) => s.id), ["200011"]);
});

test("single-circle offers unlock double-circle purchases without inventing a gold hint", () => {
  const p = B.create({ skills: { 200012: 0.4, 200011: 0.7, 200014: 1.2 } });
  const result = p.solve({ 200012: 3 }, 173);
  assert.deepEqual(result.selected.map((s) => s.id), ["200011"]);
  assert.equal(result.spent, 63 + 110, "the ○ discount does not invent an independent ◎ hint");
  assert.equal(result.offered.includes("200014"), false);
  assert.deepEqual(B.create({ skills: { 200011: 0.7 }, learned: [200012] }).solve({}, 110).selected.map((s) => s.id), ["200011"]);
});

test("base prices used by the race table include all required tiers", () => {
  assert.equal(B.baseCost(200331), 360); assert.equal(B.baseCost(200332), 180);
  assert.equal(B.baseCost(200011), 200); assert.equal(B.baseCost(200014), 330);
  assert.equal(B.baseCost("missing"), null);
});

test("an already learned lower tier pays only the upgrade and gains only the difference", () => {
  const p = B.create({ skills: { 200331: 4, 200332: 1 }, learned: [200332] });
  const result = p.solve({ 200331: 3 }, 126);
  assert.equal(result.spent, 126); assert.equal(result.L, 3);
  assert.deepEqual(result.selected[0].tiers.map((s) => s.id), ["200331"]);
});

test("innate availability costs SP and card hints can reduce that cost", () => {
  const p = B.create({ skills: { 200332: 1 }, available: [200332] });
  assert.equal(p.solve({}, 179).selected.length, 0);
  assert.equal(p.solve({}, 180).spent, 180);
  assert.equal(p.solve({ 200332: 5 }, 108).spent, 108);
  assert.ok(p.hintUtility({ 200332: 5 }) > 0, "an innate hint still saves SP");
});

test("budget selection can prefer two smaller skills to one individually stronger skill", () => {
  const p = custom({ 1: 5, 2: 3, 3: 3 }, { 1: ["a", 150, null], 2: ["b", 100, null], 3: ["c", 100, null] }, { available: [1, 2, 3] });
  const result = p.solve({}, 200);
  assert.deepEqual(result.selected.map((s) => s.id), ["2", "3"]); assert.equal(result.L, 6); assert.equal(result.spent, 200);
});

test("more than eight affordable skill families count fully", () => {
  const metadata = {}, skills = {}, available = [];
  for (let id = 1; id <= 12; id++) { metadata[id] = [String(id), 50, null]; skills[id] = 1; available.push(id); }
  const result = custom(skills, metadata, { available }).solve({}, 600);
  assert.equal(result.selected.length, 12); assert.equal(result.L, 12); assert.equal(result.value, 720);
});

test("SP cannot be spent in expectation on a fractional expensive skill", () => {
  const p = custom({ 1: 10 }, { 1: ["a", 500, null] });
  assert.equal(p.solve({ 1: 1 }, 449).selected.length, 0);
  assert.equal(p.solve({ 1: 1 }, 450).spent, 450);
});

test("must-haves receive affordable purchase priority and shortfalls are explicit", () => {
  const p = custom({ 1: 1, 2: 100 }, { 1: ["a", 100, null], 2: ["b", 100, null] }, { available: [1, 2], must: [1] });
  assert.deepEqual(p.solve({}, 100).selected.map((o) => o.id), ["1"]);
  assert.deepEqual(p.solve({}, 99).unmetMust, ["1"]);
  const absentValue = custom({}, { 1: ["a", 100, null] }, { available: [1], must: [1] }).solve({}, 100);
  assert.equal(absentValue.spent, 100); assert.deepEqual(absentValue.unmetMust, []);
});

test("zero budgets, free skills and equal-gain ties have consistent spending", () => {
  const p = custom({ 1: 2, 2: 2, 3: 1 }, { 1: ["a", 100, null], 2: ["a", 80, null], 3: ["b", 0, null] }, { available: [1, 2, 3] });
  const free = p.solve({}, 0); assert.equal(free.L, 1); assert.equal(free.spent, 0);
  const cheap = p.solve({}, 150); assert.deepEqual(cheap.selected.map((o) => o.id), ["2", "3"]); assert.equal(cheap.unspent, 70);
  assert.equal(p.solve({}, -10).budget, 0);
});

test("unknown, broken and cyclic prerequisite data are excluded rather than priced by guess", () => {
  const p = custom({ 1: 5, 2: 5, 3: 5 }, { 1: ["a", 100, "2"], 2: ["a", 100, "1"] }, { available: [1, 2, 3] });
  const result = p.solve({}, 1000); assert.equal(result.spent, 0); assert.deepEqual(result.unsupported, ["1", "2", "3"]);
});

test("knapsack agrees with exhaustive enumeration over small families and budgets", () => {
  let seed = 5; const random = () => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296);
  for (let example = 0; example < 35; example++) {
    const metadata = {}, skills = {}, available = [];
    for (let g = 0; g < 5; g++) for (let k = 0; k < 2; k++) {
      const id = String(g * 2 + k + 1); metadata[id] = [String(g), 10 + Math.floor(random() * 70), null]; skills[id] = 1 + Math.floor(random() * 12); available.push(id);
    }
    const p = custom(skills, metadata, { available });
    const groups = p.options({}), budget = Math.floor(random() * 250);
    let bestL = 0, bestCost = 0;
    function enumerate(g, cost, L) {
      if (cost > budget) return;
      if (g === groups.length) { if (L > bestL || L === bestL && cost < bestCost) { bestL = L; bestCost = cost; } return; }
      enumerate(g + 1, cost, L); groups[g].forEach((s) => enumerate(g + 1, cost + s.cost, L + s.L));
    }
    enumerate(0, 0, 0);
    const result = p.solve({}, budget);
    assert.equal(result.L, bestL); assert.equal(result.spent, bestCost); assert.equal(result.selected.reduce((n, s) => n + s.cost, 0), bestCost);
  }
});

test("generated purchase facts cover every positive currently released Global support skill", () => {
  const ids = new Set(D.DATA.supports.filter((c) => D.onGlobal(c, "2026-10-17")).flatMap((c) => (c.hs || []).concat(c.es || [])));
  ids.forEach((id) => assert.ok(B.DATA.skills[id] || B.DATA.negative.includes(String(id)), "Missing " + id));
  const p = B.create({}); Object.keys(B.DATA.skills).forEach((id) => assert.ok(p.chain(id), "Broken family " + id));
});

test("budget event screening counts an upgraded family's gain once and innate hints as savings", () => {
  const p = B.create({ skills: { 200331: 4, 200332: 1 } });
  const both = p.hintUtility({ 200331: 3, 200332: 1 });
  close(both, 4 * 60 + (54 + 18) * 0.35);
  const card = { id: 987654, r: 3, ty: "speed", es: [200331] };
  const ctx = { skills: { 200331: 4 }, known: new Set(), eventUtility: () => 1, eventUtilityKey: "one" };
  const a = Events.model(card, ctx); const b = Events.model(card, Object.assign({}, ctx, { eventUtilityKey: "two" }));
  assert.notEqual(a, b, "purchase context participates in event-model memoization");
});

test("Grand Concert careers obey individual budgets and preserve complete exclusive reward routes", () => {
  const cards = [30002, 30016, 30010, 30043, 30078, 30052].map((id) => ({ card: D.card(id), lb: 4 }));
  const skills = Object.fromEntries(require("../data/skillvalues/cm20.json").Senkou.map(([id, L]) => [id, L / 100]));
  Object.assign(skills, { 200581: 5, 200582: 1 });
  const opts = { scenario: sc, build: "long", trainee: 100101, skills, runs: 12, must: [200581] };
  const ctx = O.buildCtx(opts), before = JSON.stringify(opts);
  const result = O.simulate(ctx, cards), reversed = O.simulate(ctx, cards.slice().reverse());
  assert.deepEqual(result.skillBudget, reversed.skillBudget);
  assert.equal(result.skillBudget.plans.length, 12);
  result.skillBudget.plans.forEach((plan) => {
    assert.ok(plan.spent <= plan.budget); assert.equal(plan.spent + plan.unspent, plan.budget);
    assert.equal(plan.selected.reduce((n, s) => n + s.cost, 0), plan.spent);
    assert.equal(new Set(plan.selected.map((s) => s.family)).size, plan.selected.length);
    assert.ok(!(plan.hintLevels[200581] && plan.hintLevels[200582]), "Fine Motion's alternative gold and white rewards cannot both occur");
    plan.selected.forEach((s) => s.tiers.forEach((tier) => assert.equal(tier.cost, B.discounted(B.DATA.skills[tier.id][1], plan.hintLevels[tier.id] || 0))));
  });
  close(result.skillValue, result.skillBudget.L * O.L_VALUE);
  close(result.value, result.trainValue + result.skillValue);
  close(O.targetFit(ctx, result.stats, 0).value, O.targetFit(ctx, result.stats, 9999).value);
  assert.equal(JSON.stringify(opts), before);
});

test("trainee purchase availability does not depend on a support hint or pretend to be free", () => {
  const result = O.simulate(O.buildCtx({ scenario: sc, build: "medium", trainee: 100101, skills: { 200512: 2 }, runs: 2 }), []);
  assert.equal(result.skills[0].innate, true); assert.equal(result.skills[0].selectedP, 1);
  assert.equal(result.skillBudget.spent, D.skillCost(200512));
});

test("unaffordable prerequisite costs reduce the final deck score without altering career gains", () => {
  const card = Object.assign({}, D.card(30010), { hs: [], es: [200581] });
  const opts = { scenario: sc, build: "medium", runs: 16, skills: { 200581: 4 }, eventSuccessRate: 1 };
  const a = O.simulate(O.buildCtx(opts), [{ card, lb: 4 }]);
  const b = O.simulate(O.buildCtx(Object.assign({}, opts, { costs: { 200582: 10000 } })), [{ card, lb: 4 }]);
  assert.ok(a.skillValue > 0); assert.equal(b.skillValue, 0);
  assert.deepEqual(a.stats, b.stats); assert.equal(a.sp, b.sp); assert.deepEqual(a.hints, b.hints);
  assert.ok(a.value > b.value); assert.equal(b.skillBudget.spent, 0);
});

test("parent and other-scenario simulation retain their existing SP objective", () => {
  const parent = O.buildCtx({ scenario: sc, build: "medium", skillBudget: false });
  assert.equal(O.simulate(parent, []).skillBudget, null);
  close(O.targetFit(parent, [100, 100, 100, 100, 100], 100).value - O.targetFit(parent, [100, 100, 100, 100, 100], 0).value, 35);
  const ura = O.buildCtx({ scenario: SCENARIOS.find((s) => s.id === "ura"), build: "medium" });
  assert.equal(ura.skillBudget, false);
});
