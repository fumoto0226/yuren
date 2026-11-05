const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const inputs=['body','width','arms','legs','head'].map(key=>({dataset:{control:key},value:'100'}));
const context=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>inputs},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],context);
const error=vm.runInContext(`(()=>{
 let error=0;
 for(const legs of [50,100,180])for(const pose of [null,['head',0,42],['head',18,35],['leftLeg',45,-45],['rightLeg',-45,-45]]){
  dragPoses.length=0;if(pose)dragPoses.push(Object.assign(createDragPose(pose[0]),{x:pose[1],y:pose[2]}));
  const warp=buildWarp({body:100,width:100,arms:100,legs,head:100});
  for(const side of ['left','right']){
   const shape=legGeometry(side,warp);
   const n=shape.bootOutline.match(/-?\\d+(?:\\.\\d+)?/g).map(Number);
   const curve=Array.from({length:4},(_,i)=>({x:n[2*i],y:n[2*i+1]}));
   const weights=[.343,.441,.189,.027];
   const actual={x:curve.reduce((sum,p,i)=>sum+p.x*weights[i],0),y:curve.reduce((sum,p,i)=>sum+p.y*weights[i],0)};
   error=Math.max(error,Math.hypot(actual.x-shape.instep.x,actual.y-shape.instep.y));
   if(/NaN|Infinity/.test(royalBucklePath(shape)))throw Error('Invalid buckle');
  }
 }
 return error;
})()`,context);
assert.ok(error<.001,`Buckle must follow the rendered vamp, error ${error}`);
console.log('Buckle follows the rendered shoe surface across leg lengths, raised legs, leaning and crouching.');
