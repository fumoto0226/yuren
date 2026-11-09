const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const inputs=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:'100'}));
const c=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>inputs},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],c);
const results=JSON.parse(vm.runInContext(`JSON.stringify((()=>{
 const node=()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];}});
 return ['left','right'].map(side=>{
  const arm={side,segments:Array.from({length:32},()=>({back:node(),front:node()})),glovePanel:node(),gloveEdges:node()};
  updateArmCuffClips(arm,{sleeveEnd:31,batArmor:true});
  const armor=arm.segments.map(({back,front})=>[{...back.attrs},{...front.attrs}]);
  const gauntlet=[{...arm.glovePanel.attrs},{...arm.gloveEdges.attrs}];
  updateArmCuffClips(arm,{sleeveEnd:20,isTee:true});
  const shortSleeve={last:arm.segments[31].front.attrs,glove:{...arm.glovePanel.attrs}};
  return {side,armor,gauntlet,shortSleeve};
 });
})())`,c));
for(const {side,armor,gauntlet,shortSleeve} of results){
 for(let i=24;i<32;i++)for(const attrs of armor[i])assert.equal(attrs['clip-path'],`url(#${side}-sleeve-clip)`,'Every armor sample reaching the cuff is clipped to the fabric side, including the terminal sample');
 for(let i=27;i<32;i++)for(const attrs of armor[i])assert.equal(attrs['stroke-linecap'],'butt','No rounded sleeve cap protrudes into the glove');
 for(const attrs of gauntlet)assert.equal(attrs['clip-path'],`url(#${side}-skin-clip)`,'The gauntlet above the wrist stays underneath the sleeve');
 assert.equal(shortSleeve.glove['clip-path'],undefined,'Changing to a short sleeve exposes the gauntlet again');
 assert.equal(shortSleeve.last['clip-path'],undefined,'Armor cuff clipping is removed from exposed wrist samples');
}
console.log('Batfish cuffs: both sleeves and gauntlets share a flat wrist cut; no round cap or gauntlet side sliver, and short-sleeve switching restores exposed gloves.');
const geometry=vm.runInContext(`(()=>{
 let cases=0;
 for(const side of ['left','right'])for(const arms of [55,100,240])for(const [x,y] of [[0,0],[-65,-15],[60,-70],[-30,-100],[30,30]]){
  dragPoses.length=0;dragPoses.push(Object.assign(createDragPose(side+'Hand'),{x,y}));
  const shape=armGeometry(side,buildWarp({body:100,width:100,arms,legs:100,head:100}));
  const values=text=>text.match(/-?\\d+(?:\\.\\d+)?/g).map(Number);
  const sleeve=values(limbClipPoints(shape,31,false)),glove=values(limbClipPoints(shape,31,true)),cuff=values(cuffPath(shape,31));
  if([...sleeve,...glove,...cuff].some(v=>!Number.isFinite(v)))throw Error('Invalid cuff geometry');
  const a={x:sleeve[0],y:sleeve[1]},b={x:sleeve[2],y:sleeve[3]};
  const dist=(px,py)=>Math.abs((b.x-a.x)*(py-a.y)-(b.y-a.y)*(px-a.x))/Math.hypot(b.x-a.x,b.y-a.y);
  if(dist(cuff[0],cuff[1])>.001||dist(cuff[2],cuff[3])>.001)throw Error('Cuff line diverges from sleeve/glove partition');
  if(sleeve.slice(0,4).some((v,i)=>v!==glove[i]))throw Error('Sleeve and glove do not share a cut');
  cases++;
 }
 return cases;
})()`,c);
assert.equal(geometry,30);
console.log(`${geometry} left/right, arm-length and bent-arm cases keep sleeve, cuff and glove on the same finite cut line.`);
