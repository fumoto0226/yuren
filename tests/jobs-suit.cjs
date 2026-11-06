const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const inputs=['body','width','arms','legs','head'].map(key=>({dataset:{control:key},value:100}));
const context=vm.createContext({document:{querySelector:()=>({setAttribute(){}}),querySelectorAll:()=>inputs},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],context);
const result=vm.runInContext(`(()=>{
 applyDecorationSelection('suit','jobs-suit');
 const selected={...selectedDecorations},cases=[];
 const nums=d=>d.match(/-?\\d+(?:\\.\\d+)?/g).map(Number);
 for(const legs of [50,100,180])for(const width of [60,100,150])for(const offset of [[0,0],[-45,-40],[45,-60],[0,45],[-65,-30,'leftLeg'],[65,-30,'rightLeg'],[25,-80,'leftLeg'],[-25,-80,'rightLeg']]){
  dragPoses.length=0;
  if(offset[0]||offset[1])dragPoses.push(Object.assign(createDragPose(offset[2]||'head'),{x:offset[0],y:offset[1]}));
  const warp=buildWarp({body:100,width,arms:100,legs,head:100});
  for(const side of ['left','right']){
   const shape=legGeometry(side,warp),p=jobsSneakerPaths(shape,side),knot=nums(p.laces);
   const delta={x:knot[0]-shape.bootOuter.x,y:knot[1]-shape.bootOuter.y};
   const cloth=[0,16,31].map(i=>jobsClothGradient(shape,i,legs));
   const mesh=jobsClothMesh(shape,side,legs,warp);
   const baked=mesh.flat().flatMap(p=>p.points.map(v=>v.t));
   let meshError=0;
   for(const patch of mesh.flat())if(patch.g){const g=patch.g,dx=g.x2-g.x1,dy=g.y2-g.y1;for(const v of patch.points)meshError=Math.max(meshError,Math.abs(((v.x-g.x1)*dx+(v.y-g.y1)*dy)/(dx*dx+dy*dy)-v.t));}
   const material=jobsMaterialReference();
   const anchorError=Math.max(...cloth.map((g,k)=>{const i=[0,16,31][k],p=shape.centerline[i],dx=g.x2-g.x1,dy=g.y2-g.y1;return Math.abs(((p.x-g.x1)*dx+(p.y-g.y1)*dy)/(dx*dx+dy*dy)-(material[side][i].y-material.waist)/(material.end-material.waist));}));
   cases.push({side,baked,meshError,anchorError,cloth:cloth.map(g=>[g.from,g.to]),clothFinite:cloth.every(g=>Number.isFinite(g.x1+g.y1+g.x2+g.y2)),clothExtended:cloth.every((g,k)=>{const i=[0,16,31][k],a=shape.centerline[i],b=shape.centerline[i+1];return Math.hypot(g.x2-g.x1,g.y2-g.y1)>=Math.hypot(b.x-a.x,b.y-a.y)*31.99;}),native:p.fill===shape.bootFill&&p.outline===shape.bootOutline,points:nums(Object.values(p).join(' ')),
    knotAcross:delta.x*shape.shoeOut.x+delta.y*shape.shoeOut.y,
    knotUp:delta.x*(-shape.shoeOut.y)+delta.y*shape.shoeOut.x,
    expectedKnotAcross:side==='left'?-.6:.6,details:jobsSneakerDetails(shape,side),
    texture:[0,1].map(part=>jeansTextureMarkup(shape,part,side,'jobs-gradient-jeans',legs)).join('')});
  }
 }
 dragPoses.length=0;
 const left=legGeometry('left',buildWarp({body:100,width:100,arms:100,legs:100,head:100}));
 const mirror=p=>({x:94-p.x,y:p.y}),vector=p=>({x:-p.x,y:p.y});
 const right={...left,bootOuter:mirror(left.bootOuter),bootInner:mirror(left.bootInner),instep:mirror(left.instep),
  instepAxes:{toe:vector(left.instepAxes.toe),up:vector(left.instepAxes.up)},
  shoeOut:{x:left.shoeOut.x,y:-left.shoeOut.y},shoeUp:vector(left.shoeUp),centerline:left.centerline.map(mirror),shoeCurves:left.shoeCurves.map(c=>c.map(mirror)),
  bootFill:transformPath(left.bootFill,(x,y)=>mirror({x,y})),bootOutline:transformPath(left.bootOutline,(x,y)=>mirror({x,y}))};
 const lp=jobsSneakerPaths(left,'left'),rp=jobsSneakerPaths(right,'right');
 let mirrorError=0;
 for(const key of ['fill','sole','laces']){const a=nums(lp[key]),b=nums(rp[key]);for(let i=0;i<a.length;i++){if(key==='sock'){if(i%2)continue;let error=Infinity;for(let j=0;j<b.length;j+=2)error=Math.min(error,Math.hypot(94-a[i]-b[j],a[i+1]-b[j+1]));mirrorError=Math.max(mirrorError,error);}else mirrorError=Math.max(mirrorError,Math.abs((i%2?a[i]:94-a[i])-b[i]));}}
 const reference=jobsMaterialReference(),samples=[];
 for(const side of ['left','right']){
  const shape=legGeometry(side,buildWarp({body:100,width:100,arms:100,legs:100,head:100}));
  for(const i of [0,3,6,12,19,25,31]){
   const g=jobsClothGradient(shape,i),x=shape.centerline[i].x,y=132.8;
   const dx=g.x2-g.x1,dy=g.y2-g.y1;
   samples.push(Math.abs(((x-g.x1)*dx+(y-g.y1)*dy)/(dx*dx+dy*dy)-(y-reference.waist)/(reference.end-reference.waist)));
  }
 }
 return {selected,skin:skinColor(),cases,mirrorError,seamError:Math.max(...samples),rootColours:[0,.08,.16,.25].map(jobsDenimColor),seamColour:jobsDenimColor(.3),legStart:jobsLegColor(0),legEnd:jobsLegColor(1),gradientEnd:jobsDenimColor(1),lens:jobsGlassesSpecs.find(s=>s.fill==='#f1f1f1').opacity,frameWidths:jobsGlassesSpecs.map(s=>s.strokeWidth)};
})()`,context);
assert.ok(result.seamError<1e-6,'Every standing cloth gradient must match the pelvis field at the SAME spatial join, not only at its own origin');
assert.equal(result.selected.skin,'flesh-2');assert.equal(result.skin,'#f4ece6');assert.equal(result.selected.helmet,'round-glasses');
assert.equal(result.selected.shirt,'black-turtleneck-tee');assert.equal(result.selected.pants,'jobs-gradient-jeans');assert.equal(result.selected.shoes,'gray-sneakers');
assert.notEqual(result.rootColours[0],result.rootColours[2],'Restore the original leg gradient rather than a flat thigh-root plateau');assert.equal(result.legEnd,result.gradientEnd);assert.equal(result.lens,.5);assert.ok(result.frameWidths.every(w=>w===1.1));assert.ok(result.mirrorError<.003);
const bakedBySide={};
for(const c of result.cases){bakedBySide[c.side] ||= c.baked;assert.deepEqual(c.baked,bakedBySide[c.side],'Mesh material values must remain fixed across every pose');assert.ok(c.meshError<1e-5,'Deformed mesh must interpolate each fixed vertex colour exactly');assert.ok(c.anchorError<1e-6,'A material point must keep its reference colour when a leg is raised');assert.deepEqual(c.cloth,result.cases[0].cloth,'Cloth colours at a given leg index must stay unchanged when raised or bent');assert.ok(c.clothFinite);assert.ok(c.native,'Sneaker must preserve normal shoe geometry');assert.ok(c.points.every(Number.isFinite));assert.ok(c.points.every(n=>Math.abs(n)<1000));assert.ok(Math.abs(c.knotAcross-c.expectedKnotAcross)<.01);assert.ok(Math.abs(c.knotUp)<.01);assert.equal(c.texture,'');assert.ok(c.details.includes('clip-path'));}
console.log('Jobs suit: 144 size/pose cases preserve native shoes, clipped soles and mirrored SVG bows, no socks; mirrored details and 50% lenses passed.');
const pelvis=vm.runInContext(`(()=>{
 const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
 const axes=[];
 for(const side of ['leftLeg','rightLeg'])for(const [x,y] of [[0,0],[-60,-70],[60,-90],[20,40]]){
  dragPoses.length=0;dragPoses.push(Object.assign(createDragPose(side),{x,y}));
  const a=jobsPelvisAxis(warp);axes.push([a.x2-a.x1,a.y2-a.y1]);
 }
 dragPoses.length=0;return axes;
})()`,context);
for(const axis of pelvis)for(let i=0;i<2;i++)assert.ok(Math.abs(axis[i]-pelvis[0][i])<1e-9,'Raising either leg must not rotate or stretch the pelvis gradient');
console.log('Pelvis gradient stays attached to the waist when either leg is raised.');
