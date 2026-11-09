const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({setAttribute(){}}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync('script.js','utf8').split('resetButton.addEventListener')[0],c);
const r=vm.runInContext(`(()=>{
 const geometry=[],caps=[],goggles=[];
 for(const id of Object.keys(capVariants)){applyDecorationSelection('helmet',id);caps.push({id,hidden:hornHidden(),color:capVariants[id].color});}
 for(const id of Object.keys(divingGoggleVariants)){applyDecorationSelection('helmet',id);goggles.push({id,hidden:hornHidden()});}
 for(const id of Object.keys(swimRingVariants)){
  applyDecorationSelection('outerwear',id);applyDecorationSelection('cape','gourd');applyDecorationSelection('shirt','yellow-tee');
  for(const size of [60,100,150])for(const part of ['head','leftHand','rightLeg']){
   dragPoses.length=0;dragPoses.push(Object.assign(createDragPose(part),{x:35,y:-50}));
   const warp=buildWarp({body:size,width:size,arms:size,legs:size,head:size});
   geometry.push(swimRingMarkup(warp,id,false),swimRingMarkup(warp,id,true),...capSpecs.concat(divingGoggleSpecs).map(s=>transformPath(s.source,(x,y)=>applyDragPose(warp(x,y,s.role),x,y,s.role,warp))));
  }
 }
 dragPoses.length=0;
 class Node{
  constructor(name){this.name=name;this.children=[];this.parentNode=null;}
  get nextSibling(){if(!this.parentNode)return null;const a=this.parentNode.children;return a[a.indexOf(this)+1]||null;}
  appendChild(n){if(n.parentNode)n.parentNode.children.splice(n.parentNode.children.indexOf(n),1);this.children.push(n);n.parentNode=this;return n;}
  insertBefore(n,ref){if(n===ref)return n;if(n.parentNode)n.parentNode.children.splice(n.parentNode.children.indexOf(n),1);const i=ref?this.children.indexOf(ref):this.children.length;if(i<0)throw Error('Missing insertion anchor');this.children.splice(i,0,n);n.parentNode=this;return n;}
 }
 svg=new Node('root');capeOverlay=new Node('cape');svg.appendChild(capeOverlay);
 swimRingBack=new Node('ring-back');svg.appendChild(swimRingBack);
 for(const part of layerOrder){partLayers[part]=new Node(part);svg.appendChild(partLayers[part]);}
 outfitOverlay=new Node('outfit');svg.appendChild(outfitOverlay);neckOverlay=new Node('neck');
 swimRingFront=new Node('ring-front');outfitOverlay.appendChild(swimRingFront);
 garmentPaths={};garmentPaths.shirt=new Node('shirt');outfitOverlay.appendChild(garmentPaths.shirt);
 divingGoggleOverlay=new Node('goggles-front');svg.appendChild(divingGoggleOverlay);
 const triangle=new Node('triangle-fill'),triangleLine=new Node('triangle-line');
 partLayers.head.appendChild(triangle);partLayers.head.appendChild(triangleLine);
 paths=[{index:1,node:triangle},{index:11,node:triangleLine}];
 divingGogglePaths=[new Node('strap'),new Node('lens'),new Node('highlight'),new Node('rim')];
 placeDivingGoggleLayers();
 const goggleLayers={head:partLayers.head.children.map(n=>n.name),front:divingGoggleOverlay.children.map(n=>n.name)};
 const layers=[];
 for(const shirt of ['yellow-tee','shell-top'])for(const part of ['leftHand','rightLeg']){
  selectedDecorations.shirt=shirt;dragPoses.length=0;dragPoses.push(Object.assign(createDragPose(part),{x:30,y:-60}));
  updateGarmentOrder();updatePartOrder();layers.push({root:svg.children.map(n=>n.name),outfit:outfitOverlay.children.map(n=>n.name)});
 }
 return {geometry,caps,goggles,layers,goggleLayers,selection:{...selectedDecorations},registered:Object.keys(capVariants).concat(Object.keys(divingGoggleVariants)).every(id=>decorationCatalog.helmet.some(s=>s.id===id)),rings:Object.keys(swimRingVariants).every(id=>decorationCatalog.outerwear.some(s=>s.id===id))};
})()`,c);
assert.ok(r.registered&&r.rings);assert.equal(r.caps.length,6);assert.equal(r.goggles.length,2);
for(const cap of r.caps)assert.ok(cap.hidden);
for(const g of r.goggles)assert.equal(g.hidden,false);
for(const d of r.geometry)assert.ok(d&&!/NaN|Infinity|undefined/.test(d));
for(const {root,outfit} of r.layers){assert.ok(root.indexOf('cape')<root.indexOf('ring-back'));for(const part of ['body','head','leftHand','rightHand'])assert.ok(root.indexOf('ring-back')<root.indexOf(part));assert.ok(outfit.indexOf('shirt')<outfit.indexOf('ring-front'));assert.ok(root.indexOf('outfit')<root.indexOf('leftHand'));}
assert.ok(r.goggleLayers.head.indexOf('strap')<r.goggleLayers.head.indexOf('triangle-fill'));
assert.ok(r.goggleLayers.head.indexOf('strap')<r.goggleLayers.head.indexOf('triangle-line'));
assert.deepEqual(Array.from(r.goggleLayers.front),['lens','highlight','rim']);
for(const {root} of r.layers)assert.ok(root.indexOf('outfit')<root.indexOf('goggles-front'));
assert.equal(r.selection.cape,'gourd');assert.equal(r.selection.outerwear,'pink-striped-swim-ring');
for(const id of ['red-baseball-cap','blue-baseball-cap','green-baseball-cap','black-baseball-cap','yellow-baseball-cap','white-baseball-cap','blue-diving-goggles','pink-diving-goggles','duck-swim-ring','pink-striped-swim-ring'])assert.ok(fs.existsSync('svg/'+id+'.svg'));
console.log('Swim accessories: 6 caps, 2 goggles, 2 independent outerwear rings; finite geometry across 18 size/drag cases and rear/front layering in four limb/sleeveless cases.');

for(const id of ['duck-swim-ring','pink-striped-swim-ring']){
 const markup=vm.runInContext(`swimRingMarkup((x,y)=>({x,y}),'${id}',true)`,c);
 assert.match(markup,/M\s*-1000 94\.6316\s*L\s*1000 94\.6316/,'Ring front spans loose shirt sides, instead of being clipped to the original torso width');
}
