// UI for the turn coach. Depends on scenarios.js and engine.js (globals).
(function () {
  const { SCENARIOS, STATUS_LABELS } = window.UmaScenarios;
  const E = window.UmaEngine;
  const STORE_KEY = "uma-turn-coach-v2";
  const PIP_MAX = 5;

  const blankFacility = (stat) => ({ stat, gain: null, cards: 0, rainbows: 0, unbonded: 0, hint: false, fail: null, extras: {} });

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
      caps: k.caps || {},
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
    ];
    return s;
  }

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && s.v === 2 && s.facilities && s.facilities.length === 5) return s;
    } catch (e) { /* storage unavailable */ }
    return exampleState();
  }

  let state = load();
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

          <div class="fac-head">
            <h2>Trainings</h2>
            <button type="button" class="btn ghost small" id="clearFacs">Clear</button>
          </div>
          <div class="facilities" id="facilities"></div>
          <p class="mini">Tap the dots to set <b>Cards</b> on the training, <b>Rainbow</b> (friendship) cards and cards with <b>Bond under 80</b>. Leave <b>Gain</b> and <b>Fail</b> blank and the coach estimates them. Typing the real total gain (the green numbers added up) makes the call much sharper.</p>

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
      </nav>
      <section id="tabBody" class="tab-body"></section>
      <footer class="foot">Scenario notes are compiled from JP and Global guides as of October 2026 (Global after the July 2026 rebalance). Turns marked "approx." can shift, so the in-game goal list always wins. Scores are estimates: 100 means a typical training for this point in the career. Fan-made tool, not affiliated with Cygames.</footer>
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
      const pip = e.target.closest("[data-pip]");
      if (!pip) return;
      const box = pip.closest("[data-idx]");
      const idx = +box.dataset.idx;
      const f = state.facilities[idx];
      const k = pip.dataset.pip;
      let v = +pip.dataset.v;
      if (f[k] === v) v = v - 1; // tapping the last filled dot clears it
      setCount(f, k, Math.max(0, v));
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
        ${pipsHTML("cards", f.cards, "Cards", "c")}
        ${pipsHTML("rainbows", f.rainbows, "Rainbow", "r")}
        ${pipsHTML("unbonded", f.unbonded, "Bond<80", "b")}
        <label class="chk ${f.hint ? "on" : ""}"><input type="checkbox" data-k="hint" ${f.hint ? "checked" : ""}> Hint !</label>
        ${facInputs.map((i) => extraField(i, f.extras)).join("")}
      </fieldset>`;
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
    $("#facilities").innerHTML = state.facilities.map(facilityHTML).join("");

    const build = E.BUILDS[state.build];
    $("#statTable").innerHTML = `<thead><tr><th>Stat</th><th>Current</th><th>Cap</th><th>Enough at</th></tr></thead><tbody>${E.STATS.map((s, i) => `
      <tr class="s-${s}"><th scope="row">${E.STAT_LABELS[s]}</th>
        <td><input type="number" inputmode="numeric" data-stat="${s}" data-kind="cur" min="0" max="2500" value="${state.stats[s] || ""}" placeholder="—" aria-label="Current ${E.STAT_LABELS[s]}"></td>
        <td><input type="number" inputmode="numeric" data-stat="${s}" data-kind="cap" min="0" max="2500" value="${state.caps[s] || ""}" placeholder="${sc.caps[i]}" aria-label="${E.STAT_LABELS[s]} cap"></td>
        <td class="num">${build.target[s]}</td></tr>`).join("")}</tbody>`;
  }

  function syncLight() {
    $("#riskOut").textContent = state.risk + "%";
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

  function renderTab() {
    const sc = scenario();
    $$(".tabs [data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === state.tab)));
    const body = $("#tabBody");
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
  render();
})();
