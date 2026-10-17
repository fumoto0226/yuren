const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const root=path.resolve(__dirname,'..');
const inputs=['body','width','arms','legs','head']
  .map(key=>({dataset:{control:key},value:'100'}));
const context=vm.createContext({
  document:{querySelector:()=>({}),querySelectorAll:()=>inputs},
  requestAnimationFrame:()=>1,console,
});
vm.runInContext(fs.readFileSync(path.join(root,'script.js'),'utf8')
  .split('resetButton.addEventListener')[0],context);

const result=vm.runInContext(`(()=>{
  const children=[];
  svg={appendChild(node){
    const index=children.indexOf(node);
    if(index>=0)children.splice(index,1);
    children.push(node);
  }};
  for(const part of layerOrder)partLayers[part]={name:part};
  outfitOverlay={name:'outfit'};
  neckOverlay={name:'neck'};
  // The dungarees are a lower-body garment now, so a top can go under them.
  selectedDecorations.pants='jumpsuit';
  selectedDecorations.shirt='plain';
  const snapshot=()=>children.map(node=>node.name);
  const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  const refresh=()=>{
    updateArmOcclusion({left:armGeometry('left',warp),right:armGeometry('right',warp)});
    updateLegOcclusion({left:legGeometry('left',warp),right:legGeometry('right',warp)},warp);
    updatePartOrder();
  };
  const mockNode=()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v;},
    removeAttribute(k){delete this.attrs[k];}});
  const rootBlack=mockNode(),skinRoot=mockNode();
  refresh();
  const resting=snapshot();
  dragPoses.push(Object.assign(createDragPose('rightHand'),{x:-65,y:-15}));
  refresh();
  applyArmOcclusion('right',rootBlack,skinRoot);
  const raised=snapshot();
  const raisedMasks=[rootBlack.attrs.mask||null,skinRoot.attrs.mask||null];
  dragPoses[0].x=35;dragPoses[0].y=-20;
  refresh();
  applyArmOcclusion('right',rootBlack,skinRoot);
  const outward=snapshot();
  const outwardMasks=[rootBlack.attrs.mask,skinRoot.attrs.mask];
  dragPoses.length=0;
  dragPoses.push(createDragPose('rightLeg'));
  selectedDecorations.shirt=null;
  selectedDecorations.pants='red-shorts';
  refresh();
  const redShorts=snapshot();
  dragPoses[0].x=15;dragPoses[0].y=-10;
  refresh();
  const lowRedShorts=snapshot();
  dragPoses[0].x=20;dragPoses[0].y=-25;
  refresh();
  const earlyOutwardRedShorts=snapshot();
  dragPoses[0].x=35;dragPoses[0].y=-70;
  refresh();
  const nearThresholdRedShorts=snapshot();
  dragPoses[0].x=35;dragPoses[0].y=-75;
  refresh();
  const raisedRedShorts=snapshot();
  dragPoses[0].x=35;dragPoses[0].y=-70;
  refresh();
  const easingRedShorts=snapshot();
  dragPoses[0].x=0;dragPoses[0].y=0;
  refresh();
  dragPoses[0].x=-55;dragPoses[0].y=-10;
  refresh();
  const nearThresholdInwardRedShorts=snapshot();
  dragPoses[0].x=-60;dragPoses[0].y=-10;
  refresh();
  const crossedRedShorts=snapshot();
  dragPoses[0].x=-35;dragPoses[0].y=-70;
  refresh();
  const inwardRedShorts=snapshot();
  dragPoses[0].x=15;dragPoses[0].y=-10;
  refresh();
  const loweredRedShorts=snapshot();
  dragPoses[0].x=0;dragPoses[0].y=0;
  selectedDecorations.pants='pink-shorts';
  refresh();
  const pinkShorts=snapshot();
  selectedDecorations.pants='plain';
  refresh();
  const trousers=snapshot();
  selectedDecorations.shirt='blue-vest';
  selectedDecorations.pants='red-shorts';
  refresh();
  const vestAndShorts=snapshot();
  dragPoses[0].x=35;dragPoses[0].y=-75;
  refresh();
  const raisedVestAndShorts=snapshot();
  dragPoses[0].x=0;dragPoses[0].y=0;
  selectedDecorations.shirt=null;
  selectedDecorations.pants='jumpsuit';
  refresh();
  const jumpsuitLeg=snapshot();
  dragPoses.length=0;
  dragPoses.push(Object.assign(createDragPose('leftLeg'),{x:-35,y:-65}));
  selectedDecorations.pants='red-shorts';
  refresh();
  const nearThresholdLeftLeg=snapshot();
  dragPoses[0].y=-70;
  refresh();
  const raisedLeftLeg=snapshot();
  dragPoses[0].x=0;dragPoses[0].y=0;
  refresh();
  dragPoses[0].x=50;dragPoses[0].y=-10;
  refresh();
  const nearThresholdInwardLeftLeg=snapshot();
  dragPoses[0].x=55;
  refresh();
  const crossedLeftLeg=snapshot();
  dragPoses.length=0;
  dragPoses.push(createDragPose('rightLeg'));
  selectedDecorations.shirt='patched-tee';
  selectedDecorations.pants='orange-shorts';
  selectedDecorations.outerwear='green-vest';
  selectedDecorations.shoes='brown-boots';
  dragPoses[0].x=15;dragPoses[0].y=-10;
  refresh();
  const newOutfitLow=snapshot();
  const newOutfitSleeveless=hasSleevelessOutfit();
  const lowHipOutline=buttOutlineOpacity('right');
  dragPoses[0].x=35;dragPoses[0].y=-75;
  refresh();
  const newOutfitRaised=snapshot();
  const raisedHipOutline=buttOutlineOpacity('right');
  const otherHipOutline=buttOutlineOpacity('left');
  const jacketOnlyInOuterwear=decorationCatalog.outerwear.some(item=>item.id==='green-vest')
    &&!decorationCatalog.shirt.some(item=>item.id==='green-vest');
  selectedDecorations.pants='navy-jumpsuit';
  selectedDecorations.shirt='red-tee';
  refresh();
  const navyJumpsuitLeg=snapshot();
  const navyJumpsuitSleeveless=hasSleevelessOutfit();
  selectedDecorations.pants='black-shorts';
  selectedDecorations.shirt='red-triangle';
  dragPoses[0].x=15;dragPoses[0].y=-10;
  refresh();
  const blackShortsLow=snapshot();
  const triangleSleeveless=hasSleevelessOutfit();
  dragPoses[0].x=35;dragPoses[0].y=-75;
  refresh();
  const blackShortsRaised=snapshot();
  selectedDecorations.pants='wide-pants';
  dragPoses[0].x=15;dragPoses[0].y=-10;
  refresh();
  const widePantsHipOutline=buttOutlineOpacity('right');
  selectedDecorations.pants='loose-wide-pants';
  refresh();
  const looseWidePantsHipOutline=buttOutlineOpacity('right');
  const looseWidePantsLow=snapshot();
  dragPoses[0].x=35;dragPoses[0].y=-75;
  refresh();
  const looseWidePantsRaised=snapshot();
  selectedDecorations.pants=null;
  selectedDecorations.outerwear=null;
  dragPoses[0].x=-45;dragPoses[0].y=-65;
  refresh();
  const triangleRightLeg=snapshot();
  dragPoses.length=0;
  dragPoses.push(Object.assign(createDragPose('leftLeg'),{x:45,y:-65}));
  refresh();
  const triangleLeftLeg=snapshot();
  return {resting,raised,outward,raisedMasks,outwardMasks,
    redShorts,lowRedShorts,earlyOutwardRedShorts,
    nearThresholdRedShorts,raisedRedShorts,easingRedShorts,
    nearThresholdInwardRedShorts,crossedRedShorts,inwardRedShorts,
    loweredRedShorts,
    pinkShorts,trousers,vestAndShorts,raisedVestAndShorts,jumpsuitLeg,
    nearThresholdLeftLeg,raisedLeftLeg,
    nearThresholdInwardLeftLeg,crossedLeftLeg,
    newOutfitLow,newOutfitRaised,newOutfitSleeveless,
    lowHipOutline,raisedHipOutline,otherHipOutline,jacketOnlyInOuterwear,
    navyJumpsuitLeg,navyJumpsuitSleeveless,blackShortsLow,
    blackShortsRaised,triangleSleeveless,triangleRightLeg,
    triangleLeftLeg,widePantsHipOutline,looseWidePantsHipOutline,
    looseWidePantsLow,looseWidePantsRaised,
    neck:jumpsuitNeckSources,shoulders:jumpsuitShoulderSources};
})()`,context);

