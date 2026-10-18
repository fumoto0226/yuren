// Build catalog pictures from the same default-pose paths used by the editor.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const inputs = ['body', 'width', 'arms', 'legs', 'head']
  .map(key => ({ dataset: { control: key }, value: '100' }));
const context = vm.createContext({
  document: { querySelector: () => ({}), querySelectorAll: () => inputs },
  requestAnimationFrame: () => 1, console,
});
vm.runInContext(fs.readFileSync(path.join(root, 'script.js'), 'utf8')
  .split('resetButton.addEventListener')[0], context);

const original = fs.readFileSync(path.join(root, 'svg/参考.svg'), 'utf8');
context.leftArmSource = [...original.matchAll(/<path d="([^"]+)"/g)][3][1];
const art = vm.runInContext(`(() => {
  const warp = buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  dragPoses.length = 0;
  const arms = ['left','right'].map(side => armGeometry(side,warp));
  const legs = ['left','right'].map(side => legGeometry(side,warp));
  const hand = splitArmPath(leftArmSource,wristSources.left.outer,
    wristSources.left.inner);
  return {
    yellowHat: Object.values(yellowHatSources).map(source=>
      transformPath(source,(x,y)=>warp(x,y,'head'))),
    scarf: scarfSources.map(source => transformPath(source,(x,y) => warp(x,y,'head'))),
    shirt: {
      fill: garmentPath(shirtSource,warp),
      sides: garmentPath(shirtSidesSource,warp),
      top: transformPath(shirtTopSource,(x,y) => warp(x,y,'head')),
      hem: garmentPath(shirtHemSource,warp), arms,
    },
    vest: {
      fill: garmentPath(vestSource,warp),
      sides: garmentPath(vestSidesSource,warp),
      neck: garmentPath(vestNeckSource,warp),
      top: Object.values(vestTopSources).map(source =>
        transformPath(source,(x,y) => warp(x,y,'head'))).join(' '),
      shoulders: Object.values(jumpsuitShoulderSources).map(source =>
        garmentPath(source,warp)).join(' '),
      hem: garmentPath(vestHemSource,warp),
    },
    greenVest: Object.values(greenVestSources).map(source=>garmentPath(source,warp)),
    redTriangle: torsoGarmentPath(redTriangleSource,warp,true),
    redThong: torsoGarmentPath(redThongSource(100),warp),
    colors: Object.assign({},decorationColors),
    tee: {
      fill: garmentPath(teeSource,warp),
      sides: garmentPath(shirtSidesSource,warp),
      neck: garmentPath(teeNeckSource,warp),
      top: Object.values(vestTopSources).map(source =>
        transformPath(source,(x,y) => warp(x,y,'head'))).join(' '),
      hem: garmentPath(shirtHemSource,warp),
      patches: Object.fromEntries(Object.entries(patchSources).map(
        ([key,source]) => [key,garmentPath(source,warp)])), arms,
    },
    redTee: {
      fill:garmentPath(redTeeSource,warp),
      neck:garmentPath(redTeeNeckSource,warp),
    },
    looseTop:{fill:looseTopPath(looseTopSource,warp),
      sides:looseTopPath(looseTopSidesSource,warp),
      hem:looseTopPath(looseTopHemSource,warp)},
    pants: {
      fill: garmentPath(pantsSource,warp),
      sides: garmentPath(pantsSidesSource,warp),
      crotch: garmentPath(pantsCrotchSource,warp),
      shortsLower: garmentPath(shortsLowerSource,warp),
      waist: garmentPath(pantsWaistSource,warp), legs,
    },
    jumpsuit: {
      fill: garmentPath(jumpsuitSource,warp),
      chest: garmentPath(jumpsuitChestSource,warp),
      sides: garmentPath(jumpsuitSidesSource,warp),
      crotch: garmentPath(pantsCrotchSource,warp),
      chestOutline: garmentPath(jumpsuitChestOutlineSource,warp),
      neck: Object.values(jumpsuitNeckSources).map(source =>
        transformPath(source,(x,y) => warp(x,y,'head'))).join(' '),
      shoulders: Object.values(jumpsuitShoulderSources).map(source =>
        garmentPath(source,warp)).join(' '), legs,
    },
    skirt:skirtPath(warp,100),
    shoes: legs[0],
    gloves: {
      fill: transformPath(hand.handFill,arms[0].handPoint),
      outline: transformPath(hand.handOutline,arms[0].handPoint),
    },
  };
})()`, context);

