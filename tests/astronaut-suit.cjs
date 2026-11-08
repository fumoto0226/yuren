const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({setAttribute(){}}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],c);
const r=vm.runInContext(`(()=>{
 applyDecorationSelection('suit','astronaut-suit');const selected={...selectedDecorations},paint=widePantsPaint(),paths=[];
 selectedDecorations.skin='hypnotic';const faceHidden=skinTrait('eyeRings')===undefined&&hornHidden();
 for(const size of [60,100,150])for(const part of ['head','leftHand','rightHand','leftLeg','rightLeg']){
  dragPoses.length=0;dragPoses.push(Object.assign(createDragPose(part),{x:30,y:45}));
  const warp=buildWarp({body:size,width:size,arms:size,legs:size,head:size});
  paths.push(spaceOuterMarkup(warp),spacePantsGeometry(warp).fill,spacePantsGeometry(warp).edges);
  for(const side of ['left','right'])paths.push(spaceSleeveMarkup(armGeometry(side,warp),side+'-space-test'));
  paths.push(...spaceHelmetSpecs.map(s=>transformPath(s.source,(x,y)=>warp(x,y,s.role))));
 }
 selectedDecorations.helmet=null;const restored=skinTrait('eyeRings')===true;
 return {selected,paint,paths,faceHidden,restored,shirtEntry:decorationCatalog.shirt.some(i=>i.id==='space-shirt'),outerEntry:decorationCatalog.outerwear.some(i=>i.id==='space-shirt'),pantsMid:wideLegExtraWidth(16,widePantFlares['space-trousers']),pantsAnkle:wideLegExtraWidth(31,widePantFlares['space-trousers'])};
})()`,c);
for(const [slot,id] of Object.entries({helmet:'space-helmet',outerwear:'space-shirt',pants:'space-trousers',shoes:'orange-shoes',gloves:'space-gloves'}))assert.equal(r.selected[slot],id);
assert.ok(!r.shirtEntry&&r.outerEntry,'Space top is independent outerwear');assert.ok(r.pantsMid>4&&r.pantsMid<5&&r.pantsAnkle===8,'Space trousers widen evenly toward the cuff without a bulging middle');
assert.equal(r.paint,'#FF8215');assert.ok(r.faceHidden&&r.restored);
for(const d of r.paths)assert.ok(d&&!/NaN|Infinity|undefined/.test(d));
console.log('Astronaut: five independent pieces, orange trousers, helmet hides/restores facial traits and finite helmet/sleeves/belt across 15 size/pose cases.');
const joins=vm.runInContext(`(()=>{
 const rows=[];
 for(const size of [60,100,150])for(const pose of [null,['head',0,65],['leftLeg',40,-35],['rightLeg',-40,-35]]){
  dragPoses.length=0;if(pose)dragPoses.push(Object.assign(createDragPose(pose[0]),{x:pose[1],y:pose[2]}));
  const warp=buildWarp({body:100,width:size,arms:100,legs:size,head:100}),pelvis=spacePantsGeometry(warp);
  rows.push({pelvis,anchors:[legGeometry('left',warp,true).crotchAnchor,legGeometry('right',warp,true).crotchAnchor]});
 }
 return {rows,sharedBody:spaceBodySource.includes(spaceBodySides.slice(1)),rootWidth:wideLegExtraWidth(0,9.25)};
})()`,c);
assert.ok(joins.sharedBody,'Space jacket fill and outline derive from the same side and hem geometry');
assert.equal(joins.rootWidth,0,'Wide legs meet the original crotch without extra inward root width');
for(const {pelvis,anchors} of joins.rows){
 const points=pelvis.crotch.match(/-?\d+(?:\.\d+)?/g).map(Number);
 for(const [i,point] of [anchors[0],anchors[1]].entries()){const offset=i?points.length-2:0;assert.ok(Math.hypot(points[offset]-point.x,points[offset+1]-point.y)<.02,'Crotch endpoints stay joined to actual trouser roots');}
 for(const value of Object.values(pelvis))assert.ok(!/NaN|Infinity|undefined/.test(value));
}
console.log('12 standing, deep-squat and crossed-leg cases use the original pelvis/crotch with a modest waist and depth adjustment; widening starts below the hip.');
const fitting=vm.runInContext(`(()=>{
 dragPoses.length=0;
 const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
 const plain=legGeometry('left',warp,false),space=legGeometry('left',warp,true);
 return {plainHip:plain.hip,spaceHip:space.hip,plainFoot:plain.bootFill,spaceFoot:space.bootFill,
 leftHip:spacePantsFit(28.4591,125.881),rightHip:spacePantsFit(65.8486,125.059),
 sleeve:spaceSleeveMarkup(armGeometry('left',warp),'left-space-test')};
})()`,c);
assert.ok(Math.abs(fitting.leftHip.x-24.2)<.001&&Math.abs(fitting.rightHip.x-69.4)<.001,'Hip sides continue at belt width');
assert.notDeepEqual(fitting.plainHip,fitting.spaceHip,'Leg roots follow the fitted pelvis');
assert.equal(fitting.plainFoot,fitting.spaceFoot,'Fitting fades out before the shoes');
assert.match(fitting.sleeve,/mask="url\(#left-shoulder-mask\)"/,'Sleeve roots hide internal shoulder seams');
const footwear=vm.runInContext(`({normal:decorationStyleGroups.shoes.find(g=>g[0]==='shoes')})`,c);
assert.ok(footwear.normal[2].includes('orange-shoes'),'Orange shoes belong to the ordinary shoe style');
assert.ok(!fs.readFileSync(require('node:path').join(__dirname,'../svg/orange-shoes.svg'),'utf8').includes('#10C9E9'),'Orange shoes do not carry cyan cuffs');
assert.ok(fs.readFileSync(require('node:path').join(__dirname,'../svg/space-trousers.svg'),'utf8').includes('space-trouser-cuff'),'Cuff belongs to the trousers thumbnail');
const outerJoins=vm.runInContext(`(()=>{
 const rows=[];
 for(const side of ['left','right'])for(const distance of [45,65,90])for(const width of [60,100,150]){
  dragPoses.length=0;dragPoses.push(Object.assign(createDragPose(side+'Leg'),{x:(side==='left'?1:-1)*distance,y:-15}));
  const warp=buildWarp({body:100,width,arms:100,legs:100,head:100});
  rows.push({fill:spacePantsGeometry(warp,false).fill,anchors:['left','right'].map(s=>legGeometry(s,warp,true).outerAnchor)});
 }
 return rows;
})()`,c);
for(const {fill,anchors} of outerJoins){
 const values=fill.match(/-?\d+(?:\.\d+)?/g).map(Number);
 for(const anchor of anchors){let nearest=Infinity;for(let i=0;i<values.length;i+=2)nearest=Math.min(nearest,Math.hypot(values[i]-anchor.x,values[i+1]-anchor.y));assert.ok(nearest<.02,'Pelvis fill shares the actual moving outer hip endpoint');}
}
console.log('27 far-crossing/width cases keep both pelvis fill edges attached to the moving hip roots.');
const inwardLayers=vm.runInContext(`(()=>{
 selectedDecorations.pants='space-trousers';selectedDecorations.outerwear='space-shirt';
 const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100}),rows=[];
 for(const side of ['left','right'])for(const held of [false,true])for(const angle of [-15,0,5,10,25]){
  dragPoses.length=0;const sign=side==='left'?1:-1;
  const pose=Object.assign(createDragPose(side+'Leg'),{x:sign*40,y:-20});dragPoses.push(pose);activeDrag=held?{pose}:null;
  legInFront.left=legInFront.right=false;const radians=angle*Math.PI/180;
  const shape={hip:{x:0,y:0},knee:{x:sign*30*Math.cos(radians),y:-30*Math.sin(radians)},ankle:{x:sign*50,y:10},restLength:60};
  updateLegOcclusion({left:shape,right:shape},warp);rows.push({side,held,angle,front:legInFront[side]});
 }
 return rows;
})()`,c);
for(const row of inwardLayers)assert.equal(row.front,row.angle>=10,'Inward sweatpant thigh waits until above horizontal, held or released');
console.log('Sweatpants inward promotion waits until the thigh rises about 8 degrees above horizontal on both sides.');
const crotchMaskCases=vm.runInContext(`(()=>{
 const rows=[];selectedDecorations.pants='space-trousers';
 for(const side of ['left','right'])for(const direction of [0,1,-1]){
  dragPoses.length=0;if(direction)dragPoses.push(Object.assign(createDragPose(side+'Leg'),{x:(side==='left'?1:-1)*direction*65,y:-15}));
  const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  rows.push({direction,mask:spaceCrotchOccluders({left:legGeometry('left',warp),right:legGeometry('right',warp)},warp)});
 }
 return rows;
})()`,c);
for(const row of crotchMaskCases){assert.equal(!!row.mask,row.direction===1,'Only an inward crossing leg masks the pelvis line');assert.ok(!/NaN|Infinity|undefined/.test(row.mask));}
