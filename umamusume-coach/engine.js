// Turn coach engine. Pure functions only, so it runs in the browser and in Node tests.
(function (root) {
  const STATS = ["speed", "stamina", "power", "guts", "wit"];
  const STAT_LABELS = { speed: "Speed", stamina: "Stamina", power: "Power", guts: "Guts", wit: "Wit" };
  const MOODS = ["Awful", "Bad", "Normal", "Good", "Great"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const YEARS = ["Junior", "Classic", "Senior"];

  // How much each stat is worth for a build, before caps.
  const BUILDS = {
    sprint: { label: "Sprint (≤1400m)", w: { speed: 1.0, stamina: 0.3, power: 0.85, guts: 0.4, wit: 0.75 } },
    mile: { label: "Mile (1600m)", w: { speed: 1.0, stamina: 0.45, power: 0.8, guts: 0.35, wit: 0.7 } },
    medium: { label: "Medium (2000-2400m)", w: { speed: 1.0, stamina: 0.65, power: 0.75, guts: 0.35, wit: 0.65 } },
    long: { label: "Long (2500m+)", w: { speed: 1.0, stamina: 0.9, power: 0.65, guts: 0.4, wit: 0.6 } },
    dirt: { label: "Dirt mile/medium", w: { speed: 1.0, stamina: 0.5, power: 0.9, guts: 0.35, wit: 0.65 } }
  };

  const CAMP_TURNS = [37, 38, 39, 40, 61, 62, 63, 64];

  function turnInfo(turn, scenario) {
    const total = scenario ? scenario.totalTurns : 78;
    if (turn > 72) {
      return { year: "Finale", text: "Finale · turn " + (turn - 72), short: "F" + (turn - 72), total };
    }
    const y = Math.floor((turn - 1) / 24);
    const inYear = (turn - 1) % 24;
    const month = Math.floor(inYear / 2);
    const half = inYear % 2 === 0 ? "Early" : "Late";
    return {
      year: YEARS[y],
      month: MONTHS[month],
      half,
      text: YEARS[y] + " · " + half + " " + MONTHS[month],
      short: half[0] + " " + MONTHS[month],
      total
    };
  }

  function isCamp(turn) {
    return CAMP_TURNS.indexOf(turn) !== -1;
  }

  // The general plan for a stretch of the career, shared by every scenario.
  function phaseFor(turn, scenario) {
    const finaleStart = scenario && scenario.totalTurns < 78 ? scenario.totalTurns + 1 : 73;
    if (turn >= finaleStart) {
      return { id: "finale", name: "Finale", tip: "Every turn counts now. Take the strongest training and spend skill points before the last race." };
    }
    if (turn <= 11) return { id: "predebut", name: "Pre-debut", tip: "Build bonds. Train where the most orange (un-bonded) cards gather, and use Wit training to save energy." };
    if (turn <= 24) return { id: "junior", name: "Junior", tip: "Keep building bonds until most cards are green or better. Take friendship trainings as they appear." };
    if (turn <= 36) return { id: "classic1", name: "Classic spring", tip: "Friendship trainings in your main stats come first. Enter summer camp with high energy and Good or Great mood." };
    if (turn <= 40) return { id: "camp1", name: "Classic summer camp", tip: "Facilities are at max level. Take every strong training and rest only when failure gets risky." };
    if (turn <= 48) return { id: "classic2", name: "Classic autumn", tip: "Keep stacking friendship trainings. Fill weak stats if your main ones are on track." };
    if (turn <= 60) return { id: "senior1", name: "Senior spring", tip: "Watch your stat caps. Shift weight to stats that are still behind, and start buying key skills." };
    if (turn <= 64) return { id: "camp2", name: "Senior summer camp", tip: "Last camp. Use saved items and buffs here." };
    return { id: "senior2", name: "Senior autumn", tip: "Finish the build: cover remaining stat gaps and plan which skills you will buy." };
  }

  function eventsFor(turn, scenario) {
    const out = [];
    if (turn === 12 && !(scenario.events || []).some((e) => e.turn === 12)) out.push({ turn, label: "Make Debut", tip: "Goal race." });
    if (turn === 36 || turn === 60) out.push({ turn, label: "Camp next turn", tip: "Rest now if energy is under ~70 so camp starts fresh." });
    if (turn === 37 || turn === 61) out.push({ turn, label: "Summer camp starts", tip: "Four turns at max facility level." });
    (scenario.events || []).forEach((e) => { if (e.turn === turn) out.push(e); });
    if (scenario.finale && scenario.finale.turns.indexOf(turn) !== -1) {
      out.push({ turn, label: scenario.finale.name, tip: scenario.finale.note });
    }
    return out;
  }

  function bondWeight(turn) {
    if (turn <= 12) return 7;
    if (turn <= 24) return 5;
    if (turn <= 36) return 2.5;
    if (turn <= 48) return 1;
    return 0.3;
  }

  function statWeights(state) {
    const build = BUILDS[state.build] || BUILDS.mile;
    const capped = state.capped || {};
    const w = {};
    STATS.forEach((s) => { w[s] = capped[s] ? build.w[s] * 0.15 : build.w[s]; });
    return w;
  }

  // Value of one training facility before scenario actions and items.
  function scoreFacility(f, state, scenario, w, avgW) {
    const notes = [];
    const statW = 0.6 * w[f.stat] + 0.4 * avgW;
    const cards = f.cards || 0;
    const rainbows = Math.min(f.rainbows || 0, cards || 5);
    let base;
    if (f.gain > 0) {
      base = f.gain * statW;
    } else {
      base = (8 + cards * 5 + rainbows * 14) * statW;
      if (isCamp(state.turn)) base *= 1.15;
    }
    if (rainbows >= 2) {
      base *= 1.15;
      notes.push(rainbows + " friendship cards stacked");
    } else if (rainbows === 1) {
      notes.push("1 friendship card");
    }
    const bond = (f.unbonded || 0) * bondWeight(state.turn);
    if (f.unbonded && bondWeight(state.turn) >= 2.5) notes.push(f.unbonded + " card(s) to bond with");
    const hint = f.hint ? (state.turn <= 48 ? 3 : 5) : 0;
    if (f.hint) notes.push("skill hint");
    let raw = base + bond + hint;

    const hook = HOOKS[scenario.hook] || {};
    if (hook.facility) {
      const r = hook.facility(f, state, raw);
      if (r) {
        raw += r.add || 0;
        if (r.note) notes.push(r.note);
      }
    }
    if (f.stat === "wit" && state.energy < 50) {
      raw += 3;
      notes.push("Wit is cheap on energy");
    }

    const fail = Math.max(0, f.fail || 0);
    const ignoreFail = hook.ignoreFail && hook.ignoreFail(state);
    let failPenalty = ignoreFail ? 0 : (fail / 100) * (raw + 20);
    if (!ignoreFail && fail > state.risk) failPenalty += (fail - state.risk) * 2.5;
    return { raw, score: raw - failPenalty, fail, rainbows, notes };
  }

  function recommend(state, scenario) {
    const w = statWeights(state);
    const avgW = STATS.reduce((a, s) => a + w[s], 0) / STATS.length;
    const hook = HOOKS[scenario.hook] || {};
    const maxE = state.maxEnergy || 100;
    const turnExtras = state.extras || {};

    const facilities = state.facilities.map((f) => Object.assign({ f }, scoreFacility(f, state, scenario, w, avgW)));
    const options = facilities.map((r) => ({
      kind: "train",
      stat: r.f.stat,
      label: "Train " + STAT_LABELS[r.f.stat],
      value: r.score,
      raw: r.raw,
      fail: r.fail,
      rainbows: r.rainbows,
      notes: r.notes.slice(),
      prefix: []
    }));

    const finaleRace = scenario.finale && scenario.finale.turns.indexOf(state.turn) !== -1;
    if (state.goalRace || finaleRace) {
      return finish({
        kind: "race",
        label: finaleRace ? "Race: " + scenario.finale.name : "Run your goal race",
        value: 999,
        notes: [finaleRace ? "Finale race turn." : "This turn holds a career goal race. Missing it ends the career."],
        prefix: []
      }, options, state, scenario);
    }

    const energy = state.energy;
    const ignoreEnergy = hook.ignoreFail && hook.ignoreFail(state);
    let restValue = 0;
    if (!ignoreEnergy) {
      if (energy < 30) restValue = 40 + (30 - energy);
      else if (energy < 50) restValue = 18 + (50 - energy) * 0.6;
      else restValue = Math.max(0, (maxE - energy) * 0.12);
      if ((state.turn === 36 || state.turn === 60) && energy < 70) restValue += 18;
      if (isCamp(state.turn) && state.mood < 3) restValue += 6;
    }
    const restNotes = [];
    if (energy < 50) restNotes.push("energy is " + energy);
    if ((state.turn === 36 || state.turn === 60) && energy < 70) restNotes.push("summer camp starts next turn");
    if (isCamp(state.turn)) restNotes.push("resting at camp also lifts mood");
    options.push({ kind: "rest", label: "Rest", value: restValue, notes: restNotes, prefix: [] });

    const mood = state.mood;
    let recValue = mood < 3 ? (3 - mood) * 13 + (state.turn < 61 ? 4 : 0) : 1;
    if (isCamp(state.turn)) recValue -= 4; // rest covers mood at camp
    options.push({
      kind: "recreation",
      label: "Recreation (outing)",
      value: recValue,
      notes: mood < 3 ? ["mood is " + MOODS[mood] + ". Low mood shrinks every training."] : [],
      prefix: []
    });

    if (state.badCondition) {
      options.push({ kind: "infirmary", label: "Infirmary", value: 34, notes: ["clear the bad condition before it spreads mood and stat losses"], prefix: [] });
    }

    if (state.raceAvailable) {
      let raceValue = 14 - (energy < 30 ? 20 : 0);
      const raceNotes = ["skill points and fans"];
      if (hook.race) {
        const r = hook.race(state);
        raceValue = r.value;
        if (r.note) raceNotes.push(r.note);
      }
      options.push({ kind: "race", label: "Run an optional race", value: raceValue, notes: raceNotes, prefix: [] });
    }

    if (hook.actions) {
      hook.actions(state, facilities, options).forEach((o) => options.push(Object.assign({ prefix: [], notes: [] }, o)));
    }
    if (hook.items) hook.items(state, options, turnExtras);

    options.sort((a, b) => b.value - a.value);
    return finish(options[0], options, state, scenario);
  }

  function finish(best, options, state, scenario) {
    const ranked = options.slice().sort((a, b) => b.value - a.value);
    const phase = phaseFor(state.turn, scenario);
    const second = ranked.find((o) => o !== best);
    const reasons = best.notes.slice();
    if (best.kind === "train") {
      if (best.fail > state.risk) reasons.push("failure " + best.fail + "% is above your " + state.risk + "% limit, but it still beats the other options");
      else if (best.fail > 0) reasons.push("failure " + best.fail + "%");
    }
    let confidence = "clear pick";
    if (second && second !== best && best.value < 900) {
      const gap = best.value - second.value;
      if (gap < 4) confidence = "close call";
      else if (gap < 10) confidence = "good pick";
    }
    return {
      action: best,
      headline: (best.prefix && best.prefix.length ? best.prefix.join(" → ") + " → " : "") + best.label,
      reasons,
      confidence,
      ranked,
      phase,
      events: eventsFor(state.turn, scenario),
      turn: turnInfo(state.turn, scenario)
    };
  }

  function strongest(options) {
    return options.filter((o) => o.kind === "train").sort((a, b) => b.value - a.value)[0];
  }

  // Scenario-specific rules. Each hook can:
  //  facility(f, state, raw) -> {add, note}  extra value on one facility
  //  race(state)             -> {value, note} replaces optional-race value
  //  actions(state, facs, options) -> extra options (scenario actions)
  //  items(state, options, extras) mutates training options (pre-training items/buffs)
  //  ignoreFail(state)       -> true when energy and failure don't matter this turn
  const HOOKS = {
    ura: {},

    unity: {
      facility(f, state, raw) {
        const x = f.extras || {};
        let add = 0;
        const notes = [];
        if (x.burst > 0) {
          const main = statWeights(state)[f.stat] >= 0.6;
          add += x.burst * (main ? 16 : 8);
          notes.push(x.burst + " Spirit Explosion" + (x.burst > 1 ? "s" : ""));
        }
        if (x.team > 0) {
          const wt = state.turn <= 36 ? 4 : state.turn <= 60 ? 2.5 : 1;
          add += x.team * wt;
          if (state.turn <= 60) notes.push(x.team + " team member(s) to train with");
        }
        return { add, note: notes.join(", ") };
      }
    },

    trackblazer: {
      race(state) {
        const consec = (state.extras && state.extras.consec) || 0;
        let value = 32;
        let note = "Grade Points and shop coins";
        if (consec >= 2) {
          value -= (consec - 1) * 12;
          note = consec + " races in a row already. Fatigue risk is climbing.";
        }
        if (state.energy < 25) value -= 18;
        return { value, note };
      },
      items(state, options, extras) {
        const best = strongest(options);
        if (!best) return;
        if (extras.megaphone && best.rainbows >= 2) {
          best.prefix.push("Use Megaphone");
          best.value += best.raw * 0.25 - 6;
          best.notes.push("Megaphone on a stacked friendship turn");
        }
        if (extras.charm && best.fail > state.risk && best.raw > 35) {
          best.prefix.push("Use Good-Luck Charm");
          best.value = best.raw - 6;
          best.notes.push("Charm sets failure to 0%");
        }
      }
    },

    grandlive: {
      items(state, options, extras) {
        if (extras.lesson) {
          const best = strongest(options);
          if (best) {
            best.prefix.push("Buy the training lesson");
            best.notes.push("training-boost lessons pay off more the earlier you buy them");
          }
        }
      }
    },

    grandmasters: {
      facility(f) {
        const n = (f.extras && f.extras.frag) || 0;
        return n ? { add: n * 5, note: n + " goddess fragment(s)" } : null;
      },
      items(state, options, extras) {
        const best = strongest(options);
        if (extras.wisdom && best && (best.rainbows >= 2 || isCamp(state.turn))) {
          best.prefix.push("Use Goddess Wisdom");
          best.value += best.raw * 0.2;
          best.notes.push("Wisdom on a strong turn");
        }
      }
    },

    larc: {
      facility(f, state) {
        const n = (f.extras && f.extras.rivals) || 0;
        return n ? { add: n * (state.turn <= 48 ? 4 : 2.5), note: n + " rival(s) for supporter points" } : null;
      },
      actions(state, facs, options) {
        if (!(state.extras && state.extras.ss)) return [];
        return [{ kind: "scenario", label: "SS Match", value: 28, notes: ["stats and hints with no energy cost", "best when your trainings are weak"] }];
      }
    },

    uaf: {
      facility(f) {
        return f.extras && f.extras.genre ? { add: 8, note: "keeps the genre streak" } : null;
      }
    },

    cooking: {
      facility(f) {
        const n = (f.extras && f.extras.harvest) || 0;
        return n ? { add: n * 2.5, note: n + " harvest icon(s)" } : null;
      },
      items(state, options, extras) {
        const best = strongest(options);
        if (extras.dish && best && (best.rainbows >= 2 || isCamp(state.turn))) {
          best.prefix.push("Cook a dish");
          best.value += best.raw * 0.2;
          best.notes.push("dish buff on a strong turn");
        }
      }
    },

    mecha: {
      facility(f, state) {
        const n = (f.extras && f.extras.research) || 0;
        return n ? { add: n * (state.turn <= 48 ? 0.25 : 0.12), note: n + " research points" } : null;
      },
      items(state, options, extras) {
        const best = strongest(options);
        if (extras.overdrive && best && best.rainbows >= 2) {
          best.prefix.push("Fire Overdrive");
          best.value += best.raw * 0.25;
          best.notes.push("Overdrive on a stacked friendship turn");
        }
      }
    },

    legends: {
      facility(f) {
        return f.extras && f.extras.legend ? { add: 6, note: "legend present" } : null;
      },
      items(state, options, extras) {
        const best = strongest(options);
        if (extras.gauge && best && (best.rainbows >= 2 || isCamp(state.turn))) {
          best.prefix.push("Spend legend gauge");
          best.value += best.raw * 0.2;
          best.notes.push("full gauge on a strong turn");
        }
      }
    },

    island: {
      actions(state, facs) {
        const tickets = (state.extras && state.extras.tickets) || 0;
        if (!tickets || isCamp(state.turn) || state.turn > 72) return [];
        const friendFacs = facs.filter((r) => r.rainbows > 0).length;
        const lastHalf = state.turn >= 65;
        const banking = state.turn >= 49 && state.turn < 61 && tickets <= 3;
        let ok = friendFacs >= 3 || (lastHalf && friendFacs >= 2) || (lastHalf && tickets > 0 && state.turn >= 71);
        if (banking && friendFacs < 4) ok = false;
        if (state.turn <= 24 && friendFacs < 3) ok = false;
        if (!ok) return [];
        const total = facs.reduce((a, r) => a + r.raw, 0);
        const notes = [friendFacs + " facilities with friendship", "no energy cost and can't fail"];
        if (banking) notes.push("you're banking tickets for the last half year, but this turn is worth it");
        return [{ kind: "scenario", label: "Island Training (use a ticket)", value: total * 0.5 + 6, notes }];
      }
    },

    onsen: {
      items(state, options, extras) {
        const best = strongest(options);
        const baths = extras.baths || 0;
        const cap = extras.bathcap || 3;
        if (!best || !baths) return;
        const overflow = baths >= cap;
        if (best.rainbows >= 2 || overflow || isCamp(state.turn) || state.turn >= 73) {
          best.prefix.push("Take a bath");
          best.value += best.raw * 0.2;
          best.notes.push(overflow ? "tickets at cap, so spend one before they overflow" : "bath buff on a strong turn");
        }
      }
    },

    dreams: {
      facility(f, state) {
        const x = f.extras || {};
        let add = 0;
        const notes = [];
        if (x.members) {
          add += x.members * 6;
          notes.push(x.members + " team member(s) for Dream gauge");
        }
        if (x.fullgauge) {
          add += x.fullgauge * 10;
          notes.push(x.fullgauge + " rank-up(s) ready");
        }
        return { add, note: notes.join(", ") };
      },
      actions(state, facs) {
        if (!(state.extras && state.extras.dreamsReady)) return [];
        const bestRaw = Math.max.apply(null, facs.map((r) => r.raw));
        const good = isCamp(state.turn) || state.energy >= 60;
        const best = facs.slice().sort((a, b) => b.raw - a.raw)[0];
        return [{
          kind: "scenario",
          label: "DREAMS training (" + STAT_LABELS[best.f.stat] + ")",
          value: bestRaw * 1.5 + (good ? 8 : -10),
          notes: ["every card joins every facility", good ? "high-value turn" : "energy is low, so consider saving it"]
        }];
      }
    },

    ramen: {
      ignoreFail(state) {
        return state.turn >= 73;
      },
      items(state, options, extras) {
        const best = strongest(options);
        if (!best || !extras.tasting) return;
        const tips = extras.tips || 0;
        if (best.rainbows >= 2 || tips >= 9 || isCamp(state.turn)) {
          best.prefix.push("Hold a tasting session");
          best.value += best.raw * 0.25;
          best.notes.push(tips >= 9 ? "tips are near the 10 cap" : "tasting right before friendship training");
        }
      }
    }
  };

  const api = { STATS, STAT_LABELS, MOODS, BUILDS, turnInfo, phaseFor, eventsFor, isCamp, recommend, scoreFacility, HOOKS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.UmaEngine = api;
})(typeof window !== "undefined" ? window : globalThis);
