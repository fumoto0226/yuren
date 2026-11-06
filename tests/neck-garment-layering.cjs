const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],c);
const r=vm.runInContext(`(()=>{
 const children=[];
 neckOverlay={name:'neck',insertBefore(node,before){const i=children.indexOf(node);if(i>=0)children.splice(i,1);const j=children.indexOf(before);children.splice(j<0?children.length:j,0,node);}};
 const scarf={name:'scarf'},silver={name:'silver'},royal={name:'royal'};
 scarfPaths=[{node:scarf}];children.push(scarf,silver,royal);
 garmentPaths={greenVestLeft:{name:'vestLeft'},greenVestRight:{name:'vestRight'},alohaBody:{name:'outer'}};
 const collar={name:'collar'},edge={name:'collarEdge'};
 placeNeckGarmentBelowAccessories(collar);placeNeckGarmentBelowAccessories(edge);placeOuterwearOverNeckline();
 const neckOrder=children.map(n=>n.name),scene=[];
 svg={appendChild(node){const i=scene.indexOf(node);if(i>=0)scene.splice(i,1);scene.push(node);}};
 for(const name of layerOrder)partLayers[name]={name};outfitOverlay={name:'outfit'};
 selectedDecorations.shirt='black-turtleneck-tee';
 const poses=[];for(const neck of ['scarf','silver-collar','royal-collar']){
  selectedDecorations.neck=neck;armRaised.left=armRaised.right=false;updatePartOrder();
  const resting=scene.map(n=>n.name);armRaised.right=true;updatePartOrder();
  poses.push({resting,raised:scene.map(n=>n.name)});
 }
 return {neckOrder,poses};
})()`,c);
for(const accessory of ['scarf','silver','royal'])for(const garment of ['collar','collarEdge','outer'])assert.ok(r.neckOrder.indexOf(garment)<r.neckOrder.indexOf(accessory),'All neck accessories must cover clothing collars and outerwear');
assert.ok(r.neckOrder.indexOf('outer')>r.neckOrder.indexOf('collarEdge'),'Outerwear covers the inner high collar');
for(const p of r.poses){assert.ok(p.resting.indexOf('neck')>p.resting.indexOf('head'),'High collar remains above the head/neck seam');assert.ok(p.raised.indexOf('rightHand')>p.raised.indexOf('neck'),'A raised hand still covers every neck accessory');}
console.log('Neck layers: head < clothing collar < outerwear < all neck accessories < raised hand; no new masks.');
