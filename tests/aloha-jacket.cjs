const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>['body','width','arms','legs','head'].map(key=>({dataset:{control:key},value:'100'}))},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],context);
const result=vm.runInContext(`(()=>{
 let bad=0,poses=0;
 for(const style of Object.values(alohaSleeveStyles))for(const size of [65,100,140])for(const side of ['left','right']){
  const warp=buildWarp({body:100,width:size,arms:size,legs:100,head:100});
  for(let x=-70;x<=70;x+=14)for(let y=-100;y<=30;y+=13){
   dragPoses.length=0;dragPoses.push(Object.assign(createDragPose(side+'Hand'),{x,y}));
   const markup=alohaSleeveMarkup(armGeometry(side,warp),'test',style);
   if(/NaN|Infinity/.test(markup))throw Error('Invalid geometry');
   const cuff=cuffPath(armGeometry(side,warp),style.end,style.flare);
   if(!markup.includes(cuff))bad++;
   if(markup.includes('stroke="#bdc0bd"'))bad++;
   // Any uncut earlier hose segment can form a round blue lobe beyond the
   // cuff in a folded pose, even when the final seven segments are clipped.
   const cloth=[...markup.matchAll(/<path [^>]+stroke-width="[^"]+"[^>]*>/g)].slice(0,-1);
   if(cloth.some(match=>!match[0].includes('clip-path="url(#test)"')))bad++;
   poses++;
  }
 }
 selectedDecorations.shirt='plain';applyDecorationSelection('outerwear','aloha-jacket');
 applyDecorationSelection('outerwear','aloha-long-jacket');
 const longSelected=selectedDecorations.outerwear;
 applyDecorationSelection('outerwear','aloha-jacket');
 return {bad,poses,longSelected,inner:selectedDecorations.shirt,outer:selectedDecorations.outerwear};
})()`,context);
assert.equal(result.bad,0,'Every cloth stroke must stop at the cuff, including early round segments');
assert.equal(result.longSelected,'aloha-long-jacket');
assert.equal(result.inner,'plain');assert.equal(result.outer,'aloha-jacket');
console.log(`${result.poses} short/long sleeve poses: finite geometry and shared cuff; independent outerwear selection passed.`);
