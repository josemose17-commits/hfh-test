const test = require("node:test");
const assert = require("node:assert/strict");
const E = require("../engine.js");
const O = require("../optimizer.js");
const GC = require("../grand-concert.js");
const { SCENARIOS } = require("../scenarios.js");
const sc = SCENARIOS.find((s) => s.id === "grandlive");
const clone = (s) => JSON.parse(JSON.stringify(s));
function state(overrides = {}) {
  return Object.assign({
    turn: 18, energy: 80, maxEnergy: 100, mood: 3, build: "medium", risk: 12, resetMode: "off",
    goals: [], goalRace: false, extras: {}, calib: [], log: [], caps: {}, trackStats: true,
    stats: { speed: 300, stamina: 200, power: 250, guts: 150, wit: 200 },
    gl: { songs: {}, tokens: [100, 100, 100, 100, 100], lessons: {}, shop: {} },
    facilities: E.STATS.map((stat) => ({ stat, gain: null, cards: stat === "speed" ? 4 : 0, rainbows: stat === "speed" ? 2 : 0, fail: 0, extras: {} }))
  }, overrides);
}
const rest = { kind: "rest", label: "Rest", energyDelta: 0, prefix: [], notes: [] };

test("the 18-song guarantee counts Make Debut and closes after the turn-71 command", () => {
  const s = state({ turn: 71 });
  s.gl.songs = Object.fromEntries(sc.songs.slice(0, 16).map((song) => [song.id, 60]));
  assert.equal(E.concertGoal(s).left, 1);
  assert.equal(E.tokenPlan(s, sc).toBuy, 1);
  E.buySong(s, sc, "present");
  assert.equal(E.concertGoal(s).count, 18);
  assert.equal(E.tokenPlan(s, sc).toBuy, 0);
  const late = state({ turn: 72 });
  late.gl.songs = Object.fromEntries(sc.songs.slice(0, 16).map((song) => [song.id, 60]));
  E.buySong(late, sc, "present");
  assert.equal(E.songsLearned(late), 18);
  assert.deepEqual(E.concertGoal(late), { count: 17, target: 18, deadline: 71, left: 1, closed: true });
  assert.match(E.glRewards(late, sc).find((r) => r.turn === 72).sofar, /17 of 18 songs by turn 71/);
});

test("normal technique cadence and an observed carry have different budgets", () => {
  assert.deepEqual(Array.from({ length: 8 }, (_, i) => E.techniquesToSong(0, i)), [1, 2, 3, 4, 4, 2, 2, 4]);
  const s = state({ turn: 25 });
  assert.equal(E.songPlan(s, sc).techNow, 2);
  assert.equal(E.songPlan(s, sc).techLeft, 10);
  s.gl.carry = { period: 1, songs: ["runrun"] };
  s.gl.shop = { "song:runrun": { turn: 24 } };
  assert.equal(E.songPlan(s, sc).techNow, 0);
  assert.equal(E.songPlan(s, sc).techLeft, 5);
  E.buySong(s, sc, "runrun");
  assert.equal(s.gl.carriedPeriods[1], true);
  assert.equal(E.songPlan(s, sc).techNow, 1, "carried song credits one of the next two techniques");
  E.buyTechnique(s, sc, "stat:wit");
  assert.equal(E.songPlan(s, sc).techNow, 0);
});

test("the planner credits unlock techniques proved by learned or currently offered songs", () => {
  const s = state(); s.gl.shop = { "song:tachiichi": {} };
  assert.equal(E.songPlan(s, sc).techNow, 0);
  assert.equal(E.songPlan(s, sc).techLeft, 15);
  s.gl.shop = {};
  s.gl.songs = Object.fromEntries(sc.songs.slice(0, 5).map((song) => [song.id, 17]));
  assert.equal(E.songPlan(s, sc).techLeft, 2);
});

test("concert transitions preserve the song selection and record its carry", () => {
  const s = state({ turn: 24 }); s.gl.shop = { "song:runrun": {}, "song:zensoku": {} };
  const next = E.advance(s, sc, rest);
  assert.deepEqual(next.gl.carry, { period: 1, songs: ["runrun", "zensoku"] });
  assert.equal(next.gl.shop["song:runrun"].turn, 24);
  assert.equal(E.songPlan(next, sc).carried, true);
  assert.equal(E.songPlan(state({ turn: 25 }), sc).carried, false, "old saves never invent a carry");
});

test("the final period catches up to the actual total instead of claiming a fixed plan met 18", () => {
  const s = state({ turn: 61 });
  s.gl.songs = Object.fromEntries(sc.songs.slice(0, 14).map((song) => [song.id, 60]));
  assert.equal(E.songPlan(s, sc).target, 3, "14 paid songs plus Make Debut leaves three");
  s.gl.songs = Object.fromEntries(sc.songs.slice(0, 5).map((song) => [song.id, 24]));
  assert.equal(E.songPlan(s, sc).target, 12, "missed earlier targets require a catch-up plan");
});

