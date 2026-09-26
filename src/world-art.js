/** Authored scenery: shared palette, deliberate silhouettes, no downloaded assets. */
export const random=n=>{const x=Math.sin(n*12.9898+78.233)*43758.5453;return x-Math.floor(x);};
export function mix(a,b,t){let c=0;for(const shift of [16,8,0])c|=Math.round(((a>>shift)&255)*(1-t)+((b>>shift)&255)*t)<<shift;return c;}
const poly=(g,pts,color,stroke,width=2)=>{g.fillStyle(color);if(stroke!==undefined)g.lineStyle(width,stroke);g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath().fillPath();if(stroke!==undefined)g.strokePath();};
const ellipse=(g,x,y,w,h,fill,line)=>{g.fillStyle(fill).fillEllipse(x,y,w,h);if(line!==undefined)g.lineStyle(2,line).strokeEllipse(x,y,w,h);};
const mod=(x,y)=>(x%y+y)%y;

export function drawSkyArt(track){
 const {stage:s,sky:g}=track,c=track.scene.cameras.main,w=c.width,h=c.height;
 const [sky,soil,cap,line,mount,accent]=s.palette,dark=['night','moon','mars','purple','lava'].includes(s.theme),underground=s.hazard==='ceiling';
 const top=underground?0x152331:mix(sky,dark?0x081129:0x449ae7,.35),bottom=underground?0x45536b:mix(sky,dark?0x70466d:0xffffff,.45);
 g.clear();for(let i=0;i<30;i++)g.fillStyle(mix(top,bottom,i/29)).fillRect(0,i*h/30,w,h/30+1);
 if(dark&&!underground){
  for(let i=0;i<70;i++){const x=mod(random(i+11)*w-c.scrollX*.018,w),y=random(i+94)*h*.7;g.fillStyle(0xe6f3ee,.4+random(i)*.5).fillCircle(x,y,random(i+2)>.9?2:1);}
 }
 const celestialX=w*.78,celestialY=Math.max(68,h*.19);
 if(!underground){
  if(['moon','alien','mars'].includes(s.id)){
   const planet=s.id==='moon'?0x4275b7:s.id==='mars'?0xece0bb:0x9e73bf;
   ellipse(g,celestialX,celestialY,96,96,planet);g.fillStyle(0xffffff,.17).fillCircle(celestialX-19,celestialY-18,26);
   if(s.id==='moon'){poly(g,[[celestialX-33,celestialY-22],[celestialX-8,celestialY-29],[celestialX+7,celestialY-13],[celestialX-11,celestialY+3],[celestialX-18,celestialY+26],[celestialX-33,celestialY+13]],0x72b28c);}
   else {g.lineStyle(5,0xf0ce92,.6).strokeEllipse(celestialX,celestialY+5,144,33);}
  }else{
   for(let i=4;i>0;i--)g.fillStyle(dark?0xe9e9c5:0xffed96,.045).fillCircle(celestialX,celestialY,36+i*16);
   g.fillStyle(dark?0xf4edcc:0xfff0a1).fillCircle(celestialX,celestialY,36);
   if(dark)g.fillStyle(mix(top,bottom,.2)).fillCircle(celestialX+17,celestialY-9,30);
  }
 }
 if(['arctic','glacier','snow'].includes(s.id)){
  for(let k=0;k<3;k++){g.lineStyle(16-k*4,0x8eefd9,.12).beginPath();for(let x=0;x<=w;x+=16){const y=70+k*22+Math.sin(x*.008+k)*30;x?g.lineTo(x,y):g.moveTo(x,y);}g.strokePath();}
 }
 if(s.id==='rainbow'){
  for(const [i,col] of [0xed576c,0xf7ac50,0xf7e36b,0x7ec686,0x70b9ee,0x9a82db].entries()){
   g.lineStyle(11,col,.6).beginPath();for(let x=-70;x<w+80;x+=12){const y=h*.55-Math.sin((x+70)/(w+140)*Math.PI)*h*.4+i*10;x===-70?g.moveTo(x,y):g.lineTo(x,y);}g.strokePath();
  }
 }
 for(let layer=0;layer<3;layer++){
  const speed=.035+layer*.055,worldStart=c.scrollX*speed,base=h*(.64+layer*.13)-c.scrollY*.035;
  const shade=mix(mount,sky,layer===0?.5:layer===1?.27:.04),step=20;
  g.fillStyle(shade).beginPath().moveTo(-step,h+10);
  const isMountain=['mountain','snow','glacier','canyon','volcano'].includes(s.id);
  for(let x=-step;x<=w+step;x+=step){const u=x+worldStart;
   let y=base-Math.sin(u*.0031+s.seed+layer)*49-Math.sin(u*.009+layer*4)*21;
   if(isMountain)y-=Math.abs(Math.sin(u*.006+layer))*90;
   g.lineTo(x,y);
  }g.lineTo(w+step,h+10).closePath().fillPath();
  if(isMountain&&layer===1){
   for(let k=Math.floor(worldStart/410)-1;k<(worldStart+w)/410+1;k++){
    const x=k*410-worldStart,peak=base-112-random(k+s.seed)*25;
    if(s.theme==='ice'||s.id==='mountain')poly(g,[[x-43,peak+52],[x,peak],[x+48,peak+57],[x+16,peak+37],[x+4,peak+44],[x-11,peak+32]],mix(0xf5f8ed,sky,.2));
    else if(s.id==='volcano')poly(g,[[x-26,peak+39],[x,peak+5],[x+27,peak+39],[x+9,peak+32],[x+4,peak+66],[x-7,peak+26]],0xe77847);
   }
  }
 }
 if(['city','rooftops','factory','highway'].includes(s.id)){
  for(let i=Math.floor(c.scrollX*.16/86)-2;i<(c.scrollX*.16+w)/86+2;i++){
   const x=i*86-c.scrollX*.16,y=h*.68-random(i+19)*130;
   g.fillStyle(mix(mount,0x263748,.25)).fillRect(x,y,64,h-y);
   g.fillStyle(mix(mount,0xf0da99,.55),.7);for(let yy=y+10;yy<h*.92;yy+=22)for(let xx=x+9;xx<x+58;xx+=17)g.fillRect(xx,yy,8,11);
   if(i%4===0)g.lineStyle(2,mount).lineBetween(x+32,y,x+32,y-28);
  }
 }
 if(s.theme==='beach'){
  const y=h*.67;g.fillStyle(0x439eaf).fillRect(0,y,w,h-y);
  for(let k=0;k<6;k++){g.lineStyle(2,mix(0x439eaf,0xc9f4e9,.6),.5).lineBetween(mod(k*231-c.scrollX*.07,w+160)-80,y+10+k*22,mod(k*231-c.scrollX*.07,w+160)+70,y+10+k*22);}
 }
 if(!dark&&!underground){
  for(let i=Math.floor(c.scrollX*.04/340)-1;i<(c.scrollX*.04+w)/340+1;i++){const x=i*340-c.scrollX*.04,y=55+random(i+31)*75;
   g.fillStyle(0xffffff,.8).fillEllipse(x,y+19,136,33).fillCircle(x-27,y+7,23).fillCircle(x+7,y-2,31).fillCircle(x+39,y+9,23);
  }
 }
 if(underground){
  for(let i=0;i<12;i++){const x=mod(i*173-c.scrollX*.07,w+100)-50;g.fillStyle(0x3a4958,.55).fillRoundedRect(x,-20,35+random(i)*50,h*.55,18);}
 }
 if(track.scene.progress?.data.settings.quality!=='low'){
  if(['snow','wind'].includes(s.hazard)||s.id==='seasons')for(let i=0;i<45;i++){
   const x=mod(random(i+4)*w+Math.sin(track.clock*.0003+i)*18,w),y=mod(random(i+98)*h+track.clock*(s.hazard==='wind'?.36:.027),h);
   if(s.hazard==='wind')g.lineStyle(1.5,0xb5d5e5,.55).lineBetween(x,y,x-11,y+17);
   else if(s.id==='seasons'){g.fillStyle(i%2?0xeec269:0xd9803f,.85).fillEllipse(x,y,6,3);}
   else g.fillStyle(0xffffff,.7).fillCircle(x,y,1.3+random(i)*1.5);
  }
 }
}

