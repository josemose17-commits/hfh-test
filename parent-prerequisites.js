// Parent-only purchase availability. Keep actual hint discounts separate from
// white prerequisites unlocked by gold hints; never feed this into ace offers.
(function (root) {
  const D = root.UmaDeck || (typeof require !== 'undefined' ? require('./deck.js') : null);
  const DISCOUNT = [0, .1, .2, .3, .35, .4];
  const clamp = p => Math.max(0, Math.min(1, p));
  function create(metadata) {
    const cache = new Map(), families = new Map();
    Object.entries(metadata).forEach(([id,m]) => {
      if (m[3] !== 1) return;
      if (!families.has(m[0])) families.set(m[0], []);
      families.get(m[0]).push(id);
    });
    function chain(id, seen = new Set()) {
      id = String(id);
      if (cache.has(id)) return cache.get(id);
      const m = metadata[id];
      if (!m || seen.has(id) || !Number.isFinite(m[1]) || m[1] < 0) return null;
      const path = new Set(seen); path.add(id);
      const before = m[2] == null ? [] : chain(m[2], path);
      const result = before && before.every(p => metadata[p][0] === m[0]) ? before.concat(id) : null;
      cache.set(id, result); return result;
    }
    function whites(id) {
      const m = metadata[id];
      if (!m || m[3] !== 2) return [];
      return (chain(id) || []).filter(p => metadata[p][3] === 1);
    }
    function unlocks(id) {
      const c = chain(id);
      if (!c || (metadata[id][3] === 2 && !whites(id).length)) return [];
      return [...new Set(c.concat(families.get(metadata[id][0]) || []))].filter(p => p !== String(id));
    }
    const allowed = (ctx,id) => !ctx.allowSkill || ctx.allowSkill(String(id));
    function available(ctx, levels) {
      const ids = new Set();
      Object.entries(levels).forEach(([id,lv]) => {
        if (!(lv > 0) || !allowed(ctx,id)) return;
        ids.add(id); whites(id).filter(p => allowed(ctx,p)).forEach(p => ids.add(p));
      });
      return ids;
    }
    function offers(ctx = {}) {
      const hints = D.skillOffers(), availability = new Map();
      function collect(outcomes, source, kind = 'event') {
        const chances = new Map(), routes = new Map();
        outcomes.forEach(out => {
          if (!(out.p > 0)) return;
          const levels = out.levels || {};
          available(ctx, levels).forEach(id => chances.set(id,(chances.get(id)||0)+out.p));
          Object.entries(levels).forEach(([gold,lv]) => {
            if (!(lv > 0) || !allowed(ctx,gold)) return;
            whites(gold).filter(id => allowed(ctx,id)).forEach(id => {
              const key = id+':'+gold;
              const r=routes.get(key)||{id,via:gold,p:0};r.p+=out.p;routes.set(key,r);
            });
          });
        });
        chances.forEach((p,id) => {
          p=clamp(p); if (!p) return;
          const a=availability.get(id)||{id,miss:1,eventMiss:1,trainingMiss:1,src:[],derived:new Map()};
          a.miss*=1-p;
          if(kind==='training')a.trainingMiss*=1-p;else a.eventMiss*=1-p;
          if(!a.src.includes(source))a.src.push(source);
          availability.set(id,a);
        });
        routes.forEach(r => {
          const a=availability.get(r.id);if(!a)return;
          const key=source+':'+r.via+':'+kind;
          const x=a.derived.get(key)||{via:r.via,card:source,kind,miss:1};
          x.miss*=1-clamp(r.p);a.derived.set(key,x);
        });
      }
      return {
        exclusive(outcomes,source,kind='event') {hints.exclusive(outcomes,source,kind);collect(outcomes,source,kind);},
        add(id,p,lv,source,kind='event') {hints.add(id,p,lv,source,kind);collect([{p:clamp(p),levels:{[id]:Math.max(1,Math.min(5,Math.floor(lv)))}}],source,kind);},
        trainingHints(id,mean,lv,source) {
          hints.trainingHints(id,mean,lv,source);
          collect([{p:1-Math.exp(-Math.max(0,mean)),levels:{[id]:Math.max(1,Math.min(5,Math.floor(lv)))}}],source,'training');
        },
        values() {
          const direct=new Map(hints.values().map(h=>[h.id,h]));
          return [...availability.values()].map(a => {
            const h=direct.get(a.id),p=1-a.miss,discount=h?h.expectedDiscount:0;
            return {id:a.id,p,lv:h?h.lv:0,src:a.src,hintP:h?h.p:0,
              expectedDiscount:discount,conditionalDiscount:discount/p,
              eventP:1-a.eventMiss,trainingP:1-a.trainingMiss,
              prerequisiteSources:[...a.derived.values()].map(r=>({via:r.via,card:r.card,kind:r.kind,p:1-r.miss}))};
          });
        }
      };
    }
    function eventContext(ctx,card) {
      const derived = (card.es || []).flatMap(id => whites(id)).some(id => !ctx.known.has(id) && (ctx.skills[id] > 0 || ctx.must.includes(id)));
      if (!derived) return ctx;
      // Event choices must see the value of the white unlock, using only the
      // white's actual hint level. A gold hint never discounts its prerequisite.
      const relevant=[...new Set((card.es||[]).map(String).flatMap(id=>[id,...whites(id)]))];
      return Object.assign({},ctx,{
        eventUtilityKey:JSON.stringify(['parent-prerequisites-v1',relevant.map(id=>[id,whites(id),ctx.skills[id]||0,ctx.costs[id]||D.skillCost(id),ctx.known.has(id),ctx.must.includes(id),allowed(ctx,id)])]),
        eventUtility(levels) {
          let value=0;
          available(ctx,levels).forEach(id=>{
            if(ctx.known.has(id))return;
            const L=Math.max(0,ctx.skills[id]||0),lv=Math.min(5,Math.max(0,Math.floor(levels[id]||0)));
            // Match the parent source objective: target value plus real hint
            // savings, without treating purchase affordability as the source objective.
            if(L)value+=L*60+(ctx.costs[id]||D.skillCost(id)||150)*DISCOUNT[lv]*.35;
            // skill-events already awards direct must-have utility separately.
            if(ctx.must.includes(id)&&!(levels[id]>0))value+=10000;
          });
          return value;
        }
      });
    }
    return {chain,whites,unlocks,offers,eventContext};
  }
  const api={create};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.UmaParentPrerequisites=api;
})(typeof window!=='undefined'?window:globalThis);
