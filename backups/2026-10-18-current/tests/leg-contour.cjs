const fs=require('fs'),vm=require('vm');
const root=require('path').resolve(__dirname, '..');
const inputs=['body','width','arms','legs','head'].map(key=>({dataset:{control:key},value:'100'}));
const context=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>inputs},
  requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(root+'/script.js','utf8').split('resetButton.addEventListener')[0],context);
const sweep=vm.runInContext(`(()=>{
  const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  const intersect=(a,b,c,d)=>cross(a,b,c)*cross(a,b,d)<-1e-8
    &&cross(c,d,a)*cross(c,d,b)<-1e-8;
  let count=0,failures=[];
  for(const legs of [50,75,100,140,180])for(const width of [60,100,150])
    for(const part of ['leftLeg','rightLeg','body','head'])
      for(const x of [-100,-40,0,40,100])for(const y of [-100,-40,0,40,100]){
        controls.legs.value=String(legs);controls.width.value=String(width);
        dragPoses.length=0;
        dragPoses.push(Object.assign(createDragPose(part),limitDrag({part},x,y)));
        const warp=buildWarp({body:100,width,arms:100,legs,head:100});
        for(const side of ['left','right']){
          const g=legGeometry(side,warp),p=g.centerline;
          if(g.hose.length!==32||g.hose.some(segment=>!Number.isFinite(segment.width)
              ||segment.width<=0||/NaN|Infinity/.test(segment.d)))
            failures.push({legs,width,part,x,y,side,type:'invalid path'});
          for(let i=0;i<p.length-1;i++)for(let j=i+2;j<p.length-1;j++)
            if(intersect(p[i],p[i+1],p[j],p[j+1]))
              failures.push({legs,width,part,x,y,side,type:'centerline crossing'});
          count++;
        }
      }
  return {count,failures};
})()`,context);
require('node:assert/strict').equal(sweep.failures.length,0,
  JSON.stringify(sweep.failures.slice(0,10)));
console.log(`${sweep.count} rubber-hose poses: valid continuous spines.`);

const wideHems=vm.runInContext(`(()=>{
  const results=[];
  for(const side of ['left','right'])for(const legs of [50,75,100,180])
    for(const flare of [5.5,10.5])for(const [x,y] of [[0,0],[-35,-70],[35,-75]]){
    dragPoses.length=0;
    dragPoses.push(Object.assign(createDragPose(side+'Leg'),{x,y}));
    const shape=legGeometry(side,buildWarp({body:100,width:100,arms:100,legs,head:100}));
    const end=wideLegEnd(shape,legs);
    const coordinates=wideLegHemPath(shape,flare,legs).match(/[-+]?(?:\\d*\\.\\d+|\\d+)/g).map(Number);
    const midpoint={x:(coordinates[0]+coordinates[2])/2,y:(coordinates[1]+coordinates[3])/2};
    const clip=legEndClipPoints(shape,legs).split(' ').map(Number);
    const last=wideLegLastPath(shape,legs).match(/L([-+0-9.]+) ([-+0-9.]+)$/);
    results.push({
      distance:Math.hypot(midpoint.x-end.x,midpoint.y-end.y),
      clipDistance:Math.hypot((clip[0]+clip[2])/2-end.x,
        (clip[1]+clip[3])/2-end.y),
      lastDistance:Math.hypot(Number(last[1])-end.x,Number(last[2])-end.y),
      overlap:Math.hypot(end.x-shape.centerline[32].x,end.y-shape.centerline[32].y),
      legs,flare,
    });
  }
  return results;
})()`,context);
require('node:assert/strict').ok(wideHems.every(item=>
  item.distance<.001&&item.clipDistance<.001&&item.lastDistance<.001),
  `Wide trouser hem and clip must meet at the actual ankle: ${JSON.stringify(wideHems)}`);
