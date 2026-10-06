// Bundles Euophrys' support card tier list (MIT, github.com/Euophrys/umamusume-tierlist) for the
// browser: its scoring code (tierlist-calc.js), event table, scenario weights and Global card
// data, unchanged apart from turning the ES modules into one script.
// Usage: node tools/build_euophrys.mjs   (needs network access to raw.githubusercontent.com)
import fs from "node:fs";

const RAW = "https://raw.githubusercontent.com/Euophrys/umamusume-tierlist/main/";
const get = async (p) => {
  const r = await fetch(RAW + p);
  if (!r.ok) throw new Error(p + ": HTTP " + r.status);
  return r.text();
};
const strip = (src) => src
  .replace(/^import .*$/gm, "")
  .replace(/^export default \w+;?\s*$/gm, "")
  .replace(/^export (function|const|let)/gm, "$1");

const [calc, events, scenarios, gl, license] = await Promise.all([
  get("src/components/tierlist-calc.js"), get("src/card-events.js"), get("src/scenarios.js"), get("src/cards/gl.js"), get("LICENSE"),
]);
const cardsText = gl.replace(/^export default cards;?\s*$/m, "").replace(/^const cards\s*=\s*/m, "").trim().replace(/;$/, "");
const cards = JSON.parse(cardsText);

const out = `// Euophrys' Uma Musume support card tier list, bundled by tools/build_euophrys.mjs. Do not edit.
// Source: https://github.com/Euophrys/umamusume-tierlist
/*
${license.trim()}
*/
(function (root) {
${strip(events)}
${strip(scenarios)}
${strip(calc)}
  const api = { processCards, GainsToScore, getScenario, getServerConfig, SCENARIOS_BY_SERVER, events, raceRewards };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Euophrys = api;
})(typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : globalThis);
`;
fs.writeFileSync("vendor/euophrys.js", out);
fs.writeFileSync("data/euophrys-cards.js",
  "// Global support card data from Euophrys' tier list (MIT), one entry per card and limit break.\n" +
  "(function (root) {\n  const CARDS = " + JSON.stringify(cards) + ";\n" +
  '  if (typeof module !== "undefined" && module.exports) module.exports = CARDS;\n  else root.EuophrysCards = CARDS;\n' +
  '})(typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : globalThis);\n');
console.log("vendor/euophrys.js", out.length, "bytes; data/euophrys-cards.js", cards.length, "card entries");
