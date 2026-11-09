const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],c);
const rows=JSON.parse(vm.runInContext(`JSON.stringify((()=>{
 const node=()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v;}});
 const boots=['brown-boots','dark-boots','batfish-boots',...Object.keys(bootProfiles)],rows=[];
 for(const pants of ['student-shorts','green-ultra-shorts'])for(const shoes of boots)for(const side of ['left','right'])for(const legs of [50,100,180])for(const pose of [null,['body',0,40],[side+'Leg',side==='left'?-35:35,-75],[side+'Leg',side==='left'?45:-45,-45]]){
  selectedDecorations.pants=pants;selectedDecorations.shoes=shoes;
  dragPoses.length=0;if(pose)dragPoses.push(Object.assign(createDragPose(pose[0]),{x:pose[1],y:pose[2]}));
  const shape=legGeometry(side,buildWarp({body:100,width:100,arms:100,legs,head:100}));
  const segments=Array.from({length:32},()=>({back:node(),front:node()}));
  segments.slice(19).forEach(({back,front})=>{back.attrs['clip-path']=front.attrs['clip-path']='boot-original';});
  const ultraShortsClip=node(),exposedThighClip=node();exposedThighClip.ownerClip=node();
  const end=shortsHemIndex();
  updateShortsBootPartition({side,segments,ultraShortsClip,exposedThighClip},shape,end);
  rows.push({pants,shoes,side,legs,end,
   points:ultraShortsClip.attrs.points+' '+exposedThighClip.attrs.points,
   bootBound:exposedThighClip.ownerClip.attrs['clip-path'],
   sharedEdge:ultraShortsClip.attrs.points.split(' ').slice(0,4).join(' ')===exposedThighClip.attrs.points.split(' ').slice(0,4).join(' '),
   cloth:segments.slice(end-6,end).every(({back,front})=>[back,front].every(n=>n.attrs['clip-path']==='url(#'+side+'-ultra-shorts-hem-clip)')),
   skin:segments.slice(end,19).every(({back,front})=>[back,front].every(n=>n.attrs['clip-path']==='url(#'+side+'-exposed-thigh-hem-clip)')),
   flat:segments.slice(end-3,end+5).every(({back,front})=>[back,front].every(n=>n.attrs['stroke-linecap']==='butt')),
   bootUnchanged:segments.slice(19).every(({back,front})=>[back,front].every(n=>n.attrs['clip-path']==='boot-original'))});
 }
 return rows;
})())`,c));
for(const row of rows){
 const label=`${row.pants}/${row.shoes}/${row.side}/${row.legs}`;
 assert.ok(!/NaN|Infinity|undefined/.test(row.points),label+' finite seam geometry');
 assert.ok(row.sharedEdge&&row.cloth&&row.skin&&row.flat,label+' shorts and skin share a flat shorts opening');
 assert.equal(row.bootBound,`url(#${row.side}-shorts-hem-clip)`,label+' exposed thigh also ends at boot top');
 assert.ok(row.bootUnchanged,label+' boot shaft keeps its original rendering');
}
console.log(`${rows.length} ultra-shorts/boot/side/leg-length/pose combinations preserve distinct shorts and boot boundaries with no skin round cap over the shorts.`);
