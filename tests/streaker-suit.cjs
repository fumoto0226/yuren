const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({setAttribute(){}}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],c);
const r=vm.runInContext(`(()=>{
 applyDecorationSelection('suit','streaker-suit');const selected={...selectedDecorations},color=skinColor(),hasFace=skinTrait('lipstickDetails'),paths=[];
 for(const size of [60,100,150])for(const part of ['head','leftHand','rightHand','leftLeg','rightLeg']){
  dragPoses.length=0;dragPoses.push(Object.assign(createDragPose(part),{x:25,y:45,mouth:1}));
  const warp=buildWarp({body:size,width:size,arms:size,legs:size,head:size});
  paths.push(mosaicTopMarkup(warp),...lipstickFaceSpecs.map(s=>transformPath(s.source,(x,y)=>warp(x,y,s.role))),...pinkRibbonSpecs.map(s=>transformPath(s.source,(x,y)=>warp(x,y,s.role))));
 }
 const tiles=mosaicTopMarkup(buildWarp({body:100,width:100,arms:100,legs:100,head:100}),'all');
 selectedDecorations.helmet='space-helmet';const hoodHides=skinTrait('lipstickDetails')===undefined;
 return {selected,color,hasFace,hoodHides,paths,tiles};
})()`,c);
assert.equal(r.selected.pants,'mosaic-pants');assert.equal(r.selected.skin,'lipstick-fish');assert.equal(r.selected.helmet,'pink-ribbon-hair');assert.equal(r.selected.shirt,'mosaic-top');
for(const slot of ['shoes','outerwear','cape','gloves'])assert.equal(r.selected[slot],null);
assert.equal(r.color,'#F6DDDD');assert.ok(r.hasFace&&r.hoodHides);
assert.equal((r.tiles.match(/<path /g)||[]).length,104,'Opaque mosaic covers the torso and hip with 104 pixel blocks');assert.ok(!/opacity=/.test(r.tiles));
for(const d of r.paths)assert.ok(!/NaN|Infinity|undefined/.test(d));
for(const file of ['streaker-suit','lipstick-fish','pink-ribbon-hair','mosaic-top','mosaic-pants'])assert.ok(fs.existsSync(path.join(__dirname,'../svg',file+'.svg')));
console.log('Streaker suit: four independent pieces, opaque pixel top, lipstick/lashes respect full hoods and finite geometry across 15 pose/size cases.');
const joined=vm.runInContext(`(()=>{dragPoses.length=0;const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});return {top:mosaicTopMarkup(warp),pants:mosaicTopMarkup(warp,'pants'),full:mosaicTopMarkup(warp,'all')};})()`,c);
assert.equal(joined.top+joined.pants,joined.full,'Separate tops and pants use one uninterrupted mosaic grid');
assert.equal((joined.top.match(/<path /g)||[]).length,64);assert.equal((joined.pants.match(/<path /g)||[]).length,40);
const frontLayers=vm.runInContext(`(()=>{
 const group=name=>({name,children:[],appendChild(node){if(node.parentNode){const old=node.parentNode.children,i=old.indexOf(node);if(i>=0)old.splice(i,1);}this.children.push(node);node.parentNode=this;}});
 const drawn=[];svg={appendChild(node){const i=drawn.indexOf(node);if(i>=0)drawn.splice(i,1);drawn.push(node);}};
 for(const part of layerOrder)partLayers[part]={name:part};
 outfitOverlay=group('outfit');neckOverlay=group('neck');longHairOverlay=group('hair');mosaicOverlay=group('mosaic');
 garmentPaths={collaredDetails:group('top'),mosaicPants:group('pants')};legParts=[];
 selectedDecorations.shirt='mosaic-top';selectedDecorations.pants='mosaic-pants';selectedDecorations.outerwear=null;
 const rows=[];
 for(const part of ['leftHand','rightHand','leftLeg','rightLeg'])for(const held of [false,true]){
  dragPoses.length=0;const pose=Object.assign(createDragPose(part),{x:35,y:-40});dragPoses.push(pose);
  activeDrag=held?{pose}:null;legInFront.left=legInFront.right=true;
  updateGarmentOrder();updatePartOrder();rows.push(drawn.at(-1)===mosaicOverlay&&garmentPaths.collaredDetails.parentNode===mosaicOverlay&&garmentPaths.mosaicPants.parentNode===mosaicOverlay);
 }
 selectedDecorations.shirt='white-tie-shirt';updateGarmentOrder();
 return {rows,restored:garmentPaths.collaredDetails.parentNode===outfitOverlay};
})()`,c);
assert.ok(frontLayers.rows.every(Boolean),'Mosaic stays above held and released hands and legs');assert.ok(frontLayers.restored,'Changing shirt restores ordinary garment layering');
