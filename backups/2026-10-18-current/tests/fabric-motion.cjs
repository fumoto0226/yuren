const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const inputs=['body','width','arms','legs','head'].map(key=>({dataset:{control:key},value:'100'}));
const context=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>inputs},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],context);
const result=vm.runInContext(`(()=>{
  const out=[];
  for(const legs of [50,100,180])for(const side of ['left','right']){
    controls.legs.value=String(legs);
    const warp=buildWarp({body:100,width:100,arms:100,legs,head:100});
    dragPoses.length=0;
    const resting=legGeometry(side,warp);
    const mark=legFabricPoint(resting,4,resting.restLength*.5,legs);
    dragPoses.push(Object.assign(createDragPose(side+'Leg'),{x:side==='left'?-15:15,y:-40}));
    const moving=legGeometry(side,warp);
    const movedMark=legFabricPoint(moving,4,moving.restLength*.5,legs);
    const kneeMark=legFabricPoint(moving,0,moving.restLength*.5,legs);
    const paths=legFabricPaths(moving,side,legs).flat();
    out.push({travel:Math.hypot(mark.x-movedMark.x,mark.y-movedMark.y),
      kneeError:Math.hypot(kneeMark.x-moving.centerline[16].x,kneeMark.y-moving.centerline[16].y),
      offset:Math.hypot(movedMark.x-kneeMark.x,movedMark.y-kneeMark.y),
      valid:paths.some(p=>p.d.length)&&paths.every(p=>!/NaN|Infinity/.test(p.d))});
  }
  return out;
})()`,context);
for(const pose of result){
  assert.ok(pose.travel>5,'A fabric mark must move with the raised leg');
  assert.ok(pose.kneeError<1e-8,'The material knee stays on the deformed knee');
  assert.ok(Math.abs(pose.offset-4)<1e-8,'A mark keeps its distance across the fabric');
  assert.ok(pose.valid,'Folded fabric polygons remain finite at all leg lengths');
}
console.log('Fabric follows both raised legs and their knees at shortest, normal and longest lengths.');

// A continuous trouser calf has two open side edges, never a knee cap.
const edges=vm.runInContext(`(()=>{
  const out=[];
  for(const legs of [50,100,180])for(const side of ['left','right'])for(const flare of [0,5.5,10.5]) {
    controls.legs.value=String(legs);
    const warp=buildWarp({body:100,width:100,arms:100,legs,head:100});
    dragPoses.length=0;
    dragPoses.push(Object.assign(createDragPose('body'),{x:8,y:35}));
    const shape=legGeometry(side,warp);
    const d=trouserCalfEdges(shape,flare,legs);
    const starts=[...d.matchAll(/M(-?[\\d.]+) (-?[\\d.]+)/g)].map(m=>({x:+m[1],y:+m[2]}));
    const middle={x:(starts[0].x+starts[1].x)/2,y:(starts[0].y+starts[1].y)/2};
    const expected=shape.hose[19].width+1+(flare?wideLegExtraWidth(19,flare):0);
    out.push({d,centerError:Math.hypot(middle.x-shape.centerline[19].x,middle.y-shape.centerline[19].y),
      widthError:Math.abs(Math.hypot(starts[0].x-starts[1].x,starts[0].y-starts[1].y)-expected)});
  }
  return out;
})()`,context);
for(const edge of edges){
  assert.equal((edge.d.match(/M/g)||[]).length,2,'Inner fold and outer border must both exist');
  assert.ok(!/[ZCQ]|NaN|Infinity/.test(edge.d),'No closing knee arc or invalid coordinate');
  assert.ok(edge.centerError<.002&&edge.widthError<.003,'Side edges meet the fabric split at its full width');
}
console.log('Both calf side edges remain open and meet the fabric split across trouser widths and leg lengths.');

const cuffs=vm.runInContext(`(()=>{
  const rows=[];
  const point=s=>s.trim().split(' ').map(Number);
  for(const legs of [50,100,180])for(const side of ['left','right'])
    for(const x of [-35,0,35]) {
      controls.legs.value=String(legs);
      dragPoses.length=0;
      dragPoses.push(Object.assign(createDragPose('body'),{x,y:45}));
      const shape=legGeometry(side,buildWarp({body:100,width:100,arms:100,legs,head:100}));
      const shoe=extendedShoe(shape);
      const topA=point(shoe.outline.match(/^M([^L]+)/)[1]);
      const topB=point(shoe.outline.match(/L([^L]+)$/)[1]);
      const deltaA=[topA[0]-shape.bootOuter.x,topA[1]-shape.bootOuter.y];
      const deltaB=[topB[0]-shape.bootInner.x,topB[1]-shape.bootInner.y];
      for(const flare of [5.5,10.5]) {
        const hem=wideLegHemPoints(shape,flare,legs);
        const ends=trouserCalfEdges(shape,flare,legs).split('M').slice(1)
          .map(edge=>point(edge.slice(edge.lastIndexOf('L')+1)));
        rows.push({cornerError:Math.max(...ends.map((p,i)=>
          Math.hypot(p[0]-hem[1-i].x,p[1]-hem[1-i].y))),
          parallelError:Math.hypot(deltaA[0]-deltaB[0],deltaA[1]-deltaB[1]),
          extension:Math.hypot(...deltaA),
          up:deltaA[0]*shape.shoeUp.x+deltaA[1]*shape.shoeUp.y});
      }
    }
  return rows;
})()`,context);
for(const cuff of cuffs){
  assert.ok(cuff.cornerError<.001,'Calf side edges and hem must share the same corners under compression');
  assert.ok(cuff.parallelError<.001,'Ankle extension must preserve the foot opening width');
  assert.ok(Math.abs(cuff.extension-3)<.001&&cuff.up>2.999,'Ankle extends a short distance in its own upward direction');
}
console.log('Compressed trouser corners meet; ankle extensions stay parallel, short and aligned with the foot.');
