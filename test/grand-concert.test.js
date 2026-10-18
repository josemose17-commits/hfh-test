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
  assert.ok(next.gl.pendingConcert, "concert enters a pending phase");
  assert.equal(typeof next.gl.carry, "undefined", "carry is not set until the concert resolves");
  assert.equal(E.songPlan(next, sc).carried, false, "song plan not carried until resolved");
  assert.equal(E.finalizeConcert(next, sc), true, "Step on stage resolves the concert");
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
  assert.ok(concert.gl.pendingConcert, "final concert enters a pending phase");
  assert.equal(concert.stats.speed, 310, "concert stats are deferred until finalizing");
  assert.equal(E.songBonuses(learned, sc).fb, 0);
  assert.equal(E.songBonuses(learned, sc).pendingFb, 10);
  assert.equal(E.songBonuses(concert, sc).fb, 0, "friendship stays pending during the pre-stage window");
  assert.equal(E.songBonuses(concert, sc).pendingFb, 10, "GIRLS' LEGEND U's +10% waits");
  assert.equal(E.finalizeConcert(concert, sc), true, "Step on stage resolves the final concert");
  assert.equal(concert.stats.speed, 320, "+10 concert stats applied after finalizing");
  assert.equal(E.songBonuses(concert, sc).fb, 10, "friendship activates after finalizing");
  assert.equal(E.songBonuses(concert, sc).pendingFb, 0);
  assert.equal(E.glRewards(learned, sc).find((r) => r.turn === 72).sp, 75);
});

test("a carried technique keeps its old tier and price after a concert", () => {
  const s = state({ turn: 24 }); s.gl.shop = { "stat:speed": {} };
  const next = E.advance(s, sc, rest);
  assert.ok(next.gl.pendingConcert, "concert enters a pending phase");
  assert.equal(next.stats.speed, 300, "concert stats are deferred until finalizing");
  const offer = E.rankTechniques(next, sc).items.find((t) => t.id === "stat:speed");
  assert.equal(offer.gain.speed, 5); assert.deepEqual(offer.cost, [10, 0, 0, 0, 0]);
  E.buyTechnique(next, sc, "stat:speed");
  assert.equal(next.stats.speed, 305, "held +5 technique added before finalizing");
  assert.equal(E.finalizeConcert(next, sc), true, "Step on stage resolves the concert");
  assert.equal(next.stats.speed, 308, "normal first concert +3, then the held +5 technique");
  assert.equal(next.gl.tokens[0], 100, "100 opening +10 collaborators -10 carried price");
});

