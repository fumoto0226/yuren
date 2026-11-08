const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const inputs=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>inputs},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(root,'script.js'),'utf8').split('resetButton.addEventListener')[0],c);
const data=JSON.parse(vm.runInContext('JSON.stringify({catalog:decorationCatalog,palettes:capeStyles})',c));
let checked=0;
for(const item of [...data.catalog.suit,...data.catalog.cape]){
 const id=item.pieces?.cape||(data.palettes[item.id]?item.id:null);
 if(!id)continue;
 const svg=fs.readFileSync(path.join(root,item.icon),'utf8');
 const actual=[...svg.matchAll(/data-back-part="([^"]+)"/g)].map(m=>m[1]).sort();
 assert.deepEqual(actual,Object.keys(data.palettes[id]).sort(),item.id+' must contain only its selected back accessory');
 assert.ok(!svg.includes('undefined'),item.id+' has no missing palette colors');checked++;
}
console.log(checked+' back accessory and suit thumbnails contain exactly their selected back parts.');
