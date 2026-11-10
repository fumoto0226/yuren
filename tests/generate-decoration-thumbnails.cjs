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
context.rightArmSource = [...original.matchAll(/<path d="([^"]+)"/g)][4][1];
context.leftArmSource = [...original.matchAll(/<path d="([^"]+)"/g)][3][1];
const art = vm.runInContext(`(() => {
  const warp = buildWarp({body:100,width:100,arms:100,legs:100,head:100});
  dragPoses.length = 0;
  const arms = ['left','right'].map(side => armGeometry(side,warp));
  const legs = ['left','right'].map(side => legGeometry(side,warp));
  const hand = splitArmPath(leftArmSource,wristSources.left.outer,
    wristSources.left.inner);
  return {
    space:{waist:spaceWaistMarkup(warp),waistTop:garmentPath(transformPath(pantsWaistSource,spacePantsFit),warp),legs:['left','right'].map(side=>legGeometry(side,warp,true)),pants:spacePantsGeometry(warp).fill,crotch:spacePantsGeometry(warp).edges,body:spaceOuterMarkup(warp),sleeves:arms.map((a,i)=>spaceSleeveMarkup(a,'space-thumb-'+i,workerGarmentPath(spaceBodySource,warp))),helmet:spaceHelmetSpecs.map(s=>({...s,source:transformPath(s.source,(x,y)=>warp(x,y,s.role))})),details:spaceShirtDetails(warp),hands:arms.map((a,i)=>{const side=i?'right':'left',w=wristSources[side],h=splitArmPath(side==='left'?leftArmSource:rightArmSource,w.outer,w.inner);return {fill:transformPath(h.handFill,a.handPoint),outline:transformPath(h.handOutline,a.handPoint)};})},
    beach:{top:shellTopMarkup(warp),pants:seaweedPantsMarkup(warp)},
    streaker:{mosaic:mosaicTopMarkup(warp,'all'),top:mosaicTopMarkup(warp),pants:mosaicTopMarkup(warp,'pants'),face:lipstickFaceSpecs.map(s=>({...s,source:transformPath(s.source,(x,y)=>warp(x,y,s.role))})),ribbon:pinkRibbonSpecs.map(s=>({...s,source:transformPath(s.source,(x,y)=>warp(x,y,s.role))}))},
    angel:{wingVariants:angelWingVariants,top:angelVestMarkup(warp),halo:angelHaloSpecs.map(s=>({...s,source:transformPath(s.source,(x,y)=>warp(x,y,s.role))}))},
    largePartyHat:largePartyHatSpecs.map(s=>({...s,source:transformPath(s.source,(x,y)=>warp(x,y,s.role))})),
    oxygenHelmet:{fill:HELMET_GLASS,opacity:HELMET_GLASS_OPACITY},
    godRing:{back:swimRingMarkup(warp,'pink-striped-swim-ring',false,'god-ring'),front:swimRingMarkup(warp,'pink-striped-swim-ring',true,'god-ring')},
    swim:{caps:capVariants,goggles:divingGoggleVariants,rings:swimRingVariants,cap:capSpecs.map(s=>({...s,source:transformPath(s.source,(x,y)=>warp(x,y,s.role))})),goggle:divingGoggleSpecs.map(s=>({...s,source:transformPath(s.source,(x,y)=>warp(x,y,s.role))})),ring:Object.fromEntries(Object.keys(swimRingVariants).map(id=>[id,swimRingMarkup(warp,id,false,'thumb-'+id)+swimRingMarkup(warp,id,true,'thumb-'+id)]))},
    reference595:{bandVariants:eyeBandVariants,band:eyeBandSpecs.map(s=>({...s,source:transformPath(s.source,(x,y)=>warp(x,y,s.role))})),gourd:gourdParts.map(s=>({...s,source:backAccessoryPath(s,warp)})),slippers:legs.map((s,i)=>'<path d="'+s.bootFill+'" fill="#C5C5C5"/><path d="'+s.bootOutline+'" fill="none" stroke="black" stroke-width="1"/>'+slipperMarkup(s,i?'right':'left')).join('')},
    reference594:{scar:garmentPath(scarSource,warp),earrings:teardropPath(warp),swords:pairedSwordParts.map(spec=>({...spec,source:backAccessoryPath(spec,warp)})),waist:spaceWaistMarkup(warp)},
    monk:{hat:lotusHatSpecs.map(s=>({...s,source:transformPath(s.source,(x,y)=>warp(x,y,s.role))})),details:monkRobeMarkup(warp)},
    walker:{face:walkerSpecs.face.map(s=>({...s,source:transformPath(s.source,(x,y)=>warp(x,y,s.role))})),circlet:walkerSpecs.circlet.map(s=>({...s,source:transformPath(s.source,(x,y)=>warp(x,y,s.role))})),scarf:walkerSpecs.scarf.map(s=>({...s,source:transformPath(s.source,(x,y)=>warp(x,y,s.role))})),body:looseTopPath(walkerBodySource,warp),details:walkerShirtMarkup(warp)},
    chef:{hat:chefHatSpecs.map(s=>({...s,source:transformPath(s.source,(x,y)=>warp(x,y,s.role))})),body:studentOuterMarkup(warp,false,true),sleeves:arms.map((a,i)=>alohaSleeveMarkup(a,'chef-thumb-'+i,alohaSleeveStyles['white-chef-jacket']))},
    gyaruOutfit:{hair:gyaruOutfitSpecs.hair.map(s=>({...s,source:transformPath(s.source,(x,y)=>warp(x,y,s.role))})),top:gyaruOutfitMarkup('top',warp),boxers:gyaruOutfitMarkup('boxers',warp)},
    gyaru:gyaruFaceSpecs.map(s=>({...s,source:transformPath(s.source,(x,y)=>warp(x,y,s.role))})),
    sponge:{head:spongeHeadSpecs.map(s=>({...s,source:transformPath(s.source,(x,y)=>warp(x,y,s.role))})),body:garmentPath(spongeBodySource,warp),arms:arms.map(spongeArmPath),legs:legs.flatMap((shape,i)=>spongeLegSpots[i?'right':'left'].map(args=>spongeLegPath(shape,...args)))},
    coloredSkinVariants,rainbowSkinDefs:rainbowSkinDefs(),
    muscleVariants:muscleSkinVariants,
    muscleLines:garmentPath(muscleLinesSource,warp),
    narutoItems:{longVariants:longBraidVariants,topknotVariants, hairVariants:spikyHairVariants,hair:yellowSpikyHairSpecs.map(s=>({...s,source:transformPath(s.source,(x,y)=>warp(x,y,s.role))})),sandals:legs.map((l,i)=>{const {toe,up}=l.instepAxes,o=l.instep,p=(x,y)=>(o.x+toe.x*x+up.x*y)+' '+(o.y+toe.y*x+up.y*y),boundary='M'+p(1.5,-12)+'C'+p(2.2,-4)+' '+p(2.2,4)+' '+p(1.5,12),id='sandals-cut-'+i;return '<defs><mask id="'+id+'" maskUnits="userSpaceOnUse" x="-100" y="100" width="300" height="200"><rect x="-100" y="100" width="300" height="200" fill="white"/><path d="'+boundary+'L'+p(100,12)+'L'+p(100,-12)+'Z" fill="black"/></mask><clipPath id="'+id+'-shoe"><path d="'+l.bootFill+'"/></clipPath></defs><g mask="url(#'+id+')"><path d="'+l.bootFill+'" fill="#29496C"/><path d="'+l.bootOutline+'" fill="none" stroke="black" stroke-width="1"/></g><path d="'+boundary+'" fill="none" stroke="black" stroke-width="1" clip-path="url(#'+id+'-shoe)"/>';})},
    topknot:{hat:topknotHairSpecs.map(s=>({...s,source:transformPath(s.source,(x,y)=>warp(x,y,s.role))})),body:blazerMarkup(warp),sleeves:arms.map((a,i)=>alohaSleeveMarkup(a,'blazer-thumb-'+i,alohaSleeveStyles['charcoal-blazer'])),shoes:legs.map((l,i)=>'<path d="'+l.bootFill+'" fill="#2F465D"/>'+colorblockShoeDetails(l,i?'right':'left')+'<path d="'+l.bootOutline+'" fill="none" stroke="black" stroke-width="1"/>')},
    collared:collaredShirtMarkup(warp),collaredBody:garmentPath(collaredBodySource,warp),collaredNeck:workerGarmentPath(collaredNeckSource,warp),
    hypnoticEye:[{source:hypnoticEyeSource,fill:'#EB8E15',stroke:'black'},...hypnoticEyeSpecs],
    longHair:longHairSpecs.map(s=>({...s,source:transformPath(s.source,(x,y)=>warp(x,y,s.role))})),
    secondary:{body:studentOuterMarkup(warp,true),hat:secondaryHatSpecs.map(s=>({...s,source:transformPath(s.source,(x,y)=>warp(x,y,s.role))})),sleeves:arms.map((a,i)=>alohaSleeveMarkup(a,'secondary-thumb-'+i,alohaSleeveStyles['secondary-jacket']))},
    student:{body:studentOuterMarkup(warp),hat:studentHatSpecs.map(s=>({...s,source:transformPath(s.source,(x,y)=>warp(x,y,s.role))})),sleeves:arms.map((a,i)=>alohaSleeveMarkup(a,'student-thumb-'+i,alohaSleeveStyles['student-jacket'])),sockClips:legs.map(l=>({top:limbClipPoints(l,24,true),bottom:ankleHemClipPoints(l)}))},
    worker:{extraBoots:Object.fromEntries(['black-worker-boots','blue-worker-boots','brown-worker-boots'].map(id=>[id,legs.map((l,i)=>workerBootMarkup(l,i?'right':'left',100,5.5,id)).join('')])),blueBody:workerOuterMarkup(warp,'blue-worker-jacket'),blueSleeves:arms.map((a,i)=>workerSleeveMarkup(a,'blue-worker-thumb-'+i,alohaSleeveStyles['blue-worker-jacket'])),blueBoots:legs.map((l,i)=>workerBootMarkup(l,i?'right':'left',100,5.5,'gray-worker-boots')),hat:workerHatSpecs.map(s=>({...s,source:transformPath(s.source,(x,y)=>warp(x,y,s.role))})),body:workerOuterMarkup(warp),sleeves:arms.map((a,i)=>workerSleeveMarkup(a,'worker-thumb-'+i,alohaSleeveStyles['worker-jacket'])),boots:legs.map((l,i)=>workerBootMarkup(l,i?'right':'left',100,5.5))},
    yellowHat: Object.values(yellowHatSources).map(source=>
      transformPath(source,(x,y)=>warp(x,y,'head'))),
    ivory:Object.fromEntries(Object.entries(ivorySpecs).map(([key,spec])=>[key,{...spec,d:spec.category==='cape'?backAccessoryPath(spec,warp):torsoGarmentPath(spec.source,warp,spec.category==='neck'||!!spec.neckline)}])),
    ivoryBody:torsoGarmentPath(ivoryBodySource,warp),ivorySides:torsoGarmentPath(ivorySidesSource,warp),
    batGloves:arms.map(shape=>batGlovePaths(shape)),
    batCowl:transformPath(batCowlSource,(x,y)=>warp(x,y,'head')),
    jobsPelvisEnd:jobsMaterialReference().end,
    jobsPelvisStops:Array.from({length:33},(_,i)=>({offset:i/32,color:jobsDenimColor(i/32)})),
    jobsMesh:legs.map((shape,i)=>jobsClothMesh(shape,i?'right':'left',100,warp)),
    jobsCloth:legs.map(shape=>Array.from({length:32},(_,i)=>jobsClothGradient(shape,i))),
    jobsGlasses:jobsGlassesSpecs.map(spec=>({...spec,d:transformPath(spec.source,(x,y)=>warp(x,y,'headRigid'))})),
    jobsCollarEdge:torsoGarmentPath(jobsCollarEdgeSource,warp,true),
    jobsCollar:torsoGarmentPath(jobsCollarSource,warp,true),
    jobsShoes:legs.map((shape,i)=>({paths:jobsSneakerPaths(shape,i?'right':'left'),details:jobsSneakerDetails(shape,i?'right':'left')})),
    cigaretteSpecs,
    crownStrokeWidth,
    crown: Object.values(crownSources).map(source=>
      transformPath(source,(x,y)=>warp(x,y,'head'))),
    scarf: scarfSources.map(source => transformPath(source,(x,y) => warp(x,y,'head'))),
    scoopTee:{fill:looseTopPath(scoopTeeSource,warp),sides:looseTopPath(scoopTeeSidesSource,warp),neck:garmentPath(scoopTeeNeckSource,warp),hem:looseTopPath(scoopTeeHemSource,warp)},
    roundLongSleeveStyle,roundLongSleeveWidths:Array.from({length:32},(_,i)=>teeSleeveWidth(i,roundLongSleeveStyle)),
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
    suit:{front:garmentPath(suitFrontSource,warp),
      edges:garmentPath(suitFrontEdgesSource,warp),hem:garmentPath(suitHemSource,warp),
      collar:Object.values(suitCollarSources).map(source=>garmentPath(source,warp)),
      tie:Object.values(tieSources).map(source=>garmentPath(source,warp)),
      },
    alohaOpen:arms.map((shape,i)=>alohaSleeveMarkup(shape,'thumb-open-'+i)).join('')+alohaBodyMarkup(warp,true),
    alohaOpenLong:arms.map((shape,i)=>alohaSleeveMarkup(shape,'thumb-open-long-'+i,alohaSleeveStyles['aloha-open-long-jacket'])).join('')+alohaBodyMarkup(warp,true),
    alohaLong:arms.map((shape,i)=>alohaSleeveMarkup(shape,'thumb-aloha-long-'+i,alohaSleeveStyles['aloha-long-jacket'])).join('')+alohaBodyMarkup(warp),
    aloha:arms.map((shape,i)=>alohaSleeveMarkup(shape,'thumb-aloha-'+i)).join('')+alohaBodyMarkup(warp),
    greenVest: Object.values(greenVestSources).map(source=>garmentPath(source,warp)),
    redTriangle: redTrianglePath(warp),
    jeansStrokeWidth:JEANS_STROKE_WIDTH,
    denimVariants,
    jeansDetailsById:Object.fromEntries(Object.keys(denimVariants).map(id=>[id,jeansDetailsMarkup(warp,id)])),
    jeansTextures:Object.fromEntries(Object.keys(denimVariants).map(id=>[id,legs.map((shape,i)=>[0,1].map(part=>jeansTextureMarkup(shape,part,i?'right':'left',id)).join(''))])),
    workwearVariants,thongVariants,boxerVariants,briefVariants,
    workwearBibs:Object.fromEntries(Object.keys(workwearVariants).map(id=>[id,denimBibMarkup(warp,id)])),
    largeHoles:legs.map((shape,i)=>[0,1].flatMap(part=>largeJeansHoles(shape,part,i?'right':'left'))),
    jeansDetails:jeansDetailsMarkup(warp),
    jeansSeams:legs.map((shape,i)=>[jeansLegSeam(shape,0,100,i?'right':'left'),jeansLegSeam(shape,1,100,i?'right':'left')].join('')),
    briefs:garmentPath(briefsSource,warp),
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
const jobsWidths=vm.runInContext('Array.from({length:32},(_,i)=>wideLegExtraWidth(i,3.5))',context);
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
    return `<path d="${d}" fill="none" stroke="${typeof color==='function'?color(index):color}" stroke-width="${width+flare+(extraWidths[index]||0)}" stroke-linecap="round" stroke-linejoin="round"/>`;
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
  `<path d="${id==='black-turtleneck-tee'?art.redTee.fill:art.tee.fill}" fill="${color}"/>`,
  line(art.tee.sides),line(art.tee.top),
  id==='black-turtleneck-tee'?'':line(art.tee.neck),line(art.tee.hem),
].join('\n'));
const looseTopThumbnail=id=>{
  const style=vm.runInContext(`teeStyles['${id}']`,context);
  const widths=vm.runInContext(`Array.from({length:32},(_,i)=>teeSleeveWidth(i,teeStyles['${id}']))`,context);
  if(style.cinched){
    const sleeves=art.tee.arms.map((arm,index)=>{
      context.cinchedArm=arm;
      const fill=vm.runInContext('cinchedSleeveEdges(cinchedArm,true)',context);
      const edges=vm.runInContext('cinchedSleeveEdges(cinchedArm)',context);
      const cuff=vm.runInContext("cinchedSleeveEdges(cinchedArm,'cuff')",context);
      return tube({...arm,hose:arm.hose.slice(0,6)},style.color,0,widths)
        +`<path d="${fill}" fill="${style.color}"/>`+line(edges)+line(cuff);
    }).join('');
    return svg('-6 53 112 64',sleeves+`<path d="${art.looseTop.fill}" fill="${style.color}"/>`
      +line(art.looseTop.sides)+line(art.tee.top)+line(art.tee.neck)+line(art.looseTop.hem));
  }
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
  const parts=id==='jobs-gradient-jeans'?art.jobsMesh[index]:vm.runInContext(`legFabricPaths(thumbLeg,thumbSide,100)`,
    Object.assign(context,{thumbLeg:leg,thumbSide:index?'right':'left'}));
  return parts.map((paths,part)=>{
    const maskId=`${id}-fabric-${index}-${part}`;
    const strokes=leg.hose.map(({d,width},i)=>i>=(part?19:0)&&i<(part?32:19)
      ?`<path d="${d}" fill="none" stroke="white" stroke-width="${width+widths[i]}" stroke-linecap="${i===31?'butt':'round'}"/>`:'').join('');
    const gradients=id==='jobs-gradient-jeans'?paths.filter(p=>p.g).map(p=>`<linearGradient id="${p.color.slice(5,-1)}" gradientUnits="userSpaceOnUse" x1="${p.g.x1}" y1="${p.g.y1}" x2="${p.g.x2}" y2="${p.g.y2}">${art.jobsPelvisStops.map(s=>`<stop offset="${s.offset}" stop-color="${s.color}"/>`).join('')}</linearGradient>`).join(''):'';
    return `<defs>${gradients}<mask id="${maskId}" maskUnits="userSpaceOnUse" x="-1000" y="-1000" width="2000" height="2000">${strokes}</mask></defs>`
      +`<g clip-path="url(#${id}-leg-${index})"><g mask="url(#${maskId})">`
      +paths.map(({color,d})=>`<path fill="${color}" d="${d}"/>`).join('')+'</g></g>';
  }).join('');
};
const fabricContent=vm.runInContext('loosePantsFabricContent',context);
const spaceTrouserCuff=(leg,i,widths)=>{
 const id='space-trouser-cuff-'+i;
 const points=vm.runInContext('limbClipPoints(thumbLeg,28,true)',Object.assign(context,{thumbLeg:leg}));
 const band=clippedTube(leg,legEndCuff(leg,widths),'#10C9E9',id+'-tube',0,true,widths);
 return `<defs><clipPath id="${id}"><polygon points="${points}"/></clipPath></defs><g clip-path="url(#${id})">${band}</g>`
  +line(vm.runInContext('cuffPath(thumbLeg,28,wideLegExtraWidth(28,9.25))',Object.assign(context,{thumbLeg:leg})))
  +line(vm.runInContext('wideLegHemPath(thumbLeg,9.25)',context));
};
const widePantsThumbnail=(id,flare,widths,viewBox)=>{
  const patterned=id==='loose-wide-pants';
  const denim=art.denimVariants[id];
  const largeHole=denim?.finish==='large-ripped-denim-jeans';
  const workwear=art.workwearVariants[id];
  const isDenim=!!denim||!!workwear;
  const paint=id==='white-loose-wide-trousers'?'#FAFAF7':id==='space-trousers'?'#FF8215':id==='worker-trousers'?'#f66b19':id==='jobs-gradient-jeans'?'url(#jobs-pelvis-gradient)':denim?.color||(workwear?workwear.color:patterned?'url(#loose-pants-fabric)':id==='suit-trousers'?art.colors.suitNavy:['royal-trousers','ivory-trousers'].includes(id)?art.colors.royalWhite:art.colors.widePants);
  return svg(viewBox,[

  id==='jobs-gradient-jeans'?`<defs><linearGradient id="jobs-pelvis-gradient" gradientUnits="userSpaceOnUse" x1="47" y1="110.5" x2="47" y2="${art.jobsPelvisEnd}">${art.jobsPelvisStops.map(s=>`<stop offset="${s.offset}" stop-color="${s.color}"/>`).join('')}</linearGradient></defs>`:'',
  patterned?`<defs><pattern id="loose-pants-fabric" patternUnits="userSpaceOnUse" width="24" height="32" patternTransform="translate(46.8 110.5)">${fabricContent}</pattern></defs>`:'',
  ...(id==='space-trousers'?art.space.legs:art.pants.legs).map((leg,index)=>(id==='jobs-gradient-jeans'?'<defs>'+art.jobsCloth[index].map((g,i)=>`<linearGradient id="thumb-cloth-${index}-${i}" gradientUnits="userSpaceOnUse" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}">${g.stops.map(s=>`<stop offset="${s.offset}" stop-color="${s.color}"/>`).join('')}</linearGradient>`).join('')+'</defs>':'')+(largeHole?`<defs><mask id="large-hole-${index}" maskUnits="userSpaceOnUse" x="-1000" y="-1000" width="2000" height="2000"><rect x="-1000" y="-1000" width="2000" height="2000" fill="white"/>${art.largeHoles[index].map(d=>`<path d="${d}" fill="black"/>`).join('')}</mask></defs>${art.largeHoles[index].map(d=>`<path d="${d}" fill="#C5C5C5"/>`).join('')}<g mask="url(#large-hole-${index})">`:'')+clippedTube(leg,
    legEndCuff(leg,widths),id==='jobs-gradient-jeans'?i=>`url(#thumb-cloth-${index}-${i})`:patterned?'#607e79':paint,
    `${id}-leg-${index}`,0,true,widths)+(largeHole?'</g>':'')
    +(patterned||id==='jobs-gradient-jeans'?fabricLegThumbnail(leg,index,id,widths):'')
    +(art.jeansTextures[id]?.[index]||'')
    +(isDenim&&id!=='jobs-gradient-jeans'?`<path d="${art.jeansSeams[index]}" fill="none" stroke="black" stroke-width="${art.jeansStrokeWidth}" stroke-dasharray="3 2"/>`:'')
    +line(vm.runInContext(`wideLegHemPath(thumbLeg,${flare})`,
      Object.assign(context,{thumbLeg:leg})))),
  id==='space-trousers'?art.space.legs.map((leg,i)=>spaceTrouserCuff(leg,i,widths)).join(''):'',
  `<path d="${art.pants.fill}" fill="${paint}"/>`,
  line(art.pants.sides),line(art.pants.crotch),workwear?'':line(art.pants.waist),denim?art.jeansDetailsById[id]:'',
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
// Pochita: the same reference paths in his orange, with his bigger eye and
// the chainsaw standing behind the head.
const pochitaColors=vm.runInContext('pochitaColors',context);
const pochitaEye=vm.runInContext('pochitaEyeWhite',context);
const pochitaPupil=vm.runInContext('pochitaPupil',context);
const chainsaw=vm.runInContext('chainsawSources',context);
const chainsawContent=Object.entries(chainsaw).map(([part,d])=>
  `<path d="${d}" fill="${pochitaColors[part]}" stroke="black" `
  +`stroke-width="${part==='teeth'?.8:1}" stroke-linejoin="round" `
  +`stroke-linecap="round"/>`).join('');