require('node:assert/strict').ok(wideHems.every(item=>item.legs===50
  ?item.overlap>4.49:item.legs>=100?item.overlap<.001:item.overlap>0),
  'Short legs need a shoe-covering trouser extension; normal legs do not');
const flareWidths=vm.runInContext('[wideLegExtraWidth(31,5.5),wideLegExtraWidth(31,10.5)]',context);
require('node:assert/strict').ok(flareWidths[1]>flareWidths[0]*1.8,
  'The loose wide pants must have a visibly broader hem');
console.log('Wide trouser hems and clips meet the leg ends in standing and dragged poses.');

const longestLegWidths=vm.runInContext(`(()=>{
  controls.legs.value='180';
  const results=[];
  for(const width of [60,100,150]){
    const warp=buildWarp({body:100,width,arms:100,legs:180,head:100});
    dragPoses.length=0;
    const left=legGeometry('left',warp),right=legGeometry('right',warp);
    for(let i=4;i<28;i++)results.push({width,segment:i,
      difference:Math.abs(left.hose[i].width-right.hose[i].width)});
  }
  return results;
})()`,context);
require('node:assert/strict').ok(longestLegWidths.every(item=>item.difference<.02),
  `Right leg grows wider than left at maximum length: ${JSON.stringify(
    longestLegWidths.filter(item=>item.difference>=.02).slice(0,5))}`);
console.log('At maximum length, both leg shafts keep the same width.');

const mechanics=vm.runInContext(`(()=>{
  let count=0;
  const close=(a,b,label)=>{if(Math.abs(a-b)>1e-6)throw Error(label+': '+a+' != '+b);};
  for(const legs of [50,100,180])for(const width of [60,100,150]){
    controls.legs.value=String(legs);controls.width.value=String(width);
    const warp=buildWarp({body:100,width,arms:100,legs,head:100});
    dragPoses.length=0;
    const resting={left:legGeometry('left',warp),right:legGeometry('right',warp)};
    for(const part of ['head','body','leftLeg','rightLeg'])
      for(const [x,y] of [[0,0],[0,10],[0,30],[0,100],[-100,0],[100,0],[0,-100],[-200,-100],[200,200]]){
        dragPoses.length=0;dragPoses.push(Object.assign(createDragPose(part),{x,y}));
        for(const side of ['left','right']){
          const g=legGeometry(side,warp),r=resting[side];
          close(Math.hypot(g.knee.x-g.hip.x,g.knee.y-g.hip.y),g.thighLength,'thigh length');
          close(Math.hypot(g.ankle.x-g.knee.x,g.ankle.y-g.knee.y),g.shinLength,'shin length');
          close(g.thighLength+g.shinLength,g.boneLength,'total bone length');
          if(g.boneLength<r.restLength-1e-6 ||
              g.boneLength>r.restLength*LEG_MAX_STRETCH+1e-6)
            throw Error('leg stretched beyond its small range');
          if(part!==side+'Leg'){
            close(g.bootToe.x,r.bootToe.x,'planted toe x');
            close(g.bootToe.y,r.bootToe.y,'planted toe y');
            close(Math.hypot(g.bootOuter.x-g.bootToe.x,g.bootOuter.y-g.bootToe.y),
              Math.hypot(r.bootOuter.x-r.bootToe.x,r.bootOuter.y-r.bootToe.y),
              'planted shoe size');
            if(Math.abs(g.heelAngle)<1e-6)for(let i=0;i<2;i++){
              close(g.sole[i].x,r.sole[i].x,'planted sole x');
              close(g.sole[i].y,r.sole[i].y,'planted sole y');
            }
          }count++;
        }
      }
  }return count;
})()`,context);
console.log(`${mechanics} poses: bounded leg stretch, shoe size and planted toes passed.`);

