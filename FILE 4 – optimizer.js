// super-minimal optimiser – maximises total Receive only
import characters from './characters.json' assert { type: 'json' };
import potentials from './potentials.json' assert { type: 'json' };

const rosterEl = document.getElementById('roster');
const optBtn   = document.getElementById('optBtn');
const urlBox   = document.getElementById('urlBox');

let state = JSON.parse(localStorage.getItem('hhfhBuild')) || {
  team: ['kuroo','hinata','kageyama','tsukishima','tanaka','nishinoya'],
  pots: { kuroo:{top:'sup_rec_top',bottom:'sup_serve_bot',accessory:'assist_set_acc',shoes:'assist_rec_shoes'},
          hinata:{}, kageyama:{}, tsukishima:{}, tanaka:{}, nishinoya:{} }
};

function render() {
  rosterEl.innerHTML = '';
  characters.forEach(ch => {
    const div = document.createElement('div'); div.className = 'row';
    div.innerHTML = `
      <span>${ch.name} (${ch.position})</span>
      <select data-id="${ch.id}" data-slot="top">${opts(ch.id,'top')}</select>
      <select data-id="${ch.id}" data-slot="bottom">${opts(ch.id,'bottom')}</select>
      <select data-id="${ch.id}" data-slot="shoes">${opts(ch.id,'shoes')}</select>
      <select data-id="${ch.id}" data-slot="accessory">${opts(ch.id,'accessory')}</select>
      <button class="lock" data-id="${ch.id}">Lock</button>`;
    rosterEl.appendChild(div);
  });
  attachHandlers();
  buildUrl();
}

function opts(id,slot){
  let html = '<option value="">--none--</option>';
  potentials.filter(p=>p.slot===slot).forEach(p=>{
    const sel = state.pots[id][slot]===p.id ? 'selected':'';
    html += `<option value="${p.id}" ${sel}>${p.set.name} – ${p.main.stat}${p.main.isPercent?'%':''}</option>`;
  });
  return html;
}

function attachHandlers(){
  rosterEl.querySelectorAll('select').forEach(s=>s.onchange=e=>{
    const{id,slot}=e.target.dataset;
    state.pots[id][slot]=e.target.value;
    saveAndUrl();
  });
  rosterEl.querySelectorAll('.lock').forEach(b=>b.onclick=e=>{
    e.target.textContent = e.target.textContent==='Lock'?'Unlock':'Lock';
  });
}

function score(){
  let total=0, locked={};
  characters.forEach(ch=>{
    const p = state.pots[ch.id];
    ['top','bottom','shoes','accessory'].forEach(slot=>{
      const piece = potentials.find(x=>x.id===p[slot]);
      if(!piece) return;
      if(!locked[piece.set.name]) locked[piece.set.name]=0;
      locked[piece.set.name]++;
      // main stat
      const val = piece.main.isPercent ? ch.stats[piece.main.stat] * piece.main.value/100
                                       : piece.main.value;
      total += val;
      // subs
      piece.subs.forEach(s=>{
        const v = s.isPercent ? ch.stats[s.stat] * s.value/100 : s.value;
        total += v;
      });
    });
  });
  // 2-pc bonus
  Object.entries(locked).forEach(([set,n])=>{
    if(n>=2){
      const bonus = potentials.find(p=>p.set.name===set).set.bonus2;
      const val = bonus.isPercent ? characters.reduce((s,c)=>s+c.stats[bonus.stat],0)*bonus.value/100 : bonus.value;
      total += val;
    }
  });
  return total;
}

optBtn.onclick = () => {
  // greedy swap for each slot
  characters.forEach(ch=>{
    ['top','bottom','shoes','accessory'].forEach(slot=>{
      if(rosterEl.querySelector(`.lock[data-id="${ch.id}"]`).textContent==='Unlock') return; // locked
      let bestId='', bestScore=-1;
      potentials.filter(p=>p.slot===slot).forEach(p=>{
        const old = state.pots[ch.id][slot];
        state.pots[ch.id][slot]=p.id;
        const s = score();
        if(s>bestScore){bestScore=s; bestId=p.id;}
        state.pots[ch.id][slot]=old;
      });
      if(bestId) state.pots[ch.id][slot]=bestId;
    });
  });
  render();
};

function saveAndUrl(){localStorage.setItem('hhfhBuild',JSON.stringify(state)); buildUrl();}
function buildUrl(){
  const compressed = btoa(JSON.stringify(state)); // simple base64 for now
  urlBox.value = location.href.split('#')[0] + '#' + compressed;
}

window.addEventListener('load',()=>{
  if(location.hash){ try{ state=JSON.parse(atob(location.hash.slice(1))); }catch(e){} }
  render();
});
