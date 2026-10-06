// Tests for the Euophrys-based tier list and deck builder (tiers.js).
const test = require("node:test");
const assert = require("node:assert");
const D = require("../deck.js");
const T = require("../tiers.js");
const EU = require("../vendor/euophrys.js");
const CARDS = require("../data/euophrys-cards.js");

const TODAY = "2026-10-06";
const glob = D.DATA.supports.filter((c) => D.onGlobal(c, TODAY));
const allLbs = (ty) => { const out = []; glob.filter((c) => c.ty === ty).forEach((c) => { for (let lb = 0; lb <= 4; lb++) out.push({ id: c.id, lb }); }); return out; };

test("Euophrys' data covers every Global card", () => {
  const ids = new Set(CARDS.map((c) => c.id));
  assert.deepStrictEqual(glob.filter((c) => !ids.has(c.id)).map((c) => c.n), []);
});

test("with skills off, the score is exactly Euophrys' score", () => {
  for (const scen of ["URA", "Aoharu", "MANT", "GL", "GM"]) {
    const s = EU.getScenario("gl", scen);
    const w = Object.assign({}, s.general, s.speed, { type: 0 });
    const deck = [{ id: 30028, lb: 4 }];
    const theirs = EU.processCards(CARDS.filter((c) => c.type === 0 && c.id !== 30028), w, [CARDS.find((c) => c.id === 30028 && c.limit_break === 4)]);
    const mine = T.rank({ scenario: scen, skillWeight: 0 }, "speed", deck, allLbs("speed"));
    const by = new Map(theirs.map((x) => [x.id + ":" + x.lb, x.score]));
    mine.forEach((x) => assert.ok(Math.abs(x.score - by.get(x.id + ":" + x.lb)) < 1e-9, scen + " " + x.id));
  }
});

test("a card that hints a strong skill on the race moves up when skills count", () => {
  const card = glob.find((c) => c.ty === "speed" && c.r === 3 && (c.hs || []).length);
  const skills = {};
  card.hs.forEach((id) => { skills[id] = 2.5; });
  const before = T.rank({ scenario: "GL", skillWeight: 0 }, "speed", [], allLbs("speed")).find((x) => x.id === card.id && x.lb === 4);
  const after = T.rank({ scenario: "GL", skillWeight: 1, skills }, "speed", [], allLbs("speed")).find((x) => x.id === card.id && x.lb === 4);
  assert.strictEqual(after.base, before.base);
  assert.ok(after.skill > 0 && after.score > before.score);
});

test("skills already in the deck or known by the trainee add nothing", () => {
  const card = glob.find((c) => c.ty === "speed" && c.r === 3 && (c.hs || []).length);
  const skills = { [card.hs[0]]: 2.5 };
  const twin = glob.find((c) => c.id !== card.id && c.cid !== card.cid && (c.hs || []).includes(card.hs[0]));
  const solo = T.rank({ scenario: "GL", skills }, "speed", [], [{ id: card.id, lb: 4 }])[0];
  if (twin) {
    const covered = T.rank({ scenario: "GL", skills }, "speed", [{ id: twin.id, lb: 4 }], [{ id: card.id, lb: 4 }])[0];
    assert.ok(covered.skill < solo.skill);
  }
  assert.ok(solo.skill > 0);
});

test("deck builder keeps to the makeup, never repeats a character, and fills the borrow slot", () => {
  const pool = glob.filter((c) => c.r >= 2).map((c) => ({ id: c.id, lb: 4 }));
  const borrow = glob.filter((c) => c.r === 3).map((c) => ({ id: c.id, lb: 4 }));
  const comp = { speed: 2, stamina: 2, wit: 1, friend: 1 };
  const r = T.buildDeck({ scenario: "GL", borrow: true, comp }, pool, borrow);
  const n = {};
  r.cards.forEach((c) => { const t = D.card(c.id).ty; n[t] = (n[t] || 0) + 1; });
  assert.deepStrictEqual(n, comp);
  assert.strictEqual(new Set(r.cards.map((c) => D.card(c.id).cid)).size, 6);
  assert.strictEqual(r.cards.filter((c) => c.borrowed).length, 1);
  assert.throws(() => T.buildDeck({ scenario: "GL", comp: { group: 6 } }, pool.slice(0, 30), []), /Not enough cards/);
});

test("the trainee's own character is never picked", () => {
  const tr = D.DATA.trainees.find((t) => t.en && glob.some((c) => c.cid === t.cid && c.r === 3 && c.ty === "speed"));
  const pool = glob.filter((c) => c.r >= 2).map((c) => ({ id: c.id, lb: 4 }));
  const r = T.buildDeck({ scenario: "URA", trainee: tr.id, comp: { speed: 4 } }, pool, []);
  assert.ok(r.cards.every((c) => D.card(c.id).cid !== tr.cid));
});

test("parent decks: debuff targets follow the race's distance and the runner's style", () => {
  const X = require("../data/debuffs.js");
  const P = require("../data/presets.js");
  const long = P.list.find((p) => p.course.dist === "Long" && p.course.surface === "Turf");
  const sprint = P.list.find((p) => p.course.dist === "Sprint");
  const name = (t) => Object.keys(t).map((id) => X[id].n);
  const tl = T.parentTargets("debuff", long, "Senkou", {}, X);
  const ts = T.parentTargets("debuff", sprint, "Oikomi", {}, X);
  assert.ok(name(tl).includes("Stamina Eater") && !name(tl).includes("Intimidate"));
  assert.ok(name(ts).includes("Intimidate") && !name(ts).includes("Stamina Eater"));
  assert.ok(name(ts).includes("Intense Gaze") && !name(tl).includes("Intense Gaze"), "End Closer-only debuffs follow the style");
  assert.ok(!name(tl).includes("Dust Cloud"), "dirt-only debuffs are left out on turf");
});

test("parent decks collect more target skills than a racing deck", () => {
  const X = require("../data/debuffs.js");
  const P = require("../data/presets.js");
  const pr = P.list.find((p) => p.course.dist === "Long");
  const targets = T.parentTargets("debuff", pr, "Senkou", {}, X);
  const pool = glob.filter((c) => c.r >= 2).map((c) => ({ id: c.id, lb: 4 }));
  const parent = T.buildDeck({ scenario: "GL", parent: { targets, statsWeight: 0.1 } }, pool, []);
  const race = T.buildDeck({ scenario: "GL", skillWeight: 0 }, pool, []);
  const covered = (cards) => new Set(cards.flatMap((c) => (D.card(c.id).hs || []).concat(D.card(c.id).es || [])).filter((id) => targets[id])).size;
  assert.ok(parent.expected > 3);
  assert.ok(covered(parent.cards) > covered(race.cards));
});

test("parent targets are white skills only (gold skills and inherited uniques don't become sparks)", () => {
  const X = require("../data/debuffs.js");
  const SV = require("../data/skillvalues/index.js");
  const P = require("../data/presets.js");
  const pr = P.list.find((p) => p.id === SV.ready[0]);
  const L = {};
  require("../data/skillvalues/" + pr.id + ".json").Senkou.forEach(([id, m]) => { L[id] = m / 100; });
  const ace = T.parentTargets("ace", pr, "Senkou", L, X, 0.1, (id) => SV.skills[id][2]);
  assert.ok(Object.keys(ace).length > 10);
  assert.ok(Object.keys(ace).every((id) => SV.skills[id][2] === 1));
  const deb = T.parentTargets("debuff", pr, "Senkou", {}, X);
  assert.ok(Object.keys(deb).every((id) => X[id].r === 1));
});
