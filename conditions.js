// Named career conditions. Random outcomes are recorded when observed, never
// silently sampled into the user's saved run. Character-specific conditions
// without a verified command effect remain useful records with explicit notes.
(function (root) {
  const list = [
    { id: "charming", name: "Charming ○", good: true, text: "+2 support bond when training." },
    { id: "fastLearner", name: "Fast Learner", good: true, text: "Skill purchases cost 10% less. The coach does not keep a full skill-purchase balance." },
    { id: "perfect", name: "Practice Perfect ○", good: true, fail: -2, text: "Estimated failure −2 percentage points." },
    { id: "perfectPlus", name: "Practice Perfect ◎", good: true, fail: -4, text: "Estimated failure −4 percentage points." },
    { id: "hotTopic", name: "Hot Topic", good: true, text: "+40% NPC bond; applied to tracked Akikawa training bond." },
    { id: "shining", name: "Shining Brightly", good: true, special: true, fail: -5, text: "Estimated failure −5 percentage points. Character career condition." },
    { id: "fanPromise", name: "Fan Promise", good: true, special: true, text: "Smart Falcon's promised-location race reward. Enter the actual reward when received." },
    { id: "positiveThinking", name: "ポジティブ思考", good: true, special: true, text: "One mood decrease prevented. Record its acquisition/removal as shown by the game." },
    { id: "lucky", name: "幸運体質", good: true, special: true, text: "One negative condition prevented. Record its acquisition/removal as shown by the game." },
    { id: "poor", name: "Practice Poor", fail: 2, cure: true, text: "Estimated failure +2 percentage points." },
    { id: "migraine", name: "Migraine", cure: true, text: "Mood cannot rise until cured." },
    { id: "skin", name: "Skin Outbreak", cure: true, text: "Random mood drops: enter the actual mood change when it happens." },
    { id: "nightOwl", name: "Night Owl", cure: true, text: "Random energy/mood loss: enter the actual change when it happens." },
    { id: "slowMetabolism", name: "Slow Metabolism", cure: true, text: "Training cannot increase Speed; event rewards are separate." },
    { id: "slacker", name: "Slacker", cure: true, text: "Training may be skipped. Select Did not show up when observed." },
    { id: "underWeather", name: "Under the Weather", special: true, fail: 5, text: "Estimated failure +5 percentage points. Removed by the required career event, not the Infirmary." },
    { id: "notReady", name: "Not Ready", special: true, text: "Possible −5 energy after racing. Enter the observed loss; ends at its career event." },
    { id: "glass", name: "Legs of Glass", special: true, text: "Consecutive non-goal races can cost energy and give Practice Poor. Record the game's result." },
    { id: "springBud", name: "春待つ蕾", special: true, text: "Possible −5 energy after racing. Enter the observed loss; ends at its career event." },
    { id: "ominous", name: "Ominous Portent", special: true, text: "Bad events become more likely. Record observed effects; ends at its career event." },
    { id: "future", name: "前程万哩", special: true, text: "Career-specific Medium aptitude reduction. Update the actual aptitude when evaluating a race." }
  ];
  function has(state, id) { return !!((state.conditions || {})[id] || id === "poor" && state.practicePoor); }
  const curable = (state) => !!state.badCondition || list.some((x) => x.cure && has(state, x.id));
  const failure = (state) => list.reduce((n, x) => n + (x.fail && has(state, x.id) ? x.fail : 0), 0);
  function moodAfter(state, delta, cured = false) {
    const change = has(state, "migraine") && !cured ? Math.min(0, delta || 0) : delta || 0;
    return Math.max(0, Math.min(4, state.mood + change));
  }
  function set(state, id, value) {
    state.conditions = Object.assign({}, state.conditions, { [id]: !!value });
    if (id === "poor") {
      state.practicePoor = !!value;
      if (value) state.conditions.perfect = false;
    }
    if (value && (id === "perfect" || id === "perfectPlus")) {
      state.practicePoor = false; state.conditions.poor = false;
      state.conditions[id === "perfect" ? "perfectPlus" : "perfect"] = false;
    }
    if (value && id === "shining") state.conditions.underWeather = false;
    if (value && id === "underWeather") state.conditions.shining = false;
  }
  function cure(state) {
    state.badCondition = false; state.practicePoor = false;
    state.conditions = Object.assign({}, state.conditions);
    list.filter((x) => x.cure).forEach((x) => { state.conditions[x.id] = false; });
  }
  const api = { list, has, set, cure, curable, failure, moodAfter };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.UmaConditions = api;
})(typeof window !== "undefined" ? window : globalThis);
