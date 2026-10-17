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
  const H = root.UmaLightHello || (typeof require !== "undefined" ? require("./light-hello.js") : null);
  const GC = root.UmaGrandConcert || (typeof require !== "undefined" ? require("./grand-concert.js") : null);
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
  const RACE_SHARE_BY_SCENARIO = { trackblazer: 0.35, grandlive: 0 }; // race-driven scenarios
  const RACE_REWARD = { stats: 8, sp: 40 }; // per race; scaled by the deck's Race Bonus
  const EVENT_STATS = 120; // stats per stat from random events over a career, about the same for any deck

  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  function grandConcertCalendar(opts) {
    const sc = opts.scenario;
    const state = { goals: [], deck: { trainee: opts.trainee || null, slots: [] } };
    const goals = E.traineeGoals(state, sc);
    const fixed = new Map(goals.filter(g => g.forced).map(g => [g.turn, g]));
    const finale = new Map([74, 76, 78].map((t,i) => [t, i]));
    const races = (D.DATA && D.DATA.races) || [];
    return Array.from({length: sc.totalTurns}, (_,i) => {
      const turn = i + 1;
      if (finale.has(turn)) return {turn, kind:"race", finale:true, statsEach:10, statCount:5, sp:[40,60,80][finale.get(turn)], energy:0};
      const g = fixed.get(turn);
      if (!g) return {turn, kind:"free"};
      const debut = turn === 12 || (g.races || []).some(n => /Debut/.test(n));
      const race = races.find(r => r.t === turn && (g.races || []).includes(r.n));
      const grade = race ? race.g : 100;
      return {turn, kind:"race", finale:false, statsEach:3, statCount:debut?3:grade===100?5:4,
        sp:debut?30:grade===100?45:35, energy:0};
    });
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
    const calendar = sc.id === "grandlive" ? grandConcertCalendar(opts) : null;
    if (calendar) { turns.length = 0; calendar.forEach(day => turns.push(day.turn)); }
    const camp = new Set(E.campTurns(sc));
    const boost = sc.id === "grandlive" ? 1 : E.scenarioBoost({ fcal: [] }, sc);
    const t = opts.trainee ? D.trainee(opts.trainee) : null;
    return {
      sc, w: b.w, target, caps, turns, camp, boost, calendar,
      growth: t ? t.g : [0, 0, 0, 0, 0],
      start: t && t.b ? t.b.slice(0, 5) : [100, 100, 100, 100, 100],
      skills: opts.skills || {}, // skill id -> median L on the chosen course and style
      costs: opts.costs || {}, // skill id -> skill point cost, for skills deck.js doesn't know
      raceShare: opts.raceShare != null ? opts.raceShare : (RACE_SHARE_BY_SCENARIO[sc.id] != null ? RACE_SHARE_BY_SCENARIO[sc.id] : RACE_SHARE),
      skillWeight: opts.skillWeight != null ? opts.skillWeight : 1,
      known: new Set((t ? [].concat(t.us || [], t.is || [], t.as || []) : []).map(String)),
      runs: opts.runs || 10,
      seed: opts.seed || 12345,
      helloProcRate: opts.helloProcRate != null ? Math.max(0, Math.min(1, +opts.helloProcRate)) : 0.4,
      helloUnlockRate: opts.helloUnlockRate != null ? Math.max(0, Math.min(1, +opts.helloUnlockRate)) : 0.15,
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

  // Training past 1200 gives half (July 2026 update).
  function trained(x, g) {
    if (!(g > 0)) return g;
    if (x >= 1200) return g / 2;
    return x + g <= 1200 ? g : (1200 - x) + (x + g - 1200) / 2;
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
    const dependencies = new Map();
    return (m, sit) => {
      const cardKey = m.card.id + "|" + m.level;
      if (!dependencies.has(cardKey)) dependencies.set(cardKey, D.conditionalUniques(m.card, m.level));
      const unique = dependencies.get(cardKey);
      const dynamic = unique.map((u) => {
        if (u.type === 101 || u.type === 102) return m.bond >= u.value ? 1 : 0;
        if (u.type === 107 || u.type === 114) return sit.energy;
        if (u.type === 108) return sit.maxEnergy;
        if (u.type === 109) return Math.floor(sit.totalBond / u.value_1);
        return "";
      }).join(":");
      const key = cardKey + "|" + dynamic + "|" + sit.facStat + "|" + sit.members + "|" + sit.facilityLevel + "|" + (sit.rainbow ? 1 : 0);
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
    let fm = 1, te = 0, me = 0, sp = 0, all = 0, failMult = 1, costDown = 0, witRec = 0;
    const bonus = [0, 0, 0, 0, 0];
    let anyRainbow = false;
    for (let k = 0; k < n; k++) if (D.isRainbow(members[k].card, members[k].bond, facStat)) { anyRainbow = true; break; }
    let rainbows = 0;
    for (let k = 0; k < n; k++) {
      const m = members[k];
      const eff = fx(m, { facStat, members: n, facilityLevel: L, energy: ctx.energy != null ? ctx.energy : 60, maxEnergy: ctx.maxEnergy || 100, deckTypes: ctx.deckTypes, totalBond: ctx.totalBond != null ? ctx.totalBond : 300, rainbow: anyRainbow });
      if (D.isRainbow(m.card, m.bond, facStat)) { fm *= 1 + (eff[1] || 0) / 100; rainbows++; if (facStat === "wit") witRec += eff[31] || 0; }
      if (eff[27]) failMult *= 1 - eff[27] / 100;
      costDown += eff[28] || 0;
      te += eff[8] || 0; me += eff[2] || 0; sp += eff[30] || 0; all += eff[41] || 0;
      for (let i = 0; i < 5; i++) bonus[i] += eff[3 + i] || 0;
    }
    const moodCoef = [-0.2, -0.1, 0, 0.1, 0.2][mood];
    const moodMult = 1 + (moodCoef > 0 ? moodCoef * (1 + me / 100) : moodCoef);
    if (rainbows && ctx.live) fm *= 1 + ctx.live.friendship / 100;
    const common = fm * moodMult * (1 + te / 100) * (1 + 0.05 * n);
    const mainIdx = STATS.indexOf(facStat);
    const out = [0, 0, 0, 0, 0];
    for (let i = 0; i < 5; i++) {
      const b = row[i];
      if (!(b > 0)) continue;
      const lvAdd = i === mainIdx ? L - 1 : Math.floor((L - 1) / 2);
      // The game caps one training's gain per stat at 100; scenario bonuses come on top.
      out[i] = Math.min(100, Math.floor((b + lvAdd + bonus[i] + all) * common * (1 + (ctx.growth[i] || 0) / 100))) * ctx.boost + (ctx.live && i === mainIdx ? ctx.live.extra[i] : 0);
    }
    const baseEnergy = row[6] - 1.5 * (L - 1);
    const energy = row[6] < 0 ? Math.floor(baseEnergy * Math.max(0, 1 - costDown / 100)) : row[6] + witRec;
    return { g: out, sp: Math.floor((row[5] + sp) * common) * ctx.boost + (ctx.live ? ctx.live.extraSp : 0), rainbows, energy, failMult };
  }

  // Simulates `runs` careers with these cards. cards: [{ card, lb }].
  function simulate(ctx, cards) {
    ctx = Object.assign({}, ctx);
    const inputCards = cards.slice();
    cards = cards.slice().sort((a,b) => Number(a.card.id) - Number(b.card.id) || Number(a.lb) - Number(b.lb));
    const fx = makeEffects();
    const deck = cards.map((c) => {
      const level = D.levelFor(c.card, c.lb);
      const base = D.baseEffects(c.card, level);
      const spec = c.card.ty === "friend" || c.card.ty === "group" ? 0 : (base[19] || 0);
      const hello = ctx.sc.id === "grandlive" ? H.profile(c.card, c.lb) : null;
      return { card: c.card, level, base, spec, hello, init: D.initialBond(c.card, level), ev: hello ? { stats: [0, 0, 0, 0, 0], sp: 0, energy: 0, bond: 0 } : D.eventRewards(c.card), hintRate: HINT_CHANCE * (1 + (base[18] || 0) / 100), hintLv: 1 + (base[17] || 0) };
    });
    ctx.deckTypes = new Set(deck.map((d) => d.card.ty)).size;
    // Cards' starting bonuses: Initial Speed..Wit (effects 9-13) and Initial Skill Points (32).
    const initial = [0, 0, 0, 0, 0];
    let initialSp = 0;
    deck.forEach((d) => { for (let i = 0; i < 5; i++) initial[i] += d.base[9 + i] || 0; initialSp += d.base[32] || 0; });
    const raceBonus = deck.reduce((a, d) => a + (d.base[15] || 0), 0);
    const R = ctx.runs;
    let total = 0, spTotal = 0, rainbowTotal = 0;
    const statSum = [0, 0, 0, 0, 0];
    const hints = deck.map(() => 0);
    const bondAt = deck.map(() => 0);
    const train = [0, 0, 0, 0, 0];
    let rests = 0, races = 0, fails = 0, requiredRaces = 0, outings = 0, recreations = 0;
    const liveTotals = { songs: 0, techniques: 0, greatConcerts: 0, lessonEnergy: 0, helloTokens: 0, helloEvents: 0, helloTrainings: 0, helloOutings: 0, helloEnergyRecovered: 0, helloEnergyWasted: 0, helloEnergySaved: 0, helloCompletions: 0, helloUnlocks: 0, lyrics: 0, special: 0 };
    const earnedTokens = [0, 0, 0, 0, 0], spentTokens = [0, 0, 0, 0, 0], finalTokens = [0, 0, 0, 0, 0];
    const helloSkillEvents = new Map();
    const scheduled = new Map((ctx.calendar || []).map(day => [day.turn, day]));
    for (let run = 0; run < R; run++) {
      const rand = rng(ctx.seed + run * 7919);
      const x = ctx.start.map((v, i) => Math.min(ctx.caps[STATS[i]], v + initial[i]));
      let sp = 120 + initialSp;
      let energy = 100;
      let maxEnergy = 100;
      let mood = ctx.sc.id === "grandlive" ? 2 : 4;
      let typ = 0;
      const bond = deck.map((d) => d.init);
      const count = [0, 0, 0, 0, 0];
      const eventRand = rng((ctx.seed + run * 7919) ^ 0x537f82);
      const live = ctx.sc.id === "grandlive" ? GC.create(ctx, rng((ctx.seed + run * 7919) ^ 0x68e31d)) : null;
      const hello = deck.map((d) => d.hello ? { p: d.hello, met: false, metTurn: 0, unlocked: false, done: 0, hints: {} } : null);
      ctx.live = live && live.state;
      const applyEvent = (event) => {
        if (event.me) maxEnergy += event.me;
        for (let i = 0; i < 5; i++) if ((event.s || [])[i]) x[i] = Math.min(ctx.caps[STATS[i]], x[i] + event.s[i]);
        sp += event.sp || 0;
        const before = energy;
        energy = Math.max(0, Math.min(maxEnergy, energy + (event.e || 0)));
        mood = Math.max(0, Math.min(4, mood + (event.mo || 0)));
        return energy - before;
      };
      const finishTurn = (turn) => {
        if (!live) return;
        hello.forEach((h, k) => {
          if (!h || !h.met || h.unlocked || h.metTurn >= turn || bond[k] < 60) return;
          if (eventRand() < ctx.helloUnlockRate) { h.unlocked = true; applyEvent(h.p.unlock); bond[k] = Math.min(100, bond[k] + h.p.unlock.b); liveTotals.helloUnlocks++; }
        });
        live.shop(turn, energy, maxEnergy, applyEvent);
        live.end(turn, applyEvent);
        if (turn === 24) deck.forEach((d, k) => { bondAt[k] += bond[k]; });
      };
      // Card events: bond arrives over the first ~60% of the career; stats, SP and energy
      // are spread over the whole run. Effect size up (effect 26) scales event stats.
      const eventBond = deck.map((d) => d.ev.bond / Math.max(1, ctx.turns.length * 0.6));
      const evStats = [0, 0, 0, 0, 0];
      let evSp = 0, evEnergy = 0;
      deck.forEach((d) => {
        const up = 1 + (d.base[26] || 0) / 100;
        for (let i = 0; i < 5; i++) evStats[i] += d.ev.stats[i] * up;
        evSp += d.ev.sp * up;
        evEnergy += d.ev.energy * (1 + (d.base[25] || 0) / 100);
      });
      for (let ti = 0; ti < ctx.turns.length; ti++) {
        const turn = ctx.turns[ti];
        deck.forEach((d, k) => { bond[k] = Math.min(100, bond[k] + eventBond[k]); });
        for (let i = 0; i < 5; i++) x[i] += (EVENT_STATS + evStats[i]) / ctx.turns.length;
        sp += evSp / ctx.turns.length;
        energy = Math.min(maxEnergy, energy + evEnergy / ctx.turns.length);
        if (live) {
          live.start(turn, applyEvent);
          if (turn === 25 || turn === 49) applyEvent({ e: E.NEW_YEAR[turn] ? E.NEW_YEAR[turn].e : 20 });
          if (turn === 25) hello.forEach((h, k) => {
            if (!h || !h.unlocked) return;
            const options = h.p.newYear(true);
            const chosen = energy < maxEnergy - 15 ? options[1] : options[0];
            applyEvent(chosen); bond[k] = Math.min(100, bond[k] + chosen.b);
            (chosen.h || []).forEach(([id, lv]) => { h.hints[id] = lv; });
          });
          live.shop(turn, energy, maxEnergy, applyEvent);
        }
        const day = scheduled.get(turn);
        if (day && day.kind === "race") {
          // Conditional on winning: random rewarded stats are represented by their expectation.
          const multiplier = 1 + raceBonus / 100;
          const perStat = Math.floor(day.statsEach * multiplier + 1e-9) * day.statCount / 5;
          for (let i = 0; i < 5; i++) x[i] = Math.min(ctx.caps[STATS[i]], x[i] + perStat);
          sp += Math.floor(day.sp * multiplier + 1e-9);
          energy = Math.max(0, energy - day.energy);
          requiredRaces++;
          finishTurn(turn);
          continue;
        }
        // Optional races: stats and SP, raised by the deck's race bonus, for some energy.
        if (turn > 12 && (!ctx.calendar || turn <= 72) && rand() < ctx.raceShare) {
          for (let i = 0; i < 5; i++) x[i] = Math.min(ctx.caps[STATS[i]], x[i] + RACE_REWARD.stats / 5 * (1 + raceBonus / 100));
          sp += RACE_REWARD.sp * (1 + raceBonus / 100);
          energy = Math.max(0, energy - 15);
          races++;
          finishTurn(turn);
          continue;
        }
        // Deal the cards onto trainings.
        const at = [[], [], [], [], []];
        deck.forEach((d, k) => {
          if (d.hello && turn < 5) return;
          const own = STATS.indexOf(d.card.ty);
          const wOwn = own >= 0 ? 100 + d.spec + (live ? live.state.specialty : 0) : 100;
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
        let best = -1, bestV = lambda * (Math.min(maxEnergy, energy + 52) - energy), bestG = null, bestFail = 0;
        let bestRaw = 0;
        let bestTokens = [], bestOuting = null, doRecreation = false, bestHelloSaving = 0;
        const moodValue = (delta) => live ? Math.min(4 - mood, delta) * 0.1 * (typ || 25) * Math.min(10, ctx.turns.length - ti) : 0;
        if (live && mood < 4) {
          const v = lambda * Math.min(10, maxEnergy - energy) + moodValue(1);
          if (v > bestV) { bestV = v; doRecreation = true; }
        }
        if (live && !camp) hello.forEach((h, k) => {
          if (!h || !h.unlocked || h.done >= 5) return;
          const d = h.p.dates[h.done];
          const value = (o) => Math.min(maxEnergy + (o.me || 0) - energy, o.e || 0) * lambda + moodValue(o.mo || 0) + (o.s || []).reduce((a, n, i) => a + n * pointValue(ctx, STATS[i], x[i]), 0) + (o.sp || 0) * SP_VALUE;
          const options = d.roll ? [{ o: d.opts[1], value: d.p * value(d.opts[0]) + (1 - d.p) * value(d.opts[1]) }] : d.opts.map((o) => ({ o, value: value(o) }));
          const pick = options.sort((a, b) => b.value - a.value)[0];
          // Finishing enables her fifth-outing skill; give earlier outings a
          // modest planning value as the number of remaining free turns shrinks.
          const L = ctx.skills[h.p.skill];
          const hintSurplus = L != null ? Math.max(0, L * L_VALUE - (ctx.costs[h.p.skill] || D.skillCost(h.p.skill) || 160) * 0.8 * SP_VALUE) : 0;
          const complete = h.p.ending(true), incomplete = h.p.ending(false);
          const endingValue = complete.s.reduce((a, n, i) => a + (n - incomplete.s[i]) * pointValue(ctx, STATS[i], x[i]), 0) + (complete.sp - incomplete.sp) * SP_VALUE;
          const completion = (hintSurplus + endingValue) / (5 - h.done) * Math.min(2, 1 + 10 / Math.max(1, 78 - turn)) + (h.done === 0 ? 3 : 0);
          if (pick.value + completion > bestV) { bestV = pick.value + completion; bestOuting = { h, k, d, outcome: pick.o }; doRecreation = false; }
        });
        ctx.energy = energy; ctx.maxEnergy = maxEnergy; ctx.totalBond = bond.reduce((a, n) => a + n, 0);
        for (let f = 0; f < 5; f++) {
          const L = camp ? 5 : Math.min(5, 1 + Math.floor(count[f] / 4));
          const members = at[f].map((k) => ({ card: deck[k].card, level: deck[k].level, bond: bond[k] }));
          const g = gain(ctx, fx, ctx.sc.train[STATS[f]], STATS[f], members, L, mood);
          let v = g.sp * SP_VALUE;
          for (let i = 0; i < 5; i++) v += trained(x[i], g.g[i]) * pointValue(ctx, STATS[i], x[i]);
          const raw = v;
          const tok = live ? live.training(turn, STATS[f], L, members, g.rainbows) : [];
          if (live) v += live.tokenValue(tok);
          at[f].forEach((k) => {
            const h = hello[k];
            if (!h) return;
            if (!h.met) v += h.p.first.s.reduce((a, n, i) => a + n * pointValue(ctx, STATS[i], x[i]), 0) + moodValue(1) + 10;
            else if (turn <= 72) v += ctx.helloProcRate * live.tokenValue([{ type: live.low(), amount: h.p.tokenAmount }]);
          });
          // Early on, raising bonds pays off later.
          const early = Math.max(0, 1 - turn / 40);
          at[f].forEach((k) => { if (bond[k] < 80 && deck[k].card.ty !== "friend") v += early * 6; });
          const fail = E.estimateFail(STATS[f], energy) * g.failMult / 100;
          v = v * (1 - fail) - fail * raw * 0.5 + lambda * (Math.max(0, Math.min(maxEnergy, energy + g.energy)) - energy);
          if (v > bestV) {
            bestV = v; best = f; bestG = g; bestFail = fail; bestRaw = raw; bestTokens = tok; bestOuting = null; doRecreation = false;
            bestHelloSaving = 0;
            if (live && members.some((m) => H.isHello(m.card)) && g.energy < 0) {
              const without = gain(ctx, fx, ctx.sc.train[STATS[f]], STATS[f], members.filter((m) => !H.isHello(m.card)), L, mood);
              bestHelloSaving = Math.max(0, g.energy - without.energy);
            }
          }
        }
        if (bestOuting) {
          const { h, k, d } = bestOuting;
          const outcome = d.roll ? d.opts[eventRand() < d.p ? 0 : 1] : bestOuting.outcome;
          const recovered = applyEvent(outcome);
          liveTotals.helloEnergyRecovered += recovered;
          liveTotals.helloEnergyWasted += Math.max(0, (outcome.e || 0) - recovered);
          bond[k] = Math.min(100, bond[k] + (outcome.b || 0));
          (outcome.h || []).forEach(([id, lv]) => { h.hints[id] = lv; });
          h.done++; outings++; liveTotals.helloOutings++;
          finishTurn(turn); continue;
        }
        if (doRecreation) { applyEvent({ e: 10, mo: 1 }); recreations++; finishTurn(turn); continue; }
        if (best < 0) { energy = Math.min(maxEnergy, energy + 52); rests++; finishTurn(turn); continue; }
        typ = typ ? typ * 0.9 + bestRaw * 0.1 : bestRaw;
        energy = Math.max(0, Math.min(maxEnergy, energy + bestG.energy));
        train[best]++;
        if (rand() < bestFail) { fails++; finishTurn(turn); continue; }
        if (!camp) count[best]++; // failed and camp trainings don't level facilities
        for (let i = 0; i < 5; i++) x[i] = Math.min(ctx.caps[STATS[i]], x[i] + trained(x[i], bestG.g[i]));
        sp += bestG.sp;
        rainbowTotal += bestG.rainbows;
        at[best].forEach((k) => {
          bond[k] = Math.min(100, bond[k] + D.BOND_PER_TRAINING);
          if ((deck[k].card.hs || []).length && rand() < deck[k].hintRate) { hints[k]++; bond[k] = Math.min(100, bond[k] + D.BOND_PER_HINT); }
        });
        if (live) {
          bestTokens.forEach((t) => live.add(t.type, t.amount));
          at[best].forEach((k) => {
            const h = hello[k];
            if (!h) return;
            if (h.met) {
              liveTotals.helloTrainings++;
              if (eventRand() < ctx.helloProcRate) {
                liveTotals.helloTokens += live.add(live.low(), h.p.tokenAmount);
                liveTotals.helloEvents++;
                applyEvent(h.p.repeat); bond[k] = Math.min(100, bond[k] + h.p.repeat.b);
              }
            } else { applyEvent(h.p.first); bond[k] = Math.min(100, bond[k] + h.p.first.b); h.met = true; h.metTurn = turn; }
            liveTotals.helloEnergySaved += bestHelloSaving;
          });
        }
        finishTurn(turn);
        if (!live && ti === Math.floor(ctx.turns.length / 3)) deck.forEach((d, k) => { bondAt[k] += bond[k]; });
      }
      if (live) {
        hello.forEach((h) => {
          if (!h || !h.met) return;
          applyEvent(h.p.ending(h.done === 5));
          if (h.done === 5) liveTotals.helloCompletions++;
          Object.entries(h.hints).forEach(([id, lv]) => {
            const key = h.p.card.id + ":" + id;
            const old = helloSkillEvents.get(key) || { count: 0, levels: 0 };
            old.count++; old.levels += lv; helloSkillEvents.set(key, old);
          });
        });
        live.shop(78, energy, maxEnergy, applyEvent, true);
        const ls = live.state;
        liveTotals.songs += Object.keys(ls.songs).length + 1;
        liveTotals.techniques += ls.techniques; liveTotals.greatConcerts += ls.greatConcerts; liveTotals.lessonEnergy += ls.lessonEnergy;
        if (ls.songCountAtLyrics >= 16) liveTotals.lyrics++;
        if (ls.songCountAtFinalDeadline >= 18) liveTotals.special++;
        for (let i = 0; i < 5; i++) { earnedTokens[i] += ls.earned[i]; spentTokens[i] += ls.spent[i]; finalTokens[i] += ls.tokens[i]; }
      }
      total += statsValue(ctx, x) + sp * SP_VALUE;
      spTotal += sp;
      for (let i = 0; i < 5; i++) statSum[i] += x[i];
    }
    ctx.helloSkillEvents = helloSkillEvents;
    const skill = skillValue(ctx, deck, hints.map((h) => h / R));
    return {
      value: total / R + skill.value * ctx.skillWeight,
      trainValue: total / R,
      skillValue: skill.value,
      stats: statSum.map((s) => Math.round(s / R)),
      sp: Math.round(spTotal / R),
      rainbows: rainbowTotal / R,
      raceBonus,
      hints: inputCards.map(c => hints[cards.indexOf(c)] / R),
      bondByJuniorEnd: inputCards.map(c => Math.round(bondAt[cards.indexOf(c)] / R)),
      trainMix: train.map((n) => n / R),
      rests: rests / R,
      races: races / R,
      requiredRaces: requiredRaces / R,
      runs: R,
      outings: outings / R,
      recreations: recreations / R,
      grandConcert: ctx.sc.id === "grandlive" ? Object.assign(
        Object.fromEntries(Object.entries(liveTotals).map(([k, n]) => [k, n / R])), {
          earnedTokens: earnedTokens.map((n) => n / R), spentTokens: spentTokens.map((n) => n / R), finalTokens: finalTokens.map((n) => n / R),
          model: "discrete-lessons-v1", helloProcRate: ctx.helloProcRate, helloUnlockRate: ctx.helloUnlockRate,
          assumptions: "repeat event and outing-unlock rates are configurable assumptions; defaults 40% (repeat) and 15% (unlock after meeting and bond 60); fifth outing: assumed 50/50; R +10 token floor; sampled shop approximates published category weights; guest placements, event-chain-rate songs and random mood drops omitted; no flat scenario multiplier"
        }) : null,
      calendarAssumptions: ctx.calendar ? {
        requiredRaceResult:"wins assumed; race failure and aptitude feasibility not simulated",
        randomGoalStats:"expected distribution across five stats",
        choiceAndFanGoals:"only automatically fixed race objectives scheduled",
        rewards:"standard goal/URA winning rewards; discrete concerts and Light Hello events/ending; other career-end/secret rewards omitted",
        scheduledRaces:ctx.calendar.filter(d => d.kind === "race").map(d => d.turn),
        freeTurns:ctx.calendar.filter(d => d.kind === "free").length
      } : null,
      fails: fails / R,
      skills: skill.list,
      initial,
      initialSp,
    };
  }

  // Skills a deck can hint, each valued by its race gain minus its skill point cost.
  function skillValue(ctx, deck, hintEvents) {
    const offers = D.skillOffers();
    const add = (id, prob, lv, src, kind) => offers.add(id, prob, lv, src, kind);
    deck.forEach((d, k) => {
      const hs = d.card.hs || [];
      hs.forEach((id) => add(id, 1 - Math.exp(-hintEvents[k] / Math.max(1, hs.length)), d.hintLv, d.card.id, "training"));
      (d.card.es || []).forEach((id) => {
        if (d.hello) {
          const observed = ctx.helloSkillEvents.get(d.card.id + ":" + id);
          if (observed) add(id, observed.count / ctx.runs, Math.round(observed.levels / observed.count), d.card.id);
        } else add(id, EVENT_SKILL_CHANCE[d.card.r] || 0.5, 1, d.card.id);
      });
    });
    const list = [];
    offers.values().forEach((offer) => {
      const { id } = offer;
      const L = ctx.skills[id];
      if (L == null || ctx.known.has(id)) return;
      const cost = ctx.costs[id] || D.skillCost(id) || 150;
      const surplus = L * L_VALUE - cost * (1 - offer.conditionalDiscount) * SP_VALUE;
      list.push(Object.assign({}, offer, { L, cost, surplus }));
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

  // Deck makeup: comp is { type: exact count } for the types you fixed (others are free).
  // A partial deck is fine as long as the slots left can still meet every fixed count.
  const TYPES = ["speed", "stamina", "power", "guts", "wit", "friend", "group"];
  function compOK(cards, comp, total) {
    if (!comp) return true;
    const n = {};
    cards.forEach((c) => { n[c.card.ty] = (n[c.card.ty] || 0) + 1; });
    let need = 0;
    for (const t of TYPES) {
      if (comp[t] == null) continue;
      if ((n[t] || 0) > comp[t]) return false;
      need += comp[t] - (n[t] || 0);
    }
    return need <= total - cards.length;
  }

  // Finds the best decks. pool: [{ card, lb, borrowed? }]. opts.locked: card ids that must stay.
  // onProgress(fraction) is called as the search goes.
  function optimize(opts, onProgress) {
    const ctx = buildCtx(opts);
    const tchar = opts.trainee ? (D.trainee(opts.trainee) || {}).cid : null;
    const pool = opts.pool.filter((c) => !(tchar && c.card.cid === tchar));
    const borrowPool = (opts.borrowPool || []).filter((c) => !(tchar && c.card.cid === tchar));
    const comp = opts.comp && Object.keys(opts.comp).length ? opts.comp : null;
    const ok = (rest, c) => compatible(rest, c, tchar) && compOK(rest.concat([c]), comp, 6);
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
        if (!ok(deck, c)) return;
        const v = score(deck.concat([c]), quick).value;
        if (v > bestV) { bestV = v; best = c; }
      });
      if (!best) break;
      deck.push(best);
      progress(0.1 + 0.4 * (s + 1) / Math.max(1, steps));
    }
    if (deck.length < ownedSlots) {
      const short = comp ? TYPES.filter((t) => comp[t] != null).map((t) => comp[t] + " " + t).join(", ") : "";
      throw new Error("Not enough cards to fill the deck" + (short ? " with " + short + ". Check you own enough cards of each type (or allow a borrowed card)" : "") + ".");
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
          if (!ok(rest, c)) return;
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
        if (!ok(deck, c)) return;
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
        if (c.card.id === d.card.id || !ok(rest, c)) return;
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

  // ---- Target stats: steer a deck toward your stat targets ----
  // How close a simulated stat line ends to the targets (each capped at the stat cap): every
  // point short costs 1, a big miss counts extra (400 short costs 720), and a miss in a stat
  // the build leans on counts up to double (Speed most). Points past a target count 0.1 each,
  // skill points 0.35 each.
  function targetFit(ctx, stats, sp) {
    let value = 0, short = 0;
    const top = Math.max.apply(null, STATS.map((s) => ctx.w[s]));
    STATS.forEach((s, i) => {
      const t = Math.min(ctx.target[s], ctx.caps[s]);
      const miss = Math.max(0, t - stats[i]);
      short += miss;
      value -= miss * (1 + miss / 500) * (1 + ctx.w[s] / top);
      value += 0.1 * Math.max(0, Math.min(stats[i], ctx.caps[s]) - t);
    });
    return { value: value + sp * SP_VALUE, short: Math.round(short) };
  }

  // Starts from a deck (Euophrys' pick) and goes slot by slot: the best few cards of each type
  // the deck makeup allows (by Euophrys' score with the other five fixed) go in one at a time,
  // and a swap stays when the simulated careers end closer to the targets, counting the
  // deck's skills (tiers.js) and must-haves too. Locked cards stay. Up to 2 passes.
  // Friend and Group cards help every training, so balanced targets would pull in several;
  // racing decks rarely run more than one of each, so the search stays at 1 (or the start
  // deck's count, or your deck makeup's). Parent decks may take 2 of each: players report
  // they add a lot of skill points toward an SS rating in Independent Training.
  // opts: the tier list options (scenario key, skills, must, comp, locked, skillWeight...);
  // sim: buildCtx options (coach scenario, build, trainee, target, caps).
  // Returns a stepper so the page can show progress: next() does one slot, result() ends it.
  const FIT_RUNS = 6;
  const FIT_PER_TYPE = { friend: 2, group: 2 };
  const FIT_TYPES = ["speed", "stamina", "power", "guts", "wit", "friend", "group"];
  function targetSearch(opts, sim, start, pool, borrowPool) {
    const Tr = root.UmaTiers || (typeof require !== "undefined" ? require("./tiers.js") : null);
    const ctx = buildCtx(Object.assign({}, sim, { runs: FIT_RUNS, skills: opts.skills, costs: opts.costs, skillWeight: opts.skillWeight }));
    const comp = opts.comp || {};
    const locked = new Set(opts.locked || []);
    // Parent decks: the skills are the point, so a swap may cost at most a share of the start
    // deck's skill score, set by "Stats still count" (A little 4%, Some 10%, Half 20%, Fully
    // 40%); within that, the closest stats win. skillWeight is the racing slider.
    const sw = opts.parent ? 1 : opts.skillWeight != null ? opts.skillWeight : 1;
    const giveUp = opts.parent ? Math.min(0.4, 0.4 * (opts.parent.statsWeight || 0)) : null;
    let floor = -Infinity;
    const cache = new Map();
    const testedDecks = new Map();
    const evaluate = (deck, c) => {
      const s = simulate(c, deck.map((x) => ({ card: D.card(x.id), lb: x.lb })));
      const fit = targetFit(c, s.stats, s.sp);
      const sk = Tr.deckSkills(opts, deck);
      const over = sk.value < floor - 1e-9 ? 1e9 : 0;
      return Object.assign({}, s, { value: fit.value + sw * sk.value + sk.mustValue - over, short: fit.short, skill: sk.value });
    };
    const score = (deck) => {
      const k = deck.map((x) => x.id + ":" + x.lb).sort().join(",");
      if (!cache.has(k)) {
        cache.set(k, evaluate(deck, ctx));
        testedDecks.set(k, deck.map(x => Object.assign({}, x)));
      }
      return cache.get(k);
    };
    let deck = start.map((x) => ({ id: x.id, lb: x.lb, borrowed: !!x.borrowed }));
    if (giveUp != null) floor = (1 - giveUp) * Tr.deckSkills(opts, deck).value;
    let cur = score(deck);
    const nOf = (cards, t) => cards.filter((x) => D.card(x.id).ty === t).length;
    const cap = opts.parent ? 2 : 1;
    const most = { friend: comp.friend != null ? comp.friend : Math.max(cap, nOf(deck, "friend")), group: comp.group != null ? comp.group : Math.max(cap, nOf(deck, "group")) };
    const slots = deck.map((_, i) => i).filter((i) => !locked.has(deck[i].id));
    const swaps = [];
    let step = 0, pass = 0, changed = false;
    function next() {
      if (pass >= 2 || !slots.length) return false;
      const i = slots[step % slots.length];
      const c = deck[i];
      const u = D.card(c.id).ty;
      const rest = deck.filter((_, j) => j !== i);
      const from = c.borrowed ? borrowPool : pool;
      let best = null;
      // A fixed type keeps its slot; free types can trade places.
      FIT_TYPES.filter((t) => (t === u || (comp[u] == null && comp[t] == null)) && !(most[t] != null && nOf(rest, t) >= most[t])).forEach((t) => {
        const cands = from.filter((x) => x.id !== c.id && D.card(x.id).ty === t);
        if (!cands.length) return;
        Tr.rank(opts, t, rest, cands).slice(0, FIT_PER_TYPE[t] || 4).forEach((r) => {
          const cand = deck.slice();
          cand[i] = { id: r.id, lb: r.lb, borrowed: c.borrowed };
          const v = score(cand);
          if (v.value > (best ? best.v.value : cur.value) + 1e-6) best = { cand, v, in: r };
        });
      });
      if (best) { swaps.push({ out: c.id, in: best.in.id, inLb: best.in.lb }); deck = best.cand; cur = best.v; changed = true; }
      step++;
      if (step % slots.length === 0) { pass = changed ? pass + 1 : 2; changed = false; }
      return pass < 2;
    }
    // The start and final decks, rescored with more careers for the readout.
    function result() {
      const full = buildCtx(Object.assign({}, sim, { runs: 16, skills: opts.skills, costs: opts.costs, skillWeight: opts.skillWeight }));
      // Validate every candidate actually evaluated by the cheap search, not just its winner.
      const finalists = new Map(testedDecks);
      const put = d => finalists.set(d.map(x => x.id + ":" + x.lb).sort().join(","), d);
      put(start); put(deck);
      const before = evaluate(start, full);
      let winner = start.map(x => Object.assign({}, x));
      let after = before;
      finalists.forEach(candidate => {
        const r = evaluate(candidate, full);
        if (r.value > after.value + 1e-6) {
          winner = candidate.map(x => Object.assign({}, x));
          after = r;
        }
      });
      const finalSwaps = [];
      const removed = start.filter(x => !winner.some(y => x.id === y.id && x.lb === y.lb && !!x.borrowed === !!y.borrowed));
      const added = winner.filter(x => !start.some(y => x.id === y.id && x.lb === y.lb && !!x.borrowed === !!y.borrowed));
      removed.forEach((x, i) => { if (added[i]) finalSwaps.push({out:x.id, in:added[i].id, inLb:added[i].lb}); });
      return { cards: winner, swaps: finalSwaps, before, after, target: ctx.target, caps: ctx.caps,
        validation: { runs:16, candidates:finalists.size, method:"rescore-all-tested" } };
    }
    return { next, result, progress: () => (slots.length ? Math.min(1, step / (slots.length * 2)) : 1) };
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
    const comp = opts.comp && Object.keys(opts.comp).length ? opts.comp : null;
    const ok = (rest, c) => compatible(rest, c, tchar) && compOK(rest.concat([c]), comp, 6);
    const out = [];
    candidates.forEach((c) => {
      if (tchar && c.card.cid === tchar) return;
      let best = -Infinity, swapOut = null;
      slots.forEach((i) => {
        const d = deck[i];
        if (!d || d.borrowed) return;
        const rest = deck.filter((_, j) => j !== i);
        if (!ok(rest, c)) return;
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

  // Tier list: how much each candidate (card at a limit break) adds to the deck so far, like
  // Euophrys' tier list but from full simulated careers, with skills valued on the chosen race.
  // Candidates whose character is already in the deck are skipped.
  function tierScores(opts, deck, candidates, onProgress) {
    const ctx = buildCtx(opts);
    const tchar = opts.trainee ? (D.trainee(opts.trainee) || {}).cid : null;
    const sim = (cards) => simulate(Object.assign({}, ctx), cards);
    const base = sim(deck);
    const out = [];
    candidates.forEach((c, i) => {
      if (onProgress && i % 10 === 0) onProgress(i / candidates.length);
      if (!compatible(deck, c, tchar)) return;
      const r = sim(deck.concat([c]));
      out.push({
        id: c.card.id, lb: c.lb,
        score: r.value - base.value,
        train: r.trainValue - base.trainValue,
        skill: (r.skillValue - base.skillValue) * ctx.skillWeight,
        stats: r.stats.map((x, k) => x - base.stats[k]),
        sp: r.sp - base.sp,
        rainbows: r.rainbows - base.rainbows,
        topSkills: r.skills.filter((x) => x.src.indexOf(c.card.id) !== -1 && x.surplus > 0).slice(0, 3).map((x) => ({ id: x.id, L: x.L, p: x.p })),
      });
    });
    // A higher limit break is never worse in the game, so smooth out simulation noise.
    const byCard = {};
    out.forEach((x) => { (byCard[x.id] = byCard[x.id] || []).push(x); });
    Object.values(byCard).forEach((xs) => {
      xs.sort((a, b) => a.lb - b.lb);
      for (let k = 1; k < xs.length; k++) if (xs[k].score < xs[k - 1].score) xs[k].score = xs[k - 1].score;
    });
    if (onProgress) onProgress(1);
    return out.sort((a, b) => b.score - a.score);
  }

  // One request from the page (or its worker): card ids in, card ids out.
  //   { job: "optimize" | "wishlist", opts, pool, borrowPool, deck, candidates, swapSlots }
  function runJob(data, onProgress) {
    const Scen = root.UmaScenarios || (typeof require !== "undefined" ? require("./scenarios.js") : null);
    const sc = Scen.SCENARIOS.find((x) => x.id === data.opts.scenario) || Scen.SCENARIOS[0];
    const resolve = (list) => (list || []).map((c) => ({ card: D.card(c.id), lb: c.lb, borrowed: !!c.borrowed })).filter((c) => c.card);
    const ids = (list) => list.map((c) => ({ id: c.card.id, lb: c.lb, borrowed: !!c.borrowed }));
    const o = Object.assign({}, data.opts, { scenario: sc, pool: resolve(data.pool), borrowPool: resolve(data.borrowPool) });
    if (data.job === "tiers") {
      return { type: "tiers", list: tierScores(o, resolve(data.deck), resolve(data.candidates), onProgress) };
    }
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

  const api = { grandConcertCalendar, optimize, simulate, wishlist, runJob, parseChart, tierScores, compOK, buildCtx, statsValue, targetFit, targetSearch, L_VALUE, SP_VALUE, HINT_DISCOUNT };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.UmaOptimizer = api;
})(typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : globalThis);
