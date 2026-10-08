// Friend and Group card outings ("dates"): how each card's outings unlock, and what every
// outing gives. Values are game8's card pages (game8.jp/umamusume/<page>), at the card level
// the page states (lv: 50 = fully limit broken, 30 = Lv30, null = not stated). Event values
// scale with the card's level, so a lower-LB card gives somewhat less.
//
// Each option: e energy, me max energy, mo mood steps, s [Speed, Stamina, Power, Guts, Wit],
// r a random stat +r (rn times), sp skill points, b bond, h skill hints [[skill id, levels]], cure (fixes a bad condition),
// x a note for scenario extras. An outing's opts are choices you pick between; with roll: true
// they are outcomes you don't pick (great success / success, or with fail: true success /
// failure), and p is the share of the first one (unknown, so 0.5).
(function (root) {
  const ALL = (n) => [n, n, n, n, n];
  const DATES = {
    meta: { source: "game8 support card pages", checked: "2026-10-08" },
    // Gold (rare) skills among the hints, worth more per hint level.
    gold: [200371, 200431, 200511, 201113, 201592, 201652, 201662, 202031, 202061, 202551, 202721, 202801, 203501, 203651],
    cards: {
      // SSR Tazuna Hayakawa (Welcome to Tracen Academy!)
      30021: {
        page: 372316, lv: 30,
        unlock: { name: "情熱のふたり", keep: { e: 14, mo: 1, s: [0, 0, 0, 0, 6], b: 5 }, lose: { mo: -1, b: -5, h: [[200692, 1]] } },
        dates: [
          { opts: [{ e: 35, mo: 1, s: [6, 0, 0, 0, 0], b: 5 }] },
          { opts: [{ e: 35, b: 5, cure: true }] },
          { opts: [{ e: 35, mo: 1, s: [0, 6, 0, 0, 0], b: 5 }, { mo: 1, s: [0, 12, 0, 12, 0], b: 5 }] },
          { opts: [{ e: 49, mo: 1, s: [0, 0, 0, 0, 6], b: 5, cure: true }] },
          { opts: [{ e: 49, mo: 2, sp: 37, b: 5, h: [[200431, 1]] }, { e: 49, mo: 2, sp: 37, b: 5, h: [[200432, 1]] }] }
        ]
      },
      // SSR Tazuna Hayakawa (A Bowl of Nostalgia), the Trecen-ken scenario card
      30305: {
        page: 794063, lv: 50,
        unlock: { name: "深夜のファミレス、あとラーメン", both: true, keep: { e: 40, mo: 1, s: [0, 0, 0, 0, 6], sp: 6, b: 5 }, alt: { mo: 1, s: [6, 0, 0, 0, 6], sp: 6, b: 5, h: [[203852, 5]] } },
        dates: [
          { opts: [{ e: 56, me: 4, mo: 1, s: ALL(7), b: 5, x: "2 Secret Seasonings" }] },
          { opts: [{ mo: 1, s: [13, 0, 0, 13, 0], sp: 13, b: 5, h: [[201661, 1]], x: "2 Secret Seasonings" }] },
          { opts: [{ e: 80, mo: 1, b: 5, x: "2 Secret Seasonings" }, { mo: 1, s: [13, 0, 13, 13, 0], sp: 26, b: 5, x: "2 Secret Seasonings" }] },
          { opts: [{ mo: 1, s: [0, 19, 0, 0, 0], sp: 13, b: 5, x: "2 Secret Seasonings" }] },
          { opts: [{ e: 64, mo: 1, s: [13, 13, 13, 0, 0], sp: 13, b: 5, h: [[201662, 3]], x: "2 Secret Seasonings" }] }
        ]
      },
      // SSR Riko Kashimoto
      30036: {
        page: 400619, lv: 30,
        unlock: { name: "意外な一面", keep: { mo: 1, s: [0, 0, 0, 18, 0], b: 5 }, lose: { b: -10, h: [[201641, 3]] }, note: "The top option can also unlock outings (+12 Stamina, Ramp Up hint) but fails sometimes, and failing locks them." },
        dates: [
          { opts: [{ e: 30, mo: 1, s: [0, 12, 0, 0, 0], b: 5 }] },
          { opts: [{ e: 24, mo: 1, s: [0, 12, 0, 12, 0], b: 5 }] },
          { opts: [{ e: 24, mo: 1, s: [0, 12, 0, 6, 0], b: 5 }, { mo: 1, sp: 37, b: 5 }] },
          { opts: [{ e: 24, mo: 1, s: [12, 6, 6, 0, 0], b: 5 }] },
          { roll: true, p: 0.5, opts: [{ e: 30, mo: 1, s: [0, 12, 0, 12, 0], b: 5, h: [[200371, 3]] }, { e: 30, mo: 1, s: [0, 6, 0, 6, 0], b: 5, h: [[200371, 1]] }] }
        ]
      },
      // SSR Sasami Anshinzawa: 3 outings, and each one can fail
      30080: {
        page: 421641, lv: 50,
        unlock: { name: "あんし〜んの練習台", keep: { mo: 1, r: 15, b: 5 }, lose: { e: -10, sp: 150, b: -10, h: [[202032, 1]] }, note: "The top option unlocks outings too (+16 energy, +4 max energy on success); the bottom one locks them." },
        dates: [
          { roll: true, fail: true, p: 0.5, opts: [{ e: 48, mo: 1, r: 15, b: 5 }, { e: 16, mo: -1, b: 5 }] },
          { roll: true, fail: true, p: 0.5, opts: [{ e: 48, mo: 1, r: 15, rn: 2, b: 5 }, { e: 16, mo: -1, b: 5 }] },
          { opts: [
            { roll: true, fail: true, p: 0.5, opts: [{ e: 48, mo: 1, s: ALL(15), sp: 30, b: 5, h: [[202031, 3]] }, { e: -10, mo: -2, b: 5 }] },
            { roll: true, fail: true, p: 0.5, opts: [{ e: 100, b: 5, h: [[202031, 1]] }, { e: 32, b: 5, h: [[202032, 1]] }] }
          ] }
        ]
      },
      // SSR Light Hello (from the GROUND UP)
      30052: {
        page: 473490, lv: 50,
        unlock: { name: "想いの力、受け止めて……！", keep: { e: 24, mo: 1, s: [9, 0, 0, 9, 0], b: 5 }, lose: { s: [0, 0, 0, 0, 40], sp: 40, b: -5, h: [[200272, 5]] } },
        dates: [
          { opts: [{ e: 40, me: 4, mo: 1, b: 5 }] },
          { opts: [{ e: 40, mo: 1, s: [0, 0, 0, 13, 0], b: 5 }] },
          { opts: [{ e: 80, mo: 1, b: 5 }, { mo: 1, s: [20, 0, 0, 20, 0], b: 5 }] },
          { opts: [{ e: 48, mo: 1, s: [0, 0, 0, 13, 0], b: 5 }] },
          { roll: true, p: 0.5, opts: [{ e: 30, mo: 1, s: [0, 0, 0, 10, 0], b: 5, h: [[201662, 3]] }, { e: 20, s: [5, 0, 0, 5, 0], b: 5, h: [[201662, 1]] }] }
        ]
      },
      // SR Aoi Kiryuin
      20021: {
        page: 372396, lv: null,
        unlock: { name: "趣味を探して", keep: { e: 30, mo: 1, sp: 18, b: 5 }, lose: { mo: -1, b: -5, h: [[200272, 1]] } },
        dates: [
          { opts: [{ e: 37, mo: 1, sp: 37, b: 5 }] },
          { opts: [{ e: 37, mo: 1, s: [0, 0, 0, 0, 6], b: 5 }, { sp: 18, b: 5 }] },
          { opts: [{ e: 30, mo: 1, sp: 37, b: 5 }] },
          { opts: [{ mo: 1, s: [0, 0, 12, 0, 0], sp: 56, b: 5 }] },
          { roll: true, fail: true, p: 0.5, opts: [{ mo: 1, s: [0, 6, 6, 6, 0], sp: 56, b: 5, h: [[200831, 1]] }, { s: [0, 6, 0, 0, 0], sp: 19 }] }
        ]
      },
      // SSR The Throne's Assemblage (Group)
      30067: {
        page: 467708, lv: null,
        unlock: { name: "見賢思斉", auto: true, keep: { s: [6, 0, 0, 0, 18], sp: 6, b: 5 } },
        dates: [
          { opts: [{ e: 13, s: [0, 0, 0, 0, 36], b: 5, h: [[202092, 1]] }] },
          { opts: [{ e: 13, mo: 1, s: [24, 0, 0, 0, 0], b: 5, h: [[200452, 1]] }] },
          { opts: [{ e: 39, sp: 18, b: 5, h: [[202152, 1]] }] },
          { opts: [{ e: 26, s: [12, 0, 0, 0, 30], sp: 18, b: 5, h: [[200042, 1]] }] },
          { opts: [{ e: 26, mo: 1, s: [18, 0, 0, 0, 36], sp: 24, b: 5, h: [[201113, 1]], x: "Passion Zone" }] }
        ]
      },
      // SSR Team Sirius (Group): game8 lists only the unlock and the last outing
      30081: {
        page: 444682, lv: null, partial: true,
        unlock: { name: "それぞれが一等星", auto: true, keep: { s: [5, 5, 5, 0, 0], b: 5 } },
        dates: [null, null, null, null, { opts: [{ e: 26, s: [12, 12, 12, 0, 0], b: 5, h: [[202061, 1]], x: "Passion Zone" }] }]
      },
      // SSR Mei Satake (L'Arc)
      30160: {
        page: 546718, lv: 50,
        unlock: { name: "時には仕事を忘れて", keep: { e: 27, mo: 1, s: [0, 0, 0, 6, 0], b: 5 }, lose: { s: [36, 0, 0, 0, 36], b: -5, h: [[201641, 5]] } },
        dates: [
          { opts: [{ e: 54, mo: 1, s: [0, 0, 0, 6, 0], b: 5 }] },
          { opts: [{ e: 45, mo: 1, s: [0, 0, 6, 6, 0], b: 5 }] },
          { opts: [{ e: 63, mo: 1, s: [0, 0, 0, 18, 0], b: 5 }, { mo: 1, s: ALL(6), b: 5 }] },
          { opts: [{ e: 45, s: [0, 0, 0, 24, 0], b: 5 }] },
          { roll: true, p: 0.5, opts: [{ e: 40, mo: 1, s: [0, 0, 0, 10, 0], b: 5, h: [[202721, 3]] }, { e: 35, mo: 1, s: [0, 0, 0, 5, 0], b: 5, h: [[202721, 1]] }] }
        ]
      },
      // SSR Ryoka Tsurugi (U.A.F.): every outing also raises every sport level by 1
      30188: {
        page: 595475, lv: 50,
        unlock: { name: "撃ち抜いたのは…", keep: { e: 32, me: 4, mo: 1, b: 5 }, lose: { s: [0, 37, 37, 0, 0], b: -5, h: [[200282, 5]] } },
        dates: [
          { opts: [{ e: 56, mo: 1, s: [18, 0, 0, 0, 0], b: 5, x: "every sport +1 level" }] },
          { opts: [{ e: 48, mo: 1, s: [12, 0, 0, 0, 12], b: 5, x: "every sport +1 level" }] },
          { opts: [{ e: 80, mo: 1, b: 5, x: "every sport +1 level" }, { mo: 1, s: [56, 0, 0, 0, 0], b: 5, x: "every sport +1 level" }] },
          { opts: [{ e: 48, mo: 1, s: [31, 0, 0, 0, 0], b: 5, x: "every sport +1 level" }] },
          { roll: true, p: 0.5, opts: [{ e: 64, mo: 1, s: [37, 0, 0, 0, 0], b: 5, h: [[202801, 3]] }, { e: 56, mo: 1, s: [18, 0, 0, 0, 0], b: 5, h: [[202801, 3]] }] }
        ]
      },
      // SSR Yayoi Akikawa (Great Food Festival): every outing also gives 40 of each vegetable
      30207: {
        page: 620516, lv: 50,
        unlock: { name: "計画ッ！トレセンランド（仮）", both: true, keep: { e: 45, mo: 1, b: 5 }, alt: { mo: 1, s: [10, 0, 0, 10, 0], b: 5, h: [[200362, 5]] } },
        dates: [
          { opts: [{ e: 54, mo: 1, s: [0, 0, 0, 25, 0], b: 5, x: "40 of each vegetable" }] },
          { opts: [{ e: 54, mo: 1, s: [12, 0, 0, 12, 0], b: 5, x: "40 of each vegetable" }] },
          { opts: [{ e: 77, mo: 1, b: 5, x: "40 of each vegetable" }, { mo: 1, s: [0, 0, 0, 36, 0], b: 5, x: "40 of each vegetable" }] },
          { opts: [{ e: 54, mo: 1, s: [0, 0, 0, 31, 0], b: 5, x: "40 of each vegetable" }] },
          { roll: true, p: 0.5, opts: [{ e: 54, mo: 1, s: [0, 0, 0, 45, 0], b: 5, h: [[201592, 3]], x: "40 of each vegetable" }, { e: 46, mo: 1, s: [0, 0, 0, 30, 0], b: 5, h: [[201592, 1]], x: "40 of each vegetable" }] }
        ]
      },
      // SSR Tucker Bryne (Island): outings raise every card's specialty rate next turn
      30257: {
        page: 700422, lv: 50,
        unlock: { name: "燃やせ！エクササイズ！", both: true, keep: { e: 32, mo: 1, sp: 13, b: 5 }, alt: { mo: 1, s: [6, 6, 0, 6, 0], b: 5, h: [[200382, 5]] } },
        dates: [
          { opts: [{ e: 32, me: 4, mo: 1, s: [39, 0, 0, 0, 0], b: 5, x: "+20 specialty rate next turn" }] },
          { opts: [{ e: 32, mo: 1, s: [0, 45, 0, 0, 0], b: 5, x: "+20 specialty rate next turn" }] },
          { opts: [{ e: 80, mo: 1, b: 5, x: "+30 specialty rate next turn" }, { mo: 1, s: ALL(10), sp: 13, b: 5, x: "+30 specialty rate next turn" }] },
          { opts: [{ e: 40, mo: 1, s: [0, 19, 0, 19, 0], b: 5, x: "+20 specialty rate next turn" }] },
          { opts: [{ e: 48, mo: 1, s: [0, 0, 39, 0, 0], b: 5, h: [[203651, 3]], x: "+120 specialty rate next turn" }] }
        ]
      },
      // SSR Kiyoko Hoshina (Onsen): every outing gives bath tickets and a sure Super Recovery
      30276: {
        page: 733885, lv: 50,
        unlock: { name: "湯けむりサスペンス劇場～女将・保科健子～", both: true, keep: { e: 20, mo: 1, s: [18, 0, 0, 0, 0], b: 5 }, alt: { mo: 1, s: ALL(5), b: 5, h: [[202802, 5]] } },
        dates: [
          { opts: [{ me: 4, mo: 1, s: [18, 0, 18, 0, 18], sp: 27, b: 5, x: "1 bath ticket; next bath is a Super Recovery" }] },
          { opts: [{ mo: 1, s: [0, 45, 0, 0, 0], sp: 36, b: 5, h: [[201661, 2]], x: "1 bath ticket; next bath is a Super Recovery" }] },
          { opts: [{ e: 50, mo: 1, b: 5, x: "1 bath ticket; next bath is a Super Recovery" }, { mo: 1, s: ALL(14), sp: 18, b: 5, x: "1 bath ticket; next bath is a Super Recovery" }] },
          { opts: [{ mo: 1, s: [27, 0, 36, 0, 0], sp: 45, b: 5, x: "1 bath ticket; next bath is a Super Recovery" }] },
          { opts: [{ mo: 1, s: [36, 0, 0, 45, 0], sp: 54, b: 5, h: [[201662, 3]], x: "2 bath tickets; next bath is a Super Recovery" }] }
        ]
      },
      // SSR Casino Drive (Beyond Dreams): every outing gives 3 Dream gauge points
      30290: {
        page: 763717, lv: 50,
        unlock: { name: "設立！新規PJ", both: true, keep: { e: 32, mo: 1, s: [9, 0, 0, 9, 0], b: 5 }, alt: { mo: 1, s: [0, 6, 6, 0, 0], sp: 6, b: 5, h: [[201591, 5]] } },
        dates: [
          { opts: [{ e: 48, me: 4, mo: 1, s: [0, 0, 13, 13, 0], sp: 13, b: 5, x: "3 Dream gauge points" }] },
          { opts: [{ e: 48, mo: 1, s: [0, 0, 0, 13, 0], sp: 13, b: 5, h: [[201651, 1]], x: "3 Dream gauge points" }] },
          { opts: [{ e: 80, mo: 1, b: 5, x: "3 Dream gauge points" }, { mo: 1, s: [13, 0, 0, 13, 13], sp: 26, b: 5, x: "3 Dream gauge points" }] },
          { opts: [{ e: 48, mo: 1, s: [6, 0, 6, 13, 0], sp: 6, b: 5, x: "3 Dream gauge points" }] },
          { opts: [{ mo: 1, s: [13, 0, 0, 13, 0], sp: 26, b: 5, h: [[201652, 3]], x: "3 Dream gauge points" }] }
        ]
      },
      // SSR Ancestors & Guides (Grand Masters, Group)
      30137: {
        page: 518990, lv: 50,
        unlock: { name: "真似び学ぶ三女神", auto: true, keep: { e: 6, s: ALL(6), b: 5 } },
        dates: [
          { opts: [{ e: 45, mo: 1, sp: 24, b: 5, h: [[200362, 1], [201591, 1]] }] },
          { opts: [{ e: 32, mo: 1, s: [12, 0, 0, 0, 12], b: 5, h: [[200682, 1], [200992, 1]], cure: true }] },
          { opts: [{ e: 32, me: 4, mo: 1, s: [0, 8, 0, 8, 0], b: 5, h: [[200742, 1], [201702, 1]] }] },
          { opts: [{ e: 36, mo: 1, s: ALL(9), b: 5 }, { e: 45, mo: 1, s: [24, 0, 0, 0, 24], b: 5 }, { e: 36, mo: 1, s: [0, 15, 15, 15, 0], b: 5 }] },
          { opts: [{ e: 40, mo: 1, s: ALL(9), sp: 36, b: 5, h: [[202551, 3]], x: "Passion Zone" }] }
        ]
      },
      // SSR Carvers of History (U.A.F., Group)
      30180: {
        page: 584904, lv: null,
        unlock: { name: "スターウマ娘の威厳を！", auto: true, keep: { s: [0, 9, 0, 9, 0], b: 5 } },
        dates: [
          { opts: [{ e: 19, s: [0, 0, 0, 12, 0], b: 5, h: [[201172, 1]] }] },
          { opts: [{ e: 13, mo: 1, s: [0, 24, 0, 0, 0], b: 5, h: [[201132, 1]] }] },
          { opts: [{ e: 39, b: 5, h: [[200512, 1]] }] },
          { opts: [{ e: 26, s: [0, 12, 0, 12, 0], sp: 12, b: 5, h: [[200032, 1]] }] },
          { opts: [{ e: 39, s: [0, 8, 0, 8, 0], sp: 8, b: 5, h: [[200511, 1]], x: "Passion Zone" }] }
        ]
      },
      // SSR Embodiment of Legends (Legends, Group): every outing fills Guidance gauges
      30241: {
        page: 670449, lv: 50,
        unlock: { name: "交差する奇跡", auto: true, keep: { e: 45, sp: 12, b: 5, h: [[202792, 3]] } },
        dates: [
          { opts: [{ e: 58, me: 4, mo: 1, s: [0, 18, 12, 12, 0], sp: 24, b: 5, x: "every Guidance gauge +3" }] },
          { opts: [{ e: 45, mo: 1, s: ALL(12), sp: 30, b: 5, x: "every Guidance gauge +3" }] },
          { opts: [{ e: 58, mo: 1, s: [18, 0, 0, 0, 12], sp: 36, b: 5, x: "every Guidance gauge +3" }] },
          { opts: [{ e: 58, mo: 1, s: ALL(6), b: 5, h: [[201611, 2]], x: "Saint Lite's gauge +8" }, { e: 58, mo: 1, s: [0, 18, 12, 0, 0], b: 5, h: [[202092, 2]], x: "Speed Symboli's gauge +8" }, { e: 58, mo: 1, s: [12, 0, 0, 18, 0], b: 5, h: [[201601, 2]], x: "Haiseiko's gauge +8" }] },
          { opts: [{ e: 65, mo: 1, s: ALL(9), sp: 36, b: 5, h: [[203501, 3]], x: "Passion Zone; every Guidance gauge +3" }] }
        ]
      }
    }
  };
  if (typeof module !== "undefined" && module.exports) module.exports = DATES;
  else root.UmaDates = DATES;
})(typeof window !== "undefined" ? window : globalThis);
