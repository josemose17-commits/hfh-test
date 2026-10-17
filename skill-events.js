// Event-skill opportunities from the repository's observed event records.
// Arrival, success and unknown-result probabilities are model assumptions.
(function (root) {
  const D = root.UmaDeck || (typeof require !== "undefined" ? require("./deck.js") : null);
  const data = root.UmaCardEvents || (typeof require !== "undefined" ? require("./data/card-events.js") : null);
  const PRIOR = { 3: 0.8, 2: 0.65, 1: 0.5 };
  const DISCOUNT = [0, 0.1, 0.2, 0.3, 0.35, 0.4];
  const cache = new Map(), arrivals = new Map();
  const clamp = (n) => Math.max(0, Math.min(1, n));
  function tail(stage, lambda) {
    let term = Math.exp(-lambda), below = term;
    for (let k = 1; k < stage; k++) { term *= lambda / k; below += term; }
    return clamp(1 - below);
  }
  // A Poisson arrival model, calibrated to the old final-chain completion prior.
  // Earlier steps are nested within later steps, not independent chances.
  function reach(length, completion, multiplier = 1) {
    const key = length + ":" + completion;
    if (!arrivals.has(key)) {
      let low = 0, high = 100;
      for (let i = 0; i < 45; i++) { const mid = (low + high) / 2; if (tail(length, mid) < completion) low = mid; else high = mid; }
      arrivals.set(key, (low + high) / 2);
    }
    return Array.from({ length: length + 1 }, (_, i) => i ? tail(i, arrivals.get(key) * multiplier) : 1);
  }
  function hints(x, allowed) {
    const out = {};
    (x.h || []).forEach(([id, level]) => { if (allowed.has(String(id))) out[id] = Math.min(5, (out[id] || 0) + level); });
    return out;
  }
  const merge = (a, b) => Object.fromEntries([...new Set(Object.keys(a).concat(Object.keys(b)))].map((id) => [id, Math.min(5, (a[id] || 0) + (b[id] || 0))]));
  function branches(choice, allowed, success) {
    const base = hints(choice, allowed);
    if (choice.ok || choice.ng) return [{ p: success, levels: merge(base, hints(choice.ok || {}, allowed)), end: choice.end || (choice.ok || {}).end }, { p: 1 - success, levels: merge(base, hints(choice.ng || {}, allowed)), end: choice.end || (choice.ng || {}).end }];
    return [{ p: 1, levels: base, end: choice.end }];
  }
  function model(card, ctx = {}, options = {}) {
    const allowed = new Set((card.es || []).map(String));
    const completion = options.completion != null ? clamp(options.completion) : PRIOR[card.r] || 0.5;
    const success = options.success != null ? clamp(options.success) : 0.5;
    const multiplier = Math.max(0, options.multiplier == null ? 1 : options.multiplier);
    const ce = (data.cards || {})[card.id] || {};
    const known = ctx.known || new Set(), must = new Set((ctx.must || []).map(String));
    const utility = (levels) => Object.entries(levels).reduce((n, [id, lv]) => {
      if (known.has(id)) return n;
      const value = Math.max(0, (ctx.skills || {})[id] || 0);
      return n + (must.has(id) ? 10000 : 0) + (value ? Math.max(0, value * 60 - (ctx.costs && ctx.costs[id] || D.skillCost(id) || 150) * (1 - DISCOUNT[lv]) * 0.35) : 0);
    }, 0);
    const fingerprint = [...allowed].map((id) => [id, (ctx.skills || {})[id] || 0, (ctx.costs || {})[id] || D.skillCost(id) || 150, known.has(id), must.has(id)]);
    const key = JSON.stringify([card.id, completion, success, multiplier, !!options.independent, fingerprint]);
    if (cache.has(key)) return cache.get(key);
    const parsed = new Set(), routes = [], groups = [];
    const special = card.ty === "friend" || card.ty === "group";
    const chain = special ? [] : ce.chain || [];
    const other = special ? [] : [...new Set(ce.other || [])].filter((id) => !chain.includes(id));
    [...chain, ...other].forEach((eid) => {
      ((data.events[eid] || {}).c || []).forEach((ch, i) => [ch, ch.ok || {}, ch.ng || {}].forEach((out, b) => {
        Object.entries(hints(out, allowed)).forEach(([id, level]) => { parsed.add(id); routes.push({ id, event: eid, name: data.events[eid].n, stage: chain.indexOf(eid) + 1 || null, choice: i + 1, branch: ["always", "success", "failure"][b], level, note: out.x || ch.x || null }); });
      }));
    });
    function plan(ids, probabilities) {
      function visit(index, levels) {
        if (index >= ids.length) return [{ p: 1, levels }];
        const q = probabilities[index + 1] / Math.max(1e-15, probabilities[index]);
        const choices = (data.events[ids[index]] || {}).c || [{}];
        let best = null, bestValue = -Infinity;
        choices.forEach((ch) => {
          const outcomes = branches(ch, allowed, success).flatMap((b) => {
            const next = merge(levels, b.levels);
            return (b.end ? [{ p: 1, levels: next }] : visit(index + 1, next)).map((x) => ({ p: b.p * x.p, levels: x.levels }));
          });
          const value = outcomes.reduce((n, x) => n + x.p * utility(x.levels), 0);
          if (value > bestValue + 1e-9) { bestValue = value; best = outcomes; }
        });
        return [{ p: Math.max(0, 1 - q), levels }, ...(best || []).map((x) => ({ p: q * x.p, levels: x.levels }))];
      }
      return visit(0, {});
    }
    if (chain.length) {
      const probabilities = reach(chain.length, completion, multiplier);
      // Preserve the existing Independent Training late-chain penalty, without
      // changing the unverified per-step arrival model into a game fact.
      if (options.independent && chain.length >= 3) for (let n = 3; n < probabilities.length; n++) probabilities[n] *= 0.2;
      groups.push({ kind: "chain", outcomes: plan(chain, probabilities) });
    }
    other.forEach((id) => groups.push({ kind: "ordinary", outcomes: plan([id], [1, completion]) }));
    const fallback = [...allowed].filter((id) => !parsed.has(id));
    const result = { groups, routes, fallback, completion, success, multiplier, special };
    if (cache.size >= 2048) cache.clear();
    cache.set(key, result);
    return result;
  }
  function add(offers, card, ctx, options = {}) {
    const m = model(card, ctx, options);
    m.groups.forEach((g) => offers.exclusive(g.outcomes, card.id));
    m.fallback.filter((id) => !(card.n === "Light Hello" && +id === 200272)).forEach((id) => offers.add(id, m.completion, 1, card.id));
    return m;
  }
  const api = { model, add, reach, PRIOR };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.UmaSkillEvents = api;
})(typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : globalThis);