test("song purchase applies its immediate stats once and Undo restores the exact purchase fields", () => {
  const s = state(); s.gl.shop = { "song:zensoku": { turn: 18 } };
  const before = clone(s);
  E.buySong(s, sc, "zensoku");
  assert.equal(s.stats.speed, before.stats.speed + 22);
  assert.deepEqual(s.gl.tokens, [68, 100, 100, 88, 100]);
  const paid = clone(s);
  E.buySong(s, sc, "zensoku");
  assert.deepEqual(s, paid, "duplicate purchase cannot spend twice or move the activation turn");
  E.undoBuy(s);
  assert.deepEqual(s.stats, before.stats);
  assert.deepEqual(s.gl.songs, before.gl.songs);
  assert.deepEqual(s.gl.shop, before.gl.shop);
  assert.deepEqual(s.gl.tokens, before.gl.tokens);
});

test("unaffordable, unavailable and incorrectly typed purchases leave the state untouched", () => {
  const s = state(); s.gl.tokens = [5, 0, 0, 0, 100];
  const before = clone(s);
  E.buySong(s, sc, "zensoku"); E.buySong(s, sc, "yumewo"); E.buyTechnique(s, sc, "stat:speed");
  for (const type of [null, "", -1, 5, 1.5, NaN]) E.buyTechnique(s, sc, "energy:20", type);
  E.buyTechnique(s, sc, "energy:20", 0);
  assert.deepEqual(s, before);
  E.buyTechnique(s, sc, "energy:20", 4);
  assert.equal(s.gl.tokens[4], 75);
  assert.equal(s.energy, 100);
});

test("an offered random-cost technique cannot be recommended until its actual type is selected", () => {
  const s = state({ energy: 22 }); s.gl.shop = { "energy:20": {} };
  const item = E.rankTechniques(s, sc).items.find((x) => x.id === "energy:20");
  assert.equal(item.needsType, true); assert.equal(item.afford, false);
  assert.ok(!E.recommend(s, sc).ranked.some((o) => o.tech && o.tech.id === "energy:20"));
  s.gl.shop["energy:20"].type = 4;
  assert.ok(E.recommend(s, sc).ranked.some((o) => o.tech && o.tech.id === "energy:20"));
});

test("Undo refuses to overwrite later Performance or stat changes", () => {
  for (const edit of [(s) => s.gl.tokens[0]++, (s) => s.stats.speed++, (s) => s.turn++]) {
    const s = state(); E.buySong(s, sc, "zensoku"); edit(s);
    const changed = clone(s); E.undoBuy(s); assert.deepEqual(s, changed);
  }
});

test("a lesson before training must be affordable before that training's income", () => {
  const s = state(); s.gl.tokens = [5, 0, 0, 0, 0];
  const option = { kind: "train", stat: "speed", label: "Train Speed", energyDelta: -19, statGains: { speed: 20 }, tech: { id: "stat:speed" }, prefix: [], notes: [] };
  assert.equal(E.advance(s, sc, option), s, "future training tokens cannot fund an earlier purchase");
  s.gl.tokens[0] = 10;
  const next = E.advance(s, sc, option);
  assert.equal(next.gl.lessons[0], 1);
  assert.equal(next.stats.speed, 325);
});

test("failed training retains the already-bought song reward without training tokens", () => {
  const s = state();
  const option = { kind: "train", stat: "speed", label: "Train Speed", energyDelta: -19, statGains: { speed: 20 }, song: { id: "zensoku" }, prefix: [], notes: [] };
  const next = E.advance(s, sc, option, "fail");
  assert.equal(next.stats.speed, 300 + 22 - 5);
  assert.deepEqual(next.gl.tokens, [68, 100, 100, 88, 100]);
  assert.equal(next.gl.songs.zensoku, 18);
});

test("Done with a mastery song matches buying it manually before computing the training", () => {
  for (const typed of [false, true]) {
    const s = state(); s.gl.shop = { "song:tachiichi": {} };
    if (typed) s.facilities[0].gain = 40;
    const r = E.recommend(s, sc);
    assert.equal(r.action.song.id, "tachiichi"); assert.equal(r.action.stat, "speed");
    const manual = clone(s); E.buySong(manual, sc, "tachiichi");
    const withoutPrefix = E.recommend(manual, sc).ranked.find((o) => o.kind === "train" && o.stat === "speed" && !o.tech);
    assert.deepEqual(r.action.statGains, withoutPrefix.statGains, typed ? "typed gains stay authoritative" : "the mastery is already active for this training");
    assert.deepEqual(E.advance(s, sc, r.action).stats, E.advance(manual, sc, withoutPrefix).stats);
  }
});

