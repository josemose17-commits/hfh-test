// Grand Concert economy used by the career estimator. Actual costs and concert
// timing are discrete. Shop draws / training policy are estimates, not an oracle
// for the game's next shop. Probability assumptions are returned with results.
(function (root) {
  const E = root.UmaEngine || (typeof require !== "undefined" ? require("./engine.js") : null);
  const STATS = ["speed", "stamina", "power", "guts", "wit"];
  const CATEGORY_WEIGHTS = [
    [[80, 0, 6, 12, 2], [23, 0, 2, 73, 2], [55, 0, 7, 27, 11]],
    [[76, 0, 9, 10, 5], [28, 0, 3, 63, 6], [15, 50, 3, 20, 12]]
  ];
  const category = (t) => t.kind === "stat" ? 0 : ["two", "statsp"].includes(t.kind) ? 1 : t.kind === "sp" ? 2 : t.kind === "hint" ? 3 : 4;
  function sample(items, weights, rand) {
    let r = rand() * weights.reduce((a, n) => a + n, 0);
    for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r < 0) return items[i]; }
    return items[items.length - 1];
  }
  function create(ctx, rand) {
    const sc = ctx.sc;
    const s = {
      tokens: [0, 0, 0, 0, 0], earned: [0, 0, 0, 0, 0], spent: [0, 0, 0, 0, 0], wasted: [0, 0, 0, 0, 0],
      songs: {}, techniques: 0, energyLessons: 0, lessonEnergy: 0, concerts: 0,
      period: 0, periodSongs: 0, techSince: 0, cycleSongs: 0, periodTech: 0,
      extra: [0, 0, 0, 0, 0], extraSp: 0, friendship: 0, pendingFriendship: 0,
      specialty: 0, pendingSpecialty: 5, shop: null, held: false, begun: false,
      eventLevel: 0, pendingEventLevel: 0, eventLevelTurns: 0,
      songCountAtLyrics: null, songCountAtFinalDeadline: null, greatConcerts: 0
    };
    const cap = () => 200 + s.concerts * 50;
    const required = () => E.techniquesToSong(s.period, s.cycleSongs);
    function add(type, amount) {
      s.earned[type] += amount;
      const credited = Math.max(0, Math.min(amount, cap() - s.tokens[type]));
      s.tokens[type] += credited;
      s.wasted[type] += amount - credited;
      return credited;
    }
    function low(exclude) {
      const types = [0, 1, 2, 3, 4].filter((i) => i !== exclude);
      const min = Math.min(...types.map((i) => s.tokens[i]));
      const tied = types.filter((i) => s.tokens[i] === min);
      return tied[Math.floor(rand() * tied.length)];
    }
    function offers(turn) {
      if (s.shop) return s.shop;
      const songs = turn <= 72 && s.techSince >= required();
      if (songs) {
        const pool = sc.songs.filter((song) => song.from <= turn && !s.songs[song.id]);
        const chosen = [];
        while (pool.length && chosen.length < 3) chosen.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
        if (chosen.length) return s.shop = { kind: "song", offers: chosen };
      }
      const ts = E.techniqueList({ turn }, sc);
      const used = new Set();
      const chosen = [];
      for (let i = 0; i < 3; i++) {
        const cats = [0, 1, 2, 3, 4].filter((c) => !used.has(c) && ts.some((t) => category(t) === c));
        const ws = CATEGORY_WEIGHTS[s.period ? 1 : 0][i];
        const cat = sample(cats, cats.map((c) => ws[c]), rand);
        if (cat !== 0) used.add(cat);
        const pool = ts.filter((t) => category(t) === cat && !(s.period === 0 && t.energy === 40));
        const t = sample(pool, pool.map((x) => x.energy ? (x.energy === 20 ? 60 : x.energy === 30 ? 40 : 25) : 1), rand);
        const cost = t.cost ? t.cost.slice() : [0, 0, 0, 0, 0];
        if (!t.cost) cost[Math.floor(rand() * 5)] = t.any;
        chosen.push(Object.assign({}, t, { cost }));
      }
      return s.shop = { kind: "tech", offers: chosen };
    }
    const affordable = (t) => t.cost.every((n, i) => n <= s.tokens[i]);
    const pay = (t) => t.cost.forEach((n, i) => { s.tokens[i] -= n; s.spent[i] += n; });
    function songValue(song, turn) {
      return E.concertSongValue(song, ctx.w, turn, sc);
    }
    // apply receives already-scaled event stats (not training gains), SP, energy.
    function shop(turn, energy, maxEnergy, apply, finalSpend) {
      if (turn < 5) return;
      for (let tries = 0; tries < 100; tries++) {
        const offer = offers(turn);
        const choices = offer.offers.filter(affordable);
        if (!choices.length) return;
        if (offer.kind === "song") {
          // Carry an offered song over a concert, preserving the actual shop.
          const limit = s.period === 0 ? 5 : s.period === 4 ? 99 : 3;
          const pick = choices.sort((a, b) => songValue(b, turn) - songValue(a, turn))[0];
          if (s.periodSongs >= limit && s.period < 4 && !finalSpend && E.shouldCarrySong(pick, ctx.w, turn, sc)) { s.held = true; return; }
          pay(pick);
          s.songs[pick.id] = turn;
          const gains = [0, 0, 0, 0, 0];
          Object.entries(pick.extra || {}).forEach(([k, n]) => { if (k === "sp") s.extraSp += n; else s.extra[STATS.indexOf(k)] += n; });
          Object.entries(pick.once || {}).forEach(([k, n]) => { if (k === "sp") apply({ sp: n }); else gains[STATS.indexOf(k)] += n; });
          apply({ s: gains });
          s.pendingFriendship += pick.fb || 0;
          if (/Specialty/.test(pick.live || "")) s.pendingSpecialty += 5;
          if (/Support Event Chance/.test(pick.live || "")) s.pendingEventLevel++;
          s.periodSongs++;
          if (s.held) { s.techSince++; s.held = false; } else { s.cycleSongs++; s.techSince = 0; }
        } else {
          const goal = s.period < 4 ? (s.period === 0 ? 5 : 3) : 99;
          // No speculative extra techniques once a carry song is already ready.
          const needCycle = turn <= 72 && (s.periodSongs < goal || s.techSince < required());
          const score = (t) => {
            const cost = t.cost.reduce((a, n, i) => a + n * (s.tokens[i] < 30 ? 1.4 : 1), 0);
            const gain = Object.entries(t.gain || {}).reduce((a, [k, n]) => a + ctx.w[k] * n, 0) + (t.sp || 0) * 0.35;
            return (needCycle ? -cost : gain - cost * 0.3) + Math.min(maxEnergy - energy, t.energy || 0) * 1.2;
          };
          const pick = choices.sort((a, b) => score(b) - score(a))[0];
          if (!needCycle && !finalSpend && score(pick) <= 0) return;
          if (pick.energy && energy > maxEnergy - 10 && !needCycle && !finalSpend) return;
          pay(pick);
          const gains = STATS.map((k) => (pick.gain || {})[k] || 0);
          const gainEnergy = Math.min(maxEnergy - energy, pick.energy || 0);
          energy += gainEnergy;
          apply({ s: gains, sp: pick.sp || 0, e: gainEnergy });
          s.techniques++; s.periodTech++; s.techSince++;
          if (pick.energy) { s.energyLessons++; s.lessonEnergy += gainEnergy; }
        }
        s.shop = null;
      }
    }
    function start(turn, apply) {
      s.eventLevelTurns += s.eventLevel;
      if (turn === 5 && !s.begun) { for (let i = 0; i < 5; i++) add(i, 10); s.begun = true; }
      if (turn === 69) s.songCountAtLyrics = Object.keys(s.songs).length + 1;
      if (turn === 72) { s.songCountAtFinalDeadline = Object.keys(s.songs).length + 1; apply({ s: [10, 10, 10, 10, 10] }); s.pendingFriendship += 10; }
    }
    function end(turn, apply) {
      if (!sc.lives.includes(turn)) return;
      const songs = s.periodSongs + (s.period === 0 || s.period === 4 ? 1 : 0);
      const great = songs >= 3;
      apply({ s: Array(5).fill(great ? 10 : 3), sp: songs * 25 + s.periodTech * 5 });
      if (great) s.greatConcerts++;
      s.friendship += s.pendingFriendship; s.pendingFriendship = 0;
      s.specialty += s.pendingSpecialty; s.pendingSpecialty = 0;
      s.eventLevel += s.pendingEventLevel; s.pendingEventLevel = 0;
      // Every displayed offer survives, including its old technique tier/cost.
      // Only the cadence resets; buying a carried song credits one technique.
      s.held = !!(s.shop && s.shop.kind === "song");
      s.period++; s.concerts++; s.periodSongs = 0; s.periodTech = 0; s.techSince = 0; s.cycleSongs = 0;
      const reward = E.calendarPerformance(turn, sc);
      if (reward) for (let i = 0; i < 5; i++) add(i, reward.amount);
    }
    function training(turn, stat, level, members, rainbows) {
      if (turn < 5) return [];
      const links = members.filter((m) => sc.linkChars.includes(m.card.n)).length;
      const amount = Math.floor(((stat === "wit" ? 5 : 9) + level) * Math.pow(1.15, members.length) + 2 * links);
      const [pri, sec] = sc.tokenOf[stat];
      const other = [0, 1, 2, 3, 4].filter((i) => i !== pri && i !== sec);
      const r = rand();
      const type = r < 0.6 ? pri : r < 0.9 ? sec : other[Math.floor(rand() * other.length)];
      const second = rainbows ? low(type) : null;
      const gain = [{ type, amount }];
      if (second != null) gain.push({ type: second, amount });
      return gain;
    }
    function tokenValue(gain) {
      return gain.reduce((v, g) => v + Math.min(g.amount, cap() - s.tokens[g.type]) * (s.tokens[g.type] < 30 ? 0.75 : 0.25), 0);
    }
    return { state: s, add, low, start, end, shop, training, tokenValue };
  }
  const api = { create };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.UmaGrandConcert = api;
})(typeof window !== "undefined" ? window : globalThis);
