// Independent regressions promoted from the post-recovery accounting review.
// Codeium's claimed 13 regressions were not supplied or verified.
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../engine.js');
const R = require('../run-report.js');
const sc = require('../scenarios.js').SCENARIOS.find(s => s.id === 'grandlive');
const copy = x => JSON.parse(JSON.stringify(x));
const zeros = () => [0, 0, 0, 0, 0];
const rest = {kind: 'rest', label: 'Rest', energyDelta: 0, prefix: [], notes: []};
function fixture(turn = 24) {
  return {
    scenario: sc.id, turn, energy: 80, maxEnergy: 100, mood: 3,
    build: 'medium', risk: 12, resetMode: 'off', goals: [], goalRace: false,
    extras: {}, caps: {}, conditions: {}, calib: [], fcal: [], facLevels: {}, log: [],
    trackStats: true, stats: {speed: 300, stamina: 200, power: 250, guts: 150, wit: 200},
    gl: {songs: {}, tokens: [100, 100, 100, 100, 100], lessons: {}, shop: {}},
    facilities: E.STATS.map(stat => ({stat, gain: 20, fail: 0, cards: 0, rainbows: 0, extras: {}}))
  };
}
function pending(turn = 24) {
  const s = fixture(turn + 1);
  s.gl.pendingConcert = {turn, concertIndex: sc.lives.indexOf(turn)};
  return s;
}
function buy(s, id = 'runrun') {
  s.gl.shop = {['song:' + id]: {turn: s.gl.pendingConcert?.turn ?? s.turn}};
  E.buySong(s, sc, id);
  assert.equal(s.gl.lastBuy?.id, 'song:' + id);
}

test('pending guard rejects training/rest/race/outing with no prefix or either purchase prefix before any mutation', () => {
  for (const kind of ['train', 'rest', 'race', 'recreation']) {
    for (const prefix of ['none', 'song', 'tech']) {
      const s = pending();
      s.gl.shop = {'song:runrun': {turn: 24}, 'stat:speed': {turn: 24}};
      const option = {...rest, kind, stat: 'speed', energyDelta: -20, statGains: {speed: 30}};
      if (prefix === 'song') option.song = sc.songs.find(x => x.id === 'runrun');
      if (prefix === 'tech') option.tech = {id: 'stat:speed', gain: {speed: 5}};
      const before = JSON.stringify(s);
      const result = E.advance(s, sc, option, 'fail', {outing: 'great'});
      assert.equal(result, s, `${kind}/${prefix}: original object`);
      assert.equal(JSON.stringify(s), before, `${kind}/${prefix}: unchanged state`);
    }
  }
});

test('standalone song and technique purchases remain usable and attribute to the pending period', () => {
  const song = pending(); buy(song);
  assert.equal(song.turn, 25);
  assert.equal(song.gl.songPeriods.runrun, 0);
  const tech = pending(); tech.gl.shop = {'stat:speed': {turn: 24}};
  E.buyTechnique(tech, sc, 'stat:speed');
  assert.equal(tech.gl.lastBuy?.id, 'stat:speed');
  assert.equal(tech.gl.lessons[0], 1);
  assert.equal(tech.gl.lessons[1], undefined);
  assert.equal(tech.turn, 25);
});

test('purchased pre-stage attribution and prior concert reward counts survive finalization and JSON reload', () => {
  const s = pending(); s.gl.songs = {zensoku: 20}; buy(s);
  const before = E.glRewards(s, sc).find(x => x.turn === 24);
  assert.equal(before.stats, 10); assert.equal(before.sp, 75);
  E.finalizeConcert(s, sc);
  const loaded = copy(s);
  assert.equal(E.glPeriodFor(sc, 'runrun', loaded), 0);
  const after = E.glRewards(loaded, sc).find(x => x.turn === 24);
  assert.equal(after.sp, before.sp); assert.equal(after.stats, before.stats);
  assert.equal(E.songPlan(loaded, sc).bought, 0);
  assert.equal(E.hypeStatus(loaded, sc).since, 0);
});

