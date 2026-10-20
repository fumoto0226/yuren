const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const inputs=['body','width','arms','legs','head'].map(key=>({dataset:{control:key},value:'100'}));
const context=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>inputs},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],context);
const result=JSON.parse(vm.runInContext(`JSON.stringify((()=>{
 let maxError=0,cases=0;
 for(const body of [15,100,220])for(const width of [60,100,150])for(const legs of [50,100,180]){
  controls.legs.value=legs;
  for(const pose of [null,['head',8,25],['leftLeg',20,-25]]){
   dragPoses.length=0;
   if(pose)dragPoses.push(Object.assign(createDragPose(pose[0]),{x:pose[1],y:pose[2]}));
   const warp=buildWarp({body,width,arms:100,legs,head:100});
   const coords=redTrianglePath(warp).match(/-?\\d+(?:\\.\\d+)?/g).map(Number);
   [[49.4914,132.8],[44.6804,132.8]].forEach(([x,y],i)=>{
    const expected=applyDragPose(warp(x,y,'legs'),x,y,'legs',warp);
    const at=coords.length-4+i*2;
    maxError=Math.max(maxError,Math.hypot(coords[at]-expected.x,coords[at+1]-expected.y));
   });cases++;
  }
 }
 Object.assign(selectedDecorations,{skin:'milk-frog',suit:'navy-suit',helmet:'yellow-hat',neck:'scarf',shirt:'suit-jacket',pants:'suit-trousers',shoes:'black-dress-shoes',outerwear:'green-vest',gloves:'plain'});
 const before={...selectedDecorations};
 for(const input of Object.values(controls))input.value='150';
 resetControls();
 return {maxError,cases,before,after:{...selectedDecorations},values:Object.values(controls).map(input=>Number(input.value)),poses:dragPoses.length};
})())`,context));
assert.ok(result.maxError<.0001,`Triangle hem matches the crotch (${result.maxError})`);
assert.deepEqual(result.after,result.before,'Reset preserves every clothing, skin and suit selection');
assert.ok(result.values.every(value=>value===100),'Reset restores every body proportion');
assert.equal(result.poses,0,'Reset restores standing pose');
console.log(`${result.cases} triangle fits across body sizes, widths, leg lengths and poses; reset preserves clothing and restores proportions/pose.`);
