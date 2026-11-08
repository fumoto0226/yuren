const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],c);
const rows=vm.runInContext(`(()=>{
 const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100}),rows=[];
 torsoMaterial={gradient:{setAttribute(){}},lower:[{setAttribute(k,v){this.color=v;}}]};
 for(const skin of [null,'flesh-6'])for(const [kind,variants] of Object.entries({briefs:briefVariants,boxers:boxerVariants,thong:thongVariants}))for(const [id,item] of Object.entries(variants)){
  selectedDecorations.skin=skin;selectedDecorations.pants=id;
  const node={setAttribute(k,v){this[k]=v;}};updateTorsoMaterial(node,warp);
  rows.push({id,kind,paint:node.fill,skin:skinColor(),color:item.color,lower:torsoMaterial.lower[0].color});
 }
 return rows;
})()`,c);
for(const r of rows){
 if(r.kind==='boxers'){assert.equal(r.paint,'url(#torso-material)');assert.equal(r.lower,r.color);}
 else assert.equal(r.paint,r.skin,r.id+' keeps the torso skin-colored outside its garment path');
}
console.log(rows.length+' underwear/color/skin combinations preserve triangular and thong silhouettes without rectangular torso tint.');
