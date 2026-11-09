const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({setAttribute(){}}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync('script.js','utf8').split('resetButton.addEventListener')[0],c);
const r=vm.runInContext(`(()=>{
 const ids={helmet:'blue-eye-band',cape:'gourd',shoes:'navy-slippers'};
 for(const [slot,id] of Object.entries(ids))applyDecorationSelection(slot,id);
 const selected={...selectedDecorations},geometry=[];
 for(const size of [60,100,150])for(const part of ['head','leftLeg','rightLeg']){
  controls.legs.value=size;dragPoses.length=0;dragPoses.push(Object.assign(createDragPose(part),{x:35,y:-45}));
  const warp=buildWarp({body:size,width:size,arms:size,legs:size,head:size});
  geometry.push(...eyeBandSpecs.map(s=>transformPath(s.source,(x,y)=>applyDragPose(warp(x,y,s.role),x,y,s.role,warp))),...gourdParts.map(s=>backAccessoryPath(s,warp)),...['left','right'].map(side=>slipperMarkup(legGeometry(side,warp),side)));
 }
 return {selected,geometry,registered:Object.entries(ids).every(([slot,id])=>decorationCatalog[slot].some(s=>s.id===id)),seaweed:decorationCatalog.pants.some(s=>s.id==='seaweed-pants')||decorationStyleGroups.pants.some(s=>s[2].includes('seaweed-pants'))};
})()`,c);
assert.ok(r.registered);assert.equal(r.seaweed,false);
for(const [slot,id] of Object.entries({helmet:'blue-eye-band',cape:'gourd',shoes:'navy-slippers'}))assert.equal(r.selected[slot],id);
for(const d of r.geometry)assert.ok(d&&!/NaN|Infinity|undefined/.test(d));
for(const id of ['blue-eye-band','gourd','navy-slippers'])assert.ok(fs.existsSync('svg/'+id+'.svg'));
console.log('Group 595: three independent accessories, seaweed removed from wardrobe, finite geometry across 9 size/drag cases.');