test('legacy unambiguous dates still resolve and explicit null attribution never falls through', () => {
  const s = pending(); s.gl.songs = {runrun: 20};
  assert.equal(E.glPeriodFor(sc, 'runrun', s), 0);
  s.gl.songPeriods = {runrun: null};
  assert.equal(E.glPeriodFor(sc, 'runrun', s), null);
  assert.equal(E.hypeStatus(s, sc).since, 1); // Make Debut only.
  E.finalizeConcert(s, sc);
  assert.equal(E.glPeriodFor(sc, 'runrun', copy(s)), null);
});

test('ordinary Live Bonus learned before the command stays pending until finalization', () => {
  const s = pending(); s.gl.songs = {runrun: 20};
  assert.equal(E.songBonuses(s, sc).fb, 0);
  assert.equal(E.songBonuses(s, sc).pendingFb, 5);
  E.finalizeConcert(s, sc);
  assert.equal(E.songBonuses(s, sc).fb, 5);
  assert.equal(E.songBonuses(s, sc).pendingFb, 0);
});

test('ordinary Live Bonus bought in the pre-stage window activates at that concert, including reload', () => {
  const s = pending(); buy(s);
  assert.equal(E.songBonuses(s, sc).fb, 0);
  assert.equal(E.songBonuses(s, sc).pendingFb, 5);
  E.finalizeConcert(s, sc);
  assert.equal(E.songBonuses(copy(s), sc).fb, 5);
  assert.equal(E.songBonuses(copy(s), sc).pendingFb, 0);
});

test('ordinary Live Bonus bought in the final pre-stage window is retained alongside GIRLS LEGEND U', () => {
  const s = pending(72); buy(s);
  E.finalizeConcert(s, sc);
  assert.equal(E.songBonuses(copy(s), sc).fb, 15);
});

test('actual numeric caps stay at 200/250/300/350/400 during each pending window', () => {
  for (const [i, turn] of sc.lives.entries()) {
    const oldCap = 200 + 50 * i;
    const s = pending(turn); s.gl.tokens = Array(5).fill(oldCap);
    assert.equal(E.tokenCap(s, sc), oldCap);
    const reward = E.recordTokenReward(s, sc, 10);
    assert.deepEqual(reward.credited, zeros());
    assert.deepEqual(reward.lostAtCap, Array(5).fill(10));
    assert.ok(E.finalizeConcert(s, sc));
    assert.equal(E.tokenCap(s, sc), oldCap + 50);
    assert.deepEqual(s.gl.tokens, Array(5).fill(oldCap + (turn === 72 ? 0 : 10)));
  }
});

test('concert-day command training uses the real pre-concert cap of 200', () => {
  const s = fixture(); s.gl.tokens[0] = 195;
  s.facilities[0].extras = {tok: 20, tokType: 0};
  const rec = E.recommend(s, sc);
  const option = rec.ranked.find(o => o.kind === 'train' && o.stat === 'speed');
  const after = E.advance(s, sc, option);
  R.recordTurn(s, after, sc, rec, option);
  const flow = after.log.at(-1).diagnostics.performance;
  assert.equal(after.gl.tokens[0], 200);
  assert.equal(flow.training.credited[0], 5);
  assert.equal(flow.training.lostAtCap[0], 15);
});

test('report detects the real no-pending turn-24 to pending turn-25 transition and excludes the forecast', () => {
  const s = fixture();
  assert.equal(s.gl.pendingConcert, undefined);
  const rec = E.recommend(s, sc), after = E.advance(s, sc, rest);
  R.recordTurn(s, after, sc, rec, rest);
  assert.equal(after.turn, 25);
  assert.equal(after.gl.pendingConcert.turn, 24);
  const report = R.build(after, sc), flow = report.turns[0].performance;
  assert.deepEqual(flow.deferredCalendar.credited, Array(5).fill(10));
  assert.deepEqual(flow.calendar.credited, zeros());
  assert.deepEqual(flow.unreconciled, zeros());
  assert.deepEqual(report.totals.calendarIncome, zeros());
  assert.equal(report.concerts.find(x => x.turn === 24).pending, true);
});