test("GIRLS' LEGEND U's one-time reward and the final concert's reward are separate", () => {
  const s = state({ turn: 71 });
  s.gl.songs = { tachiichi: 61, gothisway: 65 };
  const learned = E.advance(s, sc, rest);
  assert.equal(learned.stats.speed, 310);
  assert.equal(E.hypeStatus(learned, sc).since, 3, "the automatic final song fills the third Hype slot");
  const concert = E.advance(learned, sc, rest);
  assert.equal(concert.stats.speed, 320);
  assert.equal(E.songBonuses(learned, sc).fb, 0);
  assert.equal(E.songBonuses(learned, sc).pendingFb, 10);
  assert.equal(E.songBonuses(concert, sc).fb, 10);
  assert.equal(E.glRewards(learned, sc).find((r) => r.turn === 72).sp, 75);
});

test("a carried technique keeps its old tier and price after a concert", () => {
  const s = state({ turn: 24 }); s.gl.shop = { "stat:speed": {} };
  const next = E.advance(s, sc, rest);
  const offer = E.rankTechniques(next, sc).items.find((t) => t.id === "stat:speed");
  assert.equal(offer.gain.speed, 5); assert.deepEqual(offer.cost, [10, 0, 0, 0, 0]);
  E.buyTechnique(next, sc, "stat:speed");
  assert.equal(next.stats.speed, 308, "normal first concert +3, then the held +5 technique");
  assert.equal(next.gl.tokens[0], 90);
});

test("the simulator preserves a held technique across its concert reset", () => {
  const economy = GC.create(O.buildCtx({ scenario: sc, build: "medium", runs: 1 }), () => 0.2);
  const offer = { kind: "tech", offers: [{ id: "stat:speed", gain: { speed: 5 }, cost: [10, 0, 0, 0, 0] }] };
  economy.state.shop = offer;
  economy.end(24, () => {});
  assert.equal(economy.state.shop, offer);
  economy.add(0, 10);
  const events = []; economy.shop(25, 100, 100, (e) => events.push(e));
  assert.ok(events.some((e) => e.s && e.s[0] === 5));
  assert.equal(economy.state.spent[0], 10);
});

test("friendship-song valuation waits for its concert rather than crediting the remaining period", () => {
  const w = E.BUILDS.medium.w;
  assert.equal(E.concertSongValue({ fb: 10 }, w, 60, sc), 3 * E.concertSongValue({ fb: 10 }, w, 61, sc));
  assert.equal(E.concertSongValue({ fb: 10 }, w, 73, sc), 0);
  assert.equal(E.concertSongValue({ once: { speed: 22 } }, w, 73, sc), 22);
});

test("the carry policy can buy a strong live bonus after the period target while preserving weak songs", () => {
  const s = state({ turn: 60 });
  s.gl.songs = { kiseki: 50, tachiichi: 51, gothisway: 52 };
  s.gl.shop = { "song:daisuki": {} };
  assert.equal(E.lessonShop(s, sc).phase, "hold");
  assert.equal(E.lessonShop(s, sc).pick.kind, "song", "+10% friendship is worth activating at this concert");
  s.gl.shop = { "song:runrun": {} };
  assert.equal(E.lessonShop(s, sc).pick.kind, "hold", "the weaker live bonus still carries into the next period");
});

test("recovery compares every offered amount and prices energy overflow", () => {
  const s = state({ energy: 85 });
  s.gl.shop = { "energy:20": { type: 4 }, "energy:40": { type: 4 } };
  const r = E.recommend(s, sc);
  const small = r.ranked.find((o) => o.tech && o.tech.id === "energy:20");
  const large = r.ranked.find((o) => o.tech && o.tech.id === "energy:40");
  assert.ok(small && large);
  assert.equal(small.energyDelta, large.energyDelta);
  assert.ok(small.value > large.value, "equal useful recovery should prefer the cheaper lesson");
});

test("techniques remain available after the final concert without a future concert's SP", () => {
  const s = state({ turn: 73 }); s.gl.shop = { sp: { type: 4 } };
  const rank = E.rankTechniques(s, sc);
  assert.ok(rank); assert.equal(rank.items.find((t) => t.id === "sp").value, 12 * 0.35);
  assert.equal(E.tokenPlan(s, sc).toBuy, 0);
  assert.ok(E.evaluate(s, sc).options.find((o) => o.stat === "speed").parts.tokens > 0, "late Performance can still buy immediate technique rewards");
});

test("optional late songs compete with techniques instead of automatically taking priority", () => {
  const s = state({ turn: 73 });
  s.gl.shop = { "song:runrun": {}, "stat:speed": {} };
  assert.equal(E.lessonShop(s, sc).pick.item.id, "stat:speed", "an expired friendship bonus cannot justify the expensive song");
  s.gl.shop = { "song:zensoku": {} };
  assert.equal(E.lessonShop(s, sc).pick.kind, "song", "a useful one-time reward can still be bought");
});
