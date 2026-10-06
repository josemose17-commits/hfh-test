// Runs the deck optimizer off the main thread: loads the same data and modules as the page,
// then answers each request with progress messages and a result (see UmaOptimizer.runJob).
/* global importScripts, UmaOptimizer */
const V = (self.location.search.match(/v=([\w-]+)/) || [])[1] || "";
const q = V ? "?v=" + V : "";
importScripts("data/gametora.js" + q, "deck.js" + q, "scenarios.js" + q, "engine.js" + q, "optimizer.js" + q);

self.onmessage = (e) => {
  let last = 0;
  try {
    const out = UmaOptimizer.runJob(e.data, (f) => {
      if (f - last >= 0.05 || f === 1) { last = f; self.postMessage({ type: "progress", f }); }
    });
    self.postMessage(out);
  } catch (err) {
    self.postMessage({ type: "error", message: String((err && err.message) || err) });
  }
};
