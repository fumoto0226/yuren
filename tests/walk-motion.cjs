const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const inputs = ['body','width','arms','legs','head'].map(key => ({dataset:{control:key},value:'100'}));
const context = vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>inputs},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],context);
// Both directions are checked: the leftward walk is the rightward one
// mirrored, so anything that only works one way round shows up here.
const run = direction => vm.runInContext(source.replace('DIRECTION', String(direction)), context);
const source = `(() => {
  const direction = DIRECTION;
  const motion = createWalkMotion(direction, 2), longer = createWalkMotion(direction, 4);
  // Read the gait window off the motion itself, so retiming the step does not
  // silently move these checks onto the entry and exit ramps.
  const cycle = (longer.duration - motion.duration) / 2;
  const entry = motion.walkBlend[1][0], gaitEnd = motion.walkBlend[2][0];
  const warp = buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  const rest = ['left','right'].map(side => legGeometry(side,warp));
  let finite = true, forwardKnees = true;
  for (let i=0;i<=240;i++) {
    const t=motion.duration*i/240;
    applyMotionPose(motion,t);
    for (const side of ['left','right']) {
      const g=legGeometry(side,warp);
      finite &&= [g.hip,g.knee,g.ankle].every(p=>Number.isFinite(p.x+p.y));
      if(t>entry&&t<gaitEnd) {
        const cross=(g.ankle.y-g.hip.y)*(g.knee.x-g.hip.x)
          -(g.ankle.x-g.hip.x)*(g.knee.y-g.hip.y);
        forwardKnees &&= direction*cross>=-1e-6;
      }
    }
  }
  applyMotionPose(motion,motion.duration);
  const end=['left','right'].map(side=>legGeometry(side,warp));
  const restError=Math.max(...end.map((g,i)=>Math.hypot(g.ankle.x-rest[i].ankle.x,g.ankle.y-rest[i].ankle.y)));
  // Count real steps only: the entry and exit ramps scale the gait down, so
  // they leave sub-unit dips that are not steps.
  const turning=direction>0?'leftLeg':'rightLeg';
  const lifts=[turning,direction>0?'rightLeg':'leftLeg'].map(part=>motion.tracks[part].filter(
    (f,i,a)=>i>0&&i<a.length-1&&f[2]<a[i-1][2]&&f[2]<a[i+1][2]&&f[2]<-5).length);
  let cycleError=0;
  for(const track of Object.values(motion.tracks))for(let i=0;i<80;i++)for(let axis=1;axis<4;axis++){
    const a=sampleTrack(track,entry+.02+i/80*(cycle-.04),true)[axis-1];
    const b=sampleTrack(track,entry+.02+i/80*(cycle-.04)+cycle,true)[axis-1];
    cycleError=Math.max(cycleError,Math.abs(a-b));
  }
  // Foot travel relative to the hips, to catch a stride that shrinks back.
  let stride=0,maxLift=0,trail=0;
  for(let i=0;i<=120;i++){
    const t=entry+(gaitEnd-entry)*i/120;
    applyMotionPose(motion,t);
    const g=legGeometry(direction>0?'left':'right',warp);
    stride=Math.max(stride,direction*(g.ankle.x-g.hip.x));
    trail=Math.min(trail,direction*(g.ankle.x-g.hip.x));
    maxLift=Math.max(maxLift,(direction>0?rest[0]:rest[1]).ankle.y-g.ankle.y);
  }
  // The toe turn mirrors the shoe, so it must never be caught mid-turn with
  // the foot on the ground: that is where the shoe foreshortens to nothing.
  let turnOnGround=0,turnStart=0,turnEnd=0,turnedDuringWalk=1;
  for(let i=0;i<=600;i++){
    const t=motion.duration*i/600;
    applyMotionPose(motion,t);
    const pose=dragPoses.find(p=>p.part===turning);
    const turn=pose.toeTurn;
    // Mid-turn the shoe is strongly foreshortened; that must never happen
    // with the foot anywhere near the ground.
    if(turn>.2&&turn<.8&&pose.y>-6) turnOnGround++;
    if(t>entry+.8&&t<gaitEnd-.2) turnedDuringWalk=Math.min(turnedDuringWalk,turn);
  }
  applyMotionPose(motion,0);
  turnStart=dragPoses.find(p=>p.part===turning).toeTurn;
  applyMotionPose(motion,motion.duration);
  turnEnd=dragPoses.find(p=>p.part===turning).toeTurn;
  return {finite,forwardKnees,restError,lifts,cycleError,stride,maxLift,trail,
    turnOnGround,turnStart,turnEnd,turnedDuringWalk,
    extra:longer.duration-motion.duration,cycle};
})()`;
for (const direction of [1, -1]) {
const label = direction > 0 ? 'right' : 'left';
const results = run(direction);
assert.ok(results.finite,`${label}: walking geometry stays finite`);
assert.ok(results.forwardKnees,`${label}: both knees bend towards travel`);
assert.ok(results.restError<1e-8,`${label}: the final pose restores resting feet`);
assert.deepEqual(Array.from(results.lifts),[3,2],
  'Four steps: two foot lifts per leg, plus the left foot\'s lifted closing step');
assert.ok(results.cycleError<.001,`${label}: repeated gait samples join consistently`);
assert.ok(Math.abs(results.extra-2*results.cycle)<1e-8,`${label}: adding cycles extends only the walking section`);
assert.ok(results.stride-results.trail>40,
  `Each foot travels a full stride, not a shuffle (${(results.stride-results.trail).toFixed(1)})`);
assert.ok(results.maxLift>12,`The swinging foot clears the ground (${results.maxLift.toFixed(1)})`);
assert.equal(results.turnOnGround,0,`${label}: the foot is in the air whenever it is mid-turn`);
assert.equal(results.turnStart,0,`${label}: starts with the feet in their resting direction`);
assert.equal(results.turnEnd,0,`${label}: hands the feet back in their resting direction`);
assert.ok(results.turnedDuringWalk>.95,`${label}: both toes lead while walking`);
console.log(`Walking ${label}: stride ${results.stride.toFixed(1)} forward, `
  + `${results.trail.toFixed(1)} behind, lift ${results.maxLift.toFixed(1)}.`);
}
console.log('Walking both ways: four alternating steps, knees towards travel, both toes leading, repeatable gait and an exact resting finish.');
