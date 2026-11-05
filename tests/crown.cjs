// The crown is worn on the side of the head with its band tucked behind it,
// so the head's outline crosses it and only the points show. That only
// works if the band really is behind the head's right edge and the points
// really do clear it — at any head size, since the slider scales both.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const inputs = ['body','width','arms','legs','head'].map(key => ({dataset:{control:key},value:'100'}));
const context = vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>inputs},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],context);
const results = vm.runInContext(`(() => {
  // The head's right edge, straight out of the reference outline: the lower
  // half of path 5, from the cheek down to the neck.
  const edge = [[66.0588,34.9857],[68.4356,46.4881],[67.7274,50.0112],[67.7274,55.0466]];
  const at = (points, t) => {
    const u = 1 - t;
    return {
      x: u*u*u*points[0][0] + 3*u*u*t*points[1][0] + 3*u*t*t*points[2][0] + t*t*t*points[3][0],
      y: u*u*u*points[0][1] + 3*u*u*t*points[1][1] + 3*u*t*t*points[2][1] + t*t*t*points[3][1],
    };
  };
  const report = [];
  for (const size of [70, 100, 140]) {
    const warp = buildWarp({body:100,width:100,arms:100,legs:100,head:size});
    const place = ([x, y]) => warp(x, y, 'head');
    // The edge, warped the same way, sampled finely enough to read off the
    // head's width at any height.
    const outline = [];
    for (let i = 0; i <= 200; i++) outline.push(place(Object.values(at(edge, i / 200))));
    const edgeAt = y => {
      let nearest = outline[0];
      for (const point of outline) {
        if (Math.abs(point.y - y) < Math.abs(nearest.y - y)) nearest = point;
      }
      return nearest.x;
    };
    const clearance = crownPoints.map(point => {
      const placed = place(point);
      return Number((placed.x - edgeAt(placed.y)).toFixed(2));
    });
    // The band's own back edge, which has to sit behind the head.
    const back = [[18.2338,11.8578],[18.8662,18.9204]]
      .map(([x,y])=>place(Object.values(crownReferencePoint(x,y))));
    const behind = back.map(point => Number((edgeAt(point.y) - point.x).toFixed(2)));
    const widest = Math.max(...crownPoints.map(point => place(point).x)) + crownBeadRadius * size / 100;
    report.push({size, clearance, behind, widest: Number(widest.toFixed(1))});
  }
  return report;
})()`, context);

for (const row of results) {
  assert.ok(Math.min(...row.clearance) > 5,
    `head at ${row.size}%: every point stands clear of the head `
    + `(${row.clearance.join(', ')})`);
  assert.ok(Math.min(...row.behind) > 0,
    `head at ${row.size}%: the band is tucked behind the head `
    + `(${row.behind.join(', ')})`);
  assert.ok(row.widest < 99,
    `head at ${row.size}%: the crown stays on the canvas (${row.widest})`);
}
console.log(results.map(row => `head ${row.size}%: points clear the head by `
  + `${row.clearance.join('/')}, band tucked ${row.behind.join('/')} behind, `
  + `reaching x=${row.widest}`).join('\n'));
console.log('Crown: band behind the head and points clear of it at every head size.');

const reference=vm.runInContext('({radius:crownBeadRadius,scale:crownScale,stroke:crownStrokeWidth,points:crownPoints})',context);
assert.ok(Math.abs(reference.radius/reference.scale-.715332)<1e-9,'Reference bead radius is preserved');
assert.ok(Math.abs(reference.stroke/reference.scale-.4)<1e-9,'Reference stroke weight is preserved');
assert.ok(reference.points[1][0]>reference.points[2][0]&&reference.points[2][0]>reference.points[0][0],'Reference tilted tips are preserved');
