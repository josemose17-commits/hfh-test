// Factual support skill coverage for parent results. Deliberately separate from
// target scoring and its event-choice/availability estimates.
(function (root) {
  function build(cards, opts = {}) {
    const info = opts.skills || {}, purchase = opts.purchases || {};
    const events = opts.events || {cards: {}, events: {}};
    const byId = new Map(), unavailableCards = [];
    const must = new Set((opts.must || []).map(String));
    const whites = new Map();
    Object.entries(purchase).forEach(([id, m]) => {
      if (m[3] !== 1) return;
      if (!whites.has(m[0])) whites.set(m[0], []);
      whites.get(m[0]).push(id);
    });
    function add(id, card, route) {
      id = String(id);
      if (!byId.has(id)) {
        const m = info[id];
        byId.set(id, {id, rarity: m ? m[2] : null, release: m ? !!m[3] : null,
          spark: !!(m && m[2] === 1 && !id.startsWith('9')), target: (opts.targets || {})[id] > 0,
          must: must.has(id), sources: []});
      }
      const skill = byId.get(id);
      let source = skill.sources.find(s => s.card === card.id);
      if (!source) skill.sources.push(source = {card: card.id, routes: []});
      if (!source.routes.some(r => JSON.stringify(r) === JSON.stringify(route))) source.routes.push(route);
    }
    function offer(id, card, route) {
      id = String(id); add(id, card, route);
      // Same unlock rules as skill-budget: prerequisites, plus ordinary white
      // upgrades in that family. Never infer a gold unlock from a white hint.
      const seen = new Set([id]);
      let m = purchase[id];
      while (m && m[2] != null && !seen.has(String(m[2]))) {
        const before = String(m[2]); seen.add(before);
        add(before, card, Object.assign({}, route, {via: id})); m = purchase[before];
      }
      if (purchase[id]) (whites.get(purchase[id][0]) || []).forEach(other => {
        if (other !== id) add(other, card, Object.assign({}, route, {via: id}));
      });
    }
    cards.forEach(card => {
      if (opts.globalOnly && !(card.en && card.en <= opts.today)) { unavailableCards.push(card.id); return; }
      (card.hs || []).forEach(id => offer(id, card, {kind: 'hint'}));
      const ce = (events.cards || {})[card.id] || {};
      const parsed = new Set();
      [...new Set([...(ce.chain || []), ...(ce.other || [])])].forEach(eid => {
        const visit = (part, choice, conditional) => {
          if (!part) return;
          [...(part.h || []).map(h => h[0]), ...(part.g || [])].forEach(id => {
            parsed.add(String(id));
            offer(id, card, {kind: 'event', event: eid, choice, conditional, note: part.x || null, grant: (part.g || []).map(String).includes(String(id))});
          });
          visit(part.ok, choice, true); visit(part.ng, choice, true);
          (part.when || []).forEach(x => visit(x, choice, true));
        };
        ((events.events[eid] || {}).c || []).forEach((ch, i) => visit(ch, i + 1, false));
      });
      (card.es || []).forEach(id => {
        if (!parsed.has(String(id))) offer(id, card, {kind: 'event', unresolved: true});
      });
    });
    const all = [...byId.values()].sort((a, b) => +b.target - +a.target || a.id.localeCompare(b.id));
    const skills = all.filter(s => !opts.globalOnly || s.release === true);
    return {skills, restricted: all.filter(s => !skills.includes(s)), unavailableCards,
      missingMust: [...must].filter(id => !skills.some(s => s.id === id))};
  }
  const api = {build};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.UmaParentSkills = api;
})(typeof window !== 'undefined' ? window : globalThis);
