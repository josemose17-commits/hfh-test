// Scenario data for the Uma Musume turn coach.
// Compiled from JP/Global guides as of October 2026. Turn numbers marked "approx"
// are best-effort; the in-game goal list is always the authority.
//
// Turn numbering: 1-24 Junior, 25-48 Classic, 49-72 Senior, 73-78 finale.
// Each year has 24 turns (Early/Late for each month, starting in January).
(function (root) {
  // Inputs every scenario can add. `scope: "facility"` shows the field on each of
  // the five training cards; `scope: "turn"` shows it once in the turn panel.
  const SCENARIOS = [
    {
      id: "ura",
      name: "URA Finale",
      jpName: "URAファイナルズ",
      status: "global",
      jpRelease: "2021-02-24",
      globalRelease: "2025-06-26",
      totalTurns: 78,
      finale: { name: "URA Finals", turns: [74, 76, 78], note: "Qualifier, Semifinal and Final, with a training turn before each." },
      summary: "The base scenario. No extra gimmick: win your goal races and spend every other turn on the best friendship training.",
      coreLoop: [
        "Junior year: train where the most un-bonded cards are, so friendship trainings unlock by early Classic.",
        "From Classic on, take friendship trainings (rainbow) in your main stats and skip weak single-card turns.",
        "Rest before the two summer camps so you start them with high energy.",
        "Save skill points for the finale and buy skills that suit your distance and style."
      ],
      deck: "Speed-heavy deck (3-4 Speed) plus Power or Stamina for your distance, and one Wit card for energy recovery.",
      keyCards: ["Kitasan Black (Speed)", "Fine Motion (Wit)", "Super Creek (Stamina)"],
      inputs: [],
      events: [
        { turn: 12, label: "Make Debut", tip: "Goal race. Have mood at Good or better." },
        { turn: 73, label: "Finale prep", tip: "The last turns before each finale race are training turns. Use them on the best friendship training." }
      ],
      hook: "ura"
    },
    {
      id: "unity",
      name: "Unity Cup",
      jpName: "アオハル杯 ～輝け、チームの絆～",
      aka: "Aoharu Cup",
      status: "global",
      jpRelease: "2021-08-30",
      globalRelease: "2025-11-06",
      totalTurns: 78,
      finale: { name: "Unity Cup Final", turns: [72], note: "The Unity Cup team final closes the career. Check your in-game goals for the exact turn." },
      summary: "You recruit a team. Training next to team members raises their stats, and cards with a full spirit flame trigger Spirit Explosions for big stat bursts.",
      coreLoop: [
        "Junior: train where team members (unity icons) gather to recruit them and raise team stats early.",
        "Spirit flames fill as you train with a card. A full white flame triggers a Spirit Explosion when you train with it.",
        "Aim explosions at your main stats (Speed, plus Power or Stamina). Don't waste them on stats you don't need.",
        "Each Unity Cup round grades your team. Winning rounds gives stat rewards, so keep team training going until Senior."
      ],
      deck: "Fewer cards of your main type than in URA. Mixed decks make more flames. Speed or Power cards that tolerate missing friendship work well.",
      keyCards: ["Riko Kashimoto (Friend, team scenario link)", "Kitasan Black (Speed)"],
      inputs: [
        { id: "burst", label: "Spirit flames ready", scope: "facility", type: "number", max: 5, help: "Cards here with a full (white) flame" },
        { id: "team", label: "Team members", scope: "facility", type: "number", max: 5, help: "Unity Cup members shown on the facility" }
      ],
      events: [
        { turn: 24, label: "Unity Cup round 1", tip: "approx. Your team's stats decide the result. Training with members beforehand helps." },
        { turn: 36, label: "Unity Cup round 2", tip: "approx." },
        { turn: 48, label: "Unity Cup round 3", tip: "approx." },
        { turn: 60, label: "Unity Cup round 4", tip: "approx." },
        { turn: 72, label: "Unity Cup final", tip: "approx. Final team race." }
      ],
      hook: "unity"
    },
    {
      id: "trackblazer",
      name: "Trackblazer: Start of the Climax",
      jpName: "Make a new track!! ～クライマックス開幕～",
      aka: "Climax, MANT",
      status: "global",
      jpRelease: "2022-02-24",
      globalRelease: "2026-03-12",
      totalTurns: 78,
      finale: { name: "Twinkle Star Climax", turns: [74, 76, 78], note: "Three finale races. Your result decides the scenario bonus." },
      summary: "There are no fixed goal races. You race often to earn Grade Points and coins, then spend coins in the shop on items that boost training.",
      coreLoop: [
        "Race a lot. G1s and G2s that fit your aptitude give the most Grade Points and coins.",
        "Avoid more than 3 races in a row. Consecutive racing risks bad conditions and mood drops.",
        "Buy Megaphones (training boost), Ankle Weights and Good-Luck Charms (0% failure), then use them together on 2+ rainbow trainings, especially at summer camp.",
        "Keep energy and mood items for summer camp and the last stretch so you never waste a strong turn on rest."
      ],
      deck: "Race-bonus cards matter here (aim for 35%+ total race bonus). Speed and Power with high race bonus are best.",
      keyCards: ["Kitasan Black (Speed, race bonus)", "Satono Diamond (Stamina)"],
      inputs: [
        { id: "megaphone", label: "Megaphone in bag", scope: "turn", type: "check" },
        { id: "charm", label: "Good-Luck Charm in bag", scope: "turn", type: "check" },
        { id: "consec", label: "Races in a row so far", scope: "turn", type: "number", max: 6 }
      ],
      events: [
        { turn: 12, label: "Make Debut", tip: "Coins start flowing once you begin racing." },
        { turn: 24, label: "Grade Point check", tip: "approx. Make sure you are on pace for the Grade Point target." },
        { turn: 48, label: "Grade Point check", tip: "approx." },
        { turn: 72, label: "Grade Point check", tip: "approx. Last check before the Climax." }
      ],
      hook: "trackblazer"
    },
    {
      id: "grandlive",
      name: "Brighter Together: Our Grand Concert",
      jpName: "つなげ、照らせ、ひかれ。私たちのグランドライブ",
      aka: "Grand Live",
      status: "global",
      jpRelease: "2022-08-24",
      globalRelease: "2026-07-22",
      totalTurns: 78,
      finale: { name: "Grand Live finale", turns: [74, 76, 78], note: "Finale races and the closing live. Check your in-game goals." },
      summary: "Training earns performance points (Dance, Passion, Vocal, Visual, Mental). You spend them on lessons that unlock songs, training bonuses and skill hints.",
      coreLoop: [
        "Early on, buy lessons that boost training effect and friendship.",
        "Later, buy lessons that give stats and skill hints.",
        "Lives happen at set points. Unlocked songs give bonuses that last into the next stretch.",
        "Friendship training stays your main source of stats. Lessons multiply it."
      ],
      deck: "A normal stat deck works. The scenario friend card (Tracen Academy / Light Hello) is a strong pick.",
      keyCards: ["Light Hello (Friend)"],
      inputs: [
        { id: "lesson", label: "Can buy a training-boost lesson", scope: "turn", type: "check" }
      ],
      events: [
        { turn: 24, label: "Live", tip: "approx. Unlock songs before this point." },
        { turn: 48, label: "Live", tip: "approx." },
        { turn: 72, label: "Live", tip: "approx." }
      ],
      hook: "grandlive"
    },
    {
      id: "grandmasters",
      name: "Grand Masters",
      jpName: "グランドマスターズ -継ぐ者達へ-",
      status: "global-soon",
      jpRelease: "2023-02-24",
      globalRelease: "Estimated late Nov to early Dec 2026",
      totalTurns: 78,
      finale: { name: "Grand Masters finale", turns: [74, 76, 78], note: "Check your in-game goals." },
      summary: "Goddess fragments appear on trainings. Collect them to form Goddess Wisdom effects, which you trigger on strong turns.",
      coreLoop: [
        "Training on a facility with fragments collects them.",
        "Filling a set unlocks a Goddess Wisdom. Each color does something different, such as a training boost, energy recovery or friendship.",
        "Save Wisdom for 2+ rainbow trainings or summer camp.",
        "Choose fragment trainings when they also hold friendship cards. Don't take a weak training only for a fragment."
      ],
      deck: "Speed and Power core, plus cards that bring the goddess colors you want.",
      keyCards: [],
      inputs: [
        { id: "frag", label: "Goddess fragments", scope: "facility", type: "number", max: 3 },
        { id: "wisdom", label: "Goddess Wisdom ready", scope: "turn", type: "check" }
      ],
      events: [],
      hook: "grandmasters"
    },
    {
      id: "larc",
      name: "Project L'Arc",
      jpName: "プロジェクトL'Arc",
      status: "jp",
      jpRelease: "2023-08-24",
      globalRelease: "TBA",
      totalTurns: 67,
      finale: { name: "Prix de l'Arc de Triomphe (Senior)", turns: [67], note: "The career ends with the Senior-year Arc." },
      summary: "An overseas campaign aimed at the Arc. You raise the Aspiration gauge, earn supporter points to unlock potential upgrades, and take SS Matches.",
      coreLoop: [
        "Train with rivals (supporters) on the facility to earn points and raise Aspiration.",
        "Spend points on potential upgrades. Overseas aptitude and the training-effect upgrades come first.",
        "Use SS Matches when they are available and your trainings are weak. They give stats and hints with no energy cost.",
        "France summer (Classic and Senior) is your strongest training window. Arrive with high energy."
      ],
      deck: "Speed and Stamina for 2400m turf. Power for the heavy French ground.",
      keyCards: [],
      inputs: [
        { id: "rivals", label: "Rivals present", scope: "facility", type: "number", max: 5 },
        { id: "ss", label: "SS Match available", scope: "turn", type: "check" }
      ],
      events: [
        { turn: 37, label: "France expedition", tip: "approx. Overseas summer training starts." },
        { turn: 43, label: "Arc (Classic)", tip: "approx. Classic-year Arc." },
        { turn: 61, label: "France expedition", tip: "approx." },
        { turn: 67, label: "Arc (Senior)", tip: "approx. Final race." }
      ],
      hook: "larc"
    },
    {
      id: "uaf",
      name: "U.A.F. Ready GO!",
      jpName: "U.A.F. Ready GO! ～アスリートのきらめき～",
      status: "jp",
      jpRelease: "2024-02-24",
      globalRelease: "TBA",
      totalTurns: 78,
      finale: { name: "UAF finale", turns: [74, 76, 78], note: "Check your in-game goals." },
      summary: "Each facility hosts sports in three genres (colors). Training levels up those sports, and the UAF festival every half year checks your sport levels.",
      coreLoop: [
        "Train in the same genre color over consecutive turns for genre bonuses.",
        "Spread sport levels so you clear every UAF festival check.",
        "Friendship training in the matching genre is the best turn you can get.",
        "Before each festival, top up sports that are below the required level."
      ],
      deck: "Five-type deck (one of each stat) so every genre has support.",
      keyCards: [],
      inputs: [
        { id: "genre", label: "Matches genre streak", scope: "facility", type: "check" }
      ],
      events: [
        { turn: 24, label: "UAF festival", tip: "approx." },
        { turn: 48, label: "UAF festival", tip: "approx." },
        { turn: 72, label: "UAF festival", tip: "approx." }
      ],
      hook: "uaf"
    },
    {
      id: "cooking",
      name: "Great Food Festival",
      jpName: "収穫ッ！満腹ッ！大豊食祭",
      status: "jp",
      jpRelease: "2024-06-26",
      globalRelease: "TBA",
      totalTurns: 78,
      finale: { name: "Food Festival finale", turns: [74, 76, 78], note: "Check your in-game goals." },
      summary: "Training harvests vegetables. You upgrade the farm and cook dishes whose effects boost training for the next turns.",
      coreLoop: [
        "Training harvests ingredients. Upgrade farm plots for the stats you need.",
        "Cook a dish right before a strong friendship training, or before summer camp.",
        "Clear the cooking events at each festival checkpoint for big bonuses.",
        "Don't let ingredients overflow. Cook when you are close to the cap."
      ],
      deck: "Normal stat deck. Wit cards help with energy because dishes push you to train a lot.",
      keyCards: [],
      inputs: [
        { id: "harvest", label: "Harvest icons", scope: "facility", type: "number", max: 5 },
        { id: "dish", label: "Dish ready to cook", scope: "turn", type: "check" }
      ],
      events: [],
      hook: "cooking"
    },
    {
      id: "mecha",
      name: "Run! Mecha Umamusume",
      jpName: "走れ！メカウマ娘 -夢の繋ぎ方-",
      status: "jp",
      jpRelease: "2024-10-29",
      globalRelease: "TBA",
      totalTurns: 78,
      finale: { name: "Mecha finale", turns: [74, 76, 78], note: "Check your in-game goals." },
      summary: "Training earns research points that raise the Mecha research level. You tune chips for passive bonuses and fire Overdrive for boosted training.",
      coreLoop: [
        "Hit the research level target at each checkpoint.",
        "Put tuning points into the chips that boost your main stats and friendship.",
        "Fire Overdrive on 2+ rainbow trainings. Don't use it on weak turns.",
        "Facilities that show more research points are worth a little more early on."
      ],
      deck: "Speed and Power core. Research gain scales with card count on a facility.",
      keyCards: [],
      inputs: [
        { id: "research", label: "Research points shown", scope: "facility", type: "number", max: 99 },
        { id: "overdrive", label: "Overdrive ready", scope: "turn", type: "check" }
      ],
      events: [
        { turn: 24, label: "Research check", tip: "approx." },
        { turn: 48, label: "Research check", tip: "approx." }
      ],
      hook: "mecha"
    },
    {
      id: "legends",
      name: "The Twinkle Legends",
      jpName: "The Twinkle Legends",
      aka: "Legends",
      status: "jp",
      jpRelease: "2025-02-24",
      globalRelease: "TBA",
      totalTurns: 78,
      finale: { name: "Legends finale", turns: [74, 76, 78], note: "Check your in-game goals." },
      summary: "Legend Umamusume appear on trainings. Training with them fills a gauge, and you choose buffs (mastery) from the legend you follow.",
      coreLoop: [
        "Pick one legend color early and stick with it so its buffs stack.",
        "Train where your legend appears to fill the gauge faster.",
        "Spend a full gauge on a 2+ rainbow training or at summer camp.",
        "Buffs are permanent, so take training-effect buffs before hint buffs."
      ],
      deck: "Normal stat deck. Include the legend-linked cards for the color you plan to follow.",
      keyCards: [],
      inputs: [
        { id: "legend", label: "Legend on facility", scope: "facility", type: "check" },
        { id: "gauge", label: "Legend gauge full", scope: "turn", type: "check" }
      ],
      events: [],
      hook: "legends"
    },
    {
      id: "island",
      name: "Welcome to the Island",
      jpName: "無人島へようこそ -DESIGN YOUR ISLAND-",
      aka: "Island",
      status: "jp",
      jpRelease: "2025-06-27",
      globalRelease: "TBA",
      totalTurns: 78,
      finale: { name: "Island finale", turns: [74, 76, 78], note: "Check your in-game goals." },
      summary: "You build training facilities on an island. Island Training uses a ticket, costs no energy, can't fail, and trains every facility at once.",
      coreLoop: [
        "Junior: build bonds first. Island Training pays off once friendships are active.",
        "Use Island Training when 3 or more facilities show friendship (the beach house bonus scales with that).",
        "Each building plan follows an evaluation. Usual target: two Instinct (本能全開) facilities at Lv5 and two Technique (熟練技巧) at Lv4, mostly Speed and Stamina.",
        "Build the beach house in the first or second plan and leave it at Lv1.",
        "You can carry up to 3 tickets into the last half year, so bank them before Senior July."
      ],
      deck: "Highlander deck (one of each type). SSR Tucker Bryne at 3LB+ is the top pick.",
      keyCards: ["Tucker Bryne (SSR, 3LB+)"],
      inputs: [
        { id: "tickets", label: "Island Training tickets", scope: "turn", type: "number", max: 9 }
      ],
      events: [
        { turn: 3, label: "First building plan", tip: "Plan your facilities. Prioritize the stats with the highest caps." },
        { turn: 12, label: "Evaluation", tip: "approx. A new building plan follows." },
        { turn: 24, label: "Evaluation", tip: "approx." },
        { turn: 36, label: "Evaluation", tip: "approx." },
        { turn: 48, label: "Evaluation", tip: "approx." },
        { turn: 60, label: "Evaluation", tip: "approx. Bank up to 3 tickets for the final half year." }
      ],
      hook: "island"
    },
    {
      id: "onsen",
      name: "Yukoma Hot Springs",
      jpName: "ごくらく♪ゆこま温泉郷",
      aka: "Onsen",
      status: "jp",
      jpRelease: "2025-10-29",
      globalRelease: "TBA",
      totalTurns: 78,
      finale: { name: "Onsen finale", turns: [74, 76, 78], note: "Check your in-game goals." },
      summary: "Training digs hot springs. Each spring adds energy recovery and friendship bonuses. Bath tickets give buffs, and the year-end bathing party raises every training level.",
      coreLoop: [
        "Dig in this order: Shikku (疾駆) → Meiseki (明晰) → Tensho (天翔の古湯) → Shunsen (駿閃) → Yukoma (ゆこま源泉) → Densetsu (伝説の秘湯).",
        "If Shikku isn't finished by the 3rd pre-debut turn, give up on it.",
        "Use bath tickets before strong trainings. Almost always be in a bath, and never let tickets overflow, especially before summer camp and the finale.",
        "Yukoma Spring appears in Senior January. Dig it right away.",
        "Mostly train. Avoid PR activities and extra races."
      ],
      deck: "SSR Kenko Hoshina (friend) is close to required: her link effect greatly raises bath tickets.",
      keyCards: ["Kenko Hoshina (SSR Friend)"],
      inputs: [
        { id: "baths", label: "Bath tickets", scope: "turn", type: "number", max: 9 },
        { id: "bathcap", label: "Ticket cap", scope: "turn", type: "number", max: 9, default: 3 }
      ],
      events: [
        { turn: 3, label: "Shikku deadline", tip: "Give up on Shikku if it isn't dug by now." },
        { turn: 24, label: "Bathing party", tip: "Success raises every training level by 1." },
        { turn: 48, label: "Bathing party", tip: "Success raises every training level by 1." },
        { turn: 49, label: "Yukoma Spring", tip: "Strongest spring. Dig it right away." }
      ],
      hook: "onsen"
    },
    {
      id: "dreams",
      name: "Beyond Dreams",
      jpName: "Beyond Dreams 共に前へ、共に光を",
      status: "jp",
      jpRelease: "2026-02-24",
      globalRelease: "TBA",
      totalTurns: 78,
      finale: { name: "Breeders' Cup goal", turns: [], note: "You pick the final Breeders' Cup race. The highest-sorted choice is usually best. Follow the in-game goal schedule." },
      summary: "You lead a team of three. Training with members fills their Dream gauge, and training with a full gauge ranks them up. DREAMS training puts up to 5 cards on every facility.",
      coreLoop: [
        "Train where 2+ team members (or their gauge points) show up.",
        "Team rank equals your lowest member's rank, so raise all three gauges evenly.",
        "About 3 trainings with a member fill their gauge. Rank them up by training with them at full gauge.",
        "Save DREAMS training for high-value turns like summer camp or when energy is high. Every card joins every facility.",
        "Use strategy meetings and reviews to point the team at your main stats."
      ],
      deck: "SSR Casino Drive (friend) is the top pick. Use at least 5 types: Speed, Stamina, Power, Wit, Guts and Casino Drive.",
      keyCards: ["Casino Drive (SSR Friend)"],
      inputs: [
        { id: "members", label: "Team members", scope: "facility", type: "number", max: 3 },
        { id: "fullgauge", label: "Members at full gauge", scope: "facility", type: "number", max: 3 },
        { id: "dreamsReady", label: "DREAMS training available", scope: "turn", type: "check" }
      ],
      events: [],
      hook: "dreams"
    },
    {
      id: "ramen",
      name: "Rasshai! Trecen-ken!",
      jpName: "らっしゃい！トレセン軒！ ～恩返し、始めました～",
      aka: "Ramen",
      status: "jp-current",
      jpRelease: "2026-06-29",
      globalRelease: "TBA",
      totalTurns: 78,
      finale: { name: "URA Finals (special ramen)", turns: [74, 76, 78], note: "The special ramen gives +20 energy per turn, +1 mood and +150% friendship bonus, so take friendship training every turn." },
      summary: "Training fills noodle, soup and topping gauges that earn ramen tips (max 10). Tasting sessions spend a region's tips on buffs, then the Ramen Jamboree (RMJ) checks your progress.",
      coreLoop: [
        "Pick regions so the base gauge gains are spread out, for example 2 noodle / 3 soup / 5 topping.",
        "Hold a tasting session right before a friendship training. The buff makes that training much stronger.",
        "Tips cap at 10. Spend them before they overflow.",
        "During the URA Finals the special ramen removes energy limits, so take friendship training every turn."
      ],
      deck: "Use at least 4 card types. This scenario has the highest stat caps so far, which makes it the best choice for Champions Meeting and LoH builds.",
      keyCards: [],
      inputs: [
        { id: "tips", label: "Ramen tips held", scope: "turn", type: "number", max: 10 },
        { id: "tasting", label: "Tasting session available", scope: "turn", type: "check" }
      ],
      events: [
        { turn: 73, label: "Special ramen", tip: "Free energy every turn. Take friendship training every turn." }
      ],
      hook: "ramen"
    },
    {
      id: "festival",
      name: "Tomo, Fumitoki: Goshiki Shuntaisai",
      jpName: "朋、史解き ―午式駿大祭―",
      status: "announced",
      jpRelease: "Late Oct 2026 (announced)",
      globalRelease: "TBA",
      totalTurns: 78,
      finale: { name: "Festival finale", turns: [], note: "Mechanics haven't been revealed yet." },
      summary: "Announced for late October 2026 in JP. It's set at a festival held once every twelve years, with Umamusume appointed as sacred horses (神駒). Mechanics haven't been revealed, so the coach uses general training logic.",
      coreLoop: [
        "Mechanics haven't been revealed. The coach uses the general rules: bonds in Junior, friendship from Classic, rest before camp.",
        "This entry will be updated once guides for the scenario are out."
      ],
      deck: "Unknown until release.",
      keyCards: [],
      inputs: [],
      events: [],
      hook: "ura"
    }
  ];

  const STATUS_LABELS = {
    "global": "On Global",
    "global-soon": "Global next",
    "jp": "JP only",
    "jp-current": "JP latest",
    "announced": "Announced"
  };

  const api = { SCENARIOS, STATUS_LABELS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.UmaScenarios = api;
})(typeof window !== "undefined" ? window : globalThis);
