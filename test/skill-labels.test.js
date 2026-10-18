const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../skill-labels.js');
const D = require('../deck.js');
const SV = require('../data/skillvalues/index.js');

test('real inherited uniques resolve the Uma and specific variant through unique IDs', () => {
  const labels = L.create({skills: SV.skills, trainees: D.DATA.trainees});
  assert.equal(labels.sourceText(900011), 'Source Uma: Special Week [Special Dreamer]');
  assert.equal(labels.sourceText('910011'), "Source Uma: Special Week [Hopp'n♪Happy Heart]");
  assert.equal(labels.sourceText(900031), 'Source Uma: Tokai Teio [Peak Joy]');
  assert.equal(labels.sourceText(910031), 'Source Uma: Tokai Teio [Beyond the Horizon]');
});
test('shared inherited skill groups exact unique owners once, not hint/awakening/support sources', () => {
  const trainees = [
    {id:1,n:'Uma A',t:'Original',us:[100011]},
    {id:2,n:'Uma A',t:'Festival',us:['100011']},
    {id:2,n:'Uma A',t:'Festival',us:[100011]},
    {id:3,n:'Wrong owner',t:'Same named skill',us:[110011],is:[100011],as:[100011]}
  ];
  const labels = L.create({skills: {'900011':['Name deliberately unrelated',200,9,1]},trainees});
  assert.equal(labels.sourceText(900011), 'Source Uma: Uma A [Original]; Uma A [Festival]');
  assert.equal(labels.sources(900011).length,2);
});
test('missing owner data is explicit, without guessing from names or metadata alone', () => {
  const labels = L.create({skills: {'900011':['Special Week skill',200,9,1]},trainees:[]});
  assert.equal(labels.sourceText(900011), 'Source Uma unknown.');
  assert.equal(labels.sourceText(99999999), 'Source Uma unknown.');
  assert.equal(L.create({}).sourceText(900011), 'Source Uma unknown.');
});
test('ordinary and base uniques stay unchanged; incomplete owner labels remain explicit', () => {
  const labels = L.create({skills:SV.skills,trainees:[{id:1,n:'Uma A',us:[100011]}]});
  assert.equal(labels.sourceText(201322), '');
  assert.equal(labels.sourceText(100011), '');
  assert.equal(labels.sourceText(900011), 'Source Uma: Uma A [Variant unknown]');
  assert.equal(L.create({trainees:[{id:1,t:'Some variant',us:[100011]}]}).sourceText(900011), 'Source Uma unknown.');
});
test('every stored inherited unique either resolves an exact unique ID or reports unknown', () => {
  const labels = L.create({skills:SV.skills,trainees:D.DATA.trainees});
  for(const [id,m] of Object.entries(SV.skills).filter(([,m])=>m[2]===9)) {
    const owners = D.DATA.trainees.filter(t=>(t.us||[]).map(String).includes('1'+id.slice(1)));
    if(!owners.length) assert.equal(labels.sourceText(id),'Source Uma unknown.',id);
    else for(const owner of owners) assert.ok(labels.sourceText(id).includes(`${owner.n} [${owner.t || 'Variant unknown'}]`),id);
  }
});
