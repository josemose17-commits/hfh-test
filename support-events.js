// Coupled ordinary-support event rewards. Source records are CC BY-SA 4.0
// (Umamusume Wiki); arrival/success probabilities and choice policy are estimates.
(function (root) {
  const D = root.UmaDeck || (typeof require !== "undefined" ? require("./deck.js") : null);
  const S = root.UmaSkillEvents || (typeof require !== "undefined" ? require("./skill-events.js") : null);
  const data = root.UmaCardEvents || (typeof require !== "undefined" ? require("./data/card-events.js") : null);
  const hazards = new Map();
  const rewardCases = new WeakMap();
  const clamp = (n) => Math.max(0, Math.min(1, n));
  const mergeHints = (a, b) => Object.fromEntries([...new Set(Object.keys(a).concat(Object.keys(b)))].map((id) => [id, Math.min(5, (a[id] || 0) + (b[id] || 0))]));
  function tail(days, stages, p) {
    if (stages <= 0) return 1;
    if (days < stages || p <= 0) return 0;
    if (p >= 1) return 1;
    let term = Math.pow(1 - p, days), below = term;
    for (let k = 1; k < stages; k++) { term *= (days - k + 1) / k * p / (1 - p); below += term; }
    return clamp(1 - below);
  }
  function hazard(days, stages, completion) {
    const key = [days, stages, completion].join(":");
    if (!hazards.has(key)) {
      let lo = 0, hi = 1;
      for (let i = 0; i < 48; i++) { const mid = (lo + hi) / 2; if (tail(days, stages, mid) < completion) lo = mid; else hi = mid; }
      hazards.set(key, completion <= 0 ? 0 : completion >= 1 ? 1 : (lo + hi) / 2);
    }
    return hazards.get(key);
  }
  // Stateless draws keep paired comparisons independent of extra branch draws.
  function random(seed) {
    return (turn, key) => {
      let x = seed ^ Math.imul(turn, 0x9e3779b9);
      for (let i = 0; i < key.length; i++) x = Math.imul(x ^ key.charCodeAt(i), 16777619);
      x ^= x >>> 16; x = Math.imul(x, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16;
      return (x >>> 0) / 4294967296;
    };
  }
  function profile(card, lb) {
    const source = data.cards[card.id] || {};
    const chain = (source.chain || []).map((id) => Object.assign({ id }, data.events[id]));
    const other = [...new Set(source.other || [])].filter((id) => !chain.some((e) => e.id === id)).map((id) => Object.assign({ id }, data.events[id]));
    const all = chain.concat(other);
    const missing = all.filter((e) => !Array.isArray(e.c) || !e.c.length).map((e) => e.id);
    const special = ["friend", "group"].includes(card.ty);
    const effects = D.baseEffects(card, D.levelFor(card, lb));
    const mode = special || !all.length || missing.length ? "aggregate" : "coupled";
    const parsed = new Set(), notes = new Set();
    function scan(c) {
      (c.h || []).forEach(([id]) => parsed.add(String(id)));
      if (c.x && !S.ended(c)) notes.add(c.x);
      if (c.g) notes.add("Free skill grants are not modeled");
      if (c.cure) notes.add("Condition cures are not modeled");
      if (c.ok) scan(c.ok); if (c.ng) scan(c.ng); (c.when || []).forEach(scan);
    }
    all.forEach((e) => (e.c || []).forEach(scan));
    return { card, lb, effects, chain, other, missing, mode, notes: [...notes],
      fallback: (card.es || []).map(String).filter((id) => !parsed.has(id)) };
  }
  const atLB = (value, lb) => Array.isArray(value) ? Math.round(value[0] + (value[1] - value[0]) * lb / 4) : value || 0;
  function reward(parts, p) {
    const out = { s: [0, 0, 0, 0, 0], sp: 0, e: 0, b: 0, me: 0, mo: 0, h: {}, random: [], notes: [] };
    function amount(value, effect = 0) {
      const n = atLB(value, p.lb);
      // Ranges already describe LB-scaled source rewards. Scalar positive stat,
      // SP and recovery rewards are base amounts; penalties do not scale up.
      return !Array.isArray(value) && n > 0 ? Math.floor(n * (1 + effect / 100) + 1e-9) : n;
    }
    parts.forEach((part) => {
      (part.s || []).forEach((n, i) => { out.s[i] += amount(n, p.effects[26] || 0); });
      out.sp += amount(part.sp, p.effects[26] || 0); out.e += amount(part.e, p.effects[25] || 0);
      ["b", "me", "mo"].forEach((k) => { out[k] += atLB(part[k], p.lb); });
      (part.h || []).forEach(([id, lv]) => { out.h[id] = Math.min(5, (out.h[id] || 0) + lv); });
      if (part.r) out.random.push({ amount: amount(part.r, p.effects[26] || 0), count: Math.min(5, Math.max(1, atLB(part.rn, p.lb) || 1)) });
      if (part.x && !S.ended(part)) out.notes.push(part.x);
      if (part.g) out.notes.push("Free skill grants are not modeled");
      if (part.cure) out.notes.push("Condition cures are not modeled");
    });
    return out;
  }
  function outcomes(choice, history, p, success) {
    if (!rewardCases.has(p)) rewardCases.set(p, new WeakMap());
    const byChoice = rewardCases.get(p);
    if (!byChoice.has(choice)) byChoice.set(choice, new Map());
    const memo = byChoice.get(choice), key = success + ":" + (choice.when ? JSON.stringify(history) : "");
    if (memo.has(key)) return memo.get(key);
    const parts = S.records(choice, history), conditional = parts.some((r) => r.ok || r.ng);
    const result = (conditional ? [["success", "ok", success], ["failure", "ng", 1 - success]] : [["always", null, 1]]).map(([branch, key, probability]) => {
      const selected = parts.concat(key ? parts.map((r) => r[key]).filter(Boolean) : []);
      return { p: probability, branch, reward: reward(selected, p), end: selected.some(S.ended) };
    });
    memo.set(key, result); return result;
  }
  function create(p, opts = {}) {
    const days = opts.days || 78, completion = opts.completion == null ? S.PRIOR[p.card.r] || 0.5 : clamp(opts.completion);
    const success = opts.success == null ? 0.5 : clamp(opts.success), rand = opts.random || random(opts.seed || 1);
    const chainChance = hazard(days, Math.max(1, p.chain.length), completion), otherChance = hazard(days, 1, completion);
    const state = { stage: 0, ended: false, history: {}, seen: [], days: 0, lastTurn: null,
      lateAllowed: !opts.independent || rand(0, "late-chain") < 0.2 };
    function tick(turn, activeLevels, situation) {
      if (p.mode !== "coupled" || state.lastTurn === turn || state.days >= days) return [];
      state.lastTurn = turn; state.days++;
      const chance = 1 - Math.pow(1 - chainChance, 1 + (opts.songBoost || 0) * activeLevels);
      const remaining = Math.max(0, days - state.days);
      function choose(events, start, history, chain) {
        function visit(index, levels, past, depth) {
          if (index >= events.length) return { value: 0 };
          const reach = !depth ? 1 : tail(remaining, depth, chance) / Math.max(1e-15, tail(remaining, depth - 1, chance));
          const independent = chain && opts.independent && index === 2 && state.stage < 2 ? 0.2 : 1;
          const event = events[index]; let best = { value: -Infinity, choice: 0 };
          event.c.forEach((choice, i) => {
            const nextPast = Object.assign({}, past, { [index + 1]: i + 1 });
            const cases = outcomes(choice, past, p, success);
            const value = cases.reduce((n, c) => {
              const next = mergeHints(levels, c.reward.h);
              const skill = situation.skillValue(next) - situation.skillValue(levels);
              const future = c.end ? 0 : visit(index + 1, next, nextPast, depth + 1).value;
              return n + c.p * (situation.rewardValue(c.reward, depth) + skill + future);
            }, 0) * reach * independent;
            if (value > best.value + 1e-9) best = { value, choice: i, cases };
          });
          return best;
        }
        return visit(start, situation.levels || {}, history, 0);
      }
      const result = [];
      function fire(events, index, kind) {
        const event = events[index], picked = choose(events, index, state.history, kind === "chain");
        const r = rand(turn, event.id + ":branch"); let cumulative = 0;
        const outcome = picked.cases.find((c) => (cumulative += c.p) > r) || picked.cases[picked.cases.length - 1];
        const actual = Object.assign({}, outcome.reward, { s: outcome.reward.s.slice() });
        actual.random.forEach((g, gi) => {
          const stats = [0, 1, 2, 3, 4];
          for (let n = 0; n < g.count; n++) { const at = Math.floor(rand(turn, event.id + ":stat:" + gi + ":" + n) * stats.length); actual.s[stats.splice(at, 1)[0]] += g.amount; }
        });
        const record = { turn, card: p.card.id, event: event.id, kind, stage: kind === "chain" ? index + 1 : null, choice: picked.choice + 1, branch: outcome.branch, reward: actual, end: outcome.end };
        // Apply immediately so later events on this turn see the actual resources.
        situation.apply(record); result.push(record);
        if (kind === "chain") { state.history[index + 1] = picked.choice + 1; state.stage++; state.ended = outcome.end; }
      }
      if (!state.ended && state.stage < p.chain.length && (state.stage < 2 || state.lateAllowed) && rand(turn, "chain") < chance) fire(p.chain, state.stage, "chain");
      p.other.forEach((event, i) => {
        if (!state.seen.includes(event.id) && rand(turn, "ordinary:" + event.id) < otherChance) { state.seen.push(event.id); fire([event], 0, "ordinary"); }
      });
      return result;
    }
    return { state, tick, profile: p, chainChance, otherChance };
  }
  const api = { profile, reward, outcomes, create, tail, hazard, random, mergeHints };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.UmaSupportEvents = api;
})(typeof window !== "undefined" ? window : globalThis);