const crouchedSides=vm.runInContext(`(()=>{
  dragPoses.length=0;
  const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  const length=side=>{
    const path=visiblePantsSide(side,legGeometry(side,warp),warp);
    const [x1,y1,x2,y2]=path.match(/[-+]?(?:\\d*\\.\\d+|\\d+)/g).map(Number);
    return Math.hypot(x2-x1,y2-y1);
  };
  const standing=['left','right'].map(length);
  dragPoses.push(Object.assign(createDragPose('body'),{x:0,y:40}));
  const crouching=['left','right'].map(length);
  return {standing,crouching};
})()`,context);

const neckLayers=vm.runInContext(`(()=>{
  const children=[{name:'tee-neck'},{name:'tee-top'},{name:'scarf'}];
  neckOverlay={insertBefore(node,before){
    const old=children.indexOf(node);
    if(old>=0) children.splice(old,1);
    const index=before?children.indexOf(before):children.length;
    children.splice(index,0,node);
  }};
  scarfPaths=[{node:children[2]}];
  garmentPaths={greenVestLeft:{name:'coat-left'},greenVestRight:{name:'coat-right'}};
  placeOuterwearOverNeckline();
  return children.map(node=>node.name);
})()`,context);

const thongLengths=vm.runInContext(`(()=>[50,100,180].map(legs=>{
  const source=redThongSource(legs);
  const match=source.match(/L50\\.5 ([0-9.]+)L43\\.7 ([0-9.]+)/);
  return {legs,end:Number(match[1]),otherEnd:Number(match[2]),
    waist:source.slice(0,source.indexOf('L50.5 119.5'))};
}))()`,context);

