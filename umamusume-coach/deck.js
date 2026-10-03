// Support card math: effect values at any level, unique effects, and the training gain formula.
// Effect interpolation is a port of GameTora's own function so values match its card pages.
(function (root) {
  const DATA = root.UmaData || (typeof require !== "undefined" ? require("./data/gametora.js") : null);
  const STATS = ["speed", "stamina", "power", "guts", "wit"];
  const MAX_LEVEL = { 3: 50, 2: 45, 1: 40 };
  const RARITY = { 3: "SSR", 2: "SR", 1: "R" };
  const MOOD_COEF = [-0.2, -0.1, 0, 0.1, 0.2];
  const BOND_FRIENDSHIP = 80;
  const BOND_PER_TRAINING = 7;

  const byId = new Map();
  const traineeById = new Map();
  if (DATA) {
    DATA.supports.forEach((c) => byId.set(c.id, c));
    DATA.trainees.forEach((t) => traineeById.set(t.id, t));
  }

  function levelFor(card, lb) {
    return MAX_LEVEL[card.r] - 20 + 5 * Math.max(0, Math.min(4, lb | 0));
  }

  // GameTora: effect arrays hold values at levels 1,5,10,...,50; -1 means "fill in".
  const tableCache = new WeakMap();
  function effectTable(arr) {
    if (tableCache.has(arr)) return tableCache.get(arr);
    const n = Array(51);
    const a = arr.slice(1);
    let s = -1;
    let i = -1;
    for (let e = 0; e < a.length; e++) {
      if (a[e] === -1 && s === -1) { for (let x = 5 * e; x < (e + 1) * 5 - 1; x++) n[x] = 0; continue; }
      if (a[e] !== -1 && i === -1) { n[5 * e] = a[e]; s = a[e]; i = e; continue; }
      if (a[e] === -1) continue;
      const step = i === 0 ? (a[e] - s) / (5 * e - 5 * i - 1) : (a[e] - s) / (5 * e - 5 * i);
      let c = s;
      for (let x = 5 * i + 1; x < 5 * e; x++) {
        if (x === 1) { n[x] = s; x = 2; }
        c += step;
        n[x] = Math.floor(+c.toFixed(10));
      }
      n[5 * e] = a[e]; s = a[e]; i = e;
    }
    let last = 0;
    for (let x = 0; x < 51; x++) { if (n[x] == null) n[x] = last; else last = n[x]; }
    tableCache.set(arr, n);
    return n;
  }

  function combine(id, a, b) {
    const meta = DATA && DATA.effects[id];
    if (meta && meta.c === "mult") return a * b / 100 + a + b;
    return a + b;
  }

  // Effects that always apply at this level: base effects plus simple unique effects.
  function baseEffects(card, level) {
    const out = {};
    card.e.forEach((arr) => { out[arr[0]] = effectTable(arr)[level]; });
    if (card.u && card.u.lv <= level) {
      card.u.e.forEach((u) => {
        if (u.type >= 100 && u.type !== 9991) return;
        out[u.type] = out[u.type] != null ? combine(u.type, out[u.type], u.value) : u.value;
      });
    }
    return out;
  }

  function conditionalUniques(card, level) {
    if (!card.u || card.u.lv > level) return [];
    return card.u.e.filter((u) => u.type >= 100 && u.type !== 9991);
  }

  // Effects in a specific training situation, including conditional unique effects.
  // sit: { bond, facStat, members, facilityLevel, energy, maxEnergy, deckTypes, totalBond, rainbow }
  function effectsIn(card, level, sit) {
    const out = Object.assign({}, baseEffects(card, level));
    const add = (id, v) => { if (v) out[id] = out[id] != null ? combine(id, out[id], v) : v; };
    conditionalUniques(card, level).forEach((u) => {
      switch (u.type) {
        case 101: if ((sit.bond || 0) >= u.value) { add(u.value_1, u.value_2); if (u.value_3) add(u.value_3, u.value_4); } break;
        case 102: if ((sit.bond || 0) >= u.value && sit.facStat !== card.ty) add(8, u.value_1); break;
        case 103: if ((sit.deckTypes || 0) >= u.value) add(8, u.value_1); break;
        case 104: add(8, u.value_1); break;
        case 106: add(u.value_1, Math.round(u.value * u.value_2 / 2)); break;
        case 107: add(u.value, u.value_4 + (u.value_3 - u.value_4) * (1 - Math.min(100, sit.energy || 0) / 100)); break;
        case 108: add(u.value, Math.min(u.value_4, u.value_3 + Math.max(0, (sit.maxEnergy || 100) - u.value_1) * u.value_2 / 100)); break;
        case 109: add(u.value, Math.min(600 / u.value_1, Math.floor((sit.totalBond || 0) / u.value_1))); break;
        case 110: add(u.value, u.value_1 * (sit.members || 1)); break;
        case 111: add(u.value, u.value_1 * (sit.facilityLevel || 1)); break;
        case 113: if (sit.rainbow) add(u.value, u.value_1); break;
        case 114: add(u.value, u.value_1 + (u.value_2 - u.value_1) * Math.min(100, sit.energy || 0) / 100); break;
        case 115: add(u.value, u.value_1); break;
        case 117: add(u.value, u.value_2 * Math.min(1, ((sit.facilityLevel || 1) * 5) / 25)); break;
        default: break;
      }
    });
    return out;
  }

  function effectName(id) {
    const m = DATA && DATA.effects[id];
    return m ? m.n : "Effect " + id;
  }

  function formatEffect(id, v) {
    const m = DATA && DATA.effects[id];
    const s = m ? m.s : "";
    if (s === "Lv") return "Lv " + v;
    return (Math.round(v * 10) / 10) + (s === "%" ? "%" : "");
  }

  function uniqueText(u) {
    const T = (DATA && DATA.uniqueText) || {};
    const fill = (tpl, o) => (tpl || "").replace(/\{(\w+)\}/g, (_, k) => (o[k] != null ? o[k] : "?"));
    const e = (id) => effectName(id);
    switch (u.type) {
      case 101: {
        const dbl = !!u.value_3;
        const key = "101" + (dbl ? "_double" : "") + (u.value === 100 ? "_full" : "");
        return fill(T[key], { e1: e(u.value_1), v1: u.value_2, e2: dbl ? e(u.value_3) : "", v2: u.value_4, minBond: u.value });
      }
      case 102: return fill(T["102"], { minBond: u.value, v: u.value_1 });
      case 103: return fill(T["103"], { n: u.value, v: u.value_1 });
      case 104: return fill(T["104"], { fans: u.value, max: u.value_1 });
      case 105: return fill(T["105"], { v: u.value, v2: u.value_1 });
      case 106: return fill(T["106"], { e: e(u.value_1), v: u.value_2, times: u.value, max: u.value * u.value_2 });
      case 107: return fill(T["107"], { e: e(u.value) });
      case 108: return fill(T["108"], { e: e(u.value), min: u.value_3, max: u.value_4 });
      case 109: return fill(T["109"], { e: e(u.value), step: u.value_1, max: 600 / u.value_1 });
      case 110: case 111: case 113: case 115: case 122: return fill(T[String(u.type)], { e: e(u.value), v: u.value_1 });
      case 112: return fill(T["112"], { v: u.value });
      case 114: return fill(T["114"], { e: e(u.value), min: u.value_1, max: u.value_2 });
      case 116: return fill(T["116"], { e: e(u.value_1), v: u.value_2, max: u.value_2 * u.value_3 });
      case 117: return fill(T["117"], { e: e(u.value), max: u.value_2 });
      case 118: return fill(T["118"], { minBond: u.value_1, n: u.value + 1 });
      case 119: return fill(T["119"], { minBond: u.value_2 });
      case 120: return fill(T["120"], { minBond: u.value_1, max: u.value_3 });
      case 121: return fill(T["121"], { v: u.value, v2: u.value_1 });
      default: return effectName(u.type) + " (" + u.value + ")";
    }
  }

  function card(id) { return byId.get(+id) || null; }
  function trainee(id) { return traineeById.get(+id) || null; }

  function onGlobal(item, today) {
    return !!(item.en && item.en <= (today || new Date().toISOString().slice(0, 10)));
  }

  function label(c) {
    return c.n + " [" + c.t + "] " + RARITY[c.r] + " " + typeLabel(c.ty);
  }

  function typeLabel(ty) {
    return { speed: "Speed", stamina: "Stamina", power: "Power", guts: "Guts", wit: "Wit", friend: "Friend", group: "Group" }[ty] || ty;
  }

  function initialBond(c, level) {
    return Math.min(100, baseEffects(c, level)[14] || 0);
  }

  // Can this card produce a friendship (rainbow) training on this facility?
  function isRainbow(c, bond, facStat) {
    if (bond < BOND_FRIENDSHIP) return false;
    if (c.ty === "group") return true;
    return c.ty === facStat;
  }

  // Training gain from the game's formula:
  //   floor((base + stat bonus) x friendship x mood x training effect x (1 + 0.05 x members) x growth)
  // row: [speed, stamina, power, guts, wit, skillPts, energy] at facility level 1.
  // members: [{ card, level, bond }] deck cards on this training. extra: other characters on it.
  function trainingGain(row, facStat, members, opts) {
    const o = opts || {};
    const L = Math.max(1, Math.min(5, o.facilityLevel || 1));
    const n = members.length + (o.extra || 0);
    const deckTypes = o.deckTypes || 0;
    const totalBond = o.totalBond || 0;
    let fm = 1;
    let te = 0;
    let me = 0;
    let sp = 0;
    let all = 0;
    let failMult = 1;
    let costMult = 1;
    let witRecovery = 0;
    const bonus = [0, 0, 0, 0, 0];
    const rainbowCards = [];
    const anyRainbow = members.some((m) => isRainbow(m.card, m.bond, facStat));
    members.forEach((m) => {
      const rb = isRainbow(m.card, m.bond, facStat);
      const eff = effectsIn(m.card, m.level, {
        bond: m.bond, facStat, members: n, facilityLevel: L, energy: o.energy, maxEnergy: o.maxEnergy, deckTypes, totalBond, rainbow: anyRainbow
      });
      if (rb) { fm *= 1 + (eff[1] || 0) / 100; rainbowCards.push(m); if (facStat === "wit") witRecovery += eff[31] || 0; }
      te += eff[8] || 0;
      me += eff[2] || 0;
      sp += eff[30] || 0;
      all += eff[41] || 0;
      for (let i = 0; i < 5; i++) bonus[i] += eff[3 + i] || 0;
      if (eff[27]) failMult *= 1 - eff[27] / 100;
      if (eff[28]) costMult *= 1 - eff[28] / 100;
    });
    const moodCoef = MOOD_COEF[o.mood != null ? o.mood : 2];
    const moodMult = 1 + (moodCoef > 0 ? moodCoef * (1 + me / 100) : moodCoef);
    const common = fm * moodMult * (1 + te / 100) * (1 + 0.05 * n);
    const mainIdx = STATS.indexOf(facStat);
    const growth = o.growth || [0, 0, 0, 0, 0];
    const gains = row.slice(0, 5).map((b, i) => {
      if (!(b > 0)) return 0;
      const lvAdd = i === mainIdx ? L - 1 : Math.floor((L - 1) / 2);
      return Math.min(100, Math.floor((b + lvAdd + bonus[i] + all) * common * (1 + (growth[i] || 0) / 100)));
    });
    const skill = Math.floor((row[5] + sp) * common);
    const baseEnergy = row[6];
    const energy = baseEnergy < 0 ? (baseEnergy - 1.5 * (L - 1)) * costMult : baseEnergy + witRecovery;
    return {
      gains,
      total: gains.reduce((a, b) => a + b, 0),
      sp: skill,
      energy,
      failMult,
      rainbows: rainbowCards.length,
      unbonded: members.filter((m) => m.bond < BOND_FRIENDSHIP).length,
      cards: n
    };
  }

  // Suggests a build from a trainee's aptitudes: [turf, dirt, sprint, mile, medium, long, front, pace, late, end].
  function suggestBuild(t) {
    const rank = (g) => "GFEDCBAS".indexOf(g);
    const apt = t.apt;
    const dists = [["sprint", apt[2]], ["mile", apt[3]], ["medium", apt[4]], ["long", apt[5]]];
    dists.sort((a, b) => rank(b[1]) - rank(a[1]));
    if (rank(apt[1]) >= rank("A") && rank(apt[0]) < rank("A")) return "dirt";
    return dists[0][0];
  }

  const api = {
    DATA, STATS, RARITY, BOND_FRIENDSHIP, BOND_PER_TRAINING,
    card, trainee, levelFor, effectTable, baseEffects, effectsIn, conditionalUniques, effectName, formatEffect, uniqueText,
    onGlobal, label, typeLabel, initialBond, isRainbow, trainingGain, suggestBuild
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.UmaDeck = api;
})(typeof window !== "undefined" ? window : globalThis);
