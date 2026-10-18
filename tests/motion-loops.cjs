// Every motion is entry / repeated section / ending, and `loops` marks the
// repeated sections. These checks keep that promise honest: the marked
// windows really are periodic, and extending them only makes the middle
// longer without disturbing the way a motion starts, ends or returns the
// character to rest.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const inputs = ['body','width','arms','legs','head'].map(key => ({dataset:{control:key},value:'100'}));
const context = vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>inputs},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],context);
const results = vm.runInContext(`(() => {
  // A quarter of a unit is about two thirds of a pixel at the size the
  // character is drawn. The spline reads its neighbours' timings, so moving
  // a far-off keyframe nudges the curve a hair even where the values are
  // identical; a difference anyone could see is tens of units.
  const TOLERANCE = .25;
  const report = [];
  for (const motion of motionLibrary) {
    assert_loops: {}
    const loops = motion.loops || [];
    const extended = extendMotionLoops(motion, 2);
    const added = 2 * loops.reduce((total, s) => total + s.cycle, 0);
    let wholeCycles = 0, periodic = 0, beforeMatch = 0, afterMatch = 0, loopMatch = 0;
    for (const {start, end, cycle} of loops) {
      const count = (end - start) / cycle;
      if (Math.abs(count - Math.round(count)) > 1e-6 || count < 1) wholeCycles++;
      // The marked window must repeat: one cycle apart is the same pose.
      for (let i = 0; i <= 40; i++) {
        const t = start + (end - cycle - start) * i / 40;
        // The mouth rides alongside the pose tracks and must repeat too.
        const tracks = [...Object.values(motion.tracks),
          ...(motion.mouth ? [motion.mouth] : [])];
        for (const track of tracks) {
          const a = sampleTrack(track, t, motion.eased);
          const b = sampleTrack(track, t + cycle, motion.eased);
          if (a.some((value, axis) => Math.abs(value - b[axis]) > 1.5)) periodic++;
        }
      }
    }
    // The entry is untouched, and the ending is the same shape, just later.
    const first = loops[0];
    for (let i = 0; i <= 40; i++) {
      for (const [part, track] of Object.entries(motion.tracks)) {
        if (first) {
          const t = first.start * i / 40;
          const a = sampleTrack(track, t, motion.eased);
          const b = sampleTrack(extended.tracks[part], t, extended.eased);
          if (a.some((value, axis) => Math.abs(value - b[axis]) > TOLERANCE)) beforeMatch++;
        }
        const tail = motion.duration - (motion.duration - (loops.at(-1)?.end ?? 0)) * i / 40;
        const a = sampleTrack(track, tail, motion.eased);
        const b = sampleTrack(extended.tracks[part], tail + added, extended.eased);
        if (a.some((value, axis) => Math.abs(value - b[axis]) > TOLERANCE)) afterMatch++;
      }
    }
    // Inside a grown section the pose still comes from the same cycle.
    if (first) {
      for (let i = 0; i <= 40; i++) {
        const t = first.start + (first.end - first.start) * i / 40;
        for (const [part, track] of Object.entries(motion.tracks)) {
          const a = sampleTrack(track, first.start + (t - first.start) % first.cycle, motion.eased);
          const b = sampleTrack(extended.tracks[part], first.start + (t - first.start) % first.cycle, extended.eased);
          if (a.some((value, axis) => Math.abs(value - b[axis]) > TOLERANCE)) loopMatch++;
        }
      }
    }
    const endsAtRest = Object.values(extended.tracks).every(track =>
      sampleTrack(track, extended.duration, extended.eased).every(value => Math.abs(value) < 1e-9));
    report.push({id: motion.id, loops: loops.length, wholeCycles, periodic,
      beforeMatch, afterMatch, loopMatch, endsAtRest,
      duration: extended.duration - motion.duration, added});
  }
  return report;
})()`, context);

for (const row of results) {
  assert.ok(row.loops > 0, `${row.id} marks its repeated section`);
  assert.equal(row.wholeCycles, 0, `${row.id}: each section is a whole number of cycles`);
  assert.equal(row.periodic, 0, `${row.id}: the marked section really repeats`);
  assert.equal(row.beforeMatch, 0, `${row.id}: extending leaves the entry untouched`);
  assert.equal(row.afterMatch, 0, `${row.id}: extending leaves the ending untouched`);
  assert.equal(row.loopMatch, 0, `${row.id}: the repeated section keeps its own timing`);
  assert.ok(row.endsAtRest, `${row.id}: the longer motion still finishes at rest`);
  assert.ok(Math.abs(row.duration - row.added) < 1e-9,
    `${row.id}: only the repeated sections get longer`);
}
console.log(results.map(r => `${r.id}: ${r.loops} loop section(s), +${r.added.toFixed(2)}s for two more cycles`).join('\n'));
console.log('Motion loops: every motion marks its repeated middle, and extending it only lengthens that middle.');
