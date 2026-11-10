const host = document.querySelector('#character');
const controls = Object.fromEntries(
  [...document.querySelectorAll('[data-control]')].map(input => [input.dataset.control, input])
);
const resetButton = document.querySelector('[data-action="undo"]');
const randomButton = document.querySelector('[data-action="randomize"]');
const exportButton = document.querySelector('[data-action="export"]');
const clearDecorationsButton = document.querySelector('[data-action="clear-decorations"]');
const decorationOptions = document.querySelector('[data-decoration-options]');
const motionList = document.querySelector('[data-motions]');
const recordedList = document.querySelector('[data-recorded-motions]');
const motionTabs = [...document.querySelectorAll('[data-motion-tab]')];
const motionPanes = [...document.querySelectorAll('[data-motion-pane]')];
const recordButton = document.querySelector('[data-action="record"]');
const saveMotionButton = document.querySelector('[data-action="save-motion"]');
const motionHint = document.querySelector('[data-motion-hint]');
const decorationTabs = [...document.querySelectorAll('[data-category]')];
const SVG_NS = 'http://www.w3.org/2000/svg';
// The notch in the head's top-left corner is the mouth: `corner` is where
// its two edges meet, `jaw` is the point of the lower one and `spike` the
// point of the upper one. Opening it swings the lower jaw about the corner.
const JAW = {corner: [40.1394, 29.4449], jaw: [32.3001, 23.0968],
  spike: [44.2249, 11.0386]};
// The notch as drawn spans 63.5 degrees. `mouth` runs from -1, shut, through
// 0, the drawing untouched, to 1, wide open; the limits below are how far
// the notch opens or closes in total, and shutting it is the bigger move.
// MOUTH_SHUT is that 63.5 degrees exactly, so -1 brings the two jaws onto
// each other rather than past one another.
// The drawing's own mouth shuts flush: `MOUTH_SHUT` is exactly the 63.5
// degrees its notch spans. A skin whose lip shape cannot take that — a
// curve reaching past its corner, whose stroked edges then read as two
// crossed lines — overrides it with `mouthShut` in `skinTraits`.
const MOUTH_SHUT = 1.108, MOUTH_OPEN = .5;
// The bat cowl's own notch is 45.9 degrees wide where the head's is 63.5,
// so it takes that share of the jaw's swing — measured, a little under the
// ratio itself, so that shut leaves the two points a few degrees apart
// instead of grazing each other. Re-measure it after any change to how the
// jaw's weights are split.
const COWL_JAW_SHARE = .57;
// Both lips move, the top one far less: a jaw working alone looks hinged,
// while a little counter-swing above reads as speech. The upper lip is
// almost twice as long as the jaw, so even this small share of the angle
// carries its point about a third as far.
const UPPER_LIP_SHARE = .16;
// Aqua glass dome, as in the reference art (svg/toukui.svg).
const HELMET_GLASS = '#A3EDFF', HELMET_GLASS_OPACITY = '0.45';
// Three plain blue shades plus one selected finish for each shade.
const denimFinishes=['denim-jeans','washed-denim-jeans','ripped-denim-jeans','large-ripped-denim-jeans'];
const denimVariants=Object.fromEntries([
 {prefix:'',name:'牛仔蓝',color:'#48769b',wash:'#c1d8e7'},
 {prefix:'light-',name:'浅牛仔蓝',color:'#8eafc7',wash:'#e6eff4'},
 {prefix:'dark-',name:'深牛仔蓝',color:'#294760',wash:'#779db8'},
].flatMap(palette=>denimFinishes.map((finish,index)=>[palette.prefix+finish,{
 finish,color:palette.color,wash:palette.wash,
 name:palette.name+['普通牛仔裤','水洗牛仔裤','小破洞牛仔裤','大破洞牛仔裤'][index],
}])).filter(([id])=>['denim-jeans','washed-denim-jeans','light-denim-jeans','light-ripped-denim-jeans','dark-denim-jeans','dark-large-ripped-denim-jeans'].includes(id)));
denimVariants['jobs-gradient-jeans']={finish:'jobs-gradient',name:'渐变牛仔',color:'#667c99',wash:'#8c8c8c'};
function denimColor(id=selectedDecorations.pants){return denimVariants[id]?.color||workwearVariants[id]?.color||decorationColors.denimBlue;}
const boxerVariants={'red-shorts':{name:'红色四角内裤',color:'#d44a49'},'white-boxers':{name:'白色四角内裤',color:'#F2F1EE'},'black-boxers':{name:'黑色四角内裤',color:'#202124'}};
const briefVariants={'red-briefs':{name:'红色三角内裤',color:'#d44a49'},'white-briefs':{name:'白色三角内裤',color:'#F2F1EE'},'black-briefs':{name:'黑色三角内裤',color:'#202124'}};
const thongVariants={'red-thong':{name:'红色丁字裤',color:'#c60000'},'green-thong':{name:'绿色丁字裤',color:'#55a66a'},'purple-thong':{name:'紫色丁字裤',color:'#9364bb'},'white-thong':{name:'白色丁字裤',color:'#F2F1EE'},'black-thong':{name:'黑色丁字裤',color:'#202124'}};
const workwearVariants={
 'denim-jumpsuit':{name:'牛仔蓝连体工装裤',color:'#48769b'},
 'light-denim-jumpsuit':{name:'浅牛仔蓝连体工装裤',color:'#8eafc7'},
 'dark-denim-jumpsuit':{name:'深牛仔蓝连体工装裤',color:'#294760'},
 'orange-jumpsuit':{name:'橙色连体工装裤',color:'#df893d'},
 'pink-jumpsuit':{name:'粉红色连体工装裤',color:'#e69bb7',belt:'#f4eee9',buckle:'#b8dfcf'},
};
const workerJacketVariants={
 'worker-jacket':{body:'#f66b19',collar:'#ff7b25',placket:'#e45b13',seam:'#b84d17'},
 'blue-worker-jacket':{body:'#1d3b68',collar:'#2b4c7b',placket:'#142d53',seam:'#486b97'},
};
const workerPantsColors={'worker-trousers':'#f66b19','blue-worker-trousers':'#1d3b68'};
const spikyHairVariants={
 'yellow-spiky-hair':{name:'黄色刺猬头',color:'#E5DF52'},
 'purple-spiky-hair':{name:'紫色刺猬头',color:'#9259C2'},
 'blue-spiky-hair':{name:'蓝色刺猬头',color:'#338AFF'},
 'red-spiky-hair':{name:'红色刺猬头',color:'#D84B45'},
 'black-spiky-hair':{name:'黑色刺猬头',color:'#25272B'},
 'white-spiky-hair':{name:'白色刺猬头',color:'#F2F1EE'},
 'green-spiky-hair':{name:'绿色刺猬头',color:'#63C549'},
 'pink-spiky-hair':{name:'粉色刺猬头',color:'#FF94C8'},
 'orange-spiky-hair':{name:'橙色刺猬头',color:'#FF922B'},
};
const longBraidVariants={
 'long-braid-hair':{name:'红色长辫发',color:'#CF4D4A'},
 'black-long-braid-hair':{name:'黑色长辫发',color:'#25272B'},
 'white-long-braid-hair':{name:'白色长辫发',color:'#F2F1EE'},
};
const topknotVariants={
 'topknot-hair':{name:'深蓝色小辫头',color:'#2F3C4C'},
 'white-topknot-hair':{name:'白色小辫头',color:'#F2F1EE'},
 'green-topknot-hair':{name:'绿色小辫头',color:'#63C549'},
};
const capVariants={
 'red-baseball-cap':{name:'红色鸭舌帽',color:'#F47272'},
 'blue-baseball-cap':{name:'蓝色鸭舌帽',color:'#4484F4'},
 'green-baseball-cap':{name:'绿色鸭舌帽',color:'#63C549'},
 'black-baseball-cap':{name:'黑色鸭舌帽',color:'#25272B'},
 'yellow-baseball-cap':{name:'黄色鸭舌帽',color:'#FBC723'},
 'white-baseball-cap':{name:'白色鸭舌帽',color:'#F4F3ED'},
};
const divingGoggleVariants={
 'blue-diving-goggles':{name:'蓝色潜水镜',color:'#4484F4',lens:'#A8EFFF'},
 'pink-diving-goggles':{name:'粉红色潜水镜',color:'#F47BC7',lens:'#FFD2F1'},
};
const swimRingVariants={
 'duck-swim-ring':{name:'黄鸭子游泳圈',fill:'#FFE357',stroke:'#FF9829'},
 'pink-striped-swim-ring':{name:'粉色条纹游泳圈',fill:'#FFB4F3',stroke:'#FF70E0'},
};
const eyeBandVariants={
 'blue-eye-band':{name:'蓝色眼带',color:'#0151DE'},
 'red-eye-band':{name:'红色眼带',color:'#C73D36'},
 'black-eye-band':{name:'黑色眼带',color:'#25272B'},
};
const workerHelmetColors={'worker-helmet':'#FBC723','white-worker-helmet':'#f4f3ed'};
const isWorkerJacket=(id=selectedDecorations.outerwear)=>!!workerJacketVariants[id];
const hasLongOuterwear=(id=selectedDecorations.outerwear)=>!!alohaSleeveStyles[id]?.longHem;
const rainbowSkinStops=[[0,'#FF75C3'],[.2,'#FFA647'],[.4,'#FFE83F'],[.6,'#9FFF5B'],[.8,'#70E2FF'],[1,'#CD93FF']];
function rainbowSkinDefs(){
 return `<linearGradient id="rainbow-skin" gradientUnits="userSpaceOnUse" x1="80" y1="198" x2="30" y2="0">${rainbowSkinStops.map(([offset,color])=>`<stop offset="${offset}" stop-color="${color}"/>`).join('')}</linearGradient><linearGradient id="rainbow-skin-horn" gradientUnits="userSpaceOnUse" x1="72" y1="35" x2="72" y2="51"><stop stop-color="#96FF6F"/><stop offset="1" stop-color="#7FFFD9"/></linearGradient>`;
}
const coloredSkinVariants={
 'blue-color-skin':{name:'蓝色皮肤',color:'#438FF1'},
 'cyan-color-skin':{name:'亮蓝色皮肤',color:'#37B2EC'},
 'rainbow-color-skin':{name:'渐变彩色皮肤',color:'url(#rainbow-skin)',gradient:true,hornColor:'url(#rainbow-skin-horn)'},
};
const muscleSkinVariants={
 'muscle-tan':{name:'肉色5肌肉皮肤',color:'#dda579'},
 'muscle-white':{name:'白皙肌肉皮肤',color:'#FFEADD'},
 'muscle-gray':{name:'灰色肌肉皮肤',color:'#C5C5C5'},
 muscle:{name:'肉色肌肉皮肤',color:'#FBD5CA'},
};
const angelWingVariants={
 'angel-wings':{name:'白色天使翅膀',fill:'#FAFAF7',stroke:'#A6B8C8'},
};
const disabledSuitIds=['batfish-suit','pochita-suit','makima-suit'];
const POCHITA_TAIL_VISIBLE=false; // Keep the tail artwork and motion available for later restoration.
const decorationCatalog = {
  skin: [{id:'sponge',name:'海绵皮肤',icon:'./svg/sponge-skin.svg'},...Object.entries(coloredSkinVariants).map(([id,v])=>({id,name:v.name,icon:'./svg/'+id+'.svg'})),{id:'scar',name:'刀疤皮肤',icon:'./svg/scar.svg'},{id:'lipstick-fish',name:'口红鱼皮肤',icon:'./svg/lipstick-fish.svg'},{id:'flesh-8',name:'肉色皮肤8',icon:'./svg/flesh-8.svg'},{id:'flesh-7',name:'肉色皮肤7',icon:'./svg/flesh-7.svg'},...Object.entries(muscleSkinVariants).map(([id,v])=>({id,name:v.name,icon:'./svg/'+(id==='muscle'?'muscle-skin':id)+'.svg'})),{id:'flesh-6',name:'肉色皮肤6',icon:'./svg/flesh-6.svg'},{id:'hypnotic',name:'迷幻眼皮肤',icon:'./svg/hypnotic.svg'},{id:'flesh-5',name:'肉色皮肤5',icon:'./svg/flesh-5.svg'},{id:'flesh-4',name:'肉色皮肤4',icon:'./svg/flesh-4.svg'},{id:'little-yellow-fish',name:'小黄鱼皮肤',icon:'./svg/little-yellow-fish.svg'},{id:'flesh-3',name:'肉色皮肤3',icon:'./svg/flesh-3.svg'},{id:'kappa',name:'河童皮肤',icon:'./svg/kappa.svg'},{id:'flesh-2',name:'肉色皮肤2',icon:'./svg/flesh-2.svg'},
    { id: 'milk-frog', name: '奶鱼', icon: './svg/milk-frog.svg' },
    { id: 'pochita', name: '大眼睛皮肤', icon: './svg/pochita.svg' },
    { id: 'flesh', name: '肉色皮肤1', icon: './svg/flesh-skin.svg' },
    { id: 'clown', name: '小丑皮肤', icon: './svg/clown-skin.svg' },
    { id: 'alien', name: '外星皮肤', icon: './svg/alien-skin.svg' }],
  suit: [{id:'fish-god-suit',name:'鱼神套装',icon:'./svg/fish-god-suit.svg',pieces:{skin:'rainbow-color-skin',outerwear:'pink-striped-swim-ring',helmet:'plain'}},{id:'farmer-suit',name:'农夫套装',defaultSkin:true,icon:'./svg/farmer-suit.svg',pieces:{neck:'scarf',pants:'jumpsuit'}},{id:'fisher-suit',name:'渔人套装',icon:'./svg/fisher-suit.svg',pieces:{skin:'blue-color-skin',helmet:'yellow-hat',outerwear:'green-vest',shoes:'brown-worker-boots',pants:'worker-trousers'}},{id:'working-fish-suit',name:'工鱼套装',icon:'./svg/working-fish-suit.svg',pieces:{skin:'cyan-color-skin',pants:'navy-jumpsuit',shirt:'red-cropped-tee-2'}},{id:'beach-suit',name:'海滩套装',icon:'./svg/beach-suit.svg',pieces:{skin:'flesh-4',shirt:'shell-top',pants:'green-ultra-shorts'}},{id:'streaker-suit',name:'裸奔套装',icon:'./svg/streaker-suit.svg',pieces:{skin:'lipstick-fish',helmet:'pink-ribbon-hair',shirt:'mosaic-top',pants:'mosaic-pants'}},{id:'angel-suit',name:'天使套装',icon:'./svg/angel-suit.svg',pieces:{skin:'flesh-8',helmet:'angel-halo',shirt:'angel-vest',pants:'white-loose-wide-trousers',cape:'angel-wings'}},{id:'astronaut-suit',name:'宇航员套装',icon:'./svg/astronaut-suit.svg',pieces:{helmet:'space-helmet',outerwear:'space-shirt',pants:'space-trousers',shoes:'orange-shoes',gloves:'space-gloves'}},{id:'topknot-suit',name:'小辫子男套装',icon:'./svg/topknot-suit.svg',pieces:{skin:'flesh-6',helmet:'topknot-hair',shirt:'white-tie-shirt',outerwear:'charcoal-blazer',pants:'dark-gray-slight-wide-trousers',shoes:'colorblock-shoes'}},{id:'makima-suit',name:'马奇马套装',icon:'./svg/makima-suit.svg',pieces:{skin:'hypnotic',helmet:'long-braid-hair',shirt:'white-tie-shirt',pants:'dark-gray-slight-wide-trousers',shoes:'brown-shoes'}},{id:'secondary-suit',name:'中学生套装',icon:'./svg/secondary-suit.svg',pieces:{skin:'flesh-5',helmet:'secondary-hat',outerwear:'secondary-jacket',pants:'black-slight-wide-trousers',shoes:'brown-shoes'}},{id:'student-suit',name:'小学生套装',icon:'./svg/student-suit.svg',pieces:{skin:'flesh-4',helmet:'student-hat',outerwear:'student-jacket',pants:'student-shorts',shoes:'student-long-socks-shoes'}},{id:'blue-worker-suit',name:'蓝色工人套装',icon:'./svg/blue-worker-suit.svg',pieces:{skin:'flesh-3',helmet:'white-worker-helmet',outerwear:'blue-worker-jacket',pants:'blue-worker-trousers',shoes:'gray-worker-boots'}},{id:'worker-suit',name:'橙色工人套装',icon:'./svg/worker-suit.svg',pieces:{skin:'flesh-3',helmet:'worker-helmet',outerwear:'worker-jacket',pants:'worker-trousers',shoes:'worker-boots'}},{id:'kappa-suit',name:'河童套装',icon:'./svg/kappa-suit.svg',pieces:{skin:'kappa',helmet:'kappa-hair',cape:'kappa-shell'}},{id:'jobs-suit',name:'乔布斯套装',icon:'./svg/jobs-suit.svg',pieces:{skin:'flesh-2',helmet:'round-glasses',shirt:'black-turtleneck-tee',pants:'jobs-gradient-jeans',shoes:'gray-sneakers'}},{id:'clown-suit',name:'小丑鱼人套装',icon:'./svg/clown-suit.svg',
    pieces:{skin:'clown',helmet:'party-hat'}},
    {id:'shark-suit',name:'鲨鱼人套装',icon:'./svg/shark-suit.svg',
    pieces:{skin:'flesh',helmet:'shark-hood',pants:'black-shorts'}},
    {id:'pochita-suit',name:'波吉塔套装',icon:'./svg/pochita-suit.svg',
    pieces:{skin:'pochita',helmet:'chainsaw'}},
    {id:'batfish-suit',name:'蝙蝠侠鱼人套装',icon:'./svg/batfish-suit.svg',pieces:{skin:'flesh',helmet:'batfish-cowl',shirt:'batfish-armor',pants:'batfish-trousers',shoes:'batfish-boots',gloves:'batfish-gloves',cape:'charcoal-cape'}},{id:'ivory-suit',name:'白金国王套装',icon:'./svg/ivory-suit.svg',pieces:{skin:'flesh',helmet:'crown',shirt:'ivory-tunic',pants:'ivory-trousers',shoes:'dark-boots',cape:'crimson-cape'}},{id:'navy-suit', name:'藏蓝西装套装', icon:'./svg/navy-suit.svg',
    pieces:{skin:'flesh',outerwear:'suit-jacket', pants:'suit-trousers', shoes:'black-dress-shoes'}},
    ],
  helmet: [...Object.entries({...capVariants,...divingGoggleVariants}).map(([id,v])=>({id,name:v.name,icon:'./svg/'+id+'.svg'})),...Object.entries(eyeBandVariants).map(([id,v])=>({id,name:v.name,icon:'./svg/'+id+'.svg'})),{id:'teardrop-earrings',name:'水滴耳环',icon:'./svg/teardrop-earrings.svg'},{id:'pink-ribbon-hair',name:'粉红色飘带发型',icon:'./svg/pink-ribbon-hair.svg'},{id:'angel-halo',name:'天使光环',icon:'./svg/angel-halo.svg'},...Object.entries(spikyHairVariants).map(([id,v])=>({id,name:v.name,icon:'./svg/'+id+'.svg'})),{id:'space-helmet',name:'宇航员头盔',icon:'./svg/space-helmet.svg'},...Object.entries(topknotVariants).map(([id,v])=>({id,name:v.name,icon:'./svg/'+id+'.svg'})),...Object.entries(longBraidVariants).map(([id,v])=>({id,name:v.name,icon:'./svg/'+id+'.svg'})),{id:'secondary-hat',name:'中学生帽子',icon:'./svg/secondary-hat.svg'},{id:'student-hat',name:'小学生帽子',icon:'./svg/student-hat.svg'},{id:'white-worker-helmet',name:'白色工人安全帽',icon:'./svg/white-worker-helmet.svg'},{id:'worker-helmet',name:'黄色工人安全帽',icon:'./svg/worker-helmet.svg'},{id:'kappa-hair',name:'河童发型',icon:'./svg/kappa-hair.svg'},{id:'round-glasses',name:'棕框眼镜',icon:'./svg/round-glasses.svg'},
    {id:'party-hat',name:'派对帽',icon:'./svg/party-hat.svg'},
    {id:'large-party-hat',name:'大派对帽',icon:'./svg/large-party-hat.svg'},
    {id:'shark-hood',name:'鲨鱼头套',icon:'./svg/shark-hood.svg'},
    {id:'chainsaw',name:'电锯头盔',icon:'./svg/chainsaw.svg'},
    {id:'batfish-cowl',name:'尖耳头罩',icon:'./svg/batfish-cowl.svg'},
    { id: 'plain', name: '氧气头盔', icon: './svg/toukui.svg' },
    { id: 'yellow-hat', name: '黄色宽檐帽', icon: './svg/yellow-hat.svg' },
    { id: 'crown', name: '皇冠', icon: './svg/crown.svg' },
  ],
  neck: [
    {id:'cigarette',name:'叼烟',icon:'./svg/cigarette.svg'},
    { id: 'scarf', name: '红围巾', icon: './svg/decoration-scarf.svg' },
  ],
  shirt: [{id:'gray-scoop-tee',name:'灰色深圆领弧摆短袖',icon:'./svg/gray-scoop-tee.svg'},{id:'shell-top',name:'白色贝壳上衣',icon:'./svg/shell-top.svg',sleeveless:true},{id:'mosaic-top',name:'马赛克上衣',icon:'./svg/mosaic-top.svg'},{id:'angel-vest',name:'天使配色无袖背心',icon:'./svg/angel-vest.svg',sleeveless:true},{id:'white-tie-shirt',name:'白色衬衫',icon:'./svg/white-tie-shirt.svg'},{id:'black-turtleneck-tee',name:'高领黑色半袖',icon:'./svg/black-turtleneck-tee.svg'},
    {id:'batfish-armor',name:'鱼徽战衣',icon:'./svg/batfish-armor.svg'},{id:'ivory-tunic',name:'白金束腰阔袖上衣',icon:'./svg/ivory-tunic.svg'},
    { id: 'plain', name: '普通长袖上衣', icon: './svg/decoration-shirt.svg' },
    { id: 'blue-vest', name: '蓝色 V 领背心', icon: './svg/blue-vest.svg', sleeveless: true },
    { id: 'yellow-tee', name: '黄色宽松短袖', icon: './svg/yellow-tee.svg' },
    { id: 'patched-tee', name: '补丁短袖', icon: './svg/patched-tee.svg' },
    { id: 'red-triangle', name: '红色三角衣服', icon: './svg/red-triangle.svg', sleeveless: true },
    { id: 'coral-tee', name: '红色短款短袖', icon: './svg/coral-tee.svg' },
    {id:'red-cropped-tee-2',name:'红色短款短袖2',icon:'./svg/red-cropped-tee-2.svg'},
    {id:'black-cropped-tee',name:'黑色短款短袖',icon:'./svg/black-cropped-tee.svg'},
    { id: 'loose-tee', name: '宽松T恤', icon: './svg/loose-tee.svg' },
    { id: 'loose-long-sleeve', name: '宽松长袖上衣', icon: './svg/loose-long-sleeve.svg' },
    {id:'cinched-long-sleeve',name:'收口宽松长袖',icon:'./svg/cinched-long-sleeve.svg'},
  ],
  pants: [{id:'black-gray-sweatpants',name:'黑灰宽松卫裤',icon:'./svg/black-gray-sweatpants.svg'},{id:'mosaic-pants',name:'马赛克裤子',icon:'./svg/mosaic-pants.svg'},{id:'white-loose-wide-trousers',name:'白色超阔长裤',icon:'./svg/white-loose-wide-trousers.svg'},{id:'space-trousers',name:'宇航配色宽松卫裤',icon:'./svg/space-trousers.svg'},
    {id:'dark-gray-slight-wide-trousers',name:'深灰色微阔长裤',icon:'./svg/dark-gray-slight-wide-trousers.svg'},
    {id:'black-slight-wide-trousers',name:'黑色微阔长裤',icon:'./svg/black-slight-wide-trousers.svg'},
    {id:'green-ultra-shorts',name:'绿色微阔超短裤',icon:'./svg/green-ultra-shorts.svg'},{id:'student-shorts',name:'藏蓝小学生短裤',icon:'./svg/student-shorts.svg'},
    {id:'blue-worker-trousers',name:'深蓝工人裤',icon:'./svg/blue-worker-trousers.svg'},{id:'worker-trousers',name:'橙色工人裤',icon:'./svg/worker-trousers.svg'},{id:'batfish-trousers',name:'深灰战裤',icon:'./svg/batfish-trousers.svg'},{id:'ivory-trousers',name:'象牙白阔腿裤',icon:'./svg/ivory-trousers.svg'},
    {id:'royal-trousers',name:'国王白长裤',icon:'./svg/royal-trousers.svg'},
    {id:'suit-trousers', name:'藏蓝西装长裤', icon:'./svg/suit-trousers.svg'},
    { id: 'plain', name: '紧身裤', icon: './svg/decoration-pants.svg' },
    { id: 'jumpsuit', name: '蓝色连体裤', icon: './svg/decoration-jumpsuit.svg', sleeveless: true },
    { id: 'navy-jumpsuit', name: '深蓝色连体裤', icon: './svg/navy-jumpsuit.svg', sleeveless: true },
    ...Object.entries({...boxerVariants,...briefVariants}).map(([id,item])=>({id,name:item.name,icon:`./svg/${id}.svg`})),
    { id: 'pink-shorts', name: '粉色短裤', icon: './svg/pink-shorts.svg' },
    { id: 'orange-shorts', name: '橙色短裤', icon: './svg/orange-shorts.svg' },
    { id: 'black-shorts', name: '黑色短裤', icon: './svg/black-shorts.svg' },
    {id:'slight-wide-shorts',name:'灰青色微阔短裤',icon:'./svg/slight-wide-shorts.svg'},
    {id:'extra-wide-shorts',name:'灰青色阔腿短裤',icon:'./svg/extra-wide-shorts.svg'},
    ...Object.entries(thongVariants).map(([id,item])=>({id,name:item.name,icon:`./svg/${id}.svg`})),
    ...Object.entries(denimVariants).map(([id,variant])=>({id,name:variant.name,icon:`./svg/${id}.svg`})),
    ...Object.entries(workwearVariants).map(([id,item])=>({id,name:item.name,icon:`./svg/${id}.svg`,sleeveless:true})),
    { id: 'loose-wide-pants', name: '几何拼贴阔腿裤', icon: './svg/loose-wide-pants.svg' },
  ],
  outerwear: [...Object.entries(swimRingVariants).map(([id,v])=>({id,name:v.name,icon:'./svg/'+id+'.svg'})),{id:'space-shirt',name:'宇航配色宽松卫衣',icon:'./svg/space-shirt.svg'},{id:'charcoal-blazer',name:'深灰西装外套',icon:'./svg/charcoal-blazer.svg'},
    {id:'secondary-jacket',name:'中学生外套',icon:'./svg/secondary-jacket.svg'},
    {id:'student-jacket',name:'小学生外套',icon:'./svg/student-jacket.svg'},
    {id:'blue-worker-jacket',name:'深蓝反光工人外套',icon:'./svg/blue-worker-jacket.svg'},{id:'worker-jacket',name:'橙色反光工人外套',icon:'./svg/worker-jacket.svg'},
    {id:'suit-jacket', name:'藏蓝西装上衣', icon:'./svg/suit-jacket.svg'},
    {id:'aloha-jacket',name:'藏蓝短袖外套',icon:'./svg/aloha-jacket.svg'},
    {id:'aloha-long-jacket',name:'藏蓝长袖外套',icon:'./svg/aloha-long-jacket.svg'},
    {id:'aloha-open-jacket',name:'藏蓝敞胸短袖外套',icon:'./svg/aloha-open-jacket.svg'},
    {id:'aloha-open-long-jacket',name:'藏蓝敞胸长袖外套',icon:'./svg/aloha-open-long-jacket.svg'},
    { id: 'green-vest', name: '绿色开襟外套', icon: './svg/green-vest.svg', sleeveless: true },
  ],
  shoes: [{id:'brown-worker-boots',name:'棕色宽筒长靴',icon:'./svg/brown-worker-boots.svg'},{id:'navy-slippers',name:'深蓝色拖鞋',icon:'./svg/navy-slippers.svg'},{id:'navy-sandals',name:'深蓝色凉鞋',icon:'./svg/navy-sandals.svg'},{id:'orange-shoes',name:'橙色普通鞋',icon:'./svg/orange-shoes.svg'},{id:'colorblock-shoes',name:'灰蓝拼色鞋',icon:'./svg/colorblock-shoes.svg'},{id:'brown-shoes',name:'棕色普通鞋',icon:'./svg/brown-shoes.svg'},{id:'student-long-socks-shoes',name:'黑鞋长白袜',icon:'./svg/student-long-socks-shoes.svg'},{id:'student-shoes',name:'黑鞋短白袜',icon:'./svg/student-shoes.svg'},{id:'black-worker-boots',name:'黑色宽筒长靴',icon:'./svg/black-worker-boots.svg'},{id:'blue-worker-boots',name:'蓝色宽筒长靴',icon:'./svg/blue-worker-boots.svg'},{id:'gray-worker-boots',name:'灰色宽筒长靴',icon:'./svg/gray-worker-boots.svg'},{id:'worker-boots',name:'黄色宽筒长靴',icon:'./svg/worker-boots.svg'},{id:'gray-sneakers',name:'灰色系带休闲鞋',icon:'./svg/gray-sneakers.svg'},{id:'batfish-boots',name:'黑色战靴',icon:'./svg/batfish-boots.svg'},
    {id:'black-dress-shoes', name:'黑皮鞋', icon:'./svg/black-dress-shoes.svg'},
    { id: 'plain', name: '普通鞋子', icon: './svg/decoration-shoes.svg' },
    { id: 'brown-boots', name: '棕色长靴', icon: './svg/brown-boots.svg' },
    { id: 'dark-boots', name: '深棕色长靴', icon: './svg/dark-boots.svg' },
  ],
  cape: [{id:'gourd',name:'葫芦',icon:'./svg/gourd.svg'},{id:'paired-swords',name:'佩剑',icon:'./svg/paired-swords.svg'},...Object.entries(angelWingVariants).map(([id,v])=>({id,name:v.name,icon:'./svg/'+id+'.svg'})),{id:'dual-swords',name:'双刀',icon:'./svg/dual-swords.svg'},{id:'greatsword',name:'大剑',icon:'./svg/greatsword.svg'},{id:'kappa-shell',name:'河童龟壳',icon:'./svg/kappa-shell.svg'},{id:'crimson-cape',name:'绯红披风',icon:'./svg/crimson-cape.svg'},
    {id:'charcoal-cape',name:'漆黑披风',icon:'./svg/charcoal-cape.svg'},
    {id:'azure-cape',name:'湛蓝披风',icon:'./svg/azure-cape.svg'},
    {id:'solid-red-cape',name:'纯色红披风',icon:'./svg/solid-red-cape.svg'},
    {id:'solid-blue-cape',name:'纯色蓝披风',icon:'./svg/solid-blue-cape.svg'},
    {id:'solid-black-cape',name:'纯色黑披风',icon:'./svg/solid-black-cape.svg'}],
  gloves: [{id:'space-gloves',name:'橙色宇航手套',icon:'./svg/space-gloves.svg'},{id:'batfish-gloves',name:'黑色手套',icon:'./svg/batfish-gloves.svg'},{ id: 'plain', name: '普通手套', icon: './svg/decoration-gloves.svg' }],
};
// Catalog IDs stay stable for suits and saved selections; these are UI families.
const specialShirtIds=['batfish-armor','ivory-tunic'];
const decorationStyleGroups={
 skin:[['colored-skin','彩色皮肤',Object.keys(coloredSkinVariants)],['muscle','肌肉皮肤',Object.keys(muscleSkinVariants)],['flesh','肉色皮肤',['flesh','flesh-2','flesh-3','flesh-4','flesh-5','flesh-6','flesh-7','flesh-8']],...decorationCatalog.skin.filter(item=>!coloredSkinVariants[item.id]&&!muscleSkinVariants[item.id]&&!['flesh','flesh-2','flesh-3','flesh-4','flesh-5','flesh-6','flesh-7','flesh-8'].includes(item.id)).map(item=>[item.id,item.name,[item.id]])],
 helmet:[['baseball-cap','鸭舌帽',Object.keys(capVariants)],['diving-goggles','潜水镜',Object.keys(divingGoggleVariants)],['eye-band','眼带',Object.keys(eyeBandVariants)],['spiky-hair','刺猬头',Object.keys(spikyHairVariants)],['worker-helmet','工人安全帽',Object.keys(workerHelmetColors)],['topknot-hair','小辫头',Object.keys(topknotVariants)],['long-braid-hair','长辫发',Object.keys(longBraidVariants)],...decorationCatalog.helmet.filter(item=>!capVariants[item.id]&&!divingGoggleVariants[item.id]&&!eyeBandVariants[item.id]&&!spikyHairVariants[item.id]&&!workerHelmetColors[item.id]&&!topknotVariants[item.id]&&!longBraidVariants[item.id]).map(item=>[item.id,item.name,[item.id]])],
 shirt:[
  ['tee','圆领短袖',['yellow-tee','patched-tee']],
  ['short-tee','短款短袖',['coral-tee','red-cropped-tee-2','black-cropped-tee']],
  ['scoop-tee','深圆领弧摆短袖',['gray-scoop-tee']],
  ['loose-tee','宽松T恤',['loose-tee']],
  ['turtleneck-tee','高领半袖',['black-turtleneck-tee']],
  ['long-shirt','长袖上衣',['plain']],
  ['loose-long','宽松长袖',['loose-long-sleeve']],
  ['cinched','收口长袖',['cinched-long-sleeve']],
  ['collared','衬衫',['white-tie-shirt']],
  ['vest','V领背心',['blue-vest']],
  ['angel-vest','无袖背心',['angel-vest']],
  ['shell-top','贝壳上衣',['shell-top']],
  ['triangle','三角上衣',['red-triangle']],
  ['mosaic-top','马赛克上衣',['mosaic-top']]],
 pants:[['mosaic-pants','马赛克裤子',['mosaic-pants']],['space','宽松卫裤',['space-trousers','black-gray-sweatpants']],['fitted','紧身长裤',['plain','batfish-trousers']],
  ['slight-wide','微阔长裤',['suit-trousers','dark-gray-slight-wide-trousers','black-slight-wide-trousers','royal-trousers','jobs-gradient-jeans']],
  ['wide','宽松长裤',['worker-trousers','blue-worker-trousers']],
  ['extra-wide','阔腿长裤',['ivory-trousers']],
  ['loose-wide','超阔长裤',['loose-wide-pants','white-loose-wide-trousers']],
  ['jeans','宽松牛仔裤',Object.keys(denimVariants).filter(id=>id!=='jobs-gradient-jeans')],
  ['denim-jumpsuit','连体工装裤',Object.keys(workwearVariants)],['jumpsuit','连体裤',['jumpsuit','navy-jumpsuit']],['briefs','四角内裤',Object.keys(boxerVariants)],['triangle-briefs','三角内裤',Object.keys(briefVariants)],['thong','丁字裤',Object.keys(thongVariants)],
  ['shorts','紧身短裤',['pink-shorts','orange-shorts','black-shorts']],['slight-wide-ultra-shorts','微阔超短裤',['student-shorts','green-ultra-shorts']],
  ['slight-wide-shorts','微阔短裤',['slight-wide-shorts']],
  ['extra-wide-shorts','阔腿短裤',['extra-wide-shorts']]],
 outerwear:[['swim-ring','游泳圈',Object.keys(swimRingVariants)],['space','宽松卫衣',['space-shirt']],['blazer','西装外套',['charcoal-blazer']],['secondary','中学生外套',['secondary-jacket']],['student','小学生外套',['student-jacket']],['worker','工人外套',['worker-jacket','blue-worker-jacket']],['suit','西装上衣',['suit-jacket']],['short','短袖外套',['aloha-jacket']],['long','长袖外套',['aloha-long-jacket']],
  ['open-short','敞胸短袖外套',['aloha-open-jacket']],['open-long','敞胸长袖外套',['aloha-open-long-jacket']],
  ['vest','无袖开襟外套',['green-vest']]],
 shoes:[['slippers','拖鞋',['navy-slippers']],['sandals','凉鞋',['navy-sandals']],['colorblock-shoes','拼色鞋子',['colorblock-shoes']],['short-sock-shoes','短袜鞋',['student-shoes']],['long-sock-shoes','长袜鞋',['student-long-socks-shoes']],['work-boots','宽筒长靴',['worker-boots','gray-worker-boots','black-worker-boots','blue-worker-boots','brown-worker-boots']],['sneakers','系带休闲鞋',['gray-sneakers']],['shoes','鞋子',['plain','black-dress-shoes','brown-shoes','orange-shoes']],['boots','长靴',['brown-boots','dark-boots','batfish-boots']]],
 gloves:[['gloves','手套',['plain','space-gloves']],['guards','护腕手套',['batfish-gloves']]],
 cape:[['gourd','葫芦',['gourd']],['paired-swords','佩剑',['paired-swords']],['angel-wings','天使翅膀',Object.keys(angelWingVariants)],['dual-swords','双刀',['dual-swords']],['greatsword','大剑',['greatsword']],['shell','龟壳',['kappa-shell']],['cape','披风',['crimson-cape','charcoal-cape','azure-cape','solid-red-cape','solid-blue-cape','solid-black-cape']]],
};
const baseDecorationSelections={};
const BASE_GARMENT_COLOR='#a6a6a6';
let basePaintRestore=[];
function restoreBasePaint(){
 for(const [node,attr,value] of basePaintRestore){
  if(value===null)node.removeAttribute(attr);else node.setAttribute(attr,value);
 }
 basePaintRestore=[];
}
function grayGarmentNode(node){
 if(!node)return;
 const nodes=[node,...(node.querySelectorAll?.('path,stop,polygon,circle,rect')||[])];
 for(const part of nodes)for(const attr of ['fill','stroke','stop-color']){
  const value=part.getAttribute?.(attr);
  if(!value||['none','black','#000','#000000','transparent'].includes(value.toLowerCase())||value.startsWith('url('))continue;
  basePaintRestore.push([part,attr,value]);part.setAttribute(attr,BASE_GARMENT_COLOR);
 }
}
function applyBaseGarmentPaint(){
 const base=baseDecorationSelections;
 const shirtKeys=['jobsCollar','jobsCollarEdge',...innerTopKeys(),'shirtTop','teeNeck','teeTopLeft','teeTopRight','tieblade','tieknot'];
 const pantsKeys=['pants','pantsSides','pantsCrotch','shorts','shortsSides','shortsCrotch','pantsWaist','jeansDetails','redThong','briefs','skirt',
  'jumpsuit','jumpsuitSides','jumpsuitCrotch','jumpsuitChestOutline','jumpsuitNeckLeft','jumpsuitNeckRight','jumpsuitShoulderLeft','jumpsuitShoulderRight'];
 if(base.shirt)shirtKeys.forEach(key=>grayGarmentNode(garmentPaths[key]));
 if(base.pants){
  pantsKeys.forEach(key=>grayGarmentNode(garmentPaths[key]));
  if(pantsCoverThigh())torsoMaterial.lower.forEach(grayGarmentNode);
  if(selectedDecorations.pants==='loose-wide-pants')grayGarmentNode(torsoMaterial.fabric);
 }
 if(base.outerwear){grayGarmentNode(swimRingBack);grayGarmentNode(swimRingFront);}
 if(base.outerwear)['alohaBody','greenVestLeft','greenVestRight'].forEach(key=>grayGarmentNode(garmentPaths[key]));
 if(base.cape)grayGarmentNode(capeOverlay);
 for(const arm of armParts){
  const style=teeStyles[selectedDecorations.shirt];
  const end=style?.sleeveEnd||31;
  if(base.shirt){
   arm.segments.forEach(({front},i)=>{if(i<end&&(style||['plain','suit-jacket'].includes(selectedDecorations.shirt)))grayGarmentNode(front);});
   grayGarmentNode(arm.sleevePanel);
  }
  if(base.outerwear)grayGarmentNode(arm.alohaSleeve);
  if(base.gloves){grayGarmentNode(arm.glovePanel);grayGarmentNode(arm.handFill);}
 }
 for(const leg of legParts){
  const tall=!!bootProfiles[selectedDecorations.shoes]||['brown-boots','dark-boots','batfish-boots'].includes(selectedDecorations.shoes)&&!widePantFlares[selectedDecorations.pants];
  leg.segments.forEach(({front},i)=>{
   if(tall&&i>=19){if(base.shoes)grayGarmentNode(front);return;}
   if(base.pants&&(wearingJumpsuit()||['plain','batfish-trousers'].includes(selectedDecorations.pants)||widePantFlares[selectedDecorations.pants]
      ||['green-ultra-shorts','student-shorts','pink-shorts','orange-shorts','black-shorts','slight-wide-shorts','extra-wide-shorts'].includes(selectedDecorations.pants)&&i<shortsHemIndex()))grayGarmentNode(front);
  });
  if(base.pants)leg.fabricLayers.forEach(({group})=>grayGarmentNode(group));
  if(base.shoes){grayGarmentNode(leg.sneakerDetails);grayGarmentNode(leg.bootFill);}
 }
}

const decorationColors = {
  batArmor:'#535963',batBlack:'#292d35',batGold:'#FDE400',
  sharkHood:'#1b3a5c', fleshSkin:'#EDD6D6',
  clownWhite:'#ffffff', clownRed:'#e8342b', partyHat:'#ffd84d',
  alienGreen:'#4BCD74',
  shirt: '#7d9ea2', pants: '#526a78', shoes: '#4e6069', gloves: '#c8a27d',
  jumpsuit: '#2425d9', scarf: '#d84f50',
  blueVest: '#2e5bd5', yellowTee: '#ffe144', patchedTee: '#756e6c',
  redShorts: '#d44a49', pinkShorts: '#ee31ac',
  greenVest: '#278b20', orangeShorts: '#eb8135', brownBoots: '#603d26',
  // The same tall boot in the court boot's near-black brown, which is what
  // the kings wear.
  darkBoots: '#413039',
  yellowHat: '#ffe047', crown: '#ffd400',
  navyJumpsuit: '#303578', redTee: '#d80c0c', blackShorts: '#100b0d',
  redThong: '#c60000', redTriangle: '#c52323', coralTee: '#f26d58',
  looseTee:'#a9b89c', looseLongSleeve:'#859eb4',
  royalWhite:'#fff5e4',
  suitNavy:'#454963', dressShoes:'#101011', tieRed:'#f51b20',
  denimBlue:'#48769b',
  widePants: '#3e4a72', wideShorts: '#547985', skirt: '#547985',
};
// Shared fabric definition for the live garment and its catalog thumbnail.
const fabricMotifs = [
  ['#b09a66',[[0,0],[12,0],[12,16],[0,16]]],
  ['#b09a66',[[12,16],[24,16],[24,32],[12,32]]],
  ['#874f49',[[12,0],[24,0],[24,10],[12,10]]],
  ['#874f49',[[0,22],[12,22],[12,32],[0,32]]],
  ['#e0d2ad',[[6,2.5],[10.5,8],[6,13.5],[1.5,8]]],
  ['#e0d2ad',[[18,18.5],[22.5,24],[18,29.5],[13.5,24]]],
  ['#b09a66',[[6,3.8],[9.3,8],[6,12.2],[2.7,8]]],
  ['#b09a66',[[18,19.8],[21.3,24],[18,28.2],[14.7,24]]],
  ['#b09a66',[[15,5],[18,2],[21,5],[18,8]]],
  ['#b09a66',[[3,27],[6,24],[9,27],[6,30]]],
  ['#d2c5a5',[[0,17.6],[3,20.6],[6,17.6],[9,20.6],[12,17.6],[12,18.4],[9,21.4],[6,18.4],[3,21.4],[0,18.4]]],
  ['#d2c5a5',[[12,13.6],[15,10.6],[18,13.6],[21,10.6],[24,13.6],[24,14.4],[21,11.4],[18,14.4],[15,11.4],[12,14.4]]],
];
const loosePantsFabricContent = '<rect width="24" height="32" fill="#607e79"/>'
  +fabricMotifs.map(([color,points])=>`<polygon fill="${color}" points="${points.map(p=>p.join(',')).join(' ')}"/>`).join('');
// Material coordinates stay attached to the leg's sampled spine. Subdivide
// motif edges before mapping them so diamonds bend with the knee as well.
function legFabricPoint(shape,across,along,legs=100) {
  const position=along/shape.restLength*32;
  const index=Math.max(0,Math.min(31,Math.floor(position)));
  const t=position-index;
  const points=shape.centerline;
  const at=i=>i===32?wideLegEnd(shape,legs):points[i];
  const a=at(index),b=at(index+1);
  const normal=i=>{
    const before=at(Math.max(0,i-1)),after=at(Math.min(32,i+1));
    const dx=after.x-before.x,dy=after.y-before.y,length=Math.hypot(dx,dy)||1;
    return {x:dy/length,y:-dx/length};
  };
  const na=normal(index),nb=normal(index+1);
  const blend=clamp01(t),nx=lerp(na.x,nb.x,blend),ny=lerp(na.y,nb.y,blend);
  const length=Math.hypot(nx,ny)||1;
  return {x:lerp(a.x,b.x,t)+nx/length*across,
    y:lerp(a.y,b.y,t)+ny/length*across};
}
function legFabricPaths(shape,side,legs=100) {
  const length=shape.restLength,split=length*19/32;
  const originX=side==='left'?-10:11,originY=18;
  const clip=(polygon,bound,above)=>{
    const result=[];
    for(let i=0;i<polygon.length;i++){
      const a=polygon[i],b=polygon[(i+1)%polygon.length];
      const insideA=above?a[1]>=bound:a[1]<=bound;
      const insideB=above?b[1]>=bound:b[1]<=bound;
      if(insideA)result.push(a);
      if(insideA!==insideB){const t=(bound-a[1])/(b[1]-a[1]);result.push([lerp(a[0],b[0],t),bound]);}
    }
    return result;
  };
  const mapPolygon=polygon=>{
    const mapped=[];
    for(let i=0;i<polygon.length;i++){
      const a=polygon[i],b=polygon[(i+1)%polygon.length];
      const steps=Math.max(1,Math.ceil(Math.abs(b[1]-a[1])/1.5));
      for(let j=0;j<steps;j++)mapped.push(legFabricPoint(shape,
        lerp(a[0],b[0],j/steps),lerp(a[1],b[1],j/steps),legs));
    }
    return mapped.map((p,i)=>`${i?'L':'M'}${clean(p.x)} ${clean(p.y)}`).join('')+(mapped.length?'Z':'');
  };
  // Paint opaque material bands in limb order. Grouping all ochre/red/etc.
  // motifs together blends unrelated cloth positions when the leg folds.
  return [[-1,19],[19,33]].map(([start,end])=>{
    const paths=[];
    for(let band=start;band<end;band++){
      const index=Math.max(0,Math.min(31,band));
      const radius=(shape.hose[index].width+wideLegExtraWidth(index,10.5))/2+.4;
      const low=band<0?-radius:band*length/32-.025;
      const high=band===32?length+radius:(band+1)*length/32+.025;
      paths.push({color:'#607e79',d:mapPolygon([[-radius,low],[radius,low],[radius,high],[-radius,high]])});
      for(const [color,vertices] of fabricMotifs){
        let d='';
        for(let row=Math.floor((low+originY)/32);row<=Math.ceil((high+originY)/32);row++)
          for(let column=-2;column<=2;column++){
            let polygon=vertices.map(([x,y])=>[x+column*24-originX,y+row*32-originY]);
            polygon=clip(clip(polygon,low,true),high,false);
            polygon=clip(clip(polygon.map(([x,y])=>[y,x]),-radius,true),radius,false).map(([y,x])=>[x,y]);
            if(polygon.length>=3)d+=mapPolygon(polygon);
          }
        paths.push({color,d});
      }
    }
    return paths;
  });
}

const isSpaceSweatpants=()=>['space-trousers','black-gray-sweatpants'].includes(selectedDecorations.pants);
const sweatpantsAccent=()=>selectedDecorations.pants==='black-gray-sweatpants'?'#909090':'#10C9E9';
const denimJeansIds=[...Object.keys(denimVariants),...Object.keys(workwearVariants)];
function widePantsPaint() {
  if(selectedDecorations.pants==='white-loose-wide-trousers')return '#FAFAF7';
  if(isSpaceSweatpants())return selectedDecorations.pants==='black-gray-sweatpants'?'#373737':'#FF8215';
  if(selectedDecorations.pants==='dark-gray-slight-wide-trousers')return '#2B2D2D';
  if(selectedDecorations.pants==='black-slight-wide-trousers')return '#101011';
  if(workerPantsColors[selectedDecorations.pants])return workerPantsColors[selectedDecorations.pants];
  if(selectedDecorations.pants==='jobs-gradient-jeans')return 'url(#jobs-pelvis-gradient)';
  return denimJeansIds.includes(selectedDecorations.pants)?denimColor():selectedDecorations.pants==='loose-wide-pants'
    ?'url(#loose-pants-fabric)':selectedDecorations.pants==='suit-trousers'
      ?decorationColors.suitNavy:['royal-trousers','ivory-trousers'].includes(selectedDecorations.pants)
        ?decorationColors.royalWhite:decorationColors.widePants;
}
const selectedDecorations = { skin:null, suit:null, helmet: 'plain', neck: null, shirt: null, pants: null,
  cape:null, outerwear: null, shoes: null, gloves: null };
let activeDecorationCategory = 'suit';
const milkFrogColors={skin:'#e9ab24',belly:'#f6d69e',eye:'#369b4b'};
const milkFrogBellySource='M47 78C36 78 34 96 35.5 108C36.4 117 40 119 47 119C54 119 57.6 117 58.5 108C60 96 58 78 47 78Z';
// The fish's horn comes off for anything worn in its place: the crown and
// the cowl cover it, and the chainsaw's grey housing sits exactly where it
// used to be. A skin never removes it — Pochita keeps the horn, in his own
// colour, whenever the chainsaw is off.
// Hats that sit over the horn and leave nothing of it showing.
const hornCovered = (helmet = selectedDecorations.helmet) =>
  helmet==='large-party-hat' || !!capVariants[helmet] || helmet==='pink-ribbon-hair' || !!spikyHairVariants[helmet] || helmet==='space-helmet' || !!topknotVariants[helmet] || !!longBraidVariants[helmet] || helmet==='secondary-hat' || helmet==='student-hat' || !!workerHelmetColors[helmet] || helmet === 'kappa-hair' || helmet === 'crown' || helmet === 'batfish-cowl' || helmet === 'chainsaw';
// Hats that are the horn, repainted: the party hat and the shark hood.
const hornWorn = (helmet = selectedDecorations.helmet) =>
  helmet === 'party-hat' || helmet === 'shark-hood';
// The alien's antenna stands in for the horn, so every hat treats the two
// the same: one that covers the horn covers the antenna, and one that is
// the horn takes the antenna's place and brings the horn itself back.
const antennaShown = (helmet = selectedDecorations.helmet) =>
  !!skinTrait('antenna') && !hornCovered(helmet) && !hornWorn(helmet);
function skinHeadContour(helmet=selectedDecorations.helmet){
 return !hornCovered(helmet)&&!hornWorn(helmet)?skinTrait('headContour'):undefined;
}
function hornHidden(helmet = selectedDecorations.helmet) {
  return hornCovered(helmet) || antennaShown(helmet) || !!skinHeadContour(helmet);
}
// Everything a skin changes, in one place, so adding one is a single entry
// rather than a condition sprinkled through the renderer. `mouthShut` is
// how far that skin's jaw closes: the drawing's own mouth shuts flush,
// while Pochita's curved lip has to stop short or its two stroked edges
// read as crossed lines. There is still only one talking motion — it asks
// for "shut" and the skin decides what shut means.
// Built on first use: the drawings it names are defined further down.
let skinTraits;
function skinTrait(name) {
  skinTraits ||= {
    sponge:{color:'#FEF455',sponge:true,spongeFace:true},
    ...Object.fromEntries(Object.entries(coloredSkinVariants).map(([id,v])=>[id,{color:v.color,gradient:v.gradient,hornColor:v.hornColor}])),
    scar:{color:'#C5C5C5',scar:true},
    'lipstick-fish':{color:'#F6DDDD',lipstickDetails:true},
    ...Object.fromEntries(Object.entries(muscleSkinVariants).map(([id,v])=>[id,{color:v.color}])),
    'little-yellow-fish':{color:'#FFEE00',earringOffset:{x:2,y:-1},headContour:yellowFishHeadContour},
    kappa:{color:'#89CD71',eyeWhite:kappaEyeWhite,pupil:{rx:1.31738,ry:1.18774,dx:-2.2119,dy:3.9096},kappaDetails:true},
    'milk-frog': {color: milkFrogColors.skin, eye: milkFrogColors.eye, belly: true},
    pochita: {color: pochitaColors.skin, eyeWhite: pochitaEyeWhite,
      pupil: pochitaPupil, lip: POCHITA_LIP, tail: true, mouthShut: .76},
    hypnotic:{color:'#FBD5CA',eye:'#EB8E15',eyeWhite:hypnoticEyeSource,pupil:{rx:0,ry:0},eyeRings:true},
    flesh: {color: decorationColors.fleshSkin},
    'flesh-2':{color:'#f4ece6'},
    'flesh-7':{color:'#FFEADD'},
    'flesh-8':{color:'#754F36'},
    'flesh-3':{color:'#f9d4ad'},
    'flesh-6':{color:'#FBD5CA'},
    'flesh-5':{color:'#dda579'},
    'flesh-4':{color:'#ffc1bf'},
    clown: {color: decorationColors.clownWhite, marks: true},
    alien: {color: decorationColors.alienGreen, eye: 'black', pupil: {rx: 1.31738,
      ry: 1.18774, dy: 0, color: 'white'}, antenna: true,earringOffset:{x:0,y:0}},
  };
  // A hood that encloses the whole head leaves none of the face showing, so
  // the skin's facial features stop applying: the clown's nose and cheek
  // under the cowl, Pochita's eye and curved lip, the alien's antenna. What
  // the body still shows — its colour, belly and tail — is untouched.
  if (FACE_TRAITS.includes(name) && fullHood()) return undefined;
  return skinTraits[selectedDecorations.skin]?.[name];
}
// Hoods that are a head of their own rather than something worn on one.
const FACE_TRAITS = ['eye', 'eyeWhite', 'pupil', 'lip', 'marks', 'mouthShut',
  'spongeFace','antenna','lipstickDetails','kappaDetails','headContour','eyeRings'];
const fullHood = (helmet = selectedDecorations.helmet) =>
  helmet === 'space-helmet' || helmet === 'batfish-cowl' || helmet === 'shark-hood';
function skinColor(){ return skinTrait('color') || '#C5C5C5'; }
let bellyPatch,bellyClip;
let jobsPelvisGradient;

const clamp01 = value => Math.max(0, Math.min(1, value));
const smooth = value => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const lerp = (from, to, amount) => from + (to - from) * amount;
const clean = value => Number(value.toFixed(4));
const ARMPIT_RAISE = 3;
const LEFT_ARMPIT_Y = 69.7327 - ARMPIT_RAISE;
const RIGHT_ARMPIT_Y = 68.4282 - ARMPIT_RAISE;

function transformPath(pathData, warp) {
  const tokens = pathData.match(/[MLCZ]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g);
  if (!tokens) return pathData;

  let output = '';
  let pointIndex = 0;
  for (let index = 0; index < tokens.length;) {
    const token = tokens[index++];
    if (/^[MLCZ]$/.test(token)) {
      output += `${token} `;
      continue;
    }
    const x = Number(token);
    const y = Number(tokens[index++]);
    const point = warp(x, y, pointIndex++);
    output += `${clean(point.x)} ${clean(point.y)} `;
  }
  return output.trim();
}

function cutPathSection(pathData, start, end, replacement) {
  const from = pathData.indexOf(start);
  const to = pathData.indexOf(end, from + start.length);
  if (from < 0 || to < 0) throw new Error('SVG arm landmarks are missing');
  return pathData.slice(0, from + start.length) + replacement
    + pathData.slice(to + end.length);
}

function splitArmPath(pathData, outerWrist, innerWrist) {
  const outerEnd = pathData.indexOf(outerWrist) + outerWrist.length;
  const innerStart = pathData.indexOf(innerWrist, outerEnd);
  if (outerEnd < outerWrist.length || innerStart < 0) {
    throw new Error('SVG wrist landmarks are missing');
  }
  const handContour = pathData.slice(outerEnd, innerStart + innerWrist.length);
  return {
    handFill: `M${outerWrist}${handContour} Z`,
    handOutline: `M${outerWrist}${handContour}`,
  };
}

function buildWarp(config) {
  const bodyScale = config.body / 100;
  const widthScale = config.width / 100;
  const armScale = config.arms / 100;
  const legScale = config.legs / 100;
  const headScale = config.head / 100;
  // Shoulder width follows the head, but at a gentler rate so the torso does
  // not become excessively narrow or broad at the slider extremes.
  const shapeWidthScale = 1 + (widthScale - 1) * .7;
  const endCapScale = 1 + (shapeWidthScale - 1) * .55;
  const shoulderScale = (1 + (headScale - 1) * .55) * (1 + (shapeWidthScale - 1) * .65);

  const bodyDelta = (bodyScale - 1) * 39;
  const armDelta = (armScale - 1) * 32;
  const legDelta = (legScale - 1) * 42;

  const mapBodyY = y => {
    if (y <= 70) return y;
    if (y >= 116) return y + bodyDelta;
    return 70 + (y - 70) * ((46 + bodyDelta) / 46);
  };

  const mapTorsoX = (x, y) => {
    // Shoulder, torso and waist share one continuous width field. This makes
    // every duplicate joint point land at the same transformed coordinate.
    const scale = lerp(shoulderScale, shapeWidthScale, smooth((y - 56) / 26));
    return 47 + (x - 47) * scale;
  };

  const mapArmX = (x, y) => {
    const side = x < 47 ? -1 : 1;
    const progress = clamp01((y - 56) / 41);
    const centerX = side < 0
      ? lerp(26.5, 11, progress)
      : lerp(68, 86, progress);
    const armShift = side * (shapeWidthScale - 1) * 12;
    // Use one thickness multiplier from upper arm through the hand. Previously
    // the shaft and end cap used different factors, creating visible bulges.
    const armX = centerX + armShift + (x - centerX) * endCapScale;
    // Up to the armpit, use exactly the torso mapping. Only after the shared
    // joint do we blend into the arm center line and its rigid hand shift.
    const leaveShoulder = smooth((y - 69) / 15);
    return lerp(mapTorsoX(x, y), armX, leaveShoulder);
  };

  // The mouth is the notch in the top-left of the head: the lower jaw runs
  // from the corner of the notch out to its own point, and the head's top
  // spike is the upper jaw. Talking swings the lower jaw away about that
  // corner, which widens the notch exactly as the drawing already shows it
  // part-open. It happens here, in the character's own coordinates, so the
  // head fill, its outline and anything else drawn on the head all open
  // together and the head slider scales the result like any other feature.
  const mouth = mouthPose();
  const swing = -mouth * (mouth >= 0 ? MOUTH_OPEN : (skinTrait('mouthShut') || MOUTH_SHUT));
  // The two shares add up to the whole swing, so the limits above stay the
  // angle the notch actually opens or closes by.
  const lowerSwing = swing / (1 + UPPER_LIP_SHARE);
  const upperSwing = -UPPER_LIP_SHARE * lowerSwing;
  // Which side of the notch a point is on, measured against the line that
  // bisects it: negative on the lower jaw, positive on the upper lip. A
  // plain vertical split through the corner put Pochita's curved upper lip
  // on the wrong side — its control points sit left of the corner even
  // though the lip itself runs up to the right — and the jaw curled the
  // lip into a hook every time he spoke.
  const unit = (x, y) => {
    const length = Math.hypot(x, y) || 1;
    return [x / length, y / length];
  };
  const [lowerX, lowerY] = unit(JAW.jaw[0] - JAW.corner[0], JAW.jaw[1] - JAW.corner[1]);
  const [upperX, upperY] = unit(JAW.spike[0] - JAW.corner[0], JAW.spike[1] - JAW.corner[1]);
  const [bisectX, bisectY] = unit(lowerX + upperX, lowerY + upperY);
  const notchSide = (x, y) =>
    bisectX * (y - JAW.corner[1]) - bisectY * (x - JAW.corner[0]);
  const openJaw = (x, y, scale = 1) => {
    // The lower jaw is the prong on the near side of the notch. Its fade
    // has to reach well below the corner, or the jaw's outer edge stays
    // pinned while its point swings and the prong buckles into a nub.
    // The upper lip is the spike on the far side, and its own fade has to
    // die out quickly along the head's right edge, which is not part of it.
    const side = notchSide(x, y);
    const lower = smooth((40 - y) / 15) * smooth(-side / 2.5);
    const upper = smooth((24 - y) / 14) * smooth((54 - x) / 10)
      * smooth(side / 2.5);
    const angle = (lower * lowerSwing + upper * upperSwing) * scale;
    if (!angle) return [x, y];
    const [hx, hy] = JAW.corner, cos = Math.cos(angle), sin = Math.sin(angle);
    return [hx + (x - hx) * cos - (y - hy) * sin,
      hy + (x - hx) * sin + (y - hy) * cos];
  };

  return (x, y, role) => {
    if (swing && role === 'head') [x, y] = openJaw(x, y);
    // A cowl opens with the jaw too, but by less: its own notch spans about
    // 46 degrees against the head's 63.5, so turning it by the head's full
    // swing drives its two points straight through each other. Scaled to
    // its own notch they shut level and never cross.
    if (role === 'headShell') {
      if (swing) [x, y] = openJaw(x, y, COWL_JAW_SHARE);
      role = 'head';
    }
    // Worn on top of the head rather than over its face: it scales and
    // moves with the head but the jaw never touches it. The chainsaw
    // reaches down either side of the mouth, so on a jaw-following role
    // its teeth would swing with every syllable.
    if(role==='cigarette'){
      // At full closure the cigarette axis is exactly the deformed mouth seam.
      const [lipX,lipY]=openJaw(...JAW.spike);
      const seamAngle=Math.atan2(lipY-JAW.corner[1],lipX-JAW.corner[0]);
      const angle=mouth<0?-mouth*(seamAngle-CIGARETTE_ANGLE):-mouth*.12;
      const cos=Math.cos(angle),sin=Math.sin(angle);
      const dx=x-JAW.corner[0],dy=y-JAW.corner[1];
      x=JAW.corner[0]+dx*cos-dy*sin;y=JAW.corner[1]+dx*sin+dy*cos;
      role='head';
    }
    if (role === 'headRigid') role = 'head';
    // Helmet: keep the lower rim locked to the shoulders, but spread the blend
    // over most of the lower arc. The earlier short 46–56 blend produced a
    // visible kink at small sizes; this longer transition preserves curvature.
    if (role === 'helmet') {
      const neckX = 47;
      const neckY = 69;
      const lock = smooth((y - 38) / 18);
      const scaledX = neckX + (x - neckX) * headScale;
      const scaledY = neckY + (y - neckY) * headScale;
      const shoulderX = neckX + (x - neckX) * shoulderScale;
      return {
        x: lerp(scaledX, shoulderX, lock),
        y: lerp(scaledY, y, lock),
      };
    }

    // Fish head: scale freely above the neck, then blend back to an unchanged
    // neck interface between y=52 and y=70.
    if (role === 'head') {
      const neckX = 47;
      const neckY = 69;
      // Finish the blend before the y=56 shoulder/neck seam. Both the head
      // outline and the combined body fill therefore meet at identical points.
      const lock = smooth((y - 46) / 10);
      const scaledX = neckX + (x - neckX) * headScale;
      const scaledY = neckY + (y - neckY) * headScale;
      const shoulderX = neckX + (x - neckX) * shoulderScale;
      return {
        x: lerp(scaledX, shoulderX, lock),
        y: lerp(scaledY, y, lock),
      };
    }

    // Arms: shoulders remain fixed. The middle length changes; the wrist and
    // hand become a rigid translated end cap.
    if (role === 'arms') {
      // The whole shoulder cap (including the lower armpit attachment around
      // y=70) is rigid. Stretching starts below it and finishes before the
      // wrist/hand cap, so both sides of each joint share identical points.
      const shoulderY = 70;
      const wristStart = 97;
      // An affine middle-zone mapping preserves the original cubic Bézier
      // tangents. Extra sideways pushing made short arms look kinked.
      const wristWeight = clamp01((y - shoulderY) / (wristStart - shoulderY));
      const handGrowth = y > wristStart ? (y - wristStart) * (endCapScale - 1) : 0;
      return {
        x: mapArmX(x, y),
        y: y + armDelta * wristWeight + handGrowth,
      };
    }

    // Legs: the hip/crotch is locked. Short legs bend inward progressively;
    // below the ankle boundary every point receives the same rigid shift.
    if (role === 'legs') {
      const hipY = 126;
      const ankleY = 179;
      const rawWeight = clamp01((y - hipY) / (ankleY - hipY));
      // One shared spatial clock drives center-line movement, thickness and
      // ankle translation. This prevents different parts of the leg from
      // appearing to travel at different speeds while the slider is dragged.
      const weight = smooth(rawWeight);
      const side = x < 47 ? -1 : 1;
      const footShift = legScale < 1
        ? (1 - legScale) * 22
        : -(legScale - 1) * 6;
      const shiftedAnkleY = mapBodyY(hipY) + (ankleY - hipY) * legScale;

      // The foot/ankle cap is rigid. Once a source point reaches the ankle,
      // preserve all of its local geometry and translate the whole cap by the
      // same x/y offset as the ankle anchor.
      if (y >= ankleY) {
        const ankleCenterX = side < 0 ? 21.8735 : 79.315;
        return {
          x: ankleCenterX + (x - ankleCenterX) * endCapScale
            - side * footShift + side * (shapeWidthScale - 1) * 8,
          y: shiftedAnkleY + (y - ankleY) * endCapScale,
        };
      }

      // Model each leg around its own center line. The left leg supplies the
      // canonical thickness; the right leg blends toward it through the
      // middle, while both ends return to their locked source interfaces.
      const leftOuter = lerp(28.459, 16.337, weight);
      const leftInner = lerp(44.68, 27.41, weight);
      const rightInner = lerp(49.49, 73.50, weight);
      const rightOuter = lerp(65.83, 85.13, weight);
      const sourceOuter = side < 0 ? leftOuter : rightOuter;
      const sourceInner = side < 0 ? leftInner : rightInner;
      const sourceCenter = (sourceOuter + sourceInner) / 2;
      const sourceHalfWidth = Math.abs(sourceOuter - sourceInner) / 2;
      const canonicalHalfWidth = Math.abs(leftOuter - leftInner) / 2;
      const middleInfluence = 4 * weight * (1 - weight);
      const shortLegThickness = legScale < 1 ? .58 + .42 * legScale : 1;
      let desiredHalfWidth = lerp(
        sourceHalfWidth,
        canonicalHalfWidth * shortLegThickness,
        middleInfluence
      );
      desiredHalfWidth *= lerp(1, endCapScale, weight);
      const localX = (x - sourceCenter) / Math.max(sourceHalfWidth, .001);
      // Keep a readable minimum crotch width. Most of the inward travel is
      // introduced below the hip instead of collapsing the crotch to a point.
      const hipShift = footShift * .04;
      const sharedShift = lerp(hipShift, footShift, weight);

      const shapedX = sourceCenter + localX * desiredHalfWidth - side * sharedShift;
      const hipX = 47 + (shapedX - 47) * shapeWidthScale;
      const ankleX = shapedX + side * (shapeWidthScale - 1) * 8;
      const joinBlend = smooth((y - hipY) / 20);
      return {
        x: lerp(47 + (x - 47) * shapeWidthScale, lerp(hipX, ankleX, weight), joinBlend),
        y: mapBodyY(hipY) + (y - hipY) * legScale,
      };
    }

    if (role === 'body') return { x: mapTorsoX(x, y), y: mapBodyY(y) };
    return { x, y };
  };
}

function classifyPath(index) {
  // The translucent shell starts behind the character. Its outline and two
  // highlights occur at the end of the SVG and therefore render in front.
  if (index === 0) return 'helmet-back';
  if ([12, 13, 14].includes(index)) return 'helmet-front';
  if ([1, 5, 8, 11].includes(index)) return 'head';
  if ([3, 4].includes(index)) return 'arms';
  if ([6, 7, 9, 10].includes(index)) return 'body';
  return 'mixed';
}

function classifyPoint(x, y, pathRole) {
  if (pathRole !== 'mixed') return pathRole;
  if (y < 56) return 'head';
  // Keep the torso-side controls assigned to the body. During a hand drag the
  // shoulder and armpit stay fixed; movement begins farther down the arm.
  if (y <= 114 && (x < 25 || x > 70)) return 'arms';
  if (y >= 126) return 'legs';
  return 'body';
}

let svg;
let paths = [];
let ellipse;
let armParts = [];
const wristSources = {
  left: { outer: '6.85326 97.5023', inner: '15.029 97.8624', x: 10.94113, y: 97.68235 },
  right: { outer: '91.4318 95.8142', inner: '81.473 96.535', x: 86.4524, y: 96.1746 },
};
const MAX_WRIST_ANGLE = Math.PI / 3;
let helmetVisible = true;
let scarfPaths = [];
let outfitOverlay,mosaicOverlay;
let neckOverlay;
let longHairOverlay;
let capeOverlay,swimRingBack,swimRingFront;
let dragLayer;
let activeDrag;
let springFrame = 0;
let dragRenderFrame = 0;
let springTime = 0;
const dragPoses = [];

function createDragPose(part) {
  return { x: 0, y: 0, vx: 0, vy: 0, swayX: 0, swayY: 0, angle: 0, av: 0, part };
}

// A wrist grip drives the same chain as the hand it belongs to and only adds
// a turn on top, so every reach calculation treats the two grips alike.
const handPart = part => part.endsWith('Hand') || part.endsWith('Wrist');
const handLeft = part => part.startsWith('left');

const legRootCache = new WeakMap();

function legRootMotion(pose, warp) {
  const cached = legRootCache.get(pose);
  if (cached?.warp === warp && cached.x === pose.x && cached.y === pose.y) {
    return cached.motion;
  }
  // The pelvis keeps still while the foot still has slack, exactly as a hand
  // lets the arm do the work first. The handover starts before full stretch,
  // or the body only ever follows in the last stretch of the gesture and the
  // grip feels dead.
  const left = pose.part === 'leftLeg';
  const legs = plantedLegs(warp);
  const own = legs[left ? 0 : 1], stand = legs[left ? 1 : 0];
  const reach = Math.hypot(own.ankle.x - own.hip.x, own.ankle.y - own.hip.y)
    * LEG_MAX_STRETCH * LEG_HANDOVER;
  const distance = Math.hypot(own.ankle.x + pose.x - own.hip.x,
    own.ankle.y + pose.y - own.hip.y);
  const excess = Math.max(0, distance - reach);
  const pull = excess * smooth(excess / 10);
  const travel = Math.hypot(pose.x, pose.y);
  // Raising a knee must not hoist the whole figure onto its toes, so the
  // upward share of the pull is damped. Outward and downward travel carry
  // the body in full.
  const raw = travel
    ? { x: pose.x / travel * pull,
      y: pose.y / travel * pull * (pose.y < 0 ? .3 : 1) }
    : { x: 0, y: 0 };
  // The standing leg must keep its knee above its own foot, the guard the
  // torso grips get from upperDragPose: its hip stays clear of its ankle, and
  // further so once the pelvis has travelled out past that foot. The floor of
  // zero means this only limits how far the pelvis sinks.
  const standRest = Math.hypot(stand.ankle.x - stand.hip.x,
    stand.ankle.y - stand.hip.y);
  const outward = left ? 1 : -1;
  const overFoot = Math.max(0, outward * (stand.hip.x + raw.x - stand.ankle.x));
  const safeReach = standRest * LEG_STAND_CLEARANCE + overFoot * 1.6;
  const sideways = stand.ankle.x - stand.hip.x - raw.x;
  const clearance = Math.max(2, Math.sqrt(Math.max(0,
    safeReach * safeReach - sideways * sideways)));
  const dropped = { x: raw.x,
    y: Math.min(legCompressionLimit(warp).limit,
      Math.max(0, stand.ankle.y - stand.hip.y - clearance), raw.y) };
  // The standing foot stays planted, so the pelvis has to end up inside that
  // leg's own small stretch. Project it back onto that disc, and do so last:
  // any later nudge could ask the two bones to close a triangle they cannot.
  const standLength = standRest * LEG_MAX_STRETCH;
  const vx = stand.hip.x + dropped.x - stand.ankle.x;
  const vy = stand.hip.y + dropped.y - stand.ankle.y;
  const span = Math.hypot(vx, vy);
  const motion = span > standLength
    ? { x: stand.ankle.x + vx * standLength / span - stand.hip.x,
      y: stand.ankle.y + vy * standLength / span - stand.hip.y }
    : dropped;
  legRootCache.set(pose, { warp, x: pose.x, y: pose.y, motion });
  return motion;
}

function legDragPose(point, sourceX, sourceY, role, warp, pose) {
  const left = pose.part === 'leftLeg';
  // The hip follows the pelvis; the foot itself goes where the pointer is.
  const root = legRootMotion(pose, warp);
  if (role !== 'legs') return { x: point.x + root.x, y: point.y + root.y };
  const reach = smooth((sourceY - 131.505) / (179 - 131.505));
  const active = (sourceX < 47) === left;
  return { x: point.x + root.x * (1 - reach) + (active ? pose.x * reach : 0),
    y: point.y + root.y * (1 - reach) + (active ? pose.y * reach : 0) };
}

function legCompressionLimit(warp) {
  const hip = warp(47, 126, 'body');
  const ankle = warp(21.8735, 179, 'legs');
  const legHeight = Math.max(12, ankle.y - hip.y);
  const outerHip = warp(28.4591, 125.881, 'body');
  const innerHip = warp(44.6804, 131.505, 'legs');
  const hipThickness = Math.hypot(outerHip.x - innerHip.x,
    outerHip.y - innerHip.y);
  // At a full squat the pelvis may settle almost onto the planted soles.
  // The two fixed-length bones fold sideways instead of scaling shorter.
  return { legHeight, limit: Math.max(0, Math.min(legHeight * .96,
    legHeight - hipThickness * .15)) };
}

function plantedLegs(warp) {
  const center = (outer, inner) => ({
    x: (outer.x + inner.x) / 2,
    y: (outer.y + inner.y) / 2,
  });
  return [
    { hip: center(warp(28.4591, 125.881, 'body'),
      warp(44.6804, 131.505, 'legs')),
    ankle: center(warp(16.3365, 179.496, 'legs'),
      warp(27.4103, 181.091, 'legs')) },
    { hip: center(warp(65.8486, 125.059, 'body'),
      warp(49.4914, 131.505, 'legs')),
    ankle: center(warp(85.1287, 180.658, 'legs'),
      warp(73.502, 182.179, 'legs')) },
  ];
}

const LEG_MAX_STRETCH = 1.28;
// Share of a leg's reach at which the pelvis starts following the foot.
const LEG_HANDOVER = .78;
// How far a folded knee lets its foot drop away from the calf, in radians.
const ANKLE_DROP = .34;
// Share of its resting length the standing leg keeps between hip and ankle.
const LEG_STAND_CLEARANCE = .42;
// The hand drag caps its own reach at 1.35 of the shoulder-to-hand distance,
// which leaves the shorter shoulder-to-wrist span a slightly larger ratio.
// Stay above it so the shaft never stops short of the hand it carries.
const ARM_MAX_STRETCH = 1.62;
// How far a relaxed arm bows away from the body in the generated spine.
const ARM_BOW = 4.6;
// How far a folded arm may draw its bones in, as a share of their rest length.
const ARM_MIN_FOLD = .72;
// How far from the shoulder a fully raised hand may travel, against the 1.35
// a hanging one gets: reaching up draws the whole limb out.
const ARM_LIFT_REACH = 1.75;
const UPPER_BODY_ARC = .68;

function upperBodyArc(pose) {
  return pose.part==='body' ? .58 : UPPER_BODY_ARC;
}

function upperBodyReach(pose, warp) {
  const left=warp(13,191,'legs'),right=warp(87,191,'legs');
  const center={x:warp(47,191,'legs').x,y:(left.y+right.y)/2};
  const reference=pose.part==='head'
    ? warp(47,30,'head') : warp(47,92,'body');
  const restAngle=Math.atan2(reference.x-center.x,center.y-reference.y);
  return {center,reference,restAngle,
    // This is one fixed reach circle for each body size. Its small allowance
    // is the existing leg stretch, not an angle-dependent expansion.
    radius:Math.hypot(reference.x-center.x,reference.y-center.y)
      +legCompressionLimit(warp).legHeight*(LEG_MAX_STRETCH-1)};
}

function upperBodyTurn(pose, warp) {
  const {center,reference,restAngle}=upperBodyReach(pose,warp);
  const targetAngle=Math.atan2(reference.x+pose.x-center.x,
    Math.max(0,center.y-reference.y-pose.y));
  const difference=Math.atan2(Math.sin(targetAngle-restAngle),
    Math.cos(targetAngle-restAngle));
  const arc=upperBodyArc(pose);
  const crouch=smooth(Math.max(0,pose.y)/legCompressionLimit(warp).legHeight);
  return Math.max(-arc,Math.min(arc,difference))*(.85-.35*crouch);
}

function upperDragAngle(pose, horizontalTravel) {
  return Math.max(-.24,Math.min(.24,horizontalTravel*.0015));
}

const handRootCache = new WeakMap();

function handRootMotion(pose, warp) {
  const cached = handRootCache.get(pose);
  if (cached?.warp === warp && cached.x === pose.x && cached.y === pose.y) {
    return cached.motion;
  }
  const left = handLeft(pose.part);
  const shoulder = left
    ? warp(27.4, 70, 'arms')
    : warp(67.55, 68.45, 'arms');
  const hand = warp(left ? 10 : 87, 104, 'arms');
  const naturalLength = Math.hypot(hand.x - shoulder.x, hand.y - shoulder.y);
  const maxReach = naturalLength * 1.35;
  // Let the arm do nearly all the work within its reach. Past full extension,
  // move the shoulder toward the target just enough to avoid overstretching.
  const restingRoot = { x: pose.x * .08, y: pose.y * .08 };
  const reachX = hand.x + pose.x - shoulder.x - restingRoot.x;
  const reachY = hand.y + pose.y - shoulder.y - restingRoot.y;
  const distance = Math.hypot(reachX, reachY);
  const excess = Math.max(0, distance - maxReach);
  const pull = excess * smooth(excess / 10);
  const dragDistance = Math.hypot(pose.x, pose.y);
  const raw = dragDistance ? {
    x: restingRoot.x + pose.x / dragDistance * pull,
    y: restingRoot.y + pose.y / dragDistance * pull,
  } : restingRoot;
  // Both feet stay planted. The hips may pull the legs slightly beyond their
  // resting reach; farther travel still folds the knees or stops the root.
  // Past full extension the hand inherits the body's own range rather than a
  // reduced one, so pulling an arm far enough crouches and leans the figure
  // exactly as far as grabbing its torso would.
  const { limit } = legCompressionLimit(warp);
  const legs = plantedLegs(warp);
  const ranges = legs.map(({ hip, ankle }) => {
    const dx = ankle.x - hip.x;
    const dy = ankle.y - hip.y;
    const length = Math.hypot(dx, dy);
    const maxLength=length*LEG_MAX_STRETCH;
    const sideways = Math.sqrt(Math.max(0, maxLength ** 2
      - Math.max(0, dy - limit) ** 2));
    return { min: dx - sideways, max: dx + sideways,
      hip, ankle, length:maxLength };
  });
  const x = Math.max(Math.max(...ranges.map(leg => leg.min)),
    Math.min(Math.min(...ranges.map(leg => leg.max)), raw.x));
  const crouch = Math.max(0, ...ranges.map(({ hip, ankle, length }) => {
    const sideways = ankle.x - hip.x - x;
    return ankle.y - hip.y - Math.sqrt(Math.max(0, length ** 2 - sideways ** 2));
  }));
  const motion = { x, y: Math.max(crouch, Math.min(limit, raw.y)) };
  handRootCache.set(pose, { warp, x: pose.x, y: pose.y, motion });
  return motion;
}

function bodyCompression(warp) {
  const { legHeight, limit } = legCompressionLimit(warp);
  const requested = dragPoses.reduce((sum, pose) => {
    if (pose.part.endsWith('Leg')) return sum;
    const motion = handPart(pose.part) ? handRootMotion(pose, warp) : pose;
    return sum + Math.max(0, motion.y);
  }, 0);
  return {
    scale: requested > limit ? limit / requested : 1,
    amount: Math.min(requested, limit),
    legHeight,
  };
}

function upperDragPose(point, sourceX, sourceY, role, warp, pose, downScale) {
  const handDrag = handPart(pose.part);
  const leftSole = warp(13, 191, 'legs');
  const rightSole = warp(87, 191, 'legs');
  const soleCenter = {
    x: (leftSole.x + rightSole.x) / 2,
    y: (leftSole.y + rightSole.y) / 2,
  };
  const supportCenter=handDrag?soleCenter:warp(47,126,'body');
  const reference = pose.part === 'head'
    ? warp(47, 30, 'head')
    : pose.part === 'body'
      ? warp(47, 92, 'body')
      : warp(handLeft(pose.part) ? 10 : 87, 104, 'arms');
  const rootMotion = handDrag ? handRootMotion(pose, warp) : { x: pose.x, y: pose.y };
  const legHeight=legCompressionLimit(warp).legHeight;
  // One lateral scale for every grip: a hand that has run out of arm pulls
  // the hips as far as the torso handle does.
  const fullHipTravel=legHeight*.65;
  const targetX = handDrag
    ? Math.max(-fullHipTravel,Math.min(fullHipTravel,rootMotion.x))
    : rootMotion.x;
  const targetY = rootMotion.y > 0 ? rootMotion.y * downScale : rootMotion.y;
  const angle = handDrag ? upperDragAngle(pose,targetX) : upperBodyTurn(pose,warp);
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const rotate = current => {
    const dx = current.x - supportCenter.x;
    const dy = current.y - supportCenter.y;
    return {
      x: supportCenter.x + dx * cosine - dy * sine,
      y: supportCenter.y + dx * sine + dy * cosine,
    };
  };
  const rotatedReference = rotate(reference);
  const planted=plantedLegs(warp).map(({hip,ankle})=>({hip:rotate(hip),ankle,
    length:Math.hypot(ankle.x-hip.x,ankle.y-hip.y)}));
  // Keep the torso inside both legs' modest stretch ranges while the soles
  // stay fixed. Pulling the head, body or a hand can now extend the legs.
  const minX=Math.max(...planted.map(p=>p.ankle.x-p.hip.x-p.length*LEG_MAX_STRETCH),
    handDrag?-Infinity:planted[0].ankle.x-planted[0].hip.x+3);
  const maxX=Math.min(...planted.map(p=>p.ankle.x-p.hip.x+p.length*LEG_MAX_STRETCH),
    handDrag?Infinity:planted[1].ankle.x-planted[1].hip.x-3);
  const shiftX=Math.max(minX,Math.min(maxX,targetX-(rotatedReference.x-reference.x)));
  const minimumY=Math.max(...planted.map(p=>p.ankle.y-p.hip.y
    -Math.sqrt(Math.max(0,(p.length*LEG_MAX_STRETCH)**2
      -(p.ankle.x-p.hip.x-shiftX)**2))));
  // Keep a short hip-to-ankle gap even at the bottom of a diagonal squat.
  // Otherwise the two hose spans fold back across each other.
  const maximumY=Math.min(...planted.map((p,index)=>{
    const sideways=p.ankle.x-p.hip.x-shiftX;
    // A sideways lean needs more room for the knee to stay above the sole.
    const lateral=Math.abs(targetX)/fullHipTravel;
    const outward=index===0?-1:1;
    const overFoot=Math.max(0,outward*(p.hip.x+shiftX-p.ankle.x));
    const deepSquat=smooth(Math.max(0,targetY)/(legHeight*.9))
      *smooth((legHeight-40)/13);
    // A hip that has travelled past its own foot has to stay higher, or the
    // leg folds its knee straight down through the sole. The hand grips reach
    // much further sideways than the torso ever did, so this term now carries
    // most of the clearance there; it is zero for a hip still over its foot,
    // which leaves every head and body drag exactly as it was.
    const safeReach=p.length*lerp(.26+.22*smooth(lateral)
      +.24*smooth((lateral-.75)/.25),.26+.06*smooth(lateral),deepSquat)
      + overFoot*1.6;
    const clearance=Math.max(2,Math.sqrt(Math.max(0,
      safeReach*safeReach-sideways*sideways)));
    return p.ankle.y-p.hip.y-clearance;
  }));
  const shiftY=Math.max(minimumY,Math.min(maximumY,
    targetY-(rotatedReference.y-reference.y)));
  const moveRoot = current => {
    const rotated = rotate(current);
    return { x: rotated.x + shiftX, y: rotated.y + shiftY };
  };
  const moved = moveRoot(point);

  if (role === 'legs') {
    // Both soles stay planted when the user grabs anything above the legs.
    // Each leg gradually carries the upper-body motion toward its hip.
    const reach = 1 - smooth((sourceY - 131.505) / (179 - 131.505));
    return { x: lerp(point.x, moved.x, reach), y: lerp(point.y, moved.y, reach) };
  }

  if (role === 'arms' || role === 'hands' || role === 'wrists') {
    const reach = smooth((sourceY - 70) / 34);
    const activeHand = handDrag && (sourceX - 47) * (handLeft(pose.part) ? -1 : 1) > 0;
    if (activeHand) {
      const left = handLeft(pose.part);
      const shoulder = moveRoot(left
        ? warp(27.4, 70, 'arms')
        : warp(67.55, 68.45, 'arms'));
      const restingHand = moveRoot(reference);
      const pointerHand = { x: reference.x + pose.x, y: reference.y + pose.y };
      const handX = pointerHand.x - shoulder.x;
      const handY = pointerHand.y - shoulder.y;
      const reach = Math.hypot(handX, handY);
      const natural = Math.hypot(restingHand.x - shoulder.x,
        restingHand.y - shoulder.y);
      const lift = smooth((restingHand.y - pointerHand.y) / natural);
      // Reaching upward draws the whole limb out, so the cap on how far the
      // hand may travel from the shoulder opens as the arm lifts. Holding the
      // hand out past its natural length instead would slide it off the
      // pointer, which is far more disorienting than a slightly short reach.
      const maxReach = natural * lerp(1.35, ARM_LIFT_REACH, lift);
      // Let the hand approach the shoulder so the elbow can fold completely.
      // Only outward travel needs a cap; a minimum reach forces raised hands
      // away from the pointer and prevents the upper and lower arm meeting.
      const reachScale = Math.min(1, maxReach / Math.max(1, reach));
      const desiredHand = {
        x: shoulder.x + handX * reachScale,
        y: shoulder.y + handY * reachScale,
      };
      const wristSource = wristSources[left ? 'left' : 'right'];
      const restingWrist = moveRoot(warp(wristSource.x, wristSource.y, 'arms'));
      const handVectorX = restingHand.x - shoulder.x;
      const handVectorY = restingHand.y - shoulder.y;
      const handLength = Math.max(1, Math.hypot(handVectorX, handVectorY));
      const targetVectorX = desiredHand.x - shoulder.x;
      const targetVectorY = desiredHand.y - shoulder.y;
      const targetLength = Math.hypot(targetVectorX, targetVectorY);
      const cosineTurn = targetLength < 1 ? 1
        : (handVectorX * targetVectorX + handVectorY * targetVectorY) / (handLength * targetLength);
      const sineTurn = targetLength < 1 ? 0
        : (handVectorX * targetVectorY - handVectorY * targetVectorX) / (handLength * targetLength);
      const wristOffsetX = restingWrist.x - restingHand.x;
      const wristOffsetY = restingWrist.y - restingHand.y;
      const desiredWrist = {
        x: desiredHand.x + wristOffsetX * cosineTurn - wristOffsetY * sineTurn,
        y: desiredHand.y + wristOffsetX * sineTurn + wristOffsetY * cosineTurn,
      };
      const oldX = restingWrist.x - shoulder.x;
      const oldY = restingWrist.y - shoulder.y;
      const oldLength = Math.max(1, Math.hypot(oldX, oldY));
      const newX = desiredWrist.x - shoulder.x;
      const newY = desiredWrist.y - shoulder.y;
      const actualLength = Math.hypot(newX, newY);
      const newLength = Math.max(1, actualLength);
      const oldUnitX = oldX / oldLength;
      const oldUnitY = oldY / oldLength;
      const newUnitX = actualLength < 1 ? oldUnitX : newX / actualLength;
      const newUnitY = actualLength < 1 ? oldUnitY : newY / actualLength;
      const localX = moved.x - shoulder.x;
      const localY = moved.y - shoulder.y;
      const along = localX * oldUnitX + localY * oldUnitY;
      let across = -localX * oldUnitY + localY * oldUnitX;
      // The relaxed arms bow outward. Straighten that bow as the hand reaches
      // away from the shoulder, including when it points upward or sideways.
      const extension = smooth((newLength / oldLength - 1) / .4);
      const turn = smooth(Math.abs(Math.atan2(sineTurn, cosineTurn)) / 1.1);
      const straighten = Math.max(extension, turn * .85);
      const progress = clamp01((sourceY - 57) / (wristSource.y - 57));
      across -= (left ? 1 : -1) * 3.2 * Math.sin(Math.PI * progress) * straighten;
      const shaft = {
        x: shoulder.x + newUnitX * along * newLength / oldLength - newUnitY * across,
        y: shoulder.y + newUnitY * along * newLength / oldLength + newUnitX * across,
      };
      // The palm rotates with the forearm but does not stretch with it.
      const palmX = moved.x - restingHand.x;
      const palmY = moved.y - restingHand.y;
      const palm = {
        x: desiredHand.x + palmX * cosineTurn - palmY * sineTurn,
        y: desiredHand.y + palmX * sineTurn + palmY * cosineTurn,
      };
      const shaped = role === 'hands' ? palm : shaft;
      const shoulderBlend = smooth((sourceY - 56) / 14);
      return {
        x: lerp(moved.x, shaped.x, shoulderBlend),
        y: lerp(moved.y, shaped.y, shoulderBlend),
      };
    }
    // A velocity impulse briefly trails the hands behind head movement. It
    // decays while the pointer is still held, so pausing restores their pose.
    const swayShare = pose.part === 'head' ? 1 : .45;
    return {
      x: moved.x + pose.swayX * swayShare * reach,
      y: moved.y + pose.swayY * swayShare * reach,
    };
  }

  return moved;
}

function applyDragPose(point, sourceX, sourceY, role, warp) {
  // Each gesture contributes a displacement from the same base shape. A new
  // drag can begin while older spring animations keep running independently.
  const compression = bodyCompression(warp);
  const moved = dragPoses.reduce((result, pose) => {
    if (!pose.x && !pose.y && !pose.swayX && !pose.swayY) return result;
    const legDrag = pose.part === 'leftLeg' || pose.part === 'rightLeg';
    const moved = legDrag
      ? legDragPose(point, sourceX, sourceY, role, warp, pose)
      : upperDragPose(point, sourceX, sourceY, role, warp, pose, compression.scale);
    return {
      x: result.x + moved.x - point.x,
      y: result.y + moved.y - point.y,
    };
  }, point);
  if (role !== 'hands') return moved;
  const left = sourceX < 47;
  const source = wristSources[left ? 'left' : 'right'];
  const totalAngle = dragPoses.reduce((angle, pose) =>
    angle + (pose.part === `${left ? 'left' : 'right'}Wrist` ? pose.angle : 0), 0);
  if (!totalAngle) return moved;
  const center = applyWristCenter(source, warp);
  const dx = moved.x - center.x;
  const dy = moved.y - center.y;
  const limitedAngle = Math.max(-MAX_WRIST_ANGLE, Math.min(MAX_WRIST_ANGLE, totalAngle));
  const cosine = Math.cos(limitedAngle);
  const sine = Math.sin(limitedAngle);
  return {
    x: center.x + dx * cosine - dy * sine,
    y: center.y + dx * sine + dy * cosine,
  };
}

// Only attachment positions and widths come from the reference. All moving
// contours are regenerated in the limb's local frame, including the boot.
function legGeometry(side, warp, spaceFit=isSpaceSweatpants()) {
  // Move the garment attachment and its reference curves together, never just the crotch stroke.
  if(spaceFit){const originalWarp=warp;warp=(x,y,role)=>{const p=spacePantsFit(x,y);return originalWarp(p.x,p.y,role);};}
  const left = side === 'left', sign = left ? -1 : 1;
  let source = left
    ? [[28.4591,125.881],[44.6804,131.505],[16.3365,179.496],[27.4103,181.091]]
    : [[65.8486,125.059],[49.4914,131.505],[85.1287,180.658],[73.502,182.179]];
  const rest = source.map(([x,y]) => warp(x,y,classifyPoint(x,y,'mixed')));
  const moved = source.map(([x,y],i) =>
    applyDragPose(rest[i],x,y,classifyPoint(x,y,'mixed'),warp));
  const mid = (a,b) => ({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
  const hip = mid(moved[0],moved[1]);
  const restHip = mid(rest[0],rest[1]), restAnkle = mid(rest[2],rest[3]);
  const hipWidth = Math.hypot(rest[0].x-rest[1].x,rest[0].y-rest[1].y)/2;
  const ankleWidth = Math.hypot(rest[2].x-rest[3].x,rest[2].y-rest[3].y)/2;
  // How far this leg is actually being carried, not merely whether it is. A
  // hard switch here put the foot either on its planted sole or on the IK's
  // own ankle, and in a deep squat those sit some six units apart: a leftover
  // pose from an earlier leg drag, relaxing back through the threshold, flicked
  // both feet downwards. Everything the switch feeds now eases across instead,
  // so the two agree as the carry falls to nothing.
  const carry=dragPoses.reduce((most,p)=>p.part===side+'Leg'
    ? Math.max(most,Math.hypot(p.x,p.y)) : most,0);
  const lift=smooth(carry/3);
  const lifted=carry>.001;
  // At an extreme lean the compressed leg may roll onto its toe. Rotate the
  // whole reference shoe about that toe, so its size never changes.
  const toe=warp(left?1.83136:99.0496,190.66,'legs');
  const lean=Math.max(0,sign*(hip.x-restHip.x));
  const crouch=smooth((hip.y-restHip.y)/Math.max(1,restAnkle.y-restHip.y));
  const heelAngle=sign*(.18+.24*crouch)*smooth((lean-3)/17)*(1-lift);
  const rotateToe=point=>{
    const dx=point.x-toe.x,dy=point.y-toe.y;
    return {x:toe.x+dx*Math.cos(heelAngle)-dy*Math.sin(heelAngle),
      y:toe.y+dx*Math.sin(heelAngle)+dy*Math.cos(heelAngle)};
  };
  const planted=rotateToe(restAnkle),carried=mid(moved[2],moved[3]);
  const target=lifted
    ? {x:lerp(planted.x,carried.x,lift),y:lerp(planted.y,carried.y,lift)}
    : planted;
  let dx=target.x-hip.x, dy=target.y-hip.y;
  const reach = Math.hypot(dx,dy);
  if (reach < .001) { dx=restAnkle.x-restHip.x; dy=restAnkle.y-restHip.y; }
  const magnitude = Math.hypot(dx,dy);
  const tangent = {x:dx/magnitude,y:dy/magnitude};
  const normal = {x:sign*tangent.y,y:-sign*tangent.x};
  // Keep enough room for a rounded boot when the pointer passes the hip.
  const restLength = Math.hypot(restAnkle.x-restHip.x,restAnkle.y-restHip.y);
  // Dragging outward can lengthen both bones a little. Moving inward keeps
  // their original lengths and folds the knee, as in the planted pose.
  const boneLength=Math.min(restLength*LEG_MAX_STRETCH,
    Math.max(restLength,reach));
  // The minimum extension keeps room for a rounded boot once the pointer
  // passes the hip, but it is what threw the ankle clear of the planted sole
  // in a squat, so it comes in with the carry too.
  const length = lifted
    ? Math.min(boneLength,Math.max(hipWidth*2.4*lift,reach)) : reach;
  const ankle = lifted ? {x:hip.x+tangent.x*length,y:hip.y+tangent.y*length} : target;
  // A slightly longer thigh lets the knee fold out past the planted ankle
  // when the pelvis comes down. Equal bones force a nearly vertical knee at
  // this pose, making the leg look like a narrow paper strip.
  // Near a vertical stance the two segments share the travel evenly. As the
  // hip approaches the ankle height, shift the hinge toward the foot so the
  // folded knee remains outside the silhouette and above the sole.
  const thighRatio=Math.min(.5+.12*smooth(1-Math.abs(tangent.y))
      +.03*smooth((lean-4)/10)*(1-lift),
    .5+length/boneLength*.495);
  const thighLength=boneLength*thighRatio, shinLength=boneLength-thighLength;
  const kneeAlong=(thighLength*thighLength-shinLength*shinLength
    +length*length)/(2*length);
  const kneeHeight=Math.sqrt(Math.max(0,thighLength*thighLength
    -kneeAlong*kneeAlong));
  // Walking bends both knees towards travel. Dragging retains the usual
  // outward bend; the walking influence fades in/out with the motion.
  // `walkBlend` is signed: positive walks right, negative walks left, and
  // only the leg whose knee would otherwise bend against the travel flips.
  const walkBlend = dragPoses.find(p => p.part === side + 'Leg')?.walkBlend || 0;
  const walking = Math.abs(walkBlend);
  const kneeDirection = 1 - 2 * (left ? Math.max(0, walkBlend) : Math.max(0, -walkBlend));
  const knee={x:hip.x+tangent.x*kneeAlong+normal.x*kneeHeight*kneeDirection,
    y:hip.y+tangent.y*kneeAlong+normal.y*kneeHeight*kneeDirection};
  const kneeFrame={t:tangent,n:normal};
  const bendAngle = Math.min(.25,Math.max(0,restLength-length)/restLength*.45);
  const rotation = Math.atan2(tangent.y,tangent.x)
    - Math.atan2(restAnkle.y-restHip.y,restAnkle.x-restHip.x);
  const frame = angle => ({t:{x:-Math.sin(angle),y:Math.cos(angle)},
    n:{x:sign*Math.cos(angle),y:sign*Math.sin(angle)}});
  // The shoe has to follow the SHIN, not the hip-to-ankle chord: once the knee
  // folds those two diverge completely, which swung a raised leg's foot into
  // angles no ankle can reach. Build the frame straight from the shin vector
  // rather than through frame(), whose angle is measured from vertical while
  // a shin delta is measured from the resting leg: that mismatch left the
  // contour arriving a good thirty degrees off the shin it belongs to.
  // Measure the shin as a DELTA from the resting leg, the same convention
  // frame() uses. Feeding it an absolute shin direction tilted every lifted
  // shoe by the resting leg's own sixteen degrees, so the foot sat crooked
  // for the whole spring-back and then snapped straight when the pose was
  // finally dropped. As a delta both branches agree exactly at rest, so the
  // tilt grows out of nothing as the leg swings and fades back the same way.
  const shinDelta=Math.atan2(ankle.y-knee.y,ankle.x-knee.x)
    -Math.atan2(restAnkle.y-restHip.y,restAnkle.x-restHip.x);
  // A deeply folded knee lets its foot drop away from the calf.
  // Ease the shoe's own angle across too. A folded squat leaves the shin
  // pointing somewhere quite different from the planted heel angle, so
  // switching between them rotated the whole boot about its ankle and moved
  // the toe even once the ankle itself had stopped jumping.
  const carriedAngle=shinDelta+sign*ANKLE_DROP*smooth(bendAngle/.22);
  const footLift = Math.max(0, -(dragPoses.find(p => p.part === side + 'Leg')?.y || 0));
  const walkingAngle = -.16 * smooth(footLift / 8);
  const shoeFrame=frame(lerp(lifted?lerp(heelAngle,carriedAngle,lift):heelAngle,
    walkingAngle, walking));
  // Both feet point the way the character walks. The art splays each foot
  // outwards, so the trailing one aims backwards during a rightward walk and
  // the two shoes pile into one blob where the legs cross. A motion can turn
  // a foot through `toeTurn`: at 1 the shoe is mirrored about the ankle, so
  // its toe leads instead of trailing. Turning it is a reflection, not a
  // rotation — a real foot pivoting this way foreshortens on the way round,
  // which is why the walk only turns a foot while it is up in the air.
  const toeTurn = dragPoses.find(p => p.part === side + 'Leg')?.toeTurn || 0;
  const toeDirection = 1 - 2 * toeTurn;
  const footFrame = toeTurn
    ? {t:shoeFrame.t,n:{x:shoeFrame.n.x*toeDirection,y:shoeFrame.n.y*toeDirection}}
    : shoeFrame;
  const start=frame(rotation+sign*bendAngle),
    end=frame(lifted?lerp(heelAngle,shinDelta,lift):heelAngle);
  if(!lifted){
    // The two original shoe corners are at different heights. Aim the final
    // hose cross-section at those exact corners instead of finishing with a
    // horizontal round cap that sticks through the shoe outline.
    const outer=rotateToe(rest[2]),inner=rotateToe(rest[3]);
    end.n={x:(outer.x-inner.x)/(2*ankleWidth),
      y:(outer.y-inner.y)/(2*ankleWidth)};
    end.t={x:-sign*end.n.y,y:sign*end.n.x};
  } else {
    // Same idea for a lifted leg: the shoe carries its own tilt, so aim the
    // last cross-section at where the boot's two ankle corners actually land
    // or the seam meets the boot at an angle and the contours fail to join.
    const corner=p=>{
      const across=p.x-restAnkle.x,along=p.y-restAnkle.y;
      return {x:ankle.x+footFrame.t.x*along+footFrame.n.x*across*sign,
        y:ankle.y+footFrame.t.y*along+footFrame.n.y*across*sign};
    };
    const outer=corner(rest[2]),inner=corner(rest[3]);
    end.n={x:(outer.x-inner.x)/(2*ankleWidth),
      y:(outer.y-inner.y)/(2*ankleWidth)};
    end.t={x:-sign*end.n.y,y:sign*end.n.x};
  }
  // A leg at or past its resting length is straight, so the shin has to run
  // into the ankle along the hip-to-ankle line. Aiming the last control at
  // the shoe's own cross-section bent it there instead, which showed as a
  // kink above a stretched foot. A folded leg still meets the shoe squarely.
  const straighten=smooth((length/restLength-.92)/.1);
  if(straighten>0){
    const aim={x:lerp(end.t.x,tangent.x,straighten),
      y:lerp(end.t.y,tangent.y,straighten)};
    const aimLength=Math.hypot(aim.x,aim.y);
    if(aimLength>.001) end.t={x:aim.x/aimLength,y:aim.y/aimLength};
  }
  // Aim the root cross-section at the two hip landmarks where they actually
  // sit now. Rotating the resting chord by the leg's own turn assumed the
  // pelvis never moved independently; once a hand can lean and turn the
  // torso, the thigh's edge landed a unit off the waist contour and the two
  // lines visibly failed to meet at the hip.
  const rootAngle=Math.atan2(moved[0].y-moved[1].y,moved[0].x-moved[1].x)
    - (left ? Math.PI : 0);
  start.n={x:sign*Math.cos(rootAngle),y:sign*Math.sin(rootAngle)};
  start.t={x:-Math.sin(rootAngle),y:Math.cos(rootAngle)};
  const offset=(origin,frame,along,across)=>({
    x:origin.x+frame.t.x*along+frame.n.x*across,
    y:origin.y+frame.t.y*along+frame.n.y*across});
  // Two cubic centerline spans share a tangent at the knee. The outline is
  // an offset of that spine, so its width is measured perpendicular to the
  // bend instead of along fixed cross-sections (the old paper-strip look).
  const upperLength=Math.hypot(knee.x-hip.x,knee.y-hip.y);
  const lowerLength=Math.hypot(ankle.x-knee.x,ankle.y-knee.y);
  const upper={x:(knee.x-hip.x)/upperLength,y:(knee.y-hip.y)/upperLength};
  const lower={x:(ankle.x-knee.x)/lowerLength,y:(ankle.y-knee.y)/lowerLength};
  const jointMagnitude=Math.hypot(upper.x+lower.x,upper.y+lower.y);
  const joint=jointMagnitude>.001
    ? {x:(upper.x+lower.x)/jointMagnitude,y:(upper.y+lower.y)/jointMagnitude}
    : tangent;
  const handle=Math.min(restLength*.16,length*.1);
  // In a very deep diagonal squat the hip can approach an ankle. Shorten the
  // terminal tangent then, or the calf spline loops back through the thigh.
  const ankleHandle=Math.min(Math.max(handle,ankleWidth*1.4),
    Math.max(ankleWidth*.4,length*.45));
  const add=(p,v,d)=>({x:p.x+v.x*d,y:p.y+v.y*d});
  const spine=[
    [hip,add(hip,start.t,handle),add(knee,joint,-handle),knee],
    [knee,add(knee,joint,handle),add(ankle,end.t,-ankleHandle),ankle],
  ];
  const bezier=(points,t)=>{const u=1-t;
    return {x:u*u*u*points[0].x+3*u*u*t*points[1].x+3*u*t*t*points[2].x+t*t*t*points[3].x,
      y:u*u*u*points[0].y+3*u*u*t*points[1].y+3*u*t*t*points[2].y+t*t*t*points[3].y};};
  const pair = p => `${clean(p.x)} ${clean(p.y)}`;
  const leftReferenceCurves={
    outer:[[28.4591,125.881],[24.0656,138.513],
      [17.1602,169.335],[16.3365,179.496]],
    inner:[[44.6804,131.505],[43.089,133.42],
      [32.3596,165.234],[27.4103,181.091]],
  };
  const rightReferenceCurves={
    outer:[[65.8486,125.059],[69.4888,132.857],
      [80.4487,161.048],[85.1287,180.658]],
    inner:[[49.4914,131.505],[52.4708,135.97],
      [73.0145,180.976],[73.502,182.179]],
  };
  const referenceCurves=left?leftReferenceCurves:rightReferenceCurves;
  const referencePoint=([x,y])=>warp(x,y,classifyPoint(x,y,'mixed'));
  let referenceOuter=referenceCurves.outer.map(referencePoint);
  let referenceInner=referenceCurves.inner.map(referencePoint);
  if(spaceFit){
    // Straight resting trouser seams; the posed spine still bends with the leg.
    const straight=points=>[0,1/3,2/3,1].map(t=>({
      x:lerp(points[0].x,points[3].x,t),y:lerp(points[0].y,points[3].y,t)}));
    referenceOuter=straight(referenceOuter);referenceInner=straight(referenceInner);
  }
  const canonicalOuter=spaceFit||left||Number(controls.legs.value)<=100?null
    :leftReferenceCurves.outer.map(([x,y])=>
      warp(x,y,classifyPoint(x,y,'mixed')));
  const canonicalInner=canonicalOuter?leftReferenceCurves.inner.map(([x,y])=>
    warp(x,y,classifyPoint(x,y,'mixed'))):null;
  const motion=Math.max(Math.hypot(hip.x-restHip.x,hip.y-restHip.y),
    Math.hypot(ankle.x-restAnkle.x,ankle.y-restAnkle.y));
  const poseBlend=smooth(motion/12);
  // A planted shoe keeps the reference silhouette at every squat depth.
  // Only a shoe picked up with its leg transitions into the rotated boot.
  // The boot's own morph follows the carry as well, or the shoe swapped
  // between its reference silhouette and the generated one while the ankle
  // underneath stayed put, which moved the toe on its own.
  const bootBlend=lifted?poseBlend*lift:0;
  const generated=Array.from({length:33},(_,i)=>i<=16
    ?bezier(spine[0],i/16):bezier(spine[1],(i-16)/16));
  const referenceWidths=[];
  const centerline=generated.map((point,i)=>{
    const t=i/32,outer=bezier(referenceOuter,t),inner=bezier(referenceInner,t);
    let width=Math.max(2,Math.hypot(outer.x-inner.x,outer.y-inner.y)-1);
    if(canonicalOuter){
      // The right reference curves have a larger vertical offset between
      // their edges. Stretching the leg inflates that offset into apparent
      // thickness, so use the left leg's width through the flexible shaft.
      // Keep the original attachment widths at the hip and shoe.
      const canonicalA=bezier(canonicalOuter,t),canonicalB=bezier(canonicalInner,t);
      const canonicalWidth=Math.max(2,Math.hypot(canonicalA.x-canonicalB.x,
        canonicalA.y-canonicalB.y)-1);
      const shaftBlend=smooth(t/.12)*smooth((1-t)/.12);
      const lengthBlend=smooth((Number(controls.legs.value)-100)/80);
      width=lerp(width,canonicalWidth,shaftBlend*lengthBlend);
    }
    referenceWidths.push(width);
    const reference=mid(outer,inner);
    reference.x+=(hip.x-restHip.x)*(1-t)+(ankle.x-restAnkle.x)*t;
    reference.y+=(hip.y-restHip.y)*(1-t)+(ankle.y-restAnkle.y)*t;
    return {x:lerp(reference.x,point.x,poseBlend),
      y:lerp(reference.y,point.y,poseBlend)};
  });
  const hose=[];
  const leanWidth=.14*smooth((lean-4)/10)*(1-lift);
  for(let i=0;i<32;i++){
    const a=centerline[i],b=centerline[i+1];
    const before=centerline[Math.max(0,i-1)],after=centerline[Math.min(32,i+2)];
    // A tube cap is perpendicular to its first tangent. Use the attachment
    // chord's normal here, rather than the chord to the next sampled point:
    // that approximation leaves a gap even in an untouched, slider-sized pose.
    const first=i===0?add(a,start.t,Math.hypot(b.x-a.x,b.y-a.y)/6)
      :add(a,{x:b.x-before.x,y:b.y-before.y},1/6);
    const previousSecond=add(b,{x:a.x-after.x,y:a.y-after.y},1/6);
    const terminalHandle=Math.hypot(b.x-a.x,b.y-a.y)/3;
    const terminalSecond=add(b,end.t,-terminalHandle);
    const second=i===31?{
      x:lerp(previousSecond.x,terminalSecond.x,poseBlend),
      y:lerp(previousSecond.y,terminalSecond.y,poseBlend),
    }:previousSecond;
    const global=(i+.5)/32;
    hose.push({d:`M${pair(a)}C${pair(first)} ${pair(second)} ${pair(b)}`,
      width:lerp(2*Math.hypot(moved[0].x-hip.x,moved[0].y-hip.y)-1,
        lerp((referenceWidths[i]+referenceWidths[i+1])/2,
          2*lerp(hipWidth,ankleWidth,smooth(global)),poseBlend)
          *(1+leanWidth*Math.sin(Math.PI*global))
          -poseBlend*smooth((global-.88)/.12),smooth(i/3))});
  }
  const scale=ankleWidth/5.7;
  const boot = (along,across) => offset(ankle,footFrame,along*scale,across*scale);
  const w=ankleWidth/scale;
  const innerAnkle=offset(ankle,footFrame,0,-ankleWidth);
  const ankleDrop=lifted?0:2.8*smooth((restLength-length)/restLength);
  const loweredInnerAnkle=offset(ankle,footFrame,ankleDrop,-ankleWidth);
  const bootOuter=offset(ankle,footFrame,0,ankleWidth);
  const dynamicBoot=[
    [boot(3,w),boot(3,w+13),boot(9,w+13)],
    [boot(12,w+13),boot(12,w+5),boot(12,-w+2)],
    [boot(12,-w),boot(10,-w),boot(8,-w)],
    [boot(5,-w),boot(2,-w),loweredInnerAnkle],
  ];
  // The standing boot follows the three original SVG curves. Split its long
  // sole curve once so it has the same four segments as the moving boot.
  const coords=([x,y])=>({x,y});
  const halfway=(a,b)=>mid(a,b);
  const leftSole=[coords([1.83136,190.66]),coords([2.72572,194.595]),
    coords([25.5322,192.091]),coords([26.1582,191.376])];
  const h01=halfway(leftSole[0],leftSole[1]);
  const h12=halfway(leftSole[1],leftSole[2]);
  const h23=halfway(leftSole[2],leftSole[3]);
  const h012=halfway(h01,h12),h123=halfway(h12,h23);
  const soleSplit=halfway(h012,h123);
  const referenceBoot=left?{
    start:coords([16.3365,179.496]),
    segments:[
      [coords([5.76653,181.001]),coords([0.937006,186.725]),coords([1.83136,190.66])],
      [h01,h012,soleSplit],[h123,h23,leftSole[3]],
      [coords([26.6591,190.803]),coords([27.2016,184.281]),coords([27.4103,181.091])],
    ],
  }:{
    start:coords([85.1287,180.658]),
    segments:[
      [coords([92.0608,180.3]),coords([100.909,186.369]),coords([99.0496,190.66])],
      [coords([93.4733,193.151]),coords([74.7755,191.437]),coords([74.7178,190.86])],
      [coords([74.7149667,190.8316667]),coords([74.7121333,190.8033333]),coords([74.7093,190.775])],
      [coords([74.6126,189.799]),coords([73.9722,183.339]),coords([73.502,182.179])],
    ],
  };
  const rightHeelTuck=left?0:.85*smooth((1-length/restLength-.25)/.3)*(1-lift);
  const referenceFootPoint=source=>{
    // In a deep squat the right heel originally bows farther outward than
    // the left. Ease only its lower controls inward; the ankle and toe stay
    // fixed, and the standing reference remains untouched.
    const heelWeight=source.x<76
      ?Math.pow(Math.max(0,Math.min(1,(source.y-182.179)/8)),.6):0;
    const point=warp(source.x-rightHeelTuck*heelWeight,source.y,'legs');
    const x=point.x-restAnkle.x,y=point.y-restAnkle.y;
    return {x:ankle.x+footFrame.t.x*y+footFrame.n.x*x*sign,
      y:ankle.y+footFrame.t.y*y+footFrame.n.y*x*sign};
  };
  const morph=(reference,moving)=>({
    x:lerp(reference.x,moving.x,bootBlend),
    y:lerp(reference.y,moving.y,bootBlend),
  });
  const footStart=morph(referenceFootPoint(referenceBoot.start),bootOuter);
  const footEnd=morph(referenceFootPoint(referenceBoot.segments[3][2]),loweredInnerAnkle);
  const shoeCurves=dynamicBoot.map((segment,i)=>segment.map((point,j)=>morph(
    referenceFootPoint(referenceBoot.segments[i][j]),point)));
  const foot=`M${pair(footStart)}`+shoeCurves.map(points=>`C${points.map(pair).join(' ')}`).join('');
  // Attach decorations to the same morphed vamp that is actually drawn.
  const vamp=[footStart,...shoeCurves[0]];
  const instep=bezier(vamp,.3),beforeInstep=bezier(vamp,.29),afterInstep=bezier(vamp,.31);
  const vampTangent={x:afterInstep.x-beforeInstep.x,y:afterInstep.y-beforeInstep.y};
  const vampTangentLength=Math.hypot(vampTangent.x,vampTangent.y)||1;
  const instepToe={x:vampTangent.x/vampTangentLength,y:vampTangent.y/vampTangentLength};
  const instepUp={x:-instepToe.y,y:instepToe.x};
  if(instepUp.x*(-shoeFrame.t.x)+instepUp.y*(-shoeFrame.t.y)<0){instepUp.x*=-1;instepUp.y*=-1;}

  const bootFill=`${foot}Z`;
  const bootOutline=foot;
  const bootToe=referenceFootPoint(referenceBoot.segments[0][2]);
  const bootHeel=referenceFootPoint(referenceBoot.segments[1][2]);
  const ankleOuterEdge=offset(ankle,end,0,ankleWidth);
  const ankleInnerEdge=offset(ankle,end,0,-ankleWidth);
  // Trace the contact of the two curved bone spans, and start only where
  // their widths actually meet. This follows the bend instead of drawing a
  // straight diagonal across the leg.
  const creasePoints=[];
  for(let i=0;i<=12;i++){
    const t=.08+i*.07;
    const thigh=bezier(spine[0],t),calf=bezier(spine[1],1-t);
    const separation=Math.hypot(calf.x-thigh.x,calf.y-thigh.y);
    const thighRadius=lerp(hipWidth,ankleWidth,t*.55);
    const calfRadius=lerp(hipWidth,ankleWidth,.5+t*.5);
    if(separation<=thighRadius+calfRadius || t>.75){
      const share=thighRadius/(thighRadius+calfRadius);
      const overlap=Math.max(0,1-separation/(thighRadius+calfRadius));
      const bow=Math.min(thighRadius,calfRadius)*.4
        *Math.sin(Math.PI*t)*overlap;
      const direction=separation>.001
        ?{x:(calf.x-thigh.x)/separation,y:(calf.y-thigh.y)/separation}
        :{x:0,y:0};
      creasePoints.push({x:lerp(thigh.x,calf.x,share)+direction.x*bow,
        y:lerp(thigh.y,calf.y,share)+direction.y*bow});
    }
  }
  // Keep the crease inside the fold. Its end controls otherwise reach the
  // outer contour and appear as little crossing strokes at the knee/ankle.
  const visibleCrease=creasePoints.length>6?[
    mid(creasePoints[0],creasePoints[1]),
    ...creasePoints.slice(1,-1),
    mid(creasePoints[creasePoints.length-2],creasePoints[creasePoints.length-1]),
  ]:creasePoints;
  let crease=`M${pair(visibleCrease[0])}`;
  for(let i=0;i<visibleCrease.length-1;i++){
    const p0=visibleCrease[Math.max(0,i-1)],p1=visibleCrease[i];
    const p2=visibleCrease[i+1],p3=visibleCrease[Math.min(visibleCrease.length-1,i+2)];
    const first=add(p1,{x:p2.x-p0.x,y:p2.y-p0.y},1/6);
    const second=add(p2,{x:p1.x-p3.x,y:p1.y-p3.y},1/6);
    crease+=`C${pair(first)} ${pair(second)} ${pair(p2)}`;
  }
  const creaseOpacity=smooth((1-length/restLength-.25)/.3);
  return {side,hose,bootFill,bootOutline,shoeCurves,shoeOut:{x:footFrame.n.x*sign,y:footFrame.n.y*sign},shoeUp:{x:-shoeFrame.t.x,y:-shoeFrame.t.y},
    bootOuter:footStart,bootInner:footEnd,bootToe,bootHeel,
    ankleOuterEdge,ankleInnerEdge,
    crease,creaseOpacity,centerline,hip,ankle,knee,crotchAnchor:moved[1],outerAnchor:moved[0],
    thighLength,shinLength,boneLength,restLength,hipWidth,lifted,heelAngle,toe,
    sole:[boot(12,-w+2),boot(12,w+5)],foot:boot(8,w+2),
    instep,instepAxes:{toe:instepToe,up:instepUp},
    middle:knee};
}

function legContour(side,warp) { return legGeometry(side,warp); }

// The arm follows legGeometry. Only the shoulder attachment, the palm chord
// and the resting widths come from the reference; the shaft is a two-bone
// spine with an offset hose, and the palm is rigid in the forearm's frame.
function armGeometry(side, warp) {
  const left = side === 'left', sign = left ? -1 : 1;
  const hinge = wristSources[side];
  const source = left
    ? [[26.1046,56.4524],[27.478,LEFT_ARMPIT_Y],[6.85326,97.5023],[15.029,97.8624]]
    : [[67.7274,55.0466],[67.5459,RIGHT_ARMPIT_Y],[91.4318,95.8142],[81.473,96.535]];
  const rest = source.map(([x,y]) => warp(x,y,classifyPoint(x,y,'mixed')));
  // The shoulder pair is part of the torso's side edge and keeps the body's
  // own drag role, so the attachment never parts from the trunk.
  const root = source.slice(0,2).map(([x,y],i) =>
    applyDragPose(rest[i],x,y,classifyPoint(x,y,'mixed'),warp));
  const mid = (a,b) => ({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
  const shoulder = mid(root[0],root[1]);
  const restShoulder = mid(rest[0],rest[1]), restWrist = mid(rest[2],rest[3]);
  const shoulderWidth = Math.hypot(rest[0].x-rest[1].x,rest[0].y-rest[1].y)/2;
  const wristWidth = Math.hypot(rest[2].x-rest[3].x,rest[2].y-rest[3].y)/2;
  // The hinge drives the pose, but the hose has to end on the midpoint of the
  // palm's own chord. Carry the constant gap between the two, so a resting
  // arm still reproduces the reference contour exactly.
  const hingeRest = warp(hinge.x,hinge.y,'arms');
  const hingeMoved = applyWristCenter(hinge,warp);
  const target = {x:hingeMoved.x+restWrist.x-hingeRest.x,
    y:hingeMoved.y+restWrist.y-hingeRest.y};
  let dx=target.x-shoulder.x, dy=target.y-shoulder.y;
  const reach=Math.hypot(dx,dy);
  if(reach<.001){ dx=restWrist.x-restShoulder.x; dy=restWrist.y-restShoulder.y; }
  const magnitude=Math.hypot(dx,dy);
  const tangent={x:dx/magnitude,y:dy/magnitude};
  const normal={x:sign*tangent.y,y:-sign*tangent.x};
  const restLength=Math.hypot(restWrist.x-restShoulder.x,restWrist.y-restShoulder.y);
  // Reaching out may lengthen both bones a little. The cap only guards against
  // a runaway pose: the hand drag already limits its own reach, so the hose
  // keeps meeting the pointer instead of lagging behind a second limit.
  // A folded arm may also draw its bones in a little. Holding them rigid made
  // any hand short of full extension bunch the limb around a jutting elbow,
  // which reads as a lump rather than a bend; giving a little lets the arm
  // stay a smooth tube through the whole sweep.
  const boneLength=Math.min(restLength*ARM_MAX_STRETCH,
    Math.max(restLength*lerp(1,ARM_MIN_FOLD,smooth((1-reach/restLength)/.45)),
      reach));
  // Leave room for the palm when the pointer passes the shoulder.
  const length=Math.min(boneLength,Math.max(wristWidth*1.8,reach));
  const wrist={x:shoulder.x+tangent.x*length,y:shoulder.y+tangent.y*length};
  // A slightly longer upper arm keeps the folded elbow outside the silhouette.
  const upperRatio=Math.min(.5+.12*smooth(1-Math.abs(tangent.y)),
    .5+length/boneLength*.495);
  const upperLength=boneLength*upperRatio, foreLength=boneLength-upperLength;
  const elbowAlong=(upperLength*upperLength-foreLength*foreLength
    +length*length)/(2*length);
  const elbowHeight=Math.sqrt(Math.max(0,upperLength*upperLength
    -elbowAlong*elbowAlong));
  const elbow={x:shoulder.x+tangent.x*elbowAlong+normal.x*elbowHeight,
    y:shoulder.y+tangent.y*elbowAlong+normal.y*elbowHeight};
  const bendAngle=Math.min(.25,Math.max(0,restLength-length)/restLength*.45);
  const rotation=Math.atan2(tangent.y,tangent.x)
    -Math.atan2(restWrist.y-restShoulder.y,restWrist.x-restShoulder.x);
  const turn=Math.abs(Math.atan2(Math.sin(rotation),Math.cos(rotation)));
  const frame=angle=>({t:{x:-Math.sin(angle),y:Math.cos(angle)},
    n:{x:sign*Math.cos(angle),y:sign*Math.sin(angle)}});
  // The hinge's own turn now rides on top of the forearm's direction, so a
  // wrist rotation bends against the bent forearm instead of the old straight
  // shoulder-to-hand line.
  const spin=Math.max(-MAX_WRIST_ANGLE,Math.min(MAX_WRIST_ANGLE,
    dragPoses.reduce((sum,pose)=>
      sum+(pose.part===`${side}Wrist`?pose.angle:0),0)));
  const forearmAngle=rotation-sign*bendAngle+spin;
  const start=frame(rotation+sign*bendAngle);
  // The spine has to arrive along the forearm itself. Aiming its last control
  // at the palm's chord instead sent the final stretch wide and hooked it back
  // into the wrist, which read as the hand tucking in the moment a drag began.
  const forearm={x:(wrist.x-elbow.x)/Math.max(.001,
    Math.hypot(wrist.x-elbow.x,wrist.y-elbow.y)),
    y:(wrist.y-elbow.y)/Math.max(.001,
      Math.hypot(wrist.x-elbow.x,wrist.y-elbow.y))};
  // The previous estimate of the forearm turn drifted from the actual elbow
  // to wrist direction when a long arm bent. The palm then met the hose at a
  // different angle and left a small notch on one side of the wrist. Keep the
  // drawn resting frame, but use the solved bone direction as it reaches.
  const solvedForearmAngle=Math.atan2(-forearm.x,forearm.y);
  const frameDelta=Math.atan2(Math.sin(solvedForearmAngle-(forearmAngle-spin)),
    Math.cos(solvedForearmAngle-(forearmAngle-spin)));
  const handFrame=frame(forearmAngle+frameDelta*
    smooth((length/restLength-1)/.2));
  const end={t:forearm,n:{x:sign*forearm.y,y:-sign*forearm.x}};
  // Aim the root cross-section at the two shoulder landmarks where they
  // actually sit, exactly as the hip does. Turning it with the arm swung the
  // whole thirteen-unit attachment off the torso edge, so an arm raised
  // overhead grew a large lobe out past the shoulder instead of leaving it
  // along the trunk. The shoulder belongs to the torso, not to the arm.
  const rootAngle=Math.atan2(root[0].y-root[1].y,root[0].x-root[1].x)
    -(left?Math.PI:0);
  start.n={x:sign*Math.cos(rootAngle),y:sign*Math.sin(rootAngle)};
  start.t={x:-Math.sin(rootAngle),y:Math.cos(rootAngle)};
  // The palm is rigid: every one of its points keeps its resting offset from
  // the wrist and is re-expressed in the forearm's frame, so no pose can
  // stretch the fingers the way a warped contour did.
  const handPoint=(x,y)=>{
    const point=warp(x,y,'arms');
    const along=point.y-restWrist.y, across=point.x-restWrist.x;
    return {x:wrist.x+handFrame.t.x*along+handFrame.n.x*across*sign,
      y:wrist.y+handFrame.t.y*along+handFrame.n.y*across*sign};
  };
  const palmOuter=handPoint(source[2][0],source[2][1]);
  const palmInner=handPoint(source[3][0],source[3][1]);
  const palmSpan=Math.hypot(palmOuter.x-palmInner.x,palmOuter.y-palmInner.y);
  const palmTangent={x:-sign*(palmOuter.y-palmInner.y)/palmSpan,
    y:sign*(palmOuter.x-palmInner.x)/palmSpan};
  // Two cubic centerline spans share a tangent at the elbow. The outline is an
  // offset of that spine, so its width is measured perpendicular to the bend.
  const upperSpan=Math.hypot(elbow.x-shoulder.x,elbow.y-shoulder.y);
  const upper={x:(elbow.x-shoulder.x)/upperSpan,y:(elbow.y-shoulder.y)/upperSpan};
  const lower=forearm;
  const jointMagnitude=Math.hypot(upper.x+lower.x,upper.y+lower.y);
  const joint=jointMagnitude>.001
    ?{x:(upper.x+lower.x)/jointMagnitude,y:(upper.y+lower.y)/jointMagnitude}
    :tangent;
  const handle=Math.min(restLength*.16,length*.1);
  // A hand pulled back across its own shoulder shortens the span. Keep the
  // terminal tangent inside it, or the forearm spline loops into the biceps.
  const wristHandle=Math.min(Math.max(handle,wristWidth*1.4),
    Math.max(wristWidth*.4,length*.45));
  const add=(p,v,d)=>({x:p.x+v.x*d,y:p.y+v.y*d});
  // A relaxed arm bows outward. The reference contour carries that bow, but it
  // can only be translated, so a turned arm has to fall back on the generated
  // spine; without a bow of its own the spine is a straight tube and the hand
  // reads as tucked in against the body. It eases away as the arm reaches out
  // or folds, where the elbow itself supplies the shape.
  // Top the elbow's own sideways offset up to the relaxed bow rather than
  // adding to it, so a folded or reaching arm is never exaggerated: a fold
  // already past the bow contributes nothing.
  const bow=Math.max(0,ARM_BOW*(1-smooth((length/restLength-1)/.3))
    -elbowHeight);
  // The bow peaks at the elbow, so the joint itself has to carry it too;
  // leaving the junction on the straight line pinched the spine into two
  // separate bumps. Both controls beside it share one offset, which keeps
  // the tangent continuous across the two spans.
  const bowed=(point,share)=>({x:point.x+normal.x*bow*share,
    y:point.y+normal.y*bow*share});
  const bowedElbow=bowed(elbow,1);
  // A hanging arm sets off sideways from the shoulder, which reads as the
  // deltoid. Swung overhead that same sideways kick has to double back and
  // balloons into a lobe out past the trunk, so ease the first control
  // towards the upper arm as the limb turns away from its resting direction.
  // The cross-section itself stays on the torso edge; only the direction the
  // spine departs in gives way.
  const swung=smooth((turn-.6)/1.2);
  const rootAim={x:lerp(start.t.x,upper.x,swung),y:lerp(start.t.y,upper.y,swung)};
  const rootSpan=Math.hypot(rootAim.x,rootAim.y);
  const rootT=rootSpan>.001
    ? {x:rootAim.x/rootSpan,y:rootAim.y/rootSpan} : start.t;
  const spine=[
    [shoulder,bowed(add(shoulder,rootT,handle),.5),
      bowed(add(elbow,joint,-handle),.87),bowedElbow],
    [bowedElbow,bowed(add(elbow,joint,handle),.87),
      bowed(add(wrist,end.t,-wristHandle),.5),wrist],
  ];
  const bezier=(points,t)=>{const u=1-t;
    return {x:u*u*u*points[0].x+3*u*u*t*points[1].x+3*u*t*t*points[2].x+t*t*t*points[3].x,
      y:u*u*u*points[0].y+3*u*u*t*points[1].y+3*u*t*t*points[2].y+t*t*t*points[3].y};};
  const pair = p => `${clean(p.x)} ${clean(p.y)}`;
  // One cubic per edge in the reference, from the shoulder anchor down to the
  // matching palm corner. The resting arm therefore renders as drawn.
  const referenceCurves=left?{
    outer:[[26.1046,56.4524],[20.3008,58.2925],
      [5.43795,73.297],[6.85326,97.5023]],
    inner:[[27.478,LEFT_ARMPIT_Y],[19.7012,74.4206],
      [15.2396,93.5551],[15.029,97.8624]],
  }:{
    outer:[[67.7274,55.0466],[84.3059,62.0119],
      [90.9179,83.3298],[91.4318,95.8142]],
    inner:[[67.5459,RIGHT_ARMPIT_Y],[77.5549,72.1052],
      [80.8631,88.1082],[81.473,96.535]],
  };
  // The two reference edges carry their own control spacing, so equal curve
  // parameters do not face each other. On the left arm that pairs points half
  // a limb apart and reports a width of 16.6 where the arm is really 11.2
  // thick, which is why it looked swollen next to the right one. Walk both
  // edges by arc length instead, so each sample faces the one across from it.
  const arcSamples=curve=>{
    const steps=128,walk=[bezier(curve,0)],lengths=[0];
    let total=0;
    for(let i=1;i<=steps;i++){
      const point=bezier(curve,i/steps);
      total+=Math.hypot(point.x-walk[i-1].x,point.y-walk[i-1].y);
      walk.push(point);lengths.push(total);
    }
    const out=[];
    let index=1;
    for(let i=0;i<=32;i++){
      const want=total*i/32;
      while(index<steps&&lengths[index]<want)index++;
      const a=lengths[index-1],b=lengths[index];
      const k=b>a?(want-a)/(b-a):0;
      out.push({x:lerp(walk[index-1].x,walk[index].x,k),
        y:lerp(walk[index-1].y,walk[index].y,k)});
    }
    return out;
  };
  const referenceOuter=arcSamples(referenceCurves.outer.map(([x,y])=>
    warp(x,y,classifyPoint(x,y,'mixed'))));
  const referenceInner=arcSamples(referenceCurves.inner.map(([x,y])=>
    warp(x,y,classifyPoint(x,y,'mixed'))));
  // Measure how much the arm's own configuration changed, not how far it was
  // carried. Carrying the whole figure leaves the shoulder-to-wrist vector
  // untouched, so a squat used to collapse the relaxed outward bow into a
  // straight tube and the hand read as tucked in against the body.
  const motion=Math.hypot((wrist.x-shoulder.x)-(restWrist.x-restShoulder.x),
    (wrist.y-shoulder.y)-(restWrist.y-restShoulder.y));
  const poseBlend=smooth(motion/12);
  const generated=Array.from({length:33},(_,i)=>i<=16
    ?bezier(spine[0],i/16):bezier(spine[1],(i-16)/16));
  const referenceWidths=[];
  const centerline=generated.map((point,i)=>{
    const t=i/32,outerAt=referenceOuter[i],innerAt=referenceInner[i];
    referenceWidths.push(Math.max(2,Math.hypot(outerAt.x-innerAt.x,
      outerAt.y-innerAt.y)-1));
    const reference=mid(outerAt,innerAt);
    reference.x+=(shoulder.x-restShoulder.x)*(1-t)+(wrist.x-restWrist.x)*t;
    reference.y+=(shoulder.y-restShoulder.y)*(1-t)+(wrist.y-restWrist.y)*t;
    return {x:lerp(reference.x,point.x,poseBlend),
      y:lerp(reference.y,point.y,poseBlend)};
  });
  const hose=[];
  for(let i=0;i<32;i++){
    const a=centerline[i],b=centerline[i+1];
    const before=centerline[Math.max(0,i-1)],after=centerline[Math.min(32,i+2)];
    // A tube cap is perpendicular to its first tangent. Use the attachment
    // chord's normal here, rather than the chord to the next sampled point:
    // that approximation leaves a gap even in an untouched, slider-sized pose.
    const first=i===0?add(a,start.t,Math.hypot(b.x-a.x,b.y-a.y)/6)
      :add(a,{x:b.x-before.x,y:b.y-before.y},1/6);
    const previousSecond=add(b,{x:a.x-after.x,y:a.y-after.y},1/6);
    const terminalHandle=Math.hypot(b.x-a.x,b.y-a.y)/3;
    // Only the final short span follows the exact palm chord; the forearm
    // spine keeps its solved direction. This closes both wrist edges without
    // bending the entire forearm back toward the palm.
    const second=i===31?add(b,palmTangent,-terminalHandle):previousSecond;
    const global=(i+.5)/32;
    // Every span but the last takes the width at its own middle. The palm
    // chord is a real attachment, so the final span is measured at the wrist
    // itself and can never spill out beside the fingers.
    // A hanging arm's widest point is the shoulder, and that width reads as
    // part of the torso's own silhouette. Swung clear of the trunk the same
    // width becomes a lobe stuck on the side, so ease the root towards the
    // slimmer mid-arm width as the limb turns away. It stays inside the
    // shoulder mask, so the attachment itself never shows a seam.
    const rootTaper=1-.3*swung*(1-smooth(global/.35));
    hose.push({d:`M${pair(a)}C${pair(first)} ${pair(second)} ${pair(b)}`,
      width:i===31?2*wristWidth-1
        :lerp(2*Math.hypot(root[0].x-shoulder.x,root[0].y-shoulder.y)-1,
          lerp((referenceWidths[i]+referenceWidths[i+1])/2,
            2*lerp(shoulderWidth,wristWidth,smooth(global)),poseBlend)*rootTaper,
          smooth(i/3))});
  }
  // Trace the contact of the two curved bone spans, and start only where
  // their widths actually meet, so the fold reads as one crease at the elbow.
  const creasePoints=[];
  for(let i=0;i<=12;i++){
    const t=.08+i*.07;
    const arm=bezier(spine[0],t),fore=bezier(spine[1],1-t);
    const separation=Math.hypot(fore.x-arm.x,fore.y-arm.y);
    const armRadius=lerp(shoulderWidth,wristWidth,t*.55);
    const foreRadius=lerp(shoulderWidth,wristWidth,.5+t*.5);
    if(separation<=armRadius+foreRadius || t>.75){
      const share=armRadius/(armRadius+foreRadius);
      const overlap=Math.max(0,1-separation/(armRadius+foreRadius));
      const bow=Math.min(armRadius,foreRadius)*.4*Math.sin(Math.PI*t)*overlap;
      const direction=separation>.001
        ?{x:(fore.x-arm.x)/separation,y:(fore.y-arm.y)/separation}
        :{x:0,y:0};
      creasePoints.push({x:lerp(arm.x,fore.x,share)+direction.x*bow,
        y:lerp(arm.y,fore.y,share)+direction.y*bow});
    }
  }
  // Keep the crease inside the fold. Its end controls otherwise reach the
  // outer contour and appear as little crossing strokes at the elbow/wrist.
  const visibleCrease=creasePoints.length>6?[
    mid(creasePoints[0],creasePoints[1]),
    ...creasePoints.slice(1,-1),
    mid(creasePoints[creasePoints.length-2],creasePoints[creasePoints.length-1]),
  ]:creasePoints;
  let crease=`M${pair(visibleCrease[0])}`;
  for(let i=0;i<visibleCrease.length-1;i++){
    const p0=visibleCrease[Math.max(0,i-1)],p1=visibleCrease[i];
    const p2=visibleCrease[i+1],p3=visibleCrease[Math.min(visibleCrease.length-1,i+2)];
    const first=add(p1,{x:p2.x-p0.x,y:p2.y-p0.y},1/6);
    const second=add(p2,{x:p1.x-p3.x,y:p1.y-p3.y},1/6);
    crease+=`C${pair(first)} ${pair(second)} ${pair(p2)}`;
  }
  const creaseOpacity=smooth((1-length/restLength-.25)/.3);
  return {hose,handPoint,crease,creaseOpacity,turn,
    palmOuter,palmInner,palm:handPoint(left?10:87,104),
    centerline,shoulder,elbow,wrist,restLength,boneLength,
    upperLength,foreLength,shoulderWidth,wristWidth,middle:elbow};
}

let partLayers = {};
let legParts = [];
let hipMasks = [];
let shoulderMasks = [];
let torsoSideOutline,bodyCrotchOutline,spaceCrotchMask;
let helmetBase;
let hatPaths=[];
let batCowlPaths=[];
let sharkToothPaths=[];
let clownMarkPaths=[];



let capPaths=[],divingGogglePaths=[],divingGoggleOverlay;
const reference596Path=source=>transformPath(source,(x,y)=>({x,y:y+10.5386}));
const reference597Path=source=>transformPath(source,(x,y)=>({x:x-14.4136,y:y+2.4461}));
const capSpecs=[{"source": "M71.6583 17.7361 C70.9089 14.7503 65.4867 7.76209 66.9785 0.534715 C73.1221 -0.157869 75.7485 9.78613 76.8372 14.8902 C85.2487 13.7701 95.5986 15.9439 99.9566 29.0011 C104.314 42.0584 83.001 53.7945 81.6528 51.1612 C80.3047 48.5278 72.4077 20.722 71.6583 17.7361 Z", "fill": "#F47272", "stroke": "black", "strokeWidth": 1.0, "opacity": 1.0, "role": "headRigid"}, {"source": "M98.4308 24.9167 C99.057 28.3781 99.8283 32.258 101.242 30.7207 C102.655 29.1834 100.32 23.5026 98.4308 24.9167 Z", "fill": "#F47272", "stroke": "black", "strokeWidth": 1.0, "opacity": 1.0, "role": "headRigid"}, {"source": "M73.3426 15.8863 C74.5518 15.4272 76.0884 14.9113 76.9472 14.8786", "fill": "none", "stroke": "black", "strokeWidth": 1.0, "opacity": 1.0, "role": "headRigid"}, {"source": "M98.1145 25.9776 C88.994 21.5235 81.5202 22.3227 78.9236 23.2791", "fill": "none", "stroke": "black", "strokeWidth": 1.0, "opacity": 1.0, "role": "headRigid"}, {"source": "M98.9204 28.5729 C92.0291 33.0615 85.4232 35.1918 82.9816 35.6958", "fill": "none", "stroke": "black", "strokeWidth": 1.0, "opacity": 1.0, "role": "headRigid"}].map(s=>({...s,source:reference597Path(s.source)}));
const divingGoggleSpecs=[{"source": "M90.1214 39.9887 C85.6447 39.1328 71.4767 36.287 62.4707 36.129 L62.4707 41.7662 L88.5412 45.9138 L90.1214 39.9887 Z", "fill": "#4484F4", "stroke": "black", "strokeWidth": 1.0, "opacity": 1.0, "role": "headRigid"}, {"source": "M47.2823 33.4191 C45.3994 31.0482 46.8993 14.7619 53.524 1.93115 C58.8934 4.27881 68.7459 8.90122 68.6901 9.57065 C68.6343 10.2401 64.8979 23.9016 64.3669 26.0972 C63.8359 28.2929 64.0601 34.6325 59.7645 37.2545 C54.3951 40.5319 49.1651 35.7901 47.2823 33.4191 Z", "fill": "#A8EFFF", "stroke": "none", "strokeWidth": 1.0, "opacity": 0.57, "role": "headRigid"}, {"source": "M53.2256 2.86499 L68.2158 9.77827", "fill": "none", "stroke": "white", "strokeWidth": 1.0, "opacity": 1.0, "role": "headRigid"}, {"source": "M49.6958 1.01367 C50.6162 1.4161 51.7379 1.91138 52.9839 2.46387 C46.8444 14.9088 45.4695 30.4017 47.2534 32.6846 C49.0631 35.0003 54.0888 39.6304 59.2485 36.4297 C63.3763 33.8689 63.1611 27.6776 63.6714 25.5332 C64.1817 23.3889 67.7712 10.0494 67.8257 9.39258 C67.8283 9.36114 67.806 9.32304 67.7661 9.27441 C70.3194 10.5341 72.0477 11.4853 72.0259 11.7471 C71.9586 12.5452 67.3758 29.7098 67.2271 31.6709 C67.0781 33.6326 65.0403 40.1984 59.9448 43.3086 C53.5752 47.1965 45.5603 40.1866 43.3267 37.374 C41.0931 34.5614 41.8371 16.2347 49.6958 1.01367 Z", "fill": "#4484F4", "stroke": "black", "strokeWidth": 1.0, "opacity": 1.0, "role": "headRigid"}].map(s=>({...s,source:reference596Path(s.source)}));
const duckRingSource=reference597Path("M10.7969 56.8193 C12.6809 45.5134 33.7578 43.2084 37.6445 55.002 C41.1738 65.7108 38.0498 70.6367 37.6445 72.3672 C37.3483 73.6327 37.4851 76.5999 37.5801 79.0312 L97.9883 79.0312 C106.799 79.0313 113.942 86.1744 113.942 94.9854 C113.942 103.796 106.799 110.938 97.9883 110.938 L30.6768 110.938 C21.866 110.938 14.7231 103.796 14.7227 94.9854 C14.7227 89.9877 17.021 85.5269 20.6182 82.6016 C20.0475 81.2561 19.2689 79.8078 17.8926 77.4258 C15.5941 73.448 8.91312 68.1248 10.7969 56.8193 Z");
const duckBeakSource=reference597Path("M17.3018 66.4121 C17.3624 65.6405 12.0701 59.9745 8.20141 61.9545 C5.1117 63.3216 -0.444973 67.1056 2.04599 71.3047 C5.1597 76.5535 17.2412 67.1836 17.3018 66.4121 Z");
const swimRingSource=reference596Path("M1.30908 87.8712 C1.30908 79.6125 8.0041 72.9175 16.2628 72.9175 L83.5751 72.9175 C91.8338 72.9175 98.5288 79.6125 98.5288 87.8712 L98.5288 87.8712 C98.5288 96.1299 91.8338 102.825 83.5751 102.825 L16.2628 102.825 C8.0041 102.825 1.30908 96.1299 1.30908 87.8712 L1.30908 87.8712 Z");
const swimStripeSources=["M25.7759 54.4985 L38.3839 62.864 L3.50007 115.439 L-9.10793 107.073 L25.7759 54.4985 Z", "M54.624 57.7556 L67.232 66.1211 L32.3482 118.696 L19.7402 110.331 L54.624 57.7556 Z", "M83.4722 61.0127 L96.0802 69.3782 L61.1964 121.953 L48.5884 113.588 L83.4722 61.0127 Z", "M112.32 64.2698 L124.928 72.6353 L90.0445 125.21 L77.4365 116.845 L112.32 64.2698 Z"].map(reference596Path);
const swimOpeningSource=reference596Path("M71.3091 82.5474 C70.6553 83.6465 69.5579 84.0357 69.091 84.093 L25.5423 84.093 C24.8448 83.9383 23.4367 83.2984 23.3838 81.9763");
function swimRingMarkup(warp,id=selectedDecorations.outerwear,front=false,prefix='swim-ring'){
 const variant=swimRingVariants[id];if(!variant)return '';
 const path=source=>torsoGarmentPath(source,warp);
 const duck=id==='duck-swim-ring',clip=prefix+(front?'-front':'-back');
 const shell=path(duck&&!front?duckRingSource:swimRingSource);
 const tag=(d,fill,stroke='none',width=1)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
 const frontClip=path('M-1000 94.6316L1000 94.6316L1000 116.7616L-1000 116.7616Z');
 let markup=`<defs><clipPath id="${clip}-shell"><path d="${shell}"/></clipPath>${front?`<clipPath id="${clip}-region"><path d="${frontClip}"/></clipPath>`:''}</defs>`;
 markup+=front?`<g clip-path="url(#${clip}-region)">`:'';
 markup+=tag(shell,variant.fill);
 if(!duck)markup+=`<g clip-path="url(#${clip}-shell)">`+swimStripeSources.map(d=>tag(path(d),'#FFE1FB')).join('')+'</g>';
 markup+=tag(shell,'none',variant.stroke);
 if(front)markup+='</g>'+tag(path(swimOpeningSource),'none',variant.stroke);
 else if(duck){
  markup+=tag(path(duckBeakSource),'#FAA304','#FA6B04');
  markup+=tag(path(reference597Path(circleSource(23.542,57.1716,2.33984))),'black');
  markup+=tag(path(reference597Path(circleSource(22.732,56.7562,.810149))),'white');
 }
 return markup;
}
function placeDivingGoggleLayers(){
 if(!divingGogglePaths.length||!partLayers.head||!divingGoggleOverlay)return;
 // The triangle fill sits behind the main head fill, so the strap must precede both.
 const triangle=paths.find(path=>path.index===1)?.node||partLayers.head.firstChild;
 partLayers.head.insertBefore(divingGogglePaths[0],triangle);
 divingGogglePaths.slice(1).forEach(node=>divingGoggleOverlay.appendChild(node));
}
function paintHeadVariants(nodes,variants){
 const variant=variants[selectedDecorations.helmet];
 nodes.forEach((node,i)=>{
  const spec=(variants===capVariants?capSpecs:divingGoggleSpecs)[i];
  node.style.display=variant?'':'none';
  node.setAttribute('fill',spec.fill==='none'?'none':variant?(spec.fill==='#A8EFFF'?variant.lens:variant.color):spec.fill);
  node.setAttribute('fill-opacity',spec.opacity);
 });
}

// Group 595 reference: align its eye (78.0938,30.1022) with (55.355,34.4914).
const reference595Path=source=>transformPath(source,(x,y)=>({x:x-22.7388,y:y+4.3892}));
let eyeBandPaths=[];
const eyeBandSpecs=[{"source": "M70.7292 35.8091C69.3967 32.7001 68.4094 24.1378 75.1823 10.814L76.7209 11.875L80.6294 15.7834L84.257 20.4876L86.4537 24.3522C85.7911 26.8041 85.5525 31.3044 86.4537 33.1068C87.3549 34.9093 88.9701 37.2809 90.0562 37.8236L90.5337 47.0613L90.5337 48.12C84.871 46.0104 72.8099 40.6637 70.7292 35.8091Z", "fill": "#0151DE", "stroke": "black", "strokeWidth": 0.9, "role": "headRigid"}, {"source": "M111.677 45.3743C106.603 41.2226 104.834 37.6088 90.5337 41.4531L90.5337 45.3743C93.6091 46.8864 100.39 47.9268 102.912 49.2184C105.434 50.5101 114.522 51.6531 118.75 52.0632C118.084 51.2174 115.737 48.6956 111.677 45.3743Z", "fill": "#0151DE", "stroke": "black", "strokeWidth": 0.7, "role": "headRigid"}, {"source": "M99.5232 47.861C98.7928 46.762 94.1322 46.623 90.6118 45.4326C90.5045 46.5104 90.7003 48.3638 90.612 49.2507C90.5015 50.3593 104.285 59.0648 104.22 57.8454C104.155 56.626 100.253 48.9599 99.5232 47.861Z", "fill": "#0151DE", "stroke": "black", "strokeWidth": 0.7, "role": "headRigid"}].map(spec=>({...spec,source:reference595Path(spec.source)}));
const slipperReferenceFrames=[[8.373000084, 181.827414, -0.8978332204193222, 0.44033567685513364, -0.44033567685513364, -0.8978332204193222], [91.5440971, 181.849555, 0.9293327111003915, 0.3692434320049525, 0.3692434320049525, -0.9293327111003915]];
const slipperSources=["M23.5317 187.509C23.3991 187.149 23.2134 186.099 23.5317 184.779C24.157 184.438 26.4458 186.03 31.8905 186.03C37.0649 186.031 49.8936 183.906 50.3485 184.247C50.8034 184.588 50.3981 186.778 50.1431 187.281C49.888 187.784 28.8791 191.548 23.5317 187.509Z", "M34.9133 185.864C34.8334 184.664 32.172 180.329 28.8125 178.089C28.8125 177.895 30.9312 176.575 33.232 176.042C36.1726 176.2 39.4906 182.356 40.6691 185.358C39.7712 185.442 36.6866 185.662 34.9133 185.864Z", "M123.039 187.509C123.171 187.149 123.357 186.099 123.039 184.779C122.413 184.438 120.125 186.03 114.68 186.03C109.505 186.031 96.6767 183.906 96.2218 184.247C95.7669 184.588 96.1722 186.778 96.4273 187.281C96.6823 187.784 117.691 191.548 123.039 187.509Z", "M111.657 185.864C111.737 184.664 114.398 180.329 117.758 178.089C117.758 177.895 115.639 176.575 113.338 176.042C110.398 176.2 107.08 182.356 105.901 185.358C106.799 185.442 109.884 185.662 111.657 185.864Z"].map((source,i)=>{
 const [ox,oy,tx,ty,ux,uy]=slipperReferenceFrames[i<2?0:1];
 return transformPath(reference595Path(source),(x,y)=>({x:(x-ox)*tx+(y-oy)*ty,y:(x-ox)*ux+(y-oy)*uy}));
});
function slipperMarkup(shape,side){
 const {toe,up}=shape.instepAxes,o=shape.instep;
 return slipperSources.slice(side==='left'?0:2,side==='left'?2:4).map(source=>{
  const d=transformPath(source,(x,y)=>({x:o.x+toe.x*x+up.x*y,y:o.y+toe.y*x+up.y*y}));
  return `<path d="${d}" fill="#292A6D" stroke="black" stroke-width=".7" stroke-linejoin="round"/>`;
 }).join('');
}

// Group 594 uses the original character translated by (+10.7056,-10.5386).
const reference594Path=source=>transformPath(source,(x,y)=>({x:x-10.7056,y:y+10.5386}));
const scarSource=reference594Path("M43.5474 54.469C47.4136 62.5068 69.8674 89.2231 72.2174 90.6634 M47.2879 56.5815C46.8005 57.131 46.0809 57.7305 45.663 58.0493C45.0387 58.5493 44.3091 59.2262 44.1904 59.3792C44.1325 59.4553 44.079 59.528 44.0239 59.6029 M50.7309 62.5415C50.1742 63.1384 49.7263 63.5551 49.412 63.8981C49.1294 64.2086 48.8857 64.4992 48.7452 64.694C48.6757 64.7846 48.6099 64.8584 48.4097 65.1109 M54.0379 67.0945C53.6154 67.4711 53.1445 67.8869 52.7304 68.2607C52.509 68.4884 52.2872 68.7253 52.0154 69.0121C51.903 69.14 51.8423 69.2322 51.7393 69.447 M57.2946 71.3992C57.2133 71.5903 57.0213 71.9421 56.7503 72.3989C56.5426 72.7482 56.3511 73.0293 56.1649 73.281C56.0806 73.4018 56.0173 73.5087 55.9116 73.7383 M61.7561 75.1541C61.6082 75.3715 61.2647 75.8535 60.7117 76.691C60.4259 77.1585 60.1298 77.7122 59.9288 78.1201C59.7278 78.528 59.631 78.7732 59.5312 79.0457 M65.7917 80.8132C65.42 81.1679 65.0494 81.5155 64.6806 81.9077C64.2965 82.4197 63.9626 82.9705 63.7353 83.3996C63.6414 83.5712 63.591 83.6494 63.5391 83.7697 M68.6725 85.7131C68.3323 86.1177 68.0472 86.4327 67.6113 86.8237C67.4401 86.982 67.2019 87.2189 67.0421 87.3938C66.8823 87.5687 66.808 87.6743 66.7314 87.823");
let scarNode;
let teardropPaths=[];
const teardropSource=reference594Path('M84.0253 43.5907C83.6967 43.3515 81.8132 38.1506 80.9165 34.7729C82.4708 37.4432 85.5615 42.945 85.4898 43.5907C85.4001 44.3977 84.3539 43.8298 84.0253 43.5907Z M87.9939 41.4624C87.6208 41.3013 84.641 36.6409 83.0244 33.5427C85.1272 35.8064 89.3508 40.4951 89.4226 41.1407C89.5124 41.9478 88.367 41.6235 87.9939 41.4624Z');
function teardropPath(warp){
 const offset=skinTrait('earringOffset')||{x:0,y:0};
 return transformPath(teardropSource,(x,y)=>{x+=offset.x;y+=offset.y;return applyDragPose(warp(x,y,'head'),x,y,'head',warp);});
}

let muscleLinesNode;
const muscleLinesSource=transformPath("M34.6108 68.9319C34.9135 72.1602 36.0237 75.3883 37.335 76.8008C38.384 77.9308 44.9012 77.608 48.0286 77.3053M68.7261 68.9319C68.4234 72.1602 67.3132 75.3883 66.002 76.8008C64.9529 77.9308 58.4358 77.608 55.3083 77.3053M49.7969 82.7207C49.2924 86.2517 47.7788 86.2518 43.9453 86.2517M49.7969 88.8228C49.2924 92.3538 47.7788 92.3539 43.9453 92.3538M53.2959 82.7207C53.8004 86.2517 55.314 86.2518 59.1475 86.2517M53.2959 88.8228C53.8004 92.3538 55.314 92.3539 59.1475 92.3538M49.7969 94.9248C49.2924 98.4558 47.7788 98.4559 43.9453 98.4558M53.2959 94.9248C53.8004 98.4558 55.314 98.4559 59.1475 98.4558",(x,y)=>({x:x-4.396,y:y+1.0403}));
let alienAntennaPath;
let partyHatPaths=[],largePartyHatPaths=[];

let batCowlClipPath;
let sharkEyeClipPath;
let lipstickFacePaths=[],pinkRibbonPaths=[];
let angelHaloPaths=[];
let spaceHelmetPaths=[],spaceHelmetOverlay,spaceCollarOverlay;
let pupilClipGroup;
let hypnoticEyePaths=[];
let headFillNode;
let chainsawPaths=[];
let cigarettePaths=[];
let jobsGlassesPaths=[];
let kappaMouthClipPath;
let kappaHairPaths=[],kappaSkinPaths=[],workerHatPaths=[],studentHatPaths=[],secondaryHatPaths=[],topknotHairPaths=[],yellowSpikyHairPaths=[];
let pochitaCordPaths=[];
let crownPaths=[];
let buttOutlines = [];
let garmentPaths;
let outerwearInnerClip;
let underwearRootCutout;
let jumpsuitChestCutout;
let innerNecklineLayer,innerNecklineOcclusion;
let torsoMaterial;
const scarfSources = [
  // Its knot sits at the neck; the broad end drapes over the near shoulder.
  'M35 58C46 54 59 49 67 46C80 48 89 56 95 67L35 59Z',
  'M35 58C25 52 17 51 7.5 62C17 64 25 64 35 58Z',
  'M34.5 59C30 65 24.5 72 25 80C31 73 35.5 66 36 59Z',
  'M32.5 57.2C34 55.7 37 55.7 38.6 57.4C38.9 59 36.4 60.2 34.3 59.4C32.7 59.2 32 58.1 32.5 57.2Z',
];
const collaredNeckSource='M26.1046 56.4524L32.6 57.58L47 62L61.4 56.68L67.7274 55.0466';
const collaredShirtSpecs=[
 {source:'M45.5 64L48.5 64L49.8 69L47 72L44.2 69Z',fill:'#131313'},
 {source:'M46.2 72L47.8 72L50.5 98L47 108L43.5 98Z',fill:'#131313'},
 {source:'M32.6 57.58L47 62L42.2 69L32 63Z',fill:'#D9D9D9',edge:'M47 62L42.2 69L32 63L32.6 57.58'},
 {source:'M61.4 56.68L47 62L51.8 69L62 62.3Z',fill:'#D9D9D9',edge:'M47 62L51.8 69L62 62.3L61.4 56.68'}
];
function collaredShirtMarkup(warp){
 return collaredShirtSpecs.map(s=>`<path d="${workerGarmentPath(s.source,warp)}" fill="${s.fill}" stroke="${s.edge?'none':'black'}" stroke-width=".7" stroke-linejoin="round"/>`+(s.edge?`<path d="${workerGarmentPath(s.edge,warp)}" fill="none" stroke="black" stroke-width="1" stroke-linejoin="round"/>`:'')).join('');
}

const shirtSource = `M26.1046 56.4524L67.7274 55.0466L67.5459 ${RIGHT_ARMPIT_Y}
  C66.9913 84.8335 66.1 103 65.9 112L27.7 112
  C27.6 103 27.5018 84.2394 27.478 ${LEFT_ARMPIT_Y}Z`;
// Jacket, white shirt insert and collar share the live torso coordinate system.
const collaredBodySource=shirtSource.replace('M26.1046 56.4524L67.7274 55.0466',collaredNeckSource);
const suitFrontSource = 'M35 56.15L59 55.35L53.3 69L53.3 112L40.7 112L40.7 69Z';
const suitFrontEdgesSource = 'M35 56.15L40.7 69L40.7 112M59 55.35L53.3 69L53.3 112';
// Close the visible waist across the white opening at the jacket hem.
const suitHemSource = 'M27.7 112L65.9 112';
const suitCollarSources = {
  left:'M35 56.15L45.8 56L43 66.5L39.5 62Z',
  right:'M48.2 55.95L59 55.35L54.5 62L51 66.5Z',
};
const tieSources = {
  blade:'M45.2 60L48.8 60L49.2 94L47 100L44.8 94Z',
  knot:'M42.5 56L51.5 55.9L48.8 60.8L45.2 60.8Z',
};
const pantsSource = `M27.7 110.5L65.9 110.5L65.8486 125.059
  C63.5 127.5 54 131.8 49.4914 132.8
  C48.4 132.3 45.9 132.3 44.6804 132.8
  C40 131.8 31 127.5 28.4591 125.881Z`;
function spacePantsFit(x,y){
 const fade=1-smooth((y-136)/30);
 const outer=smooth(Math.abs(x-47)/14);
 const side=x<47?-1:1;
 // Keep the hip as wide as the belt; fade into the unchanged calf.
 const waistShift=x<47?lerp(1.5,2.2591,smooth((y-110.5)/15.381))
   :lerp(1.5,1.5514,smooth((y-110.5)/14.559));
 return {x:x+side*(waistShift+2-1.5*(1-smooth((y-119)/6)))*outer*fade,
   y:y+5*(1-outer)*smooth((y-122)/9.5)*fade};
}
const spaceCrotchSource='M44.6804 131.505C45.9 130.6 48.4 130.6 49.4914 131.505';
const spacePelvisSource=pantsSource.replace('L65.9 110.5L65.8486','L65.9 110.5L65.8788 116.5L65.8486').replace('28.4591 125.881Z','28.4591 125.881L27.9961 116.5Z').replace('49.4914 132.8','49.4914 131.505')
 .replace('C48.4 132.3 45.9 132.3 44.6804 132.8','C48.4 130.6 45.9 130.6 44.6804 131.505');
function spacePantsGeometry(warp,coveredWaist=selectedDecorations.outerwear==='space-shirt'){
 const legs=Object.fromEntries(['left','right'].map(side=>[side,legGeometry(side,warp,true)]));
 const point=(x,y)=>{const p=spacePantsFit(x,y),role=classifyPoint(p.x,p.y,'mixed');
  return applyDragPose(warp(p.x,p.y,role),p.x,p.y,role,warp);};
 const anchors=[point(44.6804,131.505),point(49.4914,131.505)];
 const deltas=['left','right'].map((side,i)=>({x:legs[side].crotchAnchor.x-anchors[i].x,y:legs[side].crotchAnchor.y-anchors[i].y}));
 const outerOrigins=[point(28.4591,125.881),point(65.8486,125.059)];
 const outerDeltas=['left','right'].map((side,i)=>({x:legs[side].outerAnchor.x-outerOrigins[i].x,y:legs[side].outerAnchor.y-outerOrigins[i].y}));
 const fit=source=>transformPath(source,(x,y)=>{
  const p=point(x,y),t=clamp01((x-44.6804)/(49.4914-44.6804));
  const weight=smooth((y-125)/5)*(1-smooth(Math.max(44.6804-x,x-49.4914,0)/6));
  const side=x<47?0:1,outerWeight=smooth((Math.abs(x-47)-8)/10)*smooth((y-116.5)/(side?8.559:9.381));
  return {x:p.x+lerp(deltas[0].x,deltas[1].x,t)*weight+outerDeltas[side].x*outerWeight,y:p.y+lerp(deltas[0].y,deltas[1].y,t)*weight+outerDeltas[side].y*outerWeight};
 });
 const sides=['left','right'].map(side=>visiblePantsSide(side,legs[side],warp,true,coveredWaist)).join('');
 return {fill:fit(spacePelvisSource),sides,edges:sides+fit(spaceCrotchSource),crotch:fit(spaceCrotchSource)};
}
// The pelvis line sits behind a crossing trouser leg even while that leg stays behind a coat.
function spaceCrotchOccluders(shapes,warp){
 const a=applyDragPose(warp(47,95,'body'),47,95,'body',warp);
 const b=applyDragPose(warp(47,115,'body'),47,115,'body',warp);
 const length=Math.hypot(b.x-a.x,b.y-a.y)||1,right={x:(b.y-a.y)/length,y:-(b.x-a.x)/length};
 return ['left','right'].map(side=>{
  const sign=side==='left'?-1:1;
  const crossing=dragPoses.some(p=>p.part===side+'Leg'&&sign*(p.x*right.x+p.y*right.y)<-1);
  if(!crossing)return '';
  return shapes[side].hose.slice(2).map(({d,width},j)=>`<path d="${d}" fill="none" stroke="black" stroke-width="${width+wideLegExtraWidth(j+2,9.25)}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
 }).join('');
}
function spaceWaistMarkup(warp){
 const path=source=>garmentPath(transformPath(source,spacePantsFit),warp);
 const d=path('M27.7 110.5L65.9 110.5L65.8788 116.5L27.9961 116.5Z');
 // Paint first and stroke last, so the blue fill cannot hide half of the outline.
 return `<path d="${d}" fill="${sweatpantsAccent()}" stroke="black" stroke-width="1" stroke-linejoin="round"/>`;
}
const shirtSidesSource = `M27.478 ${LEFT_ARMPIT_Y}
  C27.5018 84.2394 27.6 103 27.7 112
  M67.5459 ${RIGHT_ARMPIT_Y}C66.9913 84.8335 66.1 103 65.9 112`;
const pantsSidesSource = 'M27.7 110.5L28.4591 125.881M65.9 110.5L65.8486 125.059';
const pantsCrotchSource = 'M44.6804 132.8C45.9 132.3 48.4 132.3 49.4914 132.8';
const shortsLowerSource = `M65.8486 125.059C63.5 127.5 54 131.8 49.4914 132.8
  C48.4 132.3 45.9 132.3 44.6804 132.8
  C40 131.8 31 127.5 28.4591 125.881`;
const shirtHemSource = 'M27.7 112L65.9 112';
const vestHemSource = 'M27.7 102L65.9 102';
const pantsWaistSource = 'M27.7 110.5L65.9 110.5';
// Higher leg openings, with the same crotch height as the boxer-style red shorts.
const briefsSource='M27.7 114.5L65.9 114.5L65.9 121C58 122 53 125.8 49.4914 132.8C48.4 132.3 45.9 132.3 44.6804 132.8C41 126.8 35 123 28 121Z';
function redThongSource(legs) {
  // The waistband follows the torso. Only the centre strip grows with the
  // leg length: at the shortest setting it stops at the body's crotch, and
  // at the longest setting it keeps the original 141-unit endpoint.
  const end=clean(lerp(132.8,141,clamp01((legs-50)/130)));
  return `M27.7 110.5L66.4 110.5L66.35 119.5
    L50.5 119.5L50.5 ${end}L43.7 ${end}L43.7 119.5L28.15 119.5Z`;
}
const redTriangleSource = `M26.1046 56.4524L67.7274 55.0466
  L49.4914 132.8L44.6804 132.8Z`;
const vestSource = `M26.1046 56.4524L34.2 56.18L47 76.5L59.6 55.32
  L67.7274 55.0466L67.5459 ${RIGHT_ARMPIT_Y}
  C66.9913 84.8335 66.1 96 65.9 102L27.7 102
  C27.6 98 27.5018 84.2394 27.478 ${LEFT_ARMPIT_Y}Z`;
const vestNeckSource = 'M34.2 56.18L47 76.5L59.6 55.32';
// The vest hem sits higher than the shirt's, so its flanks trace the same
// curves as vestSource instead of reusing shirtSidesSource.
const vestSidesSource = `M27.478 ${LEFT_ARMPIT_Y}
  C27.5018 84.2394 27.6 98 27.7 102
  M67.5459 ${RIGHT_ARMPIT_Y}C66.9913 84.8335 66.1 96 65.9 102`;
const vestTopSources = {
  left:'M26.1046 56.4524L34.2 56.18',
  right:'M59.6 55.32L67.7274 55.0466',
};
// Open front panels leave the fish's chest visible all the way to the hem.
const greenVestSources = {
  left:`M26.1046 56.4524L38 50L47 75L42.3 112L27.7 112
    C27.6 103 27.5018 84.2394 27.478 ${LEFT_ARMPIT_Y}Z`,
  right:`M55.5 50L67.7274 55.0466L67.5459 ${RIGHT_ARMPIT_Y}
    C66.9913 84.8335 66.1 103 65.9 112L51.7 112L47 75Z`,
};
// Shared cloth artwork for the live outerwear and its catalog thumbnail.
const alohaColor='#303b50';
// Anchor both lapels to the actual neck edge; build the right one by
// reflection so its fold and attachment cannot drift from the left.
const alohaNeckY=x=>56.4524+(55.0466-56.4524)*(x-26.1046)/(67.7274-26.1046);
const alohaSources={
  left:`M26.1046 56.4524L40 ${alohaNeckY(40)}L45 66L44 112L25 112
    C25 101 26 80 27.478 ${LEFT_ARMPIT_Y}Z`,
  right:`M54 ${alohaNeckY(54)}L67.7274 55.0466L67.5459 ${RIGHT_ARMPIT_Y}
    C68.2 80 69 101 69 112L49 112L49 66Z`,
};
const alohaLeftCollar=`M33 ${alohaNeckY(33)}L40 ${alohaNeckY(40)}L45 66L39 72Z`;
const alohaCollar=alohaLeftCollar+' '+transformPath(alohaLeftCollar,(x,y)=>({
  x:94-x,y:y<60?y+alohaNeckY(94-x)-alohaNeckY(x):y,
}));
const alohaSleeveStyles={
 'space-shirt':{longHem:true,end:31,flare:7,color:'#FF8215',space:true},
  'secondary-jacket':{longHem:true,end:31,flare:1,color:'#101011',student:true},
  'student-jacket':{longHem:true,end:31,flare:1,color:'#102f68',student:true},
  'worker-jacket':{longHem:true,end:27,flare:4,color:'#f66b19',worker:true},
  'blue-worker-jacket':{longHem:true,end:27,flare:4,color:'#1d3b68',worker:true},
  'charcoal-blazer':{longHem:true,end:31,flare:1,color:'#2B2D2D',blazer:true},
  'suit-jacket':{end:31,flare:0,color:decorationColors.suitNavy,suit:true},
  'aloha-jacket':{end:22,flare:7},
  'aloha-long-jacket':{end:31,flare:4},
  'aloha-open-jacket':{end:22,flare:7,openFront:true},
  'aloha-open-long-jacket':{end:31,flare:4,openFront:true},
};
const alohaSleeveStyle=alohaSleeveStyles['aloha-jacket'];
// Leave the armhole open, just like looseTopSidesSource: closing each panel
// with a stroke would draw a seam separating the shoulder from the sleeve.
const alohaEdges=`M27.478 ${LEFT_ARMPIT_Y}C26 80 25 101 25 112L44 112L45 66L40 ${alohaNeckY(40)}L26.1046 56.4524
  M67.5459 ${RIGHT_ARMPIT_Y}C68.2 80 69 101 69 112L49 112L49 66L54 ${alohaNeckY(54)}L67.7274 55.0466`;
const alohaOpenSources={
  left:`M26.1046 56.4524L38 ${alohaNeckY(38)}L40 72L38 112L25 112
    C25 101 26 80 27.478 ${LEFT_ARMPIT_Y}Z`,
  right:`M56 ${alohaNeckY(56)}L67.7274 55.0466L67.5459 ${RIGHT_ARMPIT_Y}
    C68.2 80 69 101 69 112L56 112L54 72Z`,
};
const alohaOpenLeftCollar=`M31.5 ${alohaNeckY(31.5)}L38 ${alohaNeckY(38)}L40 72L35 78Z`;
const alohaOpenCollar=alohaOpenLeftCollar+' '+transformPath(alohaOpenLeftCollar,(x,y)=>({
  x:94-x,y:y<60?y+alohaNeckY(94-x)-alohaNeckY(x):y,
}));
const alohaOpenEdges=`M27.478 ${LEFT_ARMPIT_Y}C26 80 25 101 25 112L38 112L40 72L38 ${alohaNeckY(38)}L26.1046 56.4524
  M67.5459 ${RIGHT_ARMPIT_Y}C68.2 80 69 101 69 112L56 112L54 72L56 ${alohaNeckY(56)}L67.7274 55.0466`;
function alohaBodyMarkup(warp,openFront=false){
  const d=Object.values(openFront?alohaOpenSources:alohaSources).map(source=>torsoGarmentPath(source,warp,true)).join('');
  const collar=torsoGarmentPath(openFront?alohaOpenCollar:alohaCollar,warp,true);
  return `<path d="${d}" fill="${alohaColor}"/>`
    +`<path d="${torsoGarmentPath(openFront?alohaOpenEdges:alohaEdges,warp,true)}" fill="none" stroke="black" stroke-width="1" stroke-linejoin="round"/>`
    +`<path d="${collar}" fill="${alohaColor}" stroke="black" stroke-width="1" stroke-linejoin="round"/>`;
}
const blazerPanels={
 left:`M26.1046 56.4524L33 57.5C34 70 40 84 47 94L46 114L43 125L25.5 125L27.478 ${LEFT_ARMPIT_Y}Z`,
 right:`M67.7274 55.0466L61 56.8C60 70 54 84 47 94L46 114L50 125L68.5 125L67.5459 ${RIGHT_ARMPIT_Y}Z`
};
const blazerEdges=`M26.1046 56.4524L33 57.5C34 70 40 84 47 94L46 114L43 125L25.5 125L27.478 ${LEFT_ARMPIT_Y} M67.7274 55.0466L61 56.8C60 70 54 84 47 94L46 114L50 125L68.5 125L67.5459 ${RIGHT_ARMPIT_Y}`;
function blazerMarkup(warp){
 const tag=(d,fill,stroke='none',width=1)=>`<path d="${workerGarmentPath(d,warp)}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
 return Object.values(blazerPanels).map(d=>tag(d,'#2B2D2D')).join('')+tag(blazerEdges,'none','black')
 +tag('M33 57.5L30.5 66L35 68L30 79L47 94 M61 56.8L63.5 65L59 68L64 79L47 94','none','black',.7)
 +tag(circleSource(47,102,1),'#151c1d');
}
function suitOuterMarkup(warp){
  const path=(source,fill='none',outline=false,width=1)=>`<path d="${garmentPath(source,warp)}" fill="${fill}" stroke="${outline?'black':'none'}" stroke-width="${width}" stroke-linejoin="round" paint-order="stroke fill"/>`;
  return path(shirtSource,decorationColors.suitNavy)
    +path(suitFrontSource,'white')
    +Object.values(suitCollarSources).map(source=>path(source,'white')).join('')
    +path(shirtSidesSource,'none',true)+path(shirtTopSource,'none',true)
    +path(suitFrontEdgesSource,'none',true)+path(suitHemSource,'none',true)
    +Object.values(tieSources).map(source=>path(source,decorationColors.tieRed,true,2)).join('');
}
function alohaSleeveMarkup(shape,id,style=alohaSleeveStyle){
  if(style.space)return spaceSleeveMarkup(shape,id);
  if(style.worker)return workerSleeveMarkup(shape,id,style);
  // Use the loose tee's overlapping hose segments, smooth flare, and cuff.
  // No closed polygon or transverse stroke at the shoulder attachment.
  const {end,flare}=style;
  const strokes=(color,extra)=>shape.hose.slice(0,end).map(({d,width},i)=>{
    // Earlier round segments can also cross the cuff when the elbow folds.
    // Clip the entire cloth, including every black and colored stroke.
    const clip=style.student&&i<6?'':` clip-path="url(#${id})"`;
    const shoulder=color==='black'&&i<6&&/^(left|right)-/.test(id)
      ?` mask="url(#${id.split('-')[0]}-shoulder-mask)"`:'';
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width+extra+sleeveExtraWidth(i,end,flare)}" stroke-linecap="${i===0||i>=end-4?'butt':'round'}" stroke-linejoin="round"${clip}${shoulder}/>`;
  }).join('');
  return `<defs><clipPath id="${id}"><polygon points="${limbClipPoints(shape,end,false)}"/></clipPath></defs>`
    +strokes('black',2)+strokes(style.color||alohaColor,0)
    +`<path d="${cuffPath(shape,end,flare)}" fill="none" stroke="black" stroke-width="1"/>`;
}
// Group 548.svg: merged head and three-point fin; lower root meets the turtleneck at (67.7,49.9).
const yellowFishHeadContour='M26.1046 56.4524C25.612 42.5399 27.1648 31.0087 32.3001 23.0968C34.6926 25.4067 37.416 27.9423 40.1394 29.4449L44.2249 11.0386C49.064137 11.532936 57.634140 18.326616 62.594742 26.559224L74.142000 27.653500L70.666900 33.511000L76.2 35.862800L70.9 40.8L76.4 44.2L67.7 49.9C67.75 51.8 67.7274 53.2 67.7274 55.0466';
// User-supplied Vector 861.svg, fitted against the head as in the reference.
const workerHelmetSource="M0.507446 1.38414C0.355226 0.469707 2.72483 -0.59714 5.23202 3.06067C9.4993 1.28262 23.0628 -2.90173 29.6163 10.5102C36.5751 24.7515 27.6357 33.3392 21.2346 36.8954C21.3362 39.1815 21.0212 42.9613 18.9485 39.7912C16.3575 35.8285 0.659666 2.29857 0.507446 1.38414Z";
const workerHatSpecs=[
 {source:'M26.1046 56.4524C34 57 53 47 67.1 40.8',fill:'none',stroke:'#24211c',role:'headRigid',strokeWidth:2.2},
 {source:transformPath(workerHelmetSource,(x,y)=>({x:50.6+x*1.03,y:10+y*1.03})),fill:'#FBC723',stroke:'black',role:'headRigid'},
];
// User Group 570.svg, aligned to the reference head.
const studentHatSpecs=[{"source": "M27.9143 6.76744C25.2444 4.48523 19.8023 2.31143 12.7705 4.81204L12.3549 11.8407L19.7618 31.822L26.1234 37.0602C32.5241 32.039 34.9883 27.0359 34.3412 22.2694C33.6941 17.5028 30.5842 9.04965 27.9143 6.76744Z", "fill": "#FFE83F", "stroke": "black", "role": "headRigid"}, {"source": "M21.7184 47.6251C15.4834 23.4045 10.9755 14.3893 2.70689 0.554932C5.11358 0.697216 8.5164 2.10588 12.3021 4.78466C17.0341 8.13313 26.5922 33.0968 25.8476 37.7481C25.252 41.4691 23.0944 44.2093 21.7184 47.6251Z", "fill": "#FFE83F", "stroke": "black", "role": "headRigid"}, {"source": "M17.1302 11.0944C19.3686 10.1981 28.43 10.9379 31.9865 13.8483", "fill": "none", "stroke": "black", "role": "headRigid"}, {"source": "M32.3252 14.8317C31.7358 18.0849 27.7462 24.1984 23.2289 26.7659", "fill": "none", "stroke": "black", "role": "headRigid"}].map(spec=>({...spec,source:transformPath(spec.source,(x,y)=>({x:x+48.3,y:y+9}))}));
// User Group 572.svg, placed beside the original head crest.

const yellowSpikyHairSpecs=[{source:transformPath("M39.5 21.7576L43.5 14.7576L47 1.25757L53.5 11.7576L65.5 7.75757L63.5 19.7576L74.5 19.7576L70 30.2576L80 37.2576L70 42.2576L76 51.2576L67.5 49.2576L58 51.2576L63.5 42.2576L56.5 44.2576L58 28.2576L53.5 31.7576L51 21.7576L39.5 21.7576Z",(x,y)=>({x,y:y-2.719})),fill:'#E5DF52',stroke:'black',role:'headRigid'}];
const topknotHairSpecs=[{"source": "M46.5312 0.515869C75.3317 1.71587 74.1988 31.1825 70.0321 45.5159L70.0317 46.5159C68.4317 46.1159 67.0317 41.8492 67.5317 40.0159C64.5317 41.0159 65.0316 44.8492 65.5317 45.5159C61.9313 44.3159 62.6982 36.6825 63.5316 33.0159C61.9316 36.2159 62.1983 40.3492 62.5316 42.0159C58.9316 37.6159 61.6983 28.1825 63.5316 24.0159C60.7316 24.8159 59.6982 29.3492 59.5316 31.5159C58.3315 22.7159 59.0316 17.5159 59.5316 16.0159C55.9315 17.2159 55.0315 21.1825 55.0315 23.0159C53.0315 22.2159 54.1982 15.0159 55.0315 11.5159C53.0315 12.3159 52.1981 16.1825 52.0315 18.0159C49.2314 14.8159 45.8646 2.8492 46.5312 0.515869Z", "fill": "#2F3C4C", "stroke": "black", "role": "headRigid"}, {"source": "M90.0317 24.0983C79.735 20.9511 73.0747 25.4097 71.0317 28.0324L89.4188 29.0159C88.9285 27.4422 85.9457 26.3932 84.5156 26.0653L90.0317 24.0983Z", "fill": "#2E3B4B", "stroke": "black", "role": "headRigid"}].map(spec=>({...spec,source:transformPath(spec.source,(x,y)=>({x:x-2.1314,y:y+10.0227}))}));
const longHairSpecs=[{"source": "M20.0002 85.0601C17.2002 81.4601 20.1669 77.5601 22.0002 76.0601C26.0003 76.8601 25 81.0601 24.5 82.5601C23.9486 84.2143 24.6667 86.0601 25 87.5601C23.8 87.9601 22 84.7267 21.5 83.0601L22 87.5601C21 86.5601 20.3334 85.3934 20.0002 85.0601Z", "fill": "#CF4D4A", "stroke": "black", "role": "headRigid"}, {"source": "M1.5 0.560059C28.3 3.36006 28 30.0601 24.5 43.0601C29.5 46.0601 26 51.5601 23.5 54.0601C28 57.5601 25.5 61.0601 23 64.5601C25.4 65.3601 25 72.0601 22 75.5601C16.4 71.1601 17.6667 66.0601 20 64.0601C14.8 62.8601 16.8333 57.2267 18.5 54.5601C13.7 51.7601 16.5 47.0601 18.5 45.0601C15.2559 40.7345 16.1685 38.5457 17.7185 36.384C13.0763 41.52 6.26767 41.6242 3 41.0601C12.8276 37.5502 15.9481 31.8161 16.145 26.5601C16.2035 25.7601 12.0727 28.8934 10 30.5601C8.8 26.0092 12.1645 21.1639 14.5 20.0601C11.5 18.5601 5 20.5601 5 22.0601C2.6 18.8601 7.5 13.5601 11.5 11.5601C6.3 12.3601 2 16.2267 0.5 18.0601C0.5 13.2601 5.5 10.0601 8 9.06006C3.2 7.06006 1.66667 2.56006 1.5 0.560059Z", "fill": "#CF4D4A", "stroke": "black", "role": "headRigid"}].map(spec=>({...spec,source:transformPath(spec.source,(x,y)=>({x:x+45.7249,y:y+10.4786}))}));
// Latest user Group 571.svg: original cap and badge geometry and placement.
const secondaryHatSpecs=[{"source": "M74.2873 41.7422C71.6708 43.0987 71.6708 43.0987 68.0716 43.9998C68.578 37.1551 67.6136 28.5631 65.6731 22.4388C64.5101 18.7685 63.0187 16.8489 61.7725 14.5843C61.0723 13.3118 59.2999 10.3403 58.7205 9.72349C58.7205 9.72349 52.454 -0.453276 59.0204 4.52991C65.5869 9.5131 68.7057 11.0544 70.0697 12.824C82.6029 9.21384 86.1091 28.6937 83.2518 35.8941C82.4975 39.5559 76.8991 41.0948 74.2873 41.7422Z", "fill": "black", "stroke": "black", "role": "headRigid"}, {"source": "M72.29 13.1643L72.9746 14.5819L74.8877 14.4591L73.3977 15.4581L74.0823 16.8757L72.4768 16.0755L70.9868 17.0744L71.4845 15.5809L69.879 14.7806L71.7922 14.6578L72.29 13.1643Z", "fill": "#FCDD43", "stroke": "none", "role": "headRigid"}].map(spec=>({...spec,source:transformPath(spec.source,(x,y)=>({x,y:y+10.5386}))}));
const secondaryNeckSource='M26.0276 55.9849L43.5276 58.4849L46.0273 59.9849L48.0276 58.4849L68.0276 55.9849';
const secondaryBodyEdgesSource=`M27.478 ${LEFT_ARMPIT_Y}L25.5 125.4849L68.5 125.4849L67.5459 ${RIGHT_ARMPIT_Y}`;
const secondaryBodySource=secondaryNeckSource+`L67.5459 ${RIGHT_ARMPIT_Y}L68.5 125.4849L25.5 125.4849L27.478 ${LEFT_ARMPIT_Y}Z`;
const studentBodySource=`M26.1046 56.4524L32 59L47 63L62 59L67.7274 55.0466L67.5459 ${RIGHT_ARMPIT_Y}C67.8 83 68.5 103 68.5 116C57 117.5 36 117.5 25.5 116C25.5 101 26.5 82 27.478 ${LEFT_ARMPIT_Y}Z`;
const studentCollarLeft='M32 59L47 63L44.5 70L32 65.5Z';
const studentCollars=[studentCollarLeft,transformPath(studentCollarLeft,(x,y)=>({x:94-x,y}))];
function studentOuterMarkup(warp,secondary=false){
 const tag=(d,fill,stroke='none',width=1)=>`<path d="${workerGarmentPath(d,warp)}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
 return tag(secondary?secondaryBodySource:studentBodySource,secondary?'#101011':'#102f68')
 +tag(secondary?secondaryBodyEdgesSource:`M27.478 ${LEFT_ARMPIT_Y}C26.5 82 25.5 101 25.5 116C36 117.5 57 117.5 68.5 116C68.5 103 67.8 83 67.5459 ${RIGHT_ARMPIT_Y}`,'none','black')
 +(secondary?'':studentCollars.map(d=>tag(d,'#fffdf4','black',.7)).join(''))
 +tag(secondary?secondaryNeckSource:'M26.1046 56.4524L32 59L47 63L62 59L67.7274 55.0466','none','black')
 +(secondary?[65.4849,74.4849,83.4849,92.4849].map(y=>tag(circleSource(46.0273,y,2),'#FCDD43')).join(''):[42,52].flatMap(x=>[84,92].map(y=>tag(circleSource(x,y,1.65),'#ffdb43'))).join(''));
}
const studentSockStyles={'student-shoes':{start:24},'student-long-socks-shoes':{start:20}};
function studentSockStart(shoes=selectedDecorations.shoes){return studentSockStyles[shoes]?.start||24;}
function studentSockVisible(index,pants=selectedDecorations.pants,shoes=selectedDecorations.shoes){
 return !!studentSockStyles[shoes]&&index>=studentSockStart(shoes)&&!widePantFlares[pants]&&!['plain','batfish-trousers','jumpsuit','navy-jumpsuit'].includes(pants)&&!workwearVariants[pants];
}
function exposedLegPaint(index){return studentSockVisible(index)?'#fffdf8':skinColor();}
const workerHemY=123;
const workerBodySource=`M26.1046 56.4524L31.5 58.5L47 64L62.5 58.5L67.7274 55.0466L67.5459 ${RIGHT_ARMPIT_Y}C68 88 69 108 69.5 ${workerHemY}C58 124 36 124 24.5 ${workerHemY}C25 108 26 88 27.478 ${LEFT_ARMPIT_Y}Z`;
const workerTopEdgeSource='M26.1046 56.4524L31.5 58.5L47 64L62.5 58.5L67.7274 55.0466';
const workerBodyEdgesSource=`M27.478 ${LEFT_ARMPIT_Y}C26 88 25 108 24.5 ${workerHemY}C36 124 58 124 69.5 ${workerHemY}C69 108 68 88 67.5459 ${RIGHT_ARMPIT_Y}`;
const workerCollarLeft='M31.5 58.5L47 64L42 72L31 65.5Z';
const workerCollarSources=[workerCollarLeft,transformPath(workerCollarLeft,(x,y)=>({x:94-x,y}))];
const workerCollarEdges=['M47 64L42 72L31 65.5L31.5 58.5',transformPath('M47 64L42 72L31 65.5L31.5 58.5',(x,y)=>({x:94-x,y}))];
function workerGarmentPath(source,warp){
 return transformPath(source,(x,y)=>{const role=y<=64?'head':'body';return applyDragPose(warp(x,y,role),x,y,role,warp);});
}
function workerOuterMarkup(warp,id=selectedDecorations.outerwear){
 const palette=workerJacketVariants[id]||workerJacketVariants['worker-jacket'];
 const tag=(d,fill,stroke='none',width=1)=>`<path d="${workerGarmentPath(d,warp)}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
 return tag(workerBodySource,palette.body)
  +[79,95].map(y=>tag(`M26 ${y}L68 ${y}L68 ${y+6}L26 ${y+6}Z`,'#ddf29a')+tag(`M26 ${y+2}L68 ${y+2}L68 ${y+4}L26 ${y+4}Z`,'#d6e4d9')).join('')
  +tag(`M45.4 65L49 65L49 123.75L45.4 123.75Z`,palette.placket)
  +tag(workerBodyEdgesSource,'none','black')
  +workerCollarSources.map(source=>tag(source,palette.collar)).join('')
  +workerCollarEdges.map(source=>tag(source,'none','black',.7)).join('')
  +tag(workerTopEdgeSource,'none','black')
  +tag('M47 70L47 123.75','none',palette.seam,.55);
}
function workerSleeveMarkup(shape,id,style){
 const basic=alohaSleeveMarkup(shape,id,{...style,worker:false});
 const band=(from,to,color)=>{const end=style.end,pts=[];
  for(const [i,sign] of [[from,-1],[from,1],[to,1],[to,-1]]){const p=shape.centerline[i],a=shape.centerline[Math.max(0,i-1)],b=shape.centerline[Math.min(32,i+1)],l=Math.hypot(b.x-a.x,b.y-a.y)||1,r=(shape.hose[Math.min(i,31)].width+sleeveExtraWidth(i,end,style.flare))/2;pts.push(`${p.x-(b.y-a.y)/l*r*sign} ${p.y+(b.x-a.x)/l*r*sign}`);}
  return `<path d="M${pts.join('L')}Z" fill="${color}"/>`;};
 return basic+band(19,24,'#ddf29a')+band(21,22,'#d6e4d9');
}
const bootProfiles={'brown-worker-boots':{extra:2,color:'#59371F',tuckPants:true},'black-worker-boots':{extra:2,color:'#25272B',tuckPants:true},'blue-worker-boots':{extra:2,color:'#315D9A',tuckPants:true},'worker-boots':{extra:2,color:'#ffcb28',tuckPants:true},'gray-worker-boots':{extra:2,color:'#81868b',tuckPants:true}};
function bootCoversPants(shape,pantsFlare,shoes=selectedDecorations.shoes){
 const profile=bootProfiles[shoes];
 if(!profile)return false;
 return profile.tuckPants||profile.extra>wideLegExtraWidth(19,pantsFlare||0);
}
function workerBootExtra(index){return 2+smooth((index-19)/13);}
function workerBootShoe(shape){
 // Add a little width at the ankle only, fading out over the original foot.
 const mid={x:(shape.bootOuter.x+shape.bootInner.x)/2,y:(shape.bootOuter.y+shape.bootInner.y)/2};
 const width=Math.hypot(shape.bootOuter.x-shape.bootInner.x,shape.bootOuter.y-shape.bootInner.y)||1;
 const across={x:(shape.bootOuter.x-shape.bootInner.x)/width,y:(shape.bootOuter.y-shape.bootInner.y)/width};
 const map=(x,y)=>{const dx=x-mid.x,dy=y-mid.y;
  const fade=clamp01(1+(dx*shape.shoeUp.x+dy*shape.shoeUp.y)/7);
  const shift=(dx*across.x+dy*across.y)*3/width*fade;
  return {x:x+across.x*shift,y:y+across.y*shift};
 };
 return {...shape,bootOuter:map(shape.bootOuter.x,shape.bootOuter.y),bootInner:map(shape.bootInner.x,shape.bootInner.y),
  bootFill:transformPath(shape.bootFill,map),bootOutline:transformPath(shape.bootOutline,map)};
}
function workerBootMarkup(shape,side,legs=100,pantsFlare=0,shoes='worker-boots'){
 const color=bootProfiles[shoes]?.color||'#ffcb28';
 // Thumbnail counterpart of the native tall-boot renderer: the same calf,
 // same shoe, and shared cuff half-plane; never a separate triangular shaft.
 if(!bootCoversPants(shape,pantsFlare,shoes))return '';
 const id=side+'-worker-boot-thumb';
 const shoe=workerBootShoe(shape);
 const strokes=shape.hose.slice(19).map(({d,width},j)=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width+workerBootExtra(j+19)}" stroke-linecap="${j<5||j===12?'butt':'round'}"/>`).join('');
 return `<defs><clipPath id="${id}"><polygon points="${limbClipPoints(shape,19,true)}"/></clipPath></defs>`
  +`<g clip-path="url(#${id})">${strokes}<path d="${trouserCalfEdges(shoe,0,legs,true,workerBootExtra)}" fill="none" stroke="black" stroke-width="1"/></g>`
  +`<path d="${shoe.bootFill}" fill="${color}"/><path d="${shoe.bootOutline}" fill="none" stroke="black" stroke-width="1"/>`
  +`<path d="${cuffPath(shape,19,workerBootExtra(19))}" fill="none" stroke="black" stroke-width="1"/>`;
}
// Brim first, then the round crown. Both follow the head's deformation.
const yellowHatSources = {
  brim:`M60 8C66 6 79 22 83 33C88 44 91 59 85 62
    C78 68 59 43 57.5 19C57 13 57.5 8.5 60 8Z`,
  crown:`M79 20C86 20 91 25 91 33C91 40.5 86 45 79 45
    C72 45 67 40.5 67 33C67 25 72 20 79 20Z`,
};
// A crown worn on the side of the head, with its band tucked behind it so
// the head's own outline crosses in front: only the three points and their
// balls show. It replaces the fish's horn, which is hidden while it is on.
const circleSource = (cx, cy, r) => {
  const k = .5523 * r;
  return `M${cx + r} ${cy}C${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r}`
    + `C${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy}`
    + `C${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r}`
    + `C${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy}Z`;
};
// Crown geometry from fish2-4.svg. Match the fish's notch landmarks to
// this character with one uniform scale: preserve angles, bead proportions
// and the reference's outline weight instead of redrawing the silhouette.
const crownScale = (44.2249 - 40.1394) / (9.91741 - 8.33944);
const crownReferencePoint = (x,y) => ({
  x:44.2249 + (x - 9.91741) * crownScale,
  y:11.0386 + (y - 2.61328) * crownScale,
});
const crownPoints = [[22.1481,11.3745],[24.0358,14.5483],[23.3981,18.2236]]
  .map(([x,y])=>Object.values(crownReferencePoint(x,y)));
const crownBeadRadius = .715332 * crownScale;
const crownStrokeWidth = .4 * crownScale;
const crownSources = {
  band:transformPath('M18.8662 18.9204C18.7748 17.2284 18.5207 13.447 18.2338 11.8578'
    +'L21.9258 11.4614L20.7792 13.7871L23.9679 14.6338L20.8963 16.315'
    +'L23.5017 18.3045L18.8662 18.9204Z',crownReferencePoint),
  ...Object.fromEntries(crownPoints.map(([x,y],index)=>
    [`ball${index}`,circleSource(x,y,crownBeadRadius)])),
};
// Shared source geometry for the second king outfit and its thumbnails.
const ivoryBodySource=shirtSource;
const ivorySidesSource=shirtSidesSource;
// The alien, from the user's fish1-8.svg: green hide, a black eye with a
// white pupil, and a curled antenna with a bead on the end where the fish
// keeps its horn.
// Lifted 3 units and turned 10 degrees anticlockwise about its own root, so
// it leans back off the brow the way the reference does.
const alienAntennaSource='M66.013 42.961C70.444 41.414 75.246 43.792 76.561 45.004'
  +'C77.758 44.58 79.088 45.167 79.574 46.355C80.072 47.578 79.485 48.974 '
  +'78.263 49.474C77.039 49.973 75.642 49.387 75.142 48.164'
  +'C74.935 47.656 74.914 47.118 75.05 46.626C72.141 46.221 68.04 44.901 '
  +'67.173 45.803C66.189 46.829 65.99 44.336 66.013 42.961Z';

// The clown: a white fish with a red ball on the point of its nose — the
// head's own spike — and a red spot on its cheek. Both ride on the head,
// so the nose ball moves with the upper lip when it talks.
const hypnoticEyeSource=transformPath("M53.6243 27.2554C51.6647 24.7276 51.8131 20.9821 54.666 18.4201C56.9533 16.3909 61.7955 16.1308 63.7897 20.9382C65.784 25.7455 61.5821 28.723 60.233 29.302C58.8839 29.881 55.5839 29.7831 53.6243 27.2554Z",(x,y)=>({x:x-3.2407,y:y+10.5386}));
const pinkRibbonSpecs=[{source:transformPath("M101.035 46.038C97.0349 59.538 100.535 55.538 80.5349 43.038C67.5978 38.538 87.167 52.1903 70.7299 43.038C63.8922 39.2306 65.5557 17.6518 62.12 14.7794C58.6842 11.9071 70.5349 6.53796 84.0349 6.53796C97.5349 6.53796 87.0349 25.538 87.5349 30.038C88.0349 34.538 105.035 32.538 101.035 46.038Z",(x,y)=>({x,y:y+10.5386})),fill:'#F2A2F6',stroke:'#F16969',strokeWidth:1,role:'headRigid'}];
const lipstickFaceSpecs=[
 {source:'M44.2249 11.0386C49 10 50 14 48 18C46 23 43 27 40.1394 29.4449L44.2249 11.0386Z',fill:'#E31228',stroke:'none',role:'head',lip:true},
 {source:'M32.3001 23.0968C29 25 29 29 32 31C35 33 39 32 41 29.5L32.3001 23.0968Z',fill:'#E31228',stroke:'none',role:'head',lip:true},
 {source:transformPath("M51.916 17.2226L53.916 20.2226",(x,y)=>({x,y:y+10.5386})),fill:'none',stroke:'black',strokeWidth:1,role:'head'},
 {source:transformPath("M56 16.5L56 19.5",(x,y)=>({x,y:y+10.5386})),fill:'none',stroke:'black',strokeWidth:1,role:'head'},
 {source:transformPath("M60.8536 17.8536L58.8536 19.8536",(x,y)=>({x,y:y+10.5386})),fill:'none',stroke:'black',strokeWidth:1,role:'head'},
 {source:transformPath("M53.9472 29.7236L52.9472 31.7236",(x,y)=>({x,y:y+10.5386})),fill:'none',stroke:'black',strokeWidth:1,role:'head'},
 {source:transformPath("M57 29.5L57 32.5",(x,y)=>({x,y:y+10.5386})),fill:'none',stroke:'black',strokeWidth:1,role:'head'},
 {source:transformPath("M58.8536 28.1464L60.8536 30.1464",(x,y)=>({x,y:y+10.5386})),fill:'none',stroke:'black',strokeWidth:1,role:'head'}
];
function mosaicTopMarkup(warp,part='top'){
 const colors=['#D3D8DE','#EBEFF3','#B8C0C9','#DEE4EA','#C5CDD5','#ABB5C0','#F1F4F7','#BCC6D0'];
 let result='';
 for(let row=0;row<13;row++)for(let col=0;col<8;col++){
  if(part==='top'&&row>=8||part==='pants'&&row<8)continue;
  const x=25+col*5.5,y=67+row*5.5;
  const seed=((Math.imul((row+1)*31+col,1103515245)>>>16)^(row*19+col*7))%colors.length;
  const d=`M${x} ${y}L${x+5.52} ${y}L${x+5.52} ${y+5.52}L${x} ${y+5.52}Z`;
  result+=`<path d="${torsoGarmentPath(d,warp)}" fill="${colors[seed]}"/>`;
 }
 return result;
}
const shellTopSpecs=[{"source":"M25.9004 45.5L33.9004 63.5","fill":"none","stroke":"black","width":1.0},{"source":"M67.9004 44.5L57.9004 63.5","fill":"none","stroke":"black","width":1.0},{"source":"M48.9004 73.0C48.9004 78.798989875 44.199389874999994 83.5 38.4004 83.5C32.601410125 83.5 27.900399999999998 78.798989875 27.900399999999998 73.0C27.900399999999998 67.201010125 32.601410125 62.5 38.4004 62.5C44.199389874999994 62.5 48.9004 67.201010125 48.9004 73.0Z","fill":"white","stroke":"none","width":1.0},{"source":"M66.90039999999999 72.5C66.90039999999999 78.0228475 62.423247499999995 82.5 56.9004 82.5C51.3775525 82.5 46.9004 78.0228475 46.9004 72.5C46.9004 66.9771525 51.3775525 62.5 56.9004 62.5C62.423247499999995 62.5 66.90039999999999 66.9771525 66.90039999999999 72.5Z","fill":"white","stroke":"none","width":1.0},{"source":"M33.9004 81.5L42.9004 81.5L42.9004 86.5L33.9004 86.5Z","fill":"white","stroke":"none","width":1.0},{"source":"M51.9004 81.5L60.9004 81.5L60.9004 86.5L51.9004 86.5Z","fill":"white","stroke":"none","width":1.0},{"source":"M33.294 66.7766C33.294 66.7764 33.2302 67.4203 33.1379 68.6903C33.1094 69.3164 33.118 69.9052 33.3977 71.4963C33.6773 73.0874 34.2278 75.663 34.8472 78.4475","fill":"none","stroke":"black","width":0.5},{"source":"M36.751 66.7976C36.8026 67.7346 36.8543 68.6715 36.9961 70.4598C37.138 72.2481 37.3686 74.8592 37.4525 76.39C37.5364 77.9208 37.4666 78.2921 37.3948 78.6746","fill":"none","stroke":"black","width":0.5},{"source":"M41.9445 68.2268C41.9445 68.5153 41.9445 68.8038 41.8864 70.6229C41.8284 72.442 41.7124 75.783 41.5928 79.2253","fill":"none","stroke":"black","width":0.5},{"source":"M54.7591 69.0718C54.733 69.1926 54.7068 69.3134 54.6999 70.806C54.6929 72.2986 54.706 75.1594 54.7832 77.0696C54.8604 78.9797 55.0013 79.8525 55.0869 80.341C55.1725 80.8295 55.1984 80.9072 55.2512 80.9872","fill":"none","stroke":"black","width":0.5},{"source":"M56.8184 66.7329C56.8742 67.3294 56.9301 67.9259 56.9589 69.4425C56.9877 70.959 56.9877 73.3776 56.9877 75.8694","fill":"none","stroke":"black","width":0.5},{"source":"M60.1948 67.2148C60.2121 67.2148 60.3418 67.6661 60.5232 69.9008C60.6675 71.6793 60.5799 74.7859 60.521 76.7269C60.462 78.668 60.3479 79.3544 60.2586 79.7987C60.1692 80.243 60.1082 80.4243 60.0463 80.5695C59.9843 80.7147 59.9233 80.8183 59.8076 80.9774","fill":"none","stroke":"black","width":0.5}];
function shellTopMarkup(warp){
 return shellTopSpecs.map(s=>`<path d="${torsoGarmentPath(transformPath(s.source,(x,y)=>({x,y:y+10.5386})),warp)}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.width}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
}
function seaweedPantsMarkup(warp){
 const compression=smooth(bodyCompression(warp).amount/legCompressionLimit(warp).limit);
 const path=d=>torsoGarmentPath(transformPath(d,(x,y)=>({x,y:y>119?119+(y-119)*(1-.6*compression):y})),warp);
 let result='';
 for(const [i,x] of [31,39,47,55,63].entries()){
  const end=140+(i%2)*2,lean=i%2?1:-1;
  const d=`M${x} 118C${x-4*lean} 125 ${x+4*lean} 129 ${x+lean} 135C${x+lean} 138 ${x-lean} ${end} ${x-2*lean} ${end}`;
  result+=`<path d="${path(d)}" fill="none" stroke="#223D12" stroke-width="7.5" stroke-linecap="round"/>`
   +`<path d="${path(d)}" fill="none" stroke="#315D19" stroke-width="5.5" stroke-linecap="round"/>`;
 }
 return result+`<path d="${path('M27.7 110.5L65.9 110.5L66.2 119L27.9 119Z')}" fill="#315D19" stroke="#223D12" stroke-width="1" stroke-linejoin="round"/>`;
}
const largePartyHatSpecs=[
 {source:'M63 27L104 36.5L67 54Z',fill:'#080808',stroke:'black',role:'headRigid'},
 ...[[71.5,34.5],[77.8,39.2],[87.7,38.8],[74,46.3]].map(([x,y])=>({source:circleSource(x,y,2.5),fill:'#FFE344',stroke:'none',role:'headRigid'})),
 {source:circleSource(104,36.5,5.4),fill:'#FFE344',stroke:'black',role:'headRigid'},
];
let spongeHeadPaths=[],spongeBodyNode;
const spongeReferencePath=source=>transformPath(source,(x,y)=>({x:25.5113+x/.386236,y:10.5203+y/.386236}));
const spongeEllipse=(cx,cy,rx,ry,angle=0)=>transformPath(circleSource(0,0,1),(x,y)=>({x:cx+x*rx*Math.cos(angle)-y*ry*Math.sin(angle),y:cy+x*rx*Math.sin(angle)+y*ry*Math.cos(angle)}));
const spongeHeadSpecs=[
 {source:spongeReferencePath("M5.27485 0.200195L7.16722 0.866804L6.99458 1.92059L5.03784 1.55499L5.27485 0.200195Z"),fill:'white',stroke:'black',strokeWidth:1,role:'head',behind:true},
 {source:spongeReferencePath("M4.76664 2.46892L6.77098 2.55858L6.9111 3.61719L4.93237 3.83427L4.76664 2.46892Z"),fill:'white',stroke:'black',strokeWidth:1,role:'head',behind:true},
 {source:spongeReferencePath(spongeEllipse(3.49537,16.1219-3*.386236,1.36174,1.96695,0.5047474743475081)),fill:'#C2C104',stroke:'none',role:'head'},
 {source:spongeReferencePath(circleSource(9.65865,10.2287,1.2585)),fill:'#C2C104',stroke:'none',role:'head'},
 {source:spongeReferencePath(circleSource(12.1753,14.9445,1.2585)),fill:'#C2C104',stroke:'none',role:'head'},
 {source:'M60.7 31.5L64.3 29.8L65 31.6L61.5 33Z M61.5 34.2L66.2 34.2L66.4 36.1L61.8 36Z M60.7 37L65.7 39L65 41L60 38.6Z',fill:'black',stroke:'none',role:'head'},
];
// Group 599 uses the original character coordinates, 10.5386 above our body.
const spongeBodySource=[[44.5273,71.2171,3.43285,4.95856,28.9199],[56.8962,87.1655,3.81007,5.50344,28.9199],[40.4863,98.0876,2.5,2.5,0],[61.4004,65,2.5,2.5,0]].map(([x,y,rx,ry,angle])=>spongeEllipse(x,y+10.5386,rx,ry,angle*Math.PI/180)).join(' ');
const spongeLimbSpots=[{"kind":"leg","side":"left","index":22,"x":24.4354,"y":164.4956,"rx":2.09989,"ry":3.69601,"angle":0.28100499088809505,"origin":{"x":25.958302038574217,"y":164.02612390136719},"dx":-0.25888478150329,"dy":0.9659082098760697},{"kind":"leg","side":"right","index":11,"x":64.9707,"y":142.0946,"rx":2.5,"ry":2.94275,"angle":-0.3375536586527113,"origin":{"x":64.43404014585553,"y":143.10399679565433},"dx":0.3966087421077943,"dy":0.9179877481119633},{"kind":"arm","side":"left","index":4,"x":23.9666,"y":64.9572,"rx":2.49859,"ry":3.60907,"angle":0.5047474743475081,"origin":{"x":22.942745733762912,"y":64.82759667031581},"dx":-0.6804408413616788,"dy":0.7328030167835082},{"kind":"arm","side":"right","index":8,"x":75.4004,"y":67.5386,"rx":2.5,"ry":2.5,"angle":0,"origin":{"x":75.7522087280036,"y":66.85004023165781},"dx":0.6456001523994197,"dy":0.7636756138713909}];
const spongeLegSpots=Object.fromEntries(['left','right'].map(side=>[side,spongeLimbSpots.filter(s=>s.kind==='leg'&&s.side===side).map(s=>[s.index,s])]));
function spongeLimbSpotPath(shape,spec){
 const {index,origin,dx,dy}=spec,p=shape.centerline[index],a=shape.centerline[index-1],b=shape.centerline[index+1],l=Math.hypot(b.x-a.x,b.y-a.y)||1;
 const ux=(b.x-a.x)/l,uy=(b.y-a.y)/l;
 return transformPath(spongeEllipse(spec.x,spec.y,spec.rx,spec.ry,spec.angle),(x,y)=>{
  const along=(x-origin.x)*dx+(y-origin.y)*dy,across=-(x-origin.x)*dy+(y-origin.y)*dx;
  return {x:p.x+ux*along-uy*across,y:p.y+uy*along+ux*across};
 });
}
function spongeLegPath(shape,index,spec){return spongeLimbSpotPath(shape,spec);}
function spongeArmPath(shape,side=0){return spongeLimbSpotPath(shape,spongeLimbSpots.find(s=>s.kind==='arm'&&s.side===(side===1||side==='right'?'right':'left')));}
const angelHaloSpecs=[{source:transformPath(circleSource(47,1,1),(x,y)=>({x:47+(x-47)*24,y:1+(y-1)*5})),fill:'none',stroke:'#E8FF4C',strokeWidth:2.5,role:'headRigid'}];
function angelVestMarkup(warp){
 const tag=(d,fill,stroke='black',width=1)=>`<path d="${garmentPath(d,warp)}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
 const body=shirtSource.replace('M26.1046 56.4524L67.7274 55.0466','M26.1046 56.4524C36 58 57 57.5 67.7274 55.0466');
 let result=tag(body,'#FAFAF7');
 for(const y of [64,72,80,88]){
  result+=tag(circleSource(60,y,1.9),'#FAFAF7','black',.45);
  for(const x of [-.55,.55])for(const dy of [-.55,.55])result+=tag(circleSource(60+x,y+dy,.22),'black','none');
 }
 return result+tag('M27.7 104L65.9 104L65.9 110.5L27.7 110.5Z','#151616')
  +tag('M42 104L52 104L52 110.5L42 110.5Z','#F2D930','none')
  +tag('M43 105L51 105L51 109.5L43 109.5Z','#151616','none')
  +tag('M48.6 107L51 107','none','#F2D930',.8);
}
const spaceHelmetSpecs=[
 {source:circleSource(48,33,32),fill:'#F7F7F3',stroke:'black',role:'headRigid'},
 {source:circleSource(48,30,25.5),fill:'#080C10',stroke:'black',role:'headRigid'},
 {source:'M48 8C61 8 72 18 71 26C70 30 66 29 65 25C63 18 54 16 47 14C43 13 44 8 48 8Z',fill:'#ffffff',stroke:'none',role:'headRigid'},
 {source:circleSource(70,34,2.5),fill:'#ffffff',stroke:'none',role:'headRigid'},
 {source:'M56 54C58 50 65 47 69 47C73 47 76 54 73 58C69 63 62 64 58 60C56 58 55 56 56 54Z',fill:'#F7F7F3',stroke:'black',role:'headRigid'},
 {source:'M64 57L81 42L83 43L66 59Z',fill:'#c4cbd0',stroke:'black',role:'headRigid'}
].map(spec=>({...spec,source:transformPath(spec.source,(x,y)=>({x:46+(x-48)*.9,y:58+(y-58)*.9}))}));
function spaceSleeveExtra(index){
 const t=clamp01(index/31);return 6.5+2.5*Math.sin(Math.PI*t);
}
function spaceSleeveMarkup(shape,id,shoulderCutout=null){
 const end=id+'-end',band=id+'-band';
 const rootMask=shoulderCutout?id+'-root':/^(left|right)-/.test(id)?id.split('-')[0]+'-shoulder-mask':null;
 const strokes=(color,extra,start=0)=>shape.hose.slice(start,31).map(({d,width},j)=>{
  const shoulder=color==='black'&&j+start<6&&rootMask
   ?` mask="url(#${rootMask})"`:'';
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width+spaceSleeveExtra(j+start)+extra}" stroke-linecap="${j+start===0?'butt':'round'}" stroke-linejoin="round"${shoulder}${j+start>=16?` clip-path="url(#${end})"`:''}/>`;
 }).join('');
 return `<defs>${shoulderCutout?`<mask id="${rootMask}" maskUnits="userSpaceOnUse" x="-1000" y="-1000" width="2000" height="2000"><rect x="-1000" y="-1000" width="2000" height="2000" fill="white"/><path d="${shoulderCutout}" fill="black"/></mask>`:''}<clipPath id="${end}"><polygon points="${limbClipPoints(shape,31,false)}"/></clipPath><clipPath id="${band}"><polygon points="${limbClipPoints(shape,27,true)}"/></clipPath></defs>${strokes('black',2)}${strokes('#FF8215',0)}<g clip-path="url(#${band})">${strokes('#10C9E9',0,27)}</g><path d="${cuffPath(shape,27,spaceSleeveExtra(27))+cuffPath(shape,31,spaceSleeveExtra(31))}" fill="none" stroke="black" stroke-width="1"/>`;
}
// One source for the padded body's fill and its open side/hem outline.
const spaceBodySides=`M67.5459 ${RIGHT_ARMPIT_Y}C68.5 84.8335 67.9 100 67.9 109L67.9 119C53.83333 123 39.76667 123 25.7 119L25.7 109C25.7 100 26 84.2394 27.478 ${LEFT_ARMPIT_Y}`;
// The jacket opening and collar share this single cubic arc.
const spaceNeckSource='M26.1046 56.4524C35 59 58 59 67.7274 55.0466';
const spaceBodySource=`${spaceNeckSource}L${spaceBodySides.slice(1)}Z`;
// Only the exposed neckline is stroked; its raised ends meet the sleeve shoulders.
const spaceCollarTopSource='M31.34549 55.7C33.2 58.5 38 58.35 46.8 58.25C55.5 58.15 60.2 57.7 62.15105 54.9';
const spaceCollarEdgesSource='M62.15105 54.9L62.15105 58.4C60.2 61.2 55.5 61.65 46.8 61.75C38 61.85 33.2 62 31.34549 59.2L31.34549 55.7';
const spaceCollarSource=`${spaceCollarTopSource}${spaceCollarEdgesSource.replace(/^M[^L]+/,'')}Z`;
function spaceCollarMarkup(warp){
 const path=source=>workerGarmentPath(source,warp);
 return `<path d="${path(spaceCollarSource)}" fill="#F2F1EE"/>`
  +`<path d="${path(spaceCollarEdgesSource)}" fill="none" stroke="black" stroke-width="1" stroke-linejoin="round"/>`
  +`<path d="${path(spaceCollarTopSource)}" fill="none" stroke="black" stroke-width="1" stroke-linecap="round"/>`;
}
function spaceOuterMarkup(warp,includeCollar=true){
 return `<path d="${workerGarmentPath(spaceBodySource,warp)}" fill="#FF8215"/><path d="${workerGarmentPath(spaceBodySides.replace('C53.83333 123 39.76667 123 25.7 119','M25.7 119'),warp)}" fill="none" stroke="black" stroke-width="1" stroke-linejoin="round"/>`+spaceShirtDetails(warp)+(includeCollar?spaceCollarMarkup(warp):'');
}
function spaceShirtDetails(warp){
 const tag=(d,fill,stroke='black',width=1)=>`<path d="${workerGarmentPath(d,warp)}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
 return tag('M34 78L47 82L60 78L60 92L34 92Z','#F2F1EE')
 +tag('M38 84L44 84 M38 88L43 88','none')+tag('M51 84L57 84L57 88L51 88Z','#2455e7')
 +tag('M25.7 109C39.76667 113.66667 53.83333 113.66667 67.9 109L67.9 119C53.83333 123 39.76667 123 25.7 119Z','#10C9E9')
 +tag('M33 111.00286L33 120.71674 M40 112.13649L40 121.68842 M47 112.49969L47 121.99973 M54 112.09246L54 121.65068 M61 110.91482L61 120.64127','none', 'black',.7);
}
const hypnoticEyeSpecs=[{"source": "M63.6411 23.5C63.6411 25.9853 61.6264 28 59.1411 28C56.6558 28 54.6411 25.9853 54.6411 23.5C54.6411 21.0147 56.6558 19 59.1411 19C61.6264 19 63.6411 21.0147 63.6411 23.5Z", "fill": "none", "stroke": "#B2211E", "role": "headRigid"}, {"source": "M61.6411 23.5C61.6411 24.8807 60.5218 26 59.1411 26C57.7604 26 56.6411 24.8807 56.6411 23.5C56.6411 22.1193 57.7604 21 59.1411 21C60.5218 21 61.6411 22.1193 61.6411 23.5Z", "fill": "none", "stroke": "#B2211E", "role": "headRigid"}, {"source": "M60.1411 23.5C60.1411 24.0523 59.6934 24.5 59.1411 24.5C58.5888 24.5 58.1411 24.0523 58.1411 23.5C58.1411 22.9477 58.5888 22.5 59.1411 22.5C59.6934 22.5 60.1411 22.9477 60.1411 23.5Z", "fill": "#B2211E", "stroke": "none", "role": "headRigid"}].map(spec=>({...spec,source:transformPath(spec.source,(x,y)=>({x:x-3.2407,y:y+10.5386}))}));
const clownMarkSources = [
  {source: circleSource(44.2249, 11.0386, 3.4), outline: true},
  {source: circleSource(43.6, 41.6, 3), outline: false},
];
// The party hat is the fish's own horn in yellow with spots on it and a
// bobble on the point, so it warps with the head like the horn does.
const partyHatTrim = [
  {source: circleSource(70.4, 39.4, .95), fill: '#2ec4f1'},
  {source: circleSource(72.6, 43.1, .95), fill: '#2ecc40'},
  {source: circleSource(69.6, 45.6, .95), fill: '#e040fb'},
  {source: circleSource(78.6, 41.3, 1.9), fill: '#e040fb', outline: true},
];

// The shark hood, from the user's fish2-5.svg. Scaled onto the project's
// coordinates it turns out to be the character's own head and horn, so the
// hood is those paths repainted rather than a second copy of them — they
// then open and close with the jaw exactly as the head does. All the file
// really adds is the row of teeth, which are drawn behind the head so the
// jaws close over them.
// The hood's eye is the character's own, with its upper arc replaced by a
// straight cut: the lid comes down across the top of the eye, which is
// what gives the shark its glare.
const sharkEyeWhite='M54.848 29.936C57.19 32.83 59.239 35.204 60.652 36.789'
  +'C59.661 38.434 57.805 39.519 56.991 39.843C55.632 40.383 52.381 40.458 '
  +'50.565 38.468C48.749 36.477 49.071 33.382 52.009 31.136'
  +'C52.764 30.565 53.771 30.133 54.848 29.936Z';
const sharkToothSources = [
  'M37.971 11.797C39.933 11.935 44.865 12.2 45.232 12.159L44.316 15.209L37.971 11.797Z',
  'M37.354 14.753C39.316 14.891 44.248 15.157 44.614 15.115L43.699 18.166L37.354 14.753Z',
  'M36.368 18.165C38.33 18.303 43.262 18.568 43.628 18.527L42.713 21.577L36.368 18.165Z',
  'M35.817 21.578C37.779 21.716 42.711 21.981 43.077 21.94L42.162 24.99L35.817 21.578Z',
];

// Pochita, from the user's Group 497.svg, brought into the project's
// coordinates: their export sits 25.962 lower, and its `V`/`H` commands are
// written out as `L`, since transformPath reads only M/L/C/Z.
// The chainsaw on the head is worn as a helmet; the orange hide, the big
// eye and the starter cord are the skin.
const pochitaColors = {skin:'#EB733E', casing:'#303232', blade:'#AAB3B8',
  motor:'#3B3D40', teeth:'#D9D9D9'};
// A single clean cigarette, anchored inside the mouth notch (behind the fish).
const CIGARETTE_ANGLE=Math.atan2(-22.9,-11);
function cigarettePoint(along,across=0){
 const c=Math.cos(CIGARETTE_ANGLE),s=Math.sin(CIGARETTE_ANGLE);
 return {x:JAW.corner[0]+along*c-across*s,y:JAW.corner[1]+along*s+across*c};
}
const cigaretteTip=cigarettePoint(25);
const cigaretteSpecs=[
 {start:-.5,end:23,fill:'#f7f3e8'},
 {start:-.5,end:6,fill:'#d8a05e'},
 {start:23,end:25,fill:'#dc786d'},
].map(({start,end,fill})=>({fill,source:[[start,-1.35],[end,-1.35],[end,1.35],[start,1.35]].map(([a,b],i)=>{
 const p=cigarettePoint(a,b);return `${i?'L':'M'}${clean(p.x)} ${clean(p.y)}`;
}).join('')+'Z'}));
const chainsawSources = {
  casing:'M65.4 -7.962L65.4 30.538L41.4 36.038L36.9 28.538L36.9 -7.962'
    +'C36.9 -24.462 66.4 -21.462 65.4 -7.962Z',
  blade:'M61.9 -5.962L62.88 30.063L43.529 35.038L39.9 28.254L39.9 -4.761'
    +'C39.9 -19.685 62.707 -18.173 61.9 -5.962Z',
  motor:'M71.4 39.038C68.375 37.127 61.04 33.919 57.9 32.038L64.9 30.538'
    +'L78.4 37.538L68.4 50.038L60.826 52.538L71.4 39.038Z',
  // The middle tooth each side was half as long again as its neighbours,
  // and the lowest three rows sat too far down the bar.
  teeth:'M70.008 18.492L65.604 20.814L65.418 16.564L70.008 18.492Z'
    +'M69.968 11.567L65.599 14.69L65.342 8.838L69.968 11.567Z'
    +'M68.77 4.064L65.271 6.798L65.045 1.647L68.77 4.064Z'
    +'M68.64 -1.943L65.253 1.039L64.803 -4.609L68.64 -1.943Z'
    +'M69.52 -12.63L65.229 -7.542L62.899 -13.313L69.52 -12.63Z'
    +'M64.223 -21.131L62.565 -13.999L58.151 -17.039L64.223 -21.131Z'
    +'M31.796 18.416L36.402 20.738L36.596 16.488L31.796 18.416Z'
    +'M31.839 11.491L36.407 14.614L36.676 8.762L31.839 11.491Z'
    +'M33.091 3.988L36.75 6.722L36.986 1.571L33.091 3.988Z'
    +'M33.226 -2.019L36.768 .964L37.239 -4.685L33.226 -2.019Z'
    +'M32.307 -12.706L36.794 -7.618L39.23 -13.389L32.307 -12.706Z'
    +'M37.845 -21.207L39.58 -14.075L44.195 -17.115L37.845 -21.207Z'
    +'M45.928 -24.954L45.764 -17.616L51.007 -19.362L45.928 -24.954Z'
    +'M55.184 -25.213L51.537 -18.843L56.978 -17.875L55.184 -25.213Z',};
// The skin's own extras: a rounder, much larger eye, and the starter cord
// hanging from the chest.
const pochitaEyeWhite='M50.389 37.812C48.433 35.299 48.586 31.572 51.442 29.019'
  +'C53.731 26.997 58.572 26.732 60.559 31.513C62.546 36.294 58.342 39.262 '
  +'56.992 39.84C55.643 40.418 52.344 40.325 50.389 37.812Z';
// A touch smaller than the drawing's, and lifted a little: at full size it
// all but touched the bottom of the eye white.
// Pochita's upper lip curves where the fish's runs straight up to its
// spike. Only his skin wears it, so it is a swap on the way through the
// warp rather than a change to the shared drawing: the two paths that
// carry this stretch — the head's outline and the head fill cut from the
// same silhouette — both match on the same text.
const POCHITA_LIP = {
  from:'C34.6926 25.4067 37.416 27.9423 40.1394 29.4449L44.2249 11.0386'
    +'C50.6575 11.6957',
  to:'C34.6926 25.4062 36.1614 27.6318 39.4004 29.0381'
    +'C37.9585 23.6654 36.9048 12.5436 44.2249 11.038C51.4004 11.0379',
};
const pochitaPupil={rx:4.1, ry:4.35, dy:-.55};
const pochitaCordSource='M47.514 130.242C45.901 134.005 44.288 149.797 46.707 153.089'
  +'C49.127 156.382 49.53 156.449 49.731 157.726';
const pochitaGripSource='M49.2 158.836C49.523 158.17 49.734 157.727 49.734 157.727'
  +'C50.916 158.327 52.02 158.855 52.603 159.151C53.185 159.447 53.245 159.511 53.07 159.662'
  +'C52.895 159.813 52.499 160.046 51.529 160.49C50.559 160.934 49.062 161.571 48.646 161.203'
  +'C48.23 160.835 48.876 159.503 49.2 158.836Z';

// The cowl the user drew (Group 98.svg), brought into the project's
// coordinates: their export sits 1.0403 higher, and its one `H` command is
// written out as an `L`, since transformPath reads only M/L/C/Z.
// Everything below the cowl's own lower edge. With the cowl on, the head
// is clipped to this, so no part of it — whatever shape a skin gives it —
// can appear around or through the cowl: the mouth used to poke an orange
// sliver into the notch between its two points.
const batCowlFaceClip='M-60 47.6825L25.0987 48.4807L37.2318 47.6825'
  +'L39.4667 51.035L54.9523 51.035L56.7084 47.6825L68.8365 48.5555'
  +'L140 47.6825L140 320L-60 320Z';
const batCowlSource='M37.2318 47.6825'
  +'C35.6354 47.6825 30.9735 47.8421 25.0987 48.4807'
  +'C24.9067 46.0085 24.5024 42.2059 25.0987 37.1092'
  +'C25.4825 33.8284 25.8769 32.8972 27.6829 27.6832'
  +'C28.3758 23.959 29.1718 18.5325 29.8619 13.7534'
  +'L39.4667 26.1775L42.9122 2.2288'
  +'C47.3183 7.5556 49.4249 10.5511 55.0525 17.1151'
  +'C61.515 20.7999 64.6783 24.463 66.8665 29.1295'
  +'C69.0547 33.7959 68.8365 39.6194 68.8365 48.5555'
  +'C68.1178 48.4357 60.7496 48.0823 56.7084 47.6825'
  +'L54.9523 51.035L39.4667 51.035L37.2318 47.6825Z';
// Original oversized slab sword, in a diagonal back-mounted frame.
const greatswordBladeSource='M-12 3L12 3L12 112L-12 133Z';
const greatswordParts=[
 ['swordBlade',greatswordBladeSource,'#454b50'],
 ['swordEdge','M6 3L12 3L12 112L-12 133L5 108Z','#cbd1d2'],
 ['swordGuard','M-16 -5L16 -5L16 2L-16 2Z','#30373c'],
 ['swordGrip','M-3 -37L3 -37L3 -5L-3 -5Z','#52372f'],
 ['swordPommel','M-3.7 -40L3.7 -40L3.7 -37L-3.7 -37Z','#30373c'],
 ['swordOutline',greatswordBladeSource,'none']
].map(([key,source,fill])=>({key,category:'cape',id:'greatsword',fill,outline:!['swordBlade','swordEdge'].includes(key),source:transformPath(source,(x,y)=>({x:75+(x*.83-y*.56)*1.1,y:45+(x*.56+y*.83)*1.1}))}));
// User Group 98.svg: only the first eight paths are the two sheathed blades.
const dualSwordParts=[{"key": "dual0sheath", "source": "M89.3797 111.475L21.4854 37.748L16.4285 42.4048C36.9366 65.2008 78.7219 111.312 81.7987 113.39C84.8756 115.468 88.5266 112.995 89.3797 111.475Z", "category": "cape", "id": "dual-swords", "fill": "#37434F", "outline": true}, {"key": "dual0guard", "source": "M19.821 33.1696L12.101 40.279L15.0929 43.5279L22.8129 36.4186L19.821 33.1696Z", "category": "cape", "id": "dual-swords", "fill": "#20272E", "outline": true}, {"key": "dual0grip", "source": "M5.01364 28.0965L14.2436 38.1192L17.4925 35.1273L8.26258 25.1045L5.01364 28.0965Z", "category": "cape", "id": "dual-swords", "fill": "#647785", "outline": true}, {"key": "dual0pommel", "source": "M2.94235 25.8467L4.95685 28.0343L8.20579 25.0423L6.19129 22.8548L2.94235 25.8467Z", "category": "cape", "id": "dual-swords", "fill": "#28333D", "outline": true}, {"key": "dual1sheath", "source": "M11.6046 111.475L79.499 37.748L84.5558 42.4048C64.0478 65.2008 22.2625 111.312 19.1857 113.39C16.1088 115.468 12.4578 112.995 11.6046 111.475Z", "category": "cape", "id": "dual-swords", "fill": "#37434F", "outline": true}, {"key": "dual1guard", "source": "M81.1634 33.1696L88.8834 40.279L85.8915 43.5279L78.1714 36.4186L81.1634 33.1696Z", "category": "cape", "id": "dual-swords", "fill": "#20272E", "outline": true}, {"key": "dual1grip", "source": "M95.9707 28.0965L86.7408 38.1192L83.4919 35.1273L92.7218 25.1045L95.9707 28.0965Z", "category": "cape", "id": "dual-swords", "fill": "#647785", "outline": true}, {"key": "dual1pommel", "source": "M98.042 25.8467L96.0275 28.0343L92.7786 25.0423L94.7931 22.8548L98.042 25.8467Z", "category": "cape", "id": "dual-swords", "fill": "#28333D", "outline": true}].map(spec=>({...spec,source:transformPath(spec.source,(x,y)=>({x:x+0.604,y:y+1.0403}))}));
const pairedSwordParts=[{"key": "pairedSword0", "category": "cape", "id": "paired-swords", "fill": "#37434F", "outline": true, "source": "M118.93 130.226L26.373 91.7759L23.7358 98.1243C51.9143 110.216 109.187 134.549 112.852 135.144C116.517 135.74 118.794 131.964 118.93 130.226Z"}, {"key": "pairedSword1", "category": "cape", "id": "paired-swords", "fill": "#20272E", "outline": true, "source": "M22.9423 88.3179L18.9162 98.0097L22.9949 99.7041L27.0211 90.0122L22.9423 88.3179Z"}, {"key": "pairedSword2", "category": "cape", "id": "paired-swords", "fill": "#714936", "outline": true, "source": "M7.3728 89.9234L19.9555 95.1505L21.6499 91.0717L9.06718 85.8447L7.3728 89.9234Z"}, {"key": "pairedSword3", "category": "cape", "id": "paired-swords", "fill": "#D5AC55", "outline": true, "source": "M4.54858 88.7498L7.29485 89.8907L8.98923 85.8119L6.24296 84.6711L4.54858 88.7498Z"}, {"key": "pairedSword4", "category": "cape", "id": "paired-swords", "fill": "#37434F", "outline": true, "source": "M122.382 111.146L22.4351 103.668L21.9221 110.523C52.4713 113.167 114.486 118.307 118.153 117.723C121.82 117.14 122.797 112.84 122.382 111.146Z"}, {"key": "pairedSword5", "category": "cape", "id": "paired-swords", "fill": "#D5AC55", "outline": true, "source": "M18.0922 101.461L17.3091 111.926L21.7135 112.256L22.4966 101.79L18.0922 101.461Z"}, {"key": "pairedSword6", "category": "cape", "id": "paired-swords", "fill": "#714936", "outline": true, "source": "M3.81179 107.869L17.3991 108.885L17.7286 104.481L4.14133 103.464L3.81179 107.869Z"}, {"key": "pairedSword7", "category": "cape", "id": "paired-swords", "fill": "#D5AC55", "outline": true, "source": "M0.762475 107.64L3.728 107.862L4.05753 103.458L1.09201 103.236L0.762475 107.64Z"}].map((spec,i)=>({...spec,fill:dualSwordParts[i].fill,source:reference594Path(spec.source)}));
const angelWingSource='M31 62C20 54 -1 50 -16 54C-26 59 -7 67 5 68C-13 70 -9 79 10 76C-5 86 0 94 18 84C27 79 31 70 31 62Z';
const angelWingParts=[angelWingSource,transformPath(angelWingSource,(x,y)=>({x:94-x,y}))].map((source,i)=>({key:'angelWing'+i,source,category:'cape',id:'angel-wings',fill:'#FAFAF7',stroke:'#A6B8C8',outline:true}));
const gourdParts=[{"key": "gourdBody", "source": "M36.6908 32.5726C50.4593 21.0857 70.9331 22.9355 82.4202 36.704C88.4794 43.9667 90.8257 53.0946 89.6715 61.7856L90.6124 62.9134C103.938 61.2329 117.815 66.1654 127.059 77.2443C141.484 94.5342 139.161 120.245 121.872 134.67C104.582 149.095 78.8709 146.773 64.4457 129.483C55.202 118.403 52.8351 103.866 56.8773 91.0562L55.9389 89.9315C47.1809 89.5103 38.62 85.5661 32.56 78.3028C21.0728 64.5342 22.9222 44.0598 36.6908 32.5726Z", "fill": "#E99D63", "outline": true}, {"key": "gourdBand", "source": "M55.2553 89.8926L89.7557 61.1061L92.1 63.91L57.6 92.7Z", "fill": "#912727", "outline": true}, {"key": "gourdDetail2", "source": "M30.4835 33.3571L39.1455 26.1303L41.9317 29.4698L33.2697 36.6966L30.4835 33.3571Z", "fill": "#E99D63", "outline": true, "strokeWidth": 1.0}, {"key": "gourdDetail3", "source": "M27.5812 29.8783L36.2432 22.6516L39.0293 25.991L30.3674 33.2178L27.5812 29.8783Z", "fill": "#E99D63", "outline": true, "strokeWidth": 1.0}, {"key": "gourdDetail4", "source": "M114.258 129.413C118.965 129.45 122.654 127.92 123.91 127.151", "fill": "none", "outline": true, "strokeWidth": 0.7}, {"key": "gourdDetail5", "source": "M121.293 123.956C120.158 128.525 117.76 131.717 116.703 132.742", "fill": "none", "outline": true, "strokeWidth": 0.7}].map(spec=>({...spec,category:'cape',id:'gourd',source:reference595Path(spec.source)}));
const ivorySpecs={
 ...Object.fromEntries(gourdParts.map(({key,...spec})=>[key,spec])),
 ...Object.fromEntries(pairedSwordParts.map(({key,...spec})=>[key,spec])),
 ...Object.fromEntries(angelWingParts.map(({key,...spec})=>[key,spec])),
 ...Object.fromEntries(dualSwordParts.map(({key,...spec})=>[key,spec])),
 ...Object.fromEntries(greatswordParts.map(({key,...spec})=>[key,spec])),
 kappaShell:{category:'cape',id:'kappa-shell',fill:'#373d38',outline:true,source:'M38 55C49 49 65 51 70 61C78 75 81 96 76 111C72 122 63 127 52 123C38 117 29 99 29 80C29 67 32 59 38 55Z'},
 kappaShellRim:{category:'cape',id:'kappa-shell',fill:'none',outline:true,stroke:'#242c26',strokeWidth:.7,source:'M63 55C73 68 79 93 73 110C70 118 63 123 56 123'},
 kappaShellScutes:{category:'cape',id:'kappa-shell',fill:'none',outline:true,stroke:'#28322a',strokeWidth:.65,source:'M65 66L72 77L68 91L73 104 M68 91L59 88 M72 77L77 78 M73 104L76 110'},
 batBadge:{category:'shirt',id:'batfish-armor',fill:'#FDE400',outline:true,source:'M32 75C32 65 62 65 62 75C62 85 32 85 32 75Z'},
 batFish:{category:'shirt',id:'batfish-armor',fill:'#080909',outline:true,stroke:'#626262',strokeWidth:.65,source:'M37 75C41 69 48 69 53 74C55 71.5 57 71 57 71L55.5 75L57 79C55 78.8 54 77 53 76C48 81 41 81 37 75Z'},
 batFishMarks:{category:'shirt',id:'batfish-armor',fill:'#626262',source:'M42 73L42.6 72.7L44.5 76.8L43.9 77.1Z M44 72.7L44.6 73L42.7 77.1L42.1 76.8Z M45.2 73L45.8 72.7L47.7 76.8L47.1 77.1Z M47.2 72.7L47.8 73L45.9 77.1L45.3 76.8Z M48.4 73L49 72.7L50.9 76.8L50.3 77.1Z M50.4 72.7L51 73L49.1 77.1L48.5 76.8Z'},
 // The belt rides at the waist, not down on the hips.
 batBelt:{category:'shirt',id:'batfish-armor',fill:'#FDE400',outline:true,source:'M27.9 99L66.2 99L66.1 105L27.9 105Z'},
 batBeltClasp:{category:'shirt',id:'batfish-armor',fill:'#FDE400',outline:true,source:'M43 98.5L51 98.5L51 105.5L43 105.5Z'},
 ivoryEmbroidery:{category:'shirt',id:'ivory-tunic',fill:'#c7a45b',source:'M33 60L35 60L39 105L37 105Z M59 59L61 59L57 105L55 105Z'},
 ivoryPleats:{category:'shirt',id:'ivory-tunic',fill:'#dfd7c6',source:'M30 79L34 105L32 103Z M42 78L44 105L42 104Z M62 78L60 105L58 104Z'},
 ivoryBelt:{category:'shirt',id:'ivory-tunic',fill:'#9e7c42',outline:true,source:'M27.65 105L66.1 105L65.9 112L27.7 112Z'},
 ivoryBuckle:{category:'shirt',id:'ivory-tunic',fill:'#e2c578',outline:true,source:'M43 105L51 105L51 112L43 112Z'},
 ivoryBuckleInset:{category:'shirt',id:'ivory-tunic',fill:'#9e7c42',source:'M45 107L49 107L49 110L45 110Z'},
 silverCollar:{category:'shirt',id:'ivory-tunic',neckline:true,fill:decorationColors.crown,outline:true,source:'M26.1046 56.4524C39 61 54 61 67.7274 55.0466L66 61C54 68 40 68 28 62Z'},
 silverInner:{category:'shirt',id:'ivory-tunic',neckline:true,fill:'#ffe974',source:'M28 57C40 62 54 62 65.5 56L64.5 59C53 65 41 65 29.5 61Z'},
 silverOutline:{category:'shirt',id:'ivory-tunic',neckline:true,fill:'none',outline:true,source:'M26.1046 56.4524C39 61 54 61 67.7274 55.0466L66 61C54 68 40 68 28 62Z'},
 capeCloth:{category:'cape',id:'crimson-cape',fill:'#a91e32',outline:true,source:'M27 57C37 53 57 53 68 56C76 83 79 129 90 174C67 184 28 184 6 174C16 132 17 85 27 57Z'},
 capeLining:{category:'cape',id:'crimson-cape',fill:'#d4494a',source:'M27 59C23 101 18 143 10 172L19 174C24 132 28 95 31 61Z M64 60C68 100 75 145 85 173L77 175C67 131 64 94 61 61Z'},
 capeFolds:{category:'cape',id:'crimson-cape',fill:'#801729',source:'M30 72L25 177L29 178Z M63 72L66 178L71 177Z'},
};
const capeStyles={
 gourd:Object.fromEntries(gourdParts.map(spec=>[spec.key,spec.fill])),
 'paired-swords':Object.fromEntries(pairedSwordParts.map(spec=>[spec.key,spec.fill])),
 ...Object.fromEntries(Object.entries(angelWingVariants).map(([id,v])=>[id,Object.fromEntries(angelWingParts.map(spec=>[spec.key,v.fill]))])),
 'dual-swords':Object.fromEntries(dualSwordParts.map(spec=>[spec.key,spec.fill])),
 'greatsword':Object.fromEntries(greatswordParts.map(spec=>[spec.key,spec.fill])),
 'kappa-shell':{kappaShell:'#373d38',kappaShellRim:'none',kappaShellScutes:'none'},
  'crimson-cape':{capeCloth:'#a91e32',capeLining:'#d4494a',capeFolds:'#801729'},
  'charcoal-cape':{capeCloth:'#35383e',capeLining:'#50545c',capeFolds:'#272a30'},
  'azure-cape':{capeCloth:'#1769bd',capeLining:'#3896df',capeFolds:'#114986'},
  'solid-red-cape':{capeCloth:'#b52b39'},
  'solid-blue-cape':{capeCloth:'#1769bd'},
  'solid-black-cape':{capeCloth:'#35383e'},
};
function backAccessoryPath(spec,warp){
 if(spec.id==='gourd'||spec.id==='paired-swords'||spec.id==='angel-wings'||spec.id==='greatsword'||spec.id==='dual-swords'){
  const point=(x,y)=>applyDragPose(warp(x,y,'body'),x,y,'body',warp);
  const anchor=point(47,80),right=point(57,80),dx=right.x-anchor.x,dy=right.y-anchor.y,length=Math.hypot(dx,dy)||1;
  return transformPath(spec.source,(x,y)=>({x:anchor.x+(x-47)*dx/length-(y-80)*dy/length,y:anchor.y+(x-47)*dy/length+(y-80)*dx/length}));
 }
 return spec.id==='kappa-shell'?transformPath(spec.source,(x,y)=>applyDragPose(warp(x,y,'body'),x,y,'body',warp)):capePath(spec.source,warp);
}
function capePath(source,warp){
  const resting=warp(47,56,'body');
  const shoulder=applyDragPose(resting,47,56,'body',warp);
  const hem=warp(47,180,'legs');
  // Pose-driven sway stays periodic for looped walks and settles with drag springs.
  const pull=dragPoses.reduce((sum,pose)=>sum+(
    pose.part==='leftLeg'?pose.x*.12:pose.part==='rightLeg'?-pose.x*.12:
    pose.part==='head'||pose.part==='body'?pose.x*.22:
    /Hand$/.test(pose.part)?pose.x*.035:0),0);
  hem.x+=(shoulder.x-resting.x)*.35+7*Math.tanh(pull/7);
  return transformPath(source,(x,y)=>{
    const t=(y-56)/124;
    const side=warp(x,56,'body').x-resting.x;
    return {x:lerp(shoulder.x,hem.x,t)+side,y:lerp(shoulder.y,hem.y,t)};
  });
}
function ivorySleeveWidth(i){
  if(i>=28)return 0;
  // Hold the puff until the wrist, then turn inward along a rounded lobe.
  const turn=Math.max(0,(i-23)/5);
  return 11*smooth((i-7)/15)*Math.sqrt(Math.max(0,1-turn*turn));
}
function ivorySleeveEdges(shape,filled=false,style=null){
 const end=style?style.sleeveEnd:28;
 const edges=[[],[]];
 // Match the last original upper-arm segment's actual tangent and width.
 const join=shape.hose[5].d.match(/-?\d+(?:\.\d+)?/g).map(Number);
 const dx=join[6]-join[4],dy=join[7]-join[5],length0=Math.hypot(dx,dy)||1;
 const joinRadius=(shape.hose[5].width+1+(style?teeSleeveWidth(5,style):0))/2;
 const joinOffset={x:dy/length0*joinRadius,y:-dx/length0*joinRadius};
 // Each sample's own measurements first: where it sits, which way its two
 // edges point, how far out they would like to be, and how tightly the arm
 // turns there. The bend is read across a couple of samples either side —
 // one apart the centre line is too short a chord to measure a turn from
 // without the answer jumping about.
 const samples=[];
 for(let i=6;i<=end;i++){
   const a=shape.centerline[Math.max(0,i-1)],b=shape.centerline[i+1],p=shape.centerline[i];
   const length=Math.hypot(b.x-a.x,b.y-a.y)||1;
   const width=shape.hose[i].width;
   const before=shape.centerline[Math.max(0,i-2)];
   const after=shape.centerline[Math.min(shape.centerline.length-1,i+2)];
   const into={x:p.x-before.x,y:p.y-before.y},outOf={x:after.x-p.x,y:after.y-p.y};
   const intoLength=Math.hypot(into.x,into.y)||1;
   const outLength=Math.hypot(outOf.x,outOf.y)||1;
   const unitIn={x:into.x/intoLength,y:into.y/intoLength};
   const unitOut={x:outOf.x/outLength,y:outOf.y/outLength};
   const turn=Math.acos(Math.max(-1,Math.min(1,unitIn.x*unitOut.x+unitIn.y*unitOut.y)));
   // The normal comes off the bisector of the two directions, not the
   // chord from one neighbour to the other: where the arm folds right back
   // the two neighbours nearly meet, that chord is noise, and the edge
   // swung through half a turn between one sample and the next.
   const bisector={x:unitIn.x+unitOut.x,y:unitIn.y+unitOut.y};
   const bisectorLength=Math.hypot(bisector.x,bisector.y);
   const tangent=bisectorLength>.2
     ?{x:bisector.x/bisectorLength,y:bisector.y/bisectorLength}:unitIn;
   samples.push({p,
     radius:(width+(style?teeSleeveWidth(i===end?end-1:i,style):ivorySleeveWidth(i))+1)/2,
     normal:{x:tangent.y,y:-tangent.x},
     bend:{x:unitOut.x-unitIn.x,y:unitOut.y-unitIn.y},
     turnRadius:turn>1e-4?(intoLength+outLength)/2/(2*Math.tan(turn/2)):Infinity,
   });
 }
 // Offsetting this far from a bend makes an edge pass back through
 // itself, which drew a hook of outline floating inside the elbow. Rather
 // than trying to stop it happening — holding the offset in by the bend's
 // own radius moves single samples much further than their neighbours and
 // leaves the outline spiky — let it happen and then take the loop out.
 // The span between the two crossing segments is dropped altogether and
 // the outline carries straight across the fold: splicing in the crossing
 // point instead left a notch bitten out of the inside of the sleeve,
 // since that point lies inside the line joining the two ends. Cloth
 // bridges a fold on the outside, it does not dent inwards.
 const meeting=(a,b,c,d)=>{
   const r={x:b.x-a.x,y:b.y-a.y},s2={x:d.x-c.x,y:d.y-c.y};
   const denominator=r.x*s2.y-r.y*s2.x;
   if(Math.abs(denominator)<1e-9)return null;
   const t=((c.x-a.x)*s2.y-(c.y-a.y)*s2.x)/denominator;
   const u=((c.x-a.x)*r.y-(c.y-a.y)*r.x)/denominator;
   if(t<=0||t>=1||u<=0||u>=1)return null;
   return {x:a.x+r.x*t,y:a.y+r.y*t};
 };
 const unloop=points=>{
   for(let pass=0;pass<8;pass++){
     let cut=false;
     for(let i=0;i<points.length-2&&!cut;i++){
       // Take the longest loop first, so a tangle of several comes out in
       // one go rather than leaving smaller ones behind.
       for(let j=points.length-2;j>i+1;j--){
         const hit=meeting(points[i],points[i+1],points[j],points[j+1]);
         if(hit){points.splice(i+1,j-i);cut=true;break;}
       }
     }
     if(!cut)break;
   }
   return points;
 };
 // Cloth bridges a bend, it does not tuck into it. Offsetting every sample
 // sideways makes the inside edge follow the arm's own concave curve, which
 // bit a dent out of the sleeve wherever the elbow bent. Drop the points
 // that turn back towards the arm sharply enough to read as a dent and the
 // outline pulls taut across the fold instead; the gentle turn where the
 // sleeve tapers into the cuff is well under the threshold and stays.
 const DENT=Math.sin(7*Math.PI/180);
 const pullTaut=(points,sign)=>{
   for(let pass=0;pass<12;pass++){
     let dropped=false;
     for(let i=1;i<points.length-1;i++){
       const a=points[i-1],p=points[i],b=points[i+1];
       const into={x:p.x-a.x,y:p.y-a.y},outOf={x:b.x-p.x,y:b.y-p.y};
       const scale=Math.hypot(into.x,into.y)*Math.hypot(outOf.x,outOf.y);
       if(scale<1e-9)continue;
       const turn=-sign*(into.x*outOf.y-into.y*outOf.x)/scale;
       if(turn>DENT){points.splice(i,1);dropped=true;i--;}
     }
     if(!dropped)break;
   }
   return points;
 };
 for(let side=0;side<2;side++){
   const sign=side?1:-1;
   samples.forEach((sample,index)=>{
     const blend=smooth(index/4);
     edges[side].push({
       x:sample.p.x+lerp(sign*joinOffset.x,sign*sample.normal.x*sample.radius,blend),
       y:sample.p.y+lerp(sign*joinOffset.y,sign*sample.normal.y*sample.radius,blend)});
   });
   // Cutting a loop out can leave a corner that dents inwards in its
   // place, so the two run until neither has anything left to do.
   for(let pass=0;pass<4;pass++){
     const before=edges[side].length;
     pullTaut(edges[side],sign);
     unloop(edges[side]);
     if(edges[side].length===before)break;
   }
 }
 const pair=p=>`${clean(p.x)} ${clean(p.y)}`;
 const curve=points=>`M${pair(points[0])}`+points.slice(1).map((p,j)=>{
   const a=points[j],before=points[Math.max(0,j-1)],after=points[Math.min(points.length-1,j+2)];
   return `C${pair({x:a.x+(p.x-before.x)/6,y:a.y+(p.y-before.y)/6})} ${pair({x:p.x-(after.x-a.x)/6,y:p.y-(after.y-a.y)/6})} ${pair(p)}`;
 }).join('');
 if(filled==='cuff')return `M${pair(edges[0].at(-1))}L${pair(edges[1].at(-1))}`;
 if(filled)return curve(edges[0])+curve([...edges[1]].reverse()).replace(/^M/,'L')+'Z';
 return edges.map(curve).join('');
}
function cinchedSleeveEdges(shape,filled=false){
 return ivorySleeveEdges(shape,filled,teeStyles['cinched-long-sleeve']);
}
// Pochita's cord hangs from the body rather than being part of it: it
// keeps its own length whatever the legs do, swings a little as he
// crouches, and only shortens once its tip is on the floor.
const POCHITA_TAIL_ANCHOR = [47.514, 130.242];
// The distance from the anchor to the cord's own end. Measuring the bend
// against this exactly, rather than a round number, means the last point
// of the cord and the grip hanging off it turn by the same angle — with a
// longer figure here the cord bent less than its grip and the little
// triangle drifted off the end of the line.
const POCHITA_TAIL_LENGTH = Math.hypot(49.731 - 47.514, 157.726 - 130.242);
function pochitaTailPaths(warp, sway, ground) {
  const [ax, ay] = POCHITA_TAIL_ANCHOR;
  const anchor = applyDragPose(warp(ax, ay, 'legs'), ax, ay, 'legs', warp);
  // The cord bends along its length rather than swinging as one stiff
  // piece: each point turns by a share of the sway that grows towards the
  // tip, so the root stays where it is attached and the end trails. The
  // grip at the very end keeps its shape, turning as a whole.
  const bend = (x, y, rigid) => {
    const dx = x - ax, dy = y - ay;
    const along = rigid ? 1
      : Math.min(1, Math.hypot(dx, dy) / POCHITA_TAIL_LENGTH);
    return sway * along ** 1.4;
  };
  const place = (scale, rigid) => (x, y) => {
    const angle = bend(x, y, rigid);
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const dx = (x - ax) * scale, dy = (y - ay) * scale;
    return {x: anchor.x + dx * cos - dy * sin, y: anchor.y + dx * sin + dy * cos};
  };
  const sources = [[pochitaCordSource, false], [pochitaGripSource, true]];
  let lowest = -Infinity;
  for (const [source, rigid] of sources) {
    transformPath(source, (x, y) => {
      const point = place(1, rigid)(x, y);
      lowest = Math.max(lowest, point.y);
      return point;
    });
  }
  // Hanging free it keeps its length; resting on the floor it gives.
  const squash = lowest > ground && lowest > anchor.y
    ? Math.max(.35, (ground - anchor.y) / (lowest - anchor.y)) : 1;
  return sources.map(([source, rigid]) =>
    transformPath(source, place(squash, rigid)));
}
const shirtTopSource = 'M26.1046 56.4524L67.7274 55.0466';
// Imported reference coordinates align to the original eye and body scale.
const jobsReferencePoint=(x,y)=>({x:55.355+(x-55.6994)/.992954,y:34.4914+(y-23.7843)/.992954});
// Keep the round rim clear of the head silhouette; terminate temples on its rim.

// Frame 14.svg uses the same character, shifted upward by 10.26956.
const kappaSourcePath=d=>transformPath(d,(x,y)=>({x,y:y+10.26956}));
const kappaEyeWhite=kappaSourcePath("M48.3525 32.1096C46.5365 30.1183 46.8592 27.0241 49.7967 24.7782C52.1506 22.9981 56.9441 22.5559 58.6871 26.4246C60.4301 30.2932 56.1411 32.945 54.7818 33.4857C53.4225 34.0264 50.1685 34.1009 48.3525 32.1096Z");
const kappaHairSpecs=[{"source": "M 28.0274 23.7153 C 47.2274 37.3153 51.3604 16.2153 50.527 3.71533 L 44.027 0.715332 L 40.027 19.2153 L 32.5273 13.2153 C 28.9273 18.0153 27.694 22.2153 28.0274 23.7153 Z", "fill": "#E5E287", "stroke": "black", "role": "head"}, {"source": "M 59.5815 12.4006 C 60.562 20.3424 64.024 36.793 70.029 39.0617 C 71.2149 34.6152 70.7856 23.0579 59.5815 12.4006 Z", "fill": "#E2FFD3", "stroke": "black", "role": "head"}, {"source": "M 70.5273 34.2153 C 71.194 35.0487 73.2273 36.6153 76.0273 36.2153 L 71.5273 38.2153 L 73.0273 42.7153 L 68.0273 38.2153 L 68.0273 42.7153 L 64.0273 35.7153 C 63.5273 36.7153 61.8273 38.6153 59.0273 38.2153 C 60.0273 37.0487 62.0273 34.1153 62.0273 31.7153 C 61.5273 32.5487 60.0273 34.2153 58.0273 34.2153 C 59.0273 32.882 61.0273 29.5153 61.0273 26.7153 C 61.0273 23.9153 57.0273 21.2153 55.0273 20.2153 L 59.0273 20.2153 L 54.0273 15.2153 L 58.0273 15.2153 C 58.0273 13.9994 57.5284 11.4251 55.6203 10.0711 L 55.0273 9.71533 C 55.2387 9.82099 55.436 9.94035 55.6203 10.0711 L 60.0273 12.7153 C 61.8607 23.382 66.4273 42.3153 70.0273 36.7153 L 70.5273 34.2153 Z", "fill": "#277137", "stroke": "black", "role": "head"}, {"source": "M 48.0273 8.21533 L 46.5273 5.21533", "fill": "none", "stroke": "black", "role": "head"}].map(s=>({...s,source:kappaSourcePath(s.source)}));
const kappaSkinSpecs=[{"source": "M 76.5273 76.7153 C 73.7273 59.1153 69.0273 48.0487 67.0273 44.7153 L 67.0273 110.215 C 71.3607 106.382 79.3273 94.3153 76.5273 76.7153 Z", "fill": "#373D38", "stroke": "black", "role": "body"}, {"source": "M 36.5273 88.7153 C 39.8607 85.382 48.5273 80.7153 56.5273 88.7153", "fill": "none", "stroke": "black", "role": "body"}, {"source": "M 44.5273 94.7153 L 49.0273 97.7153", "fill": "none", "stroke": "black", "role": "body"}, {"source": "M 48.5273 94.2153 L 46.0273 98.2153", "fill": "none", "stroke": "black", "role": "body"}, {"source": "M 43.0273 29.2153 L 45.0273 30.2153", "fill": "none", "stroke": "#E76F6F", "role": "head"}, {"source": "M 43.0273 31.2153 L 45.0273 32.2153 M 43.0273 33.2153 L 45.0273 34.2153", "fill": "none", "stroke": "#E76F6F", "role": "head"}].map(s=>({...s,source:kappaSourcePath(s.source)}));
const kappaMouthFill={...kappaHairSpecs.shift(),stroke:'none'};
const kappaMouthSpecs=[kappaMouthFill,
 {source:kappaSourcePath('M28.0274 23.7153C47.2274 37.3153 51.3604 16.2153 50.527 3.71533'),fill:'none',stroke:'black',role:'head'},
 kappaHairSpecs.pop()];
kappaSkinSpecs.shift();
kappaSkinSpecs.push(...kappaMouthSpecs);
const jobsGlassesCenter={x:54.7,y:34.8},jobsGlassesRadii={x:9.05,y:10.5};
const jobsGlassesSpecs=[
 {source:'M54.7 17.054L54.7 24.3 M59.96 43.35L67.9315 50.7245',fill:'none',strokeWidth:1.1},
 {source:transformPath('M1 0C1 .552285 .552285 1 0 1C-.552285 1 -1 .552285 -1 0C-1 -.552285 -.552285 -1 0 -1C.552285 -1 1 -.552285 1 0Z',
  (x,y)=>({x:jobsGlassesCenter.x+x*jobsGlassesRadii.x,y:jobsGlassesCenter.y+y*jobsGlassesRadii.y})),fill:'#f1f1f1',opacity:.5,strokeWidth:1.1},
];
const jobsCollarEdgeSource='M26.35 56.45L26.1 50.3C38 51.3 58 52.2 67.7 49.9L67.7 55.05';
const jobsCollarSource='M26.1 50.3C38 51.3 58 52.2 67.7 49.9L67.7 63L26.5 63Z';
// Use the character's existing shoe geometry; only add a sole and laces.
function jobsSneakerPaths(shape,side){
 const pair=p=>`${clean(p.x)} ${clean(p.y)}`;
 const up=shape.shoeUp;
 const lift=p=>({x:p.x+up.x*1.8,y:p.y+up.y*1.8});
 const bottom=[shape.shoeCurves[0][2],...shape.shoeCurves[1],...shape.shoeCurves[2]];
 const top=bottom.map(lift);
 const sole=`M${pair(bottom[0])}C${bottom.slice(1,4).map(pair).join(' ')}C${bottom.slice(4).map(pair).join(' ')}L${pair(top[6])}`
   +`C${[top[5],top[4],top[3]].map(pair).join(' ')}C${[top[2],top[1],top[0]].map(pair).join(' ')}Z`;
 const mirror=side==='left'?-1:1;
 const toe={x:shape.shoeOut.x*mirror,y:shape.shoeOut.y*mirror},upAxis={x:-toe.y,y:toe.x};
 if(upAxis.x*shape.shoeUp.x+upAxis.y*shape.shoeUp.y<0){upAxis.x*=-1;upAxis.y*=-1;}
 const anchor={x:shape.bootOuter.x+toe.x*.6,y:shape.bootOuter.y+toe.y*.6};
 // The two loops and loose ends come directly from the supplied SVG.
 const laceSource='M13.7669 168.989C15.8355 170.188 19.5756 172.911 17.9869 174.202C16.3982 175.492 14.5116 171.264 13.7669 168.989Z M13.7669 168.989L10.4157 174.202 M13.5186 168.74C11.9671 167.499 8.6779 165.488 7.93319 167.375C7.18847 169.261 11.3465 169.071 13.5186 168.74Z';
 const laces=transformPath(laceSource,(x,y)=>({x:anchor.x+toe.x*(13.7669-x)+upAxis.x*(168.989-y),y:anchor.y+toe.y*(13.7669-x)+upAxis.y*(168.989-y)}));
 return {fill:shape.bootFill,outline:shape.bootOutline,sole,laces};
}
function jobsSneakerDetails(shape,side){
 const p=jobsSneakerPaths(shape,side),id=side+'-sneaker-detail-clip';
 return `<defs><clipPath id="${id}"><path d="${shape.bootFill}"/></clipPath></defs><g clip-path="url(#${id})"><path d="${p.sole}" fill="#8c8c8c" stroke="black" stroke-width=".65" stroke-linejoin="round"/></g><path d="${p.laces}" fill="none" stroke="black" stroke-width=".75" stroke-linecap="round" stroke-linejoin="round"/>`;
}
// Toe patch follows the actual morphed shoe, clipped inside its existing outline.
function colorblockShoeDetails(shape,side,toeFill='#D9D9D9'){
 const {toe,up}=shape.instepAxes,origin=shape.instep;
 const p=(x,y)=>`${clean(origin.x+toe.x*x+up.x*y)} ${clean(origin.y+toe.y*x+up.y*y)}`;
 const id=side+'-colorblock-clip';
 const boundary=`M${p(1.5,-12)}C${p(2.2,-4)} ${p(2.2,4)} ${p(1.5,12)}`;
 return `<defs><clipPath id="${id}"><path d="${shape.bootFill}"/></clipPath></defs><g clip-path="url(#${id})"><path d="${boundary}L${p(100,12)}L${p(100,-12)}Z" fill="${toeFill}"/><path d="${boundary}" fill="none" stroke="black" stroke-width="1"/></g>`;
}
// Material colours depend on distance down the cloth, never on screen height.
function jobsDenimColor(t){
 const stops=[[0,[102,124,153]],[.38,[59,99,151]],[.82,[113,128,146]],[1,[140,140,140]]];
 t=clamp01(t);let i=0;while(i<stops.length-2&&t>stops[i+1][0])i++;
 const [a,from]=stops[i],[b,to]=stops[i+1],f=smooth((t-a)/(b-a));
 return '#'+from.map((v,k)=>Math.round(lerp(v,to[k],f)).toString(16).padStart(2,'0')).join('');
}
function jobsLegColor(t){return jobsDenimColor(t);}
let jobsReferenceLegs;
function jobsMaterialReference(){
 if(jobsReferenceLegs)return jobsReferenceLegs;
 const saved=dragPoses.splice(0);
 try{
  const warp=buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  const left=legGeometry('left',warp),right=legGeometry('right',warp);
  jobsReferenceLegs={shapes:{left,right},left:left.centerline,right:right.centerline,waist:110.5,end:(left.centerline[32].y+right.centerline[32].y)/2};
 }finally{dragPoses.push(...saved);}
 return jobsReferenceLegs;
}
function jobsClothGradient(shape,index,legs=100){
 const ref=jobsMaterialReference(),source=ref[shape.side||'left'];
 const a=shape.centerline[index],b=shape.centerline[index+1],r=source[index],s=source[index+1];
 const rx=s.x-r.x,ry=s.y-r.y,dx=b.x-a.x,dy=b.y-a.y;
 const rest=Math.hypot(rx,ry)||1,now=Math.hypot(dx,dy)||.001;
 const cos=(rx*dx+ry*dy)/(rest*now),sin=(rx*dy-ry*dx)/(rest*now);
 // Deform the ORIGINAL vertical cloth coordinate, rather than replacing it
 // with a new 0–100% coordinate beginning at every thigh's centreline.
 const scale=now/rest,v={x:-sin*scale,y:cos*scale};
 const y0=r.y-ref.waist,y1=ref.end-r.y;
 return {x1:a.x-v.x*y0,y1:a.y-v.y*y0,x2:a.x+v.x*y1,y2:a.y+v.y*y1,
  from:jobsDenimColor(0),to:jobsDenimColor(1),stops:Array.from({length:33},(_,k)=>({offset:k/32,color:jobsDenimColor(k/32)}))};
}
// A continuous mesh carries material coordinates through every bend.
function jobsClothMesh(shape,side,legs=100,warp=null){
 const ref=jobsMaterialReference(),source=ref.shapes[side],parts=[[],[]];
 // Bake the material coordinates once, before any pose changes. Only the
 // positions deform afterwards; no body/screen-based recolouring is allowed.
 ref.meshUV ||= {};
 ref.meshUV[side] ||= Array.from({length:33},(_,i)=>[-1,1].map(u=>{
  const radius=(source.hose[Math.min(i,31)].width+wideLegExtraWidth(Math.min(i,31),3.5))/2+.5;
  const p=legFabricPoint(source,u*radius,source.restLength*i/32,100);
  return (p.y-ref.waist)/(ref.end-ref.waist);
 }));
 const vertex=(i,u)=>{
  const radius=(shape.hose[Math.min(i,31)].width+wideLegExtraWidth(Math.min(i,31),3.5))/2+.5;
  const p=legFabricPoint(shape,u*radius,shape.restLength*i/32,legs);
  return {x:p.x,y:p.y,t:ref.meshUV[side][i][u<0?0:1]};
 };
 const rows=Array.from({length:33},(_,i)=>[vertex(i,-1),vertex(i,1)]);
 for(let i=0;i<32;i++){
  for(const [tri,points] of [[rows[i][0],rows[i][1],rows[i+1][1]],[rows[i][0],rows[i+1][1],rows[i+1][0]]].entries()){
   const [a,b,c]=points,dx=b.x-a.x,dy=b.y-a.y,ex=c.x-a.x,ey=c.y-a.y,det=dx*ey-dy*ex;
   let g=null;
   if(Math.abs(det)>1e-7){
    const gx=((b.t-a.t)*ey-(c.t-a.t)*dy)/det,gy=(dx*(c.t-a.t)-ex*(b.t-a.t))/det,n=gx*gx+gy*gy;
    if(n>1e-12){const x=a.x-gx*a.t/n,y=a.y-gy*a.t/n;g={x1:x,y1:y,x2:x+gx/n,y2:y+gy/n};}
   }
   parts[i<19?0:1].push({d:points.map((p,k)=>`${k?'L':'M'}${clean(p.x)} ${clean(p.y)}`).join('')+'Z',
    color:g?`url(#${side}-jobs-mesh-${i*2+tri})`:jobsDenimColor(a.t),g,index:i*2+tri,points});
  }
 }
 return parts;
}
function jobsJeansDetails(warp){
 const path=(d,fill,stroke='black')=>`<path d="${torsoGarmentPath(d,warp)}" fill="${fill}" stroke="${stroke}" stroke-width=".7"/>`;
 return path('M27.6 109.3L65.95 109.3L65.9 110.5L27.7 110.5Z',jobsDenimColor(0),'none')
  +path('M27.6 109.3L65.95 109.3','none')
  +path('M27.7 110.5L65.9 110.5L65.8 115L27.8 115Z','#181818')
  +[34,58].map(x=>path(`M${x} 109L${x+2.7} 109L${x+2.7} 116L${x} 116Z`,'#3b6397')).join('')
  +path('M43.4 107.8L51.6 107.8L51.6 116L43.4 116Z','#997b46')
  +path('M45 109.4L50 109.4L50 114.4L45 114.4Z','#181818');
}
const teeNeckSource = 'M34.2 56.18C39 62.2 43 65.3 47 65.3C51 65.3 55.5 61.5 59.6 55.32';
const redTeeNeckSource = 'M34.2 56.18C39 57.5 43 58.8 47 58.8C51 58.8 55.5 57.2 59.6 55.32';
const teeSource = `M26.1046 56.4524L34.2 56.18
  C39 62.2 43 65.3 47 65.3C51 65.3 55.5 61.5 59.6 55.32
  L67.7274 55.0466L67.5459 ${RIGHT_ARMPIT_Y}
  C66.9913 84.8335 66.1 103 65.9 112L27.7 112
  C27.6 103 27.5018 84.2394 27.478 ${LEFT_ARMPIT_Y}Z`;
const redTeeSource = teeSource.replace(
  'C39 62.2 43 65.3 47 65.3C51 65.3 55.5 61.5 59.6 55.32',
  'C39 57.5 43 58.8 47 58.8C51 58.8 55.5 57.2 59.6 55.32');
const looseTopSidesSource=`M27.478 ${LEFT_ARMPIT_Y}
  C26 80 25.8 101 26 112
  M67.5459 ${RIGHT_ARMPIT_Y}C68.2 80 68.4 101 68 112`;
const looseTopHemSource='M26 112L68 112';
const looseTopSource=`M26.1046 56.4524L34.2 56.18
  C39 62.2 43 65.3 47 65.3C51 65.3 55.5 61.5 59.6 55.32
  L67.7274 55.0466L67.5459 ${RIGHT_ARMPIT_Y}
  C68.2 80 68.4 101 68 112L26 112
  C25.8 101 26 80 27.478 ${LEFT_ARMPIT_Y}Z`;
function looseTopPath(source,warp) {
  // Side fabric lies outside the torso's original bounds, but follows the
  // torso rather than the arm occupying those source coordinates.
  return transformPath(source,(x,y)=>{
    const role=y<56?'head':'body';
    return applyDragPose(warp(x,y,role),x,y,role,warp);
  });
}
function sleeveExtraWidth(index,end,flare) {
  return index<end?flare*smooth(index/(end-1)):0;
}
const scoopTeeNeckSource='M26.1046 56.4524C34 58 40 66 47 65C57 65 59 54 67.7274 55.0466';
const scoopTeeHemSource='M28 116C37 115 47 108.5 54.5 108.5C60 108.5 64 112 66 114.5';
const scoopTeeSidesSource=`M27.478 ${LEFT_ARMPIT_Y}C27.4 85 27.5 102 28 116M67.5459 ${RIGHT_ARMPIT_Y}C66.8 85 66.2 102 66 114.5`;
const scoopTeeSource=scoopTeeNeckSource+`L67.5459 ${RIGHT_ARMPIT_Y}C66.8 85 66.2 102 66 114.5C64 112 60 108.5 54.5 108.5C47 108.5 37 115 28 116C27.5 102 27.4 85 27.478 ${LEFT_ARMPIT_Y}Z`;
const roundLongSleeveStyle={sleeveEnd:31,flare:3};
const teeStyles = {
  'gray-scoop-tee':{color:'#7B7575',sleeveEnd:20,flare:3,bodySource:scoopTeeSource,sidesSource:scoopTeeSidesSource,neckSource:scoopTeeNeckSource,hemSource:scoopTeeHemSource},
  'black-turtleneck-tee':{color:'#101010',sleeveEnd:23,flare:2.5},
  'loose-tee':{color:decorationColors.looseTee,sleeveEnd:20,flare:5,loose:true,hemOverPants:true},
  'loose-long-sleeve':{color:decorationColors.looseLongSleeve,sleeveEnd:31,flare:7,loose:true,hemOverPants:true},
  'cinched-long-sleeve':{color:decorationColors.yellowTee,sleeveEnd:31,flare:1,loose:true,cinched:true,hemOverPants:true},
  'yellow-tee': {color:decorationColors.yellowTee,sleeveEnd:20,flare:2.5},
  'patched-tee': {color:decorationColors.patchedTee,sleeveEnd:20,flare:2.5},
  'coral-tee': {color:decorationColors.coralTee,sleeveEnd:17,flare:3},
  'red-cropped-tee-2':{color:'#DE0C0C',sleeveEnd:17,flare:3},
  'black-cropped-tee':{color:'#25272B',sleeveEnd:17,flare:3},
};
// Keep the sleeve full through the forearm, then ease into the wrist.
function teeSleeveWidth(index,style){
  if(!style)return 0;
  if(!style.cinched)return sleeveExtraWidth(index,style.sleeveEnd,style.flare);
  if(index>=style.sleeveEnd)return 0;
  const full=sleeveExtraWidth(index,style.sleeveEnd,7);
  if(index<=23)return full;
  // A rounded inward turn, rather than an S-shaped taper that the cloth
  // tension pass would flatten into a straight diagonal.
  const turn=Math.min(1,(index-23)/7);
  return style.flare+(full-style.flare)*Math.sqrt(Math.max(0,1-turn*turn));
}
const patchSources = {
  blue: 'M55.7 77.5L65.4 77.5L65.1 91.8L55.5 90.8Z',
  red: 'M28.4 93.5L38.2 93.5L38.2 105.5L28.6 106Z',
  stitches: `M57 76.3L57 79M62 76.3L62 79M54.6 82L57.3 82M54.4 87L57.2 87
    M61 90L61 92.6M65 81L67 81M65 87L67 87
    M31 92L31 95M36 92L36 95M27.5 98L30 98M27.5 103L30 103
    M33 104L33 107M38 98L40.5 98M38 103L40.5 103`,
};
const jumpsuitSource = `M26.1046 56.4524L67.7274 55.0466L67.5459 ${RIGHT_ARMPIT_Y}
  C66.9913 84.8335 65.8489 120.018 65.8486 125.059
  C63.5 127.5 54 131.8 49.4914 132.8
  C48.4 132.3 45.9 132.3 44.6804 132.8
  C40 131.8 31 127.5 28.4591 125.881
  C27.6312 116.11 27.5018 84.2394 27.478 ${LEFT_ARMPIT_Y}Z`;
const jumpsuitSidesSource = `M27.478 ${LEFT_ARMPIT_Y}
  C27.5018 84.2394 27.6312 116.11 28.4591 125.881
  M67.5459 ${RIGHT_ARMPIT_Y}
  C66.9913 84.8335 65.8489 120.018 65.8486 125.059`;
// Extend the open chest well into the head: the garment layer sits above it,
// so the cutout must also remove the suit's otherwise visible top edge.
const jumpsuitChestSource = 'M34.5 35L59.5 35L59.5 67.8L34.5 67.8Z';
// Each upright starts on the torso's own top line, which is slanted: a flat
// 55.7 for both sat above that line on the left and poked a stub out past the
// strap, while on the right the same value fell below it and was covered.
const jumpsuitChestOutlineSource =
  'M34.5 56.1689L34.5 67.8L59.5 67.8L59.5 55.3245';
const jumpsuitNeckSources = {
  left:'M26.1046 56.4524L34.5 56.1689',
  right:'M59.5 55.3245L67.7274 55.0466',
};
const jumpsuitShoulderSources = {
  left:`M26.1046 56.4524C26.8 59.5 27.3 63 27.478 ${LEFT_ARMPIT_Y}`,
  right:`M67.7274 55.0466C67.65 58.5 67.55 62 67.5459 ${RIGHT_ARMPIT_Y}`,
};

function garmentPath(source, warp) {
  return transformPath(source, (x,y) => {
    const role=classifyPoint(x,y,'mixed');
    const point=warp(x,y,role);
    return applyDragPose(point,x,y,role,warp);
  });
}
// Color the lower torso itself, rather than stacking fabric on a grey
// copy of the same edge: antialiased grey pixels otherwise survive at hips.
function jobsPelvisAxis(warp){
  const point=x=>applyDragPose(warp(x,110.5,'body'),x,110.5,'body',warp);
  const a=point(27.7),b=point(65.9),span=Math.hypot(b.x-a.x,b.y-a.y)||1;
  const center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
  // Material length comes from the unposed proportions. The pelvis axis is
  // perpendicular to its own waist, never aimed at either moving leg.
  const ref=jobsMaterialReference();
  const top=warp(47,ref.waist,'body'),bottom=warp(47,ref.end,'legs');
  const length=Math.abs(bottom.y-top.y);
  return {x1:center.x,y1:center.y,x2:center.x-(b.y-a.y)/span*length,y2:center.y+(b.x-a.x)/span*length};
}
function updateTorsoMaterial(node,warp) {
  // Triangular briefs use their own garment path; never tint the whole lower torso.
  const colors={'black-gray-sweatpants':'#373737','white-loose-wide-trousers':'#FAFAF7','space-trousers':'#FF8215',...Object.fromEntries(Object.entries(boxerVariants).map(([id,item])=>[id,item.color])),'dark-gray-slight-wide-trousers':'#2B2D2D','black-slight-wide-trousers':'#101011',...workerPantsColors,'batfish-trousers':decorationColors.batArmor,'ivory-trousers':decorationColors.royalWhite,'royal-trousers':decorationColors.royalWhite,plain:decorationColors.pants,'suit-trousers':decorationColors.suitNavy,
    'denim-jumpsuit':decorationColors.denimBlue,'large-ripped-denim-jeans':decorationColors.denimBlue,'washed-denim-jeans':decorationColors.denimBlue,'ripped-denim-jeans':decorationColors.denimBlue,'denim-jeans':decorationColors.denimBlue,'wide-pants':decorationColors.widePants,'loose-wide-pants':decorationColors.widePants,
    'green-ultra-shorts':'#264F02','student-shorts':'#102f68','pink-shorts':decorationColors.pinkShorts,'orange-shorts':decorationColors.orangeShorts,
    'black-shorts':decorationColors.blackShorts,
    'slight-wide-shorts':decorationColors.wideShorts,'extra-wide-shorts':decorationColors.wideShorts,
    'red-shorts':decorationColors.redShorts,
    jumpsuit:decorationColors.jumpsuit,'navy-jumpsuit':decorationColors.navyJumpsuit};
  const color=denimVariants[selectedDecorations.pants]?.color||workwearVariants[selectedDecorations.pants]?.color||colors[selectedDecorations.pants];
  const gradientSkin=!!skinTrait('gradient');
  const patterned=selectedDecorations.pants==='loose-wide-pants';
  const jobs=selectedDecorations.pants==='jobs-gradient-jeans';
  if(torsoMaterial.upperSkin){
    torsoMaterial.upperSkin.style.display=patterned||jobs||gradientSkin&&color?'':'none';
    // The torso above the waistband is bare skin, so it follows the chosen
    // skin color instead of the default grey.
    torsoMaterial.upperSkin.setAttribute('fill',skinColor());
  }
  torsoMaterial.upper?.forEach(stop=>stop.setAttribute('stop-color',gradientSkin?'#9FFF5B':skinColor()));
  if(!color){node.setAttribute('fill',skinColor());return;}
  const point=x=>applyDragPose(warp(x,110.5,'body'),x,110.5,'body',warp);
  const a=point(27.7),b=point(65.9),span=Math.hypot(b.x-a.x,b.y-a.y)||1;
  const normal={x:-(b.y-a.y)/span,y:(b.x-a.x)/span};
  const center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
  if(jobs&&jobsPelvisGradient){
    for(const [key,value] of Object.entries(jobsPelvisAxis(warp)))jobsPelvisGradient.setAttribute(key,value);
  }
  for(const [key,value] of Object.entries({
    x1:center.x-normal.x*1000,y1:center.y-normal.y*1000,
    x2:center.x+normal.x*1000,y2:center.y+normal.y*1000,
  }))torsoMaterial.gradient.setAttribute(key,value);
  torsoMaterial.lower.forEach(stop=>stop.setAttribute('stop-color',color));
  node.setAttribute('fill',patterned||jobs?widePantsPaint():'url(#torso-material)');
  if((patterned||jobs||gradientSkin)&&torsoMaterial.fabric){
    const right={x:normal.y,y:-normal.x};
    if(patterned)torsoMaterial.fabric.setAttribute('patternTransform',
      `matrix(${right.x} ${right.y} ${normal.x} ${normal.y} ${center.x} ${center.y})`);
    const corner=(side,depth)=>`${center.x+right.x*side*1000-normal.x*depth} ${center.y+right.y*side*1000-normal.y*depth}`;
    torsoMaterial.upperClip.setAttribute('points',
      [corner(-1,0),corner(1,0),corner(1,2000),corner(-1,2000)].join(' '));
    torsoMaterial.upperSkin.setAttribute('d',node.getAttribute('d'));
    // Sit immediately on top of the torso itself. Anything inserted at the
    // front of the body layer since — Pochita's tail, for one — shifts the
    // torso down the list, and a patch left behind it covers nothing.
    if(torsoMaterial.upperSkin.previousSibling!==node)
      node.parentNode.insertBefore(torsoMaterial.upperSkin,node.nextSibling);
  }
}
function redTrianglePath(warp) {
  // The neckline follows the head, but the bottom corners are the same
  // leg-mapped landmarks as the body's crotch, including leg-length changes.
  return transformPath(redTriangleSource,(x,y)=>{
    const role=y<70?'head':y>=126?'legs':'body';
    return applyDragPose(warp(x,y,role),x,y,role,warp);
  });
}
function torsoGarmentPath(source,warp,followHead=false) {
  return transformPath(source,(x,y)=>{
    const role=followHead&&y<70?'head':'body';
    return applyDragPose(warp(x,y,role),x,y,role,warp);
  });
}
// One continuous skirt follows the waist, never either individual leg.
// Shorten its drop during a squat so the hem stays above the planted feet.
function skirtPath(warp,legs=100) {
  const at=x=>applyDragPose(warp(x,110.5,'body'),x,110.5,'body',warp);
  const a=at(27.7),b=at(65.9);
  const width=Math.hypot(b.x-a.x,b.y-a.y)||1;
  const right={x:(b.x-a.x)/width,y:(b.y-a.y)/width};
  const down={x:-right.y,y:right.x};
  const compression=smooth(bodyCompression(warp).amount/legCompressionLimit(warp).limit);
  const drop=(25+legs*.17)*(1-.6*compression);
  const flare=width*.3;
  const point=(p,x,y)=>`${clean(p.x+right.x*x+down.x*y)} ${clean(p.y+right.y*x+down.y*y)}`;
  return `M${point(a,0,0)}L${point(b,0,0)}L${point(b,flare,drop)}`
    +`Q${point(a,width/2,drop+4)} ${point(a,-flare,drop)}Z`;
}
function wearingJumpsuit() {
  return selectedDecorations.pants==='jumpsuit'
    ||selectedDecorations.pants==='navy-jumpsuit'||!!workwearVariants[selectedDecorations.pants];
}
const widePantFlares = {'black-gray-sweatpants':9.25,'white-loose-wide-trousers':10.5,'space-trousers':9.25,'dark-gray-slight-wide-trousers':3.5,'black-slight-wide-trousers':3.5,'worker-trousers':5.5,'blue-worker-trousers':5.5,...Object.fromEntries([...Object.keys(denimVariants),...Object.keys(workwearVariants)].map(id=>[id,5.5])),'jobs-gradient-jeans':3.5,'denim-jumpsuit':5.5,'large-ripped-denim-jeans':5.5,'washed-denim-jeans':5.5,'ripped-denim-jeans':5.5,'denim-jeans':5.5,'ivory-trousers':8,'royal-trousers':3,'suit-trousers':3.5,'wide-pants':5.5,'loose-wide-pants':10.5};
// Same knee-length cut as the fitted shorts, widening toward its open hem.
// How much each flared knee cut widens towards its hem.
const kneeShortFlares={'green-ultra-shorts':3,'student-shorts':3,'slight-wide-shorts':3,'extra-wide-shorts':8};
// How far down the leg a pair of shorts ends. The ultra shorts stop at 11
// rather than nearer the knee: a hem that ends close to 19 is within reach
// of the calf once the knee folds, and its cut edge then crosses the bare
// shin instead of sitting above it.
function shortsHemIndex(pants=selectedDecorations.pants){return ['student-shorts','green-ultra-shorts'].includes(pants)?11:19;}
function wideShortsExtraWidth(index,flare=10,end=19) {
  return flare*smooth(Math.min(index,end)/end);
}
function wideLegExtraWidth(index,flare=5.5) {
  // Astronaut legs widen evenly toward the cuff, without a bulging middle.
  if(flare===9.25)return 8*clamp01(index/31);
  return flare*smooth((index/31-.04)/.9);
}

function wideLegEnd(shape,legs=100) {
  const ankle=shape.centerline[32],before=shape.centerline[30];
  const length=Math.hypot(ankle.x-before.x,ankle.y-before.y)||1;
  // At short leg lengths the shoe upper rises above the ankle. Let the
  // fabric cover that hump while leaving the original hem at normal length.
  const overlap=4.5*smooth((100-legs)/50);
  return {x:ankle.x+(ankle.x-before.x)/length*overlap,
    y:ankle.y+(ankle.y-before.y)/length*overlap};
}
function wideLegLastPath(shape,legs=100) {
  const end=wideLegEnd(shape,legs);
  return shape.hose[31].d+`L${clean(end.x)} ${clean(end.y)}`;
}
function wideLegHemPoints(shape,flare=5.5,legs=100) {
  const end=wideLegEnd(shape,legs),before=shape.centerline[30];
  const length=Math.hypot(end.x-before.x,end.y-before.y)||1;
  const radius=(shape.hose[31].width+1+wideLegExtraWidth(31,flare))/2;
  const nx=(end.y-before.y)/length,ny=-(end.x-before.x)/length;
  return [{x:end.x+nx*radius,y:end.y+ny*radius},
    {x:end.x-nx*radius,y:end.y-ny*radius}];
}
const JEANS_STROKE_WIDTH=.65;
const jeansDetailSpecs=[
 {source:'M46 115L46 124.5C46 126 47.5 126 49 124.5',stroke:'black'},
 {source:'M35 115C35 118 31.5 120 28 120.8 M59 115C59 118 62.5 120 65.7 120.8',stroke:'black'},
];
function jeansDetailsMarkup(warp,id=selectedDecorations.pants){
 if(id==='jobs-gradient-jeans')return jobsJeansDetails(warp);
 const path=(source,fill,stroke='black')=>`<path d="${torsoGarmentPath(source,warp)}" fill="${fill}" stroke="${stroke}" stroke-width="${JEANS_STROKE_WIDTH}" stroke-linejoin="round" stroke-linecap="round"/>`;
 return path('M27.7 110.5L65.9 110.5L65.7 114.3L27.8 114.3Z','#705039')
  +[34.2,58.2].map(x=>path(`M${x} 110.1L${x+2} 110.1L${x+2} 115L${x} 115Z`,denimColor(id),'black')).join('')
  +jeansDetailSpecs.map(({source,stroke})=>path(source,'none',stroke)).join('')
  +path('M44 110.5L50 110.5L50 114.5L44 114.5Z','#d5b36b')
  +path('M45.5 111.6L48.5 111.6L48.5 113.4L45.5 113.4Z','#705039','none');
}
// Muted workwear belt with broad denim keepers and a plain chest pocket.
function denimBibMarkup(warp,id=selectedDecorations.pants){
 const path=(d,fill='none',stroke='black')=>`<path d="${torsoGarmentPath(d,warp)}" fill="${fill}" stroke="${stroke}" stroke-width="${JEANS_STROKE_WIDTH}" stroke-linejoin="round" stroke-linecap="round"/>`;
 return path('M49.5 74L62 74L62 83.5L55.75 86.3L49.5 83.5Z',denimColor(id))
  +path('M27.7 110.5L65.9 110.5L65.7 114.3L27.8 114.3Z',workwearVariants[id]?.belt||'#46535b')
  +[30.8,39,51.2,59.3].map(x=>path(`M${x} 110L${x+3.8} 110L${x+3.8} 115L${x} 115Z`,denimColor(id),'none')
    +path(`M${x} 110L${x} 115 M${x+3.8} 110L${x+3.8} 115`)).join('')
  +path('M44.5 110.3L49.5 110.3L49.5 114.6L44.5 114.6Z',workwearVariants[id]?.buckle||'#89959b')
  +jeansDetailSpecs.map(({source})=>path(source)).join('');
}
// Uneven clusters: one large opening, two medium ones, and nearby slits.
function largeJeansCuts(part,side){
 const cuts=side==='left'
  ?[[12.5,-.3,4.3,2.05],[24.7,.5,2.8,1.05],
    [9.7,-1.6,1.3,.24],[15.2,.9,1.65,.3],[11.2,4.1,.65,.35],
    [23,-1.3,1.15,.24],[26.5,1.5,.85,.22]]
  :[[16,.6,3.05,1.2],[13.9,-.8,1.45,.25],[17.9,1.4,1.1,.28],
    [15.3,-3.2,.7,.35]];
 return cuts.filter(([i])=>part?i>=19:i<19);
}
// Openings are cut out of the denim, with a separate live skin underlay.
function largeJeansHoles(shape,part,side,legs=100){
 return largeJeansCuts(part,side).map(([i,a,w,h])=>{
  const map=(x,y)=>legFabricPoint(shape,a+x,shape.restLength*(i+y)/32,legs);
  return transformPath(`M${-w} ${-.6*h}L${-w*.6} ${-h}L-.5 ${-.8*h}L${w*.55} ${-h}L${w} ${-.5*h}L${w*.85} ${h*.65}L${w*.3} ${h}L-.6 ${h*.8}L${-w*.85} ${h*.7}Z`,map);
 });
}
function largeJeansThreads(shape,part,side,legs=100){
 return largeJeansCuts(part,side).map(([i,a,w,h])=>{
  const map=(x,y)=>legFabricPoint(shape,a+x,shape.restLength*(i+y)/32,legs);
  // Sparse horizontal weft across the opening; loose ends hang from its rim.
  const source=h>.7
   ?`M${-w*.9} ${-h*.35}C${-w*.3} ${-h*.1} ${w*.35} ${-h*.5} ${w*.96} ${-h*.2} M${-w*.87} ${h*.35}C${-w*.25} ${h*.1} ${w*.3} ${h*.65} ${w*.9} ${h*.45} M${-w*.55} ${-h}L${-w*.46} ${-h*.35} M${w*.45} ${-h*.9}L${w*.38} ${-h*.35} M${-w*.25} ${h*.8}L${-w*.35} ${h*1.28} M${w*.65} ${h*.75}L${w*.8} ${h*1.15}`
   :`M${-w} 0L${w*.9} .08 M${-w*.5} ${h}L${-w*.4} ${h+.35}`;
  return `<path d="${transformPath(source,map)}" fill="none" stroke="#e0e5db" stroke-width=".28" stroke-linecap="round"/>`;
 }).join('');
}
// A heavier lower/right cut edge makes the opening read as thick cloth.
function largeJeansCutEdges(shape,part,side,legs=100){
 return largeJeansCuts(part,side).filter(([, , ,h])=>h>.7).map(([i,a,w,h])=>{
  const map=(x,y)=>legFabricPoint(shape,a+x,shape.restLength*(i+y)/32,legs);
  const source=`M${w} ${-.5*h}L${w*.85} ${h*.65}L${w*.3} ${h}L-.6 ${h*.8}L${-w*.85} ${h*.7}`;
  return `<path d="${transformPath(source,map)}" fill="none" stroke="#203b50" stroke-width="1.05" stroke-linejoin="round" stroke-linecap="round"/>`;
 }).join('');
}
function jeansLegSeam(shape,part,legs=100,side='left'){
 const start=part?19:4,end=part?32:19;
 return [side==='left'?-1:1].map(sign=>Array.from({length:end-start+1},(_,j)=>{
  const i=start+j,k=Math.min(i,31);
  const across=sign*Math.max(0,(shape.hose[k].width+wideLegExtraWidth(k,5.5))/2-1.5);
  const point=legFabricPoint(shape,across,shape.restLength*i/32,legs);
  return `${j?'L':'M'}${clean(point.x)} ${clean(point.y)}`;
 }).join('')).join('');
}
// Texture lives in the cloth's across/along coordinates, not the canvas.
function jeansTextureMarkup(shape,part,side,id,legs=100){
 const variant=denimVariants[id];
 id=variant?.finish||id;
 const point=(across,index)=>legFabricPoint(shape,across,shape.restLength*index/32,legs);
 const pair=p=>`${clean(p.x)} ${clean(p.y)}`;
 if(id==='jobs-gradient')return ''; // One shared continuous material, no overlaid colour bands.
 if(id==='washed-denim-jeans'){
  let markup='';
  const start=part?19:3,end=part?32:19;
  for(let i=start;i<end;i++)for(let band=0;band<15;band++){
   const u=-.82+band*1.64/15,v=u+1.64/15;
   const radius=j=>(shape.hose[Math.min(j,31)].width+wideLegExtraWidth(Math.min(j,31),5.5))/2;
   const points=[point(u*radius(i),i),point(v*radius(i),i),point(v*radius(i+1),i+1),point(u*radius(i+1),i+1)];
   const fade=Math.sin(Math.PI*(i-start+.5)/(end-start));
   const opacity=.4*Math.exp(-5*((u+v)/2)**2)*Math.sqrt(fade);
   markup+=`<path d="${points.map((p,k)=>`${k?'L':'M'}${pair(p)}`).join('')}Z" fill="${variant?.wash||'#c1d8e7'}" opacity="${opacity.toFixed(3)}"/>`;
  }
  return markup;
 }
 if(id==='large-ripped-denim-jeans')return largeJeansHoles(shape,part,side,legs).map(d=>`<path d="${d}" fill="none" stroke="#294b65" stroke-width=".55"/><path d="${d}" fill="none" stroke="#dce3dc" stroke-width=".45" stroke-dasharray="1.2 2.8"/>`).join('')+largeJeansCutEdges(shape,part,side,legs)+largeJeansThreads(shape,part,side,legs);
 if(id!=='ripped-denim-jeans')return '';
 const cuts=side==='left'?[[11,-1,2.3],[24,.6,1.7]]:[[15,.7,2.1]];
 return cuts.filter(([index])=>part?index>=19:index<19).map(([index,across,width])=>{
  const map=(x,y)=>point(across+x,index+y);
  const edge=transformPath(`M${-width} -.55L-.9 -.8L0 -.5L1 -.75L${width} -.35L${width-.3} .6L.5 .85L-.4 .5L${-width+.1} .7Z`,map);
  const threads=transformPath(`M${-width} -.9L${-width-.5} -.2 M${width} -.5L${width+.5} .25 M-1.2 -.55L-1 .65 M.3 -.5L.5 .6 M1.2 -.5L1.1 .55`,map);
  return `<path d="${edge}" fill="${skinColor()}" stroke="#294b65" stroke-width=".45" stroke-linejoin="round"/><path d="${threads}" fill="none" stroke="#dce3dc" stroke-width=".4" stroke-linecap="round"/>`;
 }).join('');
}
function wideLegHemPath(shape,flare=5.5,legs=100) {
  const [a,b]=wideLegHemPoints(shape,flare,legs);
  return `M${clean(a.x)} ${clean(a.y)}L${clean(b.x)} ${clean(b.y)}`;
}
// A short ankle continues the foot's own upright direction. Its width and
// direction never depend on the flared trouser opening.
function extendedShoe(shape,extension=3) {
  const point=p=>`${clean(p.x)} ${clean(p.y)}`;
  const outer={x:shape.bootOuter.x+shape.shoeUp.x*extension,
    y:shape.bootOuter.y+shape.shoeUp.y*extension};
  const inner={x:shape.bootInner.x+shape.shoeUp.x*extension,
    y:shape.bootInner.y+shape.shoeUp.y*extension};
  const outline=shape.bootOutline.replace(/^M[^C]+/,
    `M${point(outer)}L${point(shape.bootOuter)}`)+`L${point(inner)}`;
  return {fill:outline+'Z',outline};
}

function batGlovePaths(shape) {
  const edges=[-1,1].map(sign=>Array.from({length:8},(_,j)=>{
    const i=j+25,p=shape.centerline[i];
    const a=shape.centerline[i-1],b=shape.centerline[Math.min(32,i+1)];
    const len=Math.hypot(b.x-a.x,b.y-a.y)||1;
    const radius=(shape.hose[Math.min(i,31)].width+1)/2+(32-i)/7*.8;
    return {x:p.x+sign*(b.y-a.y)/len*radius,y:p.y-sign*(b.x-a.x)/len*radius};
  }));
  const points=[...edges[0].slice().reverse(),...edges[1]];
  const outline=points.map((p,i)=>`${i?'L':'M'}${clean(p.x)} ${clean(p.y)}`).join('');
  return {fill:outline+'Z',outline};
}

function cuffPath(shape, index, extraWidth=0, inset=0) {
  const a=shape.centerline[index-1],b=shape.centerline[index+1];
  const point=shape.centerline[index];
  const length=Math.hypot(b.x-a.x,b.y-a.y) || 1;
  const radius=(shape.hose[index].width+1+extraWidth)/2;
  const nx=(b.y-a.y)/length,ny=-(b.x-a.x)/length;
  const x=point.x-(b.x-a.x)/length*inset;
  const y=point.y-(b.y-a.y)/length*inset;
  return `M${clean(x+nx*radius)} ${clean(y+ny*radius)}`
    +`L${clean(x-nx*radius)} ${clean(y-ny*radius)}`;
}
// Open side edges only: a stroked tube also has a proximal round cap,
// which is not a seam in continuous trouser fabric.
// `toMouth` finishes each edge on the shoe's own mouth corner instead of
// on the leg tube's end. A boot's shaft and its shoe are one piece of
// leather, so their outlines have to meet: ending on the tube left the two
// black lines a fraction apart and a nick of background showed between
// them on the outer side when the leg was pulled long.
// Ultra shorts and a boot have TWO distinct material boundaries. The normal
// boot partition stays at the knee; these clips additionally retain the higher
// shorts opening and confine exposed skin to the band between both seams.
function updateShortsBootPartition({side,segments,ultraShortsClip,exposedThighClip},shape,shortsEnd) {
  ultraShortsClip.setAttribute('points',limbClipPoints(shape,shortsEnd,false));
  exposedThighClip.setAttribute('points',limbClipPoints(shape,shortsEnd,true));
  exposedThighClip.ownerClip.setAttribute('clip-path',`url(#${side}-shorts-hem-clip)`);
  segments.forEach(({back,front},i)=>{
    if(i<Math.max(0,shortsEnd-6)||i>=19)return;
    const clip=`url(#${side}-${i<shortsEnd?'ultra-shorts':'exposed-thigh'}-hem-clip)`;
    for(const node of [back,front]){
      node.setAttribute('clip-path',clip);
      if(i>=shortsEnd-3&&i<=shortsEnd+4)node.setAttribute('stroke-linecap','butt');
    }
  });
}
function updateLegClothPartition(parts,end){
 const {segments,rootBlack,thighBlack,shinBlack,thighSkin,shinSkin}=parts;
 if(shinSkin.clothPartitionEnd===end)return;
 const fronts=new Set(segments.map(s=>s.front));
 for(const [i,{back}] of segments.entries()){
  const parent=i<3?rootBlack:i<end?thighBlack:shinBlack;
  if(back.parentNode!==parent)parent.appendChild(back);
 }
 for(const [parent,lower] of [[thighSkin,false],[shinSkin,true]]){
  const anchor=[...parent.children].find(node=>!fronts.has(node))||null;
  for(const [i,{front}] of segments.entries())if((i>=end)===lower)parent.insertBefore(front,anchor);
 }
 shinSkin.clothPartitionEnd=end;
}
function trouserCalfEdges(shape,flare=0,legs=100,toMouth=false,extraWidth=null,startIndex=19) {
  return [-1,1].map(side=>{
    const points=[];
    for(let i=startIndex;i<=32;i++) {
      const point=i===32&&flare?wideLegEnd(shape,legs):shape.centerline[i];
      // Match the hem tangent exactly at the terminal corner.
      const before=shape.centerline[i===32&&flare?30:i-1];
      const after=i===32?point:shape.centerline[i+1];
      const length=Math.hypot(after.x-before.x,after.y-before.y)||1;
      const radius=(shape.hose[Math.min(i,31)].width+1
        +(extraWidth?extraWidth(i):flare?wideLegExtraWidth(Math.min(i,31),flare):0))/2;
      const edge={x:point.x+side*(after.y-before.y)/length*radius,
        y:point.y-side*(after.x-before.x)/length*radius};
      if(toMouth&&i===32) {
        const corner=[shape.bootOuter,shape.bootInner].reduce((near,candidate)=>
          Math.hypot(candidate.x-edge.x,candidate.y-edge.y)
            <Math.hypot(near.x-edge.x,near.y-edge.y)?candidate:near);
        points.push({x:corner.x,y:corner.y});
      } else points.push(edge);
    }
    return points.map((p,i)=>`${i?'L':'M'}${clean(p.x)} ${clean(p.y)}`).join('');
  }).join('');
}
function limbClipPoints(shape,index,towardEnd) {
  const before=shape.centerline[index-1],after=shape.centerline[index+1];
  const point=shape.centerline[index];
  const length=Math.hypot(after.x-before.x,after.y-before.y)||1;
  const along={x:(after.x-before.x)/length,y:(after.y-before.y)/length};
  const across={x:-along.y,y:along.x};
  const direction=towardEnd?1:-1;
  const corner=(side,depth)=>`${clean(point.x+across.x*side*500+along.x*depth*direction)} ${clean(point.y+across.y*side*500+along.y*depth*direction)}`;
  return [corner(-1,0),corner(1,0),corner(1,500),corner(-1,500)].join(' ');
}
// Keep continuous trouser fabric on the leg side of the actual shoe mouth.
function ankleHemClipPoints(shape) {
  const a=shape.bootOuter,b=shape.bootInner;
  const middle={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
  const length=Math.hypot(b.x-a.x,b.y-a.y)||1;
  const across={x:(b.x-a.x)/length,y:(b.y-a.y)/length};
  let along={x:-across.y,y:across.x};
  const toward=shape.centerline[24];
  if((toward.x-middle.x)*along.x+(toward.y-middle.y)*along.y<0)
    along={x:-along.x,y:-along.y};
  const corner=(side,depth)=>`${clean(middle.x+across.x*side*500+along.x*depth)} ${clean(middle.y+across.y*side*500+along.y*depth)}`;
  return [corner(-1,0),corner(1,0),corner(1,500),corner(-1,500)].join(' ');
}
function legEndClipPoints(shape,legs=100) {
  const end=wideLegEnd(shape,legs),before=shape.centerline[30];
  const length=Math.hypot(end.x-before.x,end.y-before.y)||1;
  const along={x:(end.x-before.x)/length,y:(end.y-before.y)/length};
  const across={x:-along.y,y:along.x};
  const corner=(side,depth)=>`${clean(end.x+across.x*side*500-along.x*depth)} `
    +`${clean(end.y+across.y*side*500-along.y*depth)}`;
  return [corner(-1,0),corner(1,0),corner(1,500),corner(-1,500)].join(' ');
}
// Paint the head before the hands: its fill otherwise erases the first few
// pixels of each shoulder contour, leaving a notch that extra strokes cannot
// join cleanly. Dragged parts are still promoted by updatePartOrder().
const layerOrder = ['leftLeg','rightLeg','body','head','leftHand','rightHand'];
// Whether each arm has swung clear of the shoulder line. The garment only
// consults it when the top is sleeveless, but the scarf needs it regardless,
// so the geometric test is kept separate from that condition.
const armRaised = {left:false,right:false};
const armInFront = {left:false,right:false};
const legInFront = {left:false,right:false};
function hasSleevelessOutfit() {
  // Sleeveless shirts, dungarees and open outerwear cover resting shoulders.
  return !!decorationCatalog.pants.find(item=>item.id===selectedDecorations.pants)?.sleeveless
    ||!!decorationCatalog.shirt.find(item=>item.id===selectedDecorations.shirt)?.sleeveless
    ||!!decorationCatalog.outerwear.find(item=>item.id===selectedDecorations.outerwear)?.sleeveless;
}
function placeNeckGarmentBelowAccessories(node,outerwear=false) {
  // All inner collars share one layer so garment surfaces can occlude every
  // present and future neckline, while the open chest stays visible.
  if(!outerwear&&innerNecklineLayer)innerNecklineLayer.appendChild(node);
  else neckOverlay.insertBefore(node,scarfPaths[0]?.node||null);
}
function createOuterwearNecklineOcclusion(defs,necklineMask) {
  // Reference the live outerwear artwork rather than maintaining a second
  // contour. A black, alpha-preserving copy covers inner collars only where
  // actual cloth/lapels are painted, retaining open fronts and transparency.
  const silhouette=document.createElementNS(SVG_NS,'filter');
  silhouette.id='neckline-outerwear-silhouette';
  silhouette.setAttribute('filterUnits','userSpaceOnUse');
  for(const [key,value] of Object.entries({x:-1000,y:-1000,width:2000,height:2000}))silhouette.setAttribute(key,value);
  const black=document.createElementNS(SVG_NS,'feColorMatrix');
  black.setAttribute('type','matrix');
  black.setAttribute('values','0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0');
  silhouette.appendChild(black);
  // Retain a subpixel overlap under the real coat edge: cutting both layers
  // at the same antialiased boundary exposes a light seam between them.
  const overlap=document.createElementNS(SVG_NS,'feMorphology');
  overlap.setAttribute('operator','erode');overlap.setAttribute('radius','0.35');
  silhouette.appendChild(overlap);defs.appendChild(silhouette);
  const outerwearOcclusion=document.createElementNS(SVG_NS,'g');
  outerwearOcclusion.setAttribute('filter','url(#neckline-outerwear-silhouette)');
  outerwearOcclusion.setAttribute('data-neckline-outerwear-occlusion','');
  for(const key of ['alohaBody','greenVestLeft','greenVestRight']){
    garmentPaths[key].setAttribute('id',`neckline-occluder-${key}`);
    const use=document.createElementNS(SVG_NS,'use');
    use.setAttribute('href',`#neckline-occluder-${key}`);
    outerwearOcclusion.appendChild(use);
  }
  necklineMask.appendChild(outerwearOcclusion);
}
function updateInnerNecklineOcclusion() {
  if(!innerNecklineOcclusion)return;
  const garment=garmentPaths.jumpsuit;
  innerNecklineOcclusion.setAttribute('d',wearingJumpsuit()?garment.getAttribute('d'):'');
  const cutout=garment.getAttribute('mask');
  if(cutout)innerNecklineOcclusion.setAttribute('mask',cutout);
  else innerNecklineOcclusion.removeAttribute('mask');
}
function updateInnerNecklineVisibility() {
  // A closed space collar replaces the inner garment's neckline entirely.
  // Keep display (which selects the current shirt) separate so removing the
  // outerwear restores the original collar without changing any selection.
  const covered=selectedDecorations.outerwear==='space-shirt';
  if(innerNecklineLayer)innerNecklineLayer.style.visibility=covered?'hidden':'';
  const keys=['shirtTop','teeNeck','teeTopLeft','teeTopRight',
    'vestNeck','vestTopLeft','vestTopRight','vestShoulderLeft','vestShoulderRight',
    'jobsCollar','jobsCollarEdge',
    ...Object.keys(ivorySpecs).filter(key=>ivorySpecs[key].neckline)];
  for(const key of keys){
    const node=garmentPaths[key];
    if(node)node.style.visibility=covered?'hidden':'';
  }
}
function placeOuterwearOverNeckline() {
  // Shirt neckline strokes live in neckOverlay so the head cannot erase
  // them. Keep the jacket panels after those strokes, but below the scarf.
  const scarf=scarfPaths[0]?.node||null;
  for(const key of ['greenVestLeft','greenVestRight','alohaBody'])
    neckOverlay.insertBefore(garmentPaths[key],scarf);
  if(spaceCollarOverlay)placeNeckGarmentBelowAccessories(spaceCollarOverlay,true);
}
function wearingUnderwear(){return !!thongVariants[selectedDecorations.pants]||!!briefVariants[selectedDecorations.pants]||!!boxerVariants[selectedDecorations.pants];}
function pantsCoverThigh() {
  return wearingJumpsuit()||!!widePantFlares[selectedDecorations.pants]
    ||['plain','batfish-trousers','green-ultra-shorts','student-shorts','pink-shorts','orange-shorts','black-shorts','slight-wide-shorts','extra-wide-shorts'].includes(selectedDecorations.pants);
}
function buttOutlineOpacity(side) {
  // The raised trouser or shorts leg supplies this hip contour itself. The
  // body's curved outline must not run across the fabric at the seam.
  // A continuous fabric surface has no visible torso/thigh join, even
  // below the promotion threshold. Briefs retain their actual skin boundary.
  // The triangle keeps a low moving leg behind the torso. Its original
  // hip arc would then cut across the moving thigh as a second contour.
  if(selectedDecorations.shirt==='red-triangle'&&!selectedDecorations.pants) return 0;
  if(wearingUnderwear()||['mosaic-pants','seaweed-pants'].includes(selectedDecorations.pants))return 0;
  if(selectedDecorations.pants==='skirt'||pantsCoverThigh()||(selectedDecorations.pants&&legInFront[side])) return 0;
  const drag=dragPoses.find(pose=>pose.part===side+'Leg');
  return smooth(((drag?Math.hypot(drag.x,drag.y):0)-2)/10);
}
function thighCoversPoint(point,geometry) {
  for(let i=0;i<16;i++){
    const a=geometry.centerline[i],b=geometry.centerline[i+1];
    const dx=b.x-a.x,dy=b.y-a.y;
    const square=dx*dx+dy*dy;
    const along=square?Math.max(0,Math.min(1,
      ((point.x-a.x)*dx+(point.y-a.y)*dy)/square)):0;
    if(Math.hypot(point.x-a.x-dx*along,point.y-a.y-dy*along)
      <=geometry.hose[i].width/2) return true;
  }
  return false;
}
function visiblePantsSide(side,geometry,warp,spaceFit=false,coveredWaist=spaceFit) {
  const source=side==='left'
    ?[[spaceFit?(coveredWaist?28.12:27.9961):27.7,spaceFit?(coveredWaist?119:116.5):110.5],[28.4591,125.881]]
    :[[spaceFit?(coveredWaist?65.87:65.8788):65.9,spaceFit?(coveredWaist?119:116.5):110.5],[65.8486,125.059]];
  const rawPointAt=t=>{
    let x=lerp(source[0][0],source[1][0],t);
    let y=lerp(source[0][1],source[1][1],t);
    if(spaceFit)({x,y}=spacePantsFit(x,y));
    const role=classifyPoint(x,y,'mixed');
    return applyDragPose(warp(x,y,role),x,y,role,warp);
  };
  const start=rawPointAt(0),end=spaceFit?geometry.outerAnchor:rawPointAt(1);
  const pointAt=t=>spaceFit?{x:lerp(start.x,end.x,t),y:lerp(start.y,end.y,t)}:rawPointAt(t);
  let cut=1;
  let previous=0;
  for(let step=1;step<=32;step++){
    const t=step/32;
    if(thighCoversPoint(pointAt(t),geometry)){
      let low=previous,high=t;
      for(let i=0;i<16;i++){
        const mid=(low+high)/2;
        if(thighCoversPoint(pointAt(mid),geometry)) high=mid;
        else low=mid;
      }
      cut=high;
      break;
    }
    previous=t;
  }
  if(cut<.001) return '';
  const stop=cut<1?pointAt(cut):end;
  return `M${clean(start.x)} ${clean(start.y)}L${clean(stop.x)} ${clean(stop.y)}`;
}
function updateArmOcclusion(shapes) {
  const dx=shapes.right.shoulder.x-shapes.left.shoulder.x;
  const dy=shapes.right.shoulder.y-shapes.left.shoulder.y;
  const span=Math.hypot(dx,dy)||1;
  for(const side of ['left','right']) {
    const shape=shapes[side],sign=side==='left'?1:-1;
    // Test the moving limb beyond its attachment against two planes through
    // the shoulder, both following body rotation so no pixel sampling is
    // needed. Inward: the limb has crossed over the chest. Above: it has
    // risen past the shoulder line the strap runs along, and while any of it
    // is up there it still covers the strap. Testing inward alone sent an arm
    // raised out to the side behind the garment long before it had swung
    // down across that line.
    const inward=armRaised[side]?-.25:.5;
    const above=armRaised[side]?-1.5:.5;
    // The palm reaches a good six units past the last spine point, so test it
    // too: a hand laid on the chest crossed the garment well before the arm's
    // centreline did, and was drawn behind it until the arm followed.
    armRaised[side]=[...shape.centerline.slice(6),shape.palm].some(point=>{
      const alongX=point.x-shape.shoulder.x,alongY=point.y-shape.shoulder.y;
      return sign*(alongX*dx+alongY*dy)/span>inward
        || (alongX*dy-alongY*dx)/span>above;
    });
    armInFront[side]=hasSleevelessOutfit()&&armRaised[side];
  }
}
function updateLegOcclusion(shapes,warp) {
  const torsoPoint=y=>applyDragPose(warp(47,y,'body'),47,y,'body',warp);
  const upper=torsoPoint(95),lower=torsoPoint(115);
  const length=Math.hypot(lower.x-upper.x,lower.y-upper.y)||1;
  const down={x:(lower.x-upper.x)/length,y:(lower.y-upper.y)/length};
  const right={x:down.y,y:-down.x};
  for(const side of ['left','right']) {
    const poses=dragPoses.filter(pose=>pose.part===side+'Leg');
    const pose=poses.reduce((sum,p)=>({x:sum.x+p.x,y:sum.y+p.y}),{x:0,y:0});
    if(!poses.length||!hasLongOuterwear()
      &&((!selectedDecorations.pants&&selectedDecorations.shirt!=='red-triangle')||wearingJumpsuit())) {
      legInFront[side]=false;
      continue;
    }
    const {hip,ankle,knee,restLength}=shapes[side];
    const ankleHeight=(ankle.x-hip.x)*down.x+(ankle.y-hip.y)*down.y;
    const lateral=(ankle.x-hip.x)*right.x+(ankle.y-hip.y)*right.y;
    // The long triangle covers the hip until the foot rises just above
    // horizontal (about 10 degrees), on either side of the body. Crossing
    // a low foot alone must not bring the round thigh cap over the cloth.
    if(selectedDecorations.shirt==='red-triangle'&&!selectedDecorations.pants) {
      const inward=-(side==='right'?1:-1)*lateral;
      // Once raised, an inward sweep stays in front until the foot falls
      // to roughly 31 degrees from downward vertical, not at horizontal.
      if(legInFront[side]&&inward>0) {
        legInFront[side]=ankleHeight<=0||inward>ankleHeight*.6;
      } else {
        legInFront[side]=ankleHeight < -Math.abs(lateral)*(legInFront[side] ? .08 : .18);
      }
      continue;
    }
    const sideSign=side==='right' ? 1 : -1;
    const outward=sideSign*(pose.x*right.x+pose.y*right.y)>0;
    if(outward) {
      // Bring an outside leg forward near 20 degrees above horizontal.
      const threshold=legInFront[side] ? .24 : .36;
      // A lifted thigh can clear the body while its folded calf still hangs
      // down. Test the knee too, independently of where the leg was grabbed.
      const thigh={x:knee.x-hip.x,y:knee.y-hip.y};
      const calf={x:ankle.x-knee.x,y:ankle.y-knee.y};
      const folded=(thigh.x*calf.x+thigh.y*calf.y)
        /Math.max(.001,Math.hypot(thigh.x,thigh.y)*Math.hypot(calf.x,calf.y))<.5;
      legInFront[side]=(folded?[ankle,knee]:[ankle]).some(point=>{
        const x=point.x-hip.x,y=point.y-hip.y;
        return x*down.x+y*down.y < -Math.abs(x*right.x+y*right.y)*threshold;
      });
    } else if(isSpaceSweatpants()) {
      // Sweatpants stay behind the top until the inward thigh rises above horizontal.
      // Use the knee: a tucked-up ankle alone must not promote the entire thigh.
      const thigh=knee||ankle,x=thigh.x-hip.x,y=thigh.y-hip.y;
      const threshold=legInFront[side] ? .06 : .14;
      legInFront[side]=x*down.x+y*down.y < -Math.abs(x*right.x+y*right.y)*threshold;
    } else {
      // A crossing leg comes forward around 42 degrees from vertical.
      // A folded foot near the hip also brings its leg forward.
      legInFront[side]=-sideSign*lateral>Math.max(0,ankleHeight)
        *(legInFront[side] ? .7 : .88)
        ||ankleHeight<restLength*(legInFront[side] ? .38 : .28);
    }
  }
}
function applyArmOcclusion(side,rootBlack,skinRoot) {
  const sleeveless=hasSleevelessOutfit();
  const mask=`url(#${side}-shoulder-mask)`;
  // A foreground arm must retain BOTH its fill and its outline at the root.
  // Leaving either shoulder mask active cuts a hole through the bent arm.
  // Bare shoulders on the shell top merge into the torso even when the arm crosses it.
  // Keep only the root outline masked; the foreground skin fill stays intact.
  if(sleeveless&&armInFront[side]&&selectedDecorations.shirt!=='shell-top') rootBlack.removeAttribute('mask');
  else rootBlack.setAttribute('mask',mask);
  if(sleeveless&&!armInFront[side]) skinRoot.setAttribute('mask',mask);
  else skinRoot.removeAttribute('mask');
}
function innerTopKeys() {
  return ['shirt','collaredDetails','suitFront','suitFrontEdges','suitCollarLeft','suitCollarRight','shirtSides','vest','vestSides','vestNeck',
    'vestTopLeft','vestTopRight','vestShoulderLeft','vestShoulderRight',
    ...Object.keys(ivorySpecs).filter(key=>ivorySpecs[key].category==='shirt'),'tee','teeSides','patchblue','patchred','patchstitches','redTriangle','waist'];
}
function shirtHemOverPants() {
  return !!teeStyles[selectedDecorations.shirt]?.hemOverPants;
}
// Keep native skin below the glove and garment fabric above it. Moving only
// sleeve segments preserves the existing whole-arm foreground/shoulder rules.
function updateArmSleeveOrder(arm, fabricEnd) {
  const {segments,rootBlack,black,skinRoot,skin,sleeveRootBlack,sleeveBlack,sleeveSkinRoot,sleeveSkin}=arm;
  const targets=segments.map(({back,front},i)=>{
    const fabric=i<fabricEnd;
    return {back,front,
      backParent:fabric?(i<6?sleeveRootBlack:sleeveBlack):(i<6?rootBlack:black),
      frontParent:fabric?(i<6?sleeveSkinRoot:sleeveSkin):(i<6?skinRoot:skin)};
  });
  if(!targets.some(({back,front,backParent,frontParent})=>back.parentNode!==backParent||front.parentNode!==frontParent))return;
  // Rebuild in sample order on a garment change, including the already-present
  // wrist spans; otherwise switching long to short sleeves reverses bare spans.
  for(const {back,front,backParent,frontParent} of targets){
    backParent.appendChild(back);
    frontParent.appendChild(front);
  }
}
function updateArmCuffClips(arm, {sleeveEnd,isTee,roundLongSleeve,ivoryTunic,batArmor,collaredShirt}) {
  const {side,segments,glovePanel,gloveEdges}=arm;
  const flatSleeve=batArmor||collaredShirt;
  const cutSleeve=isTee||roundLongSleeve||ivoryTunic||flatSleeve;
  segments.forEach(({back,front},i)=>{
    const nearCuff=i>=sleeveEnd-7&&i<=sleeveEnd+6;
    const boundary=cutSleeve&&i>=sleeveEnd-4&&i<=sleeveEnd+6;
    const cap=ivoryTunic&&i===5?'butt':ivoryTunic&&i>0&&i<28?'round':boundary?'butt':i===0||i===31?'butt':'round';
    const clip=cutSleeve&&nearCuff
      ?`url(#${side}-${flatSleeve||i<sleeveEnd?'sleeve':'skin'}-clip)`:null;
    for(const node of [back,front]){
      node.setAttribute('stroke-linecap',cap);
      if(clip)node.setAttribute('clip-path',clip);else node.removeAttribute('clip-path');
    }
  });
  // The fitted armor sleeve meets the glove at a flat wrist cut. Its final
  // fabric sample must not form a round cap, and the hidden gauntlet cannot
  // poke out along the sides of the sleeve above that same cut.
  for(const node of [glovePanel,gloveEdges]){
    if(batArmor)node.setAttribute('clip-path',`url(#${side}-skin-clip)`);
    else node.removeAttribute('clip-path');
  }
}
function updateGloveSleeveOrder({innerSleeve,glovePanel,alohaSleeve},gauntletOverSleeve) {
  // The wider gauntlet fits over a narrow collared-shirt cuff. Outerwear
  // remains above both, and other shirt cuts retain their existing order.
  const anchor=gauntletOverSleeve?glovePanel:alohaSleeve;
  if(innerSleeve.nextSibling!==anchor)innerSleeve.parentNode.insertBefore(innerSleeve,anchor);
}
function updateGarmentOrder() {
  if(mosaicOverlay){
    const top=garmentPaths.collaredDetails,pants=garmentPaths.mosaicPants;
    if(top){if(selectedDecorations.shirt==='mosaic-top')mosaicOverlay.appendChild(top);
      else if(top.parentNode===mosaicOverlay)outfitOverlay.appendChild(top);}
    if(pants)mosaicOverlay.appendChild(pants);
  }
  const upper=innerTopKeys();
  const lower=['jumpsuit','jumpsuitSides','jumpsuitCrotch','jumpsuitChestOutline',
    'pants','pantsSides','pantsCrotch','shorts','shortsSides','shortsCrotch',
    'pantsWaist','jeansDetails','mosaicPants','seaweedPants','redThong','briefs','skirt','jumpsuitNeckLeft','jumpsuitNeckRight',
    'jumpsuitShoulderLeft','jumpsuitShoulderRight'];
  for(const key of (shirtHemOverPants()?[...lower,...upper]:[...upper,...lower])) {
    const node=garmentPaths[key];
    if(node?.parentNode===outfitOverlay)outfitOverlay.appendChild(node);
  }
  // An extended coat covers the pelvis, but a folded calf/boot covers
  // its hem. Keep this coat between the trouser panels and calf copies.
  const longCoat=garmentPaths.alohaBody;
  if(hasLongOuterwear()&&longCoat)
    outfitOverlay.appendChild(longCoat);
  else if(longCoat?.parentNode===outfitOverlay&&neckOverlay)
    neckOverlay.insertBefore(longCoat,scarfPaths[0]?.node||null);
  if(garmentPaths.spaceDetails)outfitOverlay.appendChild(garmentPaths.spaceDetails);
  if(swimRingFront)outfitOverlay.appendChild(swimRingFront);
  // Moving calves still cover the fabric in a fold.
  for(const {calfOverlay} of legParts)outfitOverlay.appendChild(calfOverlay);
}
function updatePartOrder() {
  if (!partLayers.body) return;
  if(swimRingBack&&capeOverlay)svg.insertBefore(swimRingBack,capeOverlay.nextSibling);
  const sleeveless=hasSleevelessOutfit();
  const ordered = [...layerOrder];
  for (const pose of dragPoses) {
    const part = pose.part.replace('Wrist','Hand');
    // Separate trousers and shorts cover a low thigh root. Keep that leg
    // ahead of its partner but under the clothes until it rises in front.
    if(part.endsWith('Leg')&&(selectedDecorations.pants||selectedDecorations.shirt==='red-triangle'||hasLongOuterwear())
      &&(!wearingJumpsuit()||hasLongOuterwear())
      &&!legInFront[part.replace('Leg','')]) {
      const i=ordered.indexOf(part);
      if(i>=0) ordered.splice(1,0,...ordered.splice(i,1));
      continue;
    }
    if(sleeveless&&part.endsWith('Hand')) continue;
    const i=ordered.indexOf(part);
    if(i>=0) ordered.push(...ordered.splice(i,1));
  }
  // The head always covers the torso. They share the helmet base line, and a
  // promoted body would hide the lower half of that stroke behind its own
  // fill, so merely clicking the body appeared to thin the line.
  if (ordered.indexOf('body') > ordered.indexOf('head')) {
    ordered.splice(ordered.indexOf('head'), 1);
    ordered.splice(ordered.indexOf('body') + 1, 0, 'head');
  }
  if(sleeveless) for(const side of ['left','right']) {
    const part=side+'Hand';
    if(armInFront[side]) ordered.push(...ordered.splice(ordered.indexOf(part),1));
  }
  let outfitPlaced=false;
  ordered.forEach(part=>{
    // A resting arm sits above the head and body, while the sleeveless
    // garment covers its shoulder. An arm crossing the torso comes last.
    if(sleeveless&&armInFront[part.replace('Hand','')]
      &&part.endsWith('Hand')&&!outfitPlaced) {
      svg.appendChild(outfitOverlay);
      outfitPlaced=true;
    }
    svg.appendChild(partLayers[part]);
    if(!sleeveless&&part==='body'&&outfitOverlay) {
      svg.appendChild(outfitOverlay);
      outfitPlaced=true;
    }
  });
  if(sleeveless&&outfitOverlay&&!outfitPlaced) svg.appendChild(outfitOverlay);
  // Without pants, a dragged leg must stay in front of the shirt, including
  // sleeveless tops whose overlay is appended after all body parts. A
  // separate trouser leg only comes forward once raised far enough; a
  // jumpsuit colors the leg tubes so its moving legs always come forward.
  for(const part of ordered) if(part.endsWith('Leg')) {
    const side=part.replace('Leg','');
    if(dragPoses.some(pose=>pose.part===part)
      &&(!hasLongOuterwear()||legInFront[side])
      &&((!selectedDecorations.pants&&selectedDecorations.shirt!=='red-triangle')
        ||wearingJumpsuit()||legInFront[side]))
      svg.appendChild(partLayers[part]);
  }
  // Every outfit shares this rule: palms and forearms cover legs, including
  // calfOverlay inside the garment group. Active dragging is handled last.
  // Shoulder masks still tuck resting sleeveless arms into their straps.
  for(const part of ordered)
    if(part.endsWith('Hand')) svg.appendChild(partLayers[part]);
  // Resting arms stay behind the neck accessory; raised arms cross over it.
  if(neckOverlay) svg.appendChild(neckOverlay);
  if(spaceHelmetOverlay)svg.appendChild(spaceHelmetOverlay);
  if(divingGoggleOverlay)svg.appendChild(divingGoggleOverlay);
  for(const part of ordered)
    if(part.endsWith('Hand')&&armRaised[part.replace('Hand','')])
      svg.appendChild(partLayers[part]);
  // While held, a foreground leg overrides hands, clothes and neckwear.
  // Release restores the hand-first rule above; retain low-root thresholds.
  if(activeDrag?.pose.part.endsWith('Leg')
    // A long coat covers low thigh roots even while held. Promote only
    // after the existing angle threshold; high drags still cover the hands.
    &&(!hasLongOuterwear()||legInFront[activeDrag.pose.part.replace('Leg','')])
    &&(!(selectedDecorations.shirt==='red-triangle'&&!selectedDecorations.pants)&&!wearingUnderwear()&&selectedDecorations.pants!=='jobs-gradient-jeans'
      ||legInFront[activeDrag.pose.part.replace('Leg','')]))
    svg.appendChild(partLayers[activeDrag.pose.part]);
  // Long hair stays ahead of every visible part, including raised hands and held legs.
  if(longHairOverlay)svg.appendChild(longHairOverlay);
  if(mosaicOverlay)svg.appendChild(mosaicOverlay);
  // Invisible handles follow the same order as the visible parts.
  if(dragLayer) {
    ordered.forEach(part=>[...dragLayer.children].filter(node=>
      node.dataset.dragPart.replace('Wrist','Hand').replace('Foot','')===part)
      .forEach(node=>dragLayer.appendChild(node)));
    svg.appendChild(dragLayer);
  }
}

function applyWristCenter(source, warp) {
  const point = warp(source.x, source.y, 'arms');
  // The hinge follows all translations and arm bends, but never its own turn.
  return applyDragPose(point, source.x, source.y, 'wrists', warp);
}

function limitDrag(pose, x, y) {
  const handDrag = handPart(pose.part);
  const legDrag = pose.part === 'leftLeg' || pose.part === 'rightLeg';
  if (legDrag) {
    const warp=buildWarp(Object.fromEntries(Object.entries(controls)
      .map(([key,input])=>[key,Number(input.value)])));
    const {hip,ankle}=plantedLegs(warp)[pose.part==='leftLeg'?0:1];
    const length=Math.hypot(ankle.x-hip.x,ankle.y-hip.y);
    const dx=ankle.x+x-hip.x,dy=ankle.y+y-hip.y;
    // Let the gesture run past the leg's own reach by as much as the pelvis
    // can travel. legGeometry still caps the bones, and legRootMotion turns
    // the overshoot into body motion, so the foot keeps tracking the pointer
    // instead of stopping dead at full stretch.
    const travel=legCompressionLimit(warp).legHeight*.65;
    const scale=Math.min(1,(length*LEG_MAX_STRETCH+travel)/
      Math.max(.001,Math.hypot(dx,dy)));
    // Clamp the gesture itself, so returning from maximum extension reacts
    // immediately instead of traversing an invisible overstretch distance.
    return {x:hip.x+dx*scale-ankle.x,y:hip.y+dy*scale-ankle.y};
  }
  if (pose.part==='head'||pose.part==='body') {
    const warp=buildWarp(Object.fromEntries(Object.entries(controls)
      .map(([key,input])=>[key,Number(input.value)])));
    const {center,reference,restAngle,radius}=upperBodyReach(pose,warp);
    const dx=reference.x+x-center.x;
    const dy=reference.y+y-center.y;
    const rawReach=Math.min(radius,Math.hypot(dx,dy));
    const rawAngle=Math.atan2(dx,Math.max(0,-dy));
    const difference=Math.atan2(Math.sin(rawAngle-restAngle),
      Math.cos(rawAngle-restAngle));
    // An upward diagonal pull should not be projected onto the downward side
    // of the circle merely because the requested angle exceeded the arc.
    const rise=Math.max(0,center.y-reference.y);
    const upwardArc=.7*Math.acos(Math.min(1,rise/Math.max(1,rawReach)));
    const arc=lerp(upperBodyArc(pose),
      Math.min(upperBodyArc(pose),upwardArc),smooth(Math.max(0,-y)/25));
    const angle=restAngle+Math.max(-arc,Math.min(arc,difference));
    // Downward travel folds the legs. Moving outward in that squat increases
    // the circle radius only enough for a lateral lean, rather than pulling
    // the pelvis back up to standing height.
    const legHeight=legCompressionLimit(warp).legHeight;
    const crouchReach=radius*.48*smooth(Math.abs(x)/(legHeight*2.6));
    const reach=lerp(rawReach,crouchReach,
      smooth(Math.max(0,y)/Math.max(20,legHeight*1.7)));
    return {x:center.x+reach*Math.sin(angle)-reference.x,
      y:center.y-reach*Math.cos(angle)-reference.y};
  }
  const length = handDrag
    ? 52 * (Number(controls.arms.value) / 100)
    : 53 * (Number(controls.legs.value) / 100);
  const maxX = handDrag
    ? Math.max(100, length * 2.1)
    : Math.max(30, length * .75);
  const maxY = handDrag
    ? Math.max(100, length * 2.1)
    : Math.max(22, length * .82);
  const distance = Math.hypot(x / maxX, y / maxY);
  // A short leg has less room for hip tilt and ankle clearance. Scale the
  // complete pose, including torso motion, before applying either contour.
  const clearance = handDrag ? 1 : lerp(.45, 1,
    smooth((Number(controls.legs.value) - 50) / 50));
  const scale = clearance / Math.max(1, distance);
  return { x: x * scale, y: y * scale };
}

function clearDragPose() {
  if (springFrame) cancelAnimationFrame(springFrame);
  if (dragRenderFrame) cancelAnimationFrame(dragRenderFrame);
  springFrame = 0;
  dragRenderFrame = 0;
  activeDrag = undefined;
  dragPoses.length = 0;
}

function scheduleDragUpdate() {
  if (dragRenderFrame) return;
  dragRenderFrame = requestAnimationFrame(() => {
    dragRenderFrame = 0;
    update();
  });
}

function releaseDrag(pointerId) {
  if (!activeDrag || (pointerId !== undefined && activeDrag.id !== pointerId)) return;
  activeDrag = undefined;
  // Render the final sampled pointer position before starting the spring.
  if (dragRenderFrame) {
    cancelAnimationFrame(dragRenderFrame);
    dragRenderFrame = 0;
    update();
  }
  startSpring();
}

function svgPoint(event) {
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(svg.getScreenCTM().inverse());
}

function projectedDragPosition(drag, point) {
  // Keep pointer intent separate from the displayed pose. The body reach map
  // folds diagonal drags into a squat and is intentionally not idempotent.
  drag.intentX += point.x - drag.x;
  drag.intentY += point.y - drag.y;
  return limitDrag(drag.pose, drag.intentX, drag.intentY);
}

function springStep(time) {
  const delta = Math.min((time - springTime) / 1000 || .016, .032);
  springTime = time;
  for (let index = dragPoses.length - 1; index >= 0; index--) {
    const pose = dragPoses[index];
    pose.swayX *= Math.exp(-10 * delta);
    pose.swayY *= Math.exp(-10 * delta);
    if (Math.abs(pose.swayX) < .01) pose.swayX = 0;
    if (Math.abs(pose.swayY) < .01) pose.swayY = 0;
    if (activeDrag?.pose === pose) {
      // A stationary pointer must lose its old velocity before release.
      pose.vx *= Math.exp(-12 * delta);
      pose.vy *= Math.exp(-12 * delta);
      pose.av *= Math.exp(-12 * delta);
    } else {
      pose.vx += -105 * pose.x * delta;
      pose.vy += -105 * pose.y * delta;
      const damping = Math.exp(-8.5 * delta);
      pose.vx *= damping;
      pose.vy *= damping;
      // The spring relaxes rendered coordinates. Mapping them again through
      // limitDrag would drive a held squat toward the centre on every frame.
      pose.x += pose.vx * delta;
      const settled = pose.y + pose.vy * delta;
      // A sole stops at the ground, and a released arm likewise should not
      // swing below where it hangs. Its own rest position is the limit in
      // both cases, so a limb let go from above settles onto it instead of
      // plunging past. Only a crossing from above is caught, which leaves a
      // limb dragged downward free to relax back up the way it always did.
      if ((pose.part.endsWith('Leg') || handPart(pose.part))
        && pose.y <= 0 && settled > 0) {
        pose.y = 0;
        pose.vy = 0;
      } else {
        pose.y = settled;
      }
      pose.av = (pose.av - 105 * pose.angle * delta) * damping;
      pose.angle += pose.av * delta;
      if (Math.hypot(pose.x, pose.y) < .015
        && Math.hypot(pose.vx, pose.vy) < .05
        && Math.abs(pose.angle) < .001
        && Math.abs(pose.av) < .005) {
        Object.assign(pose, { x: 0, y: 0, vx: 0, vy: 0, angle: 0, av: 0 });
      }
      if (!pose.x && !pose.y && !pose.swayX && !pose.swayY && !pose.angle) {
        dragPoses.splice(index, 1);
      }
    }
  }
  update();
  springFrame = dragPoses.length ? requestAnimationFrame(springStep) : 0;
}

function startSpring() {
  if (springFrame) return;
  springTime = performance.now();
  springFrame = requestAnimationFrame(springStep);
}

// Motion library. A motion is a set of per-part tracks of
// [second, x, y, angle] samples, in the same units a drag produces. Every
// track starts and ends at the rest pose, so playing one always hands the
// character back exactly as it was found.
// Two alternating steps per cycle; entry/exit are outside the repeated gait.
// `direction` is 1 for walking right and -1 for walking left: the leftward
// walk is the rightward one mirrored, which swaps the two legs and the two
// arms over as well as negating every sideways value. Everything that knows
// about the travel direction — the knee bend, which foot turns its toe —
// follows the sign of `walkBlend`, so nothing else needs a second copy.
// Captured from sea-game/character/embed-bundle.js workerWalkCycle.
// The game uses the same .9-second gait for arrival and departure.
const seaGameWalkCycle={duration:.9,tracks:{
 leftLeg:[[0,14,0],[.225,0,-9],[.45,-14,0],[.675,0,-2],[.9,14,0]],
 rightLeg:[[0,-14,0],[.225,0,-2],[.45,14,0],[.675,0,-9],[.9,-14,0]],
 head:[[0,2,0],[.225,0,-4],[.45,-2,0],[.675,0,-4],[.9,2,0]],
 rightHand:[[0,-9,-4],[.45,9,-6],[.9,-9,-4]],
 leftHand:[[0,9,-6],[.45,-9,-4],[.9,9,-6]],
}};
function createWalkMotion(direction=1,cycles=2){
 const cycle=.9,entry=.3,exit=.3,end=entry+cycles*cycle,duration=end+exit;
 const tracks=Object.fromEntries(Object.keys(seaGameWalkCycle.tracks).map(part=>[part,[]]));
 const count=Math.round(duration*120);
 for(let i=0;i<=count;i++){
   const t=i/120,phase=((t-entry)%cycle+cycle)%cycle;
   const at=direction<0?phase:cycle-phase;
   const blend=smooth(t/entry)*smooth((duration-t)/exit);
   for(const [part,source] of Object.entries(seaGameWalkCycle.tracks)){
     const pose=sampleTrack(source,at,true);
     tracks[part].push([t,...pose.map(v=>v*blend)]);
   }
 }
 return {id:direction>0?'walk-right':'walk-left',name:`${direction>0?'向右':'向左'}走路（${cycles*2}步）`,
  duration,eased:false,tracks,loops:[{start:entry,end,cycle}],source:'sea-game-worker'};
}

// Talking is the jaw opening and shutting on syllables, not an even flutter:
// the beat comes from unequal openings and unequal gaps, with a longer one
// at the end of each phrase where a speaker draws breath. The head keeps a
// small lean for as long as the character is talking and nods along inside
// each phrase, which has to be the same nod every phrase so the repeated
// section joins cleanly.
// Default speech: four syllables of unequal size, then a breath.
// [how wide, how long it is held, how long the mouth then stays shut]
const TALK_SYLLABLES = [[.95,.06,.05], [.5,.04,.05], [.85,.07,.05], [.45,.04,.24]];
// Head movement inside one phrase, as offsets in seconds from its start.
const TALK_NOD = [[0,0,0], [.21,1,-1.2], [.43,-1,.8], [.64,1,-1.2], [.86,-.8,.6]];

// One builder for every talking motion. The mouth and the head work the
// same way each time; a variant changes the rhythm of the speech, how the
// character holds itself, and what the hands do. `hands` is sampled across
// the phrase rather than keyframed, so a gesture only has to be written as
// a function of where it is in the phrase — and because it is read from the
// phrase, it repeats exactly, which is what the repeated section needs.
function createTalkMotion({id = 'talk', name = '说话', phrases = 2,
    syllables = TALK_SYLLABLES, nod = TALK_NOD, lean = [1.5, -1],
    hands, handSamples = 18} = {}) {
  const entry = .22, exit = .3, rise = .06, fall = .06;
  const phrase = syllables.reduce((total, [, hold, gap]) =>
    total + rise + hold + fall + gap, 0);
  const round = value => Number(value.toFixed(6));
  // Which syllable is being sounded at this point in the phrase and how
  // loudly, 0 through the gaps: gestures beat on this, so a hand lands with
  // the voice instead of on some rhythm of its own, and a gesture can take
  // turns between the hands by looking at the syllable's number.
  const voiceAt = phase => {
    let at = ((phase % 1) + 1) % 1 * phrase;
    for (let index = 0; index < syllables.length; index++) {
      const [, hold, gap] = syllables[index];
      const span = rise + hold + fall + gap;
      if (at < span) {
        const sounded = rise + hold + fall;
        return {index,
          level: at >= sounded ? 0 : Math.sin(Math.PI * at / sounded) ** 2};
      }
      at -= span;
    }
    return {index: syllables.length - 1, level: 0};
  };
  // The mouth is read linearly by the player, so these keyframes are the
  // shape of each syllable exactly: ramp open, hold, ramp shut, wait.
  // Between syllables it goes to -1, properly shut, rather than back to the
  // part-open notch of the drawing: the character is only drawn that way
  // standing idle, and shutting it is what makes the talking read.
  const SHUT = -1;
  const mouth = [[0,0], [entry, SHUT]];
  const head = [[0,0,0,0]];
  const tracks = {head};
  if (hands) tracks.leftHand = [], tracks.rightHand = [];
  for (let i = 0; i < phrases; i++) {
    let at = entry + i * phrase;
    for (const [open, hold, gap] of syllables) {
      mouth.push([round(at + rise), open], [round(at + rise + hold), open],
        [round(at + rise + hold + fall), SHUT]);
      at += rise + hold + fall + gap;
      mouth.push([round(at), SHUT]);
    }
    for (const [offset, x, y] of nod) {
      head.push([round(entry + i * phrase + offset),
        round(lean[0] + x), round(lean[1] + y), 0]);
    }
  }
  const speaking = entry + phrases * phrase;
  // Lean in before the first syllable and settle afterwards.
  head.splice(1, 0, [entry, lean[0], lean[1], 0]);
  head.push([round(speaking), lean[0], lean[1], 0],
    [round(speaking + exit), 0, 0, 0]);
  mouth.push([round(speaking + exit), 0]);
  if (hands) {
    // The gesture is sampled on one even grid that runs through the entry
    // and the exit as well, with its amplitude growing and fading there —
    // the same shape the walk uses. Ramping straight from rest to the first
    // pose instead leaves one long steep segment at each end of the
    // repeated section, and the spline reads its tangent from it: the last
    // phrase then sags a couple of units early and no longer matches the
    // first.
    const ease = t => t * t * (3 - 2 * t);
    const step = phrase / handSamples;
    const lead = Math.max(1, Math.round(entry / step));
    const tail = Math.max(1, Math.round(exit / step));
    // Rest at the very start, in case the grid's first sample lands later:
    // before its first keyframe a track holds that keyframe's value, which
    // would have the hands already part way up at time zero.
    const samples = [[0, 0, 0]];
    for (let k = lead; k >= 1; k--) {
      samples.push([entry - k * step, -k / handSamples, ease(1 - k / lead)]);
    }
    for (let i = 0; i < phrases; i++) {
      for (let sample = 0; sample < handSamples; sample++) {
        samples.push([entry + (i + sample / handSamples) * phrase,
          sample / handSamples, 1]);
      }
    }
    for (let k = 0; k <= tail; k++) {
      samples.push([speaking + k * step, k / handSamples, 1 - ease(k / tail)]);
    }
    samples.push([speaking + exit, 0, 0]);
    for (const [time, phase, weight] of samples) {
      if (time < 0 || time > speaking + exit) continue;
      const sounding = voiceAt(phase);
      const pose = hands(((phase % 1) + 1) % 1, sounding.level, sounding.index);
      for (const part of ['leftHand', 'rightHand']) {
        tracks[part].push([round(time), round(pose[part][0] * weight),
          round(pose[part][1] * weight), 0]);
      }
    }
  }
  return {
    id,
    name,
    duration: round(speaking + exit),
    eased: true,
    mouth,
    tracks,
    // Lean in, repeat the phrase, settle back.
    loops: [{start: entry, end: round(speaking), cycle: round(phrase)}],
  };
}

// Every motion is built the same way: something to step into it, a section
// that repeats, and something to finish on. `loops` marks each repeated
// section as {start, end, cycle} in seconds — `cycle` is the length of one
// repetition, and `end - start` is always a whole number of them. To make a
// motion run longer, repeat its sections rather than stretching the whole
// thing: `extendMotionLoops(motion, 2)` adds two more turns/steps/squats to
// each section and leaves the entry and the ending exactly as they are.
// A motion with a staggered handover, such as the two hands taking turns,
// lists one section per part, in time order.
function extendMotionLoops(motion, repeats = 1) {
  if (repeats < 1 || !motion.loops?.length) return motion;
  const sections = [...motion.loops].sort((a, b) => a.start - b.start);
  const EPS = 1e-9;
  const extendTrack = track => {
    const out = [];
    let shift = 0, cursor = -Infinity;
    for (const {end, cycle} of sections) {
      out.push(...track.filter(key => key[0] > cursor && key[0] <= end + EPS)
        .map(key => [key[0] + shift, ...key.slice(1)]));
      // The section repeats exactly, so its last cycle is the copy to add.
      // A track that holds still across the section has no keyframes here
      // and simply lasts longer, which is what holding still means.
      const lastCycle = track.filter(key =>
        key[0] > end - cycle + EPS && key[0] <= end + EPS);
      for (let i = 1; i <= repeats; i++) {
        out.push(...lastCycle.map(key =>
          [key[0] + shift + i * cycle, ...key.slice(1)]));
      }
      shift += repeats * cycle;
      cursor = end;
    }
    out.push(...track.filter(key => key[0] > cursor)
      .map(key => [key[0] + shift, ...key.slice(1)]));
    return out;
  };
  const added = repeats * sections.reduce((total, s) => total + s.cycle, 0);
  const extended = {
    ...motion,
    duration: motion.duration + added,
    tracks: Object.fromEntries(Object.entries(motion.tracks)
      .map(([part, track]) => [part, extendTrack(track)])),
    loops: sections.map(section => {
      const grown = {...section, end: section.end + repeats * section.cycle};
      return grown;
    }),
  };
  if (motion.walkBlend) extended.walkBlend = extendTrack(motion.walkBlend);
  if (motion.mouth) extended.mouth = extendTrack(motion.mouth);
  if (motion.walkToe) {
    extended.walkToe = Object.fromEntries(Object.entries(motion.walkToe)
      .map(([part, track]) => [part, extendTrack(track)]));
  }
  // Later sections start after the earlier ones have grown.
  let moved = 0;
  for (const section of extended.loops) {
    section.start += moved;
    section.end += moved;
    moved += repeats * section.cycle;
  }
  return extended;
}

const motionLibrary = [
  createWalkMotion(1, 2),
  createWalkMotion(-1, 2),
  createTalkMotion({phrases: 2}),
  // Making a point: the left hand swings up and across in front of the
  // chest and stays there, bobbing on each syllable, while the other hand
  // stays down. Taken from a recording of the same gesture made with the
  // right hand: it crossed to about 50 units past the body's middle, held
  // around 18 up, and beat between 7 and 31 as the character spoke. The
  // beat comes from `voice`, so the hand rises with the mouth rather than
  // on a rhythm of its own.
  createTalkMotion({
    id: 'talk-gesture',
    name: '抬左手比划',
    lean: [1, -1.5],
    nod: [[0,0,0], [.21,1.4,-1.6], [.43,-1.2,1], [.64,1.4,-1.6], [.86,-1,.8]],
    hands: (phase, voice) => ({
      // A slow drift underneath, so the hand is never simply parked
      // between beats.
      leftHand: [50 - 3 * Math.cos(2 * Math.PI * phase), -19 - 12 * voice],
      rightHand: [0, 0],
    }),
  }),
  // Spreading both hands: a slower, three-syllable phrase, the hands opening
  // out and back once across it and the head tipping with them. Both hands
  // pull on the torso, so moving them together keeps it where it is.
  createTalkMotion({
    id: 'talk-shrug',
    name: '摊手说话',
    syllables: [[.9,.09,.06], [.55,.06,.06], [.95,.1,.3]],
    lean: [0, -2],
    nod: [[0,0,0], [.3,.6,-1.4], [.6,-.6,.9], [.9,.4,-.6]],
    hands: phase => {
      const swell = .5 - .5 * Math.cos(2 * Math.PI * phase);
      const out = 30 + 14 * swell, up = 14 + 10 * swell;
      return {leftHand: [-out, -up], rightHand: [out, -up]};
    },
  }),
  // A raised right hand punctuates each syllable with a downward beat.
  createTalkMotion({
    id: 'talk-emphasis',
    name: '单手强调',
    lean: [3, -1],
    nod: [[0,0,0], [.21,1.2,1.4], [.43,-.8,-1], [.64,1.2,1.4], [.86,-.6,-.8]],
    handSamples: 36,
    hands: (phase, voice) => ({
      leftHand: [0, 0],
      rightHand: [20 + 4 * Math.sin(2 * Math.PI * phase), -48 + 15 * voice],
    }),
  }),
  // A lateral open-hand sweep and an opposing head sway read as a gentle
  // objection, distinct from a vertical speech beat or a two-handed shrug.
  createTalkMotion({
    id: 'talk-disagree',
    name: '摇头摆手',
    lean: [-2, -1],
    nod: [[0,0,0], [.18,-5,-.6], [.45,5,.5], [.72,-5,-.6], [.9,3,.4]],
    handSamples: 36,
    hands: phase => ({
      leftHand: [-18 + 13 * Math.sin(4 * Math.PI * phase),
        -40 - 3 * Math.cos(4 * Math.PI * phase)],
      rightHand: [0, 0],
    }),
  }),
  {
    id: 'wave',
    name: '打招呼',
    duration: 1.5,
    eased: true,
    tracks: {
      // The arm comes down along the arc it went up, but takes its time over
      // it: matching the speed of the raise read as a drop.
      // The loop below repeats .34–.98, so those keyframes have to be exactly
      // one wave apart: every left extreme is the same pose, as is every
      // right one. They used to drift a couple of units and a repeat would
      // have shown a small jump at the seam.
      rightHand: [[0,0,0],[.08,12,-55],[.18,6,-106],[.34,-30,-105],[.5,16,-108],
        [.66,-30,-105],[.82,16,-108],[.98,-30,-105],[1.12,4,-108],[1.26,12,-62],
        [1.38,9,-24],[1.46,2,-6],[1.5,0,0]],
      // The wrist does the waving; a wider sweep would swing the hips and
      // drag the planted feet with them.
      head: [[0,0,0],[.2,1,-1],[1.1,1,-1],[1.4,0,0]],
    },
    // Raise the arm, wave, bring it down. One wave is .32s.
    loops: [{start: .34, end: .98, cycle: .32}],
  },
  {
    id: 'hand-circles',
    name: '左右手转圈',
    duration: 4.76,
    eased: true,
    // Both hands turn the same way round. The right one reaches out to its
    // side and carries straight on up over the top; the left one picks the
    // turn up at the bottom of the circle, where the arm already hangs, so
    // its first move is the turn itself rather than a quarter in the other
    // direction to get into position. How far across the body each hand
    // may swing is set by the leg it pulls on: at the far side of its turn
    // each hand bends the opposite knee about twelve degrees, and pushing
    // the left hand further right than that buckled the right leg. Each carries
    // the turn a little past the end before setting the arm down. Within a
    // turn the hand sweeps over the top and takes its time through the
    // bottom: that uneven rate, with the body leaning towards the raised
    // hand and dipping as it passes low, is the beat. The rate is set by
    // the angle the hand is passing, not by how far it is into its own
    // turn, so both hands accent the same part of the circle however they
    // joined it. The left hand picks
    // up while the right is still coming down.
    tracks: {
      rightHand: [[0,0,0],[0.14,30,-26],[0.3,66,-57],[0.37,47,-96],
        [0.45,0,-112],[0.52,-47,-96],[0.6,-66,-57],[0.68,-47,-18],
        [0.78,0,-2],[0.87,47,-18],[0.96,66,-57],[1.03,47,-96],
        [1.11,0,-112],[1.18,-47,-96],[1.26,-66,-57],
        [1.34,-47,-18],[1.44,0,-2],[1.53,47,-18],[1.62,66,-57],
        [1.69,47,-96],[1.77,0,-112],[1.84,-47,-96],[1.92,-66,-57],
        [2.0,-47,-18],[2.1,0,-2],[2.19,47,-18],[2.28,66,-57],
        [2.38,62,-76],[2.54,28,-34],[2.68,0,0]],
      leftHand: [[0,0,0],[2.28,0,0],[2.38,-3,-1],[2.47,42,-17],[2.56,60,-57],
        [2.63,42,-97],[2.7,-3,-113],[2.78,-48,-97],[2.86,-66,-57],
        [2.94,-48,-17],[3.04,-3,-1],[3.13,42,-17],[3.22,60,-57],
        [3.29,42,-97],[3.36,-3,-113],[3.44,-48,-97],
        [3.52,-66,-57],[3.6,-48,-17],[3.7,-3,-1],[3.79,42,-17],
        [3.88,60,-57],[3.95,42,-97],[4.02,-3,-113],[4.1,-48,-97],
        [4.18,-66,-57],[4.26,-48,-17],[4.36,-3,-1],[4.46,29,-9],
        [4.62,13,-4],[4.76,0,0]],
      head: [[0,0,0],[0.45,5,-3],[0.78,-3,7],[1.11,5,-3],[1.44,-3,7],
        [1.77,5,-3],[2.1,-3,7],[2.38,3,7],[2.7,-5,-3],[3.04,3,7],
        [3.36,-5,-3],[3.7,3,7],[4.02,-5,-3],[4.56,0,-1],
        [4.76,0,0]],
    },
    // Each hand has its own repeated section, one turn (.66s) long: the
    // right hand's, then the left hand's. Extending both keeps the handover
    // between them intact.
    loops: [{start: .45, end: 1.77, cycle: .66},
      {start: 2.7, end: 4.02, cycle: .66}],
  },
  {
    id: 'squat-circle',
    name: '转圈下蹲',
    duration: 3.78,
    eased: true,
    // The whole body traces a ring: lean left, sink through the squat, come
    // up on the right, stand through the top, five times round. It starts
    // and ends at the top of the ring, which is the standing pose, so there
    // is nothing to step into or out of. The ring stays inside what the
    // legs can render — about 24 sideways and 46 down, and less of each
    // when both happen at once — and the hand passes the bottom slowly and
    // the top quickly, which is where the beat sits.
    tracks: {
      head: [[0,0,0],[0.12,-4,0],[0.24,0,-2],[0.31,-14,5],
        [0.39,-20,22],[0.47,-14,39],[0.57,0,46],[0.66,14,39],
        [0.74,20,22],[0.81,14,5],[0.88,0,-2],[0.95,-14,5],
        [1.03,-20,22],[1.11,-14,39],[1.21,0,46],[1.3,14,39],
        [1.38,20,22],[1.45,14,5],[1.52,0,-2],[1.59,-14,5],
        [1.67,-20,22],[1.75,-14,39],[1.85,0,46],[1.94,14,39],
        [2.02,20,22],[2.09,14,5],[2.16,0,-2],[2.23,-14,5],
        [2.31,-20,22],[2.39,-14,39],[2.49,0,46],[2.58,14,39],
        [2.66,20,22],[2.73,14,5],[2.8,0,-2],[2.87,-14,5],
        [2.95,-20,22],[3.03,-14,39],[3.13,0,46],[3.22,14,39],
        [3.3,20,22],[3.37,14,5],[3.44,0,-2],[3.6,-8,0],[3.78,0,0]],
    },
    // Lean in, five times round the ring, straighten up. One ring is .64s.
    loops: [{start: .57, end: 3.13, cycle: .64}],
  },
  {
    id: 'squat-sway',
    name: '左右下蹲',
    duration: 3.06,
    eased: true,
    // Dragging the head carries the whole body, so one track leans and
    // squats at once: lean out, drop through the middle, lean the other way.
    // The amplitudes stay inside what the legs can actually render: past
    // about 24 sideways the hip is at full stretch and only the torso keeps
    // leaning, at roughly half the rate, and past about 50 down nothing
    // moves at all — less than that while leaning, since a lean spends some
    // of the same travel. A lean may pass through the compressed range, but
    // nothing rests there. The
    // pose running on while the picture holds still is what read as a pause
    // at the bottom of every squat. The squats therefore bottom out near the
    // middle, where the legs still have room to fold, rather than far out to
    // one side where they are already at full stretch.
    //
    // The two halves overlap: the body is at its lowest while still out to
    // one side, and rises as it crosses to the other. Bottoming out exactly
    // at the middle made the vertical travel turn around at the same moment
    // the sideways travel passed through centre, and that read as a pause in
    // the squat before the swing. Sinking takes .42s, crossing .26s. Each
    // leg keeps a waypoint halfway through, or the spline overshoots the
    // turn, and holding an extreme with a repeated keyframe stopped the body
    // dead there and read as a stutter.
    tracks: {
      head: [[0,0,0],[.14,-2,24],[.27,-6,46],
        [.43,-24,20],[.54,-32,-2],
        [.71,-29,22],[.85,-6,46],
        [.99,11,30],[1.11,32,-2],
        [1.28,29,22],[1.41,6,46],
        [1.55,-11,30],[1.67,-32,-2],
        [1.84,-29,22],[1.97,-6,46],
        [2.11,11,30],[2.23,32,-2],
        [2.4,26,18],[2.53,5,28],[2.7,1,6],[2.87,0,-5],[3.06,0,0]],
    },
    // Sink into the first squat, repeat the left-right pair, stand up.
    // One pair of squats is 1.13s.
    loops: [{start: .54, end: 1.67, cycle: 1.13}],
  },
];
let motionFrame = 0;
let motionStart = 0;
let playingMotion;

function sampleTrack(track, time, eased) {
  let index = 0;
  while (index < track.length - 2 && track[index + 1][0] <= time) index++;
  const from = track[index], to = track[index + 1] || from;
  const span = to[0] - from[0];
  // Tracks need not cover the whole motion: outside their own span they
  // hold their first or last keyframe rather than extrapolating off it.
  const amount = Math.max(0, Math.min(1, span > 0 ? (time - from[0]) / span : 1));
  // A recording already carries the performance's own timing, so it is read
  // straight through.
  if (!eased) {
    return [1, 2, 3].map(axis => lerp(from[axis] || 0, to[axis] || 0, amount));
  }
  // A hand-written track passes through sparse keyframes, and easing each
  // leg on its own would stop the limb dead at every one of them. A spline
  // keeps the speed continuous across the whole gesture, so a wave reads as
  // one movement instead of a chain of small ones.
  //
  // The tangents are measured per second, not per keyframe: where a slow leg
  // meets a quick one — a squat held on the way down and snapped out of —
  // equal-weighted tangents change the speed abruptly at the join, and that
  // shows up as a hitch exactly at the keyframe.
  const at = position => track[Math.max(0, Math.min(track.length - 1, position))];
  const before = at(index - 1), after = at(index + 2);
  const step = to[0] - from[0] || 1;
  const leading = (to[0] - before[0]) || step;
  const trailing = (after[0] - from[0]) || step;
  const t2 = amount * amount, t3 = t2 * amount;
  const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + amount;
  const h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
  return [1, 2, 3].map(axis => {
    const p0 = before[axis] || 0, p1 = from[axis] || 0;
    const p2 = to[axis] || 0, p3 = after[axis] || 0;
    return h00 * p1 + h01 * p2
      + h10 * (p2 - p0) / leading * step
      + h11 * (p3 - p1) / trailing * step;
  });
}

function stopMotion() {
  if (!motionFrame) return;
  cancelAnimationFrame(motionFrame);
  motionFrame = 0;
  playingMotion = undefined;
  motionPaneButtons('[data-motion]').forEach(button => {
    button.disabled = false;
  });
}

function applyMotionPose(motion, at) {
  for (const [part, track] of Object.entries(motion.tracks)) {
    let pose = dragPoses.find(entry => entry.part === part);
    if (!pose) {
      pose = createDragPose(part);
      dragPoses.push(pose);
    }
    pose.walkBlend = motion.walkBlend ? sampleTrack(motion.walkBlend, at, false)[0] : 0;
    pose.toeTurn = motion.walkToe?.[part]
      ? sampleTrack(motion.walkToe[part], at, false)[0] : 0;
    pose.mouth = motion.mouth ? sampleTrack(motion.mouth, at, false)[0] : 0;
    [pose.x, pose.y, pose.angle] = sampleTrack(track, at, motion.eased);
  }
}

function stepMotion(time) {
  const elapsed = (time - motionStart) / 1000;
  const finished = elapsed >= playingMotion.duration;
  const at = Math.min(elapsed, playingMotion.duration);
  applyMotionPose(playingMotion, at);
  if (finished) {
    // The last keyframe is the rest pose; drop the poses so the character is
    // back to its untouched state rather than held at a zero offset.
    dragPoses.length = 0;
    update();
    stopMotion();
    return;
  }
  update();
  motionFrame = requestAnimationFrame(stepMotion);
}

function playMotion(motion) {
  stopMotion();
  clearDragPose();
  playingMotion = motion;
  motionStart = performance.now();
  motionPaneButtons('[data-motion]').forEach(button => {
    button.disabled = true;
  });
  motionFrame = requestAnimationFrame(stepMotion);
}

// Motion recorder. It samples the live drag poses every frame, so whatever
// the pointer does becomes a track in exactly the units playback replays.
let recordFrame = 0;
let recordStart = 0;
let recordSamples;
let recordedMotion;

function motionPaneButtons(selector) {
  return [...motionList?.querySelectorAll(selector) || [],
    ...recordedList?.querySelectorAll(selector) || []];
}

function setMotionHint(text) {
  if (motionHint) motionHint.textContent = text || '';
}

function sampleRecording(time) {
  recordSamples.push({
    time: (time - recordStart) / 1000,
    poses: Object.fromEntries(dragPoses.map(pose =>
      [pose.part, [pose.x, pose.y, pose.angle]])),
  });
  recordFrame = requestAnimationFrame(sampleRecording);
}

function startRecording() {
  stopMotion();
  clearDragPose();
  update();
  recordedMotion = undefined;
  recordSamples = [];
  recordStart = performance.now();
  if (saveMotionButton) saveMotionButton.disabled = true;
  recordButton?.setAttribute('aria-pressed', 'true');
  if (recordButton) recordButton.textContent = '停止录制';
  setMotionHint('录制中，拖动角色摆动作');
  recordFrame = requestAnimationFrame(sampleRecording);
}

// Drop a sample whenever a straight line between its neighbours already
// describes it. The result keeps every turn of the gesture and little else.
function thinTrack(track, tolerance = .25) {
  const kept = [track[0]];
  for (let index = 1; index < track.length - 1; index++) {
    const previous = kept[kept.length - 1], next = track[index + 1];
    const current = track[index];
    const span = next[0] - previous[0];
    const amount = span > 0 ? (current[0] - previous[0]) / span : 0;
    const off = [1, 2, 3].some(axis =>
      Math.abs(lerp(previous[axis], next[axis], amount) - current[axis]) > tolerance);
    if (off) kept.push(current);
  }
  kept.push(track[track.length - 1]);
  return kept.map(frame => frame.map(value => Math.round(value * 100) / 100));
}

function buildRecordedMotion() {
  const parts = [...new Set(recordSamples.flatMap(sample => Object.keys(sample.poses)))];
  // Every motion starts and ends at the rest pose, so the character is handed
  // back exactly as it was found. A recording stopped mid-gesture is closed
  // with a short return to rest.
  const last = recordSamples[recordSamples.length - 1];
  const settled = parts.every(part => !last.poses[part]
    || Math.hypot(last.poses[part][0], last.poses[part][1]) < .05);
  const duration = Math.round((last.time + (settled ? 0 : .45)) * 100) / 100;
  const tracks = {};
  for (const part of parts) {
    const track = recordSamples.map(sample =>
      [sample.time, ...(sample.poses[part] || [0, 0, 0])]);
    track.push([duration, 0, 0, 0]);
    tracks[part] = thinTrack(track);
  }
  return { id: `recorded-${Date.now()}`, name: '', duration, tracks, eased: false };
}

function stopRecording() {
  if (!recordFrame) return;
  cancelAnimationFrame(recordFrame);
  recordFrame = 0;
  recordButton?.setAttribute('aria-pressed', 'false');
  if (recordButton) recordButton.textContent = '开始录制';
  if (!recordSamples || recordSamples.length < 4
    || !recordSamples.some(sample => Object.keys(sample.poses).length)) {
    setMotionHint('没有录到动作，再试一次');
    return;
  }
  recordedMotion = buildRecordedMotion();
  const frames = Object.values(recordedMotion.tracks)
    .reduce((sum, track) => sum + track.length, 0);
  if (saveMotionButton) saveMotionButton.disabled = false;
  setMotionHint(`已录 ${recordedMotion.duration.toFixed(1)} 秒 · ${frames} 个关键帧，点保存`);
}

function toggleRecording() {
  if (recordFrame) stopRecording();
  else startRecording();
}

function downloadMotion(motion) {
  const source = JSON.stringify(motion, null, 2);
  const url = URL.createObjectURL(new Blob([source], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${motion.id}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

const RECORDED_MOTIONS_KEY = 'yuren-recorded-motions';

function storeRecordedMotions() {
  try {
    localStorage.setItem(RECORDED_MOTIONS_KEY,
      JSON.stringify(motionLibrary.filter(motion => motion.recorded)));
  } catch { /* private browsing: the motion still plays this session. */ }
}

function loadRecordedMotions() {
  try {
    const stored = JSON.parse(localStorage.getItem(RECORDED_MOTIONS_KEY) || '[]');
    for (const motion of stored) {
      if (motion?.id && motion.tracks) motionLibrary.push(motion);
    }
  } catch { /* ignore unreadable storage */ }
}

function saveRecordedMotion() {
  if (!recordedMotion) return;
  const name = (prompt('动作名称', '自定义动作') || '').trim();
  if (!name) return;
  const motion = { ...recordedMotion, name, recorded: true };
  motionLibrary.push(motion);
  recordedMotion = undefined;
  if (saveMotionButton) saveMotionButton.disabled = true;
  storeRecordedMotions();
  renderMotionLibrary();
  downloadMotion(motion);
  setMotionHint(`已保存“${name}”，JSON 也下载了一份`);
}

function renameMotion(id) {
  const motion = motionLibrary.find(entry => entry.id === id);
  if (!motion?.recorded) return;
  const name = (prompt('动作名称', motion.name) || '').trim();
  if (!name || name === motion.name) return;
  motion.name = name;
  storeRecordedMotions();
  renderMotionLibrary();
  setMotionHint(`已改名为“${name}”`);
}

function deleteMotion(id) {
  const index = motionLibrary.findIndex(motion => motion.id === id);
  if (index < 0 || !motionLibrary[index].recorded) return;
  if (playingMotion?.id === id) {
    stopMotion();
    clearDragPose();
    update();
  }
  const [removed] = motionLibrary.splice(index, 1);
  storeRecordedMotions();
  renderMotionLibrary();
  setMotionHint(`已删除“${removed.name}”`);
}

function renderMotionLibrary() {
  if (!motionList || !recordedList) return;
  motionList.textContent = '';
  recordedList.textContent = '';
  for (const motion of motionLibrary) {
    const play = document.createElement('button');
    play.type = 'button';
    play.dataset.motion = motion.id;
    play.textContent = motion.name;
    if (!motion.recorded) {
      motionList.appendChild(play);
      continue;
    }
    // A recording lives in the recorder tab, with its own row of controls.
    // A recording keeps its own row: play it back to check it, download the
    // file again, or throw it away.
    const row = document.createElement('div');
    row.className = 'motion-row';
    play.title = `${motion.duration.toFixed(1)} 秒`;
    const rename = document.createElement('button');
    rename.type = 'button';
    rename.dataset.renameMotion = motion.id;
    rename.title = '改名';
    rename.textContent = '✎';
    const download = document.createElement('button');
    download.type = 'button';
    download.dataset.downloadMotion = motion.id;
    download.title = '下载 JSON';
    download.textContent = '↓';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.dataset.deleteMotion = motion.id;
    remove.title = '删除';
    remove.textContent = '✕';
    row.append(play, rename, download, remove);
    recordedList.appendChild(row);
  }
}

function dragPartAt(target, point) {
  const handle=target.closest?.('[data-drag-part]');
  // Resolve opaque geometry front-to-back before enlarged invisible handles.
  // Otherwise the head/body hit circle can steal a foot crossing over it.
  const layers=[...svg.children].filter(node=>node.dataset.part).reverse();
  const front=layers.find(group=>[...group.querySelectorAll('path')].some(node=>
    !node.closest('[data-fabric]') &&
    node.getAttribute('display')!=='none' && node.getAttribute('fill')
    && ((node.getAttribute('fill')!=='none' && node.isPointInFill(point))
      || (node.getAttribute('stroke') && node.isPointInStroke(point)))));
  if(front) {
    const part=front.dataset.part;
    const name=handle?.dataset.dragPart;
    if(name?.endsWith('Wrist') && name.replace('Wrist','Hand')===part)
      return {name,part:name};
    return {name:part,part};
  }
  if(handle) return {name:handle.dataset.dragPart,
    part:handle.dataset.dragPart.replace('Foot','')};
  return null;
}

function createDragLayer() {
  dragLayer = document.createElementNS(SVG_NS, 'g');
  dragLayer.id = 'drag-layer';
  dragLayer.setAttribute('fill', 'transparent');
  dragLayer.setAttribute('pointer-events', 'all');

  [
    ['head', 24],
    ['body', 26],
    ['leftHand', 13],
    ['rightHand', 13],
    ['leftLeg', 16],
    ['rightLeg', 16],
    ['leftLegFoot', 12],
    ['rightLegFoot', 12],
    ['leftWrist', 5.5],
    ['rightWrist', 5.5],
  ].forEach(([name, radius]) => {
    const hit = document.createElementNS(SVG_NS, 'circle');
    hit.dataset.dragPart = name;
    hit.setAttribute('r', radius);
    hit.setAttribute('class', 'drag-handle');
    dragLayer.appendChild(hit);
  });

  svg.addEventListener('pointerdown', event => {
    if (activeDrag) return;
    // A pointer always wins over a playing motion.
    stopMotion();
    const point = svgPoint(event);
    const selection = dragPartAt(event.target, point);
    if (!selection) return;
    const pose = createDragPose(selection.part);
    dragPoses.push(pose);
    activeDrag = {
      id: event.pointerId,
      name: selection.name,
      pose,
      x: point.x,
      y: point.y,
      intentX: 0,
      intentY: 0,
      time: performance.now(),
    };
    if (selection.part.endsWith('Wrist')) {
      const side = selection.part === 'leftWrist' ? 'left' : 'right';
      const warp = buildWarp(Object.fromEntries(
        Object.entries(controls).map(([key, input]) => [key, Number(input.value)])
      ));
      // Turn around the hinge the arm actually draws, so the palm does not
      // jump when the gesture begins on a bent forearm.
      const center = armGeometry(side, warp).wrist;
      activeDrag.center = center;
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      activeDrag.nearCenter = Math.hypot(dx, dy) <= 1.5;
      // Grabbing the dot itself must not snap the palm towards the cursor
      // before the gesture has any direction: the turn starts at zero and
      // accumulates from the pointer's own travel around the hinge.
      activeDrag.previousAngle = activeDrag.nearCenter
        ? null
        : Math.atan2(dy, dx);
    }
    updatePartOrder();
    svg.setPointerCapture(event.pointerId);
    startSpring();
    event.preventDefault();
  });

  svg.addEventListener('pointermove', event => {
    if (!activeDrag || activeDrag.id !== event.pointerId) return;
    // Browsers may combine many high-frequency pointer samples. Consume the
    // newest one, but redraw at most once per animation frame.
    const samples = event.getCoalescedEvents?.() || [event];
    const latestEvent = samples[samples.length - 1] || event;
    const point = svgPoint(latestEvent);
    const pose = activeDrag.pose;
    const deltaTime = Math.max((performance.now() - activeDrag.time) / 1000, .001);
    // A wrist gesture turns and pulls at once. Swinging around the hinge
    // accumulates the turn; travelling away from it carries the whole chain
    // through the shared hand path below.
    if (pose.part.endsWith('Wrist')) {
      const dx = point.x - activeDrag.center.x;
      const dy = point.y - activeDrag.center.y;
      if (Math.hypot(dx, dy) > 1.5) {
        const nextAngle = Math.atan2(dy, dx);
        if (activeDrag.previousAngle !== null) {
          const change = Math.atan2(
            Math.sin(nextAngle - activeDrag.previousAngle),
            Math.cos(nextAngle - activeDrag.previousAngle)
          );
          const otherAngle = dragPoses.reduce((sum, other) =>
            sum + (other !== pose && other.part === pose.part ? other.angle : 0), 0);
          const next = Math.max(-MAX_WRIST_ANGLE - otherAngle,
            Math.min(MAX_WRIST_ANGLE - otherAngle, pose.angle + change));
          const applied = next - pose.angle;
          pose.angle = next;
          pose.av = Math.max(-15, Math.min(15, lerp(pose.av, applied / deltaTime, .3)));
        }
        activeDrag.previousAngle = nextAngle;
        activeDrag.nearCenter = false;
      } else {
        if (!activeDrag.nearCenter) activeDrag.previousAngle = null;
      }
    }
    const next = projectedDragPosition(activeDrag, point);
    const stepX = next.x - pose.x;
    const stepY = next.y - pose.y;
    if (pose.part === 'head' || pose.part === 'body' || handPart(pose.part)) {
      pose.swayX = Math.max(-7, Math.min(7, pose.swayX - stepX * .45));
      pose.swayY = Math.max(-4, Math.min(4, pose.swayY - stepY * .28));
    }
    const instantVx = stepX / deltaTime;
    const instantVy = stepY / deltaTime;
    pose.vx = lerp(pose.vx, instantVx, .35);
    pose.vy = lerp(pose.vy, instantVy, .35);
    const speed = Math.hypot(pose.vx, pose.vy);
    if (speed > 180) {
      pose.vx *= 180 / speed;
      pose.vy *= 180 / speed;
    }
    pose.x = next.x;
    pose.y = next.y;
    Object.assign(activeDrag, { x: point.x, y: point.y, time: performance.now() });
    scheduleDragUpdate();
  });

  svg.addEventListener('pointerup', event => releaseDrag(event.pointerId));
  svg.addEventListener('pointercancel', event => releaseDrag(event.pointerId));
  svg.addEventListener('lostpointercapture', event => releaseDrag(event.pointerId));

  // Pointer capture normally delivers release to the circle. These window
  // listeners cover fast exits, browser gesture cancellation and focus loss,
  // preventing an interaction from remaining permanently active.
  window.addEventListener('pointerup', event => releaseDrag(event.pointerId));
  window.addEventListener('pointercancel', event => releaseDrag(event.pointerId));
  window.addEventListener('blur', () => releaseDrag());

  svg.appendChild(dragLayer);
}

// Where the mouth is: -1 shut, 0 exactly as drawn, 1 wide open. Motions
// carry it; a plain drag never does, so dragging the character around
// leaves the mouth as the artwork has it.
function mouthPose() {
  const posed = dragPoses.find(pose => pose.mouth);
  return posed ? posed.mouth : 0;
}

function cigaretteVisible(){return selectedDecorations.neck==='cigarette';}
function update() {
  cigarettePaths.forEach(node=>{node.style.display=cigaretteVisible()?'':'none';});
  restoreBasePaint();
  if (!svg) return;
  const config = Object.fromEntries(
    Object.entries(controls).map(([key, input]) => [key, Number(input.value)])
  );
  const warp = buildWarp(config);
  const basePoints = [];
  const armShapes = { left: armGeometry('left', warp), right: armGeometry('right', warp) };
  updateArmOcclusion(armShapes);

  const pochita = !!skinTrait('tail');
  paths.forEach(({ node, original, role, index }) => {
    // Pochita's eye is a rounder, much larger one, so that skin swaps the
    // white's own outline as well as the colours.
    // A hood worn over the head has the last word on the eye.
    const eyeWhite = selectedDecorations.helmet === 'shark-hood'
      ? sharkEyeWhite : skinTrait('eyeWhite');
    const lip = skinTrait('lip');
    const skinHead=skinHeadContour();
    if(skinHead&&(index===5||index===-1&&role==='head'))original=skinHead+(index===-1?'Z':'');
    if (index === 8 && eyeWhite) original = eyeWhite;
    else if (lip && original.includes(lip.from))
      original = original.replace(lip.from, lip.to);
    const transformed = transformPath(original, (x, y) => {
      const pointRole = role.startsWith('helmet-') ? 'helmet' : classifyPoint(x, y, role);
      const point = warp(x, y, pointRole);
      basePoints.push(point.x, point.y);
      return applyDragPose(point, x, y, pointRole==='cigarette'?'head':pointRole, warp);
    });
    node.setAttribute('d', transformed);
    if(index===10&&skinTrait('scar'))node.style.display='none';
    else if(index===9||index===10)node.style.display=!!muscleSkinVariants[selectedDecorations.skin]?'none':'';
    if(index===1||index===-1&&node.getAttribute('stroke')==='none')
      node.setAttribute('fill',index===1?(skinTrait('hornColor')||skinColor()):skinColor());
    if(index===8){
      node.setAttribute('fill',skinTrait('eye')||'white');
      // Keep the cut edge for the pupil to be clipped against.
      if(sharkEyeClipPath&&selectedDecorations.helmet==='shark-hood')
        sharkEyeClipPath.setAttribute('d',transformed);
    }
  });
  // The pupil belongs to the skin, the cut belongs to the hood: clipping it
  // to the eye white means any future skin's pupil is cut the same way.
  if(pupilClipGroup){
    if(selectedDecorations.helmet==='shark-hood')
      pupilClipGroup.setAttribute('clip-path','url(#shark-eye-clip)');
    else pupilClipGroup.removeAttribute('clip-path');
  }
  if(scarNode)scarNode.style.display=skinTrait('scar')?'':'none';
  if(spongeBodyNode)spongeBodyNode.style.display=skinTrait('sponge')?'':'none';
  spongeHeadPaths.forEach(node=>{node.style.display=skinTrait('spongeFace')?'':'none';});
  largePartyHatPaths.forEach(node=>{node.style.display=selectedDecorations.helmet==='large-party-hat'?'':'none';});
  paintHeadVariants(capPaths,capVariants);
  paintHeadVariants(divingGogglePaths,divingGoggleVariants);
  if(swimRingBack)swimRingBack.innerHTML=swimRingMarkup(warp,selectedDecorations.outerwear,false);
  if(swimRingFront)swimRingFront.innerHTML=swimRingMarkup(warp,selectedDecorations.outerwear,true);
  eyeBandPaths.forEach(node=>{
    const variant=eyeBandVariants[selectedDecorations.helmet];
    node.style.display=variant?'':'none';
    node.setAttribute('fill',variant?.color||eyeBandVariants['blue-eye-band'].color);
  });
  teardropPaths.forEach(node=>{node.setAttribute('d',teardropPath(warp));node.style.display=selectedDecorations.helmet==='teardrop-earrings'?'':'none';});
  if(muscleLinesNode)muscleLinesNode.style.display=!!muscleSkinVariants[selectedDecorations.skin]?'':'none';
  pochitaCordPaths.forEach(node=>{node.style.display=pochita&&POCHITA_TAIL_VISIBLE?'':'none';});
  paths.filter(path=>path.index===1||path.index===11).forEach(({node})=>{
    node.style.display=hornHidden()?'none':'';
  });
  if(kappaMouthClipPath&&headFillNode)kappaMouthClipPath.setAttribute('d',headFillNode.getAttribute('d'));
  kappaSkinPaths.forEach((node,i)=>{node.style.display=(kappaSkinSpecs[i].role==='body'?selectedDecorations.skin==='kappa':skinTrait('kappaDetails'))?'':'none';});
  hypnoticEyePaths.forEach(node=>{node.style.display=skinTrait('eyeRings')?'':'none';});
  lipstickFacePaths.forEach(node=>{node.style.display=skinTrait('lipstickDetails')?'':'none';});
  clownMarkPaths.forEach(node=>{node.style.display=skinTrait('marks')?'':'none';});
  if(alienAntennaPath){
    alienAntennaPath.style.display=antennaShown()?'':'none';
    alienAntennaPath.setAttribute('fill',skinColor());
  }
  // The party hat is the horn in yellow; its spots and bobble are drawn on
  // top of it, and they warp with the head because the horn does.
  if(selectedDecorations.helmet==='party-hat'){
    paths.filter(path=>path.index===1).forEach(({node})=>
      node.setAttribute('fill',decorationColors.partyHat));
  }
  // The hood is the head itself, repainted: its own outline and the jaw
  // already behave correctly, so only the colour changes.
  if(selectedDecorations.helmet==='shark-hood'){
    headFillNode?.setAttribute('fill',decorationColors.sharkHood);
    paths.filter(path=>path.index===1).forEach(({node})=>
      node.setAttribute('fill',decorationColors.sharkHood));
  }
  // With the cowl on, the head is cut off at the cowl's own brow line, so
  // only the cowl shows above it whatever shape the head underneath has.
  if(batCowlClipPath){
    const cowled=selectedDecorations.helmet==='batfish-cowl';
    if(cowled){
      batCowlClipPath.setAttribute('d',transformPath(batCowlFaceClip,
        (x,y)=>applyDragPose(warp(x,y,'headShell'),x,y,'headShell',warp)));
    }
    const headOutline=paths.find(path=>path.index===5)?.node;
    for(const node of [headFillNode,headOutline]){
      if(!node)continue;
      if(cowled)node.setAttribute('clip-path','url(#bat-cowl-face-clip)');
      else node.removeAttribute('clip-path');
    }
  }
  scarfPaths.forEach(({node})=>{
    node.style.display=selectedDecorations.neck==='scarf'?'':'none';
  });

  const legShapes = {left:legGeometry('left',warp),right:legGeometry('right',warp)};
  updateLegOcclusion(legShapes,warp);
  const crouch=smooth(bodyCompression(warp).amount/legCompressionLimit(warp).limit);
  if(pochita&&pochitaCordPaths.length){
    // It swings out to his right as he folds up, and trails behind
    // whichever way the body is being pulled. Positive turns it to his
    // left, so the crouch term is negative.
    const lean=dragPoses.reduce((sum,pose)=>
      pose.part==='head'||pose.part==='body'?sum+pose.x:sum,0);
    const sway=Math.max(-.7,Math.min(.7,-.5*crouch+.01*lean));
    const tail=pochitaTailPaths(warp,sway,warp(47,193,'legs').y);
    pochitaCordPaths.forEach((node,i)=>node.setAttribute('d',tail[i]));
  }
  const underwear=wearingUnderwear();
  if(underwearRootCutout)underwearRootCutout.setAttribute('d',underwear?(thongVariants[selectedDecorations.pants]?torsoGarmentPath(redThongSource(config.legs),warp):garmentPath(briefVariants[selectedDecorations.pants]?briefsSource:pantsSource,warp)):'');
  const suitJacket=selectedDecorations.shirt==='suit-jacket';
  const ivoryTunic=selectedDecorations.shirt==='ivory-tunic';
  const batArmor=selectedDecorations.shirt==='batfish-armor';
  const roundLongSleeve=selectedDecorations.shirt==='plain';
  const collaredShirt=selectedDecorations.shirt==='white-tie-shirt';
  const longSleeve=selectedDecorations.shirt==='white-tie-shirt'||selectedDecorations.shirt==='plain'||suitJacket||ivoryTunic||batArmor;
  const teeStyle=teeStyles[selectedDecorations.shirt];
  const isTee=!!teeStyle;
  const wideFlare=widePantFlares[selectedDecorations.pants]||0;
  const widePants=wideFlare>0;
  const kneeShortColors={
    'green-ultra-shorts':'#264F02','student-shorts':'#102f68','pink-shorts':decorationColors.pinkShorts,
    'orange-shorts':decorationColors.orangeShorts,
    'black-shorts':decorationColors.blackShorts,

    'slight-wide-shorts':decorationColors.wideShorts,'extra-wide-shorts':decorationColors.wideShorts,
  };
  legParts.forEach(({segments,bootFill,bootOutline,sneakerDetails,shoeClip,
      shoeCuff,shortHem,bootTop,wideHem,shortsClip,skinClip,ultraShortsClip,exposedThighClip,wideClip,ankleClip,
      calfEdges,calfOverlay,fabricLayers,fabricMasks,jeansSeams,jeansTextures,jeansHoleMasks,jeansSkin,jeansGradients,crease,
      side,group,rootBlack,thighBlack,shinBlack,thighSkin,shinSkin,sockTopClip,sockBottomClip,sockTop,spongeLegMarks})=>{
    const shape=legShapes[side];
    // Every sock segment is cut at the same line, not just the first: the
    // stroke is far wider than the gap between samples, so the round caps
    // of the next two segments used to pile up above it as a dome.
    sockBottomClip.ownerClip?.setAttribute('clip-path',`url(#${side}-${isSpaceSweatpants()&&widePants?'wide':'ankle'}-hem-clip)`);
    const sockStart=isSpaceSweatpants()?28:studentSockStart();
    sockTopClip.setAttribute('points',limbClipPoints(shape,sockStart,false));
    sockBottomClip.setAttribute('points',limbClipPoints(shape,sockStart,true));
    const jobsMesh=selectedDecorations.pants==='jobs-gradient-jeans'?jobsClothMesh(shape,side,config.legs,warp):null;
    if(jobsMesh)for(const patch of jobsMesh.flat())if(patch.g){
      const node=jeansGradients[patch.index];
      for(const k of ['x1','y1','x2','y2'])node.setAttribute(k,patch.g[k]);
    }
    const open=denimVariants[selectedDecorations.pants]?.finish==='large-ripped-denim-jeans';
    const holes=[0,1].map(part=>open?largeJeansHoles(shape,part,side,config.legs):[]);
    jeansHoleMasks.forEach((node,part)=>{node.innerHTML='<rect x="-1000" y="-1000" width="2000" height="2000" fill="white"/>'+holes[part].map(d=>`<path d="${d}" fill="black"/>`).join('');});
    jeansSkin.forEach((node,part)=>{node.innerHTML=holes[part].map(d=>`<path d="${d}" fill="${skinColor()}"/>`).join('');});
    jeansTextures.forEach((node,part)=>{if(selectedDecorations.pants==='jobs-gradient-jeans')node.setAttribute('mask',`url(#${side}-fabric-${part})`);else node.removeAttribute('mask');node.innerHTML=jeansTextureMarkup(shape,part,side,selectedDecorations.pants,config.legs);});
    jeansSeams.forEach((node,part)=>{
      node.setAttribute('d',jeansLegSeam(shape,part,config.legs,side));
      node.style.display=denimJeansIds.includes(selectedDecorations.pants)&&selectedDecorations.pants!=='jobs-gradient-jeans'?'':'none';
    });
    const foregroundUnderwear=underwear&&legInFront[side];
    for(const node of [rootBlack,thighBlack,shinBlack]){
      if(foregroundUnderwear||node===shinBlack&&pantsCoverThigh()&&shape.creaseOpacity>.55)node.removeAttribute('mask');
      else node.setAttribute('mask',`url(#${side}-hip-${node===rootBlack?'root':'contour'}-mask)`);
    }
    const kneeShorts=!!kneeShortColors[selectedDecorations.pants];
    const shortsEnd=shortsHemIndex();
    const shortsFlare=kneeShortFlares[selectedDecorations.pants]||0;
    const wideShorts=shortsFlare>0;
    const splitCloth=pantsCoverThigh();
    const darkBoots=['dark-boots','batfish-boots'].includes(selectedDecorations.shoes);
    const wideBoots=bootCoversPants(shape,wideFlare);
    const bootColor=bootProfiles[selectedDecorations.shoes]?.color||(selectedDecorations.shoes==='batfish-boots'?decorationColors.batBlack:darkBoots?decorationColors.darkBoots:decorationColors.brownBoots);
    const wearingTallBoots=selectedDecorations.shoes==='brown-boots'||darkBoots||!!bootProfiles[selectedDecorations.shoes];
    // A wide trouser keeps its full width and fabric over the boot shaft.
    // Other trousers tuck into the boot, which replaces the lower leg.
    const tallBoots=wideBoots||wearingTallBoots&&!widePants;
    const spaceCuff=isSpaceSweatpants()&&!tallBoots;
    spongeLegMarks?.forEach(({node,index,rx,ry})=>{
      node.setAttribute('d',spongeLegPath(shape,index,rx,ry));
      const covered=widePants||wearingJumpsuit()||['plain','batfish-trousers'].includes(selectedDecorations.pants)
        ||(kneeShorts||boxerVariants[selectedDecorations.pants])&&index<=shortsEnd+2
        ||tallBoots&&index>=19||studentSockVisible(index);
      node.style.display=skinTrait('sponge')&&!covered?'':'none';
    });
    // The boot owns all material below the cuff, including denim details.
    for(const nodes of [jeansSkin,jeansTextures])nodes.forEach((node,part)=>{node.style.display=tallBoots&&part===1?'none':'';});
    if(tallBoots)jeansSeams[1].style.display='none';
    // A boot shaft is continuous material from the knee into the foot, the
    // same as a trouser leg, so it is drawn the same way: the calf's own
    // black strokes are hidden and two open side edges drawn instead.
    // Leaving the strokes on put a round cap across the boot wherever the
    // knee folded, and it showed with or without trousers underneath.
    const continuousCalf=splitCloth&&!kneeShorts&&!widePants||tallBoots;
    // A bare calf under shorts also ends at the shoe mouth. Its front-layer
    // copy must not redraw the tube's rounded underside over the foot — on
    // a boot that was the line that appeared at the ankle in a squat.
    const ankleBound=!widePants;
    // Continuous cloth over a shoe finishes on the shoe's own mouth
    // corners, so the trouser's side edge and the shoe's outline join
    // instead of leaving a nick between them.
    calfEdges.setAttribute('d',trouserCalfEdges(wideBoots?workerBootShoe(shape):shape,wideFlare,config.legs,
      !widePants||tallBoots,wideBoots?workerBootExtra:null,continuousCalf?19:29));
    calfEdges.style.display=continuousCalf||!widePants?'':'none';
    // The flared leg passes in front of the shoe upper. In other outfits the
    // shoe sits on top of the limb instead.
    const shoeAnchor=widePants&&!tallBoots?shinBlack:shoeCuff;
    // A folded calf covers the hidden part of the shorts cuff. Paint the
    // colored thigh and its hem first, then the calf, so the hem cannot
    // continue across the visible skin as a second diagonal.
    const layers=splitCloth
      ?[thighBlack,thighSkin,fabricLayers[0].group,shortHem,
        shinBlack,shinSkin,fabricLayers[1].group,calfEdges,sockTop]
      :[thighBlack,shinBlack,thighSkin,shinSkin,shortHem,
        ...fabricLayers.map(layer=>layer.group),calfEdges,sockTop];
    layers.forEach(layer=>group.insertBefore(layer,crease));
    group.insertBefore(bootFill,shoeAnchor);
    group.insertBefore(bootOutline,shoeAnchor);
    for(const node of calfOverlay.querySelectorAll('[data-calf-shoe]'))node.style.display=widePants?'':'none';
    const clothEnd=kneeShorts&&!tallBoots?shortsEnd:19;
    shortsClip.setAttribute('points',limbClipPoints(shape,clothEnd,false));
    skinClip.setAttribute('points',limbClipPoints(shape,clothEnd,true));
    wideClip.setAttribute('points',legEndClipPoints(shape,config.legs));
    ankleClip.setAttribute('points',ankleHemClipPoints(shape));
    if(ankleBound&&!bootProfiles[selectedDecorations.shoes])
      calfOverlay.setAttribute('clip-path',`url(#${side}-ankle-hem-clip)`);
    else calfOverlay.removeAttribute('clip-path');
    // Side-edge samples may reach past the hem during compression. Clip
    // the whole open contour, including its stroke, at the fabric endpoint.
    if(widePants&&!tallBoots)
      calfEdges.setAttribute('clip-path',`url(#${side}-wide-hem-clip)`);
    // A boot's side edges run on under its own shoe, which is painted over
    // them, so they are not cut at the shoe mouth: cutting them there left
    // a nick of background between the end of the edge and the start of
    // the shoe's outline whenever the leg was pulled long.
    else if(continuousCalf&&!tallBoots)calfEdges.setAttribute('clip-path',`url(#${side}-ankle-hem-clip)`);
    else calfEdges.removeAttribute('clip-path');
    // Long cloth keeps the original calf clip. Ultra shorts clip only near
    // the cuff: a folded bare calf must be able to return across that plane.
    for(const node of [shinBlack,shinSkin,fabricLayers[1].group]) {
      if(splitCloth&&!(kneeShorts&&shortsEnd<19&&!tallBoots))node.setAttribute('clip-path',`url(#${side}-skin-hem-clip)`);
      else node.removeAttribute('clip-path');
    }
    // The folded calf is in front of the pelvis. Reuse the actual rendered
    // calf (including its fabric) above the waist fill, rather than repainting
    // isolated lines that the pelvis can cut into rectangular fragments.
    calfOverlay.style.display=(splitCloth||tallBoots)&&shape.creaseOpacity>.55?'':'none';
    updateLegClothPartition({segments,rootBlack,thighBlack,shinBlack,thighSkin,shinSkin},clothEnd);
    segments.forEach(({back,front},i)=>{
      // The bare-leg partition follows the actual cuff, including ultra shorts.
      // Otherwise the old index19 black tube starts inside exposed skin.
      // Below the angle threshold the cloth covers the thigh root. Once
      // raised in front, keep its full fill and outline together.
      for(const node of [back,front]){
        if(underwear&&!legInFront[side]&&i<10)node.setAttribute('mask','url(#underwear-root-mask)');
        else if(open&&node===front&&!(tallBoots&&i>=19))node.setAttribute('mask',`url(#${side}-jeans-holes-${i<19?0:1})`);
        else node.removeAttribute('mask');
      }
      const segmentPath=widePants&&!tallBoots&&i===31
        ?wideLegLastPath(shape,config.legs):shape.hose[i].d;
      back.setAttribute('d',segmentPath);
      if(i===0)back.setAttribute('stroke-linecap',shape.lifted?'round':'butt');
      // Continuous cloth still needs overlapping round segment caps. Butt
      // caps leave the wider black stroke exposed between adjacent samples,
      // producing small knee slashes even with no visible fold line.
      // The shared half-plane clips, rather than those caps, define the join.
      const cuffBoundary=(kneeShorts||tallBoots)&&(i>=clothEnd-3&&i<=clothEnd+4||i>=16&&i<=23);
      if(i!==0) back.setAttribute('stroke-linecap',cuffBoundary||i===31?'butt':'round');
      front.setAttribute('stroke-linecap',cuffBoundary||i===31?'butt':'round');
      const nearHem=i>=clothEnd-6&&i<=clothEnd+(kneeShorts&&shortsEnd<19?3:7);
      const clip=widePants&&!tallBoots&&i>=24
        ?`url(#${side}-wide-hem-clip)`
        // A boot's own shoe is drawn over the end of its shaft, so the
        // shaft keeps the wider shin clip and runs on under the shoe. Cut
        // at the shoe mouth instead and a hair of background shows through
        // on the outer side whenever the leg is pulled long.
        :ankleBound&&!tallBoots&&i>=24
          ?`url(#${side}-ankle-hem-clip)`
        :(splitCloth||tallBoots)&&nearHem
          ?`url(#${side}-${i<clothEnd?'shorts':'skin'}-hem-clip)`:null;
      for(const node of [back,front]) {
        if(clip) node.setAttribute('clip-path',clip);
        else node.removeAttribute('clip-path');
      }
      if((studentSockVisible(sockStart)&&i>=sockStart-1)||(spaceCuff&&i>=24))front.setAttribute('clip-path',`url(#${side}-sock-${i<sockStart?'top':'bottom'}-hem-clip)`);
      // The fill covers the middle of the black stroke, so it needs two
      // extra units to leave a one-unit outline on each side like the SVG.
      // The body fill masks part of the black underside near a folded hip.
      // Restore that lost ink along the round upper-leg contour only.
      const roundedHipInk=crouch*.75*(1-smooth(i/16));
      const wideExtra=wideShorts&&i<shortsEnd?wideShortsExtraWidth(i,shortsFlare,shortsEnd)
        :wideBoots&&i>=19?workerBootExtra(i):widePants&&(!tallBoots||i<19)?wideLegExtraWidth(i,wideFlare):0;
      // The shoe's mouth is a shade wider than the leg tube it stands on,
      // and the difference grows as the leg is pulled long: a wedge of
      // background then shows between the trouser's end and the side of
      // the shoe. The last samples are widened to the mouth's own width so
      // the two meet. This is not just a boot's problem — any trouser,
      // short or bare leg above any shoe shows it — but a flared leg hem
      // is wider than the shoe already and has its own ending.
      const bootMouth=!widePants&&i>=26
        ?Math.max(0,Math.hypot(shape.bootOuter.x-shape.bootInner.x,
          shape.bootOuter.y-shape.bootInner.y)-shape.hose[i].width)
          *smooth((i-26)/4)
        :0;
      back.setAttribute('stroke-width',shape.hose[i].width+2+roundedHipInk+wideExtra+bootMouth);
      front.setAttribute('d',segmentPath);
      front.setAttribute('stroke-width',shape.hose[i].width+wideExtra+bootMouth);
      const legColor=spaceCuff&&i>=28?sweatpantsAccent():tallBoots&&i>=19
        ? bootColor
        : wearingJumpsuit()
          ? workwearVariants[selectedDecorations.pants]?denimColor():selectedDecorations.pants==='navy-jumpsuit'
            ? decorationColors.navyJumpsuit:decorationColors.jumpsuit
        : ['plain','batfish-trousers'].includes(selectedDecorations.pants) ? selectedDecorations.pants==='batfish-trousers'?decorationColors.batArmor:decorationColors.pants
        : widePants ? widePantsPaint()
        : kneeShorts&&i<shortsEnd?kneeShortColors[selectedDecorations.pants]:exposedLegPaint(i);
      const patterned=selectedDecorations.pants==='loose-wide-pants'&&!(tallBoots&&i>=19);
      front.setAttribute('stroke',selectedDecorations.pants==='jobs-gradient-jeans'&&!(tallBoots&&i>=19)?jobsDenimColor((jobsMaterialReference()[side][i].y-jobsMaterialReference().waist)/(jobsMaterialReference().end-jobsMaterialReference().waist)):patterned?'#607e79':legColor);
      // Preserve both side edges explicitly; removing a whole thigh-shaped
      // area from the black tube also erased the inner fold and outer border.
      back.style.display=continuousCalf&&i>=19||!widePants&&i>=29?'none':'';

      for(const [part,fabricMask] of fabricMasks[i].entries()){
      fabricMask.setAttribute('stroke',part!==(i<19?0:1)||tallBoots&&i>=19?'none':'white');
      for(const name of ['d','stroke-width','stroke-linecap','clip-path']){
        const value=front.getAttribute(name);
        if(value!==null)fabricMask.setAttribute(name,value);
        else fabricMask.removeAttribute(name);
      }
      }

    });
    if(kneeShorts&&tallBoots&&shortsEnd<19)
      updateShortsBootPartition({side,segments,ultraShortsClip,exposedThighClip},shape,shortsEnd);
    const patterned=selectedDecorations.pants==='loose-wide-pants';
    const fabricPaths=jobsMesh|| (patterned?legFabricPaths(shape,side,config.legs):null);
    fabricLayers.forEach(({group,nodes},part)=>{
      group.style.display=(patterned||jobsMesh)&&!(tallBoots&&part===1)?'':'none';
      if(patterned||jobsMesh){
        while(nodes.length<fabricPaths[part].length){
          const path=document.createElementNS(SVG_NS,'path');group.appendChild(path);nodes.push(path);
        }
        nodes.forEach((node,i)=>{
          const patch=fabricPaths[part][i];node.setAttribute('d',patch?.d||'');
          if(patch){node.setAttribute('fill',patch.color);node.setAttribute('stroke',jobsMesh?patch.color:'none');node.setAttribute('stroke-width',jobsMesh?'.25':'0');}
        });
      }
    });
    // A flared trouser ends above the shoe, and the further the leg is
    // stretched the higher that hem sits: a fixed three-unit ankle stopped
    // short of it and left a wedge of background between the two. The
    // ankle still keeps the shoe's own width and direction — it is only
    // made long enough to stay tucked behind the hem.
    const shoeExtension=widePants&&!tallBoots?Math.max(3,wideLegHemPoints(shape,wideFlare||5.5,config.legs)
      .reduce((most,p)=>Math.max(most,(p.x-shape.bootOuter.x)*shape.shoeUp.x+(p.y-shape.bootOuter.y)*shape.shoeUp.y),0)+1.5):3;
    let shoe=widePants&&!tallBoots?extendedShoe(shape,shoeExtension):{fill:shape.bootFill,outline:shape.bootOutline};
    if(wideBoots){const boot=workerBootShoe(shape);shoe={fill:boot.bootFill,outline:boot.bootOutline};}
    const sneakers=selectedDecorations.shoes==='gray-sneakers';
    sneakerDetails.innerHTML=selectedDecorations.shoes==='navy-slippers'?slipperMarkup(shape,side):sneakers?jobsSneakerDetails(shape,side):selectedDecorations.shoes==='navy-sandals'?colorblockShoeDetails(shape,side,skinColor()):selectedDecorations.shoes==='colorblock-shoes'?colorblockShoeDetails(shape,side):'';
    group.insertBefore(sneakerDetails,['colorblock-shoes','navy-sandals'].includes(selectedDecorations.shoes)?bootOutline:shoeAnchor);
    bootFill.setAttribute('d',shoe.fill);
    bootFill.setAttribute('fill',selectedDecorations.shoes==='navy-slippers'?skinColor():selectedDecorations.shoes==='orange-shoes'?'#FF8215':wearingTallBoots?bootColor
      :selectedDecorations.shoes==='navy-sandals'?'#29496C':selectedDecorations.shoes==='colorblock-shoes'?'#2F465D':selectedDecorations.shoes==='brown-shoes'?'#623813':studentSockStyles[selectedDecorations.shoes]?'#111214':sneakers?'#bfbfbf':selectedDecorations.shoes==='black-dress-shoes'?decorationColors.dressShoes
      :selectedDecorations.shoes?decorationColors.shoes:skinColor());
    bootOutline.setAttribute('d',shoe.outline);
    shoeClip.setAttribute('d',shoe.fill);
    shoeCuff.style.display=selectedDecorations.shoes!=='navy-slippers'&&!tallBoots&&!widePants&&(selectedDecorations.shoes
      ||['plain','batfish-trousers'].includes(selectedDecorations.pants)
      ||wearingJumpsuit())?'':'none';
    shoeCuff.setAttribute('d',`M${clean(shape.bootOuter.x)} ${clean(shape.bootOuter.y)}`
      +`L${clean(shape.bootInner.x)} ${clean(shape.bootInner.y)}`);
    // The calf is painted over this line and hides its lower half. Shift the
    // one-unit stroke half a unit into the shorts so a full-width black edge
    // remains visible without making the stroke itself thicker.
    shortHem.setAttribute('d',cuffPath(shape,shortsEnd,wideShorts?wideShortsExtraWidth(shortsEnd,shortsFlare,shortsEnd)
      :widePants&&!tallBoots?wideLegExtraWidth(19,wideFlare):0,.5));
    // A full-length trouser has no transverse cuff at the knee. Its visible
    // fold comes from the calf side contour after thigh/calf occlusion.
    shortHem.style.display=kneeShorts&&(!tallBoots||shortsEnd<19)?'':'none';
    // The sock's own cuff: the same transverse line the shorts get, so the
    // white ends on a drawn edge instead of a bare colour change.
    sockTop.setAttribute('d',cuffPath(shape,sockStart,isSpaceSweatpants()&&widePants?wideLegExtraWidth(sockStart,wideFlare):0,.5));
    sockTop.style.display=studentSockVisible(sockStart)||spaceCuff?'':'none';
    bootTop.setAttribute('d',cuffPath(shape,19,wideBoots?workerBootExtra(19):0));
    bootTop.style.display=tallBoots?'':'none';
    wideHem.setAttribute('d',wideLegHemPath(shape,wideFlare||5.5,config.legs));
    wideHem.style.display=widePants&&!tallBoots?'':'none';
    crease.setAttribute('d',shape.crease);
    crease.style.opacity='1';
    // The fold crease belongs to a bare leg. Over a boot shaft — material
    // that runs on past the knee, like a trouser leg — it drew a diagonal
    // across the boot whenever the character crouched.
    crease.style.display=!splitCloth&&!tallBoots&&shape.creaseOpacity>.55?'':'none';
  });
  const torso=paths.find(p=>p.index===-1 && p.role==='mixed' && p.node.getAttribute('fill')!=='none');
  updateTorsoMaterial(torso.node,warp);

  if(bellyPatch){
    bellyPatch.setAttribute('d',torsoGarmentPath(milkFrogBellySource,warp));
    bellyClip.setAttribute('d',torso.node.getAttribute('d'));
    bellyPatch.style.display=skinTrait('belly')?'':'none';
  }
  garmentPaths.jeansDetails.innerHTML=isSpaceSweatpants()?spaceWaistMarkup(warp):denimJeansIds.includes(selectedDecorations.pants)?(workwearVariants[selectedDecorations.pants]?denimBibMarkup(warp):jeansDetailsMarkup(warp)):'';
  garmentPaths.jeansDetails.style.display=selectedDecorations.pants==='black-gray-sweatpants'||isSpaceSweatpants()||denimJeansIds.includes(selectedDecorations.pants)?'':'none';
  const spaceFit=isSpaceSweatpants()?spacePantsGeometry(warp):null;
  if(spaceCrotchMask)spaceCrotchMask.innerHTML='<rect x="-1000" y="-1000" width="2000" height="2000" fill="white"/>'+(spaceFit?spaceCrotchOccluders(legShapes,warp):'');
  if(spaceFit)garmentPaths.pantsCrotch.setAttribute('mask','url(#space-crotch-occlusion)');
  else garmentPaths.pantsCrotch.removeAttribute('mask');
  if(spaceCollarOverlay)spaceCollarOverlay.innerHTML=selectedDecorations.outerwear==='space-shirt'?spaceCollarMarkup(warp):'';
  garmentPaths.pants.setAttribute('d',spaceFit?spaceFit.fill:garmentPath(pantsSource,warp));
  garmentPaths.pants.setAttribute('fill',widePants?widePantsPaint():selectedDecorations.pants==='batfish-trousers'?decorationColors.batArmor:decorationColors.pants);
  garmentPaths.pants.style.display=['plain','batfish-trousers'].includes(selectedDecorations.pants)||widePants?'':'none';
  garmentPaths.pantsSides.setAttribute('d',garmentPath(pantsSidesSource,warp));
  garmentPaths.pantsSides.style.display=['plain','batfish-trousers'].includes(selectedDecorations.pants)||widePants?'':'none';
  garmentPaths.pantsCrotch.setAttribute('d',spaceFit?spaceFit.crotch:garmentPath(pantsCrotchSource,warp));
  garmentPaths.pantsCrotch.setAttribute('stroke-width',isSpaceSweatpants()?'1':'1.5');
  garmentPaths.pantsCrotch.style.display=['plain','batfish-trousers'].includes(selectedDecorations.pants)||widePants?'':'none';
  const wearingSkirt=selectedDecorations.pants==='skirt';
  const shorts=!!boxerVariants[selectedDecorations.pants]
    ||selectedDecorations.pants==='student-shorts'
    ||selectedDecorations.pants==='pink-shorts'
    ||selectedDecorations.pants==='orange-shorts'
    ||selectedDecorations.pants==='black-shorts'
    ||!!kneeShortFlares[selectedDecorations.pants];
  garmentPaths.shorts.setAttribute('d',garmentPath(pantsSource,warp));
  garmentPaths.shorts.setAttribute('fill',boxerVariants[selectedDecorations.pants]?.color||kneeShortColors[selectedDecorations.pants]
      ||decorationColors.pinkShorts);
  garmentPaths.shorts.style.display=shorts?'':'none';
  garmentPaths.shortsSides.setAttribute('d',garmentPath(pantsSidesSource,warp));
  garmentPaths.shortsSides.style.display=shorts?'':'none';
  garmentPaths.shortsCrotch.setAttribute('d',garmentPath(
    boxerVariants[selectedDecorations.pants]?shortsLowerSource:pantsCrotchSource,warp));
  garmentPaths.shortsCrotch.style.display=shorts?'':'none';
  garmentPaths.skirt.setAttribute('d',skirtPath(warp,config.legs));
  garmentPaths.skirt.style.display=wearingSkirt?'':'none';
  garmentPaths.briefs.setAttribute('d',garmentPath(briefsSource,warp));
  garmentPaths.briefs.setAttribute('fill',briefVariants[selectedDecorations.pants]?.color||decorationColors.redShorts);
  garmentPaths.briefs.style.display=briefVariants[selectedDecorations.pants]?'':'none';
  garmentPaths.redThong.setAttribute('d',torsoGarmentPath(redThongSource(config.legs),warp));
  garmentPaths.redThong.setAttribute('fill',thongVariants[selectedDecorations.pants]?.color||decorationColors.redThong);
  garmentPaths.redThong.style.display=thongVariants[selectedDecorations.pants]?'':'none';
  garmentPaths.redTriangle.setAttribute('d',redTrianglePath(warp));
  garmentPaths.redTriangle.style.display=selectedDecorations.shirt==='red-triangle'?'':'none';
  garmentPaths.shirt.setAttribute('d',ivoryTunic?torsoGarmentPath(ivoryBodySource,warp):garmentPath(selectedDecorations.shirt==='white-tie-shirt'?collaredBodySource:roundLongSleeve?teeSource:shirtSource,warp));
  garmentPaths.shirt.setAttribute('fill',selectedDecorations.shirt==='white-tie-shirt'?'#D9D9D9':batArmor?decorationColors.batArmor:ivoryTunic?decorationColors.royalWhite:suitJacket?decorationColors.suitNavy:decorationColors.shirt);
  for(const [key,source] of Object.entries({suitFront:suitFrontSource,suitFrontEdges:suitFrontEdgesSource,
      suitCollarLeft:suitCollarSources.left,suitCollarRight:suitCollarSources.right})) {
    garmentPaths[key].setAttribute('d',garmentPath(source,warp));
    garmentPaths[key].style.display=suitJacket?'':'none';
  }
  for(const [key,source] of Object.entries(tieSources)) {
    garmentPaths['tie'+key].setAttribute('d',garmentPath(source,warp));
    garmentPaths['tie'+key].style.display=suitJacket?'':'none';
  }
  for(const [key,spec] of Object.entries(ivorySpecs)){
    garmentPaths[key].setAttribute('d',spec.category==='cape'?backAccessoryPath(spec,warp):torsoGarmentPath(spec.source,warp,spec.category==='neck'||!!spec.neckline));
    if(spec.category==='cape'){
      const paint=capeStyles[selectedDecorations.cape]?.[key];
      garmentPaths[key].style.display=paint?'':'none';
      garmentPaths[key].setAttribute('fill',paint||spec.fill);
      if(spec.id==='angel-wings')garmentPaths[key].setAttribute('stroke',angelWingVariants[selectedDecorations.cape]?.stroke||spec.stroke);
    }else garmentPaths[key].style.display=selectedDecorations[spec.category]===spec.id?'':'none';
  }
  garmentPaths.spaceDetails.innerHTML='';
  garmentPaths.seaweedPants.innerHTML=selectedDecorations.pants==='seaweed-pants'?seaweedPantsMarkup(warp):'';
  garmentPaths.mosaicPants.innerHTML=selectedDecorations.pants==='mosaic-pants'?mosaicTopMarkup(warp,'pants'):'';
  garmentPaths.collaredDetails.innerHTML=selectedDecorations.shirt==='shell-top'?shellTopMarkup(warp):selectedDecorations.shirt==='mosaic-top'?mosaicTopMarkup(warp):selectedDecorations.shirt==='angel-vest'?angelVestMarkup(warp):selectedDecorations.shirt==='white-tie-shirt'?collaredShirtMarkup(warp):'';
  garmentPaths.shirt.style.display=longSleeve?'':'none';
  garmentPaths.shirtSides.setAttribute('d',ivoryTunic?torsoGarmentPath(ivorySidesSource,warp):garmentPath(shirtSidesSource,warp));
  garmentPaths.shirtSides.style.display=longSleeve?'':'none';
  const isVest=selectedDecorations.shirt==='blue-vest';
  garmentPaths.alohaBody.style.display=alohaSleeveStyles[selectedDecorations.outerwear]?'':'none';
  if(alohaSleeveStyles[selectedDecorations.outerwear])garmentPaths.alohaBody.innerHTML=alohaSleeveStyles[selectedDecorations.outerwear].space?spaceOuterMarkup(warp,false):alohaSleeveStyles[selectedDecorations.outerwear].blazer?blazerMarkup(warp):alohaSleeveStyles[selectedDecorations.outerwear].student?studentOuterMarkup(warp,selectedDecorations.outerwear==='secondary-jacket'):isWorkerJacket()?workerOuterMarkup(warp):alohaSleeveStyles[selectedDecorations.outerwear].suit?suitOuterMarkup(warp):alohaBodyMarkup(warp,alohaSleeveStyles[selectedDecorations.outerwear].openFront);
  // Clip only the inner garments, leaving the open chest and the skin intact.
  const outerStyle=alohaSleeveStyles[selectedDecorations.outerwear];
  const fittedOuter=!!outerStyle||selectedDecorations.outerwear==='green-vest';
  if(outerwearInnerClip){
    const boundary=outerStyle?.space?spaceBodySource:outerStyle?.student?(selectedDecorations.outerwear==='secondary-jacket'?secondaryBodySource:studentBodySource):outerStyle?.worker?workerBodySource:outerStyle
      ?`M26.1046 56.4524L67.7274 55.0466L67.5459 ${RIGHT_ARMPIT_Y}C68.2 80 69 101 69 112L25 112C25 101 26 80 27.478 ${LEFT_ARMPIT_Y}Z`
      :`M26.1046 56.4524L67.7274 55.0466L67.5459 ${RIGHT_ARMPIT_Y}C66.9913 84.8335 66.1 103 65.9 112L27.7 112C27.6 103 27.5018 84.2394 27.478 ${LEFT_ARMPIT_Y}Z`;
    outerwearInnerClip.setAttribute('d',outerStyle?.space||outerStyle?.student||outerStyle?.worker?workerGarmentPath(boundary,warp):outerStyle?.suit?garmentPath(shirtSource,warp):torsoGarmentPath(boundary,warp,true));
  }
  for(const key of [...innerTopKeys(),'shirtTop','teeNeck','teeTopLeft','teeTopRight']){
    const node=garmentPaths[key];
    if(!node)continue;
    if(fittedOuter&&!(key==='collaredDetails'&&selectedDecorations.shirt==='mosaic-top'))node.setAttribute('clip-path','url(#outerwear-inner-clip)');
    else node.removeAttribute('clip-path');
  }
  const isGreenVest=selectedDecorations.outerwear==='green-vest';
  garmentPaths.vest.setAttribute('d',garmentPath(vestSource,warp));
  garmentPaths.vest.style.display=isVest?'':'none';
  garmentPaths.vestSides.setAttribute('d',garmentPath(vestSidesSource,warp));
  garmentPaths.vestSides.style.display=isVest?'':'none';
  garmentPaths.vestNeck.setAttribute('d',garmentPath(vestNeckSource,warp));
  garmentPaths.vestNeck.style.display=isVest?'':'none';
  for(const side of ['left','right']) {
    const key='greenVest'+(side==='left'?'Left':'Right');
    garmentPaths[key].setAttribute('d',garmentPath(greenVestSources[side],warp));
    garmentPaths[key].style.display=isGreenVest?'':'none';
  }
  garmentPaths.shirtTop.setAttribute('d',
    transformPath(selectedDecorations.shirt==='white-tie-shirt'?collaredNeckSource:shirtTopSource,
      (x,y)=>applyDragPose(warp(x,y,'head'),x,y,'head',warp)));
  garmentPaths.shirtTop.style.display=longSleeve&&!roundLongSleeve&&selectedDecorations.helmet!=='space-helmet'&&selectedDecorations.outerwear!=='space-shirt'?'':'none';
  if(helmetBase)helmetBase.style.display=selectedDecorations.outerwear==='space-shirt'?'none':'';
  garmentPaths.jobsCollar.setAttribute('d',torsoGarmentPath(jobsCollarSource,warp,true));
  garmentPaths.jobsCollar.style.display=selectedDecorations.shirt==='black-turtleneck-tee'?'':'none';
  garmentPaths.jobsCollarEdge.setAttribute('d',torsoGarmentPath(jobsCollarEdgeSource,warp,true));
  garmentPaths.jobsCollarEdge.style.display=garmentPaths.jobsCollar.style.display;
  garmentPaths.tee.setAttribute('d',teeStyle?.bodySource?looseTopPath(teeStyle.bodySource,warp):teeStyle?.loose?looseTopPath(looseTopSource,warp):garmentPath(
    selectedDecorations.shirt==='black-turtleneck-tee'?redTeeSource:teeSource,warp));
  garmentPaths.tee.setAttribute('fill',teeStyle?.color||decorationColors.yellowTee);
  garmentPaths.tee.style.display=isTee?'':'none';
  garmentPaths.teeSides.setAttribute('d',teeStyle?.sidesSource?looseTopPath(teeStyle.sidesSource,warp):teeStyle?.loose?looseTopPath(looseTopSidesSource,warp):garmentPath(shirtSidesSource,warp));
  garmentPaths.teeSides.style.display=isTee?'':'none';
  garmentPaths.teeNeck.setAttribute('d',garmentPath(
    teeStyle?.neckSource|| (selectedDecorations.shirt==='black-turtleneck-tee'?redTeeNeckSource:teeNeckSource),warp));
  garmentPaths.teeNeck.style.display=(isTee||roundLongSleeve)&&selectedDecorations.shirt!=='black-turtleneck-tee'?'':'none';
  for(const side of ['left','right']) {
    const suffix=side==='left'?'Left':'Right';
    const top=transformPath(vestTopSources[side],
      (x,y)=>applyDragPose(warp(x,y,'head'),x,y,'head',warp));
    garmentPaths['vestTop'+suffix].setAttribute('d',
      top);
    garmentPaths['vestTop'+suffix].style.display=isVest?'':'none';
    garmentPaths['teeTop'+suffix].setAttribute('d',top);
    garmentPaths['teeTop'+suffix].style.display=(isTee||roundLongSleeve)&&!teeStyle?.neckSource?'':'none';
    garmentPaths['vestShoulder'+suffix].setAttribute('d',
      garmentPath(jumpsuitShoulderSources[side],warp));
    garmentPaths['vestShoulder'+suffix].style.display=
      isVest&&!armInFront[side]?'':'none';
  }
  for(const [key,source] of Object.entries(patchSources)) {
    garmentPaths['patch'+key].setAttribute('d',garmentPath(source,warp));
    garmentPaths['patch'+key].style.display=
      selectedDecorations.shirt==='patched-tee'?'':'none';
  }
  garmentPaths.waist.setAttribute('d',teeStyle?.hemSource?looseTopPath(teeStyle.hemSource,warp):teeStyle?.loose?looseTopPath(looseTopHemSource,warp):garmentPath(suitJacket?suitHemSource:isVest?vestHemSource
    :selectedDecorations.shirt?shirtHemSource:pantsWaistSource,warp));
  // The dungarees draw their own outline, so the waistband belongs to the
  // plain pieces only.
  garmentPaths.waist.style.display=longSleeve
    ||isVest||isTee?'':'none';
  garmentPaths.pantsWaist.setAttribute('d',garmentPath(spaceFit?transformPath(pantsWaistSource,spacePantsFit):pantsWaistSource,warp));
  garmentPaths.pantsWaist.style.display=!spaceFit&&!workwearVariants[selectedDecorations.pants]&&(['plain','batfish-trousers'].includes(selectedDecorations.pants)||widePants||shorts)?'':'none';
  garmentPaths.jumpsuit.setAttribute('d',garmentPath(jumpsuitSource,warp));
  garmentPaths.jumpsuit.setAttribute('fill',workwearVariants[selectedDecorations.pants]?denimColor():selectedDecorations.pants==='navy-jumpsuit'
    ?decorationColors.navyJumpsuit:decorationColors.jumpsuit);
  jumpsuitChestCutout.setAttribute('d',garmentPath(jumpsuitChestSource,warp));
  garmentPaths.jumpsuit.style.display=wearingJumpsuit()?'':'none';
  for(const [key,source] of Object.entries({
    jumpsuitSides:jumpsuitSidesSource,
    jumpsuitCrotch:pantsCrotchSource,
    jumpsuitChestOutline:jumpsuitChestOutlineSource,
  })) {
    garmentPaths[key].setAttribute('d',garmentPath(source,warp));
    garmentPaths[key].style.display=wearingJumpsuit()?'':'none';
  }
  for(const side of ['left','right']) {
    const suffix=side==='left'?'Left':'Right';
    garmentPaths['jumpsuitNeck'+suffix].setAttribute('d',
      transformPath(jumpsuitNeckSources[side],
        (x,y)=>applyDragPose(warp(x,y,'head'),x,y,'head',warp)));
    garmentPaths['jumpsuitShoulder'+suffix].setAttribute('d',
      garmentPath(jumpsuitShoulderSources[side],warp));
    const wearing=wearingJumpsuit();
    // The strap's top edge lies along the torso's own top line, which the arm
    // attaches below and so never runs along; it stays drawn whatever the arm
    // does. Its outer edge is a different matter: that one IS the arm's root
    // cross-section, sharing both the shoulder and the armpit landmark, so a
    // foreground arm would draw its own root line straight over it.
    garmentPaths['jumpsuitNeck'+suffix].style.display=wearing?'':'none';
    garmentPaths['jumpsuitShoulder'+suffix].style.display=
      wearing&&!armInFront[side]?'':'none';
  }
  hipMasks.forEach(({side,circle,path,rootCircle,rootPath})=>{
    const geometry=legShapes[side];
    circle.setAttribute('cx',geometry.hip.x);
    circle.setAttribute('cy',geometry.hip.y);
    rootCircle.setAttribute('cx',geometry.hip.x);
    rootCircle.setAttribute('cy',geometry.hip.y);
    // One constant radius for both tiers, exactly as the shoulder is handled.
    // Two different radii left a ring where one tier showed its outline and
    // the other did not, which read as the contour thickening part way down
    // the thigh; shrinking them together instead stopped hiding the join and
    // the thigh drew a seam across the torso whenever the leg was dragged.
    const radius=Math.min(geometry.restLength*.36,18);
    circle.setAttribute('r',radius);
    rootCircle.setAttribute('r',radius);
    const hipBoundary=torso.node.getAttribute('d')+(spaceFit?spaceFit.fill:'');
    path.setAttribute('d',hipBoundary);
    rootPath.setAttribute('d',hipBoundary);
  });
  updateInnerNecklineVisibility();
  updateInnerNecklineOcclusion();
  updateGarmentOrder();
  updatePartOrder();
  // Stop each waist contour exactly where the thigh's upper edge reaches it.
  // The target follows the current hip and width, rather than a fixed trim
  // percentage that leaves a visible gap at different squat depths.
  const posePoint=([x,y])=>applyDragPose(warp(x,y,classifyPoint(x,y,'mixed')),
    x,y,classifyPoint(x,y,'mixed'),warp);
  const interpolate=(a,b,t)=>({x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t)});
  const split=(source,t)=>{
    const [a,b,c,d]=source.map(posePoint);
    const ab=interpolate(a,b,t),bc=interpolate(b,c,t),cd=interpolate(c,d,t);
    const abc=interpolate(ab,bc,t),bcd=interpolate(bc,cd,t);
    const pivot=interpolate(abc,bcd,t);
    return {left:[a,ab,abc,pivot],right:[pivot,bcd,cd,d]};
  };
  const sample=(source,t)=>{
    const p=source.map(posePoint),u=1-t;
    return {x:u*u*u*p[0].x+3*u*u*t*p[1].x+3*u*t*t*p[2].x+t*t*t*p[3].x,
      y:u*u*u*p[0].y+3*u*u*t*p[1].y+3*u*t*t*p[2].y+t*t*t*p[3].y};
  };
  // Ask the thigh itself whether it covers a point, rather than assuming it
  // hangs a fixed distance below the hip. Once a hand can pull the hips out
  // past a foot the thigh swings aside, and the old height left the waist
  // contour stopping in mid air. The narrower skin width is used on purpose:
  // trimming slightly late overlaps, trimming early leaves a gap.
  const sidePath=points=>`M${clean(points[0].x)} ${clean(points[0].y)}`
    +`C${points.slice(1).map(p=>`${clean(p.x)} ${clean(p.y)}`).join(' ')}`;
  const sideSources={
    left:[[28.4591,125.881],[27.6312,116.11],
      [27.5018,84.2394],[27.478,LEFT_ARMPIT_Y]],
    right:[[67.5459,RIGHT_ARMPIT_Y],[66.9913,84.8335],
      [65.8489,120.018],[65.8486,125.059]],
  };
  const visibleSide=(side)=>{
    const source=sideSources[side],geometry=legShapes[side];
    // The covered stretch always starts at the hip end of the curve, so a
    // bisection finds the single crossing. With nothing covered the search
    // collapses onto that end and the whole waist contour stays drawn.
    let low=0,high=1;
    for(let i=0;i<20;i++){
      const mid=(low+high)/2;
      if(thighCoversPoint(sample(source,mid),geometry)===(side==='left'))low=mid;
      else high=mid;
    }
    const t=(low+high)/2;
    return sidePath(side==='left'?split(source,t).right:split(source,t).left);
  };
  torsoSideOutline.setAttribute('d',visibleSide('left')+visibleSide('right'));
  if(bodyCrotchOutline)bodyCrotchOutline.style.display=isSpaceSweatpants()?'none':'';
  torsoSideOutline.style.display=wearingJumpsuit()?'none':'';
  if(spaceFit)torsoSideOutline.setAttribute('d',garmentPath(transformPath(shirtSidesSource,(x,y)=>({x,y:Math.min(y,110.5)})),warp));
  const pantsSides=['left','right'].map(side=>
    visiblePantsSide(side,legShapes[side],warp)).join('');
  garmentPaths.pantsSides.setAttribute('d',spaceFit?spaceFit.sides:pantsSides);
  garmentPaths.shortsSides.setAttribute('d',pantsSides);
  buttOutlines.forEach(({side,node})=>{
    node.style.opacity=String(buttOutlineOpacity(side));
  });

  armParts.forEach(arm=>{
    const {innerArm,innerSleeve,outerHemClip,alohaSleeve,side,segments,rootBlack,skinRoot,sleeveRootBlack,sleeveSkinRoot,sleeveClip,skinClip,crease,cuff,sleevePanel,sleeveEdges,glovePanel,gloveEdges,handFill,handOutline,spongeMark,
      handSource}=arm;
    const shape=armShapes[side];
    const cinched=!!teeStyle?.cinched;
    const outerSleeveStyle=alohaSleeveStyles[selectedDecorations.outerwear];
    const aloha=!!outerSleeveStyle;
    if(spongeMark){spongeMark.setAttribute('d',spongeArmPath(shape,side));spongeMark.style.display=skinTrait('sponge')&&!longSleeve&&!isTee&&!aloha?'':'none';}
    // The space sleeve supplies all arm fabric; a folded cuff must never expose the native grey hose.
    innerArm.style.display=innerSleeve.style.display=outerSleeveStyle?.space?'none':'';
    alohaSleeve.style.display=aloha?'':'none';
    if(aloha)alohaSleeve.innerHTML=alohaSleeveMarkup(shape,side+'-aloha',outerSleeveStyle);
    if(aloha){
      outerHemClip.setAttribute('points',limbClipPoints(shape,outerSleeveStyle.end,true));
      innerArm.setAttribute('clip-path',`url(#${side}-outer-hem-clip)`);
      innerSleeve.setAttribute('clip-path',`url(#${side}-outer-hem-clip)`);
    }else {innerArm.removeAttribute('clip-path');innerSleeve.removeAttribute('clip-path');}
    const sleeveEnd=ivoryTunic?28:teeStyle?.sleeveEnd||31;
    const sleeveStyle=roundLongSleeve?roundLongSleeveStyle:teeStyle;
    const flare=sleeveStyle?.flare||0;
    applyArmOcclusion(side,rootBlack,skinRoot);
    applyArmOcclusion(side,sleeveRootBlack,sleeveSkinRoot);
    const fabricEnd=longSleeve&&!roundLongSleeve?32:(isTee||roundLongSleeve)?sleeveEnd:0;
    updateArmSleeveOrder(arm,fabricEnd);
    sleeveClip.setAttribute('points',limbClipPoints(shape,sleeveEnd,false));
    skinClip.setAttribute('points',limbClipPoints(shape,sleeveEnd,true));
    updateArmCuffClips(arm,{sleeveEnd,isTee,roundLongSleeve,ivoryTunic,batArmor,collaredShirt});
    updateGloveSleeveOrder(arm,collaredShirt&&selectedDecorations.gloves==='batfish-gloves');
    segments.forEach(({back,front},i)=>{
      back.style.display=front.style.display=(ivoryTunic&&i>=6&&i<28||cinched&&i>=6&&i<31)?'none':'';
      back.setAttribute('d',shape.hose[i].d);
      // The fill covers the middle of the black stroke, so it needs two extra
      // units to leave a one-unit outline on each side like the SVG.
      const shortSleeve=isTee&&i<sleeveEnd;
      const sleeveFlare=ivoryTunic?ivorySleeveWidth(i):teeSleeveWidth(i,sleeveStyle);
      back.setAttribute('stroke-width',shape.hose[i].width+2+sleeveFlare);
      front.setAttribute('d',shape.hose[i].d);
      front.setAttribute('stroke-width',shape.hose[i].width+sleeveFlare);
      const sleeveColor=roundLongSleeve&&i>=sleeveEnd?skinColor():longSleeve
        ? selectedDecorations.shirt==='white-tie-shirt'?'#D9D9D9':batArmor?decorationColors.batArmor:ivoryTunic?(i>=28?decorationColors.crown:decorationColors.royalWhite):suitJacket?decorationColors.suitNavy:decorationColors.shirt
        : shortSleeve?teeStyle.color:skinColor();
      front.setAttribute('stroke',sleeveColor);
    });
    sleevePanel.setAttribute('d',cinched?cinchedSleeveEdges(shape,true):ivoryTunic?ivorySleeveEdges(shape,true):'');
    sleevePanel.setAttribute('fill',cinched?teeStyle.color:decorationColors.royalWhite);
    sleevePanel.style.display=ivoryTunic||cinched?'':'none';
    sleeveEdges.setAttribute('d',cinched?cinchedSleeveEdges(shape):ivoryTunic?ivorySleeveEdges(shape):'');
    sleeveEdges.style.display=ivoryTunic||cinched?'':'none';
    cuff.style.display=(!aloha||sleeveEnd>outerSleeveStyle.end)&&(longSleeve||isTee)?'':'none';
    cuff.setAttribute('d',cinched?cinchedSleeveEdges(shape,'cuff'):cuffPath(shape,sleeveEnd,ivoryTunic?ivorySleeveWidth(28):flare)+(ivoryTunic?cuffPath(shape,31):''));
    crease.setAttribute('d',shape.crease);
    crease.style.display=!cinched&&shape.creaseOpacity>.55?'':'none';
    const glove=batGlovePaths(shape);
    glovePanel.setAttribute('d',glove.fill);gloveEdges.setAttribute('d',glove.outline);
    glovePanel.style.display=gloveEdges.style.display=selectedDecorations.gloves==='batfish-gloves'?'':'none';
    handFill.setAttribute('d',transformPath(handSource.handFill,shape.handPoint));
    handFill.setAttribute('fill',selectedDecorations.gloves
      ? selectedDecorations.gloves==='space-gloves'?'#F96C20':selectedDecorations.gloves==='batfish-gloves'?decorationColors.batBlack:decorationColors.gloves : skinColor());
    handOutline.setAttribute('d',
      transformPath(handSource.handOutline,shape.handPoint));
  });
  shoulderMasks.forEach(({side,circle,path})=>{
    const shape=armShapes[side];
    circle.setAttribute('cx',shape.shoulder.x);
    circle.setAttribute('cy',shape.shoulder.y);
    circle.setAttribute('r',Math.min(shape.shoulderWidth*1.9,shape.restLength*.45));
    path.setAttribute('d',torso.node.getAttribute('d'));
  });

  if (ellipse) {
    const pupil = skinTrait('pupil')
      || {rx: ellipse.originalRx, ry: ellipse.originalRy, dy: 0};
    const pupilX=ellipse.originalCx+(pupil.dx||0),pupilY=ellipse.originalCy+(pupil.dy||0);
    const originalCenter = warp(pupilX,pupilY, 'head');
    const center = applyDragPose(
      originalCenter,
      pupilX,
      pupilY,
      'head',
      warp
    );
    const scale = config.head / 100;
    // Pochita's pupil fills most of the eye, so the skin gives its own
    // radii and its own small lift rather than scaling the reference one.
    ellipse.node.setAttribute('cx', clean(center.x));
    ellipse.node.setAttribute('cy', clean(center.y));
    ellipse.node.setAttribute('fill', pupil.color || 'black');
    ellipse.node.setAttribute('rx', clean(pupil.rx * scale));
    ellipse.node.setAttribute('ry', clean(pupil.ry * scale));
    const bodyTurn=dragPoses.reduce((sum,pose)=>{
      if(pose.part!=='head'&&pose.part!=='body')return sum;
      return sum+upperBodyTurn(pose,warp);
    },0);
    const eyeAngle=-14.9815+bodyTurn*180/Math.PI;
    ellipse.node.setAttribute('transform', `rotate(${clean(eyeAngle)} ${clean(center.x)} ${clean(center.y)})`);
  }

  // Reserve the resting boot extent even though legs now render separately.
  for (const x of [1,100]) {
    const p=warp(x,198,'legs');
    basePoints.push(p.x,p.y);
  }
  const xs = basePoints.filter((_, index) => index % 2 === 0);
  const ys = basePoints.filter((_, index) => index % 2 === 1);
  const minY = Math.min(...ys) - 4;
  const maxY = Math.max(...ys) + 4;
  // Keep the horizontal SVG scale fixed. Otherwise outward-moving feet make
  // the viewBox wider and create the illusion that the feet themselves shrink.
  // The helmet is wider than the fish head at 140%, so reserve a little
  // horizontal room without tying the overall scale to moving feet.
  svg.setAttribute('viewBox', `-9 ${minY} 115 ${maxY - minY}`);

  if (dragLayer) {
    const handles = {
      head: applyDragPose(warp(47, 30, 'head'), 47, 30, 'head', warp),
      body: applyDragPose(warp(47, 92, 'body'), 47, 92, 'body', warp),
      leftHand: armShapes.left.palm,
      rightHand: armShapes.right.palm,
      leftWrist: armShapes.left.wrist,
      rightWrist: armShapes.right.wrist,
      leftLeg: legShapes.left.middle,
      rightLeg: legShapes.right.middle,
      leftLegFoot: legShapes.left.foot,
      rightLegFoot: legShapes.right.foot,
    };
    Object.entries(handles).forEach(([name, point]) => {
      const handle = dragLayer.querySelector(`[data-drag-part="${name}"]`);
      handle.setAttribute('cx', clean(point.x));
      handle.setAttribute('cy', clean(point.y));
    });
  }
  applyBaseGarmentPaint();
}

function resetControls() {
  stopMotion();
  clearDragPose();
  Object.values(controls).forEach(input => { input.value = 100; });
  update();
}

function randomizeControls() {
  stopMotion();
  clearDragPose();
  Object.values(controls).forEach(input => {
    const min=Number(input.min),max=Number(input.max);
    input.value=Math.floor(min+Math.random()*(max-min+1));
  });
  update();
}

let decorationVariantMenu=null;
function closeDecorationVariantMenu(){
 decorationVariantMenu?.remove();decorationVariantMenu=null;
 document.querySelectorAll?.('[data-expand-style]').forEach(button=>button.setAttribute('aria-expanded','false'));
}
function styleGroup(category,key){return decorationStyleGroups[category]?.find(group=>group[0]===key);}
function selectBaseDecoration(category,key){
 const group=styleGroup(category,key);if(!group?.[2].length)return;
 const worn=group[2].includes(selectedDecorations[category]);
 applyDecorationSelection(category,worn?null:group[2][0]);
 update();renderDecorationOptions();
}
function decorationSuitUsage(category,id){
 return decorationCatalog.suit.filter(suit=>suit.pieces?.[category]===id).length;
}
function decorationSuitDots(category,id){
 const count=decorationSuitUsage(category,id);if(!count)return '';
 return `<span class="decoration-suit-dots" role="img" aria-label="用于${count}个套装" title="用于${count}个套装">${'<i aria-hidden="true"></i>'.repeat(count)}</span>`;
}
function clearAllDecorations(){
 for(const category of Object.keys(selectedDecorations))selectedDecorations[category]=null;
 for(const category of Object.keys(baseDecorationSelections))delete baseDecorationSelections[category];
 setHatSelection(null);
 closeDecorationVariantMenu();
 update();renderDecorationOptions();
}
function openDecorationVariantMenu(category,key,anchor,clickPoint){
 const sameMenu=decorationVariantMenu?.dataset.category===category&&decorationVariantMenu?.dataset.style===key;
 closeDecorationVariantMenu();
 if(sameMenu){anchor.focus();return;}
 const group=styleGroup(category,key);if(!group||group[2].length<2)return;
 anchor.setAttribute('aria-expanded','true');
 const menu=document.createElement('div');
 menu.dataset.category=category;menu.dataset.style=key;
 menu.className='decoration-variant-menu';menu.setAttribute('role','dialog');
 menu.setAttribute('aria-label',group[1]+'颜色和花纹');
 menu.innerHTML=`<div class="variant-menu-heading"><strong>${group[1]}</strong><button type="button" data-close-variants aria-label="关闭颜色和花纹">×</button></div>`
  +`<div class="variant-menu-options">`
  +group[2].map(id=>{const item=decorationCatalog[category].find(item=>item.id===id);
   return `<button type="button" class="decoration-option" data-variant="${id}" aria-pressed="${selectedDecorations[category]===id&&!baseDecorationSelections[category]}">${decorationSuitDots(category,id)}<img src="${item.icon}" alt=""/><span>${item.name}</span></button>`;
  }).join('')+'</div>';
 document.body.appendChild(menu);decorationVariantMenu=menu;
 revealScrollbarWhileScrolling(menu.querySelector('.variant-menu-options'));
 const rect=anchor.getBoundingClientRect();
 const point=clickPoint||{x:rect.right,y:rect.top};
 const margin=12,viewportWidth=window.innerWidth,viewportHeight=window.innerHeight;
 const width=Math.min(288,viewportWidth-margin*2);
 menu.style.width=width+'px';
 menu.style.maxHeight=Math.min(viewportHeight*2/3,viewportHeight-margin*2)+'px';
 const height=menu.offsetHeight;
 // Native context-menu placement: start at the pointer, flip near an edge,
 // then clamp to the viewport so every option remains reachable.
 const left=Math.max(margin,Math.min(point.x+width>viewportWidth-margin?point.x-width:point.x,viewportWidth-width-margin));
 const top=Math.max(margin,Math.min(point.y+height>viewportHeight-margin?point.y-height:point.y,viewportHeight-height-margin));
 menu.style.left=left+'px';
 menu.style.top=top+'px';
 menu.style.transformOrigin=`${point.x-left}px ${point.y-top}px`;
 menu.addEventListener('click',event=>{
  if(event.target.closest('[data-close-variants]')){
   closeDecorationVariantMenu();
   // The option list is redrawn on every pick, so the button that opened
   // this menu is a different node by now.
   decorationOptions.querySelector(`[data-expand-style="${key}"]`)?.focus();
   return;
  }
  const variant=event.target.closest('[data-variant]');
  if(variant)selectDecoration(category,variant.dataset.variant);
 });
 menu.querySelector('button').focus({preventScroll:true});
}
// Picking a colour redraws the option list, but the menu is not part of it:
// it stays open until the user closes it, clicks away or switches category.
function syncDecorationVariantMenu(){
 if(!decorationVariantMenu)return;
 const {category,style}=decorationVariantMenu.dataset;
 if(category!==activeDecorationCategory){closeDecorationVariantMenu();return;}
 decorationVariantMenu.querySelectorAll('[data-variant]').forEach(button=>
  button.setAttribute('aria-pressed',
   String(selectedDecorations[category]===button.dataset.variant
    &&!baseDecorationSelections[category])));
 decorationOptions.querySelector(`[data-expand-style="${style}"]`)
  ?.setAttribute('aria-expanded','true');
}
// Live wardrobe counts include every selectable catalog colour, never gray previews.
// Outfits have their own count because their pieces are already counted elsewhere.
function decorationCounts(){
 const categories=Object.fromEntries(Object.entries(decorationCatalog).map(([category,items])=>
  [category,new Set(items.filter(item=>category!=='suit'||!disabledSuitIds.includes(item.id)).map(item=>item.id)).size]));
 return {categories,total:Object.entries(categories).reduce((sum,[category,count])=>sum+(category==='suit'?0:count),0)};
}
function renderDecorationCounts(){
 const {categories,total}=decorationCounts();
 const badge=document.querySelector('[data-decoration-total]');
 if(badge){badge.textContent=total;badge.setAttribute('aria-label',`${total}件装饰，不含套装和重复款式预览`);}
 for(const tab of decorationTabs){
  const label=tab.dataset.categoryLabel||(tab.dataset.categoryLabel=tab.textContent.trim());
  tab.title=label;
  tab.setAttribute('aria-label',label);
  const equipped=decorationCatalog[tab.dataset.category]?.find(item=>item.id===selectedDecorations[tab.dataset.category]);
  tab.classList?.toggle('has-equipped-decoration',!!equipped);
  tab.style?.setProperty('--category-icon', `url("${equipped?.icon||`./svg/ui/${tab.dataset.category}.svg`}")`);
  tab.innerHTML=`<span>${label}</span><span class="wardrobe-category-count">${categories[tab.dataset.category]||0}</span>`;
  if(tab.removeDecorationButton)tab.removeDecorationButton.hidden=!selectedDecorations[tab.dataset.category];
 }
}
function renderDecorationOptions() {
 renderDecorationCounts();
 const activeTab=decorationTabs.find(tab=>tab.dataset.category===activeDecorationCategory);
 const heading=document.querySelector('[data-category-heading]');
 if(heading){
  heading.textContent=activeTab?.dataset.categoryLabel||'装饰';
  document.querySelector('[data-category-count]').textContent=decorationCounts().categories[activeDecorationCategory]||0;
  document.querySelector('[data-category-icon]').src=`./svg/ui/${activeDecorationCategory}.svg`;
 }
 const category=activeDecorationCategory,selected=selectedDecorations[category];
 const itemButton=({id,name,icon})=>`<button type="button" class="decoration-option" data-option="${id}" aria-pressed="${selected===id&&!baseDecorationSelections[category]}">${decorationSuitDots(category,id)}<img src="${icon}" alt=""/><span>${name}</span></button>`;
 const none=`<button type="button" class="decoration-option" data-option="none" aria-pressed="${!selected}">${category==='skin'?'<img src="./svg/default-skin.svg" alt="" />':'<span class="empty-icon" aria-hidden="true">—</span>'}<span>${category==='suit'?'不使用套装':category==='skin'?'默认肤色':'不穿戴'}</span></button>`;
 const groups=decorationStyleGroups[category];
 if(category==='suit'){
  const allowed=decorationCatalog.suit.filter(item=>!disabledSuitIds.includes(item.id));
  const disabled=disabledSuitIds.map(id=>decorationCatalog.suit.find(item=>item.id===id)).filter(Boolean);
  decorationOptions.innerHTML=none+allowed.map(itemButton).join('')+'<div class="decoration-group-label decoration-disabled-label">禁用</div>'+disabled.map(itemButton).join('');
  syncDecorationVariantMenu();return;
 }
 if(!groups){decorationOptions.innerHTML=none+decorationCatalog[category].map(itemButton).join('');
  syncDecorationVariantMenu();return;}
 const cards=groups.map(([key,name,ids])=>{
  const active=ids.includes(selected);
  const first=decorationCatalog[category].find(item=>item.id===ids[0]);
  if(['helmet','skin'].includes(category)&&ids.length===1)return itemButton(first);
  const multiple=ids.length>1;
  const expand=multiple?`<span class="style-color-count" aria-label="${ids.length}种颜色或花纹">${ids.length}</span><button type="button" class="style-expand" data-expand-style="${key}" aria-expanded="false" aria-haspopup="dialog" aria-label="展开${name}的颜色和花纹"><span aria-hidden="true">▸</span></button>`:'';
  return `<div class="decoration-style-card${multiple?' has-variants':''}${active?' is-selected':''}"><button type="button" class="decoration-option" data-base-style="${key}" aria-pressed="${active}"><img src="${first.icon}" alt=""/><span>${name}</span></button>${expand}</div>`;
 }).join('');
 const special=category==='shirt'?'<div class="decoration-group-label">特殊款</div>'+decorationCatalog.shirt.filter(item=>specialShirtIds.includes(item.id)).map(itemButton).join(''):'';
 decorationOptions.innerHTML=none+cards+special;
 syncDecorationVariantMenu();
}

function applyDecorationSelection(category,value) {
  if(category==='suit')for(const key of Object.keys(baseDecorationSelections))delete baseDecorationSelections[key];
  else if(category!=='skin')delete baseDecorationSelections[category];
  if(category==='skin') {
    // Skin is only the frog's own color, so it never conflicts with clothing.
    selectedDecorations.skin=value;
    return;
  }
  if(category==='suit') {
    const skin=selectedDecorations.skin;
    for(const key of Object.keys(selectedDecorations))selectedDecorations[key]=null;
    selectedDecorations.skin=skin;
    selectedDecorations.suit=value;
    const suit=decorationCatalog.suit.find(item=>item.id===value);
    if(suit?.defaultSkin)selectedDecorations.skin=null;
    if(suit?.pieces)Object.assign(selectedDecorations,suit.pieces);
    setHatSelection(selectedDecorations.helmet);
  } else {
    selectedDecorations.suit=null;
    if(category==='helmet')setHatSelection(value);
    else selectedDecorations[category]=value;
  }
}
function selectDecoration(category, value) {
  if(value&&selectedDecorations[category]===value&&!baseDecorationSelections[category])value=null;
  applyDecorationSelection(category,value);
  update();
  renderDecorationOptions();
}

function randomizeClothes() {
  // A whole random outfit is one edit. Keep the chosen skin and body proportions.
  const previousShirt = selectedDecorations.shirt;
  applyDecorationSelection('suit', null);
  for (const category of ['shirt','pants','shoes','helmet','neck','outerwear','cape','gloves']) {
    const chance = {helmet:.75, neck:.4, outerwear:.35, cape:.3, gloves:.4}[category] ?? 1;
    const items = decorationCatalog[category].filter(item => category !== 'shirt'
      || (item.id !== previousShirt && !specialShirtIds.includes(item.id)));
    const item = Math.random() < chance ? items[Math.floor(Math.random() * items.length)] : null;
    applyDecorationSelection(category, item?.id || null);
  }
  closeDecorationVariantMenu();
  update();
  renderDecorationOptions();
}

function setHatSelection(value) {
  selectedDecorations.helmet = value;
  helmetVisible = value === 'plain';
  paths.filter(path => path.role.startsWith('helmet-')).forEach(({ node }) => {
    if (helmetVisible) node.removeAttribute('display');
    else node.setAttribute('display', 'none');
  });
  // This rim is generated separately from the imported helmet paths.
  // Without toggling it, hiding the shell leaves a line across the neck.
  // The hood needs it too: its colour stops at the neck, and without the
  // rim the dark hide runs into the body with no line to close it off.
  if (helmetBase) {
    if (helmetVisible || value === 'shark-hood') helmetBase.removeAttribute('display');
    else helmetBase.setAttribute('display', 'none');
  }
  hatPaths.forEach(node=>{ node.style.display=value==='yellow-hat'?'':'none'; });
  batCowlPaths.forEach(node=>{node.style.display=value==='batfish-cowl'?'':'none';});
  chainsawPaths.forEach(node=>{node.style.display=value==='chainsaw'?'':'none';});
  jobsGlassesPaths.forEach(node=>{node.style.display=value==='round-glasses'?'':'none';});
  if(longHairOverlay){longHairOverlay.style.display=longBraidVariants[value]?'':'none';for(const node of longHairOverlay.children)node.setAttribute('fill',longBraidVariants[value]?.color||longBraidVariants['long-braid-hair'].color);}
  pinkRibbonPaths.forEach(node=>{node.style.display=value==='pink-ribbon-hair'?'':'none';});
  angelHaloPaths.forEach(node=>{node.style.display=value==='angel-halo'?'':'none';});
  spaceHelmetPaths.forEach(node=>{node.style.display=value==='space-helmet'?'':'none';});
  yellowSpikyHairPaths.forEach(node=>{node.style.display=spikyHairVariants[value]?'':'none';node.setAttribute('fill',spikyHairVariants[value]?.color||spikyHairVariants['yellow-spiky-hair'].color);});
  topknotHairPaths.forEach((node,i)=>{node.style.display=topknotVariants[value]?'':'none';node.setAttribute('fill',value==='topknot-hair'?topknotHairSpecs[i].fill:topknotVariants[value]?.color||topknotHairSpecs[i].fill);});
  secondaryHatPaths.forEach(node=>{node.style.display=value==='secondary-hat'?'':'none';});
  studentHatPaths.forEach(node=>{node.style.display=value==='student-hat'?'':'none';});
  workerHatPaths.forEach((node,index)=>{node.style.display=workerHelmetColors[value]?'':'none';if(index>0)node.setAttribute('fill',workerHelmetColors[value]||workerHelmetColors['worker-helmet']);});
  kappaHairPaths.forEach(node=>{node.style.display=value==='kappa-hair'?'':'none';});
  sharkToothPaths.forEach(node=>{node.style.display=value==='shark-hood'?'':'none';});
  partyHatPaths.forEach(node=>{node.style.display=value==='party-hat'?'':'none';});
  const crowned = value === 'crown';
  crownPaths.forEach(node=>{ node.style.display=crowned?'':'none'; });
  // The crown takes the horn's place on that side of the head, so the horn
  // comes off with it on. Its fill is path 1 and its outline path 11.
  paths.filter(path=>path.index===1||path.index===11).forEach(({node})=>{
    node.style.display=hornHidden(value)?'none':'';
  });
  if(alienAntennaPath)alienAntennaPath.style.display=antennaShown(value)?'':'none';
  if (activeDecorationCategory === 'helmet') renderDecorationOptions();
}

function exportSvg() {
  if (!svg) return;
  const exported = svg.cloneNode(true);
  exported.querySelector('#drag-layer')?.remove();
  exported.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  exported.removeAttribute('aria-label');
  exported.removeAttribute('role');

  const source = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(exported)}`;
  const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'yuren.svg';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// Three snapshots of completed user edits; animation frames never enter history.
const editorHistory = [];
function captureEditorState() {
  return {
    decorations: {...selectedDecorations},
    base: {...baseDecorationSelections},
    controls: Object.fromEntries(Object.entries(controls).map(([key,input]) => [key,String(input.value)])),
    poses: dragPoses.map(pose => ({...pose}))
  };
}
function recordEditorChange(before) {
  if (JSON.stringify(before) === JSON.stringify(captureEditorState())) return;
  editorHistory.push(before);
  if (editorHistory.length > 3) editorHistory.shift();
  syncUndoButton();
}
function editCharacter(change) {
  const before = captureEditorState();
  const result = change();
  recordEditorChange(before);
  return result;
}
function syncUndoButton() {
  resetButton.disabled = editorHistory.length === 0;
  resetButton.title = editorHistory.length ? `撤销上一步（还可撤销${editorHistory.length}步）` : '暂无可撤销的修改（最多三步）';
}
function undoEditorChange() {
  const before = editorHistory.pop();
  if (!before) return;
  stopMotion();
  clearDragPose();
  Object.assign(selectedDecorations, before.decorations);
  for (const key of Object.keys(baseDecorationSelections)) delete baseDecorationSelections[key];
  Object.assign(baseDecorationSelections, before.base);
  for (const [key,value] of Object.entries(before.controls)) controls[key].value = value;
  dragPoses.push(...before.poses.map(pose => ({...pose})));
  setHatSelection(before.decorations.helmet);
  closeDecorationVariantMenu();
  update();
  renderDecorationOptions();
  syncUndoButton();
}
// These entry points each represent one user action, including a full outfit change.
for (const [name,change] of Object.entries({selectDecoration,selectBaseDecoration,clearAllDecorations,randomizeClothes,resetControls,randomizeControls})) {
  const tracked = (...args) => editCharacter(() => change(...args));
  if (name === 'selectDecoration') selectDecoration = tracked;
  else if (name === 'selectBaseDecoration') selectBaseDecoration = tracked;
  else if (name === 'clearAllDecorations') clearAllDecorations = tracked;
  else if (name === 'randomizeClothes') randomizeClothes = tracked;
  else if (name === 'resetControls') resetControls = tracked;
  else if (name === 'randomizeControls') randomizeControls = tracked;
}

resetButton.addEventListener('click', undoEditorChange);
loadRecordedMotions();
renderMotionLibrary();
motionTabs.forEach(tab => tab.addEventListener('click', () => {
  motionTabs.forEach(button => button.setAttribute('aria-selected',
    String(button === tab)));
  motionPanes.forEach(pane => {
    pane.hidden = pane.dataset.motionPane !== tab.dataset.motionTab;
  });
}));
const onMotionListClick = event => {
  const target = event.target.closest(
    '[data-motion], [data-rename-motion], [data-download-motion], [data-delete-motion]');
  if (!target) return;
  const { motion: play, renameMotion: rename, downloadMotion: save,
    deleteMotion: remove } = target.dataset;
  if (rename) {
    renameMotion(rename);
    return;
  }
  if (remove) {
    const motion = motionLibrary.find(entry => entry.id === remove);
    if (motion && confirm(`删除“${motion.name}”？`)) deleteMotion(remove);
    return;
  }
  const motion = motionLibrary.find(entry => entry.id === (play || save));
  if (!motion) return;
  if (save) downloadMotion(motion);
  else playMotion(motion);
};
motionList?.addEventListener('click', onMotionListClick);
recordedList?.addEventListener('click', onMotionListClick);
recordButton?.addEventListener('click', toggleRecording);
saveMotionButton?.addEventListener('click', saveRecordedMotion);
randomButton.addEventListener('click', randomizeClothes);
exportButton.addEventListener('click', exportSvg);
// Keep removal a separate button: clicking its corner must not switch tabs.
decorationTabs.forEach(tab=>{
 const category=tab.dataset.category;
 if(category==='suit')return;
 const wrapper=document.createElement('span');wrapper.className='wardrobe-tab-wrap';
 tab.before(wrapper);wrapper.appendChild(tab);
 const remove=document.createElement('button');remove.type='button';remove.className='wardrobe-remove';
 remove.dataset.removeCategory=category;
 const label=category==='skin'?'恢复默认肤色':`脱下${tab.textContent.trim()}装饰`;
 remove.setAttribute('aria-label',label);remove.title=label;remove.hidden=true;
 remove.innerHTML='<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 3L9 9M9 3L3 9"/></svg>';
 remove.addEventListener('click',event=>{event.stopPropagation();selectDecoration(category,null);});
 wrapper.appendChild(remove);tab.removeDecorationButton=remove;
});
function revealEquippedDecoration() {
  const panel=document.querySelector('.wardrobe-panel');
  if(!panel)return;
  const selected=decorationOptions.querySelector('[aria-pressed="true"]');
  const card=selected?.closest('.decoration-style-card')||selected;
  if(!card){panel.scrollTop=0;return;}
  const bounds=card.getBoundingClientRect(),viewport=panel.getBoundingClientRect();
  // Set before the click handler returns, so the first painted frame already
  // shows the selected style (including the base card of a selected variant).
  panel.scrollTop=Math.max(0,panel.scrollTop+bounds.top-viewport.top-(panel.clientHeight-bounds.height)/2);
}
decorationTabs.forEach(tab => tab.addEventListener('click', () => {
  activeDecorationCategory = tab.dataset.category;
  decorationTabs.forEach(button => button.setAttribute('aria-selected',
    String(button === tab)));
  renderDecorationOptions();
  revealEquippedDecoration();
}));
clearDecorationsButton.addEventListener('click',clearAllDecorations);
decorationOptions.addEventListener('click', event => {
  const expand=event.target.closest('[data-expand-style]');
  if(expand){openDecorationVariantMenu(activeDecorationCategory,expand.dataset.expandStyle,expand,event.detail?{x:event.clientX,y:event.clientY}:undefined);return;}
  const base=event.target.closest('[data-base-style]');
  if(base){
    selectBaseDecoration(activeDecorationCategory,base.dataset.baseStyle);
    return;
  }
  const button=event.target.closest('[data-option]');
  if(button)selectDecoration(activeDecorationCategory,button.dataset.option==='none'?null:button.dataset.option);
});
document.addEventListener('pointerdown',event=>{
 if(decorationVariantMenu&&!decorationVariantMenu.contains(event.target)&&!event.target.closest('[data-expand-style]'))closeDecorationVariantMenu();
});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeDecorationVariantMenu();});
window.addEventListener('resize',closeDecorationVariantMenu);

renderDecorationOptions();

fetch('./svg/参考.svg')
  .then(response => response.text())
  .then(source => {
    const documentNode = new DOMParser().parseFromString(source, 'image/svg+xml');
    svg = documentNode.documentElement;
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('aria-label', '可变形鱼人');
    svg.setAttribute('role', 'img');

    paths = [...svg.querySelectorAll('path')].map((node, index) => {
      const role = classifyPath(index);
      return { node, original: node.getAttribute('d'), role, index };
    });

    const eye = svg.querySelector('ellipse');
    if (eye) {
      ellipse = {
        node: eye,
        originalCx: Number(eye.getAttribute('cx')),
        originalCy: Number(eye.getAttribute('cy')),
        originalRx: Number(eye.getAttribute('rx')),
        originalRy: Number(eye.getAttribute('ry')),
      };
    }

    // Independent opaque parts are essential: one self-intersecting body
    // path cannot occlude the far leg, regardless of its fill rule.
    layerOrder.forEach(part=>{
      const group=document.createElementNS(SVG_NS,'g');
      group.dataset.part=part;
      group.dataset.dragPart=part;
      partLayers[part]=group;
      svg.appendChild(group);
    });
    outfitOverlay=document.createElementNS(SVG_NS,'g');
    outfitOverlay.setAttribute('pointer-events','none');
    neckOverlay=document.createElementNS(SVG_NS,'g');
    neckOverlay.setAttribute('pointer-events','none');
    innerNecklineLayer=document.createElementNS(SVG_NS,'g');
    innerNecklineLayer.setAttribute('data-inner-necklines','');
    innerNecklineLayer.setAttribute('mask','url(#inner-neckline-occlusion)');
    neckOverlay.appendChild(innerNecklineLayer);
    capeOverlay=document.createElementNS(SVG_NS,'g');
    capeOverlay.setAttribute('pointer-events','none');
    svg.insertBefore(capeOverlay,svg.firstChild);
    swimRingBack=document.createElementNS(SVG_NS,'g');
    swimRingBack.setAttribute('pointer-events','none');swimRingBack.setAttribute('data-swim-ring','back');
    svg.insertBefore(swimRingBack,capeOverlay.nextSibling);
    swimRingFront=document.createElementNS(SVG_NS,'g');
    swimRingFront.setAttribute('pointer-events','none');swimRingFront.setAttribute('data-swim-ring','front');
    outfitOverlay.appendChild(swimRingFront);
    longHairOverlay=document.createElementNS(SVG_NS,'g');
    longHairOverlay.setAttribute('pointer-events','none');
    longHairOverlay.setAttribute('data-long-hair','');
    mosaicOverlay=document.createElementNS(SVG_NS,'g');
    mosaicOverlay.setAttribute('pointer-events','none');mosaicOverlay.setAttribute('data-mosaic-overlay','');
    svg.append(outfitOverlay,neckOverlay,longHairOverlay,mosaicOverlay);
    const silhouette=paths.find(path=>path.index===2);
    const original=silhouette.original;
    const section=(start,end)=>original.slice(original.indexOf(start),
      original.indexOf(end,original.indexOf(start))+end.length);
    const head='M'+section('26.1046 56.4524','67.7274 55.0466')+'Z';
    const leftEdge=('M'+section('28.4591 125.881','27.478 69.7327'))
      .replace('27.478 69.7327',`27.478 ${LEFT_ARMPIT_Y}`);
    const rightEdge=('M'+section('67.5459 68.4282','65.8486 125.059'))
      .replace('67.5459 68.4282',`67.5459 ${RIGHT_ARMPIT_Y}`);
    const crotch='M49.4914 132.8C48.4 132.3 45.9 132.3 44.6804 132.8';
    const rightButt='M65.8486 125.059C63.5 127.5 54 131.8 49.4914 132.8';
    const leftButt='M44.6804 132.8C40 131.8 31 127.5 28.4591 125.881';
    const body=leftEdge+`L26.1046 56.4524L67.7274 55.0466L67.5459 ${RIGHT_ARMPIT_Y}`
      +rightEdge.slice(rightEdge.indexOf('C'))
      +rightButt.slice(rightButt.indexOf('C'))
      +crotch.slice(crotch.indexOf('C'))
      +leftButt.slice(leftButt.indexOf('C'))+'Z';
    const addPath=(d,part,filled,role,index=-1)=>{
      const node=document.createElementNS(SVG_NS,'path');
      node.setAttribute('fill',filled?'#C5C5C5':'none');
      node.setAttribute('stroke',filled?'none':'black');
      node.setAttribute('stroke-linecap','round');
      node.setAttribute('stroke-linejoin','round');
      partLayers[part].appendChild(node);
      paths.push({node,original:d,role,index});
      return node;
    };
    silhouette.node.remove();
    paths=paths.filter(path=>path!==silhouette);
    addPath(body,'body',true,'mixed');
    bellyPatch=document.createElementNS(SVG_NS,'path');
    bellyPatch.setAttribute('fill',milkFrogColors.belly);
    bellyPatch.setAttribute('stroke','none');
    bellyPatch.setAttribute('pointer-events','none');
    bellyPatch.setAttribute('clip-path','url(#milk-frog-belly-clip)');
    partLayers.body.appendChild(bellyPatch);
    spongeBodyNode=addPath(spongeBodySource,'body',false,'body',-2);
    spongeBodyNode.setAttribute('fill','#C2C104');spongeBodyNode.setAttribute('stroke','none');spongeBodyNode.style.display='none';
    scarNode=addPath(scarSource,'body',false,'body');
    scarNode.setAttribute('stroke-width','.7');scarNode.style.display='none';
    muscleLinesNode=addPath(muscleLinesSource,'body',false,'body');
    muscleLinesNode.setAttribute('stroke-width','1');
    muscleLinesNode.style.display='none';
    torsoSideOutline=addPath(leftEdge+rightEdge,'body',false,'mixed');
    bodyCrotchOutline=addPath(crotch,'body',false,'mixed');
    buttOutlines=[{side:'right',node:addPath(rightButt,'body',false,'mixed')},
      {side:'left',node:addPath(leftButt,'body',false,'mixed')}];
    addPath(head,'head',true,'head');
    helmetBase=addPath('M26.1046 56.4524L67.7274 55.0466',
      'head',false,'head');
    helmetBase.setAttribute('stroke-width','1');
    // Preserve the existing facial details and helmet within the head group.
    const headFill=partLayers.head.firstChild;
    // The reference's extra waist strokes duplicate the deforming torso
    // contour and would continue through a folded thigh.
    paths.filter(path=>path.index===6||path.index===7).forEach(path=>path.node.remove());
    paths=paths.filter(path=>path.index!==6&&path.index!==7);
    paths.filter(path=>path.index>=0 && path.role!=='arms').forEach(path=>{
      const part=[9,10].includes(path.index)?'body':'head';
      if(path.index===0) {
        // The shell is a tinted glass visor, not a solid cap: keep the
        // reference's aqua and let the page show through it. It had been
        // flattened to one opaque colour mixed with the old grey page, which
        // read as a dark helmet and broke outright once the page turned pink.
        path.node.setAttribute('fill',HELMET_GLASS);
        path.node.setAttribute('fill-opacity',HELMET_GLASS_OPACITY);
      }
      if(path.index===0||path.index===1) partLayers.head.insertBefore(path.node,headFill);
      else partLayers[part].appendChild(path.node);
    });
    // The pupil carries its own rotate(), and a clip-path on an element is
    // cut in that element's own space — the eye's cut would come out turned.
    // Hanging the clip on a wrapper keeps it in the head's space, so it is
    // literally the same line as the eye white's.
    if(ellipse){
      pupilClipGroup=document.createElementNS(SVG_NS,'g');
      pupilClipGroup.appendChild(ellipse.node);
      partLayers.head.appendChild(pupilClipGroup);
    }
    // Behind the head fill, so the head's outline crosses the crown's band
    // and only the points stand out past it.
    // The chainsaw goes behind the head, the way the drawing has it: only
    // the part standing above the head shows, and the face is not covered.
    const cigaretteLayer=document.createElementNS(SVG_NS,'g');
    cigaretteLayer.setAttribute('data-cigarette','');
    cigaretteLayer.setAttribute('pointer-events','none');
    svg.insertBefore(cigaretteLayer,svg.firstChild);
    cigarettePaths=cigaretteSpecs.map(({source:original,fill})=>{
      const node=document.createElementNS(SVG_NS,'path');
      for(const [key,value] of Object.entries({fill,stroke:'black','stroke-width':.7,'stroke-linejoin':'round'}))node.setAttribute(key,value);
      node.style.display='none';cigaretteLayer.appendChild(node);
      paths.push({node,original,role:'cigarette',index:-2});return node;
    });
    chainsawPaths=Object.entries(chainsawSources).map(([part,original])=>{
      const node=document.createElementNS(SVG_NS,'path');
      node.setAttribute('fill',pochitaColors[part==='teeth'?'teeth':part]);
      node.setAttribute('stroke','black');
      node.setAttribute('stroke-width',part==='teeth'?'.8':'1');
      node.setAttribute('stroke-linejoin','round');
      node.setAttribute('stroke-linecap','round');
      node.setAttribute('pointer-events','none');
      node.style.display='none';
      partLayers.head.insertBefore(node,headFill);
      paths.push({node,original,role:'headRigid',index:-2});
      return node;
    });
    // The starter cord belongs to the skin, and hangs over the body.
    pochitaCordPaths=[[pochitaCordSource,false],[pochitaGripSource,true]]
      .map(([,filled])=>{
        const node=document.createElementNS(SVG_NS,'path');
        node.setAttribute('fill',filled?pochitaColors.motor:'none');
        node.setAttribute('stroke','black');
        node.setAttribute('stroke-width','1');
        node.setAttribute('stroke-linejoin','round');
        node.setAttribute('stroke-linecap','round');
        node.setAttribute('pointer-events','none');
        node.style.display='none';
        // Behind the body, the way a tail hangs.
        partLayers.body.insertBefore(node,partLayers.body.firstChild);
        return node;
      });
    const cowlDefs=document.createElementNS(SVG_NS,'defs');
    const cowlClip=document.createElementNS(SVG_NS,'clipPath');
    cowlClip.id='bat-cowl-face-clip';
    cowlClip.setAttribute('clipPathUnits','userSpaceOnUse');
    batCowlClipPath=document.createElementNS(SVG_NS,'path');
    cowlClip.appendChild(batCowlClipPath);
    cowlDefs.appendChild(cowlClip);
    // The hood's lid cuts the top off the eye. Whatever a skin draws inside
    // that eye — Pochita's big pupil, say — gets cut by the same line, so
    // the clip is the eye white's own outline rather than a second shape.
    const eyeClip=document.createElementNS(SVG_NS,'clipPath');
    eyeClip.id='shark-eye-clip';
    eyeClip.setAttribute('clipPathUnits','userSpaceOnUse');
    sharkEyeClipPath=document.createElementNS(SVG_NS,'path');
    eyeClip.appendChild(sharkEyeClipPath);
    cowlDefs.appendChild(eyeClip);
    svg.appendChild(cowlDefs);
    headFillNode=headFill;
    // On top of the head: the clown's marks and the party hat's spots sit
    // over the face and the horn.
    const headTopPath=(fill,outline)=>{
      const node=document.createElementNS(SVG_NS,'path');
      node.setAttribute('fill',fill);
      node.setAttribute('stroke',outline?'black':'none');
      if(outline)node.setAttribute('stroke-width','1');
      node.setAttribute('stroke-linejoin','round');
      node.setAttribute('pointer-events','none');
      node.style.display='none';
      partLayers.head.appendChild(node);
      return node;
    };
    // The antenna sits under the head: where it meets the brow the head's
    // own fill covers its root, so no seam shows.
    alienAntennaPath=headTopPath(decorationColors.alienGreen,true);
    partLayers.head.insertBefore(alienAntennaPath,headFill);
    paths.push({node:alienAntennaPath,original:alienAntennaSource,
      role:'head',index:-2});
    clownMarkPaths=clownMarkSources.map(({source,outline})=>{
      const node=headTopPath(decorationColors.clownRed,outline);
      paths.push({node,original:source,role:'head',index:-2});
      return node;
    });
    partyHatPaths=partyHatTrim.map(({source,fill,outline})=>{
      const node=headTopPath(fill,!!outline);
      paths.push({node,original:source,role:'head',index:-2});
      return node;
    });
    // Behind the head fill, so the jaws close over them: the shark's teeth
    // stay where they are while the mouth opens and shuts.
    sharkToothPaths=sharkToothSources.map(original=>{
      const node=document.createElementNS(SVG_NS,'path');
      node.setAttribute('fill','white');
      node.setAttribute('stroke','black');
      node.setAttribute('stroke-width','1');
      node.setAttribute('stroke-linejoin','round');
      node.setAttribute('pointer-events','none');
      node.style.display='none';
      partLayers.head.insertBefore(node,headFill);
      paths.push({node,original,role:'headRigid',index:-2});
      return node;
    });
    const kappaNodes=(specs,hair)=>specs.map(({source:original,fill,stroke,role,strokeWidth=1},i)=>{
      const node=document.createElementNS(SVG_NS,'path');
      for(const [key,value] of Object.entries({fill,stroke,'stroke-width':strokeWidth,'stroke-linecap':'round','stroke-linejoin':'round','pointer-events':'none'}))node.setAttribute(key,value);
      node.style.display='none';
      const group=partLayers[role==='body'?'body':'head'];
      group.appendChild(node);
      paths.push({node,original,role,index:-2});return node;
    });
    spongeHeadPaths=kappaNodes(spongeHeadSpecs,false);
    const spongeEye=paths.find(p=>p.index===8)?.node;
    spongeHeadPaths.forEach((node,i)=>partLayers.head.insertBefore(node,spongeHeadSpecs[i].behind?headFill:spongeEye));
    hypnoticEyePaths=kappaNodes(hypnoticEyeSpecs,false);
    kappaSkinPaths=kappaNodes(kappaSkinSpecs,false);
    // Mouth coloration belongs inside the live head silhouette, including during speech.
    const mouthDefs=document.createElementNS(SVG_NS,'defs');
    const mouthClip=document.createElementNS(SVG_NS,'clipPath');
    mouthClip.id='kappa-mouth-clip';mouthClip.setAttribute('clipPathUnits','userSpaceOnUse');
    kappaMouthClipPath=document.createElementNS(SVG_NS,'path');
    mouthClip.appendChild(kappaMouthClipPath);mouthDefs.appendChild(mouthClip);svg.appendChild(mouthDefs);
    const sharedHeadOutline=paths.find(path=>path.index===5)?.node;
    kappaSkinPaths.slice(-kappaMouthSpecs.length).forEach(node=>{
      node.setAttribute('clip-path','url(#kappa-mouth-clip)');
      if(sharedHeadOutline)partLayers.head.insertBefore(node,sharedHeadOutline);
    });
    lipstickFacePaths=kappaNodes(lipstickFaceSpecs,false);
    const eyeWhiteNode=paths.find(path=>path.index===8)?.node;
    lipstickFacePaths.forEach((node,i)=>{
      if(lipstickFaceSpecs[i].lip){node.setAttribute('clip-path','url(#kappa-mouth-clip)');if(sharedHeadOutline)partLayers.head.insertBefore(node,sharedHeadOutline);}
      else if(eyeWhiteNode)partLayers.head.insertBefore(node,eyeWhiteNode);
    });
    pinkRibbonPaths=kappaNodes(pinkRibbonSpecs,true);
    pinkRibbonPaths.forEach(node=>partLayers.head.insertBefore(node,headFill));
    kappaHairPaths=kappaNodes(kappaHairSpecs,true);
    workerHatPaths=kappaNodes(workerHatSpecs,true);
    studentHatPaths=kappaNodes(studentHatSpecs,true);
    kappaNodes(longHairSpecs,true).forEach(node=>{node.style.display='';longHairOverlay.appendChild(node);});
    spaceCollarOverlay=document.createElementNS(SVG_NS,'g');
    spaceCollarOverlay.setAttribute('pointer-events','none');
    spaceCollarOverlay.setAttribute('data-clothing-collar','space-shirt');
    svg.appendChild(spaceCollarOverlay);
    spaceHelmetOverlay=document.createElementNS(SVG_NS,'g');
    spaceHelmetOverlay.setAttribute('pointer-events','none');
    largePartyHatPaths=kappaNodes(largePartyHatSpecs,true);
    largePartyHatPaths.forEach(node=>partLayers.head.insertBefore(node,headFill));
    capPaths=kappaNodes(capSpecs,true);
    divingGogglePaths=kappaNodes(divingGoggleSpecs,true);
    divingGoggleOverlay=document.createElementNS(SVG_NS,'g');
    divingGoggleOverlay.setAttribute('pointer-events','none');
    divingGoggleOverlay.setAttribute('data-diving-goggles','front');
    svg.appendChild(divingGoggleOverlay);
    placeDivingGoggleLayers();
    eyeBandPaths=kappaNodes(eyeBandSpecs,true);
    const bandEyeNode=paths.find(path=>path.index===8)?.node;
    // The knot and tails cover the original triangular fin outline.
    eyeBandPaths.forEach((node,i)=>{
      if(i===0)partLayers.head.insertBefore(node,bandEyeNode);
      else partLayers.head.appendChild(node);
    });
    teardropPaths=kappaNodes([{source:teardropSource,role:'head',fill:'#FCE043',stroke:'#B87924',strokeWidth:.7}],true);
    angelHaloPaths=kappaNodes(angelHaloSpecs,true);
    spaceHelmetPaths=kappaNodes(spaceHelmetSpecs,true);
    spaceHelmetPaths.forEach(node=>spaceHelmetOverlay.appendChild(node));
    svg.appendChild(spaceHelmetOverlay);
    yellowSpikyHairPaths=kappaNodes(yellowSpikyHairSpecs,true);
    topknotHairPaths=kappaNodes(topknotHairSpecs,true);
    secondaryHatPaths=kappaNodes(secondaryHatSpecs,true);
    longHairOverlay.style.display='none';
    secondaryHatPaths.forEach(node=>partLayers.head.insertBefore(node,headFill));
    jobsGlassesPaths=jobsGlassesSpecs.map(({source:original,fill,opacity,strokeWidth})=>{
      const node=document.createElementNS(SVG_NS,'path');
      for(const [key,value] of Object.entries({fill,stroke:'#684516','stroke-width':strokeWidth,'stroke-linecap':'round','stroke-linejoin':'round'}))node.setAttribute(key,value);
      if(opacity)node.setAttribute('fill-opacity',opacity);
      node.style.display='none';partLayers.head.appendChild(node);
      paths.push({node,original,role:'headRigid',index:-2});return node;
    });
    batCowlPaths=[batCowlSource].map(original=>{
      const node=document.createElementNS(SVG_NS,'path');
      node.setAttribute('fill',decorationColors.batBlack);node.setAttribute('stroke','black');
      node.setAttribute('stroke-width','1');node.setAttribute('stroke-linejoin','round');
      node.setAttribute('pointer-events','none');node.style.display='none';
      partLayers.head.insertBefore(node,paths.find(path=>path.index===8).node);
      // `headShell`, not `head`: the cowl scales and moves with the head but
      // is not opened by the jaw. On `head` its lower edge sat inside the
      // mouth notch, so talking pulled the cowl's ears about with it.
      paths.push({node,original,role:'headShell',index:-2});return node;
    });
    crownPaths=Object.values(crownSources).map(original=>{
      const node=document.createElementNS(SVG_NS,'path');
      node.setAttribute('fill',decorationColors.crown);
      node.setAttribute('stroke','black');
      node.setAttribute('stroke-width',String(crownStrokeWidth));
      node.setAttribute('stroke-linecap','round');
      node.setAttribute('stroke-linejoin','round');
      node.setAttribute('pointer-events','none');
      node.style.display='none';
      partLayers.head.insertBefore(node,headFill);
      paths.push({node,original,role:'head',index:-2});
      return node;
    });
    hatPaths=Object.values(yellowHatSources).map(original=>{
      const node=document.createElementNS(SVG_NS,'path');
      node.setAttribute('fill',decorationColors.yellowHat);
      node.setAttribute('stroke','black');
      node.setAttribute('stroke-width','1');
      node.setAttribute('stroke-linecap','round');
      node.setAttribute('stroke-linejoin','round');
      node.setAttribute('pointer-events','none');
      node.style.display='none';
      partLayers.head.appendChild(node);
      paths.push({node,original,role:'head',index:-2});
      return node;
    });
    scarfPaths=scarfSources.map(original=>{
      const node=document.createElementNS(SVG_NS,'path');
      node.setAttribute('fill',decorationColors.scarf);
      node.setAttribute('stroke','black');
      node.setAttribute('stroke-width','1');
      node.setAttribute('stroke-linecap','round');
      node.setAttribute('stroke-linejoin','round');
      node.setAttribute('pointer-events','none');
      node.style.display='none';
      neckOverlay.appendChild(node);
      const entry={node,original,role:'head',index:-2};
      paths.push(entry);
      return entry;
    });
    const makeGarment=(fill,outline=false)=>{
      const node=document.createElementNS(SVG_NS,'path');
      node.setAttribute('fill',fill);
      node.setAttribute('stroke',outline?'black':'none');
      node.setAttribute('stroke-width','1');
      node.setAttribute('stroke-linecap','round');
      node.setAttribute('stroke-linejoin','round');
      node.setAttribute('pointer-events','none');
      outfitOverlay.appendChild(node);
      return node;
    };
    // makeGarment appends as it creates, so this order IS the paint order.
    // Shirts paint first, then trousers, then the open jacket. The pants
    // waist covers the shirt hem; the jacket panels cover both garments.
    garmentPaths={
      shirt:makeGarment(decorationColors.shirt),
      suitFront:makeGarment('#fff'),
      suitFrontEdges:makeGarment('none',true),
      suitCollarLeft:makeGarment('#fff'),
      suitCollarRight:makeGarment('#fff'),
      shirtSides:makeGarment('none',true),
      shirtTop:makeGarment('none',true),
      vest:makeGarment(decorationColors.blueVest),
      vestSides:makeGarment('none',true),
      vestNeck:makeGarment('none',true),
      vestTopLeft:makeGarment('none',true),
      vestTopRight:makeGarment('none',true),
      vestShoulderLeft:makeGarment('none',true),
      vestShoulderRight:makeGarment('none',true),
      tee:makeGarment(decorationColors.yellowTee),
      teeSides:makeGarment('none',true),
      teeNeck:makeGarment('none',true),
      teeTopLeft:makeGarment('none',true),
      teeTopRight:makeGarment('none',true),
      patchblue:makeGarment('#214f98',true),
      patchred:makeGarment('#d9575b',true),
      patchstitches:makeGarment('none',true),
      redTriangle:makeGarment(decorationColors.redTriangle,true),
      waist:makeGarment('none',true),
      jumpsuit:makeGarment(decorationColors.jumpsuit),
      jumpsuitSides:makeGarment('none',true),
      jumpsuitCrotch:makeGarment('none',true),
      jumpsuitChestOutline:makeGarment('none',true),
      pants:makeGarment(decorationColors.pants),
      pantsSides:makeGarment('none',true),
      pantsCrotch:makeGarment('none',true),
      shorts:makeGarment(decorationColors.redShorts),
      shortsSides:makeGarment('none',true),
      shortsCrotch:makeGarment('none',true),
      pantsWaist:makeGarment('none',true),
      briefs:makeGarment(decorationColors.redShorts,true),
      redThong:makeGarment(decorationColors.redThong,true),
      skirt:makeGarment(decorationColors.skirt,true),
    };
    for(const key of ['shirtTop','teeNeck','teeTopLeft','teeTopRight'])
      placeNeckGarmentBelowAccessories(garmentPaths[key]);
    garmentPaths.patchstitches.setAttribute('stroke-width','.7');
    garmentPaths.shortsCrotch.setAttribute('stroke-width','1');
    garmentPaths.pantsCrotch.setAttribute('stroke-width','1.5');
    garmentPaths.jumpsuitCrotch.setAttribute('stroke-width','1.5');
    for(const side of ['Left','Right']) for(const [kind,width] of
      [['jumpsuitNeck',1],['jumpsuitShoulder',1]]){
      const key=kind+side;
      const node=document.createElementNS(SVG_NS,'path');
      node.setAttribute('fill','none');
      node.setAttribute('stroke','black');
      node.setAttribute('stroke-width',String(width));
      node.setAttribute('stroke-linecap','round');
      node.setAttribute('stroke-linejoin','round');
      outfitOverlay.appendChild(node);
      garmentPaths[key]=node;
    }
    garmentPaths.spaceDetails=document.createElementNS(SVG_NS,'g');
    outfitOverlay.appendChild(garmentPaths.spaceDetails);
    garmentPaths.seaweedPants=document.createElementNS(SVG_NS,'g');
    garmentPaths.seaweedPants.setAttribute('pointer-events','none');outfitOverlay.appendChild(garmentPaths.seaweedPants);
    garmentPaths.mosaicPants=document.createElementNS(SVG_NS,'g');
    garmentPaths.mosaicPants.setAttribute('pointer-events','none');outfitOverlay.appendChild(garmentPaths.mosaicPants);
    garmentPaths.collaredDetails=document.createElementNS(SVG_NS,'g');
    outfitOverlay.appendChild(garmentPaths.collaredDetails);
    garmentPaths.alohaBody=document.createElementNS(SVG_NS,'g');
    garmentPaths.alohaBody.setAttribute('pointer-events','none');
    outfitOverlay.appendChild(garmentPaths.alohaBody);
    garmentPaths.greenVestLeft=makeGarment(decorationColors.greenVest,true);
    garmentPaths.greenVestRight=makeGarment(decorationColors.greenVest,true);
    placeOuterwearOverNeckline();
    for(const key of Object.keys(tieSources)) {
      const node=makeGarment(decorationColors.tieRed,true);
      // Fill hides the inner half: a 2-unit stroke leaves 1 unit outside.
      node.setAttribute('stroke-width','2');
      node.setAttribute('paint-order','stroke fill');
      neckOverlay.appendChild(node);
      garmentPaths['tie'+key]=node;
    }
    for(const [key,spec] of Object.entries(ivorySpecs)){
      garmentPaths[key]=makeGarment(spec.fill,!!spec.outline);
      if(spec.stroke)garmentPaths[key].setAttribute('stroke',spec.stroke);
      if(spec.strokeWidth)garmentPaths[key].setAttribute('stroke-width',spec.strokeWidth);
      if(spec.neckline)placeNeckGarmentBelowAccessories(garmentPaths[key]);
      else if(spec.category==='neck')neckOverlay.appendChild(garmentPaths[key]);
      if(spec.category==='cape')capeOverlay.appendChild(garmentPaths[key]);
    }
    garmentPaths.jobsCollar=makeGarment('#101010');
    placeNeckGarmentBelowAccessories(garmentPaths.jobsCollar);
    garmentPaths.jobsCollarEdge=makeGarment('none',true);
    placeNeckGarmentBelowAccessories(garmentPaths.jobsCollarEdge);
    // Outerwear still covers the inner collar; all accessories cover both.
    placeOuterwearOverNeckline();
    garmentPaths.jeansDetails=document.createElementNS(SVG_NS,'g');
    garmentPaths.jeansDetails.setAttribute('pointer-events','none');
    outfitOverlay.appendChild(garmentPaths.jeansDetails);
    const defs=document.createElementNS(SVG_NS,'defs');
    spaceCrotchMask=document.createElementNS(SVG_NS,'mask');
    spaceCrotchMask.id='space-crotch-occlusion';spaceCrotchMask.setAttribute('maskUnits','userSpaceOnUse');
    for(const [key,value] of Object.entries({x:-1000,y:-1000,width:2000,height:2000}))spaceCrotchMask.setAttribute(key,value);
    defs.appendChild(spaceCrotchMask);
    svg.prepend(defs);
    jobsPelvisGradient=document.createElementNS(SVG_NS,'linearGradient');
    jobsPelvisGradient.id='jobs-pelvis-gradient';jobsPelvisGradient.setAttribute('gradientUnits','userSpaceOnUse');
    for(let i=0;i<=32;i++){
      const stop=document.createElementNS(SVG_NS,'stop');stop.setAttribute('offset',i/32);stop.setAttribute('stop-color',jobsDenimColor(i/32));jobsPelvisGradient.appendChild(stop);
    }
    defs.appendChild(jobsPelvisGradient);

    const underwearMask=document.createElementNS(SVG_NS,'mask');
    underwearMask.id='underwear-root-mask';
    underwearMask.setAttribute('maskUnits','userSpaceOnUse');
    for(const [attr,value] of Object.entries({x:-1000,y:-1000,width:2000,height:2000}))underwearMask.setAttribute(attr,value);
    const underwearMaskBg=document.createElementNS(SVG_NS,'rect');
    for(const [attr,value] of Object.entries({x:-1000,y:-1000,width:2000,height:2000,fill:'white'}))underwearMaskBg.setAttribute(attr,value);
    underwearRootCutout=document.createElementNS(SVG_NS,'path');
    underwearRootCutout.setAttribute('fill','black');
    underwearMask.append(underwearMaskBg,underwearRootCutout);defs.appendChild(underwearMask);
    const outerClip=document.createElementNS(SVG_NS,'clipPath');
    outerClip.id='outerwear-inner-clip';
    outerClip.setAttribute('clipPathUnits','userSpaceOnUse');
    outerwearInnerClip=document.createElementNS(SVG_NS,'path');
    outerClip.appendChild(outerwearInnerClip);defs.appendChild(outerClip);
    const bellyClipContainer=document.createElementNS(SVG_NS,'clipPath');
    bellyClipContainer.id='milk-frog-belly-clip';
    bellyClipContainer.setAttribute('clipPathUnits','userSpaceOnUse');
    bellyClip=document.createElementNS(SVG_NS,'path');
    bellyClipContainer.appendChild(bellyClip);defs.appendChild(bellyClipContainer);
    const rainbowDefs=document.createElementNS(SVG_NS,'defs');
    rainbowDefs.innerHTML=rainbowSkinDefs();svg.appendChild(rainbowDefs);
    const materialGradient=document.createElementNS(SVG_NS,'linearGradient');
    materialGradient.id='torso-material';
    materialGradient.setAttribute('gradientUnits','userSpaceOnUse');
    const materialStops=[0,.5,.5,1].map(offset=>{
      const stop=document.createElementNS(SVG_NS,'stop');
      stop.setAttribute('offset',offset);
      stop.setAttribute('stop-color','#C5C5C5');
      materialGradient.appendChild(stop);
      return stop;
    });
    defs.appendChild(materialGradient);
    torsoMaterial={gradient:materialGradient,
      upper:materialStops.slice(0,2),lower:materialStops.slice(2)};
    const fabric=document.createElementNS(SVG_NS,'pattern');
    fabric.id='loose-pants-fabric';
    fabric.setAttribute('patternUnits','userSpaceOnUse');
    fabric.setAttribute('width','24');fabric.setAttribute('height','32');
    fabric.innerHTML=loosePantsFabricContent;
    const skinClip=document.createElementNS(SVG_NS,'clipPath');
    skinClip.id='torso-upper-skin';
    skinClip.setAttribute('clipPathUnits','userSpaceOnUse');
    const skinPolygon=document.createElementNS(SVG_NS,'polygon');
    skinClip.appendChild(skinPolygon);defs.append(fabric,skinClip);
    const upperSkin=document.createElementNS(SVG_NS,'path');
    upperSkin.setAttribute('fill','#C5C5C5');
    upperSkin.setAttribute('clip-path','url(#torso-upper-skin)');
    upperSkin.setAttribute('pointer-events','none');
    upperSkin.style.display='none';
    const bodyFill=partLayers.body.firstChild;
    partLayers.body.insertBefore(upperSkin,bodyFill.nextSibling);
    Object.assign(torsoMaterial,{fabric,upperSkin,upperClip:skinPolygon});

    const chestMask=document.createElementNS(SVG_NS,'mask');
    chestMask.id='jumpsuit-chest-mask';
    chestMask.setAttribute('maskUnits','userSpaceOnUse');
    chestMask.setAttribute('x','-200');
    chestMask.setAttribute('y','-200');
    chestMask.setAttribute('width','500');
    chestMask.setAttribute('height','600');
    const maskBackground=document.createElementNS(SVG_NS,'rect');
    maskBackground.setAttribute('x','-200');
    maskBackground.setAttribute('y','-200');
    maskBackground.setAttribute('width','500');
    maskBackground.setAttribute('height','600');
    maskBackground.setAttribute('fill','white');
    jumpsuitChestCutout=document.createElementNS(SVG_NS,'path');
    jumpsuitChestCutout.setAttribute('fill','black');
    chestMask.append(maskBackground,jumpsuitChestCutout);
    defs.appendChild(chestMask);
    garmentPaths.jumpsuit.setAttribute('mask','url(#jumpsuit-chest-mask)');
    const necklineMask=document.createElementNS(SVG_NS,'mask');
    necklineMask.id='inner-neckline-occlusion';
    necklineMask.setAttribute('maskUnits','userSpaceOnUse');
    for(const [key,value] of Object.entries({x:-1000,y:-1000,width:2000,height:2000}))necklineMask.setAttribute(key,value);
    const necklineBackground=document.createElementNS(SVG_NS,'rect');
    for(const [key,value] of Object.entries({x:-1000,y:-1000,width:2000,height:2000,fill:'white'}))necklineBackground.setAttribute(key,value);
    innerNecklineOcclusion=document.createElementNS(SVG_NS,'path');
    innerNecklineOcclusion.setAttribute('fill','black');
    innerNecklineOcclusion.setAttribute('stroke','black');
    innerNecklineOcclusion.setAttribute('stroke-width','1');
    innerNecklineOcclusion.setAttribute('stroke-linejoin','round');
    necklineMask.append(necklineBackground,innerNecklineOcclusion);
    createOuterwearNecklineOcclusion(defs,necklineMask);
    defs.appendChild(necklineMask);
    ['left','right'].forEach(side=>{
      const makeMask=suffix=>{
        const clip=document.createElementNS(SVG_NS,'clipPath');
        clip.id=side+'-hip-'+suffix+'-clip';
        const circle=document.createElementNS(SVG_NS,'circle');
        clip.appendChild(circle);defs.appendChild(clip);
        const mask=document.createElementNS(SVG_NS,'mask');
        mask.id=side+'-hip-'+suffix+'-mask';
        mask.setAttribute('maskUnits','userSpaceOnUse');
        for(const [key,value] of Object.entries({x:-1000,y:-1000,width:2000,height:2000}))
          mask.setAttribute(key,value);
        const background=document.createElementNS(SVG_NS,'rect');
        for(const [key,value] of Object.entries({x:-1000,y:-1000,width:2000,height:2000,fill:'white'}))
          background.setAttribute(key,value);
        const path=document.createElementNS(SVG_NS,'path');
        path.setAttribute('fill','black');
        path.setAttribute('clip-path','url(#'+clip.id+')');
        mask.append(background,path);defs.appendChild(mask);
        return {circle,path,mask};
      };
      const contour=makeMask('contour'),root=makeMask('root');
      hipMasks.push({side,circle:contour.circle,path:contour.path,
        rootCircle:root.circle,rootPath:root.path});
    });
    ['left','right'].forEach(side=>{
      // The same trick as the hip: inside the torso the arm has no contour of
      // its own in the reference, it simply merges into the trunk.
      const clip=document.createElementNS(SVG_NS,'clipPath');
      clip.id=side+'-shoulder-clip';
      const circle=document.createElementNS(SVG_NS,'circle');
      clip.appendChild(circle);defs.appendChild(clip);
      const mask=document.createElementNS(SVG_NS,'mask');
      mask.id=side+'-shoulder-mask';
      mask.setAttribute('maskUnits','userSpaceOnUse');
      for(const [key,value] of Object.entries({x:-1000,y:-1000,width:2000,height:2000}))
        mask.setAttribute(key,value);
      const background=document.createElementNS(SVG_NS,'rect');
      for(const [key,value] of Object.entries({x:-1000,y:-1000,width:2000,height:2000,fill:'white'}))
        background.setAttribute(key,value);
      const path=document.createElementNS(SVG_NS,'path');
      path.setAttribute('fill','black');
      path.setAttribute('clip-path','url(#'+clip.id+')');
      mask.append(background,path);defs.appendChild(mask);
      shoulderMasks.push({side,circle,path});
    });
    ['left','right'].forEach(side=>{
      const group=partLayers[side+'Leg'];
      const makeHemClip=kind=>{
        const clip=document.createElementNS(SVG_NS,'clipPath');
        clip.id=`${side}-${kind}-hem-clip`;
        clip.setAttribute('clipPathUnits','userSpaceOnUse');
        const polygon=document.createElementNS(SVG_NS,'polygon');
        clip.appendChild(polygon);
        defs.appendChild(clip);
        polygon.ownerClip=clip;
        return polygon;
      };
      const shortsClip=makeHemClip('shorts');
      const skinClip=makeHemClip('skin');
      const ultraShortsClip=makeHemClip('ultra-shorts');
      const exposedThighClip=makeHemClip('exposed-thigh');
      const wideClip=makeHemClip('wide');
      const ankleClip=makeHemClip('ankle');
      const sockTopClip=makeHemClip('sock-top'),sockBottomClip=makeHemClip('sock-bottom');
      // The live shoe outline clips details to the rendered shoe surface.
      const shoeClipContainer=document.createElementNS(SVG_NS,'clipPath');
      shoeClipContainer.id=`${side}-shoe-clip`;
      shoeClipContainer.setAttribute('clipPathUnits','userSpaceOnUse');
      const shoeClip=document.createElementNS(SVG_NS,'path');
      shoeClipContainer.appendChild(shoeClip);
      defs.appendChild(shoeClipContainer);
      const thighBlack=document.createElementNS(SVG_NS,'g');
      const shinBlack=document.createElementNS(SVG_NS,'g');
      const rootBlack=document.createElementNS(SVG_NS,'g');
      const thighSkin=document.createElementNS(SVG_NS,'g');
      const shinSkin=document.createElementNS(SVG_NS,'g');
      thighBlack.setAttribute('mask','url(#'+side+'-hip-contour-mask)');
      shinBlack.setAttribute('mask','url(#'+side+'-hip-contour-mask)');
      rootBlack.setAttribute('mask','url(#'+side+'-hip-root-mask)');
      const segments=[];
      for(let i=0;i<32;i++){
        const back=document.createElementNS(SVG_NS,'path');
        const front=document.createElementNS(SVG_NS,'path');
        for(const [node,color] of [[back,'black'],[front,'#C5C5C5']]){
          node.setAttribute('fill','none');
          node.setAttribute('stroke',color);
          node.setAttribute('stroke-linecap','round');
          node.setAttribute('stroke-linejoin','round');
        }
        if(i===0)back.setAttribute('stroke-linecap','butt');
        if(i===31){
          back.setAttribute('stroke-linecap','butt');
          front.setAttribute('stroke-linecap','butt');
        }
        (i<3?rootBlack:i<19?thighBlack:shinBlack).appendChild(back);
        (i<19?thighSkin:shinSkin).appendChild(front);
        segments.push({back,front});
      }
      const calfEdges=document.createElementNS(SVG_NS,'path');
      for(const [name,value] of Object.entries({fill:'none',stroke:'black',
        'stroke-width':1,'stroke-linecap':'round','stroke-linejoin':'round'}))
        calfEdges.setAttribute(name,value);
      const fabricMasks=[];
      const fabricLayers=[thighSkin,shinSkin].map((parent,part)=>{
        const mask=document.createElementNS(SVG_NS,'mask');
        mask.id=`${side}-fabric-${part}`;
        for(const [key,value] of Object.entries({maskUnits:'userSpaceOnUse',x:-1000,y:-1000,width:2000,height:2000}))mask.setAttribute(key,value);
        for(let i=0;i<32;i++){
          const path=document.createElementNS(SVG_NS,'path');
          path.setAttribute('fill','none');path.setAttribute('stroke','white');
          mask.appendChild(path);(fabricMasks[i]??=[]).push(path);
        }
        defs.appendChild(mask);
        const group=document.createElementNS(SVG_NS,'g');
        group.setAttribute('mask',`url(#${mask.id})`);
        group.setAttribute('data-fabric','');
        group.setAttribute('pointer-events','none');
        const nodes=[];
        return {group,nodes};
      });
      const jeansGradients=Array.from({length:64},(_,i)=>{
        const node=document.createElementNS(SVG_NS,'linearGradient');node.id=`${side}-jobs-mesh-${i}`;
        node.setAttribute('gradientUnits','userSpaceOnUse');
        for(const [offset,color] of Array.from({length:33},(_,k)=>[k/32,jobsDenimColor(k/32)])){
          const stop=document.createElementNS(SVG_NS,'stop');stop.setAttribute('offset',offset);stop.setAttribute('stop-color',color);node.appendChild(stop);
        }
        defs.appendChild(node);return node;
      });
      const jeansHoleMasks=[0,1].map(part=>{
        const node=document.createElementNS(SVG_NS,'mask');node.id=`${side}-jeans-holes-${part}`;
        for(const [k,v] of Object.entries({maskUnits:'userSpaceOnUse',x:-1000,y:-1000,width:2000,height:2000}))node.setAttribute(k,v);
        defs.appendChild(node);return node;
      });
      const jeansSkin=[thighSkin,shinSkin].map(parent=>{
        const node=document.createElementNS(SVG_NS,'g');node.setAttribute('pointer-events','none');
        parent.insertBefore(node,parent.firstChild);return node;
      });
      const jeansTextures=[thighSkin,shinSkin].map(parent=>{const node=document.createElementNS(SVG_NS,'g');node.setAttribute('pointer-events','none');parent.appendChild(node);return node;});
      const jeansSeams=[thighSkin,shinSkin].map(parent=>{
        const node=document.createElementNS(SVG_NS,'path');
        for(const [attr,value] of Object.entries({fill:'none',stroke:'black','stroke-width':JEANS_STROKE_WIDTH,'stroke-dasharray':'3 2','pointer-events':'none'}))node.setAttribute(attr,value);
        parent.appendChild(node);return node;
      });
      const bootFill=document.createElementNS(SVG_NS,'path');
      bootFill.setAttribute('fill','#C5C5C5');
      const bootOutline=document.createElementNS(SVG_NS,'path');
      bootOutline.setAttribute('fill','none');
      bootOutline.setAttribute('stroke','black');
      bootOutline.setAttribute('stroke-linecap','round');
      bootOutline.setAttribute('stroke-linejoin','round');
      const shoeCuff=document.createElementNS(SVG_NS,'path');
      shoeCuff.setAttribute('fill','none');
      shoeCuff.setAttribute('stroke','black');
      shoeCuff.setAttribute('stroke-width','1');
      const shortHem=document.createElementNS(SVG_NS,'path');
      shortHem.setAttribute('fill','none');
      shortHem.setAttribute('stroke','black');
      shortHem.setAttribute('stroke-width','1');
      const sockTop=document.createElementNS(SVG_NS,'path');
      sockTop.setAttribute('fill','none');
      sockTop.setAttribute('stroke','black');
      sockTop.setAttribute('stroke-width','1');
      const bootTop=document.createElementNS(SVG_NS,'path');
      bootTop.setAttribute('fill','none');
      bootTop.setAttribute('stroke','black');
      bootTop.setAttribute('stroke-width','1');
      const wideHem=document.createElementNS(SVG_NS,'path');
      wideHem.setAttribute('fill','none');
      wideHem.setAttribute('stroke','black');
      wideHem.setAttribute('stroke-width','1');
      const crease=document.createElementNS(SVG_NS,'path');
      crease.setAttribute('fill','none');
      crease.setAttribute('stroke','black');
      crease.setAttribute('stroke-width','1');
      crease.setAttribute('stroke-linecap','round');
      group.append(rootBlack,thighBlack,shinBlack,thighSkin,shinSkin,
        shortHem,sockTop,calfEdges,crease,bootFill,bootOutline,shoeCuff,bootTop,wideHem);
      const sneakerDetails=document.createElementNS(SVG_NS,'g');
      sneakerDetails.setAttribute('pointer-events','none');group.appendChild(sneakerDetails);
      const calfOverlay=document.createElementNS(SVG_NS,'g');
      calfOverlay.setAttribute('pointer-events','none');
      calfOverlay.setAttribute('data-calf-overlay',side);
      for(const [index,node] of [bootFill,sneakerDetails,bootOutline].entries()){
        node.id=`${side}-calf-shoe-${index}`;
        const copy=document.createElementNS(SVG_NS,'use');
        copy.setAttribute('href',`#${node.id}`);
        copy.setAttribute('data-calf-shoe','');
        calfOverlay.appendChild(copy);
      }
      for(const [index,node] of [shinBlack,shinSkin,fabricLayers[1].group,calfEdges,sockTop,shoeCuff,bootTop,wideHem].entries()) {
        node.id=`${side}-calf-render-${index}`;
        const copy=document.createElementNS(SVG_NS,'use');
        copy.setAttribute('href',`#${node.id}`);
        calfOverlay.appendChild(copy);
      }
      outfitOverlay.appendChild(calfOverlay);
      const spongeLegMarks=spongeLegSpots[side].map(([index,rx,ry])=>{
        const node=document.createElementNS(SVG_NS,'path');
        node.setAttribute('fill','#C2C104');node.setAttribute('stroke','none');node.style.display='none';
        (index<19?thighSkin:shinSkin).appendChild(node);
        return {node,index,rx,ry};
      });
      legParts.push({spongeLegMarks,segments,bootFill,bootOutline,sneakerDetails,shoeClip,
        shoeCuff,shortHem,bootTop,wideHem,shortsClip,skinClip,ultraShortsClip,exposedThighClip,wideClip,ankleClip,
        calfEdges,calfOverlay,fabricLayers,fabricMasks,jeansSeams,jeansTextures,jeansHoleMasks,jeansSkin,jeansGradients,crease,
        side,group,rootBlack,thighBlack,shinBlack,thighSkin,shinSkin,sockTopClip,sockBottomClip,sockTop});
    });
    const sourceArms = paths.filter(path => path.role === 'arms');
    sourceArms.forEach(({ node }) => node.remove());
    paths = paths.filter(path => path.role !== 'arms');
    const handSources = {};
    sourceArms.forEach(({ original, index }) => {
      const side = index === 3 ? 'left' : 'right';
      const wrist = wristSources[side];
      handSources[side] = splitArmPath(original, wrist.outer, wrist.inner);
    });
    ['left','right'].forEach(side=>{
      const group=partLayers[`${side}Hand`];
      const makeSleeveClip=kind=>{
        const clip=document.createElementNS(SVG_NS,'clipPath');
        clip.id=`${side}-${kind}-clip`;
        clip.setAttribute('clipPathUnits','userSpaceOnUse');
        const polygon=document.createElementNS(SVG_NS,'polygon');
        clip.appendChild(polygon);
        defs.appendChild(clip);
        return polygon;
      };
      const outerHemClip=makeSleeveClip('outer-hem');
      const sleeveClip=makeSleeveClip('sleeve');
      const skinClip=makeSleeveClip('skin');
      const black=document.createElementNS(SVG_NS,'g');
      // Only the spans that sit in the shoulder are masked. The rest of the
      // arm keeps its outline even when a raised forearm crosses the chest.
      const rootBlack=document.createElementNS(SVG_NS,'g');
      rootBlack.setAttribute('mask','url(#'+side+'-shoulder-mask)');
      const skinRoot=document.createElementNS(SVG_NS,'g');
      const skin=document.createElementNS(SVG_NS,'g');
      const segments=[];
      for(let i=0;i<32;i++){
        const back=document.createElementNS(SVG_NS,'path');
        const front=document.createElementNS(SVG_NS,'path');
        for(const [node,color] of [[back,'black'],[front,'#C5C5C5']]){
          node.setAttribute('fill','none');
          node.setAttribute('stroke',color);
          node.setAttribute('stroke-linecap','round');
          node.setAttribute('stroke-linejoin','round');
          node.style.cursor='grab';
          // Both ends are butt cut: the shoulder sits flush against the torso
          // edge and the palm covers the wrist cross-section.
          if(i===0||i===31) node.setAttribute('stroke-linecap','butt');
        }
        (i<6?rootBlack:black).appendChild(back);
        (i<6?skinRoot:skin).appendChild(front);
        segments.push({back,front});
      }
      const makePath=filled=>{
        const node=document.createElementNS(SVG_NS,'path');
        node.setAttribute('fill',filled?'#C5C5C5':'none');
        node.setAttribute('stroke',filled?'none':'black');
        node.setAttribute('stroke-linecap','round');
        node.setAttribute('stroke-linejoin','round');
        node.style.cursor='grab';
        return node;
      };
      const crease=makePath(false);
      crease.setAttribute('stroke-width','1');
      const sleevePanel=makePath(true);
      sleevePanel.setAttribute('fill',decorationColors.royalWhite);
      const sleeveEdges=makePath(false);
      sleeveEdges.setAttribute('stroke-width','1');
      const cuff=makePath(false);
      cuff.setAttribute('stroke-width','1');
      const alohaSleeve=document.createElementNS(SVG_NS,'g');
      alohaSleeve.setAttribute('pointer-events','none');
      const glovePanel=makePath(true);glovePanel.setAttribute('fill',decorationColors.batBlack);
      const gloveEdges=makePath(false);gloveEdges.setAttribute('stroke-width','1');
      const handFill=makePath(true);
      const handOutline=makePath(false);
      const innerArm=document.createElementNS(SVG_NS,'g');
      const spongeMark=document.createElementNS(SVG_NS,'path');
      spongeMark.setAttribute('fill','#C2C104');spongeMark.setAttribute('stroke','none');spongeMark.style.display='none';
      const innerSleeve=document.createElementNS(SVG_NS,'g');
      innerSleeve.setAttribute('data-arm-sleeve',side);
      const [sleeveRootBlack,sleeveBlack,sleeveSkinRoot,sleeveSkin]=Array.from({length:4},()=>document.createElementNS(SVG_NS,'g'));
      innerArm.append(rootBlack,black,skinRoot,skin,crease,spongeMark);
      innerSleeve.append(sleeveRootBlack,sleeveBlack,sleeveSkinRoot,sleeveSkin,sleevePanel,sleeveEdges,cuff);
      group.append(innerArm,glovePanel,gloveEdges,handFill,handOutline,innerSleeve,alohaSleeve);
      armParts.push({spongeMark,innerArm,innerSleeve,black,skin,sleeveRootBlack,sleeveBlack,sleeveSkinRoot,sleeveSkin,outerHemClip,alohaSleeve,side,segments,rootBlack,skinRoot,sleeveClip,skinClip,
        crease,cuff,sleevePanel,sleeveEdges,glovePanel,gloveEdges,handFill,handOutline,
        handSource:handSources[side]});
    });

    createDragLayer();

    host.replaceChildren(svg);
    setHatSelection(selectedDecorations.helmet);
    Object.values(controls).forEach(input => input.addEventListener('input', () => {
      clearDragPose();
      update();
    }));
    exportButton.disabled = false;
    update();
  });

function revealScrollbarWhileScrolling(node){
 let timer;
 node.addEventListener('scroll',()=>{
  node.classList.add('is-scrolling');
  clearTimeout(timer);
  timer=setTimeout(()=>node.classList.remove('is-scrolling'),650);
 },{passive:true});
}
revealScrollbarWhileScrolling(document.querySelector('.wardrobe-panel'));
