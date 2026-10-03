// Scenario data for the Uma Musume turn coach.
// Compiled from JP and Global guides as of October 2026 (Global after the July 2026
// rebalance). Turns marked "approx." are best-effort; the in-game goal list wins.
//
// Turn numbering: 1-24 Junior, 25-48 Classic, 49-72 Senior, 73-78 finale.
// Each year has 24 turns (Early/Late for each month, starting in January).
//
// caps:      base stat caps [speed, stamina, power, guts, wit]. Inheritance can raise them.
// gainScale: how big trainings are compared with URA. The coach replaces this with your
//            own numbers once you have entered real gains on a few turns.
// finale.forced: true only where the finale race turns are certain.
// inputs:    extra fields. scope "facility" shows on each training, "turn" once per turn.
//            type is "number", "check" or "select" (with options).
(function (root) {
  const SCENARIOS = [
    {
      id: "ura",
      name: "URA Finale",
      jpName: "新設！URAファイナルズ",
      status: "global",
      jpRelease: "2021-02-24",
      globalRelease: "2025-06-26 (launch)",
      totalTurns: 78,
      caps: [1400, 1400, 1400, 1400, 1400],
      gainScale: 1.05,
      finale: { name: "URA Finals", turns: [74, 76, 78], forced: true, note: "Qualifier, Semifinal and Final, with a training turn before each." },
      summary: "The base scenario. Win your goal races and spend every other turn on the best friendship training. Since the July 2026 update, Happy Meek can appear on trainings for a duel, and every stat caps at 1400.",
      coreLoop: [
        "Junior: train where the most un-bonded cards gather so friendship trainings unlock by early Classic.",
        "From Classic on, take friendship (rainbow) trainings in your main stats and skip weak single-card turns.",
        "When Happy Meek shows up on a training, dueling her gives stats and the Race Essence (レースの真髄) hint. Enough wins bring a powered-up Meek to the final, who drops the Beyond the Limit (限界の先へ) hint.",
        "Arrive at both summer camps with high energy and Good or Great mood.",
        "Save skill points for the finale and buy skills that suit your distance and style."
      ],
      deck: "Speed-heavy deck (3-4 Speed) plus Power or Stamina for your distance, and one Wit card for energy.",
      keyCards: ["Kitasan Black (Speed)", "Fine Motion (Wit)", "Super Creek (Stamina)"],
      inputs: [
        { id: "meek", label: "Happy Meek here", scope: "facility", type: "check", help: "Training with her starts a duel" }
      ],
      events: [
        { turn: 12, label: "Make Debut", tip: "Goal race. Have mood at Good or better." },
        { turn: 73, label: "Finale prep", tip: "Training turns sit between the finale races. Use them on the best friendship training." }
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
      caps: [1300, 1300, 1300, 1300, 1800],
      gainScale: 1.15,
      finale: { name: "Unity Cup Final", turns: [], forced: false, note: "The team final closes the career. Mark it as a goal race on the turn your game shows." },
      summary: "You recruit a team. Training next to team members (Unity training) raises their stats, and a full spirit flame triggers a Spirit Burst. The July 2026 update raised burst and Unity training gains, removed their extra energy cost, and added Extreme Spirit Bursts.",
      coreLoop: [
        "Junior: train where team members (unity icons) gather to recruit them and grow the team early.",
        "Spirit flames fill as you train with a card. A full white flame triggers a Spirit Burst when you train with it: +15 to that facility's stat and +5 skill points (more with scenario-linked cards).",
        "You don't have to burst right away. Hold it until that member sits on a facility you want, ideally Speed or your second main stat.",
        "A Wit burst also restores 5 more energy. Bursts no longer cost extra energy.",
        "After a member's normal burst, each member can fire one Extreme Spirit Burst. It raises your stats and stat caps, gives an Ignited skill hint, and sets that training's failure to 0%. Use it on a risky but strong training.",
        "Wit caps at 1800 here, so Wit-heavy builds are strong in this scenario."
      ],
      deck: "Fewer cards of your main type than in URA. Mixed decks make more flames. Speed and Wit work well because of the high Wit cap.",
      keyCards: ["Riko Kashimoto (Friend, scenario link)", "Kitasan Black (Speed)"],
      inputs: [
        { id: "burst", label: "Bursts ready", scope: "facility", type: "number", max: 5, help: "Cards here with a full (white) flame" },
        { id: "extreme", label: "Extreme burst", scope: "facility", type: "check", help: "An Extreme Spirit Burst fires on this training" },
        { id: "team", label: "Team members", scope: "facility", type: "number", max: 5, help: "Unity Cup members shown on the facility" }
      ],
      events: [
        { turn: 24, label: "Unity Cup round", tip: "approx. Team stats decide the result. Train with members beforehand." },
        { turn: 36, label: "Unity Cup round", tip: "approx." },
        { turn: 48, label: "Unity Cup round", tip: "approx." },
        { turn: 60, label: "Unity Cup round", tip: "approx." }
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
      caps: [1200, 1900, 1200, 1200, 1500],
      gainScale: 1.0,
      finale: { name: "Twinkle Star Climax", turns: [74, 76, 78], forced: true, note: "Three finale races. Your result decides the scenario bonus." },
      summary: "There are no fixed goal races. You race for Grade Points and shop coins (1st place 100, 2nd-3rd 60, 4th-5th 30), then spend coins on items that boost training. The shop restocks every 6 turns.",
      coreLoop: [
        "Race often. G1s and G2s that fit your aptitude pay the most Grade Points and coins.",
        "Avoid more than 3 races in a row. Back-to-back racing risks bad conditions and mood drops.",
        "Megaphones: Coaching +20% for 4 turns (40 coins), Motivating +40% for 3 turns (55), Empowering +60% for 2 turns (70). Start one when a run of strong turns begins, such as summer camp.",
        "Ankle Weights: +50% to one stat's training for one turn and +20% energy use (50 coins). Use them on that stat's stacked friendship training.",
        "Good-Luck Charm sets failure to 0%, so you can train a big turn at low energy.",
        "Speed, Power and Guts cap at 1200 here, but Stamina reaches 1900 and Wit 1500."
      ],
      deck: "Race-bonus cards matter (aim for 35%+ total race bonus). Speed and Power cards with high race bonus are best.",
      keyCards: ["Kitasan Black (Speed, race bonus)", "Satono Diamond (Stamina)"],
      inputs: [
        { id: "megaphone", label: "Megaphone", scope: "turn", type: "select", options: [["0", "None"], ["20", "+20%"], ["40", "+40%"], ["60", "+60%"]] },
        { id: "weights", label: "Ankle Weights", scope: "turn", type: "check" },
        { id: "charm", label: "Good-Luck Charm", scope: "turn", type: "check" },
        { id: "consec", label: "Races in a row", scope: "turn", type: "number", max: 6, help: "Filled in for you from the career log" }
      ],
      events: [
        { turn: 12, label: "Make Debut", tip: "Coins start flowing once you race." },
        { turn: 24, label: "Grade Point check", tip: "approx. Make sure you are on pace." },
        { turn: 48, label: "Grade Point check", tip: "approx." },
        { turn: 72, label: "Grade Point check", tip: "approx. Last check before the Climax." }
      ],
      hook: "trackblazer"
    },
    {
      id: "grandlive",
      name: "Grand Concert",
      jpName: "つなげ、照らせ、ひかれ。私たちのグランドライブ",
      aka: "Grand Live",
      status: "global",
      jpRelease: "2022-08-24",
      globalRelease: "2026-07-22",
      totalTurns: 78,
      caps: [1600, 1300, 1300, 1500, 1300],
      gainScale: 1.15,
      finale: { name: "Grand Concert", turns: [], forced: false, note: "The career builds to the Grand Concert. Mark goal races as your game shows them." },
      summary: "Training earns performance points (Dance, Passion, Vocal, Visual, Mental; 200 each at first). You spend them on song lessons, which take no turn. Promo concerts run every six months from Late December of Junior year.",
      coreLoop: [
        "Lessons don't use a turn, so buy songs as soon as you can afford them. They give an immediate bonus plus one that lasts after the concert.",
        "Pace yourself at about 4 songs per half year. Three songs fill the Hype gauge for each concert.",
        "Friendship trainings give the most performance points, so they stay your priority.",
        "Finish with at least 3 songs before Girls' Legend U in Early December of Senior year.",
        "Stats above 1200 count half in races, but Speed (1600) and Guts (1500) can go past it here."
      ],
      deck: "A normal stat deck works. The scenario friend card (Light Hello) is a strong pick.",
      keyCards: ["Light Hello (Friend)"],
      inputs: [
        { id: "lesson", label: "Can afford a song", scope: "turn", type: "check" }
      ],
      events: [
        { turn: 24, label: "Promo concert", tip: "Fill the Hype gauge with 3 songs before this." },
        { turn: 36, label: "Promo concert", tip: "approx." },
        { turn: 48, label: "Promo concert", tip: "approx." },
        { turn: 60, label: "Promo concert", tip: "approx." },
        { turn: 71, label: "Girls' Legend U", tip: "Have at least 3 more songs by now." }
      ],
      hook: "grandlive"
    },
    {
      id: "grandmasters",
      name: "Grand Masters",
      jpName: "グランドマスターズ -継ぐ者達へ-",
      status: "global-soon",
      jpRelease: "2023-02-24",
      globalRelease: "Est. late Nov to early Dec 2026",
      totalTurns: 78,
      caps: [1500, 1400, 1500, 1300, 1300],
      gainScale: 1.3,
      finale: { name: "Grand Masters finale", turns: [], forced: false, note: "Mark the finale races on the turns your game shows." },
      summary: "From turn 3, trainings, rests, outings and races drop Knowledge Fragments in three goddess colors. Eight fragments fuse into a Goddess Wisdom, which levels that goddess up and gives a one-turn buff.",
      coreLoop: [
        "Friendship (rainbow) trainings drop double fragments, and goal races always give 2 matching fragments.",
        "Red (Darley Arabian, Power and Guts): a big training-effect boost. Use it on a stacked friendship training or at summer camp.",
        "Blue (Godolphin Barb, Stamina and Guts): skill hints and inspiration. Use it whenever it's ready.",
        "Yellow (Byerley Turk, Speed and Wit): energy recovery and bond gains. Use it when energy is low, or in Junior to speed up bonds.",
        "Using a Wisdom levels up that goddess for the rest of the career, so focus on one or two colors."
      ],
      deck: "Speed and Power core, plus cards that bring the goddess colors you want.",
      keyCards: [],
      inputs: [
        { id: "frag", label: "Fragments", scope: "facility", type: "number", max: 4, help: "Fragments shown on this training" },
        { id: "wisdom", label: "Wisdom ready", scope: "turn", type: "select", options: [["", "None"], ["red", "Red (training)"], ["blue", "Blue (hints)"], ["yellow", "Yellow (energy)"]] }
      ],
      events: [
        { turn: 3, label: "Fragments start", tip: "Every action can drop fragments from now on." }
      ],
      hook: "grandmasters"
    },
    {
      id: "larc",
      name: "Project L'Arc",
      jpName: "Reach for the stars プロジェクトL'Arc",
      status: "jp",
      jpRelease: "2023-08-24",
      globalRelease: "TBA",
      totalTurns: 67,
      caps: [1600, 1600, 1500, 1500, 1300],
      gainScale: 1.35,
      finale: { name: "Prix de l'Arc de Triomphe (Senior)", turns: [67], forced: true, note: "The career ends with the Senior-year Arc." },
      summary: "An overseas campaign aimed at the Arc. Supporter points raise the Expectation gauge (a training bonus), the summer camps become France expeditions, and the SS Match facility trains with members whose Star gauge is full.",
      coreLoop: [
        "Training with a supporter fills their Star gauge (3 slots). Members with a full gauge can join an SS Match.",
        "An SS Match uses a turn but no energy. It's best with many members ready, or on a turn where every training is weak.",
        "Supporter points raise the Expectation gauge, which boosts all training.",
        "France expeditions (the summer camps) earn Overseas Aptitude points. Spend them on the L'Arc aptitudes first.",
        "Some effects scale with total potential level: 1.1x at 10 and 1.2x at 20."
      ],
      deck: "Speed and Stamina for 2400m turf, plus Power for the heavy French ground.",
      keyCards: [],
      inputs: [
        { id: "star", label: "Star gauge members", scope: "facility", type: "number", max: 5, help: "Members here whose Star gauge isn't full yet" },
        { id: "ss", label: "SS Match members ready", scope: "turn", type: "number", max: 5 }
      ],
      events: [
        { turn: 37, label: "France expedition", tip: "Overseas training starts. Arrive with high energy." },
        { turn: 43, label: "Arc (Classic)", tip: "approx. Mark it as a goal race if your game lists it." },
        { turn: 61, label: "France expedition", tip: "Last expedition." },
        { turn: 67, label: "Arc (Senior)", tip: "Final race." }
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
      caps: [1700, 1500, 1500, 1500, 1300],
      gainScale: 1.45,
      finale: { name: "U.A.F. Showdown", turns: [], forced: false, note: "Mark the finale races on the turns your game shows." },
      summary: "The five facilities become 15 sports in three genres (Sphere, Fight, Free). Every time a genre passes a 50-level mark, a Heat-Up gives all trainings a bonus for two turns. The festival runs in three parts: Test Stage, Trials and Showdown.",
      coreLoop: [
        "Watch genre levels. A training that pushes a genre past the next 50-level mark triggers a Heat-Up for the next 2 turns.",
        "Line up Heat-Ups with strong friendship turns or summer camp when you can.",
        "Every festival part tests all 15 sports, so don't leave one genre far behind.",
        "Friendship training stays the best source of both stats and sport levels."
      ],
      deck: "Five-type deck (one of each stat) so every genre has support.",
      keyCards: [],
      inputs: [
        { id: "heat", label: "Triggers Heat-Up", scope: "facility", type: "check", help: "This training pushes a genre past the next 50-level mark" }
      ],
      events: [
        { turn: 24, label: "U.A.F. Test Stage", tip: "approx." },
        { turn: 48, label: "U.A.F. Trials", tip: "approx." },
        { turn: 72, label: "U.A.F. Showdown", tip: "approx." }
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
      caps: [1750, 1000, 1700, 1700, 1350],
      gainScale: 1.45,
      finale: { name: "Food Festival finale", turns: [], forced: false, note: "Mark the finale races on the turns your game shows." },
      summary: "Training trims vegetables (carrot, garlic, potato, chili, strawberry), which are harvested every 4 turns. A cooked dish only lasts for the turn you cook it, giving +25% or +50% training bonus to its stats.",
      coreLoop: [
        "Cook on the turn you will take a strong training. Dishes only last that turn.",
        "+50% dishes (for example Pot-au-feu or Garlic Ramen) target specific stats, so match them to the facility you train.",
        "Vegetable Curry gives +25% to Speed, Stamina and Guts plus +2 bond with everyone. It's good in Junior.",
        "Upgrade the plots for the vegetables your best dishes need.",
        "Stamina caps at 1000 here, so keep it for sprint and mile builds."
      ],
      deck: "Normal stat deck. Scenario-linked characters (Special Week, Hishi Akebono, Rice Shower, Nishino Flower, Katsuragi Ace, Akikawa Yayoi) raise starting vegetables.",
      keyCards: [],
      inputs: [
        { id: "dish", label: "Dish ready", scope: "turn", type: "select", options: [["0", "None"], ["25", "+25% dish"], ["50", "+50% dish"]] }
      ],
      events: [],
      hook: "cooking"
    },
    {
      id: "mecha",
      name: "Run! Mecha Umamusume",
      jpName: "走れ！メカウマ娘 -夢繋ぐ発明-",
      status: "jp",
      jpRelease: "2024-10-29",
      globalRelease: "TBA",
      totalTurns: 78,
      caps: [1750, 1700, 1500, 1300, 1300],
      gainScale: 1.5,
      finale: { name: "Mecha finale", turns: [], forced: false, note: "Mark the finale races on the turns your game shows." },
      summary: "Training raises Research Levels, which boost training and must pass each Upgrade Exam. Mecha Gears on a facility add research and Overdrive gauge, and a full gauge unlocks Overdrive training turns.",
      coreLoop: [
        "Research gain grows with the number of characters on a facility, Mecha Gears and friendship.",
        "Balance stats enough to pass each Upgrade Exam. A higher exam score gives more Mecha EN for tuning.",
        "Put tuning into chips that boost your main stats and friendship.",
        "Fire Overdrive on stacked friendship trainings or at summer camp."
      ],
      deck: "Speed and Power core. Scenario links: Symboli Kris S and Tanino Gimlet raise starting research, Narita Taishin and Biwa Hayahide add Gears.",
      keyCards: [],
      inputs: [
        { id: "gear", label: "Mecha Gear here", scope: "facility", type: "check" },
        { id: "overdrive", label: "Overdrive ready", scope: "turn", type: "check" }
      ],
      events: [],
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
      caps: [1850, 1600, 1600, 1500, 1450],
      gainScale: 1.55,
      finale: { name: "Legends finale", turns: [], forced: false, note: "Mark the finale races on the turns your game shows." },
      summary: "Three legends guide you. Training with one fills her Guidance gauge (+1 normal, +3 friendship, 8 slots). Every 6 turns you pick a Heart Knowledge, and a full gauge unlocks that legend's guidance buff.",
      coreLoop: [
        "Blue (Saint Lite): a 3-turn motivation state worth +20% to +55% stats, and it can be extended. Fire it right before a run of strong turns such as summer camp.",
        "Pink (Speed Symboli): builds on consecutive successful trainings, then rearms after 4 more. Keep failure low so the streak doesn't break.",
        "Green (Haiseiko): raises a Best Friend gauge and recruits NPCs who join trainings for strong friendship trainings.",
        "Pick one legend early so her Heart Knowledge buffs stack."
      ],
      deck: "Normal stat deck. Include the legend-linked cards for the color you plan to follow.",
      keyCards: [],
      inputs: [
        { id: "legend", label: "Legend here", scope: "facility", type: "check" },
        { id: "follow", label: "Legend you follow", scope: "turn", type: "select", options: [["blue", "Blue (Saint Lite)"], ["pink", "Pink (Speed Symboli)"], ["green", "Green (Haiseiko)"]] },
        { id: "buff", label: "Guidance buff ready", scope: "turn", type: "check" }
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
      caps: [1850, 1700, 1700, 1600, 1300],
      gainScale: 1.6,
      finale: { name: "Island finale", turns: [], forced: false, note: "Mark the finale races on the turns your game shows." },
      summary: "You build training facilities on an island. Development points earn Island Training tickets. Island Training costs no energy, can't fail and trains every facility at once, but it can't be used during camp, the finale or goal-race turns.",
      coreLoop: [
        "Junior: build bonds first. Island Training pays off once friendships are active.",
        "Use Island Training when 3 or more facilities show friendship (the beach house bonus scales with that).",
        "A new building plan follows each evaluation. Usual target: two Instinct (本能全開) facilities at Lv5 and two Technique (熟練技巧) at Lv4, mostly Speed and Stamina, ordered by the highest stat caps.",
        "Build the beach house in the first or second plan and leave it at Lv1.",
        "You can carry up to 3 tickets into the last half year, so bank them during Senior spring."
      ],
      deck: "Highlander deck (one of each type). SSR Tucker Bryne at 3LB+ is the top pick.",
      keyCards: ["Tucker Bryne (SSR, 3LB+)"],
      inputs: [
        { id: "tickets", label: "Island tickets", scope: "turn", type: "number", max: 9 }
      ],
      events: [
        { turn: 3, label: "First building plan", tip: "Plan facilities, highest stat caps first." },
        { turn: 12, label: "Evaluation", tip: "A new building plan follows." },
        { turn: 24, label: "Evaluation", tip: "A new building plan follows." },
        { turn: 36, label: "Evaluation", tip: "A new building plan follows." },
        { turn: 48, label: "Evaluation", tip: "A new building plan follows." },
        { turn: 60, label: "Evaluation", tip: "Carry up to 3 tickets into the final half year." }
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
      caps: [1900, 1800, 1700, 1700, 1400],
      gainScale: 1.65,
      finale: { name: "Onsen finale", turns: [], forced: false, note: "Mark the finale races on the turns your game shows." },
      summary: "Training digs hot springs, and each spring adds energy recovery and friendship bonuses. A bath ticket (max 3) takes no turn and restores energy, gives skill points and boosts training for 2 turns. Bathing parties at the end of Junior and Classic raise every training level by 1.",
      coreLoop: [
        "Dig order: Shikku (疾駆) → Meiseki (明晰) → Tensho (天翔の古湯) → Shunsen (駿閃) → Yukoma (ゆこま源泉) → Densetsu (伝説の秘湯).",
        "If Shikku isn't dug by the 3rd pre-debut turn, give up on it.",
        "Stay in a bath almost all the time. A bath doesn't use a turn, so bathe whenever the 2-turn buff has run out.",
        "Never sit on 3 tickets. They cap at 3, so extra tickets are lost.",
        "PR activity is an extra command that always succeeds and gives 1 ticket, but it costs as much energy as a training for small stats. Use it only when you have no tickets.",
        "Yukoma Spring appears in Senior January. Dig it right away. Avoid extra races."
      ],
      deck: "SSR Kenko Hoshina (friend) is close to required: her link effect greatly raises bath tickets.",
      keyCards: ["Kenko Hoshina (SSR Friend)"],
      inputs: [
        { id: "baths", label: "Bath tickets", scope: "turn", type: "number", max: 3 },
        { id: "bathOn", label: "Bath buff active", scope: "turn", type: "check" },
        { id: "pr", label: "PR activity open", scope: "turn", type: "check" }
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
      caps: [2100, 1700, 1700, 1700, 1800],
      gainScale: 1.8,
      finale: { name: "Breeders' Cup goal", turns: [], forced: false, note: "You pick the final Breeders' Cup race; the top-sorted choice is usually best. Mark it as a goal race on the turn your game shows." },
      summary: "You lead a team of three. Training with a member fills her Dream gauge (about 3 trainings), and training with her at full gauge ranks her up. Team rank equals your lowest member's rank. DREAMS training puts the members plus up to 5 cards on every facility.",
      coreLoop: [
        "Take trainings that give 2 or more Dream gauge points.",
        "Raise all three members evenly. The lowest rank sets the team rank.",
        "Rank members up by training with them while their gauge is full.",
        "Save DREAMS training for high-value turns such as summer camp, when energy is high.",
        "Use strategy meetings and reviews to steer the team toward your main stats."
      ],
      deck: "SSR Casino Drive (friend) is the top pick. Use at least 5 types: Speed, Stamina, Power, Wit, Guts and Casino Drive.",
      keyCards: ["Casino Drive (SSR Friend)"],
      inputs: [
        { id: "members", label: "Team members", scope: "facility", type: "number", max: 3 },
        { id: "fullgauge", label: "Rank-ups ready", scope: "facility", type: "number", max: 3, help: "Members here with a full Dream gauge" },
        { id: "dreamsReady", label: "DREAMS training ready", scope: "turn", type: "check" }
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
      caps: [2150, 1800, 1700, 1700, 1800],
      gainScale: 1.85,
      finaleEnergy: 20,
      finale: { name: "URA Finals (special ramen)", turns: [74, 76, 78], forced: true, note: "The special ramen gives +20 energy per turn, +1 mood and +150% friendship bonus, so take friendship training every turn." },
      summary: "Training fills noodle, soup and topping gauges that earn ramen tips (max 10). A tasting session spends a region's tips for a buff, and the Ramen Jamboree (RMJ) checks your progress. It has the highest stat caps so far.",
      coreLoop: [
        "Pick regions so base gauge gains are spread out, for example 2 noodle / 3 soup / 5 topping.",
        "Hold a tasting session right before a friendship training. The buff makes that training much stronger.",
        "Tips cap at 10. Spend them before they overflow.",
        "During the URA Finals the special ramen removes energy limits, so take friendship training every turn."
      ],
      deck: "Use at least 4 card types. The high caps make this the best scenario for Champions Meeting and LoH builds.",
      keyCards: [],
      inputs: [
        { id: "tips", label: "Ramen tips", scope: "turn", type: "number", max: 10 },
        { id: "tasting", label: "Tasting available", scope: "turn", type: "check" }
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
      caps: [2150, 1800, 1700, 1700, 1800],
      gainScale: 1.85,
      finale: { name: "Festival finale", turns: [], forced: false, note: "Mechanics haven't been revealed yet." },
      summary: "Announced for late October 2026 in JP. It's set at a festival held once every twelve years, with Umamusume appointed as sacred horses (神駒). Mechanics haven't been revealed, so the coach uses general training logic and assumes Trecen-ken's stat caps.",
      coreLoop: [
        "Mechanics haven't been revealed. The coach uses the general rules: bonds in Junior, friendship from Classic, energy planned around the summer camps.",
        "Set your stat caps in Stats once you know them."
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
