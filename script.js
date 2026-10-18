const host = document.querySelector('#character');
const controls = Object.fromEntries(
  [...document.querySelectorAll('[data-control]')].map(input => [input.dataset.control, input])
);
const resetButton = document.querySelector('[data-action="reset"]');
const randomButton = document.querySelector('[data-action="randomize"]');
const helmetButton = document.querySelector('[data-action="helmet"]');
const exportButton = document.querySelector('[data-action="export"]');
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
const MOUTH_SHUT = 1.108, MOUTH_OPEN = .5;
// Both lips move, the top one far less: a jaw working alone looks hinged,
// while a little counter-swing above reads as speech. The upper lip is
// almost twice as long as the jaw, so even this small share of the angle
// carries its point about a third as far.
const UPPER_LIP_SHARE = .16;
// Aqua glass dome, as in the reference art (svg/toukui.svg).
const HELMET_GLASS = '#A3EDFF', HELMET_GLASS_OPACITY = '0.45';
const decorationCatalog = {
  skin: [{ id: 'milk-frog', name: '奶鱼', icon: './svg/milk-frog.svg' }],
  suit: [],
  helmet: [
    { id: 'plain', name: '普通帽子', icon: './svg/toukui.svg' },
    { id: 'yellow-hat', name: '黄色宽檐帽', icon: './svg/yellow-hat.svg' },
  ],
  neck: [
    { id: 'scarf', name: '红围巾', icon: './svg/decoration-scarf.svg' },
  ],
  shirt: [
    { id: 'plain', name: '普通长袖上衣', icon: './svg/decoration-shirt.svg' },
    { id: 'blue-vest', name: '蓝色 V 领背心', icon: './svg/blue-vest.svg', sleeveless: true },
    { id: 'yellow-tee', name: '黄色宽松短袖', icon: './svg/yellow-tee.svg' },
    { id: 'patched-tee', name: '补丁短袖', icon: './svg/patched-tee.svg' },
    { id: 'red-tee', name: '红色体恤', icon: './svg/red-tee.svg' },
    { id: 'red-triangle', name: '红色三角衣服', icon: './svg/red-triangle.svg', sleeveless: true },
    { id: 'coral-tee', name: '红色短袖', icon: './svg/coral-tee.svg' },
    { id: 'loose-tee', name: '宽松T恤', icon: './svg/loose-tee.svg' },
    { id: 'loose-long-sleeve', name: '宽松长袖上衣', icon: './svg/loose-long-sleeve.svg' },
  ],
  pants: [
    { id: 'plain', name: '紧身裤', icon: './svg/decoration-pants.svg' },
    { id: 'jumpsuit', name: '蓝色连体裤', icon: './svg/decoration-jumpsuit.svg', sleeveless: true },
    { id: 'navy-jumpsuit', name: '深蓝色连体裤', icon: './svg/navy-jumpsuit.svg', sleeveless: true },
    { id: 'red-shorts', name: '红色内裤', icon: './svg/red-shorts.svg' },
    { id: 'pink-shorts', name: '粉色短裤', icon: './svg/pink-shorts.svg' },
    { id: 'orange-shorts', name: '橙色短裤', icon: './svg/orange-shorts.svg' },
    { id: 'black-shorts', name: '黑色短裤', icon: './svg/black-shorts.svg' },
    { id: 'wide-shorts', name: '阔腿短裤', icon: './svg/wide-shorts.svg' },
    { id: 'skirt', name: '灰青色裙子', icon: './svg/skirt.svg' },
    { id: 'red-thong', name: '红色丁字裤', icon: './svg/red-thong.svg' },
    { id: 'wide-pants', name: '蓝色裤子', icon: './svg/wide-pants.svg' },
    { id: 'loose-wide-pants', name: '几何拼贴阔腿裤', icon: './svg/loose-wide-pants.svg' },
  ],
  outerwear: [
    { id: 'green-vest', name: '绿色开襟外套', icon: './svg/green-vest.svg', sleeveless: true },
  ],
  shoes: [
    { id: 'plain', name: '普通鞋子', icon: './svg/decoration-shoes.svg' },
    { id: 'brown-boots', name: '棕色长靴', icon: './svg/brown-boots.svg' },
  ],
  gloves: [{ id: 'plain', name: '普通手套', icon: './svg/decoration-gloves.svg' }],
};
const decorationColors = {
  shirt: '#7d9ea2', pants: '#526a78', shoes: '#4e6069', gloves: '#c8a27d',
  jumpsuit: '#2425d9', scarf: '#d84f50',
  blueVest: '#2e5bd5', yellowTee: '#ffe144', patchedTee: '#756e6c',
  redShorts: '#d44a49', pinkShorts: '#ee31ac',
  greenVest: '#278b20', orangeShorts: '#eb8135', brownBoots: '#603d26',
  yellowHat: '#ffe047',
  navyJumpsuit: '#303578', redTee: '#d80c0c', blackShorts: '#100b0d',
  redThong: '#c60000', redTriangle: '#c52323', coralTee: '#f26d58',
  looseTee:'#a9b89c', looseLongSleeve:'#859eb4',
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
function widePantsPaint() {
  return selectedDecorations.pants==='loose-wide-pants'
    ?'url(#loose-pants-fabric)':decorationColors.widePants;
}
const selectedDecorations = { skin:null, suit:null, helmet: 'plain', neck: null, shirt: null, pants: null,
  outerwear: null, shoes: null, gloves: null };
let activeDecorationCategory = 'skin';
const milkFrogColors={skin:'#e9ab24',belly:'#f6d69e',eye:'#369b4b'};
const milkFrogBellySource='M47 78C36 78 34 96 35.5 108C36.4 117 40 119 47 119C54 119 57.6 117 58.5 108C60 96 58 78 47 78Z';
function skinColor(){return selectedDecorations.skin==='milk-frog'?milkFrogColors.skin:'#C5C5C5';}
let bellyPatch,bellyClip;

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
  const swing = -mouth * (mouth >= 0 ? MOUTH_OPEN : MOUTH_SHUT);
  // The two shares add up to the whole swing, so the limits above stay the
  // angle the notch actually opens or closes by.
  const lowerSwing = swing / (1 + UPPER_LIP_SHARE);
  const upperSwing = -UPPER_LIP_SHARE * lowerSwing;
  const openJaw = (x, y) => {
    // The lower jaw is the prong left of the notch. Its fade has to reach
    // well below the corner, or the jaw's outer edge stays pinned while its
    // point swings and the prong buckles into a nub instead of swinging.
    // The upper lip is the spike to the right, and its own fade has to die
    // out quickly along the head's right edge, which is not part of it.
    const lower = smooth((40 - y) / 15) * smooth((JAW.corner[0] - x) / 2.5);
    const upper = smooth((24 - y) / 14) * smooth((54 - x) / 10);
    const angle = lower * lowerSwing + upper * upperSwing;
    if (!angle) return [x, y];
    const [hx, hy] = JAW.corner, cos = Math.cos(angle), sin = Math.sin(angle);
    return [hx + (x - hx) * cos - (y - hy) * sin,
      hy + (x - hx) * sin + (y - hy) * cos];
  };

  return (x, y, role) => {
    if (swing && role === 'head') [x, y] = openJaw(x, y);
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
let lastHat = 'plain';
let scarfPaths = [];
let outfitOverlay;
let neckOverlay;
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
function legGeometry(side, warp) {
  const left = side === 'left', sign = left ? -1 : 1;
  const source = left
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
  const referenceOuter=referenceCurves.outer.map(([x,y])=>
    warp(x,y,classifyPoint(x,y,'mixed')));
  const referenceInner=referenceCurves.inner.map(([x,y])=>
    warp(x,y,classifyPoint(x,y,'mixed')));
  const canonicalOuter=left||Number(controls.legs.value)<=100?null
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
  const foot=`M${pair(footStart)}`+dynamicBoot.map((segment,i)=>{
    const points=segment.map((point,j)=>morph(
      referenceFootPoint(referenceBoot.segments[i][j]),point));
    return `C${points.map(pair).join(' ')}`;
  }).join('');
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
  return {hose,bootFill,bootOutline,shoeUp:{x:-shoeFrame.t.x,y:-shoeFrame.t.y},
    bootOuter:footStart,bootInner:footEnd,bootToe,bootHeel,
    ankleOuterEdge,ankleInnerEdge,
    crease,creaseOpacity,centerline,hip,ankle,knee,
    thighLength,shinLength,boneLength,restLength,hipWidth,lifted,heelAngle,toe,
    sole:[boot(12,-w+2),boot(12,w+5)],foot:boot(8,w+2),middle:knee};
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
let torsoSideOutline;
let helmetBase;
let hatPaths=[];
let buttOutlines = [];
let garmentPaths;
let jumpsuitChestCutout;
let torsoMaterial;
const scarfSources = [
  // Its knot sits at the neck; the broad end drapes over the near shoulder.
  'M35 58C46 54 59 49 67 46C80 48 89 56 95 67L35 59Z',
  'M35 58C25 52 17 51 7.5 62C17 64 25 64 35 58Z',
  'M34.5 59C30 65 24.5 72 25 80C31 73 35.5 66 36 59Z',
  'M32.5 57.2C34 55.7 37 55.7 38.6 57.4C38.9 59 36.4 60.2 34.3 59.4C32.7 59.2 32 58.1 32.5 57.2Z',
];
const shirtSource = `M26.1046 56.4524L67.7274 55.0466L67.5459 ${RIGHT_ARMPIT_Y}
  C66.9913 84.8335 66.1 103 65.9 112L27.7 112
  C27.6 103 27.5018 84.2394 27.478 ${LEFT_ARMPIT_Y}Z`;
const pantsSource = `M27.7 110.5L65.9 110.5L65.8486 125.059
  C63.5 127.5 54 131.8 49.4914 132.8
  C48.4 132.3 45.9 132.3 44.6804 132.8
  C40 131.8 31 127.5 28.4591 125.881Z`;
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
function redThongSource(legs) {
  // The waistband follows the torso. Only the centre strip grows with the
  // leg length: at the shortest setting it stops at the body's crotch, and
  // at the longest setting it keeps the original 141-unit endpoint.
  const end=clean(lerp(132.8,141,clamp01((legs-50)/130)));
  return `M27.7 110.5L65.9 110.5L65.45 119.5
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
// Brim first, then the round crown. Both follow the head's deformation.
const yellowHatSources = {
  brim:`M60 8C66 6 79 22 83 33C88 44 91 59 85 62
    C78 68 59 43 57.5 19C57 13 57.5 8.5 60 8Z`,
  crown:`M79 20C86 20 91 25 91 33C91 40.5 86 45 79 45
    C72 45 67 40.5 67 33C67 25 72 20 79 20Z`,
};
const shirtTopSource = 'M26.1046 56.4524L67.7274 55.0466';
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
const teeStyles = {
  'loose-tee':{color:decorationColors.looseTee,sleeveEnd:22,flare:9,loose:true},
  'loose-long-sleeve':{color:decorationColors.looseLongSleeve,sleeveEnd:31,flare:7,loose:true},
  'yellow-tee': {color:decorationColors.yellowTee,sleeveEnd:20,flare:2.5},
  'patched-tee': {color:decorationColors.patchedTee,sleeveEnd:20,flare:2.5},
  'red-tee': {color:decorationColors.redTee,sleeveEnd:20,flare:2.5},
  'coral-tee': {color:decorationColors.coralTee,sleeveEnd:17,flare:3},
};
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
function updateTorsoMaterial(node,warp) {
  const colors={plain:decorationColors.pants,
    'wide-pants':decorationColors.widePants,'loose-wide-pants':decorationColors.widePants,
    'pink-shorts':decorationColors.pinkShorts,'orange-shorts':decorationColors.orangeShorts,
    'black-shorts':decorationColors.blackShorts,'wide-shorts':decorationColors.wideShorts,
    'red-shorts':decorationColors.redShorts,
    jumpsuit:decorationColors.jumpsuit,'navy-jumpsuit':decorationColors.navyJumpsuit};
  const color=colors[selectedDecorations.pants];
  const patterned=selectedDecorations.pants==='loose-wide-pants';
  if(torsoMaterial.upperSkin){
    torsoMaterial.upperSkin.style.display=patterned?'':'none';
    // The torso above the waistband is bare skin, so it follows the chosen
    // skin color instead of the default grey.
    torsoMaterial.upperSkin.setAttribute('fill',skinColor());
  }
  torsoMaterial.upper?.forEach(stop=>stop.setAttribute('stop-color',skinColor()));
  if(!color){node.setAttribute('fill',skinColor());return;}
  const point=x=>applyDragPose(warp(x,110.5,'body'),x,110.5,'body',warp);
  const a=point(27.7),b=point(65.9),span=Math.hypot(b.x-a.x,b.y-a.y)||1;
  const normal={x:-(b.y-a.y)/span,y:(b.x-a.x)/span};
  const center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
  for(const [key,value] of Object.entries({
    x1:center.x-normal.x*1000,y1:center.y-normal.y*1000,
    x2:center.x+normal.x*1000,y2:center.y+normal.y*1000,
  }))torsoMaterial.gradient.setAttribute(key,value);
  torsoMaterial.lower.forEach(stop=>stop.setAttribute('stop-color',color));
  node.setAttribute('fill',patterned?widePantsPaint():'url(#torso-material)');
  if(patterned&&torsoMaterial.fabric){
    const right={x:normal.y,y:-normal.x};
    torsoMaterial.fabric.setAttribute('patternTransform',
      `matrix(${right.x} ${right.y} ${normal.x} ${normal.y} ${center.x} ${center.y})`);
    const corner=(side,depth)=>`${center.x+right.x*side*1000-normal.x*depth} ${center.y+right.y*side*1000-normal.y*depth}`;
    torsoMaterial.upperClip.setAttribute('points',
      [corner(-1,0),corner(1,0),corner(1,2000),corner(-1,2000)].join(' '));
    torsoMaterial.upperSkin.setAttribute('d',node.getAttribute('d'));
  }
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
    ||selectedDecorations.pants==='navy-jumpsuit';
}
const widePantFlares = {'wide-pants':5.5,'loose-wide-pants':10.5};
// Same knee-length cut as the fitted shorts, widening toward its open hem.
// How much each flared knee cut widens towards its hem.
const kneeShortFlares={'wide-shorts':10};
function wideShortsExtraWidth(index,flare=10) {
  return flare*smooth(Math.min(index,19)/19);
}
function wideLegExtraWidth(index,flare=5.5) {
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
function wideLegHemPath(shape,flare=5.5,legs=100) {
  const [a,b]=wideLegHemPoints(shape,flare,legs);
  return `M${clean(a.x)} ${clean(a.y)}L${clean(b.x)} ${clean(b.y)}`;
}
// A short ankle continues the foot's own upright direction. Its width and
// direction never depend on the flared trouser opening.
function extendedShoe(shape) {
  const point=p=>`${clean(p.x)} ${clean(p.y)}`;
  const extension=3;
  const outer={x:shape.bootOuter.x+shape.shoeUp.x*extension,
    y:shape.bootOuter.y+shape.shoeUp.y*extension};
  const inner={x:shape.bootInner.x+shape.shoeUp.x*extension,
    y:shape.bootInner.y+shape.shoeUp.y*extension};
  const outline=shape.bootOutline.replace(/^M[^C]+/,
    `M${point(outer)}L${point(shape.bootOuter)}`)+`L${point(inner)}`;
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
function trouserCalfEdges(shape,flare=0,legs=100) {
  return [-1,1].map(side=>{
    const points=[];
    for(let i=19;i<=32;i++) {
      const point=i===32&&flare?wideLegEnd(shape,legs):shape.centerline[i];
      // Match the hem tangent exactly at the terminal corner.
      const before=shape.centerline[i===32&&flare?30:i-1];
      const after=i===32?point:shape.centerline[i+1];
      const length=Math.hypot(after.x-before.x,after.y-before.y)||1;
      const radius=(shape.hose[Math.min(i,31)].width+1
        +(flare?wideLegExtraWidth(Math.min(i,31),flare):0))/2;
      points.push({x:point.x+side*(after.y-before.y)/length*radius,
        y:point.y-side*(after.x-before.x)/length*radius});
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
function placeOuterwearOverNeckline() {
  // Shirt neckline strokes live in neckOverlay so the head cannot erase
  // them. Keep the jacket panels after those strokes, but below the scarf.
  const scarf=scarfPaths[0]?.node||null;
  for(const key of ['greenVestLeft','greenVestRight'])
    neckOverlay.insertBefore(garmentPaths[key],scarf);
}
function pantsCoverThigh() {
  return wearingJumpsuit()||!!widePantFlares[selectedDecorations.pants]
    ||['plain','pink-shorts','orange-shorts','black-shorts','wide-shorts'].includes(selectedDecorations.pants);
}
function buttOutlineOpacity(side) {
  // The raised trouser or shorts leg supplies this hip contour itself. The
  // body's curved outline must not run across the fabric at the seam.
  // A continuous fabric surface has no visible torso/thigh join, even
  // below the promotion threshold. Briefs retain their actual skin boundary.
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
function visiblePantsSide(side,geometry,warp) {
  const source=side==='left'
    ?[[27.7,110.5],[28.4591,125.881]]
    :[[65.9,110.5],[65.8486,125.059]];
  const pointAt=t=>{
    const x=lerp(source[0][0],source[1][0],t);
    const y=lerp(source[0][1],source[1][1],t);
    const role=classifyPoint(x,y,'mixed');
    return applyDragPose(warp(x,y,role),x,y,role,warp);
  };
  const start=pointAt(0),end=pointAt(1);
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
    if(!poses.length||!selectedDecorations.pants
      ||wearingJumpsuit()) {
      legInFront[side]=false;
      continue;
    }
    const {hip,ankle,knee,restLength}=shapes[side];
    const ankleHeight=(ankle.x-hip.x)*down.x+(ankle.y-hip.y)*down.y;
    const lateral=(ankle.x-hip.x)*right.x+(ankle.y-hip.y)*right.y;
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
  if(sleeveless&&armInFront[side]) rootBlack.removeAttribute('mask');
  else rootBlack.setAttribute('mask',mask);
  if(sleeveless&&!armInFront[side]) skinRoot.setAttribute('mask',mask);
  else skinRoot.removeAttribute('mask');
}
function topCoversPants() {
  const id=selectedDecorations.shirt;
  return !!id&&!['plain','blue-vest','red-tee','red-triangle'].includes(id);
}
function updateGarmentOrder() {
  const upper=['shirt','shirtSides','vest','vestSides','vestNeck',
    'vestTopLeft','vestTopRight','vestShoulderLeft','vestShoulderRight',
    'tee','teeSides','patchblue','patchred','patchstitches','redTriangle','waist'];
  const lower=['jumpsuit','jumpsuitSides','jumpsuitCrotch','jumpsuitChestOutline',
    'pants','pantsSides','pantsCrotch','shorts','shortsSides','shortsCrotch',
    'pantsWaist','redThong','skirt','jumpsuitNeckLeft','jumpsuitNeckRight',
    'jumpsuitShoulderLeft','jumpsuitShoulderRight'];
  for(const key of (topCoversPants()?[...lower,...upper]:[...upper,...lower])) {
    const node=garmentPaths[key];
    if(node?.parentNode===outfitOverlay)outfitOverlay.appendChild(node);
  }
  // Moving calves still cover the fabric in a fold; the jacket remains in
  // neckOverlay above both the loose shirt and trousers.
  for(const {calfOverlay} of legParts)outfitOverlay.appendChild(calfOverlay);
}
function updatePartOrder() {
  if (!partLayers.body) return;
  const sleeveless=hasSleevelessOutfit();
  const ordered = [...layerOrder];
  for (const pose of dragPoses) {
    const part = pose.part.replace('Wrist','Hand');
    // Separate trousers and shorts cover a low thigh root. Keep that leg
    // ahead of its partner but under the clothes until it rises in front.
    if(part.endsWith('Leg')&&selectedDecorations.pants
      &&!wearingJumpsuit()
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
      &&(!selectedDecorations.pants||wearingJumpsuit()||legInFront[side]))
      svg.appendChild(partLayers[part]);
  }
  // Palm and forearm end up above everything, a dragged leg included: a leg
  // swung across the body must not cut through the hand. That leaves the
  // garment below a resting arm, but it still reads as covering the shoulder
  // because applyArmOcclusion masks the arm's root away there — the look never
  // depended on the garment sitting on top, only on that mask.
  if(sleeveless||selectedDecorations.pants==='skirt') for(const part of ordered)
    if(part.endsWith('Hand')) svg.appendChild(partLayers[part]);
  // The neck accessory stays above everything the arm has not reached. Once an
  // arm swings up past the shoulder line it passes in front of the scarf, so
  // it goes back on top; swung low it stays tucked behind, as before.
  if(neckOverlay) svg.appendChild(neckOverlay);
  for(const part of ordered)
    if(part.endsWith('Hand')&&armRaised[part.replace('Hand','')])
      svg.appendChild(partLayers[part]);
  // While the pointer actually holds a leg, that whole leg -- thigh, shin and
  // foot share one group -- rides above everything, hands included, so the
  // limb being moved is never cut by an arm.
  if(activeDrag?.pose.part.endsWith('Leg'))
    svg.appendChild(partLayers[activeDrag.pose.part]);
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
function createWalkMotion(direction = 1, cycles = 2) {
  // Timings and amplitudes come from a recorded single step: the swing lasts
  // about .6s and the foot then stays planted about .9s, and the foot travels
  // some 60 units from behind the hip to well in front of it. The earlier
  // 28-unit stride over a 1.32s cycle read as shuffling on the spot.
  const cycleDuration = 1.15, entry = .3, exit = .36;
  const samplesPerCycle = 90;
  const tracks = Object.fromEntries(
    ['leftLeg', 'rightLeg', 'leftHand', 'rightHand', 'head'].map(part => [part, []]));
  const ease = t => t * t * (3 - 2 * t);
  // Measured ceiling: a leg pose beyond about 40 units starts carrying the
  // hips along with it (48 shifts them by 7), which would turn walking in
  // place into a slide. With the 16-unit stance offset that caps the swing
  // at 24 either side of it, and it is the stride the recorded step reaches
  // before the body itself begins to travel.
  const back = 24, front = 24, lift = 15, closingLift = 9;
  // Walking right leaves the left toe trailing; walking left it is the right
  // one. That foot is the one mirrored for the walk, and the one given the
  // lifted closing step so it can turn back in the air.
  const turningLeg = direction > 0 ? 'leftLeg' : 'rightLeg';
  const foot = phase => {
    phase = ((phase % 1) + 1) % 1;
    // Swing occupies 40% of the stride. The remaining 60% is support:
    // the planted foot travels backwards relative to the walking body.
    if (phase < .4) {
      const t = phase / .4;
      // The recorded foot hangs high until roughly 60% through the swing and
      // only then reaches for the ground, so the peak sits late, not mid-air.
      return [-back + (back + front) * ease(t),
        -lift * Math.sin(Math.PI * t ** 1.3) ** 2];
    }
    return [front - (back + front) * (phase - .4) / .6, 0];
  };
  const mirror = poses => direction > 0 ? poses : {
    leftLeg: [-poses.rightLeg[0], poses.rightLeg[1]],
    rightLeg: [-poses.leftLeg[0], poses.leftLeg[1]],
    leftHand: [-poses.rightHand[0], poses.rightHand[1]],
    rightHand: [-poses.leftHand[0], poses.leftHand[1]],
    head: [-poses.head[0], poses.head[1]],
  };
  const gait = phase => {
    const left = foot(phase), right = foot(phase + .5);
    const arm = Math.cos(2 * Math.PI * (phase - .2));
    return mirror({
      // Narrow the wide resting stance before walking. Both feet then
      // follow the same forward swing instead of opening out sideways.
      leftLeg: [16 + left[0], left[1]],
      rightLeg: [-16 + right[0], right[1]],
      // A longer stride carries more arm with it.
      leftHand: [-14 * arm, -3 - 3 * arm],
      rightHand: [14 * arm, -3 + 3 * arm],
      // Weight drops just after contact and rises over the supporting leg.
      head: [4 + 2 * Math.sin(phase * 2 * Math.PI),
        -3 + 2 * Math.cos(4 * Math.PI * (phase - .43))],
    });
  };
  const add = (time, poses, weight = 1) => {
    for (const [part, values] of Object.entries(poses)) {
      tracks[part].push([Number(time.toFixed(6)),
        ...values.map(value => Number((value * weight).toFixed(6))), 0]);
    }
  };
  // Entry and exit keep the gait running while its amplitude grows and
  // fades. Holding gait(0) instead left the right foot, which is exactly at
  // rest on that phase, standing still for the whole .45s exit — a visible
  // freeze on one leg. Running the phase on means both feet keep moving and
  // the last step simply shrinks until it is the resting stance again.
  for (let i = 0; i < 16; i++) {
    add(entry * i / 16, gait((i / 16 - 1) * entry / cycleDuration), ease(i / 16));
  }
  for (let i = 0; i <= cycles * samplesPerCycle; i++) {
    add(entry + i * cycleDuration / samplesPerCycle, gait(i / samplesPerCycle));
  }
  const gaitEnd = entry + cycles * cycleDuration;
  for (let i = 1; i <= 20; i++) {
    const u = i / 20;
    const poses = gait(u * exit / cycleDuration);
    const scaled = Object.fromEntries(Object.entries(poses).map(([part, values]) =>
      [part, values.map(value => value * (1 - ease(u)))]));
    // The closing step lifts the left foot clear of the ground, outside the
    // fading amplitude, so it can turn back to its resting direction in the
    // air rather than pivoting while flat on the floor.
    scaled[turningLeg][1] -= closingLift * Math.sin(Math.PI * u) ** 2;
    add(entry + cycles * cycleDuration + exit * u, scaled);
  }
  // The art splays both feet outwards, so walking right leaves the left toe
  // pointing backwards and the two shoes merge into a blob wherever the legs
  // cross. Turn that foot to face the travel direction for the walk and give
  // it back afterwards. Turning mirrors the shoe, which foreshortens as it
  // goes round, so both turns are timed onto a foot that is in the air: the
  // first swing on the way in, the lifted closing step on the way out.
  // Within that first swing the turn waits until the foot has passed the
  // other leg and is on its way down — turning it the moment it leaves the
  // ground reads as the foot starting out backwards and correcting itself.
  const swing = .4 * cycleDuration;
  const walkToe = {
    [turningLeg]: [[0,0], [entry + .5 * swing, 0], [entry + .82 * swing, 1],
      [gaitEnd + .15 * exit, 1], [gaitEnd + .7 * exit, 0],
      [gaitEnd + exit, 0]],
  };
  return {
    id: direction > 0 ? 'walk-right' : 'walk-left',
    name: `${direction > 0 ? '向右' : '向左'}走路（${cycles * 2}步）`,
    duration: gaitEnd + exit,
    // Signed: the knees bend the way the character travels.
    walkBlend: [[0,0], [entry,direction], [gaitEnd,direction],
      [gaitEnd + exit,0]],
    walkToe,
    // Entry ramp, repeated gait, closing step. See `loops` below.
    loops: [{start: entry, end: gaitEnd, cycle: cycleDuration}],
    eased: true,
    tracks,
  };
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

function update() {
  if (!svg) return;
  const config = Object.fromEntries(
    Object.entries(controls).map(([key, input]) => [key, Number(input.value)])
  );
  const warp = buildWarp(config);
  const basePoints = [];
  const armShapes = { left: armGeometry('left', warp), right: armGeometry('right', warp) };
  updateArmOcclusion(armShapes);

  paths.forEach(({ node, original, role, index }) => {
    const transformed = transformPath(original, (x, y) => {
      const pointRole = role.startsWith('helmet-') ? 'helmet' : classifyPoint(x, y, role);
      const point = warp(x, y, pointRole);
      basePoints.push(point.x, point.y);
      return applyDragPose(point, x, y, pointRole, warp);
    });
    node.setAttribute('d', transformed);
    if(index===1||index===-1&&node.getAttribute('stroke')==='none')
      node.setAttribute('fill',skinColor());
    if(index===8)node.setAttribute('fill',selectedDecorations.skin==='milk-frog'?milkFrogColors.eye:'white');
  });
  scarfPaths.forEach(({node})=>{
    node.style.display=selectedDecorations.neck==='scarf'?'':'none';
  });

  const legShapes = {left:legGeometry('left',warp),right:legGeometry('right',warp)};
  updateLegOcclusion(legShapes,warp);
  const crouch=smooth(bodyCompression(warp).amount/legCompressionLimit(warp).limit);
  const teeStyle=teeStyles[selectedDecorations.shirt];
  const isTee=!!teeStyle;
  const wideFlare=widePantFlares[selectedDecorations.pants]||0;
  const widePants=wideFlare>0;
  const kneeShortColors={
    'pink-shorts':decorationColors.pinkShorts,
    'orange-shorts':decorationColors.orangeShorts,
    'black-shorts':decorationColors.blackShorts,
    'wide-shorts':decorationColors.wideShorts,
  };
  legParts.forEach(({segments,bootFill,bootOutline,
      shoeCuff,shortHem,bootTop,wideHem,shortsClip,skinClip,wideClip,ankleClip,
      calfEdges,calfOverlay,fabricLayers,fabricMasks,crease,
      side,group,thighBlack,shinBlack,thighSkin,shinSkin})=>{
    const shape=legShapes[side];
    const kneeShorts=!!kneeShortColors[selectedDecorations.pants];
    const shortsFlare=kneeShortFlares[selectedDecorations.pants]||0;
    const wideShorts=shortsFlare>0;
    const splitCloth=pantsCoverThigh();
    const wearingTallBoots=selectedDecorations.shoes==='brown-boots';
    // A wide trouser keeps its full width and fabric over the boot shaft.
    // Other trousers tuck into the boot, which replaces the lower leg.
    const tallBoots=wearingTallBoots&&!widePants;
    const continuousCalf=splitCloth&&!kneeShorts&&!tallBoots;
    // A bare calf under shorts also ends at the shoe mouth. Its front-layer
    // copy must not redraw the tube's rounded underside over the foot.
    const ankleBound=(continuousCalf||kneeShorts||selectedDecorations.pants==='skirt')&&!tallBoots&&!widePants;
    calfEdges.setAttribute('d',trouserCalfEdges(shape,wideFlare,config.legs));
    calfEdges.style.display=continuousCalf?'':'none';
    // The flared leg passes in front of the shoe upper. In other outfits the
    // shoe sits on top of the limb instead.
    const shoeAnchor=widePants&&!tallBoots?shinBlack:shoeCuff;
    group.insertBefore(bootFill,shoeAnchor);
    group.insertBefore(bootOutline,shoeAnchor);
    // A folded calf covers the hidden part of the shorts cuff. Paint the
    // colored thigh and its hem first, then the calf, so the hem cannot
    // continue across the visible skin as a second diagonal.
    const layers=splitCloth
      ?[thighBlack,thighSkin,fabricLayers[0].group,shortHem,
        shinBlack,shinSkin,fabricLayers[1].group,calfEdges]
      :[thighBlack,shinBlack,thighSkin,shinSkin,shortHem,
        ...fabricLayers.map(layer=>layer.group)];
    layers.forEach(layer=>group.insertBefore(layer,crease));
    shortsClip.setAttribute('points',limbClipPoints(shape,19,false));
    skinClip.setAttribute('points',limbClipPoints(shape,19,true));
    wideClip.setAttribute('points',legEndClipPoints(shape,config.legs));
    ankleClip.setAttribute('points',ankleHemClipPoints(shape));
    if(ankleBound)
      calfOverlay.setAttribute('clip-path',`url(#${side}-ankle-hem-clip)`);
    else calfOverlay.removeAttribute('clip-path');
    // Side-edge samples may reach past the hem during compression. Clip
    // the whole open contour, including its stroke, at the fabric endpoint.
    if(widePants&&!tallBoots)
      calfEdges.setAttribute('clip-path',`url(#${side}-wide-hem-clip)`);
    else if(continuousCalf)calfEdges.setAttribute('clip-path',`url(#${side}-ankle-hem-clip)`);
    else calfEdges.removeAttribute('clip-path');
    // Clip the complete calf, including later round caps that can reach back
    // across the knee. The individual hem clips still trim the distal end.
    for(const node of [shinBlack,shinSkin,fabricLayers[1].group]) {
      if(splitCloth)node.setAttribute('clip-path',`url(#${side}-skin-hem-clip)`);
      else node.removeAttribute('clip-path');
    }
    // The folded calf is in front of the pelvis. Reuse the actual rendered
    // calf (including its fabric) above the waist fill, rather than repainting
    // isolated lines that the pelvis can cut into rectangular fragments.
    calfOverlay.style.display=splitCloth&&shape.creaseOpacity>.55?'':'none';
    segments.forEach(({back,front},i)=>{
      const segmentPath=widePants&&!tallBoots&&i===31
        ?wideLegLastPath(shape,config.legs):shape.hose[i].d;
      back.setAttribute('d',segmentPath);
      if(i===0)back.setAttribute('stroke-linecap',shape.lifted?'round':'butt');
      // Continuous cloth still needs overlapping round segment caps. Butt
      // caps leave the wider black stroke exposed between adjacent samples,
      // producing small knee slashes even with no visible fold line.
      // The shared half-plane clips, rather than those caps, define the join.
      const cuffBoundary=(kneeShorts||tallBoots)&&i>=16&&i<=23;
      if(i!==0) back.setAttribute('stroke-linecap',cuffBoundary||i===31?'butt':'round');
      front.setAttribute('stroke-linecap',cuffBoundary||i===31?'butt':'round');
      const nearHem=i>=13&&i<=26;
      const clip=widePants&&!tallBoots&&i>=24
        ?`url(#${side}-wide-hem-clip)`
        :ankleBound&&i>=24
          ?`url(#${side}-ankle-hem-clip)`
        :(splitCloth||tallBoots)&&nearHem
          ?`url(#${side}-${i<19?'shorts':'skin'}-hem-clip)`:null;
      for(const node of [back,front]) {
        if(clip) node.setAttribute('clip-path',clip);
        else node.removeAttribute('clip-path');
      }
      // The fill covers the middle of the black stroke, so it needs two
      // extra units to leave a one-unit outline on each side like the SVG.
      // The body fill masks part of the black underside near a folded hip.
      // Restore that lost ink along the round upper-leg contour only.
      const roundedHipInk=crouch*.75*(1-smooth(i/16));
      const wideExtra=wideShorts&&i<19?wideShortsExtraWidth(i,shortsFlare)
        :widePants&&!tallBoots?wideLegExtraWidth(i,wideFlare):0;
      back.setAttribute('stroke-width',shape.hose[i].width+2+roundedHipInk+wideExtra);
      front.setAttribute('d',segmentPath);
      front.setAttribute('stroke-width',shape.hose[i].width+wideExtra);
      const legColor=tallBoots&&i>=19
        ? decorationColors.brownBoots
        : wearingJumpsuit()
          ? selectedDecorations.pants==='navy-jumpsuit'
            ? decorationColors.navyJumpsuit:decorationColors.jumpsuit
        : selectedDecorations.pants==='plain' ? decorationColors.pants
        : widePants ? widePantsPaint()
        : kneeShorts&&i<19?kneeShortColors[selectedDecorations.pants]:skinColor();
      const patterned=selectedDecorations.pants==='loose-wide-pants'&&!(tallBoots&&i>=19);
      front.setAttribute('stroke',patterned?'#607e79':legColor);
      // Preserve both side edges explicitly; removing a whole thigh-shaped
      // area from the black tube also erased the inner fold and outer border.
      back.style.display=continuousCalf&&i>=19?'none':'';

      for(const [part,fabricMask] of fabricMasks[i].entries()){
      fabricMask.setAttribute('stroke',part!==(i<19?0:1)||tallBoots&&i>=19?'none':'white');
      for(const name of ['d','stroke-width','stroke-linecap','clip-path']){
        const value=front.getAttribute(name);
        if(value!==null)fabricMask.setAttribute(name,value);
        else fabricMask.removeAttribute(name);
      }
      }

    });
    const patterned=selectedDecorations.pants==='loose-wide-pants';
    const fabricPaths=patterned?legFabricPaths(shape,side,config.legs):null;
    fabricLayers.forEach(({group,nodes},part)=>{
      group.style.display=patterned&&!(tallBoots&&part===1)?'':'none';
      if(patterned){
        while(nodes.length<fabricPaths[part].length){
          const path=document.createElementNS(SVG_NS,'path');group.appendChild(path);nodes.push(path);
        }
        nodes.forEach((node,i)=>{
          const patch=fabricPaths[part][i];node.setAttribute('d',patch?.d||'');
          if(patch)node.setAttribute('fill',patch.color);
        });
      }
    });
    const shoe=widePants&&!tallBoots?extendedShoe(shape):{fill:shape.bootFill,outline:shape.bootOutline};
    bootFill.setAttribute('d',shoe.fill);
    bootFill.setAttribute('fill',wearingTallBoots?decorationColors.brownBoots
      :selectedDecorations.shoes?decorationColors.shoes:skinColor());
    bootOutline.setAttribute('d',shoe.outline);
    shoeCuff.style.display=!tallBoots&&!widePants&&(selectedDecorations.shoes
      ||selectedDecorations.pants==='plain'
      ||wearingJumpsuit())?'':'none';
    shoeCuff.setAttribute('d',`M${clean(shape.bootOuter.x)} ${clean(shape.bootOuter.y)}`
      +`L${clean(shape.bootInner.x)} ${clean(shape.bootInner.y)}`);
    // The calf is painted over this line and hides its lower half. Shift the
    // one-unit stroke half a unit into the shorts so a full-width black edge
    // remains visible without making the stroke itself thicker.
    shortHem.setAttribute('d',cuffPath(shape,19,wideShorts?wideShortsExtraWidth(19,shortsFlare)
      :widePants&&!tallBoots?wideLegExtraWidth(19,wideFlare):0,.5));
    // A full-length trouser has no transverse cuff at the knee. Its visible
    // fold comes from the calf side contour after thigh/calf occlusion.
    shortHem.style.display=kneeShorts&&!tallBoots?'':'none';
    bootTop.setAttribute('d',cuffPath(shape,19));
    bootTop.style.display=tallBoots?'':'none';
    wideHem.setAttribute('d',wideLegHemPath(shape,wideFlare||5.5,config.legs));
    wideHem.style.display=widePants&&!tallBoots?'':'none';
    crease.setAttribute('d',shape.crease);
    crease.style.opacity='1';
    crease.style.display=!splitCloth&&shape.creaseOpacity>.55?'':'none';
  });
  const torso=paths.find(p=>p.index===-1 && p.role==='mixed' && p.node.getAttribute('fill')!=='none');
  updateTorsoMaterial(torso.node,warp);
  if(bellyPatch){
    bellyPatch.setAttribute('d',torsoGarmentPath(milkFrogBellySource,warp));
    bellyClip.setAttribute('d',torso.node.getAttribute('d'));
    bellyPatch.style.display=selectedDecorations.skin==='milk-frog'?'':'none';
  }
  garmentPaths.pants.setAttribute('d',garmentPath(pantsSource,warp));
  garmentPaths.pants.setAttribute('fill',widePants?widePantsPaint():decorationColors.pants);
  garmentPaths.pants.style.display=selectedDecorations.pants==='plain'||widePants?'':'none';
  garmentPaths.pantsSides.setAttribute('d',garmentPath(pantsSidesSource,warp));
  garmentPaths.pantsSides.style.display=selectedDecorations.pants==='plain'||widePants?'':'none';
  garmentPaths.pantsCrotch.setAttribute('d',garmentPath(pantsCrotchSource,warp));
  garmentPaths.pantsCrotch.style.display=selectedDecorations.pants==='plain'||widePants?'':'none';
  const wearingSkirt=selectedDecorations.pants==='skirt';
  const shorts=selectedDecorations.pants==='red-shorts'
    ||selectedDecorations.pants==='pink-shorts'
    ||selectedDecorations.pants==='orange-shorts'
    ||selectedDecorations.pants==='black-shorts'
    ||selectedDecorations.pants==='wide-shorts';
  garmentPaths.shorts.setAttribute('d',garmentPath(pantsSource,warp));
  garmentPaths.shorts.setAttribute('fill',selectedDecorations.pants==='red-shorts'
    ?decorationColors.redShorts:kneeShortColors[selectedDecorations.pants]
      ||decorationColors.pinkShorts);
  garmentPaths.shorts.style.display=shorts?'':'none';
  garmentPaths.shortsSides.setAttribute('d',garmentPath(pantsSidesSource,warp));
  garmentPaths.shortsSides.style.display=shorts?'':'none';
  garmentPaths.shortsCrotch.setAttribute('d',garmentPath(
    selectedDecorations.pants==='red-shorts'?shortsLowerSource:pantsCrotchSource,warp));
  garmentPaths.shortsCrotch.style.display=shorts?'':'none';
  garmentPaths.skirt.setAttribute('d',skirtPath(warp,config.legs));
  garmentPaths.skirt.style.display=wearingSkirt?'':'none';
  garmentPaths.redThong.setAttribute('d',torsoGarmentPath(redThongSource(config.legs),warp));
  garmentPaths.redThong.style.display=selectedDecorations.pants==='red-thong'?'':'none';
  garmentPaths.redTriangle.setAttribute('d',torsoGarmentPath(redTriangleSource,warp,true));
  garmentPaths.redTriangle.style.display=selectedDecorations.shirt==='red-triangle'?'':'none';
  garmentPaths.shirt.setAttribute('d',garmentPath(shirtSource,warp));
  garmentPaths.shirt.style.display=selectedDecorations.shirt==='plain'?'':'none';
  garmentPaths.shirtSides.setAttribute('d',garmentPath(shirtSidesSource,warp));
  garmentPaths.shirtSides.style.display=selectedDecorations.shirt==='plain'?'':'none';
  const isVest=selectedDecorations.shirt==='blue-vest';
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
    transformPath(shirtTopSource,
      (x,y)=>applyDragPose(warp(x,y,'head'),x,y,'head',warp)));
  garmentPaths.shirtTop.style.display=selectedDecorations.shirt==='plain'?'':'none';
  garmentPaths.tee.setAttribute('d',teeStyle?.loose?looseTopPath(looseTopSource,warp):garmentPath(
    selectedDecorations.shirt==='red-tee'?redTeeSource:teeSource,warp));
  garmentPaths.tee.setAttribute('fill',teeStyle?.color||decorationColors.yellowTee);
  garmentPaths.tee.style.display=isTee?'':'none';
  garmentPaths.teeSides.setAttribute('d',teeStyle?.loose?looseTopPath(looseTopSidesSource,warp):garmentPath(shirtSidesSource,warp));
  garmentPaths.teeSides.style.display=isTee?'':'none';
  garmentPaths.teeNeck.setAttribute('d',garmentPath(
    selectedDecorations.shirt==='red-tee'?redTeeNeckSource:teeNeckSource,warp));
  garmentPaths.teeNeck.style.display=isTee?'':'none';
  for(const side of ['left','right']) {
    const suffix=side==='left'?'Left':'Right';
    const top=transformPath(vestTopSources[side],
      (x,y)=>applyDragPose(warp(x,y,'head'),x,y,'head',warp));
    garmentPaths['vestTop'+suffix].setAttribute('d',
      top);
    garmentPaths['vestTop'+suffix].style.display=isVest?'':'none';
    garmentPaths['teeTop'+suffix].setAttribute('d',top);
    garmentPaths['teeTop'+suffix].style.display=isTee?'':'none';
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
  garmentPaths.waist.setAttribute('d',teeStyle?.loose?looseTopPath(looseTopHemSource,warp):garmentPath(isVest?vestHemSource
    :selectedDecorations.shirt?shirtHemSource:pantsWaistSource,warp));
  // The dungarees draw their own outline, so the waistband belongs to the
  // plain pieces only.
  garmentPaths.waist.style.display=selectedDecorations.shirt==='plain'
    ||isVest||isTee?'':'none';
  garmentPaths.pantsWaist.setAttribute('d',garmentPath(pantsWaistSource,warp));
  garmentPaths.pantsWaist.style.display=selectedDecorations.pants==='plain'||widePants||shorts?'':'none';
  garmentPaths.jumpsuit.setAttribute('d',garmentPath(jumpsuitSource,warp));
  garmentPaths.jumpsuit.setAttribute('fill',selectedDecorations.pants==='navy-jumpsuit'
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
    path.setAttribute('d',torso.node.getAttribute('d'));
    rootPath.setAttribute('d',torso.node.getAttribute('d'));
  });
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
  torsoSideOutline.style.display=wearingJumpsuit()?'none':'';
  const pantsSides=['left','right'].map(side=>
    visiblePantsSide(side,legShapes[side],warp)).join('');
  garmentPaths.pantsSides.setAttribute('d',pantsSides);
  garmentPaths.shortsSides.setAttribute('d',pantsSides);
  buttOutlines.forEach(({side,node})=>{
    node.style.opacity=String(buttOutlineOpacity(side));
  });

  armParts.forEach(({side,segments,rootBlack,skinRoot,sleeveClip,skinClip,crease,cuff,handFill,handOutline,
      handSource})=>{
    const shape=armShapes[side];
    const sleeveEnd=teeStyle?.sleeveEnd||31;
    const flare=teeStyle?.flare||0;
    applyArmOcclusion(side,rootBlack,skinRoot);
    sleeveClip.setAttribute('points',limbClipPoints(shape,sleeveEnd,false));
    skinClip.setAttribute('points',limbClipPoints(shape,sleeveEnd,true));
    segments.forEach(({back,front},i)=>{
      back.setAttribute('d',shape.hose[i].d);
      const sleeveBoundary=isTee&&i>=sleeveEnd-4&&i<=sleeveEnd+6;
      back.setAttribute('stroke-linecap',sleeveBoundary?'butt':i===0||i===31?'butt':'round');
      front.setAttribute('stroke-linecap',sleeveBoundary?'butt':i===0||i===31?'butt':'round');
      // Clip only the spans whose round ends can reach the seam. A curled
      // forearm may cross back over the shoulder side and must stay visible.
      const nearCuff=i>=sleeveEnd-7&&i<=sleeveEnd+6;
      const clip=isTee&&nearCuff
        ?`url(#${side}-${i<sleeveEnd?'sleeve':'skin'}-clip)`:null;
      if(clip) { back.setAttribute('clip-path',clip);front.setAttribute('clip-path',clip); }
      else { back.removeAttribute('clip-path');front.removeAttribute('clip-path'); }
      // The fill covers the middle of the black stroke, so it needs two extra
      // units to leave a one-unit outline on each side like the SVG.
      const shortSleeve=isTee&&i<sleeveEnd;
      const sleeveFlare=sleeveExtraWidth(i,sleeveEnd,flare);
      back.setAttribute('stroke-width',shape.hose[i].width+2+sleeveFlare);
      front.setAttribute('d',shape.hose[i].d);
      front.setAttribute('stroke-width',shape.hose[i].width+sleeveFlare);
      const sleeveColor=selectedDecorations.shirt==='plain'
        ? decorationColors.shirt
        : shortSleeve?teeStyle.color:skinColor();
      front.setAttribute('stroke',sleeveColor);
    });
    cuff.style.display=selectedDecorations.shirt==='plain'||isTee?'':'none';
    cuff.setAttribute('d',cuffPath(shape,sleeveEnd,flare));
    crease.setAttribute('d',shape.crease);
    crease.style.display=shape.creaseOpacity>.55?'':'none';
    handFill.setAttribute('d',transformPath(handSource.handFill,shape.handPoint));
    handFill.setAttribute('fill',selectedDecorations.gloves
      ? decorationColors.gloves : skinColor());
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
    const originalCenter = warp(ellipse.originalCx, ellipse.originalCy, 'head');
    const center = applyDragPose(
      originalCenter,
      ellipse.originalCx,
      ellipse.originalCy,
      'head',
      warp
    );
    const scale = config.head / 100;
    ellipse.node.setAttribute('cx', clean(center.x));
    ellipse.node.setAttribute('cy', clean(center.y));
    ellipse.node.setAttribute('rx', clean(ellipse.originalRx * scale));
    ellipse.node.setAttribute('ry', clean(ellipse.originalRy * scale));
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
}

function resetControls() {
  stopMotion();
  clearDragPose();
  Object.values(controls).forEach(input => { input.value = 100; });
  for (const category of Object.keys(selectedDecorations)) {
    selectedDecorations[category] = category === 'helmet' ? 'plain' : null;
  }
  setHatSelection('plain');
  update();
}

function renderDecorationOptions() {
  const selected=selectedDecorations[activeDecorationCategory];
  decorationOptions.innerHTML = [
    `<button type="button" class="decoration-option" data-option="none" aria-pressed="${!selected}"><span class="empty-icon" aria-hidden="true">—</span><span>${activeDecorationCategory==='suit'?'不使用套装':activeDecorationCategory==='skin'?'默认肤色':'不穿戴'}</span></button>`,
    ...decorationCatalog[activeDecorationCategory].map(({id,name,icon})=>
      `<button type="button" class="decoration-option" data-option="${id}" aria-pressed="${selected===id}"><img src="${icon}" alt="" /><span>${name}</span></button>`),
  ].join('');
}

function applyDecorationSelection(category,value) {
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
    setHatSelection(null);
  } else {
    selectedDecorations.suit=null;
    if(category==='helmet')setHatSelection(value);
    else selectedDecorations[category]=value;
  }
}
function selectDecoration(category, value) {
  applyDecorationSelection(category,value);
  update();
  renderDecorationOptions();
}

function randomizeControls() {
  stopMotion();
  clearDragPose();
  Object.values(controls).forEach(input => {
    const min = Number(input.min);
    const max = Number(input.max);
    input.value = Math.round(min + Math.random() * (max - min));
  });
  update();
}

function setHatSelection(value) {
  selectedDecorations.helmet = value;
  if (value) lastHat=value;
  helmetVisible = value === 'plain';
  paths.filter(path => path.role.startsWith('helmet-')).forEach(({ node }) => {
    if (helmetVisible) node.removeAttribute('display');
    else node.setAttribute('display', 'none');
  });
  // This rim is generated separately from the imported helmet paths.
  // Without toggling it, hiding the shell leaves a line across the neck.
  if (helmetBase) {
    if (helmetVisible) helmetBase.removeAttribute('display');
    else helmetBase.setAttribute('display', 'none');
  }
  hatPaths.forEach(node=>{ node.style.display=value==='yellow-hat'?'':'none'; });
  helmetButton.textContent = value ? '隐藏帽子' : '显示帽子';
  helmetButton.setAttribute('aria-pressed', String(!value));
  if (activeDecorationCategory === 'helmet') renderDecorationOptions();
}

function toggleHelmet() {
  selectedDecorations.suit=null;
  setHatSelection(selectedDecorations.helmet ? null : lastHat);
  update();
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

resetButton.addEventListener('click', resetControls);
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
randomButton.addEventListener('click', randomizeControls);
helmetButton.addEventListener('click', toggleHelmet);
exportButton.addEventListener('click', exportSvg);
decorationTabs.forEach(tab => tab.addEventListener('click', () => {
  activeDecorationCategory = tab.dataset.category;
  decorationTabs.forEach(button => button.setAttribute('aria-selected',
    String(button === tab)));
  renderDecorationOptions();
}));
decorationOptions.addEventListener('click', event => {
  const button = event.target.closest('[data-option]');
  if (button) selectDecoration(activeDecorationCategory,
    button.dataset.option === 'none' ? null : button.dataset.option);
});
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
    svg.append(outfitOverlay,neckOverlay);
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
    const addPath=(d,part,filled,role)=>{
      const node=document.createElementNS(SVG_NS,'path');
      node.setAttribute('fill',filled?'#C5C5C5':'none');
      node.setAttribute('stroke',filled?'none':'black');
      node.setAttribute('stroke-linecap','round');
      node.setAttribute('stroke-linejoin','round');
      partLayers[part].appendChild(node);
      paths.push({node,original:d,role,index:-1});
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
    torsoSideOutline=addPath(leftEdge+rightEdge,'body',false,'mixed');
    addPath(crotch,'body',false,'mixed');
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
    if(ellipse) partLayers.head.appendChild(ellipse.node);
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
      redThong:makeGarment(decorationColors.redThong,true),
      skirt:makeGarment(decorationColors.skirt,true),
    };
    for(const key of ['shirtTop','teeNeck','teeTopLeft','teeTopRight'])
      neckOverlay.insertBefore(garmentPaths[key],neckOverlay.firstChild);
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
    garmentPaths.greenVestLeft=makeGarment(decorationColors.greenVest,true);
    garmentPaths.greenVestRight=makeGarment(decorationColors.greenVest,true);
    placeOuterwearOverNeckline();
    const defs=document.createElementNS(SVG_NS,'defs');
    svg.prepend(defs);
    const bellyClipContainer=document.createElementNS(SVG_NS,'clipPath');
    bellyClipContainer.id='milk-frog-belly-clip';
    bellyClipContainer.setAttribute('clipPathUnits','userSpaceOnUse');
    bellyClip=document.createElementNS(SVG_NS,'path');
    bellyClipContainer.appendChild(bellyClip);defs.appendChild(bellyClipContainer);
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
        return polygon;
      };
      const shortsClip=makeHemClip('shorts');
      const skinClip=makeHemClip('skin');
      const wideClip=makeHemClip('wide');
      const ankleClip=makeHemClip('ankle');
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
        shortHem,calfEdges,crease,bootFill,bootOutline,shoeCuff,bootTop,wideHem);
      const calfOverlay=document.createElementNS(SVG_NS,'g');
      calfOverlay.setAttribute('pointer-events','none');
      calfOverlay.setAttribute('data-calf-overlay',side);
      for(const [index,node] of [shinBlack,shinSkin,fabricLayers[1].group,calfEdges,shoeCuff,bootTop,wideHem].entries()) {
        node.id=`${side}-calf-render-${index}`;
        const copy=document.createElementNS(SVG_NS,'use');
        copy.setAttribute('href',`#${node.id}`);
        calfOverlay.appendChild(copy);
      }
      outfitOverlay.appendChild(calfOverlay);
      legParts.push({segments,bootFill,bootOutline,
        shoeCuff,shortHem,bootTop,wideHem,shortsClip,skinClip,wideClip,ankleClip,
        calfEdges,calfOverlay,fabricLayers,fabricMasks,crease,
        side,group,thighBlack,shinBlack,thighSkin,shinSkin});
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
      const cuff=makePath(false);
      cuff.setAttribute('stroke-width','1');
      const handFill=makePath(true);
      const handOutline=makePath(false);
      group.append(rootBlack,black,skinRoot,skin,crease,cuff,handFill,handOutline);
      armParts.push({side,segments,rootBlack,skinRoot,sleeveClip,skinClip,
        crease,cuff,handFill,handOutline,
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

const wardrobeScroll = document.querySelector('.wardrobe');
let wardrobeScrollTimer;
wardrobeScroll.addEventListener('scroll',()=>{
  wardrobeScroll.classList.add('is-scrolling');
  clearTimeout(wardrobeScrollTimer);
  wardrobeScrollTimer=setTimeout(()=>wardrobeScroll.classList.remove('is-scrolling'),650);
},{passive:true});