const pochitaLip=vm.runInContext('POCHITA_LIP',context);
const pochitaBody=frogPaths.map((tag,index)=>{
  if(index===0||index>=12)return '';
  // ...and his upper lip curves, the same swap the app makes.
  let node=tag.replace(pochitaLip.from,pochitaLip.to)
    .replace(/fill="#C5C5C5"/g,`fill="${pochitaColors.skin}"`);
  if(!/\bfill=/.test(node))node=node.replace('<path ','<path fill="none" ');
  if(index===8)node=`<path d="${pochitaEye}" fill="white" stroke="black" `
    +`stroke-linecap="round" stroke-linejoin="round"/>`;
  return node;
}).join('')
  +`<ellipse cx="55.355" cy="${34.4914+pochitaPupil.dy}" rx="${pochitaPupil.rx}" `
  +`ry="${pochitaPupil.ry}" fill="black"/>`;
// The chainsaw takes the horn's place, so the suit's icon leaves it out.
const pochitaIcon=chainsawContent+frogPaths.map((tag,index)=>{
  if(index===0||index>=12||index===1||index===11)return '';
  let node=tag.replace(pochitaLip.from,pochitaLip.to)
    .replace(/fill="#C5C5C5"/g,`fill="${pochitaColors.skin}"`);
  if(!/\bfill=/.test(node))node=node.replace('<path ','<path fill="none" ');
  if(index===8)node=`<path d="${pochitaEye}" fill="white" stroke="black" `
    +`stroke-linecap="round" stroke-linejoin="round"/>`;
  return node;
}).join('')
  +`<ellipse cx="55.355" cy="${34.4914+pochitaPupil.dy}" rx="${pochitaPupil.rx}" `
  +`ry="${pochitaPupil.ry}" fill="black"/>`;
