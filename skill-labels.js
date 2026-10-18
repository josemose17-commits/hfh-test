// Presentation only: resolve inherited-unique owners from exact trainee unique IDs.
// The same 9... -> 1... ID relation is used by tools/build_skillvalues.js.
(function (root) {
  function create({skills = {}, trainees = []} = {}) {
    const owners = new Map();
    trainees.forEach(t => {
      if (!t.n || !String(t.n).trim()) return;
      const source = {id: t.id, name: t.n, variant: t.t || 'Variant unknown'};
      (t.us || []).forEach(unique => {
        const id = String(unique);
        if (!/^1\d+$/.test(id)) return;
        if (!owners.has(id)) owners.set(id, new Map());
        const key = t.id == null ? source.name + '\0' + source.variant : String(t.id);
        owners.get(id).set(key, source);
      });
    });
    const inherited = id => /^9\d+$/.test(String(id)) || !!(skills[id] && skills[id][2] === 9);
    function sources(id) {
      id = String(id);
      if (!inherited(id) || !/^9\d+$/.test(id)) return [];
      const found = owners.get('1' + id.slice(1));
      return found ? [...found.values()].map(s => Object.assign({}, s)) : [];
    }
    function sourceText(id) {
      if (!inherited(id)) return '';
      const found = sources(id);
      return found.length ? 'Source Uma: ' + found.map(s => `${s.name} [${s.variant}]`).join('; ') : 'Source Uma unknown.';
    }
    return {sources, sourceText};
  }
  const api = {create};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.UmaSkillLabels = api;
})(typeof window !== 'undefined' ? window : globalThis);
