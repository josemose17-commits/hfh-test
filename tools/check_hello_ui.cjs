// Optional DOM integration check, including the real app.js event handlers.
// Requires jsdom in Node's module path. No browser or network is used.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

function fixture(id = 30052, done = 4) {
  return {
    v: 2, scenario: "grandlive", turn: 30, energy: 20, maxEnergy: 100, mood: 2, build: "medium", risk: 12,
    resetMode: "off", trackStats: true, meFix: 1, fcalFix: 1, caps: {}, sparks: {}, targets: {},
    stats: { speed: 400, stamina: 400, power: 400, guts: 400, wit: 400 },
    goals: [], goalsOff: [], goalRace: false, extras: {}, calib: [], fcal: [], log: [], race: "", fans: 0,
    gl: { songs: {}, tokens: [50, 20, 40, 30, 60], lessons: {} }, facLevels: {}, tab: "plan",
    deck: { trainee: null, globalOnly: true, slots: [{ id, lb: 4, bond: 90, met: true, dates: { unlocked: true, done } }, null, null, null, null, null] },
    facilities: ["speed", "stamina", "power", "guts", "wit"].map((stat) => ({ stat, gain: null, fail: 0, cards: 0, members: [], hints: [], extra: 0, extras: {} }))
  };
}
function load(state, owned) {
  const dom = new JSDOM(html, { url: "https://coach.example/", runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;
  w.matchMedia = () => ({ matches: false, addEventListener() {} });
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.fetch = async (url) => {
    const p = path.resolve(root, String(url).split("?")[0]);
    if (!p.startsWith(root + path.sep) || !fs.existsSync(p)) return { ok: false, status: 404 };
    return { ok: true, json: async () => JSON.parse(fs.readFileSync(p, "utf8")) };
  };
  w.localStorage.setItem("uma-turn-coach-v2", JSON.stringify(state));
  if (owned) w.localStorage.setItem("uma-owned-v1", JSON.stringify(owned));
  for (const match of html.matchAll(/<script src="([^"?]+)(?:[^"]*)"/g)) {
    // The tier data are normally lazy-loaded. Load them before the app for this
    // offline test so jsdom doesn't need to execute dynamically inserted scripts.
    if (match[1] === "app.js") w.eval(fs.readFileSync(path.join(root, "data/euophrys-cards.js"), "utf8"));
    w.eval(fs.readFileSync(path.join(root, match[1]), "utf8"));
  }
  return { w, dom, doc: w.document, saved: () => JSON.parse(w.localStorage.getItem("uma-turn-coach-v2")) };
}

(async () => {
  let ui = load(fixture());
  try {
    assert.match(ui.doc.querySelector("#call").textContent, /Outing with Light Hello \(5\/5\)/);
    ui.doc.querySelector("#lh20Add").click();
    assert.equal(ui.saved().gl.tokens[1], 40);
    assert.equal(ui.saved().stats.guts, 404);
    assert.equal(ui.saved().deck.slots[0].bond, 97);
    assert.equal(ui.saved().runPending.filter((e) => e.kind === "helloEvent").length, 1);
    ui.doc.querySelector("#lh20Undo").click();
    assert.equal(ui.saved().stats.guts, 400);
    assert.equal(ui.saved().gl.tokens[1], 20);
    assert.equal((ui.saved().runPending || []).length, 0);
    ui.doc.querySelector('[data-outing-result="great"]').click();
    assert.match(ui.doc.querySelector("#call .after").textContent, /68/);
    ui.doc.querySelector("#doneBtn").click();
    assert.equal(ui.saved().energy, 68);
    assert.equal(ui.saved().gl.hints[201662], 3);
    ui.doc.querySelector("#undoBtn").click();
    assert.equal(ui.saved().deck.slots[0].dates.done, 4);
  } finally { ui.w.close(); }

  const migraineOuting = fixture(); migraineOuting.conditions = { migraine: true };
  ui = load(migraineOuting);
  try {
    assert.match(ui.doc.querySelector("#call .after").textContent, /mood Normal/);
    ui.doc.querySelector('[data-outing-result="great"]').click();
    assert.match(ui.doc.querySelector("#call .after").textContent, /mood Normal/);
    ui.doc.querySelector("#doneBtn").click();
    assert.equal(ui.saved().mood, 2);
  } finally { ui.w.close(); }

  ui = load(fixture(10083));
  try {
    const outingDetails = ui.doc.querySelector(".dates").textContent;
    assert.match(outingDetails, /Playtime's Over!/);
    assert.doesNotMatch(outingDetails, /See Ya Later!/);
    ui.doc.querySelector("#lhAmount").value = "10";
    ui.doc.querySelector("#lh20Add").click();
    assert.equal(ui.saved().gl.tokens[1], 30);
  } finally { ui.w.close(); }

  const purchase = fixture(); purchase.turn = 18; purchase.gl.tokens = [100, 100, 100, 100, 100];
  purchase.gl.shop = { "song:zensoku": { turn: 18 } };
  ui = load(purchase);
  try {
    ui.doc.querySelector('[data-song-buy="zensoku"]').click();
    assert.equal(ui.saved().stats.speed, 422, "the actual Bought handler adds the one-time reward");
    assert.equal(ui.saved().gl.tokens[0], 68);
    ui.doc.querySelector("[data-tech-undo]").click();
    assert.equal(ui.saved().stats.speed, 400);
    assert.equal(ui.saved().gl.tokens[0], 100);
    const before = ui.saved().stats.speed;
    ui.doc.querySelector("#songAddTurn").value = "10";
    const add = ui.doc.querySelector("#songAdd"); add.value = "runrun";
    add.dispatchEvent(new ui.w.Event("change", { bubbles: true }));
    assert.equal(ui.saved().gl.songs.runrun, 10);
    assert.equal(ui.saved().stats.speed, before, "backfilling history leaves current stats intact");
  } finally { ui.w.close(); }

  const unknown = fixture(); unknown.turn = 18; unknown.gl.tokens = [0, 0, 0, 0, 100];
  unknown.gl.shop = { "energy:20": {} };
  ui = load(unknown);
  try {
    assert.equal(ui.doc.querySelector('[data-song-buy="zensoku"]').disabled, true);
    assert.equal(ui.doc.querySelector('[data-tech-buy="energy:20"]').disabled, true);
    const type = ui.doc.querySelector('[data-tech-type="energy:20"]'); type.value = "4";
    type.dispatchEvent(new ui.w.Event("change", { bubbles: true }));
    assert.equal(ui.doc.querySelector('[data-tech-buy="energy:20"]').disabled, false);
    ui.doc.querySelector('[data-tech-buy="energy:20"]').click();
    assert.equal(ui.saved().energy, 40); assert.equal(ui.saved().gl.tokens[4], 75);
  } finally { ui.w.close(); }

  const carried = fixture(); carried.turn = 25; carried.gl.tokens = [100, 100, 100, 100, 100];
  carried.gl.shop = { "stat:speed": { turn: 24 } };
  ui = load(carried);
  try {
    const button = ui.doc.querySelector('[data-tech-buy="stat:speed"]');
    assert.match(button.closest(".shop-row").textContent, /Speed \+5/);
    button.click();
    assert.equal(ui.saved().stats.speed, 405); assert.equal(ui.saved().gl.tokens[0], 90);
  } finally { ui.w.close(); }

  const late = fixture(); late.turn = 72;
  late.gl.songs = Object.fromEntries(require("../scenarios.js").SCENARIOS.find((s) => s.id === "grandlive").songs.slice(0, 17).map((song, i) => [song.id, i === 16 ? 72 : 60]));
  ui = load(late);
  try {
    assert.match(ui.doc.querySelector(".gl-status").textContent, /17 of 18 by turn 71/);
  } finally { ui.w.close(); }

  const treatment = fixture(30052, 5); treatment.energy = 100;
  treatment.conditions = { migraine: true, nightOwl: true, perfect: true };
  treatment.facilities.forEach((f) => { f.fail = 100; });
  ui = load(treatment);
  try {
    assert.match(ui.doc.querySelector("#call .headline").textContent, /Infirmary/);
    ui.doc.querySelector('[data-cure-result="no"]').click();
    ui.doc.querySelector("#doneBtn").click();
    assert.equal(ui.saved().conditions.migraine, true);
    ui.doc.querySelector("#undoBtn").click();
    ui.doc.querySelector('[data-cure-result="yes"]').click();
    ui.doc.querySelector("#doneBtn").click();
    assert.equal(ui.saved().conditions.migraine, false);
    assert.equal(ui.saved().conditions.perfect, true);
  } finally { ui.w.close(); }

  const state = fixture();
  const storage = fixture(30052, 5); storage.turn = 25; storage.energy = 100;
  ui = load(storage);
  try {
    for (let i = 0; i < 6; i++) {
      const energy = ui.doc.querySelector("#energy"); energy.value = "100";
      energy.dispatchEvent(new ui.w.Event("input", { bubbles: true }));
      assert.equal(ui.w.UmaEngine.recommend(ui.saved(), ui.w.UmaScenarios.SCENARIOS.find((s) => s.id === "grandlive")).action.kind, "train");
      ui.doc.querySelector("#doneBtn").click();
      ui.doc.querySelector("#lh20Type").value = "1";
      ui.doc.querySelector("#lh20Add").click();
      assert.equal(ui.saved().gl.lh20Undo.v, 2);
      assert.equal(JSON.parse(ui.saved().gl.lh20Undo.before).log, undefined);
      assert.ok(ui.w.localStorage.getItem("uma-turn-coach-v2").length < 500000, "event backups must not embed the growing turn history");
    }
    assert.equal(ui.saved().gl.helloEvents.length, 6);
    const turns = ui.saved().log.length;
    ui.doc.querySelector("#doneBtn").click();
    ui.doc.querySelector("#undoBtn").click();
    ui.doc.querySelector("#lh20Undo").click();
    assert.equal(ui.saved().log.length, turns, "Hello Undo preserves the independently restored turn history");
    assert.equal(ui.saved().gl.helloEvents.length, 5);
  } finally { ui.w.close(); }

  const diagnostics = fixture(30052, 5); diagnostics.energy = 100;
  diagnostics.gl.tokens = [100, 100, 100, 100, 100]; diagnostics.gl.shop = { "song:tachiichi": { turn: 30 } };
  ui = load(diagnostics);
  try {
    // Export is available with reset advice off, before any command is logged.
    ui.doc.querySelector('[data-tab="log"]').click();
    const note = ui.doc.querySelector("[data-run-why]"); note.value = "second concert check";
    note.dispatchEvent(new ui.w.Event("input", { bubbles: true }));
    ui.doc.querySelector("#tabBody [data-run-copy]").click();
    let report = JSON.parse(ui.doc.querySelector("#tabBody [data-run-output]").value.split("\n\n").slice(-1)[0]);
    assert.equal(report.why, "second concert check"); assert.equal(report.coverage.loggedTurns, 0);
    ui.doc.querySelector('[data-song-buy="tachiichi"]').click();
    const songCost = ui.w.UmaScenarios.SCENARIOS.find((s) => s.id === "grandlive").songs.find((s) => s.id === "tachiichi").cost;
    assert.equal(ui.saved().runPending[0].kind, "purchase");
    // Entered balances are corrections, not training income.
    const balance = ui.doc.querySelector('[data-tok="4"]'); balance.value = String(+balance.value + 7);
    balance.dispatchEvent(new ui.w.Event("input", { bubbles: true }));
    const rec = ui.w.UmaEngine.recommend(ui.saved(), ui.w.UmaScenarios.SCENARIOS.find((s) => s.id === "grandlive"));
    const alternative = rec.ranked.findIndex((o, i) => i > 0 && o.kind === "train");
    assert.ok(alternative > 0);
    ui.doc.querySelector('[data-row="' + alternative + '"]').click();
    ui.doc.querySelector('[data-did="' + alternative + '"]').click();
    const log = ui.saved().log[0];
    assert.equal(log.diagnostics.followedRecommendation, false);
    assert.equal(log.diagnostics.events.length, 2);
    assert.equal(ui.saved().runPending, undefined);
    ui.doc.querySelector("#tabBody [data-run-copy]").click();
    report = JSON.parse(ui.doc.querySelector("#tabBody [data-run-output]").value.split("\n\n").slice(-1)[0]);
    assert.equal(report.coverage.detailedTurns, 1);
    assert.deepEqual(report.totals.netPurchaseSpend, Array.from(songCost));
    assert.equal(report.totals.balanceCorrections[4], 7);
    assert.deepEqual(report.totals.unreconciled, [0, 0, 0, 0, 0]);
    assert.equal(report.turns[0].inputs.facilities.length, 5);
    let downloaded;
    ui.w.URL.createObjectURL = (blob) => { assert.equal(blob.type, "application/json"); return "blob:run-report"; };
    ui.w.URL.revokeObjectURL = () => {};
    ui.w.HTMLAnchorElement.prototype.click = function () { downloaded = this.download; };
    ui.doc.querySelector("#tabBody [data-run-download]").click();
    assert.equal(downloaded, "uma-run-grandlive-turn-31.json");
    ui.doc.querySelector("#undoBtn").click();
    assert.equal(ui.saved().log.length, 0); assert.equal(ui.saved().runPending.length, 2);
    ui.doc.querySelector("#report [data-run-copy]").click();
    report = JSON.parse(ui.doc.querySelector("#reportOut").value.split("\n\n").slice(-1)[0]);
    assert.equal(report.events.length, 2); assert.equal(report.coverage.loggedTurns, 0);
  } finally { ui.w.close(); }

  const feedback = fixture(); feedback.turn = 34; feedback.energy = 80;
  feedback.gl.songs = { tachiichi: 20 };
  feedback.facilities[0].members = [0];
  ui = load(feedback);
  try {
    assert.match(ui.doc.querySelector(".song-progress").textContent, /Songs: 2 total/);
    assert.match(ui.doc.querySelector(".song-progress").textContent, /3 more before the concert on turn 36/);
    assert.equal(ui.doc.querySelector('.advanced-techniques').open, false);
    assert.equal(ui.doc.querySelector("#grandFocus").value, "songs");
    const explanation = ui.doc.querySelector("#callExplanation"); explanation.open = true;
    const before = ui.saved().deck.slots[0].bond;
    ui.doc.querySelector('[data-training-bond="0"][data-add="5"]').click();
    assert.equal(ui.saved().deck.slots[0].bond, Math.min(100, before + 5));
    assert.equal(ui.doc.querySelector("#callExplanation").open, true);
    ui.doc.querySelector('[data-energy="5"]').click(); assert.equal(ui.saved().energy, 85);
    ui.doc.querySelector("#maxEnergyPlus4").click(); assert.equal(ui.saved().maxEnergy, 104);
    const selectCondition = (id, checked = true) => {
      const el = ui.doc.querySelector('[data-condition="' + id + '"]'); el.checked = checked;
      el.dispatchEvent(new ui.w.Event("change", { bubbles: true }));
    };
    selectCondition("charming"); assert.equal(ui.saved().conditions.charming, true);
    ui.doc.querySelector("#practicePoor").checked = true;
    ui.doc.querySelector("#practicePoor").dispatchEvent(new ui.w.Event("change", { bubbles: true }));
    selectCondition("perfect");
    assert.equal(ui.saved().practicePoor, false); assert.equal(ui.saved().conditions.perfect, true);
    assert.match(ui.doc.querySelector("#conditionsBody").textContent, /Slow Metabolism/);
  } finally { ui.w.close(); }

  const ids = [30002, 30016, 30010, 30078, 30043, 30052];
  state.tab = "cm";
  state.cm = { goal: "race", ownedOnly: true, borrow: false, targets: { speed: 1500 }, locked: ids, helloProcRate: "0.36", helloUnlockRate: "0.3" };
  ui = load(state, Object.fromEntries(ids.map((id) => [id, 4])));
  try {
    ui.doc.querySelector("#cmRun").click();
    for (let i = 0; i < 100 && !ui.doc.querySelector("#cmOut .predicted"); i++) await new Promise((resolve) => setTimeout(resolve, 50));
    const result = ui.doc.querySelector("#cmOut").textContent;
    assert.match(result, /Extra Hello Performance:/);
    assert.match(result, /Event rate used: 36%/);
    assert.match(result, /Outing unlock assumption: 30%/);
    assert.doesNotMatch(result, /metadata missing/);
    assert.match(result, /Fifth outing completed/);
    assert.match(result, /Event skills and training hints/);
    assert.ok(ui.doc.querySelector("#skillBudget"), "Grand Concert displays the affordable purchase model");
    assert.match(ui.doc.querySelector("#skillBudget").textContent, /no extra raw-SP bonus/);
    assert.ok(ui.doc.querySelector("#supportEventRewards"), "coupled event coverage is displayed");
    assert.match(ui.doc.querySelector("#supportEventRewards").textContent, /same chosen outcome/);
    assert.match(ui.doc.querySelector("#supportEventRewards").textContent, /Hello lifecycle/);
  } finally { ui.w.close(); }

  const compare = fixture(30052, 5); compare.tab = "cm";
  compare.deck.trainee = 100101;
  compare.cm = { goal: "race", ownedOnly: true, borrow: false, targets: {}, locked: ids.filter((id) => id !== 30078), comp: { speed: 2, stamina: 2, wit: 1, friend: 1 } };
  ui = load(compare, Object.fromEntries(ids.concat([30028]).map((id) => [id, 4])));
  try {
    const original = ui.w.UmaOptimizer.sensitivity;
    ui.w.UmaOptimizer.sensitivity = (sim, candidates, settings) => original(sim, candidates, settings || { runs: 2, seeds: [857563, 962293], profiles: [{ name: "Selected assumptions" }, { name: "Assumed boost 10%", eventSongBoost: 0.1 }] });
    assert.equal(ui.doc.querySelector('[data-cm="eventSuccessRate"]').value, "0.5");
    assert.equal(ui.doc.querySelector('[data-cm="eventSongBoost"]').value, "0");
    await new Promise((resolve) => setTimeout(resolve, 50));
    ui.doc.querySelector("#cmRun").click();
    for (let i = 0; i < 1000 && !ui.doc.querySelector(".opt-result"); i++) await new Promise((resolve) => setTimeout(resolve, 50));
    assert.ok(ui.doc.querySelector(".opt-result"), "Grand Concert refinement with blank target inputs completes");
    assert.match(ui.doc.querySelector("#cmOut").textContent, /Predicted stats vs your targets/);
    assert.match(ui.doc.querySelector("#cmOut").textContent, /Event-skill source coverage/);
    assert.ok(ui.doc.querySelector("#skillBudget"));
    const example = ui.doc.querySelector("#skillBudgetExample");
    const totals = example.textContent.match(/One simulated career: (\d+) SP, (\d+) spent, (\d+) left/);
    assert.ok(totals, "purchase example reports a complete SP budget");
    assert.equal(+totals[1], +totals[2] + +totals[3]);
    let displayedCost = 0;
    example.querySelectorAll("tbody tr").forEach((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length !== 2) return;
      const total = +cells[0].textContent;
      const tierSum = [...cells[1].textContent.matchAll(/(\d+) SP \(hint Lv\d\)/g)].reduce((n, m) => n + +m[1], 0);
      assert.equal(total, tierSum); displayedCost += total;
    });
    assert.equal(displayedCost, +totals[2]);
    const ledger = ui.doc.querySelector("#supportEventExample");
    assert.ok(ledger.querySelectorAll("tbody tr").length > 0);
    assert.match(ledger.textContent, /Events occur after that turn's command/);
    assert.match(ui.doc.querySelector("#supportEventRewards").textContent, /Coupled parsed rewards/);
    const shownEvents = [...ledger.querySelectorAll("tbody tr")].filter((row) => row.querySelectorAll("td").length === 4);
    assert.ok(shownEvents.length > 0, "ledger contains actual selected outcomes");
    shownEvents.forEach((row) => { const turn = +row.querySelector("td").textContent; assert.ok(turn >= 1 && turn <= 78); });
    const raceRows = [...ui.doc.querySelectorAll("#cmSkillTable tbody tr")];
    assert.ok(raceRows.some((row) => row.classList.contains("sk-gold")), "race table includes gold prices");
    raceRows.forEach((row) => {
      const id = row.querySelector("[data-must]").dataset.must;
      const cells = row.querySelectorAll("td"), fullPrice = ui.w.UmaSkillBudget.baseCost(id);
      assert.equal(cells[3].textContent, fullPrice == null ? "Unknown" : String(fullPrice));
      if (fullPrice) assert.equal(cells[4].textContent, (+cells[1].textContent / fullPrice * 100).toFixed(2));
    });
    assert.equal(ui.doc.querySelector("#cmSensitivity").disabled, false, ui.doc.querySelector("#cmOut").textContent.slice(0, 350));
    ui.doc.querySelector("#cmSensitivity").click();
    for (let i = 0; i < 1000 && !ui.doc.querySelector("#sensitivityResult"); i++) await new Promise((resolve) => setTimeout(resolve, 50));
    assert.ok(ui.doc.querySelector("#sensitivityResult"));
    assert.match(ui.doc.querySelector("#sensitivityResult").textContent, /held-out seeds/);
    assert.match(ui.doc.querySelector("#sensitivityResult").textContent, /not confidence intervals/);
    assert.match(ui.doc.querySelector("#sensitivityResult").textContent, /SP contributes through the skills it can buy/);
    ui.doc.querySelector("#cmWish").click();
    for (let i = 0; i < 1000 && !ui.doc.querySelector("#wishlistMethod"); i++) await new Promise((resolve) => setTimeout(resolve, 50));
    assert.ok(ui.doc.querySelector("#wishlistMethod"));
    assert.match(ui.doc.querySelector("#wishlistMethod").textContent, /target fit and affordable skills/);
    assert.match(ui.doc.querySelector("#wishlistMethod").textContent, /8 careers per deck on paired seed 857563/);
    const boost = ui.doc.querySelector('[data-cm="eventSongBoost"]'); boost.value = "0.1";
    boost.dispatchEvent(new ui.w.Event("input", { bubbles: true }));
    assert.equal(ui.saved().cm.eventSongBoost, "0.1");
    assert.match(ui.doc.querySelector("#cmOut").textContent, /Settings or cards changed/);
    assert.equal(ui.doc.querySelector("#cmSensitivity").disabled, true);
    assert.equal(ui.doc.querySelector("#cmWish").disabled, true);
  } finally { ui.w.close(); }
  console.log("Coach DOM integration: coach controls, run exports, coupled event coverage/ledger, affordable purchases, Grand Concert refinement, paired sensitivity and upgrade comparisons passed.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