test('engine finalization receipt stores actual capped income from manually entered balances, and resolves once', () => {
  const s = pending(); s.gl.tokens = [248, 250, 245, 249, 240];
  assert.equal(E.finalizeConcert(s, sc), true);
  const receipt = s.gl.finalizationEvent[24];
  assert.deepEqual(receipt.credited, [2, 0, 5, 1, 10]);
  assert.deepEqual(receipt.lostAtCap, [8, 10, 5, 9, 0]);
  assert.deepEqual(receipt.after, [250, 250, 250, 250, 250]);
  const snapshot = JSON.stringify(s);
  assert.equal(E.finalizeConcert(s, sc), false);
  assert.equal(JSON.stringify(s), snapshot);
});

test('recordFinalization can record actual receipt after finalizeConcert has cleared pendingConcert', () => {
  const s = pending(); E.finalizeConcert(s, sc);
  const receipt = R.recordFinalization(s, sc);
  assert.ok(receipt, 'finalized receipt must remain recordable after pending clears');
  assert.deepEqual(R.build(s, sc).totals.calendarIncome, Array(5).fill(10));
});

test('report counts actual income correctly when a complete receipt is supplied explicitly', () => {
  const s = pending(); E.finalizeConcert(s, sc);
  const receipt = s.gl.finalizationEvent[24];
  R.event(s, 'finalizeConcert', receipt, 24);
  const report = R.build(s, sc);
  assert.deepEqual(report.totals.calendarIncome, receipt.credited);
  assert.deepEqual(report.totals.calendarLostAtCap, receipt.lostAtCap);
  assert.equal(report.events.filter(x => x.kind === 'finalizeConcert').length, 1);
});

test('recording an owned song during the current pending window persists its known current period', () => {
  const s = pending();
  assert.equal(E.recordLearnedSong(s, sc, 'runrun', 25), true);
  E.finalizeConcert(s, sc);
  assert.equal(E.glPeriodFor(sc, 'runrun', copy(s)), 0);
});

test('backfilling a song from an earlier period while a later concert is pending preserves that earlier period', () => {
  const s = pending(36);
  assert.equal(E.recordLearnedSong(s, sc, 'runrun', 20), true);
  assert.equal(E.glPeriodFor(sc, 'runrun', s), 0);
});

test('a historical concert-plus-one date without phase evidence remains explicitly ambiguous', () => {
  const s = fixture(30);
  assert.equal(E.recordLearnedSong(s, sc, 'runrun', 25), true);
  assert.equal(E.glPeriodFor(sc, 'runrun', copy(s)), null);
});

test('purchase Undo restores an existing attribution map including explicit null entries', () => {
  const s = pending(); s.gl.songPeriods = {zensoku: 0, seishun: null};
  const before = copy(s.gl.songPeriods); buy(s); E.undoBuy(s);
  assert.deepEqual(s.gl.songPeriods, before);
});

test('purchase Undo restores the exact absence of an attribution map in a legacy save', () => {
  const s = pending();
  assert.equal(Object.hasOwn(s.gl, 'songPeriods'), false);
  buy(s); E.undoBuy(s);
  assert.equal(Object.hasOwn(s.gl, 'songPeriods'), false);
});

test('purchase Undo distinguishes empty, nonempty, null, and absent attribution maps after reload', () => {
  for (const map of [undefined, {}, {zensoku: 0, seishun: null}, null]) {
    const s = pending();
    if (map !== undefined) s.gl.songPeriods = copy(map);
    const before = JSON.stringify({present: Object.hasOwn(s.gl, 'songPeriods'), value: s.gl.songPeriods});
    buy(s);
    const loaded = copy(s);
    E.undoBuy(loaded);
    assert.equal(JSON.stringify({present: Object.hasOwn(loaded.gl, 'songPeriods'), value: loaded.gl.songPeriods}), before);
  }
});