const position=(order,name)=>order.indexOf(name);
// The palm and forearm stay above everything so a leg swung across the body
// cannot cut through them, which puts the arm above the garment in every
// pose. What makes a resting arm read as tucked under the strap is the
// shoulder mask below, not the paint order: the masks are the guarantee.
for(const arm of ['leftHand','rightHand'])
  {
    assert.ok(position(result.resting,arm)>position(result.resting,'head'));
    assert.ok(position(result.resting,arm)>position(result.resting,'outfit'));
  }
assert.ok(position(result.raised,'rightHand')>position(result.raised,'outfit'));
assert.ok(position(result.raised,'rightHand')>position(result.raised,'head'));
assert.ok(position(result.outward,'rightHand')>position(result.outward,'head'));
assert.ok(position(result.outward,'rightHand')>position(result.outward,'outfit'));
assert.ok(result.raisedMasks.every(mask=>mask===null),'Crossing arm root must not be clipped');
assert.ok(result.outwardMasks.every(mask=>mask==='url(#right-shoulder-mask)'),
  'A resting arm root must be masked away at the shoulder');
// A resting arm stays tucked behind the scarf, but one swung up past the
// shoulder line passes in front of it and goes back on top.
assert.equal(result.resting.at(-1),'neck');
assert.equal(result.raised.at(-1),'rightHand');
assert.ok(position(result.raised,'rightHand')>position(result.raised,'neck'));
assert.ok(position(result.resting,'leftHand')<position(result.resting,'neck'));
assert.ok(result.neck.left.startsWith('M')&&result.neck.right.startsWith('M'));
assert.ok(result.shoulders.left.startsWith('M')&&result.shoulders.right.startsWith('M'));
for(const order of [result.redShorts,result.pinkShorts,result.trousers,
    result.vestAndShorts,result.lowRedShorts,result.earlyOutwardRedShorts,
    result.nearThresholdRedShorts,result.nearThresholdInwardRedShorts,
    result.loweredRedShorts]) {
  assert.ok(position(order,'rightLeg')>position(order,'leftLeg'));
  assert.ok(position(order,'rightLeg')<position(order,'body'));
  assert.ok(position(order,'rightLeg')<position(order,'outfit'));
}
for(const order of [result.raisedRedShorts,result.easingRedShorts,
    result.crossedRedShorts,result.inwardRedShorts,
    result.raisedVestAndShorts]) {
  assert.ok(position(order,'rightLeg')>position(order,'outfit'));
  assert.ok(position(order,'rightLeg')>position(order,'body'));
}
assert.ok(position(result.jumpsuitLeg,'rightLeg')>position(result.jumpsuitLeg,'outfit'));
assert.ok(position(result.nearThresholdLeftLeg,'leftLeg')<position(result.nearThresholdLeftLeg,'outfit'));
assert.ok(position(result.raisedLeftLeg,'leftLeg')>position(result.raisedLeftLeg,'outfit'));
assert.ok(position(result.nearThresholdInwardLeftLeg,'leftLeg')<position(result.nearThresholdInwardLeftLeg,'outfit'));
assert.ok(position(result.crossedLeftLeg,'leftLeg')>position(result.crossedLeftLeg,'outfit'));
assert.ok(result.newOutfitSleeveless);
assert.ok(result.jacketOnlyInOuterwear,'The green jacket has its own category');
assert.ok(result.navyJumpsuitSleeveless&&result.triangleSleeveless);
assert.ok(position(result.navyJumpsuitLeg,'rightLeg')>position(result.navyJumpsuitLeg,'outfit'));
assert.ok(position(result.blackShortsLow,'rightLeg')<position(result.blackShortsLow,'outfit'));
assert.ok(position(result.blackShortsRaised,'rightLeg')>position(result.blackShortsRaised,'outfit'));
assert.equal(result.widePantsHipOutline,0,
  'The body hip contour must not cross a dragged wide trouser leg');
