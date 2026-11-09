const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const inputs=['body','width','arms','legs','head'].map(key=>({dataset:{control:key},value:'100'}));
const context=vm.createContext({document:{querySelector:()=>({setAttribute(){}}),querySelectorAll:()=>inputs},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],context);
const result=vm.runInContext(`(()=>{
 let cases=0;
 for(const legs of [50,100,180])for(const crouch of [0,42]){
  dragPoses.length=0;
  if(crouch)dragPoses.push(Object.assign(createDragPose('head'),{x:0,y:crouch}));
  const warp=buildWarp({body:100,width:100,arms:100,legs,head:100});
  const before=capePath(ivorySpecs.capeCloth.source,warp);
  const hemBefore=capePath('M47 180',warp);
  const ys=before.match(/-?\\d+(?:\\.\\d+)?/g).map(Number).filter((_,i)=>i%2);
  if(Math.max(...ys)>warp(47,190,'legs').y)throw Error('Cape trails below the feet');
  dragPoses.push(Object.assign(createDragPose('leftLeg'),{x:50,y:-40}));
  if(hemBefore===capePath('M47 180',warp))throw Error('Cape hem must sway with leg movement');
  for(const side of ['left','right']){
   // The king wears the ordinary tall boots now, so it is their geometry
   // that has to stay finite under every leg length and crouch.
   const shoe=legGeometry(side,warp);
   if(/NaN|Infinity/.test(shoe.bootFill))throw Error('Invalid boot geometry');
  }
  cases++;
 }
 return cases;
})()`,context);
assert.equal(result,6);
console.log('Cape stays above the feet across leg lengths and crouching, sways with leg drags; both boots remain finite.');

vm.runInContext(`(()=>{
 const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
 const motion=motionLibrary.find(m=>m.id==='walk-right');
 const loop=motion.loops[0],samples=[];
 for(let i=0;i<12;i++){
  const t=loop.start+i*loop.cycle/12;
  applyMotionPose(motion,t);const a=capePath('M47 180',warp);
  applyMotionPose(motion,t+loop.cycle);const b=capePath('M47 180',warp);
  const ax=Number(a.slice(1).trim().split(' ')[0]),bx=Number(b.slice(1).trim().split(' ')[0]);
  if(Math.abs(ax-bx)>.15)throw Error('Cape breaks walk periodicity');
  samples.push(ax);
 }
 if(Math.max(...samples)-Math.min(...samples)<2)throw Error('Walking cape is fixed');
})()`,context);
console.log('Cape swings during walking and repeats with the walk cycle.');
vm.runInContext(`(()=>{
 const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
 for(const side of ['left','right']){
  dragPoses.length=0;
  const pose=Object.assign(createDragPose(side+'Leg'),{x:15,y:-12,toeTurn:.499});
  dragPoses.push(pose);
  const numbers=d=>d.match(/-?\\d+(?:\\.\\d+)?/g).map(Number);
  const before=numbers(legGeometry(side,warp).bootOutline);
  pose.toeTurn=.501;
  const after=numbers(legGeometry(side,warp).bootOutline);
  if(before.length!==after.length||before.some((v,i)=>Math.abs(v-after[i])>.5))
   throw Error('Boot jumps when its toe turns through the midline');
 }
})()`,context);
console.log('Boots turn continuously through the walking mirror on both sides.');

const merged=JSON.parse(vm.runInContext(`JSON.stringify((()=>{
 applyDecorationSelection('suit','ivory-suit');
 const suitNeck=selectedDecorations.neck;
 applyDecorationSelection('neck','scarf');
 applyDecorationSelection('shirt','ivory-tunic');
 const scarfKept=selectedDecorations.neck==='scarf';
 const collar=['silverCollar','silverInner','silverOutline'].map(key=>ivorySpecs[key]);
 const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
 return {suitNeck,scarfKept,collar,collarPaths:collar.map(spec=>torsoGarmentPath(spec.source,warp,true)),catalogHasCollar:decorationCatalog.neck.some(item=>item.id==='silver-collar')};
})())`,context));
assert.equal(merged.suitNeck,null,'White/gold king outfit no longer occupies the neck slot');
assert.equal(merged.scarfKept,true,'The built-in collar allows an independent scarf');
assert.equal(merged.catalogHasCollar,false,'The gold collar is no longer a separate accessory');
for(const spec of merged.collar){assert.equal(spec.category,'shirt');assert.equal(spec.id,'ivory-tunic');assert.equal(spec.neckline,true,'Built-in collar keeps its head/neck mapping');}
const top=fs.readFileSync(require('node:path').join(__dirname,'../svg/ivory-tunic.svg'),'utf8');
for(const d of merged.collarPaths)assert.ok(top.includes(d),'Tunic thumbnail includes the attached collar');
assert.equal(fs.existsSync(require('node:path').join(__dirname,'../svg/silver-collar.svg')),false);
console.log('Ivory tunic includes all three gold collar pieces in its thumbnail and garment definition, leaves the neck slot free and preserves independent scarves.');
