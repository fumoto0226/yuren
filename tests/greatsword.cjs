const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const inputs=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>inputs},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],c);
const r=vm.runInContext(`(()=>{
 applyDecorationSelection('cape','greatsword');const selected=selectedDecorations.cape,paths=[],lengths=[];
 for(const size of [60,100,150])for(const part of ['body','head','leftLeg','rightHand']){
  dragPoses.length=0;dragPoses.push(Object.assign(createDragPose(part),{x:30,y:45}));
  const warp=buildWarp({body:size,width:size,arms:100,legs:size,head:100});
  paths.push(...[...greatswordParts,...dualSwordParts].map(s=>backAccessoryPath(s,warp)));
  for(const id of ['greatsword','dual-swords']){
   const d=backAccessoryPath({id,source:'M0 0L0 100'},warp).match(/-?[0-9.]+/g).map(Number);
   lengths.push(Math.hypot(d[2]-d[0],d[3]-d[1]));
  }
 }
 return {selected,paths,lengths,group:decorationStyleGroups.cape.find(g=>g[0]==='greatsword')[2]};
})()`,c);
assert.equal(r.selected,'greatsword');assert.deepEqual([...r.group],['greatsword']);
for(const d of r.paths)assert.ok(d&&!/NaN|Infinity|undefined/.test(d));
for(const length of r.lengths)assert.ok(Math.abs(length-100)<.01,'Sword stays rigid during resizing and poses');
console.log('Greatsword and dual swords: finite rigid geometry across 12 body sizes/poses.');
