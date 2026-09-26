/** Shared hand-drawn vehicle art. Garage previews and in-game sprites use the
 * same canvas painter and the actual chassis dimensions; no external assets. */
const OUT = '#242c32';
export function color(n) { return typeof n === 'string' ? n : `#${n.toString(16).padStart(6,'0')}`; }
export function tint(n, amount) {
  n = typeof n === 'string' ? parseInt(n.slice(1),16) : n;
  const rgb = [n>>16 & 255,n>>8 & 255,n & 255].map(v=>Math.round(v+(amount>0?255-v:v)*amount));
  return `rgb(${rgb.join(',')})`;
}
function path(c,points,fill,stroke=OUT,width=3) {
  c.beginPath(); points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y)); c.closePath();
  if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.lineWidth=width;c.strokeStyle=stroke;c.stroke();}
}
function line(c,points,stroke=OUT,width=3) {
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=stroke;c.lineWidth=width;c.stroke();
}
function round(c,x,y,w,h,r,fill,stroke=OUT,lw=3){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
function circle(c,x,y,r,fill,stroke=OUT,lw=2){c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
function glass(c,x,y,w,h){const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'#d9fcff');g.addColorStop(.45,'#98daeb');g.addColorStop(1,'#4393af');round(c,x,y,w,h,3,g,OUT,2);line(c,[[x+4,y+h-4],[x+w*.5,y+4]],'#efffff',2);}
function bolt(c,x,y){circle(c,x,y,2,'#cfd4d5','#485157',.8);}
function label(c,text,x,y,size=14,fill='#fff5c8'){c.save();c.font=`900 ${size}px Arial`;c.textAlign='center';c.textBaseline='middle';c.lineWidth=2.5;c.strokeStyle=OUT;c.strokeText(text,x,y);c.fillStyle=fill;c.fillText(text,x,y);c.restore();}
function bodyGradient(c,v){const g=c.createLinearGradient(0,-v.height,0,v.height);g.addColorStop(0,tint(v.color,.32));g.addColorStop(.5,color(v.color));g.addColorStop(1,tint(v.color,-.27));return g;}
function driver(c,x,y,s=1,jacket='#d86936',helmet=false){
  c.save();c.translate(x,y);c.scale(s,s);
  // Seat, bent knees, torso, glove and an expressive profile.
  round(c,-18,15,16,26,5,'#423d37',OUT,2);
  line(c,[[-8,17],[6,27],[18,26],[22,35]],'#293f60',11);
  round(c,-17,-3,20,25,6,jacket,OUT,2);
  line(c,[[-4,3],[9,14],[23,10]],jacket,9);circle(c,24,10,4,'#f6c595',OUT,1);
  round(c,-10,-16,8,13,2,'#e3a475',OUT,1);
  c.beginPath();c.moveTo(-13,-29);c.quadraticCurveTo(0,-39,10,-25);c.lineTo(15,-20);c.lineTo(11,-16);c.quadraticCurveTo(6,-4,-7,-12);c.closePath();c.fillStyle='#f2bd8c';c.fill();c.lineWidth=2;c.strokeStyle=OUT;c.stroke();
  circle(c,-8,-21,3,'#e5a579',null);circle(c,7,-23,1.4,OUT,null);line(c,[[8,-13],[3,-12]],'#86523b',1.2);
  if(helmet){
    c.beginPath();c.arc(-1,-24,16,Math.PI*.9,Math.PI*2.07);c.lineTo(12,-23);c.lineTo(-10,-18);c.closePath();c.fillStyle='#344453';c.fill();c.strokeStyle=OUT;c.stroke();
    path(c,[[0,-31],[16,-28],[17,-23],[2,-23]],'#a3e7f3',OUT,1.5);path(c,[[5,-17],[18,-16],[10,-9],[-1,-11]],jacket,OUT,1.5);
    line(c,[[-10,-32],[2,-37]],'#ffe075',3);
  }else{
    c.beginPath();c.moveTo(-16,-27);c.quadraticCurveTo(-16,-43,0,-39);c.quadraticCurveTo(9,-38,11,-29);c.closePath();c.fillStyle='#e5a844';c.fill();c.strokeStyle=OUT;c.stroke();
    path(c,[[-16,-29],[11,-30],[21,-27],[20,-24],[-16,-25]],'#e0a442',OUT,1.8);
  }
  c.restore();
}
export function driverAnchor(v) {
  if(v.id==='monowheel')return {x:0,y:-58};
  if(v.style==='bike')return {x:-7,y:-v.height/2-49};
  return {x:v.style==='car'?-8:8,y:-v.height/2-29};
}
export function paintWheel(c,r,style='car') {
  c.save();c.lineJoin='round';c.lineCap='round';
  const tire=c.createRadialGradient(-r*.3,-r*.4,r*.1,0,0,r);tire.addColorStop(0,'#536069');tire.addColorStop(.7,'#283137');tire.addColorStop(1,'#12191f');
  circle(c,0,0,r,tire,'#10171b',2.5);circle(c,0,0,r-4,null,'#73808a',1.5);
  const count=style==='race'?22:18;
  for(let i=0;i<count;i++){c.save();c.rotate(i*Math.PI*2/count);round(c,-2,-r+1,4,style==='monster'?8:5,1,'#4c5559',null);c.restore();}
  const rim=c.createLinearGradient(-r,-r,r,r);rim.addColorStop(0,'#f6fcff');rim.addColorStop(.45,'#9baeba');rim.addColorStop(1,'#506875');
  const rr=r*(style==='bike'?.79:.6);circle(c,0,0,rr,rim,'#131f29',2);circle(c,0,0,rr-3,'#526975','#d6e3eb',1);
  const spokes=style==='bike'?12:6;
  for(let i=0;i<spokes;i++){c.save();c.rotate(i*2*Math.PI/spokes);path(c,[[-2,-3],[-2.5,-rr+4],[3,-rr+4],[3,0]],'#d4e1e8','#738999',.8);c.restore();}
  circle(c,0,0,rr*.28,'#e2e9eb','#324951',1.4);circle(c,0,0,2.1,'#44555f',null);
  c.restore();
}
export function paintSpring(c,a,b,width=4,coils=6) {
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<2)return;
  const ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
  line(c,[[a.x,a.y],[b.x,b.y]],'#34393d',6);line(c,[[a.x+2,a.y],[b.x+2,b.y]],'#b8c5c8',2);
  const pts=[[a.x,a.y]];for(let i=1;i<coils*2;i++){const t=i/(coils*2),side=i%2?width:-width;pts.push([a.x+dx*t+nx*side,a.y+dy*t+ny*side]);}pts.push([b.x,b.y]);
  line(c,pts,'#292e31',5);line(c,pts,'#ffd350',2.7);circle(c,a.x,a.y,3,'#cad6d6',OUT,1);circle(c,b.x,b.y,3,'#cad6d6',OUT,1);
}
export function paintBody(c,v){
  c.save();c.lineJoin='round';c.lineCap='round';const a=v.width/2,h=v.height/2,fill=bodyGradient(c,v),bright=tint(v.color,.45),shade=tint(v.color,-.26),id=v.id,style=v.style;
  const bumper=()=>{round(c,-a-8,h-9,17,9,2,'#bec6c8');round(c,a-5,h-9,16,9,2,'#b5c1c4');};
  const stripe=()=>{line(c,[[-a+9,2],[a-16,2]],bright,3);line(c,[[-a+7,h-4],[a-8,h-4]],shade,4);};
  const lamp=()=>{round(c,a-10,-h+8,12,10,3,'#fff5be',OUT,1.4);round(c,-a,-h+10,5,10,1,'#ee5143',OUT,1);};
  const arch=(x,r=25)=>{c.beginPath();c.arc(x,v.clearance,r+6,Math.PI*1.15,Math.PI*1.86);c.strokeStyle=OUT;c.lineWidth=8;c.stroke();c.strokeStyle=bright;c.lineWidth=4;c.stroke();};
  if(id==='monowheel'){
    round(c,-21,28,42,48,13,'#273c47',OUT,3);round(c,-16,34,32,20,5,'#4f7581',null);line(c,[[-12,39],[10,39]],'#9cfcf5',3);
    line(c,[[-9,-3],[-23,23],[-11,62]],'#1e2f4c',12);line(c,[[5,-3],[19,25],[7,62]],'#3f5d7c',12);
    round(c,-19,60,38,7,3,'#1a2732',OUT,2);driver(c,0,-30,.98,color(v.color),true);line(c,[[-10,-16],[-3,3]],color(v.color),12);
    c.restore();return;
  }
  if(style==='bike'){
    const ax=v.axle,cl=v.clearance;
    line(c,[[-ax,cl],[-12,0],[ax,cl],[-ax,cl]],OUT,8);line(c,[[-ax,cl],[-12,0],[ax,cl]],color(v.color),5);
    line(c,[[-ax,cl],[8,13],[ax,cl]],'#8e9ea2',4);
    line(c,[[ax,cl],[ax-12,-h-11],[ax-28,-h-18]],'#bac6cc',7);line(c,[[ax+4,cl],[ax-8,-h-11]],'#405867',2);
    circle(c,-4,8,13,'#a3acb1');line(c,[[-1,1],[-1,15]],'#535c60',5);
    round(c,-30,-h+6,40,13,5,fill);round(c,-28,-h+4,34,6,2,'#202832');
    path(c,[[13,-h+7],[35,-h+10],[45,-h+21],[21,6]],fill);line(c,[[-ax-4,cl-21],[-ax+22,cl-24]],color(v.color),6);
    line(c,[[ax-12,cl-26],[ax+20,cl-23]],color(v.color),6);
    if(id==='quad'){round(c,-a-8,-h+13,30,11,3,fill);round(c,a-24,-h+16,36,11,3,fill);}
    if(id==='superbike')path(c,[[7,-h],[31,-h-13],[a,-h+15],[a-19,h+2],[-7,h]],fill);
    driver(c,-6,-h-17,id==='minibike'?.7:.83,color(v.color),true);
    c.restore();return;
  }
  if(style==='tank'){
    path(c,[[-a-8,0],[-a+9,-h-5],[a-18,-h-5],[a+4,0],[a-2,h],[-a,h]],fill);round(c,-a+6,-h-9,v.width-17,10,3,bright);
    path(c,[[-31,-h-5],[-22,-h-28],[22,-h-28],[40,-h-6]],fill);round(c,22,-h-24,68,9,2,shade);round(c,81,-h-27,13,14,2,shade);
    round(c,-12,-h-35,26,7,3,'#50694a');label(c,'07',0,-h-15,12);
    for(let x=-a+9;x<a-5;x+=18)bolt(c,x,5);
    c.restore();return;
  }
  if(style==='hover'){
    round(c,-a-9,1,v.width+18,28,17,'#262f3c');line(c,[[-a,10],[a,10]],'#738893',3);
    path(c,[[-a-4,2],[-a+7,-h],[a-11,-h],[a+10,0],[a-3,h],[-a+3,h]],fill);
    glass(c,-16,-h-31,40,32);round(c,17,-h-34,10,6,2,bright);driver(c,4,-h-8,.57,'#c56e3d',true);
    circle(c,-a+10,-h-8,25,'#304752');circle(c,-a+10,-h-8,18,'#90aab3');line(c,[[-a-2,-h-20],[-a+22,-h+4]],'#334550',7);line(c,[[-a-2,-h+4],[-a+22,-h-20]],'#334550',7);
    stripe();lamp();c.restore();return;
  }
  if(style==='tractor'){
    round(c,-a+6,-h-36,53,58,4,'#49716e');glass(c,-a+12,-h-30,40,33);driver(c,-a+36,-h-8,.57,'#bb643b');
    round(c,-a+1,-h-43,66,10,3,fill);round(c,-a,-h+7,54,h+13,5,fill);round(c,-9,-h+10,a+12,h+9,4,fill);
    round(c,15,-h-28,8,38,2,'#374147');round(c,12,-h-32,14,7,2,'#52616a');round(c,a-9,-h+12,12,23,2,'#53604e');
    for(let y=-h+15;y<12;y+=6)line(c,[[a-7,y],[a+1,y]],'#aabb9a',2);
    arch(-v.axle,v.radius);lamp();c.restore();return;
  }
  if(['bus','van','ambulance','fire','truck','police'].includes(style)){
    const truck=style==='truck'||style==='fire',roof=-h-13;
    if(truck){
      round(c,-a,-h+5,v.width-5,v.height-2,5,fill);
      round(c,a-61,roof,58,v.height+10,7,fill);glass(c,a-53,roof+7,39,27);driver(c,a-30,roof+30,.5,'#d6853c');
      line(c,[[a-60,roof+2],[a-60,h-4]],shade,3);
      if(id==='diesel'){round(c,a-91,roof-16,31,48,4,fill);round(c,a-101,roof-22,8,67,2,'#a4b4bc');}
      if(id==='armored'){path(c,[[-a,roof+9],[a-70,roof+9],[a-54,4],[-a,h]],fill);for(let x=-a+14;x<a-60;x+=24)round(c,x,roof+15,14,7,1,'#304957');}
      else if(style==='fire'){
        round(c,-a+5,roof+1,v.width-71,45,3,fill);for(let x=-a+12;x<a-71;x+=28){round(c,x,-h+6,21,25,2,'#bdc8cc');for(let y=-h+10;y<-h+29;y+=5)line(c,[[x+2,y],[x+19,y]],'#81939b',1);}
        line(c,[[-a+7,roof-16],[a-16,roof-16]],'#a9b4bd',5);line(c,[[-a+7,roof-27],[a-16,roof-27]],'#a9b4bd',5);
        for(let x=-a+10;x<a-18;x+=17)line(c,[[x,roof-26],[x+5,roof-17]],'#e0e9ee',3);
        round(c,a-44,roof-8,24,8,3,'#69d5f6');
      }else{
        path(c,[[-a+1,roof+2],[a-67,roof+2],[a-71,h-2],[-a+8,h-2]],id==='truck'?'#a9713a':fill);
        for(let x=-a+15;x<a-70;x+=24)line(c,[[x,roof+7],[x,h-6]],shade,3);
      }
    }else{
      c.beginPath();c.moveTo(-a,h);c.lineTo(-a,roof+8);c.quadraticCurveTo(-a,roof,-a+10,roof);c.lineTo(a-29,roof);c.quadraticCurveTo(a-12,roof,a-1,-h+13);c.lineTo(a+2,h);c.closePath();c.fillStyle=fill;c.fill();c.lineWidth=3;c.strokeStyle=OUT;c.stroke();
      if(style==='bus'||style==='van'){
        for(let x=-a+9;x<a-39;x+=30)glass(c,x,roof+8,24,24);
        glass(c,a-38,roof+8,25,25);driver(c,a-22,roof+30,.48,'#bd7137');
        line(c,[[-a+4,9],[a-4,9]],bright,5);line(c,[[a-43,roof+7],[a-43,h-2]],shade,2);
        if(id==='van'){label(c,'✿',-a+31,h-9,18,'#fff0ac');round(c,-a+17,roof-10,58,8,3,'#8b5a38');}
        if(style==='bus'){round(c,-a+8,roof-9,65,9,2,'#ece2aa');label(c,'HILL BUS',-a+40,roof-4,7);}
      }else{
        glass(c,a-44,roof+7,30,25);driver(c,a-24,roof+31,.45,'#476b84');line(c,[[a-49,roof+4],[a-49,h-2]],shade,2);
        if(style==='ambulance'){line(c,[[-a+5,h-12],[a-7,h-12]],'#3694af',7);label(c,'✚',-a+38,-3,29,'#4aa6bf');round(c,a-32,roof-9,22,9,3,'#55bbee');}
        if(style==='police'){round(c,-a+4,-1,v.width-10,16,1,'#244a74',null);label(c,'POLICE',-11,8,11);round(c,-13,roof-10,28,8,2,'#c2d5db');round(c,-12,roof-13,12,9,3,'#579edc');round(c,2,roof-13,12,9,3,'#e45244');}
      }
    }
    stripe();bumper();lamp();for(const wx of [-v.axle,v.axle])arch(wx,v.radius);
    c.restore();return;
  }
  if(style==='snow'){
    path(c,[[-a,-h+5],[-a+32,-h-6],[a-4,-h+3],[a+10,h-5],[a-9,h],[-a,h]],fill);round(c,-a+10,-h-3,45,10,5,'#25323b');
    line(c,[[20,-h+4],[31,-h-28],[16,-h-36]],'#435661',5);path(c,[[30,-h-29],[46,-h-25],[40,-h+4],[25,-h+4]],'#b5e7ef');
    driver(c,-14,-h-18,.7,color(v.color),true);stripe();c.restore();return;
  }
  if(style==='race'){
    const drag=id==='dragster';
    path(c,[[-a-5,h],[-a+5,-h+4],[-a+34,-h],[12,-h],[a+8,h-7],[a+8,h]],fill);
    path(c,[[-21,-h],[0,-h-24],[20,-h-14],[34,-h+5]],'#303c43');driver(c,1,-h+1,.54,color(v.color),true);
    round(c,-a-2,-h-19,39,7,2,fill);line(c,[[-a+12,-h-12],[-a+15,0]],OUT,4);round(c,a-10,h-2,28,7,2,fill);
    if(drag){for(let x=-a+39;x<-20;x+=14)round(c,x,-h-13,9,15,2,'#b4c0c6');label(c,'DRAG',a*.42,h-4,10);}
    else {label(c,'06',-a+36,2,14);line(c,[[29,-h+7],[a-3,h-5]],'#ffedaa',4);}
    c.restore();return;
  }
  if(style==='rocket'){
    path(c,[[-a-6,-h],[a-19,-h],[a+16,0],[a-19,h],[-a-6,h]],fill);
    round(c,-a-12,-h+3,15,v.height-6,3,'#53606a');glass(c,-11,-h-24,31,22);path(c,[[19,-h],[30,-h-17],[41,-h]],bright);
    label(c,'JET',15,3,12);line(c,[[-a+6,0],[-7,0]],'#ffdf87',3);lamp();c.restore();return;
  }
  // Open utility chassis, pickup, sports saloon and expedition variants.
  if(id==='car'||id==='buggy'||id==='custom'||id==='lunar'){
    round(c,-a+9,-h+3,28,23,5,'#433b34');driver(c,-8,-h-3,id==='lunar'?.73:.78,id==='lunar'?'#e4e8dd':'#bd6435',id==='lunar');
    if(style==='buggy'){line(c,[[-a+10,-h+4],[-a+24,-h-43],[16,-h-43],[a-9,-h+6]],OUT,7);line(c,[[-a+10,-h+4],[-a+24,-h-43],[16,-h-43],[a-9,-h+6]],bright,3);}
    else{line(c,[[-a+8,-h+5],[-a+12,-h-41],[-a+30,-h-40]],OUT,5);line(c,[[23,-h+1],[18,-h-37],[43,-h-30],[49,-h+4]],OUT,4);path(c,[[20,-h-35],[40,-h-29],[46,-h+1],[25,-h+1]],'#b6e8ed',OUT,2);}
    path(c,[[-a-1,-h+2],[-a+21,-h+2],[-a+32,-h+15],[21,-h+15],[27,-h-2],[a-4,-h-2],[a+7,-h+10],[a+4,h],[-a,h]],fill);
    if(id==='car'){circle(c,-a-4,-h+9,17,'#253138');circle(c,-a-4,-h+9,9,'#9cabb3');line(c,[[-a+4,-h-15],[-a-4,-h-66]],OUT,2);}
    if(id==='lunar'){round(c,-a-10,-h-13,26,38,3,'#d7dce0');line(c,[[-a+5,-h-12],[-a+5,-h-66]],'#909dad',3);c.beginPath();c.arc(-a+5,-h-70,19,.2,Math.PI-0.2);c.fillStyle='#eaf6e8';c.fill();c.strokeStyle=OUT;c.stroke();label(c,'LUNA',12,h-7,11);}
    else label(c,id==='custom'?'X':'01',-8,h-6,14);
  }else if(style==='monster'||id==='safari'){
    path(c,[[-a,-h+1],[-a+38,-h+1],[-a+46,-h-35],[18,-h-35],[36,-h],[a-5,-h],[a+5,0],[a+2,h],[-a,h]],fill);
    glass(c,-a+47,-h-29,24,25);glass(c,-a+19+v.width*.25,-h-29,28,25);driver(c,5,-h-10,.57,'#c56c37');
    line(c,[[-a+12,-h+3],[-a+32,-h+3]],OUT,4);label(c,id==='monster'?'4×4':id==='trophy'?'RACE':'TRAIL',-8,5,13);
    if(id==='trophy'){round(c,-a+5,-h-12,35,12,3,'#2c343b');round(c,-22,-h-47,43,9,2,'#333d41');for(let x=-16;x<20;x+=12)circle(c,x,-h-43,4,'#fff4b2');}
    if(id==='safari'){round(c,-a+29,-h-49,65,12,2,'#675b3b');line(c,[[-a+21,-h-49],[41,-h-49]],OUT,3);round(c,-a+5,-h-31,26,28,4,'#ab9154');}
  }else if(style==='hotrod'){
    path(c,[[-a,-h],[5,-h],[5,-h+11],[a,-h+11],[a+5,h],[-a,h]],fill);
    path(c,[[-a+13,-h],[-a+20,-h-31],[-11,-h-31],[0,-h]],fill);glass(c,-a+24,-h-27,27,24);
    round(c,12,-h-10,39,17,3,'#737e84');for(let x=16;x<49;x+=11)round(c,x,-h-23,7,16,2,'#c9d6db');
    path(c,[[-30,2],[-10,-3],[2,6],[24,4],[8,11],[-15,8]],'#ffc049',null);label(c,'08',-a+24,7,12);
  }else{
    const low=id==='lowrider',roof=low?24:34;
    c.beginPath();c.moveTo(-a,h);c.lineTo(-a-3,-h+11);c.quadraticCurveTo(-a,-h,-a+21,-h);c.lineTo(-a+38,-h-roof+7);c.quadraticCurveTo(-a+42,-h-roof,0,-h-roof);c.lineTo(20,-h-roof);c.lineTo(42,-h+1);c.lineTo(a-9,-h+6);c.quadraticCurveTo(a+9,-h+9,a+3,h);c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=OUT;c.lineWidth=3;c.stroke();
    path(c,[[-a+39,-h-4],[-a+48,-h-roof+5],[-4,-h-roof+5],[-4,-h-4]],'#9bddea',OUT,2);
    path(c,[[2,-h-4],[2,-h-roof+5],[17,-h-roof+5],[35,-h-4]],'#9bddea',OUT,2);driver(c,12,-h-7,.5,'#be6b3e');
    line(c,[[-3,-h+2],[-3,h-3]],shade,2);round(c,7,-h+8,11,3,1,'#d7e3e2',OUT,1);
    if(id==='rally'){path(c,[[-a+6,h-2],[a-10,-h+8],[a-5,h-2]],'#f0edd8',null);label(c,'12',-14,4,14);round(c,-a-3,-h-8,29,7,2,shade);}
    if(id==='electric'){line(c,[[a-23,-h+10],[a-5,-h+14]],'#d2fffc',4);label(c,'E',-21,4,13,'#dcfffd');}
  }
  stripe();bumper();lamp();arch(-v.axle,v.radius);arch(v.axle,v.frontRadius||v.radius);bolt(c,-a+12,h-10);bolt(c,a-19,h-9);
  c.restore();
}
const previewCache=new Map();
export function vehiclePreview(v){
  const key=JSON.stringify([v.id,v.width,v.height,v.radius,v.frontRadius,v.axle,v.clearance,v.color,v.wheelCount]);if(previewCache.has(key))return previewCache.get(key);
  const canvas=document.createElement('canvas');canvas.width=720;canvas.height=400;const c=canvas.getContext('2d');
  const top=v.id==='monowheel'?-115:-v.height/2-106,bottom=v.id==='monowheel'?100:v.clearance+v.radius+8;
  const width=Math.max(210,v.width+90),height=bottom-top,scale=Math.min(620/width,345/height);
  c.translate(360,365-bottom*scale);c.scale(scale,scale);c.save();c.scale(1,.11);circle(c,0,(bottom-2)/.11,(v.width+50)/2,'#25374228',null);c.restore();
  const wheels=v.id==='monowheel'?[{x:0,y:68,r:v.radius}]:Array.from({length:v.wheelCount},(_,i)=>({x:-v.axle+2*v.axle*i/(v.wheelCount-1),y:v.clearance,r:i===v.wheelCount-1?(v.frontRadius||v.radius):v.radius}));
  if(v.id!=='monowheel')for(const w of wheels)paintSpring(c,{x:w.x,y:v.height/2-7},{x:w.x,y:w.y});
  paintBody(c,v);
  if(v.style==='tank'||v.style==='snow'){c.save();line(c,[[wheels[0].x,wheels[0].y],[wheels.at(-1).x,wheels.at(-1).y]],OUT,v.radius*2+10);line(c,[[wheels[0].x,wheels[0].y],[wheels.at(-1).x,wheels.at(-1).y]],'#5c6768',v.radius*2);c.restore();}
  for(const w of wheels){c.save();c.translate(w.x,w.y);paintWheel(c,w.r,v.style);c.restore();}
  const url=canvas.toDataURL();previewCache.set(key,url);if(previewCache.size>96)previewCache.delete(previewCache.keys().next().value);return url;
}
export function createVehicleSprites(scene,v){
  const {spec}=v,left=-spec.width/2-70,top=spec.id==='monowheel'?-115:-spec.height/2-106,w=spec.width+145,h=260+spec.height;
  const key='body:'+JSON.stringify([spec.id,spec.width,spec.height,spec.color]);
  if(!scene.textures.exists(key)){const c=document.createElement('canvas');c.width=w*2;c.height=h*2;const ctx=c.getContext('2d');ctx.scale(2,2);ctx.translate(-left,-top);paintBody(ctx,spec);scene.textures.addCanvas(key,c);}
  v.bodySprite=scene.add.image(v.body.position.x,v.body.position.y,key).setOrigin(-left/w,-top/h).setDisplaySize(w,h).setDepth(11);
  v.wheelSprites=v.wheels.map(body=>{const r=body.circleRadius,size=r*2+8,k=`wheel:${r}:${spec.style}`;if(!scene.textures.exists(k)){const c=document.createElement('canvas');c.width=c.height=size*2;const ctx=c.getContext('2d');ctx.scale(2,2);ctx.translate(size/2,size/2);paintWheel(ctx,r,spec.style);scene.textures.addCanvas(k,c);}return scene.add.image(body.position.x,body.position.y,k).setDisplaySize(size,size).setDepth(12);});
}
