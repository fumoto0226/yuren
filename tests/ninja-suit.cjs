const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({setAttribute(){}}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1});
vm.runInContext(fs.readFileSync('script.js','utf8').split('resetButton.addEventListener')[0],c);
const result=vm.runInContext(`(()=>{
 applyDecorationSelection('suit','ninja-suit');const pieces={...selectedDecorations},geometry=[];
 const palette={cloth:widePantsPaint(),accent:sweatpantsAccent(),hood:fullHood(),shaft:bootProfiles['ninja-worker-boots'].color,shoe:bootProfiles['ninja-worker-boots'].shoeColor};
 for(const size of [60,100,150])for(const depth of [0,35,55]){
  dragPoses.length=0;if(depth)dragPoses.push(Object.assign(createDragPose('body'),{x:0,y:depth}));
  const w=buildWarp({body:size,width:size,arms:size,legs:size,head:size});
  for(const spec of ninjaHoodSpecs)geometry.push(transformPath(spec.source,(x,y)=>w(x,y,spec.role)));
  geometry.push(ninjaShirtMarkup(w),spacePantsGeometry(w).fill);
  for(const side of ['left','right']){geometry.push(ninjaBindingPath(armGeometry(side,w),22,30.8,ninjaWristExtra),ninjaArmBindingPanel(armGeometry(side,w)),ninjaBindingPath(legGeometry(side,w),19.2,30.5,workerBootExtra));}
 }
 return {pieces,palette,geometry};
})()`,c);
for(const [slot,id] of Object.entries({helmet:'ninja-hood',outerwear:'ninja-shirt',pants:'ninja-sweatpants',shoes:'ninja-worker-boots',cape:'dual-swords'}))assert.equal(result.pieces[slot],id);
assert.deepEqual({...result.palette},{cloth:'#006089',accent:'#020202',hood:true,shaft:'#9BA9B2',shoe:'#020202'});
for(const d of result.geometry)assert.ok(d&&!/NaN|undefined|Infinity/.test(d));
console.log('Ninja suit: independent pieces, blue/black trousers, separate gray-blue shafts and black shoes; finite hood and shared wrist/calf lattice over 9 size/squat poses.');
const join=vm.runInContext(`(()=>{const w=buildWarp({body:100,width:100,arms:100,legs:100,head:100}),s=armGeometry('right',w);const d=ninjaArmBindingPanel(s),v=d.match(/-?\\d+(?:\\.\\d+)?/g).map(Number);return {a:{x:v[0],y:v[1]},b:{x:v[v.length-2],y:v[v.length-1]},before:s.centerline[22],after:s.centerline[23],width:s.hose[22].width+ninjaWristExtra(22),old:s.hose[22].width+teeSleeveWidth(22,teeStyles['ninja-shirt'])};})()`,c);
assert.ok(join.width<join.old-1.9,'Wrist binding is visibly narrower than the upper sleeve');
assert.ok(Math.abs(Math.hypot(join.b.x-join.a.x,join.b.y-join.a.y)-join.width)<.002);
const tangent={x:join.after.x-join.before.x,y:join.after.y-join.before.y};
assert.ok(Math.abs((join.b.x-join.a.x)*tangent.x+(join.b.y-join.a.y)*tangent.y)<.003,'Binding top is a straight cross-section, not a rounded tube cap');
