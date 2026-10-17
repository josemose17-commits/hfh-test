const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../deck.js");
const S = require("../skill-events.js");
const E = require("../engine.js");
const O = require("../optimizer.js");
const GC = require("../grand-concert.js");
const T = require("../tiers.js");
const data = require("../data/card-events.js");
const sc = require("../scenarios.js").SCENARIOS.find((s) => s.id === "grandlive");
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
const context = (skills) => ({ skills, known: new Set(), costs: {}, must: [] });
const ids = [30002, 30016, 30010, 30043, 30078, 30052];
const cards = ids.map((id) => ({ id, lb: 4 }));
function synthetic(id, events) {
  const chain = events.map((e, i) => id * 10 + i);
  data.cards[id] = { chain };
  chain.forEach((eid, i) => { data.events[eid] = events[i]; });
  return { card: { id, r: 3, ty: "speed", es: [900001, 900002] }, cleanup: () => { delete data.cards[id]; chain.forEach((id) => delete data.events[id]); } };
}

test("exclusive outcome distributions keep conditional hint levels without rounding", () => {
  const offers = D.skillOffers();
  offers.exclusive([{ p: 0.4, levels: { 1: 1 } }, { p: 0.6, levels: { 1: 3 } }], 1);
  const skill = offers.values()[0]; close(skill.p, 1); close(skill.expectedDiscount, 0.22);
});

test("chain arrival stages are nested and preserve the final completion prior", () => {
  const p = S.reach(3, 0.8);
  assert.equal(p[0], 1); assert.ok(p[1] >= p[2] && p[2] >= p[3]); close(p[3], 0.8);
  const boosted = S.reach(3, 0.8, 1.3);
  assert.ok(boosted[3] > p[3] && boosted[3] <= 1);
});

test("Fine Motion's success and failure rewards are exclusive, with their recorded hint levels", () => {
  const offers = D.skillOffers(); S.add(offers, D.card(30010), context({ 200581: 2, 200582: 1 }), { success: 0.5 });
  const list = offers.values(), gold = list.find((s) => s.id === "200581"), white = list.find((s) => s.id === "200582");
  close(gold.eventP, 0.4); close(white.eventP, 0.4);
  close(gold.conditionalDiscount, 0.3); close(white.conditionalDiscount, 0.1);
  const m = S.model(D.card(30010), context({ 200581: 2, 200582: 1 }));
  assert.ok(m.groups[0].outcomes.every((o) => !(o.levels[200581] && o.levels[200582])));
});

test("conditional success settings affect only the corresponding reward branches", () => {
  const ctx = context({ 200581: 2, 200582: 1 });
  const low = D.skillOffers(), high = D.skillOffers();
  S.add(low, D.card(30010), ctx, { success: 0 }); S.add(high, D.card(30010), ctx, { success: 1 });
  assert.equal(low.values().some((s) => s.id === "200581"), false);
  close(high.values().find((s) => s.id === "200581").p, 0.8);
});

test("an event choice cannot simultaneously supply two mutually exclusive targeted skills", () => {
  const s = synthetic(987001, [{ c: [{ h: [[900001, 1]] }, { h: [[900002, 1]] }] }]);
  try {
    const offers = D.skillOffers(); S.add(offers, s.card, context({ 900001: 1, 900002: 2 }));
    assert.equal(offers.values().some((x) => x.id === "900001"), false);
    close(offers.values().find((x) => x.id === "900002").p, 0.8);
    const must = D.skillOffers(); S.add(must, s.card, Object.assign(context({ 900001: 1, 900002: 2 }), { must: [900001] }));
    assert.equal(must.values()[0].id, "900001");
  } finally { s.cleanup(); }
});

test("chain-ending choices trade their immediate reward against later targeted skills", () => {
  const s = synthetic(987002, [{ c: [{ h: [[900001, 1]], end: true }, {}] }, { c: [{}] }, { c: [{ h: [[900002, 3]] }] }]);
  try {
    const offers = D.skillOffers(); S.add(offers, s.card, context({ 900001: 0.1, 900002: 2 }));
    assert.equal(offers.values().some((x) => x.id === "900001"), false);
    close(offers.values().find((x) => x.id === "900002").p, 0.8);
    const early = D.skillOffers(); S.add(early, s.card, context({ 900001: 10 }));
    assert.equal(early.values().some((x) => x.id === "900002"), false);
  } finally { s.cleanup(); }
});

test("a repeated skill on nested chain steps does not get an independent extra availability chance", () => {
  const s = synthetic(987003, [{ c: [{ h: [[900001, 1]] }] }, { c: [{}] }, { c: [{ h: [[900001, 3]] }] }]);
  try {
    const offers = D.skillOffers(); S.add(offers, s.card, context({ 900001: 2 }));
    const p = S.reach(3, 0.8), skill = offers.values()[0];
    close(skill.p, p[1]); close(skill.expectedDiscount, p[1] * 0.1 + p[3] * 0.25);
    assert.equal(skill.lv, 4, "the two earned hint levels accumulate");
  } finally { s.cleanup(); }
});

test("independent hint opportunities accumulate and cap at level five", () => {
  const offers = D.skillOffers(); offers.add(1, 1, 1, 1); offers.add(1, 1, 2, 2, "training");
  close(offers.values()[0].conditionalDiscount, 0.3);
  offers.add(1, 1, 5, 3); close(offers.values()[0].conditionalDiscount, 0.4);
});

