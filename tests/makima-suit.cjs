const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({setAttribute(){}}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],c);
const r=vm.runInContext(`(()=>{
 applyDecorationSelection('suit','makima-suit');const selected={...selectedDecorations},color=skinColor(),paint=widePantsPaint(),rings=skinTrait('eyeRings'),paths=[];
 for(const size of [60,100,150])for(const part of ['head','leftHand','rightHand','leftLeg']){
  dragPoses.length=0;dragPoses.push(Object.assign(createDragPose(part),{x:30,y:-60}));
  const warp=buildWarp({body:size,width:size,arms:size,legs:size,head:size});paths.push(collaredShirtMarkup(warp));
  paths.push(...hypnoticEyeSpecs.map(s=>transformPath(s.source,(x,y)=>warp(x,y,s.role))));
 }
 selectedDecorations.helmet='shark-hood';const hoodRings=skinTrait('eyeRings');
 selectedDecorations.helmet=null;applyDecorationSelection('skin','flesh');const normalRings=skinTrait('eyeRings');
 return {selected,color,paint,rings,hoodRings,normalRings,paths,tie:collaredShirtSpecs[1].source};
})()`,c);
assert.equal(r.selected.shirt,'white-tie-shirt');assert.equal(r.selected.helmet,'long-braid-hair');assert.equal(r.selected.shoes,'brown-shoes');
assert.equal(r.color,'#FBD5CA');assert.equal(r.paint,'#2B2D2D');assert.equal(r.rings,true);assert.equal(r.hoodRings,undefined);assert.equal(r.normalRings,undefined);
assert.ok(r.tie.includes('108'));for(const d of r.paths)assert.ok(d&&!/NaN|Infinity|undefined/.test(d));
console.log('Makima suit: independent pieces, flesh skin with concentric eyes, hood/skin reset, short tie and finite paths across sizes and poses.');
