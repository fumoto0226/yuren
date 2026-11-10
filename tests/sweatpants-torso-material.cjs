const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({setAttribute(){}}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1});
vm.runInContext(fs.readFileSync('script.js','utf8').split('resetButton.addEventListener')[0],c);
const rows=vm.runInContext(`(()=>{
 const node=()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v;}}),rows=[];
 torsoMaterial={gradient:node(),upper:[node(),node()],lower:[node(),node()]};
 for(const id of decorationStyleGroups.pants.find(g=>g[0]==='space')[2])for(const skin of ['monkey','flesh-3',null])for(const size of [60,100,150])for(const depth of [0,20,35,45,55,70]){
  selectedDecorations.skin=skin;selectedDecorations.pants=id;
  dragPoses.length=0;if(depth)dragPoses.push(Object.assign(createDragPose('body'),{x:0,y:depth}));
  const w=buildWarp({body:100,width:size,arms:100,legs:size,head:100}),body=node();
  updateTorsoMaterial(body,w);rows.push({id,depth,fill:body.attrs.fill,expected:widePantsPaint(),lower:torsoMaterial.lower.map(n=>n.attrs['stop-color']),gradient:Object.values(torsoMaterial.gradient.attrs)});
 }
 return rows;
})()`,c);
for(const r of rows){assert.equal(r.fill,'url(#torso-material)','Every sweatpant variant colors the exposed pelvis underlay');for(const color of r.lower)assert.equal(color,r.expected,'Pelvis joins always use the same cloth color as the legs');assert.ok(r.gradient.every(Number.isFinite));}
console.log(rows.length+' sweatpant/skin/size/squat combinations preserve matching pelvis underpaint, including walker orange and white sweatpants.');