assert.equal(result.looseWidePantsHipOutline,0);
assert.ok(position(result.looseWidePantsLow,'rightLeg')<position(result.looseWidePantsLow,'outfit'));
assert.ok(position(result.looseWidePantsRaised,'rightLeg')>position(result.looseWidePantsRaised,'outfit'));
assert.deepEqual(Array.from(thongLengths,item=>item.end),[132.8,135.9538,141]);
assert.ok(thongLengths.every(item=>item.end===item.otherEnd
  &&item.waist===thongLengths[0].waist),
  'Only the thong centre strip should change with leg length');
for(const [order,leg] of [[result.triangleRightLeg,'rightLeg'],
    [result.triangleLeftLeg,'leftLeg']]) {
  assert.ok(position(order,leg)>position(order,'outfit'),
    'A dragged bare leg must stay in front of a sleeveless top');
  assert.ok(position(order,'leftHand')>position(order,leg));
  assert.ok(position(order,'rightHand')>position(order,leg));
}
assert.deepEqual([...neckLayers],
  ['tee-neck','tee-top','coat-left','coat-right','scarf'],
  'The jacket must cover shirt neckline strokes while the scarf stays above it');
for(let side=0;side<2;side++)
  assert.ok(crouchedSides.crouching[side]<crouchedSides.standing[side]*.6,
    'A folded thigh trims the shorts side before it overhangs');