const stretch=vm.runInContext(`(()=>{
  controls.legs.value='100';controls.width.value='100';
  dragPoses.length=0;
  const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  const resting=legGeometry('left',warp);
  const outward=createDragPose('leftLeg');
  Object.assign(outward,limitDrag(outward,-200,-100));
  dragPoses.push(outward);
  const extended=legGeometry('left',warp);
  dragPoses.length=0;
  const inward=createDragPose('leftLeg');
  Object.assign(inward,limitDrag(inward,15,-25));
  dragPoses.push(inward);
  const folded=legGeometry('left',warp);
  return {rest:resting.restLength,extended:extended.boneLength,
    extendedReach:Math.hypot(extended.ankle.x-extended.hip.x,
      extended.ankle.y-extended.hip.y),folded:folded.boneLength};
})()`,context);
require('node:assert/strict').ok(stretch.extended>stretch.rest*1.1,
  'outward drag visibly lengthens the leg');
require('node:assert/strict').ok(stretch.extended<=stretch.rest*1.28+1e-6,
  'leg stretch stops at the modest cap');
require('node:assert/strict').ok(stretch.extendedReach>stretch.rest,
  'the stretched ankle actually moves beyond the resting reach');
require('node:assert/strict').equal(stretch.folded,stretch.rest,
  'inward drag bends the original-length bones');
console.log('Outward stretch and inward knee fold passed.');

const carriedStretch=vm.runInContext(`(()=>{
  const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  const check=(part,x,y,side)=>{
    dragPoses.length=0;
    const rest=legGeometry(side,warp);
    const pose=createDragPose(part);
    Object.assign(pose,limitDrag(pose,x,y));dragPoses.push(pose);
    const moved=legGeometry(side,warp);
    return {ratio:moved.boneLength/rest.restLength,
      toeShift:Math.hypot(moved.bootToe.x-rest.bootToe.x,
        moved.bootToe.y-rest.bootToe.y)};
  };
  return [check('body',0,-100,'left'),check('head',0,-100,'right'),
    check('leftHand',100,0,'left'),check('rightHand',-100,0,'right')];
})()`,context);
for(const pose of carriedStretch){
  require('node:assert/strict').ok(pose.ratio>1.07,
    'dragging another part can stretch a leg');
  require('node:assert/strict').ok(pose.ratio<=1.28+1e-6,
    'carried stretch respects the same cap');
  require('node:assert/strict').ok(pose.toeShift<1e-6,
    'the supporting foot stays planted');
}
console.log('Body, head and hand drags stretch planted legs within the cap.');

const waistJoins=vm.runInContext(`(()=>{
  dragPoses.length=0;
  dragPoses.push(Object.assign(createDragPose('head'),
    limitDrag({part:'head'},0,-200)));
  const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  for(const side of ['left','right']){
    const g=legGeometry(side,warp);
    const p=g.hose[0].d.match(/-?[0-9.]+/g).map(Number);
    const sign=side==='left'?-1:1,dx=p[2]-p[0],dy=p[3]-p[1];
    const span=Math.hypot(dx,dy),radius=(g.hose[0].width+1)/2;
    const outer={x:p[0]+sign*dy/span*radius,
      y:p[1]-sign*dx/span*radius};
    const source=side==='left'?[28.4591,125.881]:[65.8486,125.059];
    const role=classifyPoint(source[0],source[1],'mixed');
    const waist=applyDragPose(warp(source[0],source[1],role),
      source[0],source[1],role,warp);
    if(Math.hypot(outer.x-waist.x,outer.y-waist.y)>.1)
      throw Error('stretched thigh outline parts from the waist');
  }
  return 2;
})()`,context);
console.log(`${waistJoins} stretched thighs: waist outline meets both legs.`);

