const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const inputs=['body','width','arms','legs','head'].map(key=>({dataset:{control:key},value:100}));
const context=vm.createContext({document:{querySelector:()=>({setAttribute(){}}),querySelectorAll:()=>inputs},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],context);
const r=vm.runInContext(`(()=>{
 applyDecorationSelection('suit','kappa-suit');const suit={...selectedDecorations};
 const hairHidesTriangle=hornHidden();
 const mouthBelongsToSkin=kappaSkinSpecs.some(s=>s.fill==='#E5E287')&&!kappaHairSpecs.some(s=>s.fill==='#E5E287');
 applyDecorationSelection('helmet',null);const bare={...selectedDecorations};
 const color=skinColor(),eye=skinTrait('eyeWhite'),pupil=skinTrait('pupil');
 const paths=[];
 for(const size of [60,100,150])for(const part of ['head','leftLeg','rightHand']){
  const warp=buildWarp({body:size,width:size,arms:size,legs:size,head:size});
  dragPoses.length=0;dragPoses.push(Object.assign(createDragPose(part),{x:35,y:-55}));
  for(const s of [...kappaHairSpecs,...kappaSkinSpecs])paths.push(transformPath(s.source,(x,y)=>applyDragPose(warp(x,y,s.role),x,y,s.role,warp)));
 }
 return {suit,bare,color,eye,pupil,paths,hairHidesTriangle,mouthBelongsToSkin,shell:ivorySpecs.kappaShell,sources:[...kappaHairSpecs,...kappaSkinSpecs].map(s=>s.source)};
})()`,context);
assert.equal(r.suit.cape,'kappa-shell');assert.ok(r.hairHidesTriangle);assert.ok(r.mouthBelongsToSkin);assert.equal(r.shell.category,'cape');
assert.equal(r.suit.skin,'kappa');assert.equal(r.suit.helmet,'kappa-hair');
assert.equal(r.bare.skin,'kappa');assert.equal(r.bare.helmet,null);assert.equal(r.color,'#89CD71');
assert.equal(r.pupil.dx,-2.2119);assert.ok(r.eye.startsWith('M'));
for(const d of r.sources)assert.ok(!/[HV]/.test(d),'Imported horizontal/vertical commands must be normalized');
for(const d of r.paths){assert.ok(!/NaN|Infinity/.test(d));assert.ok(d.length>10);}
for(const file of ['kappa','kappa-hair','kappa-suit','kappa-shell'])assert.ok(fs.existsSync(require('node:path').join(__dirname,'../svg',file+'.svg')));
console.log('Kappa skin/hair are independent, suit uses both, source paths stay finite through sizes and poses.');
