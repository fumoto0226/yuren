const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const ctx=vm.createContext({document:{querySelector:()=>({setAttribute(){}}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],ctx);
const r=vm.runInContext(`(()=>{
 applyDecorationSelection('suit','worker-suit');const selected={...selectedDecorations},cases=[];
 for(const legs of [50,100,180])for(const width of [60,100,150])for(const offset of [[0,0,'head'],[0,45,'head'],[40,-50,'leftLeg'],[-40,-70,'rightLeg']]){
  dragPoses.length=0;dragPoses.push(Object.assign(createDragPose(offset[2]),{x:offset[0],y:offset[1]}));
  const warp=buildWarp({body:100,width,arms:100,legs,head:100});
  for(const side of ['left','right']){
   const shape=legGeometry(side,warp);
   cases.push({nativeShoe:workerBootShoe(shape).bootFill,outline:workerBootShoe(shape).bootOutline,cover:bootCoversPants(shape,5.5),tooWide:bootCoversPants(shape,30),boot:workerBootMarkup(shape,side,legs,5.5),body:workerOuterMarkup(warp),sleeve:workerSleeveMarkup(armGeometry(side,warp),side+'-worker-test',alohaSleeveStyles['worker-jacket'])});
  }
 }
 return {selected,cases,collars:workerCollarSources,strap:workerHatSpecs[0].source,topExtra:workerBootExtra(19),ankleExtra:workerBootExtra(32),color:skinColor(),flare:widePantFlares['worker-trousers'],paint:widePantsPaint()};
})()`,ctx);
assert.deepEqual({...r.selected},{skin:'flesh-3',suit:'worker-suit',helmet:'worker-helmet',neck:null,shirt:null,pants:'worker-trousers',cape:null,outerwear:'worker-jacket',shoes:'worker-boots',gloves:null});
const collarNumbers=r.collars.map(d=>(d.match(/-?\d+(?:\.\d+)?/g)||[]).map(Number));
assert.equal(collarNumbers[0].length,collarNumbers[1].length);
for(let i=0;i<collarNumbers[0].length;i++)assert.ok(Math.abs(collarNumbers[1][i]-(i%2?collarNumbers[0][i]:94-collarNumbers[0][i]))<.001,'Worker collar halves must mirror exactly');
assert.ok(r.strap.startsWith('M26.1046 56.4524'),'Helmet strap must reach the real face contour');
assert.equal(r.topExtra,2);assert.equal(r.ankleExtra,3);assert.ok(r.topExtra<4.5,'Boot cuff must be narrower than the previous version');
assert.equal(r.color,'#f9d4ad');assert.equal(r.paint,'#f66b19');assert.equal(r.flare,5.5);
for(const c of r.cases){assert.ok(c.cover);assert.equal(c.tooWide,true);assert.ok(c.boot.includes(c.nativeShoe)&&c.boot.includes(c.outline),'Boot must use the same ankle-widened shoe as its calf outline');assert.ok(c.boot.includes('clip-path='),'Boot tube must use cuff clipping');for(const s of [c.boot,c.body,c.sleeve])assert.ok(!/NaN|Infinity/.test(s));assert.ok(c.sleeve.includes('#ddf29a'));}
console.log(`${r.cases.length} worker size/pose cases: five independent items, loose trousers, wide boot coverage, native shoe and clipped boot cuff, reflective sleeves.`);

const blue=vm.runInContext(`(()=>{
 applyDecorationSelection('suit','blue-worker-suit');
 const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
 return {pieces:{...selectedDecorations},paint:widePantsPaint(),jacket:workerOuterMarkup(warp),helmet:workerHelmetColors[selectedDecorations.helmet],boots:bootProfiles[selectedDecorations.shoes].color,cover:bootCoversPants(legGeometry('left',warp),5.5),worker:isWorkerJacket()};
})()`,ctx);
assert.equal(blue.pieces.skin,'flesh-3');assert.equal(blue.pieces.helmet,'white-worker-helmet');assert.equal(blue.pieces.outerwear,'blue-worker-jacket');assert.equal(blue.pieces.pants,'blue-worker-trousers');assert.equal(blue.pieces.shoes,'gray-worker-boots');assert.equal(blue.paint,'#1d3b68');assert.ok(blue.jacket.includes('#1d3b68'));assert.ok(!blue.jacket.includes('#f66b19'));assert.equal(blue.helmet,'#f4f3ed');assert.equal(blue.boots,'#81868b');assert.ok(blue.cover&&blue.worker);
console.log('Blue worker suit has independent navy garments, grey boots, white helmet and shared fit/layer behavior.');