// The shark hood is the head repainted plus a row of teeth behind it, the
// same as the app draws it.
const sharkNavy=vm.runInContext('decorationColors.sharkHood',context);
const sharkFlesh=vm.runInContext('decorationColors.fleshSkin',context);
const sharkTeeth=vm.runInContext('sharkToothSources',context)
  .map(d=>`<path d="${d}" fill="white" stroke="black" stroke-width="1" `
    +`stroke-linejoin="round"/>`).join('');
const headOutlineTag=frogPaths[5];
const headShape=headOutlineTag.match(/ d="([^"]*)"/)[1]+'Z';
const sharkHeadContent=sharkTeeth
  +`<path d="${headShape}" fill="${sharkNavy}"/>`
  +frogPaths[1].replace(/fill="#C5C5C5"/,`fill="${sharkNavy}"`)
  +headOutlineTag.replace('<path ','<path fill="none" ')
  +frogPaths[11].replace('<path ','<path fill="none" ')
  +`<path d="${vm.runInContext('sharkEyeWhite',context)}" fill="white" `
  +`stroke="black" stroke-linecap="round" stroke-linejoin="round"/>`
  +(original.match(/<ellipse\b[^>]*\/>/)?.[0]||'');
const skinBody=(color,hideHorn=false,hideChestLines=false,hideLowerChin=false,hornColor=null)=>frogPaths.map((tag,index)=>{
  if(hideLowerChin&&index===10)return '';
  if(index===0||index>=12||hideHorn&&(index===1||index===11)||hideChestLines&&(index===9||index===10))return '';
  let node=tag.replace(/fill="#C5C5C5"/g,`fill="${index===1&&hornColor?hornColor:color}"`);
  if(!/\bfill=/.test(node))node=node.replace('<path ','<path fill="none" ');
  return node;
}).join('')+(original.match(/<ellipse\b[^>]*\/>/)?.[0]||'');
const blackShortsContent=[
  ...art.pants.legs.map((leg,index)=>clippedTube(leg,
    limbCuff(leg,19),art.colors.blackShorts,`shark-leg-${index}`)
    +line(vm.runInContext('cuffPath(thumbLeg,19,0,.5)',
      Object.assign(context,{thumbLeg:leg})))),
  `<path d="${art.pants.fill}" fill="${art.colors.blackShorts}"/>`,
  line(art.pants.sides),line(art.pants.crotch),line(art.pants.waist),
].join('\n');
// The clown: the white fish with its two red marks, and the party hat,
// which is the horn in yellow with spots and a bobble.
const clownRed=vm.runInContext('decorationColors.clownRed',context);
const clownWhite=vm.runInContext('decorationColors.clownWhite',context);
const partyYellow=vm.runInContext('decorationColors.partyHat',context);
const circlesOf=(list,fallback)=>list.map(({source,fill,outline})=>
  `<path d="${source}" fill="${fill||fallback}"`
  +(outline?' stroke="black" stroke-width="1" stroke-linejoin="round"':'')
  +'/>').join('');
const clownMarks=circlesOf(vm.runInContext('clownMarkSources',context),clownRed);
const partyTrim=circlesOf(vm.runInContext('partyHatTrim',context));
const partyHatContent=frogPaths[1].replace(/fill="#C5C5C5"/,`fill="${partyYellow}"`)
  +frogPaths[11].replace('<path ','<path fill="none" ')+partyTrim;
const clownBody=skinBody(clownWhite)+clownMarks;
// The alien: green, a black eye with a white pupil, and an antenna where
// the horn would be.
const alienGreen=vm.runInContext('decorationColors.alienGreen',context);
// Drawn first so the head's own fill covers the antenna's root, as in the app.
const alienAntennaTag=`<path d="${vm.runInContext('alienAntennaSource',context)}" `
  +`fill="${alienGreen}" stroke="black" stroke-width="1" stroke-linejoin="round"/>`;
const alienBody=alienAntennaTag+frogPaths.map((tag,index)=>{
  // No horn: paths 1 and 11 are its fill and outline.
  if(index===0||index>=12||index===1||index===11)return '';
  let node=tag.replace(/fill="#C5C5C5"/g,`fill="${alienGreen}"`);
  if(!/\bfill=/.test(node))node=node.replace('<path ','<path fill="none" ');
  if(index===8)node=node.replace('fill="white"','fill="black"');
  return node;
}).join('')
  +(original.match(/<ellipse\b[^>]*\/>/)?.[0]||'').replace('fill="black"','fill="white"');
const tieContent=art.suit.tie.map(d=>`<path d="${d}" fill="${art.colors.tieRed}" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" paint-order="stroke fill"/>`).join('');
const suitJacketContent = [
  ...art.shirt.arms.map((arm,index)=>clippedTube(arm,limbCuff(arm,31),
    art.colors.suitNavy,`suit-sleeve-${index}`)+line(vm.runInContext(
      'cuffPath(thumbArm,31)',Object.assign(context,{thumbArm:arm})))),
  `<path d="${art.shirt.fill}" fill="${art.colors.suitNavy}"/>`,
  `<path d="${art.suit.front}" fill="white"/>`,
  ...art.suit.collar.map(d=>`<path d="${d}" fill="white"/>`),
  line(art.suit.edges),line(art.shirt.sides),line(art.shirt.top),line(art.suit.hem),tieContent,
].join('');

