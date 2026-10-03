// UI for the turn coach. Depends on scenarios.js and engine.js (globals).
(function () {
  const { SCENARIOS, STATUS_LABELS } = window.UmaScenarios;
  const E = window.UmaEngine;
  const STORE_KEY = "uma-turn-coach-v1";

  const blankFacility = (stat) => ({ stat, gain: 0, cards: 0, rainbows: 0, unbonded: 0, hint: false, fail: 0, extras: {} });

  // Opens on an example summer-camp turn so the coach has something to show.
  function exampleState() {
    return {
      scenario: "ura",
      build: "medium",
      risk: 15,
      turn: 38,
      energy: 62,
      maxEnergy: 100,
      mood: 3,
      goalRace: false,
      raceAvailable: false,
      badCondition: false,
      capped: {},
      extras: {},
      example: true,
      tab: "plan",
      facilities: [
        { stat: "speed", gain: 0, cards: 3, rainbows: 2, unbonded: 0, hint: false, fail: 9, extras: {} },
        { stat: "stamina", gain: 0, cards: 1, rainbows: 0, unbonded: 0, hint: true, fail: 8, extras: {} },
        { stat: "power", gain: 0, cards: 2, rainbows: 1, unbonded: 1, hint: false, fail: 10, extras: {} },
        { stat: "guts", gain: 0, cards: 0, rainbows: 0, unbonded: 0, hint: false, fail: 11, extras: {} },
        { stat: "wit", gain: 0, cards: 1, rainbows: 0, unbonded: 0, hint: false, fail: 0, extras: {} }
      ]
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.facilities && s.facilities.length === 5) return s;
      }
    } catch (e) { /* storage unavailable */ }
    return exampleState();
  }

  let state = load();

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  const $ = (sel, el) => (el || document).querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const scenario = () => SCENARIOS.find((s) => s.id === state.scenario) || SCENARIOS[0];

  function shell() {
    document.getElementById("app").innerHTML = `
      <header class="masthead">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true"></span>
          <div>
            <h1>Uma Turn Coach</h1>
            <p class="sub">Turn-by-turn calls for every career scenario, from Global's current ones to JP's latest.</p>
          </div>
        </div>
        <div class="controls">
          <label class="field"><span>Scenario</span><select id="scenario"></select></label>
          <label class="field"><span>Build</span><select id="build"></select></label>
          <label class="field"><span>Max failure <b id="riskOut"></b></span><input id="risk" type="range" min="0" max="40" step="1"></label>
        </div>
      </header>
      <section class="strip-wrap" aria-label="Career turns">
        <div class="strip-head">
          <button id="prev" class="btn ghost" aria-label="Previous turn">◀</button>
          <div class="turn-now"><span id="turnNum"></span><span id="turnText"></span></div>
          <button id="next" class="btn ghost" aria-label="Next turn">▶</button>
          <button id="nextReset" class="btn">Next turn, clear trainings</button>
        </div>
        <div class="strip" id="strip"></div>
        <div class="legend">
          <span><i class="sw y0"></i>Junior</span><span><i class="sw y1"></i>Classic</span><span><i class="sw y2"></i>Senior</span><span><i class="sw camp"></i>Summer camp</span><span><i class="sw fin"></i>Finale</span><span><i class="dot"></i>Key event</span>
        </div>
      </section>
      <div id="exampleNote" class="example-note" hidden>These are example values for a summer-camp turn. Enter what your game shows to get a real call.</div>
      <main class="grid">
        <section class="inputs" aria-label="This turn">
          <div class="panel">
            <h2>This turn</h2>
            <div class="row2">
              <label class="field"><span>Energy <b id="energyOut"></b></span><input id="energy" type="range" min="0" max="120" step="1"></label>
              <div class="field"><span>Mood</span><div class="seg" id="mood" role="radiogroup" aria-label="Mood"></div></div>
            </div>
            <div class="checks">
              <label><input type="checkbox" id="goalRace"> Goal race this turn</label>
              <label><input type="checkbox" id="raceAvailable"> A good optional race is open</label>
              <label><input type="checkbox" id="badCondition"> Has a bad condition</label>
            </div>
            <div id="turnExtras" class="checks extras"></div>
            <details class="caps">
              <summary>Stats you've already capped or finished</summary>
              <div class="checks" id="caps"></div>
            </details>
          </div>
          <div class="facilities" id="facilities"></div>
          <p class="hint-text">Enter each training's <b>total gain</b> (the sum of the green numbers) for the most accurate call. If you leave it at 0, the coach estimates from card counts.</p>
        </section>
        <aside class="verdict" aria-live="polite">
          <div class="panel call" id="call"></div>
          <div class="panel" id="options"></div>
        </aside>
      </main>
      <nav class="tabs" role="tablist">
        <button role="tab" data-tab="plan">Turn plan</button>
        <button role="tab" data-tab="guide">Scenario guide</button>
        <button role="tab" data-tab="all">All scenarios</button>
      </nav>
      <section id="tabBody" class="tab-body"></section>
      <footer class="foot">Scenario notes are compiled from JP and Global guides as of October 2026. Turns marked "approx." can shift, so the in-game goal list always wins. Fan-made tool, not affiliated with Cygames.</footer>
    `;

    const sel = $("#scenario");
    const groups = [["global", "On Global now"], ["global-soon", "Coming to Global next"], ["jp-current", "JP latest"], ["jp", "JP only (future Global)"], ["announced", "Announced"]];
    sel.innerHTML = groups.map(([st, lab]) => {
      const items = SCENARIOS.filter((s) => s.status === st);
      return items.length ? `<optgroup label="${lab}">${items.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}</optgroup>` : "";
    }).join("");
    $("#build").innerHTML = Object.entries(E.BUILDS).map(([k, b]) => `<option value="${k}">${b.label}</option>`).join("");
    $("#mood").innerHTML = E.MOODS.map((m, i) => `<button type="button" role="radio" data-mood="${i}" class="mood m${i}">${m}</button>`).join("");
    $("#caps").innerHTML = E.STATS.map((s) => `<label><input type="checkbox" data-cap="${s}"> ${E.STAT_LABELS[s]}</label>`).join("");

    sel.addEventListener("change", () => { state.scenario = sel.value; state.extras = {}; state.facilities.forEach((f) => (f.extras = {})); clampTurn(); touch(true); });
    $("#build").addEventListener("change", (e) => { state.build = e.target.value; touch(); });
    $("#risk").addEventListener("input", (e) => { state.risk = +e.target.value; touch(); });
    $("#energy").addEventListener("input", (e) => { state.energy = +e.target.value; touch(); });
    $("#mood").addEventListener("click", (e) => { const b = e.target.closest("[data-mood]"); if (b) { state.mood = +b.dataset.mood; touch(); } });
    ["goalRace", "raceAvailable", "badCondition"].forEach((id) => $("#" + id).addEventListener("change", (e) => { state[id] = e.target.checked; touch(); }));
    $("#caps").addEventListener("change", (e) => { const c = e.target.dataset.cap; if (c) { state.capped[c] = e.target.checked; touch(); } });
    $("#prev").addEventListener("click", () => setTurn(state.turn - 1));
    $("#next").addEventListener("click", () => setTurn(state.turn + 1));
    $("#nextReset").addEventListener("click", () => {
      state.facilities = E.STATS.map(blankFacility);
      state.goalRace = false; state.raceAvailable = false;
      setTurn(state.turn + 1);
    });
    $("#strip").addEventListener("click", (e) => { const c = e.target.closest("[data-turn]"); if (c) setTurn(+c.dataset.turn); });
    document.querySelector(".tabs").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) { state.tab = b.dataset.tab; save(); renderTab(); } });
    $("#tabBody").addEventListener("click", (e) => {
      const t = e.target.closest("[data-goto]"); if (t) { setTurn(+t.dataset.goto); window.scrollTo({ top: 0, behavior: "smooth" }); }
      const s = e.target.closest("[data-pick]"); if (s) { sel.value = s.dataset.pick; sel.dispatchEvent(new Event("change")); state.tab = "guide"; renderTab(); }
    });
  }

  function clampTurn() {
    state.turn = Math.max(1, Math.min(scenario().totalTurns, state.turn));
  }

  function setTurn(t) {
    state.turn = t;
    clampTurn();
    touch(true);
  }

  // Value edits refresh only the outputs, so a field being typed in keeps focus.
  // Structural changes (scenario, turn, reset) rebuild the inputs too.
  function touch(full) {
    if (state.example) { state.example = false; }
    save();
    if (full) { render(); return; }
    syncLight();
    renderStrip();
    renderCall();
    renderTab();
  }

  function syncLight() {
    $("#riskOut").textContent = state.risk + "%";
    $("#energyOut").textContent = state.energy;
    document.querySelectorAll("#mood [data-mood]").forEach((b) => b.setAttribute("aria-checked", String(+b.dataset.mood === state.mood)));
    $("#exampleNote").hidden = !state.example;
  }

  function renderStrip() {
    const sc = scenario();
    const eventTurns = new Set((sc.events || []).map((e) => e.turn).concat(sc.finale.turns, [12]));
    let html = "";
    for (let t = 1; t <= sc.totalTurns; t++) {
      const ti = E.turnInfo(t, sc);
      const y = t > 72 ? "fin" : "y" + Math.floor((t - 1) / 24);
      const cls = ["cell", y, E.isCamp(t) ? "camp" : "", t === state.turn ? "on" : "", (t - 1) % 24 === 0 ? "ystart" : ""].join(" ");
      html += `<button class="${cls}" data-turn="${t}" title="Turn ${t}: ${esc(ti.text)}" aria-label="Turn ${t}, ${esc(ti.text)}">${eventTurns.has(t) ? '<i class="dot"></i>' : ""}</button>`;
    }
    $("#strip").innerHTML = html;
    const ti = E.turnInfo(state.turn, sc);
    $("#turnNum").textContent = "Turn " + state.turn + " / " + sc.totalTurns;
    $("#turnText").textContent = ti.text;
  }

  function renderInputs() {
    const sc = scenario();
    $("#scenario").value = sc.id;
    $("#build").value = state.build;
    $("#risk").value = state.risk;
    $("#energy").value = state.energy;
    ["goalRace", "raceAvailable", "badCondition"].forEach((id) => ($("#" + id).checked = !!state[id]));
    document.querySelectorAll("[data-cap]").forEach((c) => (c.checked = !!state.capped[c.dataset.cap]));
    syncLight();

    const turnInputs = sc.inputs.filter((i) => i.scope === "turn");
    $("#turnExtras").innerHTML = turnInputs.length
      ? `<div class="extras-head">${esc(sc.name)} inputs</div>` + turnInputs.map((i) => extraField(i, state.extras, "turn")).join("")
      : "";
    $("#turnExtras").hidden = !turnInputs.length;
    $("#turnExtras").oninput = (e) => {
      const k = e.target.dataset.extra; if (!k) return;
      state.extras[k] = e.target.type === "checkbox" ? e.target.checked : +e.target.value;
      touch();
    };

    const facInputs = sc.inputs.filter((i) => i.scope === "facility");
    $("#facilities").innerHTML = state.facilities.map((f, idx) => `
      <fieldset class="fac s-${f.stat}" data-idx="${idx}">
        <legend>${E.STAT_LABELS[f.stat]}</legend>
        ${num("gain", "Total gain", f.gain, 0, 300)}
        ${num("cards", "Cards", f.cards, 0, 6)}
        ${num("rainbows", "Rainbow", f.rainbows, 0, 6)}
        ${num("unbonded", "To bond", f.unbonded, 0, 6)}
        ${num("fail", "Fail %", f.fail, 0, 99)}
        <label class="chk"><input type="checkbox" data-k="hint" ${f.hint ? "checked" : ""}> Hint</label>
        ${facInputs.map((i) => extraField(i, f.extras, "fac")).join("")}
      </fieldset>`).join("");
    $("#facilities").oninput = (e) => {
      const box = e.target.closest("[data-idx]"); if (!box) return;
      const f = state.facilities[+box.dataset.idx];
      if (e.target.dataset.k) f[e.target.dataset.k] = e.target.type === "checkbox" ? e.target.checked : Math.max(0, +e.target.value || 0);
      if (e.target.dataset.extra) f.extras[e.target.dataset.extra] = e.target.type === "checkbox" ? e.target.checked : Math.max(0, +e.target.value || 0);
      touch();
    };
  }

  function num(k, label, v, min, max) {
    return `<label class="nf"><span>${label}</span><input type="number" inputmode="numeric" data-k="${k}" min="${min}" max="${max}" value="${v || 0}"></label>`;
  }

  function extraField(i, bag, where) {
    const v = bag[i.id] != null ? bag[i.id] : (i.default != null ? i.default : (i.type === "check" ? false : 0));
    if (i.type === "check") {
      return `<label class="chk sc" title="${esc(i.help || "")}"><input type="checkbox" data-extra="${i.id}" ${v ? "checked" : ""}> ${esc(i.label)}</label>`;
    }
    return `<label class="nf sc" title="${esc(i.help || "")}"><span>${esc(i.label)}</span><input type="number" inputmode="numeric" data-extra="${i.id}" min="0" max="${i.max || 99}" value="${v}"></label>`;
  }

  function renderCall() {
    const sc = scenario();
    const r = E.recommend(state, sc);
    const kind = r.action.kind;
    const stat = r.action.stat;
    $("#call").className = "panel call k-" + kind + (stat ? " s-" + stat : "");
    $("#call").innerHTML = `
      <div class="eyebrow">${esc(r.turn.text)} · ${esc(r.phase.name)}</div>
      <div class="headline">${esc(r.headline)}</div>
      <span class="pill">${esc(r.confidence)}</span>
      ${r.reasons.length ? `<ul class="why">${r.reasons.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      <div class="phase"><b>${esc(r.phase.name)}:</b> ${esc(r.phase.tip)}</div>
      ${r.events.length ? `<div class="events">${r.events.map((e) => `<div class="ev"><b>${esc(e.label)}</b> ${esc(e.tip || "")}</div>`).join("")}</div>` : ""}
    `;
    const top = Math.max(1, ...r.ranked.filter((o) => o.value < 900).map((o) => o.value));
    $("#options").innerHTML = `<h2>All options</h2><ol class="ranked">${r.ranked.map((o, i) => {
      const pct = o.value >= 900 ? 100 : Math.max(0, Math.round((o.value / top) * 100));
      return `<li class="${i === 0 ? "first" : ""} k-${o.kind}${o.stat ? " s-" + o.stat : ""}">
        <div class="opt-top"><span>${esc((o.prefix && o.prefix.length ? o.prefix.join(" → ") + " → " : "") + o.label)}</span><span class="num">${o.value >= 900 ? "must" : o.value.toFixed(0)}</span></div>
        <div class="bar"><i style="width:${pct}%"></i></div>
      </li>`;
    }).join("")}</ol>`;
  }

  function renderTab() {
    const sc = scenario();
    document.querySelectorAll(".tabs [data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === state.tab)));
    const body = $("#tabBody");
    if (state.tab === "guide") {
      body.innerHTML = `
        <div class="guide">
          <div class="guide-head">
            <h2>${esc(sc.name)}</h2>
            <div class="jp">${esc(sc.jpName)}${sc.aka ? " · also called " + esc(sc.aka) : ""}</div>
            <div class="chips"><span class="chip st-${sc.status}">${STATUS_LABELS[sc.status]}</span><span class="chip">JP ${esc(sc.jpRelease)}</span><span class="chip">Global ${esc(sc.globalRelease)}</span><span class="chip">${sc.totalTurns} turns</span></div>
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
      body.innerHTML = `<div class="table-wrap"><table class="all"><thead><tr><th>#</th><th>Scenario</th><th>Status</th><th>JP release</th><th>Global</th><th></th></tr></thead><tbody>${SCENARIOS.map((s, i) => `
        <tr class="${s.id === sc.id ? "cur" : ""}"><td class="num">${i + 1}</td><td><b>${esc(s.name)}</b><div class="jp">${esc(s.jpName)}</div></td><td><span class="chip st-${s.status}">${STATUS_LABELS[s.status]}</span></td><td class="num">${esc(s.jpRelease)}</td><td>${esc(s.globalRelease)}</td><td><button class="btn ghost small" data-pick="${s.id}">Open</button></td></tr>`).join("")}</tbody></table></div>
        <p class="hint-text">Global has been adding a scenario roughly every four months. Grand Masters is next, then the JP order continues: L'Arc, UAF, Great Food Festival, Mecha, Legends, Island, Onsen, Beyond Dreams, Trecen-ken.</p>`;
    } else {
      let rows = "";
      for (let t = 1; t <= sc.totalTurns; t++) {
        const ev = E.eventsFor(t, sc);
        const ph = E.phaseFor(t, sc);
        const prev = t > 1 ? E.phaseFor(t - 1, sc).id : null;
        if (ph.id !== prev) rows += `<tr class="phase-row"><td colspan="3"><b>${esc(ph.name)}</b> ${esc(ph.tip)}</td></tr>`;
        if (!ev.length && t !== state.turn) continue;
        rows += `<tr class="${t === state.turn ? "cur" : ""}"><td class="num"><button class="linkish" data-goto="${t}">${t}</button></td><td>${esc(E.turnInfo(t, sc).text)}${E.isCamp(t) ? ' <span class="chip camp">camp</span>' : ""}</td><td>${ev.map((e) => `<b>${esc(e.label)}</b> ${esc(e.tip || "")}`).join("<br>") || '<span class="muted">You are here</span>'}</td></tr>`;
      }
      body.innerHTML = `<div class="table-wrap"><table class="plan"><thead><tr><th>Turn</th><th>Date</th><th>What matters</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }
  }

  function render() {
    renderStrip();
    renderInputs();
    renderCall();
    renderTab();
  }

  shell();
  render();
})();
