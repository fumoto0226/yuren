const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const controls=['body','width','arms','legs','head'].map(control=>({dataset:{control},value:100}));
const c=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>controls},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(root,'script.js'),'utf8').split('resetButton.addEventListener')[0],c);
const data=JSON.parse(vm.runInContext('JSON.stringify({catalog:decorationCatalog,groups:decorationStyleGroups,special:specialShirtIds,colors:decorationColors})',c));
const removed=['royal-suit','royal-coat','royal-collar','royal-shoes'];
for(const id of removed){
 assert.ok(Object.values(data.catalog).every(items=>items.every(item=>item.id!==id)),`${id} is absent from the catalog and random outfit choices`);
 assert.ok(Object.values(data.catalog.suit).every(suit=>!Object.values(suit.pieces).includes(id)),`${id} is absent from remaining suit components`);
 assert.ok(!fs.existsSync(path.join(root,'svg',id+'.svg')),`${id} thumbnail removed`);
 assert.ok(!fs.readFileSync(path.join(__dirname,'generate-decoration-thumbnails.cjs'),'utf8').includes("'"+id+"'"),`${id} cannot be regenerated`);
}
assert.ok(!data.groups.shoes.some(([id])=>id==='buckle'),'Buckle shoe style removed');
assert.ok(!fs.existsSync(path.join(root,'svg/base-shoes-buckle.svg')),'Gray buckle style thumbnail removed');
assert.ok(!data.special.includes('royal-coat'));
assert.equal(data.colors.royalShoe,undefined,'Removed shoe color is no longer in the palette');
for(const [category,id] of [['pants','royal-trousers'],['helmet','crown'],['cape','crimson-cape'],['suit','ivory-suit']]){
 assert.ok(data.catalog[category].some(item=>item.id===id),`${id} remains independently selectable`);
}
console.log('Red/white royal outfit, collar, coat and buckle shoe color/style removed from catalog, assets and thumbnail generator; retained garments remain selectable.');
