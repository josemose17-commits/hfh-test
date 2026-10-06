// Deck optimizer: simulates careers with a deck and searches for the best 6 cards you own.
//
// Each simulated career walks the scenario's turns. Every turn, each card shows up on one of the
// five trainings (or none), weighted by its specialty priority, and the trainee takes the
// training worth most for the build. Gains use the same card formula as the turn coach
// (deck.js), so friendship trainings, training effectiveness, mood effect, stat bonuses and
// conditional unique effects all count. Skill hints are tracked per card, and every skill a
// deck can hint is valued by its length gain (median L from alpha123's Umalator) on the chosen
// Champions Meeting course, minus what it costs in skill points.
(function (root) {
  const D = root.UmaDeck || (typeof require !== "undefined" ? require("./deck.js") : null);
  const E = root.UmaEngine || (typeof require !== "undefined" ? require("./engine.js") : null);
  const STATS = ["speed", "stamina", "power", "guts", "wit"];
  const SP_VALUE = 0.35;
  // Value points per length (L) of race gain. Roughly what 1 L of speed stat costs, and in line
  // with SP_VALUE: an average skill buys about 0.5 L per 100 SP.
  const L_VALUE = 60;
  // Cost discount from hint levels 1-5.
  const HINT_DISCOUNT = [0, 0.1, 0.2, 0.3, 0.35, 0.4];
  const HINT_CHANCE = 0.075; // chance per card per training it is on (before Hint Frequency)
  const EVENT_SKILL_CHANCE = { 3: 0.8, 2: 0.65, 1: 0.5 }; // chain events completed in a career
  const ABSENT_WEIGHT = 50; // weight of "not at any training" when cards are dealt
  const RACE_SHARE = 0.1; // share of turns spent on optional races
  const RACE_SHARE_BY_SCENARIO = { trackblazer: 0.35 }; // race-driven scenarios
  const RACE_REWARD = { stats: 8, sp: 40 }; // per race; scaled by the deck's Race Bonus
  const BOND_EVENTS = { 3: 25, 2: 20, 1: 15 }; // bond from a card's events over a career, approx.
  const EVENT_STATS = 120; // stats per stat from random events over a career, about the same for any deck

  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  function buildCtx(opts) {
    const sc = opts.scenario;
    const b = E.BUILDS[opts.build] || E.BUILDS.medium;
    const target = Object.assign({}, b.target, opts.target || {});
    const caps = {};
    STATS.forEach((s, i) => { caps[s] = (opts.caps && opts.caps[s]) || sc.caps[i]; });
    const forced = E.forcedTurns({ goals: [] }, sc);
    const last = sc.finale && sc.finale.forced && sc.finale.turns.length ? Math.min.apply(null, sc.finale.turns) - 1 : Math.min(72, sc.totalTurns);
    const turns = [];
    for (let t = 1; t <= Math.max(last, 1); t++) if (!forced.has(t)) turns.push(t);
    const camp = new Set(E.campTurns(sc));
    const boost = E.scenarioBoost({ fcal: [] }, sc);
    const t = opts.trainee ? D.trainee(opts.trainee) : null;
    return {
      sc, w: b.w, target, caps, turns, camp, boost,
      growth: t ? t.g : [0, 0, 0, 0, 0],
      start: t && t.b ? t.b.slice(0, 5) : [100, 100, 100, 100, 100],
      skills: opts.skills || {}, // skill id -> median L on the chosen course and style
      costs: opts.costs || {}, // skill id -> skill point cost, for skills deck.js doesn't know
      raceShare: RACE_SHARE_BY_SCENARIO[sc.id] || RACE_SHARE,
      skillWeight: opts.skillWeight != null ? opts.skillWeight : 1,
      known: new Set((t ? [].concat(t.us || [], t.is || [], t.as || []) : []).map(String)),
      runs: opts.runs || 10,
      seed: opts.seed || 12345,
    };
  }

  // Marginal value of one point of a stat at x: the turn coach's pointValue, plus a "need"
  // factor so a stat far below its target (stamina for a long race, say) counts for more.
  const NEED = 1.5;
  function pointValue(ctx, s, x) {
    if (x >= ctx.caps[s]) return 0;
    let k = ctx.w[s];
    if (x >= 1200) k *= 0.5;
    if (x >= ctx.target[s]) k *= 0.4;
    else k *= 1 + NEED * (1 - x / ctx.target[s]);
    return k;
  }

  // Total value of a stat line: pointValue integrated from 0 (in steps of 10 points).
  function statsValue(ctx, x) {
    let v = 0;
    STATS.forEach((s, i) => { for (let at = 0; at < x[i]; at += 10) v += Math.min(10, x[i] - at) * pointValue(ctx, s, at + 5); });
    return v;
  }

  // Effects of a card in a situation, memoised: the same few situations repeat every turn.
  function makeEffects() {
    const memo = new Map();
    return (m, sit) => {
      const key = m.card.id + "|" + m.level + "|" + (m.bond >= 100 ? 2 : m.bond >= 80 ? 1 : 0) + "|" + sit.facStat + "|" + sit.members + "|" + sit.facilityLevel + "|" + (sit.rainbow ? 1 : 0);
      let e = memo.get(key);
      if (!e) {
        e = D.effectsIn(m.card, m.level, Object.assign({ bond: m.bond }, sit));
        memo.set(key, e);
      }
      return e;
    };
  }

  // Same formula as deck.js trainingGain, using memoised effects.
  function gain(ctx, fx, row, facStat, members, L, mood) {
    const n = members.length;
    let fm = 1, te = 0, me = 0, sp = 0, all = 0, failMult = 1, costMult = 1, witRec = 0;
    const bonus = [0, 0, 0, 0, 0];
    let anyRainbow = false;
    for (let k = 0; k < n; k++) if (D.isRainbow(members[k].card, members[k].bond, facStat)) { anyRainbow = true; break; }
    let rainbows = 0;
    for (let k = 0; k < n; k++) {
      const m = members[k];
      const eff = fx(m, { facStat, members: n, facilityLevel: L, energy: 60, maxEnergy: 100, deckTypes: ctx.deckTypes, totalBond: 300, rainbow: anyRainbow });
      if (D.isRainbow(m.card, m.bond, facStat)) { fm *= 1 + (eff[1] || 0) / 100; rainbows++; if (facStat === "wit") witRec += eff[31] || 0; }
      if (eff[27]) failMult *= 1 - eff[27] / 100;
      if (eff[28]) costMult *= 1 - eff[28] / 100;
      te += eff[8] || 0; me += eff[2] || 0; sp += eff[30] || 0; all += eff[41] || 0;
      for (let i = 0; i < 5; i++) bonus[i] += eff[3 + i] || 0;
    }
    const moodCoef = [-0.2, -0.1, 0, 0.1, 0.2][mood];
    const moodMult = 1 + (moodCoef > 0 ? moodCoef * (1 + me / 100) : moodCoef);
    const common = fm * moodMult * (1 + te / 100) * (1 + 0.05 * n);
    const mainIdx = STATS.indexOf(facStat);
    const out = [0, 0, 0, 0, 0];
    for (let i = 0; i < 5; i++) {
      const b = row[i];
      if (!(b > 0)) continue;
      const lvAdd = i === mainIdx ? L - 1 : Math.floor((L - 1) / 2);
      // The game caps one training's gain per stat at 100; scenario bonuses come on top.
      out[i] = Math.min(100, Math.floor((b + lvAdd + bonus[i] + all) * common * (1 + (ctx.growth[i] || 0) / 100))) * ctx.boost;
    }
    const energy = row[6] < 0 ? (row[6] - 1.5 * (L - 1)) * costMult : row[6] + witRec;
    return { g: out, sp: (row[5] + sp) * common * ctx.boost, rainbows, energy, failMult };
  }

  // Simulates `runs` careers with these cards. cards: [{ card, lb }].
  function simulate(ctx, cards) {
    const fx = makeEffects();
    const deck = cards.map((c) => {
      const level = D.levelFor(c.card, c.lb);
      const base = D.baseEffects(c.card, level);
      const spec = c.card.ty === "friend" || c.card.ty === "group" ? 0 : (base[19] || 0);
      return { card: c.card, level, base, spec, init: D.initialBond(c.card, level), hintRate: HINT_CHANCE * (1 + (base[18] || 0) / 100), hintLv: 1 + (base[17] || 0) };
    });
    ctx.deckTypes = new Set(deck.map((d) => d.card.ty)).size;
    const raceBonus = deck.reduce((a, d) => a + (d.base[15] || 0), 0);
    const R = ctx.runs;
    let total = 0, spTotal = 0, rainbowTotal = 0;
    const statSum = [0, 0, 0, 0, 0];
    const hints = deck.map(() => 0);
    const bondAt = deck.map(() => 0);
    const train = [0, 0, 0, 0, 0];
    let rests = 0, races = 0, fails = 0;
    for (let run = 0; run < R; run++) {
      const rand = rng(ctx.seed + run * 7919);
      const x = ctx.start.slice();
      let sp = 120;
      let energy = 100;
      let typ = 0;
      const bond = deck.map((d) => d.init);
      const count = [0, 0, 0, 0, 0];
      const eventBond = deck.map((d) => BOND_EVENTS[d.card.r] / Math.max(1, ctx.turns.length * 0.6));
      for (let ti = 0; ti < ctx.turns.length; ti++) {
        const turn = ctx.turns[ti];
        deck.forEach((d, k) => { bond[k] = Math.min(100, bond[k] + eventBond[k]); });
        for (let i = 0; i < 5; i++) x[i] += EVENT_STATS / ctx.turns.length;
        // Optional races: stats and SP, raised by the deck's race bonus, for some energy.
        if (turn > 12 && rand() < ctx.raceShare) {
          for (let i = 0; i < 5; i++) x[i] = Math.min(ctx.caps[STATS[i]], x[i] + RACE_REWARD.stats / 5 * (1 + raceBonus / 100));
          sp += RACE_REWARD.sp * (1 + raceBonus / 100);
          energy = Math.max(0, energy - 15);
          races++;
          continue;
        }
        // Deal the cards onto trainings.
        const at = [[], [], [], [], []];
        deck.forEach((d, k) => {
          const own = STATS.indexOf(d.card.ty);
          const wOwn = own >= 0 ? 100 + d.spec : 100;
          const sum = wOwn + 400 + ABSENT_WEIGHT;
          let r = rand() * sum;
          for (let f = 0; f < 5; f++) {
            r -= f === own ? wOwn : 100;
            if (r < 0) { at[f].push(k); return; }
          }
        });
        const camp = ctx.camp.has(turn);
        // Energy is worth what it saves: a rest turn (no training) buys about 52 of it.
        const lambda = (typ || 20) / 52;
        let best = -1, bestV = lambda * (Math.min(100, energy + 52) - energy), bestG = null, bestFail = 0;
        let bestRaw = 0;
        for (let f = 0; f < 5; f++) {
          const L = camp ? 5 : Math.min(5, 1 + Math.floor(count[f] / 4));
          const members = at[f].map((k) => ({ card: deck[k].card, level: deck[k].level, bond: bond[k] }));
          const g = gain(ctx, fx, ctx.sc.train[STATS[f]], STATS[f], members, L, 4);
          let v = g.sp * SP_VALUE;
          for (let i = 0; i < 5; i++) v += g.g[i] * pointValue(ctx, STATS[i], x[i]);
          const raw = v;
          // Early on, raising bonds pays off later.
          const early = Math.max(0, 1 - turn / 40);
          at[f].forEach((k) => { if (bond[k] < 80 && deck[k].card.ty !== "friend") v += early * 6; });
          const fail = E.estimateFail(STATS[f], energy) * g.failMult / 100;
          v = v * (1 - fail) - fail * raw * 0.5 + lambda * (Math.max(0, Math.min(100, energy + g.energy)) - energy);
          if (v > bestV) { bestV = v; best = f; bestG = g; bestFail = fail; bestRaw = raw; }
        }
        if (best < 0) { energy = Math.min(100, energy + 52); rests++; continue; }
        typ = typ ? typ * 0.9 + bestRaw * 0.1 : bestRaw;
        energy = Math.max(0, Math.min(100, energy + bestG.energy));
        count[best]++;
        train[best]++;
        if (rand() < bestFail) { fails++; continue; }
        for (let i = 0; i < 5; i++) x[i] = Math.min(ctx.caps[STATS[i]], x[i] + bestG.g[i]);
        sp += bestG.sp;
        rainbowTotal += bestG.rainbows;
        at[best].forEach((k) => {
          bond[k] = Math.min(100, bond[k] + D.BOND_PER_TRAINING);
          if (rand() < deck[k].hintRate) { hints[k]++; bond[k] = Math.min(100, bond[k] + D.BOND_PER_HINT); }
        });
        if (ti === Math.floor(ctx.turns.length / 3)) deck.forEach((d, k) => { bondAt[k] += bond[k]; });
      }
      total += statsValue(ctx, x) + sp * SP_VALUE;
      spTotal += sp;
      for (let i = 0; i < 5; i++) statSum[i] += x[i];
    }
    const skill = skillValue(ctx, deck, hints.map((h) => h / R));
    return {
      value: total / R + skill.value * ctx.skillWeight,
      trainValue: total / R,
      skillValue: skill.value,
      stats: statSum.map((s) => Math.round(s / R)),
      sp: Math.round(spTotal / R),
      rainbows: rainbowTotal / R,
      raceBonus,
      hints: hints.map((h) => h / R),
      bondByJuniorEnd: bondAt.map((b) => Math.round(b / R)),
      trainMix: train.map((n) => n / R),
      rests: rests / R,
      races: races / R,
      fails: fails / R,
      skills: skill.list,
    };
  }

  // Skills a deck can hint, each valued by its race gain minus its skill point cost.
  function skillValue(ctx, deck, hintEvents) {
    const p = new Map(); // skill id -> [probability not hinted, best hint level, sources]
    const add = (id, prob, lv, src) => {
      const k = String(id);
      const cur = p.get(k) || [1, 0, []];
      cur[0] *= 1 - prob;
      cur[1] = Math.max(cur[1], lv);
      cur[2].push(src);
      p.set(k, cur);
    };
    deck.forEach((d, k) => {
      const hs = d.card.hs || [];
      hs.forEach((id) => add(id, 1 - Math.exp(-hintEvents[k] / Math.max(1, hs.length)), d.hintLv, d.card.id));
      (d.card.es || []).forEach((id) => add(id, EVENT_SKILL_CHANCE[d.card.r] || 0.5, 1, d.card.id));
    });
    const list = [];
    p.forEach(([miss, lv, src], id) => {
      const L = ctx.skills[id];
      if (L == null || ctx.known.has(id)) return;
      const cost = ctx.costs[id] || D.skillCost(id) || 150;
      const surplus = L * L_VALUE - cost * (1 - HINT_DISCOUNT[Math.min(5, lv)]) * SP_VALUE;
      list.push({ id, p: 1 - miss, L, cost, lv: Math.min(5, lv), surplus, src });
    });
    list.sort((a, b) => b.surplus * b.p - a.surplus * a.p);
    // A career only has the skill points for so many skills: the best few count in full.
    let value = 0;
    list.forEach((s, i) => { if (s.surplus > 0) value += s.p * s.surplus * (i < 8 ? 1 : 0.4); });
    return { value, list };
  }

  // Characters can only appear once in a deck, and never the trainee's own character.
  function compatible(cards, c, traineeChar) {
    if (traineeChar && c.card.cid === traineeChar) return false;
    return !cards.some((x) => x.card.id === c.card.id || (x.card.cid && x.card.cid === c.card.cid));
  }

  // Finds the best decks. pool: [{ card, lb, borrowed? }]. opts.locked: card ids that must stay.
  // onProgress(fraction) is called as the search goes.
  function optimize(opts, onProgress) {
    const ctx = buildCtx(opts);
    const tchar = opts.trainee ? (D.trainee(opts.trainee) || {}).cid : null;
    const pool = opts.pool.filter((c) => !(tchar && c.card.cid === tchar));
    const borrowPool = (opts.borrowPool || []).filter((c) => !(tchar && c.card.cid === tchar));
    const cache = new Map();
    const evals = { n: 0 };
    const key = (cards) => cards.map((c) => c.card.id + ":" + c.lb + (c.borrowed ? "b" : "")).sort().join(",");
    const score = (cards, runs) => {
      const k = key(cards) + "|" + (runs || ctx.runs);
      if (!cache.has(k)) { evals.n++; cache.set(k, simulate(Object.assign({}, ctx, { runs: runs || ctx.runs }), cards)); }
      return cache.get(k);
    };
    const quick = Math.max(4, Math.round(ctx.runs / 2));
    let deck = pool.filter((c) => (opts.locked || []).indexOf(c.card.id) !== -1).slice(0, 6);
    const borrowedSlot = opts.borrow && borrowPool.length ? 1 : 0;
    const ownedSlots = 6 - borrowedSlot;
    const progress = (f) => { if (onProgress) onProgress(Math.min(1, f)); };

    // 1. Greedy: add whichever card raises the deck most.
    const steps = Math.max(0, ownedSlots - deck.length);
    for (let s = 0; s < steps; s++) {
      let best = null, bestV = -Infinity;
      pool.forEach((c) => {
        if (!compatible(deck, c, tchar)) return;
        const v = score(deck.concat([c]), quick).value;
        if (v > bestV) { bestV = v; best = c; }
      });
      if (!best) break;
      deck.push(best);
      progress(0.1 + 0.4 * (s + 1) / Math.max(1, steps));
    }
    // 2. Swaps: try replacing each unlocked card with every other card until nothing improves.
    const locked = new Set(opts.locked || []);
    let cur = score(deck, quick).value;
    for (let pass = 0; pass < 3; pass++) {
      let improved = false;
      for (let i = 0; i < deck.length; i++) {
        if (locked.has(deck[i].card.id)) continue;
        const rest = deck.filter((_, j) => j !== i);
        pool.forEach((c) => {
          if (!compatible(rest, c, tchar)) return;
          const cand = rest.concat([c]);
          const v = score(cand, quick).value;
          if (v > cur + 1e-6) { deck = cand; cur = v; improved = true; }
        });
      }
      progress(0.5 + 0.15 * (pass + 1));
      if (!improved) break;
    }
    // 3. Borrowed card: the best friend's card for the last slot.
    if (borrowedSlot) {
      let best = null, bestV = -Infinity;
      borrowPool.forEach((c) => {
        if (!compatible(deck, c, tchar)) return;
        const v = score(deck.concat([Object.assign({}, c, { borrowed: true })]), quick).value;
        if (v > bestV) { bestV = v; best = c; }
      });
      if (best) deck.push(Object.assign({}, best, { borrowed: true }));
    }
    progress(0.9);
    // 4. Runner-up decks: the best single swaps away from the winner, rescored with full runs.
    const result = score(deck);
    const alts = [];
    deck.forEach((d, i) => {
      if (locked.has(d.card.id) || d.borrowed) return;
      const rest = deck.filter((_, j) => j !== i);
      let best = null, bestV = -Infinity;
      pool.forEach((c) => {
        if (c.card.id === d.card.id || !compatible(rest, c, tchar)) return;
        const v = score(rest.concat([c]), quick).value;
        if (v > bestV) { bestV = v; best = c; }
      });
      if (best) alts.push({ out: d, in: best, cards: rest.concat([best]) });
    });
    const runnersUp = alts.map((a) => Object.assign({ swap: { out: a.out, in: a.in }, cards: a.cards }, { r: score(a.cards) }))
      .sort((a, b) => b.r.value - a.r.value).slice(0, 3);
    // What each card adds: the deck's value without it (empty slot).
    const contrib = deck.map((d, i) => result.value - score(deck.filter((_, j) => j !== i)).value);
    progress(1);
    return { cards: deck, result, contrib, runnersUp, evals: evals.n };
  }

  // Cards you don't own (or own at a lower limit break) that would raise the deck most.
  // Each candidate is tried in place of the deck's weakest cards (swapSlots, by index).
  function wishlist(opts, deck, candidates, limit, swapSlots) {
    const ctx = buildCtx(opts);
    const tchar = opts.trainee ? (D.trainee(opts.trainee) || {}).cid : null;
    const quick = Math.max(4, Math.round(ctx.runs / 2));
    const sim = (cards) => simulate(Object.assign({}, ctx, { runs: quick }), cards).value;
    const base = sim(deck);
    const slots = swapSlots || deck.map((_, i) => i);
    const out = [];
    candidates.forEach((c) => {
      if (tchar && c.card.cid === tchar) return;
      let best = -Infinity, swapOut = null;
      slots.forEach((i) => {
        const d = deck[i];
        if (!d || d.borrowed) return;
        const rest = deck.filter((_, j) => j !== i);
        if (!compatible(rest, c, tchar)) return;
        const v = sim(rest.concat([c]));
        if (v > best) { best = v; swapOut = d; }
      });
      if (swapOut && best > base) out.push({ card: c.card, lb: c.lb, gain: best - base, share: (best - base) / base, replaces: swapOut.card });
    });
    return out.sort((a, b) => b.gain - a.gain).slice(0, limit || 8);
  }

  // Reads a pasted Umalator skill chart. Each row is a skill name, then Minimum, Maximum, Mean
  // and Median as "1.23 L" (a copied table may put the name on its own line). names: id -> name.
  function parseChart(text, names) {
    const norm = (x) => String(x).toLowerCase().replace(/\(inherited\)/g, "").replace(/[^a-z0-9○◎×☆!?\u3040-\u30ff\u4e00-\u9fff]+/g, "");
    const byName = new Map();
    Object.entries(names).forEach(([id, n]) => { const k = norm(n); if (!byName.has(k) || id[0] !== "9") byName.set(k, +id); });
    const values = {};
    let pending = "";
    let unknown = 0;
    const NUM = /(-?\d+(?:\.\d+)?)\s*L\b/g;
    String(text).split(/\r?\n/).forEach((line) => {
      const nums = Array.from(line.matchAll(NUM)).map((m) => +m[1]);
      if (nums.length >= 4) {
        const at = line.search(/-?\d+(?:\.\d+)?\s*L\b/);
        const name = (line.slice(0, at).trim() || pending).replace(/^[✕×x]\s+/, "");
        const id = byName.get(norm(name));
        if (id) values[id] = nums[3]; else unknown++;
        pending = "";
      } else if (/[A-Za-z\u3040-\u30ff\u4e00-\u9fff]/.test(line)) {
        pending = line.trim();
      }
    });
    return { values, unknown };
  }

  // One request from the page (or its worker): card ids in, card ids out.
  //   { job: "optimize" | "wishlist", opts, pool, borrowPool, deck, candidates, swapSlots }
  function runJob(data, onProgress) {
    const Scen = root.UmaScenarios || (typeof require !== "undefined" ? require("./scenarios.js") : null);
    const sc = Scen.SCENARIOS.find((x) => x.id === data.opts.scenario) || Scen.SCENARIOS[0];
    const resolve = (list) => (list || []).map((c) => ({ card: D.card(c.id), lb: c.lb, borrowed: !!c.borrowed })).filter((c) => c.card);
    const ids = (list) => list.map((c) => ({ id: c.card.id, lb: c.lb, borrowed: !!c.borrowed }));
    const o = Object.assign({}, data.opts, { scenario: sc, pool: resolve(data.pool), borrowPool: resolve(data.borrowPool) });
    if (data.job === "wishlist") {
      const list = wishlist(o, resolve(data.deck), resolve(data.candidates), 10, data.swapSlots);
      return { type: "wishlist", list: list.map((w) => ({ id: w.card.id, lb: w.lb, gain: w.gain, share: w.share, replaces: w.replaces.id })) };
    }
    const r = optimize(o, onProgress);
    return {
      type: "result",
      cards: ids(r.cards), result: r.result, contrib: r.contrib, evals: r.evals,
      runnersUp: r.runnersUp.map((x) => ({ out: x.swap.out.card.id, in: x.swap.in.card.id, inLb: x.swap.in.lb, value: x.r.value, cards: ids(x.cards) })),
    };
  }

  const api = { optimize, simulate, wishlist, runJob, parseChart, buildCtx, statsValue, L_VALUE, SP_VALUE, HINT_DISCOUNT };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.UmaOptimizer = api;
})(typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : globalThis);
