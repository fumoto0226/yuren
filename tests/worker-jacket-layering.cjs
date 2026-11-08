const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const inputs=['body','width','arms','legs','head'].map(key=>({dataset:{control:key},value:'100'}));
const c=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>inputs},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],c);
const rows=JSON.parse(vm.runInContext(`JSON.stringify((()=>{
 const rows=[],children=[];
 svg={appendChild(node){const i=children.indexOf(node);if(i>=0)children.splice(i,1);children.push(node)}};
 for(const part of layerOrder)partLayers[part]={name:part};
 outfitOverlay={name:'outfit'};neckOverlay={name:'neck'};
 selectedDecorations.shirt=null;selectedDecorations.outerwear='worker-jacket';
 const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
 for(const outerwear of ['worker-jacket','blue-worker-jacket','charcoal-blazer','secondary-jacket','student-jacket','space-shirt'])for(const pants of ['worker-trousers','jobs-gradient-jeans','wide-pants','loose-wide-pants','plain','jumpsuit',null])for(const held of [false,true])for(const side of ['left','right'])for(const angle of [-70,-30,0,15,25,45,80]){
  selectedDecorations.outerwear=outerwear;selectedDecorations.pants=pants;
  dragPoses.length=0;
  const pose=Object.assign(createDragPose(side+'Leg'),{x:side==='left'?-10:10,y:0});
  dragPoses.push(pose);activeDrag=held?{pose}:null;legInFront.left=legInFront.right=false;
  const sign=side==='left'?-1:1,rad=angle*Math.PI/180;
  const shape={hip:{x:0,y:0},ankle:{x:sign*50*Math.cos(rad),y:-50*Math.sin(rad)},knee:{x:sign*25,y:0},restLength:50};
  updateLegOcclusion({left:shape,right:shape},warp);updatePartOrder();
  rows.push({pants,held,side,angle,front:legInFront[side],hipOpacity:buttOutlineOpacity(side),paintedOverCoat:children.indexOf(partLayers[side+'Leg'])>children.indexOf(outfitOverlay),paintedFront:children.indexOf(partLayers[side+'Leg'])>children.indexOf(neckOverlay)});
 }
 return rows;
})())`,c));
for(const row of rows){assert.equal(row.paintedOverCoat,row.front,'Even bare legs and jumpsuits must stay behind the coat at low angles');assert.equal(row.front,row.angle>=25,`${row.side} ${row.angle}: promotion waits until above horizontal`);assert.equal(row.paintedFront,row.held&&row.front,'Holding a low leg must not cover the long jacket; a high held leg must cover it');}
console.log(rows.length+' long-coat/pants/side/angle/held combinations preserve low hems and promote high held legs.');

const coatOrder=vm.runInContext(`(()=>{
 const group=name=>({name,children:[],appendChild(node){if(node.parentNode){const old=node.parentNode.children;old.splice(old.indexOf(node),1);}this.children.push(node);node.parentNode=this;},insertBefore(node,before){if(node.parentNode){const old=node.parentNode.children;old.splice(old.indexOf(node),1);}const i=before?this.children.indexOf(before):-1;this.children.splice(i<0?this.children.length:i,0,node);node.parentNode=this;}});
 outfitOverlay=group('outfit');neckOverlay=group('neck');
 const pants={name:'pants'},coat={name:'coat'},left={name:'leftBoot'},right={name:'rightBoot'};
 garmentPaths={pants,alohaBody:coat};legParts=[{calfOverlay:left},{calfOverlay:right}];
 outfitOverlay.appendChild(pants);neckOverlay.appendChild(coat);
 const orders=[];
 for(const id of ['worker-jacket','blue-worker-jacket','charcoal-blazer','secondary-jacket','student-jacket','space-shirt']){
  neckOverlay.appendChild(coat);selectedDecorations.outerwear=id;updateGarmentOrder();
  orders.push({id,names:outfitOverlay.children.map(n=>n.name)});
 }
 const worker=outfitOverlay.children.map(n=>n.name);
 selectedDecorations.outerwear='suit-jacket';updateGarmentOrder();
 return {worker,orders,restored:coat.parentNode===neckOverlay};
})()`,c);
assert.ok(coatOrder.worker.indexOf('coat')>coatOrder.worker.indexOf('pants'),'Long coat must still cover the pelvis');
for(const boot of ['leftBoot','rightBoot'])assert.ok(coatOrder.worker.indexOf(boot)>coatOrder.worker.indexOf('coat'),'Folded boot must cover the long coat hem');
for(const {id,names} of coatOrder.orders){assert.ok(names.indexOf('coat')>names.indexOf('pants'),id+' covers pelvis');for(const calf of ['leftBoot','rightBoot'])assert.ok(names.indexOf(calf)>names.indexOf('coat'),id+' stays below folded calf');}
assert.ok(coatOrder.restored,'Other outerwear must return to its original neck layer');
console.log('Long coat stays above pelvis and below both folded boots; switching coats restores the ordinary layer.');