test("the simulator preserves a held technique across its concert reset", () => {
  const economy = GC.create(O.buildCtx({ scenario: sc, build: "medium", runs: 1 }), () => 0.2);
  const offer = { kind: "tech", offers: [{ id: "stat:speed", gain: { speed: 5 }, cost: [10, 0, 0, 0, 0] }] };
  economy.state.shop = offer;
  economy.end(24, () => {});
  assert.equal(economy.state.shop, offer);
  assert.deepEqual(economy.state.tokens, [10, 10, 10, 10, 10]);
  // Isolate the old held lesson price: leave only its ten Dance available.
  economy.state.tokens = [10, 0, 0, 0, 0];
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

test("endOfTurn sets pendingConcert on concert turns but not on regular turns", () => {
  const s1 = state({ turn: 24 });
  const n1 = E.advance(s1, sc, rest);
  assert.ok(n1.gl.pendingConcert, "turn 24 (first concert) enters pending phase");
  assert.deepEqual(n1.gl.pendingConcert, { turn: 24, concertIndex: 0 });

  const s2 = state({ turn: 25 });
  const n2 = E.advance(s2, sc, rest);
  assert.equal(n2.gl.pendingConcert, undefined, "turn 25 does not enter pending phase");

  const s3 = state({ turn: 36 });
  const n3 = E.advance(s3, sc, rest);
  assert.ok(n3.gl.pendingConcert, "turn 36 (second concert) enters pending phase");
  assert.equal(n3.gl.pendingConcert.concertIndex, 1);

  const s4 = state({ turn: 72 });
  const n4 = E.advance(s4, sc, rest);
  assert.ok(n4.gl.pendingConcert, "turn 72 (final concert) enters pending phase");
  assert.equal(n4.gl.pendingConcert.concertIndex, 4);
});

test("finalizeConcert returns false and leaves state untouched when nothing is pending", () => {
  const s = state({ turn: 25 });
  assert.equal(E.finalizeConcert(s, sc), false, "no pending concert returns false");
  assert.equal(s.gl.pendingConcert, undefined);
  const s2 = state({ turn: 24 });
  assert.equal(E.finalizeConcert(s2, sc), false, "hasn't been advanced yet, nothing pending");
});

test("finalizeConcert returns true, clears pendingConcert, and sets the carry", () => {
  const s = state({ turn: 24 }); s.gl.shop = { "song:runrun": {}, "song:zensoku": {} };
  const next = E.advance(s, sc, rest);
  assert.ok(next.gl.pendingConcert);
  const result = E.finalizeConcert(next, sc);
  assert.equal(result, true, "finalizeConcert returns true");
  assert.equal(next.gl.pendingConcert, undefined, "pendingConcert is cleared");
  assert.deepEqual(next.gl.carry, { period: 1, songs: ["runrun", "zensoku"] });
  assert.equal(next.gl.holdSong, undefined, "holdSong is cleared");
  assert.equal(next.gl.shop["song:runrun"].turn, 24, "shop offer turn is stamped");
  assert.equal(next.gl.shop["song:zensoku"].turn, 24);
});

test("concert stats and calendar tokens are applied only after finalizeConcert", () => {
  const s = state({ turn: 24 });
  const next = E.advance(s, sc, rest);
  assert.equal(next.stats.speed, 300, "stats not applied during pending phase");
  assert.deepEqual(next.gl.tokens, [100, 100, 100, 100, 100], "collaborators +10 not applied yet");
  E.finalizeConcert(next, sc);
  assert.equal(next.stats.speed, 303, "+3 concert stats applied after finalizing (0 songs, Make Debut counted)");
  assert.deepEqual(next.gl.tokens, [110, 110, 110, 110, 110], "collaborators +10 applied after finalizing");
});

test("songs purchased during the pending window are attributed to the pending period", () => {
  const s = state({ turn: 24 }); s.gl.shop = { "song:runrun": {} };
  const next = E.advance(s, sc, rest);
  E.buySong(next, sc, "runrun");
  assert.equal(E.glPeriodFor(sc, "runrun", next), 0, "pre-stage purchase attributed to pending period, not next");
  const plan = E.songPlan(next, sc);
  assert.equal(plan.bought, 1, "purchased song counted in the plan for the pending period");
});

test("currentPeriod returns the pending concert's index during the pending phase", () => {
  const s1 = state({ turn: 25 }); s1.gl.pendingConcert = { turn: 24, concertIndex: 0 };
  assert.equal(E.currentPeriod(sc, s1), 0, "pending first concert keeps period 0");
  const s2 = state({ turn: 37 }); s2.gl.pendingConcert = { turn: 36, concertIndex: 1 };
  assert.equal(E.currentPeriod(sc, s2), 1, "pending second concert keeps period 1");
  const s3 = state({ turn: 73 }); s3.gl.pendingConcert = { turn: 72, concertIndex: 4 };
  assert.equal(E.currentPeriod(sc, s3), 4, "pending final concert keeps period 4");
  const s4 = state({ turn: 25 });
  assert.equal(E.currentPeriod(sc, s4), 1, "non-pending uses glPeriod");
});

test("songPlan targets and purchases adjust across the pending boundary", () => {
  const s = state({ turn: 25 }); s.gl.pendingConcert = { turn: 24, concertIndex: 0 };
  const plan = E.songPlan(s, sc);
  assert.equal(plan.period, 0, "song plan stays in period 0 during pending phase");
  assert.ok(plan.target > 0, "plan still has a target for the pending period");
});

test("heldSong and holdSong are phase-aware during the pending window", () => {
  const s = state({ turn: 25 }); s.gl.pendingConcert = { turn: 24, concertIndex: 0 };
  s.gl.holdSong = { id: "runrun", period: 0, turn: 24 };
  s.gl.shop = { "song:runrun": {} };
  const held = E.heldSong(s, sc);
  assert.ok(held, "held song visible during pending phase");
  assert.equal(held.id, "runrun");
  const plan = E.songPlan(s, sc);
  assert.equal(plan.step, "hold", "plan step is hold while a song is held across the pending concert");
});

test("tokenPlan attributes the pending concert's lesson tokens to the pending period", () => {
  const s = state({ turn: 25 }); s.gl.pendingConcert = { turn: 24, concertIndex: 0 };
  s.gl.lessons = { 0: 1 };
  const plan = E.songPlan(s, sc);
  assert.equal(plan.lessons, 1, "lessons in period 0 counted for the pending concert");
});

test("buyTechnique records the lesson in the pending period during the pending window", () => {
  const s = state({ turn: 25 }); s.gl.pendingConcert = { turn: 24, concertIndex: 0 };
  s.gl.shop = { "stat:speed": {} };
  s.gl.tokens = [10, 0, 0, 0, 0];
  E.buyTechnique(s, sc, "stat:speed");
  assert.equal(s.gl.lessons[0], 1, "lesson recorded for period 0 (pending), not period 1");
  assert.equal(s.gl.tokens[0], 0, "token cost applied");
  assert.equal(E.songPlan(s, sc).lessons, 1, "technique counted as a period-0 lesson");
});

test("offeredTechnique uses the pending concert turn as tier fallback for un-stamped offers", () => {
  const s = state({ turn: 25 }); s.gl.pendingConcert = { turn: 24, concertIndex: 0 };
  s.gl.shop = { "stat:speed": {} };
  const t = E.offeredTechnique(s, sc, "stat:speed");
  assert.equal(t.gain.speed, 5, "un-stamped offer uses period-0 tier (pending)");
  assert.deepEqual(t.cost, [10, 0, 0, 0, 0], "cost is tier 0");
});

test("shopSongs uses currentPeriod during the pending window for focus/avoid", () => {
  const s = state({ turn: 25 }); s.gl.pendingConcert = { turn: 24, concertIndex: 0 };
  s.gl.songs = { tachiichi: 24 };
  const songs = E.shopSongs(s, sc);
  assert.ok(songs.length > 0, "shop songs still listed during pending phase");
});

test("songBonuses keeps GIRLS' LEGEND U +10% pending at turn 72 until the concert resolves", () => {
  const s = state({ turn: 73 }); s.gl.pendingConcert = { turn: 72, concertIndex: 4 };
  const bonuses = E.songBonuses(s, sc);
  assert.equal(bonuses.fb, 0, "friendship not activated while pending");
  assert.equal(bonuses.pendingFb, 10, "+10% GIRLS' LEGEND U stays pending");
  E.finalizeConcert(s, sc);
  const after = E.songBonuses(s, sc);
  assert.equal(after.fb, 10, "friendship activates after resolving");
  assert.equal(after.pendingFb, 0);
});

test("hypeStatus reports the pending concert's Hype window during the pending phase", () => {
  const s = state({ turn: 25 }); s.gl.pendingConcert = { turn: 24, concertIndex: 0 };
  s.gl.songs = {};
  const hype = E.hypeStatus(s, sc);
  assert.equal(hype.next, 24, "hype window is for the pending concert");
  assert.equal(hype.since, 1, "Make Debut! counts, so 1 song this period already");
  assert.equal(hype.turnsToLive, 0, "concert is imminent");
});

test("glRewards counts pending-period songs and marks the pending concert as pending", () => {
  const s = state({ turn: 25 }); s.gl.pendingConcert = { turn: 24, concertIndex: 0 };
  s.gl.songs = {};
  s.gl.shop = { "song:tachiichi": {} };
  E.buySong(s, sc, "tachiichi");
  const rewards = E.glRewards(s, sc);
  const first = rewards.find((r) => r.turn === 24);
  assert.equal(first.sp, 50, "tachiichi + Make Debut! = 2 songs at 25 SP each = 50 SP at the pending concert");
  assert.equal(first.status, "pending", "the pending concert's reward is marked pending");
});

test("finalizeConcert sets carry period to the next period and clears holdSong", () => {
  const s = state({ turn: 24 });
  s.gl.shop = { "song:runrun": {}, "song:zensoku": {} };
  s.gl.holdSong = { id: "runrun", turn: 24 };
  const next = E.advance(s, sc, rest);
  assert.ok(next.gl.pendingConcert);
  E.finalizeConcert(next, sc);
  assert.equal(next.gl.carry.period, 1, "carry period is next (1)");
  assert.deepEqual(next.gl.carry.songs, ["runrun", "zensoku"]);
  assert.equal(next.gl.holdSong, undefined, "holdSong cleared");
  assert.equal(next.gl.pendingConcert, undefined, "pending phase cleared");
});

test("two pending concerts resolve independently in sequence", () => {
  const s = state({ turn: 36 }); s.gl.shop = { "stat:speed": {}, "sp": {} };
  s.gl.tokens = [20, 0, 0, 0, 0];
  s.gl.lessons = {};
  const next = E.advance(s, sc, rest);
  assert.equal(next.gl.pendingConcert.concertIndex, 1);
  assert.equal(next.gl.pendingConcert.turn, 36);
  E.buyTechnique(next, sc, "stat:speed");
  assert.equal(next.gl.tokens[0], 4, "tier-1 technique cost 16 Dance from 20");
  assert.equal(next.gl.lessons[1], 1, "lesson attributed to period 1 (pending)");
  E.finalizeConcert(next, sc);
  assert.equal(next.gl.pendingConcert, undefined, "pending cleared after resolve");
  assert.equal(next.gl.carry.period, 2, "carry for period 2 (next after period 1)");
  // buyTechnique cleared the shop, so the carry songs list is empty
  assert.deepEqual(next.gl.carry.songs, [], "no unbought songs carried over");
});
