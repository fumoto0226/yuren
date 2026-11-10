const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({setAttribute(){}}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1});
vm.runInContext(fs.readFileSync('script.js','utf8').split('resetButton.addEventListener')[0],c);
const rows=vm.runInContext(`(()=>{const rows=[];
 for(const pants of ['ninja-sweatpants','walker-sweatpants','plain','white-loose-wide-trousers','student-shorts'])for(const length of [40,50,60,80,100])for(const side of ['left','right'])for(const [x,y] of [[0,0],[30,-15],[45,-35],[-25,-20]]){
  selectedDecorations.pants=pants;controls.legs.value=length;dragPoses.length=0;
  if(x||y)dragPoses.push(Object.assign(createDragPose(side+'Leg'),{x:side==='left'?-x:x,y}));
  const w=buildWarp({body:100,width:100,arms:100,legs:length,head:100}),g=legGeometry(side,w),flare=widePantFlares[pants]||kneeShortFlares[pants]||0;
  const radius=hipContourMaskRadius(g,flare),old=Math.min(g.restLength*.36,18);
  rows.push({radius,old,length,bare:hipContourMaskRadius(g,flare,false),ink:g.centerline.slice(0,6).map((p,i)=>Math.hypot(p.x-g.hip.x,p.y-g.hip.y)+(g.hose[i].width+2+wideLegExtraWidth(i,flare))/2)});
 }return rows;})()`,c);
for(const row of rows){assert.ok(Number.isFinite(row.radius));assert.ok(row.ink.every(ink=>ink<=row.radius+.00001),'Mask covers actual wide proximal ink at every short-leg drag');assert.equal(row.bare,row.old,'Bare-leg masking is preserved');}
assert.ok(rows.some(row=>row.length<=60&&row.radius>row.old+2),'Short clothed legs expand the old length-only mask');
console.log(rows.length+' pants/leg-length/side/drag cases hide proximal contour ink inside the torso while preserving bare-leg masks.');