test('a pre-stage song activates at each of the five concerts and stays in that period after reload', () => {
  for (const [i, turn] of sc.lives.entries()) {
    const s = pending(turn); buy(s);
    assert.equal(E.glPeriodFor(sc, 'runrun', s), i);
    assert.equal(E.songBonuses(s, sc).fb, 0);
    assert.equal(E.songBonuses(s, sc).pendingFb, 5 + (turn === 72 ? 10 : 0));
    E.finalizeConcert(s, sc);
    const loaded = copy(s);
    assert.equal(E.glPeriodFor(sc, 'runrun', loaded), i);
    assert.equal(E.songBonuses(loaded, sc).fb, 5 + (turn === 72 ? 10 : 0));
    assert.equal(E.songBonuses(loaded, sc).pendingFb, 0);
  }
});

test('unknown attribution does not grant a definite active Live Bonus', () => {
  const s = fixture(30); s.gl.songs = {runrun: 25}; s.gl.songPeriods = {runrun: null};
  assert.equal(E.songBonuses(s, sc).fb, 0);
  assert.equal(E.songBonuses(s, sc).pendingFb, 5);
});

test('historical concert-plus-one dates stay ambiguous even during a later pending concert', () => {
  const s = pending(48);
  assert.equal(E.recordLearnedSong(s, sc, 'runrun', 25), true);
  assert.equal(Object.hasOwn(s.gl.songPeriods, 'runrun'), true);
  assert.equal(s.gl.songPeriods.runrun, null);
  E.finalizeConcert(s, sc);
  assert.equal(E.glPeriodFor(sc, 'runrun', copy(s)), null);
});

test('recording a receipt is idempotent before and after its event moves into a turn log', () => {
  const s = pending(); E.finalizeConcert(s, sc);
  assert.ok(R.recordFinalization(s, sc, 24));
  const snapshot = JSON.stringify(s);
  assert.ok(R.recordFinalization(s, sc, 24));
  assert.equal(JSON.stringify(s), snapshot);
  const rec = E.recommend(s, sc), next = E.advance(s, sc, rest);
  R.recordTurn(s, next, sc, rec, rest);
  const loaded = copy(next);
  assert.ok(R.recordFinalization(loaded, sc, 24));
  const report = R.build(loaded, sc);
  assert.equal(report.events.filter(e => e.kind === 'finalizeConcert').length, 1);
  assert.deepEqual(report.totals.calendarIncome, Array(5).fill(10));
  const beforeBuild = JSON.stringify(loaded);
  assert.deepEqual(R.build(loaded, sc), report);
  assert.equal(JSON.stringify(loaded), beforeBuild);
});

test('report uses the completed receipt after spending changes a deferred cap forecast', () => {
  // Controlled manual balances exercise cap-loss accounting; a normal first
  // concert's 200 cap cannot itself fill the raised 250 cap.
  const s = fixture(); s.gl.tokens = [250, 250, 250, 250, 250];
  const rec = E.recommend(s, sc), next = E.advance(s, sc, rest);
  R.recordTurn(s, next, sc, rec, rest);
  assert.deepEqual(next.log[0].diagnostics.performance.deferredCalendar.credited, zeros());
  buy(next);
  E.finalizeConcert(next, sc);
  const receipt = copy(next.gl.finalizationEvent[24]);
  assert.ok(receipt.credited.some(n => n > 0));
  R.recordFinalization(next, sc, 24);
  for (let i = 0; i < 3; i++) {
    const report = R.build(copy(next), sc);
    assert.deepEqual(report.totals.calendarIncome, receipt.credited);
    assert.deepEqual(report.totals.calendarLostAtCap, receipt.lostAtCap);
    assert.equal(report.events.filter(e => e.kind === 'finalizeConcert').length, 1);
  }
});

test('saved actual receipts enrich old marker events, with no forecast substitution or double counting', () => {
  const s = pending(); s.gl.tokens = [248, 250, 245, 249, 240];
  E.finalizeConcert(s, sc);
  const receipt = copy(s.gl.finalizationEvent[24]);
  R.event(s, 'finalizeConcert', {turn: 24});
  R.event(s, 'finalizeConcert', receipt, 24);
  const before = JSON.stringify(s);
  const report = R.build(s, sc);
  assert.deepEqual(report.totals.calendarIncome, receipt.credited);
  assert.deepEqual(report.totals.calendarLostAtCap, receipt.lostAtCap);
  assert.deepEqual(report.events[0].credited, receipt.credited);
  assert.equal(JSON.stringify(s), before, 'report rebuild must not mutate saved events');
  assert.deepEqual(R.build(s, sc), report);
});

