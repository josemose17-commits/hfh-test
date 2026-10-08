// Turn coach engine. Pure functions only, so it runs in the browser and in Node tests.
//
// Every option is scored in "value points" (roughly: one point of a fully useful stat):
//   stats + skill points + bonds + hints + scenario extras + energy + mood + failure risk.
// Energy is valued with a lookahead over the rest of the career: for each future turn and
// energy level it plans train / Wit / rest against a spread of good and bad turns, so a
// rest is only recommended when the energy is worth more later (camp coming up, failure
// climbing) than this turn's training.
(function (root) {
  const Deck = root.UmaDeck || (typeof require !== "undefined" ? require("./deck.js") : null);
  const STATS = ["speed", "stamina", "power", "guts", "wit"];
  const STAT_LABELS = { speed: "Speed", stamina: "Stamina", power: "Power", guts: "Guts", wit: "Wit" };
  const MOODS = ["Awful", "Bad", "Normal", "Good", "Great"];
  const MOOD_MULT = [0.8, 0.9, 1.0, 1.1, 1.2];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const YEARS = ["Junior", "Classic", "Senior"];

  // Which stats each training raises (share of the total gain) and its level-1 energy cost.
  // Splits follow the base training values; Wit restores energy instead of spending it.
  const FACILITY = {
    speed: { split: { speed: 0.67, power: 0.33 }, base: 12, cost: 21 },
    stamina: { split: { stamina: 0.7, guts: 0.3 }, base: 10, cost: 19 },
    power: { split: { power: 0.6, stamina: 0.4 }, base: 10, cost: 20 },
    guts: { split: { guts: 0.5, speed: 0.25, power: 0.25 }, base: 12, cost: 22 },
    wit: { split: { wit: 0.75, speed: 0.25 }, base: 8, cost: -5 }
  };
  const SP_RATE = { speed: 0.1, stamina: 0.1, power: 0.1, guts: 0.1, wit: 0.2 };
  const SP_VALUE = 0.35;

  // Stat weights and the point where more of a stat stops paying much ("enough").
  const BUILDS = {
    sprint: { label: "Sprint (≤1400m)", w: { speed: 1.0, stamina: 0.3, power: 0.85, guts: 0.4, wit: 0.75 }, target: { speed: 1600, stamina: 600, power: 1200, guts: 600, wit: 1100 } },
    mile: { label: "Mile (1600m)", w: { speed: 1.0, stamina: 0.45, power: 0.8, guts: 0.4, wit: 0.7 }, target: { speed: 1600, stamina: 800, power: 1200, guts: 600, wit: 1100 } },
    medium: { label: "Medium (2000-2400m)", w: { speed: 1.0, stamina: 0.65, power: 0.75, guts: 0.4, wit: 0.65 }, target: { speed: 1600, stamina: 1000, power: 1200, guts: 600, wit: 1000 } },
    long: { label: "Long (2500m+)", w: { speed: 1.0, stamina: 0.9, power: 0.65, guts: 0.45, wit: 0.6 }, target: { speed: 1500, stamina: 1300, power: 1100, guts: 700, wit: 1000 } },
    dirt: { label: "Dirt", w: { speed: 1.0, stamina: 0.5, power: 0.9, guts: 0.4, wit: 0.65 }, target: { speed: 1500, stamina: 800, power: 1400, guts: 600, wit: 1000 } }
  };

  // Approximate race rewards for a win (stats are spread across all five).
  const RACES = {
    op: { label: "OP / Pre-OP", sp: 20, stats: 5 },
    g3: { label: "G3", sp: 30, stats: 6 },
    g2: { label: "G2", sp: 35, stats: 8 },
    g1: { label: "G1", sp: 45, stats: 10 }
  };
  const RACE_ENERGY = 15;
  const REST_OUTCOMES = [[30, 0.2], [50, 0.5], [70, 0.3]];
  // Spread of future turn quality used by the energy lookahead (weak / normal / strong).
  const DRAWS = [[0.55, 0.3], [1.0, 0.45], [1.6, 0.25]];
  const DEFAULT_CAMP = [37, 38, 39, 40, 61, 62, 63, 64];

  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

  function campTurns(sc) {
    return (sc && sc.campTurns) || DEFAULT_CAMP;
  }

  function isCamp(turn, sc) {
    return campTurns(sc).indexOf(turn) !== -1;
  }

  function turnInfo(turn, scenario) {
    const total = scenario ? scenario.totalTurns : 78;
    if (turn > 72) return { year: "Finale", text: "Finale · turn " + (turn - 72), short: "F" + (turn - 72), total };
    const y = Math.floor((turn - 1) / 24);
    const inYear = (turn - 1) % 24;
    const half = inYear % 2 === 0 ? "Early" : "Late";
    const month = MONTHS[Math.floor(inYear / 2)];
    return { year: YEARS[y], month, half, text: YEARS[y] + " · " + half + " " + month, short: half[0] + " " + month, total };
  }

  function phaseFor(turn, scenario) {
    const finaleStart = scenario && scenario.totalTurns < 78 ? scenario.totalTurns : 73;
    if (turn >= finaleStart) return { id: "finale", name: "Finale", tip: "Every turn counts. Energy has little value left, so take the strongest training and spend skill points before the last race." };
    if (turn <= 11) return { id: "predebut", name: "Pre-debut", tip: "Build bonds. Train where the most un-bonded cards gather, and use Wit to save energy." };
    if (turn <= 24) return { id: "junior", name: "Junior", tip: "Keep building bonds until most cards reach orange (80+). Take friendship trainings as they appear." };
    if (turn <= 36) return { id: "classic1", name: "Classic spring", tip: "Friendship trainings in your main stats come first. Arrive at summer camp with high energy and Good or Great mood." };
    if (turn <= 40) return { id: "camp1", name: "Classic summer camp", tip: "Facilities are at max level. Take every strong training, and rest (which also lifts mood) only when failure gets risky." };
    if (turn <= 48) return { id: "classic2", name: "Classic autumn", tip: "Keep stacking friendship trainings. Fill weak stats once your main ones are on track." };
    if (turn <= 60) return { id: "senior1", name: "Senior spring", tip: "Enter current stats so the coach can see your caps. Shift toward stats that are still short, and start buying key skills." };
    if (turn <= 64) return { id: "camp2", name: "Senior summer camp", tip: "Last camp. Use saved items and buffs here." };
    return { id: "senior2", name: "Senior autumn", tip: "Close the remaining stat gaps. Stats over 1200 count half, so skill points matter more now." };
  }

  function forcedTurns(state, sc) {
    const set = new Set(state.goals || []);
    if (sc.finale && sc.finale.forced) sc.finale.turns.forEach((t) => set.add(t));
    (sc.goalTurns || []).forEach((t) => set.add(t));
    return set;
  }

  function eventsFor(turn, scenario, state) {
    const out = [];
    const evs = scenario.events || [];
    if (turn === 12 && !evs.some((e) => e.turn === 12)) out.push({ turn, label: "Make Debut", tip: "Goal race." });
    const camps = campTurns(scenario);
    if (camps.indexOf(turn + 1) !== -1 && camps.indexOf(turn) === -1) out.push({ turn, label: "Camp next turn", tip: "Energy carried into camp is worth more than usual." });
    if (camps.indexOf(turn) !== -1 && camps.indexOf(turn - 1) === -1) out.push({ turn, label: "Summer camp starts", tip: "Four turns at max facility level." });
    evs.forEach((e) => { if (e.turn === turn) out.push(e); });
    if (scenario.finale && scenario.finale.forced && scenario.finale.turns.indexOf(turn) !== -1) out.push({ turn, label: scenario.finale.name, tip: scenario.finale.note });
    if (state && (state.goals || []).indexOf(turn) !== -1) out.push({ turn, label: "Goal race", tip: "You marked this turn as a goal race." });
    return out;
  }

  // Typical total gain of a turn's best training in URA, by stage of the career.
  function typGainAt(t, sc) {
    if (t > 72) return 45;
    if (isCamp(t, sc)) return t <= 48 ? 48 : 55;
    if (t <= 12) return 16;
    if (t <= 24) return 22;
    if (t <= 36) return 30;
    if (t <= 48) return 36;
    if (t <= 60) return 40;
    return 42;
  }

  // Your deck's strength compared with the scenario default, learned from logged gains.
  function calibFactor(state) {
    const c = (state.calib || []).slice(-12).filter((x) => x > 0);
    if (c.length < 3) return 1;
    const s = c.slice().sort((a, b) => a - b);
    const mid = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
    return clamp(mid, 0.5, 2.5);
  }

  function typAt(t, sc, calib) {
    return typGainAt(t, sc) * (sc.gainScale || 1) * (calib || 1) * 0.8;
  }

  function facilityLevel(t, sc) {
    if (isCamp(t, sc)) return 5;
    if (t <= 24) return 1.5;
    if (t <= 36) return 2.5;
    if (t <= 48) return 3;
    if (t <= 60) return 3.5;
    return 4.5;
  }

  // Energy a training spends at level 1 (negative = it restores energy), from the scenario's
  // base values when known (U.A.F.'s Wit costs 15, for example).
  function baseCost(stat, sc) {
    if (sc && sc.train && sc.train[stat]) return -sc.train[stat][6];
    return FACILITY[stat].cost;
  }

  function energyCost(stat, t, sc, level) {
    const c = baseCost(stat, sc);
    return c < 0 ? c : c + 1.5 * ((level || facilityLevel(t, sc)) - 1);
  }

  // Failure estimate from energy, used when the failure box is left blank.
  function estimateFail(stat, energy) {
    if (stat === "wit") return clamp(Math.round((28 - energy) * 1.0), 0, 95);
    return clamp(Math.round((52 - energy) * 1.15), 0, 95);
  }

  // Total gain estimate from card counts, used when the gain box is left blank.
  function estimateGain(f, state, sc, calib) {
    const cards = f.cards || 0;
    const rb = Math.min(f.rainbows || 0, cards);
    const base = FACILITY[f.stat].base + (facLevelFor(state, sc, f.stat) - 1) * 1.3;
    return (base + 3.5 * cards) * (1 + 0.06 * cards) * Math.pow(1.3, rb) * MOOD_MULT[state.mood] * (sc.gainScale || 1) * (calib || 1);
  }

  function bondK(t) {
    if (t <= 12) return 0.25;
    if (t <= 24) return 0.18;
    if (t <= 36) return 0.08;
    if (t <= 48) return 0.03;
    return 0.01;
  }

  function makeCtx(state, sc) {
    const build = BUILDS[state.build] || BUILDS.medium;
    const caps = {};
    const userCaps = state.caps || {};
    STATS.forEach((s, i) => { caps[s] = userCaps[s] > 0 ? userCaps[s] : (sc.caps ? sc.caps[i] : 1200); });
    const calib = calibFactor(state);
    const ctx = {
      state, sc, calib, caps,
      w: build.w,
      target: build.target,
      stats: state.stats || {},
      E: clamp(Math.round(state.energy), 0, state.maxEnergy || 100),
      maxE: state.maxEnergy || 100,
      camp: isCamp(state.turn, sc),
      turnsLeft: sc.totalTurns - state.turn,
      typ: typAt(state.turn, sc, calib)
    };
    ctx.deck = deckInfo(state);
    ctx.songs = songBonuses(state, sc);
    ctx.boost = sc.train ? scenarioBoost(state, sc) : 1;
    ctx.V = continuation(state, sc, calib);
    ctx.gainValue = (stat, g) => gainValue(stat, g, ctx);
    // Fixed events at the end of this turn (URA's summer snack) land whatever you do.
    const evNow = (sc.energyEvents && sc.energyEvents[state.turn]) || 0;
    ctx.evNow = evNow;
    ctx.energyValue = (delta) => ctx.V[clamp(Math.round(ctx.E + delta + evNow), 0, ctx.maxE)] - ctx.V[clamp(ctx.E + evNow, 0, ctx.maxE)];
    ctx.moodStep = (from) => moodStepValue(from, state, sc, calib);
    ctx.avgW = STATS.reduce((a, s) => a + build.w[s], 0) / STATS.length;
    return ctx;
  }

  function pointValue(stat, x, ctx) {
    if (x >= ctx.caps[stat]) return 0;
    let k = ctx.w[stat];
    if (x >= 1200) k *= 0.5;
    if (x >= ctx.target[stat]) k *= 0.4;
    return k;
  }

  // Value of g points of a stat, walking past 1200, the build target and the cap.
  function gainValue(stat, g, ctx) {
    const cur = +ctx.stats[stat];
    if (!(cur > 0)) return g * ctx.w[stat];
    const end = cur + g;
    const marks = [1200, ctx.target[stat], ctx.caps[stat]].filter((p) => p > cur && p < end).sort((a, b) => a - b);
    let v = 0;
    let x = cur;
    marks.concat([end]).forEach((p) => { v += (p - x) * pointValue(stat, x, ctx); x = p; });
    return v;
  }

  // Value of one mood step up from `from`: about +10% on the trainings of the next ~8 turns,
  // fading a little each turn because random events can knock mood back down.
  // Goal races in the next 3 turns add value too, since mood also affects race results.
  function moodStepValue(from, state, sc, calib) {
    if (from >= 4 || from < 0) return 0;
    const forced = forcedTurns(state, sc);
    let sum = 0;
    let races = 0;
    for (let t = state.turn + 1, n = 0; t <= sc.totalTurns && n < 8; t++, n++) {
      if (forced.has(t)) { if (n < 3) races++; continue; }
      sum += typAt(t, sc, calib) * Math.pow(0.93, n);
    }
    const raceBoost = from < 3 ? races * 0.3 * typAt(state.turn, sc, calib) : 0;
    return (0.1 / MOOD_MULT[from]) * sum * 0.6 + raceBoost;
  }

  // Lookahead: V[e] = expected value of the turns after this one, starting with energy e.
  function continuation(state, sc, calib) {
    const maxE = state.maxEnergy || 100;
    const forced = forcedTurns(state, sc);
    const clampE = (e) => (e < 0 ? 0 : e > maxE ? maxE : Math.round(e));
    const avgCost = ["speed", "stamina", "power", "guts"].reduce((a, st) => a + baseCost(st, sc), 0) / 4;
    const witBase = baseCost("wit", sc);
    let next = new Float64Array(maxE + 1);
    for (let t = sc.totalTurns; t > state.turn; t--) {
      const cur = new Float64Array(maxE + 1);
      const typ = typAt(t, sc, calib);
      const regen = (t > 72 && sc.finaleEnergy ? sc.finaleEnergy : 0) + ((sc.energyEvents && sc.energyEvents[t]) || 0);
      const restGain = isCamp(t, sc) ? 40 : 50;
      const lv = facilityLevel(t, sc);
      const cost = avgCost + 1.5 * (lv - 1);
      const witDelta = witBase < 0 ? -witBase : -(witBase + 1.5 * (lv - 1));
      for (let e = 0; e <= maxE; e++) {
        if (forced.has(t)) { cur[e] = next[clampE(e - 10 + regen)]; continue; }
        const rest = next[clampE(e + restGain + regen)];
        const fw = estimateFail("wit", e) / 100;
        const wit = 0.4 * typ - fw * 0.9 * typ + next[clampE(e + witDelta + regen)];
        const f = estimateFail("speed", e) / 100;
        const after = next[clampE(e - cost + regen)];
        let v = 0;
        for (let i = 0; i < DRAWS.length; i++) {
          const q = DRAWS[i][0] * typ;
          const train = q - f * (q + 0.5 * typ) + after;
          v += DRAWS[i][1] * Math.max(train, wit, rest);
        }
        cur[e] = v;
      }
      next = cur;
    }
    return next;
  }

  // ---- Deck mode: real card effects and the game's training formula ----

  // The deck in use: slots with their card, level and current bond. Null when no cards are set.
  function deckInfo(state) {
    if (!Deck || !Deck.DATA || !state.deck) return null;
    const slots = (state.deck.slots || []).map((sl, i) => {
      const card = sl && sl.id ? Deck.card(sl.id) : null;
      if (!card) return null;
      const level = Deck.levelFor(card, sl.lb);
      const bond = sl.bond != null ? sl.bond : Deck.initialBond(card, level);
      return { idx: i, card, level, bond };
    });
    const used = slots.filter(Boolean);
    if (!used.length) return null;
    const trainee = state.deck.trainee ? Deck.trainee(state.deck.trainee) : null;
    return {
      slots,
      used,
      trainee,
      growth: trainee ? trainee.g : [0, 0, 0, 0, 0],
      deckTypes: new Set(used.map((s) => s.card.ty)).size,
      totalBond: used.reduce((a, s) => a + s.bond, 0),
      raceBonus: used.reduce((a, s) => a + (Deck.baseEffects(s.card, s.level)[15] || 0), 0)
    };
  }

  // Training facility level: your override, else 5 at camp, else counted from logged trainings
  // (most scenarios level a facility every 4 trainings), else an estimate for the stage.
  // Facility level. Your choice wins; camp is always 5. Otherwise it follows the scenario's rule:
  //  "count" (most): +1 level per 4 trainings there, counted from the log, with turns you didn't
  //          log filled in from your training mix, plus scenario bonuses (L'Arc Expectation
  //          gauge, Onsen bathing parties);
  //  "rank"  (Unity Cup): follows team rank, so it's estimated from the stage of the career;
  //  "discipline" (U.A.F.): follows the discipline level, estimated from the stage.
  const DEFAULT_SHARE = { speed: 0.3, stamina: 0.15, power: 0.2, guts: 0.1, wit: 0.25 };
  function facLevelFor(state, sc, stat) {
    const o = state.facLevels && state.facLevels[stat];
    if (o) return o;
    if (isCamp(state.turn, sc)) return 5;
    const t = state.turn;
    const rule = sc.levelRule || "count";
    if (rule === "rank") return t <= 16 ? 1 : t <= 30 ? 2 : t <= 44 ? 3 : t <= 60 ? 4 : 5;
    if (rule === "discipline") return t <= 20 ? 1 : t <= 34 ? 2 : t <= 46 ? 3 : t <= 58 ? 4 : 5;
    const log = state.log || [];
    const loggedTurns = new Set(log.map((l) => l.turn));
    const trains = log.filter((l) => l.kind === "train");
    const mine = trains.filter((l) => l.stat === stat).length;
    const forced = forcedTurns(state, sc);
    let unlogged = 0;
    for (let x = 1; x < t; x++) if (!loggedTurns.has(x) && !forced.has(x) && !isCamp(x, sc)) unlogged++;
    const share = trains.length >= 4 ? (mine + 0.5) / (trains.length + 2.5) : DEFAULT_SHARE[stat];
    const est = mine + unlogged * 0.78 * share;
    const bonus = sc.levelBonus ? sc.levelBonus(state) : 0;
    return Math.max(1, Math.min(5, 1 + Math.floor(est / 4) + bonus));
  }

  // Multiplier for scenario bonuses the card formula doesn't model (Unity training, island
  // facilities, springs...). Learned from your real gains once you type a few.
  function defaultBoost(sc) {
    if (sc.formulaBoost) return sc.formulaBoost;
    const avg = STATS.reduce((a, st) => a + sc.train[st].slice(0, 5).reduce((x, y) => x + y, 0), 0) / 5;
    return clamp((sc.gainScale || 1) * 15.6 / avg, 1, 2.2);
  }

  function scenarioBoost(state, sc) {
    let b = defaultBoost(sc);
    const c = (state.fcal || []).slice(-12).filter((x) => x > 0).sort((x, y) => x - y);
    if (c.length >= 2) b *= clamp(c[Math.floor(c.length / 2)], 0.5, 2);
    return b;
  }

  // ---- Grand Concert performance tokens ----
  // Each training gives tokens of its primary type most of the time (secondary or another type
  // otherwise; the game shows which on the training), and friendship training gives a second
  // type too. Amounts: GameTora gives 10 (Wit 6) at level 1 with no cards; more cards, scenario
  // link cards and higher facility levels give more. The per-card amounts below are estimates.
  const GL_LINK = ["Silence Suzuka", "Agnes Tachyon", "Smart Falcon", "Mihono Bourbon", "Light Hello"];
  function tokenCap(state, sc) {
    return 200 + 50 * (sc.lives || []).filter((t) => t < state.turn).length;
  }
  function facilityRainbows(f, state) {
    if (Array.isArray(f.members) && f.members.length && Deck && state.deck) {
      return f.members.filter((i) => {
        const sl = state.deck.slots[i];
        const c = sl && Deck.card(sl.id);
        if (!c) return false;
        const bond = sl.bond != null ? sl.bond : Deck.initialBond(c, Deck.levelFor(c, sl.lb));
        return Deck.isRainbow(c, bond, f.stat);
      }).length;
    }
    return f.rainbows || 0;
  }
  function tokenGain(f, state, sc) {
    if (!sc.tokenOf || !sc.tokenOf[f.stat]) return [];
    const ex = f.extras || {};
    const L = facLevelFor(state, sc, f.stat);
    let cards = f.cards || 0;
    let links = 0;
    if (Array.isArray(f.members) && f.members.length && Deck && state.deck) {
      cards = f.members.length + (f.extra || 0);
      links = f.members.filter((i) => { const sl = state.deck.slots[i]; const c = sl && Deck.card(sl.id); return c && GL_LINK.indexOf(c.n) !== -1; }).length;
    }
    const est = (f.stat === "wit" ? 6 : 10) + 2 * (L - 1) + 3 * cards + 2 * links;
    const [pri, sec] = sc.tokenOf[f.stat];
    const out = [{ type: ex.tokType != null && ex.tokType !== "" ? +ex.tokType : pri, amount: ex.tok != null && ex.tok !== "" ? +ex.tok : est, est: !(ex.tok != null && ex.tok !== "") }];
    const rb = facilityRainbows(f, state) > 0;
    if (rb || (ex.tok2 != null && ex.tok2 !== "")) {
      const t2 = ex.tokType2 != null && ex.tokType2 !== "" ? +ex.tokType2 : (out[0].type === sec ? pri : sec);
      out.push({ type: t2, amount: ex.tok2 != null && ex.tok2 !== "" ? +ex.tok2 : Math.round(est * 0.6), est: !(ex.tok2 != null && ex.tok2 !== ""), second: true });
    }
    return out;
  }

  // ---- Grand Concert songs ----
  // Extra Stat Gain songs add a permanent flat bonus right away; Friendship Bonus songs start
  // working after the next live (lessons bought on a live turn count for that live).
  function songBonuses(state, sc) {
    const out = { extra: { speed: 0, stamina: 0, power: 0, guts: 0, wit: 0, sp: 0 }, fb: 0, pendingFb: 0 };
    if (!sc.songs) return out;
    const learned = (state.gl && state.gl.songs) || {};
    sc.songs.forEach((song) => {
      const t = learned[song.id];
      if (t == null) return;
      Object.entries(song.extra || {}).forEach(([k, v]) => { out.extra[k] += v; });
      if (song.fb) {
        const live = sc.lives.find((l) => l >= t);
        if (live != null && state.turn > live) out.fb += song.fb; else out.pendingFb += song.fb;
      }
    });
    return out;
  }

  // Songs learned since the last live (3 fill the Hype gauge) and the next live turn.
  function hypeStatus(state, sc) {
    if (!sc.songs) return null;
    const learned = (state.gl && state.gl.songs) || {};
    const next = sc.lives.find((l) => l >= state.turn);
    const prev = sc.lives.filter((l) => l < state.turn).pop() || 0;
    const since = Object.values(learned).filter((t) => t > prev && t <= (next || 99)).length;
    return { next, prev, since, need: Math.max(0, 3 - since), turnsToLive: next != null ? next - state.turn : null };
  }

  // Ranks songs you can learn now: value of the bonus over the rest of the run per token spent,
  // with a big push for songs that are still needed to fill the Hype gauge before the next live.
  function songAdvice(state, sc) {
    if (!sc.songs) return [];
    const learned = (state.gl && state.gl.songs) || {};
    const tokens = (state.gl && state.gl.tokens) || [0, 0, 0, 0, 0];
    const build = BUILDS[state.build] || BUILDS.medium;
    const left = Math.max(0, sc.totalTurns - state.turn);
    const hype = hypeStatus(state, sc);
    return sc.songs.filter((song) => learned[song.id] == null && song.from <= state.turn).map((song) => {
      let v = 0;
      Object.entries(song.extra || {}).forEach(([k, n]) => { v += k === "sp" ? n * SP_VALUE * left * 0.75 : n * build.w[k] * left * 0.2; });
      Object.entries(song.once || {}).forEach(([k, n]) => { v += k === "sp" ? n * SP_VALUE : n * build.w[k]; });
      // Friendship %: about 45% of the remaining turns are friendship trainings worth ~30 weighted stats.
      if (song.fb) v += (song.fb / 100) * 0.45 * left * 30 * build.w.speed * 0.75;
      if (hype && hype.need > 0) v += 25;
      const cost = song.cost.reduce((a, b) => a + b, 0);
      const short = song.cost.map((c, i) => Math.max(0, c - (tokens[i] || 0)));
      return { song, value: v, perToken: v / Math.max(1, cost), affordable: short.every((x) => x === 0), short };
    }).sort((a, b) => (b.affordable - a.affordable) || (b.perToken - a.perToken));
  }

  // ---- Friend / Group card outings ----
  // Outings with Pal-type cards (e.g. Light Hello) beat a normal outing: energy, mood, stats, bond.
  // Values are approximate until exact event data is loaded.
  function outingOptions(ctx) {
    const { state, deck, typ } = ctx;
    if (!deck || ctx.camp || state.goalRace) return [];
    return deck.used.filter((sl) => (sl.card.ty === "friend" || sl.card.ty === "group")).map((sl) => {
      const raw = state.deck.slots[sl.idx] || {};
      const d = raw.dates || {};
      if (!d.unlocked) return null;
      const n = (d.done || 0) + 1;
      const last = n >= 5;
      const energy = 20;
      const parts = {
        energy: ctx.energyValue(energy),
        mood: ctx.moodStep(state.mood),
        stats: (last ? 25 : 12) * ctx.avgW,
        bond: 0.04 * typ
      };
      return {
        kind: "recreation", outing: sl.idx,
        label: "Outing with " + sl.card.n,
        energyDelta: energy, moodDelta: state.mood < 4 ? 1 : 0, prefix: [], consume: {},
        notes: ["outing " + n + " with " + sl.card.n + ": energy, mood, stats and bond (approximate until event data is loaded)"].concat(state.mood >= 4 ? ["mood is already Great, but the outing still pays stats and energy"] : []),
        parts, value: sumParts(parts)
      };
    }).filter(Boolean);
  }

  function deckGain(f, ctx) {
    const { state, sc, deck } = ctx;
    if (!deck || !sc.train || !Array.isArray(f.members)) return null;
    const members = f.members.map((i) => deck.slots[i]).filter(Boolean);
    const L = facLevelFor(state, sc, f.stat);
    const genre = f.extras && f.extras.genre;
    const row = sc.trainByGenre && genre && sc.trainByGenre[genre] ? sc.trainByGenre[genre][f.stat] : sc.train[f.stat];
    const r = Deck.trainingGain(row, f.stat, members, {
      facilityLevel: L, extra: f.extra || 0, mood: state.mood, growth: deck.growth,
      energy: ctx.E, maxEnergy: ctx.maxE, deckTypes: deck.deckTypes, totalBond: deck.totalBond,
      flat: { main: ctx.songs.extra[f.stat] || 0, sp: ctx.songs.extra.sp || 0 }, fbBonus: ctx.songs.fb
    });
    const boost = ctx.boost;
    r.level = L;
    r.boost = boost;
    r.rawTotal = r.total;
    r.gains = r.gains.map((g) => g * boost);
    r.total = r.gains.reduce((a, b) => a + b, 0);
    r.sp *= boost;
    r.members = members;
    return r;
  }

  function sumParts(p) {
    return Object.keys(p).reduce((a, k) => a + p[k], 0);
  }

  function trainingOption(f, ctx) {
    const { state, sc, typ } = ctx;
    const hook = HOOKS[sc.hook] || {};
    const est = !(f.gain > 0);
    const dg = deckGain(f, ctx);
    const failBlank = f.fail === null || f.fail === undefined || f.fail === "";
    const statGains = {};
    let gain, cards, rainbows, unbonded, spPts, energyDelta, fail;
    if (dg) {
      // Card formula. A typed total gain rescales the formula's split across stats.
      const scale = !est && dg.total > 0 ? +f.gain / dg.total : 1;
      STATS.forEach((st, i) => { if (dg.gains[i] > 0) statGains[st] = dg.gains[i] * scale; });
      gain = est ? dg.total : +f.gain;
      if (!est && !(dg.total > 0)) Object.keys(FACILITY[f.stat].split).forEach((st) => { statGains[st] = gain * FACILITY[f.stat].split[st]; });
      cards = dg.cards;
      rainbows = dg.rainbows;
      unbonded = dg.unbonded;
      spPts = dg.sp * scale;
      energyDelta = dg.energy;
      fail = failBlank ? Math.round(estimateFail(f.stat, ctx.E) * dg.failMult) : clamp(+f.fail, 0, 100);
    } else {
      cards = f.cards || 0;
      rainbows = Math.min(f.rainbows || 0, cards);
      gain = est ? estimateGain(f, state, sc, ctx.calib) * (rainbows && ctx.songs.fb ? 1 + ctx.songs.fb / 100 : 1) + (ctx.songs.extra[f.stat] || 0) : +f.gain;
      Object.keys(FACILITY[f.stat].split).forEach((st) => { statGains[st] = gain * FACILITY[f.stat].split[st]; });
      unbonded = Math.min(f.unbonded || 0, cards - rainbows);
      spPts = gain * SP_RATE[f.stat];
      const ec = energyCost(f.stat, state.turn, sc, facLevelFor(state, sc, f.stat));
      energyDelta = ec < 0 ? -ec + 2 * rainbows : -ec;
      fail = failBlank ? estimateFail(f.stat, ctx.E) : clamp(+f.fail, 0, 100);
    }
    let stats = 0;
    Object.keys(statGains).forEach((st) => { stats += ctx.gainValue(st, statGains[st]); });
    const o = {
      kind: "train",
      stat: f.stat,
      label: "Train " + STAT_LABELS[f.stat],
      gain, gainEst: est, fail, failEst: failBlank, cards, rainbows, statGains,
      formula: dg ? { level: dg.level, boost: dg.boost, sp: Math.round(spPts) } : null,
      energyDelta,
      moodDelta: 0,
      notes: [],
      prefix: [],
      consume: {},
      parts: {
        stats,
        sp: spPts * SP_VALUE,
        bond: unbonded * bondK(state.turn) * typ,
        hint: (dg ? (f.hints || []).filter((i) => (f.members || []).indexOf(i) !== -1).length : f.hint ? 1 : 0) * 0.12 * typ,
        scenario: 0
      }
    };
    if (dg && dg.members.length) {
      const names = dg.members.map((m) => m.card.n + (Deck.isRainbow(m.card, m.bond, f.stat) ? " (friendship)" : m.bond < 80 ? " (bond " + Math.round(m.bond) + ")" : ""));
      o.notes.push(names.join(", "));
    }
    if (rainbows >= 2) o.notes.push(rainbows + " friendship cards stacked");
    else if (rainbows === 1) o.notes.push("1 friendship card");
    if (o.parts.bond >= 0.1 * typ) o.notes.push(unbonded + " card(s) still building bond");
    if (o.parts.hint > 0) o.notes.push(dg ? (f.hints || []).filter((i) => (f.members || []).indexOf(i) !== -1).length + " skill hint(s), with extra bond" : "skill hint");
    if (hook.facility) {
      const r = hook.facility(f, ctx, o) || {};
      o.parts.scenario += r.add || 0;
      if (r.energy) o.energyDelta += r.energy;
      if (r.fail0) { o.fail = 0; o.failEst = false; }
      if (r.note) o.notes.push(r.note);
    }
    o.raw = o.parts.stats + o.parts.sp + o.parts.bond + o.parts.hint + o.parts.scenario;
    scoreRisk(o, ctx);
    return o;
  }

  // Energy and failure parts of a training (re-run when an item changes cost or failure).
  function scoreRisk(o, ctx) {
    const hook = HOOKS[ctx.sc.hook] || {};
    const mood = ctx.state.mood;
    o.parts.energy = ctx.energyValue(o.energyDelta);
    const failMult = hook.failMult ? hook.failMult(ctx) : 1;
    const moodDrop = mood > 0 ? ctx.moodStep(mood - 1) : 0;
    let risk = -(o.fail / 100) * (o.raw + 0.5 * ctx.typ + moodDrop) * failMult;
    if (o.fail > ctx.state.risk) risk -= ((o.fail - ctx.state.risk) / 100) * ctx.typ * 2;
    o.parts.risk = risk;
    o.value = sumParts(o.parts);
  }

  function isStrong(o, ctx) {
    return o.kind === "train" && (o.raw >= 1.3 * ctx.typ || o.rainbows >= 2 || (ctx.camp && o.raw >= ctx.typ));
  }

  function bestTraining(options) {
    return options.filter((o) => o.kind === "train").sort((a, b) => b.value - a.value)[0];
  }

  function evaluate(state, sc) {
    const ctx = makeCtx(state, sc);
    const hook = HOOKS[sc.hook] || {};
    const { typ, E } = ctx;
    const options = state.facilities.map((f) => trainingOption(f, ctx));
    const facOpts = options.slice();

    const forced = forcedTurns(state, sc).has(state.turn) || state.goalRace;
    if (forced) {
      const finale = sc.finale && sc.finale.forced && sc.finale.turns.indexOf(state.turn) !== -1;
      options.push({
        kind: "race", forced: true,
        label: finale ? "Race: " + sc.finale.name : "Run your goal race",
        energyDelta: -RACE_ENERGY, moodDelta: 0, prefix: [], consume: {},
        notes: [finale ? "Finale race turn." : "This turn holds a goal race. Missing it ends the career."],
        parts: { goal: 1e5 }, value: 1e5
      });
    } else {
      const camp = ctx.camp;
      const restParts = {
        energy: REST_OUTCOMES.reduce((a, [g, p]) => a + p * ctx.energyValue(camp ? 40 : g), 0),
        mood: camp ? ctx.moodStep(state.mood) : 0
      };
      options.push({
        kind: "rest", label: camp ? "Rest (camp outing)" : "Rest",
        energyDelta: camp ? 40 : 50, moodDelta: camp ? 1 : 0, prefix: [], consume: {},
        notes: [camp ? "camp rest restores 40 energy and lifts mood" : "restores about 50 energy (30 to 70)"]
          .concat(camp && E >= 60 && state.mood < 4 ? ["you need about one rest per camp anyway; taking it now gives better mood for the remaining camp turns"] : [])
          .concat(!camp && isCamp(state.turn + 1, sc) ? ["camp starts next turn, so energy now pays off over four max-level turns"] : []),
        parts: restParts, value: sumParts(restParts)
      });
      if (!camp) {
        const recParts = { energy: ctx.energyValue(10), mood: ctx.moodStep(state.mood) };
        options.push({
          kind: "recreation", label: "Recreation (outing)",
          energyDelta: 10, moodDelta: state.mood < 4 ? 1 : 0, prefix: [], consume: {},
          notes: state.mood < 4 ? ["mood is " + MOODS[state.mood] + "; +1 mood is about +10% on every training"] : ["mood is already Great"],
          parts: recParts, value: sumParts(recParts)
        });
      }
      outingOptions(ctx).forEach((o) => options.push(o));
      if (state.badCondition) {
        const p = { condition: 0.7 * typ * Math.min(1, ctx.turnsLeft / 10), energy: ctx.energyValue(20) };
        options.push({
          kind: "infirmary", label: "Infirmary", energyDelta: 20, moodDelta: 0, prefix: [], consume: { badCondition: false },
          notes: ["clears the bad condition before it costs more mood, energy or stats"], parts: p, value: sumParts(p)
        });
      }
      if (state.race && RACES[state.race]) {
        const r = RACES[state.race];
        const rb = 1 + (ctx.deck ? ctx.deck.raceBonus : state.raceBonus || 0) / 100;
        const consec = (state.extras && state.extras.consec) || 0;
        const p = {
          stats: r.stats * rb * ctx.avgW,
          sp: r.sp * rb * SP_VALUE,
          fans: 0.05 * typ,
          energy: ctx.energyValue(-RACE_ENERGY),
          // Back-to-back racing: a 3rd race is fine, a 4th+ risks bad conditions and mood drops.
          risk: consec >= 3 ? -(1.2 + (consec - 3) * 1.3) * typ : consec === 2 ? -0.2 * typ : 0
        };
        const o = {
          kind: "race", label: "Race (" + r.label + ")", energyDelta: -RACE_ENERGY, moodDelta: 0, prefix: [], consume: {},
          notes: ["about " + Math.round(r.sp * rb) + " skill points if you win"], parts: p
        };
        if (consec >= 3) o.notes.push(consec + " races in a row already; another one risks a bad condition or mood drop");
        if (hook.race) {
          const x = hook.race(ctx, state.race) || {};
          p.scenario = x.add || 0;
          if (x.note) o.notes.push(x.note);
        }
        o.value = sumParts(p);
        options.push(o);
      }
      if (hook.actions) hook.actions(ctx, facOpts).forEach((a) => options.push(Object.assign({ prefix: [], notes: [], consume: {}, moodDelta: 0, energyDelta: 0 }, a, { value: sumParts(a.parts) })));
    }
    options.forEach((o) => { if (o.value === undefined) o.value = sumParts(o.parts); });
    options.sort((a, b) => b.value - a.value);
    if (hook.items) {
      hook.items(ctx, options);
      options.sort((a, b) => b.value - a.value);
    }
    return { options, ctx };
  }

  const PART_LABELS = {
    stats: "stat gains", sp: "skill points", bond: "bond building", hint: "skill hint", scenario: "scenario bonus",
    energy: "energy", mood: "mood", risk: "failure risk", condition: "curing the condition", fans: "fans", item: "item or buff", goal: "goal race"
  };

  function recommend(state, scenario) {
    const { options, ctx } = evaluate(state, scenario);
    const best = options[0];
    const second = options[1];
    const reasons = best.notes.slice();
    if (best.kind === "train") {
      const top = Object.entries(best.statGains).filter(([, g]) => g >= 1).sort((a, b) => b[1] - a[1]);
      reasons.unshift((best.gainEst ? "about " : "") + top.map(([s, g]) => STAT_LABELS[s] + " +" + Math.round(g)).join(", ") + (best.gainEst ? " (estimated)" : ""));
      if (best.fail > 0) reasons.push(best.fail + "% failure" + (best.failEst ? " (estimated from energy)" : "") + (best.fail > state.risk ? ", above your limit, but still the best option" : ""));
    }
    let versus = null;
    if (second && !best.forced) {
      const keys = new Set(Object.keys(best.parts).concat(Object.keys(second.parts)));
      let bigKey = null;
      let big = -Infinity;
      keys.forEach((k) => {
        const d = (best.parts[k] || 0) - (second.parts[k] || 0);
        if (d > big) { big = d; bigKey = k; }
      });
      versus = { label: second.label, gap: best.value - second.value, because: PART_LABELS[bigKey] || bigKey };
    }
    let confidence = "clear pick";
    if (versus) {
      const rel = versus.gap / Math.max(1, ctx.typ);
      if (rel < 0.08) confidence = "close call";
      else if (rel < 0.25) confidence = "good pick";
    }
    const after = {
      energy: clamp(Math.round(ctx.E + (best.energyDelta || 0)), 0, ctx.maxE),
      mood: clamp(state.mood + (best.moodDelta || 0), 0, 4)
    };
    return {
      action: best,
      headline: (best.prefix.length ? best.prefix.join(" → ") + " → " : "") + best.label,
      reasons,
      confidence,
      versus,
      ranked: options,
      after,
      typ: ctx.typ,
      calib: ctx.calib,
      phase: phaseFor(state.turn, scenario),
      events: eventsFor(state.turn, scenario, state),
      turn: turnInfo(state.turn, scenario)
    };
  }

  // Applies a chosen option and moves to the next turn. Returns the new state (does not mutate).
  function advance(state, scenario, option) {
    const s = JSON.parse(JSON.stringify(state));
    const maxE = s.maxEnergy || 100;
    s.extras = s.extras || {};
    s.energy = clamp(Math.round(s.energy + (option.energyDelta || 0)), 0, maxE);
    s.mood = clamp(s.mood + (option.moodDelta || 0), 0, 4);
    if (option.kind === "train" && s.trackStats && option.statGains) {
      s.stats = s.stats || {};
      Object.entries(option.statGains).forEach(([k, g]) => { if (s.stats[k] > 0) s.stats[k] = Math.round(s.stats[k] + g); });
    }
    s.extras.consec = option.kind === "race" ? (s.extras.consec || 0) + 1 : 0;
    // Fixed scenario events at the end of this turn (e.g. URA's summer snack: +30 energy).
    const evE = (scenario.energyEvents && scenario.energyEvents[state.turn]) || 0;
    const evM = (scenario.moodEvents && scenario.moodEvents[state.turn]) || 0;
    if (evE) s.energy = clamp(s.energy + evE, 0, maxE);
    if (evM) s.mood = clamp(s.mood + evM, 0, 4);
    Object.entries(option.consume || {}).forEach(([k, v]) => {
      if (k === "badCondition") s.badCondition = v;
      else s.extras[k] = typeof v === "function" ? v(s.extras[k]) : v;
    });
    const hook = HOOKS[scenario.hook] || {};
    if (hook.afterTurn) hook.afterTurn(s, option, scenario);
    // Deck bonds: +7 for every card that trained with you this turn.
    if (option.kind === "train" && s.deck && s.deck.slots) {
      const fac = s.facilities.find((f) => f.stat === option.stat);
      (fac && fac.members || []).forEach((i) => {
        const sl = s.deck.slots[i];
        if (!sl || !sl.id) return;
        const c = Deck && Deck.card(sl.id);
        const start = sl.bond != null ? sl.bond : (c ? Deck.initialBond(c, Deck.levelFor(c, sl.lb)) : 0);
        const hinted = (fac.hints || []).indexOf(i) !== -1;
        sl.bond = Math.min(100, start + (Deck ? Deck.BOND_PER_TRAINING : 7) + (hinted ? (Deck ? Deck.BOND_PER_HINT : 5) : 0));
      });
    }
    if (option.outing != null && s.deck && s.deck.slots[option.outing]) {
      const sl = s.deck.slots[option.outing];
      const c = Deck && Deck.card(sl.id);
      const start = sl.bond != null ? sl.bond : (c ? Deck.initialBond(c, Deck.levelFor(c, sl.lb)) : 0);
      sl.bond = Math.min(100, start + (Deck ? Deck.BOND_PER_DATE : 5));
      sl.dates = Object.assign({ unlocked: true, done: 0 }, sl.dates);
      sl.dates.done += 1;
    }
    // Learn deck strength (and the formula's scenario multiplier) from real or formula gains.
    const entered = s.facilities.filter((f) => f.gain > 0);
    let bestGain = entered.length ? Math.max.apply(null, entered.map((f) => f.gain)) : 0;
    const ctx = deckInfo(state) && scenario.train ? makeCtx(state, scenario) : null;
    if (ctx) {
      state.facilities.forEach((f) => {
        const dg = deckGain(f, ctx);
        if (!dg) return;
        if (f.gain > 0 && dg.rawTotal > 0) s.fcal = (s.fcal || []).concat([f.gain / (dg.rawTotal * defaultBoost(scenario))]).slice(-12);
        if (!bestGain) bestGain = Math.max(bestGain, dg.total);
      });
    }
    if (bestGain > 0) {
      s.calib = (s.calib || []).concat([bestGain / (typGainAt(s.turn, scenario) * (scenario.gainScale || 1))]).slice(-12);
    }
    s.log = (s.log || []).concat([{
      turn: s.turn,
      label: (option.prefix && option.prefix.length ? option.prefix.join(" → ") + " → " : "") + option.label,
      kind: option.kind,
      stat: option.stat || null,
      energy: state.energy,
      mood: state.mood,
      snapshot: JSON.stringify(Object.assign({}, state, { log: undefined }))
    }]).slice(-90);
    s.turn = Math.min(scenario.totalTurns, s.turn + 1);
    s.facilities = s.facilities.map((f) => ({ stat: f.stat, gain: null, cards: 0, rainbows: 0, unbonded: 0, hint: false, fail: null, extras: {}, members: [], hints: [], extra: 0 }));
    s.goalRace = (s.goals || []).indexOf(s.turn) !== -1;
    s.race = "";
    return s;
  }

  function undo(state) {
    const log = state.log || [];
    if (!log.length) return state;
    const last = log[log.length - 1];
    const prev = JSON.parse(last.snapshot);
    prev.log = log.slice(0, -1);
    return prev;
  }

  // Scenario rules. Each hook can define:
  //  facility(f, ctx, o) -> {add, energy, fail0, note}   extra value on one training
  //  race(ctx, grade)    -> {add, note}                  extra value on an optional race
  //  actions(ctx, trainingOptions) -> [option]           scenario-only actions
  //  items(ctx, options)  mutates or adds options for items and buffs used before acting
  //  failMult(ctx)        weight on failure risk
  //  afterTurn(state, option, scenario)  bookkeeping when moving to the next turn
  function useOn(o, ctx, prefix, itemValue, note, consume) {
    o.prefix.push(prefix);
    o.parts.item = (o.parts.item || 0) + itemValue;
    if (note) o.notes.push(note);
    Object.assign(o.consume, consume || {});
    o.value = sumParts(o.parts);
  }

  function variant(o) {
    return Object.assign({}, o, { parts: Object.assign({}, o.parts), prefix: o.prefix.slice(), notes: o.notes.slice(), consume: Object.assign({}, o.consume), statGains: Object.assign({}, o.statGains || {}) });
  }

  function statsValue(ctx, obj) {
    return Object.entries(obj).reduce((a, [k, v]) => a + (k === "sp" ? v * SP_VALUE : ctx.gainValue(k, v)), 0);
  }

  // Re-scores a training as if energy were `e2` (items that restore energy before training).
  function withEnergy(o, ctx, e2) {
    const v = variant(o);
    const drop = estimateFail(o.stat, ctx.E) - estimateFail(o.stat, e2);
    v.fail = Math.max(0, Math.round(o.fail - drop));
    v.parts.energy = ctx.V[clamp(Math.round(e2 + o.energyDelta + ctx.evNow), 0, ctx.maxE)] - ctx.V[clamp(ctx.E + ctx.evNow, 0, ctx.maxE)];
    const moodDrop = ctx.state.mood > 0 ? ctx.moodStep(ctx.state.mood - 1) : 0;
    v.parts.risk = -(v.fail / 100) * (o.raw + 0.5 * ctx.typ + moodDrop) - (v.fail > ctx.state.risk ? ((v.fail - ctx.state.risk) / 100) * ctx.typ * 2 : 0);
    v.value = sumParts(v.parts);
    return v;
  }

  // Unity Cup tables (GameTora, after the July 2026 update).
  const UNITY_SPECIAL = {
    speed: { 2: { speed: 2, sp: 1 }, 3: { speed: 4, power: 1, sp: 3 }, 4: { speed: 6, power: 3, sp: 5 }, 5: { speed: 10, power: 5, sp: 7 } },
    stamina: { 2: { stamina: 2, sp: 1 }, 3: { stamina: 4, guts: 1, sp: 3 }, 4: { stamina: 6, guts: 3, sp: 5 }, 5: { stamina: 10, guts: 5, sp: 7 } },
    power: { 2: { power: 2, sp: 1 }, 3: { power: 4, stamina: 1, sp: 3 }, 4: { power: 6, stamina: 3, sp: 5 }, 5: { power: 10, stamina: 5, sp: 7 } },
    guts: { 2: { guts: 2, sp: 1 }, 3: { guts: 4, speed: 1, power: 1, sp: 3 }, 4: { guts: 6, speed: 2, power: 2, sp: 5 }, 5: { guts: 10, speed: 3, power: 3, sp: 7 } },
    wit: { 2: { wit: 1 }, 3: { wit: 2, sp: 2 }, 4: { wit: 4, speed: 1, sp: 4 }, 5: { wit: 6, speed: 2, sp: 6 } }
  };
  const UNITY_BURST = {
    speed: { speed: 15, power: 7, sp: 5 }, stamina: { stamina: 15, guts: 7, sp: 5 }, power: { stamina: 7, power: 15, sp: 5 },
    guts: { speed: 3, power: 3, guts: 15, sp: 5 }, wit: { speed: 2, wit: 15, sp: 5 }
  };
  const UNITY_EXTREME = {
    speed: { speed: 20, power: 10, sp: 15 }, stamina: { stamina: 20, guts: 10, sp: 15 }, power: { stamina: 10, power: 20, sp: 15 },
    guts: { speed: 5, power: 5, guts: 20, sp: 15 }, wit: { speed: 5, wit: 15, sp: 15 }
  };
  const COIN = 0.015; // value of one Trackblazer shop coin, as a share of a typical turn
  const VITA_COST = { 20: 35, 40: 55, 65: 75 };

  const HOOKS = {
    ura: {
      facility(f, ctx) {
        if (!(f.extras && f.extras.meek)) return null;
        // A win pays 10-25 of the stat, 30 SP, +4 to its cap, +4 max energy and an Essence of Racing hint.
        const add = ctx.gainValue(f.stat, 17) + 30 * SP_VALUE + 0.12 * ctx.typ;
        return { add, note: "Happy Meek duel: about +17 " + STAT_LABELS[f.stat] + ", 30 SP, +4 cap and max energy and a hint, if the training succeeds" };
      }
    },

    unity: {
      facility(f, ctx) {
        const x = f.extras || {};
        const t = ctx.state.turn;
        let add = 0;
        let energy = 0;
        const notes = [];
        const fl = Math.min(5, x.flames || 0);
        if (fl >= 2) {
          add += statsValue(ctx, UNITY_SPECIAL[f.stat][fl]);
          notes.push("Special Training with " + fl + " flames");
        }
        // Flame teammates grow, which raises team rank (facility levels) and Unity Cup results.
        if (fl) add += fl * (t <= 60 ? 0.04 : 0.015) * ctx.typ;
        const zenith = ((ctx.state.extras && ctx.state.extras.bursts) || 0) < 13 ? 0.08 * ctx.typ : 0;
        const b = x.burst || 0;
        if (b) {
          add += b * (statsValue(ctx, UNITY_BURST[f.stat]) + 0.12 * ctx.typ + zenith);
          if (f.stat === "wit") energy += 5 * b;
          notes.push(b + " Spirit Burst" + (b > 1 ? "s" : "") + " (+15 " + STAT_LABELS[f.stat] + " each and a Lv2+ hint)");
        }
        if (x.extreme) {
          add += statsValue(ctx, UNITY_EXTREME[f.stat]) + 0.15 * ctx.typ + zenith;
          notes.push("Extreme Spirit Burst: big stats, a hint, and failure becomes 0%");
        }
        return { add, energy, fail0: !!x.extreme, note: notes.join(", ") };
      },
      afterTurn(s, option) {
        if (option.kind !== "train") return;
        const fac = s.facilities.find((f) => f.stat === option.stat);
        const x = (fac && fac.extras) || {};
        const n = (x.burst || 0) + (x.extreme ? 1 : 0);
        if (n) s.extras.bursts = (s.extras.bursts || 0) + n;
      }
    },

    trackblazer: {
      race(ctx, grade) {
        const x = ctx.state.extras || {};
        const gp = { g1: 100, g2: 80, g3: 60, op: 40 }[grade] || 30;
        const need = +(x.gpNeed || 0);
        let add = 70 * COIN * ctx.typ; // expected coins over likely placements
        if (need > 0) add += (Math.min(gp, need) / 100) * 0.6 * ctx.typ;
        else add += 0.1 * ctx.typ;
        return { add, note: "about " + gp + " Grade Points and 100 coins if you win" + (need > 0 ? " (" + need + " still needed)" : "") };
      },
      items(ctx, options) {
        const x = ctx.state.extras || {};
        const trains = options.filter((o) => o.kind === "train");
        if (x.charm) {
          const risky = trains.filter((o) => o.fail >= 8 && o.raw >= 0.9 * ctx.typ).sort((a, b) => b.raw - a.raw)[0];
          if (risky) {
            const v = variant(risky);
            v.fail = 0;
            v.failEst = false;
            v.parts.risk = 0;
            useOn(v, ctx, "Use Good-Luck Charm", -40 * COIN * ctx.typ, "Charm sets failure to 0%", { charm: false });
            options.push(v);
          }
        }
        const vita = +x.vita || 0;
        if (vita && ctx.E < ctx.maxE - 10) {
          const top = trains.slice().sort((a, b) => b.raw - a.raw)[0];
          if (top) {
            const v = withEnergy(top, ctx, Math.min(ctx.maxE, ctx.E + vita));
            useOn(v, ctx, "Drink Vita " + vita + " (no turn used)", -(VITA_COST[vita] || 50) * COIN * ctx.typ, "energy " + ctx.E + " → " + Math.min(ctx.maxE, ctx.E + vita) + " before training, instead of spending the turn resting", { vita: "0" });
            options.push(v);
          }
        }
        options.sort((a, b) => b.value - a.value);
        const best = bestTraining(options);
        const cup = +x.cupcake || 0;
        if (cup && ctx.state.mood < 4 && best && (isStrong(best, ctx) || ctx.state.mood <= 2)) {
          const steps = Math.min(cup, 4 - ctx.state.mood);
          let mv = 0;
          for (let i = 0; i < steps; i++) mv += ctx.moodStep(ctx.state.mood + i);
          useOn(best, ctx, "Eat the " + (cup === 2 ? "Berry Sweet" : "Plain") + " Cupcake (no turn used)", mv + best.parts.stats * 0.1 * steps - (cup === 2 ? 55 : 30) * COIN * ctx.typ, "mood +" + steps + " without spending a turn", { cupcake: "0" });
          best.moodDelta = steps;
        }
        const top = options[0];
        if (x.whistle && top && !top.forced && !ctx.camp && (!best || best.raw < 0.75 * ctx.typ)) {
          top.prefix.unshift("Try the Reset Whistle first (no turn used)");
          top.notes.push("every training is weak; the whistle reshuffles the cards for 20 coins, then re-enter the trainings");
        }
        const race = options.find((o) => o.kind === "race" && !o.forced);
        const hammer = +x.hammer || 0;
        if (hammer && race) useOn(race, ctx, "Use the +" + hammer + "% Cleat Hammer", (hammer / 100) * (race.parts.stats + race.parts.sp), "save hammers for G1s", { hammer: "0" });
        options.sort((a, b) => b.value - a.value);
        const b2 = bestTraining(options);
        if (!b2 || !isStrong(b2, ctx)) return;
        const mega = +x.megaphone || 0;
        if (mega) useOn(b2, ctx, "Use the +" + mega + "% Megaphone", b2.parts.stats * mega / 100 * 0.8, "Megaphone lasts " + ({ 20: 4, 40: 3, 60: 2 }[mega] || 2) + " turns from now", { megaphone: "0" });
        if (x.weights && b2.stat !== "wit") {
          const main = b2.statGains[b2.stat] || 0;
          useOn(b2, ctx, "Use Ankle Weights", ctx.gainValue(b2.stat, main * 0.5) - 50 * COIN * ctx.typ, "Ankle Weights: +50% " + STAT_LABELS[b2.stat] + ", +20% energy use", { weights: false });
          b2.energyDelta *= 1.2;
          b2.parts.energy = ctx.energyValue(b2.energyDelta);
          b2.value = sumParts(b2.parts);
        }
      }
    },

    grandlive: {
      // Done on a training adds its performance tokens (what you typed, else the estimate).
      afterTurn(s, option, sc) {
        if (option.kind !== "train") return;
        const f = s.facilities.find((x) => x.stat === option.stat);
        if (!sc || !f) return;
        s.gl = s.gl || { songs: {}, tokens: [0, 0, 0, 0, 0] };
        const cap = tokenCap(s, sc);
        tokenGain(f, s, sc).forEach((g) => { s.gl.tokens[g.type] = Math.min(cap, (s.gl.tokens[g.type] || 0) + Math.max(0, g.amount)); });
      },
      items(ctx, options) {
        const best = options[0];
        if (!best || ctx.state.turn < 5) return;
        const adv = songAdvice(ctx.state, ctx.sc);
        const buy = adv.find((a) => a.affordable);
        const hype = hypeStatus(ctx.state, ctx.sc);
        if (buy) {
          best.prefix.unshift("Learn " + buy.song.name + " (no turn used)");
          best.notes.push("you can afford a song now; lessons don't use a turn");
        }
        if (hype && hype.next != null && hype.need > 0 && hype.turnsToLive <= 4) {
          best.notes.push(hype.need + " more song(s) needed before the live on turn " + hype.next + " for a guaranteed Great Success");
        }
      }
    },

    grandmasters: {
      facility(f, ctx) {
        const n = (f.extras && f.extras.frag) || 0;
        return n ? { add: n * 0.08 * ctx.typ, note: n + " fragment" + (n > 1 ? "s" : "") + " toward the next Goddess Wisdom" } : null;
      },
      // Each Wisdom is tried on every training; the best version is offered as its own option.
      items(ctx, options) {
        const w = ctx.state.extras && ctx.state.extras.wisdom;
        if (!w) return;
        const trains = options.filter((o) => o.kind === "train");
        const mood = ctx.state.mood;
        const tries = trains.map((o) => {
          let v;
          if (w === "red") {
            v = withEnergy(o, ctx, Math.min(ctx.maxE, ctx.E + 50));
            const moodUp = MOOD_MULT[4] / MOOD_MULT[mood];
            let mv = 0;
            for (let i = mood; i < 4; i++) mv += ctx.moodStep(i);
            v.parts.item = o.parts.stats * (moodUp * 1.2 - 1) + mv;
            v.notes.push("+50 energy, mood to max and the facility trains past level 5 this turn");
          } else if (w === "blue") {
            v = variant(o);
            v.parts.item = o.cards * (0.12 * ctx.typ + 3 * ctx.avgW);
            v.notes.push("every card here (" + o.cards + ") gives a skill hint and a few stats");
          } else {
            v = variant(o);
            const extra = Math.max(0, o.cards - o.rainbows);
            v.parts.item = o.parts.stats * (Math.pow(1.3, extra) - 1);
            v.notes.push("all " + o.cards + " card(s) here count as friendship");
          }
          v.prefix.unshift("Obtain " + w[0].toUpperCase() + w.slice(1) + " Wisdom (no turn used)");
          v.consume = Object.assign({}, v.consume, { wisdom: "" });
          v.value = sumParts(v.parts);
          return v;
        }).sort((a, b) => b.value - a.value);
        if (tries[0]) options.push(tries[0]);
      }
    },

    larc: {
      facility(f, ctx, o) {
        const n = (f.extras && f.extras.star) || 0;
        if (!n) return null;
        if (ctx.camp) return { add: 0, note: "Star gauges don't fill during the France expedition" };
        const blocks = 1 + Math.min(f.rainbows || 0, f.cards || 0);
        return { add: n * blocks * (ctx.state.turn <= 60 ? 0.035 : 0.015) * ctx.typ, note: n + " member(s) +" + blocks + " Star block" + (blocks > 1 ? "s" : "") };
      },
      actions(ctx) {
        const m = (ctx.state.extras && ctx.state.extras.ss) || 0;
        if (!m || ctx.camp) return [];
        return [{
          kind: "scenario", label: "SS Match (" + m + " member" + (m > 1 ? "s" : "") + ")",
          parts: { scenario: 0.28 * ctx.typ * m + 0.1 * ctx.typ + (m >= 5 ? 0.3 * ctx.typ : 0) },
          notes: ["uses a turn but no energy; trains every stat and pays Supporter Points", m < 5 ? "waiting for 5 members makes it stronger and can trigger an SSS Match" : "5 members: chance of an SSS Match"],
          consume: { ss: 0 }
        }];
      }
    },

    uaf: {
      facility(f, ctx) {
        const x = f.extras || {};
        let add = 0;
        const notes = [];
        if (x.genre) {
          const link = ctx.state.facilities.filter((g) => g.extras && g.extras.genre === x.genre).length;
          if (link >= 2) {
            add += (link - 1) * 0.1 * ctx.typ;
            notes.push(link + "-sport " + x.genre + " Link Training");
          }
        }
        if (x.heat) {
          add += 0.45 * ctx.typ;
          notes.push("triggers a Heat-Up for the next 2 trainings");
        }
        return { add, note: notes.join(", ") };
      },
      items(ctx, options) {
        const x = ctx.state.extras || {};
        const left = x.consult != null ? +x.consult : 3;
        const counts = {};
        ctx.state.facilities.forEach((f) => { const g = f.extras && f.extras.genre; if (g) counts[g] = (counts[g] || 0) + 1; });
        const gs = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const top = options[0];
        if (left > 0 && gs.length >= 2 && gs[0][1] < 5 && top && !top.forced) {
          top.notes.push("consult Elfie (" + left + " left, no turn used) to swap " + gs[1][0] + " into " + gs[0][0] + " for a " + (gs[0][1] + gs[1][1]) + "-sport link, then re-enter");
        }
      }
    },

    cooking: {
      items(ctx, options) {
        const tier = +((ctx.state.extras && ctx.state.extras.dish) || 0);
        if (!tier || !ctx.sc.dishes) return;
        const t = ctx.state.turn;
        const pick = (stat) => {
          const list = ctx.sc.dishes.filter((d) => d.tier === tier && d.from <= t);
          return list.find((d) => d.stats.indexOf(stat) !== -1) || null;
        };
        const tries = options.filter((o) => o.kind === "train").map((o) => {
          const dish = pick(o.stat);
          if (!dish) return null;
          const v = variant(o);
          v.parts.item = o.parts.stats * dish.pct / 100 * 0.8 + (dish.energy ? ctx.energyValue(dish.energy) : 0);
          v.prefix.unshift("Cook " + dish.name);
          v.notes.push(dish.name + ": +" + dish.pct + "% to this training, this turn only");
          if (dish.energy) v.energyDelta += dish.energy;
          v.consume = Object.assign({}, v.consume, { dish: "0" });
          v.value = sumParts(v.parts);
          return v;
        }).filter(Boolean).sort((a, b) => b.value - a.value);
        const best = tries[0];
        if (best && (best.rainbows >= 2 || best.raw >= 1.2 * ctx.typ || ctx.camp || tier === 4)) options.push(best);
      }
    },

    mecha: {
      facility(f, ctx) {
        return f.extras && f.extras.gear ? { add: 0.12 * ctx.typ, note: "Mecha Gear: research and Overdrive gauge" } : null;
      },
      items(ctx, options) {
        const best = bestTraining(options);
        if (ctx.state.extras && ctx.state.extras.overdrive && best && isStrong(best, ctx)) {
          useOn(best, ctx, "Fire Overdrive", best.parts.stats * 0.3, "Overdrive on a strong training", { overdrive: false });
        }
      }
    },

    legends: {
      facility(f, ctx, o) {
        if (!(f.extras && f.extras.legend)) return null;
        const rb = Math.min(f.rainbows || 0, f.cards || 0) > 0;
        return { add: (rb ? 0.12 : 0.05) * ctx.typ, note: rb ? "legend + friendship: +3 Guidance" : "legend here: +1 Guidance" };
      },
      failMult(ctx) {
        return ctx.state.extras && ctx.state.extras.follow === "pink" ? 1.6 : 1;
      },
      items(ctx, options) {
        const x = ctx.state.extras || {};
        const best = bestTraining(options);
        if (!x.buff || !best) return;
        const campStart = isCamp(ctx.state.turn, ctx.sc) && !isCamp(ctx.state.turn - 1, ctx.sc);
        if (isStrong(best, ctx) || campStart) useOn(best, ctx, "Use the guidance buff", best.parts.stats * 0.25, x.follow === "blue" ? "Blue lasts 3 turns, best at the start of a strong stretch" : "buff on a strong training", { buff: false });
      }
    },

    island: {
      actions(ctx, trains) {
        const tickets = (ctx.state.extras && ctx.state.extras.tickets) || 0;
        const t = ctx.state.turn;
        if (!tickets || ctx.camp || t > 72) return [];
        const friendFacs = trains.filter((o) => o.rainbows > 0).length;
        let ok;
        if (t >= 61) ok = friendFacs >= 2 || ctx.turnsLeft <= tickets + 1;
        else if (t >= 49) ok = tickets > 3 ? friendFacs >= 2 : friendFacs >= 4;
        else ok = friendFacs >= 3 || (tickets > 3 && friendFacs >= 2);
        if (t <= 24 && friendFacs < 3) ok = false;
        if (!ok) return [];
        const total = trains.reduce((a, o) => a + o.parts.stats + o.parts.sp, 0);
        const notes = [friendFacs + " facilities with friendship", "no energy cost and can't fail"];
        if (t >= 49 && t < 61) notes.push("still worth it while banking tickets for the last half year");
        return [{ kind: "scenario", label: "Island Training", parts: { scenario: total * 0.5 + friendFacs * 0.1 * ctx.typ }, notes, consume: { tickets: (v) => Math.max(0, (v || 0) - 1) } }];
      }
    },

    onsen: {
      actions(ctx) {
        const x = ctx.state.extras || {};
        if (!x.pr || (x.baths || 0) > 0) return [];
        return [{
          kind: "scenario", label: "PR activity", energyDelta: -20,
          parts: { scenario: 0.45 * ctx.typ + 0.3 * ctx.typ, energy: ctx.energyValue(-20) },
          notes: ["always succeeds and gives a bath ticket", "costs as much energy as a training"],
          consume: { baths: (v) => Math.min(3, (v || 0) + 1) }
        }];
      },
      items(ctx, options) {
        const x = ctx.state.extras || {};
        const baths = x.baths || 0;
        const best = options[0];
        if (!best || !baths) return;
        if (!x.bathOn || baths >= 3) {
          best.prefix.unshift("Take a bath (no turn used)");
          best.notes.push(baths >= 3 ? "tickets at the 3 cap, so use one before more are lost" : "the bath boosts the next 2 turns; re-check energy and failure after it");
          best.parts.item = (best.parts.item || 0) + (best.kind === "train" ? best.parts.stats * 0.15 : 0.05 * ctx.typ);
          best.value = sumParts(best.parts);
          Object.assign(best.consume, { baths: (v) => Math.max(0, (v || 0) - 1), bathOn: true, bathLeft: 2 });
        }
      },
      afterTurn(s, option) {
        if (!(option.consume && option.consume.bathLeft)) {
          s.extras.bathLeft = Math.max(0, (s.extras.bathLeft || 0) - 1);
          s.extras.bathOn = s.extras.bathLeft > 0;
        } else {
          s.extras.bathLeft = 1;
        }
      }
    },

    dreams: {
      facility(f, ctx) {
        const x = f.extras || {};
        let add = 0;
        const notes = [];
        if (x.members) {
          add += x.members * (ctx.state.turn <= 60 ? 0.1 : 0.05) * ctx.typ;
          notes.push(x.members + " team member(s) for Dream gauge");
        }
        if (x.fullgauge) {
          add += x.fullgauge * 0.25 * ctx.typ;
          notes.push(x.fullgauge + " rank-up(s) ready");
        }
        return { add, note: notes.join(", ") };
      },
      actions(ctx, trains) {
        const x = ctx.state.extras || {};
        const left = x.dreamsLeft != null ? +x.dreamsLeft : 2;
        if (!left || ctx.state.turn > 72) return [];
        const t = ctx.state.turn;
        const end = [12, 24, 36, 48, 60, 72].find((h) => h >= t) || 72;
        const urgent = end - t + 1 <= left;
        const best = trains.slice().sort((a, b) => b.raw - a.raw)[0];
        const good = ctx.camp || ctx.E >= 60 || urgent;
        const delta = -energyCost(best.stat, t, ctx.sc);
        // Only 2 per half year: spending one now gives up using it on a better turn later
        // (camp, high energy), unless the half year is about to end.
        const reserve = urgent ? 0 : ctx.camp ? 0.3 * ctx.typ : 0.9 * ctx.typ;
        const gain = (best.parts.stats + best.parts.sp) * 1.6;
        const moodDrop = ctx.state.mood > 0 ? ctx.moodStep(ctx.state.mood - 1) : 0;
        return [{
          kind: "scenario", label: "DREAMS training (" + STAT_LABELS[best.stat] + ")", energyDelta: delta, fail: best.fail,
          parts: { scenario: gain - reserve, energy: ctx.energyValue(delta), risk: -(best.fail / 100) * (gain + 0.5 * ctx.typ + moodDrop) },
          notes: ["every card and member joins every facility", urgent ? left + " left and the half year ends on turn " + end + ": use it or lose it" : good ? "high-value turn" : "energy is low, so consider saving it"],
          consume: { dreamsLeft: (v) => Math.max(0, (v != null ? +v : 2) - 1) }
        }];
      },
      afterTurn(s) {
        if ([12, 24, 36, 48, 60].indexOf(s.turn) !== -1) s.extras.dreamsLeft = 2;
      }
    },

    ramen: {
      items(ctx, options) {
        const x = ctx.state.extras || {};
        const best = bestTraining(options);
        if (!best || !x.tasting) return;
        if (isStrong(best, ctx) || (x.tips || 0) >= 9 || ctx.camp) {
          useOn(best, ctx, "Hold a tasting session", best.parts.stats * 0.25, (x.tips || 0) >= 9 ? "tips are near the 10 cap" : "tasting right before a friendship training", { tasting: false });
        }
      }
    }
  };

  const api = {
    STATS, STAT_LABELS, MOODS, MOOD_MULT, BUILDS, RACES, FACILITY, HOOKS,
    turnInfo, phaseFor, eventsFor, isCamp, campTurns, recommend, evaluate, advance, undo,
    estimateFail, estimateGain, calibFactor, typAt, forcedTurns, deckInfo, facLevelFor, scenarioBoost,
    songBonuses, hypeStatus, songAdvice, tokenGain, tokenCap, facilityRainbows
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.UmaEngine = api;
})(typeof window !== "undefined" ? window : globalThis);
