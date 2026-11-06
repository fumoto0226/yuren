const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],c);
const r=vm.runInContext(`(()=>{
 selectedDecorations.skin='little-yellow-fish';selectedDecorations.helmet=null;
 const color=skinColor(),outline=skinHeadContour(),originalBeakHidden=hornHidden(),poses=[];
 for(const head of [60,100,150])for(const mouth of [-1,0,1]){
  dragPoses.length=0;dragPoses.push({part:'head',x:20,y:-10,angle:0,mouth});
  const warp=buildWarp({body:100,width:100,arms:100,legs:100,head});
  poses.push(transformPath(outline,(x,y)=>applyDragPose(warp(x,y,'head'),x,y,'head',warp)));
  const root=warp(67.7,49.9,'head');
  const collar=transformPath('M67.7 49.9',(x,y)=>warp(x,y,'head'));
  if(!collar.includes(String(clean(root.x))))throw Error('Collar and fin root must use the same head coordinates');
 }
 selectedDecorations.helmet='crown';const covered=skinHeadContour();
 selectedDecorations.helmet='party-hat';const replaced=skinHeadContour();
 selectedDecorations.helmet='shark-hood';const hood=skinHeadContour();
 selectedDecorations.helmet=null;selectedDecorations.skin=null;const restored=skinHeadContour();
 return {color,outline,originalBeakHidden,poses,covered,replaced,hood,restored};
})()`,c);
assert.equal(r.color,'#FFEE00');assert.ok(r.originalBeakHidden);assert.ok(r.outline.includes('L67.7 49.9'),'Lowest fin root must meet the upper turtleneck corner');
assert.equal((r.outline.match(/L/g)||[]).length,7,'The head retains three fin tips in one outer contour');
for(const d of r.poses)assert.ok(!/NaN|Infinity/.test(d));
for(const key of ['covered','replaced','hood','restored'])assert.equal(r[key],undefined);
console.log('Little yellow fish: one seamless head/three-tip fin outline, raised lower root at the collar, finite talking/size poses and normal hat/skin restoration.');
