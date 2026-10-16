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
    ui.doc.querySelector("#lh20Undo").click();
    assert.equal(ui.saved().stats.guts, 400);
    assert.equal(ui.saved().gl.tokens[1], 20);
    ui.doc.querySelector('[data-outing-result="great"]').click();
    assert.match(ui.doc.querySelector("#call .after").textContent, /68/);
    ui.doc.querySelector("#doneBtn").click();
    assert.equal(ui.saved().energy, 68);
    assert.equal(ui.saved().gl.hints[201662], 3);
    ui.doc.querySelector("#undoBtn").click();
    assert.equal(ui.saved().deck.slots[0].dates.done, 4);
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

  const state = fixture();
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
  } finally { ui.w.close(); }
  console.log("Hello DOM integration: SSR/R events, Undo, actual outing outcome, target search and diagnostics passed.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
