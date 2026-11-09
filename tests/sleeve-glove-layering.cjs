const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const inputs=['body','width','arms','legs','head'].map(key=>({dataset:{control:key},value:'100'}));
const context=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>inputs},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],context);
const result=vm.runInContext(`(()=>{
 const parent=()=>({children:[],appendChild(node){
  if(node.parentNode){const old=node.parentNode.children;old.splice(old.indexOf(node),1);}
  node.parentNode=this;this.children.push(node);
 }});
 const arm=Object.fromEntries(['rootBlack','black','skinRoot','skin','sleeveRootBlack','sleeveBlack','sleeveSkinRoot','sleeveSkin'].map(key=>[key,parent()]));
 arm.segments=Array.from({length:32},(_,i)=>({back:{index:i},front:{index:i}}));
 const rows=[];
 // Repeated short/long/bare changes must restore sample order as well as parents.
 for(const end of [0,20,31,32,17,0,28,25,31]){
  updateArmSleeveOrder(arm,end);
  const correct=arm.segments.every(({back,front},i)=>{
   const prefix=i<end?'sleeve':'';
   const backKey=prefix?(i<6?'sleeveRootBlack':'sleeveBlack'):(i<6?'rootBlack':'black');
   const frontKey=prefix?(i<6?'sleeveSkinRoot':'sleeveSkin'):(i<6?'skinRoot':'skin');
   return back.parentNode===arm[backKey]&&front.parentNode===arm[frontKey];
  });
  const ordered=Object.values(arm).filter(value=>value.children).every(group=>group.children.every((node,i)=>!i||group.children[i-1].index<node.index));
  const count=Object.values(arm).filter(value=>value.children).reduce((n,g)=>n+g.children.length,0);
  rows.push({end,correct,ordered,count});
 }
 return rows;
})()`,context);
for(const row of result){
 assert.ok(row.correct,`Sleeve end ${row.end}: clothed spans belong above gloves; bare spans below them`);
 assert.ok(row.ordered,`Sleeve end ${row.end}: arm samples stay in anatomical order after switching clothing`);
 assert.equal(row.count,64,'Every arm fill and outline has exactly one parent');
}
console.log('Sleeve/glove layering: bare, short, long, tunic and coat sleeve changes preserve all 64 arm paths and their sample order.');

const shirt=JSON.parse(vm.runInContext(`JSON.stringify((()=>{
 const node=()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];}});
 const arm={side:'left',segments:Array.from({length:32},()=>({back:node(),front:node()})),glovePanel:node(),gloveEdges:node(),innerSleeve:node(),alohaSleeve:node()};
 const children=[node(),arm.glovePanel,arm.gloveEdges,node(),node(),arm.innerSleeve,arm.alohaSleeve];
 let moves=0;
 const parent={insertBefore(child,anchor){children.splice(children.indexOf(child),1);children.splice(children.indexOf(anchor),0,child);moves++;}};
 for(const child of children){child.parentNode=parent;Object.defineProperty(child,'nextSibling',{get(){return children[children.indexOf(child)+1]||null;}});}
 updateArmCuffClips(arm,{sleeveEnd:31,collaredShirt:true});
 const flat=arm.segments.slice(27).every(({back,front})=>[back,front].every(n=>n.attrs['stroke-linecap']==='butt'));
 const lastClipped=arm.segments.slice(24).every(({back,front})=>[back,front].every(n=>n.attrs['clip-path']==='url(#left-sleeve-clip)'));
 const fullGauntlet=!arm.glovePanel.attrs['clip-path']&&!arm.gloveEdges.attrs['clip-path'];
 updateGloveSleeveOrder(arm,true);
 const over=children.indexOf(arm.glovePanel)>children.indexOf(arm.innerSleeve)&&children.at(-1)===arm.alohaSleeve;
 const count=moves;updateGloveSleeveOrder(arm,true);const cached=moves===count;
 updateGloveSleeveOrder(arm,false);
 const restored=children.indexOf(arm.innerSleeve)>children.indexOf(arm.gloveEdges)&&children.at(-1)===arm.alohaSleeve;
 return {flat,lastClipped,fullGauntlet,over,cached,restored};
})())`,context));
for(const [key,value] of Object.entries(shirt))assert.equal(value,true,key);
console.log('Collared shirt: flat cuff with full gauntlets above it; outerwear remains above both, unchanged frames do not reorder nodes, and switching shirts restores the default order.');
