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
// train:     base training values at facility level 1 per facility:
//            [speed, stamina, power, guts, wit, skill points, energy] (GameTora scenario pages).
//            trainApprox marks scenarios whose values aren't published yet (Island values are used).
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
      energyEvents: { 38: 30, 62: 30 },
      moodEvents: { 29: 1 },
      train: { speed: [11, 0, 6, 0, 0, 4, -21], stamina: [0, 10, 0, 6, 0, 4, -19], power: [0, 6, 9, 0, 0, 4, -20], guts: [5, 0, 5, 8, 0, 4, -22], wit: [2, 0, 0, 0, 10, 5, 5] },
      finale: { name: "URA Finals", turns: [74, 76, 78], forced: true, note: "Qualifier, Semifinal and Final, with a training turn before each." },
      summary: "The base scenario. Win your goal races and spend every other turn on the best friendship training. Since the July 2026 update, Happy Meek can appear on trainings for a duel, and every stat caps at 1400.",
      coreLoop: [
        "Junior: train where the most un-bonded cards gather so friendship trainings unlock by early Classic.",
        "From Classic on, take friendship (rainbow) trainings in your main stats and skip weak single-card turns.",
        "Happy Meek duels start when you train with her while she shows the orange Duel mark (a failed training cancels it). A win gives 10-25 of the stat, 30 SP, +4 to that stat's cap, +4 max energy and an Essence of Racing hint. Five wins bring a powered-up Meek to the final; beating her adds 20 to every stat and 150 SP at the end.",
        "Chairman Akikawa's snack event restores 30 energy at the end of Late July in years 2 and 3, so you can push one extra training in mid-camp.",
        "A guaranteed mood-up event happens in Early March of year 2.",
        "Fans: 50,000 by Classic Early November gives Aoi's event (20 SP, 20 Wit, a hint); 100,000 by the end of year 2 and 240,000 by the end of year 3 give 30 SP each.",
        "Save skill points for the finale and buy skills that suit your distance and style."
      ],
      deck: "Speed-heavy deck (3-4 Speed) plus Power or Stamina for your distance, and one Wit card for energy.",
      keyCards: ["Kitasan Black (Speed)", "Fine Motion (Wit)", "Super Creek (Stamina)"],
      inputs: [
        { id: "meek", label: "Meek Duel mark", scope: "facility", type: "check", help: "Happy Meek is here with the orange Duel mark. A failed training cancels the duel." }
      ],
      events: [
        { turn: 12, label: "Make Debut", tip: "Goal race. Have mood at Good or better." },
        { turn: 29, label: "Mood-up event", tip: "A guaranteed mood-up happens this turn, so an outing now is worth less." },
        { turn: 38, label: "Akikawa's snack", tip: "+30 energy at the end of this turn." },
        { turn: 45, label: "Three-Legged Race", tip: "With 50,000+ fans: 20 SP, 20 Wit and a skill hint (Aoi's event)." },
        { turn: 48, label: "Fan bonus", tip: "100,000 fans by now: +30 SP." },
        { turn: 62, label: "Akikawa's snack", tip: "+30 energy at the end of this turn." },
        { turn: 73, label: "Finale prep", tip: "Training turns sit between the finale races. Use them on the best friendship training." },
        { turn: 51, label: "Unique skill check", tip: "60,000 fans by now levels up your unique skill (40,000 for dirt-only trainees)." },
        { turn: 55, label: "Unique skill check", tip: "70,000 fans by now (60,000 dirt-only) levels it up; also needs a green (3-bar) bond with chairman Akikawa." },
        { turn: 72, label: "Unique skill check", tip: "120,000 fans by now (80,000 dirt-only) levels it up again." },
        { turn: 78, label: "Fan bonus", tip: "240,000 fans by the end: +30 SP." }
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
      levelRule: "rank",
      formulaBoost: 1.35,
      train: { speed: [8, 0, 4, 0, 0, 2, -19], stamina: [0, 7, 0, 3, 0, 2, -17], power: [0, 4, 6, 0, 0, 2, -18], guts: [3, 0, 3, 6, 0, 2, -20], wit: [2, 0, 0, 0, 6, 3, 5] },
      trainNote: "Global values (JP raised some after its 2023 update).",
      finale: { name: "URA Finals", turns: [74, 76, 78], forced: true, note: "Unity Cup still ends with the three URA Finals races, after the Unity Cup Finals against team Zenith." },
      summary: "You recruit a team. Characters with a white flame on a training join Special Training (2+ flames pay the trainee extra stats), a full spirit gauge fires a Spirit Burst, and after a member's burst one Extreme Spirit Burst (0% failure) follows. Facility levels follow your team rank for each training type.",
      coreLoop: [
        "Junior: train where the most white flames gather. Every flame you train with grows that teammate, and team rank sets your facility levels (F/G=1, D/E=2, B/C=3, A=4, S=5).",
        "2+ white flames on one training is Special Training: 2 flames give +2 main stat, 3 give +4/+1, 4 give +6/+3, 5 give +10/+5 plus skill points. Scenario-linked cards add +1 to each.",
        "A full spirit gauge fires a Spirit Burst: +15 main stat, +7 second stat, +5 SP (Wit: +2 Speed, +15 Wit, and +5 energy). Hold it for a facility you want.",
        "After a member's burst, her next Unity training fires an Extreme Spirit Burst: +20/+10 stats, +15 SP, a hint and 0% failure. Use it on a risky but strong training.",
        "Team Zenith Declares War (Senior Late November) rewards total bursts: 4+ white hint, 7+ hint Lv3, 10+ gold hint, 13+ gold Lv3 with stats.",
        "Wit caps at 1800 here, so Wit-heavy builds are strong."
      ],
      deck: "Fewer cards of your main type than in URA. Mixed decks make more flames. Speed and Wit work well because of the high Wit cap.",
      keyCards: ["Riko Kashimoto (Friend, scenario link)", "Kitasan Black (Speed)"],
      inputs: [
        { id: "flames", label: "White flames", scope: "facility", type: "number", max: 5, help: "Characters on this training with a white flame (Special Training at 2+)" },
        { id: "burst", label: "Spirit Bursts", scope: "facility", type: "number", max: 5, help: "Characters here whose spirit gauge is full" },
        { id: "extreme", label: "Extreme burst", scope: "facility", type: "check", help: "An Extreme Spirit Burst fires on this training (failure becomes 0%)" },
        { id: "bursts", label: "Bursts so far", scope: "turn", type: "number", max: 30, help: "Spirit + Extreme bursts this career; Team Zenith's Senior Late Nov event pays more at 4, 7, 10 and 13" }
      ],
      events: [
        { turn: 24, label: "Unity Cup race 1", tip: "approx. Pick an opponent with 3+ circles in Tazuna's preview." },
        { turn: 36, label: "Unity Cup race 2", tip: "approx." },
        { turn: 48, label: "Unity Cup race 3", tip: "approx." },
        { turn: 60, label: "Unity Cup race 4", tip: "approx. League rank 10+, team A+ and an Extreme burst unlock the powerhouse team." },
        { turn: 70, label: "Team Zenith Declares War", tip: "Rewards scale with total Spirit + Extreme bursts (4/7/10/13)." },
        { turn: 72, label: "Unity Cup Finals", tip: "Beat team Zenith." },
        { turn: 51, label: "Unique skill check", tip: "60,000 fans by now levels up your unique skill (40,000 for dirt-only trainees)." },
        { turn: 55, label: "Unique skill check", tip: "70,000 fans by now (60,000 dirt-only) levels it up. No Akikawa bond needed here." },
        { turn: 72, label: "Unique skill check", tip: "120,000 fans by now (80,000 dirt-only) levels it up again." }
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
      formulaBoost: 1.15,
      train: { speed: [8, 0, 4, 0, 0, 2, -19], stamina: [0, 7, 0, 3, 0, 2, -17], power: [0, 4, 6, 0, 0, 2, -18], guts: [3, 0, 3, 6, 0, 2, -20], wit: [2, 0, 0, 0, 6, 3, 5] },
      finale: { name: "Twinkle Star Climax", turns: [74, 76, 78], forced: true, note: "Three finale races. Your result decides the scenario bonus." },
      summary: "No fixed race goals: you need Grade Points (60, then +300, then +300) from races. Races also pay shop coins (1st 100, 2nd-3rd 60, 4th-5th 30), and the shop (restocks every 6 turns, max 5 of each item) sells training boosts, energy, mood, stats, facility levels and race bonus.",
      coreLoop: [
        "Race often. A win pays Grade Points by grade: G1 100, G2 80, G3 60, OP 40, Pre-OP 20 (less for lower places), plus 100 coins.",
        "Avoid more than 3 races in a row. Back-to-back racing risks bad conditions and mood drops.",
        "Megaphones: +20% for 4 turns (40 coins), +40% for 3 (55), +60% for 2 (70). Start one when a run of strong turns begins, such as summer camp.",
        "Ankle Weights (50): +50% to one stat's training for one turn, +20% energy use. Good-Luck Charm (40): 0% failure for one turn.",
        "Vita 20/40/65 (35/55/75 coins) restore energy without using a turn, so drinking one often beats resting. Cupcakes (+1 or +2 mood) replace outings.",
        "Reset Whistle (20) reshuffles where cards stand when every training is weak. Cleat Hammers add +20% or +35% race bonus to one race; save them for G1s.",
        "Training Applications (150) raise a facility level permanently. Grilled Carrots (40) give every card +5 bond.",
        "Your unique skill levels up via Umamusume of the Year in Late December, which needs Akikawa's bond: 1 blue bar (Junior), 2 blue bars (Classic), green (Senior), plus wins and fans that year. Cat Food (10) gives her +5 bond.",
        "Speed, Power and Guts cap at 1200 here, but Stamina reaches 1900 and Wit 1500."
      ],
      deck: "Race-bonus cards matter (aim for 35%+ total race bonus). Speed and Power cards with high race bonus are best.",
      keyCards: ["Kitasan Black (Speed, race bonus)", "Satono Diamond (Stamina)"],
      inputs: [
        { id: "megaphone", label: "Megaphone", scope: "turn", type: "select", options: [["0", "None"], ["20", "+20% (4 turns)"], ["40", "+40% (3 turns)"], ["60", "+60% (2 turns)"]] },
        { id: "weights", label: "Ankle Weights", scope: "turn", type: "check" },
        { id: "charm", label: "Good-Luck Charm", scope: "turn", type: "check" },
        { id: "vita", label: "Best Vita", scope: "turn", type: "select", options: [["0", "None"], ["20", "Vita 20"], ["40", "Vita 40"], ["65", "Vita 65"]] },
        { id: "cupcake", label: "Cupcake", scope: "turn", type: "select", options: [["0", "None"], ["1", "Plain (+1)"], ["2", "Berry (+2)"]] },
        { id: "whistle", label: "Reset Whistle", scope: "turn", type: "check" },
        { id: "hammer", label: "Cleat Hammer", scope: "turn", type: "select", options: [["0", "None"], ["20", "+20% race"], ["35", "+35% race"]] },
        { id: "gpNeed", label: "Grade Pt still needed", scope: "turn", type: "number", max: 400 },
        { id: "consec", label: "Races in a row", scope: "turn", type: "number", max: 6, help: "Filled in for you from the career log" }
      ],
      events: [
        { turn: 12, label: "Make Debut", tip: "Goal race. The shop unlocks after it." },
        { turn: 24, label: "Junior Uma of the Year", tip: "Unique skill level-up if picked: needs 1 blue bar of Akikawa bond plus wins and fans this year." },
        { turn: 48, label: "Classic Uma of the Year", tip: "Needs 2 blue bars of Akikawa bond plus wins and fans this year." },
        { turn: 72, label: "Senior Uma of the Year", tip: "Needs a green Akikawa bond plus wins and fans this year." }
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
      // Grand Concert songs (GameTora). cost: tokens [Dance, Passion, Vocal, Visual, Mental].
      // extra: permanent +N to that training's main stat (sp = skill points on every training).
      // once: one-time stat gain. fb: Friendship live bonus %, active after the next live.
      // from: first turn the song can appear (after which Promo Live).
      songs: [
        { id: "kiseki", name: "Kiseki wo Shinjite!", from: 5, cost: [0, 21, 0, 0, 21], extra: { wit: 1 }, live: "Specialty Rate Up +5" },
        { id: "tachiichi", name: "Tachiichi zero-ban! Juni wa Ichiban!", from: 5, cost: [21, 0, 0, 21, 0], extra: { speed: 1 }, live: "Support Event Chance Up +1" },
        { id: "nigekiri", name: "Nigekiri! Fallin' Love", from: 5, cost: [21, 0, 0, 21, 0], extra: { guts: 1 }, live: "Support Event Chance Up +1" },
        { id: "gothisway", name: "Go This Way", from: 5, cost: [0, 0, 21, 0, 21], extra: { power: 1 }, live: "Support Event Chance Up +1" },
        { id: "ringring", name: "Ring Ring Diary", from: 5, cost: [0, 21, 0, 21, 0], extra: { stamina: 1 }, live: "Support Event Chance Up +1" },
        { id: "seishun", name: "Seishun ga Matteru", from: 5, cost: [0, 0, 32, 0, 12], once: { power: 22 }, fb: 5 },
        { id: "runrun", name: "RUN×RUN!", from: 5, cost: [14, 0, 0, 16, 14], once: { sp: 22 }, fb: 5 },
        { id: "zensoku", name: "Zensoku! Zenshin! Umadol Power☆", from: 5, cost: [32, 0, 0, 12, 0], once: { speed: 22 }, fb: 5 },
        { id: "yumewo", name: "Yume wo Kakeru!", from: 25, cost: [0, 21, 0, 21, 0], extra: { sp: 2 }, live: "Specialty Rate Up +5" },
        { id: "anone", name: "A・NO・NE", from: 25, cost: [42, 0, 0, 21, 0], extra: { guts: 2 }, live: "Specialty Rate Up +5" },
        { id: "bluebird", name: "Bokura no Bluebird Days", from: 25, cost: [21, 0, 0, 42, 0], extra: { speed: 2 }, live: "Specialty Rate Up +5" },
        { id: "growup", name: "Grow Up, Shine!", from: 37, cost: [21, 0, 21, 0, 21], extra: { sp: 3 }, live: "Support Event Chance Up +1" },
        { id: "komorebi", name: "Komorebi no Yell", from: 37, cost: [0, 42, 0, 0, 21], extra: { wit: 2 }, live: "Support Event Chance Up +1" },
        { id: "pyoitto", name: "Pyoitto ♪ Hallelujah!", from: 37, cost: [0, 42, 21, 0, 0], extra: { stamina: 2 }, live: "Specialty Rate Up +5" },
        { id: "nanairo", name: "Nanairo no Keshiki", from: 37, cost: [0, 0, 21, 0, 42], extra: { power: 2 }, live: "Specialty Rate Up +5" },
        { id: "yumezora", name: "Yumezora", from: 49, cost: [0, 22, 0, 0, 22], once: { wit: 22 }, fb: 5 },
        { id: "present", name: "PRESENT MARCH♪", from: 49, cost: [0, 0, 22, 0, 22], once: { power: 22 }, fb: 5 },
        { id: "daisuki", name: "Daisuki no Takarabako", from: 49, cost: [42, 0, 0, 26, 0], once: { speed: 26 }, fb: 10 },
        { id: "sekai", name: "Sekai wa Bokura no Iinari Sa", from: 49, cost: [0, 32, 12, 0, 0], once: { stamina: 22 }, fb: 5 },
        { id: "harusora", name: "Harusora BLUE", from: 49, cost: [12, 0, 0, 32, 0], once: { guts: 22 }, fb: 5 },
        { id: "fanfare", name: "Fanfare for Future!", from: 49, cost: [26, 0, 0, 42, 0], once: { guts: 26 }, fb: 10 }
      ],
      lives: [24, 36, 48, 60, 72],
      tokens: ["Dance", "Passion", "Vocal", "Visual", "Mental"],
      // Main and second token each training gives (about 60% / 30% of the time).
      tokenOf: { speed: [0, 3], stamina: [1, 2], power: [2, 4], guts: [3, 0], wit: [4, 1] },
      linkChars: ["Light Hello", "Smart Falcon", "Silence Suzuka", "Agnes Tachyon", "Mihono Bourbon"],
      train: { speed: [8, 0, 4, 0, 0, 4, -19], stamina: [0, 8, 0, 6, 0, 4, -20], power: [0, 4, 9, 0, 0, 4, -20], guts: [2, 0, 2, 7, 0, 4, -20], wit: [2, 0, 0, 0, 6, 5, 5] },
      finale: { name: "Grand Concert", turns: [], forced: false, note: "The career builds to the Grand Concert. Mark goal races as your game shows them." },
      summary: "Training earns performance points (Dance, Passion, Vocal, Visual, Mental; 200 each at first). You spend them on song lessons, which take no turn. Promo concerts run every six months from Late December of Junior year.",
      coreLoop: [
        "Lessons don't use a turn, so buy songs as soon as you can afford them. Extra Stat Gain songs add a permanent bonus to that training; Friendship Bonus songs boost every friendship training after the next live.",
        "Each training gives a main and second token: Speed gives Dance/Visual, Stamina Passion/Vocal, Power Vocal/Mental, Guts Visual/Dance, Wit Mental/Passion. Friendship trainings give two token types, and scenario-link cards (Light Hello, Smart Falcon, Silence Suzuka, Agnes Tachyon, Mihono Bourbon) give more.",
        "Opening (turns 1-4): raise bonds, take Wit, rest, and keep energy as high as possible going into turn 5. A common opening is Train x3, then Rest.",
        "Turn 5 to the debut: chase Light Hello and the cards closest to friendship. Focus one or two cards so they rainbow as soon as possible instead of spreading bond around. If no card is rainbowing and Light Hello hasn't given her +20 event by the debut, reset.",
        "Song plan, year one: buy 5 songs, then do 2 more technique lessons so the 6th song shows up, and carry it over (buy it right after the 1st Promo Live). Avoid the +Stamina and +Guts songs (Ring Ring Diary, Nigekiri! Fallin' Love) if you can. If you can't manage this by the end of year one, reset.",
        "Song plan, every half year after: buy the carried-over song, 1 technique lesson, a song, 2 lessons, a song, 2 lessons, then carry the next one over. That's 3 songs a half year (3 fill the Hype gauge). Before the Grand Live, buy that 4th song too: 18 songs unlock the special GIRLS' LEGEND U.",
        "Songs to aim for: the two skill point songs in year two (Yume wo Kakeru!, Grow Up, Shine!) and the two +10% friendship songs in year three (Daisuki no Takarabako, Fanfare for Future!).",
        "For CM aces this scenario has a very high reset rate (around 85%), so it's unfriendly for building aces with borrowed cards. Resets are normal here.",
        "Friendship trainings give the most performance points, so they stay your priority.",
        "Lives also pay 5 SP per technique lesson and 25 SP per song learned since the last live, and raise the token cap by 50.",
        "Chairman Akikawa is here: the April unique skill check needs a green (3-bar) bond with her.",
        "Stats above 1200 count half in races, but Speed (1600) and Guts (1500) can go past it here."
      ],
      deck: "A normal stat deck works. The scenario friend card Light Hello is a strong pick: her outings are better than normal ones, and her unique effect cuts energy cost on friendship trainings.",
      keyCards: ["Light Hello [From the Ground Up] (SSR Friend)", "Smart Falcon, Silence Suzuka, Agnes Tachyon, Mihono Bourbon (scenario links)"],
      inputs: [],
      events: [
        { turn: 5, label: "Lessons unlock", tip: "The Grand Live plan starts. Chase Light Hello and the cards closest to friendship until the debut. Song plan for year one: 5 songs, then carry the 6th over." },
        { turn: 12, label: "Reset check", tip: "By the debut you want one card rainbowing or Light Hello's +20 event. If neither, reset (normal for CM aces here)." },
        { turn: 23, label: "Reset check", tip: "Year one plan: 5 songs bought and the 6th song showing, held for after the live. If you're short, reset." },
        { turn: 24, label: "1st Promo Live", tip: "3 songs since the last live fill the Hype gauge and guarantee a Great Success (stat caps up). Lives pay 5 SP per technique and 25 SP per song learned since the last one." },
        { turn: 36, label: "2nd Promo Live", tip: "3 songs since the last live guarantee a Great Success." },
        { turn: 48, label: "3rd Promo Live", tip: "3 songs since the last live guarantee a Great Success." },
        { turn: 60, label: "4th Promo Live", tip: "3 songs since the last live guarantee a Great Success." },
        { turn: 69, label: "Lyrics event", tip: "With 16+ songs learned, pick the line for a scenario-link character you're using for a gold skill hint." },
        { turn: 72, label: "Grand Live", tip: "18+ songs before now unlocks the special Girls' Legend U and a better skill hint." },
        { turn: 51, label: "Unique skill check", tip: "60,000 fans by now levels up your unique skill (40,000 for dirt-only trainees)." },
        { turn: 55, label: "Unique skill check", tip: "70,000 fans by now (60,000 dirt-only) levels it up; also needs a green (3-bar) bond with chairman Akikawa." },
        { turn: 72, label: "Unique skill check", tip: "120,000 fans by now (80,000 dirt-only) levels it up again." }
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
      train: { speed: [10, 0, 3, 0, 0, 5, -19], stamina: [0, 8, 0, 6, 0, 5, -20], power: [0, 4, 9, 0, 0, 5, -20], guts: [2, 0, 3, 9, 0, 5, -20], wit: [2, 0, 0, 0, 8, 5, 5] },
      finale: { name: "Grand Masters race", turns: [78], forced: true, note: "No URA Finals here. After the SWBC in Senior Late December you get 5 more training turns, then the Grand Masters race against the three goddesses." },
      summary: "From turn 3, trainings, rests, outings and races drop Knowledge Fragments (rainbow trainings drop two). Every fragment you hold adds +1 to that stat in training, and 8 fragments fuse into a Goddess Wisdom you trigger by hand (no turn used). Each Wisdom levels up its goddess for the rest of the run and gives a one-turn effect.",
      coreLoop: [
        "Rainbow trainings drop two matching fragments (Wit rarely does). Goal races give two. With 7 held, no doubles; with 8, nothing until you obtain the Wisdom.",
        "Obtain a Wisdom from the Knowledge Table at the start of a turn; it doesn't use a turn. Its one-turn effect applies to what you do that turn.",
        "Red (Darley Arabian): +50 energy, mood to max, and every facility trains past level 5 this turn. Use it when energy is low and a good training is up, or on your best camp turn.",
        "Blue (Godolphin Barb): every card on the training you pick gives a skill hint plus a few stats. Use it on the training with the most cards.",
        "Yellow (Byerley Turk): every card on the training you pick counts as friendship, whatever its type or bond. Use it on the training with the most non-rainbow cards.",
        "Goddess levels (up to 5) add permanent training bonus (+5% to +15% each): Blue also hint rate, Red energy discount, Yellow support event effects. Year-end races pay extra when a goddess's level is at least the year number.",
        "You control the Wisdom color with the 1st and 5th fragments of each table (the left side of each crystal decides the color)."
      ],
      deck: "Speed and Power core, plus cards that bring the goddess colors you want.",
      keyCards: [],
      inputs: [
        { id: "frag", label: "Fragments", scope: "facility", type: "number", max: 2, help: "Fragments this training would drop (2 for x2)" },
        { id: "wisdom", label: "Wisdom ready", scope: "turn", type: "select", options: [["", "None"], ["red", "Red: +50 energy, past Lv5"], ["blue", "Blue: hint per card"], ["yellow", "Yellow: all cards friendship"]] }
      ],
      events: [
        { turn: 3, label: "Fragments start", tip: "Every action can drop fragments from now on." },
        { turn: 24, label: "GUR (Junior)", tip: "Year-end race after this turn (no turn used): all stats +10, 50 SP, more from goddesses at level 1+." },
        { turn: 48, label: "WBC (Classic)", tip: "Year-end race after this turn: all stats +15, 60 SP, more from goddesses at level 2+." },
        { turn: 72, label: "SWBC (Senior)", tip: "Year-end race after this turn: all stats +20, 70 SP, more from goddesses at level 3+." },
        { turn: 51, label: "Unique skill check", tip: "60,000 fans by now levels up your unique skill (40,000 for dirt-only trainees)." },
        { turn: 55, label: "Unique skill check", tip: "70,000 fans by now (60,000 dirt-only) levels it up; also needs a green (3-bar) bond with chairman Akikawa." },
        { turn: 71, label: "Unique skill check", tip: "120,000 fans by Late December (80,000 dirt-only) levels it up again." },
        { turn: 77, label: "Goddess skill event", tip: "Pick a goddess: level 4+ gives the rare skill hint, level 5 both. Total level 12+ makes it Lv 3." }
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
      goalTurns: [34, 41, 43, 60, 65],
      levelBonus: (state) => { const g = +((state.extras && state.extras.expect) || 0); return (g >= 20) + (g >= 60) + (g >= 100); },
      train: { speed: [10, 0, 3, 0, 0, 6, -21], stamina: [0, 9, 0, 4, 0, 6, -19], power: [0, 5, 11, 0, 0, 6, -20], guts: [3, 0, 2, 10, 0, 6, -21], wit: [2, 0, 0, 0, 9, 6, 5] },
      finale: { name: "Prix de l'Arc de Triomphe (Senior)", turns: [67], forced: true, note: "The career ends with the Senior-year Arc." },
      summary: "An overseas campaign aimed at the Arc, ending in Senior Early October (67 turns). Training with members fills their Star gauge (3 blocks, +1 per rainbow); full gauges open the SS Match facility. Supporter Points from SS Matches and races fill the Expectation gauge, which boosts training and raises every facility level at 20%, 60% and 100%.",
      coreLoop: [
        "Every trainee has the same goals: Make Debut, 7,000 Supporter Pt by Junior Late Dec, 3rd+ in the Japan Derby, Prix Niel, the Classic Arc, 42,000 Supporter Pt by Senior Late Mar, 3rd+ in the Takarazuka Kinen, Prix Foy, and the Senior Arc.",
        "A training fills each member's Star gauge by one block, plus one more for each rainbow character. A double rainbow fills it at once. Friend cards have no gauge.",
        "An SS Match (from turn 3) uses a turn but no energy and trains every stat. With 5 members it can become an SSS Match (much bigger), more likely the more members have done SS Matches since the last SSS.",
        "Supporter Points: G1 win 1300, G2 900, G3 700; the exhibition races pay 1500, Prix Niel and Foy 2000, the Arc 3000. The Expectation gauge raises all facility levels at 20%, 60% and 100%.",
        "France expeditions (the summer camps) allow no Japanese races, no Star gauge and no SS Matches, but pay lots of Overseas Aptitude points.",
        "Raise each Overseas Aptitude to Lv2 before the French races to clear its challenge, or you take stat penalties there. Mental Strength Lv3 gives +20% Friendship."
      ],
      deck: "Speed and Stamina for 2400m turf, plus Power for the heavy French ground.",
      keyCards: [],
      inputs: [
        { id: "star", label: "Star gauge members", scope: "facility", type: "number", max: 5, help: "Members here whose Star gauge isn't full yet" },
        { id: "ss", label: "SS Match members", scope: "turn", type: "number", max: 5 },
        { id: "expect", label: "Expectation gauge %", scope: "turn", type: "number", max: 100 }
      ],
      events: [
        { turn: 3, label: "SS Match opens", tip: "The SS Match facility appears from this turn." },
        { turn: 24, label: "Exhibition race + goal", tip: "Exhibition race after this turn (no turn used). Goal: 7,000 Supporter Pt by now." },
        { turn: 34, label: "Japan Derby", tip: "Goal: 3rd or better." },
        { turn: 36, label: "Exhibition race", tip: "After this turn, no turn used." },
        { turn: 37, label: "France expedition", tip: "No Japanese races, Star gauges or SS Matches until September." },
        { turn: 41, label: "Prix Niel", tip: "Goal race." },
        { turn: 43, label: "Arc (Classic)", tip: "Goal race against Venus Park and Rigantona." },
        { turn: 54, label: "Exhibition race + goal", tip: "Goal: 42,000 Supporter Pt by now." },
        { turn: 60, label: "Takarazuka Kinen", tip: "Goal: 3rd or better. Exhibition race after it." },
        { turn: 61, label: "France expedition", tip: "Last expedition." },
        { turn: 65, label: "Prix Foy", tip: "Goal race." },
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
      levelRule: "discipline",
      train: { speed: [12, 0, 1, 0, 0, 6, -15], stamina: [0, 11, 0, 2, 0, 6, -15], power: [0, 2, 11, 0, 0, 6, -15], guts: [1, 0, 1, 12, 0, 6, -15], wit: [2, 0, 0, 0, 11, 6, -15] },
      trainByGenre: {
        sphere: { speed: [12, 0, 1, 0, 0, 6, -15], stamina: [0, 11, 0, 2, 0, 6, -15], power: [0, 2, 11, 0, 0, 6, -15], guts: [1, 0, 1, 12, 0, 6, -15], wit: [2, 0, 0, 0, 11, 6, -15] },
        fight: { speed: [8, 0, 1, 0, 0, 10, -15], stamina: [0, 7, 0, 2, 0, 10, -15], power: [0, 2, 7, 0, 0, 10, -15], guts: [1, 0, 1, 8, 0, 10, -15], wit: [2, 0, 0, 0, 5, 10, -15] },
        free: { speed: [14, 0, 1, 0, 0, 4, -15], stamina: [1, 10, 0, 2, 0, 6, -15], power: [1, 2, 10, 0, 0, 6, -15], guts: [2, 0, 1, 12, 0, 5, -15], wit: [4, 0, 0, 0, 10, 5, -15] }
      },
      trainNote: "Sphere genre values are the default; each training uses its own genre when you set it.",
      finale: { name: "U.A.F. Showdown", turns: [], forced: false, note: "Mark the finale races on the turns your game shows." },
      summary: "The five facilities become sports in three genres (Sphere, Fight, Free), rerolled every turn. Picking a sport whose genre appears more than once is a Link Training: stronger, and every linked sport levels up. Each genre passing a 50-level mark triggers a 2-turn Heat-Up. Every sport costs 15 energy, Wit included.",
      coreLoop: [
        "Link Training: pick a sport whose genre shows up on several facilities this turn. It boosts the training and levels every linked sport, and the genre level rises by all of their gains.",
        "Consult Elfie (3 charges, refilled after the debut and each tournament part; no turn used) to swap a whole genre into another, e.g. turn 3 Sphere + 2 Fight into 5 Sphere for a big link.",
        "Heat-Up at every 50 genre levels lasts 2 training turns: Sphere boosts stats and SP by genre level, Fight boosts main stats by link size, Free adds hints.",
        "Every sport costs 15 energy, including Wit, so plan rests; resting, racing or an outing adds +3 to the next turn's sport level gains.",
        "Before each tournament part, get 12 sports to level 10/20/30/40/50. Wins add permanent Training Bonus per genre (5 wins +3%, 10 +7%, 15 +12%, 20 +17%).",
        "Genres differ: Fight gives fewer stats but more SP, Free gives more Speed."
      ],
      deck: "Five-type deck (one of each stat) so every genre has support.",
      keyCards: [],
      inputs: [
        { id: "genre", label: "Genre", scope: "facility", type: "select", options: [["sphere", "Sphere (blue)"], ["fight", "Fight (red)"], ["free", "Free (yellow)"]] },
        { id: "heat", label: "Triggers Heat-Up", scope: "facility", type: "check", help: "This training pushes a genre past the next 50-level mark" },
        { id: "consult", label: "Consultations left", scope: "turn", type: "number", max: 3, default: 3 }
      ],
      events: [
        { turn: 24, label: "U.A.F. Test Stage", tip: "Aim for 12 sports at level 10+. Consultations refill after it." },
        { turn: 36, label: "Trial 1", tip: "12 sports at level 20+." },
        { turn: 48, label: "Trial 2", tip: "12 sports at level 30+." },
        { turn: 60, label: "Trial 3", tip: "12 sports at level 40+." },
        { turn: 72, label: "Showdown", tip: "12 sports at level 50+. Overall victory in all five parts unlocks extra skill evolutions." },
        { turn: 51, label: "Unique skill check", tip: "60,000 fans by now levels up your unique skill (40,000 for dirt-only trainees)." },
        { turn: 55, label: "Unique skill check", tip: "70,000 fans by now (60,000 dirt-only) levels it up; also needs a green (3-bar) bond with chairman Akikawa." },
        { turn: 71, label: "Unique skill check", tip: "120,000 fans by Late December (80,000 dirt-only) levels it up again." }
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
      train: { speed: [11, 0, 2, 0, 0, 5, -19], stamina: [0, 8, 0, 5, 0, 5, -20], power: [0, 4, 9, 0, 0, 5, -20], guts: [2, 0, 2, 10, 0, 5, -20], wit: [2, 0, 0, 0, 8, 5, 5] },
      dishes: [
        { tier: 1, name: "Sandwich", from: 1, pct: 25, stats: ["speed", "power", "wit"], cost: [25, 0, 50, 0, 50] },
        { tier: 1, name: "Vegetable Curry", from: 1, pct: 25, stats: ["speed", "stamina", "guts"], cost: [25, 50, 0, 50, 0] },
        { tier: 2, name: "Carrot and Potato Pot-au-feu", from: 25, pct: 50, stats: ["speed"], cost: [150, 0, 80, 0, 0] },
        { tier: 2, name: "Garlic Ramen", from: 25, pct: 50, stats: ["stamina"], cost: [0, 150, 0, 80, 0] },
        { tier: 2, name: "Potato Garlic Pizza", from: 25, pct: 50, stats: ["power"], cost: [0, 80, 150, 0, 0] },
        { tier: 2, name: "Potato and Carrot Mapo Tofu", from: 25, pct: 50, stats: ["guts"], cost: [40, 0, 40, 150, 0] },
        { tier: 2, name: "Strawberry Ice Cream", from: 25, pct: 50, stats: ["wit"], cost: [80, 0, 0, 0, 150] },
        { tier: 3, name: "Chunky Carrot Pot-au-feu", from: 49, pct: 80, stats: ["speed"], cost: [250, 0, 80, 0, 0] },
        { tier: 3, name: "Whole Garlic Ramen", from: 49, pct: 80, stats: ["stamina"], cost: [0, 250, 0, 80, 0] },
        { tier: 3, name: "Fluffy Potato Garlic Pizza", from: 49, pct: 80, stats: ["power"], cost: [0, 80, 250, 0, 0] },
        { tier: 3, name: "Extra Spicy Mapo Tofu", from: 49, pct: 80, stats: ["guts"], cost: [40, 0, 40, 250, 0] },
        { tier: 3, name: "Double Strawberry Ice Cream", from: 49, pct: 80, stats: ["wit"], cost: [80, 0, 0, 0, 250] },
        { tier: 4, name: "G1 Plate", from: 73, pct: 150, stats: ["speed", "stamina", "power", "guts", "wit"], cost: [100, 100, 100, 100, 100], energy: 25 }
      ],
      finale: { name: "URA Finals", turns: [74, 76, 78], forced: true, note: "During the URA Finals you can cook the G1 Plate: +150% training, +70% race bonus, +25 energy." },
      summary: "Training grows vegetables (carrot, garlic, potato, chili, strawberry), harvested every 4 turns. A dish only lasts for the turn you cook it: +25% to a group of stats at first, +50% to one stat from Classic, +80% plus race bonus from Senior, and the G1 Plate in the URA Finals. Cooking Challenges every six months score your Cooking Points.",
      coreLoop: [
        "Cook on the turn you take a strong training, and pick the dish for that training's stat. Dishes last only that turn.",
        "Junior: Sandwich (+25% Speed/Power/Wit) or Vegetable Curry (+25% Speed/Stamina/Guts, +2 bond to everyone).",
        "From Classic: single-stat +50% dishes; from Senior: +80% plus +30% race bonus (or the linked character's specialty dish).",
        "A Great Success when cooking gives a skill hint and may restore 10 energy or pull another card onto the training.",
        "12,000 Cooking Points before the Great Food Festival (Super Satisfaction) makes the G1 Plate cheaper and stronger.",
        "Upgrade the plots for the vegetables your best dishes need. Stamina caps at 1000 here, so keep it for sprint and mile builds."
      ],
      deck: "Normal stat deck. Scenario-linked characters (Special Week, Hishi Akebono, Rice Shower, Nishino Flower, Katsuragi Ace, Akikawa Yayoi) raise starting vegetables.",
      keyCards: [],
      inputs: [
        { id: "dish", label: "Best dish you can afford", scope: "turn", type: "select", options: [["0", "None"], ["1", "+25% (Sandwich/Curry)"], ["2", "+50% stat dish"], ["3", "+80% stat dish"], ["4", "G1 Plate"]] }
      ],
      events: [
        { turn: 24, label: "Tasting Party 1", tip: "Cooking Challenge. New dishes unlock for Classic." },
        { turn: 36, label: "Tasting Party 2", tip: "Cooking Challenge." },
        { turn: 48, label: "Tasting Party 3", tip: "Cooking Challenge. +80% dishes unlock for Senior." },
        { turn: 60, label: "Tasting Party 4", tip: "Cooking Challenge." },
        { turn: 72, label: "Great Food Festival", tip: "12,000 Cooking Points by now is Super Satisfaction (cheaper, stronger G1 Plate)." },
        { turn: 51, label: "Unique skill check", tip: "60,000 fans by now levels up your unique skill (40,000 for dirt-only trainees)." },
        { turn: 55, label: "Unique skill check", tip: "70,000 fans by now (60,000 dirt-only) levels it up; also needs a green (3-bar) bond with chairman Akikawa." },
        { turn: 72, label: "Unique skill check", tip: "120,000 fans by now (80,000 dirt-only) levels it up again." }
      ],
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
      train: { speed: [11, 0, 2, 0, 0, 5, -19], stamina: [0, 10, 0, 4, 0, 5, -20], power: [0, 4, 10, 0, 0, 5, -20], guts: [2, 0, 2, 9, 0, 5, -20], wit: [2, 0, 0, 0, 8, 5, 5] },
      finale: { name: "URA Finals", turns: [74, 76, 78], forced: true, note: "Qualifier, Semifinal and Final, with a training turn before each." },
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
      events: [
        { turn: 24, label: "Upgrade Exam 1", tip: "Research Levels decide the rank. S in every exam unlocks extra skill evolutions." },
        { turn: 36, label: "Upgrade Exam 2", tip: "" },
        { turn: 48, label: "Upgrade Exam 3", tip: "" },
        { turn: 60, label: "Upgrade Exam 4", tip: "" },
        { turn: 72, label: "Upgrade Exam 5", tip: "S here gives a better skill hint and extra evolutions." },
        { turn: 51, label: "Unique skill check", tip: "60,000 fans by now levels up your unique skill (40,000 for dirt-only trainees)." },
        { turn: 55, label: "Unique skill check", tip: "70,000 fans by now (60,000 dirt-only) levels it up; also needs a green (3-bar) bond with chairman Akikawa." },
        { turn: 72, label: "Unique skill check", tip: "120,000 fans by now (80,000 dirt-only) levels it up again." }
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
      caps: [1850, 1600, 1600, 1500, 1450],
      gainScale: 1.55,
      train: { speed: [11, 0, 2, 0, 0, 7, -20], stamina: [0, 8, 0, 6, 0, 7, -21], power: [0, 4, 10, 0, 0, 7, -21], guts: [2, 0, 2, 10, 0, 7, -21], wit: [3, 0, 0, 0, 7, 5, 5] },
      finale: { name: "Legends finale", turns: [], forced: false, note: "Mark the finale races on the turns your game shows." },
      summary: "Three legends guide you. Training with one fills her Guidance gauge (+1 normal, +3 friendship, 8 slots). Every 6 turns you pick a Heart Knowledge, and a full gauge unlocks that legend's guidance buff.",
      coreLoop: [
        "Blue (Saint Lite): a 3-turn motivation state worth +20% to +55% stats, and it can be extended. Fire it right before a run of strong turns such as summer camp.",
        "Pink (Speed Symboli): builds on consecutive successful trainings, then rearms after 4 more. Keep failure low so the streak doesn't break.",
        "Green (Haiseiko): raises a Best Friend gauge and recruits NPCs who join trainings for strong friendship trainings.",
        "Pick one legend early so her Heart Knowledge buffs stack.",
        "Your unique skill levels up by winning the Dream Fest race at the end of each year, not by fan count.",
        "100,000+ fans plus two strategy skills (or 150,000 fans) unlock this scenario's extra skill evolutions."
      ],
      deck: "Normal stat deck. Include the legend-linked cards for the color you plan to follow.",
      keyCards: [],
      inputs: [
        { id: "legend", label: "Legend here", scope: "facility", type: "check" },
        { id: "follow", label: "Legend you follow", scope: "turn", type: "select", options: [["blue", "Blue (Saint Lite)"], ["pink", "Pink (Speed Symboli)"], ["green", "Green (Haiseiko)"]] },
        { id: "buff", label: "Guidance buff ready", scope: "turn", type: "check" }
      ],
      events: [
        { turn: 24, label: "Dream Fest (Junior)", tip: "Year-end race. Winning it levels up your unique skill." },
        { turn: 48, label: "Dream Fest (Classic)", tip: "Winning it levels up your unique skill." },
        { turn: 72, label: "Dream Fest Legend", tip: "Winning it levels up your unique skill (with Almond Eye racing, a loss can still count)." }
      ],
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
      train: { speed: [12, 0, 1, 0, 0, 6, -20], stamina: [0, 9, 0, 5, 0, 6, -20], power: [0, 3, 11, 0, 0, 6, -20], guts: [2, 0, 2, 10, 0, 6, -20], wit: [2, 0, 0, 0, 8, 5, 5] },
      finale: { name: "Island finale", turns: [], forced: false, note: "Mark the finale races on the turns your game shows." },
      summary: "You build training facilities on an island. Development points earn Island Training tickets. Island Training costs no energy, can't fail and trains every facility at once, but it can't be used during camp, the finale or goal-race turns.",
      coreLoop: [
        "Junior: build bonds first. Island Training pays off once friendships are active.",
        "Use Island Training when 3 or more facilities show friendship (the beach house bonus scales with that).",
        "A new building plan follows each evaluation. Usual target: two Instinct (本能全開) facilities at Lv5 and two Technique (熟練技巧) at Lv4, mostly Speed and Stamina, ordered by the highest stat caps.",
        "Build the beach house in the first or second plan and leave it at Lv1.",
        "You can carry up to 3 tickets into the last half year, so bank them during Senior spring.",
        "Great success at every Island Assembly (and the last one) unlocks this scenario's extra skill evolutions."
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
        { turn: 60, label: "Evaluation", tip: "Carry up to 3 tickets into the final half year." },
        { turn: 51, label: "Unique skill check", tip: "60,000 fans by now levels up your unique skill (40,000 for dirt-only trainees)." },
        { turn: 55, label: "Unique skill check", tip: "70,000 fans by now (60,000 dirt-only) levels it up; also needs a green (3-bar) bond with chairman Akikawa." },
        { turn: 72, label: "Unique skill check", tip: "120,000 fans by now (80,000 dirt-only) levels it up again." }
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
      train: { speed: [12, 0, 1, 0, 0, 6, -20], stamina: [0, 9, 0, 5, 0, 6, -20], power: [0, 3, 11, 0, 0, 6, -20], guts: [2, 0, 2, 10, 0, 6, -20], wit: [2, 0, 0, 0, 8, 5, 5] },
      trainApprox: true,
      finale: { name: "URA Finals", turns: [74, 76, 78], forced: true, note: "Qualifier, Semifinal and Final, with a training turn before each." },
      levelBonus: (state) => (state.turn > 24) + (state.turn > 48),
      summary: "Training digs hot springs, and each spring adds energy recovery and friendship bonuses. A bath ticket (max 3) takes no turn and restores energy, gives skill points and boosts training for 2 turns. Bathing parties at the end of Junior and Classic raise every training level by 1.",
      coreLoop: [
        "Dig order: Shikku (疾駆) → Meiseki (明晰) → Tensho (天翔の古湯) → Shunsen (駿閃) → Yukoma (ゆこま源泉) → Densetsu (伝説の秘湯).",
        "If Shikku isn't dug by the 3rd pre-debut turn, give up on it.",
        "Stay in a bath almost all the time. A bath doesn't use a turn, so bathe whenever the 2-turn buff has run out.",
        "Never sit on 3 tickets. They cap at 3, so extra tickets are lost.",
        "PR activity is an extra command that always succeeds and gives 1 ticket, but it costs as much energy as a training for small stats. Use it only when you have no tickets.",
        "Yukoma Spring appears in Senior January. Dig it right away. Avoid extra races.",
        "A bath lasts 2 turns, so bathe the turn before a goal race or on the goal turn itself."
      ],
      deck: "SSR Kenko Hoshina (friend) is close to required: her link effect greatly raises bath tickets.",
      keyCards: ["Kenko Hoshina (SSR Friend)"],
      inputs: [
        { id: "baths", label: "Bath tickets", scope: "turn", type: "number", max: 3 },
        { id: "bathOn", label: "Bath buff active", scope: "turn", type: "check" },
        { id: "pr", label: "PR activity open", scope: "turn", type: "check" }
      ],
      events: [
        { turn: 3, label: "Pick a spring", tip: "Choose what to dig. Give up on Shikku if it isn't dug by now. You can switch when a spring is finished or after a bathing party." },
        { turn: 24, label: "Bathing party 1", tip: "Success raises every training level by 1." },
        { turn: 48, label: "Bathing party 2", tip: "Success raises every training level by 1." },
        { turn: 49, label: "Yukoma Spring", tip: "Strongest spring. Dig it right away." },
        { turn: 72, label: "Bathing party 3", tip: "Last party before the URA Finals." },
        { turn: 51, label: "Unique skill check", tip: "60,000 fans by now levels up your unique skill (40,000 for dirt-only trainees)." },
        { turn: 55, label: "Unique skill check", tip: "70,000 fans by now (60,000 dirt-only) levels it up." },
        { turn: 71, label: "Unique skill check", tip: "120,000 fans by Late December (80,000 dirt-only) levels it up again." }
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
      train: { speed: [12, 0, 1, 0, 0, 6, -20], stamina: [0, 9, 0, 5, 0, 6, -20], power: [0, 3, 11, 0, 0, 6, -20], guts: [2, 0, 2, 10, 0, 6, -20], wit: [2, 0, 0, 0, 8, 5, 5] },
      trainApprox: true,
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
        { id: "dreamsLeft", label: "DREAMS trainings left", scope: "turn", type: "number", max: 2, default: 2, help: "You get 2 per half year" }
      ],
      events: [
        { turn: 12, label: "Review", tip: "Half-year review: team results are scored. Unused DREAMS trainings don't carry over." },
        { turn: 24, label: "Review", tip: "Half-year review." },
        { turn: 36, label: "Review", tip: "Half-year review." },
        { turn: 48, label: "Review", tip: "Half-year review." },
        { turn: 60, label: "Final review", tip: "After this, up to 4 strategy meetings are available." }
      ],
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
      train: { speed: [12, 0, 1, 0, 0, 6, -20], stamina: [0, 9, 0, 5, 0, 6, -20], power: [0, 3, 11, 0, 0, 6, -20], guts: [2, 0, 2, 10, 0, 6, -20], wit: [2, 0, 0, 0, 8, 5, 5] },
      trainApprox: true,
      finaleEnergy: 20,
      finale: { name: "URA Finals (special ramen)", turns: [74, 76, 78], forced: true, note: "The special ramen gives +20 energy per turn, +1 mood and +150% friendship bonus, so take friendship training every turn." },
      summary: "Training fills noodle, soup and topping gauges that earn ramen tips (max 10). A tasting session spends a region's tips for a buff, and the Ramen Jamboree (RMJ) checks your progress. It has the highest stat caps so far.",
      coreLoop: [
        "Pick regions so base gauge gains are spread out, for example 2 noodle / 3 soup / 5 topping.",
        "A tasting session uses no turn (max one per turn). Hold it right before a friendship training; the buff makes that training much stronger, and it earns hype points for the RMJ.",
        "More regions (stronger ramen) unlock each year.",
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
        { turn: 72, label: "Ultimate Tracen Ramen", tip: "From Senior Late December a buff fires automatically every turn." },
        { turn: 73, label: "Super RMJ", tip: "Pick one of three ramen for a huge 3-turn buff, then take friendship training every turn." },
        { turn: 51, label: "Unique skill check", tip: "60,000 fans by now levels up your unique skill (40,000 for dirt-only trainees)." },
        { turn: 55, label: "Unique skill check", tip: "70,000 fans by now (60,000 dirt-only) levels it up." },
        { turn: 71, label: "Unique skill check", tip: "120,000 fans by Late December (80,000 dirt-only) levels it up again." }
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
      train: { speed: [12, 0, 1, 0, 0, 6, -20], stamina: [0, 9, 0, 5, 0, 6, -20], power: [0, 3, 11, 0, 0, 6, -20], guts: [2, 0, 2, 10, 0, 6, -20], wit: [2, 0, 0, 0, 8, 5, 5] },
      trainApprox: true,
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
