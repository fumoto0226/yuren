const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const path=require('node:path');
const inputs=['body','width','arms','legs','head'].map(key=>({dataset:{control:key},value:'100'}));
const context=vm.createContext({document:{querySelector:()=>({setAttribute(){}}),querySelectorAll:()=>inputs},requestAnimationFrame:()=>1,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0],context);
const result=JSON.parse(vm.runInContext(`JSON.stringify((()=>{
  applyDecorationSelection('skin','milk-frog');
  selectedDecorations.outerwear='green-vest';selectedDecorations.gloves='plain';
  applyDecorationSelection('suit','navy-suit');
  const full={...selectedDecorations};
  const pieces=decorationCatalog.suit.find(s=>s.id==='navy-suit').pieces;
  const registered=Object.entries(pieces).every(([category,id])=>decorationCatalog[category].some(p=>p.id===id));
  const covered=pantsCoverThigh(),paint=widePantsPaint();
  applyDecorationSelection('neck',null);
  const noTie={...selectedDecorations};
  applyDecorationSelection('suit',null);
  const cleared={...selectedDecorations};
  for(const [category,id] of Object.entries(pieces))applyDecorationSelection(category,id);
  const individual={...selectedDecorations};
  return {full,pieces,registered,covered,paint,noTie,cleared,individual};
})())`,context));
assert.equal(result.full.suit,'navy-suit');
assert.equal(result.full.skin,'milk-frog');
assert.equal(result.full.helmet,null);assert.equal(result.full.outerwear,'suit-jacket');assert.equal(result.full.shirt,null);assert.equal(result.full.gloves,null);
assert.ok(result.registered,'Every suit item is also individually selectable');
assert.equal(result.full.neck,null,'The suit leaves the neck slot free');
assert.equal(vm.runInContext("decorationCatalog.neck.some(item=>item.id==='red-tie')",context),false,'The tie is part of the jacket, not a neck accessory');
assert.ok(result.covered,'Suit trousers use continuous leg coverage and hip masking');
assert.equal(result.paint,'#454963');
assert.equal(result.noTie.suit,null,'An individual change exits the preset');
assert.equal(result.noTie.neck,null);
for(const key of ['outerwear','pants','shoes'])assert.equal(result.noTie[key],result.pieces[key],'Changing neckwear keeps the suit pieces');
for(const [key,value] of Object.entries(result.cleared))assert.equal(value,key==='skin'?'milk-frog':null);
for(const [key,id] of Object.entries(result.pieces))assert.equal(result.individual[key],id);
assert.equal(result.individual.suit,null);
for(const filename of ['navy-suit','suit-jacket','suit-trousers','black-dress-shoes']){
 const icon=fs.readFileSync(path.join(__dirname,'../svg',filename+'.svg'),'utf8');
 assert.ok(icon.includes('<svg')&&!/NaN|Infinity/.test(icon),'Generated suit thumbnails contain finite SVG');
}
console.log('Navy suit: three registered pieces with the tie integrated into the jacket, preserved skin, cleared conflicts, independent selection/removal and valid thumbnails.');
// All current and future presets must only combine catalog items that can
// also be selected independently. A preset may not hide exclusive pieces.
const presets=JSON.parse(vm.runInContext(`JSON.stringify(decorationCatalog.suit.map(suit=>{
 // Each preset starts from the same skin, so that "the suit kept my skin"
 // is checked against a known one — a preset that brings its own skin
 // (Pochita) would otherwise leave it set for the next one in the list.
 selectedDecorations.skin='milk-frog';
 applyDecorationSelection('suit',suit.id);
 const applied={...selectedDecorations};
 const pieces=Object.entries(suit.pieces).map(([category,id])=>{
  const entry=decorationCatalog[category]?.find(item=>item.id===id);
  applyDecorationSelection(category,id);
  return {category,id,icon:entry?.icon,selected:selectedDecorations[category],preset:selectedDecorations.suit};
 });
 return {id:suit.id,applied,pieces};
}))`,context));
for(const preset of presets){
 assert.ok(preset.pieces.length>0,'Each preset declares its pieces');
 for(const piece of preset.pieces){
  assert.ok(piece.icon,`${preset.id}: ${piece.id} is an individual catalog item`);
  assert.equal(preset.applied[piece.category],piece.id,'Preset applies the same individual item');
  assert.equal(piece.selected,piece.id,'The item can be selected alone');
  // Clothing is exclusive with a preset, so picking a piece leaves it.
  // A skin is not clothing — it never conflicts with anything — so a
  // preset that includes one keeps the preset when that skin is picked.
  if(piece.category!=='skin')assert.equal(piece.preset,null);
  assert.ok(fs.existsSync(path.join(__dirname,'..',piece.icon)),'Each piece has a thumbnail');
 }
}
const king=presets.find(preset=>preset.id==='royal-suit');
assert.equal(king.applied.helmet,'crown');assert.equal(king.applied.neck,'royal-collar');
assert.equal(king.applied.skin,'milk-frog');
// A preset may also bring a skin of its own, and then it replaces it.
const pochita=presets.find(preset=>preset.id==='pochita-suit');
assert.equal(pochita.applied.skin,'pochita');
assert.equal(pochita.applied.helmet,'chainsaw');
console.log('Every suit is a combination of independently selectable catalog items; royal suit includes five pieces and preserves skin.');

const layered=vm.runInContext(`(()=>{
 applyDecorationSelection('shirt','loose-tee');
 applyDecorationSelection('outerwear','suit-jacket');
 const worn=selectedDecorations.shirt==='loose-tee'&&selectedDecorations.outerwear==='suit-jacket';
 applyDecorationSelection('outerwear',null);
 return worn&&selectedDecorations.shirt==='loose-tee'&&selectedDecorations.outerwear===null;
})()`,context);
assert.ok(layered,'Suit jacket occupies outerwear and preserves its inner shirt on selection/removal');
