const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const inputs=['body','width','arms','legs','head'].map(key=>({dataset:{control:key},value:'100'}));
const c=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>inputs},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],c);
const rows=JSON.parse(vm.runInContext(`JSON.stringify((()=>{
 const rows=[],children=[];
 svg={appendChild(node){const i=children.indexOf(node);if(i>=0)children.splice(i,1);children.push(node)}};
 for(const part of layerOrder)partLayers[part]={name:part};
 outfitOverlay={name:'outfit'};neckOverlay={name:'neck'};
 selectedDecorations.shirt=null;
 const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
 for(const pants of ['red-thong','red-briefs','red-shorts'])for(const held of [false,true])for(const side of ['left','right'])for(const angle of [-70,-30,0,15,25,45,80]){
  selectedDecorations.pants=pants;
  dragPoses.length=0;
  const pose=Object.assign(createDragPose(side+'Leg'),{x:side==='left'?-10:10,y:0});
  dragPoses.push(pose);activeDrag=held?{pose}:null;legInFront.left=legInFront.right=false;
  const sign=side==='left'?-1:1,rad=angle*Math.PI/180;
  const shape={hip:{x:0,y:0},ankle:{x:sign*50*Math.cos(rad),y:-50*Math.sin(rad)},knee:{x:sign*25,y:0},restLength:50};
  updateLegOcclusion({left:shape,right:shape},warp);updatePartOrder();
  rows.push({pants,held,side,angle,front:legInFront[side],hipOpacity:buttOutlineOpacity(side),paintedFront:children.indexOf(partLayers[side+'Leg'])>children.indexOf(outfitOverlay)});
 }
 return rows;
})())`,c));
for(const row of rows){assert.equal(row.hipOpacity,0,'No old hip arc crosses the underwear or thigh');assert.equal(row.front,row.angle>=25,`${row.side} ${row.angle}: promotion waits until above horizontal`);assert.equal(row.paintedFront,row.front,'Holding the leg respects the underwear threshold');}
console.log('All three underwear styles: both legs, held and released, stay behind at low angles and promote above about 20 degrees.');