const svg = (viewBox, content) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">\n${content}\n</svg>\n`;
const line = (d, width=1) => `<path d="${d}" fill="none" stroke="black" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const wideWidths=vm.runInContext('Array.from({length:32},(_,i)=>wideLegExtraWidth(i))',context);
const shortFlares=vm.runInContext('kneeShortFlares',context);
const flaredShortWidths=flare=>vm.runInContext(
  `Array.from({length:32},(_,i)=>wideShortsExtraWidth(i,${flare}))`,context);
const looseWideWidths=vm.runInContext('Array.from({length:32},(_,i)=>wideLegExtraWidth(i,10.5))',context);
const tube = (shape, color, sleeveEnd=0,extraWidths=[],flareAmount=2.5) => [
  ...shape.hose.map(({ d, width },index) => {
    const flare=sleeveEnd&&index<sleeveEnd?flareAmount*(index/(sleeveEnd-1)):0;
    return `<path d="${d}" fill="none" stroke="black" stroke-width="${width+2+flare+(extraWidths[index]||0)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }),
  ...shape.hose.map(({ d, width },index) => {
    const flare=sleeveEnd&&index<sleeveEnd?flareAmount*(index/(sleeveEnd-1)):0;
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width+flare+(extraWidths[index]||0)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }),
].join('\n');
const seam = leg => line(`M${leg.bootOuter.x} ${leg.bootOuter.y}L${leg.bootInner.x} ${leg.bootInner.y}`);
const limbCuff = (limb,index,extraWidth=0) => {
  const a=limb.centerline[index-1],b=limb.centerline[index+1],p=limb.centerline[index];
  const length=Math.hypot(b.x-a.x,b.y-a.y)||1;
  const radius=(limb.hose[index].width+1+extraWidth)/2;
  const nx=(b.y-a.y)/length,ny=-(b.x-a.x)/length;
  return [{x:p.x+nx*radius,y:p.y+ny*radius},
    {x:p.x-nx*radius,y:p.y-ny*radius}];
};
const legEndCuff = (leg,widths) => {
  const end=leg.centerline[32],before=leg.centerline[30];
  const length=Math.hypot(end.x-before.x,end.y-before.y)||1;
  const radius=(leg.hose[31].width+1+widths[31])/2;
  const nx=(end.y-before.y)/length,ny=-(end.x-before.x)/length;
  return [{x:end.x+nx*radius,y:end.y+ny*radius},
    {x:end.x-nx*radius,y:end.y-ny*radius}];
};
const clippedTube = (shape, chord, color, id, sleeveEnd=0, towardStart=true,extraWidths=[],flareAmount=2.5) => {
  const [a,b]=chord, length=Math.hypot(b.x-a.x,b.y-a.y)||1;
  const across={x:(b.x-a.x)/length,y:(b.y-a.y)/length};
  const middle={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
  const start=shape.centerline[0];
  const towardLength=Math.hypot(start.x-middle.x,start.y-middle.y)||1;
  const toward={x:(start.x-middle.x)/towardLength,
    y:(start.y-middle.y)/towardLength};
  const direction=towardStart?1:-1;
  const point=(p,side,back)=>`${p.x+across.x*side*150+toward.x*back*direction} ${p.y+across.y*side*150+toward.y*back*direction}`;
  const polygon=[point(a,-1,0),point(b,1,0),point(b,1,300),point(a,-1,300)].join(' ');
  return `<defs><clipPath id="${id}"><polygon points="${polygon}"/></clipPath></defs>`
    + `<g clip-path="url(#${id})">${tube(shape,color,sleeveEnd,extraWidths,flareAmount)}</g>`;
};

const teeThumbnail=(color,sleeveEnd,flare,id)=>svg('-2 53 104 63',[
  ...art.tee.arms.map((arm,index)=>clippedTube(arm,
    limbCuff(arm,sleeveEnd,flare),color,`${id}-sleeve-${index}`,sleeveEnd,
    true,[],flare)
    +line(vm.runInContext(`cuffPath(thumbArm,${sleeveEnd},${flare})`,
      Object.assign(context,{thumbArm:arm})))),
  `<path d="${id==='red-tee'?art.redTee.fill:art.tee.fill}" fill="${color}"/>`,
  line(art.tee.sides),line(art.tee.top),
  line(id==='red-tee'?art.redTee.neck:art.tee.neck),line(art.tee.hem),
].join('\n'));
const looseTopThumbnail=id=>{
  const style=vm.runInContext(`teeStyles['${id}']`,context);
  const widths=vm.runInContext(`Array.from({length:32},(_,i)=>sleeveExtraWidth(i,${style.sleeveEnd},${style.flare}))`,context);
  return svg('-6 53 112 64',[
    ...art.tee.arms.map((arm,index)=>clippedTube(arm,
      limbCuff(arm,style.sleeveEnd,style.flare),style.color,
      `${id}-sleeve-${index}`,0,true,widths)
      +line(vm.runInContext(`cuffPath(thumbArm,${style.sleeveEnd},${style.flare})`,
        Object.assign(context,{thumbArm:arm})))),
    `<path d="${art.looseTop.fill}" fill="${style.color}"/>`,
    line(art.looseTop.sides),line(art.tee.top),line(art.tee.neck),line(art.looseTop.hem),
  ].join('\n'));
};
const jumpsuitThumbnail=(color,id)=>svg('11 53 79 134',[
  `<defs><mask id="${id}-chest"><rect x="-200" y="-200" width="500" height="600" fill="white"/><path d="${art.jumpsuit.chest}" fill="black"/></mask></defs>`,
  ...art.jumpsuit.legs.map((leg,index)=>clippedTube(leg,
    [leg.bootOuter,leg.bootInner],color,`${id}-leg-${index}`)+seam(leg)),
  `<path d="${art.jumpsuit.fill}" fill="${color}" mask="url(#${id}-chest)"/>`,
  line(art.jumpsuit.sides),line(art.jumpsuit.crotch,1.5),
  line(art.jumpsuit.chestOutline),line(art.jumpsuit.neck,1.25),
  line(art.jumpsuit.shoulders,1.1),
].join('\n'));
const fabricLegThumbnail=(leg,index,id,widths)=>{
  const parts=vm.runInContext(`legFabricPaths(thumbLeg,thumbSide,100)`,
    Object.assign(context,{thumbLeg:leg,thumbSide:index?'right':'left'}));
  return parts.map((paths,part)=>{
    const maskId=`${id}-fabric-${index}-${part}`;
    const strokes=leg.hose.map(({d,width},i)=>i>=(part?19:0)&&i<(part?32:19)
      ?`<path d="${d}" fill="none" stroke="white" stroke-width="${width+widths[i]}" stroke-linecap="${i===31?'butt':'round'}"/>`:'').join('');
    return `<defs><mask id="${maskId}" maskUnits="userSpaceOnUse" x="-1000" y="-1000" width="2000" height="2000">${strokes}</mask></defs>`
      +`<g clip-path="url(#${id}-leg-${index})"><g mask="url(#${maskId})">`
      +paths.map(({color,d})=>`<path fill="${color}" d="${d}"/>`).join('')+'</g></g>';
  }).join('');
};
const fabricContent=vm.runInContext('loosePantsFabricContent',context);
const widePantsThumbnail=(id,flare,widths,viewBox)=>{
  const patterned=id==='loose-wide-pants';
  const paint=patterned?'url(#loose-pants-fabric)':art.colors.widePants;
  return svg(viewBox,[
  patterned?`<defs><pattern id="loose-pants-fabric" patternUnits="userSpaceOnUse" width="24" height="32" patternTransform="translate(46.8 110.5)">${fabricContent}</pattern></defs>`:'',
  ...art.pants.legs.map((leg,index)=>clippedTube(leg,
    legEndCuff(leg,widths),patterned?'#607e79':paint,
    `${id}-leg-${index}`,0,true,widths)
    +(patterned?fabricLegThumbnail(leg,index,id,widths):'')
    +line(vm.runInContext(`wideLegHemPath(thumbLeg,${flare})`,
      Object.assign(context,{thumbLeg:leg})))),
  `<path d="${art.pants.fill}" fill="${paint}"/>`,
  line(art.pants.sides),line(art.pants.crotch),line(art.pants.waist),
].join('\n'));
};

// Flared knee shorts: the same widening tube the editor paints, cut at the
// knee. The skirt adds the joined middle and leaves out the crotch line.
const flaredShortsThumbnail=(id,color,flare)=>{
  const widths=flaredShortWidths(flare);
  return svg('9 109 84 56',[
    ...art.pants.legs.map((leg,index)=>clippedTube(leg,
      limbCuff(leg,19,widths[19]),color,`${id}-leg-${index}`,0,true,widths)
      +line(vm.runInContext(`cuffPath(thumbLeg,19,${widths[19]},.5)`,
        Object.assign(context,{thumbLeg:leg})))),
    `<path d="${art.pants.fill}" fill="${color}"/>`,
    line(art.pants.sides),line(art.pants.crotch),line(art.pants.waist),
  ].join('\n'));
};

const frogColors=vm.runInContext('milkFrogColors',context);
const frogBelly=vm.runInContext('torsoGarmentPath(milkFrogBellySource,buildWarp({body:100,width:100,arms:100,legs:100,head:100}))',context);
const frogPaths=[...original.matchAll(/<path\b[^>]*\/>/g)].map(m=>m[0]);
const frogIcon=frogPaths.map((tag,index)=>{
  if(index===0||index>=12)return '';
  let node=tag.replace(/fill="#C5C5C5"/g,`fill="${frogColors.skin}"`);
  if(!/\bfill=/.test(node))node=node.replace('<path ','<path fill="none" ');
  if(index===8)node=node.replace('fill="white"',`fill="${frogColors.eye}"`);
  if(index===2)node+=`<path d="${frogBelly}" fill="${frogColors.belly}"/>`;
  return node;
}).join('')+(original.match(/<ellipse\b[^>]*\/>/)?.[0]||'');
const thumbnails = {
  'loose-tee':looseTopThumbnail('loose-tee'),
  'loose-long-sleeve':looseTopThumbnail('loose-long-sleeve'),
  'milk-frog':svg('-2 9 104 188',frogIcon),
  'yellow-hat': svg('55 6 39 62',art.yellowHat.map(d=>
    `<path d="${d}" fill="#ffe047" stroke="black" stroke-width="1" stroke-linejoin="round"/>`).join('\n')),
  scarf: svg('5 44 94 39', art.scarf.map(d =>
    `<path d="${d}" fill="#d84f50" stroke="black" stroke-width="1" stroke-linejoin="round"/>`).join('\n')),
  shirt: svg('-2 53 104 63', [
    ...art.shirt.arms.map((arm,index) => clippedTube(arm,limbCuff(arm,31),
      '#7d9ea2',`shirt-sleeve-${index}`) + line(vm.runInContext(
      'cuffPath(thumbArm,31)', Object.assign(context, {thumbArm:arm})))),
    `<path d="${art.shirt.fill}" fill="#7d9ea2"/>`,
    line(art.shirt.sides), line(art.shirt.top),line(art.shirt.hem),
  ].join('\n')),
  'blue-vest': svg('24 54 47 51', [
    `<path d="${art.vest.fill}" fill="#2e5bd5"/>`,
    line(art.vest.sides),line(art.vest.neck),line(art.vest.top),
    line(art.vest.shoulders),line(art.vest.hem),
  ].join('\n')),
  'green-vest': svg('24 49 46 66',art.greenVest.map(d=>
    `<path d="${d}" fill="#278b20" stroke="black" stroke-width="1" stroke-linejoin="round"/>`).join('\n')),
  'yellow-tee': svg('-2 53 104 63', [
    ...art.tee.arms.map((arm,index) => clippedTube(arm,
      limbCuff(arm,20,2.5),'#ffe144',`yellow-sleeve-${index}`,20)
      +line(vm.runInContext('cuffPath(thumbArm,20,2.5)',
        Object.assign(context,{thumbArm:arm})))),
    `<path d="${art.tee.fill}" fill="#ffe144"/>`,
    line(art.tee.sides),line(art.tee.top),line(art.tee.neck),line(art.tee.hem),
  ].join('\n')),
  'patched-tee': svg('-2 53 104 63', [
    ...art.tee.arms.map((arm,index) => clippedTube(arm,
      limbCuff(arm,20,2.5),'#756e6c',`patched-sleeve-${index}`,20)
      +line(vm.runInContext('cuffPath(thumbArm,20,2.5)',
        Object.assign(context,{thumbArm:arm})))),
    `<path d="${art.tee.fill}" fill="#756e6c"/>`,
    line(art.tee.sides),line(art.tee.top),line(art.tee.neck),line(art.tee.hem),
    `<path d="${art.tee.patches.blue}" fill="#214f98" stroke="black" stroke-width="1"/>`,
    `<path d="${art.tee.patches.red}" fill="#d9575b" stroke="black" stroke-width="1"/>`,
    line(art.tee.patches.stitches,.7),
  ].join('\n')),
  'red-tee': teeThumbnail(art.colors.redTee,20,2.5,'red-tee'),
  'coral-tee': teeThumbnail(art.colors.coralTee,17,3,'coral-tee'),
  'red-triangle': svg('24 53 48 83',
    `<path d="${art.redTriangle}" fill="${art.colors.redTriangle}" stroke="black" stroke-width="1" stroke-linejoin="round"/>`),
  pants: svg('12 108 78 78', [
    ...art.pants.legs.map((leg,index) => clippedTube(leg,
      [leg.bootOuter,leg.bootInner],'#526a78',`pants-leg-${index}`) + seam(leg)),
    `<path d="${art.pants.fill}" fill="#526a78"/>`,
    line(art.pants.sides), line(art.pants.crotch,1.5),line(art.pants.waist),
  ].join('\n')),
  'red-shorts': svg('25 109 44 27', [
    `<path d="${art.pants.fill}" fill="#d44a49"/>`,
    line(art.pants.sides),line(art.pants.shortsLower),line(art.pants.waist),
  ].join('\n')),
  'pink-shorts': svg('11 109 80 56', [
    ...art.pants.legs.map((leg,index) => clippedTube(leg,
      limbCuff(leg,19),'#ee31ac',`pink-leg-${index}`)
      +line(vm.runInContext('cuffPath(thumbLeg,19,0,.5)',
        Object.assign(context,{thumbLeg:leg})))),
    `<path d="${art.pants.fill}" fill="#ee31ac"/>`,
    line(art.pants.sides),line(art.pants.crotch),line(art.pants.waist),
  ].join('\n')),
  'wide-shorts': flaredShortsThumbnail('wide-shorts',art.colors.wideShorts,
    shortFlares['wide-shorts']),
  skirt: svg('13 109 69 49',`<path d="${art.skirt}" fill="${art.colors.skirt}" stroke="black" stroke-width="1" stroke-linejoin="round"/>`),
  'orange-shorts': svg('11 109 80 56', [
    ...art.pants.legs.map((leg,index) => clippedTube(leg,
      limbCuff(leg,19),'#eb8135',`orange-leg-${index}`)
      +line(vm.runInContext('cuffPath(thumbLeg,19,0,.5)',
        Object.assign(context,{thumbLeg:leg})))),
    `<path d="${art.pants.fill}" fill="#eb8135"/>`,
    line(art.pants.sides),line(art.pants.crotch),line(art.pants.waist),
  ].join('\n')),
  'black-shorts': svg('11 109 80 56', [
    ...art.pants.legs.map((leg,index)=>clippedTube(leg,
      limbCuff(leg,19),art.colors.blackShorts,`black-leg-${index}`)
      +line(vm.runInContext('cuffPath(thumbLeg,19,0,.5)',
        Object.assign(context,{thumbLeg:leg})))),
    `<path d="${art.pants.fill}" fill="${art.colors.blackShorts}"/>`,
    line(art.pants.sides),line(art.pants.crotch),line(art.pants.waist),
  ].join('\n')),
  'red-thong':svg('24 108 47 36',
    `<path d="${art.redThong}" fill="${art.colors.redThong}" stroke="black" stroke-width="1" stroke-linejoin="round"/>`),
  'wide-pants':widePantsThumbnail('wide-pants',5.5,wideWidths,'8 108 86 80'),
  'loose-wide-pants':widePantsThumbnail('loose-wide-pants',10.5,
    looseWideWidths,'2 108 98 80'),
  jumpsuit:jumpsuitThumbnail(art.colors.jumpsuit,'jumpsuit'),
  'navy-jumpsuit':jumpsuitThumbnail(art.colors.navyJumpsuit,'navy-jumpsuit'),
  shoes: svg('-1 177 32 20', [
    `<path d="${art.shoes.bootFill}" fill="#4e6069"/>`,
    line(art.shoes.bootOutline), seam(art.shoes),
  ].join('\n')),
  'brown-boots': svg('-1 144 102 50', art.pants.legs.map((leg,index)=>[
    clippedTube(leg,limbCuff(leg,19),'#603d26',`brown-boot-${index}`,0,false),
    `<path d="${leg.bootFill}" fill="#603d26"/>`,
    line(leg.bootOutline),
    line(vm.runInContext('cuffPath(thumbLeg,19)',
      Object.assign(context,{thumbLeg:leg}))),
  ].join('\n')).join('\n')),
  gloves: svg('-1 95 25 19', [
    `<path d="${art.gloves.fill}" fill="#c8a27d"/>`,
    line(art.gloves.outline),
  ].join('\n')),
};

for (const [name, content] of Object.entries(thumbnails)) {
  const filename=['blue-vest','green-vest','yellow-hat','yellow-tee',
    'patched-tee','red-tee','coral-tee','loose-tee','loose-long-sleeve','red-triangle','red-shorts',
    'pink-shorts','orange-shorts','black-shorts','wide-shorts','skirt','milk-frog',
    'red-thong','wide-pants',
    'navy-jumpsuit','loose-wide-pants','brown-boots']
    .includes(name)?name:`decoration-${name}`;
  fs.writeFileSync(path.join(root, `svg/${filename}.svg`), content);
}