const turns=vm.runInContext(`(()=>{
  const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  const check=(part,x)=>{
    dragPoses.length=0;
    const pose=createDragPose(part);
    Object.assign(pose,limitDrag(pose,x,0));dragPoses.push(pose);
    const top=applyDragPose(warp(47,35,'head'),47,35,'head',warp);
    const neck=applyDragPose(warp(47,56,'head'),47,56,'head',warp);
    const left=legGeometry('left',warp);
    return {angle:Math.atan2(top.x-neck.x,neck.y-top.y),
      toe:left.bootToe};
  };
  return {headLeft:check('head',-100),headRight:check('head',100),
    bodyLeft:check('body',-100),bodyRight:check('body',100),
    restToe:(dragPoses.length=0,legGeometry('left',warp).bootToe)};
})()`,context);
for(const [left,right] of [[turns.headLeft,turns.headRight],
  [turns.bodyLeft,turns.bodyRight]]){
  require('node:assert/strict').ok(left.angle<-.1 && right.angle>.1,
    'sideways head/body drags rotate in the drag direction');
  for(const pose of [left,right]){
    require('node:assert/strict').ok(Math.hypot(pose.toe.x-turns.restToe.x,
      pose.toe.y-turns.restToe.y)<1e-6,'turn keeps the supporting toe fixed');
  }
}
console.log('Head and body rotate both ways around planted feet.');

const upperRange=vm.runInContext(`(()=>{
  const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  const move=(part,x,y)=>{
    dragPoses.length=0;
    const pose=createDragPose(part);
    Object.assign(pose,limitDrag(pose,x,y));dragPoses.push(pose);
    const sourceY=part==='head'?30:92;
    const start=warp(47,sourceY,part);
    const end=applyDragPose(start,47,sourceY,part,warp);
    return {x:end.x-start.x,y:end.y-start.y};
  };
  return ['head','body'].map(part=>({right:move(part,100,0),
    left:move(part,-100,0),down:move(part,0,100)}));
})()`,context);
for(const part of upperRange){
  require('node:assert/strict').ok(part.right.x>30 && part.left.x<-30,
    'head and body retain their lateral drag range');
  require('node:assert/strict').ok(part.down.y>48,
    'head and body can descend deeper while the feet stay planted');
}
console.log('Expanded head and body drag range passed.');

const circularReach=vm.runInContext(`(()=>{
  const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  return ['head','body'].map(part=>{
    const reach=upperBodyReach(createDragPose(part),warp);
    const poses=[[100,100],[0,100],[-100,100],[500,-500]].map(([x,y])=>{
      dragPoses.length=0;
      const pose=createDragPose(part);
      Object.assign(pose,limitDrag(pose,x,y));dragPoses.push(pose);
      const sourceY=part==='head'?30:92;
      const end=applyDragPose(reach.reference,47,sourceY,part,warp);
      return {x,y,reach:Math.hypot(reach.reference.x+pose.x-reach.center.x,
        reach.reference.y+pose.y-reach.center.y),angle:upperBodyTurn(pose,warp),
        movedX:end.x-reach.reference.x,movedY:end.y-reach.reference.y};
    });
    return {part,radius:reach.radius,poses};
  });
})()`,context);
for(const {part,radius,poses} of circularReach){
  for(const pose of poses)
    require('node:assert/strict').ok(pose.reach<=radius+1e-6,
      'upper body target remains inside its fixed reach circle');
  require('node:assert/strict').ok(poses[0].angle>.2 && poses[0].angle<.4,
    'diagonal squat keeps a moderate torso angle');
  require('node:assert/strict').ok(poses[0].movedX>(part==='head'?35:20)
    &&poses[0].movedY>30,
    'diagonal drag translates the grabbed part as well as turning it');
  require('node:assert/strict').ok(Math.abs(poses[1].angle)<1e-6
    &&Math.abs(poses[1].movedX)<1e-6,
    'straight downward drag does not flip the body sideways');
  require('node:assert/strict').ok(poses[3].movedY<=1e-6,
    'an upward diagonal pull never flips into a downward motion');
}
console.log('Fixed circular reach, deeper diagonal travel and moderate turn passed.');

