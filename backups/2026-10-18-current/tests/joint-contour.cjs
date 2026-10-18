const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const root=require('path').resolve(__dirname,'..');
const inputs=['body','width','arms','legs','head'].map(key=>({dataset:{control:key},value:'100'}));
const context=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>inputs},
  requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(root+'/script.js','utf8').split('resetButton.addEventListener')[0],context);

// Inspect the rendered cubic's actual cap tangent and the centre of its
// one-unit black outline. Coincident skeleton points alone do not prove that
// two visible edges meet. No pointer gesture is used: slider-only poses were
// the missing regression case.
const result=vm.runInContext(`(()=>{
  let count=0,worst=0;
  const contourPoint=(segment,sign,end=false)=>{
    const p=segment.d.match(/-?[0-9.]+/g).map(Number);
    const dx=end?p[6]-p[4]:p[2]-p[0],dy=end?p[7]-p[5]:p[3]-p[1];
    const radius=(segment.width+1)/2,span=Math.hypot(dx,dy);
    return {x:p[end?6:0]+sign*dy/span*radius,
      y:p[end?7:1]-sign*dx/span*radius};
  };
  const check=(point,target)=>{
    const gap=Math.hypot(point.x-target.x,point.y-target.y);
    if(!Number.isFinite(gap))throw Error('invalid visible joint');
    worst=Math.max(worst,gap);count++;
  };
  for(const body of [15,100,220])for(const width of [60,100,150])
    for(const arms of [55,100,240])for(const legs of [50,100,180])
      for(const head of [70,100,140]){
        const config={body,width,arms,legs,head};
        for(const key in config)controls[key].value=String(config[key]);
        const warp=buildWarp(config);
        dragPoses.length=0;
        for(const side of ['left','right']){
          const sign=side==='left'?-1:1;
          const arm=armGeometry(side,warp),leg=legGeometry(side,warp);
          const neck=side==='left'?[26.1046,56.4524]:[67.7274,55.0466];
          const waist=side==='left'?[28.4591,125.881]:[65.8486,125.059];
          check(contourPoint(arm.hose[0],sign),warp(...neck,'head'));
          check(contourPoint(leg.hose[0],sign),warp(...waist,'body'));
          check(contourPoint(arm.hose[31],sign,true),arm.palmOuter);
          check(contourPoint(arm.hose[31],-sign,true),arm.palmInner);
        }
      }
  return {count,worst};
})()`,context);
assert.ok(result.worst<.05,`visible joint gap: ${result.worst}`);
console.log(`${result.count} slider-only shoulder, waist and wrist edges meet (max error ${result.worst.toFixed(4)}).`);
