const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({setAttribute(){}}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],c);
const r=vm.runInContext(`(()=>{
 applyDecorationSelection('suit','student-suit');const selected={...selectedDecorations};
 const socks=[];for(const pants of [null,'student-shorts','pink-shorts','extra-wide-shorts','plain','wide-pants','jobs-gradient-jeans','worker-trousers','jumpsuit','denim-jumpsuit'])for(const i of [19,23,24,31])socks.push({pants,i,show:studentSockVisible(i,pants,'student-shoes')});
 const paths=[];for(const size of [60,100,150])for(const part of ['head','leftHand','rightHand','leftLeg']){
  dragPoses.length=0;dragPoses.push(Object.assign(createDragPose(part),{x:35,y:part==='head'?40:-60}));
  const warp=buildWarp({body:100,width:size,arms:size,legs:size,head:100});
  paths.push(studentOuterMarkup(warp));
  for(const side of ['left','right'])paths.push(alohaSleeveMarkup(armGeometry(side,warp),side+'-student-test',alohaSleeveStyles['student-jacket']));
 }
 return {selected,socks,paths,color:skinColor(),group:decorationStyleGroups.pants.find(g=>g[0]==='slight-wide-ultra-shorts')[2],shortEnd:shortsHemIndex('student-shorts'),newFlare:kneeShortFlares['student-shorts'],collars:studentCollars};
})()`,c);
assert.equal(r.selected.skin,'flesh-4');assert.equal(r.selected.outerwear,'student-jacket');assert.equal(r.selected.shirt,null);assert.equal(r.selected.pants,'student-shorts');assert.equal(r.selected.shoes,'student-long-socks-shoes');assert.equal(r.selected.helmet,'student-hat');assert.equal(r.color,'#ffc1bf');assert.ok(r.group.includes('student-shorts'));assert.equal(r.newFlare,3);assert.equal(r.shortEnd,11,'Micro-wide ultra shorts end well above the knee, so a folded calf never reaches their hem');
for(const s of r.socks)assert.equal(s.show,[null,'student-shorts','pink-shorts','extra-wide-shorts'].includes(s.pants)&&s.i>=24,'Long pants must cover the leg-based sock');
for(const p of r.paths)assert.ok(!/NaN|Infinity/.test(p));
const nums=r.collars.map(d=>d.match(/-?\d+(?:\.\d+)?/g).map(Number));for(let i=0;i<nums[0].length;i++)assert.ok(Math.abs(nums[1][i]-(i%2?nums[0][i]:94-nums[0][i]))<.001);
console.log('Student suit: outerwear slot, five individual pieces, micro-wide ultra-short cut, symmetric small collar, and calf socks hidden by long pants.');
const partition=vm.runInContext(`(()=>{
 let moves=0;
 const group=()=>({children:[],appendChild(node){this.insertBefore(node,null);},insertBefore(node,anchor){moves++;if(node.parentNode){const old=node.parentNode.children;old.splice(old.indexOf(node),1);}const i=anchor?this.children.indexOf(anchor):-1;this.children.splice(i<0?this.children.length:i,0,node);node.parentNode=this;}});
 const parts={rootBlack:group(),thighBlack:group(),shinBlack:group(),thighSkin:group(),shinSkin:group(),segments:[]};
 for(let i=0;i<32;i++){const back={index:i},front={index:i};parts.segments.push({back,front});(i<3?parts.rootBlack:i<19?parts.thighBlack:parts.shinBlack).appendChild(back);(i<19?parts.thighSkin:parts.shinSkin).appendChild(front);}
 parts.shinSkin.appendChild({detail:true});
 const snapshots=[];
 for(const end of [14,19,14]){updateLegClothPartition(parts,end);const before=moves;updateLegClothPartition(parts,end);snapshots.push({end,fronts:parts.shinSkin.children.filter(n=>!n.detail).map(n=>n.index),cached:moves===before,detailLast:!!parts.shinSkin.children.at(-1).detail});}
 return snapshots;
})()`,c);
for(const p of partition){assert.deepEqual([...p.fronts],Array.from({length:32-p.end},(_,i)=>i+p.end),'Bare thigh fill must precede sock fill after every cut switch');assert.ok(p.cached,'Unchanged partition must not reorder DOM every frame');assert.ok(p.detailLast,'Fabric/detail nodes stay after native fill strokes');}
console.log('Ultra-short/regular switching preserves ordered leg fills; skin cannot be appended after socks and unchanged frames do no DOM reordering.');

const sockVariants=vm.runInContext(`({short:studentSockStart('student-shoes'),long:studentSockStart('student-long-socks-shoes'),belowKnee:studentSockStart('student-long-socks-shoes')>19,longVisible:studentSockVisible(22,'student-shorts','student-long-socks-shoes'),hidden:studentSockVisible(22,'plain','student-long-socks-shoes'),shortInSuits:decorationCatalog.suit.some(s=>s.pieces?.shoes==='student-shoes')})`,c);
assert.equal(sockVariants.short,24);assert.equal(sockVariants.long,20);assert.ok(sockVariants.belowKnee&&sockVariants.longVisible);assert.equal(sockVariants.hidden,false);assert.equal(sockVariants.shortInSuits,false);

const shoeGroups=vm.runInContext("decorationStyleGroups.shoes",c);
assert.ok(shoeGroups.some(([key,name,ids])=>name==='短袜鞋'&&ids.length===1&&ids[0]==='student-shoes'));
assert.ok(shoeGroups.some(([key,name,ids])=>name==='长袜鞋'&&ids.length===3&&ids[0]==='student-long-socks-shoes'));

const stripes=vm.runInContext(`(()=>{const results=[];for(const shoes of ['tricolor-long-socks-shoes','striped-long-socks-shoes'])for(const size of [60,100,150])for(const side of ['left','right']){const w=buildWarp({body:size,width:size,arms:size,legs:size,head:size});results.push({shoes,d:sockStripeMarkup(legGeometry(side,w),shoes),visible:studentSockVisible(20,null,shoes),hidden:studentSockVisible(20,'plain',shoes)});}return results;})()`,c);
for(const r of stripes){assert.ok(r.visible&&!r.hidden);assert.ok(!/NaN|Infinity|undefined/.test(r.d));assert.equal((r.d.match(/<path /g)||[]).length,r.shoes==='tricolor-long-socks-shoes'?3:6);}
console.log('Both striped long socks share the long-sock cut, finite live geometry and trouser occlusion.');
