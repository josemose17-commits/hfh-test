// Tests for the deck optimizer, CM/LoH presets, skill values and the owned-card backup code.
const test = require("node:test");
const assert = require("node:assert");
const D = require("../deck.js");
const O = require("../optimizer.js");
const PRESETS = require("../data/presets.js");
const SV = require("../data/skillvalues/index.js");
const { SCENARIOS } = require("../scenarios.js");

const TODAY = "2026-10-06";
const ura = SCENARIOS.find((s) => s.id === "ura");
const globalCards = (r) => D.DATA.supports.filter((c) => D.onGlobal(c, TODAY) && (!r || c.r === r));
const pick = (pred) => D.DATA.supports.find(pred);

test("every card and trainee has a character id, so duplicates can be blocked", () => {
  assert.ok(D.DATA.supports.every((c) => c.cid > 0));
  assert.ok(D.DATA.trainees.every((t) => t.cid > 0));
});

test("optimizer returns 6 legal cards: no character twice, never the trainee's own character", () => {
  const trainee = D.DATA.trainees.find((t) => t.en && globalCards(3).some((c) => c.cid === t.cid));
  const pool = globalCards(3).slice(0, 60).concat(globalCards(3).filter((c) => c.cid === trainee.cid)).map((c) => ({ id: c.id, lb: 4 }));
  const r = O.runJob({ job: "optimize", opts: { scenario: "ura", build: "medium", trainee: trainee.id, runs: 4 }, pool, borrowPool: [] });
  assert.strictEqual(r.cards.length, 6);
  const cids = r.cards.map((c) => D.card(c.id).cid);
  assert.strictEqual(new Set(cids).size, 6, "a character appears twice");
  assert.ok(!cids.includes(trainee.cid), "the trainee's own character is in the deck");
});

test("locked cards stay in the deck and the borrowed card fills the last slot", () => {
  const pool = globalCards(3).slice(0, 40).map((c) => ({ id: c.id, lb: 3 }));
  const lock = pool[pool.length - 1].id;
  const borrow = globalCards(3).slice(40, 80).map((c) => ({ id: c.id, lb: 4 }));
  const r = O.runJob({ job: "optimize", opts: { scenario: "ura", build: "mile", runs: 4, locked: [lock], borrow: true }, pool, borrowPool: borrow });
  assert.ok(r.cards.some((c) => c.id === lock));
  assert.strictEqual(r.cards.filter((c) => c.borrowed).length, 1);
  assert.strictEqual(r.cards.find((c) => c.borrowed).lb, 4);
});

test("a better limit break never scores lower", () => {
  const card = pick((c) => c.id === 30028) || globalCards(3)[0];
  const others = globalCards(3).filter((c) => c.cid !== card.cid).slice(0, 5).map((c) => ({ card: c, lb: 4 }));
  const ctx = O.buildCtx({ scenario: ura, build: "medium", runs: 6 });
  const low = O.simulate(Object.assign({}, ctx), others.concat([{ card, lb: 0 }])).value;
  const high = O.simulate(Object.assign({}, ctx), others.concat([{ card, lb: 4 }])).value;
  assert.ok(high >= low, `LB4 ${high} < LB0 ${low}`);
});

test("simulated careers rest, race and spread training like a real run", () => {
  const deck = globalCards(3).filter((c) => ["speed", "stamina", "power", "wit"].includes(c.ty)).slice(0, 6).map((c) => ({ card: c, lb: 4 }));
  const r = O.simulate(O.buildCtx({ scenario: ura, build: "medium", runs: 8 }), deck);
  assert.ok(r.rests >= 4 && r.rests <= 25, "rests " + r.rests);
  assert.ok(r.races >= 2, "races " + r.races);
  assert.ok(r.stats.every((x) => x > 150), "stats " + r.stats);
});

test("skill values raise a deck whose cards hint skills that are good on the course", () => {
  const card = globalCards(3).find((c) => (c.hs || []).length);
  const others = globalCards(3).filter((c) => c.cid !== card.cid).slice(0, 5).map((c) => ({ card: c, lb: 4 }));
  const deck = others.concat([{ card, lb: 4 }]);
  const skills = {};
  card.hs.forEach((id) => { skills[id] = 2.0; });
  const base = O.simulate(O.buildCtx({ scenario: ura, build: "medium", runs: 4 }), deck);
  const withSkills = O.simulate(O.buildCtx({ scenario: ura, build: "medium", runs: 4, skills }), deck);
  assert.ok(withSkills.value > base.value);
  assert.ok(withSkills.skills.some((s) => card.hs.includes(+s.id) && s.p > 0));
});

test("wishlist only suggests swaps that improve the deck", () => {
  const pool = globalCards(2).slice(0, 12).map((c) => ({ id: c.id, lb: 0 }));
  const opt = O.runJob({ job: "optimize", opts: { scenario: "ura", build: "medium", runs: 4 }, pool, borrowPool: [] });
  const candidates = globalCards(3).slice(0, 25).map((c) => ({ id: c.id, lb: 4 }));
  const w = O.runJob({ job: "wishlist", opts: { scenario: "ura", build: "medium", runs: 4 }, deck: opt.cards, candidates, swapSlots: [0, 1] });
  assert.ok(w.list.length > 0, "SSRs at LB4 should beat LB0 SRs");
  assert.ok(w.list.every((x) => x.gain > 0));
});

