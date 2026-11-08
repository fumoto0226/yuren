const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({setAttribute(){}}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],c);
const rows=vm.runInContext(`(()=>{
 selectedDecorations.helmet='yellow-spiky-hair';selectedDecorations.shoes='navy-sandals';const rows=[];
 for(const skin of [null,'flesh','flesh-6','little-yellow-fish'])for(const size of [60,100,150])for(const side of ['left','right']){
 selectedDecorations.skin=skin;dragPoses.length=0;dragPoses.push(Object.assign(createDragPose(side+'Leg'),{x:side==='left'?45:-45,y:-35}));
 const warp=buildWarp({body:100,width:size,arms:100,legs:size,head:size}),shape=legGeometry(side,warp);
 rows.push({color:skinColor(),sandals:colorblockShoeDetails(shape,side,skinColor()),hair:yellowSpikyHairSpecs.map(s=>transformPath(s.source,(x,y)=>warp(x,y,s.role))),horn:hornHidden()});
 }
 return rows;
})()`,c);
for(const r of rows){assert.ok(r.sandals.includes(`fill="${r.color}"`),'Toe opening tracks selected skin');assert.ok(r.horn);for(const d of [r.sandals,...r.hair])assert.ok(!/NaN|Infinity|undefined/.test(d));}
for(const file of ['yellow-spiky-hair','navy-sandals'])assert.ok(fs.existsSync(path.join(__dirname,'../svg',file+'.svg')));
console.log('Spiky hair and sandals: 24 skin/size/bent-leg cases keep finite geometry and skin-colored toe openings.');
const variants=vm.runInContext(`Object.entries({...spikyHairVariants,...longBraidVariants,...topknotVariants}).map(([id,v])=>{selectedDecorations.helmet=id;return {id,color:v.color,hidden:hornHidden(),registered:decorationCatalog.helmet.some(item=>item.id===id)};})`,c);
for(const v of variants){assert.ok(v.hidden&&v.registered);const svg=fs.readFileSync(path.join(__dirname,'../svg',v.id+'.svg'),'utf8');assert.ok(svg.includes(v.color)&&!svg.includes('NaN'),'Every hair color has a matching valid thumbnail');}
