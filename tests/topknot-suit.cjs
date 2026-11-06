const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({setAttribute(){}}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],c);
const r=vm.runInContext(`(()=>{
 applyDecorationSelection('suit','topknot-suit');const selected={...selectedDecorations},color=skinColor(),eye=skinTrait('eyeRings'),paths=[];
 for(const size of [60,100,150])for(const part of ['head','leftHand','rightHand','leftLeg','rightLeg']){
  dragPoses.length=0;dragPoses.push(Object.assign(createDragPose(part),{x:30,y:-65}));
  const warp=buildWarp({body:100,width:size,arms:size,legs:size,head:size});
  paths.push(blazerMarkup(warp));
  for(const side of ['left','right']){
   paths.push(alohaSleeveMarkup(armGeometry(side,warp),side+'-blazer-test',alohaSleeveStyles['charcoal-blazer']));
   paths.push(colorblockShoeDetails(legGeometry(side,warp),side));
  }
  paths.push(...topknotHairSpecs.map(s=>transformPath(s.source,(x,y)=>warp(x,y,s.role))));
 }
 return {selected,color,eye,paths,group:decorationStyleGroups.shoes.find(g=>g[0]==='colorblock-shoes')[2],horn:hornCovered('topknot-hair')};
})()`,c);
assert.equal(r.selected.shirt,'white-tie-shirt');assert.equal(r.selected.outerwear,'charcoal-blazer');assert.equal(r.selected.shoes,'colorblock-shoes');assert.equal(r.selected.pants,'dark-gray-slight-wide-trousers');
assert.equal(r.color,'#FBD5CA');assert.equal(r.eye,undefined);assert.equal(r.horn,true);assert.deepEqual([...r.group],['colorblock-shoes']);
for(const d of r.paths)assert.ok(d&&!/NaN|Infinity|undefined/.test(d));
const rules=fs.readFileSync(require('node:path').join(__dirname,'../EXPORT_RULES.md'),'utf8');
assert.ok(rules.includes('| 套装 `suit` | `makima-suit`'));
for(const id of ['hypnotic','long-braid-hair','white-tie-shirt','dark-gray-slight-wide-trousers','brown-shoes'])assert.ok(rules.split('以下单品明确允许独立导出')[1].includes('`'+id+'`'));
console.log('Topknot suit: six independent pieces, normal eyes, shared flesh tone, separate colorblock shoe style, finite posed geometry and explicit Makima export exclusions/allowed pieces.');