assert.equal(result.lowHipOutline,0,'Continuous shorts hide the hip seam before layer promotion too');
assert.equal(result.raisedHipOutline,0,'The raised trouser leg must hide the hip seam');
assert.equal(result.otherHipOutline,0,'The undragged hip contour stays hidden');
assert.ok(position(result.newOutfitLow,'rightLeg')<position(result.newOutfitLow,'outfit'));
assert.ok(position(result.newOutfitRaised,'rightLeg')>position(result.newOutfitRaised,'outfit'));
console.log('Arms stay above head, body and garment; the shoulder mask tucks a resting arm under the strap; a crossing arm keeps its root; the scarf stays above a resting arm and below a raised one.');
console.log('Outside legs come forward near 20 degrees above horizontal; crossing legs come forward near 42 degrees from vertical, on both sides.');

// A folded knee can rise over the torso while the foot still hangs below
// the hip. Grabbing the thigh must not leave this pose behind the clothes.
const foldedLegs=vm.runInContext(`(()=>{
  const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  selectedDecorations.pants='wide-pants';
  selectedDecorations.shirt=null;selectedDecorations.outerwear=null;
  const result=[];
  for(const side of ['left','right']){
    dragPoses.length=0;legInFront.left=false;legInFront.right=false;
    const sign=side==='left'?-1:1;
    dragPoses.push(Object.assign(createDragPose(side+'Leg'),{x:sign*10,y:-45}));
    const shapes={left:legGeometry('left',warp),right:legGeometry('right',warp)};
    updateLegOcclusion(shapes,warp);
    const shape=shapes[side];
    result.push({front:legInFront[side],kneeAbove:shape.knee.y<shape.hip.y,
      footBelow:shape.ankle.y>shape.hip.y});
  }
  return result;
})()`,context);
assert.ok(foldedLegs.every(p=>p.kneeAbove&&p.footBelow&&p.front),
  'A raised folded thigh comes forward even with its foot below the hip');

const torsoColors=vm.runInContext(`(()=>{
  const node=()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v;}});
  torsoMaterial={gradient:node(),lower:[node(),node()]};
  const body=node(),results=[];
  dragPoses.length=0;
  dragPoses.push(Object.assign(createDragPose('body'),{x:15,y:35}));
  const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  for(const pants of ['wide-pants','loose-wide-pants','orange-shorts',null,'red-thong']){
    selectedDecorations.pants=pants;updateTorsoMaterial(body,warp);
    results.push({pants,fill:body.attrs.fill,color:torsoMaterial.lower[0].attrs['stop-color']});
  }
  return results;
})()`,context);
assert.equal(torsoColors[0].fill,'url(#torso-material)');
assert.equal(torsoColors[1].fill,'url(#loose-pants-fabric)');
assert.equal(torsoColors[2].fill,'url(#torso-material)');
assert.equal(torsoColors[0].color,'#3e4a72');
assert.equal(torsoColors[1].color,'#3e4a72');
assert.equal(torsoColors[2].color,'#eb8135');
assert.ok(torsoColors.slice(3).every(item=>item.fill==='#C5C5C5'),
  'Removing trousers or selecting a thong restores the exposed body skin');
console.log('Folded raised thighs come forward; the lower torso uses fabric color without a grey backing edge.');

const lowHipSeams=vm.runInContext(`(()=>{
  const results=[];
  selectedDecorations.shirt=null;selectedDecorations.outerwear=null;
  const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  for(const item of decorationCatalog.pants)for(const side of ['left','right']){
    selectedDecorations.pants=item.id;
    legInFront.left=false;legInFront.right=false;dragPoses.length=0;
    dragPoses.push(Object.assign(createDragPose(side+'Leg'),{x:side==='left'?-15:15,y:-10}));
    updateLegOcclusion({left:legGeometry('left',warp),right:legGeometry('right',warp)},warp);
    results.push({id:item.id,opacity:buttOutlineOpacity(side)});
  }
  return results;
})()`,context);
for(const item of lowHipSeams){
  if(['red-shorts','red-thong'].includes(item.id))
    assert.ok(item.opacity>0,`${item.id} retains the exposed skin boundary`);
  else assert.equal(item.opacity,0,`${item.id} must not show a hip seam on a small diagonal pull`);
}
console.log('All continuous trousers and knee shorts hide hip seams before promotion on both sides.');
