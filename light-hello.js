// Light Hello's event values before Event Recovery / Event Effectiveness.
// Shared by the coach, outing descriptions and career simulation. See
// docs/grand-concert-light-hello.md for verification and uncertain probabilities.
(function (root) {
  const D = root.UmaDeck || (typeof require !== "undefined" ? require("./deck.js") : null);
  const IDS = [30052, 10083];
  const isHello = (card) => !!card && IDS.includes(+card.id);
  const hasMet = (slot) => !!(slot && (slot.met || (slot.dates && (slot.dates.unlocked || slot.dates.done))));
  const floor = (n) => Math.floor(n + 1e-9);

  function scale(event, effects) {
    const out = Object.assign({}, event);
    if (event.opts) out.opts = event.opts.map((o) => scale(o, effects));
    if (event.e > 0) out.e = floor(event.e * (1 + (effects[25] || 0) / 100));
    if (event.s) out.s = event.s.map((n) => n > 0 ? floor(n * (1 + (effects[26] || 0) / 100)) : n);
    if (event.sp > 0) out.sp = floor(event.sp * (1 + (effects[26] || 0) / 100));
    return out;
  }

  function profile(card, lb) {
    if (!isHello(card)) return null;
    const level = D.levelFor(card, lb);
    const effects = D.baseEffects(card, level);
    const scaled = (o) => scale(o, effects);
    const skill = card.r === 3 ? 201662 : 201661;
    const rawDates = [
      { opts: [{ e: 25, me: 4, mo: 1, b: 5 }] },
      { opts: [{ e: 25, mo: 1, s: [0, 0, 0, 10, 0], b: 5 }] },
      { opts: [{ e: 50, mo: 1, b: 5 }, { mo: 1, s: [15, 0, 0, 15, 0], b: 5 }] },
      { opts: [{ e: 30, mo: 1, s: [0, 0, 0, 10, 0], b: 5 }] },
      // Both outcomes grant the skill. The hint level and other rewards differ.
      // p is an explicit modelling assumption, not an established game probability.
      { roll: true, p: 0.5, opts: [
        { e: 30, mo: 1, s: [10, 0, 0, 10, 0], b: 5, h: [[skill, 3]] },
        { e: 20, mo: 1, s: [5, 0, 0, 5, 0], b: 5, h: [[skill, 1]] }
      ] }
    ];
    return {
      card, lb, level, effects, skill, rawDates, dates: rawDates.map(scaled),
      rawUnlock: { e: 15, mo: 1, s: [7, 0, 0, 7, 0], b: 5 },
      first: scaled({ mo: 1, s: [10, 0, 0, 10, 0], b: 10 }),
      unlock: scaled({ e: 15, mo: 1, s: [7, 0, 0, 7, 0], b: 5 }),
      repeat: scaled({ s: [0, 0, 0, 3, 0], sp: 3, b: 7 }),
      random: [scaled({ s: [7, 0, 0, 7, 0], b: 5 }), scaled({ e: 5, mo: 1, b: 5 })],
      newYear: (linked) => [scaled({ mo: linked ? 2 : 1, s: [linked ? 10 : 5, 0, 0, 0, 0], b: 5, h: [[201522, 1], [201532, 1]] }), scaled({ e: linked ? 15 : 10, s: [0, 0, 0, linked ? 10 : 5, 0], b: 5 })],
      ending: (complete) => scaled({ s: [complete ? 20 : 15, 0, 0, complete ? 20 : 15, 0], sp: complete ? 30 : 20 }),
      // Published estimates differ. No R-event mixture is established: use its
      // conservative +10 floor; actual +10/+20 results are always recorded as seen.
      tokenAmount: card.r === 3 ? 20 : 10,
      procRate: 0.4,
      procRange: [0.36, 0.45],
      estimated: true
    };
  }

  const api = { IDS, isHello, hasMet, profile, scale };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.UmaLightHello = api;
})(typeof window !== "undefined" ? window : globalThis);
