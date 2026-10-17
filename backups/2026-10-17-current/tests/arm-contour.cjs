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
  for(const arms of [55,100,160,240])for(const width of [60,100,150])
    for(const part of ['leftHand','rightHand','body','head'])
      for(const x of [-100,-40,0,40,100])for(const y of [-100,-40,0,40,100]){
        controls.arms.value=String(arms);controls.width.value=String(width);
        dragPoses.length=0;
        dragPoses.push(Object.assign(createDragPose(part),limitDrag({part},x,y)));
        const warp=buildWarp({body:100,width,arms,legs:100,head:100});
        for(const side of ['left','right']){
          const g=armGeometry(side,warp),p=g.centerline;
          if(g.hose.length!==32||g.hose.some(segment=>!Number.isFinite(segment.width)
              ||segment.width<=0||/NaN|Infinity/.test(segment.d)))
            failures.push({arms,width,part,x,y,side,type:'invalid path'});
          if(/NaN|Infinity/.test(g.crease))
            failures.push({arms,width,part,x,y,side,type:'invalid crease'});
          for(let i=0;i<p.length-1;i++)for(let j=i+2;j<p.length-1;j++)
            if(intersect(p[i],p[i+1],p[j],p[j+1]))
              failures.push({arms,width,part,x,y,side,type:'centerline crossing'});
          count++;
        }
      }
  return {count,failures};
})()`,context);
require('node:assert/strict').equal(sweep.failures.length,0,
  JSON.stringify(sweep.failures.slice(0,10)));
console.log(`${sweep.count} rubber-hose arm poses: valid continuous spines.`);

const deepFold=vm.runInContext(`(()=>{
  const folds=[];
  for(const arms of [55,100,240]){
    controls.arms.value=String(arms);
    const warp=buildWarp({body:100,width:100,arms,legs:100,head:100});
    for(const side of ['left','right']){
      const left=side==='left';
      const hand=warp(left?10:87,104,'arms');
      const shoulder=warp(left?27.4:67.55,left?70:68.45,'arms');
      dragPoses.length=0;
      dragPoses.push(Object.assign(createDragPose(side+'Hand'),
        limitDrag({part:side+'Hand'},shoulder.x-hand.x,shoulder.y-hand.y)));
      const g=armGeometry(side,warp);
      const upper={x:g.elbow.x-g.shoulder.x,y:g.elbow.y-g.shoulder.y};
      const lower={x:g.wrist.x-g.elbow.x,y:g.wrist.y-g.elbow.y};
      folds.push({arms,side,
        reach:Math.hypot(g.wrist.x-g.shoulder.x,g.wrist.y-g.shoulder.y)/g.restLength,
        cosine:(upper.x*lower.x+upper.y*lower.y)/(g.upperLength*g.foreLength)});
    }
  }
  return folds;
})()`,context);
require('node:assert/strict').ok(deepFold.every(({reach,cosine})=>
  reach<.35&&cosine<-.6),
  `Arms cannot fold back near the shoulder: ${JSON.stringify(deepFold)}`);
console.log('Short and long arms fold back at the elbow near the shoulder.');

const mechanics=vm.runInContext(`(()=>{
  let count=0;
  const close=(a,b,label)=>{if(Math.abs(a-b)>1e-6)throw Error(label+': '+a+' != '+b);};
  const span=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  for(const arms of [55,100,240])for(const width of [60,100,150]){
    controls.arms.value=String(arms);controls.width.value=String(width);
    const warp=buildWarp({body:100,width,arms,legs:100,head:100});
    dragPoses.length=0;
    const resting={left:armGeometry('left',warp),right:armGeometry('right',warp)};
    for(const part of ['head','body','leftHand','rightHand','leftWrist','rightWrist'])
      for(const [x,y] of [[0,0],[0,10],[0,30],[0,100],[-100,0],[100,0],[0,-100],[-200,-100],[200,200]]){
        dragPoses.length=0;
        dragPoses.push(Object.assign(createDragPose(part),
          part.endsWith('Wrist')?{angle:Math.max(-1,Math.min(1,x/100))}:{x,y}));
        for(const side of ['left','right']){
          const g=armGeometry(side,warp),r=resting[side];
          close(span(g.elbow,g.shoulder),g.upperLength,'upper arm length');
          close(span(g.wrist,g.elbow),g.foreLength,'forearm length');
          close(g.upperLength+g.foreLength,g.boneLength,'total bone length');
          // A folded arm draws its bones in a little so it stays a smooth
          // tube instead of bunching around a jutting elbow, so the range
          // runs from that fold floor up to the stretch cap.
          if(g.boneLength<r.restLength*ARM_MIN_FOLD-1e-6 ||
              g.boneLength>r.restLength*ARM_MAX_STRETCH+1e-6)
            throw Error('arm length left its range: '+g.boneLength);
          // The palm is rigid: its chord keeps the resting width, stays
          // centred on the wrist, and the hand point keeps its own offsets.
          close(span(g.palmOuter,g.palmInner),span(r.palmOuter,r.palmInner),
            'palm chord width');
          close(span(g.palmOuter,g.wrist),span(r.palmOuter,r.wrist),'palm outer');
          close(span(g.palmInner,g.wrist),span(r.palmInner,r.wrist),'palm inner');
          close(span(g.palm,g.wrist),span(r.palm,r.wrist),'hand centre');
          count++;
        }
      }
  }return count;
})()`,context);
console.log(`${mechanics} poses: bounded arm stretch and a rigid palm passed.`);

const joint=vm.runInContext(`(()=>{
  let count=0;
  // The sleeve has to end exactly on the midpoint of the palm's chord at
  // every pose, including a turned hinge, so no patch is needed between them.
  for(const arms of [55,100,240])for(const part of ['leftHand','rightHand','head']){
    controls.arms.value=String(arms);controls.width.value='100';
    const warp=buildWarp({body:100,width:100,arms,legs:100,head:100});
    for(const [x,y] of [[0,0],[-60,-40],[60,40],[-120,30],[120,-90],[0,80]])
      for(const angle of [0,.5,-.5,1.2]){
        dragPoses.length=0;
        dragPoses.push(Object.assign(createDragPose(part),limitDrag({part},x,y)));
        for(const side of ['left','right'])
          dragPoses.push(Object.assign(createDragPose(side+'Wrist'),{angle}));
        for(const side of ['left','right']){
          const g=armGeometry(side,warp);
          const last=g.centerline[32];
          if(Math.hypot(last.x-g.wrist.x,last.y-g.wrist.y)>1e-6)
            throw Error('hose does not end on the wrist');
          const centre={x:(g.palmOuter.x+g.palmInner.x)/2,
            y:(g.palmOuter.y+g.palmInner.y)/2};
          if(Math.hypot(centre.x-g.wrist.x,centre.y-g.wrist.y)>1e-6)
            throw Error('palm chord is not centred on the wrist');
          if(Math.abs(g.hose[31].width-(2*g.wristWidth-1))>1e-9)
            throw Error('wrist span left the palm chord: '+g.hose[31].width);
          count++;
        }
      }
  }return count;
})()`,context);
console.log(`${joint} poses: sleeve and palm share one edge.`);

const stretchedJoins=vm.runInContext(`(()=>{
  let count=0;
  const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  for(const side of ['left','right']){
    dragPoses.length=0;
    dragPoses.push(Object.assign(createDragPose(side+'Hand'),
      limitDrag({part:side+'Hand'},side==='left'?-200:200,100)));
    const g=armGeometry(side,warp),sign=side==='left'?-1:1;
    const edge=(index,width)=>{
      const p=g.hose[index].d.match(/-?[0-9.]+/g).map(Number);
      const dx=index===0?p[2]-p[0]:p[6]-p[4];
      const dy=index===0?p[3]-p[1]:p[7]-p[5];
      const span=Math.hypot(dx,dy),radius=(width+1)/2;
      const centre=index===0?{x:p[0],y:p[1]}:{x:p[6],y:p[7]};
      return {x:centre.x+sign*dy/span*radius,
        y:centre.y-sign*dx/span*radius};
    };
    const source=side==='left'?[26.1046,56.4524]:[67.7274,55.0466];
    const shoulder=applyDragPose(warp(source[0],source[1],'head'),
      source[0],source[1],'head',warp);
    if(Math.hypot(edge(0,g.hose[0].width).x-shoulder.x,
      edge(0,g.hose[0].width).y-shoulder.y)>.1)
      throw Error('stretched shoulder outline parts from the head');
    if(Math.hypot(edge(31,g.hose[31].width).x-g.palmOuter.x,
      edge(31,g.hose[31].width).y-g.palmOuter.y)>.75)
      throw Error('stretched wrist outline parts from the palm');
    count++;
  }
  return count;
})()`,context);
console.log(`${stretchedJoins} stretched arms: rendered shoulder and wrist edges meet.`);

const resting=vm.runInContext(`(()=>{
  // With no gesture the hose must reproduce the reference silhouette: its
  // centreline is the reference mid-curve and its widths the drawn widths.
  let worst=0;
  for(const arms of [55,100,240])for(const width of [60,100,150]){
    controls.arms.value=String(arms);controls.width.value=String(width);
    dragPoses.length=0;
    const warp=buildWarp({body:100,width,arms,legs:100,head:100});
    for(const side of ['left','right']){
      const g=armGeometry(side,warp);
      const ends=[[g.shoulder,g.centerline[0]],[g.wrist,g.centerline[32]]];
      for(const [a,b] of ends) worst=Math.max(worst,Math.hypot(a.x-b.x,a.y-b.y));
      // The first span is sampled at its own middle, so it only has to stay
      // near the attachment. The last one is pinned to the palm chord.
      const first=g.hose[0].width;
      if(Math.abs(first-(2*g.shoulderWidth-1))>.75)
        throw Error('resting shoulder width drifted: '+first);
      if(Math.abs(g.hose[31].width-(2*g.wristWidth-1))>1e-9)
        throw Error('wrist span left the palm chord: '+g.hose[31].width);
      if(g.creaseOpacity>1e-9) throw Error('a resting arm shows an elbow crease');
      if(g.turn>1e-9) throw Error('a resting arm reports a shoulder turn');
    }
  }
  return worst;
})()`,context);
require('node:assert/strict').ok(resting<1e-6,'resting endpoints drifted: '+resting);
console.log('resting arms: reference widths, no crease, endpoints exact.');
