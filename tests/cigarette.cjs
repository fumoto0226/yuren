const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const controls=['body','width','arms','legs','head'].map(key=>({dataset:{control:key},value:'100'}));
const context=vm.createContext({document:{querySelector:()=>({setAttribute(){}}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],context);
const result=vm.runInContext(`(()=>{
 selectedDecorations.neck='cigarette';
 return [70,100,140].map(head=>{
  const poses=[-1,0,1].map(mouth=>{
   dragPoses.length=0;dragPoses.push({part:'head',x:0,y:0,angle:0,mouth});
   const warp=buildWarp({body:100,width:100,arms:100,legs:100,head});
   return {visible:cigaretteVisible(),anchor:warp(...JAW.corner,'cigarette'),headAnchor:warp(...JAW.corner,'headRigid'),tip:warp(cigaretteTip.x,cigaretteTip.y,'cigarette'),lip:warp(...JAW.spike,'head')};
  });return poses;
 });
})()`,context);
for(const poses of result){
 const shut=poses[0],dx=shut.tip.x-shut.anchor.x,dy=shut.tip.y-shut.anchor.y;
 const lx=shut.lip.x-shut.anchor.x,ly=shut.lip.y-shut.anchor.y;
 assert.ok(Math.abs(dx*ly-dy*lx)/Math.hypot(dx,dy)/Math.hypot(lx,ly)<1e-6,'Closed cigarette must align with the actual lip seam');

 assert.equal(poses[0].visible,true);assert.equal(poses[1].visible,true);assert.equal(poses[2].visible,true);
 for(const pose of poses){assert.ok(Math.hypot(pose.anchor.x-pose.headAnchor.x,pose.anchor.y-pose.headAnchor.y)<1e-6);assert.ok(Number.isFinite(pose.tip.x+pose.tip.y));}
 assert.ok(Math.hypot(poses[1].tip.x-poses[2].tip.x,poses[1].tip.y-poses[2].tip.y)>1);
}
console.log('Cigarette: anchored mouth rotation across head sizes; visible at rest/open, still visible when shut.');

const placement=JSON.parse(vm.runInContext(`JSON.stringify((()=>{
 const node={style:{}};cigarettePaths=[node];
 applyDecorationSelection('helmet','crown');
 applyDecorationSelection('neck','cigarette');update();
 const withHat=selectedDecorations.helmet==='crown'&&node.style.display==='';
 applyDecorationSelection('helmet','yellow-hat');update();
 const hatChangeKeeps=selectedDecorations.neck==='cigarette'&&node.style.display==='';
 applyDecorationSelection('neck','scarf');update();
 const scarfReplaces=selectedDecorations.helmet==='yellow-hat'&&node.style.display==='none';
 applyDecorationSelection('neck','cigarette');update();
 applyDecorationSelection('neck',null);update();
 return {withHat,hatChangeKeeps,scarfReplaces,cleared:node.style.display==='none',inNeck:decorationCatalog.neck.some(item=>item.id==='cigarette'),inHelmet:decorationCatalog.helmet.some(item=>item.id==='cigarette'),helmetStyle:decorationStyleGroups.helmet.some(group=>group[2].includes('cigarette'))};
})())`,context));
for(const key of ['withHat','hatChangeKeeps','scarfReplaces','cleared','inNeck'])assert.equal(placement[key],true,key);
assert.equal(placement.inHelmet,false);assert.equal(placement.helmetStyle,false);
console.log('Cigarette belongs to neckwear, stays visible across hat changes, and can be replaced by a scarf or removed.');
