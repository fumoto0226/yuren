const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const node=tag=>({tag,attrs:{},children:[],setAttribute(k,v){this.attrs[k]=String(v);},appendChild(child){this.children.push(child);}});
const c=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>controls,createElementNS:(_,tag)=>node(tag)},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],c);
const data=JSON.parse(vm.runInContext(`JSON.stringify((()=>{
 const n=()=>document.createElementNS(SVG_NS,'g');
 const defs=n(),mask=n();
 garmentPaths={alohaBody:n(),greenVestLeft:n(),greenVestRight:n()};
 createOuterwearNecklineOcclusion(defs,mask);
 return {filter:defs.children[0],group:mask.children[0],sourceIds:Object.values(garmentPaths).map(n=>n.attrs.id)};
})())`,c));
assert.equal(data.group.attrs.filter,'url(#neckline-outerwear-silhouette)');
assert.equal(data.group.children.length,3);
for(const id of data.sourceIds)assert.ok(data.group.children.some(n=>n.tag==='use'&&n.attrs.href==='#'+id),'Mask references each actual body/lapel node, including open vest panels');
assert.equal(data.group.children.some(n=>n.tag==='path'),false,'Outerwear geometry is not copied into a stale mask contour');
const matrix=data.filter.children[0].attrs.values.split(/\s+/).map(Number);
for(const rgba of [[1,1,1,1],[1,.5,0,1],[.1,.2,.5,1],[1,0,0,.5],[0,0,0,0]]){
 const out=Array.from({length:4},(_,row)=>matrix[row*5+4]+rgba.reduce((n,v,col)=>n+v*matrix[row*5+col],0));
 assert.deepEqual(out,[0,0,0,rgba[3]],'Painted cloth becomes black occlusion with unchanged alpha; open/transparent areas remain open');
}
console.log('Outerwear neckline mask references live coat/vest artwork and preserves alpha: lapels cover inner collars, while openings and transparent areas stay visible.');

assert.ok(data.filter.children.some(n=>n.tag==='feMorphology'&&n.attrs.operator==='erode'&&Number(n.attrs.radius)>0),'Collar keeps a small overlap beneath antialiased coat edges');