test("frequent hints retain repeated discount gains and respect the hint-pool denominator", () => {
  const one = D.skillOffers(), many = D.skillOffers(), wide = D.skillOffers();
  one.trainingHints(1, 0.5, 1, 1); many.trainingHints(1, 4, 1, 1); wide.trainingHints(1, 4 / 8, 1, 1);
  const a = one.values()[0], b = many.values()[0];
  close(a.p, 1 - Math.exp(-0.5)); assert.ok(b.conditionalDiscount > a.conditionalDiscount);
  assert.ok(b.conditionalDiscount <= 0.4); close(wide.values()[0].expectedDiscount, a.expectedDiscount);
});

test("missing event results retain an explicit fallback instead of deleting a possible skill", () => {
  const card = D.card(10008), m = S.model(card, context({ 202992: 2 }));
  assert.ok(m.fallback.includes("202992"));
  const offers = D.skillOffers(); S.add(offers, card, context({ 202992: 2 }));
  close(offers.values().find((x) => x.id === "202992").p, 0.5);
});

test("ordinary non-chain events do not receive the experimental chain-song multiplier", () => {
  const ctx = context({ 200532: 2 }), low = D.skillOffers(), high = D.skillOffers();
  S.add(low, D.card(10004), ctx, { multiplier: 1 }); S.add(high, D.card(10004), ctx, { multiplier: 3 });
  assert.deepEqual(low.values(), high.values());
});

test("event-song levels queue until the concert and count exposure only on subsequent turns", () => {
  const live = GC.create({ sc, w: E.BUILDS.medium.w }, () => 0);
  const song = sc.songs.find((s) => s.id === "tachiichi");
  live.state.tokens = song.cost.slice(); live.state.shop = { kind: "song", offers: [song] };
  live.start(24, () => {}); live.shop(24, 100, 100, () => {});
  assert.equal(live.state.eventLevel, 0); assert.equal(live.state.pendingEventLevel, 1);
  assert.equal(live.state.eventLevelTurns, 0);
  live.end(24, () => {}); assert.equal(live.state.eventLevel, 1);
  live.start(25, () => {}); assert.equal(live.state.eventLevelTurns, 1);
});

test("simulation applies optional song exposure to chain skills without changing recorded hints or stats", () => {
  const simCards = cards.map((x) => ({ card: D.card(x.id), lb: x.lb }));
  const base = { scenario: sc, build: "medium", runs: 4, skills: { 200581: 2 } };
  const a = O.simulate(O.buildCtx(base), simCards);
  const b = O.simulate(O.buildCtx(Object.assign({}, base, { eventSongBoost: 0.1 })), simCards);
  assert.ok(a.grandConcert.eventLevelExposure > 0);
  assert.deepEqual(a.stats, b.stats); assert.deepEqual(a.hints, b.hints);
  const sa = a.skills.find((s) => s.id === "200581"), sb = b.skills.find((s) => s.id === "200581");
  assert.ok(sb.eventP > sa.eventP); close(sa.trainingP, sb.trainingP);
  assert.equal(a.eventModel.songBoost, 0); assert.ok(a.eventModel.coverage.length > 0);
});

test("tier scoring shares the event path model while keeping training hints separate", () => {
  const result = T.skillValue([{ id: 30010, lb: 4 }], Object.assign(context({ 200581: 2 }), { speedWeight: 1, spWeight: 0.35 }));
  const gold = result.list.find((x) => x.id === "200581");
  close(gold.eventP, 0.4); assert.equal(gold.trainingP, 0);
});

test("an alternative losing a required skill is flagged even when another skill's probability improves", () => {
  const opts = { scenario: "GL", skills: {}, must: [200712, 200532] };
  const deck = [30002, 30016, 30010, 30043, 30078, 30052].map((id) => ({ id, lb: 4 }));
  const replacement = { id: 10004, lb: 4 };
  const before = T.deckSkills(opts, deck), after = T.deckSkills(opts, deck.slice(1).concat([replacement]));
  assert.ok(before.mustValue - after.mustValue < 1000000, "a score-threshold check would miss this lost coverage");
  assert.equal(after.must.find((x) => x.id === "200712").p, 0);
  const result = T.describeDeck(opts, deck, deck.concat([replacement]), []);
  assert.equal(result.cards[0].alt.losesMust, true);
});

test("paired sensitivity is reproducible, uses held-out seeds and treats identical decks as ties", () => {
  const sim = { scenario: sc, build: "medium", skills: { 200581: 2 } };
  const candidates = [{ name: "Selected", cards }, { name: "Same, reversed", cards: cards.slice().reverse() }];
  const config = { runs: 2, seeds: [857563, 962293] };
  const before = JSON.stringify({ sim, candidates, config });
  const run = () => { const job = O.sensitivity(sim, candidates, config); assert.throws(() => job.result(), /still running/); while (job.next()) {} return job.result(); };
  const a = run(), b = run(); assert.deepEqual(a, b);
  assert.equal(a.profiles.length, 7);
  assert.deepEqual(a.seeds, config.seeds);
  a.comparisons.forEach((c) => { close(c.meanDelta, 0); assert.equal(c.ties, 2); assert.equal(c.wins, 0); });
  assert.equal(JSON.stringify({ sim, candidates, config }), before);
});
