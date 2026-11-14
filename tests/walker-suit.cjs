const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({setAttribute(){}}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1});
vm.runInContext(fs.readFileSync('script.js','utf8').split('resetButton.addEventListener')[0],c);
const result=vm.runInContext(`(()=>{
 applyDecorationSelection('suit','walker-suit');
 const selection={...selectedDecorations};
 const paints={skin:skinColor(),pants:widePantsPaint(),accent:sweatpantsAccent(),space:isSpaceSweatpants()};
 const geometry=[];for(const size of [60,100,150]){
  const w=buildWarp({body:size,width:size,arms:size,legs:size,head:size});
  geometry.push(walkerShirtMarkup(w),looseTopPath(walkerBodySource,w));
  for(const specs of Object.values(walkerSpecs))for(const s of specs)geometry.push(transformPath(s.source,(x,y)=>w(x,y,s.role)));
 }
 selectedDecorations.helmet='shark-hood';const hood=!skinTrait('monkeyFace');
 return {selection,paints,geometry,hood};
})()`,c);
assert.equal(result.selection.skin,'monkey');assert.equal(result.selection.neck,'small-blue-scarf');
assert.equal(result.selection.outerwear,'walker-shirt');assert.equal(result.selection.pants,'walker-sweatpants');
assert.equal(result.selection.shoes,'black-worker-boots');assert.equal(result.selection.helmet,'golden-circlet');
assert.deepEqual({...result.paints},{skin:'#E38047',pants:'#F85137',accent:'#5B270B',space:true});
assert.ok(result.hood);for(const d of result.geometry)assert.ok(d&&!/NaN|undefined|Infinity/.test(d));
console.log('Walker suit: six independent pieces, monkey hood hiding, shared space-trouser fit, orange/brown paint and finite artwork at three body sizes.');

assert.equal(vm.runInContext("teeStyles['walker-shirt'].sleeveEnd",c),31);
assert.ok(!fs.readFileSync("script.js","utf8").includes("walkerPantsBeltMarkup"),"Walker trousers only recolor the existing silhouette and waistband");

const layering=vm.runInContext(`(()=>{
 applyDecorationSelection('shirt','yellow-tee');
 const states=[];
 for(const coat of ['walker-shirt','monk-robe','ninja-shirt']){
  applyDecorationSelection('outerwear',coat);
  states.push([selectedDecorations.shirt,visibleTop()]);
 }
 applyDecorationSelection('outerwear',null);
 return [...states,[selectedDecorations.shirt,visibleTop()]];
})()`,c);
assert.deepEqual(JSON.parse(JSON.stringify(layering)),[
 ['yellow-tee','walker-shirt'],
 ['yellow-tee','monk-robe'],
 ['yellow-tee','ninja-shirt'],
 ['yellow-tee','yellow-tee'],
]);
