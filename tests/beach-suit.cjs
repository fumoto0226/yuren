const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({setAttribute(){}}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],c);
const r=vm.runInContext(`(()=>{
 applyDecorationSelection('suit','beach-suit');const selected={...selectedDecorations},sleeveless=hasSleevelessOutfit(),paths=[];
 for(const size of [60,100,150])for(const part of ['head','leftHand','rightHand','leftLeg','rightLeg']){
  dragPoses.length=0;dragPoses.push(Object.assign(createDragPose(part),{x:30,y:50}));
  const warp=buildWarp({body:size,width:size,arms:size,legs:size,head:size});
  paths.push(shellTopMarkup(warp),seaweedPantsMarkup(warp));
 }
 const attrs={};const root={setAttribute(k,v){attrs[k]=v},removeAttribute(k){delete attrs[k]}};
 armInFront.left=true;applyArmOcclusion('left',root,{setAttribute(){},removeAttribute(){}});
 return {selected,sleeveless,paths,rootMask:attrs.mask};
})()`,c);
for(const [slot,id] of Object.entries({skin:'flesh-4',shirt:'shell-top',pants:'green-ultra-shorts',shoes:null,helmet:null}))assert.equal(r.selected[slot],id);
assert.ok(r.sleeveless);
assert.equal(r.rootMask,'url(#left-shoulder-mask)','Crossing bare shoulder keeps the internal root outline hidden');
for(const d of r.paths)assert.ok(!/NaN|Infinity|undefined/.test(d));
for(const file of ['beach-suit','shell-top','green-ultra-shorts'])assert.ok(fs.existsSync(path.join(__dirname,'../svg',file+'.svg')));
console.log('Beach suit: existing skin, two independent garments, barefoot, sleeveless and finite geometry across 15 size/pose cases.');