const downwardTurn=vm.runInContext(`(()=>{
  const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  return ['head','body'].map(part=>{
    dragPoses.length=0;
    const pose=createDragPose(part);
    Object.assign(pose,limitDrag(pose,100,0));dragPoses.push(pose);
    const y=part==='head'?30:92;
    const original=warp(47,y,part);
    const moved=applyDragPose(original,47,y,part,warp);
    const top=applyDragPose(warp(47,35,'head'),47,35,'head',warp);
    const neck=applyDragPose(warp(47,56,'head'),47,56,'head',warp);
    return {part,drop:moved.y-original.y,
      angle:Math.atan2(top.x-neck.x,neck.y-top.y)};
  });
})()`,context);
for(const turn of downwardTurn){
  require('node:assert/strict').ok(turn.angle>.3 && turn.angle<.55,
    'sideways drag rotates the upper body without over-tilting it');
  require('node:assert/strict').ok(turn.drop>(turn.part==='head'?8:3),
    'the rotation carries the grabbed part downward along an arc');
}
console.log('Head and body keep a restrained sideways turn.');

const deepLean=vm.runInContext(`(()=>{
  const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  return [50,100,150].map(x=>{
    dragPoses.length=0;
    const pose=createDragPose('body');
    Object.assign(pose,limitDrag(pose,x,200));dragPoses.push(pose);
    const start=warp(47,92,'body');
    const end=applyDragPose(start,47,92,'body',warp);
    const right=legGeometry('right',warp);
    return {down:end.y-start.y,heel:right.heelAngle,
      toe:right.bootToe,turn:upperBodyTurn(pose,warp)};
  });
})()`,context);
require('node:assert/strict').ok(deepLean[2].down>30,
  'the body can stay low during an outward squat');
require('node:assert/strict').ok(deepLean[2].turn<.4,
  'the outward squat does not over-rotate the torso');
require('node:assert/strict').ok(deepLean[2].heel>deepLean[1].heel
  &&deepLean[1].heel>deepLean[0].heel,
  'the loaded heel rises progressively as the deep squat moves outward');
console.log('Deep outward squat lowers the body and progressively lifts the loaded heel.');

const diagonalKnees=vm.runInContext(`(()=>{
  const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  return ['body','head'].flatMap(part=>[-100,100].map(x=>{
    dragPoses.length=0;
    const pose=createDragPose(part);
    Object.assign(pose,limitDrag(pose,x,100));dragPoses.push(pose);
    const leg=legGeometry(x<0?'left':'right',warp);
    return {knee:leg.knee.y,ankle:leg.ankle.y};
  }));
})()`,context);
for(const leg of diagonalKnees)
  require('node:assert/strict').ok(leg.knee<leg.ankle-2,
    'deep diagonal drag keeps the folded knee above the foot');

const squat=vm.runInContext(`(()=>{
  dragPoses.length=0;
  const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  const standing=legGeometry('left',warp);
  const rightStanding=legGeometry('right',warp);
  dragPoses.push(Object.assign(createDragPose('body'),{y:100}));
  const folded=['left','right'].map(side=>legGeometry(side,warp));
  return {standingCrease:standing.creaseOpacity,
    standingBoot:standing.bootOutline,foldedBoot:folded[0].bootOutline,
    rightStandingHeel:rightStanding.bootHeel, rightFoldedHeel:folded[1].bootHeel,
    rightStandingToe:rightStanding.bootToe,rightFoldedToe:folded[1].bootToe,
    folded:folded.map(g=>({hipY:g.hip.y,soleY:Math.max(...g.sole.map(p=>p.y)),
      crease:g.creaseOpacity,kneeX:g.knee.x,hipX:g.hip.x,
      footX:g.foot.x,bootInner:g.bootInner,bootOuter:g.bootOuter,
      ankleInner:g.ankleInnerEdge,ankleOuter:g.ankleOuterEdge}))};
})()`,context);
require('node:assert/strict').equal(squat.standingCrease,0);
require('node:assert/strict').equal(squat.foldedBoot,squat.standingBoot,
  'left squat keeps the exact reference shoe silhouette');
require('node:assert/strict').ok(squat.rightFoldedHeel.x<squat.rightStandingHeel.x,
  'right heel tucks inward in a squat');
