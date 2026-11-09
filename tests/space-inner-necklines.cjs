const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],c);
const rows=JSON.parse(vm.runInContext(`JSON.stringify((()=>{
 const keys=['shirtTop','teeNeck','teeTopLeft','teeTopRight','vestNeck','vestTopLeft','vestTopRight','vestShoulderLeft','vestShoulderRight','jobsCollar','jobsCollarEdge','silverCollar','silverInner','silverOutline'];
 const untouched=['alohaBody','scarf','spaceCollar','cigarette','waist','shirt','tee'];
 garmentPaths=Object.fromEntries([...keys,...untouched].map(key=>[key,{style:{display:key==='teeTopLeft'?'none':''}}]));
 const rows=[];
 for(const {id} of decorationCatalog.shirt){
  selectedDecorations.shirt=id;
  const before=keys.map(key=>garmentPaths[key].style.display);
  selectedDecorations.outerwear='space-shirt';updateInnerNecklineVisibility();
  const hidden=keys.every(key=>garmentPaths[key].style.visibility==='hidden');
  const preserved=untouched.every(key=>garmentPaths[key].style.visibility===undefined);
  const sameDisplay=keys.every((key,i)=>garmentPaths[key].style.display===before[i]);
  selectedDecorations.outerwear=null;updateInnerNecklineVisibility();
  const restored=keys.every(key=>garmentPaths[key].style.visibility==='');
  selectedDecorations.outerwear='aloha-open-jacket';updateInnerNecklineVisibility();
  const openVisible=keys.every(key=>garmentPaths[key].style.visibility==='');
  rows.push({id,hidden,preserved,sameDisplay,restored,openVisible,selectionKept:selectedDecorations.shirt===id});
 }
 return rows;
})())`,c));
for(const row of rows)for(const [key,value] of Object.entries(row))if(key!=='id')assert.equal(value,true,`${row.id}: ${key}`);
console.log(`${rows.length} shirts: space outerwear hides all inner collar strokes/fills, preserves its own collar and independent neckwear, and removing or changing the coat restores the original shirt neckline.`);
