const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const inputs = ['body','width','arms','legs','head'].map(key => ({dataset:{control:key},value:'100'}));
const undoButton = {setAttribute(){}};
const context = vm.createContext({
  document: {querySelector: () => undoButton, querySelectorAll: () => inputs},
  requestAnimationFrame: () => 1, cancelAnimationFrame() {}, console
});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8').split('resetButton.addEventListener')[0], context);
vm.runInContext('update=()=>{};renderDecorationOptions=()=>{};closeDecorationVariantMenu=()=>{};', context);
const run = code => JSON.parse(vm.runInContext(`JSON.stringify((()=>{${code}})())`, context));
const results = run(`
  const snapshot=()=>JSON.stringify(captureEditorState());
  const original=snapshot();
  selectDecoration('shirt','patched-tee');
  const dressed=snapshot();
  undoEditorChange();
  const shirtUndo=snapshot()===original;
  selectDecoration('shirt','patched-tee');
  randomizeClothes();
  const randomAtomic=editorHistory.length===2;
  const bodyUnchanged=Object.values(controls).every(input=>input.value==='100');
  const changedShirt=selectedDecorations.shirt!=='patched-tee';
  undoEditorChange();
  const randomUndo=snapshot()===dressed;
  undoEditorChange();
  const originalAgain=snapshot()===original;
  const emptyDisabled=resetButton.disabled;
  undoEditorChange();
  const emptySafe=snapshot()===original;

  selectDecoration('shirt','patched-tee');const one=snapshot();
  selectDecoration('pants','worker-trousers');
  selectDecoration('skin','rainbow-color-skin');
  selectDecoration('helmet','yellow-hat');
  const limited=editorHistory.length===3;
  undoEditorChange();undoEditorChange();undoEditorChange();
  const oldestRetained=snapshot()===one&&editorHistory.length===0;
  undoEditorChange();
  const cannotUndoFourth=snapshot()===one;

  baseDecorationSelections.shirt='tee';
  const withBase=snapshot();
  clearAllDecorations();undoEditorChange();
  const baseRestored=snapshot()===withBase;
  const beforeSuit=snapshot();
  selectDecoration('suit','farmer-suit');undoEditorChange();
  const suitAtomic=snapshot()===beforeSuit;
  const beforeClear=snapshot();
  clearAllDecorations();const afterClear=editorHistory.length;
  clearAllDecorations();
  const noOp=editorHistory.length===afterClear;
  undoEditorChange();const clearUndo=snapshot()===beforeClear;

  editorHistory.length=0;
  const beforeSlider=captureEditorState();
  controls.body.value='110';controls.body.value='140';
  recordEditorChange(beforeSlider);
  undoEditorChange();
  const sliderUndo=controls.body.value==='100';
  return {shirtUndo,randomAtomic,bodyUnchanged,changedShirt,randomUndo,originalAgain,emptyDisabled,emptySafe,limited,oldestRetained,cannotUndoFourth,baseRestored,suitAtomic,noOp,clearUndo,sliderUndo};
`);
for (const [name,passed] of Object.entries(results)) assert.equal(passed,true,name);
console.log('Editor history: three-step limit, atomic random outfits and suits, exact clothing/base/skin/hat restoration, no-op filtering, empty undo and grouped slider edits.');

const randomRules=run(`
 const originalRandom=Math.random;
 let excluded=true,undoRestores=true;
 try{
  for(const special of specialShirtIds){
   for(let sample=0;sample<100;sample++){
    applyDecorationSelection('shirt',special);editorHistory.length=0;
    Math.random=()=>sample/100;
    randomizeClothes();
    excluded&&=decorationCatalog.shirt.some(item=>item.id===selectedDecorations.shirt)&&!specialShirtIds.includes(selectedDecorations.shirt);
    undoEditorChange();
    undoRestores&&=selectedDecorations.shirt===special;
   }
  }
 }finally{Math.random=originalRandom;}
 return {excluded,undoRestores};
`);
assert.equal(randomRules.excluded,true,'Random outfits never choose a special shirt');
assert.equal(randomRules.undoRestores,true,'Undo restores a manually selected special shirt worn before randomizing');
console.log('Random outfits exclude every special shirt across sampled random values; undo restores the original special shirt.');

const bodyActions=run(`
 const ranges={body:[15,220],width:[60,150],arms:[55,240],legs:[50,180],head:[70,140]};
 for(const [key,[min,max]] of Object.entries(ranges))Object.assign(controls[key],{min:String(min),max:String(max),value:'100'});
 applyDecorationSelection('suit','ivory-suit');
 const clothes=JSON.stringify(selectedDecorations),before=JSON.stringify(captureEditorState());
 const originalRandom=Math.random;
 let inRange=true,allSampled=true,undoRestores=true;
 try{
  for(const value of [0,.5,.999999]){
   let samples=0;Math.random=()=>{samples++;return value;};editorHistory.length=0;
   randomizeControls();
   allSampled&&=samples===5;
   inRange&&=Object.entries(controls).every(([key,input])=>Number(input.value)>=ranges[key][0]&&Number(input.value)<=ranges[key][1]);
   if(JSON.stringify(selectedDecorations)!==clothes)throw Error('Random body changed clothes');
   undoEditorChange();undoRestores&&=JSON.stringify(captureEditorState())===before;
  }
  for(const input of Object.values(controls))input.value='140';
  resetControls();
  const resetAll=Object.values(controls).every(input=>Number(input.value)===100);
  undoEditorChange();
  return {inRange,allSampled,undoRestores,resetAll,resetUndo:Object.values(controls).every(input=>Number(input.value)===140),clothesKept:JSON.stringify(selectedDecorations)===clothes};
 }finally{Math.random=originalRandom;}
`);
for(const [key,value] of Object.entries(bodyActions))assert.equal(value,true,key);
console.log('Body actions: sample all five slider ranges, reset all five to 100, preserve clothes and undo each action in one step.');
