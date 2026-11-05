const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const inputs = ['body','width','arms','legs','head'].map(key => ({dataset:{control:key},value:'100'}));
const context = vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>inputs},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],context);
// Compare the imported gait against Sea Game's published worker keyframes.
const result=vm.runInContext(`(()=>{
 let maxError=0,poses=0;
 for(const direction of [-1,1]){
  const motion=createWalkMotion(direction,2),loop=motion.loops[0];
  if(motion.walkBlend||motion.walkToe)throw Error('Old knee/toe corrections remain');
  for(const track of Object.values(motion.tracks)){
   if(track[0].slice(1).some(v=>Math.abs(v)>1e-8)||track.at(-1).slice(1).some(v=>Math.abs(v)>1e-8))throw Error('Not resting at endpoints');
  }
  for(let i=0;i<108;i++){
   const phase=i/120,t=loop.start+phase;
   for(const [part,track] of Object.entries(seaGameWalkCycle.tracks)){
    const expected=sampleTrack(track,direction<0?phase:.9-phase,true);
    const actual=sampleTrack(motion.tracks[part],t,false);
    expected.forEach((v,j)=>maxError=Math.max(maxError,Math.abs(v-actual[j])));
   }
   dragPoses.length=0;applyMotionPose(motion,t);
   const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
   for(const side of ['left','right']){
    const g=legGeometry(side,warp);
    if([g.hip,g.knee,g.ankle].some(p=>!Number.isFinite(p.x+p.y)))throw Error('Invalid leg');
   }
   poses++;
  }
 }
 return {maxError,poses};
})()`,context);
assert.ok(result.maxError<1e-7,`Imported gait differs: ${result.maxError}`);
console.log(`${result.poses} walking poses match Sea Game; both directions are finite and return to rest.`);
