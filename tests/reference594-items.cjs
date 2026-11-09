const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({setAttribute(){}}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync('script.js','utf8').split('resetButton.addEventListener')[0],c);
const r=vm.runInContext(`(()=>{
 const items={skin:'scar',helmet:'teardrop-earrings',cape:'paired-swords',pants:'black-gray-sweatpants'};
 for(const [slot,id] of Object.entries(items))applyDecorationSelection(slot,id);
 const selected={...selectedDecorations},geometries=[],earrings={};
 for(const skin of [null,'scar','alien','little-yellow-fish','kappa','pochita']){
  selectedDecorations.skin=skin;
  for(const size of [60,100,150]){
   const warp=buildWarp({body:size,width:size,arms:size,legs:size,head:size});
   geometries.push(teardropPath(warp),garmentPath(scarSource,warp),spaceWaistMarkup(warp),...pairedSwordParts.map(s=>backAccessoryPath(s,warp)));
   if(size===100)earrings[skin]=teardropPath(warp);
  }
 }
 return {selected,geometries,earrings,registered:Object.entries(items).every(([slot,id])=>decorationCatalog[slot].some(v=>v.id===id)),suit:decorationCatalog.suit.some(s=>Object.values(s.pieces).some(id=>Object.values(items).includes(id)))};
})()`,c);
assert.ok(r.registered);assert.equal(r.suit,false);assert.equal(r.selected.suit,null);
for(const [slot,id] of Object.entries({skin:'scar',helmet:'teardrop-earrings',cape:'paired-swords',pants:'black-gray-sweatpants'}))assert.equal(r.selected[slot],id);
assert.notEqual(r.earrings['little-yellow-fish'],r.earrings.null);
for(const d of r.geometries)assert.ok(d&&!/NaN|Infinity|undefined/.test(d));
for(const id of ['scar','teardrop-earrings','paired-swords','black-gray-sweatpants'])assert.ok(fs.existsSync('svg/'+id+'.svg'));
console.log('Group 594: four independent items, simultaneous selection, skin-specific earring geometry and finite paths across six skins and three sizes.');
const shared=vm.runInContext(`(()=>{
 const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
 const shapes=['space-trousers','black-gray-sweatpants'].map(id=>{selectedDecorations.pants=id;return {fit:isSpaceSweatpants(),paint:widePantsPaint(),legs:JSON.stringify(['left','right'].map(side=>legGeometry(side,warp))),pelvis:JSON.stringify(spacePantsGeometry(warp)),waist:spaceWaistMarkup(warp),accent:sweatpantsAccent()};});
 return {shapes,colors:pairedSwordParts.every((spec,i)=>spec.fill===dualSwordParts[i].fill)};
})()`,c);
assert.ok(shared.colors,'Both pairs of swords use the same colors');
const [orange,gray]=shared.shapes;
assert.ok(orange.fit&&gray.fit);assert.equal(orange.legs,gray.legs);assert.equal(orange.pelvis,gray.pelvis);
assert.equal(orange.waist.replaceAll(orange.accent,gray.accent),gray.waist);
assert.equal(gray.paint,'#373737');assert.equal(gray.accent,'#909090');
console.log('Sweatpants share orange geometry and differ only in color; paired swords reuse existing dual-sword colors.');