const suitWidths=vm.runInContext('Array.from({length:32},(_,i)=>wideLegExtraWidth(i,3.5))',context);
const suitPantsIcon=widePantsThumbnail('suit-trousers',3.5,suitWidths,'8 108 86 80');
const suitPantsContent=suitPantsIcon.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
const dressShoesContent=art.pants.legs.map(leg=>
  `<path d="${leg.bootFill}" fill="${art.colors.dressShoes}"/>`+line(leg.bootOutline)+seam(leg)).join('');
const royalWidths=vm.runInContext('Array.from({length:32},(_,i)=>wideLegExtraWidth(i,3))',context);
const royalPantsIcon=widePantsThumbnail('royal-trousers',3,royalWidths,'8 108 86 80');
const royalCrownContent=art.crown.map(d=>`<path d="${d}" fill="${art.colors.crown}" stroke="black" stroke-width="${art.crownStrokeWidth}" stroke-linejoin="round"/>`).join('');
const originalPaths=[...original.matchAll(/<path d="([^"]+)"[^>]*>/g)];
const royalHeadContent=`<path d="${originalPaths[5][1]}Z" fill="${sharkFlesh}" stroke="black" stroke-linejoin="round"/>`
  +originalPaths[8][0]+(original.match(/<ellipse\b[^>]*\/>/)?.[0]||'');
const capePalettes=vm.runInContext('capeStyles',context);
const backDetails=id=>{
 const palette=capePalettes[id];
 if(!palette)throw new Error('Unknown back accessory: '+id);
 return Object.entries(art.ivory).filter(([key,s])=>s.category==='cape'&&Object.hasOwn(palette,key))
  .map(([key,s])=>`<path data-back-part="${key}" d="${s.d}" fill="${palette[key]}"${s.outline?` stroke="${(art.angel.wingVariants[id]?.stroke||s.stroke||'black')}" stroke-width="${s.strokeWidth||1}" stroke-linejoin="round"`:''}/>`).join('');
};
const ivoryDetails=cat=>Object.values(art.ivory).filter(s=>s.category===cat&&s.id!=='batfish-armor').map(s=>`<path d="${s.d}" fill="${s.fill}"${s.outline?` stroke="${s.stroke||'black'}" stroke-width="${s.strokeWidth||1}" stroke-linejoin="round"`:''}/>`).join('');
const ivoryWidths=vm.runInContext('Array.from({length:32},(_,i)=>ivorySleeveWidth(i))',context);
const ivoryTop=art.shirt.arms.map((arm,i)=>clippedTube({...arm,hose:arm.hose.slice(0,6)},limbCuff(arm,6),art.colors.royalWhite,`ivory-upper-${i}`,0,true,ivoryWidths)
 +clippedTube(arm,limbCuff(arm,28),art.colors.crown,`ivory-cuff-${i}`,0,false)
 +`<path d="${vm.runInContext('ivorySleeveEdges(thumbArm,true)',Object.assign(context,{thumbArm:arm}))}" fill="${art.colors.royalWhite}"/>`
 +line(vm.runInContext('ivorySleeveEdges(thumbArm)+cuffPath(thumbArm,28,ivorySleeveWidth(28))+cuffPath(thumbArm,31)',Object.assign(context,{thumbArm:arm})))).join('')
 +`<path d="${art.ivoryBody}" fill="${art.colors.royalWhite}"/>`+line(art.ivorySides)+line(art.shirt.top)+line(art.shirt.hem)+ivoryDetails('shirt');
const ivoryPants=widePantsThumbnail('ivory-trousers',8,vm.runInContext('Array.from({length:32},(_,i)=>wideLegExtraWidth(i,8))',context),'2 108 98 80');
// The kings wear the tall boots in their near-black brown.
const kingBootFeet=art.pants.legs.map(leg=>
  `<path d="${leg.bootFill}" fill="${art.colors.darkBoots}"/>`+line(leg.bootOutline)).join('');
const batDetails=Object.values(art.ivory).filter(s=>s.id==='batfish-armor').map(s=>`<path d="${s.d}" fill="${s.fill}"${s.outline?` stroke="${s.stroke||'black'}" stroke-width="${s.strokeWidth||1}" stroke-linejoin="round"`:''}/>`).join('');
const batTop=art.shirt.arms.map((arm,i)=>clippedTube(arm,limbCuff(arm,31),art.colors.batArmor,`bat-arm-${i}`)+line(vm.runInContext('cuffPath(thumbArm,31)',Object.assign(context,{thumbArm:arm})))).join('')
 +`<path d="${art.shirt.fill}" fill="${art.colors.batArmor}"/>`+line(art.shirt.sides)+line(art.shirt.top)+line(art.shirt.hem)+batDetails;
const batPants=art.pants.legs.map((leg,i)=>clippedTube(leg,[leg.bootOuter,leg.bootInner],art.colors.batArmor,`bat-pants-${i}`)+seam(leg)).join('')
 +`<path d="${art.pants.fill}" fill="${art.colors.batArmor}"/>`+line(art.pants.sides)+line(art.pants.crotch)+line(art.pants.waist);