test('a marker without an actual receipt contributes no calendar income', () => {
  const s = pending();
  R.event(s, 'finalizeConcert', {turn: 24});
  assert.deepEqual(R.build(s, sc).totals.calendarIncome, zeros());
  assert.equal(R.recordFinalization(s, sc, 24), null);
});

test('the final concert records a zero-income receipt exactly once', () => {
  const s = pending(72);
  E.finalizeConcert(s, sc);
  assert.ok(R.recordFinalization(s, sc, 72));
  R.recordFinalization(s, sc, 72);
  const report = R.build(s, sc);
  assert.equal(report.events.filter(e => e.kind === 'finalizeConcert').length, 1);
  assert.deepEqual(report.totals.calendarIncome, zeros());
  assert.deepEqual(report.totals.calendarLostAtCap, zeros());
});

test('complete turn logs still disclose missing actual concert income in legacy marker-only saves', () => {
  let s = fixture(1); s.gl.tokens = zeros();
  for (let turn = 1; turn <= 24; turn++) {
    const next = E.advance(s, sc, rest);
    R.recordTurn(s, next, sc, null, rest);
    if (next.gl.pendingConcert) {
      E.finalizeConcert(next, sc);
      delete next.gl.finalizationEvent; // An older save did not store receipts.
      R.event(next, 'finalizeConcert', {turn, concertIndex: 0});
    }
    s = next;
  }
  const report = R.build(s, sc);
  assert.equal(report.coverage.detailedTurns, 24);
  assert.equal(report.coverage.startsAfterTurnOne, false);
  assert.deepEqual(report.coverage.gaps, []);
  assert.deepEqual(report.coverage.unreconciledTurns, []);
  assert.equal(report.coverage.concertIncomeComplete, false);
  assert.deepEqual(report.coverage.missingConcertIncomeTurns, [24]);
  assert.deepEqual(report.totals.calendarIncome, Array(5).fill(10), 'only the recorded Make Debut reward counts');
  assert.match(R.format(report, sc).split('\n\n')[0], /Calendar income history is incomplete.*24/);
  assert.deepEqual(R.build(copy(s), sc), report);
});

test('pending rewards are not missing records, and actual receipts including zero income establish coverage', () => {
  const s = pending();
  let report = R.build(s, sc);
  assert.equal(report.coverage.concertIncomeComplete, true);
  assert.deepEqual(report.coverage.missingConcertIncomeTurns, []);
  E.finalizeConcert(s, sc); R.recordFinalization(s, sc, 24);
  report = R.build(s, sc);
  assert.equal(report.coverage.concertIncomeComplete, true);
  assert.deepEqual(report.coverage.missingConcertIncomeTurns, []);
  assert.doesNotMatch(R.format(report, sc).split('\n\n')[0], /Calendar income history is incomplete/);
  const final = pending(72);
  E.finalizeConcert(final, sc); R.recordFinalization(final, sc, 72);
  assert.equal(R.build(final, sc).coverage.missingConcertIncomeTurns.includes(72), false);
});

test('older command records with reconciled immediate calendar income do not require a new receipt', () => {
  const before = fixture();
  const after = E.advance(before, sc, rest);
  E.finalizeConcert(after, sc);
  delete after.gl.finalizationEvent;
  // Older versions resolved the reward before the command diagnostics were made.
  R.recordTurn(before, after, sc, null, rest);
  const report = R.build(after, sc);
  assert.deepEqual(report.totals.calendarIncome, Array(5).fill(10));
  assert.deepEqual(report.turns[0].performance.unreconciled, zeros());
  assert.equal(report.coverage.concertIncomeComplete, true);
  assert.deepEqual(report.coverage.missingConcertIncomeTurns, []);
});