test("presets: every CM has a course, dates and a build; Global dates run in order", () => {
  const cms = PRESETS.list.filter((p) => p.kind === "cm").sort((a, b) => a.no - b.no);
  assert.ok(cms.length >= 49);
  cms.forEach((p) => {
    assert.ok(p.course.id && p.course.distance && p.course.track, p.id);
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(p.global.start) && p.global.end >= p.global.start, p.id);
    assert.ok(["sprint", "mile", "medium", "long", "dirt"].includes(p.build), p.id);
  });
  for (let i = 1; i < cms.length; i++) assert.ok(cms[i].global.start > cms[i - 1].global.start, cms[i].id + " is out of order");
  const sag = cms.find((p) => p.no === 20);
  assert.strictEqual(sag.name, "Sagittarius Cup 2");
  assert.strictEqual(sag.global.start, "2026-10-07");
  assert.strictEqual(sag.course.track, "Nakayama");
  assert.strictEqual(sag.course.distance, 2500);
  assert.ok(!sag.global.est);
  assert.ok(cms.filter((p) => p.no > 21).every((p) => p.global.est), "unannounced cups must be marked as estimates");
  const loh = PRESETS.list.filter((p) => p.kind === "loh");
  assert.ok(loh.length >= 5 && loh.every((p) => p.global.est && p.jp.start));
});

test("skill values: ready presets exist on disk with every running style", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  assert.ok(SV.ready.length >= 1);
  SV.ready.forEach((id) => {
    const v = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "skillvalues", id + ".json"), "utf8"));
    SV.meta.strategies.forEach((st) => {
      assert.ok(Array.isArray(v[st]) && v[st].length > 20, id + " " + st);
      v[st].forEach(([sid]) => assert.ok(SV.skills[sid], "no name for skill " + sid));
    });
  });
});

test("owned-card backup code round-trips and rejects junk", () => {
  const ids = globalCards(3).slice(0, 5).map((c) => c.id);
  const owned = { [ids[0]]: 0, [ids[1]]: 4, [ids[2]]: 2 };
  const code = D.encodeOwned(owned);
  assert.ok(code.startsWith("UMA1:"));
  assert.deepStrictEqual(D.decodeOwned(code), Object.fromEntries(Object.entries(owned).map(([k, v]) => [k, v])));
  assert.strictEqual(D.decodeOwned("hello"), null);
  assert.deepStrictEqual(D.decodeOwned("UMA1:zzzzzz9"), {});
});

test("pasted Umalator charts are read by median, including names on their own line", () => {
  const names = { 202481: "Beast Mode", 200012: "Right-Handed ○", 900681: "Victory Cheer! (inherited)" };
  const text = "Skill name\tMinimum\tMaximum\tMean\tMedian\tSP Cost\nBeast Mode\t3.86 L\t4.00 L\t3.93 L\t3.92 L\t180\nRight-Handed ○\n0.40 L\t0.45 L\t0.43 L\t0.44 L\t90\nVictory Cheer!\t1.80 L\t2.10 L\t1.95 L\t1.96 L\nMystery\t1 L\t1 L\t1 L\t1 L";
  const r = O.parseChart(text, names);
  assert.strictEqual(r.values[202481], 3.92);
  assert.strictEqual(r.values[200012], 0.44);
  assert.strictEqual(r.values[900681], 1.96);
  assert.strictEqual(r.unknown, 1);
});

test("tier list ranks every limit break, never lower for a higher LB, and skips characters already in the deck", () => {
  const speed = globalCards(3).filter((c) => c.ty === "speed").slice(0, 8);
  const candidates = [];
  speed.forEach((c) => { for (let lb = 0; lb <= 4; lb++) candidates.push({ id: c.id, lb }); });
  const deck = [{ id: speed[0].id, lb: 4 }];
  const r = O.runJob({ job: "tiers", opts: { scenario: "ura", build: "mile", runs: 6 }, deck, candidates });
  assert.ok(!r.list.some((x) => D.card(x.id).cid === speed[0].cid), "a card of a character already in the deck was ranked");
  assert.strictEqual(r.list.length, (speed.length - 1) * 5);
  const by = {};
  r.list.forEach((x) => { (by[x.id] = by[x.id] || [])[x.lb] = x.score; });
  Object.values(by).forEach((a) => { for (let i = 1; i < 5; i++) assert.ok(a[i] >= a[i - 1]); });
  for (let i = 1; i < r.list.length; i++) assert.ok(r.list[i].score <= r.list[i - 1].score);
});

test("event rewards: listed cards use the event table, others the rarity fallback", () => {
  const listed = D.DATA.supports.find((c) => c.ev);
  const ev = D.eventRewards(listed);
  assert.ok(ev.known && ev.bond === listed.ev[7] && ev.sp === listed.ev[5] && ev.energy === listed.ev[6]);
  const missing = D.DATA.supports.find((c) => !c.ev && c.r === 3);
  assert.deepStrictEqual(D.eventRewards(missing), { stats: [9, 9, 9, 9, 9], sp: 0, energy: 0, bond: 5, known: false });
});