const batBoots=art.pants.legs.map((leg,i)=>clippedTube(leg,limbCuff(leg,19),art.colors.batBlack,`bat-boot-${i}`,0,false)+`<path d="${leg.bootFill}" fill="${art.colors.batBlack}"/>`+line(leg.bootOutline)+line(vm.runInContext('cuffPath(thumbLeg,19)',Object.assign(context,{thumbLeg:leg})))).join('');
const batHands=art.shirt.arms.map((arm,i)=>{
 const hand=vm.runInContext(`(()=>{const side=thumbSide;const wrist=wristSources[side];const src=splitArmPath(side==='left'?leftArmSource:rightArmSource,wrist.outer,wrist.inner);return {fill:transformPath(src.handFill,thumbArm.handPoint),outline:transformPath(src.handOutline,thumbArm.handPoint)}})()`,Object.assign(context,{thumbArm:arm,thumbSide:i===0?'left':'right'}));
 return `<path d="${art.batGloves[i].fill}" fill="${art.colors.batBlack}"/>`+line(art.batGloves[i].outline)+`<path d="${hand.fill}" fill="${art.colors.batBlack}"/>`+line(hand.outline);
}).join('');
const batCowl=`<path d="${art.batCowl}" fill="${art.colors.batBlack}" stroke="black" stroke-width="1" stroke-linejoin="round"/>`;
const batCape=backDetails('charcoal-cape');
const stripSvg=source=>source.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
const jobsGlasses=art.jobsGlasses.map(({d,fill,opacity,strokeWidth})=>`<path d="${d}" fill="${fill}" ${opacity?`fill-opacity="${opacity}"`:''} stroke="#684516" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
const jobsTop=stripSvg(teeThumbnail('#101010',23,2.5,'black-turtleneck-tee'))+`<path d="${art.jobsCollar}" fill="#101010"/>`+line(art.jobsCollarEdge);
const jobsShoes=art.jobsShoes.map(({paths,details})=>`<path d="${paths.fill}" fill="#bfbfbf"/><path d="${paths.outline}" fill="none" stroke="black" stroke-width="1"/>`+details).join('');
const jobsPants=stripSvg(widePantsThumbnail('jobs-gradient-jeans',3.5,jobsWidths,'8 108 86 80'));
const kappaArt=vm.runInContext('({hair:kappaHairSpecs,skin:kappaSkinSpecs,eye:kappaEyeWhite,mouthCount:kappaMouthSpecs.length})',context);
const kappaTag=s=>`<path d="${s.source}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth||1}" stroke-linecap="round" stroke-linejoin="round"/>`;
const kappaBase=hideTriangle=>frogPaths.map((tag,index)=>{
 if(index===0||index===5||index>=12||hideTriangle&&(index===1||index===11))return '';
 let node=tag.replace(/fill="#C5C5C5"/g,'fill="#89CD71"');
 if(!/\bfill=/.test(node))node=node.replace('<path ','<path fill="none" ');
 if(index===8)node=node.replace(/d="[^"]+"/,`d="${kappaArt.eye}"`);
 return node;
}).join('')+`<ellipse cx="53.1431" cy="38.40106" rx="1.31738" ry="1.18774" transform="rotate(-14.9815 53.1431 38.40106)" fill="black"/>`+'<defs><clipPath id="kappa-mouth-thumb"><path d="'+originalPaths[5][1]+'Z"/></clipPath></defs>'+kappaArt.skin.map((spec,i)=>i>=kappaArt.skin.length-kappaArt.mouthCount?'<g clip-path="url(#kappa-mouth-thumb)">'+kappaTag(spec)+'</g>':kappaTag(spec)).join('')+`<path d="${originalPaths[5][1]}" fill="none" stroke="black" stroke-linecap="round" stroke-linejoin="round"/>`;
const kappaBody=kappaBase(false);
const kappaShell=backDetails('kappa-shell');
const kappaHair=kappaArt.hair.map(kappaTag).join('');
const workerHat=art.worker.hat.map(kappaTag).join('');
const workerTop=art.worker.sleeves.join('')+art.worker.body;
const workerPants=stripSvg(widePantsThumbnail('worker-trousers',5.5,wideWidths,'8 108 86 80'));
const workerBoots=art.worker.boots.join('');
const workerTuckedPants=art.pants.legs.map((leg,i)=>clippedTube(leg,limbCuff(leg,19),'#f66b19','worker-tucked-'+i,0,true,wideWidths)).join('')+`<path d="${art.pants.fill}" fill="#f66b19"/>`+line(art.pants.sides)+line(art.pants.crotch)+line(art.pants.waist);

const blueWorkerHat=art.worker.hat.map((spec,i)=>kappaTag({...spec,fill:i?'#f4f3ed':spec.fill})).join('');
const blueWorkerTop=art.worker.blueSleeves.join('')+art.worker.blueBody;
const blueWorkerBoots=art.worker.blueBoots.join('');
const blueWorkerPants=workerPants.replaceAll('#f66b19','#1d3b68');
const blueWorkerTucked=workerTuckedPants.replaceAll('#f66b19','#1d3b68');
const yellowHead=vm.runInContext('yellowFishHeadContour',context);
const yellowFish=frogPaths.map((tag,index)=>{
 if(index===0||index>=12||index===1||index===11)return '';
 let node=tag.replace(/fill="#C5C5C5"/g,'fill="#FFEE00"');
 if(!/\bfill=/.test(node))node=node.replace('<path ','<path fill="none" ');
 if(index===5)node=node.replace(/d="[^"]+"/,`d="${yellowHead}"`);
 if(index===2)node=node.replace(/26\.1046 56\.4524C25\.612[\s\S]*?67\.7274 55\.0466/,yellowHead.slice(1));
 return node;
}).join('')+(original.match(/<ellipse\b[^>]*\/>/)?.[0]||'');
const spaceHelmet=art.space.helmet.map(kappaTag).join('');
const spaceHands=art.space.hands.map(h=>`<path d="${h.fill}" fill="#F96C20"/>`+line(h.outline)).join('');
const spaceArms=art.space.sleeves.join('');
const angelPants=widePantsThumbnail('white-loose-wide-trousers',10.5,looseWideWidths,'8 108 86 80').replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
const angelHalo=art.angel.halo.map(kappaTag).join('');
const spaceTop=spaceArms+art.space.body;
const spacePants=widePantsThumbnail('space-trousers',9.25,vm.runInContext('Array.from({length:32},(_,i)=>wideLegExtraWidth(i,9.25))',context),'0 107 104 84').replace(art.pants.fill,art.space.pants).replace(line(art.pants.waist),art.space.waist).replace(line(art.pants.crotch,1.5),line(art.space.crotch,1)).replace(line(art.pants.crotch),line(art.space.crotch,1)).replace(line(art.pants.sides),'').replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');

const spaceShoePicture=art.pants.legs.map(leg=>`<path d="${leg.bootFill}" fill="#FF8215"/>`+line(leg.bootOutline)).join('');
const topknotHat=art.topknot.hat.map(kappaTag).join('');
const blazerContent=art.topknot.sleeves.join('')+art.topknot.body;
const colorblockShoes=art.topknot.shoes.join('');
const secondaryHat=art.secondary.hat.map(kappaTag).join('');
const collaredContent=art.shirt.arms.map((arm,i)=>clippedTube(arm,limbCuff(arm,31),'#D9D9D9','collared-sleeve-'+i)+line(vm.runInContext('cuffPath(thumbArm,31)',Object.assign(context,{thumbArm:arm})))).join('')+`<path d="${art.collaredBody}" fill="#D9D9D9"/>`+line(art.shirt.sides)+line(art.collaredNeck)+art.collared;
const lipstickSkinContent=(hideHorn=false)=>skinBody('#F6DDDD',hideHorn).replace(originalPaths[8][0],'').replace(original.match(/<ellipse\b[^>]*\/>/)?.[0]||'','')+'<defs><clipPath id="lipstick-thumb-clip"><path d="'+originalPaths[5][1]+'Z"/></clipPath></defs>'
 +art.streaker.face.map(s=>s.lip?'<g clip-path="url(#lipstick-thumb-clip)">'+kappaTag(s)+'</g>':kappaTag(s)).join('')
 +`<path d="${originalPaths[5][1]}" fill="none" stroke="black" stroke-linecap="round" stroke-linejoin="round"/>`+originalPaths[8][0]+(original.match(/<ellipse\b[^>]*\/>/)?.[0]||'');
const pinkRibbonContent=art.streaker.ribbon.map(kappaTag).join('');
const hypnoticBody=hideHorn=>skinBody('#FBD5CA',hideHorn).replace(/<path[^>]*fill="white"[^>]*\/>/,'').replace(/<ellipse\b[^>]*\/>/,'')+art.hypnoticEye.map(kappaTag).join('');
const darkGrayPants=suitPantsContent.replaceAll(art.colors.suitNavy,'#2B2D2D');
const secondaryJacket=art.secondary.sleeves.join('')+art.secondary.body;
const secondaryPants=suitPantsContent.replaceAll(art.colors.suitNavy,'#101011');
const brownShoes=art.pants.legs.map(leg=>`<path d="${leg.bootFill}" fill="#623813"/>`+line(leg.bootOutline)).join('');
const studentHat=art.student.hat.map(kappaTag).join('');
const studentJacket=art.student.sleeves.join('')+art.student.body;
const studentShortWidths=vm.runInContext('Array.from({length:32},(_,i)=>i<14?wideShortsExtraWidth(i,3,14):0)',context);
const studentShorts=art.pants.legs.map((leg,i)=>clippedTube(leg,limbCuff(leg,14,3),'#102f68','student-short-'+i,0,true,studentShortWidths)+line(vm.runInContext('cuffPath(thumbLeg,14,3,.5)',Object.assign(context,{thumbLeg:leg})))).join('')+`<path d="${art.pants.fill}" fill="#102f68"/>`+line(art.pants.sides)+line(art.pants.crotch)+line(art.pants.waist);
const greenUltraShorts=studentShorts.replaceAll('#102f68','#264F02');
const studentShoePicture=(start,shoes)=>art.pants.legs.map((leg,i)=>{
 const top=vm.runInContext(`limbClipPoints(thumbLeg,${start},true)`,Object.assign(context,{thumbLeg:leg}));
 const sock=['black','#fffdf8'].map(color=>leg.hose.slice(start).map(({d,width})=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width+(color==='black'?2:0)}" stroke-linecap="round"/>`).join('')).join('');
 const sockLine=vm.runInContext(`cuffPath(thumbLeg,${start},0,.5)`,Object.assign(context,{thumbLeg:leg}));
 return `<defs><clipPath id="student-sock-${i}-${start}"><polygon points="${top}"/></clipPath><clipPath id="student-ankle-${i}-${start}"><polygon points="${art.student.sockClips[i].bottom}"/></clipPath></defs><g clip-path="url(#student-sock-${i}-${start})"><g clip-path="url(#student-ankle-${i}-${start})">${sock}${shoes?vm.runInContext(`sockStripeMarkup(thumbLeg,${JSON.stringify(shoes)})`,Object.assign(context,{thumbLeg:leg})):""}</g></g>`+line(sockLine)+`<path d="${leg.bootFill}" fill="#111214"/>`+line(leg.bootOutline);
}).join('');
const studentShoes=studentShoePicture(24),studentLongSocks=studentShoePicture(20);
const monkeySkin=skinBody('#E38047').replace(frogPaths[8],'').replace(original.match(/<ellipse\b[^>]*\/>/)?.[0]||'','')+`<defs><clipPath id="monkey-thumb-face"><path d="${headShape}"/></clipPath></defs><g clip-path="url(#monkey-thumb-face)">${art.walker.face.map(kappaTag).join('')}</g>`+headOutlineTag.replace('<path ','<path fill="none" ')+frogPaths[11].replace('<path ','<path fill="none" ')+frogPaths[8]+(original.match(/<ellipse\b[^>]*\/>/)?.[0]||'');
const walkerPants=spacePants.replaceAll('#FF8215','#F85137').replaceAll('#10C9E9','#5B270B');
const walkerSleeveWidths=vm.runInContext("Array.from({length:32},(_,i)=>teeSleeveWidth(i,teeStyles['walker-shirt']))",context);
const walkerShirt=art.tee.arms.map((arm,index)=>{
 const id='walker-sleeve-'+index;
 const clip=vm.runInContext('limbClipPoints(thumbArm,31,false)',Object.assign(context,{thumbArm:arm}));
 const strokes=['black','fabric'].map(layer=>arm.hose.map(({d,width},i)=>{
  const ink=layer==='black',color=ink?'black':i>=31?'#E38047':i>=29?'#F4F4F4':i>=24?'black':'#FFD35B';
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width+walkerSleeveWidths[i]+(ink?2:0)}" stroke-linecap="${!ink&&i>=23||i>=29?'butt':'round'}"/>`;
 }).join('')).join('');
 return `<defs><clipPath id="${id}"><polygon points="${clip}"/></clipPath></defs><g clip-path="url(#${id})">${strokes}</g>`+line(vm.runInContext('cuffPath(thumbArm,31,4)',context));
}).join('')+`<path d="${art.walker.body}" fill="#FFD35B"/>`+line(vm.runInContext("looseTopPath(teeStyles['walker-shirt'].sidesSource,buildWarp({body:100,width:100,arms:100,legs:100,head:100}))",context))+art.walker.details+line(vm.runInContext("garmentPath(teeStyles['walker-shirt'].neckSource,buildWarp({body:100,width:100,arms:100,legs:100,head:100}))",context))+line(vm.runInContext("looseTopPath(teeStyles['walker-shirt'].hemSource,buildWarp({body:100,width:100,arms:100,legs:100,head:100}))",context));
const monkRobe=art.tee.arms.map((arm,index)=>{
 const id='monk-sleeve-'+index;
 const clip=vm.runInContext('limbClipPoints(thumbArm,31,false)',Object.assign(context,{thumbArm:arm}));
 const strokes=['black','fabric'].map(layer=>arm.hose.map(({d,width},i)=>{
  const ink=layer==='black',color=ink?'black':i>=31?'#f9d4ad':i>=29?'#FFD400':index===1?'#C91819':'#F4F4F4';
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width+walkerSleeveWidths[i]+(ink?2:0)}" stroke-linecap="${!ink&&i>=23||i>=29?'butt':'round'}"/>`;
 }).join('')).join('');
 return `<defs><clipPath id="${id}"><polygon points="${clip}"/></clipPath></defs><g clip-path="url(#${id})">${strokes}${index===1?`<path d="${vm.runInContext('monkSleeveGrid(thumbArm)',context)}" fill="none" stroke="#FD82A7" stroke-width=".6"/>`:''}</g>`+line(vm.runInContext('cuffPath(thumbArm,31,4)',context));
}).join('')+`<path d="${art.walker.body}" fill="#F4F4F4"/>`+line(vm.runInContext("looseTopPath(teeStyles['walker-shirt'].sidesSource,buildWarp({body:100,width:100,arms:100,legs:100,head:100}))",context))+art.monk.details+line(vm.runInContext("looseTopPath(teeStyles['walker-shirt'].hemSource,buildWarp({body:100,width:100,arms:100,legs:100,head:100}))",context))+line(vm.runInContext("garmentPath(teeStyles['monk-robe'].neckSource,buildWarp({body:100,width:100,arms:100,legs:100,head:100}))",context));
const walkerSuitPants=art.space.legs.map((leg,i)=>{
 const widths=vm.runInContext('Array.from({length:32},(_,i)=>wideLegExtraWidth(i,9.25))',context);
 return clippedTube(leg,limbCuff(leg,19,widths[19]),'#F85137','walker-suit-thigh-'+i,0,true,widths)
  +vm.runInContext("workerBootMarkup(thumbLeg,thumbSide,100,9.25,'black-worker-boots')",Object.assign(context,{thumbLeg:leg,thumbSide:i?'right':'left'}));
}).join('')+`<path d="${art.space.pants}" fill="#F85137"/>`+line(art.space.crotch)+art.space.waist.replaceAll('#10C9E9','#5B270B');

