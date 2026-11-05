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
  const at = (opening, skin = null) => {
    selectedDecorations.skin = skin;
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
    selectedDecorations.skin = null;
    return result;
  };
  const rest = at(0), wide = at(1), shut = at(-1);
  // A skin may close its mouth less far: Pochita's curved lip reads as two
  // crossed lines if it shuts flush, so his entry in the skin table stops
  // it short. The motion is the same one either way.
  const softShut = at(-1, 'pochita');
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
    softShutAngle: softShut.angle,
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
// The drawing's own mouth shuts flush.
assert.ok(results.shutAngle * 180 / Math.PI < 5,
  `Shut closes the notch `
  + `(${(results.shutAngle * 180 / Math.PI).toFixed(0)} degrees left of `
  + `${(results.restAngle * 180 / Math.PI).toFixed(0)})`);
// A skin that asks for less keeps its two edges plainly apart.
assert.ok(results.softShutAngle * 180 / Math.PI > 10,
  `A skin's own shut leaves the edges apart `
  + `(${(results.softShutAngle * 180 / Math.PI).toFixed(0)} degrees)`);
assert.ok(results.maxOpen > .9, 'Some syllables open the mouth wide');
assert.ok(new Set(results.openings).size >= 3,
  `Syllables differ in size (${[...new Set(results.openings)].join(', ')})`);
assert.ok(Math.max(...results.gaps) > 2 * Math.min(...results.gaps),
  `A phrase ends on a longer pause (${results.gaps.join(', ')})`);
assert.ok(results.headEnd.every(value => Math.abs(value) < 1e-9),
  'The head is handed back where it was found');
// The bat cowl opens with the jaw as well, by its own smaller share: its
// notch is narrower than the head's, so the head's full swing would drive
// its two points through each other.
const cowl = vm.runInContext(`(() => {
  const valley = [39.4667,26.1775], left = [29.8619,13.7534], right = [42.9122,2.2288];
  const notch = mouth => {
    dragPoses.length = 0;
    if (mouth) dragPoses.push({part:'head',x:0,y:0,angle:0,mouth});
    const warp = buildWarp({body:100,width:100,arms:100,legs:100,head:100});
    const at = point => warp(point[0], point[1], 'headShell');
    const v = at(valley), l = at(left), r = at(right);
    dragPoses.length = 0;
    // Negative while the notch is open, the way the cowl is drawn.
    return (Math.atan2(l.y - v.y, l.x - v.x) - Math.atan2(r.y - v.y, r.x - v.x))
      * 180 / Math.PI;
  };
  const samples = [];
  for (let i = -20; i <= 20; i++) samples.push(Number(notch(i / 20).toFixed(2)));
  return {samples, rest: notch(0), shut: notch(-1), wide: notch(1)};
})()`, context);
assert.ok(Math.max(...cowl.samples) < 0,
  `The cowl's two points never cross (worst ${Math.max(...cowl.samples)} degrees)`);
assert.ok(cowl.shut > cowl.rest + 25,
  `Shutting closes the cowl's notch too (${cowl.shut.toFixed(1)} from ${cowl.rest.toFixed(1)})`);
assert.ok(cowl.wide < cowl.rest - 10,
  `Opening widens the cowl's notch (${cowl.wide.toFixed(1)} from ${cowl.rest.toFixed(1)})`);
console.log(`Cowl notch: ${cowl.shut.toFixed(1)} shut, ${cowl.rest.toFixed(1)} at rest, `
  + `${cowl.wide.toFixed(1)} wide open — the points follow the jaw without meeting.`);
console.log(`Talking: ${results.openings.length} syllables, openings `
  + `${[...new Set(results.openings)].join('/')}, pauses ${results.gaps.join('/')}s; `
  + `the notch runs ${(results.shutAngle * 180 / Math.PI).toFixed(0)} degrees shut, `
  + `${(results.restAngle * 180 / Math.PI).toFixed(0)} as drawn, `
  + `${(results.wideAngle * 180 / Math.PI).toFixed(0)} wide open, `
  + `the jaw point travelling ${results.jawMoved.toFixed(1)} units and the upper `
  + `lip ${results.spikeMoved.toFixed(1)}.`);
console.log('Talking: jaw hinged at the notch corner, rest of the head untouched, uneven syllables.');
