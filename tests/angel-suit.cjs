const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({setAttribute(){}}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],c);
const r=vm.runInContext(`(()=>{
 applyDecorationSelection('suit','angel-suit');const selected={...selectedDecorations},skin=skinColor(),horn=hornHidden(),sleeveless=hasSleevelessOutfit(),paths=[];
 for(const size of [60,100,150])for(const part of ['head','leftHand','rightHand','leftLeg','rightLeg']){
  dragPoses.length=0;dragPoses.push(Object.assign(createDragPose(part),{x:30,y:50}));
  const warp=buildWarp({body:size,width:size,arms:size,legs:size,head:size});
  paths.push(angelVestMarkup(warp),...angelHaloSpecs.map(s=>transformPath(s.source,(x,y)=>warp(x,y,s.role))),...angelWingParts.map(s=>backAccessoryPath(s,warp)));
 }
 return {selected,skin,horn,sleeveless,paths};
})()`,c);
assert.equal(r.selected.shoes,null,'Angel suit is barefoot');assert.equal(r.skin,'#754F36');assert.equal(r.horn,false,'Halo leaves the fish horn visible');assert.ok(r.sleeveless);
for(const [slot,id] of Object.entries({skin:'flesh-8',helmet:'angel-halo',shirt:'angel-vest',pants:'white-loose-wide-trousers',cape:'angel-wings'}))assert.equal(r.selected[slot],id);
for(const d of r.paths)assert.ok(!/NaN|Infinity|undefined/.test(d));
for(const file of ['angel-suit','flesh-8','angel-halo','angel-vest','angel-wings','white-loose-wide-trousers'])assert.ok(fs.existsSync(path.join(__dirname,'../svg',file+'.svg')));
console.log('Angel suit: five independent pieces, barefoot, halo preserves horn, sleeveless top and finite geometry across 15 size/pose cases.');