const thumbnails = {
 'space-helmet':svg('14 -1 72 69',spaceHelmet),
 'space-shirt':svg('-10 49 120 78',spaceTop),
 'space-trousers':svg('8 108 86 80',spacePants),
 'orange-shoes':svg('-3 172 106 26',spaceShoePicture),
 'space-gloves':svg('-1 95 25 19',`<path d="${art.gloves.fill}" fill="#F96C20"/>`+line(art.gloves.outline)),
 'astronaut-suit':svg('-5 -2 112 201',spacePants+spaceShoePicture+spaceTop+spaceHands+spaceHelmet),
 ...Object.fromEntries(Object.entries(art.muscleVariants).map(([id,v])=>[id==='muscle'?'muscle-skin':id,svg('-2 9 104 188',skinBody(v.color,false,true)+line(art.muscleLines))])),
 ...Object.fromEntries(Object.entries(art.reference595.bandVariants).map(([id,v])=>[id,svg('24 10 75 55',art.reference595.band.map(s=>`<path d="${s.source}" fill="${v.color}" stroke="black" stroke-width="${s.strokeWidth}"/>`).join(''))])),
 ...Object.fromEntries(Object.entries(art.swim.caps).map(([id,v])=>[id,svg('48 -3 45 64',art.swim.cap.map(s=>`<path d="${s.source}" fill="${s.fill==='none'?'none':v.color}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" stroke-linecap="round"/>`).join(''))])),
 ...Object.fromEntries(Object.entries(art.swim.goggles).map(([id,v])=>[id,svg('38 9 56 51',art.swim.goggle.map(s=>`<path d="${s.source}" fill="${s.fill==='none'?'none':s.fill==='#A8EFFF'?v.lens:v.color}" fill-opacity="${s.opacity}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}"/>`).join(''))])),
 ...Object.fromEntries(Object.entries(art.swim.ring).map(([id,markup])=>[id,svg('-16 47 120 72',markup)])),
 'large-party-hat':svg('60 25 52 32',art.largePartyHat.map(s=>`<path d="${s.source}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="1" stroke-linejoin="round"/>`).join('')),
 'gourd':svg('-1 23 118 129',art.reference595.gourd.map(s=>`<path d="${s.source}" fill="${s.fill}" stroke="black" stroke-width="${s.strokeWidth||1}"/>`).join('')),
 'navy-slippers':svg('-3 176 107 22',art.reference595.slippers),
 'scar':svg('-2 9 104 188',skinBody('#C5C5C5',false,false,true)+line(art.reference594.scar,.7)),
 'teardrop-earrings':svg('65 40 19 19',`<path d="${art.reference594.earrings}" fill="#FCE043" stroke="#B87924" stroke-width=".7"/>`),
 'paired-swords':svg('-12 92 126 59',art.reference594.swords.map(s=>`<path d="${s.source}" fill="${s.fill}" stroke="black" stroke-width="1"/>`).join('')),
 'white-sweatpants':svg('8 108 86 80',spacePants.replaceAll('#FF8215','#FFFFFF').replaceAll('#10C9E9','#FFFFFF')),
 'black-gray-sweatpants':svg('8 108 86 80',spacePants.replaceAll('#FF8215','#373737').replaceAll('#10C9E9','#909090')),
 'shell-top':svg('23 53 48 48',art.beach.top),

 'green-ultra-shorts':svg('11 109 80 56',greenUltraShorts),
 'beach-suit':svg('-3 9 106 188',skinBody('#ffc1bf')+greenUltraShorts+art.beach.top),
 'lipstick-fish':svg('-2 9 104 188',lipstickSkinContent()),
 'pink-ribbon-hair':svg('60 5 56 66',pinkRibbonContent),
 'mosaic-top':svg('22 64 50 50',art.streaker.top),
 'mosaic-pants':svg('22 108 50 34',art.streaker.pants),
 'streaker-suit':svg('-3 7 120 190',pinkRibbonContent+lipstickSkinContent(true)+art.streaker.mosaic),
 ...Object.fromEntries(Object.entries(art.coloredSkinVariants).map(([id,v])=>[id,svg('-2 9 104 188',(v.gradient?'<defs>'+art.rainbowSkinDefs+'</defs>':'')+skinBody(v.color,false,false,false,v.hornColor))])),
 'monkey-skin':svg('-2 8 104 189',monkeySkin),
 'golden-circlet':svg('56 6 25 53',art.walker.circlet.map(kappaTag).join('')),
 'small-blue-scarf':svg('10 43 76 35',art.walker.scarf.map(kappaTag).join('')),
 'walker-shirt':svg('-3 49 107 63',walkerShirt),
 'walker-sweatpants':svg('0 104 104 88',walkerPants),
 'lotus-hat':svg('55 7 36 50',art.monk.hat.map(kappaTag).join('')),
 'monk-robe':svg('-3 49 107 67',monkRobe),
 'monk-suit':svg('-4 -5 111 203',art.monk.hat.map(kappaTag).join('')+skinBody('#f9d4ad',true)+angelPants+monkRobe+brownShoes),
 'walker-suit':svg('-4 6 111 192',monkeySkin+walkerSuitPants+walkerShirt+art.walker.circlet.map(kappaTag).join('')+art.walker.scarf.map(kappaTag).join('')),
 'chef-hat':svg('62 15 44 38',art.chef.hat.map(kappaTag).join('')),
 'white-chef-jacket':svg('3 49 89 77',art.chef.sleeves.join('')+art.chef.body),
 'chef-suit':svg('-3 7 114 190',art.chef.hat.map(kappaTag).join('')+skinBody('#f9d4ad',true)+spacePants.replaceAll('#FF8215','#FFFFFF').replaceAll('#10C9E9','#FFFFFF')+art.chef.sleeves.join('')+art.chef.body+brownShoes.replaceAll('#623813','#BFBFBF')),
 'yellow-bow-hair':svg('18 1 74 82',art.gyaruOutfit.hair.map(kappaTag).join('')),
 'pink-heart-bra':svg('23 50 48 59',art.gyaruOutfit.top),
 'gyaru-suit':svg('-3 0 111 198',skinBody('#B96723',true).replace(/<path[^>]*fill="white"[^>]*\/>/,'').replace(/<ellipse\b[^>]*\/>/,'')+art.gyaru.map(kappaTag).join('')+art.gyaruOutfit.top+`<path d="${art.pants.fill}" fill="#FFA5F0"/>`+line(art.pants.sides)+line(art.pants.shortsLower)+line(art.pants.waist)+art.gyaruOutfit.boxers+studentShoePicture(20,'striped-long-socks-shoes')+art.gyaruOutfit.hair.map(kappaTag).join('')),
 'gyaru-skin':svg('-2 8 104 189',skinBody('#B96723').replace(/<path[^>]*fill="white"[^>]*\/>/,'').replace(/<ellipse\b[^>]*\/>/,'')+art.gyaru.map(kappaTag).join('')),
 'sponge-skin':svg('-2 8 104 189',art.sponge.head.filter(s=>s.behind).map(kappaTag).join('')+skinBody('#FEF455')+art.sponge.head.filter(s=>!s.behind).map(kappaTag).join('')+`<path d="${art.sponge.body}" fill="#C2C104"/>`+art.sponge.arms.concat(art.sponge.legs).map(d=>`<path d="${d}" fill="#C2C104"/>`).join('')+frogPaths[8]+(original.match(/<ellipse\b[^>]*\/>/)?.[0]||'')),
 'flesh-8':svg('-2 9 104 188',skinBody('#754F36')),
 'angel-halo':svg('19 -6 56 15',angelHalo),
 'angel-wings':svg('-23 46 141 51',backDetails('angel-wings')),
 'angel-vest':svg('23 51 48 64',art.angel.top),
 'white-loose-wide-trousers':svg('8 108 86 80',angelPants),
 'angel-suit':svg('-24 -8 143 205',backDetails('angel-wings')+skinBody('#754F36')+angelPants+art.angel.top+angelHalo),
 'flesh-7':svg('-2 9 104 188',skinBody('#FFEADD')),
 'flesh-6':svg('-2 9 104 188',skinBody('#FBD5CA')),
 ...Object.fromEntries(Object.entries(art.narutoItems.hairVariants).map(([id,v])=>[id,svg('34 -3 49 63',art.narutoItems.hair.map(s=>kappaTag({...s,fill:v.color})).join(''))])),
 'navy-sandals':svg('-2 176 104 20',art.narutoItems.sandals.join('')),
 ...Object.fromEntries(Object.entries(art.narutoItems.topknotVariants).map(([id,v])=>[id,svg('41 7 51 54',art.topknot.hat.map(s=>kappaTag({...s,fill:id==='topknot-hair'?s.fill:v.color})).join(''))])),
 'charcoal-blazer':svg('-3 49 106 81',blazerContent),
 'colorblock-shoes':svg('-2 176 104 20',colorblockShoes),
 'topknot-suit':svg('-3 4 106 194',skinBody('#FBD5CA',true)+colorblockShoes+darkGrayPants+collaredContent+blazerContent+topknotHat),
 'hypnotic':svg('-2 9 104 188',hypnoticBody(false)),
 'white-tie-shirt':svg('-3 49 106 68',collaredContent),
 'dark-gray-slight-wide-trousers':svg('8 108 86 80',darkGrayPants),
 'makima-suit':svg('-3 4 106 194',hypnoticBody(true)+brownShoes+darkGrayPants+collaredContent+art.longHair.map(kappaTag).join('')),
 ...Object.fromEntries(Object.entries(art.narutoItems.longVariants).map(([id,v])=>[id,svg('43 8 33 94',art.longHair.map(s=>kappaTag({...s,fill:v.color})).join(''))])),
 'flesh-5':svg('-2 9 104 188',skinBody('#dda579')),
 'secondary-hat':svg('54 10 34 39',secondaryHat),
 'secondary-jacket':svg('-3 49 106 81',secondaryJacket),
 'black-slight-wide-trousers':svg('8 108 86 80',secondaryPants),
 'gray-plain-shoes':svg('-2 176 104 20',brownShoes.replaceAll('#623813','#BFBFBF')),
 'brown-shoes':svg('-2 176 104 20',brownShoes),
 'secondary-suit':svg('-3 4 106 194',secondaryHat+skinBody('#dda579',true)+brownShoes+secondaryPants+secondaryJacket),
 'flesh-4':svg('-2 9 104 188',skinBody('#ffc1bf')),
 'student-hat':svg('43 4 44 54',studentHat),
 'student-jacket':svg('-3 49 106 72',studentJacket),
 'student-shorts':svg('11 109 80 56',studentShorts),
 'student-shoes':svg('-2 158 104 40',studentShoes),
 'student-long-socks-shoes':svg('-2 145 104 53',studentLongSocks),
 'tricolor-long-socks-shoes':svg('-2 145 104 53',studentShoePicture(20,'tricolor-long-socks-shoes')),
 'striped-long-socks-shoes':svg('-2 145 104 53',studentShoePicture(20,'striped-long-socks-shoes')),
 'student-suit':svg('-3 4 106 194',skinBody('#ffc1bf')+studentShorts+studentLongSocks+studentJacket+studentHat),
 'little-yellow-fish':svg('-2 9 104 188',yellowFish),
 'white-worker-helmet':svg('25 4 65 56',blueWorkerHat),
 'blue-worker-jacket':svg('-5 49 110 79',blueWorkerTop),
 'blue-worker-trousers':svg('5 108 95 83',blueWorkerPants),
 'gray-worker-boots':svg('-8 148 116 49',blueWorkerBoots),
 'blue-worker-suit':svg('-8 4 116 194',skinBody('#f9d4ad')+blueWorkerTucked+blueWorkerBoots+blueWorkerTop+blueWorkerHat),
 'flesh-3':svg('-2 9 104 188',skinBody('#f9d4ad')),
 'worker-helmet':svg('25 4 65 56',workerHat),
 'worker-jacket':svg('-5 49 110 79',workerTop),
 'worker-trousers':svg('5 108 95 83',workerPants),
 ...Object.fromEntries(Object.entries(art.worker.extraBoots).map(([id,markup])=>[id,svg('-8 148 116 49',markup)])),
 'worker-boots':svg('-8 148 116 49',workerBoots),
 'worker-suit':svg('-8 4 116 194',skinBody('#f9d4ad')+workerTuckedPants+workerBoots+workerTop+workerHat),
 'kappa':svg('-2 9 104 188',kappaBody),
 'kappa-hair':svg('25 9 55 47',kappaHair),
 'kappa-suit':svg('-2 9 104 188',kappaShell+kappaBase(true)+kappaHair),
 'flesh-2':svg('-2 9 104 188',skinBody('#f4ece6')),
 'round-glasses':svg('42 14 30 39',jobsGlasses),
 'black-turtleneck-tee':svg('-2 46 104 70',jobsTop),
 'gray-sneakers':svg('-3 176 106 25',jobsShoes),
 'jobs-suit':svg('-3 8 106 194',skinBody('#f4ece6')+jobsShoes+jobsPants+jobsTop+jobsGlasses),
 'batfish-cowl':svg('23 0 48 54',batCowl),
 'batfish-armor':svg('-2 53 104 63',batTop),
 'batfish-trousers':svg('8 108 86 80',batPants),
 'batfish-boots':svg('-2 144 104 53',batBoots),
 'batfish-gloves':svg('-2 88 26 27',`<path d="${art.batGloves[0].fill}" fill="${art.colors.batBlack}"/>`+line(art.batGloves[0].outline)+`<path d="${art.gloves.fill}" fill="${art.colors.batBlack}"/>`+line(art.gloves.outline)),
 'batfish-suit':svg('-2 0 104 198',batCape+royalHeadContent+batCowl+originalPaths[8][0]+(original.match(/<ellipse\b[^>]*\/>/)?.[0]||'')+batPants+batBoots+batTop+batHands),
  'ivory-tunic':svg('-8 53 116 63',ivoryTop),
  'ivory-trousers':ivoryPants,
  'crimson-cape':svg('2 50 92 137',backDetails('crimson-cape')),
  'ivory-suit':svg('-8 8 116 190',backDetails('crimson-cape')+royalCrownContent+royalHeadContent+kingBootFeet+ivoryPants.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')+ivoryTop),
  'royal-trousers':royalPantsIcon,
  'suit-jacket':svg('-2 53 104 63',suitJacketContent),
  'suit-trousers':svg('8 108 86 80',suitPantsContent),
  'black-dress-shoes':svg('-2 176 104 20',dressShoesContent),
  'navy-suit':svg('-2 9 104 188',skinBody(sharkFlesh)+dressShoesContent+suitPantsContent+suitJacketContent),
  'loose-tee':looseTopThumbnail('loose-tee'),
  'cinched-long-sleeve':looseTopThumbnail('cinched-long-sleeve'),
  'loose-long-sleeve':looseTopThumbnail('loose-long-sleeve'),
  'milk-frog':svg('-2 9 104 188',frogIcon),
  pochita:svg('-2 9 104 188',pochitaBody),
  // The bare fish, for the "default skin" slot: the same build as every
  // other skin, in the reference's own grey.
  'default-skin':svg('-2 9 104 188',skinBody('#C5C5C5')),
  'flesh-skin':svg('-2 9 104 188',skinBody(sharkFlesh)),
  'clown-skin':svg('-2 9 104 188',clownBody),
  'alien-skin':svg('-2 9 104 188',alienBody),
  cigarette:svg('24 2 20 31',art.cigaretteSpecs.map(({source,fill})=>`<path d="${source}" fill="${fill}" stroke="black" stroke-width=".7" stroke-linejoin="round"/>`).join('')),
  'party-hat':svg('63 31 20 24',partyHatContent),
  'clown-suit':svg('-2 9 104 188',clownBody+partyHatContent),
  'shark-hood':svg('22 2 54 56',sharkHeadContent),
  'shark-suit':svg('-2 9 104 188',
    skinBody(sharkFlesh)+blackShortsContent+sharkHeadContent),
  chainsaw:svg('29 -27 52 82',chainsawContent),
  'pochita-suit':svg('-2 -27 104 224',pochitaIcon),
  'yellow-hat': svg('55 6 39 62',art.yellowHat.map(d=>
    `<path d="${d}" fill="#ffe047" stroke="black" stroke-width="1" stroke-linejoin="round"/>`).join('\n')),
  // Only the part that shows past the head: the band's hidden half would
  // read as a slab on an icon with no head behind it.
  crown: svg('64 30 20 25',art.crown.map(d=>
    `<path d="${d}" fill="${art.colors.crown}" stroke="black" stroke-width="${art.crownStrokeWidth}" stroke-linejoin="round" stroke-linecap="round"/>`).join('\n')),
  scarf: svg('5 44 94 39', art.scarf.map(d =>
    `<path d="${d}" fill="#d84f50" stroke="black" stroke-width="1" stroke-linejoin="round"/>`).join('\n')),
  shirt: svg('-2 53 104 63', [
    ...art.shirt.arms.map((arm,index) => clippedTube(arm,limbCuff(arm,31,art.roundLongSleeveStyle.flare),
      '#7d9ea2',`shirt-sleeve-${index}`,31,true,art.roundLongSleeveWidths,0) + line(vm.runInContext(
      'cuffPath(thumbArm,31,roundLongSleeveStyle.flare)', Object.assign(context, {thumbArm:arm})))),
    `<path d="${art.tee.fill}" fill="#7d9ea2"/>`,
    line(art.shirt.sides),line(art.tee.neck),line(art.tee.top),line(art.shirt.hem),
  ].join('\n')),
  'blue-vest': svg('24 54 47 51', [
    `<path d="${art.vest.fill}" fill="#2e5bd5"/>`,
    line(art.vest.sides),line(art.vest.neck),line(art.vest.top),
    line(art.vest.shoulders),line(art.vest.hem),
  ].join('\n')),
  'aloha-open-jacket':svg('-2 49 104 67',art.alohaOpen),
  'aloha-open-long-jacket':svg('-2 49 104 67',art.alohaOpenLong),
  'aloha-long-jacket':svg('-2 49 104 67',art.alohaLong),
  'aloha-jacket':svg('-2 49 104 67',art.aloha),
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
  'gray-scoop-tee':teeThumbnail('#7B7575',20,3,'gray-scoop-tee').replace('viewBox="-2 53 104 63"','viewBox="-2 53 104 79"').replace(art.tee.fill,art.scoopTee.fill).replace(line(art.tee.sides),line(art.scoopTee.sides)).replace(line(art.tee.top),'').replace(line(art.tee.neck),line(art.scoopTee.neck)).replace(line(art.tee.hem),line(art.scoopTee.hem)),
  'coral-tee': teeThumbnail(art.colors.coralTee,17,3,'coral-tee'),
  'red-cropped-tee-2':teeThumbnail('#DE0C0C',17,3,'red-cropped-tee-2'),
  'black-cropped-tee':teeThumbnail('#25272B',17,3,'black-cropped-tee'),
  'red-triangle': svg('24 53 48 83',
    `<path d="${art.redTriangle}" fill="${art.colors.redTriangle}" stroke="black" stroke-width="1" stroke-linejoin="round"/>`),
  pants: svg('12 108 78 78', [
    ...art.pants.legs.map((leg,index) => clippedTube(leg,
      [leg.bootOuter,leg.bootInner],'#526a78',`pants-leg-${index}`) + seam(leg)),
    `<path d="${art.pants.fill}" fill="#526a78"/>`,
    line(art.pants.sides), line(art.pants.crotch,1.5),line(art.pants.waist),
  ].join('\n')),
  'red-briefs':svg('25 109 44 27',`<path d="${art.briefs}" fill="${art.colors.redShorts}" stroke="black" stroke-width="1" stroke-linejoin="round"/>`),
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
  ...Object.fromEntries(['slight-wide-shorts','extra-wide-shorts'].map(id=>[id,flaredShortsThumbnail(id,art.colors.wideShorts,shortFlares[id])])),
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
  ...Object.fromEntries(Object.entries(art.thongVariants).map(([id,item])=>[id,svg('24 108 47 36',
    `<path d="${art.redThong}" fill="${item.color}" stroke="black" stroke-width="1" stroke-linejoin="round"/>`)])),
  ...Object.fromEntries(Object.keys(art.denimVariants).map(id=>[id,widePantsThumbnail(id,id==='jobs-gradient-jeans'?3.5:5.5,id==='jobs-gradient-jeans'?jobsWidths:wideWidths,'8 108 86 80')])),
  ...Object.fromEntries(Object.entries(art.workwearVariants).map(([id,item])=>[id,
    widePantsThumbnail(id,5.5,wideWidths,'8 53 86 135').replace('</svg>',[
      `<defs><mask id="workwear-chest"><rect x="-200" y="-200" width="500" height="600" fill="white"/><path d="${art.jumpsuit.chest}" fill="black"/></mask></defs>`,
      `<path d="${art.jumpsuit.fill}" fill="${item.color}" mask="url(#workwear-chest)"/>`,
      line(art.jumpsuit.sides),line(art.jumpsuit.chestOutline),line(art.jumpsuit.neck,1.25),line(art.jumpsuit.shoulders,1.1),
      art.workwearBibs[id],'</svg>',
    ].join(''))])),
  'wide-pants':widePantsThumbnail('wide-pants',5.5,wideWidths,'8 108 86 80'),
  'loose-wide-pants':widePantsThumbnail('loose-wide-pants',10.5,
    looseWideWidths,'2 108 98 80'),
  jumpsuit:jumpsuitThumbnail(art.colors.jumpsuit,'jumpsuit'),
  'navy-jumpsuit':jumpsuitThumbnail(art.colors.navyJumpsuit,'navy-jumpsuit'),
  shoes: svg('-1 177 32 20', [
    `<path d="${art.shoes.bootFill}" fill="#4e6069"/>`,
    line(art.shoes.bootOutline), seam(art.shoes),
  ].join('\n')),
  ...Object.fromEntries([['brown-boots',art.colors.brownBoots],
    ['dark-boots',art.colors.darkBoots]].map(([name,color])=>[name,
    svg('-1 144 102 50', art.pants.legs.map((leg,index)=>[
      clippedTube(leg,limbCuff(leg,19),color,`${name}-${index}`,0,false),
      `<path d="${leg.bootFill}" fill="${color}"/>`,
      line(leg.bootOutline),
      line(vm.runInContext('cuffPath(thumbLeg,19)',
        Object.assign(context,{thumbLeg:leg}))),
    ].join('\n')).join('\n'))])),
  gloves: svg('-1 95 25 19', [
    `<path d="${art.gloves.fill}" fill="#c8a27d"/>`,
    line(art.gloves.outline),
  ].join('\n')),
};

for(const [id,item] of Object.entries(art.boxerVariants))thumbnails[id]=svg('25 109 44 27',`<path d="${art.pants.fill}" fill="${item.color}"/>`+line(art.pants.sides)+line(art.pants.shortsLower)+line(art.pants.waist)+(id==='pink-polka-boxers'?art.gyaruOutfit.boxers:''));
for(const [id,item] of Object.entries(art.briefVariants))thumbnails[id]=svg('25 109 44 27',`<path d="${art.briefs}" fill="${item.color}" stroke="black" stroke-width="1" stroke-linejoin="round"/>`);
const redFarmerScarf=art.scarf.map(d=>`<path d="${d}" fill="#d84f50" stroke="black" stroke-width="1"/>`).join('');
const fisherHat=art.yellowHat.map(d=>`<path d="${d}" fill="#ffe047" stroke="black" stroke-width="1"/>`).join('');
const fisherVest=art.greenVest.map(d=>`<path d="${d}" fill="#278b20" stroke="black" stroke-width="1"/>`).join('');
const brownFisherBoots=art.worker.extraBoots['brown-worker-boots'];
// Reuse the existing tucked trouser silhouette where wide boot shafts cover the hems.
const fisherTrousers=blueWorkerTucked.replaceAll('#1d3b68','#f66b19');
const oxygenBack=frogPaths[0].replace(/fill(?:-opacity)?="[^"]*"/g,'').replace('<path ',`<path fill="${art.oxygenHelmet.fill}" fill-opacity="${art.oxygenHelmet.opacity}" `);
const oxygenFront=frogPaths.slice(12,15).map(tag=>/\bfill=/.test(tag)?tag:tag.replace('<path ','<path fill="none" ')).join('')+line('M26.1046 56.4524L67.7274 55.0466');
const rainbowGodSkin=skinBody('url(#rainbow-skin)',false,false,false,'url(#rainbow-skin-horn)');
thumbnails['fish-god-suit']=svg('-5 -4 115 203','<defs>'+art.rainbowSkinDefs+'</defs>'+art.godRing.back+oxygenBack+rainbowGodSkin+art.godRing.front+oxygenFront);
thumbnails['farmer-suit']=svg('-4 9 108 189',skinBody('#C5C5C5')+stripSvg(jumpsuitThumbnail(art.colors.jumpsuit,'farmer-jumpsuit'))+redFarmerScarf);
thumbnails['fisher-suit']=svg('-9 5 119 193',skinBody('#438FF1',true)+fisherTrousers+brownFisherBoots+fisherVest+fisherHat);
thumbnails['working-fish-suit']=svg('-4 9 108 189',skinBody('#37B2EC')+stripSvg(teeThumbnail('#DE0C0C',17,3,'working-fish-tee'))+stripSvg(jumpsuitThumbnail(art.colors.navyJumpsuit,'working-fish-jumpsuit')));
for(const id of Object.keys(capePalettes)){
  thumbnails[id]=svg(id==='gourd'?'-1 23 118 129':id==='paired-swords'?'-12 92 126 59':art.angel.wingVariants[id]?'-23 46 141 51':id==='dual-swords'?'-6 18 106 101':id==='greatsword'?'-28 0 134 180':id==='kappa-shell'?'25 48 57 81':'2 50 92 137',backDetails(id));
}

for (const [name, content] of Object.entries(thumbnails)) {
  const filename=art.coloredSkinVariants[name]||art.swim.caps[name]||art.swim.goggles[name]||art.swim.rings[name]||art.reference595.bandVariants[name]||art.angel.wingVariants[name]||art.worker.extraBoots[name]||art.muscleVariants[name]||art.narutoItems.longVariants[name]||art.narutoItems.topknotVariants[name]||art.narutoItems.hairVariants[name]||art.denimVariants[name]||art.workwearVariants[name]||art.boxerVariants[name]||art.briefVariants[name]||art.thongVariants[name]||shortFlares[name]?name:['lotus-hat','monk-robe','monk-suit','white-sweatpants','monkey-skin','golden-circlet','small-blue-scarf','walker-shirt','walker-sweatpants','walker-suit','gray-plain-shoes','chef-hat','white-chef-jacket','chef-suit','yellow-bow-hair','pink-heart-bra','gyaru-suit','gyaru-skin','tricolor-long-socks-shoes','striped-long-socks-shoes','sponge-skin','fish-god-suit','farmer-suit','fisher-suit','working-fish-suit','red-cropped-tee-2','large-party-hat','blue-eye-band','gourd','navy-slippers','scar','teardrop-earrings','paired-swords','black-gray-sweatpants','beach-suit','shell-top','seaweed-pants','lipstick-fish','pink-ribbon-hair','mosaic-top','mosaic-pants','streaker-suit','angel-suit','angel-halo','angel-wings','angel-vest','white-loose-wide-trousers','flesh-8','flesh-7','muscle-skin','yellow-spiky-hair','navy-sandals','space-helmet','space-shirt','space-trousers','orange-shoes','space-gloves','astronaut-suit','flesh-6','topknot-hair','charcoal-blazer','colorblock-shoes','topknot-suit','hypnotic','white-tie-shirt','dark-gray-slight-wide-trousers','makima-suit','long-braid-hair','flesh-5','secondary-hat','secondary-jacket','black-slight-wide-trousers','brown-shoes','secondary-suit','student-long-socks-shoes','flesh-4','student-hat','student-jacket','student-shorts','student-shoes','student-suit','little-yellow-fish','white-worker-helmet','blue-worker-jacket','blue-worker-trousers','gray-worker-boots','blue-worker-suit','flesh-3','worker-helmet','worker-jacket','worker-trousers','worker-boots','worker-suit','kappa','kappa-hair','kappa-suit','flesh-2','round-glasses','black-turtleneck-tee','gray-sneakers','jobs-suit','cigarette','large-ripped-denim-jeans','denim-jumpsuit','washed-denim-jeans','ripped-denim-jeans','denim-jeans','cinched-long-sleeve','aloha-open-jacket','aloha-open-long-jacket','aloha-long-jacket','aloha-jacket','default-skin','alien-skin','clown-skin','party-hat','clown-suit','flesh-skin','shark-hood','shark-suit','pochita','chainsaw','pochita-suit','batfish-cowl','batfish-armor','batfish-trousers','batfish-boots','batfish-gloves','batfish-suit',...Object.keys(capePalettes),'ivory-tunic','ivory-trousers','crimson-cape','ivory-suit','royal-trousers','suit-jacket','suit-trousers','black-dress-shoes','navy-suit','blue-vest','green-vest','yellow-hat','crown','yellow-tee',
    'patched-tee','gray-scoop-tee','black-cropped-tee','coral-tee','loose-tee','loose-long-sleeve','red-triangle','red-shorts','red-briefs',
    'pink-shorts','orange-shorts','black-shorts','skirt','milk-frog',
    'red-thong','wide-pants',
    'navy-jumpsuit','loose-wide-pants','brown-boots','dark-boots']
    .includes(name)?name:`decoration-${name}`;
  fs.writeFileSync(path.join(root, `svg/${filename}.svg`), content);
}

// Compatibility style thumbnails mirror the first real color; cards use item.icon directly.
const styleGroups=vm.runInContext('decorationStyleGroups',context);
const catalog=vm.runInContext('decorationCatalog',context);
for(const [category,groups] of Object.entries(styleGroups))for(const [key,,ids] of groups){
 if(!ids.length)throw new Error('Style has no colors: '+category+'/'+key);
 const item=catalog[category].find(item=>item.id===ids[0]);
 fs.copyFileSync(path.join(root,item.icon.replace(/^\.\//,'')),path.join(root,`svg/base-${category}-${key}.svg`));
}
