const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const context=vm.createContext({document:{querySelector:()=>({setAttribute(){},removeAttribute(){}}),querySelectorAll:()=>['body','width','arms','legs','head'].map(key=>({dataset:{control:key},value:'100'}))},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(root,'script.js'),'utf8').split('resetButton.addEventListener')[0],context);
const data=vm.runInContext('({groups:decorationStyleGroups,catalog:decorationCatalog,special:specialShirtIds})',context);
for(const [category,groups] of Object.entries(data.groups)){
 const ids=[];
 for(const [key,,variants] of groups){
  assert.ok(variants.length);
  assert.ok(fs.existsSync(path.join(root,`svg/base-${category}-${key}.svg`)));
  const item=data.catalog[category].find(item=>item.id===variants[0]);
  const original=fs.readFileSync(path.join(root,item.icon),'utf8');
  const basic=fs.readFileSync(path.join(root,`svg/base-${category}-${key}.svg`),'utf8');
  assert.deepEqual(basic.match(/<mask\b[\s\S]*?<\/mask>/g),original.match(/<mask\b[\s\S]*?<\/mask>/g),'Basic thumbnails preserve mask luminance');
  for(const id of variants){
   assert.ok(data.catalog[category].some(item=>item.id===id),`${category}/${id} is registered`);
   ids.push(id);
  }
 }
 assert.equal(new Set(ids).size,ids.length,'Each variant belongs to one style');
 const expected=data.catalog[category].map(item=>item.id).filter(id=>category!=='shirt'||!data.special.includes(id));
 assert.deepEqual([...ids].sort(),[...expected].sort(),`${category}: every existing variant is reachable`);
}
assert.ok(!data.groups.skin&&!data.groups.suit&&!data.groups.helmet&&!data.groups.neck);
const state=vm.runInContext(`(()=>{
 baseDecorationSelections.shirt='tee';baseDecorationSelections.pants='shorts';
 applyDecorationSelection('skin','milk-frog');
 const keptSkin=baseDecorationSelections.shirt==='tee'&&baseDecorationSelections.pants==='shorts';
 applyDecorationSelection('shirt','patched-tee');
 const variantRestores=!baseDecorationSelections.shirt&&baseDecorationSelections.pants==='shorts';
 applyDecorationSelection('suit','navy-suit');
 const suitRestores=Object.keys(baseDecorationSelections).length===0&&selectedDecorations.outerwear==='suit-jacket';
 const attrs={fill:'#d44a49',stroke:'black'};
 const node={getAttribute:key=>attrs[key]??null,setAttribute:(key,value)=>attrs[key]=value,removeAttribute:key=>delete attrs[key],querySelectorAll:()=>[]};
 grayGarmentNode(node);
 const gray=attrs.fill===BASE_GARMENT_COLOR&&attrs.stroke==='black';
 restoreBasePaint();
 return {keptSkin,variantRestores,suitRestores,gray,restored:attrs.fill==='#d44a49'};
})()`,context);
for(const [key,value] of Object.entries(state))assert.equal(value,true,key);
console.log('Every style variant and gray thumbnail is reachable; skin preserves base choices, color selection restores its own slot, suits restore original colors, and gray paint preserves outlines and reverses cleanly.');

vm.runInContext('update=()=>{};renderDecorationOptions=()=>{};',context);
const toggles=vm.runInContext(`Object.entries(decorationCatalog).map(([category,items])=>{
 const id=items[0].id;
 applyDecorationSelection(category,null);
 selectDecoration(category,id);
 const selected=selectedDecorations[category]===id;
 selectDecoration(category,id);
 return {category,selected,cleared:selectedDecorations[category]===null};
})`,context);
for(const result of toggles){assert.ok(result.selected,result.category);assert.ok(result.cleared,result.category);}
console.log('Every decoration category supports selecting and then clicking again to cancel.');
