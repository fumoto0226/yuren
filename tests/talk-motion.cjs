// Talking widens the notch in the top-left of the head: the lower jaw swings
// about the corner where the notch's two edges meet. These checks keep the
// corner still, keep the shut mouth identical to the reference drawing, keep
// the rest of the head out of it, and keep the speech itself uneven — an
// even flutter does not read as talking.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const inputs = ['body','width','arms','legs','head'].map(key => ({dataset:{control:key},value:'100'}));
const context = vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>inputs},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],context);
const results = vm.runInContext(`(() => {
  const motion = createTalkMotion({phrases: 2});
  const sliders = {body:100,width:100,arms:100,legs:100,head:100};
  const at = opening => {
    dragPoses.length = 0;
    if (opening) dragPoses.push({part:'head',x:0,y:0,angle:0,mouth:opening});
    const warp = buildWarp(sliders);
    const place = ([x, y]) => warp(x, y, 'head');
    const result = {
      jaw: place(JAW.jaw), corner: place(JAW.corner), spike: place(JAW.spike),
      eye: place([50.5644, 38.4695]), neck: place([26.0979, 56.4523]),
      // How wide the notch is: the angle at the corner between the two jaws.
      angle: (() => {
        const c = place(JAW.corner), a = place(JAW.jaw), b = place(JAW.spike);
        // Measured from the upper jaw round to the lower one, so opening
        // the mouth makes it bigger.
        return Math.atan2(b.y - c.y, b.x - c.x) - Math.atan2(a.y - c.y, a.x - c.x);
      })(),
    };
    dragPoses.length = 0;
    return result;
  };
  const rest = at(0), wide = at(1), shut = at(-1);
  const apart = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  // Each syllable holds its opening over two keyframes; the mouth then sits
  // shut over two more, which is the pause before the next one.
  const openings = [...new Set(motion.mouth
    .filter(([, value]) => value > 0).map(([, value]) => value))];
  const gaps = motion.mouth.filter((key, i, all) =>
      i > 0 && key[1] === -1 && all[i - 1][1] === -1 && key[0] > all[i - 1][0])
    .map((key, i, all) => Number((key[0] - motion.mouth[motion.mouth.indexOf(key) - 1][0])
      .toFixed(3)));
  let maxOpen = 0, minOpen = 0, outOfRange = 0;
  for (let i = 0; i <= 400; i++) {
    // The player reads the mouth linearly, like the other side tracks: a
    // spline would round the corners off the syllables and dip the jaw
    // below shut between them.
    const value = sampleTrack(motion.mouth, motion.duration * i / 400, false)[0];
    maxOpen = Math.max(maxOpen, value);
    minOpen = Math.min(minOpen, value);
    if (value < -1 - 1e-9 || value > 1 + 1e-9) outOfRange++;
  }
  return {
    jawMoved: apart(shut.jaw, wide.jaw),
    jawDown: wide.jaw.y - rest.jaw.y, jawOut: rest.jaw.x - wide.jaw.x,
    cornerMoved: Math.max(apart(rest.corner, wide.corner),
      apart(rest.corner, shut.corner)),
    spikeMoved: apart(shut.spike, wide.spike),
    eyeMoved: Math.max(apart(rest.eye, wide.eye), apart(rest.eye, shut.eye)),
    neckMoved: Math.max(apart(rest.neck, wide.neck), apart(rest.neck, shut.neck)),
    widened: wide.angle - rest.angle,
    restAngle: rest.angle, shutAngle: shut.angle, wideAngle: wide.angle,
    openings, gaps, maxOpen, minOpen, outOfRange,
    first: sampleTrack(motion.mouth, 0, false)[0],
    last: sampleTrack(motion.mouth, motion.duration, false)[0],
    headEnd: sampleTrack(motion.tracks.head, motion.duration, motion.eased),
  };
})()`, context);

assert.ok(results.jawMoved > 2.5,
  `A wide mouth swings the lower jaw (${results.jawMoved.toFixed(1)} units)`);
assert.ok(results.jawDown > 1 && results.jawOut > 1,
  'The jaw swings down and away, not straight down');
assert.ok(results.widened > .2,
  `The notch opens up (${(results.widened * 180 / Math.PI).toFixed(0)} degrees wider)`);
assert.ok(results.cornerMoved < .2,
  `The corner it hinges on stays put (${results.cornerMoved.toFixed(3)})`);
assert.ok(results.spikeMoved > .5,
  `The upper lip joins in (${results.spikeMoved.toFixed(1)} units)`);
assert.ok(results.spikeMoved < results.jawMoved * .45,
  `The upper lip moves far less than the jaw (${results.spikeMoved.toFixed(1)} `
  + `against ${results.jawMoved.toFixed(1)})`);
assert.ok(results.eyeMoved < 1e-9, 'The eye stays where it is');
assert.ok(results.neckMoved < 1e-9, 'The neck stays where it is');
assert.equal(results.first, 0, 'The mouth starts shut');
assert.equal(results.last, 0, 'The mouth finishes shut');
assert.equal(results.outOfRange, 0, 'The mouth stays between shut and wide open');
assert.ok(results.minOpen <= -1 + 1e-9, 'The mouth shuts between syllables');
assert.ok(results.shutAngle < results.restAngle * .25,
  `Shut closes the notch almost completely `
  + `(${(results.shutAngle * 180 / Math.PI).toFixed(0)} degrees left of `
  + `${(results.restAngle * 180 / Math.PI).toFixed(0)})`);
assert.ok(results.maxOpen > .9, 'Some syllables open the mouth wide');
assert.ok(new Set(results.openings).size >= 3,
  `Syllables differ in size (${[...new Set(results.openings)].join(', ')})`);
assert.ok(Math.max(...results.gaps) > 2 * Math.min(...results.gaps),
  `A phrase ends on a longer pause (${results.gaps.join(', ')})`);
assert.ok(results.headEnd.every(value => Math.abs(value) < 1e-9),
  'The head is handed back where it was found');
console.log(`Talking: ${results.openings.length} syllables, openings `
  + `${[...new Set(results.openings)].join('/')}, pauses ${results.gaps.join('/')}s; `
  + `the notch runs ${(results.shutAngle * 180 / Math.PI).toFixed(0)} degrees shut, `
  + `${(results.restAngle * 180 / Math.PI).toFixed(0)} as drawn, `
  + `${(results.wideAngle * 180 / Math.PI).toFixed(0)} wide open, `
  + `the jaw point travelling ${results.jawMoved.toFixed(1)} units and the upper `
  + `lip ${results.spikeMoved.toFixed(1)}.`);
console.log('Talking: jaw hinged at the notch corner, rest of the head untouched, uneven syllables.');
