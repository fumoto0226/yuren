const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],c);
const result=JSON.parse(vm.runInContext(`JSON.stringify((()=>{
 const node=()=>({attrs:{},children:[],setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k]??null;},removeAttribute(k){delete this.attrs[k];},appendChild(n){if(n.parentNode)n.parentNode.children.splice(n.parentNode.children.indexOf(n),1);n.parentNode=this;this.children.push(n);},insertBefore(n,b){if(n.parentNode)n.parentNode.children.splice(n.parentNode.children.indexOf(n),1);n.parentNode=this;this.children.splice(b?this.children.indexOf(b):this.children.length,0,n);}});
 innerNecklineLayer=node();neckOverlay=node();neckOverlay.appendChild(innerNecklineLayer);
 const scarf=node();scarfPaths=[{node:scarf}];neckOverlay.appendChild(scarf);
 const futureCollar=node(),spaceCollar=node();
 placeNeckGarmentBelowAccessories(futureCollar);
 placeNeckGarmentBelowAccessories(spaceCollar,true);
 const futureManaged=futureCollar.parentNode===innerNecklineLayer;
 const outerSeparate=spaceCollar.parentNode===neckOverlay&&scarf.parentNode===neckOverlay;
 innerNecklineOcclusion=node();garmentPaths={jumpsuit:node()};
 garmentPaths.jumpsuit.setAttribute('mask','url(#jumpsuit-chest-mask)');
 let cases=0,matched=true,holeKept=true,finite=true;
 for(const pants of ['jumpsuit','navy-jumpsuit',...Object.keys(workwearVariants)])for(const {id:shirt} of decorationCatalog.shirt)for(const size of [70,100,140])for(const pose of [null,['body',15,35],['leftHand',45,-65],['rightLeg',-45,-45]]){
  selectedDecorations.pants=pants;selectedDecorations.shirt=shirt;dragPoses.length=0;
  if(pose)dragPoses.push(Object.assign(createDragPose(pose[0]),{x:pose[1],y:pose[2]}));
  const warp=buildWarp({body:size,width:size,arms:100,legs:100,head:size});
  const actual=garmentPath(jumpsuitSource,warp);garmentPaths.jumpsuit.setAttribute('d',actual);
  updateInnerNecklineOcclusion();
  matched&&=innerNecklineOcclusion.attrs.d===actual;
  holeKept&&=innerNecklineOcclusion.attrs.mask==='url(#jumpsuit-chest-mask)';
  finite&&=!/NaN|Infinity|undefined/.test(actual);cases++;
 }
 selectedDecorations.pants='plain';updateInnerNecklineOcclusion();
 return {futureManaged,outerSeparate,cases,matched,holeKept,finite,cleared:innerNecklineOcclusion.attrs.d===''};
})())`,c));
for(const [key,value] of Object.entries(result))if(key!=='cases')assert.equal(value,true,key);
assert.ok(result.cases>1000);
console.log(`${result.cases} jumpsuit/shirt/size/pose cases use the actual garment silhouette and chest opening to occlude inner neckline details; future collars join the shared layer automatically and independent neckwear stays outside it.`);
