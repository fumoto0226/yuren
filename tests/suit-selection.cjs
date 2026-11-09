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
assert.equal(result.full.skin,'flesh');
assert.equal(result.full.helmet,null);assert.equal(result.full.outerwear,'suit-jacket');assert.equal(result.full.shirt,null);assert.equal(result.full.gloves,null);
assert.ok(result.registered,'Every suit item is also individually selectable');
assert.equal(result.full.neck,null,'The suit leaves the neck slot free');
assert.equal(vm.runInContext("decorationCatalog.neck.some(item=>item.id==='red-tie')",context),false,'The tie is part of the jacket, not a neck accessory');
assert.ok(result.covered,'Suit trousers use continuous leg coverage and hip masking');
assert.equal(result.paint,'#454963');
assert.equal(result.noTie.suit,null,'An individual change exits the preset');
assert.equal(result.noTie.neck,null);
for(const key of ['outerwear','pants','shoes'])assert.equal(result.noTie[key],result.pieces[key],'Changing neckwear keeps the suit pieces');
for(const [key,value] of Object.entries(result.cleared))assert.equal(value,key==='skin'?'flesh':null);
for(const [key,id] of Object.entries(result.pieces))assert.equal(result.individual[key],id);
assert.equal(result.individual.suit,null);
for(const filename of ['navy-suit','suit-jacket','suit-trousers','black-dress-shoes']){
 const icon=fs.readFileSync(path.join(__dirname,'../svg',filename+'.svg'),'utf8');
 assert.ok(icon.includes('<svg')&&!/NaN|Infinity/.test(icon),'Generated suit thumbnails contain finite SVG');
}
console.log('Navy suit: four registered pieces with flesh skin and the tie integrated into the jacket, cleared conflicts, independent selection/removal and valid thumbnails.');
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
// A preset may also bring a skin of its own, and then it replaces it.
const pochita=presets.find(preset=>preset.id==='pochita-suit');
assert.equal(pochita.applied.skin,'pochita');
assert.equal(pochita.applied.helmet,'chainsaw');
console.log('Every remaining suit is a combination of independently selectable catalog items.');

const layered=vm.runInContext(`(()=>{
 applyDecorationSelection('shirt','loose-tee');
 applyDecorationSelection('outerwear','suit-jacket');
 const worn=selectedDecorations.shirt==='loose-tee'&&selectedDecorations.outerwear==='suit-jacket';
 applyDecorationSelection('outerwear',null);
 return worn&&selectedDecorations.shirt==='loose-tee'&&selectedDecorations.outerwear===null;
})()`,context);
assert.ok(layered,'Suit jacket occupies outerwear and preserves its inner shirt on selection/removal');
for(const id of ['ivory-suit','navy-suit','batfish-suit'])assert.equal(presets.find(p=>p.id===id).applied.skin,'flesh',id+' includes the unnumbered flesh skin');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
assert.equal([...html.matchAll(/data-category="([^"]+)"/g)][0][1],'suit','Suit tab is first');
assert.equal(vm.runInContext('decorationCounts().categories.suit',context),presets.length-3,'Suit badge excludes the three disabled outfits');
assert.equal(vm.runInContext("decorationCatalog.skin.find(s=>s.id==='pochita').name",context),'大眼睛皮肤');
assert.equal(vm.runInContext('POCHITA_TAIL_VISIBLE',context),false,'Tail is hidden behind a reversible flag');
assert.ok(vm.runInContext('pochitaCordSource.length>0&&pochitaGripSource.length>0',context),'Tail artwork remains available');

const workPresets=vm.runInContext(`(()=>{
 const results={};
 for(const id of ['farmer-suit','fisher-suit','working-fish-suit']){
  selectedDecorations.skin='clown';applyDecorationSelection('suit',id);
  results[id]={...selectedDecorations,color:skinColor()};
 }
 return {results,wide:styleGroup('pants','wide')[2],oldPants:decorationCatalog.pants.some(p=>p.id==='wide-pants'),boots:bootProfiles['brown-worker-boots'],tee:teeStyles['red-cropped-tee-2']};
})()`,context);
for(const [id,pieces] of Object.entries({
 'farmer-suit':{skin:null,neck:'scarf',pants:'jumpsuit',shirt:null,helmet:null,shoes:null},
 'fisher-suit':{skin:'blue-color-skin',helmet:'yellow-hat',outerwear:'green-vest',shoes:'brown-worker-boots',pants:'worker-trousers',shirt:null},
 'working-fish-suit':{skin:'cyan-color-skin',pants:'navy-jumpsuit',shirt:'red-cropped-tee-2',helmet:null,shoes:null}
}))for(const [slot,value] of Object.entries(pieces))assert.equal(workPresets.results[id][slot],value,id+'/'+slot);
assert.equal(workPresets.results['farmer-suit'].color,'#C5C5C5');
assert.equal(workPresets.results['fisher-suit'].color,'#438FF1');
assert.equal(workPresets.results['working-fish-suit'].color,'#37B2EC');
assert.deepEqual(Array.from(workPresets.wide),['worker-trousers','blue-worker-trousers']);assert.equal(workPresets.oldPants,false);
assert.equal(workPresets.boots.color,'#59371F');assert.ok(workPresets.boots.tuckPants);
assert.equal(workPresets.tee.color,'#DE0C0C');assert.equal(workPresets.tee.sleeveEnd,17);
console.log('Farmer, fisher and working-fish presets apply exact components and skin colors; wide trousers contain only the two worker colors.');

const godPreview=fs.readFileSync(path.join(__dirname,'../svg/fish-god-suit.svg'),'utf8');
const glassOutline=[...godPreview.matchAll(/<path\b[^>]*>/g)].map(m=>m[0]).find(tag=>tag.includes('M45.6943 0.5'));
assert.ok(glassOutline&&glassOutline.includes('fill="none"'),'Oxygen helmet outline must stay unfilled over the gradient face');
