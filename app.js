// UI for the turn coach. Depends on scenarios.js and engine.js (globals).
(function () {
  const { SCENARIOS, STATUS_LABELS } = window.UmaScenarios;
  const E = window.UmaEngine;
  const STORE_KEY = "uma-turn-coach-v2";
  const PIP_MAX = 5;

  const D = window.UmaDeck;
  const HAS_DATA = !!(D && D.DATA);
  const TODAY = new Date().toISOString().slice(0, 10);
  const APT = ["Turf", "Dirt", "Sprint", "Mile", "Medium", "Long", "Front", "Pace", "Late", "End"];
  const FX_SHORT = { 1: "Friendship", 8: "Training", 2: "Mood", 15: "Race", 19: "Specialty", 14: "Init. bond", 30: "SP bonus", 3: "Spd bonus", 4: "Sta bonus", 5: "Pow bonus", 6: "Gut bonus", 7: "Wit bonus", 27: "Fail prot.", 28: "Energy cut", 31: "Wit recovery", 41: "All stats", 18: "Hint rate", 17: "Hint Lv" };
  const blankFacility = (stat) => ({ stat, gain: null, cards: 0, rainbows: 0, unbonded: 0, hint: false, fail: null, extras: {}, members: [], hints: [], extra: 0 });
  const blankGl = () => ({ songs: {}, tokens: [0, 0, 0, 0, 0] });
  const GAUGE = [["Blue", 40, "g-blue"], ["Green", 60, "g-green"], ["Orange", 80, "g-orange"], ["Max", 100, "g-max"]];
  const blankDeck = () => ({ trainee: null, slots: [null, null, null, null, null, null], globalOnly: true });
  const resetBonds = (d) => Object.assign({}, d, { slots: d.slots.map((sl) => (sl ? { id: sl.id, lb: sl.lb, bond: null, dates: { unlocked: false, done: 0 } } : null)) });

  function freshState(keep) {
    const k = keep || {};
    return {
      v: 2,
      scenario: k.scenario || "ura",
      build: k.build || "medium",
      risk: k.risk != null ? k.risk : 12,
      raceBonus: k.raceBonus || 0,
      maxEnergy: k.maxEnergy || 100,
      trackStats: k.trackStats != null ? k.trackStats : true,
      calib: k.calib || [],
      fcal: k.fcal || [],
      caps: k.caps || {},
      deck: k.deck ? resetBonds(k.deck) : blankDeck(),
      gl: blankGl(),
      facLevels: {},
      db: k.db || null,
      cm: k.cm || null,
      turn: 1,
      energy: 100,
      mood: 2,
      goalRace: false,
      badCondition: false,
      race: "",
      goals: [],
      extras: {},
      stats: {},
      log: [],
      tab: k.tab || "plan",
      facilities: E.STATS.map(blankFacility)
    };
  }

  // Opens on an example summer-camp turn so the coach has something to show.
  function exampleState() {
    const s = freshState();
    Object.assign(s, { turn: 38, energy: 62, mood: 3, example: true });
    s.facilities = [
      { stat: "speed", gain: null, cards: 3, rainbows: 2, unbonded: 0, hint: false, fail: null, extras: {} },
      { stat: "stamina", gain: null, cards: 1, rainbows: 0, unbonded: 0, hint: true, fail: null, extras: {} },
      { stat: "power", gain: null, cards: 2, rainbows: 1, unbonded: 1, hint: false, fail: null, extras: {} },
      { stat: "guts", gain: null, cards: 0, rainbows: 0, unbonded: 0, hint: false, fail: null, extras: {} },
      { stat: "wit", gain: null, cards: 1, rainbows: 0, unbonded: 0, hint: false, fail: null, extras: {} }
    ].map((f) => Object.assign(blankFacility(f.stat), f));
    return s;
  }

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && s.v === 2 && s.facilities && s.facilities.length === 5) {
        s.deck = s.deck || blankDeck();
        s.facLevels = s.facLevels || {};
        s.facilities.forEach((f) => { f.members = f.members || []; f.hints = f.hints || []; f.extra = f.extra || 0; });
        s.gl = s.gl || blankGl();
        return s;
      }
    } catch (e) { /* storage unavailable */ }
    return exampleState();
  }

  let state = load();

  // ---- Cards you own: { card id: limit break }, kept apart from careers ----
  const OWN_KEY = "uma-owned-v1";
  let owned = {};
  try { owned = JSON.parse(localStorage.getItem(OWN_KEY)) || {}; } catch (e) { owned = {}; }
  function saveOwned() { try { localStorage.setItem(OWN_KEY, JSON.stringify(owned)); } catch (e) { /* ignore */ } }
  const ownedLb = (id) => (owned[id] != null ? +owned[id] : null);
  const ownedIds = () => Object.keys(owned).map(Number).filter((id) => D && D.card(id));
  const ownedCode = () => D.encodeOwned(owned);
  const readOwnedCode = (text) => D.decodeOwned(text);
  let rec = null;
  let openRow = null;
  let resetArmed = null;

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const scenario = () => SCENARIOS.find((s) => s.id === state.scenario) || SCENARIOS[0];
  const numOrNull = (v) => (v === "" || v == null || isNaN(+v) ? null : +v);
  const score = (v) => (v >= 1e4 ? "must" : Math.round((v / Math.max(1, rec ? rec.typ : 1)) * 100));

  function shell() {
    document.getElementById("app").innerHTML = `
      <header class="masthead">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true"></span>
          <div>
            <h1>Uma Turn Coach</h1>
            <p class="sub">Enter what this turn shows. The coach picks the best action and explains why.</p>
          </div>
        </div>
        <div class="controls">
          <label class="field grow"><span>Scenario</span><select id="scenario"></select></label>
          <label class="field"><span>Build</span><select id="build"></select></label>
          <details class="settings" id="settings">
            <summary class="btn ghost">Settings</summary>
            <div class="settings-body">
              <label class="field"><span>Max failure you accept <b id="riskOut"></b></span><input id="risk" type="range" min="0" max="40" step="1"></label>
              <label class="field"><span>Deck race bonus %</span><input id="raceBonus" type="number" inputmode="numeric" min="0" max="100"></label>
              <label class="field"><span>Max energy</span><input id="maxEnergy" type="number" inputmode="numeric" min="100" max="150"></label>
              <button type="button" class="btn ghost" id="resetCalib">Forget learned deck strength</button>
              <p class="mini" id="calibNote"></p>
            </div>
          </details>
          <button type="button" class="btn ghost" id="newCareer">New career</button>
        </div>
      </header>

      <section class="turnbar" aria-label="Career turns">
        <div class="turn-head">
          <button type="button" id="prev" class="btn ghost square" aria-label="Previous turn" title="Previous turn (←)">◀</button>
          <div class="turn-now"><span id="turnNum"></span><span id="turnText"></span></div>
          <button type="button" id="next" class="btn ghost square" aria-label="Next turn" title="Next turn (→)">▶</button>
          <button type="button" id="goalToggle" class="btn ghost goal" aria-pressed="false">★ Goal race this turn</button>
        </div>
        <div class="strip" id="strip"></div>
        <div class="legend">
          <span><i class="sw y0"></i>Junior</span><span><i class="sw y1"></i>Classic</span><span><i class="sw y2"></i>Senior</span><span><i class="sw camp"></i>Summer camp</span><span><i class="sw fin"></i>Finale</span><span><i class="dot"></i>Key event</span><span><i class="star">★</i>Goal race</span><span><i class="done"></i>Logged</span>
        </div>
      </section>

      <div id="exampleNote" class="example-note" hidden>These are example values for a summer-camp turn. Press <b>New career</b> to start your own run, or overwrite the numbers.</div>

      <main class="grid">
        <section class="inputs" aria-label="This turn">
          <details class="panel deckpanel" id="deckPanel">
            <summary><h2>Trainee and deck</h2><span class="mini" id="deckSummary"></span></summary>
            <div class="deck-body">
              <div class="row-wrap">
                <label class="field grow"><span>Trainee</span><input id="traineeInput" list="traineeList" placeholder="Type a name, e.g. Special Week" autocomplete="off"></label>
                <label class="chip-toggle"><input type="checkbox" id="globalOnly"> Global only</label>
                <label class="chip-toggle"><input type="checkbox" id="ownedOnly"> Cards I own</label>
              </div>
              <div id="traineeInfo" class="trainee-info"></div>
              <div class="slots" id="slots"></div>
              <div class="row-wrap"><button type="button" class="btn ghost small" id="allBond">All cards +5 bond</button><span class="mini">For events or items that raise every card's bond (e.g. Trackblazer's Grilled Carrots).</span></div>
              <p class="mini">Bonds start at each card's initial value. Pressing Done adds 7 for every card you trained with, plus about 5 for a card that had a hint (!). Card events also raise bond: tap <b>+5</b> or <b>+10</b> when one happens, or tap the gauge color the game shows (orange = 80+, friendship unlocked). For Friend and Group cards like Light Hello, tick <b>Outings unlocked</b> once the game offers outings with her and the coach will weigh them against training.</p>
            </div>
          </details>
          <datalist id="traineeList"></datalist><datalist id="cardList"></datalist><datalist id="cardListAll"></datalist>

          <div class="panel status">
            <div class="row2">
              <div class="field">
                <span>Energy <b id="energyOut"></b></span>
                <div class="energy">
                  <button type="button" class="btn ghost square" data-energy="-10" aria-label="Energy minus 10">−</button>
                  <input id="energy" type="range" min="0" max="100" step="1" aria-label="Energy">
                  <button type="button" class="btn ghost square" data-energy="10" aria-label="Energy plus 10">+</button>
                  <input id="energyNum" type="number" inputmode="numeric" min="0" max="150" aria-label="Energy value">
                </div>
              </div>
              <div class="field"><span>Mood</span><div class="seg" id="mood" role="radiogroup" aria-label="Mood"></div></div>
            </div>
            <div class="row-wrap">
              <label class="field"><span>Optional race open</span>
                <select id="race"><option value="">None</option><option value="op">OP / Pre-OP</option><option value="g3">G3</option><option value="g2">G2</option><option value="g1">G1</option></select>
              </label>
              <label class="chip-toggle"><input type="checkbox" id="badCondition"> Bad condition</label>
            </div>
            <div id="turnExtras" class="extras"></div>
          </div>

          <details class="panel songs" id="songsPanel" hidden>
            <summary><h2>Grand Concert songs</h2><span class="mini" id="songSummary"></span></summary>
            <div class="songs-body" id="songsBody"></div>
          </details>

          <div class="fac-head">
            <h2>Trainings</h2>
            <button type="button" class="btn ghost small" id="clearFacs">Clear</button>
          </div>
          <div class="facilities" id="facilities"></div>
          <p class="mini" id="facHelp"></p>

          <details class="panel stats" id="statsPanel">
            <summary><h2>Stats and caps</h2><span class="mini">Optional. Lets the coach stop pushing stats that are capped or already enough.</span></summary>
            <div class="table-wrap"><table class="stat-table" id="statTable"></table></div>
            <label class="chip-toggle"><input type="checkbox" id="trackStats"> Add training gains to these when I press Done</label>
          </details>
        </section>

        <aside class="verdict" aria-live="polite">
          <div class="panel call" id="call"></div>
          <div class="panel" id="options"></div>
        </aside>
      </main>

      <nav class="tabs" role="tablist">
        <button type="button" role="tab" data-tab="plan">Turn plan</button>
        <button type="button" role="tab" data-tab="log">Career log</button>
        <button type="button" role="tab" data-tab="guide">Scenario guide</button>
        <button type="button" role="tab" data-tab="all">All scenarios</button>
        <button type="button" role="tab" data-tab="cm" id="tabCM">CM &amp; decks</button>
        <button type="button" role="tab" data-tab="cards" id="tabCards">Support cards</button>
        <button type="button" role="tab" data-tab="trainees" id="tabTrainees">Trainees</button>
      </nav>
      <section id="tabBody" class="tab-body"></section>
      <footer class="foot">Scenario notes are compiled from JP and Global guides as of October 2026 (Global after the July 2026 rebalance). Turns marked "approx." can shift, so the in-game goal list always wins. Scores are estimates: 100 means a typical training for this point in the career. Card, trainee and CM data from <a href="https://gametora.com/umamusume" target="_blank" rel="noopener">GameTora</a>${HAS_DATA ? " (built " + D.DATA.meta.built + ")" : ""}. Skill length gains from <a href="https://alpha123.github.io/uma-tools/umalator-global/" target="_blank" rel="noopener">alpha123's Umalator</a>. Fan-made tool, not affiliated with Cygames.</footer>
      <div class="dock" id="dock"><div class="dock-text" id="dockText"></div><button type="button" class="btn" id="dockDone">Done ▶</button></div>
    `;

    const sel = $("#scenario");
    const groups = [["global", "On Global now"], ["global-soon", "Coming to Global next"], ["jp-current", "JP latest"], ["jp", "JP only (future Global)"], ["announced", "Announced"]];
    sel.innerHTML = groups.map(([st, lab]) => {
      const items = SCENARIOS.filter((s) => s.status === st);
      return items.length ? `<optgroup label="${lab}">${items.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}</optgroup>` : "";
    }).join("");
    $("#build").innerHTML = Object.entries(E.BUILDS).map(([k, b]) => `<option value="${k}">${b.label}</option>`).join("");
    $("#mood").innerHTML = E.MOODS.map((m, i) => `<button type="button" role="radio" data-mood="${i}" class="mood m${i}">${m}</button>`).join("");

    sel.addEventListener("change", () => {
      state.scenario = sel.value;
      state.extras = {};
      state.caps = {};
      state.facilities.forEach((f) => (f.extras = {}));
      clampTurn();
      commit(true);
    });
    $("#build").addEventListener("change", (e) => { state.build = e.target.value; commit(true); });
    $("#risk").addEventListener("input", (e) => { state.risk = +e.target.value; commit(); });
    $("#raceBonus").addEventListener("input", (e) => { state.raceBonus = Math.max(0, +e.target.value || 0); commit(); });
    $("#maxEnergy").addEventListener("input", (e) => { const v = +e.target.value; if (v >= 100 && v <= 150) { state.maxEnergy = v; state.energy = Math.min(state.energy, v); commit(); } });
    $("#resetCalib").addEventListener("click", () => { state.calib = []; commit(); });
    $("#newCareer").addEventListener("click", newCareer);

    $("#energy").addEventListener("input", (e) => { state.energy = +e.target.value; $("#energyNum").value = state.energy; commit(); });
    $("#energyNum").addEventListener("input", (e) => { const v = numOrNull(e.target.value); if (v != null) { state.energy = Math.max(0, Math.min(state.maxEnergy, v)); $("#energy").value = state.energy; commit(); } });
    $$("[data-energy]").forEach((b) => b.addEventListener("click", () => {
      state.energy = Math.max(0, Math.min(state.maxEnergy, state.energy + +b.dataset.energy));
      $("#energy").value = state.energy; $("#energyNum").value = state.energy; commit();
    }));
    $("#mood").addEventListener("click", (e) => { const b = e.target.closest("[data-mood]"); if (b) { state.mood = +b.dataset.mood; commit(); } });
    $("#race").addEventListener("change", (e) => { state.race = e.target.value; commit(); });
    $("#badCondition").addEventListener("change", (e) => { state.badCondition = e.target.checked; commit(); });
    $("#trackStats").addEventListener("change", (e) => { state.trackStats = e.target.checked; commit(); });

    $("#prev").addEventListener("click", () => setTurn(state.turn - 1));
    $("#next").addEventListener("click", () => setTurn(state.turn + 1));
    $("#goalToggle").addEventListener("click", toggleGoal);
    $("#strip").addEventListener("click", (e) => { const c = e.target.closest("[data-turn]"); if (c) setTurn(+c.dataset.turn); });
    $("#clearFacs").addEventListener("click", () => { state.facilities = E.STATS.map(blankFacility); commit(true); });
    $("#dockDone").addEventListener("click", () => done(rec && rec.action));

    // Turn-level scenario inputs.
    $("#turnExtras").addEventListener("input", (e) => {
      const k = e.target.dataset.extra; if (!k) return;
      state.extras[k] = readExtra(e.target);
      commit();
    });

    // Training cards: pips, toggles and number boxes.
    $("#facilities").addEventListener("click", (e) => {
      const mc = e.target.closest("[data-member]");
      if (mc) {
        // A card shows up on one training per turn, so tapping it here removes it elsewhere.
        // Each tap cycles: not here → here → here with a hint (!) → not here.
        const f = state.facilities[+mc.closest("[data-idx]").dataset.idx];
        const si = +mc.dataset.member;
        const on = f.members.indexOf(si) !== -1;
        const hinted = (f.hints || []).indexOf(si) !== -1;
        state.facilities.forEach((x) => {
          x.members = (x.members || []).filter((m) => m !== si);
          x.hints = (x.hints || []).filter((m) => m !== si);
        });
        if (!on) f.members.push(si);
        else if (!hinted) { f.members.push(si); f.hints.push(si); }
        renderFacilities();
        commit();
        return;
      }
      const pip = e.target.closest("[data-pip]");
      if (!pip) return;
      const box = pip.closest("[data-idx]");
      const idx = +box.dataset.idx;
      const f = state.facilities[idx];
      const k = pip.dataset.pip;
      let v = +pip.dataset.v;
      if (f[k] === v) v = v - 1; // tapping the last filled dot clears it
      if (k === "extra") f.extra = Math.max(0, v);
      else setCount(f, k, Math.max(0, v));
      box.outerHTML = facilityHTML(f, idx);
      commit();
    });
    $("#facilities").addEventListener("input", (e) => {
      const box = e.target.closest("[data-idx]"); if (!box) return;
      const f = state.facilities[+box.dataset.idx];
      if (e.target.dataset.k) {
        const k = e.target.dataset.k;
        f[k] = e.target.type === "checkbox" ? e.target.checked : numOrNull(e.target.value);
        if (k === "hint") e.target.closest("label").classList.toggle("on", f.hint);
      }
      if (e.target.dataset.lv) {
        const v = +e.target.value;
        if (v) state.facLevels[f.stat] = v; else delete state.facLevels[f.stat];
      }
      if (e.target.dataset.extra) {
        f.extras[e.target.dataset.extra] = readExtra(e.target);
        if (e.target.type === "checkbox") e.target.closest("label").classList.toggle("on", e.target.checked);
      }
      commit();
    });
    $("#facilities").addEventListener("focusin", (e) => { if (e.target.select && e.target.type === "number") e.target.select(); });

    $("#statTable").addEventListener("input", (e) => {
      const s = e.target.dataset.stat; if (!s) return;
      const v = numOrNull(e.target.value);
      if (e.target.dataset.kind === "cap") { if (v) state.caps[s] = v; else delete state.caps[s]; }
      else { if (v) state.stats[s] = v; else delete state.stats[s]; }
      commit();
    });

    if (HAS_DATA) {
      $("#globalOnly").addEventListener("change", (e) => { state.deck.globalOnly = e.target.checked; fillLists(); commit(); });
      $("#ownedOnly").addEventListener("change", (e) => {
        state.deck.ownedOnly = e.target.checked;
        fillLists();
        commit();
        if (e.target.checked && !ownedIds().length) flash("You haven't marked any cards as owned yet. Do it in the Support cards tab.");
      });
      $("#traineeInput").addEventListener("change", (e) => {
        const v = e.target.value.trim();
        const t = traineeByLabel.get(v);
        if (t && t.id === state.deck.trainee) return;
        if (t) { state.deck.trainee = t.id; commit(true); flash(t.n + " set as trainee"); }
        else if (!v) { state.deck.trainee = null; commit(true); }
        else flash("No trainee matches that name. Pick one from the list.");
      });
      $("#traineeInfo").addEventListener("click", (e) => {
        const b = e.target.closest("[data-build]");
        if (b) { state.build = b.dataset.build; commit(true); flash("Build set to " + E.BUILDS[state.build].label); }
      });
      $("#slots").addEventListener("change", (e) => {
        const t = e.target;
        if (t.dataset.slotName != null) {
          const i = +t.dataset.slotName;
          const v = t.value.trim();
          const c = cardByLabel.get(v);
          const cur = state.deck.slots[i];
          if (c && cur && cur.id === c.id) return;
          if (c) { state.deck.slots[i] = { id: c.id, lb: ownedLb(c.id) != null ? ownedLb(c.id) : 4, bond: null }; commit(true); }
          else if (!v) { clearSlot(i); }
          else flash("No card matches that name. Pick one from the list.");
        }
        if (t.dataset.slotLb != null) { const sl = state.deck.slots[+t.dataset.slotLb]; sl.lb = +t.value; sl.bond = sl.bond; commit(true); }
      });
      $("#slots").addEventListener("input", (e) => {
        const t = e.target;
        if (t.dataset.slotBond != null) {
          const v = numOrNull(t.value);
          state.deck.slots[+t.dataset.slotBond].bond = v == null ? null : Math.max(0, Math.min(100, v));
          renderFacilities();
          commit();
        }
      });
      $("#allBond").addEventListener("click", () => {
        state.deck.slots.forEach((sl) => { if (sl) sl.bond = Math.min(100, slotBond(sl) + 5); });
        commit(true);
        flash("Every card: bond +5");
      });
      $("#slots").addEventListener("click", (e) => {
        const b = e.target.closest("[data-slot-clear]");
        if (b) { clearSlot(+b.dataset.slotClear); return; }
        const set = e.target.closest("[data-bondset]");
        const add = e.target.closest("[data-bondadd]");
        const adj = e.target.closest("[data-date-adj]");
        if (set || add) {
          const i = +(set || add).dataset[set ? "bondset" : "bondadd"];
          const sl = state.deck.slots[i];
          const v = +(set || add).dataset.v;
          sl.bond = Math.max(0, Math.min(100, set ? v : slotBond(sl) + v));
          commit(true);
          flash(D.card(sl.id).n + ": bond " + Math.round(sl.bond));
        }
        if (adj) {
          const sl = state.deck.slots[+adj.dataset.dateAdj];
          sl.dates = Object.assign({ unlocked: true, done: 0 }, sl.dates);
          sl.dates.done = Math.max(0, sl.dates.done + +adj.dataset.v);
          commit(true);
        }
      });
      $("#slots").addEventListener("change", (e) => {
        const u = e.target.dataset.dateUnlock;
        if (u == null) return;
        const sl = state.deck.slots[+u];
        sl.dates = Object.assign({ done: 0 }, sl.dates, { unlocked: e.target.checked });
        commit(true);
      });
    } else {
      $("#deckPanel").hidden = true;
      $("#tabCards").hidden = true;
      $("#tabCM").hidden = true;
      $("#tabTrainees").hidden = true;
    }

    $("#songsBody").addEventListener("input", (e) => {
      const i = e.target.dataset.tok;
      if (i == null) return;
      state.gl.tokens[+i] = Math.max(0, +e.target.value || 0);
      commit();
      renderSongsLight();
    });
    $("#songsBody").addEventListener("change", (e) => {
      const id = e.target.dataset.song;
      if (!id) return;
      const song = scenario().songs.find((x) => x.id === id);
      const sign = e.target.checked ? -1 : 1;
      if (e.target.checked) state.gl.songs[id] = state.turn; else delete state.gl.songs[id];
      state.gl.tokens = state.gl.tokens.map((t, i) => Math.max(0, (t || 0) + sign * song.cost[i]));
      commit(true);
      flash((e.target.checked ? "Learned " : "Removed ") + song.name);
    });

    $("#options").addEventListener("click", (e) => {
      const did = e.target.closest("[data-did]");
      if (did) { done(rec.ranked[+did.dataset.did]); return; }
      const row = e.target.closest("[data-row]");
      if (row) { openRow = openRow === +row.dataset.row ? null : +row.dataset.row; renderOptions(); }
    });
    $("#call").addEventListener("click", (e) => {
      if (e.target.closest("#doneBtn")) done(rec && rec.action);
      if (e.target.closest("#undoBtn")) undoTurn();
    });

    document.querySelector(".tabs").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) { state.tab = b.dataset.tab; save(); renderTab(); } });
    $("#tabBody").addEventListener("click", (e) => {
      const t = e.target.closest("[data-goto]"); if (t) { setTurn(+t.dataset.goto); window.scrollTo({ top: 0, behavior: "smooth" }); }
      const s = e.target.closest("[data-pick]"); if (s) { sel.value = s.dataset.pick; sel.dispatchEvent(new Event("change")); state.tab = "guide"; save(); renderTab(); }
      if (e.target.closest("[data-undo]")) undoTurn();
      if (e.target.closest("#ownAddBtn")) {
        const c = cardByLabel.get($("#ownAddName").value.trim());
        if (!c) { flash("Pick a card from the list first."); return; }
        setOwned(c.id, $("#ownAddLb").value);
        $("#ownAddName").value = "";
        flash(c.n + " [" + c.t + "] saved as LB" + owned[c.id]);
        renderDbList();
        $("#ownAddName").focus();
        return;
      }
      if (e.target.closest("#ownExport")) {
        const code = ownedCode();
        const box = $("#ownCodeOut");
        box.hidden = false;
        box.value = code;
        box.select();
        try { navigator.clipboard.writeText(code).then(() => flash("Backup code copied"), () => flash("Select the code and copy it")); } catch (err) { flash("Select the code and copy it"); }
        return;
      }
      if (e.target.closest("#ownImport")) {
        const got = readOwnedCode($("#ownImportCode").value);
        if (!got) { flash("That isn't a backup code. It starts with UMA1:"); return; }
        owned = got;
        saveOwned();
        flash("Restored " + Object.keys(got).length + " cards");
        renderTab();
        fillLists();
        return;
      }
      if (cmClick(e)) return;
      const add = e.target.closest("[data-add-card]");
      if (add) { addToDeck(+add.dataset.addCard); return; }
      const use = e.target.closest("[data-use-trainee]");
      if (use) { state.deck.trainee = +use.dataset.useTrainee; commit(true); flash(D.trainee(state.deck.trainee).n + " set as trainee"); return; }
      const more = e.target.closest("[data-more]");
      if (more) { db().limit += 60; renderDbList(); return; }
      const row = e.target.closest("[data-db-row]");
      if (row) { const id = +row.dataset.dbRow; db().open = db().open === id ? null : id; renderDbList(); }
    });
    $("#tabBody").addEventListener("input", (e) => {
      if (e.target.dataset.own != null) {
        const id = +e.target.dataset.own;
        setOwned(id, e.target.value);
        const row = e.target.closest(".cardrow");
        if (row) row.classList.toggle("owned", e.target.value !== "");
        return;
      }
      if (e.target.dataset.cm != null) { cmInput(e.target); return; }
      const k = e.target.dataset.db; if (!k) return;
      const d = db();
      d[k] = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      d.limit = 60;
      save();
      renderDbList();
    });

    document.addEventListener("keydown", (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "select" || tag === "textarea" || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowLeft") { setTurn(state.turn - 1); e.preventDefault(); }
      if (e.key === "ArrowRight") { setTurn(state.turn + 1); e.preventDefault(); }
    });
  }

  function readExtra(el) {
    if (el.type === "checkbox") return el.checked;
    if (el.tagName === "SELECT") return el.value;
    return Math.max(0, +el.value || 0);
  }

  // Keeps Cards ≥ Rainbow + Bond<80 so the dots always describe a real training.
  function setCount(f, k, v) {
    f[k] = Math.min(PIP_MAX, v);
    if (k === "cards") {
      f.rainbows = Math.min(f.rainbows, f.cards);
      f.unbonded = Math.min(f.unbonded, f.cards - f.rainbows);
    } else if (f.rainbows + f.unbonded > f.cards) {
      f.cards = Math.min(PIP_MAX, f.rainbows + f.unbonded);
      if (f.rainbows + f.unbonded > f.cards) {
        if (k === "rainbows") f.unbonded = f.cards - f.rainbows;
        else f.rainbows = f.cards - f.unbonded;
      }
    }
  }

  function clampTurn() {
    state.turn = Math.max(1, Math.min(scenario().totalTurns, state.turn));
  }

  function setTurn(t) {
    state.turn = t;
    clampTurn();
    state.goalRace = (state.goals || []).indexOf(state.turn) !== -1;
    commit(true);
  }

  function toggleGoal() {
    const g = new Set(state.goals || []);
    if (g.has(state.turn)) g.delete(state.turn); else g.add(state.turn);
    state.goals = Array.from(g).sort((a, b) => a - b);
    state.goalRace = g.has(state.turn);
    commit(true);
  }

  function done(option) {
    if (!option) return;
    state.example = false;
    state = E.advance(state, scenario(), option);
    openRow = null;
    commit(true);
    flash("Logged turn " + (state.turn - 1) + ": " + (option.prefix.length ? option.prefix.join(" → ") + " → " : "") + option.label);
  }

  function undoTurn() {
    if (!(state.log || []).length) return;
    const tab = state.tab;
    state = E.undo(state);
    state.tab = tab;
    commit(true);
    flash("Undid turn " + state.turn);
  }

  function newCareer() {
    const btn = $("#newCareer");
    if (!resetArmed) {
      btn.textContent = "Tap again to reset";
      btn.classList.add("warn");
      resetArmed = setTimeout(() => { resetArmed = null; btn.textContent = "New career"; btn.classList.remove("warn"); }, 3000);
      return;
    }
    clearTimeout(resetArmed);
    resetArmed = null;
    state = freshState(state);
    btn.textContent = "New career";
    btn.classList.remove("warn");
    commit(true);
    flash("New career started at turn 1");
  }

  let flashTimer = null;
  function flash(msg) {
    let el = $("#toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  // Value edits refresh only the outputs, so a field being typed in keeps focus.
  function commit(full) {
    state.example = false;
    save();
    if (full) render(); else renderOutputs();
  }

  function renderStrip() {
    const sc = scenario();
    const evTurns = new Set((sc.events || []).map((e) => e.turn).concat(sc.finale.turns, [12]));
    const goals = new Set(E.forcedTurns(state, sc));
    const logged = new Set((state.log || []).map((l) => l.turn));
    let html = "";
    for (let t = 1; t <= sc.totalTurns; t++) {
      const ti = E.turnInfo(t, sc);
      const y = t > 72 ? "fin" : "y" + Math.floor((t - 1) / 24);
      const cls = ["cell", y, E.isCamp(t, sc) ? "camp" : "", t === state.turn ? "on" : "", logged.has(t) ? "logged" : ""].join(" ");
      const mark = goals.has(t) ? '<i class="star">★</i>' : evTurns.has(t) ? '<i class="dot"></i>' : "";
      html += `<button type="button" class="${cls}" data-turn="${t}" title="Turn ${t}: ${esc(ti.text)}" aria-label="Turn ${t}, ${esc(ti.text)}${goals.has(t) ? ", goal race" : ""}">${mark}</button>`;
    }
    $("#strip").innerHTML = html;
    const ti = E.turnInfo(state.turn, sc);
    $("#turnNum").textContent = "Turn " + state.turn + " / " + sc.totalTurns;
    $("#turnText").innerHTML = esc(ti.text) + (E.isCamp(state.turn, sc) ? ' <span class="chip camp">summer camp</span>' : "");
    const isGoal = (state.goals || []).indexOf(state.turn) !== -1;
    const forcedFinale = sc.finale.forced && sc.finale.turns.indexOf(state.turn) !== -1;
    const g = $("#goalToggle");
    g.setAttribute("aria-pressed", String(isGoal || forcedFinale));
    g.disabled = forcedFinale;
    g.textContent = forcedFinale ? "★ Finale race" : isGoal ? "★ Goal race (tap to unmark)" : "☆ Mark goal race";
  }

  function pipsHTML(k, v, label, cls) {
    let h = `<div class="pips ${cls}" role="group" aria-label="${label}"><span class="pip-label">${label}</span><span class="pip-row">`;
    for (let i = 1; i <= PIP_MAX; i++) h += `<button type="button" class="pip ${i <= v ? "on" : ""}" data-pip="${k}" data-v="${i}" aria-label="${label} ${i}" aria-pressed="${i <= v}"></button>`;
    return h + `<b class="pip-n">${v}</b></span></div>`;
  }

  function facilityHTML(f, idx) {
    const sc = scenario();
    const facInputs = sc.inputs.filter((i) => i.scope === "facility");
    return `
      <fieldset class="fac s-${f.stat}" data-idx="${idx}">
        <legend>${E.STAT_LABELS[f.stat]}</legend>
        <div class="nums">
          <label class="nf"><span>Gain</span><input type="number" inputmode="numeric" data-k="gain" min="0" max="400" value="${f.gain != null ? f.gain : ""}" placeholder="auto"></label>
          <label class="nf"><span>Fail %</span><input type="number" inputmode="numeric" data-k="fail" min="0" max="99" value="${f.fail != null ? f.fail : ""}" placeholder="auto"></label>
        </div>
        ${deckOn() ? memberChips(f) : `${pipsHTML("cards", f.cards, "Cards", "c")}
        ${pipsHTML("rainbows", f.rainbows, "Rainbow", "r")}
        ${pipsHTML("unbonded", f.unbonded, "Bond<80", "b")}`}
        ${deckOn() ? "" : `<label class="chk ${f.hint ? "on" : ""}"><input type="checkbox" data-k="hint" ${f.hint ? "checked" : ""}> Hint !</label>`}
        ${levelPicker(f)}
        ${facInputs.map((i) => extraField(i, f.extras)).join("")}
      </fieldset>`;
  }


  // ---- Deck (GameTora data) ----
  const cardByLabel = new Map();
  const traineeByLabel = new Map();
  if (HAS_DATA) {
    D.DATA.supports.forEach((c) => cardByLabel.set(D.label(c), c));
    D.DATA.trainees.forEach((t) => traineeByLabel.set(traineeLabel(t), t));
  }

  function traineeLabel(t) { return t.n + " [" + t.t + "]"; }
  function deckOn() { return HAS_DATA && state.deck && state.deck.slots.some(Boolean); }
  function shortName(c) { return c.n.length > 11 ? c.n.split(/[\s.]/)[0] : c.n; }
  function slotBond(sl) {
    const c = D.card(sl.id);
    return sl.bond != null ? sl.bond : D.initialBond(c, D.levelFor(c, sl.lb));
  }

  function bondBucket(b) {
    return b >= 100 ? 100 : b >= 80 ? 80 : b >= 60 ? 60 : 40;
  }

  // ---- Grand Concert songs panel ----
  function renderSongs() {
    const sc = scenario();
    const panel = $("#songsPanel");
    panel.hidden = !sc.songs;
    if (!sc.songs) return;
    const gl = state.gl;
    const hype = E.hypeStatus(state, sc);
    const bon = E.songBonuses(state, sc);
    const adv = E.songAdvice(state, sc);
    const learnedN = Object.keys(gl.songs).length;
    const extras = Object.entries(bon.extra).filter(([, v]) => v).map(([k, v]) => "+" + v + " " + (k === "sp" ? "SP" : E.STAT_LABELS[k])).join(", ");
    $("#songSummary").textContent = learnedN + " of 21 songs" + (hype && hype.next != null ? " · " + hype.since + "/3 for the live on turn " + hype.next : "");
    const tok = (cost) => cost.map((c, i) => (c ? `<span class="tok t${i}">${sc.tokens[i].slice(0, 2)} ${c}</span>` : "")).join("");
    const effect = (song) => [
      ...Object.entries(song.extra || {}).map(([k, v]) => "+" + v + " " + (k === "sp" ? "SP" : E.STAT_LABELS[k]) + " on every " + (k === "sp" ? "training" : E.STAT_LABELS[k] + " training")),
      ...Object.entries(song.once || {}).map(([k, v]) => "+" + v + " " + (k === "sp" ? "skill points" : E.STAT_LABELS[k]) + " once"),
      song.fb ? "Friendship +" + song.fb + "% after the next live" : "",
      song.live || ""
    ].filter(Boolean).join(" · ");
    const groups = [[5, "Available from the start"], [25, "After the 1st Promo Live"], [37, "After the 2nd Promo Live"], [49, "After the 3rd Promo Live"]];
    const top = adv.slice(0, 3);
    $("#songsBody").innerHTML = `
      <div class="tokens">${sc.tokens.map((n, i) => `<label class="nf"><span>${n}</span><input type="number" inputmode="numeric" min="0" max="400" data-tok="${i}" value="${gl.tokens[i] || 0}"></label>`).join("")}</div>
      <p class="mini">Type your tokens from the lesson screen. Ticking a song records the turn and takes its cost off your tokens.</p>
      <div class="song-status">
        ${hype && hype.next != null ? `<div><b>${hype.since}/3</b> songs since the last live. Next live: turn ${hype.next} (${esc(E.turnInfo(hype.next, sc).text)})${hype.need ? `, ${hype.need} more for a guaranteed Great Success.` : ", Hype gauge full."}</div>` : ""}
        <div>Active now: ${extras || "no extra stat gains yet"}${bon.fb ? ` · Friendship +${bon.fb}%` : ""}${bon.pendingFb ? ` · +${bon.pendingFb}% Friendship waiting for the next live` : ""}</div>
        <div>${learnedN >= 18 ? "18+ songs: special Girls' Legend U unlocked." : (18 - learnedN) + " more song(s) by Senior Late Dec for the special Girls' Legend U (16 by Senior Early Nov for the lyrics event)."}</div>
      </div>
      ${top.length ? `<div class="song-advice"><b>Best next:</b> ${top.map((a) => `${esc(a.song.name)} ${a.affordable ? '<span class="pill c-clear-pick">affordable</span>' : `<span class="mini">(need ${a.short.map((x, i) => (x ? sc.tokens[i].slice(0, 2) + " " + x : "")).filter(Boolean).join(", ")})</span>`}`).join(" · ")}</div>` : ""}
      ${groups.map(([from, label]) => `<div class="song-group"><h3>${label}</h3>${sc.songs.filter((x) => x.from === from).map((song) => {
        const t = gl.songs[song.id];
        const locked = song.from > state.turn && t == null;
        return `<label class="song${t != null ? " on" : ""}${locked ? " locked" : ""}"><input type="checkbox" data-song="${song.id}" ${t != null ? "checked" : ""} ${locked ? "disabled" : ""}>
          <span class="song-name">${esc(song.name)}${t != null ? ` <span class="mini">turn ${t}</span>` : ""}</span>
          <span class="song-cost">${tok(song.cost)}</span>
          <span class="mini song-fx">${esc(effect(song))}</span></label>`;
      }).join("")}</div>`).join("")}`;
  }

  // Token typing only refreshes the advice line, so the box keeps focus.
  function renderSongsLight() {
    const sc = scenario();
    const adv = E.songAdvice(state, sc).slice(0, 3);
    const el = $("#songsBody .song-advice");
    if (el) el.innerHTML = `<b>Best next:</b> ${adv.map((a) => `${esc(a.song.name)} ${a.affordable ? '<span class="pill c-clear-pick">affordable</span>' : `<span class="mini">(need ${a.short.map((x, i) => (x ? sc.tokens[i].slice(0, 2) + " " + x : "")).filter(Boolean).join(", ")})</span>`}`).join(" · ")}`;
  }

  function renderFacilities() {
    $("#facilities").innerHTML = state.facilities.map(facilityHTML).join("");
    $("#facHelp").innerHTML = deckOn()
      ? "Tap your cards on each training: once = here, twice = here with a hint <b>!</b>, three times = gone. A gold ring means friendship there. Add <b>Others</b> for characters not in your deck. Gains come from your cards' real effects. Typing the real total gain still wins, and teaches the coach this scenario's extra bonuses."
      : "Tap the dots to set <b>Cards</b> on the training, <b>Rainbow</b> (friendship) cards and cards with <b>Bond under 80</b>. Leave <b>Gain</b> and <b>Fail</b> blank and the coach estimates them. Typing the real total gain (the green numbers added up) makes the call much sharper. For exact gains, set your deck under <b>Trainee and deck</b>.";
  }

  function memberChips(f) {
    const sc = scenario();
    const chips = state.deck.slots.map((sl, si) => {
      if (!sl) return "";
      const c = D.card(sl.id);
      const bond = slotBond(sl);
      const on = (f.members || []).indexOf(si) !== -1;
      const hint = on && (f.hints || []).indexOf(si) !== -1;
      const rb = D.isRainbow(c, bond, f.stat);
      return `<button type="button" class="mchip ty-${c.ty}${on ? " on" : ""}${rb ? " rb" : ""}${hint ? " hint" : ""}" data-member="${si}" aria-pressed="${on}" title="${esc(D.label(c))} · bond ${Math.round(bond)}${rb ? " · friendship here" : ""} · tap again to mark a hint (!)">${hint ? '<b class="bang">!</b>' : ""}${esc(shortName(c))}${bond < 80 ? `<small>${Math.round(bond)}</small>` : ""}</button>`;
    }).join("");
    return `<div class="mchips" role="group" aria-label="Your cards on this training">${chips}</div>
      ${pipsHTML("extra", f.extra || 0, "Others (not in deck)", "c")}`;
  }

  // "Auto" follows the scenario's rule; the title explains where the number comes from.
  function levelPicker(f) {
    const sc = scenario();
    const auto = E.facLevelFor(Object.assign({}, state, { facLevels: {} }), sc, f.stat);
    const cur = state.facLevels[f.stat] || 0;
    const why = sc.levelRule === "rank" ? "Unity Cup: follows your team rank for this stat (F/G 1, D/E 2, B/C 3, A 4, S 5); pick it from your team screen"
      : sc.levelRule === "discipline" ? "U.A.F.: follows the sport's level (1-19 Lv1, 20s Lv2, 30s Lv3, 40s Lv4, 50+ Lv5)"
      : "Counted from your logged trainings (every 4 raise it), with skipped turns estimated. The game shows the real level on the training button.";
    return `<label class="nf lv" title="${esc(why)}"><span>Facility level</span><select data-lv="1"><option value="0">Auto (${auto})</option>${[1, 2, 3, 4, 5].map((l) => `<option value="${l}" ${cur === l ? "selected" : ""}>Lv ${l}</option>`).join("")}</select></label>`;
  }

  function keyEffects(c, level) {
    const fx = D.baseEffects(c, level);
    const order = [1, 8, 2, 15, 19, 14, 30, 3, 4, 5, 6, 7, 41, 27, 28, 31, 18, 17];
    const parts = order.filter((id) => fx[id]).map((id) => `<span class="fx"><b>${FX_SHORT[id]}</b> ${D.formatEffect(id, fx[id])}</span>`);
    const cond = D.conditionalUniques(c, level).map((u) => `<span class="fx uq">${esc(D.uniqueText(u))}</span>`);
    const locked = c.u && c.u.lv > level ? `<span class="fx dim">Unique effect unlocks at Lv ${c.u.lv}</span>` : "";
    return parts.concat(cond).join("") + locked;
  }

  function fillLists() {
    if (!HAS_DATA) return;
    const g = state.deck.globalOnly;
    const own = state.deck.ownedOnly && ownedIds().length;
    const cards = D.DATA.supports.filter((c) => (!g || D.onGlobal(c, TODAY)) && (!own || owned[c.id] != null)).sort((a, b) => b.r - a.r || a.n.localeCompare(b.n));
    $("#cardList").innerHTML = cards.map((c) => `<option value="${esc(D.label(c))}"></option>`).join("");
    $("#cardListAll").innerHTML = D.DATA.supports.filter((c) => !g || D.onGlobal(c, TODAY)).sort((a, b) => b.r - a.r || a.n.localeCompare(b.n)).map((c) => `<option value="${esc(D.label(c))}"></option>`).join("");
    const ts = D.DATA.trainees.filter((t) => !g || D.onGlobal(t, TODAY)).sort((a, b) => a.n.localeCompare(b.n));
    $("#traineeList").innerHTML = ts.map((t) => `<option value="${esc(traineeLabel(t))}"></option>`).join("");
  }

  function aptChips(t) {
    const grp = (from, to) => APT.slice(from, to).map((n, i) => `<span class="apt apt-${t.apt[from + i]}"><i>${n}</i>${t.apt[from + i]}</span>`).join("");
    return `<div class="apts">${grp(0, 2)}<span class="sep"></span>${grp(2, 6)}<span class="sep"></span>${grp(6, 10)}</div>`;
  }

  function growthText(t) {
    const g = E.STATS.map((s, i) => (t.g[i] ? "+" + t.g[i] + "% " + E.STAT_LABELS[s] : "")).filter(Boolean);
    return g.length ? g.join(", ") : "no growth bonus";
  }

  // Re-rendering the deck must not steal the field the user just moved into.
  function renderDeck() {
    if (!HAS_DATA) return;
    const a = document.activeElement;
    const keep = a && a.closest && a.closest("#deckPanel") && Object.keys(a.dataset).length ? Object.entries(a.dataset)[0] : a && a.id === "traineeInput" ? ["id", "traineeInput"] : null;
    renderDeckInner();
    if (keep) {
      const el = keep[0] === "id" ? $("#" + keep[1]) : $("#deckPanel [data-" + keep[0].replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()) + '="' + keep[1] + '"]');
      if (el) el.focus();
    }
  }

  function renderDeckInner() {
    const dk = state.deck;
    $("#globalOnly").checked = !!dk.globalOnly;
    $("#ownedOnly").checked = !!dk.ownedOnly;
    const t = dk.trainee ? D.trainee(dk.trainee) : null;
    $("#traineeInput").value = t ? traineeLabel(t) : "";
    if (t) {
      const sug = D.suggestBuild(t);
      $("#traineeInfo").innerHTML = `${aptChips(t)}
        <div class="mini">Growth: <b>${growthText(t)}</b> · Unique skill: <b>${esc(t.us.map((id) => D.DATA.skills[id] || id).join(", "))}</b></div>
        ${sug !== state.build ? `<button type="button" class="btn ghost small" data-build="${sug}">Use suggested build: ${E.BUILDS[sug].label}</button>` : `<span class="mini">Build matches her best distance.</span>`}`;
    } else {
      $("#traineeInfo").innerHTML = `<span class="mini">Pick your trainee to apply her growth bonuses and get a build suggestion.</span>`;
    }
    $("#slots").innerHTML = dk.slots.map((sl, i) => {
      const c = sl && D.card(sl.id);
      if (!c) return `<div class="slot empty"><input class="slot-name" data-slot-name="${i}" list="cardList" placeholder="Card ${i + 1}: type a name" autocomplete="off" aria-label="Support card ${i + 1}"></div>`;
      const lvl = D.levelFor(c, sl.lb);
      const bond = slotBond(sl);
      return `<div class="slot ty-${c.ty}">
        <div class="slot-top">
          <span class="tydot" aria-hidden="true"></span>
          <input class="slot-name" data-slot-name="${i}" list="cardList" value="${esc(D.label(c))}" autocomplete="off" aria-label="Support card ${i + 1}">
          <select data-slot-lb="${i}" aria-label="Limit break">${[0, 1, 2, 3, 4].map((lb) => `<option value="${lb}" ${lb === sl.lb ? "selected" : ""}>LB${lb} · Lv${D.levelFor(c, lb)}</option>`).join("")}</select>
          <label class="bond${bond >= 80 ? " full" : ""}"><span>Bond</span><input type="number" inputmode="numeric" data-slot-bond="${i}" min="0" max="100" value="${Math.round(bond)}"></label>
          <button type="button" class="btn ghost small square" data-slot-clear="${i}" aria-label="Remove card">✕</button>
        </div>
        <div class="slot-bond" role="group" aria-label="Set bond">
          <span class="mini">Gauge</span>
          ${GAUGE.map(([n, v, cls]) => `<button type="button" class="gauge ${cls}${bondBucket(bond) === v ? " on" : ""}" data-bondset="${i}" data-v="${v}" title="Set bond to ${v}${v < 100 ? "+" : ""}">${n}</button>`).join("")}
          <span class="mini">Event</span>
          <button type="button" class="btn ghost small" data-bondadd="${i}" data-v="5">+5</button>
          <button type="button" class="btn ghost small" data-bondadd="${i}" data-v="10">+10</button>
        </div>
        ${c.ty === "friend" || c.ty === "group" ? `<div class="slot-dates">
          <label class="chip-toggle small"><input type="checkbox" data-date-unlock="${i}" ${sl.dates && sl.dates.unlocked ? "checked" : ""}> Outings unlocked</label>
          <span class="mini">Outings done: <b>${(sl.dates && sl.dates.done) || 0}</b></span>
          <button type="button" class="btn ghost small square" data-date-adj="${i}" data-v="-1" aria-label="One fewer outing">−</button>
          <button type="button" class="btn ghost small square" data-date-adj="${i}" data-v="1" aria-label="One more outing">+</button>
        </div>` : ""}
        <div class="slot-fx">${keyEffects(c, lvl)}</div>
      </div>`;
    }).join("");
    const used = dk.slots.filter(Boolean).length;
    const info = E.deckInfo(state);
    $("#deckSummary").textContent = (t ? t.n + " · " : "") + (used ? used + " card" + (used > 1 ? "s" : "") + (info ? " · race bonus " + info.raceBonus + "%" : "") : "Optional: set your deck for exact gains");
    if (!used && !t) $("#deckPanel").open = $("#deckPanel").open || false;
  }

  function clearSlot(i) {
    state.deck.slots[i] = null;
    state.facilities.forEach((f) => { f.members = (f.members || []).filter((m) => m !== i); });
    commit(true);
  }

  function addToDeck(id) {
    const i = state.deck.slots.findIndex((x) => !x);
    if (i < 0) { flash("Your deck is full. Remove a card first."); return; }
    const lb = ownedLb(id) != null ? ownedLb(id) : 4;
    state.deck.slots[i] = { id, lb, bond: null };
    commit(true);
    flash(D.card(id).n + " added to slot " + (i + 1) + " (LB" + lb + "; change it in Trainee and deck)");
  }

  // ---- Support card and trainee browser ----
  function db() {
    if (!state.db) state.db = { q: "", type: "", rarity: "", lb: "4", sort: "1", global: true, open: null, limit: 60, tq: "", tsort: "name" };
    if (state.db.own == null) state.db.own = "";
    return state.db;
  }

  const SORTS = [["1", "Friendship"], ["8", "Training effectiveness"], ["2", "Mood effect"], ["19", "Specialty priority"], ["15", "Race bonus"], ["14", "Initial bond"], ["30", "Skill point bonus"], ["stat", "Stat bonuses"], ["new", "Newest"]];

  function dbControls() {
    const d = db();
    const opt = (pairs, v) => pairs.map(([k, l]) => `<option value="${k}" ${String(v) === k ? "selected" : ""}>${l}</option>`).join("");
    if (state.tab === "cards") {
      return `${collectionPanel()}<div class="db-controls">
        <label class="field grow"><span>Search</span><input data-db="q" value="${esc(d.q)}" placeholder="Name or title" autocomplete="off"></label>
        <label class="field"><span>Type</span><select data-db="type">${opt([["", "All"], ["speed", "Speed"], ["stamina", "Stamina"], ["power", "Power"], ["guts", "Guts"], ["wit", "Wit"], ["friend", "Friend"], ["group", "Group"]], d.type)}</select></label>
        <label class="field"><span>Rarity</span><select data-db="rarity">${opt([["", "All"], ["3", "SSR"], ["2", "SR"], ["1", "R"]], d.rarity)}</select></label>
        <label class="field"><span>Collection</span><select data-db="own">${opt([["", "All cards"], ["yes", "Cards I own"], ["no", "Cards I don't own"]], d.own)}</select></label>
        <label class="field"><span>Limit break</span><select data-db="lb">${opt([["0", "LB0"], ["1", "LB1"], ["2", "LB2"], ["3", "LB3"], ["4", "LB4 (max)"], ["own", "Mine (owned LB)"]], d.lb)}</select></label>
        <label class="field"><span>Sort by</span><select data-db="sort">${opt(SORTS, d.sort)}</select></label>
        <label class="chip-toggle"><input type="checkbox" data-db="global" ${d.global ? "checked" : ""}> Global only</label>
      </div><div id="dbList"></div>`;
    }
    return `<div class="db-controls">
      <label class="field grow"><span>Search</span><input data-db="tq" value="${esc(d.tq)}" placeholder="Name or title" autocomplete="off"></label>
      <label class="field"><span>Best distance</span><select data-db="tdist">${opt([["", "Any"], ["2", "Sprint"], ["3", "Mile"], ["4", "Medium"], ["5", "Long"], ["1", "Dirt"]], d.tdist || "")}</select></label>
      <label class="chip-toggle"><input type="checkbox" data-db="global" ${d.global ? "checked" : ""}> Global only</label>
    </div><div id="dbList"></div>`;
  }

  function renderDbList() {
    const el = $("#dbList");
    if (!el) return;
    const d = db();
    if (state.tab === "cards") {
      const q = d.q.trim().toLowerCase();
      let list = D.DATA.supports.filter((c) =>
        (!d.global || D.onGlobal(c, TODAY)) && (!d.type || c.ty === d.type) && (!d.rarity || c.r === +d.rarity) &&
        (!d.own || (d.own === "yes") === (owned[c.id] != null)) &&
        (!q || (c.n + " " + c.t).toLowerCase().indexOf(q) !== -1));
      const lvOf = (c) => D.levelFor(c, d.lb === "own" ? (ownedLb(c.id) != null ? ownedLb(c.id) : 4) : +d.lb);
      const key = (c) => {
        const fx = D.baseEffects(c, lvOf(c));
        if (d.sort === "stat") return [3, 4, 5, 6, 7, 41].reduce((a, id) => a + (fx[id] || 0), 0);
        if (d.sort === "new") return (d.global ? c.en : c.jp) || "";
        return fx[+d.sort] || 0;
      };
      list = list.map((c) => [c, key(c)]).sort((a, b) => (a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : b[0].r - a[0].r)).map((x) => x[0]);
      const shown = list.slice(0, d.limit);
      el.innerHTML = `<p class="mini">${list.length} card${list.length === 1 ? "" : "s"}. Values at ${d.lb === "own" ? "your limit break (LB4 for cards you don't own)" : ["LB0", "LB1", "LB2", "LB3", "LB4"][+d.lb]}. Tap a card for every limit break, its skills and its unique effect.</p>
        <div class="cardgrid">${shown.map((c) => cardRow(c, lvOf(c), d.open === c.id)).join("")}</div>
        ${list.length > shown.length ? `<button type="button" class="btn ghost" data-more="1">Show more (${list.length - shown.length} left)</button>` : ""}`;
    } else {
      const q = (d.tq || "").trim().toLowerCase();
      const rank = (g) => "GFEDCBAS".indexOf(g);
      let list = D.DATA.trainees.filter((t) => (!d.global || D.onGlobal(t, TODAY)) && (!q || (t.n + " " + t.t).toLowerCase().indexOf(q) !== -1));
      if (d.tdist) list = list.filter((t) => rank(t.apt[+d.tdist]) >= rank("A"));
      list.sort((a, b) => a.n.localeCompare(b.n));
      el.innerHTML = `<p class="mini">${list.length} trainee${list.length === 1 ? "" : "s"}.</p>
        <div class="table-wrap"><table class="trainees"><thead><tr><th>Trainee</th><th>Aptitudes (surface · distance · style)</th><th>Growth</th><th>Unique skill</th><th></th></tr></thead><tbody>
        ${list.map((t) => `<tr${state.deck.trainee === t.id ? ' class="cur"' : ""}><td><b>${esc(t.n)}</b><div class="jp">${esc(t.t)} · ${"★".repeat(t.r)}${t.en ? " · Global " + t.en : " · JP " + t.jp}</div></td><td>${aptChips(t)}</td><td>${growthText(t)}</td><td>${esc(t.us.map((id) => D.DATA.skills[id] || id).join(", "))}</td><td><button type="button" class="btn ghost small" data-use-trainee="${t.id}">Use</button></td></tr>`).join("")}
        </tbody></table></div>`;
    }
  }

  function ownedSummary() {
    const ids = ownedIds();
    if (!ids.length) return "No cards marked yet";
    const ssr = ids.filter((id) => D.card(id).r === 3).length;
    const mlb = ids.filter((id) => owned[id] === 4).length;
    return ids.length + " owned · " + ssr + " SSR · " + mlb + " at max limit break";
  }

  function collectionPanel() {
    return `<details class="panel collection" id="collPanel" ${ownedIds().length ? "" : "open"}>
      <summary><h2>My cards</h2><span class="mini" id="collCount">${ownedSummary()}</span></summary>
      <div class="coll-body">
        <p class="mini">Mark the cards you own and their limit break. The deck optimizer uses them, and picking a card for your deck starts it at your limit break. Saved in this browser only, so keep a backup code if you switch devices.</p>
        <div class="row-wrap">
          <label class="field grow"><span>Quick add</span><input id="ownAddName" list="cardListAll" placeholder="Type a card name" autocomplete="off"></label>
          <label class="field"><span>Limit break</span><select id="ownAddLb">${[0, 1, 2, 3, 4].map((lb) => `<option value="${lb}" ${lb === 4 ? "selected" : ""}>LB${lb}</option>`).join("")}</select></label>
          <button type="button" class="btn small" id="ownAddBtn">Add</button>
        </div>
        <div class="row-wrap">
          <button type="button" class="btn ghost small" id="ownExport">Copy backup code</button>
          <label class="field grow"><span>Restore from a backup code</span><input id="ownImportCode" placeholder="UMA1:..." autocomplete="off"></label>
          <button type="button" class="btn ghost small" id="ownImport">Restore</button>
        </div>
        <textarea id="ownCodeOut" class="codebox" readonly hidden aria-label="Backup code"></textarea>
      </div>
    </details>`;
  }

  function setOwned(id, lb) {
    if (lb == null || lb === "") delete owned[id]; else owned[id] = +lb;
    saveOwned();
    const el = $("#collCount");
    if (el) el.textContent = ownedSummary();
    if (state.deck.ownedOnly) fillLists();
  }

  function cardRow(c, level, open) {
    const inDeck = state.deck.slots.some((sl) => sl && sl.id === c.id);
    let detail = "";
    if (open) {
      const ids = new Set();
      [0, 4].forEach((lb) => Object.keys(D.baseEffects(c, D.levelFor(c, lb))).forEach((k) => ids.add(+k)));
      const rows = Array.from(ids).sort((a, b) => a - b).map((id) => `<tr><th scope="row">${esc(D.effectName(id))}</th>${[0, 1, 2, 3, 4].map((lb) => { const v = D.baseEffects(c, D.levelFor(c, lb))[id]; return `<td class="num">${v ? D.formatEffect(id, v) : "–"}</td>`; }).join("")}</tr>`).join("");
      const uq = c.u ? `<p class="mini"><b>Unique effect (Lv ${c.u.lv}+):</b> ${c.u.e.map((u) => (u.type >= 100 && u.type !== 9991 ? esc(D.uniqueText(u)) : esc(D.effectName(u.type)) + " +" + u.value)).join("; ")}</p>` : "";
      const sk = (ids2) => ids2.map((id) => esc(D.DATA.skills[id] || "#" + id)).join(", ") || "none";
      detail = `<div class="card-detail">
        <div class="table-wrap"><table class="lbtable"><thead><tr><th>Effect</th>${[0, 1, 2, 3, 4].map((lb) => `<th>LB${lb}<br><span class="mini">Lv${D.levelFor(c, lb)}</span></th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>
        ${uq}
        <p class="mini"><b>Hint skills:</b> ${sk(c.hs)}</p>
        <p class="mini"><b>Event skills:</b> ${sk(c.es)}</p>
        <p class="mini">Released JP ${esc(c.jp || "?")}${c.en ? ", Global " + esc(c.en) : ", not on Global yet"} · ${esc(c.src || "")}</p>
      </div>`;
    }
    const own = ownedLb(c.id);
    return `<div class="cardrow ty-${c.ty}${open ? " open" : ""}${own != null ? " owned" : ""}">
      <button type="button" class="cardrow-head" data-db-row="${c.id}" aria-expanded="${open}">
        <span class="tydot" aria-hidden="true"></span>
        <span class="cardname"><b>${esc(c.n)}</b> <span class="mini">${esc(c.t)}</span></span>
        <span class="rar r${c.r}">${D.RARITY[c.r]}</span>
      </button>
      <div class="slot-fx">${keyEffects(c, level)}</div>
      ${detail}
      <div class="cardrow-actions">
        <label class="own"><span>Owned</span><select data-own="${c.id}" aria-label="Do you own ${esc(c.n)}?"><option value="">No</option>${[0, 1, 2, 3, 4].map((lb) => `<option value="${lb}" ${own === lb ? "selected" : ""}>LB${lb}${lb === 4 ? " (max)" : ""}</option>`).join("")}</select></label>
        <button type="button" class="btn ghost small" data-add-card="${c.id}" ${inDeck ? "disabled" : ""}>${inDeck ? "In deck" : "Add to deck"}</button>
      </div>
    </div>`;
  }

  function extraField(i, bag) {
    const v = bag[i.id] != null ? bag[i.id] : (i.default != null ? i.default : (i.type === "check" ? false : i.type === "select" ? i.options[0][0] : 0));
    const help = i.help ? ` title="${esc(i.help)}"` : "";
    if (i.type === "check") return `<label class="chk sc ${v ? "on" : ""}"${help}><input type="checkbox" data-extra="${i.id}" ${v ? "checked" : ""}> ${esc(i.label)}</label>`;
    if (i.type === "select") return `<label class="nf sc"${help}><span>${esc(i.label)}</span><select data-extra="${i.id}">${i.options.map(([val, lab]) => `<option value="${val}" ${String(v) === String(val) ? "selected" : ""}>${esc(lab)}</option>`).join("")}</select></label>`;
    return `<label class="nf sc"${help}><span>${esc(i.label)}</span><input type="number" inputmode="numeric" data-extra="${i.id}" min="0" max="${i.max || 99}" value="${v}"></label>`;
  }

  function renderInputs() {
    const sc = scenario();
    $("#scenario").value = sc.id;
    $("#build").value = state.build;
    $("#risk").value = state.risk;
    $("#raceBonus").value = state.raceBonus || 0;
    $("#maxEnergy").value = state.maxEnergy;
    $("#energy").max = state.maxEnergy;
    $("#energy").value = state.energy;
    $("#energyNum").value = state.energy;
    $("#race").value = state.race || "";
    $("#badCondition").checked = !!state.badCondition;
    $("#trackStats").checked = !!state.trackStats;

    const turnInputs = sc.inputs.filter((i) => i.scope === "turn");
    $("#turnExtras").innerHTML = turnInputs.length ? `<div class="extras-head">${esc(sc.name)}</div>` + turnInputs.map((i) => extraField(i, state.extras)).join("") : "";
    $("#turnExtras").hidden = !turnInputs.length;
    renderFacilities();
    renderDeck();
    renderSongs();

    const build = E.BUILDS[state.build];
    $("#statTable").innerHTML = `<thead><tr><th>Stat</th><th>Current</th><th>Cap</th><th>Enough at</th></tr></thead><tbody>${E.STATS.map((s, i) => `
      <tr class="s-${s}"><th scope="row">${E.STAT_LABELS[s]}</th>
        <td><input type="number" inputmode="numeric" data-stat="${s}" data-kind="cur" min="0" max="2500" value="${state.stats[s] || ""}" placeholder="—" aria-label="Current ${E.STAT_LABELS[s]}"></td>
        <td><input type="number" inputmode="numeric" data-stat="${s}" data-kind="cap" min="0" max="2500" value="${state.caps[s] || ""}" placeholder="${sc.caps[i]}" aria-label="${E.STAT_LABELS[s]} cap"></td>
        <td class="num">${build.target[s]}</td></tr>`).join("")}</tbody>`;
  }

  function syncLight() {
    $("#riskOut").textContent = state.risk + "%";
    const info = E.deckInfo(state);
    $("#raceBonus").disabled = !!info;
    if (info) $("#raceBonus").value = info.raceBonus;
    $("#energyOut").textContent = state.energy + " / " + state.maxEnergy;
    $$("#mood [data-mood]").forEach((b) => b.setAttribute("aria-checked", String(+b.dataset.mood === state.mood)));
    $("#exampleNote").hidden = !state.example;
    const c = E.calibFactor(state);
    $("#calibNote").textContent = (state.calib || []).length >= 3
      ? "Learned from your gains: your trainings run at " + Math.round(c * 100) + "% of a typical " + scenario().name + " deck."
      : "Enter real gains on 3 or more turns and the coach learns how strong your deck is.";
    const tg = $("#turnExtras");
    $$("label.chk", tg).forEach((l) => { const i = $("input", l); if (i) l.classList.toggle("on", i.checked); });
  }

  // Shows the coach's estimate inside blank Gain/Fail boxes.
  function syncPlaceholders() {
    const trains = rec.ranked.filter((o) => o.kind === "train" && !o.prefix.some((p) => /Charm/.test(p)));
    $$("#facilities [data-idx]").forEach((box) => {
      const f = state.facilities[+box.dataset.idx];
      const o = trains.find((x) => x.stat === f.stat);
      if (!o) return;
      $('[data-k="gain"]', box).placeholder = "~" + Math.round(o.gain);
      $('[data-k="fail"]', box).placeholder = "~" + o.fail;
    });
  }

  function renderCall() {
    const sc = scenario();
    rec = E.recommend(state, sc);
    const a = rec.action;
    const kind = a.kind;
    $("#call").className = "panel call k-" + kind + (a.stat ? " s-" + a.stat : "");
    const vs = rec.versus ? `<div class="versus">Beats <b>${esc(rec.versus.label)}</b> by ${score(rec.versus.gap)} points, mostly on ${esc(rec.versus.because)}.</div>` : "";
    const after = a.forced ? "" : `<div class="after">After this: energy about <b>${rec.after.energy}</b>, mood <b>${E.MOODS[rec.after.mood]}</b>.</div>`;
    $("#call").innerHTML = `
      <div class="eyebrow">${esc(rec.turn.text)} · ${esc(rec.phase.name)}</div>
      <div class="headline">${a.prefix.map((p) => `<span class="pre">${esc(p)} →</span>`).join(" ")}<span>${esc(a.label)}</span></div>
      <div class="pill-row"><span class="pill c-${rec.confidence.replace(" ", "-")}">${esc(rec.confidence)}</span>${a.kind === "train" ? `<span class="pill">score ${score(a.value)}</span>` : ""}</div>
      ${rec.reasons.length ? `<ul class="why">${rec.reasons.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      ${vs}${after}
      ${rec.events.length ? `<div class="events">${rec.events.map((e) => `<div class="ev"><b>${esc(e.label)}</b> ${esc(e.tip || "")}</div>`).join("")}</div>` : ""}
      <div class="phase"><b>${esc(rec.phase.name)}:</b> ${esc(rec.phase.tip)}</div>
      <div class="actions">
        <button type="button" class="btn" id="doneBtn">Done, next turn ▶</button>
        <button type="button" class="btn ghost" id="undoBtn" ${(state.log || []).length ? "" : "disabled"}>Undo last</button>
      </div>`;
    $("#dockText").textContent = (a.prefix.length ? a.prefix.join(" → ") + " → " : "") + a.label;
    $("#dock").className = "dock k-" + kind + (a.stat ? " s-" + a.stat : "");
  }

  const PART_NAMES = { stats: "Stats", sp: "Skill points", bond: "Bonds", hint: "Hint", scenario: "Scenario", energy: "Energy", mood: "Mood", risk: "Failure risk", condition: "Condition", fans: "Fans", item: "Item / buff", goal: "Goal race" };

  function renderOptions() {
    const top = Math.max(1, ...rec.ranked.filter((o) => o.value < 1e4).map((o) => o.value));
    $("#options").innerHTML = `<h2>All options</h2><p class="mini">Tap a row for its breakdown. If you picked something else, press <b>I did this</b> on it.</p><ol class="ranked">${rec.ranked.map((o, i) => {
      const pct = o.value >= 1e4 ? 100 : Math.max(0, Math.round((o.value / top) * 100));
      const open = openRow === i;
      const parts = Object.entries(o.parts).filter(([, v]) => Math.abs(v) >= 0.05 && Math.abs(v) < 1e4);
      const detail = open ? `<div class="detail">
          ${o.kind === "train" ? `<div class="mini">Gain ${o.gainEst ? "≈" : ""}${Math.round(o.gain)} · fail ${o.fail}%${o.failEst ? " (est.)" : ""} · energy ${o.energyDelta > 0 ? "+" : ""}${Math.round(o.energyDelta)}</div>` : ""}
          <ul class="parts">${parts.map(([k, v]) => `<li class="${v < 0 ? "neg" : "pos"}"><span>${PART_NAMES[k] || k}</span><span class="num">${v > 0 ? "+" : ""}${score(v)}</span></li>`).join("")}</ul>
          ${o.notes.length ? `<div class="mini">${o.notes.map(esc).join(" · ")}</div>` : ""}
          <button type="button" class="btn ghost small" data-did="${i}">I did this ▶</button>
        </div>` : "";
      return `<li class="${i === 0 ? "first" : ""} k-${o.kind}${o.stat ? " s-" + o.stat : ""}">
        <button type="button" class="opt" data-row="${i}" aria-expanded="${open}">
          <span class="opt-top"><span>${esc((o.prefix.length ? o.prefix.join(" → ") + " → " : "") + o.label)}</span><span class="num">${score(o.value)}</span></span>
          <span class="bar"><i style="width:${pct}%"></i></span>
        </button>${detail}
      </li>`;
    }).join("")}</ol>`;
  }

  // ---- Champions Meeting / League of Heroes planner: presets, deck optimizer, skills ----
  const P = window.UmaPresets;
  const SV = window.UmaSkillValues;
  const OPT = window.UmaOptimizer;
  const ASSET_V = ((document.currentScript && document.currentScript.src.match(/v=([\w-]+)/)) || [])[1] || "1";
  const STYLES = [["Nige", "Front"], ["Senkou", "Pace"], ["Sasi", "Late"], ["Oikomi", "End"]];
  const STYLE_LABEL = Object.fromEntries(STYLES);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const PASTE_KEY = "uma-skillpaste-v1";
  let pasted = {};
  try { pasted = JSON.parse(localStorage.getItem(PASTE_KEY)) || {}; } catch (e) { pasted = {}; }
  const savePasted = () => { try { localStorage.setItem(PASTE_KEY, JSON.stringify(pasted)); } catch (e) { /* ignore */ } };
  const svCache = {}; // preset id -> { style: [[id, median x100, mean x100]] }, or "loading" / "missing" / "error"
  let optRun = null; // the search in progress: { worker, f }
  let optResult = null; // last result, with the settings it was found for
  let wish = null; // cards worth getting for optResult
  let skillLimit = 60;

  const presetById = (id) => (P ? P.list.find((p) => p.id === id) : null);
  const fmtDate = (s) => { const [y, m, d] = s.split("-").map(Number); return MONTHS[m - 1] + " " + d + ", " + y; };
  const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

  function defaultPreset() {
    const next = P.list.filter((p) => p.kind === "cm" && p.global.end >= TODAY);
    return next[0] || P.list[P.list.length - 1];
  }

  // Running style the trainee is best at (Pace on ties), else Pace.
  function defaultStyle() {
    const t = state.deck.trainee ? D.trainee(state.deck.trainee) : null;
    if (!t) return "Senkou";
    const rank = (g) => "GFEDCBAS".indexOf(g);
    let best = 1;
    [0, 1, 2, 3].forEach((i) => { if (rank(t.apt[6 + i]) > rank(t.apt[6 + best])) best = i; });
    return STYLES[best][0];
  }

  function cm() {
    if (!state.cm) state.cm = {};
    const c = state.cm;
    const defaults = { style: defaultStyle(), ownedOnly: true, borrow: true, skillW: "1", runs: "10", locked: [], sq: "", sfilter: "all", globalSkills: true };
    Object.keys(defaults).forEach((k) => { if (c[k] == null) c[k] = defaults[k]; });
    if (!presetById(c.preset)) c.preset = defaultPreset().id;
    return c;
  }

  function presetStatus(p) {
    const g = p.global;
    if (g.end < TODAY) return ["ended", "Ended"];
    if (g.start <= TODAY) return ["live", "Running now"];
    const n = daysBetween(TODAY, g.start);
    return ["soon", (g.est ? "About " : "") + (n === 1 ? "starts tomorrow" : "in " + n + " days")];
  }

  function presetLabel(p) {
    return p.name + " · " + p.course.track + " " + p.course.distance + "m " + p.course.surface + " · " + (p.global.est ? "~" : "") + fmtDate(p.global.start);
  }

  function loadSkillValues(id) {
    if (svCache[id]) return;
    if (!SV || SV.ready.indexOf(id) === -1) { svCache[id] = "missing"; return; }
    svCache[id] = "loading";
    fetch("data/skillvalues/" + id + ".json?v=" + ASSET_V)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((j) => { svCache[id] = j; if (state.tab === "cm") renderCM(); })
      .catch(() => { svCache[id] = "error"; if (state.tab === "cm") renderCM(); });
  }

  const skillInfo = (id) => (SV && SV.skills[id]) || [D.DATA.skills[id] || "#" + id, D.skillCost(id) || 0, 1, 1];

  // Skills ranked by median length gain for a preset and style. Your pasted Umalator results win.
  function skillRows(pid, style) {
    const mine = pasted[pid] && pasted[pid][style];
    if (mine) {
      return Object.entries(mine).map(([id, L]) => ({ id: +id, L, mean: null, mine: true })).sort((a, b) => b.L - a.L);
    }
    const data = svCache[pid];
    if (!data || typeof data === "string" || !data[style]) return [];
    return data[style].map(([id, med, mean]) => ({ id, L: med / 100, mean: mean / 100 }));
  }

  function skillMap(pid, style) {
    const map = {};
    const costs = {};
    skillRows(pid, style).forEach((r) => { map[r.id] = r.L; costs[r.id] = skillInfo(r.id)[1]; });
    return { map, costs };
  }

  // Which cards can give each skill (hint or event), among the cards the optimizer may use.
  function skillSources(c) {
    const out = {};
    const ids = c.ownedOnly && ownedIds().length ? ownedIds() : D.DATA.supports.filter((x) => D.onGlobal(x, TODAY)).map((x) => x.id);
    ids.forEach((id) => {
      const card = D.card(id);
      (card.hs || []).concat(card.es || []).forEach((sk) => { (out[sk] = out[sk] || []).push(card); });
    });
    return out;
  }

  function optPool(c) {
    if (c.ownedOnly && ownedIds().length) return ownedIds().map((id) => ({ id, lb: owned[id] }));
    return D.DATA.supports.filter((x) => D.onGlobal(x, TODAY) && x.r >= 2).map((x) => ({ id: x.id, lb: 4 }));
  }
  const borrowPool = () => D.DATA.supports.filter((x) => D.onGlobal(x, TODAY) && x.r === 3).map((x) => ({ id: x.id, lb: 4 }));

  function optKey() {
    const c = cm();
    return [c.preset, c.style, state.scenario, state.deck.trainee, c.ownedOnly, c.borrow, c.skillW, c.runs, c.locked.join("."), ownedCode()].join("|");
  }

  function startJob(msg, done) {
    if (optRun && optRun.worker) optRun.worker.terminate();
    optRun = { f: 0 };
    const finish = (m) => {
      optRun = null;
      if (m.type === "error") flash("The optimizer hit an error: " + m.message);
      else done(m);
      if (state.tab === "cm") renderCM();
    };
    // Same work on the page itself, for browsers that can't start the worker (e.g. opened from a file).
    const inline = () => setTimeout(() => {
      try { finish(OPT.runJob(msg, () => {})); } catch (err) { finish({ type: "error", message: String(err.message || err) }); }
    }, 30);
    let w = null;
    try { w = new Worker("optimizer.worker.js?v=" + ASSET_V); } catch (err) { w = null; }
    if (!w) { inline(); return; }
    optRun.worker = w;
    w.onmessage = (e) => {
      const m = e.data;
      if (m.type === "progress") {
        optRun.f = m.f;
        const bar = $("#cmProg");
        if (bar) bar.style.width = Math.round(m.f * 100) + "%";
        return;
      }
      w.terminate();
      finish(m);
    };
    w.onerror = (err) => { err.preventDefault(); w.terminate(); optRun = { f: 0 }; inline(); };
    w.postMessage(msg);
  }

  function optOpts(c, p) {
    const sv = skillMap(p.id, c.style);
    return {
      scenario: state.scenario, build: p.build, trainee: state.deck.trainee, skills: sv.map, costs: sv.costs,
      skillWeight: +c.skillW, runs: +c.runs, borrow: c.borrow, locked: c.locked.slice(), seed: 20261006
    };
  }

  function runOptimizer() {
    const c = cm();
    const p = presetById(c.preset);
    const pool = optPool(c);
    if (pool.length < 6) { flash("The optimizer needs at least 6 cards. Mark more owned cards, or untick “Only cards I own”."); return; }
    const meta = { key: optKey(), preset: p.id, style: c.style, scenario: state.scenario, skillsUsed: Object.keys(skillMap(p.id, c.style).map).length };
    wish = null;
    startJob({ job: "optimize", opts: optOpts(c, p), pool, borrowPool: c.borrow ? borrowPool() : [] }, (res) => { optResult = Object.assign(res, meta); });
    renderCM();
  }

  function runWishlist() {
    if (!optResult) return;
    const c = cm();
    const p = presetById(optResult.preset);
    // Try each candidate in place of the deck's two weakest cards you own.
    const order = optResult.cards.map((x, i) => [i, optResult.contrib[i], x]).filter((x) => !x[2].borrowed && c.locked.indexOf(x[2].id) === -1).sort((a, b) => a[1] - b[1]);
    const swapSlots = order.slice(0, 2).map((x) => x[0]);
    const inDeck = new Set(optResult.cards.map((x) => x.id));
    const candidates = D.DATA.supports.filter((x) => D.onGlobal(x, TODAY) && x.r >= 2 && (owned[x.id] == null || owned[x.id] < 4) && !(inDeck.has(x.id) && !c.ownedOnly))
      .map((x) => ({ id: x.id, lb: 4 }));
    wish = "loading";
    startJob({ job: "wishlist", opts: optOpts(c, p), deck: optResult.cards, candidates, swapSlots }, (res) => { wish = res.list; });
    renderCM();
  }

  function renderCM() {
    const body = $("#tabBody");
    if (!P || !OPT) { body.innerHTML = `<div class="empty">The CM data didn't load. Refresh the page.</div>`; return; }
    const c = cm();
    const p = presetById(c.preset);
    loadSkillValues(p.id);
    body.innerHTML = `<div class="cm">${cmHeader(p, c)}${cmOptimizer(p, c)}${cmSkills(p, c)}</div>`;
  }

  function cmHeader(p, c) {
    const groups = [
      ["Now and next on Global", P.list.filter((x) => x.kind === "cm" && x.global.end >= TODAY && !x.global.est)],
      ["Later Champions Meetings (Global dates estimated)", P.list.filter((x) => x.kind === "cm" && x.global.est)],
      ["League of Heroes (JP so far, Global dates estimated)", P.list.filter((x) => x.kind === "loh")],
      ["Past Global Champions Meetings", P.list.filter((x) => x.kind === "cm" && x.global.end < TODAY).reverse()]
    ];
    const opts = groups.filter((g) => g[1].length).map(([lab, xs]) => `<optgroup label="${esc(lab)}">${xs.map((x) => `<option value="${x.id}" ${x.id === p.id ? "selected" : ""}>${esc(presetLabel(x))}</option>`).join("")}</optgroup>`).join("");
    const [stCls, stText] = presetStatus(p);
    const s = p.stats;
    return `<section class="panel cm-head">
      <label class="field grow"><span>Champions Meeting or League of Heroes</span><select data-cm="preset">${opts}</select></label>
      <div class="cm-title"><h2>${esc(p.name)}</h2>
        <span class="chip">${p.kind === "loh" ? "League of Heroes " + p.no : "Champions Meeting #" + p.no}</span>
        <span class="chip cm-${stCls}">${stText}</span></div>
      <div class="cm-facts">
        <div class="cm-course"><b>${esc(p.course.track)} ${p.course.distance}m</b> · ${p.course.surface} · ${p.course.turn === "Straight" ? "straight course" : p.course.turn + "-handed"}${p.course.layout ? " (" + p.course.layout + ")" : ""} · ${p.course.dist}</div>
        <div>${esc(p.conditions)}</div>
        <div>Global: <b>${p.global.est ? "about " : ""}${fmtDate(p.global.start)} – ${fmtDate(p.global.end)}</b>${p.global.est ? ' <span class="pill">estimate</span>' : ""} · JP: ${fmtDate(p.jp.start)}</div>
        ${p.global.note ? `<div class="mini">${esc(p.global.note)}</div>` : p.global.est ? `<div class="mini">Global runs Champions Meetings in JP's order, lately about every 3 weeks, so this date is an estimate.</div>` : ""}
      </div>
      <div class="row-wrap">
        <div class="field"><span>Running style</span><div class="seg style-seg" role="radiogroup" aria-label="Running style">${STYLES.map(([k, l]) => `<button type="button" role="radio" aria-checked="${c.style === k}" data-cm-style="${k}">${l}</button>`).join("")}</div></div>
        <button type="button" class="btn ghost small" data-cm-build="${p.build}" ${state.build === p.build ? "disabled" : ""}>${state.build === p.build ? "Turn coach build: " + esc(E.BUILDS[p.build].label) : "Set the turn coach to " + esc(E.BUILDS[p.build].label)}</button>
      </div>
      <p class="mini">Skill values on this course were simulated with Speed ${s.speed}, Stamina ${s.stamina}, Power ${s.power}, Guts ${s.guts}, Wit ${s.wisdom}, S distance and A surface aptitude, Great mood.</p>
    </section>`;
  }

  function cmOptimizer(p, c) {
    const sc = scenario();
    const t = state.deck.trainee ? D.trainee(state.deck.trainee) : null;
    const n = ownedIds().length;
    const running = !!optRun;
    const opt = (pairs, v) => pairs.map(([k, l]) => `<option value="${k}" ${String(v) === k ? "selected" : ""}>${l}</option>`).join("");
    const nSkills = Object.keys(skillMap(p.id, c.style).map).length;
    return `<section class="panel cm-opt">
      <h3>Deck optimizer</h3>
      <p class="mini">Plays simulated <b>${esc(sc.name)}</b> careers (change the scenario at the top) with each candidate deck, using your cards' real effects at your limit breaks, and values every skill the deck can hint by its median length gain here as a ${STYLE_LABEL[c.style]} runner. ${t ? "Trainee: <b>" + esc(t.n) + "</b>, growth bonuses included." : "Set your trainee under <b>Trainee and deck</b> to include her growth bonuses."}</p>
      ${nSkills ? "" : `<p class="mini warn">No skill values for this race yet${svCache[p.id] === "loading" ? " (loading…)" : ""}, so skills won't count. Paste your own Umalator results below to add them.</p>`}
      <div class="row-wrap">
        <label class="chip-toggle"><input type="checkbox" data-cm="ownedOnly" ${c.ownedOnly ? "checked" : ""}> Only cards I own (${n})</label>
        <label class="chip-toggle"><input type="checkbox" data-cm="borrow" ${c.borrow ? "checked" : ""}> Borrow 1 card from a friend</label>
        <label class="field"><span>Skill hints count</span><select data-cm="skillW">${opt([["0", "Not at all"], ["0.5", "A little"], ["1", "Normal"], ["1.5", "A lot"]], c.skillW)}</select></label>
        <label class="field"><span>Search</span><select data-cm="runs">${opt([["6", "Quick"], ["10", "Normal"], ["20", "Thorough (slow)"]], c.runs)}</select></label>
      </div>
      <div class="row-wrap">
        <label class="field grow"><span>Must include (optional)</span><input id="cmLock" list="cardListAll" placeholder="A card that must be in the deck" autocomplete="off"></label>
        <button type="button" class="btn ghost small" id="cmLockAdd">Add</button>
      </div>
      ${c.locked.length ? `<div class="row-wrap">${c.locked.map((id) => `<span class="chip lockchip">${esc(D.card(id).n)} <button type="button" class="linkish" data-cm-unlock="${id}" aria-label="Remove ${esc(D.card(id).n)}">✕</button></span>`).join("")}</div>` : ""}
      ${c.ownedOnly && n < 6 ? `<p class="mini warn">You've marked ${n} owned card${n === 1 ? "" : "s"}. Mark yours in the <button type="button" class="linkish" data-goto-tab="cards">Support cards</button> tab, or untick “Only cards I own” to search every Global SSR and SR at max limit break.</p>` : ""}
      <div class="row-wrap run-row">
        <button type="button" class="btn" id="cmRun" ${running ? "disabled" : ""}>${running ? "Searching…" : "Find my best deck"}</button>
        <div class="progress" ${running ? "" : "hidden"}><i id="cmProg" style="width:${Math.round(((optRun && optRun.f) || 0) * 100)}%"></i></div>
      </div>
      <div id="cmOut">${optResult ? optResultHTML(optResult, c) : ""}</div>
    </section>`;
  }

  function optResultHTML(r, c) {
    const p = presetById(r.preset);
    const total = Math.max(1, r.result.value);
    const pct = (x) => (x >= 0 ? "+" : "−") + Math.abs(Math.round(x * 1000) / 10) + "%";
    const cards = r.cards.map((x, i) => Object.assign({ card: D.card(x.id), add: r.contrib[i] }, x));
    const stale = r.key !== optKey();
    const sk = r.result.skills.filter((x) => x.surplus > 0 && x.p >= 0.15).slice(0, 10);
    const w = wish;
    return `<div class="opt-result">
      <h4>Best deck for ${esc(p.name)} · ${STYLE_LABEL[r.style]} · ${esc((SCENARIOS.find((x) => x.id === r.scenario) || {}).name || "")}</h4>
      ${stale ? `<p class="mini warn">Settings or cards changed since this search. Press <b>Find my best deck</b> again to update it.</p>` : ""}
      <div class="opt-cards">${cards.map((x) => `<div class="opt-card ty-${x.card.ty}">
        <span class="tydot" aria-hidden="true"></span>
        <div class="opt-name"><b>${esc(x.card.n)}</b> <span class="mini">${esc(x.card.t)}</span>
          <div class="mini">${D.RARITY[x.card.r]} ${D.typeLabel(x.card.ty)} · LB${x.lb}${x.borrowed ? ' · <b>borrow this</b>' : ""}${c.locked.indexOf(x.id) !== -1 ? " · locked" : ""}</div></div>
        <div class="num" title="How much the deck loses without this card">${pct(x.add / total)}</div>
      </div>`).join("")}</div>
      <p class="mini">Expected after a career: ${E.STATS.map((s, i) => `${E.STAT_LABELS[s]} <b>${r.result.stats[i]}</b>`).join(" · ")} · <b>${r.result.sp}</b> SP · about <b>${Math.round(r.result.rainbows)}</b> friendship trainings · race bonus ${r.result.raceBonus}%. The percentage on each card is how much the deck's score drops without it.</p>
      ${sk.length ? `<div class="opt-skills"><b>Best skills this deck can hint here:</b> ${sk.map((x) => `<span class="skillpill">${esc(skillInfo(x.id)[0])} <b>${x.L.toFixed(2)} L</b> <span class="mini">${Math.round(x.p * 100)}%</span></span>`).join(" ")}</div>` : r.skillsUsed ? "" : `<p class="mini">Skills weren't counted (no skill values for this race).</p>`}
      <div class="row-wrap">
        <button type="button" class="btn" data-use-opt="1">Use this deck in the coach</button>
        <button type="button" class="btn ghost" id="cmWish" ${w === "loading" ? "disabled" : ""}>${w === "loading" ? "Checking cards…" : "Which cards would improve it?"}</button>
      </div>
      ${r.runnersUp.length ? `<details class="alts"><summary>Close alternatives</summary><ul>${r.runnersUp.map((a) => `<li>Swap <b>${esc(D.card(a.out).n)}</b> for <b>${esc(D.card(a.in).n)}</b> <span class="mini">[${esc(D.card(a.in).t)}] LB${a.inLb}</span>: ${pct(a.value / total - 1)}</li>`).join("")}</ul></details>` : ""}
      ${Array.isArray(w) ? (w.length ? `<div class="wish"><h4>Cards worth getting</h4><ol>${w.map((x) => {
        const cd = D.card(x.id);
        const have = owned[x.id] != null;
        return `<li><b>${esc(cd.n)}</b> <span class="mini">[${esc(cd.t)}] ${D.RARITY[cd.r]} ${D.typeLabel(cd.ty)}</span> ${have ? "from LB" + owned[x.id] + " to LB4" : "at LB4"}: <b>${pct(x.share)}</b>, replacing ${esc(D.card(x.replaces).n)}</li>`;
      }).join("")}</ol><p class="mini">Each card is tried in place of the deck's two weakest cards you own.</p></div>` : `<p class="mini">No single card at LB4 beats your current picks for this race.</p>`) : ""}
    </div>`;
  }

  function cmSkills(p, c) {
    const status = svCache[p.id];
    const mine = pasted[p.id] && pasted[p.id][c.style];
    let rows = skillRows(p.id, c.style);
    const src = skillSources(c);
    const deckIds = new Set(state.deck.slots.filter(Boolean).map((sl) => sl.id));
    const q = (c.sq || "").trim().toLowerCase();
    rows = rows.filter((r) => {
      const info = skillInfo(r.id);
      if (c.globalSkills && !info[3]) return false;
      if (q && info[0].toLowerCase().indexOf(q) === -1) return false;
      if (c.sfilter === "cards" && !src[r.id]) return false;
      if (c.sfilter === "deck" && !(src[r.id] || []).some((x) => deckIds.has(x.id)) && !D.DATA.supports.some((x) => deckIds.has(x.id) && (x.hs || []).concat(x.es || []).indexOf(r.id) !== -1)) return false;
      return true;
    });
    const shown = rows.slice(0, skillLimit);
    const opt = (pairs, v) => pairs.map(([k, l]) => `<option value="${k}" ${String(v) === k ? "selected" : ""}>${l}</option>`).join("");
    const empty = status === "loading" ? "Loading skill values…"
      : status === "missing" && !mine ? "Skill values for this race haven't been simulated yet. Paste your own from the Umalator below."
      : status === "error" && !mine ? "Couldn't load the skill values. Check your connection and reopen this tab."
      : "No skills match.";
    return `<section class="panel cm-skills">
      <h3>Skills for this race · ${STYLE_LABEL[c.style]}</h3>
      <p class="mini">${mine ? "Using <b>your pasted Umalator results</b> for this race and style." : `Median length gain (L = one horse length) of each skill on this course, from <a href="https://alpha123.github.io/uma-tools/umalator-global/" target="_blank" rel="noopener">alpha123's Umalator</a>: the same skill chart, run here for every skill.`} Gold skill costs don't include the white skill they need. L per 100 SP shows which skills are worth their points.</p>
      <div class="db-controls">
        <label class="field grow"><span>Search</span><input data-cm="sq" value="${esc(c.sq || "")}" placeholder="Skill name" autocomplete="off"></label>
        <label class="field"><span>Show</span><select data-cm="sfilter">${opt([["all", "All skills"], ["cards", c.ownedOnly && ownedIds().length ? "Skills my cards can give" : "Skills Global cards can give"], ["deck", "Skills my coach deck can give"]], c.sfilter)}</select></label>
        <label class="chip-toggle"><input type="checkbox" data-cm="globalSkills" ${c.globalSkills ? "checked" : ""}> On Global only</label>
      </div>
      <div id="cmSkillTable">${shown.length ? `<div class="table-wrap"><table class="skills"><thead><tr><th>Skill</th><th class="num">Median</th>${mine ? "" : '<th class="num opt-col">Mean</th>'}<th class="num">SP</th><th class="num">L / 100 SP</th><th class="opt-col">From cards</th></tr></thead><tbody>
        ${shown.map((r) => {
          const info = skillInfo(r.id);
          const from = src[r.id] || [];
          const kind = info[2] === 2 ? "gold" : info[2] === 9 ? "inh" : "white";
          return `<tr class="sk-${kind}"><td><b>${esc(info[0])}</b>${info[3] ? "" : ' <span class="pill">JP</span>'}</td><td class="num"><b>${r.L.toFixed(2)}</b></td>${mine ? "" : `<td class="num opt-col">${r.mean != null ? r.mean.toFixed(2) : "–"}</td>`}<td class="num">${info[1] || "–"}</td><td class="num">${info[1] ? (r.L / info[1] * 100).toFixed(2) : "–"}</td><td class="mini opt-col">${from.slice(0, 3).map((x) => esc(x.n) + (deckIds.has(x.id) ? " ★" : "")).join(", ")}${from.length > 3 ? " +" + (from.length - 3) : ""}</td></tr>`;
        }).join("")}</tbody></table></div>
        ${rows.length > shown.length ? `<button type="button" class="btn ghost" data-cm-more="1">Show more (${rows.length - shown.length} left)</button>` : ""}` : `<div class="empty">${empty}</div>`}</div>
      <details class="paste">
        <summary>Use your own Umalator results</summary>
        <p class="mini">In the Umalator's <b>Skill chart</b> tab, set up your own uma for this race and run it, then select the whole results table, copy it and paste it here. The coach reads each skill's median and uses it for this race and running style (${STYLE_LABEL[c.style]}).</p>
        <textarea id="cmPaste" rows="5" placeholder="Paste the Skill chart table here"></textarea>
        <div class="row-wrap"><button type="button" class="btn small" id="cmPasteBtn">Use these values</button>${mine ? '<button type="button" class="btn ghost small" id="cmPasteReset">Go back to the built-in values</button>' : ""}</div>
      </details>
    </section>`;
  }

  function parseUmalator(text) {
    const names = {};
    Object.entries(D.DATA.skills).forEach(([id, n]) => { names[id] = n; });
    if (SV) Object.entries(SV.skills).forEach(([id, v]) => { names[id] = v[0]; });
    return OPT.parseChart(text, names);
  }

  function cmInput(el) {
    const c = cm();
    const k = el.dataset.cm;
    const v = el.type === "checkbox" ? el.checked : el.value;
    c[k] = v;
    save();
    if (k === "sq") {
      skillLimit = 60;
      const box = $("#cmSkillTable");
      const tmp = document.createElement("div");
      tmp.innerHTML = cmSkills(presetById(c.preset), c);
      const fresh = tmp.querySelector("#cmSkillTable");
      if (box && fresh) box.innerHTML = fresh.innerHTML;
      return;
    }
    if (k === "preset") skillLimit = 60;
    renderCM();
  }

  function cmClick(e) {
    const t = e.target;
    const c = state.tab === "cm" ? cm() : null;
    if (!c) return false;
    const style = t.closest("[data-cm-style]");
    if (style) { c.style = style.dataset.cmStyle; skillLimit = 60; save(); renderCM(); return true; }
    const build = t.closest("[data-cm-build]");
    if (build) { state.build = build.dataset.cmBuild; commit(true); flash("Turn coach build set to " + E.BUILDS[state.build].label); return true; }
    if (t.closest("#cmRun")) { runOptimizer(); return true; }
    if (t.closest("#cmWish")) { runWishlist(); return true; }
    if (t.closest("[data-goto-tab]")) { state.tab = t.closest("[data-goto-tab]").dataset.gotoTab; save(); renderTab(); return true; }
    if (t.closest("#cmLockAdd")) {
      const card = cardByLabel.get($("#cmLock").value.trim());
      if (!card) { flash("Pick a card from the list first."); return true; }
      if (c.locked.indexOf(card.id) === -1) c.locked.push(card.id);
      if (c.ownedOnly && owned[card.id] == null) flash(card.n + " isn't marked as owned, so it can only come in as the borrowed card.");
      save();
      renderCM();
      return true;
    }
    const un = t.closest("[data-cm-unlock]");
    if (un) { c.locked = c.locked.filter((id) => id !== +un.dataset.cmUnlock); save(); renderCM(); return true; }
    if (t.closest("[data-use-opt]") && optResult) {
      state.deck.slots = optResult.cards.map((x) => ({ id: x.id, lb: x.lb, bond: null }));
      state.facilities.forEach((f) => { f.members = []; f.hints = []; });
      commit(true);
      flash("Deck set in Trainee and deck" + (optResult.cards.some((x) => x.borrowed) ? ". Remember to borrow the marked card." : ""));
      return true;
    }
    if (t.closest("[data-cm-more]")) { skillLimit += 60; renderCM(); return true; }
    if (t.closest("#cmPasteBtn")) {
      const r = parseUmalator($("#cmPaste").value);
      const n = Object.keys(r.values).length;
      if (!n) { flash("Couldn't find any skills with values like “1.23 L” in that text."); return true; }
      pasted[c.preset] = pasted[c.preset] || {};
      pasted[c.preset][c.style] = r.values;
      savePasted();
      flash("Read " + n + " skills" + (r.unknown ? ", " + r.unknown + " names not recognized" : ""));
      renderCM();
      return true;
    }
    if (t.closest("#cmPasteReset")) {
      if (pasted[c.preset]) delete pasted[c.preset][c.style];
      savePasted();
      renderCM();
      return true;
    }
    return false;
  }

  function renderTab() {
    const sc = scenario();
    $$(".tabs [data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === state.tab)));
    const body = $("#tabBody");
    if (state.tab === "cm" && HAS_DATA) {
      renderCM();
      return;
    }
    if ((state.tab === "cards" || state.tab === "trainees") && HAS_DATA) {
      body.innerHTML = dbControls();
      renderDbList();
      return;
    }
    if (state.tab === "guide") {
      body.innerHTML = `
        <div class="guide">
          <div class="guide-head">
            <h2>${esc(sc.name)}</h2>
            <div class="jp">${esc(sc.jpName)}${sc.aka ? " · also called " + esc(sc.aka) : ""}</div>
            <div class="chips"><span class="chip st-${sc.status}">${STATUS_LABELS[sc.status]}</span><span class="chip">JP ${esc(sc.jpRelease)}</span><span class="chip">Global ${esc(sc.globalRelease)}</span><span class="chip">${sc.totalTurns} turns</span></div>
            <div class="caps-row">${E.STATS.map((s, i) => `<span class="cap s-${s}"><b>${E.STAT_LABELS[s]}</b> ${sc.caps[i]}</span>`).join("")}<span class="mini">base stat caps</span></div>
          </div>
          <p class="lede">${esc(sc.summary)}</p>
          <div class="cols">
            <div><h3>How to play it</h3><ol class="loop">${sc.coreLoop.map((x) => `<li>${esc(x)}</li>`).join("")}</ol></div>
            <div>
              <h3>Deck</h3><p>${esc(sc.deck)}</p>
              ${sc.keyCards.length ? `<h3>Key cards</h3><ul>${sc.keyCards.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}
              <h3>Finale</h3><p><b>${esc(sc.finale.name)}.</b> ${esc(sc.finale.note)}</p>
            </div>
          </div>
        </div>`;
    } else if (state.tab === "all") {
      body.innerHTML = `<div class="table-wrap"><table class="all"><thead><tr><th>#</th><th>Scenario</th><th>Status</th><th>JP release</th><th>Global</th><th>Caps (Spd/Sta/Pow/Gut/Wit)</th><th></th></tr></thead><tbody>${SCENARIOS.map((s, i) => `
        <tr class="${s.id === sc.id ? "cur" : ""}"><td class="num">${i + 1}</td><td><b>${esc(s.name)}</b><div class="jp">${esc(s.jpName)}</div></td><td><span class="chip st-${s.status}">${STATUS_LABELS[s.status]}</span></td><td class="num">${esc(s.jpRelease)}</td><td>${esc(s.globalRelease)}</td><td class="num">${s.caps.join("/")}</td><td><button type="button" class="btn ghost small" data-pick="${s.id}">Open</button></td></tr>`).join("")}</tbody></table></div>
        <p class="mini">Global has added a scenario about every four months. Grand Masters is next, then the JP order continues: L'Arc, UAF, Great Food Festival, Mecha, Legends, Island, Onsen, Beyond Dreams, Trecen-ken.</p>`;
    } else if (state.tab === "log") {
      const log = state.log || [];
      body.innerHTML = log.length
        ? `<div class="table-wrap"><table class="plan"><thead><tr><th>Turn</th><th>Date</th><th>Action</th><th>Energy</th><th>Mood</th></tr></thead><tbody>${log.slice().reverse().map((l) => `
            <tr><td class="num"><button type="button" class="linkish" data-goto="${l.turn}">${l.turn}</button></td><td>${esc(E.turnInfo(l.turn, sc).text)}</td><td class="k-${l.kind}${l.stat ? " s-" + l.stat : ""}"><span class="logdot"></span>${esc(l.label)}</td><td class="num">${l.energy}</td><td>${E.MOODS[l.mood]}</td></tr>`).join("")}</tbody></table></div>
            <div class="log-actions"><button type="button" class="btn ghost" data-undo="1">Undo last turn</button><span class="mini">${log.length} turn(s) logged. ${summary(log)}</span></div>`
        : `<div class="empty"><b>No turns logged yet.</b> Press <b>Done, next turn</b> after each turn and your run builds up here. Energy and mood carry forward, and the coach learns your deck strength from any gains you type.</div>`;
    } else {
      const logged = new Map((state.log || []).map((l) => [l.turn, l]));
      let rows = "";
      for (let t = 1; t <= sc.totalTurns; t++) {
        const ev = E.eventsFor(t, sc, state);
        const ph = E.phaseFor(t, sc);
        const prev = t > 1 ? E.phaseFor(t - 1, sc).id : null;
        if (ph.id !== prev) rows += `<tr class="phase-row"><td colspan="3"><b>${esc(ph.name)}</b> ${esc(ph.tip)}</td></tr>`;
        const l = logged.get(t);
        if (!ev.length && t !== state.turn && !l) continue;
        const what = ev.map((e) => `<b>${esc(e.label)}</b> ${esc(e.tip || "")}`).concat(l ? [`<span class="muted">✓ ${esc(l.label)}</span>`] : []).join("<br>");
        rows += `<tr class="${t === state.turn ? "cur" : ""}"><td class="num"><button type="button" class="linkish" data-goto="${t}">${t}</button></td><td>${esc(E.turnInfo(t, sc).text)}${E.isCamp(t, sc) ? ' <span class="chip camp">camp</span>' : ""}</td><td>${what || '<span class="muted">You are here</span>'}</td></tr>`;
      }
      body.innerHTML = `<div class="table-wrap"><table class="plan"><thead><tr><th>Turn</th><th>Date</th><th>What matters</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }
  }

  function summary(log) {
    const c = {};
    log.forEach((l) => { const k = l.kind === "train" ? E.STAT_LABELS[l.stat] : l.kind; c[k] = (c[k] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, n]) => n + " " + k).join(", ");
  }

  function renderOutputs() {
    syncLight();
    renderCall();
    renderOptions();
    syncPlaceholders();
    if (state.tab === "plan" || state.tab === "log") renderTab();
  }

  function render() {
    renderStrip();
    renderInputs();
    syncLight();
    renderCall();
    renderOptions();
    syncPlaceholders();
    renderTab();
  }

  shell();
  fillLists();
  render();
})();
