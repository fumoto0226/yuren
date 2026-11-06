const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({setAttribute(){}}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],c);
const r=vm.runInContext(`(()=>{
 applyDecorationSelection('suit','secondary-suit');
 const selected={...selectedDecorations},color=skinColor(),paint=widePantsPaint(),paths=[];
 for(const size of [60,100,150])for(const part of ['head','leftHand','rightHand','leftLeg','rightLeg']){
  dragPoses.length=0;dragPoses.push(Object.assign(createDragPose(part),{x:35,y:-65}));
  const warp=buildWarp({body:100,width:size,arms:size,legs:size,head:size});
  paths.push(studentOuterMarkup(warp,true));
  for(const side of ['left','right'])paths.push(alohaSleeveMarkup(armGeometry(side,warp),side+'-secondary-test',alohaSleeveStyles['secondary-jacket']));
  paths.push(...secondaryHatSpecs.map(s=>transformPath(s.source,(x,y)=>warp(x,y,s.role))));
 }
 return {selected,color,paint,paths,flare:widePantFlares['black-slight-wide-trousers'],body:studentOuterMarkup(buildWarp({body:100,width:100,arms:100,legs:100,head:100}),true)};
})()`,c);
assert.equal(r.selected.helmet,'secondary-hat');assert.equal(r.selected.outerwear,'secondary-jacket');
assert.equal(r.selected.pants,'black-slight-wide-trousers');assert.equal(r.selected.shoes,'brown-shoes');
assert.equal(r.color,'#dda579');assert.equal(r.paint,'#101011');assert.equal(r.flare,3.5);
assert.equal((r.body.match(/#FCDD43/g)||[]).length,4);assert.ok(!r.body.includes('#fffdf4'));
for(const d of r.paths)assert.ok(d&&!/NaN|Infinity|undefined/.test(d));
console.log('Secondary school suit: warm skin, black uniform with four gold buttons, micro-wide trousers, ordinary brown shoes; finite cap/body/sleeve paths across 15 size/pose combinations.');
