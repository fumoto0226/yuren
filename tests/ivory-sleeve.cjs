// The ivory tunic's wide sleeve is drawn as two edges offset from the arm's
// centre line. Offset that far from a bend and an edge passes back through
// itself: inside the elbow that showed as a little hook of outline floating
// in the middle of the sleeve. These checks sweep the arm through the poses
// a hand can be dragged into and insist both edges stay simple.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const inputs = ['body','width','arms','legs','head'].map(key => ({dataset:{control:key},value:'100'}));
const context = vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>inputs},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],context);
const results = vm.runInContext(`(() => {
  selectedDecorations.shirt = 'ivory-tunic';
  const warp = buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  // Both edges as point lists: every curve in the path ends on one of the
  // samples the sleeve was built from.
  const edgePoints = text => text.split('M').filter(Boolean).map(part => {
    const numbers = part.match(/-?\\d+(?:\\.\\d+)?/g).map(Number);
    const points = [{x: numbers[0], y: numbers[1]}];
    for (let i = 2; i + 5 < numbers.length + 1; i += 6) {
      points.push({x: numbers[i + 4], y: numbers[i + 5]});
    }
    return points;
  });
  const crosses = (a, b, c, d) => {
    const side = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
    return side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
  };
  let worstPose = null, tangles = 0, poses = 0, thinnest = Infinity, pinchPose = null;
  const areas = [];
  let dented = 0, dentPose = null;
  for (let x = -70; x <= 70; x += 10) {
    for (let y = -100; y <= 30; y += 10) {
      dragPoses.length = 0;
      const pose = createDragPose('leftHand');
      Object.assign(pose, {x, y});
      dragPoses.push(pose);
      const shape = armGeometry('left', warp);
      const edges = edgePoints(ivorySleeveEdges(shape));
      poses++;
      for (const points of edges) {
        for (let i = 0; i + 1 < points.length; i++) {
          // Neighbouring segments share a point, so start two along.
          for (let j = i + 2; j + 1 < points.length; j++) {
            if (crosses(points[i], points[i + 1], points[j], points[j + 1])) {
              tangles++;
              if (!worstPose) worstPose = {x, y, edge: edges.indexOf(points), i, j};
            }
          }
        }
      }
      // Cutting a loop out leaves the two edges with different numbers of
      // points, so the sleeve is measured by the area it encloses instead:
      // it must stay a visible piece of cloth, the right way round, in
      // every pose.
      // No edge may turn sharply back towards the arm either: that is the
      // dent the sleeve used to bite out of itself at a bend.
      edges.forEach((points, side) => {
        const sign = side ? 1 : -1;
        for (let i = 1; i < points.length - 1; i++) {
          const a = points[i - 1], p = points[i], b = points[i + 1];
          const into = {x: p.x - a.x, y: p.y - a.y};
          const outOf = {x: b.x - p.x, y: b.y - p.y};
          const scale = Math.hypot(into.x, into.y) * Math.hypot(outOf.x, outOf.y);
          if (scale < 1e-9) continue;
          const turn = -sign * (into.x * outOf.y - into.y * outOf.x) / scale;
          if (turn > dented) { dented = turn; dentPose = {x, y}; }
        }
      });
      const ring = [...edges[0], ...[...edges[1]].reverse()];
      let area = 0;
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i], b = ring[(i + 1) % ring.length];
        area += a.x * b.y - b.x * a.y;
      }
      area /= 2;
      areas.push({area: Number(area.toFixed(1)), x, y});
      if (Math.abs(area) < Math.abs(thinnest)) { thinnest = area; pinchPose = {x, y}; }
    }
  }
  dragPoses.length = 0;
  selectedDecorations.shirt = null;
  const positive = areas.filter(entry => entry.area > 0).length;
  return {poses, tangles, worstPose, pinchPose, positive, dentPose,
    dented: Number((Math.asin(Math.min(1, dented)) * 180 / Math.PI).toFixed(1)),
    smallest: Math.min(...areas.map(entry => Math.abs(entry.area))),
    thinnest: Number(thinnest.toFixed(2))};
})()`, context);

assert.equal(results.tangles, 0,
  `No sleeve edge folds back through itself (first at ${JSON.stringify(results.worstPose)})`);
assert.equal(results.positive, 0,
  'The sleeve panel keeps one winding: it never turns itself inside out');
assert.ok(results.dented < 10,
  `No edge dents back towards the arm (worst ${results.dented} degrees at `
  + `${JSON.stringify(results.dentPose)})`);
assert.ok(results.smallest > 200,
  `The sleeve stays a visible piece of cloth (smallest ${results.smallest} square units)`);
console.log(`Ivory sleeve: ${results.poses} arm poses, no edge crossings, `
  + `smallest the sleeve ever encloses is ${results.smallest} square units, `
  + `sharpest inward turn ${results.dented} degrees.`);
