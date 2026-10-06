// Tier list and CM deck building on Euophrys' scoring (vendor/euophrys.js), plus skills.
//
// The base score is exactly what Euophrys' tier list gives a card: the extra weighted stats
// it adds to the deck you have so far, for the scenario's preset weights. On top of that
// comes a skill score: the skills the card can hint or give through events, each valued by
// its median length gain (L) on the chosen race minus its skill point cost, counting only
// what the deck doesn't already cover and what the trainee doesn't already have.
(function (root) {
  const D = root.UmaDeck || (typeof require !== "undefined" ? require("./deck.js") : null);
  const EU = root.Euophrys || (typeof require !== "undefined" ? require("./vendor/euophrys.js") : null);
  const cardsData = () => root.EuophrysCards || (typeof require !== "undefined" ? require("./data/euophrys-cards.js") : null);

  // Euophrys' Global scenario presets, and which one each coach scenario uses.
  const SCENARIOS = [["URA", "URA Finale"], ["Aoharu", "Unity Cup"], ["MANT", "Trackblazer"], ["GL", "Grand Concert"], ["GM", "Grand Masters"]];
  const FROM_COACH = { ura: "URA", unity: "Aoharu", trackblazer: "MANT", grandlive: "GL", grandmasters: "GM" };
  // Euophrys' weight tabs: card type -> tab key and type number in its data.
  const TABS = { speed: ["speed", 0], stamina: ["stamina", 1], power: ["power", 2], guts: ["guts", 3], wit: ["wisdom", 4], friend: ["friend", 6], group: ["friend", 6] };

  // Skill value in Euophrys' units. A hint makes a skill available and cheaper, so a skill is
  // worth its length gain (1 L counted like 60 Speed, at the Speed weight of the card's tab)
  // plus the skill points the hint discount saves (at the skill point weight).
  const SPEED_PER_L = 60;
  const HINT_DISCOUNT = [0, 0.1, 0.2, 0.3, 0.35, 0.4];
  const HINT_CHANCE = 0.075; // per turn trained with the card, before its hint frequency
  const TRAIN_SHARE = { type: 0.3, friend: 0.22 }; // share of training turns spent with the card
  const EVENT_SKILL_CHANCE = { 3: 0.8, 2: 0.65, 1: 0.5 };

  const byKey = new Map();
  function entry(id, lb) {
    const all = cardsData();
    if (!all) return null;
    if (!byKey.size) all.forEach((c) => byKey.set(c.id + ":" + c.limit_break, c));
    return byKey.get(id + ":" + lb) || null;
  }

  // Euophrys' weights for one card type in one scenario, with your overrides and the trainee's
  // growth bonuses (in place of Euophrys' flat +6%).
  function weightsFor(scen, ty, overrides, trainee) {
    const s = EU.getScenario("gl", scen);
    const [tab, type] = TABS[ty] || TABS.speed;
    const w = Object.assign({}, s.general, s[tab], { type });
    const o = overrides || {};
    Object.keys(o).forEach((k) => { if (o[k] != null) w[k] = Array.isArray(o[k]) ? o[k].slice() : o[k]; });
    const t = trainee ? D.trainee(trainee) : null;
    if (t) w.umaBonus = t.g.map((g) => 1 + g / 100).concat([1]);
    return w;
  }

  // Expected skill value of a set of cards: each skill once, by its chance to be offered.
  function skillValue(cards, ctx) {
    const p = new Map();
    const days = Math.max(1, 65 - (ctx.races || 0));
    cards.forEach((c) => {
      const card = D.card(c.id);
      const eu = entry(c.id, c.lb);
      const level = D.levelFor(card, c.lb);
      const fx = D.baseEffects(card, level);
      const share = card.ty === "friend" || card.ty === "group" ? TRAIN_SHARE.friend : TRAIN_SHARE.type;
      const hints = days * share * HINT_CHANCE * (eu ? eu.hint_rate : 1 + (fx[18] || 0) / 100);
      const lv = 1 + (fx[17] || 0);
      const hs = card.hs || [];
      const add = (id, prob, hlv) => {
        const k = String(id);
        const cur = p.get(k) || [1, 0, []];
        cur[0] *= 1 - prob;
        cur[1] = Math.max(cur[1], hlv);
        cur[2].push(card.id);
        p.set(k, cur);
      };
      hs.forEach((id) => add(id, 1 - Math.exp(-hints / Math.max(1, hs.length)), lv));
      (card.es || []).forEach((id) => add(id, EVENT_SKILL_CHANCE[card.r] || 0.5, 1));
    });
    const list = [];
    p.forEach(([miss, lv, src], id) => {
      const L = ctx.skills[id];
      if (L == null || ctx.known.has(id)) return;
      const cost = ctx.costs[id] || D.skillCost(id) || 150;
      const surplus = L * SPEED_PER_L * ctx.speedWeight + cost * HINT_DISCOUNT[Math.min(5, lv)] * ctx.spWeight;
      list.push({ id, p: 1 - miss, L, cost, surplus, src });
    });
    list.sort((a, b) => b.surplus * b.p - a.surplus * a.p);
    let value = 0;
    list.forEach((s, i) => { if (s.surplus > 0) value += s.p * s.surplus * (i < 8 ? 1 : 0.4); });
    return { value, list };
  }

  function makeCtx(opts) {
    const t = opts.trainee ? D.trainee(opts.trainee) : null;
    return {
      skills: opts.skills || {}, costs: opts.costs || {}, skillWeight: opts.skillWeight != null ? opts.skillWeight : 1,
      known: new Set((t ? [].concat(t.us || [], t.is || [], t.as || []) : []).map(String)),
      traineeChar: t ? t.cid : null,
    };
  }

  // Ranks candidates ([{id, lb}]) of one card type for the deck so far ([{id, lb}]).
  // Returns [{ id, lb, base, skill, score, skills }] best first.
  function rank(opts, ty, deck, candidates) {
    const ctx = makeCtx(opts);
    const ov = opts.overrides || {};
    const w = weightsFor(opts.scenario, ty, Object.assign({}, ov.general, ov.tabs && ov.tabs[TABS[ty][0]]), opts.trainee);
    ctx.spWeight = w.stats[5];
    ctx.speedWeight = w.stats[0];
    ctx.races = w.races.slice(0, 3).reduce((a, b) => a + b, 0);
    const selected = deck.map((c) => entry(c.id, c.lb)).filter(Boolean);
    const inDeck = new Set(deck.map((c) => D.card(c.id).cid));
    const cands = candidates.filter((c) => {
      const card = D.card(c.id);
      return card && !inDeck.has(card.cid) && card.cid !== ctx.traineeChar && entry(c.id, c.lb);
    });
    const base = EU.processCards(cands.map((c) => entry(c.id, c.lb)), w, selected);
    const baseBy = new Map(base.map((x) => [x.id + ":" + x.lb, x]));
    const before = skillValue(deck, ctx).value;
    return cands.map((c) => {
      const b = baseBy.get(c.id + ":" + c.lb);
      const sv = skillValue(deck.concat([c]), ctx);
      const skill = (sv.value - before) * ctx.skillWeight;
      return {
        id: c.id, lb: c.lb, base: b.score, skill, score: b.score + skill, info: b.info,
        skills: sv.list.filter((s) => s.src.indexOf(c.id) !== -1 && s.surplus > 0).slice(0, 3).map((s) => ({ id: s.id, L: s.L, p: s.p }))
      };
    }).sort((a, b) => b.score - a.score);
  }

  // Builds a deck the way Euophrys' list is used: pick the best card, then the best card given
  // that one, and so on, keeping to the deck makeup (comp: { type: count }), then retry each
  // slot with the others fixed until nothing improves. pool/borrowPool: [{id, lb}].
  function buildDeck(opts, pool, borrowPool) {
    const comp = opts.comp || {};
    const types = Object.keys(TABS);
    const locked = (opts.locked || []).map((id) => pool.find((c) => c.id === id)).filter(Boolean);
    const borrowSlot = opts.borrow && borrowPool && borrowPool.length ? 1 : 0;
    const count = (deck) => { const n = {}; deck.forEach((c) => { const t = D.card(c.id).ty; n[t] = (n[t] || 0) + 1; }); return n; };
    // Types that may fill the next slot without breaking the makeup.
    const openTypes = (deck) => {
      const n = count(deck);
      let need = 0;
      types.forEach((t) => { if (comp[t] != null) need += Math.max(0, comp[t] - (n[t] || 0)); });
      const left = 6 - deck.length;
      return types.filter((t) => {
        if (comp[t] != null) return (n[t] || 0) < comp[t];
        return left - 1 >= need; // a free type only while the fixed counts still fit
      });
    };
    const best = (deck, from) => {
      let top = null;
      openTypes(deck).forEach((t) => {
        const cands = from.filter((c) => D.card(c.id).ty === t);
        if (!cands.length) return;
        const r = rank(opts, t, deck, cands)[0];
        if (r && (!top || r.score > top.score)) top = r;
      });
      return top;
    };
    let deck = locked.slice();
    while (deck.length < 6 - borrowSlot) {
      const pick = best(deck, pool);
      if (!pick) break;
      deck.push({ id: pick.id, lb: pick.lb, score: pick.score, base: pick.base, skill: pick.skill });
    }
    if (deck.length < 6 - borrowSlot) {
      const fixed = types.filter((t) => comp[t] != null).map((t) => comp[t] + " " + t).join(", ");
      throw new Error("Not enough cards to fill the deck" + (fixed ? " with " + fixed : "") + ". Mark more owned cards or allow a borrowed card.");
    }
    if (borrowSlot) {
      const pick = best(deck, borrowPool);
      if (pick) deck.push({ id: pick.id, lb: pick.lb, borrowed: true, score: pick.score, base: pick.base, skill: pick.skill });
    }
    // Revisit each owned, unlocked slot with the other five fixed.
    const lockedIds = new Set(locked.map((c) => c.id));
    for (let pass = 0; pass < 3; pass++) {
      let changed = false;
      deck.forEach((c, i) => {
        if (lockedIds.has(c.id)) return;
        const rest = deck.filter((_, j) => j !== i);
        const pick = best(rest, c.borrowed ? borrowPool : pool);
        const cur = rank(opts, D.card(c.id).ty, rest, [c])[0];
        if (pick && cur && pick.score > cur.score + 1e-6 && (pick.id !== c.id || pick.lb !== c.lb)) {
          deck[i] = { id: pick.id, lb: pick.lb, borrowed: c.borrowed, score: pick.score, base: pick.base, skill: pick.skill };
          changed = true;
        }
      });
      if (!changed) break;
    }
    // Each card's value with the other five fixed, and the next-best card for its slot.
    const cards = deck.map((c, i) => {
      const rest = deck.filter((_, j) => j !== i);
      const own = rank(opts, D.card(c.id).ty, rest, [c])[0] || { score: 0, base: 0, skill: 0, skills: [] };
      const from = (c.borrowed ? borrowPool : pool).filter((x) => x.id !== c.id && D.card(x.id).ty === D.card(c.id).ty);
      const alt = from.length ? rank(opts, D.card(c.id).ty, rest, from)[0] : null;
      return { id: c.id, lb: c.lb, borrowed: !!c.borrowed, score: own.score, base: own.base, skill: own.skill, skills: own.skills, alt: alt ? { id: alt.id, lb: alt.lb, score: alt.score } : null };
    });
    const ctx = makeCtx(opts);
    ctx.spWeight = 1;
    ctx.speedWeight = 1;
    ctx.races = 0;
    return { cards, skills: skillValue(deck, ctx).list.filter((s) => s.surplus > 0 && s.p >= 0.15).slice(0, 10) };
  }

  const api = { SCENARIOS, FROM_COACH, TABS, weightsFor, rank, buildDeck, skillValue, entry };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.UmaTiers = api;
})(typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : globalThis);