export function surfaceArt(g,s,a,b,ya,yb){
 const [,soil,cap,line]=s.palette,ice=s.theme==='ice',road=s.hazard==='road'||s.id==='rooftops';
 poly(g,[[a-.7,ya],[b+.7,yb],[b+.7,1800],[a-.7,1800]],soil);
 const layer=road?19:ice?18:17;
 poly(g,[[a-.7,ya+layer],[b+.7,yb+layer],[b+.7,yb+layer+18],[a-.7,ya+layer+18]],mix(soil,0x312c27,.18));
 poly(g,[[a-.7,ya],[b+.7,yb],[b+.7,yb+layer],[a-.7,ya+layer]],cap);
 g.lineStyle(4,line).lineBetween(a,ya+layer,b,yb+layer);
 g.lineStyle(5,road?0xd0d0ba:ice?0xf8fcf8:mix(cap,0xd6f575,.47)).lineBetween(a,ya,b,yb);
 const seed=Math.floor(a/10)+s.seed*101;
 for(let k=0;k<9;k++){
  const t=random(seed+k*8),x=a+(b-a)*t,y=ya+(yb-ya)*t+30+random(seed+k*27)*245,r=2+random(seed+k*19)*8;
  if(s.id==='rainbow'){g.fillStyle([0xc285a4,0xb390bf,0x75b4b4][k%3],.4).fillCircle(x,y,r*1.6);}
  else if(ice){g.lineStyle(1,0xd1e9e4,.3).lineBetween(x,y,x+8,y+15).lineBetween(x+8,y+15,x+2,y+26);}
  else {g.fillStyle(mix(soil,k%2?0x473c32:0xf2d19c,k%2?.2:.18)).fillEllipse(x,y,r*2,r);if(r>6)g.lineStyle(1,mix(soil,0xf2d19c,.3)).lineBetween(x-r*.6,y-r*.3,x+r*.3,y-r*.3);}
 }
 if(road&&Math.floor(a/60)%3===0)g.lineStyle(3,0xf4dc80).lineBetween(a+9,ya+6,b-9,yb+6);
 if(!road&&!ice&&['green','forest','autumn'].includes(s.theme))for(let t=.18;t<1;t+=.31){const x=a+(b-a)*t,y=ya+(yb-ya)*t;g.lineStyle(1.4,mix(cap,0xd8eb77,.4)).lineBetween(x,y,x-3,y-5).lineBetween(x,y,x+2,y-7);}
}

