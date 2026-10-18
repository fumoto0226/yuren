const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const inputs = ['body','width','arms','legs','head'].map(key => ({dataset:{control:key},value:'100'}));
const context = vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>inputs},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],context);
const results = vm.runInContext(`(() => {
  const motion = createWalkRightMotion(2), longer = createWalkRightMotion(4);
  const warp = buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  const rest = ['left','right'].map(side => legGeometry(side,warp));
  let finite = true, forwardKnees = true;
  for (let i=0;i<=240;i++) {
    const t=motion.duration*i/240;
    applyMotionPose(motion,t);
    for (const side of ['left','right']) {
      const g=legGeometry(side,warp);
      finite &&= [g.hip,g.knee,g.ankle].every(p=>Number.isFinite(p.x+p.y));
      if(t>.32&&t<2.96) {
        const cross=(g.ankle.y-g.hip.y)*(g.knee.x-g.hip.x)
          -(g.ankle.x-g.hip.x)*(g.knee.y-g.hip.y);
        forwardKnees &&= cross>=-1e-6;
      }
    }
  }
  applyMotionPose(motion,motion.duration);
  const end=['left','right'].map(side=>legGeometry(side,warp));
  const restError=Math.max(...end.map((g,i)=>Math.hypot(g.ankle.x-rest[i].ankle.x,g.ankle.y-rest[i].ankle.y)));
  const lifts=['leftLeg','rightLeg'].map(part=>motion.tracks[part].filter((f,i,a)=>i>0&&i<a.length-1&&f[2]<a[i-1][2]&&f[2]<a[i+1][2]).length);
  let cycleError=0;
  for(const track of Object.values(motion.tracks))for(let i=0;i<80;i++)for(let axis=1;axis<4;axis++){
    const a=sampleTrack(track,.34+i/80*1.28,true)[axis-1];
    const b=sampleTrack(track,.34+i/80*1.28+1.32,true)[axis-1];
    cycleError=Math.max(cycleError,Math.abs(a-b));
  }
  return {finite,forwardKnees,restError,lifts,cycleError,extra:longer.duration-motion.duration};
})()`,context);
assert.ok(results.finite,'Walking geometry stays finite');
assert.ok(results.forwardKnees,'Both knees bend towards rightward travel');
assert.ok(results.restError<1e-8,'The final pose restores resting feet');
assert.deepEqual(Array.from(results.lifts),[2,2],'Four steps: two foot lifts per leg');
assert.ok(results.cycleError<.001,'Repeated gait samples join consistently');
assert.ok(Math.abs(results.extra-2.64)<1e-8,'Adding cycles extends only the walking section');
console.log('Walking: four alternating steps, forward knees, repeatable gait, finite geometry and exact resting finish.');
