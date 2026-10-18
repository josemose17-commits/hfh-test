// Handler-level DOM diagnostics only. No real browser, network, or production edits.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
// Uses an already available jsdom installation; no browser or network.
const {JSDOM} = require('jsdom');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function fixture() {
  return {
    v: 2, scenario: 'grandlive', turn: 24, energy: 80, maxEnergy: 100, mood: 3,
    build: 'medium', risk: 12, resetMode: 'off', trackStats: true,
    meFix: 1, fcalFix: 1, strengthFix: 1, caps: {}, sparks: {}, targets: {},
    stats: {speed: 300, stamina: 200, power: 250, guts: 150, wit: 200},
    goals: [], goalsOff: [], goalRace: false, extras: {}, calib: [], fcal: [], log: [],
    race: '', fans: 0, tab: 'plan', conditions: {}, facLevels: {},
    gl: {songs: {}, tokens: [100, 100, 100, 100, 100], lessons: {}, shop: {}, focus: 'songs'},
    deck: {trainee: null, globalOnly: true, slots: [null, null, null, null, null, null]},
    facilities: ['speed', 'stamina', 'power', 'guts', 'wit'].map(stat => ({stat, gain: 20, fail: 0, cards: 0, members: [], hints: [], extra: 0, extras: {}}))
  };
}
function load(state) {
  const dom = new JSDOM(html, {url: 'https://coach.example/', runScripts: 'outside-only', pretendToBeVisual: true});
  const w = dom.window;
  w.matchMedia = () => ({matches: false, addEventListener() {}});
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.fetch = async url => {
    const p = path.resolve(root, String(url).split('?')[0]);
    if (!p.startsWith(root + path.sep) || !fs.existsSync(p)) return {ok: false, status: 404};
    return {ok: true, json: async () => JSON.parse(fs.readFileSync(p, 'utf8'))};
  };
  w.localStorage.setItem('uma-turn-coach-v2', JSON.stringify(state));
  for (const match of html.matchAll(/<script src="([^"?]+)(?:[^"]*)"/g)) {
    if (match[1] === 'app.js') w.eval(fs.readFileSync(path.join(root, 'data/euophrys-cards.js'), 'utf8'));
    w.eval(fs.readFileSync(path.join(root, match[1]), 'utf8'));
  }
  return {dom, w, doc: w.document, saved: () => JSON.parse(w.localStorage.getItem('uma-turn-coach-v2'))};
}
function enterPending(ui) {
  const done = ui.doc.querySelector('#doneBtn');
  assert.ok(done); assert.equal(done.disabled, false);
  done.click();
  const s = ui.saved();
  assert.equal(s.turn, 25);
  assert.equal(s.gl.pendingConcert.turn, 24);
  return s;
}

test('actual Done handler enters pre-stage, disables Done, and exposes Step on stage', () => {
  const ui = load(fixture());
  try {
    enterPending(ui);
    assert.equal(ui.doc.querySelector('#doneBtn').disabled, true);
    assert.ok(ui.doc.querySelector('#stepStageBtn'));
  } finally {ui.w.close();}
});

test('actual Step on stage credits the report with the receipt once, across another click and reload', () => {
  const ui = load(fixture());
  let reload;
  try {
    enterPending(ui);
    let helperCalls = 0;
    const original = ui.w.UmaRunReport.recordFinalization;
    ui.w.UmaRunReport.recordFinalization = function (...args) {helperCalls++; return original.apply(this, args);};
    const stage = ui.doc.querySelector('#stepStageBtn');
    stage.click();
    stage.click();
    const s = ui.saved();
    assert.equal(s.gl.pendingConcert, undefined);
    assert.equal(ui.doc.querySelector('#stepStageBtn'), null);
    assert.equal(ui.doc.querySelector('#doneBtn').disabled, false);
    const receipt = s.gl.finalizationEvent[24];
    const events = (s.runPending || []).filter(x => x.kind === 'finalizeConcert');
    assert.equal(events.length, 1);
    reload = load(s);
    const loaded = reload.saved();
    const sc = reload.w.UmaScenarios.SCENARIOS.find(x => x.id === 'grandlive');
    const report = JSON.parse(JSON.stringify(reload.w.UmaRunReport.build(loaded, sc)));
    const evidence = {helperCalls, receipt, events, calendarIncome: report.totals.calendarIncome,
      calendarLostAtCap: report.totals.calendarLostAtCap, finalizedConcert: report.concerts.find(x => x.turn === 24),
      eventCountAfterReload: report.events.filter(x => x.kind === 'finalizeConcert').length};
    assert.equal(helperCalls, 1, 'the real handler must call the receipt recorder once');
    assert.deepEqual(report.totals.calendarIncome, receipt.credited, 'actual credited income must survive the real handler and reload');
    assert.deepEqual(report.totals.calendarLostAtCap, receipt.lostAtCap);
    assert.equal(evidence.eventCountAfterReload, 1);
    const before = JSON.stringify(reload.saved());
    for (let i = 0; i < 3; i++) assert.deepEqual(JSON.parse(JSON.stringify(reload.w.UmaRunReport.build(loaded, sc))), report);
    assert.equal(JSON.stringify(reload.saved()), before);
  } finally {if (reload) reload.w.close(); ui.w.close();}
});

test('actual Step on stage records capped credits and losses from manually entered balances', () => {
  const s = fixture(); s.turn = 25;
  s.gl.pendingConcert = {turn: 24, concertIndex: 0};
  s.gl.tokens = [248, 250, 245, 249, 240];
  const ui = load(s);
  try {
    ui.doc.querySelector('#stepStageBtn').click();
    const saved = ui.saved();
    const sc = ui.w.UmaScenarios.SCENARIOS.find(x => x.id === 'grandlive');
    const report = JSON.parse(JSON.stringify(ui.w.UmaRunReport.build(saved, sc)));
    assert.deepEqual(report.totals.calendarIncome, [2, 0, 5, 1, 10]);
    assert.deepEqual(report.totals.calendarLostAtCap, [8, 10, 5, 9, 0]);
    assert.equal(report.events.filter(e => e.kind === 'finalizeConcert').length, 1);
  } finally {ui.w.close();}
});
