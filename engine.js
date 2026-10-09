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
  const Dates = root.UmaDates || (typeof require !== "undefined" ? require("./data/dates.js") : null);
  const CardEvents = root.UmaCardEvents || (typeof require !== "undefined" ? require("./data/card-events.js") : null);
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

  // The trainee's career goals (GameTora objectives), as turn plan entries. Fixed goal races
  // are forced; "pick one" goals are forced only when every option is on the same turn;
  // fan and race-count goals are deadlines. Scenarios with their own goal races keep them.
  function traineeGoals(state, sc) {
    if (!Deck || !Deck.DATA || !Deck.DATA.objectives || !state || !state.deck || !state.deck.trainee || (sc && sc.goalTurns)) return [];
    const t = Deck.trainee(state.deck.trainee);
    const list = t && Deck.DATA.objectives[t.cid];
    if (!list) return [];
    const place = (g) => (g.v === 0 ? "enter" : g.v === 1 ? "win" : "top " + g.v);
    const last = Math.min(72, (sc && sc.totalTurns) || 72);
    const out = [];
    for (let i = 0; i < list.length;) {
      const g = list[i];
      if (g.ch) {
        let j = i;
        while (j < list.length && list[j].ch) j++;
        const grp = list.slice(i, j);
        const turns = Array.from(new Set(grp.map((x) => x.t)));
        const all = Array.from(new Set(grp.reduce((a, x) => a.concat(x.r), [])));
        if (turns.length === 1) {
          out.push({ turn: turns[0], forced: true, label: "Goal: " + all.join(" or ") + " (" + place(grp[0]) + ")", tip: "Career goal. Race whichever one your goal list shows." });
        } else {
          turns.forEach((tu) => {
            const here = Array.from(new Set(grp.filter((x) => x.t === tu).reduce((a, x) => a.concat(x.r), [])));
            out.push({ turn: tu, forced: false, choice: true, label: "Goal option: " + here.join(" or ") + " (" + place(grp.find((x) => x.t === tu)) + ")", tip: "Your goal is one of: " + all.join(", ") + ". Tap ★ on the turn of the race you pick." });
          });
        }
        i = j;
        continue;
      }
      if (g.c === 1 && g.r.length) out.push({ turn: g.t, forced: true, races: g.r, place: g.v, label: "Goal: " + g.r.join(" or ") + " (" + place(g) + ")", tip: g.t === 12 ? "Goal race: your debut." : "Career goal race." });
      else if (g.c === 3) out.push({ turn: g.t, forced: false, fans: g.v, label: "Goal: " + g.v.toLocaleString("en-US") + " fans by this turn", tip: "Race optional races before this if you're short of fans." });
      else out.push({ turn: g.t, forced: false, label: "Goal due", tip: "A career goal is due by this turn. Check the in-game goal list." });
      i++;
    }
    // Trackblazer swaps the career goals for Grade Point goals; only the debut stays.
    if (sc && sc.gradePoints) return out.filter((x) => x.turn === 12);
    return out.filter((x) => x.turn >= 1 && x.turn <= last);
  }

  // ---- Races and fans ----
  // The career race calendar (GameTora) gives every race on each turn with its fans by place.
  const GRADE_KEY = { 100: "g1", 200: "g2", 300: "g3", 400: "op", 700: "op" };
  const GRADE_LABEL = { 100: "G1", 200: "G2", 300: "G3", 400: "OP", 700: "Pre-OP" };
  const TYPICAL_FANS = { g1: 10500, g2: 5700, g3: 3800, op: 2300 }; // 1st place, median per grade
  const APT_RANK = "GFEDCBAS";
  const distIdx = (m) => (m <= 1400 ? 2 : m <= 1800 ? 3 : m <= 2400 ? 4 : 5);

  // Races on a turn the trainee can run well (B aptitude or better for surface and distance).
  function racesAt(state, turn) {
    const all = (Deck && Deck.DATA && Deck.DATA.races) || [];
    const t = state.deck && state.deck.trainee && Deck ? Deck.trainee(state.deck.trainee) : null;
    return all.filter((r) => r.t === turn && (!t || (APT_RANK.indexOf(t.apt[r.s === 2 ? 1 : 0]) >= 5 && APT_RANK.indexOf(t.apt[distIdx(r.d)]) >= 5)));
  }

  function fanBonus(state) {
    if (!Deck || !state.deck || !state.deck.slots) return 0;
    return state.deck.slots.reduce((a, sl) => {
      const c = sl && Deck.card(sl.id);
      return a + (c ? Deck.baseEffects(c, Deck.levelFor(c, sl.lb))[16] || 0 : 0);
    }, 0);
  }

  // Expected fans from a race: 60% a win and 40% about 3rd (a goal's placing is only the minimum).
  function expectedFans(state, race) {
    const f = race.f;
    const base = 0.6 * f[0] + 0.4 * f[2];
    return Math.round(base * (1 + fanBonus(state) / 100));
  }

  // The race a goal turn holds, from the goal list and the calendar.
  function goalRaceAt(state, sc, turn) {
    const g = traineeGoals(state, sc).find((x) => x.forced && x.turn === turn && x.races);
    if (!g) return null;
    const r = ((Deck && Deck.DATA && Deck.DATA.races) || []).find((x) => x.t === turn && g.races.indexOf(x.n) !== -1);
    if (r) return { race: r, place: g.place };
    // The debut isn't in the calendar: about 700 fans for a win.
    if (g.races.some((n) => /Debut/.test(n))) return { race: { n: g.races[0], g: 900, f: [700, 280, 175, 105, 70] }, place: g.place };
    return null;
  }

  const bestRaceAt = (state, turn, have) => racesAt(state, turn).filter((r) => (r.need || 0) <= have)
    .map((r) => ({ race: r, fans: expectedFans(state, r) })).sort((a, b) => b.fans - a.fans)[0] || null;

  // Fans from goal races on this turn (they happen anyway).
  function fromGoalsBefore(state, sc, forced) {
    const gr = forced.has(state.turn) ? goalRaceAt(state, sc, state.turn) : null;
    return gr ? expectedFans(state, gr.race) : 0;
  }

  // Plans the next fan goal: how many fans are still needed after the goal races before it, and
  // whether to race now, whether racing now is free (it doesn't add a race), or whether bigger
  // races later cover it. status: met | covered | urgent | efficient | wait | short.
  function fanPlan(state, sc) {
    const goal = traineeGoals(state, sc).find((g) => g.fans && g.turn >= state.turn);
    if (!goal) return null;
    const have = state.fans || 0;
    const plan = { goal, have, need: Math.max(0, goal.fans - have), turnsLeft: goal.turn - state.turn };
    if (plan.need <= 0) return Object.assign(plan, { status: "met" });
    const forced = forcedTurns(state, sc);
    let fromGoals = 0;
    for (let t = state.turn; t < goal.turn; t++) {
      if (!forced.has(t)) continue;
      const gr = goalRaceAt(state, sc, t);
      if (gr) fromGoals += expectedFans(state, gr.race);
    }
    const left = plan.need - fromGoals;
    plan.fromGoals = fromGoals;
    plan.left = Math.max(0, left);
    if (left <= 0) return Object.assign(plan, { status: "covered" });
    // Later races, checking entry requirements against the fans you'd have by then. A race
    // you can only enter after one more race (prior) costs that extra race too.
    const laterFrom = (base) => {
      const out = [];
      let goalsSoFar = 0;
      let unlockTurn = false; // an earlier free turn with an open race, to reach entry fans
      for (let t = state.turn + 1; t < goal.turn; t++) {
        if (forced.has(t)) { const gr = goalRaceAt(state, sc, t); if (gr) goalsSoFar += expectedFans(state, gr.race); continue; }
        const all = racesAt(state, t).map((r) => ({ race: r, fans: expectedFans(state, r), prior: (r.need || 0) > base + goalsSoFar }));
        const open = all.filter((x) => !x.prior).sort((a, b) => b.fans - a.fans);
        const reach = all.filter((x) => !x.prior || unlockTurn).sort((a, b) => b.fans - a.fans);
        if (reach.length) out.push(Object.assign({ turn: t }, reach[0]));
        if (open.length) unlockTurn = true;
      }
      return out;
    };
    // Fewest races to cover n fans: biggest first, one per turn, plus one for a race that needs
    // more fans to enter unless an earlier pick gets you there.
    const count = (n, list) => {
      const sorted = list.slice().sort((a, b) => b.fans - a.fans);
      const used = new Set();
      let k = 0, sum = 0;
      for (const x of sorted) {
        if (sum >= n) break;
        if (used.has(x.turn)) continue;
        used.add(x.turn);
        sum += x.fans;
        k += 1;
        if (x.prior && !sorted.some((y) => used.has(y.turn) && y.turn < x.turn && y !== x)) k += 1;
      }
      return sum >= n ? k : Infinity;
    };
    const now = forced.has(state.turn) ? null : (state.raceName && racesAt(state, state.turn).find((r) => r.n === state.raceName)) || null;
    const nowBest = forced.has(state.turn) ? null : now ? { race: now, fans: expectedFans(state, now) } : bestRaceAt(state, state.turn, have);
    const later = laterFrom(have + fromGoalsBefore(state, sc, forced));
    const laterIfRace = nowBest ? laterFrom(have + nowBest.fans + fromGoalsBefore(state, sc, forced)) : later;
    const kLater = count(left, later);
    const kNow = nowBest ? 1 + (left - nowBest.fans <= 0 ? 0 : count(left - nowBest.fans, laterIfRace)) : Infinity;
    plan.now = nowBest;
    plan.racesNeeded = Math.min(kLater, kNow);
    // Races saved by racing now (each one is a turn you get back for training).
    plan.saves = kLater !== Infinity && kNow !== Infinity ? Math.max(0, kLater - kNow) : 0;
    if (kLater === Infinity) plan.status = nowBest && kNow < Infinity ? "urgent" : "short";
    else if (nowBest && kNow <= kLater) plan.status = "efficient";
    else plan.status = "wait";
    later.sort((a, b) => b.fans - a.fans);
    plan.picks = later.slice(0, Math.max(1, Math.min(4, kLater === Infinity ? 4 : kLater)));
    plan.tight = kLater !== Infinity && new Set(later.map((x) => x.turn)).size - kLater <= 1;
    // Few spare turns left: racing when you can is safer.
    if (plan.status === "wait" && later.length - kLater <= 1 && nowBest) plan.status = "efficient";
    return plan;
  }

  function fanPlanText(plan, sc) {
    if (!plan) return "";
    const n = (x) => Math.round(x).toLocaleString("en-US");
    const head = "Fan goal: " + n(plan.goal.fans) + " by turn " + plan.goal.turn + " (" + turnInfo(plan.goal.turn, sc).text + "). You have " + n(plan.have) + ".";
    if (plan.status === "met") return head + " Already reached.";
    if (plan.status === "covered") return head + " Your goal races before then should cover the other " + n(plan.need) + ".";
    const picks = (plan.picks || []).map((x) => x.race.n + " (turn " + x.turn + ", ~" + n(x.fans) + ")").join(", ");
    const rest = n(plan.left) + " more needed" + (plan.fromGoals ? " after your goal races" : "");
    if (plan.status === "urgent") return head + " " + rest + ", and later races can't cover it: race now (" + plan.now.race.n + ", ~" + n(plan.now.fans) + ").";
    if (plan.status === "short") return head + " " + rest + ", more than the races that fit you before then can give. Missing a career goal ends the run, so race every chance you get" + (plan.now ? " (now: " + plan.now.race.n + ")" : "") + ", and race ones outside your best distance if you must.";
    if (plan.status === "efficient") return head + " " + rest + ": racing now (" + plan.now.race.n + ", ~" + n(plan.now.fans) + ") " + (plan.saves ? "saves " + plan.saves + " race" + (plan.saves > 1 ? "s" : "") + " later, so it's worth a training turn." : "fits your plan without adding a race, so it's listed as an option against training.");
    const why = plan.now ? "races later give as much or more" : "no race that fits you is on this turn";
    return head + " " + rest + ": about " + plan.racesNeeded + " race(s) do it" + (picks ? " (" + picks + ")" : "") + ". " + (plan.tight ? "That's nearly every race that fits you before the deadline, so don't skip them. " : "") + "You can keep training now: " + why + ".";
  }

  // ---- Trackblazer Grade Points ----
  // Grade Points a win pays, by race grade (GameTora). Lower places pay less.
  const GP_BY_G = { 100: 100, 200: 80, 300: 60, 400: 40, 700: 20 };
  const GP_BY_KEY = { g1: 100, g2: 80, g3: 60, op: 40 };
  const gpOf = (r) => GP_BY_G[r.g] || 20;

  // The Grade Point goal in force on this turn. Each is due at the end of Late December; dirt
  // specialists and sprint-only turf trainees get lower targets (sc.gradePoints).
  function gradeGoal(state, sc) {
    const gp = sc && sc.gradePoints;
    if (!gp) return null;
    const i = gp.due.findIndex((d) => d >= state.turn);
    if (i === -1) return null;
    const t = state.deck && state.deck.trainee && Deck ? Deck.trainee(state.deck.trainee) : null;
    const ok = (a) => APT_RANK.indexOf(a) >= 5;
    let kind = "turf";
    if (t && ok(t.apt[1]) && !ok(t.apt[0])) kind = "dirt";
    else if (t && ok(t.apt[2]) && !ok(t.apt[3]) && !ok(t.apt[4]) && !ok(t.apt[5])) kind = "sprint";
    return { due: gp.due[i], goal: gp[kind][i], kind, n: i };
  }

  // Plans the Grade Point goal like fanPlan, counting wins: how many races still do it, and
  // whether later races that fit the trainee can cover it. The coach keeps the count (gpNeed)
  // as you race; type your real number in when you place lower than 1st.
  // status: met | ok | tight | urgent | short.
  function gradePlan(state, sc) {
    const g = gradeGoal(state, sc);
    if (!g) return null;
    const x = state.extras || {};
    const need = x.gpNeed != null && x.gpDue === g.due ? Math.max(0, +x.gpNeed || 0) : g.goal;
    const plan = Object.assign({}, g, { need, turnsLeft: g.due - state.turn });
    if (need <= 0) return Object.assign(plan, { status: "met" });
    const forced = forcedTurns(state, sc);
    const have = state.fans || 0;
    const list = [];
    for (let t = state.turn; t <= g.due; t++) {
      if (forced.has(t)) continue;
      let rs = racesAt(state, t);
      if (t === state.turn) {
        const picked = state.raceName && rs.find((r) => r.n === state.raceName);
        rs = picked ? [picked] : rs.filter((r) => !have || (r.need || 0) <= have);
      }
      const best = rs.sort((a, b) => gpOf(b) - gpOf(a) || b.f[0] - a.f[0])[0];
      if (best) list.push({ turn: t, race: best, gp: gpOf(best) });
    }
    const count = (n, arr) => {
      if (n <= 0) return 0;
      let k = 0, sum = 0;
      for (const v of arr.map((a) => a.gp).sort((a, b) => b - a)) { sum += v; k += 1; if (sum >= n) return k; }
      return Infinity;
    };
    const now = list.length && list[0].turn === state.turn ? list[0] : null;
    const later = list.filter((a) => a.turn > state.turn);
    const kLater = count(need, later);
    plan.now = now;
    plan.racesNeeded = Math.min(kLater, now ? 1 + count(need - now.gp, later) : Infinity);
    plan.spare = kLater === Infinity ? 0 : later.length - kLater;
    plan.picks = later.slice().sort((a, b) => b.gp - a.gp || a.turn - b.turn).slice(0, kLater === Infinity ? 4 : Math.min(4, kLater));
    if (kLater === Infinity) plan.status = now ? "urgent" : "short";
    else plan.status = plan.spare <= 2 ? "tight" : "ok";
    return plan;
  }

  function gradePlanText(plan, sc) {
    if (!plan) return "";
    const kind = plan.kind === "dirt" ? " (dirt target)" : plan.kind === "sprint" ? " (sprint target)" : "";
    const head = "Grade Points: " + plan.need + " of " + plan.goal + kind + " still needed by turn " + plan.due + " (" + turnInfo(plan.due, sc).text + ").";
    if (plan.status === "met") return "Grade Point goal for this year is done. Extra points don't carry over, so race now for coins, stats and fans.";
    const picks = (plan.picks || []).map((a) => a.race.n + " (turn " + a.turn + ", " + a.gp + ")").join(", ");
    if (plan.status === "urgent") return head + " Later races that fit you can't cover it: race now (" + plan.now.race.n + ", " + plan.now.gp + " for a win).";
    if (plan.status === "short") return head + " That's more than the races that fit you can pay, even winning them all. Missing it ends the run: race every turn you can, outside your best distance if you must.";
    const n = plan.racesNeeded;
    const spare = plan.spare === 0 ? "No spare race turns left before then, so don't skip any." : "Only " + plan.spare + " spare race turn" + (plan.spare === 1 ? "" : "s") + " left before then, so race when you can.";
    return head + " " + (n === 1 ? "One win does it" : "About " + n + " wins do it") + (picks ? " (" + picks + ")" : "") + ". " +
      (plan.status === "tight" ? spare : "Plenty of race turns left.") +
      " Counting wins; lower places pay less, so fix the number if you place lower.";
  }

  // Goal race turns that come from the trainee's goals, minus any you unmarked.
  function autoGoalTurns(state, sc) {
    const off = new Set(state.goalsOff || []);
    return new Set(traineeGoals(state, sc).filter((g) => g.forced && !off.has(g.turn)).map((g) => g.turn));
  }

  function isGoalTurn(state, sc, turn) {
    return (state.goals || []).indexOf(turn) !== -1 || autoGoalTurns(state, sc).has(turn);
  }

  function forcedTurns(state, sc) {
    const set = new Set(state.goals || []);
    autoGoalTurns(state, sc).forEach((t) => set.add(t));
    if (sc.finale && sc.finale.forced) sc.finale.turns.forEach((t) => set.add(t));
    (sc.goalTurns || []).forEach((t) => set.add(t));
    return set;
  }

  function eventsFor(turn, scenario, state) {
    const out = [];
    const evs = scenario.events || [];
    // The scenario's own debut entry already covers the trainee's debut goal.
    const debutEv = evs.some((e) => e.turn === 12 && /debut/i.test(e.label));
    const tg = traineeGoals(state, scenario).filter((g) => g.turn === turn && !(turn === 12 && debutEv));
    if (turn === 12 && !debutEv && !tg.length) out.push({ turn, label: "Make Debut", tip: "Goal race." });
    const camps = campTurns(scenario);
    if (camps.indexOf(turn + 1) !== -1 && camps.indexOf(turn) === -1) out.push({ turn, label: "Camp next turn", tip: "Energy carried into camp is worth more than usual." });
    if (camps.indexOf(turn) !== -1 && camps.indexOf(turn - 1) === -1) out.push({ turn, label: "Summer camp starts", tip: "Four turns at max facility level." });
    evs.forEach((e) => { if (e.turn === turn) out.push(e); });
    if (scenario.finale && scenario.finale.forced && scenario.finale.turns.indexOf(turn) !== -1) out.push({ turn, label: scenario.finale.name, tip: scenario.finale.note });
    tg.forEach((g) => out.push({ turn, label: g.label, tip: g.tip }));
    if (state && (state.goals || []).indexOf(turn) !== -1 && !tg.some((g) => g.forced)) out.push({ turn, label: "Goal race", tip: "You marked this turn as a goal race." });
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
      // Your own targets (the Stats table) override the build's.
      target: Object.assign({}, build.target, state.targets || {}),
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

  // ---- Grand Concert song plan (CM ace guide, with 5 songs in year one) ----
  // Year one, before the 1st Promo Live: buy 5 songs, do 2 more technique lessons so the 6th
  // shows up, and carry it over (buy it right after the live: it counts for the next live and
  // saves a lesson). Every half year after: the carried song, 1 lesson, a song, 2 lessons, a
  // song, 2 lessons, carry over. Before the Grand Live there's nothing to carry into, so that
  // 4th song is bought too, for 18 songs (the special GIRLS' LEGEND U).
  // Steps: technique lessons before each song this half (the game's lesson pattern).
  const GL_FOCUS = { 1: ["yumewo", "growup"], 2: ["yumewo", "growup"], 3: ["daisuki", "fanfare"], 4: ["daisuki", "fanfare"] };
  const GL_AVOID = { 0: ["ringring", "nigekiri"] };
  function glPeriod(sc, turn) {
    const i = sc.lives.findIndex((l) => turn <= l);
    return i === -1 ? sc.lives.length - 1 : i;
  }
  function songPlan(state, sc) {
    if (!sc.songs || state.turn < 5) return null;
    const p = glPeriod(sc, state.turn);
    const last = p === sc.lives.length - 1;
    const steps = p === 0 ? [1, 2, 3, 4, 4] : last ? [0, 1, 2, 2] : [0, 1, 2];
    const carry = last ? null : 2;
    const cum = steps.reduce((a, x) => a.concat([(a.length ? a[a.length - 1] : 0) + x]), []);
    const learned = (state.gl && state.gl.songs) || {};
    const bought = Object.values(learned).filter((t) => glPeriod(sc, t) === p && t >= 5).length;
    const lessons = ((state.gl && state.gl.lessons) || {})[p] || 0;
    const live = sc.lives[p];
    const plan = { period: p, target: steps.length, bought, lessons, live, last, focus: GL_FOCUS[p] || [], avoid: GL_AVOID[p] || [] };
    const n = (x) => x + " technique lesson" + (x === 1 ? "" : "s");
    if (bought < steps.length) {
      const need = cum[bought] - lessons;
      plan.step = need > 0 ? "lessons" : "song";
      plan.text = p > 0 && bought === 0 && need <= 0
        ? "Buy the song you carried over first (it saves a lesson)."
        : need > 0 ? "Do " + n(need) + ", then buy song " + (bought + 1) + " of " + steps.length + " this half."
          : "Buy song " + (bought + 1) + " of " + steps.length + " when it shows in your lessons.";
    } else if (carry != null) {
      const need = cum[cum.length - 1] + carry - lessons;
      plan.step = need > 0 ? "lessons" : "hold";
      plan.text = need > 0 ? "Plan's songs are done. Do " + n(need) + " until the next song shows, then hold it."
        : "Hold the next song: buy it right after the live on turn " + live + ", so it counts for the next live and saves a lesson.";
    } else {
      plan.step = "done";
      plan.text = "Plan done: that's 18 songs for the special GIRLS' LEGEND U. Extra songs still help.";
    }
    return plan;
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
      // The plan's picks: the SP songs in year two, the +10% friendship songs in year three; skip
      // the +Stamina and +Guts songs in year one.
      const p = glPeriod(sc, state.turn);
      const focus = (GL_FOCUS[p] || []).indexOf(song.id) !== -1;
      const avoid = (GL_AVOID[p] || []).indexOf(song.id) !== -1;
      if (focus) v *= 1.6;
      if (avoid) v *= 0.3;
      const cost = song.cost.reduce((a, b) => a + b, 0);
      const short = song.cost.map((c, i) => Math.max(0, c - (tokens[i] || 0)));
      return { song, value: v, perToken: v / Math.max(1, cost), affordable: short.every((x) => x === 0), short, focus, avoid };
    }).sort((a, b) => (b.affordable - a.affordable) || (b.perToken - a.perToken));
  }

  // Tokens a training gives toward the songs still to buy: each useful token is worth its share
  // of the song it goes to (only up to what that song still lacks, and below the token cap).
  function songTokenValue(f, ctx) {
    const st = ctx.state;
    const sc = ctx.sc;
    if (!sc.songs || !sc.tokenOf || st.turn < 5 || st.turn > 72) return null;
    const plan = songPlan(st, sc);
    if (plan && plan.step === "done") return null;
    const wanted = songAdvice(st, sc).filter((a) => !a.avoid && !a.affordable)
      .sort((a, b) => (b.focus - a.focus) || (b.perToken - a.perToken)).slice(0, 2);
    if (!wanted.length) return null;
    const have = (st.gl && st.gl.tokens) || [0, 0, 0, 0, 0];
    const cap = tokenCap(st, sc);
    let add = 0;
    const bits = [];
    tokenGain(f, st, sc).forEach((g) => {
      let left = Math.max(0, Math.min(g.amount, cap - (have[g.type] || 0)));
      let used = 0;
      wanted.forEach((w) => {
        const take = Math.min(left, w.short[g.type] || 0);
        if (take <= 0) return;
        add += take * w.perToken * 0.5;
        used += take;
        left -= take;
      });
      if (used) bits.push("+" + Math.round(used) + " " + sc.tokens[g.type]);
    });
    if (!add) return null;
    // Tokens come with most trainings anyway, so they tip close calls rather than decide.
    return { add: Math.min(add, 0.4 * ctx.typ), note: bits.join(", ") + " toward " + wanted.map((w) => w.song.name).join(" / ") };
  }

  // ---- Support card events (Umamusume Wiki) ----
  // Each card's chain and other events, with every choice's results. Values listed as a range
  // ("Energy +10-16") go from LB0 to LB4; success/failure results are counted half each.
  function cardEvents(cardId) {
    const c = CardEvents && CardEvents.cards && CardEvents.cards[cardId];
    if (!c) return null;
    const list = (ids) => (ids || []).map((id) => Object.assign({ id }, CardEvents.events[id] || { n: "Event " + id }));
    return { chain: list(c.chain), other: list(c.other) };
  }

  function atLB(v, lb) {
    return Array.isArray(v) ? Math.round(v[0] + ((v[1] - v[0]) * (lb != null ? lb : 4)) / 4) : v;
  }

  function evOutcome(o, lb) {
    if (!o) return null;
    const out = {};
    ["e", "me", "mo", "sp", "b", "r", "rn"].forEach((k) => { if (o[k] != null) out[k] = atLB(o[k], lb); });
    if (o.s) out.s = o.s.map((g) => atLB(g, lb));
    ["h", "g", "cure", "x", "unlock", "end"].forEach((k) => { if (o[k] != null) out[k] = o[k]; });
    return out;
  }

  // One choice's parts: what it always gives, plus half of success and half of failure.
  function eventChoiceParts(ch, ctx, lb) {
    const base = dateParts(evOutcome(ch, lb), ctx);
    if (ch.g) base.hint = (base.hint || 0) + ch.g.length * 0.5 * ctx.typ;
    [ch.ok, ch.ng].forEach((o) => {
      if (!o) return;
      const p = dateParts(evOutcome(o, lb), ctx);
      Object.keys(p).forEach((k) => { base[k] = (base[k] || 0) + 0.5 * p[k]; });
    });
    return base;
  }

  function eventText(ch, lb) {
    const o = evOutcome(ch, lb) || {};
    const bits = [];
    const main = dateText(o);
    if (main) bits.push(main);
    if (o.b) bits.push("bond " + (o.b > 0 ? "+" : "") + o.b);
    (ch.g || []).forEach((id) => bits.push("gets " + skillName(id)));
    if (ch.unlock) bits.push("unlocks outings");
    if (ch.ok) bits.push("on success: " + (eventText(ch.ok, lb) || "nothing"));
    if (ch.ng) bits.push("on failure: " + (eventText(ch.ng, lb) || "nothing"));
    return bits.join(", ");
  }

  // Ranks an event's choices for this turn. Returns [{ i, text, label, value }], best first.
  function rankEventChoices(state, sc, ev, lb) {
    if (!ev || !ev.c || !ev.c.length) return [];
    const ctx = makeCtx(state, sc);
    // On an outing unlock event, the other choice locks the card's outings for the run: worth
    // about one strong turn per outing lost.
    const unlockEvent = ev.c.some((ch) => ch.unlock);
    return ev.c.map((ch, i) => {
      const locks = unlockEvent && !ch.unlock;
      const value = sumParts(eventChoiceParts(ch, ctx, lb)) - (locks ? 5 * ctx.typ : 0);
      return { i, label: ch.t || "", text: eventText(ch, lb) + (locks ? ", locks outings" : ""), value };
    }).sort((a, b) => b.value - a.value);
  }

  // ---- Friend / Group card outings ("dates") ----
  // Cards in data/dates.js use game8's values for each outing: the coach values every choice
  // (energy, max energy, mood, stats, skill points, hints, curing a bad condition) and picks
  // the best for this turn. Other cards fall back to typical values.
  const dateCard = (id) => (Dates && Dates.cards && Dates.cards[id]) || null;
  const DATE_STATS = ["speed", "stamina", "power", "guts", "wit"];

  function hintValue(h, ctx) {
    return (h || []).reduce((a, [id, lv]) => {
      const gold = Dates && Dates.gold && Dates.gold.indexOf(id) !== -1;
      return a + lv * (gold ? 0.1 : 0.05) * ctx.typ;
    }, 0);
  }

  // Value of one outcome, split into parts so the comparison reasons stay readable.
  function dateParts(o, ctx) {
    const st = ctx.state;
    let mood = 0;
    for (let i = 0, m = st.mood; i < Math.abs(o.mo || 0); i++) {
      if (o.mo > 0 && m < 4) { mood += ctx.moodStep(m); m++; } else if (o.mo < 0 && m > 0) { mood -= ctx.moodStep(m - 1); m--; }
    }
    const rand = o.r ? (o.r * (o.rn || 1)) / 5 : 0; // a random stat, spread as an average
    const stats = DATE_STATS.reduce((a, k, i) => { const g = ((o.s || [])[i] || 0) + rand; return a + (g ? ctx.gainValue(k, g) : 0); }, 0);
    return {
      energy: ctx.energyValue(o.e || 0) + (o.me ? ctx.energyValue(Math.min(o.me, 10)) * 0.5 : 0),
      mood,
      stats,
      sp: (o.sp || 0) * SP_VALUE,
      hint: hintValue(o.h, ctx),
      bond: (o.b || 0) > 0 ? 0.04 * ctx.typ : 0,
      condition: o.cure && st.badCondition ? 0.7 * ctx.typ * Math.min(1, ctx.turnsLeft / 10) : 0
    };
  }

  // A choice can be an outcome or a roll between two outcomes (success or not).
  function choiceParts(c, ctx) {
    if (!c.roll) return dateParts(c, ctx);
    const a = choiceParts(c.opts[0], ctx);
    const b = choiceParts(c.opts[1], ctx);
    const p = c.p != null ? c.p : 0.5;
    const out = {};
    Object.keys(a).forEach((k) => { out[k] = p * a[k] + (1 - p) * (b[k] || 0); });
    return out;
  }

  // Short text of what an outcome gives, e.g. "+80 energy, mood +1" or "Speed +20, Guts +20".
  function dateText(o) {
    if (o.roll) return o.fail ? dateText(o.opts[0]) + " if it succeeds (it can fail: " + (dateText(o.opts[1]) || "nothing") + ")" : dateText(o.opts[0]) + " on a great success (a little less otherwise)";
    const bits = [];
    if (o.e) bits.push((o.e > 0 ? "+" : "") + o.e + " energy");
    if (o.me) bits.push("+" + o.me + " max energy");
    if (o.mo) bits.push("mood " + (o.mo > 0 ? "+" : "") + o.mo);
    const s = o.s || [];
    if (s.length && s.every((g) => g === s[0]) && s[0]) bits.push("all stats +" + s[0]);
    else s.forEach((g, i) => { if (g) bits.push(STAT_LABELS[DATE_STATS[i]] + " +" + g); });
    if (o.r) bits.push((o.rn > 1 ? o.rn + " random stats +" : "a random stat +") + o.r);
    if (o.sp) bits.push(o.sp + " SP");
    (o.h || []).forEach(([id, lv]) => bits.push(skillName(id) + " hint +" + lv));
    if (o.cure) bits.push("cures a bad condition");
    if (o.x) bits.push(o.x);
    return bits.join(", ");
  }

  function skillName(id) {
    const n = Deck && Deck.DATA && Deck.DATA.skills ? Deck.DATA.skills[id] : null;
    return n || "skill #" + id;
  }

  // Multipliers that turn game8's values (at info.lv, full limit break when not stated) into
  // this card's: Event Recovery (effect 25) for energy, Event Effectiveness (26) for the rest.
  function dateScale(sl, info) {
    if (!Deck || !Deck.baseEffects) return { e: 1, s: 1 };
    const at = (lv) => Deck.baseEffects(sl.card, lv) || {};
    const now = at(sl.level);
    const ref = at(info.lv || 50);
    return {
      e: (1 + (now[25] || 0) / 100) / (1 + (ref[25] || 0) / 100),
      s: (1 + (now[26] || 0) / 100) / (1 + (ref[26] || 0) / 100)
    };
  }

  function scaleDate(o, k) {
    if (!o) return o;
    const out = Object.assign({}, o);
    if (o.opts) out.opts = o.opts.map((x) => scaleDate(x, k));
    if (o.e > 0 && o.e < 100) out.e = Math.round(o.e * k.e);
    if (o.s) out.s = o.s.map((g) => (g > 0 ? Math.round(g * k.s) : g));
    if (o.sp > 0) out.sp = Math.round(o.sp * k.s);
    if (o.r) out.r = Math.round(o.r * k.s);
    return out;
  }

  function outingOptions(ctx) {
    const { state, deck, typ } = ctx;
    if (!deck || ctx.camp || state.goalRace) return [];
    return deck.used.filter((sl) => (sl.card.ty === "friend" || sl.card.ty === "group")).map((sl) => {
      const raw = state.deck.slots[sl.idx] || {};
      const d = raw.dates || {};
      if (!d.unlocked) return null;
      const n = (d.done || 0) + 1;
      const info = dateCard(sl.card.id);
      if (n > (info ? info.dates.length : 5)) return null; // every outing done
      const raw0 = info && info.dates[n - 1];
      // game8 lists values at one card level: rescale them by this card's Event Recovery
      // (energy) and Event Effectiveness (stats, SP) at its own level.
      const known = raw0 ? scaleDate(raw0, dateScale(sl, info)) : null;
      const base = { kind: "recreation", outing: sl.idx, prefix: [], consume: {} };
      if (known) {
        const tries = known.opts.map((c) => ({ c, parts: known.roll ? choiceParts(known, ctx) : choiceParts(c, ctx) }))
          .map((x) => Object.assign(x, { value: sumParts(x.parts) })).sort((a, b) => b.value - a.value);
        const pick = known.roll ? { c: known, parts: tries[0].parts, value: tries[0].value } : tries[0];
        const out = pick.c.roll ? pick.c.opts[0] : pick.c;
        const notes = ["outing " + n + " of " + info.dates.length + " with " + sl.card.n + ": " + dateText(pick.c)];
        if (!known.roll && tries.length > 1) notes.push("pick the choice that gives that; the other " + (tries.length > 2 ? "choices give " : "one gives ") + tries.slice(1).map((x) => dateText(x.c)).join("; or "));
        if (out.me) notes.push("max energy goes up to " + (ctx.maxE + out.me));
        const statGains = {};
        DATE_STATS.forEach((k, i) => { const g = ((out.s || [])[i] || 0) + (out.r ? (out.r * (out.rn || 1)) / 5 : 0); if (g) statGains[k] = g; });
        return Object.assign(base, {
          label: "Outing with " + sl.card.n + " (" + n + "/" + info.dates.length + ")",
          energyDelta: out.e || 0, moodDelta: Math.max(-state.mood, Math.min(4 - state.mood, out.mo || 0)),
          maxEnergyDelta: out.me || 0, statGains,
          notes, parts: pick.parts, value: pick.value
        });
      }
      const last = n >= 5;
      const energy = 20;
      const parts = {
        energy: ctx.energyValue(energy),
        mood: ctx.moodStep(state.mood),
        stats: (last ? 25 : 12) * ctx.avgW,
        bond: 0.04 * typ
      };
      return Object.assign(base, {
        label: "Outing with " + sl.card.n,
        energyDelta: energy, moodDelta: state.mood < 4 ? 1 : 0,
        notes: ["outing " + n + " with " + sl.card.n + ": energy, mood, stats and bond (typical values; no outing data for this card)"].concat(state.mood >= 4 ? ["mood is already Great, but the outing still pays stats and energy"] : []),
        parts, value: sumParts(parts)
      });
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
    const aki = akikawaValue(f, ctx);
    if (aki) { o.parts.bond += aki.add; o.notes.push(aki.note); }
    o.raw = o.parts.stats + o.parts.sp + o.parts.bond + o.parts.hint + o.parts.scenario;
    scoreRisk(o, ctx);
    return o;
  }

  // ---- Chairman Akikawa ----
  // In scenarios with her bond check (sc.akikawa: [[turn, bond needed], ...]) she shows up on
  // trainings; training with her raises her bond (about +7, like a support card). The unique
  // skill level-up needs it (green, 60+, by Senior Early April in URA-style scenarios).
  const AKI_PER_TRAINING = 7;

  function akikawaCheck(state, sc) {
    if (!sc.akikawa) return null;
    const bond = +((state.extras && state.extras.akiBond) || 0);
    const next = sc.akikawa.find(([t, need]) => t >= state.turn && bond < need);
    return next ? { turn: next[0], need: next[1], bond, short: next[1] - bond } : null;
  }

  function akikawaValue(f, ctx) {
    if (!(f.extras && f.extras.aki)) return null;
    const chk = akikawaCheck(ctx.state, ctx.sc);
    if (!chk) return null;
    const trainings = Math.ceil(chk.short / AKI_PER_TRAINING);
    const turnsLeft = chk.turn - ctx.state.turn + 1;
    // She's on a training only now and then (about 1 turn in 4), so few turns left makes each
    // chance count more. A missed check costs a unique skill level.
    const urgency = Math.min(3, trainings / Math.max(1, turnsLeft / 4));
    return {
      add: (0.1 + 0.15 * urgency) * ctx.typ,
      note: "Akikawa is here: her bond " + chk.bond + " → " + Math.min(100, chk.bond + AKI_PER_TRAINING) + " (needs " + chk.need + " by turn " + chk.turn + " for the unique skill level-up)"
    };
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
      const gr = goalRaceAt(state, sc, state.turn);
      if (gr) { const o = options[options.length - 1]; o.fans = expectedFans(state, gr.race, gr.place); o.label = "Run your goal race: " + gr.race.n; }
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
      const plan = fanPlan(state, sc);
      // A fan goal you can't make without racing now adds the best race this turn, even if
      // you didn't pick one.
      let raceKey = state.race;
      let named = state.raceName ? racesAt(state, state.turn).find((x) => x.n === state.raceName) : null;
      if (!raceKey && plan && (plan.status === "urgent" || plan.status === "short" || plan.status === "efficient") && plan.now) { named = plan.now.race; raceKey = GRADE_KEY[named.g]; }
      // Trackblazer runs on races, so the best race this turn that fits the trainee (most Grade
      // Points, then fans) is always weighed against training.
      if (!raceKey && sc.gradePoints && state.deck && state.deck.trainee) {
        const pick = racesAt(state, state.turn).filter((x) => !state.fans || (x.need || 0) <= state.fans).sort((a, b) => gpOf(b) - gpOf(a) || b.f[0] - a.f[0])[0];
        if (pick) { named = pick; raceKey = GRADE_KEY[pick.g]; }
      }
      if (raceKey && RACES[raceKey]) {
        const r = RACES[raceKey];
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
          kind: "race", label: named ? "Race: " + named.n + " (" + GRADE_LABEL[named.g] + ")" : "Race (" + r.label + ")", energyDelta: -RACE_ENERGY, moodDelta: 0, prefix: [], consume: {},
          notes: ["about " + Math.round(r.sp * rb) + " skill points if you win"], parts: p,
          fans: named ? expectedFans(state, named) : Math.round(TYPICAL_FANS[raceKey] * 0.8 * (1 + fanBonus(state) / 100))
        };
        if (sc.gradePoints) { o.gp = named ? gpOf(named) : GP_BY_KEY[raceKey] || 20; o.raceName = named ? named.n : ""; }
        if (plan && plan.status !== "met" && plan.status !== "covered") {
          const typ = ctx.typ;
          p.fans += plan.status === "urgent" || plan.status === "short" ? 2.5 * typ : plan.status === "efficient" ? (0.35 + 0.9 * plan.saves) * typ : 0;
          o.notes.push(plan.status === "wait" ? "the fan goal can wait for bigger races later" : "counts toward your fan goal (" + Math.round(plan.left).toLocaleString("en-US") + " still needed)");
        }
        if (consec >= 3) o.notes.push(consec + " races in a row already; another one risks a bad condition or mood drop");
        if (hook.race) {
          const x = hook.race(ctx, raceKey, named) || {};
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
    const plan = fanPlan(state, scenario);
    if (plan && plan.status !== "met" && (plan.status !== "covered" || plan.turnsLeft <= 6)) reasons.push(fanPlanText(plan, scenario));
    const gplan = gradePlan(state, scenario);
    if (gplan && gplan.status !== "met" && (gplan.status !== "ok" || best.kind === "race")) reasons.push(gradePlanText(gplan, scenario));
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
      fanPlan: plan,
      gradePlan: gplan,
      events: eventsFor(state.turn, scenario, state),
      turn: turnInfo(state.turn, scenario)
    };
  }

  // Applies a chosen option and moves to the next turn. Returns the new state (does not mutate).
  function advance(state, scenario, option) {
    const s = JSON.parse(JSON.stringify(state));
    // An outing that raises max energy (Light Hello's first: +4) counts before the energy it gives.
    if (option.maxEnergyDelta) s.maxEnergy = (s.maxEnergy || 100) + option.maxEnergyDelta;
    const maxE = s.maxEnergy || 100;
    s.extras = s.extras || {};
    s.energy = clamp(Math.round(s.energy + (option.energyDelta || 0)), 0, maxE);
    s.mood = clamp(s.mood + (option.moodDelta || 0), 0, 4);
    if (option.kind === "train" && scenario.akikawa) {
      const fac = s.facilities.find((x) => x.stat === option.stat);
      if (fac && fac.extras && fac.extras.aki) s.extras.akiBond = Math.min(100, (+s.extras.akiBond || 0) + AKI_PER_TRAINING);
    }
    if ((option.kind === "train" || option.outing != null) && s.trackStats && option.statGains) {
      s.stats = s.stats || {};
      Object.entries(option.statGains).forEach(([k, g]) => { if (s.stats[k] > 0) s.stats[k] = Math.round(s.stats[k] + g); });
    }
    s.extras.consec = option.kind === "race" ? (s.extras.consec || 0) + 1 : 0;
    if (option.kind === "race" && option.fans) s.fans = Math.round((s.fans || 0) + option.fans);
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
    s.goalRace = isGoalTurn(s, scenario, s.turn);
    s.race = "";
    s.raceName = "";
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
      race(ctx, grade, named) {
        const gp = named ? gpOf(named) : GP_BY_KEY[grade] || 20;
        const plan = gradePlan(ctx.state, ctx.sc);
        let add = 70 * COIN * ctx.typ; // expected coins over likely placements
        if (plan && plan.need > 0) {
          const share = Math.min(gp, plan.need) / 100;
          // A goal later races can't cover outweighs any training; a tight one adds a push, and
          // with plenty of race turns left the points could come later anyway.
          add += plan.status === "urgent" || plan.status === "short" ? 2.5 * ctx.typ : plan.status === "tight" ? (0.3 + 0.6 * share) * ctx.typ : 0.2 * share * ctx.typ;
        } else add += 0.1 * ctx.typ;
        // Guides keep race chains to 2, unless the 3rd ends the year.
        const chain = ((ctx.state.extras || {}).consec || 0) === 2 && ctx.sc.gradePoints.due.indexOf(ctx.state.turn) === -1;
        if (chain) add -= 0.4 * ctx.typ;
        return { add, note: (chain ? "this would be a 3rd race in a row; guides keep chains to 2 unless the 3rd ends the year. " : "") + "about " + gp + " Grade Points and 100 coins if you win" + (plan && plan.need > 0 ? " (" + plan.need + " still needed by turn " + plan.due + ")" : "") };
      },
      // Keeps the Grade Point count: a race takes its points off what's still needed (counting a
      // win), and each Late December deadline starts the next goal (surplus doesn't carry over).
      afterTurn(s, option, sc) {
        const plan = gradePlan(s, sc);
        if (!plan) return;
        if (option.kind === "race" && option.gp && !option.forced) {
          s.extras.gpNeed = Math.max(0, plan.need - option.gp);
          s.extras.gpDue = plan.due;
        }
        if (s.turn === plan.due) { delete s.extras.gpNeed; delete s.extras.gpDue; }
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
      // Turns 5-11 (to the debut): chase Light Hello and the cards closest to friendship; focus one
      // or two cards so they rainbow as soon as possible instead of spreading bond around.
      // Every turn: the performance tokens a training gives count toward the next song you need.
      facility(f, ctx) {
        const t = ctx.state.turn;
        const tok = songTokenValue(f, ctx);
        if (t < 5 || t > 11 || !ctx.deck || !Array.isArray(f.members)) return tok;
        let add = tok ? tok.add : 0;
        const notes = tok ? [tok.note] : [];
        f.members.forEach((i) => {
          const sl = ctx.deck.slots[i];
          if (!sl) return;
          if (sl.card.n === "Light Hello") { add += 0.3 * ctx.typ; notes.push("Light Hello is here (chase her events before the debut)"); }
          else if (sl.card.ty !== "friend" && sl.bond >= 50 && sl.bond < 80) { add += 0.12 * ctx.typ; notes.push(sl.card.n + " is close to friendship (" + Math.round(sl.bond) + ")"); }
        });
        return add ? { add, note: notes.join("; ") } : null;
      },
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
        const t = ctx.state.turn;
        // Opening, turns 1-4: build bonds, Wit and rest, and go into turn 5 (when lessons open)
        // with as much energy as possible. A common opening is Train x3, then Rest.
        if (t <= 4) {
          options.forEach((o) => {
            if (o.kind === "train") {
              const fac = ctx.state.facilities.find((x) => x.stat === o.stat) || {};
              const unbonded = Array.isArray(fac.members) && ctx.deck ? fac.members.filter((i) => ctx.deck.slots[i] && ctx.deck.slots[i].bond < 80).length : fac.unbonded || 0;
              o.value += (o.stat === "wit" ? 0.15 : 0) * ctx.typ + 0.08 * unbonded * ctx.typ;
            }
          });
          // Turn 4: go into turn 5 as full as possible (Train x3, then Rest).
          const rest = options.find((o) => o.kind === "rest");
          if (rest && t === 4 && ctx.E < 85) {
            const top = Math.max.apply(null, options.filter((o) => o !== rest).map((o) => o.value));
            if (ctx.E <= 65) rest.value = Math.max(rest.value, top + 0.1 * ctx.typ);
            else rest.value += 2 * ctx.typ * (0.85 - ctx.E / 100);
            rest.notes.push("go into turn 5 with as much energy as you can: lessons open and the run starts in earnest");
          }
          options.sort((a, b) => b.value - a.value);
          options[0].notes.push("opening: raise bonds, take Wit, rest, and keep energy high going into turn 5 (common: Train x3, then Rest)");
          return;
        }
        const best = options[0];
        if (!best) return;
        const adv = songAdvice(ctx.state, ctx.sc);
        const plan = songPlan(ctx.state, ctx.sc);
        const buy = adv.find((a) => a.affordable && !a.avoid);
        const hype = hypeStatus(ctx.state, ctx.sc);
        if (plan) best.notes.push("song plan: " + plan.text);
        if (buy && plan && plan.step === "song") {
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
        const t = ctx.state.turn;
        // Year-end race after this turn (all stats +10/+15/+20): Red adds 35% to race stats.
        const yearEnd = { 24: 10, 48: 15, 72: 20 }[t] || 0;
        const tries = trains.map((o) => {
          let v;
          if (w === "red") {
            v = withEnergy(o, ctx, Math.min(ctx.maxE, ctx.E + 50));
            const moodUp = MOOD_MULT[4] / MOOD_MULT[mood];
            let mv = 0;
            for (let i = mood; i < 4; i++) mv += ctx.moodStep(i);
            v.parts.item = o.parts.stats * (moodUp * 1.2 - 1) + mv + 0.35 * 5 * yearEnd * ctx.avgW;
            v.notes.push("+50 energy, mood to max and the facility trains past level 5 this turn");
            if (yearEnd) v.notes.push("the year-end race after this turn pays 35% more stats with Red active (it can't be used on the race screen)");
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
        const best = tries[0];
        if (!best) return;
        // Use it right away (no fragments drop while you hold 8), unless camp is a turn or two
        // off: guides save it for camp, where it's worth more.
        const soon = ctx.camp ? 0 : isCamp(t + 1, ctx.sc) ? 1 : isCamp(t + 2, ctx.sc) ? 2 : 0;
        if (soon && !(w === "red" && yearEnd)) {
          // Held, it pays about as much as now, scaled to camp's bigger trainings, minus the
          // fragments that don't drop meanwhile.
          const ratio = typAt(t + soon, ctx.sc, ctx.calib) / ctx.typ;
          best.parts.item -= Math.max(0, best.parts.item) * ratio * (1 - 0.08 * soon);
          const plain = trains.slice().sort((a, b) => b.value - a.value)[0];
          const note = "camp starts in " + soon + " turn" + (soon > 1 ? "s" : "") + "; guides save the Wisdom for camp, where it's worth more";
          best.notes.push(note);
          if (plain) plain.notes.push("hold the " + w + " Wisdom: " + note);
        } else {
          best.parts.item += 0.1 * ctx.typ;
          best.notes.push("no fragments drop while you hold 8, so use it now");
        }
        best.value = sumParts(best.parts);
        options.push(best);
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
        // Energy sets the win chance (game8): sure above ~20%, shaky below, worse below ~10%;
        // a loss halves the stats.
        const pct = (100 * ctx.E) / ctx.maxE;
        const win = pct >= 30 ? 1 : pct > 20 ? 0.95 : pct > 10 ? 0.8 : 0.6;
        const notes = ["uses a turn but no energy; trains every stat and pays Supporter Points", m < 5 ? "waiting for 5 members makes it stronger and can trigger an SSS Match" : "5 members: run it now (holding only leaves more gauges stuck at full)"];
        if (win < 1) notes.push("energy is low enough that the match can be lost, which halves the stats; rest first if you can");
        return [{
          kind: "scenario", label: "SS Match (" + m + " member" + (m > 1 ? "s" : "") + ")",
          parts: { scenario: (0.28 * ctx.typ * m + 0.1 * ctx.typ + (m >= 5 ? 0.3 * ctx.typ : 0)) * (win + (1 - win) * 0.5) },
          notes,
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
        // Cooking Points give a lasting training bonus, so Junior cooks whenever it can.
        if (best && t <= 24 && !(best.rainbows >= 2 || best.raw >= 1.2 * ctx.typ)) best.notes.push("Junior: cook whenever you can; Cooking Points boost training for the rest of the run");
        if (best && (best.rainbows >= 2 || best.raw >= 1.2 * ctx.typ || ctx.camp || tier === 4 || t <= 24)) options.push(best);
      }
    },

    mecha: {
      facility(f, ctx) {
        return f.extras && f.extras.gear ? { add: 0.12 * ctx.typ, note: "Mecha Gear: research and Overdrive gauge" } : null;
      },
      items(ctx, options) {
        const best = bestTraining(options);
        const t = ctx.state.turn;
        // Super Overdrive in the URA Finals can't use stored charges, so spend them by Late December.
        const flush = t >= 69 && t <= 72;
        if (ctx.state.extras && ctx.state.extras.overdrive && best && (isStrong(best, ctx) || flush)) {
          useOn(best, ctx, "Fire Overdrive", best.parts.stats * 0.3, flush && !isStrong(best, ctx) ? "spend stored Overdrive before the URA Finals: Super Overdrive there can't use it" : "Overdrive on a strong training", { overdrive: false });
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
        // You hold only 1 ticket until Senior Early September (turn 65), when 2 more arrive.
        // Classic: use it before camp. Senior spring: keep it through camp to enter the last
        // half year with 3, unless the turn is exceptional.
        let ok;
        if (t >= 65) ok = friendFacs >= 2 || ctx.turnsLeft <= tickets + 1;
        else if (t >= 49) ok = friendFacs >= 4;
        else ok = friendFacs >= 3 || (t >= 33 && t <= 36);
        if (t <= 24 && friendFacs < 3) ok = false;
        if (!ok) return [];
        const total = trains.reduce((a, o) => a + o.parts.stats + o.parts.sp, 0);
        const notes = [friendFacs + " facilities with friendship", "no energy cost and can't fail"];
        if (t >= 33 && t <= 36 && friendFacs < 3) notes.push("use it before summer camp");
        if (t >= 49 && t < 65) notes.push("an exceptional turn; otherwise keep the ticket through camp for 3 in the last half year");
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
        let reserve = urgent ? 0 : ctx.camp ? 0.3 * ctx.typ : 0.9 * ctx.typ;
        const gain = (best.parts.stats + best.parts.sp) * 1.6;
        const moodDrop = ctx.state.mood > 0 ? ctx.moodStep(ctx.state.mood - 1) : 0;
        const notes = ["every card and member joins every facility", urgent ? left + " left and the half year ends on turn " + end + ": use it or lose it" : good ? "high-value turn" : "energy is low, so consider saving it"];
        // game8: early on, use it when all three gauges are full; from Classic camp on, not on
        // turns when members rank up (the gains hit the cap).
        const rankUps = ctx.state.facilities.reduce((a, f) => a + ((f.extras && f.extras.fullgauge) || 0), 0);
        if (t <= 36 && x.allFull) { reserve -= 0.4 * ctx.typ; notes.push("all three gauges are full: the best early DREAMS turn"); }
        if (t >= 37 && rankUps && !urgent) { reserve += 0.5 * ctx.typ * rankUps; notes.push("a member ranks up this turn; guides avoid DREAMS training then (gains hit the cap)"); }
        return [{
          kind: "scenario", label: "DREAMS training (" + STAT_LABELS[best.stat] + ")", energyDelta: delta, fail: best.fail,
          parts: { scenario: gain - reserve, energy: ctx.energyValue(delta), risk: -(best.fail / 100) * (gain + 0.5 * ctx.typ + moodDrop) },
          notes,
          consume: { dreamsLeft: (v) => Math.max(0, (v != null ? +v : 2) - 1) }
        }];
      },
      afterTurn(s) {
        // 2 per half year; Senior June's meeting refills 4 for the last half year.
        if ([12, 24, 36, 48].indexOf(s.turn) !== -1) s.extras.dreamsLeft = 2;
        if (s.turn === 60) s.extras.dreamsLeft = 4;
        s.extras.allFull = false;
      }
    },

    ramen: {
      items(ctx, options) {
        const x = ctx.state.extras || {};
        const best = bestTraining(options);
        if (!best || !x.tasting) return;
        // Tips reset after each Late December, so the last turns of a year use them up.
        const t = ctx.state.turn;
        const yearEnd = (x.tips || 0) > 0 && [24, 48, 72].some((d) => d - t >= 0 && d - t <= 2);
        if (isStrong(best, ctx) || (x.tips || 0) >= 9 || ctx.camp || yearEnd) {
          useOn(best, ctx, "Hold a tasting session", best.parts.stats * 0.25, yearEnd && !isStrong(best, ctx) ? "tips reset after Late December, so use them now" : (x.tips || 0) >= 9 ? "tips are near the 10 cap" : "tasting right before a friendship training", { tasting: false });
        }
      }
    }
  };

  const api = {
    STATS, STAT_LABELS, MOODS, MOOD_MULT, BUILDS, RACES, FACILITY, HOOKS,
    turnInfo, phaseFor, eventsFor, traineeGoals, autoGoalTurns, isGoalTurn, akikawaCheck, cardEvents, rankEventChoices, eventText, dateCard, dateText, dateScale, scaleDate, gradeGoal, gradePlan, gradePlanText, racesAt, expectedFans, fanPlan, fanPlanText, GRADE_KEY, GRADE_LABEL, isCamp, campTurns, recommend, evaluate, advance, undo,
    estimateFail, estimateGain, calibFactor, typAt, forcedTurns, deckInfo, facLevelFor, scenarioBoost,
    songBonuses, hypeStatus, songAdvice, songPlan, tokenGain, tokenCap, facilityRainbows
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.UmaEngine = api;
})(typeof window !== "undefined" ? window : globalThis);
