const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const inputs=['body','width','arms','legs','head'].map(key=>({dataset:{control:key},value:'100'}));
const context=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>inputs},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],context);
const cases=vm.runInContext(`(()=>{
 const children=[];svg={appendChild(node){const i=children.indexOf(node);if(i>=0)children.splice(i,1);children.push(node);}};
 for(const part of layerOrder)partLayers[part]={name:part};
 outfitOverlay={name:'outfit'};neckOverlay={name:'neck'};
 const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100}),cases=[];
 for(const pants of [null,...decorationCatalog.pants.map(p=>p.id)])
 for(const shirt of [null,'black-turtleneck-tee','blue-vest'])
 for(const side of ['left','right'])for(const held of [false,true])
 for(const offset of [[0,0],[35,-75],[-60,-30],[0,45]]){
  selectedDecorations.pants=pants;selectedDecorations.shirt=shirt;
  dragPoses.length=0;
  const pose=Object.assign(createDragPose(side+'Leg'),{x:offset[0]*(side==='left'?-1:1),y:offset[1]});
  dragPoses.push(pose);activeDrag=held?{pose}:null;
  updateArmOcclusion({left:armGeometry('left',warp),right:armGeometry('right',warp)});
  updateLegOcclusion({left:legGeometry('left',warp),right:legGeometry('right',warp)},warp);
  updatePartOrder();cases.push({pants,shirt,side,held,offset,promoted:!!(held&&(!(selectedDecorations.shirt==='red-triangle'&&!selectedDecorations.pants)&&!wearingUnderwear()&&selectedDecorations.pants!=='jobs-gradient-jeans'||legInFront[side])),order:children.map(n=>n.name)});
 }
 return cases;
})()`,context);
for(const c of cases){
 if(c.promoted){
  assert.equal(c.order.at(-1),c.side+'Leg','Held foreground leg must cover hands, clothes and neckwear');
 }else for(const hand of ['leftHand','rightHand'])for(const under of ['leftLeg','rightLeg','outfit'])
  assert.ok(c.order.indexOf(hand)>c.order.indexOf(under),JSON.stringify({...c,hand,under}));
}
console.log(`${cases.length} combinations: held foreground leg is topmost; released legs and folded calves stay behind hands.`);