function tree(g,x,y,k,theme,pine=false){
 const size=.8+random(k)*.5,leaf=theme==='autumn'?[0xc7762f,0xe49e39,0xf2c54b]:[0x397342,0x579646,0x79b84e],h=97*size;
 g.lineStyle(10,0x544732).lineBetween(x,y+3,x-4,y-h*.75);g.lineStyle(3,0x9b7750).lineBetween(x+2,y,x-2,y-h*.72);
 if(pine){for(let i=0;i<3;i++){const yy=y-h+i*25*size;poly(g,[[x,yy],[x-33*size-i*3,yy+58*size],[x+34*size+i*3,yy+58*size]],leaf[i],0x315a37,2);}}
 else{
  g.lineStyle(5,0x594833).lineBetween(x,y-44*size,x-24*size,y-79*size).lineBetween(x,y-40*size,x+27*size,y-65*size);
  for(const [dx,dy,r] of [[-26,-71,29],[23,-75,32],[-4,-99,36],[0,-68,34]]){g.fillStyle(leaf[0]).fillCircle(x+dx*size,y+dy*size,r*size);}
  for(const [dx,dy,r] of [[-28,-76,22],[23,-82,24],[-7,-108,26],[2,-79,24]])g.fillStyle(leaf[1]).fillCircle(x+dx*size,y+dy*size,r*size);
  g.fillStyle(leaf[2]).fillCircle(x-16*size,y-115*size,15*size).fillCircle(x+25*size,y-89*size,14*size);
 }
}
function house(g,x,y,k){
 const w=90+random(k)*35,h=65+random(k+1)*30;
 g.fillStyle(0x654e3d).fillRect(x-w/2-3,y-h,w+6,h);g.fillStyle(k%2?0xc66b40:0xd1b578).fillRect(x-w/2,y-h,w,h);
 for(let yy=y-h+7;yy<y;yy+=11)g.lineStyle(1,0x714c3d,.4).lineBetween(x-w/2,yy,x+w/2,yy);
 poly(g,[[x-w/2-9,y-h],[x,y-h-43],[x+w/2+9,y-h]],0x704b40,0x413b36,3);
 g.lineStyle(3,0xb87651).lineBetween(x-w/2-4,y-h-3,x,y-h-38);
 g.fillStyle(0x534942).fillRect(x-12,y-42,24,42);g.fillStyle(0xc8e5dc).fillRect(x-w/2+13,y-h+17,22,26).fillRect(x+w/2-35,y-h+17,22,26);
 for(const dx of [-w/2+24,w/2-24])g.lineStyle(3,0xf2dfad).lineBetween(x+dx,y-h+17,x+dx,y-h+43).lineBetween(x+dx-11,y-h+30,x+dx+11,y-h+30);
 g.fillStyle(0x7d6753).fillRect(x+w*.2,y-h-38,15,26);
}
function cactus(g,x,y,k){
 const h=62+random(k)*32;g.lineStyle(14,0x4f683c).lineBetween(x,y,x,y-h).lineBetween(x-19,y-h*.4,x-19,y-h*.72).lineBetween(x-19,y-h*.4,x,y-h*.4).lineBetween(x,y-h*.6,x+19,y-h*.6).lineBetween(x+19,y-h*.6,x+19,y-h*.91);
 g.lineStyle(8,0x86a357).lineBetween(x-2,y-3,x-2,y-h).lineBetween(x-21,y-h*.4,x-21,y-h*.72).lineBetween(x+17,y-h*.6,x+17,y-h*.91);
 g.fillStyle(0x99af61).fillCircle(x-2,y-h,4);g.lineStyle(1,0xc2cd85);for(let n=14;n<h;n+=12)g.lineBetween(x-7,y-n,x+5,y-n-2);
}
export function propArt(g,s,x,y,k){
 const [,soil,cap,line,mount,accent]=s.palette;
 if(s.hazard==='ceiling'){
  if(s.id==='factory'){
   g.lineStyle(14,0x43535b).lineBetween(x-27,y-175,x-27,y-25).lineBetween(x-27,y-25,x+29,y-25);g.lineStyle(7,0x80928e).lineBetween(x-27,y-170,x-27,y-25).lineBetween(x-27,y-25,x+29,y-25);
   for(const yy of [y-160,y-40])g.fillStyle(0xb6bdb0).fillRect(x-38,yy,22,5);
   g.fillStyle(0x2f373e).fillRect(x+4,y-87,41,88);g.fillStyle(0xd7ab3e).fillRect(x+9,y-81,31,6);
  }else{
   if(s.id==='mines'){g.lineStyle(13,0x584437).lineBetween(x-47,y,x-47,y-210).lineBetween(x+47,y,x+47,y-210).lineBetween(x-58,y-210,x+58,y-210);g.lineStyle(3,0xa27b4c).lineBetween(x-43,y,x-43,y-205);}
   for(let n=0;n<4;n++){const dx=x+(n-1.5)*12,hh=23+random(k+n)*29;poly(g,[[dx-7,y],[dx-4,y-hh],[dx+3,y-hh-9],[dx+8,y]],s.id==='mines'?0xbb975f:0x6ab1be,0x345b69,1.5);g.lineStyle(1,0xc3e3d7).lineBetween(dx,y-hh,dx+2,y-6);}
  }
  g.lineStyle(2,0x222d36).lineBetween(x,y-208,x,y-182);g.fillStyle(0xc0a36d).fillRoundedRect(x-8,y-183,16,21,3);g.fillStyle(0xffe59a).fillRect(x-5,y-179,10,13);return;
 }
 if(['green','forest','autumn','night'].includes(s.theme)){
  if(s.id==='countryside'&&k%4===0)house(g,x,y,k);
  else if(s.id==='roller'&&k%4===0){g.lineStyle(5,0x665245).lineBetween(x-40,y,x-40,y-65).lineBetween(x+40,y,x+40,y-65);g.fillStyle(0xe8b856).fillRect(x-48,y-73,96,21);g.lineStyle(3,0x815239).lineBetween(x-47,y-66,x+46,y-66);}
  else tree(g,x,y,k,s.theme,s.id==='forest'||s.id==='mountain');
  if(k%3===0){for(let j=0;j<4;j++){const xx=x+65+j*16,yy=y+3;g.lineStyle(4,0x78634a).lineBetween(xx,yy,xx,yy-25);}g.lineStyle(4,0xba9a63).lineBetween(x+58,y-18,x+121,y-18).lineBetween(x+58,y-6,x+121,y-6);}
 }else if(s.theme==='desert'){
  if(s.id==='construction'){
   g.lineStyle(7,0xbe8c37).lineBetween(x,y,x,y-125).lineBetween(x-3,y-122,x+125,y-122).lineBetween(x,y-123,x+40,y-160).lineBetween(x+40,y-160,x+110,y-123);g.lineStyle(1.5,0x5b554a).lineBetween(x+95,y-118,x+95,y-54);g.fillStyle(0x514f42).fillRect(x+88,y-54,14,7);
  }else if(s.id==='canyon'){for(let n=0;n<3;n++){const xx=x+n*21;poly(g,[[xx-18,y],[xx-15,y-31-n*14],[xx+9,y-40-n*9],[xx+20,y]],mix(soil,0xa9533c,n*.13),0x8d6043,2);}}
  else cactus(g,x,y,k);
 }else if(s.theme==='ice'){
  if(k%2===0)tree(g,x,y,k,'green',true);
  else {poly(g,[[x-29,y],[x-17,y-45],[x+4,y-63],[x+31,y]],0xa1d5e0,0x598fa9);poly(g,[[x-17,y-45],[x+4,y-63],[x+13,y-17]],0xe3f1ec);}
  g.fillStyle(0xf2f9ef).fillEllipse(x,y,67,11);
 }else if(s.theme==='beach'){
  g.lineStyle(9,0x6a543d).lineBetween(x,y,x+13,y-91);g.lineStyle(5,0xad8855).lineBetween(x,y,x+12,y-90);
  for(let n=0;n<5;n++){const a=n*.6-2.6,dx=Math.cos(a)*53,dy=Math.sin(a)*22;poly(g,[[x+13,y-93],[x+13+dx*.65,y-113+dy],[x+13+dx,y-88+dy],[x+13+dx*.45,y-98+dy]],n%2?0x4f993d:0x387739);}
  g.fillStyle(0xb6a072).fillEllipse(x+40,y+3,15,7);
 }else if(s.theme==='city'){
  if(s.id==='highway'){g.lineStyle(6,0x485363).lineBetween(x,y,x,y-128).lineBetween(x,y-128,x+39,y-134);g.fillStyle(0xf6e7a5).fillEllipse(x+39,y-132,32,8);}
  else {const h=84+random(k)*60,w=57;g.fillStyle(0x465f6d).fillRect(x-w/2-3,y-h-3,w+6,h+3);g.fillStyle(k%2?0xb38870:0x8e9b97).fillRect(x-w/2,y-h,w,h);g.fillStyle(0xeddfba);for(let yy=y-h+12;yy<y-10;yy+=22)for(let xx=x-19;xx<x+20;xx+=19)g.fillRect(xx,yy,11,13);g.fillStyle(0x5c6a70).fillRect(x-35,y-h-5,70,8);}
 }else if(['moon','mars','purple'].includes(s.theme)){
  if(k%3===0){g.lineStyle(4,0xabb9bc).lineBetween(x,y,x,y-66);g.fillStyle(accent).fillTriangle(x,y-66,x+33,y-61,x,y-45);}
  else {ellipse(g,x,y-2,52,17,mix(soil,0x15172e,.25),line);ellipse(g,x-4,y-4,33,8,mix(soil,0xb7bbce,.2));}
  if(s.id==='alien'){poly(g,[[x+33,y],[x+25,y-42],[x+34,y-55],[x+46,y-35],[x+43,y]],0x4ab9b3,0x235b68);}
 }else if(s.theme==='lava'){
  poly(g,[[x-38,y],[x-29,y-36],[x+9,y-58],[x+40,y]],0x44323e,0x2c2d38,3);g.lineStyle(3,0xe88a4c).lineBetween(x-9,y-40,x+6,y-25).lineBetween(x+6,y-25,x,y-3);
 }
}
