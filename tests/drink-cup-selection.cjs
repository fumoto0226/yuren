const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c=vm.createContext({document:{querySelector:()=>({}),querySelectorAll:()=>[]},requestAnimationFrame:()=>1});
vm.runInContext(fs.readFileSync('script.js','utf8').split('resetButton.addEventListener')[0],c);
const result=JSON.parse(vm.runInContext(`JSON.stringify((()=>{
 const rows=[];
 for(const item of decorationCatalog.neck){
  applyDecorationSelection('neck',item.id);
  applyDecorationSelection('outerwear','drink-cup');
  rows.push(selectedDecorations.neck===null&&selectedDecorations.outerwear==='drink-cup');
  applyDecorationSelection('neck',item.id);
  rows.push(selectedDecorations.outerwear===null&&selectedDecorations.neck===item.id);
 }
 applyDecorationSelection('outerwear','drink-cup');
 applyDecorationSelection('shirt','loose-tee');
 applyDecorationSelection('neck',null);
 rows.push(selectedDecorations.outerwear==='drink-cup'&&selectedDecorations.shirt==='loose-tee');
 applyDecorationSelection('suit','orange-juice-suit');
 rows.push(selectedDecorations.outerwear==='drink-cup'&&selectedDecorations.neck===null);
 return rows;
})())`,c));
assert.ok(result.every(Boolean));
console.log('Cup and every neck accessory replace each other; shirts, neck removal and juice suit remain selectable.');