require('node:assert/strict').equal(squat.rightFoldedToe.x,squat.rightStandingToe.x,
  'right toe remains anchored');
for(const leg of squat.folded){
  require('node:assert/strict').ok(leg.soleY-leg.hipY<18,'pelvis reaches the sole');
  require('node:assert/strict').ok(leg.crease>.75,'folded leg has a visible crease');
  for(const [edge,boot] of [[leg.ankleInner,leg.bootInner],
    [leg.ankleOuter,leg.bootOuter]]){
    require('node:assert/strict').ok(Math.hypot(edge.x-boot.x,edge.y-boot.y)<1e-6,
      'calf edge meets the shoe corner without an overlay stroke');
  }
}
console.log('Deep squat and folded-leg creases passed.');

const lean=vm.runInContext(`(()=>{
  dragPoses.length=0;
  const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  const resting=legGeometry('left',warp);
  const pose=createDragPose('body');
  Object.assign(pose,limitDrag(pose,-100,100));dragPoses.push(pose);
  return {left:legGeometry('left',warp),right:legGeometry('right',warp),
    restInnerY:resting.bootInner.y};
})()`,context);
require('node:assert/strict').ok(lean.left.heelAngle<-.05,
  'compressed left leg raises its heel');
require('node:assert/strict').ok(lean.left.bootInner.y<lean.restInnerY,
  'heel actually rises off the ground');
require('node:assert/strict').equal(lean.right.heelAngle,0,
  'opposite foot remains flat');
console.log('Extreme side lean rolls the compressed foot without changing its size.');

const referencePose=vm.runInContext(`(()=>{
  dragPoses.length=0;
  const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  return ['left','right'].map(side=>{
    const g=legGeometry(side,warp);
    return {side,start:g.centerline[0],end:g.centerline[32],boot:g.bootOutline};
  });
})()`,context);
require('node:assert/strict').ok(
  referencePose[0].boot.startsWith('M16.3365 179.496'));
require('node:assert/strict').ok(
  referencePose[1].boot.startsWith('M85.1287 180.658'));
require('node:assert/strict').ok(
  referencePose[0].boot.includes('1.8314 190.66'));
require('node:assert/strict').ok(
  referencePose[1].boot.includes('99.0496 190.66'));
console.log('Standing feet follow the reference SVG.');

const dragLifecycle=vm.runInContext(`(()=>{
  const results=[];
  for(const part of ['body','head','leftHand','rightHand','leftLeg','rightLeg'])
    for(const sign of [-1,1]){
    dragPoses.length=0;
    const pose=createDragPose(part);
    const drag={pose,x:0,y:0,intentX:0,intentY:0};
    const pointer={x:sign*150,y:200};
    const first=projectedDragPosition(drag,pointer);
    Object.assign(pose,first);
    drag.x=pointer.x;drag.y=pointer.y;
    let held=true;
    for(let i=0;i<12;i++){
      const next=projectedDragPosition(drag,pointer);
      held=held && Math.hypot(next.x-first.x,next.y-first.y)<1e-8;
      Object.assign(pose,next);
    }
    dragPoses.push(pose);
    activeDrag={pose};springTime=0;
    springStep(16);
    held=held && Math.hypot(pose.x-first.x,pose.y-first.y)<1e-8;
    activeDrag=undefined;
    for(let frame=2;frame<700 && dragPoses.length;frame++)
      springStep(frame*16);
    results.push({part,sign,held,recovered:dragPoses.length===0,
      firstX:first.x,firstY:first.y});
  }
  return results;
})()`,context);
for(const result of dragLifecycle){
  require('node:assert/strict').ok(result.held,
    'holding a lower-corner drag does not collapse toward the middle');
  require('node:assert/strict').ok(result.recovered,
    'the pose returns fully after releasing a lower-corner drag');
}
console.log('Both lower corners hold steady and spring back after release.');
